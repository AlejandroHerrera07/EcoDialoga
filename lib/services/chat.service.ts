// ─────────────────────────────────────────────
// Chat Service
// ─────────────────────────────────────────────
// Cuando el backend esté listo:
//   → Elimina las funciones mock*
//   → Quita los guards USE_MOCK
// ─────────────────────────────────────────────

import { apiClient, API_ENDPOINTS } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";
import type {
  Message,
  SendMessageRequest,
  SendMessageResponse,
  Conversation,
  ConversationHistoryResponse,
  ConversationMessagesResponse,
} from "@/lib/types";

// ═══ Toggle de mock — cambiar a false cuando haya backend ═══
const USE_MOCK = false;

// ── Mock helpers ──────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MOCK_RESPONSES = [
  "Entiendo tu punto. Para ayudarte mejor, ¿podrías contarme más sobre los recursos que tienes disponibles para el proyecto?",
  "Esa es una excelente pregunta. Vamos a desglosarla paso a paso para encontrar la mejor solución.",
  "Interesante perspectiva. ¿Has considerado cómo esto se relaciona con los Objetivos de Desarrollo Sostenible?",
  "Buen avance. Ahora necesitamos definir los indicadores de impacto ambiental para tu propuesta.",
  "Perfecto. ¿Quieres que te sugiera algunas fuentes académicas para respaldar tu argumento?",
];

let mockResponseIndex = 0;

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_1",
    title: "Ciudad Sostenible — Proyecto Final",
    lastMessage: "¿Cuál es el problema central que quieres resolver?",
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-03-05T10:30:00Z",
  },
  {
    id: "conv_2",
    title: "Energías Renovables — Investigación",
    lastMessage: "Las fuentes de energía solar y eólica son...",
    createdAt: "2026-03-04T14:00:00Z",
    updatedAt: "2026-03-04T15:00:00Z",
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "¡Hola! ¿Listo para estructurar tus ideas de proyecto para la iniciativa de ciudad sostenible en Colombia?",
    createdAt: "2026-03-05T10:00:00Z",
  },
  {
    id: "2",
    role: "user",
    content:
      "Sí, tengo muchas notas pero necesito ayuda para organizarlas en un plan coherente para mi grupo de 2026.",
    createdAt: "2026-03-05T10:01:00Z",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Genial. Comencemos identificando tu tesis principal. ¿Cuál es el problema central que quieres resolver en tu comunidad?",
    createdAt: "2026-03-05T10:02:00Z",
  },
];

async function mockSendMessage(
  req: SendMessageRequest,
): Promise<SendMessageResponse> {
  await delay(1200);
  const response = MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length];
  mockResponseIndex++;

  return {
    conversationId: req.conversationId ?? "conv_1",
    message: {
      id: uuidv4(),
      role: "assistant",
      content: response,
      createdAt: new Date().toISOString(),
    },
  };
}

async function mockGetConversations(): Promise<ConversationHistoryResponse> {
  await delay(400);
  return { conversations: MOCK_CONVERSATIONS };
}

async function mockGetMessages(
  conversationId: string,
): Promise<ConversationMessagesResponse> {
  await delay(400);
  return { messages: MOCK_MESSAGES, conversationId };
}

// ── Public API ────────────────────────────────

export async function sendMessage(
  req: SendMessageRequest,
): Promise<SendMessageResponse> {
  if (USE_MOCK) return mockSendMessage(req);

  // El backend devuelve { message: "string" }
  // Transformarlo al formato esperado por el frontend
  const response = await apiClient.post<{ message: string }>(
    API_ENDPOINTS.SEND_MESSAGE(req.conversationId),
    { content: req.content },
  );

  return {
    conversationId: req.conversationId || "default",
    message: {
      id: uuidv4(),
      role: "assistant",
      content: response.message,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function getConversations(): Promise<Conversation[]> {
  if (USE_MOCK) {
    const res = await mockGetConversations();
    return res.conversations;
  }

  const res = await apiClient.get<ConversationHistoryResponse>(
    API_ENDPOINTS.CONVERSATIONS,
  );
  return res.conversations;
}

export async function getConversationMessages(
  conversationId: string,
): Promise<Message[]> {
  if (USE_MOCK) {
    const res = await mockGetMessages(conversationId);
    return res.messages;
  }

  const res = await apiClient.get<ConversationMessagesResponse>(
    API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
  );
  return res.messages;
}
