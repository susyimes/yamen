#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadProvisioningConfig, getProvisionedWorkspace } = require('../runtime/provisioning-config');

const REPO_ROOT = path.resolve(__dirname, '..');

function buildStartupTask(role) {
  if (role === 'entry') {
    return 'Start as yamen-entry (merged menfang+xianling). Accept handoff from yamen-prefect, handle triage/select_mode/merge_results, introduce yourself briefly, then wait for further instructions.';
  }

  return 'Start as yamen-prefect (visible superior agent). In formal Yamen flow, non-trivial tasks must be dispatched to yamen-entry first; do not impersonate internal execution roles. Introduce yourself briefly, then wait for further instructions.';
}

function buildSpawnDraft(config, role) {
  const roleConfig = config[role];
  const workspace = getProvisionedWorkspace(REPO_ROOT, role);
  const usePersistent = roleConfig.sessionMode === 'session';
  return {
    role,
    label: roleConfig.sessionLabel,
    tool: 'sessions_spawn',
    directly_executable_args: {
      runtime: roleConfig.runtime,
      agentId: roleConfig.agentId,
      label: roleConfig.sessionLabel,
      mode: usePersistent ? 'session' : 'run',
      thread: usePersistent,
      cleanup: 'keep',
      sandbox: 'inherit',
      cwd: workspace ? workspace.workspacePath : REPO_ROOT,
      task: buildStartupTask(role),
      timeoutSeconds: 60,
    },
  };
}

function buildManifest() {
  const provisioning = loadProvisioningConfig(REPO_ROOT);
  const getStarted = provisioning.getStarted || {};
  const order = Array.isArray(getStarted.bootstrapOrder) && getStarted.bootstrapOrder.length
    ? getStarted.bootstrapOrder
    : ['entry', 'prefect'];

  return {
    generated_at: new Date().toISOString(),
    guarantees: getStarted.operatorGuarantees || [],
    bootstrap_order: order,
    steps: order.map((role) => buildSpawnDraft(provisioning, role)),
    note: 'Operator-side get started should ensure yamen-entry is available before exposing yamen-prefect to user traffic.',
  };
}

function main() {
  const manifest = buildManifest();
  process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  buildManifest,
  buildSpawnDraft,
};
