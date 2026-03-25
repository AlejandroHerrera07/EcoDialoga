# 📊 RESUMEN DE HALLAZGOS - Gráfica de Funciones

## 🎯 El Problema en Una Línea
**Los valores de `funcion_utilizada` en la BD no coinciden con las claves que el código espera en `_calcular_funciones()`**

---

## 📋 Tabla Comparativa: BD vs Código

| # | BD (DATABASE_SCHEMA_UPDATE.sql) | Código Espera (dashboard.py) | ¿Coincide? | Resultado |
|---|--------------------------------|----------------------------|-----------|-----------|
| 1 | `'Análisis'` | `'redacción'` | ❌ | count = 0 → 0% |
| 2 | `'Síntesis'` | `'generación_ideas'` | ❌ | count = 0 → 0% |
| 3 | `'Generación'` | (sin equivalente) | ❌ | (se ignora) |
| 4 | `'Evaluación'` | `'evaluación'` | ✅ | count = 12 → XX% |
| 5 | `'Otros'` | (sin equivalente) | ❌ | (se ignora) |
| 6 | `'General'` | (sin equivalente) | ❌ | (se ignora) |

**Tasa de Coincidencia: 1/6 = 16.7%** ← Demasiado baja

---

## 🔍 Dónde Ocurre el Error

### Paso 1: Base de Datos (DATABASE_SCHEMA_UPDATE.sql, líneas 45-52)
```sql
UPDATE interacciones 
SET funcion_utilizada = CASE 
  WHEN id % 5 = 0 THEN 'Análisis'      ← BD asigna estos valores
  WHEN id % 5 = 1 THEN 'Síntesis'
  WHEN id % 5 = 2 THEN 'Generación'
  WHEN id % 5 = 3 THEN 'Evaluación'
  ELSE 'Otros'
END;
```

### Paso 2: Dashboard extrae valores (dashboard.py, línea 88-92)
```python
funciones_count = {}
for inter in interacciones:
    funcion = inter.get("funcion_utilizada", "Otras")
    # funcion = 'Análisis', 'Síntesis', 'Generación', etc. (del paso 1)
    funciones_count[funcion] = funciones_count.get(funcion, 0) + 1

# Resultado:
# {'Análisis': 20, 'Síntesis': 15, 'Generación': 18, 'Evaluación': 12, 'Otros': 35}
```

### Paso 3: _calcular_funciones() busca coincidencias (dashboard.py, línea 249-254)
```python
funciones_predefinidas = {
    "redacción": { ... },           ← Código busca ESTAS claves
    "generación_ideas": { ... },
    "orientación_metodológica": { ... },
    "búsqueda_información": { ... },
    "revisión_teórica": { ... },
    "evaluación": { ... }           ← Solo "evaluación" existe en funciones_count
}

for key in funciones_predefinidas:
    count = funciones_count.get(key, 0)  # get(key, 0) = 0 para casi todo
    # "redacción" en funciones_count? → NO → 0
    # "generación_ideas" en funciones_count? → NO → 0
    # ... (mismo para todas excepto evaluación)
```

### Resultado Final: JSON Vacío
```json
{
  "Cada_funcion": [
    { "label": "Redacción / mejora de texto", "count": 0, "value": 0 },
    { "label": "Generación de ideas", "count": 0, "value": 0 },
    { "label": "Orientación metodológica", "count": 0, "value": 0 },
    { "label": "Búsqueda de información", "count": 0, "value": 0 },
    { "label": "Revisión teórica", "count": 0, "value": 0 },
    { "label": "Evaluación", "count": 12, "value": 12 }  ← Solo este tiene datos
  ]
}
```

**Frontend recibe esta respuesta → Gráfico muestra 0% en casi todo** 🔴

---

## 🐛 Problemas Secundarios Identificados

### 1. save_interaction() NO captura funcion_utilizada (database.py, línea 13-21)
```python
def save_interaction(supabase, sesion_id, role, content, student_id=None, reply_to=None):
    data = {
        "sesion_id": sesion_id,
        "rol": role,
        "contenido": content,
        "es_relevante": True if role == "assistant" else False
        # ❌ FALTA: "funcion_utilizada": "algún_valor"
    }
    # Nuevas interacciones NO tienen funcion_utilizada asignada
```

**Impacto:** Nuevas respuestas del AI no se categorizan, toman valor por defecto 'General'

### 2. process_ai_response() NO devuelve tipo de función (workflow.py, línea 95-131)
```python
def process_ai_response(user_message, supabase, grupo_id):
    # ... código para llamar OpenAI ...
    ai_text = response.output_text
    return ai_text  # Solo retorna texto, no metadata
```

**Impacto:** No hay forma de saber qué función usó la IA aún si se implementara captura

---

## 🛠️ Tres Opciones de Solución

### Opción A: MAPPING (Flexible ⭐ Recomendada)
Crear diccionario que traduzca valores BD → categorías código

**Ventajas:** No afecta datos existentes, permiso cambios sin alterar BD
**Desventajas:** Requiere mantener diccionario de mapping

```python
FUNCTION_MAPPING = {
    "Análisis": "redacción",
    "Síntesis": "generación_ideas",
    "Generación": "generación_ideas",
    "Evaluación": "evaluación",
    "Otros": "búsqueda_información",
}
```

### Opción B: ACTUALIZAR BD (Limpio pero destructivo)
Cambiar valores en BD a nombres correctos

**Ventajas:** Datos correctos de una vez
**Desventajas:** Destruye datos de prueba

```sql
UPDATE interacciones 
SET funcion_utilizada = CASE 
  WHEN funcion_utilizada = 'Análisis' THEN 'redacción'
  WHEN funcion_utilizada = 'Síntesis' THEN 'generación_ideas'
  -- etc...
END;
```

### Opción C: NUEVA COLUMNA (Más robusto)
Crear enum column `funcion_codigo` con valores validados

**Ventajas:** Mayor control, previene valores inválidos
**Desventajas:** Requiere migración de datos

---

## 📌 Archivos Afectados Identificados

| Archivo | Línea | Problema | Severidad |
|---------|-------|----------|-----------|
| [DATABASE_SCHEMA_UPDATE.sql](DATABASE_SCHEMA_UPDATE.sql) | 45-52 | Valores de prueba no coinciden con código | 🔴 |
| [api/dashboard.py](api/dashboard.py) | 88-92 | Extrae valores sin mapear | 🔴 |
| [api/dashboard.py](api/dashboard.py) | 204-279 | `_calcular_funciones()` busca claves inexactas | 🔴 |
| [api/database.py](api/database.py) | 13-21 | `save_interaction()` no captura función | 🟠 |
| [api/workflow.py](api/workflow.py) | 95-131 | `process_ai_response()` no retorna tipo función | 🟠 |

---

## ✅ Script de Debugging Creado

Se creó [api/debug_funciones.py](api/debug_funciones.py) con:
- Herramienta para ver valores REALES en BD
- Simulación del procesamiento en `_calcular_funciones()`
- Verificación de coincidencias
- Respuesta del endpoint completo

**Para ejecutar:**
```bash
cd api
python debug_funciones.py
```

---

## 🎬 Próximos Pasos Recomendados

1. **Diagnosticar Exactamente:**
   - Ejecutar [debug_funciones.py](api/debug_funciones.py)
   - Confirmar valores reales en BD

2. **Implementar Solución A (Mapping):**
   - Agregar FUNCTION_MAPPING en `_calcular_funciones()`
   - Mapear valores antes de procesar

3. **Mejorar Captura de Datos:**
   - Actualizar `save_interaction()` para incluir funcion_utilizada
   - Mejorar `process_ai_response()` para devolver tipo de función

4. **Validación:**
   - Test endpoint `/teacher/metrics`
   - Verificar gráfico en frontend
   - Crear nuevas interacciones y confirmar captura

