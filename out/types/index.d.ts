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
    byAuthor: Record<string, Record<string, number>>;
}
export interface TimesheetData {
    users: JiraUser[];
    startDate: string;
    endDate: string;
    entries: TimesheetEntry[];
    dailyTotals: Record<string, number>;
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
        issuetype: {
            name: string;
        };
        parent?: {
            id: string;
            key: string;
        };
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
    comment?: string | {
        type: string;
        content: Array<{
            type: string;
            content?: Array<{
                type: string;
                text?: string;
            }>;
        }>;
    };
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
export interface DateRange {
    startDate: string;
    endDate: string;
}
export interface ProjectUsersResult {
    users: JiraUser[];
}
//# sourceMappingURL=index.d.ts.map