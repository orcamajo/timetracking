import Resolver from "@forge/resolver";
import { getHierarchyTimesheet } from "./hierarchy-timesheet";
import { getIssueWorklogs, logWork, getProjectUsers, getProjects } from "./worklogs";

const resolver = new Resolver();

resolver.define("getHierarchyTimesheet", getHierarchyTimesheet);
resolver.define("getIssueWorklogs", getIssueWorklogs);
resolver.define("logWork", logWork);
resolver.define("getProjectUsers", getProjectUsers);
resolver.define("getProjects", getProjects);

export const handler = resolver.getDefinitions();
