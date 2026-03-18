"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Icon } from "@/app/components/ui";
import { ChatMessage, ChatInput } from "@/app/components/chat";
import { useAuth, useChat, useConversations } from "@/lib/hooks";
import { useRegisterSendMessage } from "@/lib/contexts/ChatContext";

export default function StudentChatPage() {
  const { user } = useAuth();
  const { conversations } = useConversations();
  const {
    messages,
    isLoading,
    isTyping,
    error,
    sendMessage,
    loadMessages,
    clearError,
  } = useChat();

  // Register sendMessage with the context
  useRegisterSendMessage(sendMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);
  const hasLoadedRef = useRef(false);

  // Load the most recent conversation's messages from the service on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    if (conversations.length > 0) {
      hasLoadedRef.current = true;
      loadMessages(conversations[0].id);
    }
  }, [conversations, loadMessages]);

  // Animate greeting on mount
  useEffect(() => {
    if (greetingRef.current) {
      const lines = greetingRef.current.children;
      gsap.fromTo(
        lines,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    }
  }, []);

  // Animate initial messages on mount
  useEffect(() => {
    if (messagesContainerRef.current) {
      const messageElements = messagesContainerRef.current.children;
      gsap.fromTo(
        messageElements,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.2,
          delay: 0.8,
          ease: "power2.out",
        }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Animate new messages when they arrive
  useEffect(() => {
    if (messages.length > prevMessageCount.current && messagesContainerRef.current) {
      const messageElements = messagesContainerRef.current.children;
      const newCount = messages.length - prevMessageCount.current;
      for (let i = 0; i < newCount; i++) {
        const idx = messageElements.length - newCount + i;
        if (messageElements[idx]) {
          const isUser = messages[messages.length - newCount + i]?.role === "user";
          gsap.fromTo(
            messageElements[idx],
            { opacity: 0, x: isUser ? 30 : -30, y: 10 },
            { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "back.out(1.2)" }
          );
        }
      }
      scrollToBottom();
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content);
  };

  return (
    <main className="flex-1 bg-cream-bg relative flex flex-col overflow-hidden text-gray-800">
      {/* Profile Icon - Top Right */}
      <div className="absolute top-0 right-0 p-6 z-10">
        <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-sm bg-teal-accent/20 cursor-pointer hover:ring-2 hover:ring-teal-accent/50 transition-all hover:scale-105 flex items-center justify-center">
          <Icon name="person" className="text-teal-accent" />
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto main-scroll flex flex-col items-center w-full">
        <div className="w-full max-w-3xl flex flex-col min-h-full px-6 pt-20 pb-8">
          {/* Greeting */}
          <div ref={greetingRef} className="mb-12 mt-10">
            <h1 className="text-5xl font-medium tracking-tight text-gray-800 mb-2">
              <span className="gradient-text">Hola, {user?.name ?? "Estudiante"}</span>
            </h1>
            <h2 className="text-5xl font-medium tracking-tight text-gray-400/80">
              ¿Por dónde empezamos?
            </h2>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="error" size="sm" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-red-400 hover:text-red-600">
                <Icon name="close" size="sm" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex flex-col gap-8 w-full mb-10">
            {isLoading ? (
              <MessagesSkeleton />
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  userName={user?.name ?? "Tú"}
                />
              ))
            )}
            {isTyping && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput 
        placeholder="Escribe tu mensaje aquí..." 
        onSend={handleSendMessage}
      />
    </main>
  );
}

function TypingIndicator() {
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dotsRef.current) {
      const dots = dotsRef.current.children;
      gsap.to(dots, {
        y: -5,
        stagger: 0.12,
        repeat: -1,
        yoyo: true,
        duration: 0.35,
        ease: "power1.inOut",
      });
    }
  }, []);

  return (
    <div className="flex gap-4 w-full group">
      <div className="h-8 w-8 shrink-0 rounded-full bg-teal-accent flex items-center justify-center mt-1 shadow-sm text-white">
        <Icon name="smart_toy" size="sm" />
      </div>
      <div className="flex flex-col gap-1 max-w-[90%]">
        <div className="font-medium text-sm text-gray-600">EcoDialoga IA</div>
        <div className="px-5 py-4 bg-pastel-green rounded-2xl rounded-tl-sm shadow-sm">
          <div ref={dotsRef} className="flex gap-1.5">
            <div className="w-2 h-2 bg-teal-accent/60 rounded-full" />
            <div className="w-2 h-2 bg-teal-accent/60 rounded-full" />
            <div className="w-2 h-2 bg-teal-accent/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-4 w-full ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 animate-pulse mt-1" />
          <div className={`flex flex-col gap-2 max-w-[70%] ${i % 2 === 0 ? "items-end" : ""}`}>
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="h-16 w-64 bg-gray-100 animate-pulse rounded-2xl" />
          </div>
        </div>
      ))}
    </>
  );
}
