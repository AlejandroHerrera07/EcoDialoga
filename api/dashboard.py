"""
Dashboard metrics API - Queries para obtener datos de gráficas desde tabla interacciones
"""

from datetime import datetime, timedelta
from supabase import Client


def get_dashboard_metrics(
    supabase: Client,
    codigo_grupo: str = None,
    fecha: str = None,
):
    """
    Obtiene métricas del dashboard filtrando por grupo y fecha específica (ambos opcionales).
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo para filtrar (opcional)
        fecha: Fecha específica (formato ISO: YYYY-MM-DD) para filtrar solo ese día (opcional)
    
    Returns:
        Dict con métricas para todas las gráficas
    """
    
    try:
        # 1. Obtener todas las interacciones de asistente aplicando filtros
        query = supabase.table("interacciones").select("*").eq("rol", "assistant")
        
        # Aplicar filtros opcionales
        if codigo_grupo:
            query = query.eq("codigo_grupo", codigo_grupo)
        
        # Filtrar por fecha específica (solo comparar el día, ignorar hora)
        if fecha:
            query = query.gte("created_at", f"{fecha}T00:00:00")
            query = query.lt("created_at", f"{fecha}T23:59:59")
        
        interacciones = query.order("created_at", desc=False).execute().data
        
        # Si no hay datos, retornar valores por defecto (0)
        if not interacciones:
            return {
                "status": "success",
                "inter_total": 0,
                "relev_prom": 0,
                "calidad_promedio": 0,
                "Cada_funcion": _get_empty_functions(),
                "total_relevantes": 0,
                "total_irrelevantes": 0,
                "calidad_0": 0,
                "calidad_1": 0,
                "calidad_2": 0,
                "Promedio_calidad": 0,
            }
        
        # 2. Calcular métrica: Interacciones Totales
        inter_total = len(interacciones)
        
        # 3. Calcular métrica: Relevancia Promedio
        relevantes = sum(1 for int in interacciones if int.get("es_relevante", False))
        relev_prom = round((relevantes / inter_total) * 100, 2) if inter_total > 0 else 0
        total_irrelevantes = inter_total - relevantes
        
        # 4. Datos para gráfica de Calidad (últimas 30 respuestas)
        # Ordena por fecha y toma últimas 30
        ultimas_30 = interacciones[-30:] if len(interacciones) > 30 else interacciones
        
        calidad_promedio_data = []
        for idx, inter in enumerate(ultimas_30, 1):
            calidad_promedio_data.append({
                "nombre": f"Respuesta {idx}",
                "promedio_calidad": (inter.get("calidad_respuesta") or 0)
            })
        
        # 5. Calcular promedios de calidad
        # Usar "or 0" para manejar valores None en la BD
        calidades = [(inter.get("calidad_respuesta") or 0) for inter in interacciones]
        promedio_calidad = round(sum(calidades) / len(calidades), 2) if calidades else 0
        
        # Contar por puntuación (0, 1, 2)
        calidad_0 = sum(1 for c in calidades if c == 0)
        calidad_1 = sum(1 for c in calidades if c == 1)
        calidad_2 = sum(1 for c in calidades if c == 2)
        
        # 6. Datos para gráfica de Funciones (Donut)
        funciones_count = {}
        for inter in interacciones:
            # Normalizar el nombre de función desde la BD a la clave esperada
            funcion_raw = inter.get("funcion_utilizada")
            
            # Si funcion_utilizada está NULL o vacío, no contar (podría ser chat sin función asignada)
            if funcion_raw and str(funcion_raw).strip():
                funcion_normalizada = _normalizar_funcion(funcion_raw)
                funciones_count[funcion_normalizada] = funciones_count.get(funcion_normalizada, 0) + 1
        
        # DEBUG: Loguear los datos
        print(f"[DEBUG] inter_total: {inter_total}, funciones_count: {funciones_count}")
        
        # Inicializar todas las 12 funciones con 0 si no tienen datos
        todas_las_funciones = {
            "Redacción / mejora de texto": 0,
            "Búsqueda de información": 0,
            "Generación de ideas": 0,
            "Orientación metodológica": 0,
            "Revisión conceptual o teórica": 0,
            "Evaluación o retroalimentación": 0,
            "Pregunta para pensar": 0,
            "Retroalimentación": 0,
            "Andamiaje": 0,
            "Argumentación": 0,
            "Metacognición": 0,
            "Contraargumentación": 0,
        }
        todas_las_funciones.update(funciones_count)
        
        print(f"[DEBUG] todas_las_funciones: {todas_las_funciones}")
        
        cada_funcion = _calcular_funciones(todas_las_funciones, inter_total)
        
        print(f"[DEBUG] cada_funcion result: {cada_funcion}")
        
        return {
            "status": "success",
            "inter_total": inter_total,
            "relev_prom": relev_prom,
            "Promedio_calidad": promedio_calidad,
            "calidad_promedio_data": calidad_promedio_data,
            "Cada_funcion": cada_funcion,
            "total_relevantes": relevantes,
            "Total_irrelevantes": total_irrelevantes,
            "calidad_0": calidad_0,
            "calidad_1": calidad_1,
            "calidad_2": calidad_2,
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "inter_total": 0,
            "relev_prom": 0,
            "Promedio_calidad": 0,
            "calidad_promedio_data": [],
            "Cada_funcion": _get_empty_functions(),
        }


def get_recent_messages(
    supabase: Client,
    codigo_grupo: str = None,
    fecha: str = None,
    limit: int = 15,
):
    """
    Obtiene mensajes recientes del dashboard (últimas N interacciones de asistente).
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo para filtrar (opcional)
        fecha: Fecha específica (formato ISO: YYYY-MM-DD) para filtrar solo ese día (opcional)
        limit: Número máximo de mensajes a retornar (default: 50)
    
    Returns:
        List de mensajes transformados a la estructura del frontend
    """
    
    try:
        # Obtener interacciones del asistente
        query = supabase.table("interacciones").select(
            "id, contenido, created_at, codigo_grupo, identificador_estudiante"
        ).eq("rol", "user")
        
        if codigo_grupo:
            query = query.eq("codigo_grupo", codigo_grupo)
        
        # Filtrar por fecha específica (solo comparar el día, ignorar hora)
        if fecha:
            query = query.gte("created_at", f"{fecha}T00:00:00")
            query = query.lt("created_at", f"{fecha}T23:59:59")
        
        mensajes_raw = query.order("created_at", desc=True).limit(limit).execute().data
        
        # Transformar datos a la estructura esperada por el frontend
        mensajes_transformados = []
        for msg in mensajes_raw:
            # Obtener el nombre del estudiante usando una query separada
            student_name = "Desconocido"
            identificador_estudiante = msg.get("identificador_estudiante")
            if identificador_estudiante:
                try:
                    student_query = supabase.table("estudiantes").select("nombre_anonimo").eq("identificador_estudiante", identificador_estudiante).single().execute()
                    if student_query.data:
                        student_name = student_query.data.get("nombre_anonimo", "Desconocido")
                except Exception as e:
                    print(f"Error obteniendo nombre del estudiante {identificador_estudiante}: {str(e)}")
                    student_name = identificador_estudiante  # Fallback: usar el ID como nombre
            
            # Extraer la fecha en formato YYYY-MM-DD
            created_at = msg.get("created_at", "")
            date_str = created_at.split("T")[0] if created_at else ""
            
            # Construir el mensaje transformado
            mensaje_transformado = {
                "id": msg.get("id"),
                "student": student_name,
                "date": date_str,
                "group": msg.get("codigo_grupo", ""),
                "content": msg.get("contenido", "")
            }
            mensajes_transformados.append(mensaje_transformado)
        
        return mensajes_transformados
    
    except Exception as e:
        print(f"Error en get_recent_messages: {str(e)}")
        return []


def get_grupos_list(supabase: Client):
    """
    Obtiene lista de todos los grupos disponibles.
    
    Returns:
        List de grupos con estructura esperada por el frontend
    """
    
    try:
        grupos = supabase.table("grupos").select("id, codigo_grupo, area_curricular, area_transversal, eje_ambiental, problematica, grado")
        grupos_raw = grupos.order("codigo_grupo", desc=True).execute().data
        
        # Mapear campos de BD a estructura que espera el frontend
        grupos_formateados = []
        for grupo in grupos_raw:
            grupo_formateado = {
                "id": grupo.get("id"),
                "code": grupo.get("codigo_grupo"),  # Mapear codigo_grupo → code
                "area": grupo.get("area_curricular", ""),
                "area_transversal": grupo.get("area_transversal", ""),  # Nueva columna
                "eje": grupo.get("eje_ambiental", ""),
                "macroEje": grupo.get("eje_ambiental", ""),  # Cambiar de area_curricular a eje_ambiental
                "problematica": grupo.get("problematica", ""),
                "icon": "science",  # Valores por defecto
                "iconBg": "bg-blue-50",
                "iconColor": "text-blue-600",
                "status": "active"
            }
            grupos_formateados.append(grupo_formateado)
        
        return grupos_formateados
    
    except Exception as e:
        print(f"Error en get_grupos_list: {str(e)}")
        return []


# ─────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────

def _normalizar_funcion(funcion_raw: str) -> str:
    """
    Normaliza los valores de funcion_utilizada de la BD.
    
    Las funciones se guardan con sus nombres exactos ya validados desde workflow.py,
    así que solo se necesita limpiar espacios y garantizar consistencia.
    """
    
    # Funciones válidas que se pueden guardar
    funciones_validas = [
        "Redacción / mejora de texto",
        "Búsqueda de información",
        "Generación de ideas",
        "Orientación metodológica",
        "Revisión conceptual o teórica",
        "Evaluación o retroalimentación",
        "Pregunta para pensar",
        "Retroalimentación",
        "Andamiaje",
        "Argumentación",
        "Metacognición",
        "Contraargumentación"
    ]
    
    if not funcion_raw:
        return "Orientación metodológica"  # Por defecto
    
    funcion_clean = str(funcion_raw).strip()
    
    # Si ya coincide exactamente, retornar
    if funcion_clean in funciones_validas:
        return funcion_clean
    
    # Si no, buscar case-insensitive
    funcion_lower = funcion_clean.lower()
    for func in funciones_validas:
        if func.lower() == funcion_lower:
            return func
    
    # Si no encuentra coincidencia, retornar por defecto
    return "Orientación metodológica"

def _calcular_funciones(funciones_count: dict, total_interacciones: int = None) -> list:
    """
    Convierte un diccionario de conteo de funciones a una lista con colores y porcentajes.
    
    Args:
        funciones_count: Dict con conteos de funciones
        total_interacciones: Total de interacciones para calcular porcentajes
    """
    
    # Definir las 12 funciones predeterminadas con sus colores
    funciones_predefinidas = {
        "Redacción / mejora de texto": {
            "label": "Redacción / mejora de texto",
            "description": "Ayuda en redacción y mejora de textos",
            "color": "bg-blue-500",
            "hex": "#3B82F6"
        },
        "Búsqueda de información": {
            "label": "Búsqueda de información",
            "description": "Búsqueda y acceso a información",
            "color": "bg-orange-500",
            "hex": "#F97316"
        },
        "Generación de ideas": {
            "label": "Generación de ideas",
            "description": "Generación de ideas y propuestas",
            "color": "bg-green-500",
            "hex": "#10B981"
        },
        "Orientación metodológica": {
            "label": "Orientación metodológica",
            "description": "Orientación sobre métodos y procesos",
            "color": "bg-purple-500",
            "hex": "#A855F7"
        },
        "Revisión conceptual o teórica": {
            "label": "Revisión conceptual o teórica",
            "description": "Revisión y explicación teórica",
            "color": "bg-cyan-500",
            "hex": "#06B6D4"
        },
        "Evaluación o retroalimentación": {
            "label": "Evaluación o retroalimentación",
            "description": "Evaluación y crítica constructiva",
            "color": "bg-rose-500",
            "hex": "#F43F5E"
        },
        "Pregunta para pensar": {
            "label": "Pregunta para pensar",
            "description": "Preguntas reflexivas",
            "color": "bg-yellow-500",
            "hex": "#EAB308"
        },
        "Retroalimentación": {
            "label": "Retroalimentación",
            "description": "Retroalimentación constructiva",
            "color": "bg-indigo-500",
            "hex": "#6366F1"
        },
        "Andamiaje": {
            "label": "Andamiaje",
            "description": "Apoyo gradual del aprendizaje",
            "color": "bg-teal-500",
            "hex": "#14B8A6"
        },
        "Argumentación": {
            "label": "Argumentación",
            "description": "Desarrollo de argumentos",
            "color": "bg-fuchsia-500",
            "hex": "#D946EF"
        },
        "Metacognición": {
            "label": "Metacognición",
            "description": "Reflexión sobre el propio aprendizaje",
            "color": "bg-lime-500",
            "hex": "#84CC16"
        },
        "Contraargumentación": {
            "label": "Contraargumentación",
            "description": "Presentación de argumentos contrarios",
            "color": "bg-sky-500",
            "hex": "#0EA5E9"
        },
    }
    
    # Usar total_interacciones si se proporciona, sino suma de funciones
    total = total_interacciones if total_interacciones else sum(funciones_count.values())
    
    # Construir resultado
    resultado = []
    for key, info in funciones_predefinidas.items():
        count = funciones_count.get(key, 0)
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


def _get_empty_functions() -> list:
    """Retorna estructura vacía de las 12 funciones para cuando no hay datos."""
    
    funciones_predefinidas = {
        "Redacción / mejora de texto": {
            "label": "Redacción / mejora de texto",
            "description": "Ayuda en redacción y mejora de textos",
            "color": "bg-blue-500",
            "hex": "#3B82F6"
        },
        "Búsqueda de información": {
            "label": "Búsqueda de información",
            "description": "Búsqueda y acceso a información",
            "color": "bg-orange-500",
            "hex": "#F97316"
        },
        "Generación de ideas": {
            "label": "Generación de ideas",
            "description": "Generación de ideas y propuestas",
            "color": "bg-green-500",
            "hex": "#10B981"
        },
        "Orientación metodológica": {
            "label": "Orientación metodológica",
            "description": "Orientación sobre métodos y procesos",
            "color": "bg-purple-500",
            "hex": "#A855F7"
        },
        "Revisión conceptual o teórica": {
            "label": "Revisión conceptual o teórica",
            "description": "Revisión y explicación teórica",
            "color": "bg-cyan-500",
            "hex": "#06B6D4"
        },
        "Evaluación o retroalimentación": {
            "label": "Evaluación o retroalimentación",
            "description": "Evaluación y crítica constructiva",
            "color": "bg-rose-500",
            "hex": "#F43F5E"
        },
        "Pregunta para pensar": {
            "label": "Pregunta para pensar",
            "description": "Preguntas reflexivas",
            "color": "bg-yellow-500",
            "hex": "#EAB308"
        },
        "Retroalimentación": {
            "label": "Retroalimentación",
            "description": "Retroalimentación constructiva",
            "color": "bg-indigo-500",
            "hex": "#6366F1"
        },
        "Andamiaje": {
            "label": "Andamiaje",
            "description": "Apoyo gradual del aprendizaje",
            "color": "bg-teal-500",
            "hex": "#14B8A6"
        },
        "Argumentación": {
            "label": "Argumentación",
            "description": "Desarrollo de argumentos",
            "color": "bg-fuchsia-500",
            "hex": "#D946EF"
        },
        "Metacognición": {
            "label": "Metacognición",
            "description": "Reflexión sobre el propio aprendizaje",
            "color": "bg-lime-500",
            "hex": "#84CC16"
        },
        "Contraargumentación": {
            "label": "Contraargumentación",
            "description": "Presentación de argumentos contrarios",
            "color": "bg-sky-500",
            "hex": "#0EA5E9"
        },
    }
    
    return [
        {
            "label": info["label"],
            "description": info["description"],
            "color": info["color"],
            "value": 0,
            "hex": info["hex"],
            "count": 0
        }
        for info in funciones_predefinidas.values()
    ]
