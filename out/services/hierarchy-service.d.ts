import { HierarchyNode, JiraIssue } from "../types";
export declare class HierarchyService {
    /**
     * Build the full issue hierarchy for a project.
     * Returns root-level nodes (epics and unparented issues) with children nested.
     */
    buildHierarchy(projectKey: string): Promise<HierarchyNode[]>;
    /**
     * Build a tree structure from a flat list of issues.
     */
    buildTree(issues: JiraIssue[]): HierarchyNode[];
    /**
     * Flatten a hierarchy tree into an array (depth-first).
     */
    flattenTree(nodes: HierarchyNode[]): HierarchyNode[];
    private createNode;
}
export declare const hierarchyService: HierarchyService;
//# sourceMappingURL=hierarchy-service.d.ts.map