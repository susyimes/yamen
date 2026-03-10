#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createCase, loadCaseForRuntime, updateCaseForRuntime } = require("./orchestrator");
const { getProvisionedWorkspace } = require("./provisioning-config");

const REPO_ROOT = path.resolve(__dirname, "..");

function printJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function readJsonArg(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filePath), "utf8"));
}

function usage() {
  console.log(`Yamen Prefect Flow\n\nCommands:\n  submit <request.json>\n  report <case_id> <report.json>\n  show <case_id>\n`);
}

function submitToEntry(request) {
  const currentCase = createCase({
    ...request,
    source: {
      ...(request.source || {}),
      submitted_by: "prefect",
      entry_label: "yamen-entry",
    },
  });

  currentCase.runtime = {
    model: "prefect-yamen-entry",
    entry: {
      label: "yamen-entry",
      workspace: getProvisionedWorkspace(REPO_ROOT, "entry"),
    },
    internal_roles: {
      zhubu: getProvisionedWorkspace(REPO_ROOT, "zhubu"),
      kuaishou: getProvisionedWorkspace(REPO_ROOT, "kuaishou"),
      dianshi: getProvisionedWorkspace(REPO_ROOT, "dianshi"),
    },
    report_to_prefect: null,
  };

  updateCaseForRuntime(currentCase.case_id, currentCase);

  return {
    case_id: currentCase.case_id,
    submitted_by: "prefect",
    next_session: "yamen-entry",
    entry_workspace: currentCase.runtime.entry.workspace,
    suggested_next_action: "handoff_to_entry",
    case: currentCase,
  };
}

function attachEntryReport(caseId, report) {
  const currentCase = loadCaseForRuntime(caseId);
  currentCase.runtime = currentCase.runtime || {};
  currentCase.runtime.report_to_prefect = report;
  currentCase.reply_summary = report.report_to_prefect || currentCase.reply_summary || "";
  currentCase.updated_at = new Date().toISOString();
  currentCase.flow_log = currentCase.flow_log || [];
  currentCase.flow_log.push({
    at: currentCase.updated_at,
    role: "entry",
    action: "close_and_report",
    status: currentCase.status,
    note: report.summary || "entry reported to prefect",
    next_role: "prefect",
  });
  updateCaseForRuntime(caseId, currentCase);
  return currentCase;
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === "submit") {
    printJson(submitToEntry(readJsonArg(args[0])));
    return;
  }

  if (command === "report") {
    printJson(attachEntryReport(args[0], readJsonArg(args[1])));
    return;
  }

  if (command === "show") {
    printJson(loadCaseForRuntime(args[0]));
    return;
  }

  usage();
  process.exit(1);
}

if (require.main === module) {
  main();
}
