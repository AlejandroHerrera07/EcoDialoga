#!/usr/bin/env python3
"""
Test rápido para verificar si el backend dashboard funciona
Ejecutar: python api/test_backend_simple.py
"""

import requests
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:4000/api"
DEBUG_ENDPOINT = f"{BASE_URL}/debug/interacciones-count"
METRICS_ENDPOINT = f"{BASE_URL}/teacher/metrics"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_debug_endpoint():
    """Prueba el endpoint de debug sin autenticación"""
    print_header("TEST 1: Endpoint de Debug (Sin Autenticación)")
    
    try:
        print(f"GET {DEBUG_ENDPOINT}")
        response = requests.get(DEBUG_ENDPOINT)
        
        print(f"Status: {response.status_code}")
        data = response.json()
        
        print(f"Total registros en tabla: {data.get('total')}")
        print(f"Registros con rol='assistant': {data.get('assistant_count')}")
        print(f"Registros con rol='user': {data.get('user_count')}")
        
        if data.get('assistant_count', 0) == 0:
            print("\n⚠️  PROBLEMA DETECTADO: No hay datos con rol='assistant'")
            print("   Verifica que los datos se están guardando en el chat")
            return False
        else:
            print(f"\n✓ Hay {data.get('assistant_count')} registros de assistant")
            return True
            
    except requests.exceptions.ConnectionError:
        print("✗ Error: No se puede conectar al servidor")
        print(f"  Verifica que el servidor está corriendo en {BASE_URL}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_metrics_endpoint_no_auth():
    """Prueba el endpoint de metrics sin autenticación"""
    print_header("TEST 2: Endpoint de Metrics (Sin Autenticación)")
    
    try:
        print(f"GET {METRICS_ENDPOINT}")
        response = requests.get(METRICS_ENDPOINT)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Retorna 401 (autenticación requerida)")
            print("  Esto es esperado - el endpoint está protegido")
            return True
        elif response.status_code == 200:
            data = response.json()
            print(f"✓ Retorna 200 - OK")
            print(f"  Inter_total: {data.get('inter_total')}")
            print(f"  Status: {data.get('status')}")
            return True
        else:
            print(f"✗ Status inesperado: {response.status_code}")
            print(f"  Respuesta: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Error de conexión")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_metrics_endpoint_with_token():
    """Prueba el endpoint CON token (simula autenticación del frontend)"""
    print_header("TEST 3: Endpoint de Metrics (Con Token Simulado)")
    
    # Por ahora solo mostraremos cómo hacerlo
    print("Este test requiere un token válido.")
    print("Para obtenerlo:")
    print("  1. Abre el navegador y loguéate")
    print("  2. Abre DevTools (F12)")
    print("  3. En Console ejecuta: localStorage.getItem('eco_token')")
    print("  4. Copia el token y úsalo aquí")
    print("\nEjemplo:")
    print('  headers = {"Authorization": "Bearer <tu_token>"}')
    print(f'  response = requests.get("{METRICS_ENDPOINT}", headers=headers)')
    
    return None  # No implementado aún

if __name__ == "__main__":
    print("\n🔍 TEST DE BACKEND - DASHBOARD SIN FILTROS")
    print(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    
    # Ejecutar tests
    test1_ok = test_debug_endpoint()
    test2_ok = test_metrics_endpoint_no_auth()
    test3_info = test_metrics_endpoint_with_token()
    
    # Resumen
    print_header("RESUMEN")
    
    print("Estados de pruebas:")
    print(f"  ✓ Test 1 (Debug endpoint): {'PASÓ' if test1_ok else 'FALLÓ'}")
    print(f"  ✓ Test 2 (Metrics sin auth): {'PASÓ' if test2_ok is not None else 'INFO'}")
    
    if test1_ok and test2_ok:
        print("\n✓ Backend aparentemente funciona correctamente")
        print("  Si el dashboard sigue sin mostrar datos, el problema está en:")
        print("  - Autenticación del frontend")
        print("  - Tratamiento de respuesta en el cliente")
    elif not test1_ok:
        print("\n✗ PROBLEMA DETECTADO: Sin datos en la tabla")
        print("  Acciones:")
        print("  - Verifica que el chat está guardando datos")
        print("  - Revisa que rol='assistant' está siendo guardado")
        print("  - Ejecuta el script de inserción de datos de prueba")
    
    print("\n" + "="*60 + "\n")
