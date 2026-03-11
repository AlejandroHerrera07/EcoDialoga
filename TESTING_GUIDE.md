## 🧪 GUÍA DE TESTING - Backend-Frontend Integration

Esta guía te ayudará a verificar que la integración backend-frontend está funcionando correctamente.

---

## ✅ CHECKLIST PRE-TEST

Antes de correr los tests, verifica que:

- [ ] Backend (Flask) está corriendo en `http://localhost:5000`
- [ ] Frontend (Next.js) está corriendo en `http://localhost:3000`
- [ ] Variables de entorno están configuradas (`.env.local` y `api/.env`)
- [ ] Las credenciales de Supabase son válidas
- [ ] Tienes un grupo y estudiante en la BD de Supabase

---

## 🧪 TEST 1: Health Check del Backend

### Objetivo
Verificar que el servidor Flask está activo y responde.

### Comando
```bash
curl http://localhost:5000/health
```

### Respuesta Esperada
```json
{
  "status": "ok",
  "message": "EcoDialoga Backend está activo"
}
```

### Resultado
- ✅ Si ves esta respuesta: El backend está corriendo
- ❌ Si falla: No lograste iniciar Flask (ve a SETUP_BACKEND.md)

---

## 🧪 TEST 2: Login sin Credenciales

### Objetivo
Verificar que el endpoint `/auth/login` rechaza credenciales inválidas.

### Comando
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"INVALIDO","studentCode":"INVALIDO"}'
```

### Respuesta Esperada
```json
{
  "status": "error",
  "message": "Código de grupo no válido."
}
```

### Resultado
- ✅ Si rechaza: El servidor está validando correctamente
- ❌ Si aceptaLogin falso: Hay un problema con Supabase

---

## 🧪 TEST 3: Login Exitoso

### Objetivo
Validar que un usuario real puede hacer login.

### Comando
Reemplaza los valores con datos reales de tu BD Supabase:

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"G11101","studentCode":"E01"}'
```

### Respuesta Esperada
```json
{
  "status": "success",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid-del-estudiante",
    "name": "Nombre del Estudiante",
    "studentCode": "E01",
    "groupCode": "G11101",
    "groupName": "Nombre del Grupo",
    "role": "student",
    "email": "email@example.com"
  }
}
```

### Resultado
- ✅ Si obtienes token: El login funciona
- ❌ Si falla: Verifica que exista el grupo y estudiante en Supabase

**⚠️ IMPORTANTE**: Guarda el valor del "token" para los siguientes tests.

---

## 🧪 TEST 4: Obtener Usuario Actual (/auth/me)

### Objetivo
Validar que el endpoint `/auth/me` retorna los datos del usuario autenticado.

### Comando
```bash
curl -H "Authorization: Bearer <PEGA_TOKEN_AQUI>" \
  http://localhost:5000/auth/me
```

### Respuesta Esperada
```json
{
  "status": "success",
  "user": {
    "id": "uuid-del-estudiante",
    "name": "Nombre del Estudiante",
    "studentCode": "E01",
    "groupCode": "G11101",
    "role": "student",
    "email": "email@example.com"
  }
}
```

### Resultado
- ✅ Si retorna usuario: El middleware JWT funciona
- ❌ Si da error 401: El token es inválido o expiró

---

## 🧪 TEST 5: Acceso sin Token

### Objetivo
Verificar que el servidor rechaza requests sin autenticación.

### Comando
```bash
curl http://localhost:5000/auth/me
```

### Respuesta Esperada
```json
{
  "status": "error",
  "message": "Authorization header requerido"
}
```

### Resultado
- ✅ Si rechaza: La autenticación está protegida
- ❌ Si permite: Hay un problema con el middleware

---

## 🧪 TEST 6: Frontend - Página de Login

### Objetivo
Verificar que el frontend carga y muestra la página de login.

### Pasos
1. Abre el navegador en `http://localhost:3000`
2. Deberías ver la página de login de EcoDialoga
3. Verifica que los campos de entrada sean visibles

### Resultado
- ✅ Si ves la página: El frontend está corriendo
- ❌ Si ves error: Verifica que npm run dev esté activo

---

## 🧪 TEST 7: Frontend - Login Real

### Objetivo
Verificar que el frontend se comunica con el backend para hacer login.

### Pasos
1. En `http://localhost:3000`
2. Completa los campos:
   - **Código de Grupo**: Usa un código válido (ej: `G11101`)
   - **ID de Estudiante**: Usa un ID válido (ej: `E01`)
3. Haz clic en "Entrar al Chat"

### Resultado
- ✅ Si entra al chat: La integración funciona completo
- ❌ Si falla: Revisa la consola (F12) para ver el error

### Cómo ver los errores
1. Abre las Developer Tools: `F12`
2. Ve a la pestaña **Console**
3. Intenta login de nuevo
4. Busca mensajes de error en rojo

---

## 🧪 TEST 8: Consola del Frontend

### Objetivo
Verificar que el frontend está usando el cliente API correcto.

### Pasos
1. Abre las Developer Tools: `F12`
2. Ve a la pestaña **Console**
3. Intenta hacer login
4. Mira los logs en la consola

### Busca estos logs
```javascript
// Si todo va bien:
✅ POST http://localhost:5000/auth/login (200 OK)
✅ Response: { token: "...", user: { ... } }

// Si hay error:
❌ Error: ...
❌ Status: 401
```

---

## 🧪 TEST 9: Network Tab

### Objetivo
Inspeccionar las requests HTTP entre frontend y backend.

### Pasos
1. Abre las Developer Tools: `F12`
2. Ve a la pestaña **Network**
3. Intenta hacer login
4. Deberías ver una request a `http://localhost:5000/auth/login`

### Verifica
- **URL**: `localhost:5000/auth/login`
- **Método**: `POST`
- **Headers**: Contiene `Content-Type: application/json`
- **Status**: `200` (éxito) o `401` (credenciales inválidas)
- **Body**: `{ groupCode: "...", studentCode: "..." }`

### Resultado
- ✅ Si ves requests correctas: La comunicación funciona
- ❌ Si no ves requests: Verifica que USE_MOCK = false

---

## 🧪 TEST 10: Guardado de Token

### Objetivo
Verificar que el token se guarda correctamente en el navegador.

### Pasos
1. Haz login exitosamente
2. Abre las Developer Tools: `F12`
3. Ve a **Application** → **Local Storage**
4. Busca la clave `eco_token`

### Resultado
- ✅ Si ves una clave con formato JWT: El token se guardó
- ❌ Si no aparece: Hay un problema al guardar el token

---

## 📊 TABLA DE RESULTADOS

| Test | Estado | Resultado | Siguiente |
|------|--------|-----------|-----------|
| 1. Health Check | ⏳ Ejecutando | ✅/❌ | → Test 2 |
| 2. Login Error | ⏳ Ejecutando | ✅/❌ | → Test 3 |
| 3. Login Exitoso | ⏳ Ejecutando | ✅/❌ | → Test 4 |
| 4. /auth/me | ⏳ Ejecutando | ✅/❌ | → Test 5 |
| 5. Sin Token | ⏳ Ejecutando | ✅/❌ | → Test 6 |
| 6. Frontend Login | ⏳ Ejecutando | ✅/❌ | → Test 7 |
| 7. Login Real | ⏳ Ejecutando | ✅/❌ | → Test 8 |
| 8. Console Logs | ⏳ Ejecutando | ✅/❌ | → Test 9 |
| 9. Network | ⏳ Ejecutando | ✅/❌ | → Test 10 |
| 10. Token Storage | ⏳ Ejecutando | ✅/❌ | ✨ Completado |

---

## 🐛 SOLUCIONAR PROBLEMAS

### "Connection refused" en Test 1
```
Error: Failed to fetch http://localhost:5000/health
```
**Solución**: 
```bash
cd api
python -m flask run
# Debe mostrar: Running on http://localhost:5000
```

### "CORS error" en Tests con curl desde Frontend
```
Access to XMLHttpRequest blocked by CORS policy
```
**Esperado**: En desarrollo es normal. Los navegadores lo bloquean pero curl no.

### "Código de grupo no válido" en Test 3
**Verificar**:
1. Abre Supabase → Tu proyecto → SQL Editor
2. Ejecuta: `SELECT codigo_grupo FROM grupos;`
3. Copia un código existente y úsalo

### "Token inválido" en Test 4
**Verificar**:
1. El token puede haber expirado (24h)
2. Ejecuta Test 3 de nuevo para obtener un token fresco
3. `JWT_SECRET` sea igual en ambos archivos .env

### El frontend no se conecta al backend
**Verificar**:
1. `NEXT_PUBLIC_API_URL=http://localhost:5000` en `.env.local`
2. USE_MOCK está en `false` en los services
3. Ambos servidores están corriendo en los puertos correctos

---

## ✅ CHECKLIST FINAL

Si todos los tests pasan:

- [ ] Test 1: Health Check ✓
- [ ] Test 2: Login Error ✓
- [ ] Test 3: Login Exitoso ✓
- [ ] Test 4: /auth/me ✓
- [ ] Test 5: Sin Token ✓
- [ ] Test 6: Frontend Load ✓
- [ ] Test 7: Frontend Login ✓
- [ ] Test 8: Console Logs ✓
- [ ] Test 9: Network ✓
- [ ] Test 10: Token Storage ✓

**🎉 ¡La integración está completa y funcionando!**

---

## 📞 SIGUIENTE

Una vez que la integración esté funcionando, puedes:

1. Implementar endpoints adicionales del chat
2. Agregar rutas del profesor
3. Desplegar en producción
4. Implementar más funcionalidades

Revisa `SETUP_BACKEND.md` para más detalles.

---

**Última actualización**: Marzo 2026
**Versión**: 1.0
