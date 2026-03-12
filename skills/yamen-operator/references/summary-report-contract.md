# Summary / Report Contract

Use two structured outputs:
- operator runtime status
- prefect-facing final report

## 1. Operator runtime status

Purpose:
- tell OpenClaw/prefect what the operator is doing right now
- expose degraded state without pretending the case is finished

Validate against:
- `contracts/operator-status.schema.json`

Use when:
- a step starts
- a step finishes
- a failure or timeout occurs
- the whole flow completes
- the operator switches runtime mode

Recommended content additions:
- current runtime mode: `triage | plan | execute | debug | review`
- whether `kuaishou` ran as single, delegated, or parallel-delegated execution
- debug trigger reason when `dianshi` is acting in `debug` mode

## 2. Prefect-facing final report

Purpose:
- provide the only external Yamen closure payload
- summarize what happened in a stable shape that the prefect can consume

Validate against:
- `contracts/prefect-report.schema.json`

Producer:
- `yamen-entry` only

Contains:
- case identity
- selected mode
- final status
- route actually taken
- final summary to prefect
- artifacts / blockers / review notes
- runtime outcome

When applicable, also summarize:
- whether the case entered `debug` mode
- whether `dianshi` acted as diagnosis, review, or both
- whether `kuaishou` execution was delegated

## 3. Separation rule

Do not mix these two payloads.

- operator status = runtime/control plane
- prefect report = external/business plane

A run may emit many operator status updates but only one final prefect report.

## 4. Minimal prefect wording expectations

The final report should let the prefect answer:
- what this case was
- which route was taken
- whether it finished, returned, or failed
- what was produced
- what needs follow-up, if anything
- whether the case required diagnosis or risk review
