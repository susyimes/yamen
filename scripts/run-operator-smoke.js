#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createCase } = require('../runtime/orchestrator');
const { loadTransitions, getTransitionByAction } = require('../runtime/transition-engine');
const { buildHandoffPayload } = require('../runtime/handoff');

const REPO_ROOT = path.resolve(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'));
}

function nowIso() {
  return new Date().toISOString();
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function buildRoleResult(currentCase, transition) {
  const base = {
    role: transition.by,
    action: transition.action,
    note: `${transition.by} handled ${transition.action}`,
    completed: [],
    pending: [],
    blockers: [],
    artifacts: [],
    reply_summary: currentCase.reply_summary || '',
    occurred_at: nowIso(),
  };

  switch (transition.action) {
    case 'classify_request':
      return {
        ...base,
        completed: ['request_cleaned', 'mode_suggested'],
        reply_summary: `已受理：${currentCase.title}`,
      };
    case 'route_direct':
    case 'open_filed_case':
    case 'reassign_case':
    case 'resume_direct_execution':
    case 'resume_filed_execution':
      return {
        ...base,
        completed: ['routing_decided'],
      };
    case 'draft_case_note':
      return {
        ...base,
        completed: ['case_note_ready'],
        artifacts: [
          {
            id: `${currentCase.case_id}-${transition.action}`,
            type: 'document',
            summary: `Draft note for ${currentCase.case_id}`,
            created_by: transition.by,
          },
        ],
      };
    case 'execute_task':
      return {
        ...base,
        completed: ['execution_started'],
      };
    case 'submit_result':
      return {
        ...base,
        completed: ['result_submitted'],
        artifacts: [
          {
            id: `${currentCase.case_id}-${transition.action}`,
            type: 'result',
            summary: `Result for ${currentCase.case_id}`,
            created_by: transition.by,
          },
        ],
        reply_summary: `案件 ${currentCase.case_id} 已完成主要处理。`,
      };
    case 'submit_for_review':
      return {
        ...base,
        completed: ['submitted_for_review'],
        artifacts: [
          {
            id: `${currentCase.case_id}-${transition.action}`,
            type: 'result',
            summary: `Review package for ${currentCase.case_id}`,
            created_by: transition.by,
          },
        ],
      };
    case 'approve_result':
      return {
        ...base,
        completed: ['risk_review_passed'],
        reply_summary: `案件 ${currentCase.case_id} 已复核通过。`,
      };
    default:
      return base;
  }
}

function validateRoleResultShape(result) {
  const required = ['role', 'action', 'note', 'completed', 'pending', 'blockers', 'artifacts', 'reply_summary', 'occurred_at'];
  for (const key of required) {
    if (!(key in result)) throw new Error(`role result missing field: ${key}`);
  }
  if (!Array.isArray(result.completed) || !Array.isArray(result.pending) || !Array.isArray(result.blockers) || !Array.isArray(result.artifacts)) {
    throw new Error('role result arrays are invalid');
  }
}

function validateEntryOutput(entryOutput, request) {
  const allowedModes = ['direct', 'filed', 'reviewed'];
  const allowedRoles = ['entry', 'zhubu', 'kuaishou', 'dianshi'];
  if (entryOutput.role !== 'entry') throw new Error('entry output role must be entry');
  if (entryOutput.action !== 'intake_and_route') throw new Error('entry output action must be intake_and_route');
  if (!allowedModes.includes(entryOutput.suggested_mode)) throw new Error('entry output suggested_mode invalid');
  if (!allowedRoles.includes(entryOutput.next_role)) throw new Error('entry output next_role invalid');
  if (entryOutput.suggested_mode !== request.mode) throw new Error(`entry output mode mismatch: expected ${request.mode}`);
}

function validateOperatorStatus(status) {
  const phases = ['intake', 'routing', 'handoff', 'execution', 'review', 'closure'];
  const statuses = ['running', 'waiting', 'completed', 'degraded', 'failed'];
  if (!phases.includes(status.phase)) throw new Error(`invalid operator phase ${status.phase}`);
  if (!statuses.includes(status.status)) throw new Error(`invalid operator status ${status.status}`);
}

function validatePrefectReport(report, route, finalStatus) {
  if (report.reported_by !== 'entry') throw new Error('prefect report must be reported_by=entry');
  if (report.final_status !== finalStatus) throw new Error(`prefect report final_status mismatch: ${report.final_status}`);
  if (JSON.stringify(report.route_taken) !== JSON.stringify(route)) throw new Error('prefect report route_taken mismatch');
}

function applyStep(currentCase, transition, roleResult) {
  currentCase.status = transition.to;
  currentCase.current_role = transition.nextRole;
  currentCase.updated_at = roleResult.occurred_at;
  currentCase.blocking_issues = ensureArray(roleResult.blockers);
  currentCase.artifacts.push(...ensureArray(roleResult.artifacts));
  if (roleResult.reply_summary) currentCase.reply_summary = roleResult.reply_summary;
  currentCase.flow_log.push({
    at: roleResult.occurred_at,
    role: transition.by,
    action: transition.action,
    status: transition.to,
    note: roleResult.note,
    next_role: transition.nextRole,
  });
}

function buildEntryOutput(currentCase, request) {
  const nextRole = request.mode === 'direct' ? 'kuaishou' : 'zhubu';
  return {
    role: 'entry',
    action: 'intake_and_route',
    case_title: currentCase.title,
    summary: currentCase.summary,
    suggested_mode: request.mode,
    accept: true,
    next_role: nextRole,
    note: `案件已收案并按 ${request.mode} 路径流转。`,
    priority: currentCase.priority,
    risk_level: currentCase.risk_level,
    occurred_at: nowIso(),
  };
}

function buildOperatorStatus(currentCase, phase, status, activeRole, currentStep, extra = {}) {
  const payload = {
    case_id: currentCase.case_id,
    phase,
    status,
    active_role: activeRole,
    current_step: currentStep,
    mode: currentCase.mode,
    updated_at: nowIso(),
    ...extra,
  };
  validateOperatorStatus(payload);
  return payload;
}

function pushRoute(routeTaken, role) {
  if (!routeTaken.includes(role)) routeTaken.push(role);
}

function buildPrefectReport(currentCase, routeTaken, runtimeOutcome = 'normal') {
  const terminal = currentCase.status === 'done' ? 'done' : currentCase.status === 'cancelled' ? 'cancelled' : 'failed';
  return {
    case_id: currentCase.case_id,
    case_title: currentCase.title,
    mode: currentCase.mode,
    final_status: terminal,
    route_taken: routeTaken,
    summary: currentCase.summary,
    reply_to_prefect: currentCase.reply_summary || `案件 ${currentCase.case_id} 已处理。`,
    artifacts: currentCase.artifacts,
    blockers: currentCase.blocking_issues || [],
    review_notes: routeTaken.includes('dianshi') ? ['典史已复核'] : [],
    runtime_outcome: runtimeOutcome,
    reported_by: 'entry',
    reported_at: nowIso(),
  };
}

function runScenario(name, requestPath, actions) {
  const transitions = loadTransitions(REPO_ROOT);
  const request = readJson(requestPath);
  const currentCase = createCase(request);
  const routeTaken = ['entry'];
  const operatorStates = [];
  const handoffs = [];

  const entryOutput = buildEntryOutput(currentCase, request);
  validateEntryOutput(entryOutput, request);
  operatorStates.push(buildOperatorStatus(currentCase, 'intake', 'completed', 'entry', 'intake_and_route'));

  for (const action of actions) {
    const transition = getTransitionByAction(transitions, currentCase, action);
    if (!transition) throw new Error(`transition not allowed: ${action} @ ${currentCase.status}/${currentCase.mode}`);

    const handoff = buildHandoffPayload(currentCase, transition, { repoRoot: REPO_ROOT });
    if (!handoff.case_id || handoff.action_requested !== action) throw new Error('handoff payload invalid');
    handoffs.push(handoff);

    const phase = transition.by === 'dianshi' ? 'review' : (transition.by === 'kuaishou' ? 'execution' : 'handoff');
    operatorStates.push(buildOperatorStatus(currentCase, phase, 'running', transition.by === 'xianling' || transition.by === 'menfang' ? 'entry' : transition.by, action, {
      waiting_on: ['zhubu', 'kuaishou', 'dianshi'].includes(transition.by) ? transition.by : undefined,
      last_transition: {
        from_status: currentCase.status,
        action: transition.action,
        to_status: transition.to,
        next_role: ['entry', 'zhubu', 'kuaishou', 'dianshi'].includes(transition.nextRole) ? transition.nextRole : undefined,
      },
    }));

    const roleResult = buildRoleResult(currentCase, transition);
    validateRoleResultShape(roleResult);
    applyStep(currentCase, transition, roleResult);
    if (['zhubu', 'kuaishou', 'dianshi'].includes(transition.by)) pushRoute(routeTaken, transition.by);
  }

  operatorStates.push(buildOperatorStatus(currentCase, 'closure', 'completed', 'entry', 'close_and_report'));
  const report = buildPrefectReport(currentCase, routeTaken);
  validatePrefectReport(report, routeTaken, 'done');

  return {
    scenario: name,
    case_id: currentCase.case_id,
    mode: currentCase.mode,
    final_status: currentCase.status,
    route_taken: routeTaken,
    entry_output: entryOutput,
    operator_statuses: operatorStates,
    handoff_count: handoffs.length,
    prefect_report: report,
  };
}

function main() {
  const results = [
    runScenario('direct', 'runtime/sample-request.direct.json', ['classify_request', 'route_direct', 'submit_result']),
    runScenario('filed', 'runtime/sample-request.filed.json', ['classify_request', 'open_filed_case', 'draft_case_note', 'execute_task', 'submit_result']),
    runScenario('reviewed', 'runtime/sample-request.reviewed.json', ['classify_request', 'open_filed_case', 'draft_case_note', 'execute_task', 'submit_for_review', 'approve_result']),
  ];

  process.stdout.write(JSON.stringify({ ok: true, scenarios: results }, null, 2) + '\n');
}

main();
