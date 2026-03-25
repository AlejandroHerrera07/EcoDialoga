import { useState, useEffect } from "react";
import { Group } from "@/lib/types";
import { teacherService } from "@/lib/services";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const data = await teacherService.getGroups();
      setGroups(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch groups"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async (newGroupData: Partial<Group>) => {
    try {
      setIsCreating(true);
      const newGroup = await teacherService.createGroup(newGroupData);
      setGroups((prev) => [newGroup, ...prev]);
      setError(null);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to create group"));
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { groups, isLoading, isCreating, error, createGroup, refetch: fetchGroups };
}
