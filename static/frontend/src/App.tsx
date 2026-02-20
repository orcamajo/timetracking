import React, { useEffect, useState } from "react";
import { view } from "@forge/bridge";
import { HierarchyTimesheet } from "./components/HierarchyTimesheet/HierarchyTimesheet";
import { LogWorkForm } from "./components/LogWork/LogWorkForm";

type ModuleContext = {
  moduleKey: string;
  extension?: {
    project?: { key: string };
    issue?: { key: string };
  };
};

export default function App() {
  const [context, setContext] = useState<ModuleContext | null>(null);

  useEffect(() => {
    view.getContext().then((ctx: any) => {
      setContext({
        moduleKey: ctx.moduleKey ?? "",
        extension: ctx.extension,
      });
    });
  }, []);

  if (!context) {
    return <div className="loading">Loading...</div>;
  }

  // Route based on which Forge module loaded us
  if (context.moduleKey.includes("project-page")) {
    const projectKey = context.extension?.project?.key ?? "";
    return <HierarchyTimesheet mode="project" projectKey={projectKey} />;
  }

  if (context.moduleKey.includes("global-page")) {
    return <HierarchyTimesheet mode="global" />;
  }

  if (context.moduleKey.includes("issue-panel")) {
    const issueKey = context.extension?.issue?.key ?? "";
    return <LogWorkForm issueKey={issueKey} />;
  }

  return <div>Unknown module: {context.moduleKey}</div>;
}
