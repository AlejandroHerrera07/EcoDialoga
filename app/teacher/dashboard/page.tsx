"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { Button, Icon } from "@/app/components/ui";
import { useTeacherDashboard, useGroups } from "@/lib/hooks";
import { FunctionMetric, DashboardMessage } from "@/lib/types";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
}

function AnimatedCounter({ value, suffix = "", duration = 1.5, delay = 0.3 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const countRef = useRef({ value: 0 });

  useEffect(() => {
    if (ref.current) {
      gsap.to(countRef.current, {
        value,
        duration,
        delay,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) {
            const formatted = countRef.current.value >= 1000
              ? Math.round(countRef.current.value).toLocaleString()
              : Math.round(countRef.current.value).toString();
            ref.current.textContent = formatted + suffix;
          }
        },
      });
    }
  }, [value, duration, delay, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

function AnimatedMetricCard({
  title,
  value,
  suffix = "",
  change,
  changeLabel,
  icon,
  delay = 0,
}: {
  title: string;
  value: number;
  suffix?: string;
  change: number;
  changeLabel: string;
  icon: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, delay, ease: "power2.out" }
      );
    }
  }, [delay]);

  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-xl p-6 shadow-sm border-t-[6px] border-mint-accent flex flex-col gap-2 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <p className="text-subtle-text text-sm font-medium uppercase tracking-wider">
          {title}
        </p>
        <span className="material-symbols-outlined text-teal-accent bg-teal-accent/10 p-1.5 rounded-lg text-[20px]">
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mt-2">
        <p className="text-neutral-text text-4xl font-bold tracking-tight">
          <AnimatedCounter value={value} suffix={suffix} delay={delay + 0.3} />
        </p>
        <span
          className={`flex items-center text-sm font-bold px-2 py-0.5 rounded-full ${
            isPositive
              ? "text-success bg-success/10"
              : isNeutral
              ? "text-subtle-text bg-slate-100"
              : "text-red-600 bg-red-100"
          }`}
        >
          <Icon
            name={isPositive ? "arrow_upward" : isNeutral ? "remove" : "arrow_downward"}
            size="sm"
          />
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-subtle-text text-xs mt-1">{changeLabel}</p>
    </div>
  );
}

interface CalidadChartData {
  name: string;
  calidad: number;
}

function QualityLineChart({ promedio, calidadData }: { promedio: number; calidadData?: { nombre: string; promedio_calidad: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Transformar datos del backend al formato esperado por el chart
  const dataRef = useRef<CalidadChartData[]>(
    calidadData && calidadData.length > 0
      ? calidadData.map((item, i) => ({
          name: `R ${i + 1}`,
          calidad: item.promedio_calidad
        }))
      : Array.from({ length: 30 }, (_, i) => ({
          name: `R ${i + 1}`,
          calidad: 0
        }))
  );

  const data = dataRef.current;

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-neutral-text text-lg font-bold">
            Calidad del respuesta del asistente
          </h3>
          <p className="text-subtle-text text-sm">
            Evolución y pertinencia de las respuestas
          </p>
        </div>
        <Button variant="ghost" size="sm" icon="more_horiz" />
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
        {/* Gráfico */}
        <div className="flex-1 h-48 w-full min-w-0">
          <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 9 }} 
                dy={10}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                domain={[0, 2]}
                hide
              />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="calidad" 
                stroke="#14b8a6" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: '#0f766e', strokeWidth: 0 }} 
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dato al lado: Promedio de calidad */}
        <div className="w-36 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
          <span className="text-subtle-text text-[10px] uppercase tracking-wider font-bold mb-2 text-center">
            Promedio de<br/>calidad
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-primary">{promedio.toFixed(1)}</span>
            <span className="text-subtle-text font-medium text-sm">/ 2</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-mint-accent text-xs font-semibold">
            <Icon name="trending_up" className="!text-sm" />
            <span>+0.2 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedDonutChart({ functionData, totalInteractions }: { functionData: FunctionMetric[], totalInteractions: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Animate container
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.4, ease: "power2.out" }
      );
    }

    // Animate counter
    if (counterRef.current) {
      const count = { value: 0 };
      gsap.to(count, {
        value: totalInteractions,
        duration: 1.5,
        delay: 0.8,
        ease: "power2.out",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = Math.round(count.value).toString();
          }
        },
      });
    }
  }, [totalInteractions]);

  return (
    <div ref={containerRef} className="bg-white rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-neutral-text text-lg font-bold">
            Funciones
          </h3>
          <p className="text-subtle-text text-sm">
            Desglose de uso de IA
          </p>
        </div>
        <Button variant="ghost" size="sm" icon="filter_list" />
      </div>
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 relative">
        {/* Recharts PieChart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
              <Pie
                data={functionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                animationDuration={1500}
              >
                {functionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hex} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 m-auto w-24 h-24 bg-transparent rounded-full flex flex-col items-center justify-center pointer-events-none">
            <span ref={counterRef} className="text-3xl font-bold text-neutral-text">
              0
            </span>
            <span className="text-xs text-subtle-text font-medium">
              Consultas
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {functionData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} />
              <div>
                <p className="text-xs font-bold text-neutral-text leading-tight">
                  {item.label}
                </p>
                <p className="text-[10px] text-subtle-text leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboardPage() {
  const headerRef = useRef<HTMLElement>(null);
  
  // Panel Filters State
  const [panelGroup, setPanelGroup] = useState<string>("");
  const [panelDate, setPanelDate] = useState<string>("");

  // Get Groups
  const { groups } = useGroups();

  // Dashboard Metrics Hook
  const { data: metrics, messages, isLoading, error } = useTeacherDashboard({
    groupId: panelGroup || null,
    date: panelDate || null
  });

  // New state for message filtering
  const [msgGroup, setMsgGroup] = useState("");
  const [msgDate, setMsgDate] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState<DashboardMessage[]>([]);
  
  // DEBUG: Log filter state changes
  useEffect(() => {
    console.log(`[DASHBOARD] Filter state changed:`, {
      panelGroup: panelGroup || 'ninguno',
      panelDate: panelDate || 'ninguna',
      isLoading,
      hasError: !!error,
      hasMetrics: !!metrics && metrics.inter_total > 0
    });
  }, [panelGroup, panelDate, isLoading, error, metrics]);

  const handleSearchMessages = () => {
    if (!msgGroup && !msgDate) return;
    
    const results = messages.filter(msg => {
      const matchGroup = msgGroup ? msg.group === msgGroup : true;
      const matchDate = msgDate ? msg.date === msgDate : true;
      return matchGroup && matchDate;
    });
    
    setFilteredMessages(results);
    setHasSearched(true);
  };

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-cream-bg">
      {/* Header */}
      <header ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between px-8 py-6 bg-cream-bg flex-shrink-0 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-neutral-text text-3xl font-black tracking-tight">
            Panel de Métricas
          </h2>
          <p className="text-subtle-text text-sm font-medium">
            Resumen de Métricas y Análisis del año 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={panelGroup} 
            onChange={(e) => setPanelGroup(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg outline-none focus:ring-2 focus:ring-mint-accent focus:border-mint-accent block p-2.5 shadow-sm min-w-[160px] cursor-pointer"
          >
            <option value="">Todos los grupos</option>
            {groups.map(group => (
              <option key={group.id} value={group.code}>{group.code}</option>
            ))}
          </select>
          <input 
            type="date" 
            value={panelDate}
            onChange={(e) => setPanelDate(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg outline-none focus:ring-2 focus:ring-mint-accent focus:border-mint-accent block p-2.5 shadow-sm min-w-[140px] cursor-pointer"
          />
          <Button variant="teal" icon="download" className="hover:scale-105 active:scale-95 transition-transform">
            Exportar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-mint-accent">
              <Icon name="progress_activity" className="animate-spin !text-4xl" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3">
              <Icon name="error" />
              <p>Error cargando métricas del dashboard.</p>
            </div>
          ) : metrics && (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatedMetricCard
                  title="INTERACCIONES TOTALES"
                  value={metrics.inter_total}
                  change={12}
                  changeLabel="Vs. últimos 30 días"
                  icon="chat_bubble"
                  delay={0}
                />
                <AnimatedMetricCard
                  title="RELEVANCIA PROMEDIO"
                  value={metrics.relev_prom}
                  suffix="%"
                  change={5}
                  changeLabel="Puntuación de precisión IA"
                  icon="target"
                  delay={0.1}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]">
                <QualityLineChart 
                  promedio={metrics.Promedio_calidad}
                  calidadData={metrics.calidad_promedio_data}
                />
                <AnimatedDonutChart 
                  functionData={metrics.Cada_funcion} 
                  totalInteractions={metrics.Cada_funcion.reduce((acc, curr) => acc + curr.value, 0)} 
                />
              </div>
            </>
          )}

          {/* New Messages Filtering Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6 mt-2">
            <div>
              <h3 className="text-neutral-text text-lg font-bold">Filtro de Mensajes</h3>
              <p className="text-subtle-text text-sm">Explora las consultas y comunicaciones de los estudiantes por fecha y grupo (independiente a los filtros de métricas generales).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Grupo</label>
                <select 
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg outline-none focus:ring-2 focus:ring-mint-accent focus:border-mint-accent block w-full p-2.5 shadow-sm cursor-pointer"
                  value={msgGroup}
                  onChange={(e) => setMsgGroup(e.target.value)}
                >
                  <option value="">Selecciona un grupo</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.code}>{group.code}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg outline-none focus:ring-2 focus:ring-mint-accent focus:border-mint-accent block w-full p-2.5 shadow-sm cursor-pointer"
                  value={msgDate}
                  onChange={(e) => setMsgDate(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button variant="primary" icon="search" onClick={handleSearchMessages} disabled={!msgGroup && !msgDate}>
                  Buscar
                </Button>
              </div>
            </div>

            {hasSearched && (
              <div className="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-xl bg-white mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-mint-accent">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#2c5c23] sm:pl-6 w-1/4">
                        Estudiante
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#2c5c23]">
                        Mensaje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredMessages.length > 0 ? (
                      filteredMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {msg.student}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-600">
                            {msg.content}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-sm text-gray-500">
                          No se encontraron mensajes para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
