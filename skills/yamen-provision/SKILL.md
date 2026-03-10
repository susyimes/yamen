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

## Do

1. Read provisioning and role-session config from the repo.
2. Read `references/provisioning-checklist.md` before creating or refreshing workspaces.
3. Create/refresh provisioned workspaces for:
   - entry
   - zhubu
   - kuaishou
   - dianshi
4. Write minimal role runtime files:
   - `role.json`
   - `AGENTS.md`
   - `SOUL.md`
   - `README.md`
5. Inherit auth/profile from the main OpenClaw agent/runtime.
6. Preserve labels and role identity:
   - `yamen-entry`
   - `yamen-zhubu`
   - `yamen-kuaishou`
   - `yamen-dianshi`

## Do not

- Do not execute case flow here.
- Do not decide direct/filed/reviewed here.
- Do not replace the Yamen contracts/config as source of truth.
- Do not commit copied auth files into git.

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

## Output

Return a compact provisioning summary:
- created / refreshed workspaces
- labels bound
- auth inheritance status
- missing prerequisites

## Implementation note

Treat repo `scripts/bootstrap-yamen-runtime.ps1` as a **reference implementation / fallback**, not as the final source of control. See `scripts/reference-bootstrap.ps1` for the handoff note. The target architecture is OpenClaw-native provisioning.
