import { apiClient } from "@/lib/api";
import type { GroupInfoData } from "@/app/components/GroupInfoModal";

export interface GroupInfo {
  id: string;
  codigo: string;
  area_curricular?: string | null;
  area_transversal?: string | null;
  eje_ambiental?: string | null;
  problematica?: string | null;
  grado?: string | null;
}

// ═══ Toggle de mock — cambiar a false cuando haya backend ═══
const USE_MOCK = false;

// ── Mock helpers ──────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mockGetGroupInfo(groupCode: string): Promise<GroupInfo | null> {
  await delay(300);
  // Simular un grupo con información incompleta
  return {
    id: "grp_001",
    codigo: groupCode,
    area_curricular: null,
    area_transversal: null,
    eje_ambiental: null,
    problematica: null,
    grado: null,
  };
}

async function mockUpdateGroupInfo(
  groupCode: string,
  data: GroupInfoData
): Promise<GroupInfo> {
  await delay(500);
  return {
    id: "grp_001",
    codigo: groupCode,
    area_curricular: data.area_curricular,
    area_transversal: data.area_transversal,
    eje_ambiental: data.eje_ambiental,
    problematica: data.problematica,
    grado: data.grado,
  };
}

// ── Public API ────────────────────────────────

/**
 * Obtiene la información del grupo basado en el código
 */
export async function getGroupInfo(
  groupCode: string
): Promise<GroupInfo | null> {
  if (USE_MOCK) {
    return mockGetGroupInfo(groupCode);
  }

  try {
    // Usar API backend que hace proxy a Supabase
    const response = await apiClient.get<GroupInfo[]>(
      `/grupos?codigo=${groupCode}`
    );

    if (Array.isArray(response) && response.length > 0) {
      return response[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching group info:", error);
    // En caso de error, retornar null para mostrar el formulario
    return null;
  }
}

/**
 * Verifica si el grupo tiene información incompleta
 */
export function hasIncompleteGroupInfo(groupInfo: GroupInfo | null): boolean {
  if (!groupInfo) return true;

  const requiredFields = [
    "area_curricular",
    "eje_ambiental",
    "problematica",
    "grado",
  ];

  return requiredFields.some(
    (field) =>
      !groupInfo[field as keyof GroupInfo] ||
      groupInfo[field as keyof GroupInfo] === ""
  );
}

/**
 * Actualiza la información del grupo
 */
export async function updateGroupInfo(
  groupCode: string,
  data: GroupInfoData
): Promise<GroupInfo> {
  if (USE_MOCK) {
    return mockUpdateGroupInfo(groupCode, data);
  }

  try {
    // Usar API backend que hace proxy a Supabase
    const response = await apiClient.patch<GroupInfo[]>(
      `/grupos/${groupCode}`,
      {
        area_curricular: data.area_curricular,
        area_transversal: data.area_transversal,
        eje_ambiental: data.eje_ambiental,
        problematica: data.problematica,
        grado: parseInt(data.grado, 10), // Asegurar que grado es número
      }
    );

    if (Array.isArray(response) && response.length > 0) {
      return response[0];
    }

    throw new Error("No se pudo actualizar la información del grupo");
  } catch (error) {
    console.error("Error updating group info:", error);
    throw error;
  }
}
