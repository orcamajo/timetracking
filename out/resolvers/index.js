"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const resolver_1 = __importDefault(require("@forge/resolver"));
const hierarchy_timesheet_1 = require("./hierarchy-timesheet");
const worklogs_1 = require("./worklogs");
const resolver = new resolver_1.default();
resolver.define("getHierarchyTimesheet", hierarchy_timesheet_1.getHierarchyTimesheet);
resolver.define("getIssueWorklogs", worklogs_1.getIssueWorklogs);
resolver.define("logWork", worklogs_1.logWork);
resolver.define("getProjectUsers", worklogs_1.getProjectUsers);
resolver.define("getProjects", worklogs_1.getProjects);
exports.handler = resolver.getDefinitions();
//# sourceMappingURL=index.js.map