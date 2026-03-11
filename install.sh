#!/bin/bash

# ═══════════════════════════════════════════════════════════
# Script de Instalación Rápida - EcoDialoga Backend
# ═══════════════════════════════════════════════════════════
# Este script automatiza la instalación del backend

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🌱 EcoDialoga - Instalación Rápida del Backend           ║"
echo "║  (macOS/Linux)                                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Detectar ubicación actual
echo "📁 Ubicación actual: $(pwd)"
echo ""

# Verificar que estamos en la raíz del proyecto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: No se encuentra package.json"
    echo "   Asegúrate de estar en el directorio raíz del proyecto"
    echo ""
    exit 1
fi

echo "✓ Ubicación correcta detectada"
echo ""

# ═══════════════════════════════════════════════════════════
# Paso 1: Instalar dependencias del Frontend
# ═══════════════════════════════════════════════════════════

echo "⏳ [1/4] Instalando dependencias del Frontend..."
echo ""

if [ -d "node_modules" ]; then
    echo "ℹ️  node_modules ya existe, saltando instalación de npm"
else
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: No se pudo instalar dependencias del frontend"
        exit 1
    fi
fi

echo "✓ Dependencias del frontend instaladas"
echo ""

# ═══════════════════════════════════════════════════════════
# Paso 2: Preparar Backend - Virtual Environment
# ═══════════════════════════════════════════════════════════

cd api

echo "⏳ [2/4] Creando entorno virtual de Python..."
echo ""

if [ -d "venv" ]; then
    echo "ℹ️  Entorno virtual ya existe"
    source venv/bin/activate
else
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: No se pudo crear virtualenv"
        echo "   Verifica que Python 3.8+ esté instalado"
        cd ..
        exit 1
    fi
    
    source venv/bin/activate
fi

echo "✓ Entorno virtual activado"
echo ""

# ═══════════════════════════════════════════════════════════
# Paso 3: Instalar dependencias de Python
# ═══════════════════════════════════════════════════════════

echo "⏳ [3/4] Instalando dependencias de Python..."
echo ""

pip install -r requirements.txt -q
if [ $? -ne 0 ]; then
    echo "❌ ERROR: No se pudo instalar dependencias de Python"
    exit 1
fi

echo "✓ Dependencias de Python instaladas"
echo ""

# ═══════════════════════════════════════════════════════════
# Paso 4: Verificar configuración
# ═══════════════════════════════════════════════════════════

echo "⏳ [4/4] Verificando configuración..."
echo ""

if [ -f ".env" ]; then
    echo "✓ archivo .env encontrado"
else
    echo "⚠️  Advertencia: No existe api/.env"
fi

cd ..

if [ -f ".env.local" ]; then
    echo "✓ archivo .env.local encontrado"
else
    echo "⚠️  Advertencia: No existe .env.local"
fi

# ═══════════════════════════════════════════════════════════
# Completado
# ═══════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALACIÓN COMPLETADA                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  Iniciar el Backend (en una terminal):"
echo "    cd api"
echo "    source venv/bin/activate"
echo "    python -m flask run"
echo ""
echo "2️⃣  Iniciar el Frontend (en otra terminal):"
echo "    npm run dev"
echo ""
echo "3️⃣  Abre http://localhost:3000 en tu navegador"
echo ""
echo "📚 Para más información:"
echo "    - SETUP_BACKEND.md     ← Guía completa"
echo "    - TESTING_GUIDE.md     ← Cómo probar la integración"
echo "    - API_EXAMPLES.ts      ← Ejemplos de código"
echo "    - INTEGRATION_SUMMARY.md ← Resumen de cambios"
echo ""

echo "Presiona Enter para continuar..."
read
