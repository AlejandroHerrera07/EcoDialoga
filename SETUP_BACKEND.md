# 🌱 EcoDialoga - Guía de Configuración Backend-Frontend

Este documento explica cómo configurar y ejecutar el proyecto EcoDialoga con la integración entre el frontend (Next.js) y el backend (Flask).

## 📋 Requisitos Previos

- **Node.js** 18+ (para el frontend)
- **Python** 3.8+ (para el backend)
- **pip** (gestor de paquetes de Python)

## 🚀 Configuración Rápida

### 1️⃣ Clonar y Preparar el Proyecto

```bash
# Navegar al directorio del proyecto
cd C:\Users\alarc\OneDrive\Documentos\Proyecto EcoProfe\EcoDialoga1\Proyecto-EcoProfe-master

# Instalar dependencias del frontend
npm install

# Navegar a la carpeta del backend
cd api

# Crear un entorno virtual (recomendado)
python -m venv venv

# Activar el entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias del backend
pip install -r requirements.txt

# Volver a la raíz del proyecto
cd ..
```

### 2️⃣ Configurar Variables de Entorno

Ya existen los archivos `.env.local` (frontend) y `api/.env` (backend) con las configuraciones necesarias.

**Para cambiar la URL del API en caso de tener otro servidor:**

Edita `C:\Users\alarc\...\Proyecto-EcoProfe-master\.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000  # Cambiar si el backend corre en otro puerto
```

### 3️⃣ Iniciar el Servidor del Backend

Desde la carpeta raíz del proyecto:

```bash
cd api
python -m flask run
```

El backend estará disponible en: `http://localhost:5000`

**O con Gunicorn:**
```bash
gunicorn -w 1 -b 0.0.0.0:5000 index:app
```

### 4️⃣ Iniciar el Frontend (en otra terminal)

Desde la carpeta raíz del proyecto:

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

## 📊 Flujo de Autenticación

### 1. Login (POST `/auth/login`)
```json
// Request
POST http://localhost:5000/auth/login
{
  "groupCode": "G11101",
  "studentCode": "E01"
}

// Response
{
  "status": "success",
  "token": "eyJ...",
  "user": {
    "id": "usr_xxx",
    "name": "Juan Camilo",
    "studentCode": "E01",
    "groupCode": "G11101",
    "role": "student"
  }
}
```

### 2. Obtener Usuario Actual (GET `/auth/me`)
```
Authorization: Bearer <token>
```

### 3. Chat (POST `/api/chat`)
```json
// Request
POST http://localhost:5000/api/chat
Authorization: Bearer <token>
{
  "message": "¿Cómo empiezo mi proyecto?",
  "sesion_id": "sess_123"
}

// Response
{
  "status": "success",
  "message": "Respuesta de la IA...",
  "thread_id": "thread_xxx"
}
```

## 🔑 Cómo Funciona la Integración

### Frontend (Next.js)
1. El usuario ingresa **Código de Grupo** y **ID de Estudiante**
2. Se envía a `POST /auth/login` del backend
3. El backend valida contra Supabase y retorna un JWT token
4. El token se almacena en localStorage + cookie
5. Todos los requests posteriores incluyen el token en `Authorization: Bearer <token>`

### Backend (Flask)
1. Recibe el login request
2. Valida contra Supabase (tablas: `grupos` y `estudiantes`)
3. Genera un JWT token con expiración de 24 horas
4. Futuras requests autenticadas validan el JWT antes de procesar

## 📁 Estructura de Carpetas Relevantes

```
Proyecto-EcoProfe-master/
├── app/                    # Frontend Next.js
│   ├── (auth)/login/      # Página de login
│   ├── student/           # Rutas estudiante
│   └── teacher/           # Rutas profesor
├── lib/
│   ├── api/               # Cliente HTTP
│   ├── services/          # Servicios (auth, chat)
│   ├── hooks/             # React hooks
│   └── types/             # TypeScript types
├── api/                   # Backend Flask
│   ├── index.py           # Endpoints principales
│   ├── auth.py           # Lógica de autenticación
│   ├── database.py       # Conexión a Supabase
│   ├── workflow.py       # Integración OpenAI
│   ├── requirements.txt  # Dependencias Python
│   └── .env              # Variables de entorno
└── .env.local            # Variables frontend (no commitear)
```

## 🔐 Variables de Entorno Importantes

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=<tu_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_key>
```

### Backend (`api/.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=<tu_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_key>
JWT_SECRET=<tu_clave_secreta>
OPENAI_API_KEY=<tu_api_key>
AGENT_WORKFLOW_ID=<tu_agent_id>
```

## 🧪 Probar los Endpoints

### Con cURL o Postman:

```bash
# 1. Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"G11101","studentCode":"E01"}'

# 2. Health Check
curl http://localhost:5000/health

# 3. Get User (con token)
curl -H "Authorization: Bearer <tu_token>" \
  http://localhost:5000/auth/me
```

## 🐛 Solución de Problemas

### Error: "Código de grupo no válido"
- Verifica que exista el grupo en Supabase con ese `codigo_grupo`
- Comprueba que SUPABASE_URL y SUPABASE_ANON_KEY sean correctos

### Error: "Id de estudiante no válido"
- Verifica que el estudiante exista en Supabase con ese `identificador_estudiante`

### Error: "CORS"
- Asegúrate de que el backend (5000) y frontend (3000) estén en URLs diferentes
- El cliente API ya maneja esto automáticamente

### El frontend no se conecta al backend
- Verifica que `NEXT_PUBLIC_API_URL` sea `http://localhost:5000`
- Asegúrate de que el backend esté corriendo: `curl http://localhost:5000/health`

## 📝 Notas Importantes

- ⚠️ **Desarrollo**: El JWT_SECRET está simplificado. Cambiarlo en producción a algo más seguro
- ⚠️ **CORS**: En producción, configurar CORS adecuadamente
- ⚠️ **HTTPS**: En producción, usar HTTPS y cookies httpOnly

## 🔄 Cambios Realizados

### Backend (Python)
✅ Creado `api/auth.py` con lógica de autenticación JWT
✅ Actualizado `api/index.py` con endpoints `/auth/login`, `/auth/me`, `/auth/logout`
✅ Agregado middleware requerido: `@require_auth` para proteger endpoints
✅ Creado `api/requirements.txt` con dependencias necesarias

### Frontend (Next.js)
✅ Cambiadoausencia `USE_MOCK = false` en `lib/services/auth.service.ts`
✅ Creado `.env.local` con configuración de API URL
✅ Cliente API (`lib/api/client.ts`) ya soportaba autenticación JWT

## 📞 Soporte

Si encuentras problemas:
1. Verifica los logs de Flask: `FLASK_DEBUG=True`
2. Abre la consola del navegador (F12) para ver errores del frontend
3. Comprueba que las credenciales de Supabase sean correctas
4. Valida que las tablas `grupos` y `estudiantes` existan en Supabase

---

**Última actualización**: Marzo 2026
**Estado**: ✅ Integración Backend-Frontend Completada
