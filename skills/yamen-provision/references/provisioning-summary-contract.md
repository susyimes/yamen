# Provisioning Summary Contract

Return a compact JSON-like summary with these fields:

- `status`: `ok | degraded | partial | failed`
- `runtime_root`
- `workspaces`: array of
  - `role`
  - `workspace`
  - `label`
  - `auth_status`
  - `notes`
- `warnings`
- `blockers`
- `next_actions`

## Example

```json
{
  "status": "ok",
  "runtime_root": ".openclaw/yamen-runtime",
  "workspaces": [
    {
      "role": "entry",
      "workspace": "workspace-entry",
      "label": "yamen-entry",
      "auth_status": "copied",
      "notes": "ready"
    }
  ],
  "warnings": [],
  "blockers": [],
  "next_actions": [
    "run yamen-operator with prefect task",
    "verify yamen-entry session boot"
  ]
}
```
