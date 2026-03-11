"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Button, Icon, SearchInput } from "@/app/components/ui";
import Link from "next/link";

interface Group {
  id: string;
  code: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  createdAt: string;
  activeStudents: number;
  status: "active" | "archived" | "pending";
}

const groups: Group[] = [
  {
    id: "1",
    code: "ECO-2026-A",
    icon: "science",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    createdAt: "18 de febrero de 2026",
    activeStudents: 24,
    status: "active",
  },
  {
    id: "2",
    code: "BIO-101-C",
    icon: "biotech",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    createdAt: "1 de noviembre de 2025",
    activeStudents: 30,
    status: "active",
  },
  {
    id: "3",
    code: "FIS-301-B",
    icon: "psychology",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    createdAt: "5 de diciembre de 2025",
    activeStudents: 15,
    status: "active",
  },
  {
    id: "4",
    code: "GEO-104-A",
    icon: "globe",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    createdAt: "12 de enero de 2026",
    activeStudents: 0,
    status: "pending",
  },
];

function getStatusBadge(count: number) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
        0 Activos
      </span>
    );
  }
  if (count < 20) {
    return (
      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
        {count} Activos
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
      {count} Activos
    </span>
  );
}

export default function GroupsPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for sequential animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Header entrance
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5 }
      );

      // Search card entrance
      tl.fromTo(
        searchRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4 },
        "-=0.2"
      );

      // Table entrance
      tl.fromTo(
        tableRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.2"
      );

      // Table rows staggered entrance
      const rows = tableRef.current?.querySelectorAll("tbody tr");
      if (rows) {
        tl.fromTo(
          rows,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.08 },
          "-=0.3"
        );
      }

      // Pagination entrance
      tl.fromTo(
        paginationRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 },
        "-=0.1"
      );
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
            <Button variant="teal" size="lg" icon="add_circle">
              Registrar Nuevo Grupo
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div ref={searchRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 opacity-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput placeholder="Buscar por código o nombre..." />
            <div className="sm:w-64">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="filter_list" className="text-gray-400" size="md" />
                </div>
                <select className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 appearance-none cursor-pointer">
                  <option>Todos los estados</option>
                  <option>Activo</option>
                  <option>Archivado</option>
                  <option>Pendiente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Icon name="expand_more" className="text-gray-400" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className="flow-root opacity-0">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black/5 sm:rounded-2xl bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-mint-accent">
                    <tr>
                      <th
                        scope="col"
                        className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-[#2c5c23] sm:pl-6 w-1/4"
                      >
                        Código de Grupo
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/4"
                      >
                        Fecha de Creación
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-1/4"
                      >
                        Estudiantes Activos
                      </th>
                      <th
                        scope="col"
                        className="relative py-4 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-[#2c5c23] w-1/4"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {groups.map((group) => (
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
                          {group.createdAt}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Icon name="group" size="sm" className="text-gray-500" />
                            </div>
                            {getStatusBadge(group.activeStudents)}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="text-gray-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-gray-100"
                              title="Editar Grupo"
                            >
                              <Icon name="edit" size="md" />
                            </button>
                            <button
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Borrar Grupo"
                            >
                              <Icon name="delete" size="md" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div ref={paginationRef} className="flex items-center justify-between border-t border-gray-200 bg-cream-bg px-4 py-3 sm:px-6 mt-4 opacity-0">
          <div className="flex flex-1 justify-between sm:hidden">
            <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Anterior
            </button>
            <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
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
                <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  <span className="sr-only">Anterior</span>
                  <Icon name="chevron_left" size="sm" />
                </button>
                <button className="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  3
                </button>
                <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  <span className="sr-only">Siguiente</span>
                  <Icon name="chevron_right" size="sm" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
