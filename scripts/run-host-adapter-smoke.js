#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const adapter = path.join(REPO_ROOT, 'runtime', 'openclaw-host-adapter.js');
const responseDir = path.join(REPO_ROOT, 'runtime', 'bridge', 'openclaw-session', 'responses');

function run(commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || 'command failed').trim());
  }
  return JSON.parse((result.stdout || '').trim());
}

function cleanResponse(name) {
  const file = path.join(responseDir, name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  fs.mkdirSync(responseDir, { recursive: true });

  cleanResponse('sample-zhubu-draft.response.json');
  cleanResponse('sample-entry-classify.response.json');

  const zhubu = run([adapter, path.join(REPO_ROOT, 'runtime', 'sample-openclaw-session.request.json'), '--stdout']);
  assert(zhubu.ok === true, 'zhubu adapter run did not report ok');
  assert(Array.isArray(zhubu.executed_steps) && zhubu.executed_steps.length === 1, 'zhubu should execute one step');
  assert(zhubu.executed_steps[0].step === 'dispatch-request', 'zhubu step should be dispatch-request');
  assert(fs.existsSync(zhubu.response_path), 'zhubu response file missing');

  const entry = run([adapter, path.join(REPO_ROOT, 'runtime', 'sample-entry-openclaw-session.request.json'), '--stdout']);
  assert(entry.ok === true, 'entry adapter run did not report ok');
  assert(Array.isArray(entry.executed_steps) && entry.executed_steps.length === 2, 'entry should execute ensure + dispatch');
  assert(entry.executed_steps[0].step === 'ensure-role-available', 'entry first step should ensure-role-available');
  assert(entry.executed_steps[1].step === 'dispatch-request', 'entry second step should be dispatch-request');
  assert(fs.existsSync(entry.response_path), 'entry response file missing');

  const summary = {
    ok: true,
    cases: [
      {
        name: 'zhubu dispatch smoke',
        executed_steps: zhubu.executed_steps.map((item) => item.step),
        response_path: zhubu.response_path,
      },
      {
        name: 'entry ensure+dispatch smoke',
        executed_steps: entry.executed_steps.map((item) => item.step),
        response_path: entry.response_path,
      },
    ],
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message || String(error));
    process.exit(1);
  }
}
