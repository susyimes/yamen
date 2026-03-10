const fs = require("fs");
const path = require("path");

function loadRoleSessionsConfig(repoRoot) {
  const file = path.join(repoRoot, "config", "role-sessions.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function getRoleSessionConfig(repoRoot, role) {
  const config = loadRoleSessionsConfig(repoRoot);
  const defaults = config.defaults || {};
  const roleConfig = (config.roles && config.roles[role]) || {};
  return {
    ...defaults,
    ...roleConfig,
  };
}

module.exports = {
  loadRoleSessionsConfig,
  getRoleSessionConfig,
};
