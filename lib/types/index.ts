// ─────────────────────────────────────────────
// Domain Types — EcoDialoga
// ─────────────────────────────────────────────

export * from "./teacher";
// ── Auth ──────────────────────────────────────

export interface LoginRequest {
  groupCode: string;
  studentCode: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  studentCode: string;
  groupCode: string;
  role: "student" | "teacher";
  avatarUrl?: string;
  consentimiento?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Chat ──────────────────────────────────────

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface SendMessageRequest {
  content: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  message: Message;
  conversationId: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationHistoryResponse {
  conversations: Conversation[];
}

export interface ConversationMessagesResponse {
  messages: Message[];
  conversationId: string;
}

// ── API Generic ───────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
