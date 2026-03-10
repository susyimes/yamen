#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

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

function usage() {
  console.log(`OpenClaw Bridge Relay\n\nCommands:\n  list\n  show <request-file>\n  scaffold <request-file>\n  fail <request-file> <reason>\n  validate-response <response-file>\n`);
}

function validateRoleResult(data) {
  const required = ["role", "action", "note", "completed", "pending", "blockers", "artifacts", "reply_summary", "occurred_at"];
  const missing = required.filter((key) => !(key in data));
  return {
    ok: missing.length === 0,
    missing,
  };
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  ensureBridgeDirs();

  if (!command) {
    usage();
    process.exit(1);
  }

  if (command === 'list') {
    console.log(JSON.stringify(listPending(), null, 2));
    return;
  }

  if (command === 'show') {
    const request = readJson(requestPathFor(args[0]));
    console.log(JSON.stringify(request, null, 2));
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

  if (command === 'fail') {
    const requestName = args[0];
    const reason = args.slice(1).join(' ') || 'unknown_bridge_failure';
    const request = readJson(requestPathFor(requestName));
    const out = responsePathFor(requestName);
    writeJson(out, buildFailureResponse(request, reason));
    console.log(out);
    return;
  }

  if (command === 'validate-response') {
    const data = readJson(path.join(RESPONSE_DIR, args[0]));
    console.log(JSON.stringify(validateRoleResult(data), null, 2));
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
};
