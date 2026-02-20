import React from "react";
import { HierarchyTimesheetAuthor } from "../../api/bridge";
import { TimesheetCell } from "../Timesheet/TimesheetCell";
import { isWeekend, isToday } from "../../utils/date-utils";
import { formatTime } from "../../utils/time-format";

interface HierarchyTimesheetUserRowProps {
  author: HierarchyTimesheetAuthor;
  days: string[];
  depth: number;
}

export function HierarchyTimesheetUserRow({
  author,
  days,
  depth,
}: HierarchyTimesheetUserRowProps) {
  return (
    <tr className="user-sub-row">
      <td>
        <div
          className="issue-cell"
          style={{ paddingLeft: (depth + 1) * 24 }}
        >
          <span className="expand-placeholder" />
          <span className="user-row-label">
            {author.avatarUrl && (
              <img
                className="user-avatar"
                src={author.avatarUrl}
                alt=""
              />
            )}
            {author.displayName}
          </span>
        </div>
      </td>
      {days.map((day) => (
        <TimesheetCell
          key={day}
          seconds={author.dailySeconds[day] ?? 0}
          isWeekend={isWeekend(day)}
          isToday={isToday(day)}
        />
      ))}
      <td className="total-cell">{formatTime(author.totalSeconds)}</td>
    </tr>
  );
}
