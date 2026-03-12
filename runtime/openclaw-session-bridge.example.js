#!/usr/bin/env node
/**
 * Example bridge for a future OpenClaw session provider.
 *
 * Current purpose:
 * - document stdin/stdout contract for exec provider
 * - provide a concrete starting point for wiring sessions_spawn / sessions_send later
 *
 * Usage with exec provider:
 *   node runtime/openclaw-session-bridge.example.js
 */

const fs = require("fs");

function main() {
  const input = fs.readFileSync(0, "utf8");
  const payload = JSON.parse(input || "{}");
  const step = payload.step || null;

  if (step && step.step === 'ensure-role-available') {
    const result = {
      ok: true,
      ensured: step.role,
      meta: {
        bridge: 'openclaw-session-example',
        mode: 'ensure-role-available',
        tool: step.tool,
        label: step.directly_executable_args?.label || null,
      },
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  if (step && step.step === 'dispatch-request') {
    const role = payload.bundle?.role || step.role || 'unknown';
    const action = payload.bundle?.action || 'unknown_action';
    const result = {
      role,
      action,
      note: `[example-bridge] ${role} accepted ${action}`,
      completed: ["bridge_invoked", "dispatch_request_executed"],
      pending: ["replace_with_real_openclaw_session_call"],
      blockers: [],
      artifacts: [],
      reply_summary: "",
      occurred_at: new Date().toISOString(),
      meta: {
        bridge: "openclaw-session-example",
        case_id: payload.bundle?.case_id || null,
        mode: 'dispatch-request',
        tool: step.tool,
      },
    };
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  const result = {
    role: payload.acting_role,
    action: payload.action_requested,
    note: `[example-bridge] ${payload.acting_role} accepted ${payload.action_requested}`,
    completed: ["bridge_invoked"],
    pending: ["replace_with_real_openclaw_session_call"],
    blockers: [],
    artifacts: [],
    reply_summary: payload.reply_summary || "",
    occurred_at: new Date().toISOString(),
    meta: {
      bridge: "openclaw-session-example",
      case_id: payload.case_id,
    },
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main();
