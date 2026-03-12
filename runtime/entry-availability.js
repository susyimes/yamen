const path = require('path');
const { loadProvisioningConfig, getProvisionedWorkspace } = require('./provisioning-config');

function buildEnsureRoleAvailable(repoRoot, role) {
  const provisioning = loadProvisioningConfig(repoRoot);
  const roleConfig = provisioning[role];
  if (!roleConfig) {
    throw new Error(`Missing provisioning config for role '${role}'`);
  }

  const workspace = getProvisionedWorkspace(repoRoot, role);
  const usePersistent = roleConfig.sessionMode === 'session';

  return {
    role,
    label: roleConfig.sessionLabel,
    guarantee: role === 'entry'
      ? 'ensure_entry_available_before_prefect_dispatch'
      : 'ensure_role_available',
    tool: 'sessions_spawn',
    directly_executable_args: {
      runtime: roleConfig.runtime,
      agentId: roleConfig.agentId,
      label: roleConfig.sessionLabel,
      mode: usePersistent ? 'session' : 'run',
      thread: usePersistent,
      cleanup: 'keep',
      sandbox: 'inherit',
      cwd: workspace ? workspace.workspacePath : path.resolve(repoRoot),
      task: role === 'entry'
        ? 'Start as yamen-entry (merged menfang+xianling). Accept handoff from yamen-prefect, handle triage/select_mode/merge_results, introduce yourself briefly, then wait for further instructions.'
        : `Start as ${role}. Introduce yourself briefly, then wait for further instructions.`,
      timeoutSeconds: 60,
    },
  };
}

function buildEnsureEntryAvailable(repoRoot) {
  return buildEnsureRoleAvailable(repoRoot, 'entry');
}

module.exports = {
  buildEnsureRoleAvailable,
  buildEnsureEntryAvailable,
};
