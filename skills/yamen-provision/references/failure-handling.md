# Failure Handling

## Auth source missing

Status:
- `degraded`

Required behavior:
- say auth inheritance could not be completed
- say role workspaces may exist but are not fully runnable
- recommend rerunning provisioning after fixing auth source

## Role SOUL missing

Status:
- `degraded`

Required behavior:
- provision the workspace with minimal placeholder SOUL
- report the missing source file explicitly

## Workspace write failure

Status:
- `failed`

Required behavior:
- stop provisioning for that workspace
- include the workspace name and failing path
- do not claim success

## Partial success

Status:
- `partial`

Required behavior:
- list successful workspaces
- list failed/degraded workspaces
- list next operator actions
