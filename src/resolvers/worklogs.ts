import api, { route } from "@forge/api";
import { worklogService } from "../services/worklog-service";
import { jiraClient } from "../services/jira-client";

export async function getIssueWorklogs({
  payload,
}: {
  payload: { issueKey: string; startDate?: string; endDate?: string };
}) {
  const { issueKey, startDate, endDate } = payload;
  const worklogs = await worklogService.getWorklogsByIssueKey(
    issueKey,
    startDate,
    endDate
  );

  const totalTimeSeconds = worklogs.reduce(
    (sum, wl) => sum + wl.timeSpentSeconds,
    0
  );

  const timeByPerson: Record<string, number> = {};
  for (const wl of worklogs) {
    timeByPerson[wl.author.accountId] =
      (timeByPerson[wl.author.accountId] ?? 0) + wl.timeSpentSeconds;
  }

  return {
    issueKey,
    worklogs,
    totalTimeSeconds,
    timeByPerson,
  };
}

export async function logWork({
  payload,
}: {
  payload: {
    issueKey: string;
    timeSpentSeconds: number;
    started: string;
    comment?: string;
  };
}) {
  const { issueKey, timeSpentSeconds, started, comment } = payload;
  const result = await jiraClient.addWorklog(
    issueKey,
    timeSpentSeconds,
    started,
    comment
  );
  return { success: true, worklogId: result.id };
}

export async function getProjectUsers({
  payload,
}: {
  payload: { projectKey: string; startDate: string; endDate: string };
}) {
  const { projectKey, startDate, endDate } = payload;
  const users = await worklogService.getProjectUsers(
    projectKey,
    startDate,
    endDate
  );
  return { users };
}

export async function getProjects() {
  const projects: Array<{ key: string; name: string }> = [];
  let startAt = 0;
  const maxResults = 50;

  while (true) {
    const response = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}`,
        { headers: { Accept: "application/json" } }
      );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Project search failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    for (const p of data.values) {
      projects.push({ key: p.key, name: p.name });
    }

    if (data.isLast || projects.length >= data.total) break;
    startAt += maxResults;
  }

  projects.sort((a, b) => a.key.localeCompare(b.key));
  return { projects };
}
