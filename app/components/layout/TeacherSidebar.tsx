"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/app/components/ui";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAx4KN6gBYYFBYiChWfhlgZ8a6ruIF-xlEk0m7qTgSW_a_bWzcsJ2T90W0ZYWb2mUeVROjsAbchMJ8Zp9m6ZjkirLk-bf-eFIsrSozYGNDolR6EvsiEK9xTolZQdAgup8aAfjfGXUDuLrH8HnRF44KTR1fpv5nhB9xCBEdCq3bGW_Vd4YRRmQvTAfH1d_1XJsbd7V06J-aDuK_tkc5wXklik3zompWxKv42SPyG4tIV-K4cuDOSKPfakjhMBgvjvQpCqUWLzkxd7Q";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Panel", href: "/teacher/dashboard", icon: "dashboard" },
  { label: "Mis Grupos", href: "/teacher/groups", icon: "groups" },
  { label: "Estudiantes", href: "/teacher/students", icon: "school" },
];

interface TeacherSidebarProps {
  className?: string;
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TeacherSidebar({ className, onLogout, isOpen, onClose }: TeacherSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-slate-200 h-screen shrink-0 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 bg-white",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between p-6 w-full gap-3">
          <div className="flex items-center gap-3">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0"
              style={{ backgroundImage: `url('${LOGO_URL}')` }}
            />
            <div className="flex flex-col">
              <h1 className="text-neutral-text text-lg font-bold leading-tight">
                EcoDialoga
              </h1>
              <p className="text-subtle-text text-xs font-normal">Portal Docente</p>
            </div>
          </div>
          {/* Close button inside Drawer, only visible logically in mobile */}
          <button 
            type="button" 
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-800"
          >
            <Icon name="close" size="md" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-4 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group",
                  isActive ? "bg-primary/10" : "hover:bg-slate-50"
                )}
              >
                <Icon
                  name={item.icon}
                  filled={isActive}
                  className={cn(
                    isActive
                      ? "text-primary"
                      : "text-subtle-text group-hover:text-primary transition-colors"
                  )}
                />
                <span
                  className={cn(
                    isActive
                      ? "text-primary font-bold"
                      : "text-subtle-text font-medium group-hover:text-primary"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onLogout?.();
            }}
            className="flex items-center gap-2 p-2 w-full text-left rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Icon name="logout" size="sm" />
            Cerrar Sesión
          </button>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <Icon name="person" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-neutral-text truncate">
                Profesora Andrea
              </p>
              <p className="text-xs text-subtle-text truncate">Docente directora</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

interface TeacherMobileHeaderProps {
  onLogout?: () => void;
  onMenuClick?: () => void;
}

export function TeacherMobileHeader({ onLogout, onMenuClick }: TeacherMobileHeaderProps) {
  return (
    <header className="lg:hidden bg-white p-4 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-slate-500 hover:text-slate-800 p-1"
          aria-label="Toggle menu"
        >
          <Icon name="menu" size="md" />
        </button>
        <div
          className="bg-center bg-no-repeat bg-cover rounded-full size-8 shrink-0 hidden sm:block"
          style={{ backgroundImage: `url('${LOGO_URL}')` }}
        />
        <span className="font-bold text-lg text-neutral-text">EcoDialoga</span>
      </div>
      <button 
        type="button"
        onClick={() => onLogout?.()}
        className="flex items-center gap-2 text-subtle-text hover:text-red-500 transition-colors"
      >
        <span className="text-sm font-medium">Salir</span>
        <Icon name="logout" size="sm" />
      </button>
    </header>
  );
}
