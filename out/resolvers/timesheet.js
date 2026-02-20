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
exports.getTimesheetData = getTimesheetData;
const worklog_service_1 = require("../services/worklog-service");
async function getTimesheetData({ payload, }) {
    const { projectKeys, startDate, endDate } = payload;
    const allWorklogs = await worklog_service_1.worklogService.getWorklogs(projectKeys && projectKeys.length > 0 ? projectKeys : null, startDate, endDate);
    // Collect unique users
    const userMap = new Map();
    for (const wl of allWorklogs) {
        if (!userMap.has(wl.author.accountId)) {
            userMap.set(wl.author.accountId, wl.author);
        }
    }
    const users = Array.from(userMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    // Group worklogs by issue key
    const issueMap = new Map();
    for (const wl of allWorklogs) {
        if (!issueMap.has(wl.issueKey)) {
            issueMap.set(wl.issueKey, {
                summary: "",
                issueType: "",
                worklogs: [],
            });
        }
        issueMap.get(wl.issueKey).worklogs.push(wl);
    }
    // Fetch issue summaries
    if (issueMap.size > 0) {
        const { jiraClient } = await Promise.resolve().then(() => __importStar(require("../services/jira-client")));
        const issueKeys = Array.from(issueMap.keys());
        const jql = `key in (${issueKeys.map((k) => `"${k}"`).join(",")})`;
        const issues = await jiraClient.searchIssues(jql, [
            "summary",
            "issuetype",
        ]);
        for (const issue of issues) {
            const entry = issueMap.get(issue.key);
            if (entry) {
                entry.summary = issue.fields.summary;
                entry.issueType = issue.fields.issuetype.name;
            }
        }
    }
    // Build timesheet entries with per-author breakdown
    const entries = [];
    const dailyTotals = {};
    let grandTotal = 0;
    for (const [issueKey, data] of issueMap) {
        const dailySeconds = {};
        const byAuthor = {};
        let totalSeconds = 0;
        for (const wl of data.worklogs) {
            const day = wl.started.substring(0, 10);
            const accountId = wl.author.accountId;
            dailySeconds[day] = (dailySeconds[day] ?? 0) + wl.timeSpentSeconds;
            dailyTotals[day] = (dailyTotals[day] ?? 0) + wl.timeSpentSeconds;
            totalSeconds += wl.timeSpentSeconds;
            if (!byAuthor[accountId]) {
                byAuthor[accountId] = {};
            }
            byAuthor[accountId][day] =
                (byAuthor[accountId][day] ?? 0) + wl.timeSpentSeconds;
        }
        grandTotal += totalSeconds;
        entries.push({
            issueKey,
            issueSummary: data.summary,
            issueType: data.issueType,
            projectKey: issueKey.split("-")[0],
            dailySeconds,
            totalSeconds,
            byAuthor,
        });
    }
    entries.sort((a, b) => a.issueKey.localeCompare(b.issueKey));
    const result = {
        users,
        startDate,
        endDate,
        entries,
        dailyTotals,
        grandTotal,
    };
    return result;
}
//# sourceMappingURL=timesheet.js.map