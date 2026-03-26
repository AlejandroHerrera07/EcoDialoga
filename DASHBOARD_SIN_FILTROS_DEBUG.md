# Guía de Diagnóstico: Dashboard Sin Filtros No Muestra Datos

## Problema Reportado
Cuando se accede al dashboard sin seleccionar filtros (grupo y fecha), no se muestra información.
Cuando se aplican filtros, SÍ funciona correctamente.

## Cambios Implementados

### 1. **Backend Logging (api/index.py)**
✓ Añadido logging detallado al endpoint `/teacher/metrics` para ver:
  - Parámetros recibidos
  - Status de respuesta
  - Cantidad de interacciones retornadas

### 2. **Backend Dashboard Logic (api/dashboard.py)**
✓ Añadido logging en `get_dashboard_metrics()` para ver:
  - Parámetros de entrada
  - Si se aplican filtros
  - Número de registros obtenidos

### 3. **Frontend Debugging (lib/services/teacher.service.ts)**
✓ Añadido console.log para ver:
  - Parámetros enviados
  - Respuesta del API
  - Cuándo se usa fallback

### 4. **Endpoint de Debug (api/index.py)**
✓ Nuevo endpoint `/debug/interacciones-count` para verificar:
  - Cuántos registros hay en la tabla total
  - Cuántos tienen rol='assistant'
  - Una muestra de datos

## Pasos para Diagnosticar

### Paso 1: Verificar Datos en BD
```bash
# En el navegador, abre:
http://localhost:4000/api/debug/interacciones-count
```

Esto debería retornar algo como:
```json
{
  "total": 1500,
  "assistant_count": 750,
  "user_count": 750,
  "sample": [{...}]
}
```

Si `assistant_count` es 0, el problema es que NO HAY DATOS en la BD.

### Paso 2: Verificar Endpoint Sin Filtros
```bash
# En el navegador (con autenticación):
http://localhost:4000/api/teacher/metrics
```

Debería retornar:
```json
{
  "status": "success",
  "inter_total": <número>,
  "relev_prom": <número>,
  ...
}
```

Si retorna error 401: Problema de autenticación
Si retorna 0 interacciones: No hay datos en BD

### Paso 3: Abrir DevTools del Navegador
1. Abre el dashboard
2. Presiona F12 para abrir DevTools
3. Vé a la pestaña "Console"
4. Busca mensajes que comienzan con `[DEBUG]`

Debería ver algo como:
```
[DEBUG] Fetching dashboard metrics: /teacher/metrics
  - groupCode: null
  - fecha: null
[DEBUG] Dashboard metrics received: { inter_total: 1240, ...}
```

Si dice `[FALLBACK] Using mock data`, entonces hay un problema con la API.

### Paso 4: Revisar Network Tab (DevTools)
1. En DevTools, vé a "Network"
2. Recarga la página
3. Busca las peticiones GET a `/teacher/metrics`
4. Verifica el status (debe ser 200)
5. Revisa la respuesta en la pestaña "Response"

## Posibles Problemas y Soluciones

### Problema A: Sin Datos en BD (assistant_count = 0)
**Síntoma:** `/debug/interacciones-count` muestra assistant_count=0

**Solución:**
1. Revisa que los datos se están guardando en el chat
2. Verifica que `rol='assistant'` está siendo guardado correctamente en `database.py`
3. Ejecuta el script de prueba: `python api/test_dashboard_debug.py`

### Problema B: Endpoint Retorna Error 401
**Síntoma:** Network tab muestra 401 Unauthorized para `/teacher/metrics`

**Solución:**
1. Verifica que estés autenticado (hay token en localStorage)
2. Abre DevTools → Application/Storage → LocalStorage
3. Busca key `eco_token`
4. Si no existe, cierra sesión y vuelve a iniciar

### Problema C: Endpoint Retorna 200 pero with inter_total=0
**Síntoma:** API retorna status=success pero inter_total=0

**Solución:**
1. Hay datos en BD pero no con rol='assistant'
2. Verifica la tabla `interacciones`: 
   - ¿El campo se llama `rol` o tiene otro nombre?
   - ¿El valor está en minúsculas 'assistant'?
3. Ejecuta query SQL para verificar:
   ```sql
   SELECT rol, COUNT(*) as count FROM interacciones GROUP BY rol;
   ```

### Problema D: Frontend Muestra Fallback (Mock Data)
**Síntoma:** Console muestra `[FALLBACK] Using mock data`

**Solución:**
1. Verifica los pasos A-C arriba
2. Mira el error exacto en la console: `console.error` mostrará más detalles
3. Probablemente es 401 de autenticación

## Archivo de Log Esperado en Terminal (Python)

Cuando haces petición a `/teacher/metrics` sin parámetros, deberías ver:
```
[DEBUG] GET /teacher/metrics
  - codigo_grupo: None
  - fecha: None
  - Query params completos: ImmutableMultiDict([])
[DEBUG] get_dashboard_metrics()
  - codigo_grupo: None (type: NoneType)
  - fecha: None (type: NoneType)
  - Ejecutando query a Supabase...
  - Interacciones obtenidas: 150
  - Status respuesta: success
  - Interacciones totales: 150
  - Funciones con datos: 6
```

Si ves "Sin datos, retornando valores por defecto" → No hay datos en BD
Si ves un error → Hay problema con Supabase

## Próximos Pasos

1. Ejecuta los pasos de diagnóstico arriba
2. Comparte el output del `/debug/interacciones-count`  
3. Comparte los logs de la console del navegador
4. Si todo se vé bien pero sigue sin funcionar, probablemente sea un problema de:
   - CORS
   - Configuración del servidor
   - Autorización

## Notas Técnicas

- `panelGroup=""` se convierte a `null` automáticamente en el hook
- `panelDate=""` se convierte a `null` automáticamente en el hook  
- Cuando ambos son `null`, se llama a `/teacher/metrics` SIN parámetros query
- El backend `get_dashboard_metrics(None, None)` es válido y debería retornar todos los datos
- Si retorna 0 datos, es porque la tabla está vacía o el rol no coincide
