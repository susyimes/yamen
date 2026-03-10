# Auth Inheritance

## Preferred source order

1. configured `auth.source`
2. main agent auth profile
3. fallback agent auth profile
4. placeholder only if explicitly forced

## Rules

- Never commit copied auth into git.
- Treat copied auth as local runtime state.
- Report the exact source used when successful.
- If no source is found, mark provisioning as degraded or failed.

## Healthy result

A healthy provisioning run should say:
- which auth source was used
- which workspaces received auth
- whether the resulting workspaces are runnable
