---
name: yamen-operator
description: Run Yamen as an internal OpenClaw work mode. Use when a prefect/main session wants to submit a task into Yamen, have yamen-entry intake and route it, invoke zhubu/kuaishou/dianshi as needed through OpenClaw sessions, and return a unified report back to the prefect. This skill executes case logic using Yamen contracts/config as the rule layer.
---

# Yamen Operator

Run Yamen **inside OpenClaw**.

## Role of this skill

This skill is the runtime operator that connects:

- prefect/main session
- `yamen-entry`
- `yamen-zhubu`
- `yamen-kuaishou`
- `yamen-dianshi`

The Yamen repo provides the rule layer. This skill provides the OpenClaw-native execution layer.

## Core model

- prefect/main session = external superior
- `yamen-entry` = merged menfang + xianling
- `zhubu / kuaishou / dianshi` = internal role sessions

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
2. Create or update a case using Yamen contracts.
3. Hand off to `yamen-entry` for intake and routing.
4. Based on mode and next role:
   - direct -> kuaishou
   - filed -> zhubu -> kuaishou
   - reviewed -> zhubu -> kuaishou -> dianshi
5. Return results to `yamen-entry` for unified closure/report.
6. Reply to prefect with the entry report.

## OpenClaw execution responsibilities

Use OpenClaw-native session tools to:
- create/reuse role sessions
- send prompts/contracts to the right role
- validate returned JSON shape
- continue the next handoff
- emit operator runtime status snapshots
- send the final closure back through `yamen-entry`

## Do

- Keep Yamen role boundaries strict.
- Reuse provisioned workspaces/labels when available.
- Use `yamen-entry` as the only external-facing Yamen mouthpiece.
- Return structured case/report information.

## Do not

- Do not let prefect/main session directly impersonate internal Yamen roles.
- Do not bypass `yamen-entry` for external reporting.
- Do not invent roles outside configured Yamen roles.

## Transitional note

Repo files under `runtime/` are now reference/prototype helpers. Prefer OpenClaw-internal execution through this skill as the long-term path.
