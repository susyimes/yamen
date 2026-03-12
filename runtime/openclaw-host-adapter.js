#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { buildAdapterBundle } = require('../scripts/export-openclaw-adapter-bundle');
const relay = require('./openclaw-bridge-relay');

const REPO_ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const out = { executor: null, stdout: false, request: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--executor') {
      out.executor = argv[i + 1];
      i += 1;
    } else if (arg === '--stdout') {
      out.stdout = true;
    } else if (!out.request) {
      out.request = arg;
    }
  }
  return out;
}

function usage() {
  console.log('Usage: node runtime/openclaw-host-adapter.js <request-file> [--executor <command>] [--stdout]');
  console.log('');
  console.log('Default executor: node runtime/openclaw-session-bridge.example.js');
}

function defaultExecutor() {
  return {
    command: process.execPath,
    args: [path.join(REPO_ROOT, 'runtime', 'openclaw-session-bridge.example.js')],
    printable: `${process.execPath} ${path.join(REPO_ROOT, 'runtime', 'openclaw-session-bridge.example.js')}`,
  };
}

function normalizeExecutor(executorValue) {
  if (!executorValue) return defaultExecutor();
  return {
    command: executorValue,
    args: [],
    printable: executorValue,
  };
}

function buildExecutorInput(step, bundle) {
  return {
    adapter_protocol: 'yamen.host-adapter.v1',
    step,
    bundle: {
      request_file: bundle.request_file,
      case_id: bundle.case_id,
      role: bundle.role,
      action: bundle.action,
    },
  };
}

function runExecutor(executor, input) {
  const result = spawnSync(executor.command, executor.args || [], {
    input: JSON.stringify(input, null, 2),
    encoding: 'utf8',
    cwd: REPO_ROOT,
    timeout: 60000,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `executor failed: ${executor.printable || executor.command}`).trim());
  }

  const text = (result.stdout || '').trim();
  if (!text) {
    throw new Error('executor returned empty stdout');
  }
  return JSON.parse(text);
}

function writeResponseForBundle(bundle, roleJson) {
  const requestName = bundle.request_file;
  const check = relay.validateRoleResult(roleJson);
  if (!check.ok) {
    throw new Error(`Invalid role response. Missing fields: ${check.missing.join(', ')}`);
  }

  const outPath = path.join(REPO_ROOT, 'runtime', 'bridge', 'openclaw-session', 'responses', requestName.replace(/\.request\.json$/, '.response.json'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(roleJson, null, 2) + '\n', 'utf8');
  return outPath;
}

function synthesizeRoleResponse(bundle, dispatchResult, stepResults) {
  const dispatchMeta = dispatchResult.meta || {};
  return {
    role: bundle.role,
    action: bundle.action,
    note: dispatchResult.note || `[host-adapter] ${bundle.role} completed ${bundle.action}`,
    completed: Array.isArray(dispatchResult.completed) ? dispatchResult.completed : ['adapter_dispatched'],
    pending: Array.isArray(dispatchResult.pending) ? dispatchResult.pending : [],
    blockers: Array.isArray(dispatchResult.blockers) ? dispatchResult.blockers : [],
    artifacts: Array.isArray(dispatchResult.artifacts) ? dispatchResult.artifacts : [],
    reply_summary: typeof dispatchResult.reply_summary === 'string' ? dispatchResult.reply_summary : '',
    occurred_at: dispatchResult.occurred_at || new Date().toISOString(),
    meta: {
      provider: 'host-adapter',
      bridge: 'openclaw-host-adapter',
      execution_plan_steps: stepResults.map((item) => ({
        step: item.step.step,
        role: item.step.role,
        tool: item.step.tool,
      })),
      dispatch_meta: dispatchMeta,
    },
  };
}

function executeBundle(bundle, executorConfig) {
  const stepResults = [];
  let dispatchResult = null;

  for (const step of bundle.execution_plan || []) {
    const input = buildExecutorInput(step, bundle);
    const result = runExecutor(executorConfig, input);
    stepResults.push({ step, result });
    if (step.step === 'dispatch-request') {
      dispatchResult = result;
    }
  }

  if (!dispatchResult) {
    throw new Error('execution_plan did not contain a dispatch-request step');
  }

  return {
    stepResults,
    roleResponse: synthesizeRoleResponse(bundle, dispatchResult, stepResults),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.request) {
    usage();
    process.exit(1);
  }

  const executorConfig = normalizeExecutor(args.executor);
  const bundle = buildAdapterBundle(args.request);
  const { stepResults, roleResponse } = executeBundle(bundle, executorConfig);
  const responsePath = writeResponseForBundle(bundle, roleResponse);

  const out = {
    ok: true,
    request_file: bundle.request_file,
    response_path: responsePath,
    executor: executorConfig.printable || executorConfig.command,
    executed_steps: stepResults.map(({ step, result }) => ({
      step: step.step,
      role: step.role,
      tool: step.tool,
      executor_meta: result.meta || null,
    })),
    role_response: roleResponse,
  };

  if (args.stdout) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } else {
    console.log(`response written: ${responsePath}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message || String(error));
    process.exit(1);
  }
}

module.exports = {
  executeBundle,
  synthesizeRoleResponse,
};
