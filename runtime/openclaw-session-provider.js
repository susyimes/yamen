const fs = require("fs");
const path = require("path");
const { buildManualHandoffText } = require("./handoff");
const { buildBridgeBaseName } = require("./path-utils");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSessionEnvelope(payload, providerConfig, transition) {
  return {
    protocol: "yamen.openclaw-session.v1",
    delivery: "openclaw-bridge",
    role: payload.acting_role,
    session: {
      mode: providerConfig.sessionMode || "spawn",
      label: providerConfig.sessionLabelPrefix ? `${providerConfig.sessionLabelPrefix}-${payload.acting_role}` : `yamen-${payload.acting_role}`,
      runtime: providerConfig.runtime || "subagent",
      agentId: providerConfig.agentId || null,
      timeoutMs: providerConfig.timeoutMs || 60000,
    },
    transition: {
      from: payload.current_status,
      action: payload.action_requested,
      to: transition.to,
      next_role: payload.next_role,
    },
    payload,
    prompt: buildOpenClawSessionPrompt(payload),
    manual_text: buildManualHandoffText(payload),
    response_contract: {
      mustReturnJson: true,
      requiredFields: ["role", "action", "note", "completed", "pending", "blockers", "artifacts", "reply_summary", "occurred_at"],
    },
  };
}

function buildOpenClawSessionPrompt(payload) {
  return [
    `你现在扮演 Yamen 角色：${payload.acting_role}`,
    `请只处理当前动作：${payload.action_requested}`,
    `案件编号：${payload.case_id}`,
    `当前状态：${payload.current_status}`,
    `目标状态：${payload.target_status}`,
    `任务摘要：${payload.summary}`,
    "",
    "请基于下方案件 payload 执行，并只输出 JSON 对象，不要输出解释文字。",
    "返回字段必须包含：role, action, note, completed, pending, blockers, artifacts, reply_summary, occurred_at",
    "如果信息不足，可在 pending/blockers 中体现，但仍需返回合法 JSON。",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

async function runOpenClawSessionProvider(providerConfig, payload, currentCase, transition, options = {}) {
  const repoRoot = options.repoRoot || path.resolve(__dirname, "..");
  const requestDir = path.join(repoRoot, providerConfig.requestDir || "runtime/bridge/openclaw-session/requests");
  const responseDir = path.join(repoRoot, providerConfig.responseDir || "runtime/bridge/openclaw-session/responses");
  ensureDir(requestDir);
  ensureDir(responseDir);

  const basename = buildBridgeBaseName(currentCase.case_id, transition.action, payload.acting_role);
  const requestFile = path.join(requestDir, `${basename}.request.json`);
  const responseFile = path.join(responseDir, `${basename}.response.json`);

  const envelope = {
    ...buildSessionEnvelope(payload, providerConfig, transition),
    bridge: {
      basename,
      request_file: path.basename(requestFile),
      response_file: path.basename(responseFile),
      case_id: currentCase.case_id,
    },
  };
  fs.writeFileSync(requestFile, JSON.stringify(envelope, null, 2) + "\n", "utf8");

  const timeoutMs = providerConfig.timeoutMs || 60000;
  const pollIntervalMs = providerConfig.pollIntervalMs || 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(responseFile)) {
      return JSON.parse(fs.readFileSync(responseFile, "utf8"));
    }
    await sleepMs(pollIntervalMs);
  }

  throw new Error(`openclaw-session provider timed out waiting for ${path.relative(repoRoot, responseFile)}`);
}

module.exports = {
  buildOpenClawSessionPrompt,
  buildSessionEnvelope,
  runOpenClawSessionProvider,
};
