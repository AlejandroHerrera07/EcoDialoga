# Solución: Dashboard Sin Filtros No Muestra Datos

## TL;DR (La solución rápida)

El problema es que sin filtros, probablemente:
1. **No hay datos en la BD** → Necesitas generar datos de prueba
2. **El endpoint está failing silenciosamente** → Revisa los logs
3. **El frontend está usando fallback mock** → Pero debería mostrar datos

Sigue estos pasos:

### Paso Inmediato: Ejecuta el Test del Backend

```bash
cd api
python test_backend_simple.py
```

Esto te dirá si hay datos y si el backend funciona.

---

## Diagnóstico Completo

### Escenario 1: El endpoint retorna 0 registros
**Síntoma:** test_backend_simple.py muestra `assistant_count: 0`

**Solución A: Generar datos de prueba**

Debes asegurar que hay interacciones guardadas. Verifica:

1. ¿Has enviado mensajes en el chat del estudiante?
   - Si no, envía algunos mensajes desde la vista de estudiante
   
2. Verifica que se están guardando en Supabase:
   ```bash
   python -c "
   from database import get_supabase_client
   supabase = get_supabase_client()
   count = supabase.table('interacciones').select('count', count='exact').execute().count
   print(f'Total registros: {count}')
   "
   ```

3. Si sigue siendo 0, verifica que `save_interaction` en database.py está siendo llamada

### Escenario 2: El endpoint falla con error
**Síntoma:** test_backend_simple.py muestra error o status 500

**Solución:** Revisa los logs:

```bash
# Abre otra terminal en el directorio del proyecto
python -m flask --app api.index run --debug

# Luego ejecuta:
python api/test_backend_simple.py

# Verás los [DEBUG] logs en la terminal de Flask
```

**Errores comunes:**
- `AttributeError: 'NoneType'` → Tabla no existe
- Error de Supabase → Verifica credentials en .env
- `ModuleNotFoundError` → Falta instalar dependencias (`pip install -r requirements.txt`)

### Escenario 3: El backend funciona pero frontend no muestra datos
**Síntoma:** 
- test_backend_simple.py retorna datos ✓
- Console del navegador muestra `[DEBUG] Dashboard metrics received`
- Pero la UI está vacía o muestra spinner

**Solución:**

1. Abre DevTools (F12) → Console
2. Busca mensajes `[DEBUG]` o `[FALLBACK]`
3. Si ves `[FALLBACK] Using mock data`: Hay error en la petición
4. Busca el error completo: mira `console.error`

**Si dice "Failed with error: <status> 401":**
- Problema de autenticación
- Solución: Cierra sesión y vuelve a iniciar

**Si no ves logs `[DEBUG]`:**
- El hook no se está ejecutando
- Verifica que estés en la página del dashboard (/teacher/dashboard)

---

## Cambios que ya hicimos

✓ Logging en backend para ver parámetros y respuestas
✓ Logging en frontend para ver qué se envía y recibe
✓ Endpoint de debug `/debug/interacciones-count` para verificar datos
✓ Mejor manejo de errores en la query

---

## Checklist de Verificación

Ejecuta esto en orden:

- [ ] 1. Backend enviando en desarrollo
  ```bash
  cd api
  python -m flask --app index run --debug
  ```

- [ ] 2. Generador datos de prueba (si no hay datos)
  ```bash
  python -c "
  from database import get_supabase_client
  from datetime import datetime, timedelta
  import random
  
  supabase = get_supabase_client()
  
  # Crear 100 interacciones de prueba
  for i in range(100):
      supabase.table('interacciones').insert({
          'rol': 'assistant',
          'contenido': f'Respuesta de prueba {i}',
          'es_relevante': random.choice([True, False]),
          'calidad_respuesta': random.choice([0, 1, 2]),
          'funcion_utilizada': random.choice(['Análisis', 'Síntesis', 'Generación', 'Evaluación', 'Otros', 'General']),
          'codigo_grupo': 'ECO-2026-A',
          'created_at': datetime.now().isoformat()
      }).execute()
  
  print('Insertadas 100 interacciones de prueba')
  "
  ```

- [ ] 3. Prueba el endpoint
  ```bash
  python api/test_backend_simple.py
  ```

- [ ] 4. Abre el dashboard en navegador (http://localhost:3000/teacher/dashboard)
  
- [ ] 5. Sin seleccionar ningu filtro, abre DevTools (F12 → Console)

- [ ] 6. Verifica que ves logs [DEBUG]

- [ ] 7. Si ves datos en el dashboard → ✓ RESUELTO

---

## Código suplementario: Insertar datos de prueba más realistas

Si necesitas datos que se vean bien, ejecuta esto:

```python
# script_insert_test_data.py
from database import get_supabase_client
from datetime import datetime, timedelta
import random

supabase = get_supabase_client()

# Datos de muestra
grupos = ['ECO-2026-A', 'BIO-101-C', 'FIS-301-B']
funciones = [
    'Análisis',
    'Síntesis', 
    'Generación',
    'Evaluación',
    'Otros',
    'General'
]

# Crear 200 interacciones realistas
for i in range(200):
    group = random.choice(grupos)
    fecha = datetime.now() - timedelta(days=random.randint(0, 30))
    
    supabase.table('interacciones').insert({
        'rol': 'assistant',
        'contenido': f'Respuesta sobre {random.choice(["economía", "biología", "física"])}. '
                    f'Esta es una respuesta de prueba #{i} para el grupo {group}.',
        'es_relevante': random.random() > 0.15,  # 85% relevantes
        'calidad_respuesta': random.choice([0, 1, 1, 1, 2, 2]),  # Más 1s y 2s
        'funcion_utilizada': random.choice(funciones),
        'codigo_grupo': group,
        'created_at': fecha.isoformat()
    }).execute()
    
    if (i + 1) % 50 == 0:
        print(f'Insertadas {i + 1} interacciones...')

print('✓ Datos de prueba insertados')
```

Ejecuta con:
```bash
python script_insert_test_data.py
```

---

## Si todo sigue sin funcionar

Abre un issue con:
1. Output de `python api/test_backend_simple.py`
2. Screenshot de la Console del navegador (con [DEBUG] logs)
3. El archivo `.env` (sin valores sensibles, solo los nombres de variables)
4. Error específico que ves en el dashboard

Esto nos permitirá diagnosticar el problema exacto.
