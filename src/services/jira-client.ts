import api, { route } from "@forge/api";

interface SearchResponse {
  issues: any[];
  nextPageToken?: string;
}

interface PaginatedResult<T> {
  items: T[];
}

export class JiraClient {
  /**
   * Execute a JQL search using the POST v3 search endpoint with nextPageToken pagination.
   */
  async searchIssues(
    jql: string,
    fields: string[],
    maxResults = 100
  ): Promise<any[]> {
    const allIssues: any[] = [];
    let nextPageToken: string | undefined;

    do {
      const body: Record<string, any> = {
        jql,
        fields,
        maxResults,
      };
      if (nextPageToken) {
        body.nextPageToken = nextPageToken;
      }

      const response = await api
        .asApp()
        .requestJira(route`/rest/api/3/search/jql`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Jira search failed (${response.status}): ${text}`
        );
      }

      const data: SearchResponse = await response.json();
      allIssues.push(...data.issues);
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return allIssues;
  }

  /**
   * Fetch worklogs for a specific issue, handling pagination.
   */
  async getIssueWorklogs(
    issueIdOrKey: string,
    startAt = 0
  ): Promise<any[]> {
    const allWorklogs: any[] = [];
    let currentStartAt = startAt;
    let total = Infinity;

    while (currentStartAt < total) {
      const response = await api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${issueIdOrKey}/worklog?startAt=${currentStartAt}&maxResults=1000`,
          { headers: { Accept: "application/json" } }
        );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Worklog fetch failed for ${issueIdOrKey} (${response.status}): ${text}`
        );
      }

      const data = await response.json();
      total = data.total;
      allWorklogs.push(...data.worklogs);
      currentStartAt += data.maxResults;
    }

    return allWorklogs;
  }

  /**
   * Log work on an issue.
   */
  async addWorklog(
    issueIdOrKey: string,
    timeSpentSeconds: number,
    started: string,
    comment?: string
  ): Promise<any> {
    const body: Record<string, any> = {
      timeSpentSeconds,
      started: formatToJiraDateTime(started),
    };

    if (comment) {
      body.comment = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: comment }],
          },
        ],
      };
    }

    const response = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${issueIdOrKey}/worklog`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Add worklog failed for ${issueIdOrKey} (${response.status}): ${text}`
      );
    }

    return response.json();
  }

  /**
   * Get the current user's account info.
   */
  async getCurrentUser(): Promise<any> {
    const response = await api
      .asApp()
      .requestJira(route`/rest/api/3/myself`, {
        headers: { Accept: "application/json" },
      });

    if (!response.ok) {
      throw new Error(`Failed to get current user (${response.status})`);
    }

    return response.json();
  }
}

function formatToJiraDateTime(isoDate: string): string {
  // Jira expects: "2021-01-17T12:34:00.000+0000"
  // If just a date, add time component
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return `${isoDate}T12:00:00.000+0000`;
  }
  return isoDate;
}

// Singleton instance
export const jiraClient = new JiraClient();
