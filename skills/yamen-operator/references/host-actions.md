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
- decide whether `kuaishou` should run locally, delegated, or parallel-delegated

### 2. Create or reuse role session

Required tools:
- `sessions_list` when reuse matters
- `sessions_spawn` when a role session must be created
- `sessions_send` when a persistent role session already exists

Runtime rule:
- `kuaishou` may fan out into delegated workers, but the official case route still records only one `kuaishou` execution seat
- `dianshi` may be invoked specifically for `debug` or `review`

### 3. Validate role output

Required action:
- validate JSON against the expected schema/contract before advancing the case

Validation rule:
- if the output fails the required schema, do not continue the normal route
- decide whether one repair attempt is allowed or whether `debug` mode must start immediately

### 4. Persist case and runtime state

Required action:
- update the case record and operator status after every accepted step

State rule:
- persist the active runtime mode (`triage`, `plan`, `execute`, `debug`, `review`)
- persist whether `kuaishou` execution was single, delegated, or parallel-delegated
- persist debug trigger reason when `dianshi` is called in `debug` mode

## Optional actions

Use only when helpful:
- extra progress notifications to prefect during long runs
- workspace refresh before a role run when provisioning drift is suspected
- one safe retry for timeout/schema repair
- spawning short-lived delegated `kuaishou` workers for splittable tasks

## Failure fallback actions

These become mandatory on failure:
- stop further transitions
- capture failure details in operator status
- decide whether the case now requires `debug` mode
- route back to `yamen-entry` for closure when possible
- otherwise return degraded status directly to prefect

## Debug-mode host actions

When `debug` mode is triggered:
- freeze the normal execution route
- package the failing step, payload, transition, and validation evidence
- send the diagnosis package to `dianshi`
- wait for a diagnosis-oriented output before resuming or closing
- record whether the result is `resume_execution`, `return_to_entry`, or `fail_and_report`

## Do not

- do not skip schema/transition validation
- do not continue after an unhandled role failure
- do not send final external reply from non-entry roles
- do not assume a session exists without checking config/runtime policy
- do not keep escalating `kuaishou` execution attempts when the correct action is to switch into `debug`
