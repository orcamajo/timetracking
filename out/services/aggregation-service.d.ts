import { HierarchyNode, HierarchyTimesheetNode, WorklogEntry } from "../types";
export declare class AggregationService {
    /**
     * Attach worklogs to their respective nodes in the hierarchy tree,
     * then compute bottom-up rollups for time and per-person breakdowns.
     */
    aggregateWorklogs(roots: HierarchyNode[], worklogs: WorklogEntry[]): HierarchyNode[];
    private attachWorklogs;
    /**
     * Convert a HierarchyNode tree into HierarchyTimesheetNode tree with daily
     * breakdowns, per-author grouping, and bottom-up rollups.
     * Prunes nodes with no time anywhere in their subtree.
     */
    aggregateWorklogsDailyBreakdown(roots: HierarchyNode[], worklogs: WorklogEntry[]): HierarchyTimesheetNode[];
    /**
     * Bottom-up rollup: each node's rollup = its own time + all children's rollups.
     */
    private rollup;
}
export declare const aggregationService: AggregationService;
//# sourceMappingURL=aggregation-service.d.ts.map