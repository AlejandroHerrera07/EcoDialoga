"use client";

import { useAuth } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { TeacherSidebar, TeacherMobileHeader } from "@/app/components/layout";
import { useState } from "react";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
