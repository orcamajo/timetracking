import React, { useMemo } from "react";
import { HierarchyTimesheetNode, JiraUser } from "../../api/bridge";
import { formatTime } from "../../utils/time-format";

interface MonthlyReportProps {
  nodes: HierarchyTimesheetNode[];
  users: JiraUser[];
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

/**
 * Build a map of issueKey → accountId → rollupSeconds (self + all descendants).
 */
function buildUserRollupMap(
  nodes: HierarchyTimesheetNode[]
): Map<string, Record<string, number>> {
  const map = new Map<string, Record<string, number>>();

  function walk(node: HierarchyTimesheetNode): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const author of node.authors) {
      totals[author.accountId] =
        (totals[author.accountId] ?? 0) + author.totalSeconds;
    }
    for (const child of node.children) {
      const childTotals = walk(child);
      for (const [accountId, secs] of Object.entries(childTotals)) {
        totals[accountId] = (totals[accountId] ?? 0) + secs;
      }
    }
    map.set(node.issueKey, totals);
    return totals;
  }

  for (const node of nodes) {
    walk(node);
  }
  return map;
}

const issueTypeBadgeClass = (issueType: string): string => {
  const lower = issueType.toLowerCase();
  if (lower === "epic") return "epic";
  if (lower === "story") return "story";
  if (lower === "bug") return "bug";
  if (lower.includes("sub")) return "subtask";
  return "task";
};

interface MonthlyRowProps {
  node: HierarchyTimesheetNode;
  users: JiraUser[];
  userRollupMap: Map<string, Record<string, number>>;
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

function MonthlyRow({
  node,
  users,
  userRollupMap,
  depth,
  expandedKeys,
  onToggle,
}: MonthlyRowProps) {
  const isExpandable = node.children.length > 0;
  const isExpanded = expandedKeys.has(node.issueKey);
  const userTotals = userRollupMap.get(node.issueKey) ?? {};

  return (
    <>
      <tr>
        <td>
          <div className="issue-cell" style={{ paddingLeft: depth * 24 }}>
            {isExpandable ? (
              <button
                className="expand-btn"
                onClick={() => onToggle(node.issueKey)}
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            ) : (
              <span className="expand-placeholder" />
            )}
            <span
              className={`issue-type-badge ${issueTypeBadgeClass(node.issueType)}`}
            >
              {node.issueType}
            </span>
            <span className="issue-key">{node.issueKey}</span>
            <span className="issue-summary">{node.summary}</span>
          </div>
        </td>
        {users.map((user) => {
          const secs = userTotals[user.accountId] ?? 0;
          return (
            <td key={user.accountId} className="total-cell">
              {secs > 0 ? formatTime(secs) : "\u2014"}
            </td>
          );
        })}
        <td className="total-cell">
          {node.rollupTotalSeconds > 0
            ? formatTime(node.rollupTotalSeconds)
            : "\u2014"}
        </td>
      </tr>
      {isExpanded &&
        node.children.map((child) => (
          <MonthlyRow
            key={child.issueKey}
            node={child}
            users={users}
            userRollupMap={userRollupMap}
            depth={depth + 1}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function MonthlyReport({
  nodes,
  users,
  expandedKeys,
  onToggle,
}: MonthlyReportProps) {
  const userRollupMap = useMemo(() => buildUserRollupMap(nodes), [nodes]);

  const userGrandTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const node of nodes) {
      const nodeUserTotals = userRollupMap.get(node.issueKey) ?? {};
      for (const [accountId, secs] of Object.entries(nodeUserTotals)) {
        totals[accountId] = (totals[accountId] ?? 0) + secs;
      }
    }
    return totals;
  }, [nodes, userRollupMap]);

  const grandTotal = useMemo(
    () => nodes.reduce((sum, n) => sum + n.rollupTotalSeconds, 0),
    [nodes]
  );

  if (nodes.length === 0) {
    return (
      <table className="timesheet-grid">
        <tbody>
          <tr>
            <td
              colSpan={users.length + 2}
              style={{ textAlign: "center", padding: 24 }}
            >
              No worklogs found for this period.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="timesheet-grid">
      <thead>
        <tr>
          <th className="issue-header">Issue</th>
          {users.map((user) => (
            <th key={user.accountId} className="total-header">
              <div
                className="user-row-label"
                style={{ justifyContent: "flex-end" }}
              >
                {user.avatarUrl && (
                  <img className="user-avatar" src={user.avatarUrl} alt="" />
                )}
                {user.displayName}
              </div>
            </th>
          ))}
          <th className="total-header">Total</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <MonthlyRow
            key={node.issueKey}
            node={node}
            users={users}
            userRollupMap={userRollupMap}
            depth={0}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
          />
        ))}
        <tr className="totals-row">
          <td>
            <strong>Total</strong>
          </td>
          {users.map((user) => (
            <td key={user.accountId} className="total-cell">
              {userGrandTotals[user.accountId]
                ? formatTime(userGrandTotals[user.accountId])
                : "\u2014"}
            </td>
          ))}
          <td className="total-cell">{formatTime(grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  );
}
