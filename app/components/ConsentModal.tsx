"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui";

interface ConsentModalProps {
  onAccept: () => Promise<void>;
  onReject: () => void;
}

export function ConsentModal({ onAccept, onReject }: ConsentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
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
            <span className="text-3xl">🌿</span>
            ¡Bienvenido a EcoDialoga!
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-gray-700">
          <p className="text-base leading-relaxed">
            Antes de comenzar nuestra aventura de aprendizaje:
          </p>

          <p className="text-base leading-relaxed">
            Hola. Para el desarrollo de esta investigación pedagógica, es importante que sepas que <strong>EcoDialoga guardará las conversaciones</strong> que mantengas con la Inteligencia Artificial.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <h3 className="font-semibold text-blue-900 mb-3">¿Para qué usamos esta información?</h3>
            <ul className="space-y-2 text-sm text-blue-900">
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Para que la IA recuerde lo que han hablado y pueda ayudarte mejor.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Para analizar cómo aprendemos sobre el medio ambiente (los datos se tratarán de forma <strong>anónima</strong> para fines académicos).</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 italic border-l-4 border-emerald-400 pl-4">
            Al hacer clic en "Aceptar y Continuar", confirmas que estás de acuerdo con que registremos tus interacciones para este proyecto educativo.
          </p>
        </div>

        {/* Footer with buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <Button
            onClick={onReject}
            variant="secondary"
            disabled={isLoading}
            className="px-6"
          >
            No, volver al login
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="px-6 bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Procesando..." : "Aceptar y Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
