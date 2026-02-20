import { jiraClient } from "./jira-client";
import { WorklogEntry, JiraIssue, JiraWorklog, JiraUser } from "../types";

export class WorklogService {
  /**
   * Get all worklogs for a project within a date range.
   * Uses JQL worklogDate filter to narrow the search, then fetches full worklogs
   * for each matching issue and filters by date range.
   */
  async getWorklogsForProject(
    projectKey: string,
    startDate: string,
    endDate: string
  ): Promise<WorklogEntry[]> {
    // JQL to find issues with worklogs in the date range
    const jql = `project = "${projectKey}" AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;
    const fields = [
      "summary",
      "issuetype",
      "parent",
      "worklog",
    ];

    const issues: JiraIssue[] = await jiraClient.searchIssues(jql, fields);
    const allWorklogs: WorklogEntry[] = [];

    for (const issue of issues) {
      const worklogs = await this.getWorklogsForIssue(
        issue,
        startDate,
        endDate
      );
      allWorklogs.push(...worklogs);
    }

    return allWorklogs;
  }

  /**
   * Get worklogs across multiple projects (or all projects) within a date range.
   * When projectKeys is null or empty, fetches worklogs across all projects.
   * When populated, uses project in ("A","B","C") JQL clause.
   */
  async getWorklogs(
    projectKeys: string[] | null,
    startDate: string,
    endDate: string
  ): Promise<WorklogEntry[]> {
    let jql = `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`;
    if (projectKeys && projectKeys.length > 0) {
      const projectList = projectKeys.map((k) => `"${k}"`).join(",");
      jql = `project in (${projectList}) AND ${jql}`;
    }

    const fields = ["summary", "issuetype", "parent", "worklog"];
    const issues: JiraIssue[] = await jiraClient.searchIssues(jql, fields);
    const allWorklogs: WorklogEntry[] = [];

    for (const issue of issues) {
      const worklogs = await this.getWorklogsForIssue(
        issue,
        startDate,
        endDate
      );
      allWorklogs.push(...worklogs);
    }

    return allWorklogs;
  }

  /**
   * Get worklogs for a specific issue, filtered by date range.
   * If the issue's inline worklogs are complete (total <= maxResults), uses those.
   * Otherwise, fetches all worklogs via pagination.
   */
  async getWorklogsForIssue(
    issue: JiraIssue,
    startDate?: string,
    endDate?: string
  ): Promise<WorklogEntry[]> {
    let rawWorklogs: JiraWorklog[];

    const inlineWorklog = issue.fields.worklog;
    if (inlineWorklog && inlineWorklog.total <= inlineWorklog.maxResults) {
      rawWorklogs = inlineWorklog.worklogs;
    } else {
      rawWorklogs = await jiraClient.getIssueWorklogs(issue.key);
    }

    const entries = rawWorklogs.map((wl) =>
      this.toWorklogEntry(wl, issue.id, issue.key)
    );

    if (startDate || endDate) {
      return entries.filter((entry) => {
        const entryDate = entry.started.substring(0, 10);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    return entries;
  }

  /**
   * Get worklogs for a single issue by key.
   */
  async getWorklogsByIssueKey(
    issueKey: string,
    startDate?: string,
    endDate?: string
  ): Promise<WorklogEntry[]> {
    const rawWorklogs = await jiraClient.getIssueWorklogs(issueKey);
    const entries = rawWorklogs.map((wl) =>
      this.toWorklogEntry(wl, "", issueKey)
    );

    if (startDate || endDate) {
      return entries.filter((entry) => {
        const entryDate = entry.started.substring(0, 10);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }

    return entries;
  }

  /**
   * Get users who have logged work on a project in a date range.
   */
  async getProjectUsers(
    projectKey: string,
    startDate: string,
    endDate: string
  ): Promise<JiraUser[]> {
    const worklogs = await this.getWorklogsForProject(
      projectKey,
      startDate,
      endDate
    );

    const userMap = new Map<string, JiraUser>();
    for (const wl of worklogs) {
      if (!userMap.has(wl.author.accountId)) {
        userMap.set(wl.author.accountId, wl.author);
      }
    }

    return Array.from(userMap.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  private toWorklogEntry(
    wl: JiraWorklog,
    issueId: string,
    issueKey: string
  ): WorklogEntry {
    return {
      id: wl.id,
      issueId,
      issueKey,
      author: {
        accountId: wl.author.accountId,
        displayName: wl.author.displayName,
        avatarUrl: wl.author.avatarUrls?.["24x24"],
      },
      timeSpentSeconds: wl.timeSpentSeconds,
      started: wl.started,
      comment: this.extractCommentText(wl.comment),
    };
  }

  private extractCommentText(
    comment: JiraWorklog["comment"]
  ): string | undefined {
    if (!comment) return undefined;
    if (typeof comment === "string") return comment;

    // ADF (Atlassian Document Format) → plain text
    try {
      return comment.content
        ?.map((block) =>
          block.content
            ?.map((inline) => inline.text || "")
            .join("") || ""
        )
        .join("\n")
        .trim() || undefined;
    } catch {
      return undefined;
    }
  }
}

export const worklogService = new WorklogService();
