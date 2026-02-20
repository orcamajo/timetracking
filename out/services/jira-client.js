"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraClient = exports.JiraClient = void 0;
const api_1 = __importStar(require("@forge/api"));
class JiraClient {
    /**
     * Execute a JQL search using the POST v3 search endpoint with nextPageToken pagination.
     */
    async searchIssues(jql, fields, maxResults = 100) {
        const allIssues = [];
        let nextPageToken;
        do {
            const body = {
                jql,
                fields,
                maxResults,
            };
            if (nextPageToken) {
                body.nextPageToken = nextPageToken;
            }
            const response = await api_1.default
                .asApp()
                .requestJira((0, api_1.route) `/rest/api/3/search/jql`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Jira search failed (${response.status}): ${text}`);
            }
            const data = await response.json();
            allIssues.push(...data.issues);
            nextPageToken = data.nextPageToken;
        } while (nextPageToken);
        return allIssues;
    }
    /**
     * Fetch worklogs for a specific issue, handling pagination.
     */
    async getIssueWorklogs(issueIdOrKey, startAt = 0) {
        const allWorklogs = [];
        let currentStartAt = startAt;
        let total = Infinity;
        while (currentStartAt < total) {
            const response = await api_1.default
                .asApp()
                .requestJira((0, api_1.route) `/rest/api/3/issue/${issueIdOrKey}/worklog?startAt=${currentStartAt}&maxResults=1000`, { headers: { Accept: "application/json" } });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Worklog fetch failed for ${issueIdOrKey} (${response.status}): ${text}`);
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
    async addWorklog(issueIdOrKey, timeSpentSeconds, started, comment) {
        const body = {
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
        const response = await api_1.default
            .asApp()
            .requestJira((0, api_1.route) `/rest/api/3/issue/${issueIdOrKey}/worklog`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Add worklog failed for ${issueIdOrKey} (${response.status}): ${text}`);
        }
        return response.json();
    }
    /**
     * Get the current user's account info.
     */
    async getCurrentUser() {
        const response = await api_1.default
            .asApp()
            .requestJira((0, api_1.route) `/rest/api/3/myself`, {
            headers: { Accept: "application/json" },
        });
        if (!response.ok) {
            throw new Error(`Failed to get current user (${response.status})`);
        }
        return response.json();
    }
}
exports.JiraClient = JiraClient;
function formatToJiraDateTime(isoDate) {
    // Jira expects: "2021-01-17T12:34:00.000+0000"
    // If just a date, add time component
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return `${isoDate}T12:00:00.000+0000`;
    }
    return isoDate;
}
// Singleton instance
exports.jiraClient = new JiraClient();
//# sourceMappingURL=jira-client.js.map