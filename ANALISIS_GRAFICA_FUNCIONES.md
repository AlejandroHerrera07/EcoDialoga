# 📊 ANÁLISIS DETALLADO: Gráfica de Funciones en Dashboard - NO MUESTRA DATOS

## 🎯 Resumen Ejecutivo

**Problema:** La gráfica de funciones del dashboard muestra 0% en casi todas las categorías aunque existe la columna `funcion_utilizada` en la BD con datos de prueba.

**Causa Raíz:** Desajuste entre los valores almacenados en la BD y las claves que el código espera.

**Severidad:** 🔴 **CRÍTICA** - El gráfico no es funcional

---

## 📈 FLUJO COMPLETO DE DATOS

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND REQUEST                                             │
├─────────────────────────────────────────────────────────────────┤
│ GET /teacher/metrics?codigo_grupo=ECO-2026-A                    │
└─────────────────────────────────────┬───────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND - index.py (línea 260-272)                           │
├─────────────────────────────────────────────────────────────────┤
│ Endpoint: @app.route('/teacher/metrics')                        │
│ Función: get_metrics(user)                                      │
│                                                                  │
│ Recibe parámetros de query:                                     │
│   - codigo_grupo (opcional)                                     │
│   - fecha_inicio (opcional)                                     │
│   - fecha_fin (opcional)                                        │
│                                                                 │
│ Llama: get_dashboard_metrics(supabase, codigo_grupo, ...)      │
└─────────────────────────────────────┬───────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND - dashboard.py (línea 11-120)                        │
├─────────────────────────────────────────────────────────────────┤
│ Función: get_dashboard_metrics()                                │
│                                                                  │
│ Paso A: Consulta BD                                             │
│   supabase.table("interacciones")                               │
│     .select("*")                                                │
│     .eq("rol", "assistant")                                     │
│   ↓                                                             │
│   Retorna: Lista con TODAS las interacciones de asistente       │
│   Cada registro tiene: {                                        │
│     id, sesion_id, rol, contenido, es_relevante,               │
│     calidad_respuesta, funcion_utilizada, created_at, ...      │
│   }                                                             │
│                                                                  │
│ ⚠️ PUNTO CRÍTICO - Paso B: Procesar funciones (línea 88-93)    │
│   ┌──────────────────────────────────────────────────┐         │
│   │ for inter in interacciones:                      │         │
│   │   funcion = inter.get("funcion_utilizada",      │         │
│   │                       "Otras")                   │         │
│   │   # funcion = 'Análisis' (del script de datos)   │         │
│   │   # o 'General' (valor por defecto de BD)        │         │
│   │   funciones_count[funcion] = ...                 │         │
│   │                                                  │         │
│   │ Resultado: {                                     │         │
│   │   "Análisis": 20,                               │         │
│   │   "Síntesis": 15,                               │         │
│   │   "Generación": 18,                             │         │
│   │   "Evaluación": 12,                             │         │
│   │   "Otros": 35                                   │         │
│   │ }                                                │         │
│   └──────────────────────────────────────────────────┘         │
│                                                                  │
│ Paso C: Pasar a _calcular_funciones() (línea 94)               │
│   cada_funcion = _calcular_funciones(funciones_count)          │
└─────────────────────────────────────┬───────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND - dashboard.py (línea 204-279)                       │
├─────────────────────────────────────────────────────────────────┤
│ Función: _calcular_funciones(funciones_count)                   │
│                                                                  │
│ Define diccionario PREDEFINIDO de funciones (línea 210-237):    │
│   funciones_predefinidas = {                                    │
│     "redacción": {                                              │
│       "label": "Redacción / mejora de texto",                   │
│       "color": "bg-blue-500",                                   │
│       "hex": "#3B82F6"                                          │
│     },                                                          │
│     "generación_ideas": { ... },                                │
│     "orientación_metodológica": { ... },                        │
│     "búsqueda_información": { ... },                            │
│     "revisión_teórica": { ... },                                │
│     "evaluación": { ... }                                       │
│   }                                                             │
│                                                                  │
│ 🔴 PROBLEMA - Loop de búsqueda de coincidencias (línea 249-254):
│   ┌──────────────────────────────────────────────────┐         │
│   │ for key, info in funciones_predefinidas.items(): │         │
│   │   count = funciones_count.get(key, 0)           │         │
│   │   #                                             │         │
│   │   # Busca: "redacción" en funciones_count       │         │
│   │   # funciones_count tiene: "Análisis", ...      │         │
│   │   # RESULTADO: count = 0 (NO ENCONTRADO)         │         │
│   │   #                                             │         │
│   │   value = round((count/total)*100, 1) if ... = 0%│         │
│   └──────────────────────────────────────────────────┘         │
│                                                                  │
│ Retorna: [                                                      │
│   {                                                             │
│     "label": "Redacción / mejora de texto",                     │
│     "value": 0,    ← SIEMPRE 0                                  │
│     "count": 0,    ← SIEMPRE 0                                  │
│     ...                                                         │
│   },                                                            │
│   ... (igual para todas las categorías predefinidas)            │
│ ]                                                               │
└─────────────────────────────────────┬───────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND - index.py (línea 289)                               │
├─────────────────────────────────────────────────────────────────┤
│ Retorna JSON:                                                   │
│ {                                                               │
│   "status": "success",                                          │
│   "inter_total": 100,                                           │
│   "Cada_funcion": [                                             │
│     {                                                           │
│       "label": "Redacción / mejora de texto",                   │
│       "value": 0,   ← VACÍO                                     │
│       "count": 0                                                │
│     },                                                          │
│     {                                                           │
│       "label": "Generación de ideas",                           │
│       "value": 0,   ← VACÍO                                     │
│       "count": 0                                                │
│     },                                                          │
│     ...                                                         │
│   ]                                                             │
│ }                                                               │
└─────────────────────────────────────┬───────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND - React Component                                   │
├─────────────────────────────────────────────────────────────────┤
│ Recibe datos via endpoint /teacher/metrics                      │
│ Renderiza gráfico DONUT/PIE                                     │
│                                                                  │
│ Resultado: Gráfico completamente vacío o sin datos visibles     │
│ porque todos los valores son 0                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 EL CUELLO DE BOTELLA: Key Mismatch

### Valores en Base de Datos (DATABASE_SCHEMA_UPDATE.sql, líneas 45-52):

```sql
UPDATE interacciones 
SET funcion_utilizada = CASE 
  WHEN id % 5 = 0 THEN 'Análisis'          ← String en BD
  WHEN id % 5 = 1 THEN 'Síntesis'          ← String en BD
  WHEN id % 5 = 2 THEN 'Generación'        ← String en BD
  WHEN id % 5 = 3 THEN 'Evaluación'        ← String en BD
  ELSE 'Otros'                             ← String en BD
END
```

### Valores Esperados en Código (dashboard.py, línea 210):

```python
funciones_predefinidas = {
    "redacción": { ... },                    ← Clave en código
    "generación_ideas": { ... },             ← Clave en código
    "orientación_metodológica": { ... },     ← Clave en código
    "búsqueda_información": { ... },         ← Clave en código
    "revisión_teórica": { ... },             ← Clave en código
    "evaluación": { ... }                    ← Clave en código
}
```

### Tabla de Coincidencias:

```
┌──────────────────┬──────────────────────┬──────────┬──────────┐
│ Valor en BD      │ Clave en Código      │ Coincide │ Conteo   │
├──────────────────┼──────────────────────┼──────────┼──────────┤
│ "Análisis"       │ "redacción"          │    ✗     │    0%    │
│ "Síntesis"       │ "generación_ideas"   │    ✗     │    0%    │
│ "Generación"     │ No tiene equivalente  │    ✗     │    -     │
│ "Evaluación"     │ "evaluación"         │    ✓     │   XX%    │
│ "Otros"          │ No tiene equivalente  │    ✗     │    -     │
│ "General"        │ No tiene equivalente  │    ✗     │    -     │
│ (NULL/default)   │ No tiene equivalente  │    ✗     │    -     │
└──────────────────┴──────────────────────┴──────────┴──────────┘

Resultado: Solo 1 de 6 categorías tiene datos (Evaluación)
```

---

## 📌 PROBLEMA ADICIONAL: save_interaction() No Asigna Función

En [api/database.py](api/database.py#L13-L21), la función `save_interaction()` NO está capturando ni guardando `funcion_utilizada`:

```python
def save_interaction(supabase, sesion_id, role, content, student_id=None, reply_to=None):
    data = {
        "sesion_id": sesion_id,
        "rol": role,
        "contenido": content,
        "es_relevante": True if role == "assistant" else False
        # ❌ FALTA: "funcion_utilizada": ...
    }
    # ...
    return supabase.table("interacciones").insert(data).execute()
```

**Consecuencia:** Todas las nuevas interacciones no tienen `funcion_utilizada` asignada, solo toman el valor por defecto de la BD ('General').

---

## 🛠️ SOLUCIONES RECOMENDADAS

### Opción 1: MAPPING (Recomendada - Más Flexible)

Crear un diccionario que mapee los valores de BD a las categorías del código:

```python
# En dashboard.py
FUNCTION_MAPPING = {
    "Análisis": "redacción",
    "Síntesis": "generación_ideas",
    "Generación": "generación_ideas",
    "Evaluación": "evaluación",
    "Otros": "búsqueda_información",
    "General": "búsqueda_información",  # valor por defecto
}

def _calcular_funciones(funciones_count: dict) -> list:
    # Primero, mapear valores de BD a categorías
    funciones_mapeadas = {}
    for valor_bd, count in funciones_count.items():
        categoria = FUNCTION_MAPPING.get(valor_bd, "búsqueda_información")
        funciones_mapeadas[categoria] = funciones_mapeadas.get(categoria, 0) + count
    
    # Luego, procesar como lo hace ahora
    funciones_predefinidas = { ... }
    total = sum(funciones_mapeadas.values())
    
    resultado = []
    for key, info in funciones_predefinidas.items():
        count = funciones_mapeadas.get(key, 0)  # Ahora usa valores mapeados
        value = round((count / total) * 100, 1) if total > 0 else 0
        resultado.append({
            "label": info["label"],
            "value": value,
            "count": count,
            # ...
        })
    
    return resultado
```

**Ventajas:**
- ✓ No rompe datos existentes en BD
- ✓ Permite ajustar el mapping sin cambiar la BD
- ✓ Flexible para diferentes fuentes de datos

**Desventajas:**
- Requiere mantener el diccionario FUNCTION_MAPPING

---

### Opción 2: ACTUALIZAR BD (Más Limpio Pero Destructivo)

Ejecutar un script SQL para cambiar los valores de `funcion_utilizada` a los nombres correctos:

```sql
-- Reemplazar valores para que coincidan con código
UPDATE interacciones 
SET funcion_utilizada = CASE 
  WHEN funcion_utilizada = 'Análisis' THEN 'redacción'
  WHEN funcion_utilizada = 'Síntesis' THEN 'generación_ideas'
  WHEN funcion_utilizada = 'Generación' THEN 'generación_ideas'
  WHEN funcion_utilizada = 'Evaluación' THEN 'evaluación'
  WHEN funcion_utilizada = 'Otros' THEN 'búsqueda_información'
  WHEN funcion_utilizada = 'General' THEN 'búsqueda_información'
  ELSE 'redacción'  -- valor por defecto
END;
```

**Ventajas:**
- ✓ Datos correctos de una vez
- ✓ No requiere lógica adicional en código

**Desventajas:**
- ✗ Destruye datos de prueba original
- ✗ Debe hacerse cuidadosamente

---

### Opción 3: NUEVA COLUMNA CON ENUMERACIÓN

Crear una nueva columna `funcion_codigo` como enum con los valores correctos:

```sql
ALTER TABLE interacciones 
ADD COLUMN funcion_codigo VARCHAR(50) 
CHECK (funcion_codigo IN (
  'redacción',
  'generación_ideas',
  'orientación_metodológica',
  'búsqueda_información',
  'revisión_teórica',
  'evaluación'
));
```

**Ventajas:**
- ✓ Mayor control y consistencia
- ✓ No destruye datos históricos
- ✓ Previene valores inválidos

---

## 🚀 PASOS PARA IMPLEMENTAR LA SOLUCIÓN 1 (MAPPING)

1. **Actualizar [api/dashboard.py](api/dashboard.py#L204):**
   - Agregar diccionario FUNCTION_MAPPING al inicio de `_calcular_funciones()`
   - Modificar la lógica para mapear primero antes de procesar

2. **Actualizar [api/database.py](api/database.py#L13):**
   - Agregar parámetro `funcion_utilizada` a `save_interaction()`
   - Pasar el valor cuando se guarden nuevas interacciones

3. **Ejecutar Script de Debug:**
   - Ejecutar [api/debug_funciones.py](api/debug_funciones.py) para verificar valores en BD

4. **Testing:**
   - Verificar que el endpoint `/teacher/metrics` retorna valores correctos
   - Validar que el gráfico muestra datos en el frontend

---

## 📊 RESULTADO ESPERADO (Después de Solución)

```json
{
  "status": "success",
  "inter_total": 100,
  "Cada_funcion": [
    {
      "label": "Redacción / mejora de texto",
      "value": 20,      ← Tiene datos
      "count": 20,
      "hex": "#3B82F6"
    },
    {
      "label": "Generación de ideas",
      "value": 35,      ← Tiene datos
      "count": 35,
      "hex": "#10B981"
    },
    {
      "label": "Orientación metodológica",
      "value": 0,       ← Sin datos (ningún valor se mapea aquí)
      "count": 0,
      "hex": "#A855F7"
    },
    {
      "label": "Búsqueda de información",
      "value": 45,      ← Tiene datos
      "count": 45,
      "hex": "#F97316"
    },
    ...
  ]
}
```

---

## 📝 CHECKLIST DE VERIFICACIÓN

- [ ] Ejecutar debug_funciones.py para confirmar valores en BD
- [ ] Implementar FUNCTION_MAPPING en _calcular_funciones()
- [ ] Actualizar save_interaction() para capturar funcion_utilizada
- [ ] Hacer request a /teacher/metrics y verificar Cada_funcion no está vacío
- [ ] Validar que frontend renderiza el gráfico correctamente
- [ ] Crear nuevas interacciones y verificar que se capturan correctamente

---

## 🔧 ARCHIVOS INVOLUCRADOS

- [api/dashboard.py](api/dashboard.py) - Lógica de cálculo de funciones
- [api/index.py](api/index.py) - Endpoint /teacher/metrics
- [api/database.py](api/database.py) - Guardado de interacciones
- [api/debug_funciones.py](api/debug_funciones.py) - Script de debugging (NUEVO)
- DATABASE_SCHEMA_UPDATE.sql - Script de datos de prueba

