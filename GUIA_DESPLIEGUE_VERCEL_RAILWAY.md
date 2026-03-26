# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GUÍA DE DESPLIEGUE: Vercel (Frontend) + Railway (Backend)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 Requisitos previos:
- Cuenta de GitHub
- Cuenta en Vercel (https://vercel.com)
- Cuenta en Railway (https://railway.app)
- Cuenta en Supabase (https://supabase.com) - ya tienes
- API Key de OpenAI (https://platform.openai.com)

## 🚀 PASO 1: Desplegar Backend en Railway

### 1.1 Preparar el repositorio
```bash
# Asegúrate de que tu código esté en GitHub
git push origin main
```

### 1.2 Crear proyecto en Railway
1. Ir a https://railway.app
2. Click en "New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Conectar GitHub y seleccionar tu repositorio
5. Railway detectará que es Python automáticamente

### 1.3 Configurar el proyecto en Railway
1. En la pestaña "Settings":
   - **Root Directory**: `api` (muy importante!)
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT index:app`

2. Ir a la pestaña "Variables" y añadir:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://byjorvbfotcojzalaruf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_w7UIxihQu0oZ2GWGlPvwuA_ml0SxZED
   JWT_SECRET=tu_clave_secreta_super_segura_cambiar_esto
   OPENAI_API_KEY=sk-... (tu key)
   FLASK_ENV=production
   ```

3. Railway generará automáticamente una URL como: `https://tu-proyecto-railway.up.railway.app`

### 1.4 Verificar despliegue
```bash
curl https://tu-proyecto-railway.up.railway.app/health
```

---

## 🎨 PASO 2: Desplegar Frontend en Vercel

### 2.1 Preparar variables de entorno
Tu archivo `.env.production` debe tener:
```
NEXT_PUBLIC_API_URL=https://tu-proyecto-railway.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://byjorvbfotcojzalaruf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_w7UIxihQu0oZ2GWGlPvwuA_ml0SxZED
```

### 2.2 Desplegar en Vercel
1. Ir a https://vercel.com
2. Hacer click en "Add New" → "Project"
3. Importar tu repositorio de GitHub
4. Configurar:
   - **Framework Preset**: Next.js (Vercel lo detectará automáticamente)
   - **Root Directory**: `.` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (por defecto)

### 2.3 Añadir variables de entorno en Vercel
1. En "Settings" → "Environment Variables"
2. Añadir las siguientes variables:
   ```
   NEXT_PUBLIC_API_URL = https://tu-proyecto-railway.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL = https://byjorvbfotcojzalaruf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_w7UIxihQu0oZ2GWGlPvwuA_ml0SxZED
   ```

3. Hacer click en "Deploy"

Vercel generará una URL como: `https://tu-proyecto.vercel.app`

---

## ✅ Verificación final

1. **Frontend**: https://tu-proyecto.vercel.app
   - Debería cargar sin errores
   - Intenta hacer login

2. **Backend**: https://tu-proyecto-railway.up.railway.app/auth/login
   - Debería responder con un error 401 si no hay token (es lo esperado)

3. **Conectividad**: 
   - Abre DevTools (F12) en el navegador
   - Ve a Network
   - Intenta hacer login
   - Verifica que las peticiones van a tu URL de Railway

---

## 🔄 Redeploys automáticos

### Railway:
- Se redeploya automáticamente cuando haces push a `main`
- Ver logs: Dashboard → Select Project → Logs

### Vercel:
- Se redeploya automáticamente cuando haces push a `main`
- Ver logs: Vercel Dashboard → Select Project → Deployments

---

## 🐛 Solucionar problemas comunes

### "Error connecting to API" en frontend
```
1. Verificar que NEXT_PUBLIC_API_URL es correcto en Vercel
2. Verificar que el backend está corriendo en Railway
3. Abrir DevTools → Network → ver URLs exactas de las peticiones
```

### "CORS error" 
```
1. En api/index.py asegurate de que CORS está configurado:
   CORS(app)
2. Si necesitas restringir dominios:
   CORS(app, origins=["https://tu-proyecto.vercel.app"])
```

### Backend no inicia en Railway
```
1. Verificar que Start Command es correcto
2. Ver logs en Railway Dashboard
3. Asegurase de que requirements.txt está en la carpeta api/
```

### Variables de entorno no se cargan
```
1. En Vercel: redeploy después de cambiar variables
2. En Railway: redeploy manual desde Dashboard
```

---

## 📝 Notas importantes

- ✅ `.env.local` es para desarrollo local (NO commitar)
- ✅ `.env.production` es para Vercel (NO commitar)
- ✅ `.env.example` sí commitear (es la plantilla)
- ✅ Las variables `NEXT_PUBLIC_*` son públicas (visible en frontend)
- ⚠️  Las variables sin `NEXT_PUBLIC_*` son privadas (solo backend o server-side)

