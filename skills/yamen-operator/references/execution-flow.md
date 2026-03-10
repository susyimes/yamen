# Execution Flow

Use this flow when running Yamen inside OpenClaw.

## 1. Prefect intake

Input arrives from the visible `yamen-prefect` session, not directly from the raw main session.

Required operator actions:
- normalize the raw request into a case draft
- create or update the case using `contracts/case.schema.json`
- send the intake payload to `yamen-entry`

## 2. yamen-entry intake

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
-> yamen-entry intake
-> kuaishou execute
-> yamen-entry closure/report
-> yamen-prefect
```

### filed

```text
yamen-prefect
-> yamen-entry intake
-> zhubu draft case note
-> kuaishou execute
-> yamen-entry closure/report
-> yamen-prefect
```

### reviewed

```text
yamen-prefect
-> yamen-entry intake
-> zhubu draft case note
-> kuaishou execute
-> dianshi review
-> yamen-entry closure/report
-> yamen-prefect
```

## 4. Entry closure

After the last internal role finishes, return all role outputs to `yamen-entry`.

`yamen-entry` is the only Yamen component allowed to produce the final external report.

It must:
- merge latest case status
- summarize completed work
- summarize blockers or residual risk if any
- produce the final prefect-facing report using `contracts/prefect-report.schema.json`

## 5. Operator responsibilities at each step

At every handoff, the operator must:
- verify `next_role` is inside the allowed Yamen role set
- verify the transition is allowed by `contracts/transitions.json`
- persist the case update before the next handoff
- append a `flow_log` event
- record operator state using `contracts/operator-status.schema.json`

## 6. Session tool mapping

Use OpenClaw session tools like this:
- `sessions_list`: inspect whether a labeled role session already exists when reuse matters
- `sessions_spawn`: create role sessions when `spawnMode` requires spawn or when no reusable session exists
- `sessions_send`: send handoff payload into an existing persistent role session

Preferred behavior:
- persistent/thread-bound role session exists -> `sessions_send`
- no reusable session, one-shot execution acceptable -> `sessions_spawn(mode="run")`
- role disabled or session routing unavailable -> fail fast and report degraded runtime state

## 7. Non-negotiable rules

- Never skip `yamen-entry` for external closure.
- Never let prefect directly impersonate `zhubu / kuaishou / dianshi`.
- Never advance a case on free-form text alone when a JSON contract is required.
- Never invent a new role outside configured runtime/contract files.
