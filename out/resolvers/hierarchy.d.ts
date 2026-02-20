import { HierarchyNode } from "../types";
export declare function getHierarchyReport({ payload, }: {
    payload: {
        projectKey: string;
        startDate: string;
        endDate: string;
    };
}): Promise<{
    hierarchy: HierarchyNode[];
    users: {
        accountId: string;
        displayName: string;
    }[];
}>;
//# sourceMappingURL=hierarchy.d.ts.map