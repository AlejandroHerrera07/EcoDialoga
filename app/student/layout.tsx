"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/app/components/layout";
import { Icon } from "@/app/components/ui";
import { useAuth, useConversations } from "@/lib/hooks";
import { ConsentModal } from "@/app/components/ConsentModal";
import * as authService from "@/lib/services/auth.service";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const { user, logout } = useAuth();
  const { conversations, isLoading: isLoadingConversations } = useConversations();
  const router = useRouter();

  // Verificar si necesita mostrar el modal de consentimiento
  useEffect(() => {
    if (user && user.consentimiento === false) {
      setShowConsentModal(true);
    }
  }, [user]);

  const handleConsentAccept = async () => {
    try {
      await authService.updateConsent(true);
      setShowConsentModal(false);
      // El usuario ya está autenticado, así que continúa normalmente
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error al aceptar consentimiento:", errorMsg);
      alert("Error al guardar tu consentimiento. Por favor, intenta de nuevo.");
    }
  };

  const handleConsentReject = async () => {
    await logout();
    router.push("/login");
  };

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
      {showConsentModal && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onReject={handleConsentReject}
        />
      )}
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
