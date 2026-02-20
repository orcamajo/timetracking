import {
  HierarchyNode,
  HierarchyTimesheetAuthor,
  HierarchyTimesheetNode,
  WorklogEntry,
} from "../types";

export class AggregationService {
  /**
   * Attach worklogs to their respective nodes in the hierarchy tree,
   * then compute bottom-up rollups for time and per-person breakdowns.
   */
  aggregateWorklogs(
    roots: HierarchyNode[],
    worklogs: WorklogEntry[]
  ): HierarchyNode[] {
    // Index worklogs by issue key
    const worklogMap = new Map<string, WorklogEntry[]>();
    for (const wl of worklogs) {
      const existing = worklogMap.get(wl.issueKey) ?? [];
      existing.push(wl);
      worklogMap.set(wl.issueKey, existing);
    }

    // Attach worklogs and compute self-time
    this.attachWorklogs(roots, worklogMap);

    // Bottom-up rollup
    for (const root of roots) {
      this.rollup(root);
    }

    return roots;
  }

  private attachWorklogs(
    nodes: HierarchyNode[],
    worklogMap: Map<string, WorklogEntry[]>
  ): void {
    for (const node of nodes) {
      const nodeWorklogs = worklogMap.get(node.issueKey) ?? [];
      node.worklogs = nodeWorklogs;

      // Compute self-time
      node.totalTimeSeconds = 0;
      node.timeByPerson = {};
      for (const wl of nodeWorklogs) {
        node.totalTimeSeconds += wl.timeSpentSeconds;
        const accountId = wl.author.accountId;
        node.timeByPerson[accountId] =
          (node.timeByPerson[accountId] ?? 0) + wl.timeSpentSeconds;
      }

      // Recurse into children
      this.attachWorklogs(node.children, worklogMap);
    }
  }

  /**
   * Convert a HierarchyNode tree into HierarchyTimesheetNode tree with daily
   * breakdowns, per-author grouping, and bottom-up rollups.
   * Prunes nodes with no time anywhere in their subtree.
   */
  aggregateWorklogsDailyBreakdown(
    roots: HierarchyNode[],
    worklogs: WorklogEntry[]
  ): HierarchyTimesheetNode[] {
    // Index worklogs by issueKey
    const worklogMap = new Map<string, WorklogEntry[]>();
    for (const wl of worklogs) {
      const existing = worklogMap.get(wl.issueKey) ?? [];
      existing.push(wl);
      worklogMap.set(wl.issueKey, existing);
    }

    const convert = (node: HierarchyNode): HierarchyTimesheetNode => {
      const nodeWorklogs = worklogMap.get(node.issueKey) ?? [];

      // Compute self dailySeconds and totalSeconds
      const dailySeconds: Record<string, number> = {};
      let totalSeconds = 0;
      for (const wl of nodeWorklogs) {
        const day = wl.started.substring(0, 10);
        dailySeconds[day] = (dailySeconds[day] ?? 0) + wl.timeSpentSeconds;
        totalSeconds += wl.timeSpentSeconds;
      }

      // Build authors array grouped by accountId
      const authorMap = new Map<
        string,
        { displayName: string; avatarUrl?: string; dailySeconds: Record<string, number>; totalSeconds: number }
      >();
      for (const wl of nodeWorklogs) {
        const aid = wl.author.accountId;
        let author = authorMap.get(aid);
        if (!author) {
          author = {
            displayName: wl.author.displayName,
            avatarUrl: wl.author.avatarUrl,
            dailySeconds: {},
            totalSeconds: 0,
          };
          authorMap.set(aid, author);
        }
        const day = wl.started.substring(0, 10);
        author.dailySeconds[day] = (author.dailySeconds[day] ?? 0) + wl.timeSpentSeconds;
        author.totalSeconds += wl.timeSpentSeconds;
      }

      const authors: HierarchyTimesheetAuthor[] = Array.from(
        authorMap.entries()
      ).map(([accountId, a]) => ({
        accountId,
        displayName: a.displayName,
        avatarUrl: a.avatarUrl,
        dailySeconds: a.dailySeconds,
        totalSeconds: a.totalSeconds,
      }));

      // Recursively convert children
      const children = node.children.map(convert);

      // Rollup: start with self
      const rollupDailySeconds: Record<string, number> = { ...dailySeconds };
      let rollupTotalSeconds = totalSeconds;

      // Add children's rollups
      for (const child of children) {
        rollupTotalSeconds += child.rollupTotalSeconds;
        for (const [day, secs] of Object.entries(child.rollupDailySeconds)) {
          rollupDailySeconds[day] = (rollupDailySeconds[day] ?? 0) + secs;
        }
      }

      return {
        issueId: node.issueId,
        issueKey: node.issueKey,
        summary: node.summary,
        issueType: node.issueType,
        projectKey: node.issueKey.split("-")[0],
        children,
        dailySeconds,
        totalSeconds,
        rollupDailySeconds,
        rollupTotalSeconds,
        authors,
      };
    };

    const converted = roots.map(convert);

    // Prune nodes where rollupTotalSeconds === 0
    const prune = (nodes: HierarchyTimesheetNode[]): HierarchyTimesheetNode[] => {
      return nodes
        .filter((n) => n.rollupTotalSeconds > 0)
        .map((n) => ({ ...n, children: prune(n.children) }));
    };

    return prune(converted);
  }

  /**
   * Bottom-up rollup: each node's rollup = its own time + all children's rollups.
   */
  private rollup(node: HierarchyNode): void {
    // First, rollup all children
    for (const child of node.children) {
      this.rollup(child);
    }

    // Start with this node's own time
    node.rollupTimeSeconds = node.totalTimeSeconds;
    node.rollupTimeByPerson = { ...node.timeByPerson };

    // Add children's rollup
    for (const child of node.children) {
      node.rollupTimeSeconds += child.rollupTimeSeconds;

      for (const [accountId, seconds] of Object.entries(
        child.rollupTimeByPerson
      )) {
        node.rollupTimeByPerson[accountId] =
          (node.rollupTimeByPerson[accountId] ?? 0) + seconds;
      }
    }
  }
}

export const aggregationService = new AggregationService();
