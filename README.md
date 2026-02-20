# Time Tracking Reports — Forge App for Jira Cloud

Jira's native time tracking lacks robust reporting — you can't easily see time logged per person as it rolls up through the issue hierarchy (sub-task → task → story → epic → project). This app fills that gap by reading Jira's native worklogs and presenting them in three views: a hierarchical rollup report, a per-person timesheet grid, and an issue-level worklog panel.

The app runs entirely on Atlassian's Forge platform (serverless, hosted on Atlassian infrastructure). It reads existing Jira worklogs via the REST API — no separate database, no data sync, and no migration. Any time already logged in Jira is immediately available.

## Features

### Hierarchy Report (Project Page)

An expandable tree table that mirrors your project's issue hierarchy. For each issue it shows:

- **Logged (self)**: time logged directly on that issue
- **Rolled Up**: time logged on that issue plus all its descendants
- **Per-person columns**: rolled-up time broken down by each contributor

Top-level nodes auto-expand on load. A date range picker filters which worklogs are included. A totals row at the bottom sums across all root-level issues.

### Timesheet View (Global Page)

A weekly grid inspired by Tempo Timesheets:

- Rows are issues that have worklogs in the selected week
- Columns are days of the week (Mon–Sun)
- Each cell shows hours logged; weekends and today are highlighted
- Daily totals row at the bottom, per-issue totals on the right
- Week navigation (prev/next/today) and a user picker to view any team member's sheet
- Enter a project key to scope the view

### Issue Panel

A compact panel that appears on every issue:

- Total time logged badge
- Quick "Log Work" form — accepts flexible time input (`2h 30m`, `1.5h`, `90m`, or just `90` for minutes)
- List of the 10 most recent worklogs with author, date, and comment

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **Atlassian Forge CLI**: `npm install -g @forge/cli`
- **Atlassian account** with access to a Jira Cloud site
- **Forge CLI login**: run `forge login` and authenticate with your Atlassian API token

To create an API token, go to https://id.atlassian.com/manage-profile/security/api-tokens.

## Installation

### 1. Clone and install dependencies

```bash
git clone <repo-url> timetracking
cd timetracking
npm install
cd static/frontend && npm install && cd ../..
```

### 2. Register the app with Forge

```bash
forge register
```

This creates a new app in your Atlassian developer account and updates the `app.id` in `manifest.yml` with your unique app ID. You only need to do this once.

### 3. Build

```bash
npm run build:all
```

This compiles the backend TypeScript to `out/` and builds the React frontend to `static/frontend/dist/`.

### 4. Deploy

```bash
forge deploy
```

This uploads the built code to Atlassian's infrastructure. The first deploy goes to the **development** environment by default.

### 5. Install on your Jira site

```bash
forge install
```

You'll be prompted to:
1. Select the **Jira** product
2. Enter your Jira site URL (e.g. `your-site.atlassian.net`)
3. Confirm the permission scopes

The app is now installed and active on your site.

### Subsequent deploys

After making changes, rebuild and redeploy:

```bash
npm run build:all
forge deploy
```

No need to re-run `forge install` — the existing installation picks up the new deployment automatically.

### Upgrading to production

When ready to move beyond development:

```bash
forge deploy -e production
forge install --upgrade -e production
```

## Development with Tunnel

For local development with hot-reloading of the backend resolvers:

```bash
npm run tunnel
```

This runs `forge tunnel`, which proxies Forge function invocations to your local machine. Changes to resolver code take effect immediately without redeploying. Note: frontend changes still require rebuilding (`npm run build:frontend`) since the Custom UI is served as static files.

In a separate terminal, you can rebuild the frontend as needed:

```bash
cd static/frontend && npm run build
```

## Where to Find the App in Jira

Once installed, the three modules appear in these locations:

| View | How to access |
|------|---------------|
| **Time Reports** (hierarchy rollup) | Open any project → click **Time Reports** in the left sidebar under "Project pages" |
| **Timesheets** (weekly grid) | Click **Apps** in the top navigation → **Timesheets** |
| **Time Tracking** (issue panel) | Open any issue → look for the **Time Tracking** panel in the right sidebar |

## Testing

### Quick smoke test

1. **Log some time natively in Jira**: Open an issue, click the clock icon or go to the worklog section, and log time on a few issues at different levels of a hierarchy (e.g. an epic, a story under it, and a sub-task under that story).

2. **Check the issue panel**: Open one of the issues you logged time on. The "Time Tracking" panel should show your worklog entries, the total time badge, and the log work form.

3. **Log time via the app**: Use the "Log Work" form in the issue panel. Enter a time like `1h 30m`, pick a date, optionally add a comment, and submit. Verify the worklog appears in both the panel's recent list and Jira's native worklog section.

4. **Check the hierarchy report**: Navigate to the project page (Project → Time Reports). Set the date range to cover the dates you logged time. You should see:
   - Each issue with its directly logged time in the "Logged" column
   - Parent issues showing the sum of their own time plus children's time in the "Rolled Up" column
   - Per-person columns breaking down who logged what
   - Expand/collapse working on parent issues

5. **Check the timesheet**: Go to Apps → Timesheets. Enter your project key and navigate to the week containing your worklogs. You should see:
   - Each issue as a row with time distributed across day columns
   - Daily totals in the bottom row
   - Per-issue totals in the rightmost column
   - Weekend columns with a subtle background tint
   - Today's column highlighted

### Verifying hierarchy rollup accuracy

Create a controlled hierarchy and log known amounts:

```
PROJ-1 (Epic)
├── PROJ-2 (Story)      → log 2h by User A
│   ├── PROJ-3 (Sub-task) → log 1h by User A, 30m by User B
│   └── PROJ-4 (Sub-task) → log 45m by User B
└── PROJ-5 (Story)      → log 3h by User B
```

Expected rollup at PROJ-1:
- **Rolled Up**: 7h 15m (2h + 1h + 30m + 45m + 3h)
- **User A**: 3h (2h + 1h)
- **User B**: 4h 15m (30m + 45m + 3h)

Expected rollup at PROJ-2:
- **Rolled Up**: 4h 15m (2h + 1h + 30m + 45m)
- **User A**: 3h (2h + 1h)
- **User B**: 1h 15m (30m + 45m)

### Verifying the timesheet

Log time on several issues across different days of a week. The timesheet grid should:
- Match the total for each issue against Jira's native worklog view
- Show the correct day for each entry (dates align with the column headers)
- Daily totals should equal the sum of all cells in that column
- The grand total should equal the sum of all daily totals

### Edge cases to test

- **Issue with no parent**: Should appear as a root node in the hierarchy report
- **Empty project**: The report should show an "no worklogs found" message, not an error
- **Large number of worklogs**: Issues with more than 20 worklogs trigger paginated fetching — log 25+ entries on a single issue to verify all are counted
- **Date range filtering**: Worklogs outside the selected date range should not appear in any view
- **Multiple users**: Use the user picker in the timesheet to filter by a specific person; verify totals change accordingly

### Viewing logs

To check for backend errors or debug issues:

```bash
forge logs
```

This streams the function invocation logs from the deployed environment.

## Project Structure

```
timetracking/
├── manifest.yml                    # Forge app manifest (modules, permissions, resources)
├── package.json                    # Root dependencies (@forge/resolver, @forge/api)
├── tsconfig.json                   # Backend TypeScript config (compiles to out/)
├── src/
│   ├── resolvers/
│   │   ├── index.ts                # Resolver handler export (entry point for Forge)
│   │   ├── worklogs.ts             # getIssueWorklogs, logWork, getProjectUsers
│   │   ├── hierarchy.ts            # getHierarchyReport (tree + rollups)
│   │   └── timesheet.ts            # getTimesheetData (daily grid)
│   ├── services/
│   │   ├── jira-client.ts          # @forge/api wrapper with pagination and error handling
│   │   ├── worklog-service.ts      # Worklog fetching, date filtering, user extraction
│   │   ├── hierarchy-service.ts    # Issue tree building from flat JQL results
│   │   └── aggregation-service.ts  # Bottom-up time rollup through hierarchy
│   └── types/
│       └── index.ts                # Shared TypeScript interfaces
├── static/frontend/                # Custom UI (React + Vite)
│   ├── package.json
│   ├── vite.config.ts              # base: "./" for Forge Custom UI
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx                # React entry point
│       ├── App.tsx                 # Module routing based on Forge context
│       ├── api/bridge.ts           # invoke() wrappers for each resolver
│       ├── components/
│       │   ├── HierarchyReport/    # Tree table with expandable rows
│       │   ├── Timesheet/          # Weekly grid with day columns
│       │   ├── LogWork/            # Quick log-time form + worklog list
│       │   └── common/             # DateRangePicker, UserPicker, LoadingSpinner
│       ├── hooks/                  # useHierarchy, useTimesheet, useWorklogs
│       ├── utils/                  # time-format.ts, date-utils.ts
│       └── styles/index.css        # Atlassian-like styling
└── README.md
```

## Permissions

| Scope | Purpose |
|-------|---------|
| `read:jira-work` | Read issues, worklogs, issue types, and project structure |
| `write:jira-work` | Create new worklog entries via the Log Work form |
| `storage:app` | Store user preferences and cached data via `@forge/kvs` |

## Troubleshooting

**"No issues with worklogs found"**: Make sure the date range covers dates when time was actually logged. Jira's `worklogDate` JQL field indexes the worklog start date, not the creation date.

**Hierarchy report is slow on large projects**: The first load fetches all issues and worklogs for the project. Subsequent loads within the same date range will be faster. For very large projects (500+ issues), consider narrowing the date range.

**"Failed to fetch" errors**: Check `forge logs` for details. Common causes are permission issues (the app needs `read:jira-work` and `write:jira-work`) or the app not being installed on the site.

**Issue panel not showing**: Issue panels may need to be enabled. On the issue view, click the "..." menu in the panel area and look for "Time Tracking" to toggle it on.

**Timesheet shows no project key input**: The global page doesn't have project context automatically. Enter a project key (e.g. `PROJ`) in the input field and press Enter.
