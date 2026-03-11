"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/app/components/layout";
import { Icon } from "@/app/components/ui";
import { useAuth, useConversations } from "@/lib/hooks";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { conversations, isLoading: isLoadingConversations } = useConversations();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Map Conversation[] to sidebar format
  const sidebarConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  return (
    <div className="h-screen flex overflow-hidden bg-white text-gray-800 relative">
      <StudentSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={sidebarConversations}
        isLoadingConversations={isLoadingConversations}
        userName={user?.name}
        userCode={user?.studentCode}
        onLogout={handleLogout}
      />
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-20 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Abrir historial"
        >
          <Icon name="menu" />
        </button>
      )}
      {children}
    </div>
  );
}
