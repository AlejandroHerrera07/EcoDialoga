"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Icon } from "@/app/components/ui";
import { useChatContext } from "@/lib/contexts/ChatContext";

interface ConversationItem {
  id: string;
  title: string;
}

interface StudentSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  conversations?: ConversationItem[];
  isLoadingConversations?: boolean;
  className?: string;
  userName?: string;
  userCode?: string;
  onLogout?: () => void;
  onSendSummaryMessage?: () => void;
  onSendTemplateMessage?: () => void;
}

export function StudentSidebar({
  isOpen = true,
  onToggle,
  conversations = [],
  isLoadingConversations = false,
  className,
  userName = "Estudiante",
  userCode,
  onLogout,
  onSendSummaryMessage,
  onSendTemplateMessage,
}: StudentSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChatContext();

  const handleSendSummaryMessage = async () => {
    if (sendMessage) {
      await sendMessage(
        "Por favor, proporciona un resumen de nuestra conversación hasta ahora."
      );
    }
    onSendSummaryMessage?.();
  };

  const handleSendTemplateMessage = async () => {
    if (sendMessage) {
      await sendMessage(
        "Por favor genera una lista de los items del Anexo 10 con base en nuestra conversación hasta ahora."
      );
    }
    onSendTemplateMessage?.();
  };

  useEffect(() => {
    if (sidebarRef.current && contentRef.current) {
      gsap.to(sidebarRef.current, {
        width: isOpen ? 300 : 0,
        duration: 0.35,
        ease: "power2.inOut",
      });
      gsap.to(contentRef.current, {
        opacity: isOpen ? 1 : 0,
        x: isOpen ? 0 : -20,
        duration: 0.25,
        ease: "power2.inOut",
      });
    }
  }, [isOpen]);

  // Animate conversations on mount
  useEffect(() => {
    if (contentRef.current && isOpen) {
      const items = contentRef.current.querySelectorAll(".conversation-item");
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          delay: 0.2,
          ease: "power2.out",
        }
      );
    }
  }, [isOpen]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden",
        className
      )}
      style={{ width: isOpen ? 300 : 0 }}
    >
      <div ref={contentRef} className="flex flex-col h-full min-w-[300px]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Icon name="menu" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">EcoDialoga</span>
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="px-4 pb-4">
          <button 
            onClick={handleSendSummaryMessage}
            className="flex items-center gap-3 w-fit px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full transition-all duration-200 shadow-sm border border-gray-100 hover:scale-[1.02] active:scale-[0.98]">
            <Icon name="add" size="md" className="text-teal-accent" />
            <span className="text-sm font-medium">Mensaje de ayuda(Resumen)</span>
          </button>
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={handleSendTemplateMessage}
            className="flex items-center gap-3 w-fit px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full transition-all duration-200 shadow-sm border border-gray-100 hover:scale-[1.02] active:scale-[0.98]">
            <Icon name="add" size="md" className="text-teal-accent" />
            <span className="text-sm font-medium">Items de plantilla</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scroll px-2 pb-4">
          {isLoadingConversations ? (
            <div className="px-4 py-2 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <div className="w-5 h-5 bg-gray-200 rounded animate-pulse shrink-0" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                </div>
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="mb-4">
              <h3 className="px-4 py-2 text-xs font-medium text-gray-500">Conversaciones</h3>
              <ul className="space-y-1">
                {conversations.map((conversation) => (
                  <li key={conversation.id} className="conversation-item">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-all duration-200 truncate hover:scale-[1.01]">
                      <Icon name="chat_bubble_outline" size="sm" />
                      <span className="truncate">{conversation.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Icon name="chat" className="text-gray-300 mx-auto mb-2" size="xl" />
              <p className="text-sm text-gray-400">Mensajes de ayuda</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-teal-accent/20 flex items-center justify-center shrink-0">
              <Icon name="person" size="sm" className="text-teal-accent" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="leading-none text-gray-800 text-sm font-medium truncate">{userName}</span>
              {userCode && <span className="text-[10px] text-gray-500 mt-0.5">{userCode}</span>}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <Icon name="logout" size="md" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
