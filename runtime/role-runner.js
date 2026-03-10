const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildHandoffPayload, buildManualHandoffText, summarizeText } = require("./handoff");
const { runOpenClawSessionProvider } = require("./openclaw-session-provider");

function nowIso() {
  return new Date().toISOString();
}

function loadRunnerConfig(repoRoot) {
  const file = path.join(repoRoot, "config", "role-runners.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildFlowNote(role, action, currentCase) {
  const title = currentCase.title || currentCase.summary;
  return `${role} executed ${action} for ${summarizeText(title, 60)}`;
}

function normalizeRoleResult(currentCase, transition, roleResult, options = {}) {
  const now = options.now || nowIso();
  return {
    role: roleResult.role || transition.by,
    action: roleResult.action || transition.action,
    note: roleResult.note || buildFlowNote(transition.by, transition.action, currentCase),
    completed: Array.isArray(roleResult.completed) ? roleResult.completed : [],
    pending: Array.isArray(roleResult.pending) ? roleResult.pending : [],
    blockers: Array.isArray(roleResult.blockers) ? roleResult.blockers : [],
    artifacts: Array.isArray(roleResult.artifacts) ? roleResult.artifacts : [],
    reply_summary: typeof roleResult.reply_summary === "string" ? roleResult.reply_summary : currentCase.reply_summary || "",
    occurred_at: roleResult.occurred_at || now,
    meta: roleResult.meta || {},
  };
}

function runStubProvider(currentCase, transition, options = {}) {
  const now = options.now || nowIso();
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
    meta: { provider: "stub" },
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

function runExecProvider(providerConfig, payload, currentCase, transition, options = {}) {
  if (!providerConfig.command) {
    throw new Error(`exec provider for role '${transition.by}' is missing command`);
  }

  const result = spawnSync(providerConfig.command, {
    input: JSON.stringify(payload, null, 2),
    shell: true,
    encoding: "utf8",
    timeout: providerConfig.timeoutMs || 30000,
    cwd: options.repoRoot,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`exec provider failed for role '${transition.by}': ${result.stderr || result.stdout}`.trim());
  }

  const parsed = JSON.parse(result.stdout || "{}");
  return normalizeRoleResult(currentCase, transition, {
    ...parsed,
    meta: {
      provider: "exec",
      command: providerConfig.command,
    },
  }, options);
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFileProvider(providerConfig, payload, currentCase, transition, options = {}) {
  const requestDir = path.join(options.repoRoot, providerConfig.requestDir || "runtime/bridge/requests");
  const responseDir = path.join(options.repoRoot, providerConfig.responseDir || "runtime/bridge/responses");
  ensureDir(requestDir);
  ensureDir(responseDir);

  const requestFile = path.join(requestDir, `${currentCase.case_id}__${transition.action}.request.json`);
  const responseFile = path.join(responseDir, `${currentCase.case_id}__${transition.action}.response.json`);

  fs.writeFileSync(requestFile, JSON.stringify({ payload, manual_text: buildManualHandoffText(payload) }, null, 2) + "\n", "utf8");

  const timeoutMs = providerConfig.timeoutMs || 1000;
  const pollIntervalMs = providerConfig.pollIntervalMs || 100;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(responseFile)) {
      const parsed = JSON.parse(fs.readFileSync(responseFile, "utf8"));
      return normalizeRoleResult(currentCase, transition, {
        ...parsed,
        meta: {
          provider: "file",
          request_file: path.relative(options.repoRoot, requestFile),
          response_file: path.relative(options.repoRoot, responseFile),
        },
      }, options);
    }
    await sleepMs(pollIntervalMs);
  }

  throw new Error(`file provider timed out waiting for ${path.relative(options.repoRoot, responseFile)}`);
}

async function runRoleAction(currentCase, transition, options = {}) {
  const repoRoot = options.repoRoot || path.resolve(__dirname, "..");
  const config = loadRunnerConfig(repoRoot);
  const roleConfig = config.roles[transition.by] || {};
  const providerName = roleConfig.provider || config.defaultProvider || "stub";
  const providerConfig = config.providers[providerName];

  if (!providerConfig) {
    throw new Error(`unknown provider '${providerName}' for role '${transition.by}'`);
  }

  const payload = buildHandoffPayload(currentCase, transition, { repoRoot });

  if (providerConfig.kind === "stub") {
    return normalizeRoleResult(currentCase, transition, runStubProvider(currentCase, transition, options), options);
  }

  if (providerConfig.kind === "exec") {
    return runExecProvider(providerConfig, payload, currentCase, transition, { ...options, repoRoot });
  }

  if (providerConfig.kind === "file") {
    return runFileProvider(providerConfig, payload, currentCase, transition, { ...options, repoRoot });
  }

  if (providerConfig.kind === "openclaw-session") {
    const result = await runOpenClawSessionProvider(providerConfig, payload, currentCase, transition, { ...options, repoRoot });
    return normalizeRoleResult(currentCase, transition, {
      ...result,
      meta: {
        provider: "openclaw-session",
        ...(result.meta || {}),
      },
    }, options);
  }

  throw new Error(`unsupported provider kind '${providerConfig.kind}'`);
}

module.exports = {
  loadRunnerConfig,
  runRoleAction,
};
