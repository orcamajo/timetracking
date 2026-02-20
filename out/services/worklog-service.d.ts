import { WorklogEntry, JiraIssue, JiraUser } from "../types";
export declare class WorklogService {
    /**
     * Get all worklogs for a project within a date range.
     * Uses JQL worklogDate filter to narrow the search, then fetches full worklogs
     * for each matching issue and filters by date range.
     */
    getWorklogsForProject(projectKey: string, startDate: string, endDate: string): Promise<WorklogEntry[]>;
    /**
     * Get worklogs across multiple projects (or all projects) within a date range.
     * When projectKeys is null or empty, fetches worklogs across all projects.
     * When populated, uses project in ("A","B","C") JQL clause.
     */
    getWorklogs(projectKeys: string[] | null, startDate: string, endDate: string): Promise<WorklogEntry[]>;
    /**
     * Get worklogs for a specific issue, filtered by date range.
     * If the issue's inline worklogs are complete (total <= maxResults), uses those.
     * Otherwise, fetches all worklogs via pagination.
     */
    getWorklogsForIssue(issue: JiraIssue, startDate?: string, endDate?: string): Promise<WorklogEntry[]>;
    /**
     * Get worklogs for a single issue by key.
     */
    getWorklogsByIssueKey(issueKey: string, startDate?: string, endDate?: string): Promise<WorklogEntry[]>;
    /**
     * Get users who have logged work on a project in a date range.
     */
    getProjectUsers(projectKey: string, startDate: string, endDate: string): Promise<JiraUser[]>;
    private toWorklogEntry;
    private extractCommentText;
}
export declare const worklogService: WorklogService;
//# sourceMappingURL=worklog-service.d.ts.map