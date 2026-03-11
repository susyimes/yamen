# Operator Playbook

This is the operator-facing playbook for running `yamen-provision` inside OpenClaw.

It is intentionally written as a host-side checklist instead of a repo bootstrap script so the future OpenClaw-native implementation has an explicit action sequence to follow.

## When to use

Use this playbook when one of the following is true:
- Yamen is being provisioned for the first time
- role workspaces were deleted or drifted
- labels/runtime metadata changed in `config/provisioning.json` or `config/role-sessions.json`
- auth source moved and role workspaces need to be refreshed
- the operator needs to verify whether Yamen is runnable or only partially provisioned

## Inputs to read first

Minimum required inputs:
- `config/provisioning.json`
- `config/role-sessions.json`
- `docs/role-runtime-provisioning.md`
- `references/provisioning-checklist.md`
- `references/workspace-contract.md`
- `references/provisioning-summary-contract.md`

Role text sources:
- `agents/zhubu/SOUL.md`
- `agents/kuaishou/SOUL.md`
- `agents/dianshi/SOUL.md`
- entry uses the merged role definition from provisioning docs/config

## Host-side action sequence

### 1. Resolve runtime target

Determine:
- repo root
- runtime root
- expected workspace names
- expected labels / runtime / agentId / session mode

Expected runtime tree:
- `workspace-prefect`
- `workspace-entry`
- `workspace-zhubu`
- `workspace-kuaishou`
- `workspace-dianshi`

### 2. Validate prerequisites

Check before writing:
- provisioning config parses
- role session config parses
- runtime root is writable
- auth source exists, or degraded mode is explicitly allowed

If auth source is missing:
- continue only as degraded/partial provisioning
- do not report the result as fully runnable
- create placeholders only when explicitly requested

### 3. Materialize each workspace

For every role workspace:
- ensure workspace directory exists
- ensure `memory/` exists
- ensure `logs/` exists
- write or refresh `role.json`
- write or refresh `AGENTS.md`
- write or refresh `SOUL.md`
- write or refresh `README.md`
- copy local-only `auth-profiles.json` when available

### 4. Bind runtime identity

Verify each workspace is aligned to the config source of truth:
- role id
- session label
- runtime
- agentId
- sessionMode
- spawnMode
- purpose
- managedBy

### 5. Post-write validation

After writing files, verify:
- all expected workspace paths exist
- each workspace contains the required files
- labels match the configured labels
- auth status is explicitly known per workspace
- copied auth files are local-only and ignored by git

### 6. Return provisioning summary

Return a compact summary using the provisioning summary contract.

The summary must tell the truth about:
- what was refreshed
- whether auth was copied
- whether the environment is runnable, degraded, or blocked
- what the operator should do next

## Recommended result states

### healthy
Use when:
- config parsed
- all expected workspaces exist
- required files are present
- auth source was copied successfully

### degraded
Use when:
- workspaces were created
- but auth is missing, placeholder-only, or some runtime binding is incomplete

### blocked
Use when:
- config is invalid
- runtime root cannot be written
- required role metadata cannot be resolved

## Fallback implementation

Until OpenClaw-native provisioning fully replaces scripts, the current fallback is:

```powershell
pwsh -File scripts/bootstrap-yamen-runtime.ps1
```

Treat the script as a reference executor, not as the long-term architecture.

## Minimum acceptance check

A provision run is minimally acceptable when:
- the four internal role workspaces (`entry`, `zhubu`, `kuaishou`, `dianshi`) exist
- `prefect` workspace exists for user-facing superior flow
- required files are present
- auth status is honestly reported
- a compact provisioning summary is returned
