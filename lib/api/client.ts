// ─────────────────────────────────────────────
// HTTP Client — thin wrapper around fetch
// ─────────────────────────────────────────────
//
// Cuando el backend esté listo, solo debes:
//  1. Poner la URL real en NEXT_PUBLIC_API_URL (.env.local)
//  2. Remover / ajustar mock guards en los services
// ─────────────────────────────────────────────

import type { ApiError } from "@/lib/types";

// ─────────────────────────────────────────────
// API Configuration
// ─────────────────────────────────────────────
// NEXT_PUBLIC_API_URL: URL del backend (ej: https://tu-backend-railway.up.railway.app)
// En desarrollo: http://localhost:5000
// En producción: tu-url-railway.up.railway.app
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.API_URL || 
  "http://localhost:5000";

const BASE_URL = `${API_BASE_URL}`;

// ── Token helpers (client‑side only) ──────────

const TOKEN_KEY = "eco_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // Sincronizar como cookie para que el proxy (edge) pueda leerlo.
  // Cuando el backend esté listo y setee cookies httpOnly, eliminar esta línea.
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Eliminar la cookie también
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// ── Core fetch wrapper ────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Skip automatic Authorization header */
  public?: boolean;
  /** Extra headers */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Custom timeout in ms (default 15 000) */
  timeout?: number;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { public: isPublic = false, headers = {}, signal, timeout = 15_000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  if (!isPublic) {
    const token = getStoredToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    clearTimeout(timeoutId);

    // No-content responses
    if (res.status === 204) return undefined as T;

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const apiError: ApiError = {
        status: res.status,
        message: json?.message ?? res.statusText,
        errors: json?.errors,
      };
      throw apiError;
    }

    return (json?.data ?? json) as T;
  } catch (err) {
    clearTimeout(timeoutId);

    // Re-throw ApiError as-is
    if ((err as ApiError).status) throw err;

    // Network / abort errors
    const apiError: ApiError = {
      status: 0,
      message:
        (err as Error).name === "AbortError"
          ? "La solicitud tardó demasiado. Intenta de nuevo."
          : "Error de conexión. Verifica tu red.",
    };
    throw apiError;
  }
}

// ── Public convenience methods ────────────────

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),

  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};
