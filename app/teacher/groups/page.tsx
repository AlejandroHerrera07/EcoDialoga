"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Button, Icon, SearchInput, Input, Modal } from "@/app/components/ui";
import Link from "next/link";
import { useGroups } from "@/lib/hooks";

export default function GroupsPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  const { groups, isLoading, isCreating, createGroup } = useGroups();
  const [localGroups, setLocalGroups] = useState(groups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState("");

  // Update local groups when data finishes loading
  useEffect(() => {
    setLocalGroups(groups);
  }, [groups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupCode.trim() || isCreating) return;

    await createGroup({
      code: newGroupCode.trim().toUpperCase(),
    });
    
    setIsModalOpen(false);
    setNewGroupCode("");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for sequential animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Header entrance
      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.5 }
        );
      }

      // Table entrance
      if (tableRef.current) {
        tl.fromTo(
          tableRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2"
        );
      }

      // Table rows staggered entrance
      const rows = tableRef.current?.querySelectorAll("tbody tr");
      if (rows && rows.length > 0) {
        tl.fromTo(
          rows,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.08 },
          "-=0.3"
        );
      }

      // Pagination entrance
      if (paginationRef.current) {
        tl.fromTo(
          paginationRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3 },
          "-=0.1"
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-cream-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex mb-4">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-500">
                <Icon name="home" size="md" />
              </Link>
            </li>
            <li>
              <span className="text-gray-300">/</span>
            </li>
            <li>
              <Link
                href="/teacher/dashboard"
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Panel
              </Link>
            </li>
            <li>
              <span className="text-gray-300">/</span>
            </li>
            <li>
              <span className="text-sm font-medium text-primary">
                Gestión de Grupos
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div ref={headerRef} className="sm:flex sm:items-center sm:justify-between mb-8 opacity-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Gestión de Grupos
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Administra tus grupos, inscripciones y actividades.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="teal" size="lg" icon="add_circle" onClick={() => setIsModalOpen(true)}>
              Registrar Nuevo Grupo
            </Button>
          </div>
        </div>

        {/* Modal para Crear Grupo */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Nuevo Grupo"
        >
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
            <Input
              label="Código del Grupo"
              icon="groups"
              placeholder="Ej. ECO-2026-A"
              value={newGroupCode}
              onChange={(e) => setNewGroupCode(e.target.value)}
              className="uppercase"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!newGroupCode.trim() || isCreating}>
                {isCreating ? "Creando..." : "Crear Grupo"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Table */}
        <div ref={tableRef} className="flow-root opacity-0 pt-6">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-2xl bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-mint-accent">
                    <tr>
                      <th
                        scope="col"
                        className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-[#2c5c23] sm:pl-6 w-1/6"
                      >
                        Código de Grupo
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/6"
                      >
                        Área
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/6"
                      >
                        Eje
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/6"
                      >
                        Macro Eje
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/6"
                      >
                        Problematica
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          Cargando grupos...
                        </td>
                      </tr>
                    ) : localGroups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No hay grupos disponibles.
                        </td>
                      </tr>
                    ) : (
                      localGroups.map((group) => (
                      <tr
                        key={group.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 rounded-lg ${group.iconBg} ${group.iconColor} flex items-center justify-center`}
                            >
                              <Icon name={group.icon} size="sm" />
                            </div>
                            {group.code}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {group.area}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {group.eje}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {group.macroEje}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={group.problematica}>
                          {group.problematica}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div ref={paginationRef} className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-cream-bg px-4 py-3 sm:px-6 mt-4 opacity-0 gap-4">
          <div className="flex flex-1 justify-between sm:hidden w-full">
            <Button variant="secondary" size="sm">
              Anterior
            </Button>
            <Button variant="secondary" size="sm">
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">1</span> a{" "}
                <span className="font-medium">4</span> de{" "}
                <span className="font-medium">12</span> resultados
              </p>
            </div>
            <div>
              <nav
                aria-label="Pagination"
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              >
                <div className="rounded-l-md overflow-hidden">
                  <Button variant="secondary" className="rounded-none rounded-l-md px-2 focus:z-20">
                    <span className="sr-only">Anterior</span>
                    <Icon name="chevron_left" size="sm" />
                  </Button>
                </div>
                <Button variant="primary" className="rounded-none px-4 focus:z-20">
                  1
                </Button>
                <Button variant="secondary" className="rounded-none px-4 focus:z-20">
                  2
                </Button>
                <Button variant="secondary" className="rounded-none px-4 focus:z-20">
                  3
                </Button>
                <div className="rounded-r-md overflow-hidden">
                  <Button variant="secondary" className="rounded-none rounded-r-md px-2 focus:z-20">
                    <span className="sr-only">Siguiente</span>
                    <Icon name="chevron_right" size="sm" />
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
