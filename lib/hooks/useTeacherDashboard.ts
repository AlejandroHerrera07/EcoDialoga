import { useState, useEffect } from "react";
import { DashboardMetricsResponse, DashboardMessage } from "@/lib/types";
import { teacherService } from "@/lib/services";

interface DashboardFilters {
  groupId?: string | null;
  date?: string | null;
}

export function useTeacherDashboard(filters?: DashboardFilters) {
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [metricsRes, messagesRes] = await Promise.all([
          teacherService.getDashboardMetrics(filters?.groupId, filters?.date),
          teacherService.getRecentMessages()
        ]);
        setData(metricsRes);
        setMessages(messagesRes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch dashboard data"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters?.groupId, filters?.date]);

  return { data, messages, isLoading, error };
}
