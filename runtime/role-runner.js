function summarizeText(text, max = 120) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max - 3) + "...";
}

function buildFlowNote(role, action, currentCase) {
  const title = currentCase.title || currentCase.summary;
  return `${role} executed ${action} for ${summarizeText(title, 60)}`;
}

function runRoleAction(currentCase, transition, options = {}) {
  const now = options.now || new Date().toISOString();
  const artifactId = `${currentCase.case_id}-${transition.action}`;

  const baseResult = {
    role: transition.by,
    action: transition.action,
    note: buildFlowNote(transition.by, transition.action, currentCase),
    completed: [],
    pending: [],
    blockers: [],
    artifacts: [],
    reply_summary: currentCase.reply_summary || "",
    occurred_at: now,
  };

  switch (transition.action) {
    case "classify_request":
      return {
        ...baseResult,
        completed: ["request_cleaned", "title_generated", "mode_suggested"],
        reply_summary: `已受理：${currentCase.title}`,
      };
    case "route_direct":
    case "open_filed_case":
    case "reassign_case":
    case "resume_direct_execution":
    case "resume_filed_execution":
      return {
        ...baseResult,
        completed: ["routing_decided"],
      };
    case "draft_case_note":
      return {
        ...baseResult,
        completed: ["case_note_ready", "deliverables_defined"],
        artifacts: [
          {
            id: artifactId,
            type: "document",
            summary: `Task note drafted for ${currentCase.case_id}`,
            created_by: transition.by,
          },
        ],
      };
    case "request_missing_info":
      return {
        ...baseResult,
        pending: ["more_input_required"],
        blockers: ["missing_information"],
      };
    case "execute_task":
      return {
        ...baseResult,
        completed: ["execution_started"],
      };
    case "submit_result":
    case "submit_for_review":
      return {
        ...baseResult,
        completed: ["result_submitted"],
        artifacts: [
          {
            id: artifactId,
            type: "result",
            summary: `Execution result submitted for ${currentCase.case_id}`,
            created_by: transition.by,
          },
        ],
        reply_summary: `案件 ${currentCase.case_id} 已完成主要处理。`,
      };
    case "approve_result":
      return {
        ...baseResult,
        completed: ["risk_review_passed"],
        reply_summary: `案件 ${currentCase.case_id} 已复核通过。`,
      };
    case "reject_result":
    case "report_blocker":
      return {
        ...baseResult,
        blockers: [transition.action === "reject_result" ? "review_rejected" : "execution_blocked"],
      };
    case "reject_case":
    case "cancel_case":
      return {
        ...baseResult,
        completed: ["case_terminated"],
        reply_summary: `案件 ${currentCase.case_id} 已终止。`,
      };
    default:
      return baseResult;
  }
}

module.exports = {
  runRoleAction,
};
