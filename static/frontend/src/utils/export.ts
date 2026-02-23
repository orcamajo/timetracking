import {
  HierarchyNode,
  HierarchyTimesheetNode,
  JiraUser,
  TimesheetData,
} from "../api/bridge";
import { formatTime } from "./time-format";
import { formatDayShort } from "./date-utils";

/**
 * Trigger a CSV file download in the browser.
 */
function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Escape a value for CSV (wrap in quotes if it contains commas, quotes, or newlines).
 */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export the hierarchy report to CSV.
 * Flattens the tree with indentation to show nesting depth.
 */
export function exportHierarchyReport(
  nodes: HierarchyNode[],
  users: JiraUser[],
  projectKey: string,
  startDate: string,
  endDate: string
): void {
  const headers = [
    "Issue Key",
    "Summary",
    "Type",
    "Depth",
    "Logged (Self)",
    "Rolled Up",
    ...users.map((u) => u.displayName),
  ];

  const rows: string[][] = [];

  const walkTree = (node: HierarchyNode, depth: number) => {
    rows.push([
      node.issueKey,
      node.summary,
      node.issueType,
      String(depth),
      node.totalTimeSeconds > 0 ? formatTime(node.totalTimeSeconds) : "",
      node.rollupTimeSeconds > 0 ? formatTime(node.rollupTimeSeconds) : "",
      ...users.map((u) => {
        const seconds = node.rollupTimeByPerson[u.accountId] ?? 0;
        return seconds > 0 ? formatTime(seconds) : "";
      }),
    ]);
    for (const child of node.children) {
      walkTree(child, depth + 1);
    }
  };

  for (const root of nodes) {
    walkTree(root, 0);
  }

  // Add totals row
  const grandTotal = nodes.reduce((sum, n) => sum + n.rollupTimeSeconds, 0);
  rows.push([
    "TOTAL",
    "",
    "",
    "",
    "",
    grandTotal > 0 ? formatTime(grandTotal) : "",
    ...users.map((u) => {
      const total = nodes.reduce(
        (sum, n) => sum + (n.rollupTimeByPerson[u.accountId] ?? 0),
        0
      );
      return total > 0 ? formatTime(total) : "";
    }),
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  downloadCsv(`${projectKey}-time-report-${startDate}-to-${endDate}.csv`, csv);
}

/**
 * Export the timesheet to CSV.
 */
export function exportTimesheet(
  data: TimesheetData,
  days: string[],
  projectLabel: string
): void {
  const headers = [
    "Project",
    "Issue Key",
    "Summary",
    "Type",
    ...days.map((d) => formatDayShort(d)),
    "Total",
  ];

  const rows: string[][] = [];

  for (const entry of data.entries) {
    rows.push([
      entry.projectKey,
      entry.issueKey,
      entry.issueSummary,
      entry.issueType,
      ...days.map((day) => {
        const seconds = entry.dailySeconds[day] ?? 0;
        return seconds > 0 ? formatTime(seconds) : "";
      }),
      entry.totalSeconds > 0 ? formatTime(entry.totalSeconds) : "",
    ]);
  }

  // Add totals row
  rows.push([
    "",
    "TOTAL",
    "",
    "",
    ...days.map((day) => {
      const seconds = data.dailyTotals[day] ?? 0;
      return seconds > 0 ? formatTime(seconds) : "";
    }),
    data.grandTotal > 0 ? formatTime(data.grandTotal) : "",
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  downloadCsv(
    `${projectLabel}-timesheet-${data.startDate}-to-${data.endDate}.csv`,
    csv
  );
}

/**
 * Export the hierarchy timesheet to CSV.
 * Flattens tree depth-first, includes per-user rows.
 */
export function exportHierarchyTimesheet(
  nodes: HierarchyTimesheetNode[],
  days: string[],
  label: string,
  startDate: string,
  endDate: string
): void {
  const headers = [
    "Depth",
    "Project",
    "Issue Key",
    "Summary",
    "Type",
    ...days.map((d) => formatDayShort(d)),
    "Total",
  ];

  const rows: string[][] = [];

  const walkTree = (node: HierarchyTimesheetNode, depth: number) => {
    rows.push([
      String(depth),
      node.projectKey,
      node.issueKey,
      node.summary,
      node.issueType,
      ...days.map((day) => {
        const seconds = node.rollupDailySeconds[day] ?? 0;
        return seconds > 0 ? formatTime(seconds) : "";
      }),
      node.rollupTotalSeconds > 0
        ? formatTime(node.rollupTotalSeconds)
        : "",
    ]);

    // User rows underneath
    for (const author of node.authors) {
      if (author.totalSeconds > 0) {
        rows.push([
          String(depth + 1),
          "",
          "",
          author.displayName,
          "User",
          ...days.map((day) => {
            const seconds = author.dailySeconds[day] ?? 0;
            return seconds > 0 ? formatTime(seconds) : "";
          }),
          formatTime(author.totalSeconds),
        ]);
      }
    }

    for (const child of node.children) {
      walkTree(child, depth + 1);
    }
  };

  for (const root of nodes) {
    walkTree(root, 0);
  }

  // Add totals row
  const grandTotal = nodes.reduce((sum, n) => sum + n.rollupTotalSeconds, 0);
  rows.push([
    "",
    "",
    "TOTAL",
    "",
    "",
    ...days.map((day) => {
      const total = nodes.reduce(
        (sum, n) => sum + (n.rollupDailySeconds[day] ?? 0),
        0
      );
      return total > 0 ? formatTime(total) : "";
    }),
    grandTotal > 0 ? formatTime(grandTotal) : "",
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  downloadCsv(`${label}-timesheet-${startDate}-to-${endDate}.csv`, csv);
}

export interface TimecardUserRow {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  dailySeconds: Record<string, number>;
  totalSeconds: number;
}

/**
 * Export the timecard view to CSV.
 * One row per user with daily columns.
 */
export function exportTimecardView(
  users: TimecardUserRow[],
  days: string[],
  label: string,
  startDate: string,
  endDate: string
): void {
  const headers = [
    "User",
    ...days.map((d) => formatDayShort(d)),
    "Total",
  ];

  const rows: string[][] = [];

  for (const user of users) {
    rows.push([
      user.displayName,
      ...days.map((day) => {
        const seconds = user.dailySeconds[day] ?? 0;
        return seconds > 0 ? formatTime(seconds) : "";
      }),
      user.totalSeconds > 0 ? formatTime(user.totalSeconds) : "",
    ]);
  }

  // Add totals row
  const grandTotal = users.reduce((sum, u) => sum + u.totalSeconds, 0);
  rows.push([
    "TOTAL",
    ...days.map((day) => {
      const total = users.reduce(
        (sum, u) => sum + (u.dailySeconds[day] ?? 0),
        0
      );
      return total > 0 ? formatTime(total) : "";
    }),
    grandTotal > 0 ? formatTime(grandTotal) : "",
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  downloadCsv(`${label}-timecard-${startDate}-to-${endDate}.csv`, csv);
}

/**
 * Export the monthly report to CSV.
 * Issues as rows (depth-first, indented by depth), users as columns.
 */
export function exportMonthlyReport(
  nodes: HierarchyTimesheetNode[],
  users: JiraUser[],
  month: string,
  label: string
): void {
  // Build per-user rollup map: issueKey → accountId → rollupSeconds
  const userRollupMap = new Map<string, Record<string, number>>();

  function walkBuild(node: HierarchyTimesheetNode): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const author of node.authors) {
      totals[author.accountId] =
        (totals[author.accountId] ?? 0) + author.totalSeconds;
    }
    for (const child of node.children) {
      const childTotals = walkBuild(child);
      for (const [accountId, secs] of Object.entries(childTotals)) {
        totals[accountId] = (totals[accountId] ?? 0) + secs;
      }
    }
    userRollupMap.set(node.issueKey, totals);
    return totals;
  }

  for (const root of nodes) {
    walkBuild(root);
  }

  const headers = [
    "Depth",
    "Project",
    "Issue Key",
    "Summary",
    "Type",
    ...users.map((u) => u.displayName),
    "Total",
  ];

  const rows: string[][] = [];

  function buildRows(node: HierarchyTimesheetNode, depth: number) {
    const userTotals = userRollupMap.get(node.issueKey) ?? {};
    rows.push([
      String(depth),
      node.projectKey,
      node.issueKey,
      node.summary,
      node.issueType,
      ...users.map((u) => {
        const secs = userTotals[u.accountId] ?? 0;
        return secs > 0 ? formatTime(secs) : "";
      }),
      node.rollupTotalSeconds > 0 ? formatTime(node.rollupTotalSeconds) : "",
    ]);
    for (const child of node.children) {
      buildRows(child, depth + 1);
    }
  }

  for (const root of nodes) {
    buildRows(root, 0);
  }

  // Totals row
  const userGrandTotals: Record<string, number> = {};
  for (const node of nodes) {
    const nodeUserTotals = userRollupMap.get(node.issueKey) ?? {};
    for (const [accountId, secs] of Object.entries(nodeUserTotals)) {
      userGrandTotals[accountId] = (userGrandTotals[accountId] ?? 0) + secs;
    }
  }
  const grandTotal = nodes.reduce((sum, n) => sum + n.rollupTotalSeconds, 0);
  rows.push([
    "",
    "",
    "TOTAL",
    "",
    "",
    ...users.map((u) => {
      const total = userGrandTotals[u.accountId] ?? 0;
      return total > 0 ? formatTime(total) : "";
    }),
    grandTotal > 0 ? formatTime(grandTotal) : "",
  ]);

  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");

  downloadCsv(`${label}-monthly-${month}.csv`, csv);
}
