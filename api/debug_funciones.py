"""
Script de Debugging para verificar qué valores reales de funciones_utilizada
existen en la BD y cómo se están procesando en _calcular_funciones
"""

from database import get_supabase_client
from dashboard import _calcular_funciones, get_dashboard_metrics

def debug_funciones_en_bd():
    """Consulta la BD directamente para ver qué valores tiene funcion_utilizada"""
    
    supabase = get_supabase_client()
    
    print("\n" + "="*80)
    print("DEBUG: FUNCIONES EN BASE DE DATOS")
    print("="*80)
    
    # Obtener todas las interacciones de asistente
    try:
        interacciones = supabase.table("interacciones").select("*").eq("rol", "assistant").execute().data
        
        print(f"\n✓ Total de interacciones encontradas: {len(interacciones)}")
        
        # Extraer todos los valores únicos de funcion_utilizada
        funciones_encontradas = {}
        print("\n📊 VALORES ÚNICOS EN 'funcion_utilizada':")
        print("-" * 80)
        
        for inter in interacciones:
            funcion = inter.get("funcion_utilizada", "NULL")
            if funcion not in funciones_encontradas:
                funciones_encontradas[funcion] = 0
            funciones_encontradas[funcion] += 1
        
        # Mostrar conteos
        for funcion, count in sorted(funciones_encontradas.items(), key=lambda x: x[1], reverse=True):
            print(f"  '{funcion}': {count} interacciones")
        
        # Verificar si coinciden con las funciones predefinidas
        funciones_predefinidas = {
            "redacción": "Redacción / mejora de texto",
            "generación_ideas": "Generación de ideas",
            "orientación_metodológica": "Orientación metodológica",
            "búsqueda_información": "Búsqueda de información",
            "revisión_teórica": "Revisión teórica",
            "evaluación": "Evaluación",
        }
        
        print("\n🔍 VERIFICACIÓN DE COINCIDENCIAS:")
        print("-" * 80)
        print("Claves esperadas en código vs valores encontrados en BD:\n")
        
        for key in funciones_predefinidas:
            coincide = key in funciones_encontradas
            estado = "✓ COINCIDE" if coincide else "✗ NO COINCIDE"
            count = funciones_encontradas.get(key, 0)
            print(f"  '{key}': {estado} (count: {count})")
        
        print("\n" + "-" * 80)
        print("Valores en BD que NO coinciden con código:")
        for funcion in funciones_encontradas:
            if funcion not in funciones_predefinidas:
                print(f"  ✗ '{funcion}': NO tiene equivalente en código (count: {funciones_encontradas[funcion]})")
        
    except Exception as e:
        print(f"❌ Error consultando BD: {str(e)}")


def debug_calcular_funciones():
    """Simula el procesamiento de _calcular_funciones con datos reales"""
    
    supabase = get_supabase_client()
    
    print("\n" + "="*80)
    print("DEBUG: PROCESAMIENTO EN _calcular_funciones()")
    print("="*80)
    
    try:
        # Obtener interacciones
        interacciones = supabase.table("interacciones").select("*").eq("rol", "assistant").execute().data
        
        # Crear diccionario de conteos (igual que en get_dashboard_metrics)
        funciones_count = {}
        for inter in interacciones:
            funcion = inter.get("funcion_utilizada", "Otras")
            funciones_count[funcion] = funciones_count.get(funcion, 0) + 1
        
        print(f"\n📥 Entrada a _calcular_funciones:")
        print(f"   Diccionario de conteos: {funciones_count}")
        
        # Llamar la función
        resultado = _calcular_funciones(funciones_count)
        
        print(f"\n📤 Salida de _calcular_funciones:")
        print("-" * 80)
        
        for funcion in resultado:
            cuenta = funcion.get("count", 0)
            porcentaje = funcion.get("value", 0)
            label = funcion.get("label", "")
            estado = "✓ CON DATOS" if cuenta > 0 else "✗ SIN DATOS"
            print(f"  {estado} | {label}: {cuenta} ({porcentaje}%)")
        
        # Verificar si alguno tiene datos
        totales_con_datos = sum(1 for f in resultado if f.get("count", 0) > 0)
        print(f"\n   Funciones con datos: {totales_con_datos}/6")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def debug_endpoint_completo():
    """Muestra la respuesta completa del endpoint"""
    
    print("\n" + "="*80)
    print("DEBUG: RESPUESTA DEL ENDPOINT /teacher/metrics")
    print("="*80)
    
    try:
        supabase = get_supabase_client()
        metrics = get_dashboard_metrics(supabase)
        
        print("\n📊 Métricas obtenidas:")
        print(f"   - Total interacciones: {metrics.get('inter_total')}")
        print(f"   - Estado: {metrics.get('status')}")
        
        cada_funcion = metrics.get('Cada_funcion', [])
        print(f"\n📈 Gráfica de Funciones (Cada_funcion):")
        print("-" * 80)
        
        for func in cada_funcion:
            count = func.get('count', 0)
            value = func.get('value', 0)
            label = func.get('label', '')
            status = "✓" if count > 0 else "✗"
            print(f"   {status} {label}: {count} ({value}%)")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("\n🔧 SCRIPT DE DEBUG - ANÁLISIS DE FUNCIONES EN DASHBOARD\n")
    
    debug_funciones_en_bd()
    debug_calcular_funciones()
    debug_endpoint_completo()
    
    print("\n" + "="*80)
    print("Fin del debug")
    print("="*80 + "\n")
