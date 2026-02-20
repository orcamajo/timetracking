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
  started: string; // ISO date
  comment?: string;
}

export interface HierarchyNode {
  issueId: string;
  issueKey: string;
  summary: string;
  issueType: string; // Epic, Story, Task, Sub-task
  parentKey: string | null;
  children: HierarchyNode[];
  worklogs: WorklogEntry[];
  totalTimeSeconds: number; // This issue only
  rollupTimeSeconds: number; // This issue + all descendants
  timeByPerson: Record<string, number>; // accountId → seconds
  rollupTimeByPerson: Record<string, number>; // accountId → seconds (rolled up)
}

export interface TimesheetEntry {
  issueKey: string;
  issueSummary: string;
  issueType: string;
  projectKey: string;
  dailySeconds: Record<string, number>; // ISO date string → seconds
  totalSeconds: number;
  // Per-author breakdown: accountId → { date → seconds }
  byAuthor: Record<string, Record<string, number>>;
}

export interface TimesheetData {
  users: JiraUser[];
  startDate: string;
  endDate: string;
  entries: TimesheetEntry[];
  dailyTotals: Record<string, number>; // ISO date → total seconds
  grandTotal: number;
}

export interface IssueWorklogSummary {
  issueKey: string;
  issueSummary: string;
  worklogs: WorklogEntry[];
  totalTimeSeconds: number;
  timeByPerson: Record<string, number>;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    parent?: { id: string; key: string };
    worklog?: {
      total: number;
      maxResults: number;
      worklogs: JiraWorklog[];
    };
  };
}

export interface JiraWorklog {
  id: string;
  author: {
    accountId: string;
    displayName: string;
    avatarUrls?: Record<string, string>;
  };
  timeSpentSeconds: number;
  started: string;
  comment?:
    | string
    | {
        type: string;
        content: Array<{
          type: string;
          content?: Array<{ type: string; text?: string }>;
        }>;
      };
}

export interface HierarchyTimesheetAuthor {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  dailySeconds: Record<string, number>; // date → seconds
  totalSeconds: number;
}

export interface HierarchyTimesheetNode {
  issueId: string;
  issueKey: string;
  summary: string;
  issueType: string;
  projectKey: string;
  children: HierarchyTimesheetNode[];
  dailySeconds: Record<string, number>; // self time per day
  totalSeconds: number; // self total
  rollupDailySeconds: Record<string, number>; // self + descendants per day
  rollupTotalSeconds: number; // self + descendants total
  authors: HierarchyTimesheetAuthor[]; // per-user breakdown for THIS issue
}

export interface HierarchyTimesheetData {
  nodes: HierarchyTimesheetNode[]; // root nodes (may span multiple projects)
  users: JiraUser[];
  startDate: string;
  endDate: string;
}

export interface DateRange {
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export interface ProjectUsersResult {
  users: JiraUser[];
}
