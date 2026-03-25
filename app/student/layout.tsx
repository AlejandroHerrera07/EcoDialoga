"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/app/components/layout";
import { Icon } from "@/app/components/ui";
import { useAuth, useConversations } from "@/lib/hooks";
import { ConsentModal } from "@/app/components/ConsentModal";
import { GroupInfoModal, type GroupInfoData } from "@/app/components/GroupInfoModal";
import { ChatProvider } from "@/lib/contexts/ChatContext";
import * as authService from "@/lib/services/auth.service";
import * as groupsService from "@/lib/services/groups.service";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [hasCheckedGroupInfo, setHasCheckedGroupInfo] = useState(false);
  const { user, logout, refreshUser } = useAuth();
  const { conversations, isLoading: isLoadingConversations } = useConversations();
  const router = useRouter();

  // Protección de ruta: validar que el usuario sea estudiante
  useEffect(() => {
    if (user && user.role !== "student") {
      // Usuario no es estudiante - redirigir al dashboard correspondiente
      router.replace(user.role === "teacher" ? "/teacher/dashboard" : "/login");
    }
  }, [user, router]);

  // Verificar consentimiento y datos del grupo
  useEffect(() => {
    if (!user) return;

    // Resetear flags cuando cambia el usuario (logout/login)
    if (user?.id) {
      setHasCheckedGroupInfo(false);
      setShowGroupInfoModal(false);
    }

    // Si no ha dado consentimiento, mostrar modal
    if (user.consentimiento === false) {
      setShowConsentModal(true);
      return;
    }

    // Si ya dio consentimiento, verificar información del grupo
    if (user.consentimiento === true && !hasCheckedGroupInfo && !showConsentModal) {
      checkAndShowGroupInfoModal();
      setHasCheckedGroupInfo(true);
    }
  }, [user?.id, user?.consentimiento]);


  // Espera activa a que user?.groupCode esté disponible antes de continuar
  const waitForGroupCode = async (timeoutMs = 2000) => {
    const interval = 50;
    let waited = 0;
    while (!user?.groupCode && waited < timeoutMs) {
      await new Promise((res) => setTimeout(res, interval));
      waited += interval;
    }
    return user?.groupCode;
  };

  const checkAndShowGroupInfoModal = async () => {
    // Esperar a que user.groupCode esté disponible (máx 2s)
    await waitForGroupCode();
    if (!user?.groupCode) {
      console.warn("No se encontró groupCode tras esperar");
      return;
    }
    try {
      const groupInfo = await groupsService.getGroupInfo(user.groupCode);
      if (groupInfo && groupsService.hasIncompleteGroupInfo(groupInfo)) {
        setShowGroupInfoModal(true);
      }
    } catch (error) {
      console.error("Error checking group info:", error);
    }
  };

  const handleConsentAccept = async () => {
    try {
      await authService.updateConsent(true);
      await refreshUser(); // Refrescar el estado del usuario
      setShowConsentModal(false);
      
      // Inmediatamente verificar y mostrar modal de grupo si es necesario
      await checkAndShowGroupInfoModal();
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

  const handleGroupInfoSubmit = async (data: GroupInfoData) => {
    // Log para depuración
    console.log("[DEBUG] user al guardar grupo:", user);
    let groupCode = user?.groupCode;
    if (!groupCode) {
      // Intentar refrescar el usuario una vez
      await refreshUser();
      groupCode = user?.groupCode;
    }
    if (!groupCode) {
      alert("Error: El usuario no tiene código de grupo. Intenta recargar la página o cerrar sesión e ingresar de nuevo.");
      throw new Error("No se encontró código de grupo");
    }

    try {
      await groupsService.updateGroupInfo(groupCode, data);
      setShowGroupInfoModal(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error("Error al guardar información del grupo:", errorMsg);
      alert("Error al guardar la información. Por favor, intenta de nuevo.");
      throw error;
    }
  };

  const handleGroupInfoCancel = async () => {
    // Cerrar sesión si el usuario cancela
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
    <ChatProvider>
      <div className="h-screen flex overflow-hidden bg-white text-gray-800 relative">
        {showConsentModal && (
          <ConsentModal
            onAccept={handleConsentAccept}
            onReject={handleConsentReject}
          />
        )}
        {showGroupInfoModal && (
          <GroupInfoModal
            onSubmit={handleGroupInfoSubmit}
            onCancel={handleGroupInfoCancel}
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
    </ChatProvider>
  );
}
