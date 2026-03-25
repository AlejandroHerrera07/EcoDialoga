"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Button, Icon, SearchInput, Input, Modal } from "@/app/components/ui";
import Link from "next/link";
import { useStudents } from "@/lib/hooks";

export default function StudentsPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const { students, availableGroups, isLoading, isCreating, createStudent } = useStudents();
  
  // State for students
  const [localStudents, setLocalStudents] = useState(students);
  const [filterGroup, setFilterGroup] = useState<string>("Todos los grupos");

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGroup, setNewStudentGroup] = useState("");

  useEffect(() => {
    setLocalStudents(students);
  }, [students]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (headerRef.current) {
        tl.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 });
      }
      if (searchRef.current) {
        tl.fromTo(searchRef.current, { opacity: 0, y: 20, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 }, "-=0.2");
      }
      if (tableRef.current) {
        tl.fromTo(tableRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");
      }

      const rows = tableRef.current?.querySelectorAll("tbody tr");
      if (rows && rows.length > 0) {
        tl.fromTo(rows, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.08 }, "-=0.3");
      }
    });

    return () => ctx.revert();
  }, [localStudents, filterGroup]); // Re-run animation slightly when data changes to feel alive, but could be disabled

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newStudentName.trim() || !newStudentGroup || isCreating) return;

    await createStudent({
      identifier: newStudentId.trim().toUpperCase(),
      name: newStudentName.trim(),
      groupCode: newStudentGroup,
    });

    setIsModalOpen(false);
    setNewStudentId("");
    setNewStudentName("");
    setNewStudentGroup("");
  };

  const filteredStudents = localStudents.filter((student) => {
    return filterGroup === "Todos los grupos" || student.groupCode === filterGroup;
  });

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
            <li><span className="text-gray-300">/</span></li>
            <li>
              <span className="text-sm font-medium text-primary">Estudiantes</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div ref={headerRef} className="sm:flex sm:items-center sm:justify-between mb-8 opacity-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Estudiantes</h1>
            <p className="mt-2 text-sm text-gray-500">
              Administra el acceso de los estudiantes y asígnalos a grupos.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="primary" size="lg" icon="person_add" onClick={() => setIsModalOpen(true)}>
              Registrar Estudiante
            </Button>
          </div>
        </div>

        {/* Modal for Creating Student */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Registrar Nuevo Estudiante"
        >
          <form onSubmit={handleCreateStudent} className="flex flex-col gap-4">
            <Input
              label="Identificador"
              icon="badge"
              placeholder="Ej. EST-005"
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
              className="uppercase"
            />
            <Input
              label="Nombre del Estudiante"
              icon="person"
              placeholder="Ej. Juan Pérez"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Asignar Grupo</label>
              <div className="relative">
                <select
                  value={newStudentGroup}
                  onChange={(e) => setNewStudentGroup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3 pr-10 appearance-none cursor-pointer outline-none transition-all"
                  required
                >
                  <option value="" disabled>Selecciona un grupo...</option>
                  {availableGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Icon name="expand_more" className="text-slate-400" size="sm" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!newStudentId.trim() || !newStudentName.trim() || !newStudentGroup || isCreating}>
                {isCreating ? "Creando..." : "Crear Estudiante"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Search and Filter */}
        <div ref={searchRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 opacity-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-64 max-w-sm">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon name="filter_list" className="text-gray-400" size="md" />
                </div>
                <select 
                  className="block w-full rounded-xl border-0 py-3 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 appearance-none cursor-pointer h-[46px]"
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                >
                  <option>Todos los grupos</option>
                  {availableGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
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
                      <th scope="col" className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-[#2c5c23] sm:pl-6 w-[40%] sm:w-1/4">
                        Identificador
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-[30%] sm:w-1/3">
                        Nombre
                      </th>
                      <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-[#2c5c23] w-[20%] sm:w-1/4">
                        Grupo Asignado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-gray-500">
                          Cargando estudiantes...
                        </td>
                      </tr>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Icon name="badge" size="sm" />
                              </div>
                              {student.identifier}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-800">
                            {student.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              {student.groupCode}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-gray-500">
                          No se encontraron estudiantes para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
