# Cómo conectar el API real — EcoDialoga Frontend

Esta guía cubre todos los pasos para pasar del modo mock al API real en producción.
No requiere reescribir nada; la arquitectura ya está preparada para el cambio.

---

## Resumen de archivos involucrados

```
lib/
  api/
    client.ts        ← HTTP client (fetch wrapper + manejo de token)
    endpoints.ts     ← Constantes de todas las URLs del API
  services/
    auth.service.ts  ← Lógica de autenticación (tiene toggle USE_MOCK)
    chat.service.ts  ← Lógica del chat (tiene toggle USE_MOCK)
  types/index.ts     ← Contratos TypeScript de request/response
proxy.ts             ← Protección de rutas en el edge (lee cookie eco_token)
.env.example         ← Template de variables de entorno
```

---

## Paso 1 — Configurar la variable de entorno

Crea el archivo `.env.local` en la raíz de `/frontend` (nunca se sube a git):

```bash
cp .env.example .env.local
```

Edítalo con la URL real de tu backend:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://tu-api.ecodialoga.com/api
```

> Durante desarrollo local puedes usar `http://localhost:4000/api` o la URL que le asigne tu equipo de backend.

---

## Paso 2 — Desactivar los mocks

Abre cada service y cambia `USE_MOCK = true` → `USE_MOCK = false`:

### `lib/services/auth.service.ts`

```diff
- const USE_MOCK = true;
+ const USE_MOCK = false;
```

### `lib/services/chat.service.ts`

```diff
- const USE_MOCK = true;
+ const USE_MOCK = false;
```

---

## Paso 3 — Verificar los contratos del API

El cliente HTTP espera que el backend responda con esta estructura:

### `POST /auth/login`

**Request body:**
```json
{
  "groupCode": "ECO-2026-A",
  "studentCode": "EST-001"
}
```

**Response esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "usr_001",
    "name": "Juan Camilo",
    "studentCode": "EST-001",
    "groupCode": "ECO-2026-A",
    "role": "student",
    "avatarUrl": "https://..."
  }
}
```

---

### `GET /auth/me` *(requiere Authorization header)*

**Response esperada:**
```json
{
  "id": "usr_001",
  "name": "Juan Camilo",
  "studentCode": "EST-001",
  "groupCode": "ECO-2026-A",
  "role": "student"
}
```

> Se llama automáticamente al recargar la app para validar que el token siga vigente.

---

### `POST /conversations/messages` — nueva conversación

**Request body:**
```json
{
  "content": "Mensaje del estudiante"
}
```

**Response esperada:**
```json
{
  "conversationId": "conv_abc123",
  "message": {
    "id": "msg_001",
    "role": "assistant",
    "content": "Respuesta de la IA",
    "createdAt": "2026-03-05T10:00:00Z"
  }
}
```

---

### `POST /conversations/:id/messages` — conversación existente

Mismo body y response anterior, pero incluye el `conversationId` en la URL.

---

### `GET /conversations`

**Response esperada:**
```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "Ciudad Sostenible — Proyecto",
      "lastMessage": "...",
      "createdAt": "2026-03-05T10:00:00Z",
      "updatedAt": "2026-03-05T10:30:00Z"
    }
  ]
}
```

---

### `GET /conversations/:id/messages`

**Response esperada:**
```json
{
  "conversationId": "conv_abc123",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "...",
      "createdAt": "2026-03-05T10:00:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "...",
      "createdAt": "2026-03-05T10:01:00Z"
    }
  ]
}
```

---

### Respuestas de error (cualquier endpoint)

El cliente HTTP lee automáticamente el campo `message` del body:

```json
{
  "status": 401,
  "message": "Credenciales inválidas",
  "errors": {
    "groupCode": ["El grupo no existe"]
  }
}
```

> Si el backend devuelve los datos en un wrapper `{ "data": {...} }`, el cliente ya lo maneja: busca primero `json.data` y si no existe usa `json` directamente.

---

## Paso 4 — Configurar CORS en el backend

El frontend hace peticiones desde `http://localhost:3000` (dev) o tu dominio de producción. El backend debe permitir:

```
Origin: http://localhost:3000
Headers: Content-Type, Authorization
Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## Paso 5 — Cookies de sesión (opcional pero recomendado)

Actualmente el frontend sincroniza el JWT como cookie `eco_token` (`SameSite=Lax`, sin `httpOnly`) para que el proxy Edge pueda leer la sesión y proteger las rutas.

Cuando el backend esté listo, **la opción más segura** es que el backend setee la cookie directamente como `httpOnly`:

```http
Set-Cookie: eco_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

Si el backend maneja la cookie, elimina las líneas de `document.cookie` en `lib/api/client.ts`:

```diff
// setStoredToken
- document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

// removeStoredToken
- document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
```

Y en `lib/hooks/useAuth.tsx` puedes eliminar también la re-sincronización manual:

```diff
- if (!document.cookie.includes("eco_token=")) {
-   document.cookie = `eco_token=${storedToken}; ...`;
- }
```

---

## Paso 6 — Ajustar endpoints si el backend usa nombres distintos

Edita **solo** el archivo `lib/api/endpoints.ts`:

```typescript
export const API_ENDPOINTS = {
  LOGIN:    "/auth/login",        // ← cambia aquí si es diferente
  LOGOUT:   "/auth/logout",
  ME:       "/auth/me",

  CONVERSATIONS:          "/conversations",
  CONVERSATION_MESSAGES:  (id: string) => `/conversations/${id}/messages`,
  SEND_MESSAGE:           (conversationId?: string) =>
    conversationId
      ? `/conversations/${conversationId}/messages`
      : "/conversations/messages",
};
```

No necesitas tocar los services ni los hooks.

---

## Paso 7 — (Opcional) Limpiar el código mock

Una vez que todo funcione con el API real puedes borrar el código de mock para dejar los services más limpios. Ejemplo para `auth.service.ts`:

```typescript
// Antes (con mock)
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) {
    const res = await mockLogin(payload);
    setStoredToken(res.token);
    return res;
  }
  const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, payload, { public: true });
  setStoredToken(res.token);
  return res;
}

// Después (limpio)
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, payload, { public: true });
  setStoredToken(res.token);
  return res;
}
```

Repite lo mismo para cada función en `chat.service.ts`.

---

## Checklist rápido

- [ ] Crear `.env.local` con `NEXT_PUBLIC_API_URL`
- [ ] `USE_MOCK = false` en `auth.service.ts`
- [ ] `USE_MOCK = false` en `chat.service.ts`
- [ ] Backend responde con los contratos de los pasos 3
- [ ] CORS configurado en el backend
- [ ] Probar login, envío de mensajes y recarga de sesión
- [ ] (Opcional) Cookie `httpOnly` desde el backend
- [ ] (Opcional) Limpiar funciones mock
