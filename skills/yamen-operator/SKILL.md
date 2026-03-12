---
name: yamen-operator
description: Run Yamen as an internal OpenClaw work mode. Use when a visible `yamen-prefect` session wants to submit a task into Yamen, have yamen-entry intake and route it, invoke zhubu/kuaishou/dianshi as needed through OpenClaw sessions, and return a unified report back to `yamen-prefect`. This skill executes case logic using Yamen contracts/config as the rule layer.
---

# Yamen Operator

Run Yamen **inside OpenClaw**.

## Role of this skill

This skill is the runtime operator that connects:

- `yamen-prefect`
- `yamen-entry`
- `yamen-zhubu`
- `yamen-kuaishou`
- `yamen-dianshi`

The Yamen repo provides the rule layer. This skill provides the OpenClaw-native execution layer.

## Core model

- `yamen-prefect` = OpenClaw-standard visible superior agent
- `yamen-entry` = merged menfang + xianling
- `zhubu / kuaishou / dianshi` = internal role sessions

## Runtime modes

Yamen keeps its role model stable, but the operator may drive different runtime modes:

- `triage` = intake, classify, accept/reject, choose the case route
- `plan` = structure the case, clarify boundaries, produce execution notes
- `execute` = perform the actual work
- `debug` = inspect flow, state, contract mismatches, and failure points
- `review` = risk gate, release decision, and final quality check

Mapping guidance:
- `yamen-entry` mainly handles `triage`
- `zhubu` mainly handles `plan`
- `kuaishou` mainly handles `execute`
- `dianshi` mainly handles `debug` and `review`

These are runtime capabilities, not excuses to invent new permanent roles.

## Required rule sources

Read core contracts/config as needed:
- `contracts/case.schema.json`
- `contracts/transitions.json`
- `contracts/handoff.md`
- `contracts/entry-output.schema.json`
- `contracts/operator-status.schema.json`
- `contracts/prefect-report.schema.json`
- `config/runtime-map.json`
- `config/role-sessions.json`
- `docs/openclaw-integration-plan.md`

Read operator references before driving a real flow:
- `references/execution-flow.md`
- `references/failure-handling.md`
- `references/summary-report-contract.md`
- `references/minimal-test.md`
- `references/host-actions.md`
- `references/session-payloads.md`
- `references/bridge-driver.md`

Use local verification scripts when iterating:
- `scripts/run-operator-smoke.js`
- `scripts/run-operator-failure-smoke.js`

## Main workflow

1. Receive a prefect task.
2. Run `triage` through `yamen-entry`.
3. Create or update a case using Yamen contracts.
4. Based on mode and next role:
   - direct -> `execute` by `kuaishou`
   - filed -> `plan` by `zhubu` -> `execute` by `kuaishou`
   - reviewed -> `plan` by `zhubu` -> `execute` by `kuaishou` -> `review` by `dianshi`
5. If something drifts or breaks, route into `debug` using `dianshi`.
6. Return results to `yamen-entry` for unified closure/report.
7. Reply to prefect with the entry report.

## Execution position rules

### kuaishou = delegated execution seat

`kuaishou` is the primary execution position.

It may run in any of these forms:
- single-session execution
- delegated sub-agent execution
- parallel delegated execution when the task is splittable and mergeable

Operator rule:
- keep the execution seat named `kuaishou`
- allow runtime delegation behind that seat
- do not expose every worker as a new constitutional Yamen role

### dianshi = debug/review seat

`dianshi` is the main holder of:
- `debug` mode: inspect handoff chain, case state, contract mismatches, repeated failures, and closure drift
- `review` mode: risk control, release decision, reject/return, final gatekeeping

`dianshi` should not become the default main executor.

## OpenClaw execution responsibilities

Use OpenClaw-native session tools to:
- create/reuse role sessions
- send prompts/contracts to the right role
- validate returned JSON shape
- continue the next handoff
- emit operator runtime status snapshots
- send the final closure back through `yamen-entry`
- trigger `debug` mode when runtime conditions require diagnosis instead of blind retry

## Debug trigger rules

Enter `debug` mode when any of these happens:
- output does not satisfy the required schema
- two consecutive step failures occur in the same case
- role conflict or illegal `next_role` appears
- the case cannot be cleanly closed through `yamen-entry`
- the user explicitly says the current diagnosis/result is wrong and asks for re-location of the problem

In `debug` mode, prefer diagnosis and evidence gathering over continued execution.

## Do

- Keep Yamen role boundaries strict.
- Reuse provisioned workspaces/labels when available.
- Use `yamen-entry` as the only external-facing Yamen mouthpiece.
- Return structured case/report information.
- Treat `mode` as runtime behavior layered on top of stable roles.

## Do not

- Do not let prefect/main session directly impersonate internal Yamen roles.
- Do not bypass `yamen-entry` for external reporting.
- Do not invent roles outside configured Yamen roles.
- Do not turn every failure into more execution before checking whether `debug` mode is required.

## Transitional note

Repo files under `runtime/` are now reference/prototype helpers. Prefer OpenClaw-internal execution through this skill as the long-term path.
