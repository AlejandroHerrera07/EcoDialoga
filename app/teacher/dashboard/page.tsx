"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button, Icon } from "@/app/components/ui";

const barData = [
  { label: "Investigación", value: 45, height: 140 },
  { label: "Ideación", value: 78, height: 240 },
  { label: "Borrador", value: 32, height: 100 },
  { label: "Refinamiento", value: 60, height: 180 },
];

const qualityData = [
  {
    label: "Alta Calidad (55%)",
    description: "Clara, relevante, accionable",
    color: "bg-teal-accent",
  },
  {
    label: "Necesita Contexto (30%)",
    description: "Correcto pero vago",
    color: "bg-mint-accent",
  },
  {
    label: "Fuera de Tema (15%)",
    description: "Irrelevante o confuso",
    color: "bg-slate-200",
  },
];

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

function AnimatedBarChart() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate container first
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" }
      );
    }

    // Then animate bars
    barsRef.current.forEach((bar, index) => {
      if (bar) {
        gsap.fromTo(
          bar,
          { height: 0 },
          {
            height: barData[index].height,
            duration: 0.8,
            delay: 0.6 + index * 0.15,
            ease: "power2.out",
          }
        );
      }
    });
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-neutral-text text-lg font-bold">
            Momentos del Proceso
          </h3>
          <p className="text-subtle-text text-sm">
            Participación por fase de aprendizaje
          </p>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-lg text-subtle-text transition-colors">
          <Icon name="more_horiz" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-end gap-4">
        <div className="flex-1 flex items-end justify-around gap-4 px-4 pb-2 border-b border-slate-200">
          {barData.map((bar, index) => (
            <div
              key={index}
              className="w-16 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                {bar.value}%
              </div>
              <div
                ref={(el) => { barsRef.current[index] = el; }}
                className="w-full bg-mint-accent rounded-t-lg hover:bg-teal-accent transition-colors relative"
                style={{ height: 0 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-around px-4 text-xs font-semibold text-subtle-text uppercase tracking-wide">
          {barData.map((bar, index) => (
            <span key={index} className="w-16 text-center">
              {bar.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedDonutChart() {
  const donutRef = useRef<HTMLDivElement>(null);
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

    // Animate donut segments
    if (donutRef.current) {
      gsap.fromTo(
        donutRef.current,
        {
          background: `conic-gradient(
            #4797B1 0% 0%, 
            #C5ECBE 0% 0%, 
            #f1f5f9 0% 100%
          )`,
        },
        {
          background: `conic-gradient(
            #4797B1 0% 55%, 
            #C5ECBE 55% 85%, 
            #f1f5f9 85% 100%
          )`,
          duration: 1.2,
          delay: 0.8,
          ease: "power2.out",
        }
      );
    }

    // Animate counter
    if (counterRef.current) {
      const count = { value: 0 };
      gsap.to(count, {
        value: 150,
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
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-neutral-text text-lg font-bold">
            Calidad de Respuesta
          </h3>
          <p className="text-subtle-text text-sm">
            Desglose de feedback de IA
          </p>
        </div>
        <button className="p-2 hover:bg-slate-50 rounded-lg text-subtle-text transition-colors">
          <Icon name="filter_list" />
        </button>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8">
        {/* Donut Chart */}
        <div
          ref={donutRef}
          className="relative w-48 h-48 rounded-full"
          style={{
            background: `conic-gradient(
              #4797B1 0% 0%, 
              #C5ECBE 0% 0%, 
              #f1f5f9 0% 100%
            )`,
          }}
        >
          <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
            <span ref={counterRef} className="text-3xl font-bold text-neutral-text">
              0
            </span>
            <span className="text-xs text-subtle-text font-medium">
              Respuestas
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-4">
          {qualityData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <div>
                <p className="text-sm font-bold text-neutral-text">
                  {item.label}
                </p>
                <p className="text-xs text-subtle-text">
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
      <header ref={headerRef} className="flex items-center justify-between px-8 py-6 bg-cream-bg flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-neutral-text text-3xl font-black tracking-tight">
            Grado 11A - Interacciones de IA 2026
          </h2>
          <p className="text-subtle-text text-sm font-medium">
            Resumen de Métricas y Análisis del año 2026
          </p>
        </div>
        <Button variant="teal" icon="download" className="hover:scale-105 active:scale-95 transition-transform">
          Exportar Datos
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedMetricCard
              title="INTERACCIONES TOTALES"
              value={1240}
              change={12}
              changeLabel="Vs. últimos 30 días"
              icon="chat_bubble"
              delay={0}
            />
            <AnimatedMetricCard
              title="RELEVANCIA PROMEDIO"
              value={88}
              suffix="%"
              change={5}
              changeLabel="Puntuación de precisión IA"
              icon="target"
              delay={0.1}
            />
            <AnimatedMetricCard
              title="GRUPOS ACTIVOS"
              value={5}
              change={0}
              changeLabel="Actualmente en sesión"
              icon="group_work"
              delay={0.2}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[400px]">
            <AnimatedBarChart />
            <AnimatedDonutChart />
          </div>
        </div>
      </main>
    </div>
  );
}
