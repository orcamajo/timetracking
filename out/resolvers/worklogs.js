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
exports.getIssueWorklogs = getIssueWorklogs;
exports.logWork = logWork;
exports.getProjectUsers = getProjectUsers;
exports.getProjects = getProjects;
const api_1 = __importStar(require("@forge/api"));
const worklog_service_1 = require("../services/worklog-service");
const jira_client_1 = require("../services/jira-client");
async function getIssueWorklogs({ payload, }) {
    const { issueKey, startDate, endDate } = payload;
    const worklogs = await worklog_service_1.worklogService.getWorklogsByIssueKey(issueKey, startDate, endDate);
    const totalTimeSeconds = worklogs.reduce((sum, wl) => sum + wl.timeSpentSeconds, 0);
    const timeByPerson = {};
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
async function logWork({ payload, }) {
    const { issueKey, timeSpentSeconds, started, comment } = payload;
    const result = await jira_client_1.jiraClient.addWorklog(issueKey, timeSpentSeconds, started, comment);
    return { success: true, worklogId: result.id };
}
async function getProjectUsers({ payload, }) {
    const { projectKey, startDate, endDate } = payload;
    const users = await worklog_service_1.worklogService.getProjectUsers(projectKey, startDate, endDate);
    return { users };
}
async function getProjects() {
    const projects = [];
    let startAt = 0;
    const maxResults = 50;
    while (true) {
        const response = await api_1.default
            .asApp()
            .requestJira((0, api_1.route) `/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}`, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Project search failed (${response.status}): ${text}`);
        }
        const data = await response.json();
        for (const p of data.values) {
            projects.push({ key: p.key, name: p.name });
        }
        if (data.isLast || projects.length >= data.total)
            break;
        startAt += maxResults;
    }
    projects.sort((a, b) => a.key.localeCompare(b.key));
    return { projects };
}
//# sourceMappingURL=worklogs.js.map