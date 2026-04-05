"""
Script para simular 5+ usuarios enviando peticiones simultáneamente
Esto reproduce el problema de producción

INSTRUCCIONES:
1. Edita las variables de CONFIGURACIÓN abajo
2. Proporciona email/password de UN usuario real (será usado para todas las peticiones)
3. Los mensajes están predefinidos (PREDEFINED_MESSAGES) - puedesEditarlos
4. Ejecuta: python test_load_concurrent.py
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime
import logging
import sys
import io

# Fijar encoding en Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configurar logging detallado
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_load.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# ⚙️ CONFIGURACIÓN - EDITA ESTO
BASE_URL = "https://ecodialoga-production.up.railway.app"  # URL pública Railway
NUM_CONCURRENT_USERS = 5
NUM_MESSAGES_PER_USER = 2

# Credenciales de UN usuario REAL (será usado para todas las simulaciones)
# Para EcoProfe: grupo (ej G0000) + estudiante (ej ALEDEV)
GROUP_CODE = "G0000"      # ← CAMBIAR: código de grupo (ej: G0001)
STUDENT_CODE = "ALEDEV"   # ← CAMBIAR: código de estudiante (ej: E0001)

TIMEOUT = aiohttp.ClientTimeout(total=60, connect=10, sock_read=10)

# Mensajes predefinidos reutilizables
PREDEFINED_MESSAGES = [
    "Cuéntame 5 formas de reducir el consumo de plástico en casa",
    "¿Cuál es la relación entre los bosques y el cambio climático?",
    "Explica cómo la energía renovable puede reemplazar los combustibles fósiles",
    "¿Qué es la biodiversidad y por qué es importante?",
    "Dame consejos para hacer el hogar más sostenible",
    "¿Cómo afecta la contaminación del agua a los ecosistemas?",
    "Explica la economía circular en términos simples",
    "¿Qué puedo hacer para reducir mi huella de carbono?",
]


async def get_auth_token(group_code: str, student_code: str) -> str:
    """
    Obtiene un token JWT válido usando group_code y student_code
    Este token será usado para TODAS las peticiones de carga
    """
    logger.info(f"Obteniendo token para grupo: {group_code}, estudiante: {student_code}")
    
    payload = {
        "groupCode": group_code,
        "studentCode": student_code
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/auth/login",
                json=payload,
                timeout=TIMEOUT
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    # Buscar token en la estructura de respuesta
                    token = data.get("data", {}).get("token") or data.get("access_token") or data.get("token")
                    if token:
                        logger.info(f"✓ Token obtenido exitosamente")
                        return token
                    else:
                        logger.error(f"No token en respuesta: {data}")
                        raise ValueError(f"No token in response: {data}")
                else:
                    body = await response.text()
                    logger.error(f"✗ Login failed ({response.status}): {body}")
                    raise ValueError(f"Auth failed: {response.status} - {body[:200]}")
        except Exception as e:
            logger.error(f"✗ Error obteniendo token: {str(e)}")
            raise


async def send_chat_message(
    session, 
    user_id: int,
    message_num: int, 
    token: str,
    shared_user_id: str = None
):
    """
    Envía un mensaje de chat y captura tiempos y errores
    
    Args:
        session: sesión aiohttp
        user_id: ID del "usuario simulado" (1-5)
        message_num: Número del mensaje para este usuario
        token: Token único obtenido del usuario real
        shared_user_id: ID real del usuario en BD (si quieres usar el mismo para todos)
    """
    
    start_time = time.time()
    endpoint = f"{BASE_URL}/api/chat"
    
    # Seleccionar mensaje predefinido (rodar entre opciones disponibles)
    message_index = (user_id + message_num) % len(PREDEFINED_MESSAGES)
    message_text = PREDEFINED_MESSAGES[message_index]
    
    # Payload CORRECTO para /api/chat
    # El endpoint espera "content", no "message"
    # user_id y conversation_id se obtienen del token autenticado
    payload = {
        "content": message_text
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        logger.info(f"[Sim-User {user_id}] Enviando petición #{message_num}: '{message_text[:40]}...'")
        
        async with session.post(
            endpoint, 
            json=payload, 
            headers=headers, 
            timeout=TIMEOUT
        ) as response:
            elapsed = time.time() - start_time
            
            logger.info(f"[Sim-User {user_id}] Status: {response.status} - Tiempo: {elapsed:.2f}s")
            
            if response.status == 200:
                data = await response.json()
                logger.info(f"[Sim-User {user_id}] ✓ Respuesta recibida")
                return {
                    "user_id": user_id,
                    "status": "SUCCESS",
                    "time": elapsed,
                    "message": message_text[:50],
                    "response_length": len(str(data))
                }
            else:
                body = await response.text()
                logger.error(f"[Sim-User {user_id}] ✗ Error HTTP {response.status}: {body[:200]}")
                return {
                    "user_id": user_id,
                    "status": f"ERROR_{response.status}",
                    "time": elapsed,
                    "message": message_text[:50],
                    "error": body[:100]
                }
    
    except asyncio.TimeoutError as e:
        elapsed = time.time() - start_time
        logger.error(f"[Sim-User {user_id}] ✗ TIMEOUT después de {elapsed:.2f}s")
        return {
            "user_id": user_id,
            "status": "TIMEOUT",
            "time": elapsed,
            "message": message_text[:50]
        }
    
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"[Sim-User {user_id}] ✗ Excepción: {str(e)}", exc_info=True)
        return {
            "user_id": user_id,
            "status": "EXCEPTION",
            "time": elapsed,
            "message": message_text[:50],
            "error": str(e)
        }


async def run_concurrent_test(token: str):
    """Ejecuta N usuarios simultáneamente enviando mensajes con EL MISMO TOKEN"""
    
    logger.info(f"=" * 60)
    logger.info(f"Iniciando prueba de carga: {NUM_CONCURRENT_USERS} usuarios simulados")
    logger.info(f"Token JWT reutilizado para TODAS las peticiones")
    logger.info(f"=" * 60)
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        
        # Crear tareas para cada usuario simulado (N mensajes por usuario)
        for user_id in range(NUM_CONCURRENT_USERS):
            for msg_num in range(NUM_MESSAGES_PER_USER):
                tasks.append(
                    send_chat_message(session, user_id, msg_num, token)
                )
                await asyncio.sleep(0.05)  # Pequeño delay entre envíos
        
        # Ejecutar todas simultaneamente
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return results


def analyze_results(results):
    """Analiza los resultados y genera reporte"""
    
    print("\n" + "=" * 60)
    print("REPORTE DE PRUEBA DE CARGA")
    print("=" * 60)
    
    success = sum(1 for r in results if isinstance(r, dict) and r["status"] == "SUCCESS")
    timeout = sum(1 for r in results if isinstance(r, dict) and r["status"] == "TIMEOUT")
    errors = sum(1 for r in results if isinstance(r, dict) and "ERROR" in r["status"])
    exceptions = sum(1 for r in results if isinstance(r, dict) and r["status"] == "EXCEPTION")
    
    times = [r["time"] for r in results if isinstance(r, dict) and "time" in r]
    
    print(f"\nResultados:")
    print(f"  ✓ Exitosas: {success}/{len(results)}")
    print(f"  ⏱ Timeouts: {timeout}/{len(results)}")
    print(f"  ✗ Errores HTTP: {errors}/{len(results)}")
    print(f"  💥 Excepciones: {exceptions}/{len(results)}")
    
    if times:
        print(f"\nTiempos de respuesta:")
        print(f"  Min: {min(times):.2f}s")
        print(f"  Max: {max(times):.2f}s")
        print(f"  Promedio: {sum(times)/len(times):.2f}s")
    
    # Detalles de fallos
    if timeout > 0:
        print(f"\n⚠️  {timeout} TIMEOUTS detectados → Posible: Worker exhaustion o OpenAI timeout")
    
    if exceptions > 0:
        print(f"\n⚠️  {exceptions} EXCEPCIONES detectadas → Ver test_load.log para detalles")
    
    if success == len(results):
        print(f"\n✅ ¡EXITO! Todas las peticiones respondieron correctamente")
    
    # Guardar reporte JSON
    with open('test_load_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "config": {
                "num_concurrent_users": NUM_CONCURRENT_USERS,
                "messages_per_user": NUM_MESSAGES_PER_USER,
                "total_requests": len(results),
                "base_url": BASE_URL
            },
            "summary": {
                "total": len(results),
                "success": success,
                "timeouts": timeout,
                "errors": errors,
                "exceptions": exceptions,
                "avg_time": sum(times)/len(times) if times else 0
            },
            "results": [r for r in results if isinstance(r, dict)]
        }, f, indent=2, default=str)
    
    print(f"\nResultados completos guardados en: test_load_results.json")
    print("=" * 60)


async def main():
    """Función principal - ejecuta la prueba"""
    
    print("\n" + "=" * 60)
    print("🧪 EcoProfe Load Testing")
    print("=" * 60)
    print(f"Simulando {NUM_CONCURRENT_USERS} usuarios concurrentes")
    print(f"Cada usuario enviará {NUM_MESSAGES_PER_USER} mensajes")
    print(f"Total de peticiones: {NUM_CONCURRENT_USERS * NUM_MESSAGES_PER_USER}")
    print(f"Backend: {BASE_URL}")
    print("=" * 60 + "\n")
    
    try:
        # Paso 1: Obtener token del usuario real
        print("📝 PASO 1: Autenticando usuario...")
        token = await get_auth_token(GROUP_CODE, STUDENT_CODE)
        
        # Paso 2: Ejecutar prueba de carga
        print("\n📊 PASO 2: Enviando peticiones concurrentes...\n")
        results = await run_concurrent_test(token)
        
        # Paso 3: Analizar resultados
        print("\n📈 PASO 3: Analizando resultados...\n")
        analyze_results(results)
    
    except ValueError as e:
        logger.error(f"❌ Error: {str(e)}")
        print(f"\n❌ Error de autenticación:")
        print(f"   - Verifica que email/password sean correctos")
        print(f"   - Usuario debe existir en la BD")
        print(f"   - Backend debe estar corriendo en {BASE_URL}")
        return False
    
    except Exception as e:
        logger.error(f"❌ Error inesperado: {str(e)}", exc_info=True)
        print(f"\n❌ Error inesperado: {str(e)}")
        return False
    
    return True


if __name__ == "__main__":
    
    print("\n⚙️  CONFIGURACIÓN DEL TEST:")
    print(f"  Backend URL: {BASE_URL}")
    print(f"  Grupo: {GROUP_CODE} | Estudiante: {STUDENT_CODE}")
    print(f"  Usuarios simultáneos: {NUM_CONCURRENT_USERS}")
    print(f"  Mensajes por usuario: {NUM_MESSAGES_PER_USER}")
    print(f"  Total peticiones: {NUM_CONCURRENT_USERS * NUM_MESSAGES_PER_USER}")
    print(f"  Timeout por request: {TIMEOUT.total}s")
    
    # Ejecutar prueba
    success = asyncio.run(main())
    
    if success:
        print("\n✅ Prueba completada exitosamente")
    else:
        print("\n❌ Prueba falló")
