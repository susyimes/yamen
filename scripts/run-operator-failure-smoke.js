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

function buildOperatorFailure(currentCase, failedRole, failedStep, code, message, retryable = false, operatorActionTaken = 'stop_and_report') {
  return {
    case_id: currentCase.case_id,
    phase: failedRole === 'dianshi' ? 'review' : (failedRole === 'kuaishou' ? 'execution' : 'handoff'),
    status: 'degraded',
    active_role: failedRole === 'entry' ? 'entry' : failedRole,
    current_step: failedStep,
    mode: currentCase.mode,
    failure: {
      code,
      message,
      failed_role: failedRole,
      failed_step: failedStep,
      retryable,
      operator_action_taken: operatorActionTaken,
    },
    updated_at: nowIso(),
  };
}

function buildPrefectFailureReport(currentCase, routeTaken, summary, blockers = [], runtimeOutcome = 'failed') {
  return {
    case_id: currentCase.case_id,
    case_title: currentCase.title,
    mode: currentCase.mode,
    final_status: 'failed',
    route_taken: routeTaken,
    summary,
    reply_to_prefect: summary,
    artifacts: currentCase.artifacts || [],
    blockers,
    review_notes: [],
    runtime_outcome: runtimeOutcome,
    reported_by: 'entry',
    reported_at: nowIso(),
  };
}

function validateFailureStatus(status) {
  if (status.status !== 'degraded') throw new Error('failure status must be degraded');
  if (!status.failure || !status.failure.code) throw new Error('failure payload missing');
}

function validateFailureReport(report) {
  if (report.reported_by !== 'entry') throw new Error('failure report must be reported_by=entry');
  if (report.final_status !== 'failed') throw new Error('failure report final_status must be failed');
}

function scenarioTimeout() {
  const request = readJson('runtime/sample-request.filed.json');
  const currentCase = createCase(request);
  const transitions = loadTransitions(REPO_ROOT);
  const transition = getTransitionByAction(transitions, currentCase, 'classify_request');
  if (!transition) throw new Error('missing classify_request transition');
  buildHandoffPayload(currentCase, transition, { repoRoot: REPO_ROOT });

  const status = buildOperatorFailure(currentCase, 'zhubu', 'draft_case_note', 'role_timeout', 'zhubu timed out; operator stopped and reported');
  validateFailureStatus(status);

  const report = buildPrefectFailureReport(
    currentCase,
    ['entry', 'zhubu'],
    '案件在主簿阶段超时，已停止继续流转，请稍后重试或人工接管。',
    ['zhubu_timeout'],
    'degraded'
  );
  validateFailureReport(report);
  return { scenario: 'role-timeout', operator_status: status, prefect_report: report };
}

function scenarioInvalidJson() {
  const request = readJson('runtime/sample-request.filed.json');
  const currentCase = createCase(request);
  const status = buildOperatorFailure(currentCase, 'kuaishou', 'submit_result', 'invalid_json', 'kuaishou returned invalid JSON; operator rejected payload');
  validateFailureStatus(status);

  const report = buildPrefectFailureReport(
    currentCase,
    ['entry', 'zhubu', 'kuaishou'],
    '案件执行结果返回格式不合法，已停止收口并等待修复。',
    ['invalid_json_from_kuaishou'],
    'failed'
  );
  validateFailureReport(report);
  return { scenario: 'invalid-json', operator_status: status, prefect_report: report };
}

function scenarioNextRoleDrift() {
  const request = readJson('runtime/sample-request.reviewed.json');
  const currentCase = createCase(request);
  const status = buildOperatorFailure(currentCase, 'entry', 'intake_and_route', 'next_role_out_of_contract', 'entry returned next_role outside configured Yamen role system');
  validateFailureStatus(status);

  const report = buildPrefectFailureReport(
    currentCase,
    ['entry'],
    '案件入口路由结果不在衙门体系内，已中止流转。',
    ['next_role_out_of_contract'],
    'failed'
  );
  validateFailureReport(report);
  return { scenario: 'next-role-drift', operator_status: status, prefect_report: report };
}

function scenarioEntryClosureFail() {
  const request = readJson('runtime/sample-request.direct.json');
  const currentCase = createCase(request);
  const status = buildOperatorFailure(currentCase, 'entry', 'close_and_report', 'entry_closure_failed', 'entry could not produce a valid prefect report');
  validateFailureStatus(status);

  const report = buildPrefectFailureReport(
    currentCase,
    ['entry', 'kuaishou'],
    '案件已执行到收口阶段，但 entry 回禀生成失败，当前仅保留内部结果。',
    ['entry_closure_failed'],
    'degraded'
  );
  validateFailureReport(report);
  return { scenario: 'entry-closure-fail', operator_status: status, prefect_report: report };
}

function main() {
  const results = [
    scenarioTimeout(),
    scenarioInvalidJson(),
    scenarioNextRoleDrift(),
    scenarioEntryClosureFail(),
  ];
  process.stdout.write(JSON.stringify({ ok: true, failures: results }, null, 2) + '\n');
}

main();
