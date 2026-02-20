"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHierarchyReport = getHierarchyReport;
const hierarchy_service_1 = require("../services/hierarchy-service");
const worklog_service_1 = require("../services/worklog-service");
const aggregation_service_1 = require("../services/aggregation-service");
async function getHierarchyReport({ payload, }) {
    const { projectKey, startDate, endDate } = payload;
    // Fetch hierarchy and worklogs in parallel
    const [hierarchy, worklogs] = await Promise.all([
        hierarchy_service_1.hierarchyService.buildHierarchy(projectKey),
        worklog_service_1.worklogService.getWorklogsForProject(projectKey, startDate, endDate),
    ]);
    // Aggregate worklogs into the hierarchy with rollups
    const result = aggregation_service_1.aggregationService.aggregateWorklogs(hierarchy, worklogs);
    // Collect all unique users for the person breakdown
    const allUsers = new Map();
    const collectUsers = (nodes) => {
        for (const node of nodes) {
            for (const wl of node.worklogs) {
                allUsers.set(wl.author.accountId, wl.author.displayName);
            }
            collectUsers(node.children);
        }
    };
    collectUsers(result);
    return {
        hierarchy: stripWorklogs(result),
        users: Array.from(allUsers.entries()).map(([accountId, displayName]) => ({
            accountId,
            displayName,
        })),
    };
}
/**
 * Strip raw worklogs from the hierarchy to reduce payload size.
 * The frontend only needs the aggregated numbers.
 */
function stripWorklogs(nodes) {
    return nodes.map((node) => ({
        ...node,
        worklogs: [],
        children: stripWorklogs(node.children),
    }));
}
//# sourceMappingURL=hierarchy.js.map