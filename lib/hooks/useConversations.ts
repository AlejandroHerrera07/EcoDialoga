"use client";

// ─────────────────────────────────────────────
// useConversations Hook
// ─────────────────────────────────────────────
// Carga la lista de conversaciones del estudiante
// desde chatService. Los datos vienen del mock o
// del API real según el toggle USE_MOCK.
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import type { Conversation } from "@/lib/types";
import * as chatService from "@/lib/services/chat.service";

interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ??
        "No se pudieron cargar las conversaciones.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { conversations, isLoading, error, reload: load };
}
