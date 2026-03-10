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

### 2. Invalid JSON

Examples:
- malformed JSON
- missing required fields
- wrong enum values
- additional unexpected properties when schema disallows them

Operator action:
- reject the payload
- report the schema mismatch
- allow one repair attempt by sending the exact validation error back to the same role
- if repair fails, stop and mark the case as returned/blocking

### 3. `next_role` outside system

Examples:
- payload says `next_role=qa`
- payload says `next_role=prefect`
- payload says `next_role` not allowed by schema or transition table

Operator action:
- reject immediately
- do not coerce to a nearby role silently
- report `next_role_out_of_contract`
- hand control back to `yamen-entry` or prefect with the failure reason

### 4. Entry cannot close the case

Examples:
- role outputs conflict materially
- final status is terminal but no user-facing summary exists
- final report JSON does not satisfy prefect report schema

Operator action:
- stop before external reply
- request explicit closure repair from `yamen-entry`
- if closure still fails, return operator status plus partial internal evidence to prefect and mark runtime degraded

## Retry policy

Keep retries small and deliberate.

- schema repair: 1 retry
- timeout retry: at most 1 retry when safe
- semantic disagreement between roles: no blind retry; escalate to entry/prefect

## Required failure fields

When reporting a failure, include:
- `code`
- `message`
- `failed_role`
- `failed_step`
- `case_id`
- `retryable`
- `operator_action_taken`

## Failure exit rule

When the operator cannot safely continue:
- stop advancing the case
- persist the last valid state
- produce `contracts/operator-status.schema.json`
- if possible, ask `yamen-entry` to package the failure into a prefect-facing report
