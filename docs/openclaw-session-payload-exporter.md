# OpenClaw Session Payload Exporter

Use this helper to turn one `openclaw-session` bridge request into a directly usable OpenClaw session-tool argument draft.

## Command

```bash
node scripts/export-openclaw-session-payload.js <request-file>
```

`<request-file>` may be:
- an absolute path
- a relative path
- a filename under `runtime/bridge/openclaw-session/requests/`

## Output

The script returns JSON with:
- `suggested_tool`: `sessions_spawn` or `sessions_send`
- `directly_executable_args`: the argument object to use with that tool
- `prerequisites`: required pre-dispatch bootstrap steps (for example `ensure_entry_available`)
- `execution_plan`: ordered OpenClaw tool calls to run
- `notes`: label / session mode / spawn mode / workspace

## Purpose

This is the smallest bridge-stage helper.

It does not:
- send anything
- mutate cases
- write responses

It only converts a bridge request into a ready-to-use session tool payload draft.

## Example workflow

1. produce or inspect a request file
2. run exporter
3. if `prerequisites` / `execution_plan` are present, execute them in order
4. execute the final dispatch OpenClaw tool call
5. write the returned role JSON back through the relay helper

### Quick demo

```bash
node scripts/export-openclaw-session-payload.js runtime/sample-openclaw-session.request.json
```

## Why this step exists

This keeps the architecture clean:
- Yamen repo still defines contracts and routing rules
- OpenClaw still owns execution
- `yamen-prefect` can stay user-visible while internal roles remain behind the bridge
- bridge helpers stay thin and debuggable
