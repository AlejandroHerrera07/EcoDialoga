import { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { teacherService } from "@/lib/services";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, groupsData] = await Promise.all([
        teacherService.getStudents(),
        teacherService.getAvailableGroups()
      ]);
      setStudents(studentsData);
      setAvailableGroups(groupsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch students data"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createStudent = async (newStudentData: Partial<Student>) => {
    try {
      setIsCreating(true);
      const newStudent = await teacherService.createStudent(newStudentData);
      setStudents((prev) => [newStudent, ...prev]);
      setError(null);
      return newStudent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create student"));
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { students, availableGroups, isLoading, isCreating, error, createStudent, refetch: fetchData };
}
