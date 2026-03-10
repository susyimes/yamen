# Provisioning Checklist

## Read first

- `config/provisioning.json`
- `config/role-sessions.json`
- `docs/role-runtime-provisioning.md`

## Minimum workspaces

Create or refresh:
- `workspace-entry`
- `workspace-zhubu`
- `workspace-kuaishou`
- `workspace-dianshi`

## Minimum files per workspace

- `role.json`
- `AGENTS.md`
- `SOUL.md`
- `README.md`
- `auth-profiles.json` (local only; never commit)
- `memory/`
- `logs/`

## Auth strategy

Preferred source order:
1. configured `auth.source`
2. main agent auth
3. fallback agent auth
4. optional placeholder only when explicitly forced

## Output summary

Return:
- created/refreshed workspaces
- labels bound
- auth copied or missing
- blocking prerequisites
