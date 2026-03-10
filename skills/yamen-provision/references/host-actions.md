# Host Actions

These are the minimum host-side actions the skill should conceptually perform inside OpenClaw.

## Provisioning actions

1. Read repo config and role templates
2. Resolve runtime root
3. Ensure role workspaces exist
4. Write/refresh role runtime files
5. Inherit auth/profile locally
6. Return provisioning summary

## Validation actions

After provisioning, verify:
- role labels match config
- workspace paths exist
- auth status is reported honestly
- no copied auth is staged for git commit

## Current implementation note

Until OpenClaw-native provisioning actions replace the fallback, use repo bootstrap as the reference execution path.
