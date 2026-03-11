// ─────────────────────────────────────────────
// API Endpoint Constants
// Centralizado para cambios rápidos cuando el
// backend esté listo.
// ─────────────────────────────────────────────

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",

  // Chat / Conversations
  CONVERSATIONS: "/api/chat",
  CONVERSATION_MESSAGES: (id: string) => `/conversations/${id}/messages`,
  // Always hit the generic chat endpoint; backend currently ignores conversationId.
  SEND_MESSAGE: (_conversationId?: string) => "/api/chat",
} as const;
