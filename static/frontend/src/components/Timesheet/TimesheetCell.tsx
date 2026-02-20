import React from "react";
import { formatTime } from "../../utils/time-format";

interface TimesheetCellProps {
  seconds: number;
  isWeekend: boolean;
  isToday: boolean;
}

export function TimesheetCell({ seconds, isWeekend, isToday }: TimesheetCellProps) {
  const classNames = [
    "time-cell",
    seconds > 0 ? "has-time" : "",
    isWeekend ? "weekend" : "",
    isToday ? "today" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td className={classNames}>
      {seconds > 0 ? formatTime(seconds) : "—"}
    </td>
  );
}
