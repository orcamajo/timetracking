import React from "react";
import { HierarchyTimesheetNode } from "../../api/bridge";
import { TimesheetCell } from "../Timesheet/TimesheetCell";
import { HierarchyTimesheetUserRow } from "./HierarchyTimesheetUserRow";
import { isWeekend, isToday } from "../../utils/date-utils";
import { formatTime } from "../../utils/time-format";

const issueTypeBadgeClass = (issueType: string): string => {
  const lower = issueType.toLowerCase();
  if (lower === "epic") return "epic";
  if (lower === "story") return "story";
  if (lower === "bug") return "bug";
  if (lower.includes("sub")) return "subtask";
  return "task";
};

interface HierarchyTimesheetRowProps {
  node: HierarchyTimesheetNode;
  days: string[];
  depth: number;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}

export function HierarchyTimesheetRow({
  node,
  days,
  depth,
  expandedKeys,
  onToggle,
}: HierarchyTimesheetRowProps) {
  const hasChildren = node.children.length > 0;
  const hasAuthors = node.authors.some((a) => a.totalSeconds > 0);
  const isExpandable = hasChildren || hasAuthors;
  const isExpanded = expandedKeys.has(node.issueKey);

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
        {days.map((day) => (
          <TimesheetCell
            key={day}
            seconds={node.rollupDailySeconds[day] ?? 0}
            isWeekend={isWeekend(day)}
            isToday={isToday(day)}
          />
        ))}
        <td className="total-cell">
          {node.rollupTotalSeconds > 0
            ? formatTime(node.rollupTotalSeconds)
            : "\u2014"}
        </td>
      </tr>
      {isExpanded && (
        <>
          {node.children.map((child) => (
            <HierarchyTimesheetRow
              key={child.issueKey}
              node={child}
              days={days}
              depth={depth + 1}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
          {node.authors
            .filter((a) => a.totalSeconds > 0)
            .map((author) => (
              <HierarchyTimesheetUserRow
                key={author.accountId}
                author={author}
                days={days}
                depth={depth}
              />
            ))}
        </>
      )}
    </>
  );
}
