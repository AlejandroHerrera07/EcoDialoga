"""
Enhanced logging system for EcoProfe backend
Logs to both console and rotating files, includes request tracing
"""

import logging
import logging.handlers
import os
from datetime import datetime
import json
import traceback
from functools import wraps
from typing import Any, Callable
import uuid

# Crear directorio de logs
os.makedirs("logs", exist_ok=True)

# Configurar formatos
DETAILED_FORMAT = '[%(asctime)s] %(name)s [%(levelname)s] [%(req_id)s] %(funcName)s:%(lineno)d - %(message)s'
SIMPLE_FORMAT = '[%(asctime)s] [%(levelname)s] [%(req_id)s] %(message)s'

# Clase para agregar request_id al logger
class RequestIdFilter(logging.Filter):
    """Filtro que agrega request_id a todos los logs"""
    
    def __init__(self):
        super().__init__()
        self.request_id = None
    
    def filter(self, record):
        record.req_id = self.request_id or "NO_ID"
        return True


def setup_logging(app=None):
    """
    Configura el sistema de logging completo
    
    Args:
        app: Flask app instance (opcional, para agregar middleware)
    """
    
    # Logger principal
    logger = logging.getLogger("ecoprofre_backend")
    logger.setLevel(logging.DEBUG)
    
    # Limpiar handlers existentes
    logger.handlers.clear()
    
    # ===== CONSOLE HANDLER =====
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(SIMPLE_FORMAT)
    console_handler.setFormatter(console_formatter)
    
    # ===== FILE HANDLER (Rotating) =====
    # Todo en un archivo principal
    file_handler = logging.handlers.RotatingFileHandler(
        filename="logs/backend.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(DETAILED_FORMAT)
    file_handler.setFormatter(file_formatter)
    
    # ===== ERRORES en archivo separado =====
    error_handler = logging.handlers.RotatingFileHandler(
        filename="logs/errors.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    
    # ===== REQUESTS en archivo separado =====
    request_handler = logging.handlers.RotatingFileHandler(
        filename="logs/requests.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=10
    )
    request_handler.setLevel(logging.INFO)
    request_formatter = logging.Formatter('%(asctime)s | %(message)s')
    request_handler.setFormatter(request_formatter)
    
    # ===== AGREGAR FILTRO DE REQUEST_ID =====
    request_id_filter = RequestIdFilter()
    console_handler.addFilter(request_id_filter)
    file_handler.addFilter(request_id_filter)
    error_handler.addFilter(request_id_filter)
    
    # Agregar handlers al logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)
    
    if app:
        # Middleware para agregar request_id
        @app.before_request
        def before_request():
            req_id = str(uuid.uuid4())[:8]
            request_id_filter.request_id = req_id
            logger.info(f"→ {request.method} {request.path} - IP: {request.remote_addr}")
        
        @app.after_request
        def after_request(response):
            logger.info(f"← {response.status_code} {request.method} {request.path}")
            return response
    
    return logger, request_id_filter


def api_logger(logger):
    """
    Decorador para loguear entrada/salida y errores de endpoints
    
    Usage:
        @app.route('/api/chat', methods=['POST'])
        @api_logger(logger)
        def chat_handler():
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                logger.debug(f"→ ENTER {func.__name__}")
                result = func(*args, **kwargs)
                logger.debug(f"← EXIT {func.__name__} OK")
                return result
            except Exception as e:
                logger.error(f"✗ EXCEPTION in {func.__name__}: {str(e)}")
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
        
        return wrapper
    return decorator


# Logger específico para logs de request/response (format JSON)
def log_request(logger, request_id, method, endpoint, user_id=None, status=None, duration=None, error=None):
    """Log estructurado de requests en JSON"""
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "req_id": request_id,
        "method": method,
        "endpoint": endpoint,
        "user_id": user_id,
        "status": status,
        "duration_ms": duration,
        "error": error
    }
    
    # Obtener logger específico de requests
    request_logger = logging.getLogger("ecoprofre_requests")
    request_logger.info(json.dumps(log_entry))


# Ejemplo de uso en api/index.py:
"""
from logging_config import setup_logging, api_logger, log_request
import time

logger, request_id_filter = setup_logging(app)

@app.route('/api/chat', methods=['POST'])
def chat_handler():
    start_time = time.time()
    req_id = request_id_filter.request_id
    user_id = request.json.get('user_id')
    
    try:
        logger.info(f"Processing chat for user {user_id}")
        
        #... process request ...
        
        duration = (time.time() - start_time) * 1000
        log_request(logger, req_id, "POST", "/api/chat", user_id, 200, duration)
        return jsonify({"message": "..."}), 200
    
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        log_request(logger, req_id, "POST", "/api/chat", user_id, 500, duration, str(e))
        return jsonify({"error": "Internal server error"}), 500
"""
