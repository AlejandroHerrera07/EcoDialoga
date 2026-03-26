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
        # DEBUG: Logear entrada
        print(f"\n[DEBUG] get_dashboard_metrics()")
        print(f"  - codigo_grupo: {codigo_grupo} (type: {type(codigo_grupo).__name__})")
        print(f"  - fecha: {fecha} (type: {type(fecha).__name__})")
        
        # 1. Obtener todas las interacciones de asistente aplicando filtros
        query = supabase.table("interacciones").select("*").eq("rol", "assistant")
        
        # Aplicar filtros opcionales
        if codigo_grupo:
            print(f"  - Aplicando filtro codigo_grupo: {codigo_grupo}")
            query = query.eq("codigo_grupo", codigo_grupo)
        
        # Filtrar por fecha específica (solo comparar el día, ignorar hora)
        if fecha:
            print(f"  - Aplicando filtro fecha: {fecha}")
            query = query.gte("created_at", f"{fecha}T00:00:00")
            query = query.lt("created_at", f"{fecha}T23:59:59")
        
        print(f"  - Ejecutando query a Supabase...")
        interacciones = query.order("created_at", desc=False).execute().data
        print(f"  - Interacciones obtenidas: {len(interacciones) if interacciones else 0}")
        
        # Si no hay datos, retornar valores por defecto (0)
        if not interacciones:
            print(f"  - ⚠️ Sin datos, retornando valores por defecto")
            return {
                "status": "success",
                "inter_total": 0,
                "relev_prom": 0,
                "Promedio_calidad": 0,
                "calidad_promedio_data": [],
                "Cada_funcion": _get_empty_functions(),
                "total_relevantes": 0,
                "Total_irrelevantes": 0,
                "calidad_0": 0,
                "calidad_1": 0,
                "calidad_2": 0,
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
                "promedio_calidad": inter.get("calidad_respuesta", 0)
            })
        
        # 5. Calcular promedios de calidad
        # Filtrar valores None y usar 0 como default
        calidades = [inter.get("calidad_respuesta") or 0 for inter in interacciones]
        promedio_calidad = round(sum(calidades) / len(calidades), 2) if calidades else 0
        
        # Contar por puntuación (0, 1, 2)
        calidad_0 = sum(1 for c in calidades if c == 0)
        calidad_1 = sum(1 for c in calidades if c == 1)
        calidad_2 = sum(1 for c in calidades if c == 2)
        
        # 6. Datos para gráfica de Funciones (Donut)
        funciones_count = {}
        for inter in interacciones:
            # Normalizar el nombre de función desde la BD a la clave esperada
            funcion_raw = inter.get("funcion_utilizada", "Otras")
            funcion_normalizada = _normalizar_funcion(funcion_raw)
            funciones_count[funcion_normalizada] = funciones_count.get(funcion_normalizada, 0) + 1
        
        cada_funcion = _calcular_funciones(funciones_count)
        
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
        error_msg = str(e)
        print(f"  - [ERROR] en get_dashboard_metrics: {error_msg}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": error_msg,
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
    limit: int = 50,
):
    """
    Obtiene mensajes recientes del dashboard (últimas N interacciones de asistente).
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Código del grupo para filtrar (opcional)
        fecha: Fecha específica (formato ISO: YYYY-MM-DD) para filtrar solo ese día (opcional)
        limit: Número máximo de mensajes a retornar (default: 50)
    
    Returns:
        List de mensajes
    """
    
    try:
        query = supabase.table("interacciones").select(
            "id, contenido, es_relevante, calidad_respuesta, funcion_utilizada, created_at, rol"
        ).eq("rol", "assistant")
        
        if codigo_grupo:
            query = query.eq("codigo_grupo", codigo_grupo)
        
        # Filtrar por fecha específica (solo comparar el día, ignorar hora)
        if fecha:
            query = query.gte("created_at", f"{fecha}T00:00:00")
            query = query.lt("created_at", f"{fecha}T23:59:59")
        
        mensajes = query.order("created_at", desc=True).limit(limit).execute().data
        
        return {
            "status": "success",
            "data": mensajes,
            "total": len(mensajes)
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": [],
            "total": 0
        }


def get_grupos_list(supabase: Client):
    """
    Obtiene lista de todos los grupos disponibles.
    
    Returns:
        List de grupos con estructura esperada por el frontend
    """
    
    try:
        grupos_raw = supabase.table("grupos").select("id, codigo_grupo, area_curricular, eje_ambiental, problematica, grado").execute().data
        
        # Mapear campos de BD a estructura que espera el frontend
        grupos_formateados = []
        for grupo in grupos_raw:
            grupo_formateado = {
                "id": grupo.get("id"),
                "code": grupo.get("codigo_grupo"),  # Mapear codigo_grupo → code
                "area": grupo.get("area_curricular", ""),
                "eje": grupo.get("eje_ambiental", ""),
                "macroEje": grupo.get("area_curricular", ""),  # Usar area_curricular como macroEje por defecto
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
    Normaliza los valores de funcion_utilizada de la BD a las claves esperadas.
    
    Mapea valores como "Análisis", "Síntesis", etc. a las claves internas
    del sistema de categorización.
    """
    
    # Mapping de valores BD → claves internas
    mapping = {
        "Análisis": "orientación_metodológica",
        "Síntesis": "redacción",
        "Generación": "generación_ideas",
        "Evaluación": "evaluación",
        "Otros": "búsqueda_información",
        "General": "revisión_teórica",
    }
    
    # Normalizar: convertir a minúsculas y buscar
    funcion_lower = funcion_raw.lower().strip() if funcion_raw else "general"
    
    # Buscar coincidencia en el mapping (case-insensitive)
    for key, value in mapping.items():
        if key.lower() == funcion_lower:
            return value
    
    # Si no encuentra, retornar una categoría por defecto
    return "búsqueda_información"

def _calcular_funciones(funciones_count: dict) -> list:
    """
    Convierte un diccionario de conteo de funciones a una lista con colores y porcentajes.
    """
    
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
    
    # Calcular total
    total = sum(funciones_count.values())
    
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
    """Retorna estructura vacía de funciones para cuando no hay datos."""
    
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
