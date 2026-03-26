export interface FunctionMetric {
  label: string;
  description: string;
  color: string;
  value: number;
  hex: string;
  count?: number;  // Número de interacciones de este tipo
}

export interface CalidadData {
  nombre: string;
  promedio_calidad: number;
}

export interface DashboardMetricsResponse {
  status: string;
  inter_total: number;
  relev_prom: number;
  Cada_funcion: FunctionMetric[];
  total_relevantes: number;
  Total_irrelevantes: number;
  calidad_0: number;
  calidad_1: number;
  calidad_2: number;
  Promedio_calidad: number;
  calidad_promedio_data?: CalidadData[];
}

export interface DashboardMessage {
  id: number;
  student: string;
  date: string;
  group: string;
  content: string;
}

export interface Group {
  id: string;
  code: string;
  area: string;
  area_transversal: string;
  eje: string;
  macroEje: string;
  problematica: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  status: "active" | "archived" | "pending";
}

export interface Student {
  id: string;
  identifier: string;
  name: string;
  groupCode: string;
}
