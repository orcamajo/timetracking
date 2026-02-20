import { hierarchyService } from "../services/hierarchy-service";
import { worklogService } from "../services/worklog-service";
import { aggregationService } from "../services/aggregation-service";
import { JiraUser, HierarchyTimesheetData } from "../types";

export async function getHierarchyTimesheet({
  payload,
}: {
  payload: { projectKeys?: string[]; startDate: string; endDate: string };
}): Promise<HierarchyTimesheetData> {
  const { projectKeys, startDate, endDate } = payload;

  // Fetch worklogs (scoped to projects if provided)
  const worklogs = await worklogService.getWorklogs(
    projectKeys && projectKeys.length > 0 ? projectKeys : null,
    startDate,
    endDate
  );

  // Determine affected projects from worklog issueKey prefixes
  const affectedProjects = new Set<string>();
  for (const wl of worklogs) {
    affectedProjects.add(wl.issueKey.split("-")[0]);
  }

  // Build hierarchy for each affected project
  const allRoots = [];
  for (const projectKey of affectedProjects) {
    const roots = await hierarchyService.buildHierarchy(projectKey);
    allRoots.push(...roots);
  }

  // Convert to timesheet nodes with daily breakdowns and rollups
  const nodes = aggregationService.aggregateWorklogsDailyBreakdown(
    allRoots,
    worklogs
  );

  // Collect unique users from worklogs
  const userMap = new Map<string, JiraUser>();
  for (const wl of worklogs) {
    if (!userMap.has(wl.author.accountId)) {
      userMap.set(wl.author.accountId, wl.author);
    }
  }
  const users = Array.from(userMap.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  return { nodes, users, startDate, endDate };
}
