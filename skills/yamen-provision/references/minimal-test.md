# Minimal Test

Use this when validating `yamen-provision` at the smallest practical level.

## Goal

Confirm that provisioning can:
- resolve config
- resolve auth source or report degraded state honestly
- create/refresh the four role workspaces
- produce a provisioning summary

## Reference test path

Current reference fallback:

```powershell
pwsh -File scripts/bootstrap-yamen-runtime.ps1
```

## Expected healthy result

- runtime root exists
- `workspace-entry`
- `workspace-zhubu`
- `workspace-kuaishou`
- `workspace-dianshi`
- each contains `role.json`, `AGENTS.md`, `SOUL.md`, `README.md`
- auth status is reported explicitly

## Expected summary shape

Use the contract in:
- `references/provisioning-summary-contract.md`

## Failure expectations

If auth source is missing:
- result should be `degraded` or `partial`
- workspaces may still be created
- operator must not claim fully runnable state
