# Host Actions

These are the minimum host-side actions the skill should conceptually perform inside OpenClaw.

This file defines the action categories. For the step-by-step operator sequence, see `operator-playbook.md`.

## Provisioning actions

1. Read repo config and role templates
2. Resolve runtime root and workspace targets
3. Ensure role workspaces exist
4. Write/refresh role runtime files
5. Inherit auth/profile locally
6. Validate post-write health
7. Return provisioning summary

## Provisioning action details

### Read repo config and role templates
Read the repo-side source of truth:
- `config/provisioning.json`
- `config/role-sessions.json`
- `docs/role-runtime-provisioning.md`
- role `SOUL.md` sources

### Resolve runtime root and workspace targets
The host must resolve:
- runtime root path
- workspace name per role
- role label / runtime / agentId / session mode

### Ensure role workspaces exist
Ensure these runtime targets exist:
- `workspace-prefect`
- `workspace-entry`
- `workspace-zhubu`
- `workspace-kuaishou`
- `workspace-dianshi`

### Write or refresh runtime files
Per workspace, materialize:
- `role.json`
- `AGENTS.md`
- `SOUL.md`
- `README.md`
- `memory/`
- `logs/`
- local-only `auth-profiles.json` when available

### Inherit auth/profile locally
Auth inheritance is a host-side runtime concern.

Rules:
- copy only into local runtime workspaces
- never treat copied auth as repo content
- if missing, report degraded or blocked honestly

### Validate post-write health
After provisioning, verify:
- role labels match config
- workspace paths exist
- required files exist
- auth status is reported honestly
- no copied auth is staged for git commit

### Return provisioning summary
Return a compact summary that can be consumed by a superior/operator and that distinguishes:
- healthy
- degraded
- blocked

## Current implementation note

Until OpenClaw-native provisioning actions replace the fallback, use repo bootstrap as the reference execution path.
