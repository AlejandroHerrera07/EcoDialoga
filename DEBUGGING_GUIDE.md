# 🚀 ESTRATEGIA DE TESTING Y DEBUG PARA PRODUCCIÓN

## Problemas Confirmados en EcoProfe

**Síntoma**: Con 5 usuarios simultáneos, algunas peticiones no retornan respuesta ni dejan logs en Railway

**Root Causes Identificadas**:
1. ❌ **OpenAI API sin timeout** → requests se cuelgan indefinidamente
2. ❌ **Solo 4 gunicorn workers** → worker pool exhaustion
3. ❌ **Logging solo en stdout** → No persiste en Railway
4. ❌ **Silent exception handling** → Errores desaparecen
5. ❌ **Frontend timeout 15s vs backend 15-40s** → Orphaned requests
6. ❌ **Multiple Supabase clients** → Connection pool issues

---

## 📊 FASE 1: TESTING LOCAL (Reproduce el problema)

### Step 1: Instalar dependencias de testing
```bash
cd api
pip install aiohttp requests  # Si no están en requirements.txt
```

### Step 2: Ejecutar prueba de carga con 5+ usuarios
```bash
python test_load_concurrent.py
```

**Qué esperar**:
- Si ves **TIMEOUTS con 15-30s** → Problema de timeout en OpenAI
- Si ves **ERRORS sin logs** → Logging no configurado
- Si ves el **5to usuario falla** → Worker exhaustion

**Output esperado**:
```
[User 0] Enviando petición #0...
[User 1] Enviando petición #0...
[User 2] Enviando petición #0...
[User 3] Enviando petición #0...
[User 4] Enviando petición #0...

✗ 2 TIMEOUTS detectados - Posible: Worker exhaustion o OpenAI timeout
```

---

## 🔧 FASE 2: DIAGNOSTICAR (¿Dónde está el problema?)

### Step 1: Ejecutar health check
```bash
python api/health_check.py
```

**Output indicará**:
- ✓ Backend está activo
- ✓ Base de datos conectada
- ⚠️ Workers disponibles (debería ser 4 en Procfile)
- ⚠️ Archivos de log existen

### Step 2: Revisar logs recientes
```bash
# Ver últimos 50 líneas del error log
tail -50 api/logs/errors.log

# Ver peticiones en tiempo real
tail -f api/logs/requests.log
```

### Step 3: Monitorear llamadas a OpenAI
```bash
# Buscar timeouts en logs
grep -i "timeout\|openai\|completions" api/logs/backend.log
```

---

## 🛠️ FASE 3: FIXES INMEDIATOS (Prioridad)

### 🔴 CRÍTICO - Hacer AHORA:

#### Fix #1: Agregar timeout a OpenAI calls (2 min)
**Archivo**: `api/workflow.py` línea ~208

```python
# ANTES:
response = client.chat.completions.create(
    model=AGENT_MODEL,
    messages=messages
)

# DESPUÉS:
response = client.chat.completions.create(
    model=AGENT_MODEL,
    messages=messages,
    timeout=45  # ← AGREGAR ESTO
)
```

#### Fix #2: Aumentar gunicorn workers (1 min)
**Archivo**: `Procfile`

```
# ANTES:
web: gunicorn -w 4 api.index:app

# DESPUÉS (para 5+ usuarios):
web: gunicorn -w 8 --timeout 60 --graceful-timeout 30 api.index:app
```

#### Fix #3: Extender frontend timeout (1 min)
**Archivo**: `lib/api/client.ts` línea ~64

```typescript
// ANTES:
timeout: 15000,  // 15 segundos

// DESPUÉS:
timeout: 45000,  // 45 segundos
```

#### Fix #4: Implementar logging (30 min)
1. Copiar `api/logging_config.py` (lo hemos creado)
2. Modifica `api/index.py`:

```python
# Importar al inicio
from logging_config import setup_logging, api_logger
import time

# Después de `app = Flask(__name__)`:
logger, request_id_filter = setup_logging(app)

# En cada endpoint importante:
@app.route('/api/chat', methods=['POST'])
def chat_handler():
    start_time = time.time()
    req_id = request_id_filter.request_id
    
    try:
        logger.info(f"Chat request from user")
        
        # ... tu código ...
        
        duration = (time.time() - start_time) * 1000
        logger.info(f"Chat success: {duration:.0f}ms")
        return jsonify(...), 200
    
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Chat failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Error interno"}), 500
```

---

## 🌍 FASE 4: VALIDAR EN PRODUCCIÓN

### Step 1: Deployar cambios a Railway
```bash
git add .
git commit -m "Fix: Add timeouts, logging, and increase workers"
git push  # Dispara auto-deployment en Railway
```

### Step 2: Monitorear logs en Railway
```bash
# En Railway dashboard:
# 1. Ir a "Logs"
# 2. Ver logs en tiempo real
# 3. Ejecutar prueba de carga desde cliente
```

### Step 3: Ejecutar prueba desde producción
```bash
# En tu máquina local, apuntando a production:
BASE_URL = "https://tu-app.railway.app"
python test_load_concurrent.py
```

**Esperar**:
- ✓ Todos los requests retornen 200 OK
- ✓ Ver logs en Railway en tiempo real
- ✓ Promedio de tiempo ≤ 30s

---

## 📈 MONITOREO CONTINUO

### Crear endpoint de health check mejorado
**Archivo**: `api/index.py`, agregar:

```python
@app.route('/api/health/db', methods=['GET'])
def health_db():
    """Verifica que la BD esté accesible"""
    try:
        # Prueba simple de BD
        from api.database import supabase
        result = supabase.table("users").select("count").limit(1).execute()
        return jsonify({"status": "ok", "database": "connected"}), 200
    except Exception as e:
        logger.error(f"DB health check failed: {str(e)}")
        return jsonify({"status": "error", "database": "failed"}), 500

@app.route('/api/health/workers', methods=['GET'])
def health_workers():
    """Retorna estado de workers"""
    import psutil
    return jsonify({
        "status": "ok",
        "active_workers": 4,  # Ajustar según Procfile
        "cpu_percent": psutil.cpu_percent(),
        "memory_mb": psutil.virtual_memory().used / 1024 / 1024
    }), 200
```

### Usar telemetría en Railway
Railway tiene integración con Datadog/Sentry:
1. Ir a Railway Dashboard → Integrations
2. Agregar Sentry o simil
3. Configurar alertas para timeouts y errores

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Ejecutaste `test_load_concurrent.py` localmente (sin timeouts)
- [ ] Ejecutaste `health_check.py` y pasó todos los chequeos
- [ ] Agregaste timeout a OpenAI calls
- [ ] Aumentaste gunicorn workers a 8+
- [ ] Extendiste frontend timeout a 45s
- [ ] Implementaste logging_config.py
- [ ] Updateaste api/index.py con logging
- [ ] Hiciste push a production
- [ ] Validaste que aparezcan logs en Railway
- [ ] Ejecutaste carga test en producción (sin timeouts)

---

## 🆘 Si aún hay problemas después de estos fixes

### Posibles issues adicionales:
1. **Supabase está slow**: Agregar pool_size a cliente
2. **OpenAI rate limiting**: Agregar retry logic con exponential backoff
3. **Memory leak**: Revisar si hay conexiones no cerradas
4. **Database deadlocks**: Agregar timeout a queries SQL

**Contactar soporte de Railway**: Railway Dashboard → Support
- Proporcionar: `health_check_report.json` + `test_load_results.json`

---

## 📚 Recursos útiles

- [Gunicorn Timeouts](https://docs.gunicorn.org/en/stable/settings.html#timeout)
- [OpenAI Timeouts](https://platform.openai.com/docs/guides/error-handling/timeout-errors)
- [Python Logging Best Practices](https://docs.python.org/3/howto/logging.html)
- [Railway Logs](https://docs.railway.app/reference/logs)
