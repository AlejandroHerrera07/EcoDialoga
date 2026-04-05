"""
Health check tool para diagnosticar problemas del backend en tiempo real
Ejecutar: python api/health_check.py
"""

import requests
import subprocess
import os
import json
import time
from datetime import datetime
from pathlib import Path

BASE_URL = "http://localhost:5000"  # Cambiar a URL de production si es necesario

class HealthChecker:
    
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url
        self.results = {}
    
    def print_section(self, title):
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")
    
    def check_backend_alive(self):
        """Verifica que el backend esté respondiendo"""
        self.print_section("1️⃣  Backend Status")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                print("✓ Backend respondiendo")
                print(f"  Response: {response.json()}")
                self.results["backend_alive"] = True
            else:
                print(f"✗ Backend retorna {response.status_code}")
                self.results["backend_alive"] = False
        except Exception as e:
            print(f"✗ Backend NO responde: {str(e)}")
            self.results["backend_alive"] = False
    
    def check_database(self):
        """Verifica conexión a Supabase"""
        self.print_section("2️⃣  Database Connection")
        
        try:
            response = requests.get(f"{self.base_url}/api/health/db", timeout=10)
            if response.status_code == 200:
                print("✓ Base de datos conectada")
                self.results["db_connected"] = True
            else:
                print(f"✗ DB check falló: {response.status_code}")
                self.results["db_connected"] = False
        except Exception as e:
            print(f"✗ DB check error: {str(e)}")
            self.results["db_connected"] = False
    
    def check_openai_connectivity(self):
        """Verifica que OpenAI API esté accesible"""
        self.print_section("3️⃣  OpenAI API")
        
        try:
            response = requests.get(f"{self.base_url}/api/health/openai", timeout=10)
            if response.status_code == 200:
                print("✓ OpenAI API accesible")
                self.results["openai_ok"] = True
            else:
                print(f"✗ OpenAI check falló: {response.status_code}")
                self.results["openai_ok"] = False
        except Exception as e:
            print(f"✗ OpenAI check error: {str(e)}")
            self.results["openai_ok"] = False
    
    def check_worker_status(self):
        """Verifica número de gunicorn workers"""
        self.print_section("4️⃣  Gunicorn Workers")
        
        try:
            response = requests.get(f"{self.base_url}/api/health/workers", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Workers activos: {data.get('active_workers', 'N/A')}")
                print(f"  Total configured: {data.get('total_workers', 'N/A')}")
                self.results["workers"] = data
            else:
                print("✗ No se pudo obtener status de workers")
        except Exception as e:
            print(f"✗ Workers check error: {str(e)}")
    
    def check_recent_errors(self):
        """Lee archivo de errores recientes"""
        self.print_section("5️⃣  Recent Errors (logs/errors.log)")
        
        error_file = Path("api/logs/errors.log")
        if error_file.exists():
            try:
                # Leer últimas 20 líneas
                with open(error_file, 'r') as f:
                    lines = f.readlines()
                
                if lines:
                    print("✓ Archivo de errores encontrado")
                    print("\n  Últimos 10 errores:")
                    for line in lines[-10:]:
                        print(f"  {line.rstrip()}")
                else:
                    print("✓ Sin errores registrados")
            except Exception as e:
                print(f"✗ Error leyendo log: {str(e)}")
        else:
            print("⚠ Archivo de errores no encontrado")
    
    def check_response_times(self):
        """Prueba tiempos de respuesta con múltiples llamadas"""
        self.print_section("6️⃣  Response Times")
        
        times = []
        print("  Enviando 5 health checks...")
        
        for i in range(5):
            try:
                start = time.time()
                response = requests.get(f"{self.base_url}/health", timeout=5)
                elapsed = (time.time() - start) * 1000  # ms
                times.append(elapsed)
                print(f"    {i+1}. {elapsed:.1f}ms")
            except Exception as e:
                print(f"    {i+1}. ERROR: {str(e)}")
        
        if times:
            print(f"\n  Min: {min(times):.1f}ms")
            print(f"  Max: {max(times):.1f}ms")
            print(f"  Avg: {sum(times)/len(times):.1f}ms")
    
    def check_logs_exist(self):
        """Verifica que los archivos de log existan"""
        self.print_section("7️⃣  Log Files")
        
        log_files = [
            "api/logs/backend.log",
            "api/logs/errors.log",
            "api/logs/requests.log"
        ]
        
        for log_file in log_files:
            if Path(log_file).exists():
                size_mb = Path(log_file).stat().st_size / (1024*1024)
                print(f"✓ {log_file} ({size_mb:.2f} MB)")
            else:
                print(f"⚠ {log_file} - NOT FOUND")
    
    def get_procfile_config(self):
        """Lee configuración de Procfile"""
        self.print_section("8️⃣  Procfile Configuration")
        
        procfile = Path("Procfile")
        if procfile.exists():
            with open(procfile, 'r') as f:
                content = f.read()
            print(f"✓ Procfile:\n{content}")
            
            # Analizar configuración
            if "gunicorn" in content:
                import re
                match = re.search(r'-w (\d+)', content)
                if match:
                    workers = int(match.group(1))
                    print(f"\n⚠️  Gunicorn workers: {workers}")
                    if workers < 8:
                        print("   👉 Para 5+ usuarios concurrentes, recomendamos 8+ workers")
        else:
            print("⚠ Procfile no encontrado")
    
    def generate_report(self):
        """Genera reporte final"""
        self.print_section("📋 REPORTE FINAL")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "backend_url": self.base_url,
            "checks": self.results
        }
        
        # Detector de problemas
        issues = []
        
        if not self.results.get("backend_alive"):
            issues.append("❌ Backend no responde - verificar si está corriendo")
        
        if not self.results.get("db_connected"):
            issues.append("❌ Base de datos no conectada")
        
        if not self.results.get("openai_ok"):
            issues.append("⚠️  OpenAI API no responde - puede causar timeouts")
        
        if issues:
            print("\n🚨 PROBLEMAS DETECTADOS:\n")
            for issue in issues:
                print(f"  {issue}")
        else:
            print("\n✓ Todos los chequeos pasaron!\n")
        
        return report
    
    def run_all_checks(self):
        """Ejecuta todos los chequeos"""
        print(f"\n🔍 EcoProfe Backend Health Check")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Target: {self.base_url}\n")
        
        self.check_backend_alive()
        if self.results.get("backend_alive"):
            self.check_database()
            self.check_openai_connectivity()
            self.check_worker_status()
            self.check_response_times()
        
        self.check_logs_exist()
        self.check_recent_errors()
        self.get_procfile_config()
        
        report = self.generate_report()
        
        # Guardar reporte
        with open("health_check_report.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Reporte guardado en: health_check_report.json\n")


if __name__ == "__main__":
    checker = HealthChecker(BASE_URL)
    checker.run_all_checks()
