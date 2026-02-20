export declare function getIssueWorklogs({ payload, }: {
    payload: {
        issueKey: string;
        startDate?: string;
        endDate?: string;
    };
}): Promise<{
    issueKey: string;
    worklogs: import("../types").WorklogEntry[];
    totalTimeSeconds: number;
    timeByPerson: Record<string, number>;
}>;
export declare function logWork({ payload, }: {
    payload: {
        issueKey: string;
        timeSpentSeconds: number;
        started: string;
        comment?: string;
    };
}): Promise<{
    success: boolean;
    worklogId: any;
}>;
export declare function getProjectUsers({ payload, }: {
    payload: {
        projectKey: string;
        startDate: string;
        endDate: string;
    };
}): Promise<{
    users: import("../types").JiraUser[];
}>;
export declare function getProjects(): Promise<{
    projects: {
        key: string;
        name: string;
    }[];
}>;
//# sourceMappingURL=worklogs.d.ts.map