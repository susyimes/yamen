---
name: yamen-provision
description: Provision Yamen role runtime environments inside OpenClaw. Use when OpenClaw needs to create or refresh the internal Yamen workspaces/sessions for entry, zhubu, kuaishou, and dianshi; attach role metadata; prepare auth/profile inheritance; and align runtime labels/workspaces with Yamen config. This skill is for OpenClaw-side provisioning, not for running case logic.
---

# Yamen Provision

Provision Yamen as an **internal OpenClaw work mode**, not as a standalone repo runtime.

## Goal

Create or refresh the role runtime environments that OpenClaw will use to run Yamen internally:

- `yamen-entry`
- `yamen-zhubu`
- `yamen-kuaishou`
- `yamen-dianshi`

The source of truth for rules stays in the Yamen repo:
- `config/provisioning.json`
- `config/role-sessions.json`
- `agents/*/SOUL.md`
- `contracts/*`

## Core workflow

Before provisioning, read:
- `references/provisioning-checklist.md`
- `references/workspace-contract.md`
- `references/execution-flow.md`
- `references/auth-inheritance.md`
- `references/failure-handling.md`
- `references/provisioning-summary-contract.md`
- `references/minimal-test.md`
- `references/host-actions.md`

Then:
1. validate prerequisites
2. create/refresh role workspaces
3. inherit auth/profile
4. bind role identity and labels
5. return compact provisioning summary

## Inputs

Read these first:
- `config/provisioning.json`
- `config/role-sessions.json`
- `docs/role-runtime-provisioning.md`
- `references/provisioning-checklist.md`
- `references/workspace-contract.md`

Read role-specific SOUL when generating a workspace:
- `agents/zhubu/SOUL.md`
- `agents/kuaishou/SOUL.md`
- `agents/dianshi/SOUL.md`
- for entry, use the merged entry definition from provisioning docs/config

## Do

- Provision or refresh `entry / zhubu / kuaishou / dianshi`
- Keep labels stable
- Copy auth locally only
- Report degraded or partial states honestly
- Validate the result against `references/minimal-test.md`

## Do not

- Do not execute case flow here.
- Do not decide direct/filed/reviewed here.
- Do not replace the Yamen contracts/config as source of truth.
- Do not commit copied auth files into git.

## Output

Return a compact provisioning summary using the contract in:
- `references/provisioning-summary-contract.md`

See example shape:
- `references/summary-example.json`

## Implementation note

Treat repo `scripts/bootstrap-yamen-runtime.ps1` as a **reference implementation / fallback**, not as the final source of control. See `scripts/reference-bootstrap.ps1` for the handoff note. The target architecture is OpenClaw-native provisioning.
