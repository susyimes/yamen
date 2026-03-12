#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createCase, loadCaseForRuntime, updateCaseForRuntime } = require("./orchestrator");
const { getProvisionedWorkspace } = require("./provisioning-config");
const { buildEnsureEntryAvailable } = require("./entry-availability");

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
      submitted_by: "yamen-prefect",
      prefect_label: "yamen-prefect",
      entry_label: "yamen-entry",
    },
  });

  currentCase.runtime = {
    model: "yamen-prefect-entry",
    prefect: {
      label: "yamen-prefect",
      workspace: getProvisionedWorkspace(REPO_ROOT, "prefect"),
    },
    entry: {
      label: "yamen-entry",
      workspace: getProvisionedWorkspace(REPO_ROOT, "entry"),
      ensure_available: buildEnsureEntryAvailable(REPO_ROOT),
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
    submitted_by: "yamen-prefect",
    next_session: "yamen-entry",
    prefect_workspace: currentCase.runtime.prefect.workspace,
    entry_workspace: currentCase.runtime.entry.workspace,
    ensure_entry_available: currentCase.runtime.entry.ensure_available,
    suggested_next_action: "ensure_entry_available_then_yamen_prefect_handoff_to_entry",
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
    note: report.summary || "entry reported to yamen-prefect",
    next_role: "xianling",
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
