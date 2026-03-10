const path = require("path");
const fs = require("fs");

function summarizeText(text, max = 120) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 3) + "...";
}

function buildHandoffPayload(currentCase, transition, options = {}) {
  const roleSoulPath = path.join(options.repoRoot || path.resolve(__dirname, ".."), "agents", transition.by, "SOUL.md");
  const roleSoul = fs.existsSync(roleSoulPath) ? fs.readFileSync(roleSoulPath, "utf8") : "";

  return {
    protocol_version: 1,
    case_id: currentCase.case_id,
    title: currentCase.title,
    mode: currentCase.mode,
    current_status: currentCase.status,
    target_status: transition.to,
    action_requested: transition.action,
    acting_role: transition.by,
    next_role: transition.nextRole,
    risk_level: currentCase.risk_level,
    priority: currentCase.priority,
    source: currentCase.source,
    summary: currentCase.summary,
    raw_request: currentCase.raw_request,
    completed: currentCase.flow_log.map((item) => `${item.role}:${item.action}:${item.status}`),
    blockers: currentCase.blocking_issues || [],
    artifacts: currentCase.artifacts || [],
    reply_summary: currentCase.reply_summary || "",
    role_prompt: roleSoul,
    notes: {
      transition_description: transition.description,
      handoff_brief: `${transition.by} should perform ${transition.action} for case ${summarizeText(currentCase.title, 60)}`,
    },
  };
}

function buildManualHandoffText(payload) {
  return [
    `标题：${payload.title}`,
    `案件编号：${payload.case_id}`,
    `当前模式：${payload.mode}`,
    `当前状态：${payload.current_status}`,
    `主办角色：${payload.acting_role}`,
    `风险等级：${payload.risk_level}`,
    "",
    `用户诉求：${payload.summary}`,
    `已完成：${payload.completed.join("；") || "无"}`,
    `待处理：${payload.action_requested}`,
    `阻塞项：${payload.blockers.join("；") || "无"}`,
    `需要接手方执行：${payload.action_requested}`,
  ].join("\n");
}

module.exports = {
  summarizeText,
  buildHandoffPayload,
  buildManualHandoffText,
};
