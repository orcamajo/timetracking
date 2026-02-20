import { invoke } from "@forge/bridge";

// Types matching the backend
export interface JiraUser {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface WorklogEntry {
  id: string;
  issueId: string;
  issueKey: string;
  author: JiraUser;
  timeSpentSeconds: number;
  started: string;
  comment?: string;
}

export interface HierarchyNode {
  issueId: string;
  issueKey: string;
  summary: string;
  issueType: string;
  parentKey: string | null;
  children: HierarchyNode[];
  worklogs: WorklogEntry[];
  totalTimeSeconds: number;
  rollupTimeSeconds: number;
  timeByPerson: Record<string, number>;
  rollupTimeByPerson: Record<string, number>;
}

export interface TimesheetEntry {
  issueKey: string;
  issueSummary: string;
  issueType: string;
  projectKey: string;
  dailySeconds: Record<string, number>;
  totalSeconds: number;
  byAuthor: Record<string, Record<string, number>>; // accountId → { date → seconds }
}

export interface TimesheetData {
  users: JiraUser[];
  startDate: string;
  endDate: string;
  entries: TimesheetEntry[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
}

export interface HierarchyReportResult {
  hierarchy: HierarchyNode[];
  users: JiraUser[];
}

export interface HierarchyTimesheetAuthor {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  dailySeconds: Record<string, number>;
  totalSeconds: number;
}

export interface HierarchyTimesheetNode {
  issueId: string;
  issueKey: string;
  summary: string;
  issueType: string;
  projectKey: string;
  children: HierarchyTimesheetNode[];
  dailySeconds: Record<string, number>;
  totalSeconds: number;
  rollupDailySeconds: Record<string, number>;
  rollupTotalSeconds: number;
  authors: HierarchyTimesheetAuthor[];
}

export interface HierarchyTimesheetData {
  nodes: HierarchyTimesheetNode[];
  users: JiraUser[];
  startDate: string;
  endDate: string;
}

export interface IssueWorklogResult {
  issueKey: string;
  worklogs: WorklogEntry[];
  totalTimeSeconds: number;
  timeByPerson: Record<string, number>;
}

export async function getHierarchyReport(
  projectKey: string,
  startDate: string,
  endDate: string
): Promise<HierarchyReportResult> {
  return invoke("getHierarchyReport", { projectKey, startDate, endDate });
}

export async function getTimesheetData(
  projectKeys: string[],
  startDate: string,
  endDate: string
): Promise<TimesheetData> {
  return invoke("getTimesheetData", {
    projectKeys,
    startDate,
    endDate,
  });
}

export async function getHierarchyTimesheet(
  projectKeys: string[],
  startDate: string,
  endDate: string
): Promise<HierarchyTimesheetData> {
  return invoke("getHierarchyTimesheet", {
    projectKeys,
    startDate,
    endDate,
  });
}

export async function getIssueWorklogs(
  issueKey: string,
  startDate?: string,
  endDate?: string
): Promise<IssueWorklogResult> {
  return invoke("getIssueWorklogs", { issueKey, startDate, endDate });
}

export async function logWork(
  issueKey: string,
  timeSpentSeconds: number,
  started: string,
  comment?: string
): Promise<{ success: boolean; worklogId: string }> {
  return invoke("logWork", { issueKey, timeSpentSeconds, started, comment });
}

export async function getProjectUsers(
  projectKey: string,
  startDate: string,
  endDate: string
): Promise<{ users: JiraUser[] }> {
  return invoke("getProjectUsers", { projectKey, startDate, endDate });
}

export async function getProjects(): Promise<{
  projects: Array<{ key: string; name: string }>;
}> {
  return invoke("getProjects", {});
}
