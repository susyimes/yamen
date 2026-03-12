# Failure Handling

Handle failures explicitly and return structured status instead of silent drift.

## Failure classes

### 1. Role timeout

Examples:
- session spawn never completes
- persistent role session does not answer within timeout
- external bridge returns no result

Operator action:
- mark runtime step as `timeout`
- record which role timed out
- do not fabricate role output
- return degraded operator status
- route back to `yamen-entry` only for closure/reporting, not for pretending the role succeeded

Recommended fallback:
- one retry only when the action is idempotent and no partial output exists
- otherwise stop and report back to prefect

### 2. Invalid JSON / schema mismatch

Examples:
- malformed JSON
- missing required fields
- wrong enum values
- additional unexpected properties when schema disallows them
- payload shape does not satisfy the contract even if it is valid JSON

Operator action:
- reject the payload
- report the schema mismatch
- allow one repair attempt by sending the exact validation error back to the same role
- if repair fails, stop and mark the case as returned/blocking
- if the mismatch means the route can no longer be trusted, trigger `debug` mode

### 3. `next_role` outside system or role conflict

Examples:
- payload says `next_role=qa`
- payload says `next_role=prefect`
- payload says `next_role` not allowed by schema or transition table
- runtime wants `kuaishou` but payload jumps directly to `dianshi` without an allowed transition

Operator action:
- reject immediately
- do not coerce to a nearby role silently
- report `next_role_out_of_contract`
- trigger `debug` mode when the conflict suggests route drift
- hand control back to `yamen-entry` or prefect with the failure reason

### 4. Entry cannot close the case

Examples:
- role outputs conflict materially
- final status is terminal but no user-facing summary exists
- final report JSON does not satisfy prefect report schema
- delegated `kuaishou` workers finished, but their outputs cannot be merged into one execution result

Operator action:
- stop before external reply
- request explicit closure repair from `yamen-entry`
- if closure still fails, enter `debug` mode through `dianshi`
- if closure still fails after diagnosis, return operator status plus partial internal evidence to prefect and mark runtime degraded

### 5. Consecutive failure accumulation

Examples:
- two consecutive step failures in the same case
- retry after repair still fails immediately

Operator action:
- stop blind retries
- trigger `debug` mode
- require a diagnosis-oriented report before resuming execution

### 6. User-forced re-diagnosis

Examples:
- user says “这不对，重新定位问题”
- user rejects the current explanation and asks for root-cause analysis instead of more edits

Operator action:
- stop normal execution path
- route to `dianshi` in `debug` mode
- require chain/state/contract diagnosis before any new execution step

## Debug trigger rule

Enter `debug` mode when any of these conditions happens:
- output does not satisfy the required schema
- two consecutive step failures occur
- role conflict or illegal `next_role` appears
- `yamen-entry` cannot close the case cleanly
- the user explicitly asks to re-locate the problem

When `debug` mode starts:
- freeze the normal route
- persist the last valid case state
- collect the exact failing payload/step/transition evidence
- send the diagnosis task to `dianshi`

## Simplified handling rule

For the current phase, prefer simple handling:
- identify the failure class
- stop further transitions
- emit degraded operator status
- trigger `debug` mode when trust in the route is broken
- emit a simple prefect-facing failure report through `yamen-entry` when possible
- do not build complex recovery loops first

## Retry policy

Keep retries small and deliberate.

- schema repair: 1 retry at most
- timeout retry: at most 1 retry when obviously safe
- otherwise stop and report
- semantic disagreement between roles: no blind retry; escalate to `debug` or back to entry/prefect

## Required failure fields

When reporting a failure, include:
- `code`
- `message`
- `failed_role`
- `failed_step`
- `case_id`
- `retryable`
- `operator_action_taken`

## Failure smoke runner

Use:

```bash
node scripts/run-operator-failure-smoke.js
```

This runner verifies the current simplified policy: detect failure, stop flow, emit degraded operator status, trigger `debug` when required, and emit simple prefect-facing failure report.

## Failure exit rule

When the operator cannot safely continue:
- stop advancing the case
- persist the last valid state
- produce `contracts/operator-status.schema.json`
- if possible, ask `yamen-entry` to package the failure into a prefect-facing report
- if diagnosis is required, route to `dianshi` before any new execution attempt
