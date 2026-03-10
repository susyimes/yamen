# Session Payload Templates

Use these payload shapes when driving Yamen roles through OpenClaw session tools.

## 1. yamen-prefect -> yamen-entry intake payload

Use when the user-visible `yamen-prefect` session sends a new case into `yamen-entry`.

```json
{
  "protocol": "yamen.operator.intake.v1",
  "sender_role": "prefect",
  "sender_label": "yamen-prefect",
  "target_role": "entry",
  "task": "intake_and_route",
  "case": {
    "case_id": "20260310-174800-demo",
    "title": "排查登录按钮偶发失效",
    "summary": "排查登录页按钮偶尔点击没反应的问题",
    "raw_request": "登录页按钮点击后偶尔没反应，帮我排查一下。",
    "source": { "channel": "webchat" },
    "priority": "normal",
    "risk_level": "medium",
    "mode": "filed",
    "status": "received",
    "current_role": "menfang",
    "owner_agent": "xianling",
    "needs_review": false,
    "artifacts": [],
    "flow_log": []
  },
  "response_contract": "contracts/entry-output.schema.json"
}
```

## 2. Role handoff payload

Use the runtime-generated handoff payload as the canonical shape.

Source builder:
- `runtime/handoff.js#buildHandoffPayload`

Core fields:
- `case_id`
- `title`
- `mode`
- `current_status`
- `target_status`
- `action_requested`
- `acting_role`
- `next_role`
- `risk_level`
- `priority`
- `summary`
- `raw_request`
- `completed`
- `blockers`
- `artifacts`
- `reply_summary`
- `role_prompt`

## 3. `sessions_spawn` payload pattern

Use when no persistent reusable role session exists or one-shot execution is preferred.

```json
{
  "runtime": "subagent",
  "agentId": "main",
  "mode": "run",
  "task": "You are Yamen role kuaishou. Perform execute_task for the attached case payload and return only JSON matching the Yamen role result contract.",
  "attachments": [
    {
      "name": "handoff.json",
      "content": "<serialized handoff payload>",
      "encoding": "utf8",
      "mimeType": "application/json"
    }
  ]
}
```

Use for:
- non-thread scenes
- one-shot direct/filed/reviewed steps
- timeout-isolated retries

## 4. `sessions_send` payload pattern

Use when a persistent role session already exists.

```text
[YAMEN_ROLE_HANDOFF]
Return only JSON.
Schema expectation: role, action, note, completed, pending, blockers, artifacts, reply_summary, occurred_at

<handoff payload json>
```

Use for:
- stable labeled sessions like `yamen-entry`, `yamen-zhubu`, `yamen-kuaishou`, `yamen-dianshi`
- thread-bound long-running role identities

## 5. Entry closure payload

Send all accepted internal role outputs back to `yamen-entry` in one package, then let `yamen-entry` report upward to `yamen-prefect`.

`route_taken` should be the deduplicated role path, for example:
- direct: `["entry", "kuaishou"]`
- filed: `["entry", "zhubu", "kuaishou"]`
- reviewed: `["entry", "zhubu", "kuaishou", "dianshi"]`

```json
{
  "protocol": "yamen.operator.entry-close.v1",
  "case": "<full latest case json>",
  "route_taken": ["entry", "zhubu", "kuaishou"],
  "role_results": [
    "<accepted role result 1>",
    "<accepted role result 2>"
  ],
  "response_contract": "contracts/prefect-report.schema.json"
}
```

## 6. Output rule

- `yamen-entry` intake output -> validate against `contracts/entry-output.schema.json`
- internal role output -> validate against the role result contract described in `docs/role-executor-interface.md`
- final closure output -> validate against `contracts/prefect-report.schema.json`
- final user-visible reply should be delivered by `yamen-prefect`, not by raw main session impersonation
