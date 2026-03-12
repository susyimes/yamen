#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const RELAY = path.join(REPO_ROOT, 'runtime', 'openclaw-bridge-relay.js');
const EXPORTER = path.join(REPO_ROOT, 'scripts', 'export-openclaw-session-payload.js');

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [script, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || `command failed: node ${script} ${args.join(' ')}`).trim());
  }
  return (r.stdout || '').trim();
}

function parseJson(text, hint) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse JSON from ${hint}: ${e.message}`);
  }
}

function usage() {
  console.log('Usage: node scripts/relay-semi-auto.js <request-file> [--stdin]');
  console.log('  --stdin  read role JSON response from STDIN and write response file automatically');
}

function printToolDraft(draft) {
  if (Array.isArray(draft.execution_plan) && draft.execution_plan.length > 0) {
    console.log('\n=== Runtime Dispatch Plan ===');
    draft.execution_plan.forEach((step, index) => {
      console.log(`\n[${index + 1}] ${step.step}`);
      console.log(`tool: ${step.tool}`);
      console.log('args:');
      console.log(JSON.stringify(step.directly_executable_args, null, 2));
    });
  } else {
    console.log('\n=== Suggested OpenClaw Tool Call ===');
    console.log(`tool: ${draft.suggested_tool}`);
    console.log('args:');
    console.log(JSON.stringify(draft.directly_executable_args, null, 2));
  }

  console.log('\n=== Notes ===');
  console.log(JSON.stringify(draft.notes || {}, null, 2));

  console.log('\nNext: execute the plan above in OpenClaw, then copy the returned role JSON.');
}

function writeFromStdin(requestFile) {
  const input = fs.readFileSync(0, 'utf8').trim();
  if (!input) throw new Error('STDIN is empty; expected role JSON response');

  const validation = runNode(RELAY, ['write-response', requestFile, input]);
  console.log('\n=== Response Written ===');
  console.log(validation);
}

function main() {
  const args = process.argv.slice(2);
  const requestFile = args.find((a) => !a.startsWith('--'));
  const readStdin = args.includes('--stdin');

  if (!requestFile) {
    usage();
    process.exit(1);
  }

  const draftRaw = runNode(EXPORTER, [requestFile]);
  const draft = parseJson(draftRaw, 'exporter output');
  printToolDraft(draft);

  if (!readStdin) {
    console.log(`\nWhen ready, write response manually with:`);
    console.log(`node runtime/openclaw-bridge-relay.js write-response-stdin ${requestFile}`);
    console.log('and paste the role JSON into STDIN.');
    return;
  }

  writeFromStdin(requestFile);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  }
}
