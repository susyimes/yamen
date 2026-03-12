#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { buildToolDraft, resolveRequestPath } = require('./export-openclaw-session-payload');

const REPO_ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildAdapterBundle(requestPath) {
  const resolved = resolveRequestPath(requestPath);
  const request = readJson(resolved);
  const draft = buildToolDraft(request);

  return {
    generated_at: new Date().toISOString(),
    repo_root: REPO_ROOT,
    request_file: request.bridge?.request_file || path.basename(resolved),
    request_path: resolved,
    response_file: request.bridge?.response_file || null,
    case_id: request.payload?.case_id || null,
    role: request.role,
    action: request.transition?.action || null,
    execution_plan: draft.execution_plan || [],
    write_response: {
      command: `node runtime/openclaw-bridge-relay.js write-response-stdin ${request.bridge?.request_file || path.basename(resolved)}`,
      note: 'After executing the plan, paste the returned role JSON into STDIN for this command.',
    },
    fail_response: {
      command: `node runtime/openclaw-bridge-relay.js fail ${request.bridge?.request_file || path.basename(resolved)} <reason>`,
      note: 'Use this if OpenClaw execution cannot produce a valid role JSON result.',
    },
    notes: draft.notes || {},
  };
}

function usage() {
  console.log('Usage: node scripts/export-openclaw-adapter-bundle.js <request-file>');
}

function main() {
  const [input] = process.argv.slice(2);
  if (!input) {
    usage();
    process.exit(1);
  }

  const bundle = buildAdapterBundle(input);
  process.stdout.write(JSON.stringify(bundle, null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  buildAdapterBundle,
};
