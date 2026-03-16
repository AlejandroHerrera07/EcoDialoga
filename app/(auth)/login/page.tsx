"use client";

import { useRef, useEffect, useState, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { Icon, Button, Input } from "@/app/components/ui";
import { useAuth } from "@/lib/hooks";
import type { ApiError } from "@/lib/types";

const features = [
  { icon: "smart_toy", label: "IA Educativa", color: "bg-teal-accent" },
  { icon: "forum", label: "Diálogo Activo", color: "bg-primary" },
  { icon: "psychology", label: "Aprendizaje Adaptativo", color: "bg-mint-accent text-emerald-700" },
];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form state
  const [groupCode, setGroupCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated (wait until hydration finishes)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = searchParams.get("redirect") ?? "/student/chat";
      router.replace(redirect);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  // Form submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupCode.trim() || !studentCode.trim()) {
      setError("Ambos campos son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ groupCode: groupCode.trim(), studentCode: studentCode.trim() });
      // La redirección la maneja el useEffect al detectar isAuthenticated = true
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message ?? "Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Animate branding section
    if (brandingRef.current) {
      const children = brandingRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }
      );
    }

    // Animate card
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, delay: 0.2, ease: "power3.out" }
      );
    }

    // Animate feature badges
    if (featuresRef.current) {
      const badges = featuresRef.current.children;
      gsap.fromTo(
        badges,
        { opacity: 0, scale: 0, y: 10 },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.12, 
          delay: 0.5, 
          ease: "back.out(1.7)" 
        }
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-cream-bg relative">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#4762b3 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Main Container */}
      <main className="w-full max-w-5xl flex flex-col md:flex-row items-stretch md:items-center justify-center gap-8 relative z-10">
        {/* Left Side: Branding */}
        <div ref={brandingRef} className="hidden md:flex flex-1 flex-col justify-center items-start gap-6 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="eco" size="xl" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              EcoDialoga
            </h1>
          </div>
          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-md">
            Tu asesora educativa ambiental impulsada por IA. Conéctate
            para empezar tu aventura de aprendizaje hoy.
          </p>
          {/* Feature Badges */}
          <div ref={featuresRef} className="flex flex-wrap gap-3 mt-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${feature.color} text-white shadow-lg shadow-black/10`}
              >
                <Icon name={feature.icon} size="sm" />
                <span className="text-sm font-semibold">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-[480px] flex-none">
          <div 
            ref={cardRef}
            className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 md:p-10 relative overflow-hidden"
          >
            {/* Decorative top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-teal-accent" />

            {/* Card Header */}
            <div className="flex flex-col gap-2 mb-8 text-center md:text-left">
              <div className="md:hidden w-12 h-12 mx-auto md:mx-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Icon name="eco" size="xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Acceso Estudiantes
              </h2>
              <p className="text-slate-500">Ingresa tus códigos de acceso</p>
            </div>

            {/* Student Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 group/form">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <Icon name="error" size="sm" />
                  <span>{error}</span>
                </div>
              )}
              <Input
                label="Código del Grupo"
                icon="groups"
                placeholder="Tu código de grupo aquí"
                className="tracking-wide font-small"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <Input
                label="Código de Estudiante"
                icon="person"
                placeholder="Tu código de estudiante aquí"
                className="tracking-wide font-small"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                disabled={isSubmitting}
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={isSubmitting ? undefined : "arrow_forward"}
                iconPosition="right"
                disabled={isSubmitting || authLoading}
                className="w-full h-12 text-base shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? "Ingresando..." : "Comenzar"}
              </Button>
            </form>
          </div>
          <p className="text-center mt-6 text-sm text-slate-500 font-medium">
            © 2026 EcoDialoga. Aprendizaje sostenible.
          </p>
        </div>
      </main>
    </div>
  );
}
