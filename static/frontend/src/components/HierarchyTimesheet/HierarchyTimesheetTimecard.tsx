import React, { useMemo } from "react";
import { HierarchyTimesheetNode } from "../../api/bridge";
import { TimesheetCell } from "../Timesheet/TimesheetCell";
import { isWeekend, isToday, formatDayShort } from "../../utils/date-utils";
import { formatTime } from "../../utils/time-format";
import { TimecardUserRow } from "../../utils/export";

interface HierarchyTimesheetTimecardProps {
  nodes: HierarchyTimesheetNode[];
  days: string[];
}

/**
 * Aggregate per-user daily totals by walking all nodes in the tree.
 * Each node's `authors` array contains only worklogs logged directly on that
 * issue (not rolled up), so summing across all nodes gives correct totals.
 */
export function aggregateUserRows(
  nodes: HierarchyTimesheetNode[]
): TimecardUserRow[] {
  const userMap = new Map<
    string,
    {
      displayName: string;
      avatarUrl?: string;
      dailySeconds: Record<string, number>;
      totalSeconds: number;
    }
  >();

  const walk = (node: HierarchyTimesheetNode) => {
    for (const author of node.authors) {
      let entry = userMap.get(author.accountId);
      if (!entry) {
        entry = {
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
          dailySeconds: {},
          totalSeconds: 0,
        };
        userMap.set(author.accountId, entry);
      }
      entry.totalSeconds += author.totalSeconds;
      for (const [day, secs] of Object.entries(author.dailySeconds)) {
        entry.dailySeconds[day] = (entry.dailySeconds[day] ?? 0) + secs;
      }
    }
    for (const child of node.children) {
      walk(child);
    }
  };

  for (const node of nodes) {
    walk(node);
  }

  return Array.from(userMap.entries())
    .map(([accountId, data]) => ({ accountId, ...data }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function HierarchyTimesheetTimecard({
  nodes,
  days,
}: HierarchyTimesheetTimecardProps) {
  const userRows = useMemo(() => aggregateUserRows(nodes), [nodes]);

  const dailyTotals: Record<string, number> = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const user of userRows) {
      for (const [day, secs] of Object.entries(user.dailySeconds)) {
        totals[day] = (totals[day] ?? 0) + secs;
      }
    }
    return totals;
  }, [userRows]);

  const grandTotal = useMemo(
    () => userRows.reduce((sum, u) => sum + u.totalSeconds, 0),
    [userRows]
  );

  if (userRows.length === 0) {
    return (
      <table className="timesheet-grid">
        <tbody>
          <tr>
            <td
              colSpan={days.length + 2}
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
          <th className="issue-header">User</th>
          {days.map((day) => (
            <th
              key={day}
              className={[
                isWeekend(day) ? "weekend" : "",
                isToday(day) ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {formatDayShort(day)}
            </th>
          ))}
          <th className="total-header">Total</th>
        </tr>
      </thead>
      <tbody>
        {userRows.map((user) => (
          <tr key={user.accountId}>
            <td>
              <div className="user-row-label">
                {user.avatarUrl && (
                  <img className="user-avatar" src={user.avatarUrl} alt="" />
                )}
                {user.displayName}
              </div>
            </td>
            {days.map((day) => (
              <TimesheetCell
                key={day}
                seconds={user.dailySeconds[day] ?? 0}
                isWeekend={isWeekend(day)}
                isToday={isToday(day)}
              />
            ))}
            <td className="total-cell">{formatTime(user.totalSeconds)}</td>
          </tr>
        ))}
        <tr className="totals-row">
          <td>
            <strong>Total</strong>
          </td>
          {days.map((day) => (
            <td
              key={day}
              className={[
                isWeekend(day) ? "weekend" : "",
                isToday(day) ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {dailyTotals[day] ? formatTime(dailyTotals[day]) : "\u2014"}
            </td>
          ))}
          <td className="total-cell">{formatTime(grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  );
}
