import { useState, useEffect, useCallback } from "react";
import {
  getHierarchyTimesheet,
  HierarchyTimesheetData,
} from "../api/bridge";

export function useHierarchyTimesheet(
  projectKeys: string[],
  startDate: string,
  endDate: string
) {
  const [data, setData] = useState<HierarchyTimesheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable serialization for dependency tracking
  const projectKeysKey = JSON.stringify(projectKeys);

  const fetch = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getHierarchyTimesheet(
        projectKeys,
        startDate,
        endDate
      );
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch timesheet data");
    } finally {
      setLoading(false);
    }
  }, [projectKeysKey, startDate, endDate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
