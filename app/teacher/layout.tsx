"use client";

import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { TeacherSidebar, TeacherMobileHeader } from "@/app/components/layout";
import { useState, useEffect } from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Protección de ruta: validar que el usuario sea profesor
  // Solo redirigir después de que la autenticación haya hidratado correctamente
  useEffect(() => {
    if (authLoading) return; // Esperar a que termine la hidratación
    
    if (user && user.role !== "teacher") {
      // Usuario no es profesor - redirigir al dashboard correspondiente
      router.replace(user.role === "student" ? "/student/chat" : "/login");
    } else if (!user) {
      // Sin usuario - redirigir a login
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background-light dark:bg-background-dark text-neutral-text dark:text-white">
      <TeacherSidebar 
        onLogout={handleLogout} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TeacherMobileHeader 
          onLogout={handleLogout} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        {children}
      </div>
    </div>
  );
}
