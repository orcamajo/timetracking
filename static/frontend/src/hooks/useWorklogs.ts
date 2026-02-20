import { useState, useEffect, useCallback } from "react";
import {
  getIssueWorklogs,
  IssueWorklogResult,
  logWork as apiLogWork,
} from "../api/bridge";

export function useWorklogs(issueKey: string) {
  const [data, setData] = useState<IssueWorklogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!issueKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getIssueWorklogs(issueKey);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch worklogs");
    } finally {
      setLoading(false);
    }
  }, [issueKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const logWork = useCallback(
    async (
      timeSpentSeconds: number,
      started: string,
      comment?: string
    ) => {
      await apiLogWork(issueKey, timeSpentSeconds, started, comment);
      // Refresh worklogs after logging
      await fetch();
    },
    [issueKey, fetch]
  );

  return { data, loading, error, refresh: fetch, logWork };
}
