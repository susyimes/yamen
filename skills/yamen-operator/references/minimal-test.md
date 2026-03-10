# Minimal Test

Run these paths before claiming the operator flow is usable.

## Goal

Verify the smallest end-to-end route for each supported mode:
- direct
- filed
- reviewed

## Must verify

### direct
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- mode resolves to `direct`
- `kuaishou` receives the handoff
- result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

### filed
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- mode resolves to `filed`
- handoff goes to `zhubu`
- `zhubu` output leads to `kuaishou`
- `kuaishou` completes execution
- result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

### reviewed
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- mode resolves to `reviewed`
- handoff goes to `zhubu`
- `kuaishou` executes after `zhubu`
- `dianshi` reviews after `kuaishou`
- final reviewed result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

## Validation points

For every path, validate:
- entry intake JSON matches `contracts/entry-output.schema.json`
- every transition is allowed by `contracts/transitions.json`
- no `next_role` escapes the configured role system
- final report matches `contracts/prefect-report.schema.json`
- operator state snapshots match `contracts/operator-status.schema.json`

## Failure smoke cases

Also test at least these failures:
- invalid JSON from one role
- timeout from one internal role
- impossible `next_role`
- entry closure/report generation failure

## Pass condition

Claim minimum viability only if:
- all 3 happy paths pass
- all failure smoke cases stop safely
- external closure still goes through `yamen-entry`
