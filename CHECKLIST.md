# ✅ CHECKLIST DE INTEGRACIÓN BACKEND-FRONTEND

## 🎯 VERIFICACIÓN DE INSTALACIÓN

### Pre-requisitos
- [ ] Python 3.8+ instalado (`python --version`)
- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm disponible (`npm --version`)
- [ ] Acceso a Supabase con credenciales válidas
- [ ] Credenciales correctas en archivos `.env`

### Archivos Creados
- [ ] `api/auth.py` - Lógica de autenticación JWT
- [ ] `api/requirements.txt` - Dependencias Python
- [ ] `.env.local` - Variables frontend
- [ ] Actualizado: `api/.env` - Variables backend
- [ ] Actualizado: `api/index.py` - Endpoints de auth
- [ ] Actualizado: `lib/services/auth.service.ts` - USE_MOCK = false
- [ ] Actualizado: `lib/services/chat.service.ts` - USE_MOCK = false

### Documentación
- [ ] `SETUP_BACKEND.md` - Guía de instalación
- [ ] `INTEGRATION_SUMMARY.md` - Resumen de cambios
- [ ] `TESTING_GUIDE.md` - Tests de validación
- [ ] `API_EXAMPLES.ts` - Ejemplos de código
- [ ] `README_INTEGRATION.md` - Descripción general
- [ ] `install.bat` - Script Windows
- [ ] `install.sh` - Script macOS/Linux

---

## 🔧 PASOS DE CONFIGURACIÓN

### 1. Instalar Dependencias

#### Frontend
```
Tarea: npm install
Comando: npm install
Esperar: 2-5 minutos
Estado: [ ] Completado
```

#### Backend - Virtual Environment
```
Tarea: Crear venv
Comando: cd api && python -m venv venv
Esperar: 1-2 minutos
Estado: [ ] Completado
```

#### Backend - Dependencias Python
```
Tarea: pip install
Comando: pip install -r requirements.txt
Esperar: 2-3 minutos
Estado: [ ] Completado
```

### 2. Verificar Variables de Entorno

#### `.env.local` (Frontend)
```
[ ] NEXT_PUBLIC_API_URL=http://localhost:5000
[ ] NEXT_PUBLIC_SUPABASE_URL está presente
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY está presente
```

#### `api/.env` (Backend)
```
[ ] OPENAI_API_KEY está presente
[ ] AGENT_WORKFLOW_ID está presente
[ ] NEXT_PUBLIC_SUPABASE_URL está presente
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY está presente
[ ] JWT_SECRET=ecodialogas3cr3t0_d3sarr0ll0_2026_c4mbi4r_3n_producci0n
[ ] NODE_ENV=development
```

### 3. Iniciar Servidores

#### Terminal 1: Backend
```
Comando: cd api
Comando: venv\Scripts\activate (Windows) o source venv/bin/activate (Mac/Linux)
Comando: python -m flask run

Esperado: "Running on http://localhost:5000"
Estado: [ ] Backend activo en :5000
```

#### Terminal 2: Frontend
```
Comando: npm run dev

Esperado: "ready - started server on 0.0.0.0:3000"
Estado: [ ] Frontend activo en :3000
```

---

## 🧪 VALIDACIÓN DE FUNCIONALIDAD

### Test 1: Health Check Backend
```
Comando: curl http://localhost:5000/health
Esperado: { "status": "ok", "message": "..." }
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

### Test 2: Login Fallido (credenciales inválidas)
```
Comando: curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"INVALIDO","studentCode":"INVALIDO"}'
  
Esperado: { "status": "error", "message": "Código de grupo no válido." }
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

### Test 3: Login Exitoso
```
Comando: curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"G11101","studentCode":"E01"}'
  
Esperado: { "status": "success", "token": "eyJ...", "user": {...} }
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Token obtenido: _________________
Notas: ________________
```

### Test 4: GET /auth/me
```
Comando: curl -H "Authorization: Bearer <token_del_test_3>" \
  http://localhost:5000/auth/me
  
Esperado: { "status": "success", "user": {...} }
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

### Test 5: Frontend Carga
```
URL: http://localhost:3000
Esperado: Página de login visible
[ ] Logo de EcoDialoga visible
[ ] Campo "Código de Grupo" visible
[ ] Campo "ID de Estudiante" visible
[ ] Botón "Entrar al Chat" visible
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

### Test 6: Frontend Login
```
Acción: Ingresa credenciales válidas en http://localhost:3000
Esperado: Redirige a /student/chat
Verifica (F12 → Application → Local Storage):
[ ] eco_token está presente
[ ] eco_token tiene formato JWT (eyJ...)
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

### Test 7: Network Inspection
```
Acción: F12 → Network → Intenta login
Verifica:
[ ] Request POST a http://localhost:5000/auth/login
[ ] Status: 200 (success) o 401 (error)
[ ] Headers: Content-Type: application/json
[ ] Response body contiene token
Estado: [ ] Pasado ✅ [ ] Fallido ❌
Notas: ________________
```

---

## 📊 RESULTADO GENERAL

### Tareas Completadas
```
Total de tareas: 30+
Completadas:     ___  / 30
Porcentaje:      ___%
```

### Validaciones Pasadas
```
Total de tests:  7
Pasados:         ___  / 7
Porcentaje:      ___%

Si todos pasan: ✅ INTEGRACIÓN LISTA
Si <6 pasan:    ❌ Revisar TESTING_GUIDE.md
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "pip install falla"
```
[ ] Verificar Python version: python --version
[ ] Verificar que venv esté activado
[ ] Ejecutar: pip install --upgrade pip
[ ] Reintentar: pip install -r requirements.txt
Estado: [ ] Resuelto
```

### Problema: "Port 5000 already in use"
```
[ ] Verificar si Flask ya corre: lsof -i :5000 (Mac/Linux)
[ ] O usar puertodistinto: flask run --port 5001
[ ] Actualizar NEXT_PUBLIC_API_URL en .env.local
Estado: [ ] Resuelto
```

### Problema: "CORS error en login"
```
[ ] Verificar NEXT_PUBLIC_API_URL = http://localhost:5000
[ ] Verificar que el backend está en :5000
[ ] Revisar F12 → Console para ver error exacto
Estado: [ ] Resuelto
```

### Problema: "Código de grupo no válido"
```
[ ] Verificar credenciales Supabase en .env
[ ] Ir a Supabase → SQL Editor
[ ] Ejecutar: SELECT codigo_grupo FROM grupos;
[ ] Usar un código que existe
Estado: [ ] Resuelto
```

### Problema: "Token inválido en Test 4"
```
[ ] Verificar JWT_SECRET es igual en .env.local y api/.env
[ ] Token podría estar expirado (24h)
[ ] Ejecutar Test 3 de nuevo para nuevo token
Estado: [ ] Resuelto
```

---

## 📝 NOTAS PERSONALES

```
¿Qué necesito cambiar para producción?
_____________________________________________
_____________________________________________
_____________________________________________

¿Qué endpoints adicionales necesito?
_____________________________________________
_____________________________________________
_____________________________________________

¿Qué errores encontré?
_____________________________________________
_____________________________________________
_____________________________________________

¿Qué funcionó bien?
_____________________________________________
_____________________________________________
_____________________________________________

Próximos pasos después de esto:
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🎯 RESUMEN FINAL

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| Backend Python | [ ] Listo | Autenticación JWT implementada |
| Frontend TypeScript | [ ] Listo | Conectado a backend |
| Base de datos | [ ] Validada | Supabase configurado |
| Documentación | [ ] Completa | 5+ guías disponibles |
| Testing | [ ] Completado | 7 tests validados |
| **INTEGRACIÓN** | [ ] **LISTA** | **Listo para usar** |

---

## ✨ CELEBRACIÓN

Si todos los checkboxes están marcados:

```
    ╔════════════════════════════════════╗
    ║  ✅ ¡INTEGRACIÓN COMPLETADA! ✅   ║
    ║                                    ║
    ║  🎉 El backend y frontend están   ║
    ║     comunicándose correctamente    ║
    ║                                    ║
    ║  🚀 Listo para continuar con:     ║
    ║     • Endpoints adicionales       ║
    ║     • Más funcionalidades         ║
    ║     • Despliegue en prod          ║
    ╚════════════════════════════════════╝
```

---

## 📞 SOPORTE

Si necesitas ayuda:

1. **Revisar guías**
   - `SETUP_BACKEND.md` - Instalación
   - `TESTING_GUIDE.md` - Tests
   - `API_EXAMPLES.ts` - Código

2. **Verificar logs**
   - Flask: `FLASK_DEBUG=True` en terminal
   - Frontend: F12 → Console → Red

3. **Documentación original**
   - `SETUP_BACKEND.md` → Troubleshooting
   - `INTEGRATION_SUMMARY.md` → Flujo

---

**Fecha de inicio**: Marzo 2026  
**Fecha de verificación**: ___/___/____  
**Responsable**: __________________  
**Status**: [ ] En progreso [ ] Completado

¡Éxito con la integración! 🌱
