export declare class JiraClient {
    /**
     * Execute a JQL search using the POST v3 search endpoint with nextPageToken pagination.
     */
    searchIssues(jql: string, fields: string[], maxResults?: number): Promise<any[]>;
    /**
     * Fetch worklogs for a specific issue, handling pagination.
     */
    getIssueWorklogs(issueIdOrKey: string, startAt?: number): Promise<any[]>;
    /**
     * Log work on an issue.
     */
    addWorklog(issueIdOrKey: string, timeSpentSeconds: number, started: string, comment?: string): Promise<any>;
    /**
     * Get the current user's account info.
     */
    getCurrentUser(): Promise<any>;
}
export declare const jiraClient: JiraClient;
//# sourceMappingURL=jira-client.d.ts.map