"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hierarchyService = exports.HierarchyService = void 0;
const jira_client_1 = require("./jira-client");
class HierarchyService {
    /**
     * Build the full issue hierarchy for a project.
     * Returns root-level nodes (epics and unparented issues) with children nested.
     */
    async buildHierarchy(projectKey) {
        const jql = `project = "${projectKey}" ORDER BY issuetype ASC, key ASC`;
        const fields = ["summary", "issuetype", "parent"];
        const issues = await jira_client_1.jiraClient.searchIssues(jql, fields);
        return this.buildTree(issues);
    }
    /**
     * Build a tree structure from a flat list of issues.
     */
    buildTree(issues) {
        // Create nodes for all issues
        const nodeMap = new Map();
        for (const issue of issues) {
            nodeMap.set(issue.key, this.createNode(issue));
        }
        // Build parent-child relationships
        const roots = [];
        for (const issue of issues) {
            const node = nodeMap.get(issue.key);
            const parentKey = issue.fields.parent?.key;
            if (parentKey && nodeMap.has(parentKey)) {
                const parent = nodeMap.get(parentKey);
                parent.children.push(node);
                node.parentKey = parentKey;
            }
            else if (parentKey && !nodeMap.has(parentKey)) {
                // Parent exists but not in this project's issues — treat as root
                roots.push(node);
                node.parentKey = parentKey;
            }
            else {
                roots.push(node);
            }
        }
        // Sort children by issue type priority then key
        const typePriority = {
            Epic: 0,
            Story: 1,
            Task: 2,
            "Sub-task": 3,
            Subtask: 3,
            Bug: 2,
        };
        const sortNodes = (nodes) => {
            nodes.sort((a, b) => {
                const aPri = typePriority[a.issueType] ?? 2;
                const bPri = typePriority[b.issueType] ?? 2;
                if (aPri !== bPri)
                    return aPri - bPri;
                return a.issueKey.localeCompare(b.issueKey);
            });
            for (const node of nodes) {
                sortNodes(node.children);
            }
        };
        sortNodes(roots);
        return roots;
    }
    /**
     * Flatten a hierarchy tree into an array (depth-first).
     */
    flattenTree(nodes) {
        const result = [];
        const walk = (node) => {
            result.push(node);
            for (const child of node.children) {
                walk(child);
            }
        };
        for (const root of nodes) {
            walk(root);
        }
        return result;
    }
    createNode(issue) {
        return {
            issueId: issue.id,
            issueKey: issue.key,
            summary: issue.fields.summary,
            issueType: issue.fields.issuetype.name,
            parentKey: issue.fields.parent?.key ?? null,
            children: [],
            worklogs: [],
            totalTimeSeconds: 0,
            rollupTimeSeconds: 0,
            timeByPerson: {},
            rollupTimeByPerson: {},
        };
    }
}
exports.HierarchyService = HierarchyService;
exports.hierarchyService = new HierarchyService();
//# sourceMappingURL=hierarchy-service.js.map