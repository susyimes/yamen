# Bridge Driver

Use this reference when moving from local smoke tests to real OpenClaw runtime delivery.

## Positioning

Do not move orchestration rules into the bridge.

Keep boundaries strict:
- Yamen repo = rule layer
- OpenClaw = runtime layer
- bridge relay = delivery adapter inside runtime layer
- `yamen-operator` = operator skill that decides how to use the bridge/runtime

## Current practical path

The repo already has a usable relay helper:
- `runtime/openclaw-bridge-relay.js`

Treat it as the first bridge driver.

## Minimal bridge responsibilities

The bridge should do only these things:
1. read `runtime/bridge/openclaw-session/requests/*.request.json`
2. inspect routing advice / session envelope
3. choose `sessions_spawn` or `sessions_send`
4. obtain role JSON result
5. write `*.response.json`
6. if role output is bad, write a simple failure response instead of hanging

## What the bridge must not do

- do not decide case mode
- do not mutate transition rules
- do not pretend to be `yamen-entry`
- do not produce final prefect report on behalf of entry
- do not silently repair semantic business errors

## Suggested operating levels

### Level 0: smoke only
- `node scripts/run-operator-smoke.js`
- `node scripts/run-operator-failure-smoke.js`

Purpose:
- verify contracts and basic closure logic locally

### Level 1: manual relay
Use:
- `node runtime/openclaw-bridge-relay.js list`
- `node runtime/openclaw-bridge-relay.js show <request-file>`
- `node runtime/openclaw-bridge-relay.js scaffold-json <request-file>`
- `node runtime/openclaw-bridge-relay.js write-response-stdin <request-file>`
- `node runtime/openclaw-bridge-relay.js fail <request-file> <reason>`

Purpose:
- let a human/operator manually ferry requests to OpenClaw role sessions
- confirm payload shape and response writing behavior

### Level 2: semi-automatic relay
Add a thin watcher that:
- polls request directory
- prints recommended `sessions_spawn` / `sessions_send` payload
- accepts pasted JSON result
- writes response automatically

Purpose:
- reduce manual file handling
- keep human verification in the loop

### Level 3: automatic relay
Only after Level 1 and 2 are stable.

Automatic relay may:
- read routing advice from request envelope
- call OpenClaw session tools directly
- validate response shape
- write failure response on non-JSON output

## Simplified failure policy for bridge stage

If any of these happen:
- no session available
- timeout waiting for role
- invalid JSON from role
- role result missing required fields

Then do this:
- stop waiting
- write simple failure response
- let operator convert it into degraded operator status / prefect report

Do not build complicated recovery in the bridge first.

## Recommended next implementation step

If you want the next smallest real step, do this first:
- add a helper that converts one `.request.json` into a ready-to-use OpenClaw `sessions_spawn` or `sessions_send` call payload
- do not implement a background watcher yet

That keeps debugging easy and respects the current architecture split.
