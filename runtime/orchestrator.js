#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { loadTransitions, isTerminalStatus, getAllowedTransitions, getTransitionByAction } = require("./transition-engine");
const { ensureCaseDirs, saveActiveCase, loadCase, archiveCase, listActiveCases } = require("./case-store");
const { runRoleAction } = require("./role-runner");

const REPO_ROOT = path.resolve(__dirname, "..");

function nowIso() {
  return new Date().toISOString();
}

function slugTitle(text) {
  return String(text || "case")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "case";
}

function nextSequence() {
  ensureCaseDirs(REPO_ROOT);
  const existing = listActiveCases(REPO_ROOT);
  return String(existing.length + 1).padStart(3, "0");
}

function createCase(request) {
  const createdAt = nowIso();
  const datePrefix = createdAt.slice(0, 10).replace(/-/g, "");
  const caseId = `${datePrefix}-${nextSequence()}-${slugTitle(request.title || request.summary || request.raw_request)}`;

  const currentCase = {
    case_id: caseId,
    title: request.title || "未命名案件",
    summary: request.summary || request.raw_request,
    raw_request: request.raw_request,
    source: request.source || { channel: "unknown" },
    priority: request.priority || "normal",
    risk_level: request.risk_level || "low",
    mode: request.mode || "direct",
    status: "received",
    current_role: "menfang",
    owner_agent: "xianling",
    needs_review: request.needs_review ?? request.mode === "reviewed",
    blocking_issues: [],
    artifacts: [],
    flow_log: [
      {
        at: createdAt,
        role: "menfang",
        action: "create_case",
        status: "received",
        note: "Case created by orchestrator",
        next_role: "menfang",
      },
    ],
    reply_summary: "",
    created_at: createdAt,
    updated_at: createdAt,
  };

  saveActiveCase(REPO_ROOT, currentCase);
  return currentCase;
}

function appendFlow(currentCase, transition, roleResult) {
  currentCase.flow_log.push({
    at: roleResult.occurred_at || nowIso(),
    role: transition.by,
    action: transition.action,
    status: transition.to,
    note: roleResult.note || "",
    next_role: transition.nextRole,
  });
}

function applyTransition(currentCase, transition, roleResult) {
  currentCase.status = transition.to;
  currentCase.current_role = transition.nextRole;
  currentCase.updated_at = nowIso();

  if (Array.isArray(roleResult.blockers) && roleResult.blockers.length > 0) {
    currentCase.blocking_issues = roleResult.blockers;
  } else if (transition.to !== "returned") {
    currentCase.blocking_issues = [];
  }

  if (Array.isArray(roleResult.artifacts) && roleResult.artifacts.length > 0) {
    currentCase.artifacts.push(...roleResult.artifacts);
  }

  if (typeof roleResult.reply_summary === "string" && roleResult.reply_summary.trim()) {
    currentCase.reply_summary = roleResult.reply_summary;
  }

  appendFlow(currentCase, transition, roleResult);
  saveActiveCase(REPO_ROOT, currentCase);

  if (isTerminalStatus(loadTransitions(REPO_ROOT), currentCase.status)) {
    archiveCase(REPO_ROOT, currentCase);
  }

  return currentCase;
}

function stepCase(caseId, action) {
  const transitions = loadTransitions(REPO_ROOT);
  const currentCase = loadCase(REPO_ROOT, caseId);
  const transition = getTransitionByAction(transitions, currentCase, action);

  if (!transition) {
    const allowed = getAllowedTransitions(transitions, currentCase).map((item) => item.action);
    throw new Error(`Action '${action}' is not allowed for case ${caseId} at status '${currentCase.status}'. Allowed: ${allowed.join(", ")}`);
  }

  const roleResult = runRoleAction(currentCase, transition, { now: nowIso() });
  return applyTransition(currentCase, transition, roleResult);
}

function printJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n");
}

function readJsonArg(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), filePath), "utf8"));
}

function usage() {
  console.log(`Yamen Orchestrator\n\nCommands:\n  create <request.json>    Create a new case from request JSON\n  step <case_id> <action> Advance a case by action\n  show <case_id>           Show one case\n  list                     List active cases\n  allowed <case_id>        Show allowed actions for a case\n`);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  ensureCaseDirs(REPO_ROOT);

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === "create") {
    const request = readJsonArg(args[0]);
    printJson(createCase(request));
    return;
  }

  if (command === "step") {
    printJson(stepCase(args[0], args[1]));
    return;
  }

  if (command === "show") {
    printJson(loadCase(REPO_ROOT, args[0]));
    return;
  }

  if (command === "list") {
    printJson(listActiveCases(REPO_ROOT));
    return;
  }

  if (command === "allowed") {
    const transitions = loadTransitions(REPO_ROOT);
    const currentCase = loadCase(REPO_ROOT, args[0]);
    printJson(getAllowedTransitions(transitions, currentCase));
    return;
  }

  usage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  createCase,
  stepCase,
};
