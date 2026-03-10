const fs = require("fs");
const path = require("path");

function loadTransitions(repoRoot) {
  const file = path.join(repoRoot, "contracts", "transitions.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isTerminalStatus(transitions, status) {
  return transitions.terminalStatuses.includes(status);
}

function getAllowedTransitions(transitions, currentCase) {
  return transitions.transitions.filter((item) => {
    const matchStatus = item.from === currentCase.status;
    const matchMode = !item.allowedModes || item.allowedModes.includes(currentCase.mode);
    return matchStatus && matchMode;
  });
}

function getTransitionByAction(transitions, currentCase, action) {
  return getAllowedTransitions(transitions, currentCase).find((item) => item.action === action) || null;
}

module.exports = {
  loadTransitions,
  isTerminalStatus,
  getAllowedTransitions,
  getTransitionByAction,
};
