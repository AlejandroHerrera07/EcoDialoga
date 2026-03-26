"""
Módulo de exportación de datos a CSV
"""

import csv
import io
import zipfile
from datetime import datetime
from supabase import Client
from dashboard import get_dashboard_metrics


def export_data_to_zip(supabase: Client, codigo_grupo: str = None):
    """
    Genera un ZIP con 5 CSVs que contienen TODOS los registros de las tablas
    (sin filtrar por grupo), pero solo con las columnas especificadas:
    
    1. grupos.csv - Todas las filas con: id, codigo_grupo, area_curricular, area_transversal, eje_ambiental, problematica, grado, created_at
    2. usuarios.csv (estudiantes) - Todas las filas con: id, identificador_estudiante, codigo_grupo, nombre_anonimo, rol, consentimiento, created_at
    3. sesiones.csv - Todas las filas con: id, codigo_grupo, momento_proceso, fecha_inicio
    4. interacciones.csv - Todas las filas con: id, sesion_id, identificador_estudiante, codigo_grupo, reply_to, contenido, rol, es_relevante, funcion_utilizada, created_at
    5. resumen.csv (estadísticas del dashboard)
    
    Args:
        supabase: Cliente de Supabase
        codigo_grupo: Parámetro preservado para compatibilidad futura (actualmente ignorado)
    
    Returns:
        BytesIO con el ZIP generado
    """
    
    # Crear archivo ZIP en memoria
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Exportar GRUPOS
        grupos_csv = _export_grupos(supabase, codigo_grupo)
        zip_file.writestr('grupos.csv', grupos_csv)
        
        # 2. Exportar ESTUDIANTES
        estudiantes_csv = _export_estudiantes(supabase, codigo_grupo)
        zip_file.writestr('usuarios.csv', estudiantes_csv)
        
        # 3. Exportar SESIONES
        sesiones_csv = _export_sesiones(supabase, codigo_grupo)
        zip_file.writestr('sesiones.csv', sesiones_csv)
        
        # 4. Exportar INTERACCIONES
        interacciones_csv = _export_interacciones(supabase, codigo_grupo)
        zip_file.writestr('interacciones.csv', interacciones_csv)
        
        # 5. Exportar RESUMEN (Dashboard)
        resumen_csv = _export_resumen(supabase, codigo_grupo)
        zip_file.writestr('resumen.csv', resumen_csv)
    
    zip_buffer.seek(0)
    return zip_buffer


# ─────────────────────────────────────────────
# Funciones de exportación por tabla
# ─────────────────────────────────────────────

def _export_grupos(supabase: Client, codigo_grupo: str = None) -> str:
    """Exporta tabla grupos con columnas: id, codigo_grupo, area_curricular, etc."""
    
    try:
        query = supabase.table("grupos").select("id, codigo_grupo, area_curricular, area_transversal, eje_ambiental, problematica, grado, created_at")
        
        # NO filtrar por grupo - exportar TODOS
        data = query.execute().data
        
        # Crear CSV en memoria
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=['id', 'codigo_grupo', 'area_curricular', 'area_transversal', 'eje_ambiental', 'problematica', 'grado', 'created_at']
        )
        
        writer.writeheader()
        for row in data:
            writer.writerow({
                'id': row.get('id', ''),
                'codigo_grupo': row.get('codigo_grupo', ''),
                'area_curricular': row.get('area_curricular', ''),
                'area_transversal': row.get('area_transversal', ''),
                'eje_ambiental': row.get('eje_ambiental', ''),
                'problematica': row.get('problematica', ''),
                'grado': row.get('grado', ''),
                'created_at': row.get('created_at', '')
            })
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error exportando grupos: {str(e)}")
        return ""


def _export_estudiantes(supabase: Client, codigo_grupo: str = None) -> str:
    """Exporta tabla estudiantes con columnas: id, identificador_estudiante, codigo_grupo, etc."""
    
    try:
        query = supabase.table("estudiantes").select("id, identificador_estudiante, codigo_grupo, nombre_anonimo, rol, consentimiento, created_at")
        
        # NO filtrar por grupo - exportar TODOS
        data = query.execute().data
        
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=['id', 'identificador_estudiante', 'codigo_grupo', 'nombre_anonimo', 'rol', 'consentimiento', 'created_at']
        )
        
        writer.writeheader()
        for row in data:
            writer.writerow({
                'id': row.get('id', ''),
                'identificador_estudiante': row.get('identificador_estudiante', ''),
                'codigo_grupo': row.get('codigo_grupo', ''),
                'nombre_anonimo': row.get('nombre_anonimo', ''),
                'rol': row.get('rol', ''),
                'consentimiento': row.get('consentimiento', ''),
                'created_at': row.get('created_at', '')
            })
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error exportando estudiantes: {str(e)}")
        return ""


def _export_sesiones(supabase: Client, codigo_grupo: str = None) -> str:
    """Exporta tabla sesiones con columnas: id, codigo_grupo, momento_proceso, fecha_inicio."""
    
    try:
        query = supabase.table("sesiones").select("id, codigo_grupo, momento_proceso, fecha_inicio")
        
        # NO filtrar por grupo - exportar TODOS
        data = query.execute().data
        
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=['id', 'codigo_grupo', 'momento_proceso', 'fecha_inicio']
        )
        
        writer.writeheader()
        for row in data:
            writer.writerow({
                'id': row.get('id', ''),
                'codigo_grupo': row.get('codigo_grupo', ''),
                'momento_proceso': row.get('momento_proceso', ''),
                'fecha_inicio': row.get('fecha_inicio', '')
            })
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error exportando sesiones: {str(e)}")
        return ""


def _export_interacciones(supabase: Client, codigo_grupo: str = None) -> str:
    """Exporta tabla interacciones con columnas especificadas."""
    
    try:
        query = supabase.table("interacciones").select("id, sesion_id, identificador_estudiante, codigo_grupo, reply_to, contenido, rol, es_relevante, calidad_respuesta, funcion_utilizada, created_at")
        
        # NO filtrar por grupo - exportar TODOS
        data = query.execute().data
        
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=['id', 'sesion_id', 'identificador_estudiante', 'codigo_grupo', 'reply_to', 'contenido', 'rol', 'es_relevante', 'calidad_respuesta', 'funcion_utilizada', 'created_at']
        )
        
        writer.writeheader()
        for row in data:
            writer.writerow({
                'id': row.get('id', ''),
                'sesion_id': row.get('sesion_id', ''),
                'identificador_estudiante': row.get('identificador_estudiante', ''),
                'codigo_grupo': row.get('codigo_grupo', ''),
                'reply_to': row.get('reply_to', ''),
                'contenido': row.get('contenido', '')[:500],  # Limitar contenido a 500 caracteres
                'rol': row.get('rol', ''),
                'es_relevante': row.get('es_relevante', ''),
                'calidad_respuesta': row.get('calidad_respuesta', ''),
                'funcion_utilizada': row.get('funcion_utilizada', ''),
                'created_at': row.get('created_at', '')
            })
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error exportando interacciones: {str(e)}")
        return ""


def _export_resumen(supabase: Client, codigo_grupo: str = None) -> str:
    """Exporta resumen con estadísticas del dashboard."""
    
    try:
        # Obtener métricas del dashboard
        metrics = get_dashboard_metrics(supabase, codigo_grupo=codigo_grupo)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escribir encabezado
        writer.writerow(['Métrica', 'Valor'])
        
        # Escribir datos
        resumen_data = [
            ['Fecha de exportación', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['Grupo filtrado', codigo_grupo or 'Todos'],
            ['', ''],
            ['INTERACCIONES', ''],
            ['Total de interacciones', metrics.get('inter_total', 0)],
            ['Interacciones relevantes', metrics.get('total_relevantes', 0)],
            ['Interacciones no relevantes', metrics.get('Total_irrelevantes', 0)],
            ['Porcentaje relevancia', f"{metrics.get('relev_prom', 0)}%"],
            ['', ''],
            ['CALIDAD', ''],
            ['Promedio de calidad', f"{metrics.get('Promedio_calidad', 0):.2f}"],
            ['Respuestas calidad 0 (irrelevantes)', metrics.get('calidad_0', 0)],
            ['Respuestas calidad 1 (parcialmente útiles)', metrics.get('calidad_1', 0)],
            ['Respuestas calidad 2 (excellentes)', metrics.get('calidad_2', 0)],
            ['', ''],
            ['FUNCIONES UTILIZADAS', ''],
        ]
        
        writer.writerows(resumen_data)
        
        # Agregar desglose de funciones
        if 'Cada_funcion' in metrics and metrics['Cada_funcion']:
            for func in metrics['Cada_funcion']:
                writer.writerow([
                    func.get('label', ''),
                    f"{func.get('count', 0)} ({func.get('value', 0):.1f}%)"
                ])
        
        return output.getvalue()
    
    except Exception as e:
        print(f"Error exportando resumen: {str(e)}")
        return ""
