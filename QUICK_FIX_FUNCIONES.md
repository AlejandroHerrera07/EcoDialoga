# 🚀 GUÍA RÁPIDA - Solución para Gráfica de Funciones

## El Problema (30 segundos)

```
BD: 'Análisis', 'Síntesis', 'Generación', 'Evaluación', 'Otros'
       ↓
Código espera: 'redacción', 'generación_ideas', 'orientación_metodológica', ...
       ↓
Resultado: NO COINCIDEN → Gráfico muestra 0% en casi todo
```

---

## La Solución (Implementación Rápida - 10 minutos)

### Paso 1: Agregar Mapping en dashboard.py

**Ubica:** Función `_calcular_funciones()` (línea 204)

**Agrega esto al inicio de la función:**

```python
def _calcular_funciones(funciones_count: dict) -> list:
    """
    Convierte un diccionario de conteo de funciones a una lista con colores y porcentajes.
    """
    
    # 🆕 AGREGAR ESTE BLOQUE
    # Mapeo de valores BD a categorías del código
    FUNCTION_MAPPING = {
        "Análisis": "redacción",
        "Síntesis": "generación_ideas",
        "Generación": "generación_ideas",
        "Evaluación": "evaluación",
        "Otros": "búsqueda_información",
        "General": "búsqueda_información",
    }
    
    # Mapear valores recibidos
    funciones_mapeadas = {}
    for valor_bd, count in funciones_count.items():
        categoria = FUNCTION_MAPPING.get(valor_bd, "redacción")  # default: redacción
        if categoria not in funciones_mapeadas:
            funciones_mapeadas[categoria] = 0
        funciones_mapeadas[categoria] += count
    
    # Usar funciones_mapeadas en lugar de funciones_count
    # 🆕 FIN DEL BLOQUE
    
    # ... resto del código igual, pero cambiar funciones_count por funciones_mapeadas ...
```

**Cambio en el resto de la función (línea ~249):**

```python
# Cambiar ESTO:
# total = sum(funciones_count.values())

# Por ESTO:
total = sum(funciones_mapeadas.values())

# Y ESTO:
# for key, info in funciones_predefinidas.items():
#     count = funciones_count.get(key, 0)

# Por ESTO:
for key, info in funciones_predefinidas.items():
    count = funciones_mapeadas.get(key, 0)  # ← Cambiar aquí
```

---

### Paso 2: Probar Cambios

En terminal (en la carpeta `api`):

```bash
# Ejecutar script de debug
python debug_funciones.py
```

**Esperado:** Verás valores con `count > 0` en Redacción, Generación de ideas, etc.

---

### Paso 3: Verificar en Frontend

1. Abrir navegador: `http://localhost:3000/teacher/dashboard`
2. Ver gráfico de "Cada función" (donut/pie chart)
3. Debe mostrar datos distribuidos en diferentes colores

---

## Verificación Rápida

### Antes (Incorrecto ❌):
```
Redacción: 0%
Generación de ideas: 0%
Orientación metodológica: 0%
Búsqueda de información: 0%
Revisión teórica: 0%
Evaluación: 100% (solo este)
```

### Después (Correcto ✅):
```
Redacción: 20%
Generación de ideas: 35%
Orientación metodológica: 0%
Búsqueda de información: 45%
Revisión teórica: 0%
Evaluación: 0%
(distribuido según los datos)
```

---

## Código Completo de _calcular_funciones() (Versión Fija)

```python
def _calcular_funciones(funciones_count: dict) -> list:
    """
    Convierte un diccionario de conteo de funciones a una lista con colores y porcentajes.
    """
    
    # Mapeo de valores BD a categorías del código
    FUNCTION_MAPPING = {
        "Análisis": "redacción",
        "Síntesis": "generación_ideas",
        "Generación": "generación_ideas",
        "Evaluación": "evaluación",
        "Otros": "búsqueda_información",
        "General": "búsqueda_información",
    }
    
    # Mapear valores recibidos a categorías
    funciones_mapeadas = {}
    for valor_bd, count in funciones_count.items():
        categoria = FUNCTION_MAPPING.get(valor_bd, "redacción")
        if categoria not in funciones_mapeadas:
            funciones_mapeadas[categoria] = 0
        funciones_mapeadas[categoria] += count
    
    # Definir las 6 funciones predeterminadas con sus colores
    funciones_predefinidas = {
        "redacción": {
            "label": "Redacción / mejora de texto",
            "description": "Ayuda en redacción y mejora de textos",
            "color": "bg-blue-500",
            "hex": "#3B82F6"
        },
        "generación_ideas": {
            "label": "Generación de ideas",
            "description": "Generación de ideas y propuestas",
            "color": "bg-green-500",
            "hex": "#10B981"
        },
        "orientación_metodológica": {
            "label": "Orientación metodológica",
            "description": "Orientación sobre métodos y procesos",
            "color": "bg-purple-500",
            "hex": "#A855F7"
        },
        "búsqueda_información": {
            "label": "Búsqueda de información",
            "description": "Búsqueda y acceso a información",
            "color": "bg-orange-500",
            "hex": "#F97316"
        },
        "revisión_teórica": {
            "label": "Revisión teórica",
            "description": "Revisión y explicación teórica",
            "color": "bg-cyan-500",
            "hex": "#06B6D4"
        },
        "evaluación": {
            "label": "Evaluación",
            "description": "Evaluación y crítica constructiva",
            "color": "bg-rose-500",
            "hex": "#F43F5E"
        },
    }
    
    # Calcular total usando valores MAPEADOS
    total = sum(funciones_mapeadas.values())
    
    # Construir resultado
    resultado = []
    for key, info in funciones_predefinidas.items():
        count = funciones_mapeadas.get(key, 0)  # Usar valores mapeados
        value = round((count / total) * 100, 1) if total > 0 else 0
        
        resultado.append({
            "label": info["label"],
            "description": info["description"],
            "color": info["color"],
            "value": value,
            "hex": info["hex"],
            "count": count
        })
    
    return resultado
```

---

## FAQ Rápido

**P: ¿Van a perderse los datos en BD?**
R: NO. El mapping traduce valores, sin tocar la BD.

**P: ¿Qué pasa con nuevas interacciones?**
R: Seguirán teniendo valor 'General' hasta que se implemente captura en `save_interaction()`.

**P: ¿Cuánto tiempo toma implementar?**
R: 5-10 minutos si solo haces el mapping. 20 minutos si también mejoras `save_interaction()`.

**P: ¿Es permanente la solución?**
R: Sí. Es lo recomendado según análisis realizado.

---

## Archivos Documentación

- **Análisis Completo:** [ANALISIS_GRAFICA_FUNCIONES.md](ANALISIS_GRAFICA_FUNCIONES.md)
- **Resumen de Hallazgos:** [RESUMEN_HALLAZGOS_FUNCIONES.md](RESUMEN_HALLAZGOS_FUNCIONES.md)
- **Script de Debug:** [api/debug_funciones.py](api/debug_funciones.py)

---

## Support

Si necesitas ayuda:
1. Ejecuta `python debug_funciones.py` para ver estado actual
2. Consulta [ANALISIS_GRAFICA_FUNCIONES.md](ANALISIS_GRAFICA_FUNCIONES.md) sección "Soluciones Recomendadas"
3. Verifica que los cambios se guardaron en `_calcular_funciones()`

