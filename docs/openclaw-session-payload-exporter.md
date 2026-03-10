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
3. copy the emitted `directly_executable_args`
4. execute the matching OpenClaw tool
5. write the returned role JSON back through the relay helper

### Quick demo

```bash
node scripts/export-openclaw-session-payload.js runtime/sample-openclaw-session.request.json
```

## Why this step exists

This keeps the architecture clean:
- Yamen repo still defines contracts and routing rules
- OpenClaw still owns execution
- bridge helpers stay thin and debuggable
