#!/usr/bin/env python3
"""
Script para verificar y debuggear el problema del dashboard sin filtros
Prueba:
1. Si hay datos en la tabla interacciones
2. Si el endpoint /teacher/metrics funciona sin parámetros
3. Qué datos se retornan
"""

import sys
import json
from datetime import datetime

# Importar funciones necesarias
from database import get_supabase_client
from dashboard import get_dashboard_metrics, get_recent_messages

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_database_connection():
    """Prueba si la conexión a Supabase funciona"""
    print_section("1. PRUEBA DE CONEXIÓN A SUPABASE")
    
    try:
        supabase = get_supabase_client()
        print("✓ Conexión a Supabase establecida exitosamente")
        return supabase
    except Exception as e:
        print(f"✗ Error conectando a Supabase: {e}")
        return None

def test_data_in_table(supabase):
    """Verifica si hay datos en la tabla interacciones"""
    print_section("2. VERIFICACIÓN DE DATOS EN TABLA")
    
    try:
        # Contar total de registros
        result_all = supabase.table("interacciones").select("count", count="exact").execute()
        total_count = result_all.count if result_all.count else 0
        print(f"Total registros en tabla: {total_count}")
        
        # Contar solo assistant
        result_assistant = supabase.table("interacciones").select("*").eq("rol", "assistant").execute()
        assistant_count = len(result_assistant.data) if result_assistant.data else 0
        print(f"Registros con rol='assistant': {assistant_count}")
        
        # Contar solo user
        result_user = supabase.table("interacciones").select("*").eq("rol", "user").execute()
        user_count = len(result_user.data) if result_user.data else 0
        print(f"Registros con rol='user': {user_count}")
        
        if assistant_count == 0:
            print("\n⚠️  AVISO: No hay registros con rol='assistant'")
            print("   Esto podría ser la razón por la que no hay datos sin filtros")
        
        return assistant_count > 0
        
    except Exception as e:
        print(f"✗ Error consultando tabla: {e}")
        return False

def test_metrics_without_filters(supabase):
    """Prueba get_dashboard_metrics sin parámetros"""
    print_section("3. PRUEBA DE METRICS SIN FILTROS")
    
    try:
        print("Llamando: get_dashboard_metrics(supabase)")
        metrics = get_dashboard_metrics(supabase)
        
        print(f"Status: {metrics.get('status')}")
        print(f"Total interacciones: {metrics.get('inter_total')}")
        print(f"Relevancia promedio: {metrics.get('relev_prom')}%")
        print(f"Promedio calidad: {metrics.get('Promedio_calidad')}")
        
        cada_funcion = metrics.get('Cada_funcion', [])
        print(f"\nFunciones detectadas: {len(cada_funcion)}")
        for func in cada_funcion:
            count = func.get('count', 0)
            value = func.get('value', 0)
            label = func.get('label', 'N/A')
            if count > 0:
                print(f"  ✓ {label}: {count} ({value}%)")
        
        # Verificar si hay datos
        if metrics.get('inter_total', 0) > 0:
            print("\n✓ Hay datos disponibles sin filtros")
            return True
        else:
            print("\n✗ Sin datos (inter_total = 0)")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_metrics_with_group(supabase):
    """Prueba get_dashboard_metrics con código_grupo"""
    print_section("4. PRUEBA DE METRICS CON FILTRO DE GRUPO")
    
    try:
        # Primero obtener una lista de grupos disponibles
        grupos = supabase.table("grupos").select("codigo_grupo").limit(1).execute().data
        
        if not grupos:
            print("✗ No hay grupos en la base de datos")
            return False
        
        group_code = grupos[0]["codigo_grupo"]
        print(f"Usando grupo: {group_code}")
        print(f"Llamando: get_dashboard_metrics(supabase, codigo_grupo='{group_code}')")
        
        metrics = get_dashboard_metrics(supabase, codigo_grupo=group_code)
        
        print(f"Status: {metrics.get('status')}")
        print(f"Total interacciones: {metrics.get('inter_total')}")
        
        if metrics.get('inter_total', 0) > 0:
            print(f"✓ Hay datos para el grupo {group_code}")
            return True
        else:
            print(f"✗ Sin datos para el grupo {group_code}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_api_endpoint_simulation():
    """Simula lo que hace el endpoint /teacher/metrics"""
    print_section("5. SIMULACIÓN DEL ENDPOINT /teacher/metrics")
    
    try:
        supabase = get_supabase_client()
        
        print("Simulando: GET /teacher/metrics (sin parámetros)")
        # Sin parámetros
        metrics = get_dashboard_metrics(supabase)
        
        # Convertir a JSON como lo haría Flask
        response = {
            "status": metrics.get("status"),
            "inter_total": metrics.get("inter_total"),
            "relev_prom": metrics.get("relev_prom"),
            "Promedio_calidad": metrics.get("Promedio_calidad"),
            "Cada_funcion": metrics.get("Cada_funcion"),
            "total_relevantes": metrics.get("total_relevantes"),
            "Total_irrelevantes": metrics.get("Total_irrelevantes"),
        }
        
        print("Respuesta (ejemplo):")
        # Mostrar resumido
        print(f"  status: {response['status']}")
        print(f"  inter_total: {response['inter_total']}")
        print(f"  Promedio_calidad: {response['Promedio_calidad']}")
        print(f"  Funciones con datos: {sum(1 for f in response['Cada_funcion'] if f.get('count', 0) > 0)}")
        
        if response['inter_total'] == 0:
            print("\n✗ PROBLEMA: El endpoint retorna 0 interacciones sin filtros")
            return False
        else:
            print("\n✓ El endpoint retorna datos correctamente")
            return True
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🔍 SCRIPT DE DEBUG - DASHBOARD SIN FILTROS")
    print(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas en orden
    supabase = test_database_connection()
    
    if not supabase:
        print("\n✗ No se puede continuar sin conexión a Supabase")
        sys.exit(1)
    
    # Verificar datos
    has_data = test_data_in_table(supabase)
    
    # Probar sin filtros
    works_without_filters = test_metrics_without_filters(supabase)
    
    # Probar con grupo
    works_with_group = test_metrics_with_group(supabase)
    
    # Simular endpoint
    endpoint_works = test_api_endpoint_simulation()
    
    # Resumen
    print_section("RESUMEN DE RESULTADOS")
    
    print("\nPruebas ejecutadas:")
    print(f"  {'✓' if has_data else '✗'} Hay datos de assistant en BD")
    print(f"  {'✓' if works_without_filters else '✗'} Metrics sin filtros funciona")
    print(f"  {'✓' if works_with_group else '✗'} Metrics con grupo funciona")
    print(f"  {'✓' if endpoint_works else '✗'} Endpoint retorna datos correctos")
    
    if not works_without_filters:
        print("\n⚠️  PROBLEMA DETECTADO: Las métricas sin filtros no funcionan correctamente")
        print("   Verifica:")
        print("   1. Que haya datos en la tabla interacciones")
        print("   2. Que los datos tengan rol='assistant'")
        print("   3. Los valores de los campos esperados")
    
    print("\n"+ "="*80 + "\n")
