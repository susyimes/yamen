# Execution Flow

Use this flow when running Yamen inside OpenClaw.

## Runtime mode map

The operator drives the case through these runtime modes:

- `triage` -> intake, classify, choose route, accept/reject
- `plan` -> structure execution notes and clarify boundaries
- `execute` -> perform the actual work
- `debug` -> inspect chain/state/contract drift when execution can no longer be trusted
- `review` -> risk check and release gate before final closure

Default role mapping:
- `yamen-entry` -> `triage`
- `zhubu` -> `plan`
- `kuaishou` -> `execute`
- `dianshi` -> `debug` and `review`

## 1. Prefect intake

Input arrives from the visible `yamen-prefect` session, not directly from the raw main session.

Required operator actions:
- normalize the raw request into a case draft
- create or update the case using `contracts/case.schema.json`
- send the intake payload to `yamen-entry`

## 2. yamen-entry intake (`triage`)

`yamen-entry` acts as merged `menfang + xianling`.

`yamen-entry` must return JSON that satisfies `contracts/entry-output.schema.json`.

Decision rules:
- `accept=false` -> close as rejected/cancelled and report back to prefect
- `suggested_mode=direct` -> next role should be `kuaishou`
- `suggested_mode=filed` -> next role should be `zhubu`
- `suggested_mode=reviewed` -> next role should be `zhubu`

## 3. Internal role execution path

### direct

```text
yamen-prefect
-> yamen-entry triage
-> kuaishou execute
-> yamen-entry closure/report
-> yamen-prefect
```

### filed

```text
yamen-prefect
-> yamen-entry triage
-> zhubu plan
-> kuaishou execute
-> yamen-entry closure/report
-> yamen-prefect
```

### reviewed

```text
yamen-prefect
-> yamen-entry triage
-> zhubu plan
-> kuaishou execute
-> dianshi review
-> yamen-entry closure/report
-> yamen-prefect
```

## 4. Delegated execution rule for kuaishou

`kuaishou` is the execution seat, not necessarily a single underlying worker.

Allowed execution forms:
- single-session execution
- delegated sub-agent execution
- parallel delegated execution when the work can be safely split and merged

Operator requirements:
- preserve a single `kuaishou` seat in the visible route
- record whether execution was local, delegated, or parallel-delegated
- merge delegated outputs back into one `kuaishou` result before closure
- do not let delegated workers bypass `yamen-entry` or impersonate `dianshi`

## 5. Debug path (`debug` mode)

When the case drifts out of a trustworthy execution path, enter `debug` mode and route to `dianshi`.

Common triggers:
- role output fails schema validation
- two consecutive step failures occur in one case
- `next_role` conflicts with contract/runtime rules
- closure/report cannot be produced cleanly
- user explicitly says the current result/diagnosis is wrong and asks to re-locate the problem

Debug path:

```text
yamen-prefect
-> yamen-entry triage
-> zhubu/kuaishou normal path
-> debug trigger fires
-> dianshi debug
-> yamen-entry updated closure/report
-> yamen-prefect
```

`debug` mode is for diagnosis first, not blind continuation.

## 6. Entry closure

After the last internal role finishes, return all role outputs to `yamen-entry`.

`yamen-entry` is the only Yamen component allowed to produce the final external report.

It must:
- merge latest case status
- summarize completed work
- summarize blockers or residual risk if any
- incorporate `dianshi` findings when `debug` or `review` happened
- produce the final prefect-facing report using `contracts/prefect-report.schema.json`

## 7. Operator responsibilities at each step

At every handoff, the operator must:
- verify `next_role` is inside the allowed Yamen role set
- verify the transition is allowed by `contracts/transitions.json`
- persist the case update before the next handoff
- append a `flow_log` event
- record operator state using `contracts/operator-status.schema.json`
- decide whether to stay in execution or switch into `debug`

## 8. Session tool mapping

Use OpenClaw session tools like this:
- `sessions_list`: inspect whether a labeled role session already exists when reuse matters
- `sessions_spawn`: create role sessions when `spawnMode` requires spawn or when no reusable session exists
- `sessions_send`: send handoff payload into an existing persistent role session

Preferred behavior:
- persistent/thread-bound role session exists -> `sessions_send`
- no reusable session, one-shot execution acceptable -> `sessions_spawn(mode="run")`
- delegated execution required -> one `kuaishou` seat may fan out to sub-agents/workers, but only the merged `kuaishou` output continues the official route
- role disabled or session routing unavailable -> fail fast and report degraded runtime state

## 9. Non-negotiable rules

- Never skip `yamen-entry` for external closure.
- Never let prefect directly impersonate `zhubu / kuaishou / dianshi`.
- Never advance a case on free-form text alone when a JSON contract is required.
- Never invent a new role outside configured runtime/contract files.
- Never keep retrying execution when the correct next step is `debug` mode.
