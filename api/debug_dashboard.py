#!/usr/bin/env python3
"""
Script simple para debuggear el problema del dashboard
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_supabase_client
from dashboard import get_dashboard_metrics

def main():
    print("=" * 80)
    print("DEBUG: Dashboard Metrics Sin y Con Filtros")
    print("=" * 80)
    
    try:
        supabase = get_supabase_client()
        print("[OK] Conectado a Supabase\n")
        
        # Verificar datos en tabla
        print("-" * 80)
        print("1. Verificando datos en tabla 'interacciones'")
        print("-" * 80)
        all_data = supabase.table("interacciones").select("count", count="exact").execute()
        print(f"Total de registros: {all_data.count}")
        
        assistant_data = supabase.table("interacciones").select("*").eq("rol", "assistant").execute()
        print(f"Registros con rol='assistant': {len(assistant_data.data)}")
        
        # Obtener grupos disponibles
        grupos_data = supabase.table("grupos").select("codigo_grupo").execute()
        print(f"Grupos disponibles: {[g['codigo_grupo'] for g in grupos_data.data[:3]]}")
        
        # PRUEBA 1: Sin filtros
        print("\n" + "-" * 80)
        print("2. PRUEBA: Llamar get_dashboard_metrics() SIN filtros")
        print("-" * 80)
        metrics_sin_filtros = get_dashboard_metrics(supabase)
        print(f"Status: {metrics_sin_filtros.get('status')}")
        if metrics_sin_filtros.get('status') == 'error':
            print(f"ERROR MESSAGE: {metrics_sin_filtros.get('message')}")
        print(f"inter_total: {metrics_sin_filtros.get('inter_total')}")
        print(f"relev_prom: {metrics_sin_filtros.get('relev_prom')}")
        
        # PRUEBA 2: Con filtro de grupo
        if grupos_data.data:
            group_code = grupos_data.data[0]['codigo_grupo']
            print("\n" + "-" * 80)
            print(f"3. PRUEBA: Llamar get_dashboard_metrics() CON grupo={group_code}")
            print("-" * 80)
            metrics_con_grupo = get_dashboard_metrics(supabase, codigo_grupo=group_code)
            print(f"Status: {metrics_con_grupo.get('status')}")
            print(f"inter_total: {metrics_con_grupo.get('inter_total')}")
            print(f"relev_prom: {metrics_con_grupo.get('relev_prom')}")
            
            print("\n" + "-" * 80)
            print("COMPARACION")
            print("-" * 80)
            print(f"Sin filtros: {metrics_sin_filtros.get('inter_total')} interacciones (status: {metrics_sin_filtros.get('status')})")
            print(f"Con grupo {group_code}: {metrics_con_grupo.get('inter_total')} interacciones (status: {metrics_con_grupo.get('status')})")
            
            if metrics_sin_filtros.get('status') == 'error':
                print("\n[PROBLEMA ENCONTRADO]:")
                print("Sin filtros: retorna STATUS=error")
                print("Con filtro de grupo: retorna STATUS=success")
                print("\nMensaje de error:", metrics_sin_filtros.get('message'))
        
        # Informacion adicional
        print("\n" + "-" * 80)
        print("4. Verificacion de estructura de datos")
        print("-" * 80)
        if assistant_data.data:
            sample = assistant_data.data[0]
            print(f"Campos en interaccion: {list(sample.keys())}")
            print(f"Ejemplo codigo_grupo: {sample.get('codigo_grupo')}")
    
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
