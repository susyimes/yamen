# Workspace Contract

Each provisioned role workspace should contain enough material for OpenClaw to treat it as a role runtime root.

## role.json

Required fields:
- `id`
- `label`
- `workspace`
- `runtime`
- `agentId`
- `sessionMode`
- `spawnMode`
- `purpose`
- `managedBy`

## AGENTS.md

Should state:
- role identity
- workspace identity
- label identity
- strict role boundary

## SOUL.md

Use role-specific SOUL from repo when available.
For `entry`, use merged menfang+xianling definition.

## README.md

Explain that the workspace is provisioned from Yamen/OpenClaw integration, not hand-maintained business logic.

## Local-only files

These should exist locally but not be committed:
- `auth-profiles.json`
- `memory/`
- `logs/`
