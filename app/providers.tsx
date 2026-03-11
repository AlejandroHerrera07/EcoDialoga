"use client";

// ─────────────────────────────────────────────
// Client-side Providers wrapper
// ─────────────────────────────────────────────

import { type ReactNode } from "react";
import { AuthProvider } from "@/lib/hooks";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
