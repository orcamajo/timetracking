import React, { useState, useEffect, useMemo } from "react";
import { useHierarchyTimesheet } from "../../hooks/useHierarchyTimesheet";
import { getProjects } from "../../api/bridge";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { MultiSelect, MultiSelectOption } from "../common/MultiSelect";
import { DateRangePicker } from "../common/DateRangePicker";
import { HierarchyTimesheetRow } from "./HierarchyTimesheetRow";
import {
  HierarchyTimesheetTimecard,
  aggregateUserRows,
} from "./HierarchyTimesheetTimecard";
import { filterNodesByUsers } from "../../utils/hierarchy-filter";
import { exportHierarchyTimesheet, exportTimecardView } from "../../utils/export";
import {
  toISODate,
  getWeekRange,
  getDaysInRange,
  formatDayShort,
  isWeekend,
  isToday,
} from "../../utils/date-utils";
import { formatTime } from "../../utils/time-format";

type ViewMode = "hierarchy" | "timecard";

interface HierarchyTimesheetProps {
  mode: "project" | "global";
  projectKey?: string;
}

function defaultWeekRange(): { start: string; end: string } {
  const range = getWeekRange(new Date());
  return { start: toISODate(range.start), end: toISODate(range.end) };
}

export function HierarchyTimesheet({
  mode,
  projectKey,
}: HierarchyTimesheetProps) {
  const defaultRange = defaultWeekRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedEpics, setSelectedEpics] = useState<Set<string>>(new Set());
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [availableProjects, setAvailableProjects] = useState<
    Array<{ key: string; name: string }>
  >([]);

  const days = getDaysInRange(startDate, endDate);

  const handleDateChange = (newStart: string, newEnd: string) => {
    // Ensure start <= end
    if (newStart > newEnd) {
      setStartDate(newStart);
      setEndDate(newStart);
    } else {
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };

  const handleThisWeek = () => {
    const range = defaultWeekRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  // Fetch available projects on mount (global mode only)
  useEffect(() => {
    if (mode === "global") {
      getProjects().then((result) => {
        setAvailableProjects(result.projects);
      });
    }
  }, [mode]);

  const projectOptions: MultiSelectOption[] = useMemo(
    () =>
      availableProjects.map((p) => ({
        value: p.key,
        label: `${p.key} - ${p.name}`,
      })),
    [availableProjects]
  );

  // Determine project keys to pass to the hook
  const projectKeysArg = useMemo(() => {
    if (mode === "project" && projectKey) return [projectKey];
    return Array.from(selectedProjects);
  }, [mode, projectKey, selectedProjects]);

  const { data, loading, error, refresh } = useHierarchyTimesheet(
    projectKeysArg,
    startDate,
    endDate
  );

  // Auto-expand top-level nodes when data changes
  useEffect(() => {
    if (data) {
      setExpandedKeys(new Set(data.nodes.map((n) => n.issueKey)));
    }
  }, [data]);

  // Epic filter options (top-level nodes)
  const epicOptions: MultiSelectOption[] = useMemo(() => {
    if (!data) return [];
    return data.nodes.map((n) => ({
      value: n.issueKey,
      label: `${n.issueKey}: ${n.summary}`,
    }));
  }, [data]);

  // User filter options
  const userOptions: MultiSelectOption[] = useMemo(() => {
    if (!data) return [];
    return data.users.map((u) => ({
      value: u.accountId,
      label: u.displayName,
    }));
  }, [data]);

  // Apply epic filter (top-level only)
  const epicFilteredNodes = useMemo(() => {
    if (!data) return [];
    if (selectedEpics.size === 0) return data.nodes;
    return data.nodes.filter((n) => selectedEpics.has(n.issueKey));
  }, [data, selectedEpics]);

  // Apply user filter
  const filteredNodes = useMemo(
    () => filterNodesByUsers(epicFilteredNodes, selectedUsers),
    [epicFilteredNodes, selectedUsers]
  );

  // Compute totals row (hierarchy view)
  const dailyTotals: Record<string, number> = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const node of filteredNodes) {
      for (const [day, secs] of Object.entries(node.rollupDailySeconds)) {
        totals[day] = (totals[day] ?? 0) + secs;
      }
    }
    return totals;
  }, [filteredNodes]);

  const grandTotal = useMemo(
    () => filteredNodes.reduce((sum, n) => sum + n.rollupTotalSeconds, 0),
    [filteredNodes]
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Export label
  const exportLabel = useMemo(() => {
    if (mode === "project" && projectKey) return projectKey;
    if (selectedProjects.size === 0) return "all-projects";
    if (selectedProjects.size === 1) return Array.from(selectedProjects)[0];
    return `${selectedProjects.size}-projects`;
  }, [mode, projectKey, selectedProjects]);

  const handleExport = () => {
    if (viewMode === "timecard") {
      const userRows = aggregateUserRows(filteredNodes);
      exportTimecardView(userRows, days, exportLabel, startDate, endDate);
    } else {
      exportHierarchyTimesheet(
        filteredNodes,
        days,
        exportLabel,
        startDate,
        endDate
      );
    }
  };

  const hasData = filteredNodes.length > 0;

  return (
    <div className="timesheet-container">
      <div className="report-header">
        <div className="report-controls">
          <div className="view-toggle">
            <button
              className={viewMode === "hierarchy" ? "active" : ""}
              onClick={() => setViewMode("hierarchy")}
            >
              Hierarchy
            </button>
            <button
              className={viewMode === "timecard" ? "active" : ""}
              onClick={() => setViewMode("timecard")}
            >
              Timecard
            </button>
          </div>
          {mode === "global" && (
            <MultiSelect
              options={projectOptions}
              selected={selectedProjects}
              onChange={setSelectedProjects}
              placeholder="All projects"
            />
          )}
          {epicOptions.length > 0 && (
            <MultiSelect
              options={epicOptions}
              selected={selectedEpics}
              onChange={setSelectedEpics}
              placeholder="All epics"
            />
          )}
          {userOptions.length > 0 && (
            <MultiSelect
              options={userOptions}
              selected={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="All users"
            />
          )}
        </div>
      </div>

      <div className="timesheet-nav">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
        />
        <button onClick={handleThisWeek}>This Week</button>
        <button className="btn btn-subtle" onClick={refresh}>
          Refresh
        </button>
        {hasData && (
          <button className="btn btn-subtle" onClick={handleExport}>
            Export CSV
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading timesheet..." />}
      {error && <div className="error">{error}</div>}

      {data && !loading && (
        <div className="table-scroll-wrapper">
          {viewMode === "timecard" ? (
            <HierarchyTimesheetTimecard nodes={filteredNodes} days={days} />
          ) : (
            <table className="timesheet-grid">
              <thead>
                <tr>
                  <th className="issue-header">Issue</th>
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
                {filteredNodes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      style={{ textAlign: "center", padding: 24 }}
                    >
                      No worklogs found for this period.
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredNodes.map((node) => (
                      <HierarchyTimesheetRow
                        key={node.issueKey}
                        node={node}
                        days={days}
                        depth={0}
                        expandedKeys={expandedKeys}
                        onToggle={toggleExpand}
                      />
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
                          {dailyTotals[day]
                            ? formatTime(dailyTotals[day])
                            : "\u2014"}
                        </td>
                      ))}
                      <td className="total-cell">{formatTime(grandTotal)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
