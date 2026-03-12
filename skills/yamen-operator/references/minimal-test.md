# Minimal Test

Run these paths before claiming the operator flow is usable.

## Goal

Verify the smallest end-to-end route for each supported case mode:
- direct
- filed
- reviewed

Also verify the operator can switch correctly between runtime modes:
- triage
- plan
- execute
- debug
- review

## Must verify

### direct
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- runtime enters `triage`
- case mode resolves to `direct`
- runtime enters `execute`
- `kuaishou` receives the handoff
- `kuaishou` may run as single or delegated execution
- result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

### filed
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- runtime enters `triage`
- case mode resolves to `filed`
- runtime enters `plan`
- handoff goes to `zhubu`
- `zhubu` output leads to `kuaishou`
- runtime enters `execute`
- `kuaishou` completes execution
- result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

### reviewed
- prefect request can enter operator
- `yamen-entry` can intake and return valid entry JSON
- runtime enters `triage`
- case mode resolves to `reviewed`
- runtime enters `plan`
- handoff goes to `zhubu`
- runtime enters `execute`
- `kuaishou` executes after `zhubu`
- runtime enters `review`
- `dianshi` reviews after `kuaishou`
- final reviewed result returns to `yamen-entry`
- `yamen-entry` emits a valid prefect report

## Delegation checks

At least one smoke path should verify:
- `kuaishou` can execute in single-session mode
- `kuaishou` can execute through delegated sub-agent mode
- if parallel execution is enabled, delegated outputs are merged back into one official `kuaishou` result before closure

## Debug-mode checks

At least one smoke path should verify the operator enters `debug` mode when:
- role output fails schema validation
- two consecutive step failures happen
- `next_role` conflicts with the configured system
- `yamen-entry` cannot close cleanly
- the user explicitly requests re-diagnosis/root-cause re-location

When `debug` mode is entered, verify:
- normal execution stops
- `dianshi` receives diagnosis context
- the final report explains whether the case resumed, returned, or failed

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
- repeated failure that should flip into `debug`

## Smoke runners

Use:

```bash
node scripts/run-operator-smoke.js
node scripts/run-operator-failure-smoke.js
```

- `run-operator-smoke.js` verifies the 3 happy paths in a stubbed local manner
- `run-operator-failure-smoke.js` verifies the simple failure-stop-report behavior before wiring real OpenClaw session delivery

## Pass condition

Claim minimum viability only if:
- all 3 happy paths pass
- debug-trigger smoke cases behave correctly
- all failure smoke cases stop safely
- external closure still goes through `yamen-entry`
