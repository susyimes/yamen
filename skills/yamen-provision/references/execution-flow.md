# Execution Flow

Use this flow when running `yamen-provision` inside OpenClaw.

## Step 1: Read source-of-truth files

Must read:
- `config/provisioning.json`
- `config/role-sessions.json`
- `references/provisioning-checklist.md`
- `references/workspace-contract.md`

Read role SOUL as needed:
- `agents/zhubu/SOUL.md`
- `agents/kuaishou/SOUL.md`
- `agents/dianshi/SOUL.md`

## Step 2: Validate prerequisites

Check:
- repo is present
- provisioning root is resolvable
- role session labels exist
- main auth/profile source exists or a known fallback exists

If auth source is missing:
- report it explicitly
- do not pretend provisioning is fully healthy
- only create placeholders when explicitly allowed

## Step 3: Create or refresh workspaces

For each role:
- `entry`
- `zhubu`
- `kuaishou`
- `dianshi`

Create/refresh:
- workspace directory
- `role.json`
- `AGENTS.md`
- `SOUL.md`
- `README.md`
- local-only `auth-profiles.json`
- `memory/`
- `logs/`

## Step 4: Bind role identity

Ensure each workspace aligns with:
- role id
- session label
- runtime
- agentId
- purpose

## Step 5: Return provisioning summary

Return a compact summary with:
- runtime root
- refreshed workspaces
- bound labels
- auth status
- blockers / warnings
