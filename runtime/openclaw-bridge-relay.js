#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { loadCase } = require("./case-store");
const { getRoleSessionConfig } = require("./role-session-config");

const REPO_ROOT = path.resolve(__dirname, "..");
const BRIDGE_ROOT = path.join(REPO_ROOT, "runtime", "bridge", "openclaw-session");
const REQUEST_DIR = path.join(BRIDGE_ROOT, "requests");
const RESPONSE_DIR = path.join(BRIDGE_ROOT, "responses");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureBridgeDirs() {
  ensureDir(REQUEST_DIR);
  ensureDir(RESPONSE_DIR);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function listRequestFiles() {
  ensureBridgeDirs();
  return fs.readdirSync(REQUEST_DIR)
    .filter((name) => name.endsWith('.request.json'))
    .sort();
}

function responsePathFor(requestName) {
  return path.join(RESPONSE_DIR, requestName.replace(/\.request\.json$/, '.response.json'));
}

function requestPathFor(requestName) {
  return path.join(REQUEST_DIR, requestName);
}

function buildOperatorPayload(request, routing) {
  if (routing.suggested_openclaw_action === "sessions_send") {
    return {
      tool: "sessions_send",
      payload: {
        label: routing.label,
        message: request.prompt,
        timeoutSeconds: Math.ceil((request.session?.timeoutMs || 60000) / 1000),
      },
    };
  }

  const usePersistentSession = Boolean(request.session?.thread === true);
  return {
    tool: "sessions_spawn",
    payload: {
      runtime: routing.runtime,
      agentId: routing.agentId,
      label: routing.label,
      mode: usePersistentSession ? "session" : "run",
      thread: usePersistentSession,
      cleanup: usePersistentSession ? "keep" : "delete",
      sandbox: "inherit",
      cwd: REPO_ROOT,
      task: request.prompt,
      timeoutSeconds: Math.ceil((request.session?.timeoutMs || 60000) / 1000),
    },
  };
}

function buildSessionRoutingAdvice(request) {
  const roleSession = request.role_session || getRoleSessionConfig(REPO_ROOT, request.role);
  const label = request.session?.label || roleSession.sessionLabel || null;
  const mode = request.session?.mode || roleSession.sessionMode || "spawn";
  const runtime = request.session?.runtime || roleSession.runtime || "subagent";
  const agentId = request.session?.agentId || roleSession.agentId || "main";
  const spawnMode = request.session?.spawnMode || roleSession.spawnMode || "reuse-or-spawn";

  const base = {
    role: request.role,
    managedBy: roleSession.managedBy || "openclaw-session",
    label,
    runtime,
    agentId,
    sessionMode: mode,
    spawnMode,
    purpose: roleSession.purpose || null,
    suggested_openclaw_action: mode === "send" ? "sessions_send" : "sessions_spawn",
    suggested_steps: mode === "send"
      ? [
          `Find existing session label: ${label}`,
          `Use sessions_send(label='${label}', message=<prompt>)`
        ]
      : [
          `Use sessions_spawn(runtime='${runtime}', agentId='${agentId}', label='${label}', mode='session' or 'run', task=<prompt>)`,
          spawnMode === "reuse-or-spawn" ? `If session '${label}' already exists, reuse it; otherwise spawn.` : `Always spawn a fresh role session.`
        ]
  };

  return {
    ...base,
    operator_payload: buildOperatorPayload(request, base),
  };
}

function listPending() {
  return listRequestFiles().map((name) => {
    const request = readJson(requestPathFor(name));
    const responsePath = responsePathFor(name);
    return {
      request_file: name,
      has_response: fs.existsSync(responsePath),
      role: request.role,
      case_id: request.payload?.case_id,
      action: request.transition?.action,
      session_mode: request.session?.mode,
      label: request.session?.label,
      bridge_basename: request.bridge?.basename || null,
      routing: buildSessionRoutingAdvice(request),
    };
  });
}

function buildScaffoldResponse(request) {
  return {
    role: request.role,
    action: request.transition?.action,
    note: `TODO: replace with real ${request.role} session result`,
    completed: [],
    pending: ["awaiting_role_session_result"],
    blockers: [],
    artifacts: [],
    reply_summary: request.payload?.reply_summary || "",
    occurred_at: new Date().toISOString(),
    meta: {
      provider: "openclaw-session",
      relay: "manual-scaffold",
      label: request.session?.label || null,
    },
  };
}

function buildFailureResponse(request, reason) {
  return {
    role: request.role,
    action: request.transition?.action,
    note: `OpenClaw relay failed: ${reason}`,
    completed: [],
    pending: ["session_response_failed"],
    blockers: [reason],
    artifacts: [],
    reply_summary: request.payload?.reply_summary || "",
    occurred_at: new Date().toISOString(),
    meta: {
      provider: "openclaw-session",
      relay: "failure",
      label: request.session?.label || null,
    },
  };
}

function validateRoleResult(data) {
  const required = ["role", "action", "note", "completed", "pending", "blockers", "artifacts", "reply_summary", "occurred_at"];
  const missing = required.filter((key) => !(key in data));
  return {
    ok: missing.length === 0,
    missing,
  };
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function readJsonFromArg(arg) {
  const trimmed = String(arg || "").trim();
  if (!trimmed) throw new Error("Missing JSON argument");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return readJson(path.resolve(process.cwd(), trimmed));
}

function readJsonFromStdin() {
  const input = fs.readFileSync(0, "utf8").trim();
  if (!input) throw new Error("STDIN is empty");
  return JSON.parse(input);
}

function buildNextHints() {
  const pending = listPending().filter((item) => !item.has_response);
  if (pending.length > 0) {
    const first = pending[0];
    return {
      kind: "pending-request",
      request_file: first.request_file,
      case_id: first.case_id,
      role: first.role,
      action: first.action,
      routing: first.routing,
      next_steps: [
        `node runtime/openclaw-bridge-relay.js show ${first.request_file}`,
        `node runtime/openclaw-bridge-relay.js scaffold-json ${first.request_file}`,
        `node runtime/openclaw-bridge-relay.js write-response-stdin ${first.request_file}`
      ]
    };
  }

  return {
    kind: "idle",
    message: "No pending bridge request without response.",
    next_steps: []
  };
}

function buildFiledStepPlan(caseId) {
  const currentCase = loadCase(REPO_ROOT, caseId);
  const map = {
    received: [
      `node runtime/orchestrator.js step ${caseId} classify_request`,
      `node runtime/orchestrator.js step ${caseId} open_filed_case`,
      `node runtime/orchestrator.js step ${caseId} draft_case_note`
    ],
    triaged: [
      `node runtime/orchestrator.js step ${caseId} open_filed_case`,
      `node runtime/orchestrator.js step ${caseId} draft_case_note`
    ],
    accepted: [
      `node runtime/orchestrator.js step ${caseId} draft_case_note`
    ],
    drafted: [
      `node runtime/orchestrator.js step ${caseId} execute_task`
    ],
    executing: [
      `node runtime/orchestrator.js step ${caseId} submit_result`
    ],
    done: []
  };

  return {
    case_id: caseId,
    status: currentCase.status,
    current_role: currentCase.current_role,
    reply_summary: currentCase.reply_summary,
    suggested_steps: map[currentCase.status] || []
  };
}

function usage() {
  console.log(`OpenClaw Bridge Relay\n\nCommands:\n  list\n  show <request-file>\n  next\n  scaffold <request-file>\n  scaffold-json <request-file>\n  fail <request-file> <reason>\n  write-response <request-file> <response-json-or-path>\n  write-response-stdin <request-file>\n  step-filed <case_id>\n  validate-response <response-file>\n`);
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  ensureBridgeDirs();

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === 'list') {
    printJson(listPending());
    return;
  }

  if (command === 'show') {
    const request = readJson(requestPathFor(args[0]));
    printJson({
      ...request,
      routing: buildSessionRoutingAdvice(request),
    });
    return;
  }

  if (command === 'next') {
    printJson(buildNextHints());
    return;
  }

  if (command === 'scaffold') {
    const requestName = args[0];
    const request = readJson(requestPathFor(requestName));
    const out = responsePathFor(requestName);
    writeJson(out, buildScaffoldResponse(request));
    console.log(out);
    return;
  }

  if (command === 'scaffold-json') {
    const request = readJson(requestPathFor(args[0]));
    printJson(buildScaffoldResponse(request));
    return;
  }

  if (command === 'fail') {
    const requestName = args[0];
    const reason = args.slice(1).join(' ') || 'unknown_bridge_failure';
    const request = readJson(requestPathFor(requestName));
    const out = responsePathFor(requestName);
    writeJson(out, buildFailureResponse(request, reason));
    console.log(out);
    return;
  }

  if (command === 'write-response') {
    const requestName = args[0];
    const request = readJson(requestPathFor(requestName));
    const response = readJsonFromArg(args.slice(1).join(' '));
    const check = validateRoleResult(response);
    if (!check.ok) {
      throw new Error(`Invalid role response. Missing fields: ${check.missing.join(', ')}`);
    }
    const out = responsePathFor(requestName);
    writeJson(out, {
      ...response,
      meta: {
        ...(response.meta || {}),
        provider: "openclaw-session",
        relay: "write-response",
        label: request.session?.label || null,
      },
    });
    console.log(out);
    return;
  }

  if (command === 'write-response-stdin') {
    const requestName = args[0];
    const request = readJson(requestPathFor(requestName));
    const response = readJsonFromStdin();
    const check = validateRoleResult(response);
    if (!check.ok) {
      throw new Error(`Invalid role response. Missing fields: ${check.missing.join(', ')}`);
    }
    const out = responsePathFor(requestName);
    writeJson(out, {
      ...response,
      meta: {
        ...(response.meta || {}),
        provider: "openclaw-session",
        relay: "write-response-stdin",
        label: request.session?.label || null,
      },
    });
    console.log(out);
    return;
  }

  if (command === 'step-filed') {
    printJson(buildFiledStepPlan(args[0]));
    return;
  }

  if (command === 'validate-response') {
    const data = readJson(path.join(RESPONSE_DIR, args[0]));
    printJson(validateRoleResult(data));
    return;
  }

  usage();
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  listPending,
  buildScaffoldResponse,
  buildFailureResponse,
  validateRoleResult,
  buildNextHints,
  buildFiledStepPlan,
  buildSessionRoutingAdvice,
  buildOperatorPayload,
};
