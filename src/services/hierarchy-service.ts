import { jiraClient } from "./jira-client";
import { HierarchyNode, JiraIssue } from "../types";

export class HierarchyService {
  /**
   * Build the full issue hierarchy for a project.
   * Returns root-level nodes (epics and unparented issues) with children nested.
   */
  async buildHierarchy(projectKey: string): Promise<HierarchyNode[]> {
    const jql = `project = "${projectKey}" ORDER BY issuetype ASC, key ASC`;
    const fields = ["summary", "issuetype", "parent"];

    const issues: JiraIssue[] = await jiraClient.searchIssues(jql, fields);
    return this.buildTree(issues);
  }

  /**
   * Build a tree structure from a flat list of issues.
   */
  buildTree(issues: JiraIssue[]): HierarchyNode[] {
    // Create nodes for all issues
    const nodeMap = new Map<string, HierarchyNode>();
    for (const issue of issues) {
      nodeMap.set(issue.key, this.createNode(issue));
    }

    // Build parent-child relationships
    const roots: HierarchyNode[] = [];
    for (const issue of issues) {
      const node = nodeMap.get(issue.key)!;
      const parentKey = issue.fields.parent?.key;

      if (parentKey && nodeMap.has(parentKey)) {
        const parent = nodeMap.get(parentKey)!;
        parent.children.push(node);
        node.parentKey = parentKey;
      } else if (parentKey && !nodeMap.has(parentKey)) {
        // Parent exists but not in this project's issues — treat as root
        roots.push(node);
        node.parentKey = parentKey;
      } else {
        roots.push(node);
      }
    }

    // Sort children by issue type priority then key
    const typePriority: Record<string, number> = {
      Epic: 0,
      Story: 1,
      Task: 2,
      "Sub-task": 3,
      Subtask: 3,
      Bug: 2,
    };

    const sortNodes = (nodes: HierarchyNode[]) => {
      nodes.sort((a, b) => {
        const aPri = typePriority[a.issueType] ?? 2;
        const bPri = typePriority[b.issueType] ?? 2;
        if (aPri !== bPri) return aPri - bPri;
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
  flattenTree(nodes: HierarchyNode[]): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    const walk = (node: HierarchyNode) => {
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

  private createNode(issue: JiraIssue): HierarchyNode {
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

export const hierarchyService = new HierarchyService();
