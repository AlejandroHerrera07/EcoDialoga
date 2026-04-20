import { DashboardMetricsResponse, DashboardMessage, Group, Student } from "@/lib/types";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

// --- Mock Data ---
const MOCK_MESSAGES: DashboardMessage[] = [
  { id: 1, student: "Ana Martínez", date: "2026-03-20", group: "ECO-2026-A", content: "Profesor, ¿podría explicarme el concepto de inflación de nuevo?" },
  { id: 2, student: "Carlos López", date: "2026-03-21", group: "ECO-2026-A", content: "¡Gracias por la retroalimentación en mi ensayo!" },
  { id: 3, student: "María Fernández", date: "2026-03-22", group: "BIO-101-C", content: "Tengo dudas sobre la fase de mitosis." },
  { id: 4, student: "Juan Pérez", date: "2026-03-23", group: "FIS-301-B", content: "¿Cuándo es la fecha límite para el proyecto de energías?" },
  { id: 5, student: "Sofía Castro", date: "2026-03-20", group: "ECO-2026-A", content: "No encuentro la lectura sobre macroeconomía." },
];

let MOCK_GROUPS: Group[] = [
  {
    id: "1",
    code: "ECO-2026-A",
    area: "Ciencias Económicas",
    macroEje: "Microeconomía",
    eje: "Microeconomía",
    area_transversal: "Economía y Sociedad",
    problematica: "Impacto de la inflación local",
    icon: "science",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    status: "active",
  },
  {
    id: "2",
    code: "BIO-101-C",
    area: "Biología",
    macroEje: "Genética",
    eje: "Genética",
    area_transversal: "Ciencias de la Vida",
    problematica: "Conservación de especies",
    icon: "biotech",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    status: "active",
  },
  {
    id: "3",
    code: "FIS-301-B",
    area: "Física",
    eje: "Mecánica",
    macroEje: "Mecánica",
    area_transversal: "Ciencias Exactas",
    problematica: "Energías renovables alternativas",
    icon: "psychology",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    status: "active",
  },
  {
    id: "4",
    code: "GEO-104-A",
    area: "Geografía",
    eje: "Geopolítica",
    macroEje: "Geopolítica",
    area_transversal: "Ciencias Sociales",
    problematica: "Conflictos territoriales modernos",
    icon: "globe",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    status: "pending",
  },
];

let MOCK_STUDENTS: Student[] = [
  { id: "1", identifier: "EST-001", name: "Ana Martínez", groupCode: "ECO-2026-A" },
  { id: "2", identifier: "EST-002", name: "Carlos López", groupCode: "ECO-2026-A" },
  { id: "3", identifier: "EST-003", name: "María Fernández", groupCode: "BIO-101-C" },
  { id: "4", identifier: "EST-004", name: "Juan Pérez", groupCode: "FIS-301-B" },
];

const MOCK_AVAILABLE_GROUPS = ["ECO-2026-A", "BIO-101-C", "FIS-301-B", "GEO-104-A"];
// -----------------

const fallbackOnError = async <T>(apiCall: () => Promise<T>, mockFallback: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn("API failed, using mock data:", error);
    return await mockFallback();
  }
};

export const getDashboardMetrics = async (
  groupCode?: string | null,
  fecha?: string | null
): Promise<DashboardMetricsResponse> => {
  return fallbackOnError(
    async () => {
      const url = new URL(API_ENDPOINTS.TEACHER_METRICS, "http://dummy.com");
      // Enviar parámetro codigo_grupo solo si se seleccionó un grupo específico (no vacío)
      if (groupCode) url.searchParams.append("codigo_grupo", groupCode);
      if (fecha) url.searchParams.append("fecha", fecha);
      return await apiClient.get<DashboardMetricsResponse>(url.pathname + url.search);
    },
    async () => {
      // Simulación de delay de red
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulamos la variacion de metricas según el groupCode aportado (si es null muestra la base)
      const multiplier = groupCode ? 0.6 : 1;

      return {
        status: "success",
        inter_total: Math.floor(1240 * multiplier),
        relev_prom: Math.floor(88 * multiplier),
        Cada_funcion: [
          {
            label: "Redacción / mejora de texto (25%)",
            description: "Correcciones y estilo",
            color: "bg-teal-500",
            value: 25,
            hex: "#14b8a6",
          },
          {
            label: "Generación de ideas (15%)",
            description: "Lluvia de ideas",
            color: "bg-mint-accent",
            value: 15,
            hex: "#C5ECBE",
          },
          {
            label: "Orientación metodológica (20%)",
            description: "Estructura y proceso",
            color: "bg-blue-400",
            value: 20,
            hex: "#60a5fa",
          },
          {
            label: "Búsqueda de información (10%)",
            description: "Datos y fuentes",
            color: "bg-purple-400",
            value: 10,
            hex: "#c084fc",
          },
          {
            label: "Revisión teórica (15%)",
            description: "Conceptos y teoría",
            color: "bg-orange-400",
            value: 15,
            hex: "#fb923c",
          },
          {
            label: "Evaluación (15%)",
            description: "Feedback y análisis",
            color: "bg-teal-accent",
            value: 15,
            hex: "#4797B1",
          },
        ],
        total_relevantes: Math.floor(850 * multiplier),
        Total_irrelevantes: Math.floor(390 * multiplier),
        calidad_0: Math.floor(15 * multiplier),
        calidad_1: Math.floor(45 * multiplier),
        calidad_2: Math.floor(40 * multiplier),
        Promedio_calidad: 1.3,
      };
    }
  );
};

export const getRecentMessages = async (
  groupCode?: string | null,
  fecha?: string | null
): Promise<DashboardMessage[]> => {
  return fallbackOnError(
    async () => {
      const url = new URL(API_ENDPOINTS.TEACHER_RECENT_MESSAGES, "http://dummy.com");
      // Enviar parámetro codigo_grupo solo si se seleccionó un grupo específico (no vacío)
      if (groupCode) url.searchParams.append("codigo_grupo", groupCode);
      if (fecha) url.searchParams.append("fecha", fecha);
      const response = await apiClient.get<DashboardMessage[]>(url.pathname + url.search);
      // La respuesta ahora es directamente un array
      return Array.isArray(response) ? response : [];
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return MOCK_MESSAGES.filter(msg => 
        (!groupCode || msg.group === groupCode) && 
        (!fecha || msg.date === fecha)
      );
    }
  );
};

export const getGroups = async (): Promise<Group[]> => {
  return fallbackOnError(
    async () => {
      return await apiClient.get<Group[]>(API_ENDPOINTS.TEACHER_GROUPS);
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return [...MOCK_GROUPS];
    }
  );
};

export const createGroup = async (newGroupData: Partial<Group>): Promise<Group> => {
  return fallbackOnError(
    async () => {
      const response = await apiClient.post<Group>(
        API_ENDPOINTS.TEACHER_GROUPS_CREATE,
        {
          codigo_grupo: newGroupData.code
        }
      );
      return response;
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newGroup: Group = {
        id: Date.now().toString(),
        code: newGroupData.code || "NUEVO",
        area: newGroupData.area || "Nueva Área",
        eje: newGroupData.eje || "Nuevo Eje",
        macroEje: newGroupData.macroEje || "Nuevo Macro Eje",
        area_transversal: newGroupData.area_transversal || "Nueva Área Transversal",
        problematica: newGroupData.problematica || "Nueva Problemática",
        icon: newGroupData.icon || "science",
        iconBg: newGroupData.iconBg || "bg-blue-50",
        iconColor: newGroupData.iconColor || "text-blue-600",
        status: newGroupData.status || "pending",
      };
      MOCK_GROUPS = [newGroup, ...MOCK_GROUPS];
      return newGroup;
    }
  );
};

export const getStudents = async (): Promise<Student[]> => {
  return fallbackOnError(
    async () => {
      const response = await apiClient.get<Student[]>(API_ENDPOINTS.TEACHER_STUDENTS);
      return Array.isArray(response) ? response : [];
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return [...MOCK_STUDENTS];
    }
  );
};

export const createStudent = async (newStudentData: Partial<Student>): Promise<Student> => {
  return fallbackOnError(
    async () => {
      const response = await apiClient.post<Student>(
        API_ENDPOINTS.TEACHER_STUDENTS,
        {
          identificador_estudiante: newStudentData.identifier,
          nombre_anonimo: newStudentData.name,
          codigo_grupo: newStudentData.groupCode
        }
      );
      return response;
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newStudent: Student = {
        id: Date.now().toString(),
        identifier: newStudentData.identifier || "EST-NUEVO",
        name: newStudentData.name || "Nuevo Estudiante",
        groupCode: newStudentData.groupCode || "NUEVO",
      };
      MOCK_STUDENTS = [newStudent, ...MOCK_STUDENTS];
      return newStudent;
    }
  );
};

export const getAvailableGroups = async (): Promise<string[]> => {
  return fallbackOnError(
    async () => {
      // Si la API retorna los grupos completos, mapeamos solo sus códigos
      const response = await apiClient.get<Group[]>(API_ENDPOINTS.TEACHER_GROUPS);
      return response.map(g => g.code);
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_GROUPS.map(g => g.code);
    }
  );
};
