"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui";

interface GroupInfoModalProps {
  onSubmit: (data: GroupInfoData) => Promise<void>;
  onCancel?: () => void;
}

export interface GroupInfoData {
  area_curricular: string;
  eje_ambiental: string;
  problematica: string;
  grado: string;
}

const AREA_CURRICULAR_OPTIONS = [
  "Ciencias Sociales",
  "Ciencias Naturales",
  "Ética",
];

const EJE_AMBIENTAL_OPTIONS = [
  "Agua y sostenibilidad hídrica",
  "Cambio climático y energía",
];

const GRADO_OPTIONS = Array.from({ length: 6 }, (_, i) => (i + 6).toString());

export function GroupInfoModal({
  onSubmit,
  onCancel,
}: GroupInfoModalProps) {
  const [formData, setFormData] = useState<GroupInfoData>({
    area_curricular: "",
    eje_ambiental: "",
    problematica: "",
    grado: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<GroupInfoData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<GroupInfoData> = {};

    if (!formData.area_curricular.trim()) {
      newErrors.area_curricular = "Por favor selecciona un área curricular";
    }
    if (!formData.eje_ambiental.trim()) {
      newErrors.eje_ambiental = "Por favor selecciona un eje ambiental";
    }
    if (!formData.problematica.trim()) {
      newErrors.problematica = "Por favor describe la problemática";
    }
    if (!formData.grado.trim()) {
      newErrors.grado = "Por favor selecciona un grado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-200">
          <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <span className="text-3xl">📋</span>
            Información del Grupo
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            Para personalizar tu experiencia en EcoDialoga, necesitamos que
            completes la siguiente información sobre tu grupo de estudio.
          </p>

          {/* Area Curricular */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Área Curricular *
            </label>
            <select
              value={formData.area_curricular}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  area_curricular: e.target.value,
                })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all ${
                errors.area_curricular
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">Selecciona un área...</option>
              {AREA_CURRICULAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.area_curricular && (
              <p className="text-red-500 text-sm mt-1">{errors.area_curricular}</p>
            )}
          </div>

          {/* Eje Ambiental */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Eje Ambiental *
            </label>
            <select
              value={formData.eje_ambiental}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  eje_ambiental: e.target.value,
                })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all ${
                errors.eje_ambiental
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">Selecciona un eje...</option>
              {EJE_AMBIENTAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.eje_ambiental && (
              <p className="text-red-500 text-sm mt-1">{errors.eje_ambiental}</p>
            )}
          </div>

          {/* Problemática */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Problemática *
            </label>
            <textarea
              value={formData.problematica}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  problematica: e.target.value,
                })
              }
              placeholder="Describe la problemática ambiental que abordará tu grupo..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none ${
                errors.problematica
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              rows={4}
            />
            {errors.problematica && (
              <p className="text-red-500 text-sm mt-1">{errors.problematica}</p>
            )}
          </div>

          {/* Grado */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Grado *
            </label>
            <select
              value={formData.grado}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  grado: e.target.value,
                })
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all ${
                errors.grado ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Selecciona un grado...</option>
              {GRADO_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Grado {option}
                </option>
              ))}
            </select>
            {errors.grado && (
              <p className="text-red-500 text-sm mt-1">{errors.grado}</p>
            )}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Procesando..." : "Guardar Información"}
          </Button>
        </div>
      </div>
    </div>
  );
}
