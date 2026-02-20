import { HierarchyTimesheetNode } from "../api/bridge";

/**
 * Filter hierarchy timesheet nodes to only include time from selected users.
 * Recomputes dailySeconds, totalSeconds, rollupDailySeconds, rollupTotalSeconds.
 * Prunes nodes where rollupTotalSeconds === 0 after filtering.
 * When selectedUsers is empty, returns nodes as-is (no filter).
 */
export function filterNodesByUsers(
  nodes: HierarchyTimesheetNode[],
  selectedUsers: Set<string>
): HierarchyTimesheetNode[] {
  if (selectedUsers.size === 0) return nodes;

  const filterNode = (
    node: HierarchyTimesheetNode
  ): HierarchyTimesheetNode => {
    // Filter authors to selected users
    const filteredAuthors = node.authors.filter((a) =>
      selectedUsers.has(a.accountId)
    );

    // Recompute self dailySeconds / totalSeconds from filtered authors
    const dailySeconds: Record<string, number> = {};
    let totalSeconds = 0;
    for (const author of filteredAuthors) {
      totalSeconds += author.totalSeconds;
      for (const [day, secs] of Object.entries(author.dailySeconds)) {
        dailySeconds[day] = (dailySeconds[day] ?? 0) + secs;
      }
    }

    // Recursively filter children
    const children = node.children.map(filterNode);

    // Re-rollup from filtered self + filtered children
    const rollupDailySeconds: Record<string, number> = { ...dailySeconds };
    let rollupTotalSeconds = totalSeconds;
    for (const child of children) {
      rollupTotalSeconds += child.rollupTotalSeconds;
      for (const [day, secs] of Object.entries(child.rollupDailySeconds)) {
        rollupDailySeconds[day] = (rollupDailySeconds[day] ?? 0) + secs;
      }
    }

    return {
      ...node,
      authors: filteredAuthors,
      dailySeconds,
      totalSeconds,
      children,
      rollupDailySeconds,
      rollupTotalSeconds,
    };
  };

  return nodes
    .map(filterNode)
    .filter((n) => n.rollupTotalSeconds > 0);
}
