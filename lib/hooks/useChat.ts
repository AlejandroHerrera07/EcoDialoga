"use client";

// ─────────────────────────────────────────────
// useChat Hook
// ─────────────────────────────────────────────
// Encapsula toda la lógica de conversación:
//  • Carga mensajes iniciales
//  • Envía mensajes y recibe respuestas IA
//  • Mantiene estado de loading/typing/error
// ─────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "@/lib/types";
import * as chatService from "@/lib/services/chat.service";

interface UseChatOptions {
  /** ID de conversación existente (null = nueva) */
  conversationId?: string | null;
  /** Mensajes iniciales para precargar (modo mock) */
  initialMessages?: Message[];
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(
    options.initialMessages ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    options.conversationId ?? null,
  );

  // Prevent double-sends
  const sendingRef = useRef(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setError(null);

      // Optimistic user message
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const res = await chatService.sendMessage({
          content: content.trim(),
          conversationId: conversationId ?? undefined,
        });

        // Update conversation id if new
        if (res.conversationId) {
          setConversationId(res.conversationId);
        }

        // Add the AI response message
        setMessages((prev) => [...prev, res.message]);
      } catch (err: unknown) {
        const message =
          (err as { message?: string })?.message ??
          "No se pudo enviar el mensaje. Intenta de nuevo.";
        setError(message);
      } finally {
        setIsTyping(false);
        sendingRef.current = false;
      }
    },
    [conversationId],
  );

  const loadMessages = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await chatService.getConversationMessages(convId);
      setMessages(msgs);
      setConversationId(convId);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        "No se pudieron cargar los mensajes.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    isTyping,
    error,
    conversationId,
    sendMessage,
    loadMessages,
    clearError,
    resetChat,
  };
}
