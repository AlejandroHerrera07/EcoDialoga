// ─────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────
// Contiene la lógica real + mocks de desarrollo.
// Cuando el backend esté listo:
//   → Elimina las funciones mock*
//   → Quita los guards USE_MOCK
// ─────────────────────────────────────────────

import { apiClient, API_ENDPOINTS, setStoredToken, removeStoredToken } from "@/lib/api";
import type { LoginRequest, LoginResponse, User } from "@/lib/types";

// ═══ Toggle de mock — cambiar a false cuando haya backend ═══
const USE_MOCK = false;

// ── Mock helpers ──────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  await delay(800);

  // Validación simulada
  if (!payload.groupCode || !payload.studentCode) {
    throw { status: 400, message: "Los campos son obligatorios." };
  }

  return {
    token: "mock_jwt_token_" + Date.now(),
    user: {
      id: "usr_mock_001",
      name: "Juan Camilo",
      studentCode: payload.studentCode,
      groupCode: payload.groupCode,
      role: "student",
    },
  };
}

async function mockGetMe(): Promise<User> {
  await delay(300);
  return {
    id: "usr_mock_001",
    name: "Juan Camilo",
    studentCode: "EST-001",
    groupCode: "ECO-2026-A",
    role: "student",
  };
}

// ── Public API ────────────────────────────────

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) {
    const res = await mockLogin(payload);
    setStoredToken(res.token);
    return res;
  }

  const res = await apiClient.post<LoginResponse>(
    API_ENDPOINTS.LOGIN,
    payload,
    { public: true },
  );
  setStoredToken(res.token);
  return res;
}

export async function logout(): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post(API_ENDPOINTS.LOGOUT).catch(() => {});
  }
  removeStoredToken();
}

export async function getMe(): Promise<User> {
  if (USE_MOCK) return mockGetMe();
  return apiClient.get<User>(API_ENDPOINTS.ME);
}

export async function updateConsent(consentimiento: boolean): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.put("/auth/consent", { consentimiento });
  }
}
