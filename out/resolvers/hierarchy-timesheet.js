"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHierarchyTimesheet = getHierarchyTimesheet;
const hierarchy_service_1 = require("../services/hierarchy-service");
const worklog_service_1 = require("../services/worklog-service");
const aggregation_service_1 = require("../services/aggregation-service");
async function getHierarchyTimesheet({ payload, }) {
    const { projectKeys, startDate, endDate } = payload;
    // Fetch worklogs (scoped to projects if provided)
    const worklogs = await worklog_service_1.worklogService.getWorklogs(projectKeys && projectKeys.length > 0 ? projectKeys : null, startDate, endDate);
    // Determine affected projects from worklog issueKey prefixes
    const affectedProjects = new Set();
    for (const wl of worklogs) {
        affectedProjects.add(wl.issueKey.split("-")[0]);
    }
    // Build hierarchy for each affected project
    const allRoots = [];
    for (const projectKey of affectedProjects) {
        const roots = await hierarchy_service_1.hierarchyService.buildHierarchy(projectKey);
        allRoots.push(...roots);
    }
    // Convert to timesheet nodes with daily breakdowns and rollups
    const nodes = aggregation_service_1.aggregationService.aggregateWorklogsDailyBreakdown(allRoots, worklogs);
    // Collect unique users from worklogs
    const userMap = new Map();
    for (const wl of worklogs) {
        if (!userMap.has(wl.author.accountId)) {
            userMap.set(wl.author.accountId, wl.author);
        }
    }
    const users = Array.from(userMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { nodes, users, startDate, endDate };
}
//# sourceMappingURL=hierarchy-timesheet.js.map