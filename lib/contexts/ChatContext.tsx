"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface ChatContextType {
  sendMessage: ((content: string) => Promise<void>) | null;
  registerSendMessage: (fn: (content: string) => Promise<void>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sendMessage, setSendMessage] = useState<
    ((content: string) => Promise<void>) | null
  >(null);

  const registerSendMessage = useCallback(
    (fn: (content: string) => Promise<void>) => {
      setSendMessage(() => fn);
    },
    []
  );

  return (
    <ChatContext.Provider value={{ sendMessage, registerSendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

export function useRegisterSendMessage(
  sendMessage: (content: string) => Promise<void>
) {
  const { registerSendMessage } = useChatContext();
  
  useEffect(() => {
    registerSendMessage(sendMessage);
  }, [registerSendMessage, sendMessage]);
}
