#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { buildSessionRoutingAdvice } = require('../runtime/openclaw-bridge-relay');

const REPO_ROOT = path.resolve(__dirname, '..');
const REQUEST_DIR = path.join(REPO_ROOT, 'runtime', 'bridge', 'openclaw-session', 'requests');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveRequestPath(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Missing request file path');
  if (path.isAbsolute(raw)) return raw;
  const candidate1 = path.join(process.cwd(), raw);
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(REQUEST_DIR, raw);
  if (fs.existsSync(candidate2)) return candidate2;
  throw new Error(`Request file not found: ${raw}`);
}

function buildToolDraft(request) {
  const routing = buildSessionRoutingAdvice(request);
  const operatorPayload = routing.operator_payload || {};
  const tool = operatorPayload.tool;
  const payload = operatorPayload.payload || {};

  return {
    request_file: request.bridge?.request_file || null,
    case_id: request.payload?.case_id || null,
    role: request.role,
    action: request.transition?.action || null,
    suggested_tool: tool,
    directly_executable_args: payload,
    notes: {
      label: routing.label || null,
      session_mode: routing.sessionMode || null,
      spawn_mode: routing.spawnMode || null,
      workspace: operatorPayload.workspace || null,
    },
  };
}

function usage() {
  console.log('Usage: node scripts/export-openclaw-session-payload.js <request-file>');
}

function main() {
  const [input] = process.argv.slice(2);
  if (!input) {
    usage();
    process.exit(1);
  }

  const requestPath = resolveRequestPath(input);
  const request = readJson(requestPath);
  const draft = buildToolDraft(request);
  process.stdout.write(JSON.stringify(draft, null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  buildToolDraft,
  resolveRequestPath,
};
