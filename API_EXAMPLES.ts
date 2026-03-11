// ─────────────────────────────────────────────────────────
// EJEMPLOS DE USO DEL CLIENTE API
// ─────────────────────────────────────────────────────────
// Este archivo muestra cómo usar el cliente API del frontend
// para comunicarse con el backend Flask.

import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type { LoginRequest, LoginResponse, Message } from "@/lib/types";

/**
 * EJEMPLO 1: LOGIN
 * 
 * Usado en: app/(auth)/login/page.tsx
 */
export async function exampleLogin() {
  const loginData: LoginRequest = {
    groupCode: "G11101",
    studentCode: "E01",
  };

  try {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      loginData,
      { public: true } // No necesita token si no está logueado
    );

    console.log("✅ Login exitoso:", response.user);
    // El token se guarda automáticamente en localStorage
    return response;
  } catch (error) {
    console.error("❌ Error de login:", error);
    throw error;
  }
}

/**
 * EJEMPLO 2: OBTENER USUARIO ACTUAL
 * 
 * Usado en: lib/hooks/useAuth.tsx
 */
export async function exampleGetMe() {
  try {
    const user = await apiClient.get(API_ENDPOINTS.ME);
    console.log("✅ Usuario actual:", user);
    return user;
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    throw error;
  }
}

/**
 * EJEMPLO 3: ENVIAR MENSAJE AL CHAT
 * 
 * Usado en: lib/services/chat.service.ts
 */
export async function exampleSendMessage(
  conversationId: string,
  message: string
) {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.SEND_MESSAGE(conversationId),
      { content: message }
      // No es necesario pasar { public: true } aquí
      // porque ya hay un token en localStorage
    );

    console.log("✅ Mensaje enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar mensaje:", error);
    throw error;
  }
}

/**
 * EJEMPLO 4: HACER LOGOUT
 * 
 * Usado en: lib/services/auth.service.ts
 */
export async function exampleLogout() {
  try {
    await apiClient.post(API_ENDPOINTS.LOGOUT);
    console.log("✅ Sesión cerrada");
    // El token se elimina automáticamente del localStorage
  } catch (error) {
    // No es crítico si falla el logout en el servidor
    console.warn("⚠️ Error al cerrar sesión en servidor:", error);
  }
}

/**
 * EJEMPLO 5: ENVIAR MENSAJE DE CHAT CON SESIÓN
 * 
 * Este es el endpoint real que usa el backend
 */
export async function exampleChatMessage(
  sessionId: string,
  message: string
) {
  try {
    const response = await apiClient.post<{ message: string }>("/api/chat", {
      message,
      sesion_id: sessionId,
      // El estudiante_id se obtiene del token en el servidor
    });

    console.log("✅ Respuesta de IA:", response.message);
    return response;
  } catch (error) {
    console.error("❌ Error en chat:", error);
    throw error;
  }
}

/**
 * CÓMO FUNCIONAN LOS TOKENS
 * 
 * 1. GUARDAR TOKEN (automático después de login)
 *    - Se guarda en localStorage como "eco_token"
 *    - Se guarda también como cookie para el Middleware
 * 
 * 2. USAR TOKEN (automático en requests)
 *    - El cliente API añade "Authorization: Bearer <token>" 
 *      automáticamente en todos los requests autenticados
 * 
 * 3. ELIMINAR TOKEN (automático en logout)
 *    - Se elimina de localStorage
 *    - Se elimina de las cookies
 */

/**
 * ESTRUCTURA DE ERRORES
 * 
 * Los errores del API vienen en este formato:
 * 
 * {
 *   status: 400 | 401 | 500,
 *   message: "Error description",
 *   errors?: any
 * }
 */

export function exampleErrorHandling() {
  apiClient
    .post("/auth/login", {
      groupCode: "INVALIDO",
      studentCode: "INVALIDO",
    })
    .catch((error) => {
      console.error("Código de estado:", error.status); // 401
      console.error("Mensaje:", error.message); // "Código de grupo no válido"
    });
}

/**
 * VARIABLES DE ENTORNO A CONFIGURAR
 * 
 * En .env.local (para el frontend):
 * 
 * NEXT_PUBLIC_API_URL=http://localhost:5000
 * 
 * Esto hace que todos los requests vayan a:
 * http://localhost:5000/auth/login
 * http://localhost:5000/api/chat
 * etc.
 */

export const API_CONFIG = {
  // Estos valores vienen de las variables de entorno
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  // Ejemplo: http://localhost:5000
  
  // Endpoints disponibles
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  CHAT: {
    SEND_MESSAGE: (id?: string) =>
      id ? `/conversations/${id}/messages` : "/conversations/messages",
    GET_CONVERSATIONS: "/conversations",
  },
};

/**
 * INFORMACIÓN PARA DESARROLLO
 * 
 * ✅ El cliente API está completamente configurado
 * ✅ El middleware de autenticación funciona automáticamente
 * ✅ Los tokens se manejan automáticamente
 * ✅ El error handling está centralizado
 * 
 * Solo necesitas:
 * 1. Asegurar que NEXT_PUBLIC_API_URL apunta al backend
 * 2. Que el backend tenga los endpoints implementados
 * 3. Usar los endpoints en auth/chat con el cliente API
 */
