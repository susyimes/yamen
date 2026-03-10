const fs = require("fs");
const path = require("path");

function loadProvisioningConfig(repoRoot) {
  const file = path.join(repoRoot, "config", "provisioning.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function getProvisionedWorkspace(repoRoot, role) {
  const config = loadProvisioningConfig(repoRoot);
  const runtimeRoot = path.join(repoRoot, config.root || ".openclaw/yamen-runtime");
  const roleConfig = (config.roles && config.roles[role]) || null;
  if (!roleConfig) return null;
  return {
    runtimeRoot,
    workspaceName: roleConfig.workspace,
    workspacePath: path.join(runtimeRoot, roleConfig.workspace),
    files: roleConfig.files || [],
  };
}

module.exports = {
  loadProvisioningConfig,
  getProvisionedWorkspace,
};
