# Host Actions

Use this file as the execution policy for OpenClaw session tool actions.

## Required actions

These are core runtime actions, not optional niceties.

### 1. Resolve role runtime target

Required reads:
- `config/role-sessions.json`
- `config/runtime-map.json`

Purpose:
- decide whether the role should be sent to an existing session or a fresh spawn

### 2. Create or reuse role session

Required tools:
- `sessions_list` when reuse matters
- `sessions_spawn` when a role session must be created
- `sessions_send` when a persistent role session already exists

### 3. Validate role output

Required action:
- validate JSON against the expected schema/contract before advancing the case

### 4. Persist case and runtime state

Required action:
- update the case record and operator status after every accepted step

## Optional actions

Use only when helpful:
- extra progress notifications to prefect during long runs
- workspace refresh before a role run when provisioning drift is suspected
- one safe retry for timeout/schema repair

## Failure fallback actions

These become mandatory on failure:
- stop further transitions
- capture failure details in operator status
- route back to `yamen-entry` for closure when possible
- otherwise return degraded status directly to prefect

## Do not

- do not skip schema/transition validation
- do not continue after an unhandled role failure
- do not send final external reply from non-entry roles
- do not assume a session exists without checking config/runtime policy
