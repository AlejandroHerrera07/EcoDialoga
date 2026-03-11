@echo off
REM ═══════════════════════════════════════════════════════════
REM Script de Instalación Rápida - EcoDialoga Backend
REM ═══════════════════════════════════════════════════════════
REM Este script automatiza la instalación del backend

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🌱 EcoDialoga - Instalación Rápida del Backend           ║
echo ║  (Windows PowerShell)                                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Detectar ubicación actual
echo 📁 Ubicación actual: %cd%
echo.

REM Verificar que estamos en la raíz del proyecto
if not exist "package.json" (
    echo ❌ ERROR: No se encuentra package.json
    echo   Asegúrate de estar en: C:\Users\alarc\OneDrive\Documentos\...Proyecto-EcoProfe-master
    echo.
    pause
    exit /b 1
)

echo ✓ Ubicación correcta detectada
echo.

REM ═══════════════════════════════════════════════════════════
REM Paso 1: Instalar dependencias del Frontend
REM ═══════════════════════════════════════════════════════════

echo ⏳ [1/4] Instalando dependencias del Frontend...
echo.

if exist "node_modules" (
    echo ℹ️  node_modules ya existe, saltando instalación de npm
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudo instalar dependencias del frontend
        pause
        exit /b 1
    )
)

echo ✓ Dependencias del frontend instaladas
echo.

REM ═══════════════════════════════════════════════════════════
REM Paso 2: Preparar Backend - Virtual Environment
REM ═══════════════════════════════════════════════════════════

cd api

echo ⏳ [2/4] Creando entorno virtual de Python...
echo.

if exist "venv" (
    echo ℹ️  Entorno virtual ya existe
    call venv\Scripts\activate.bat
) else (
    call python -m venv venv
    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudo crear virtualenv
        echo   Verifica que Python 3.8+ esté instalado
        cd ..
        pause
        exit /b 1
    )
    
    call venv\Scripts\activate.bat
)

echo ✓ Entorno virtual activado
echo.

REM ═══════════════════════════════════════════════════════════
REM Paso 3: Instalar dependencias de Python
REM ═══════════════════════════════════════════════════════════

echo ⏳ [3/4] Instalando dependencias de Python...
echo.

call pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudo instalar dependencias de Python
    pause
    exit /b 1
)

echo ✓ Dependencias de Python instaladas
echo.

REM ═══════════════════════════════════════════════════════════
REM Paso 4: Verificar configuración
REM ═══════════════════════════════════════════════════════════

echo ⏳ [4/4] Verificando configuración...
echo.

if exist ".env" (
    echo ✓ archivo .env encontrado
) else (
    echo ⚠️  Advertencia: No existe api\.env
)

cd ..

if exist ".env.local" (
    echo ✓ archivo .env.local encontrado
) else (
    echo ⚠️  Advertencia: No existe .env.local
)

REM ═══════════════════════════════════════════════════════════
REM Completado
REM ═══════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ INSTALACIÓN COMPLETADA                                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 🚀 PRÓXIMOS PASOS:
echo.
echo 1️⃣  Iniciar el Backend (en una terminal):
echo    cd api
echo    venv\Scripts\activate
echo    python -m flask run
echo.
echo 2️⃣  Iniciar el Frontend (en otra terminal):
echo    npm run dev
echo.
echo 3️⃣  Abre http://localhost:3000 en tu navegador
echo.
echo 📚 Para más información:
echo    - SETUP_BACKEND.md     ← Guía completa
echo    - TESTING_GUIDE.md     ← Cómo probar la integración
echo    - API_EXAMPLES.ts      ← Ejemplos de código
echo    - INTEGRATION_SUMMARY.md ← Resumen de cambios
echo.

pause
