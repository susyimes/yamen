# 🏮 Yamen

> A lightweight multi-agent institution inspired by the Chinese **yamen / prefecture office** model: fewer roles, shorter chains, clearer handoffs.

Yamen is **not** trying to be a smaller Edict.
It is a different shape of system:

- **Edict** is for heavier governance, stronger review, longer chains
- **Yamen** is for lighter execution, medium-complexity tasks, and everyday operational work

Current project direction:

> **Yamen repo = rule layer**  
> **OpenClaw = runtime layer**

This repository now focuses on:
- role boundaries
- case contracts
- transition rules
- runtime references
- OpenClaw-oriented skills and runbooks

Not on a full standalone backend/frontend platform.

---

## What Yamen is for

Yamen is meant for tasks that benefit from **some institutional structure**, but do **not** justify a heavy multi-department system.

Typical fit:
- writing / polishing / summarization
- small engineering changes
- bug triage and execution
- lightweight research and compilation
- medium-scope operational tasks
- tasks that sometimes need review, but not always

Core idea:

> Keep the system structured enough to be auditable, but short enough to stay useful.

---

## Mental model

Instead of treating multi-agent work as free-form roleplay, Yamen treats it as **case-driven orchestration**.

A request becomes a **case**.
The case is then routed through a small set of roles with explicit handoffs and state transitions.

### Current role model

External / visible layer:
- **`yamen-prefect`** — visible superior session, receives tasks from the user/open host surface

Internal Yamen layer:
- **`yamen-entry`** — merged **门房 + 县令** entry session
- **`yamen-zhubu`** — 主簿, drafting / clarification / case note / structure
- **`yamen-kuaishou`** — 快手, execution
- **`yamen-dianshi`** — 典史, review / risk gate

Optional / conceptual role:
- **账房 / zhangfang** remains in the institutional design, but is not part of the current minimal runtime path

---

## Execution modes

Yamen currently models three main case paths:

### 1. `direct`
For light, low-risk work.

Path:
```text
yamen-prefect -> yamen-entry -> kuaishou -> yamen-entry report -> yamen-prefect
```

### 2. `filed`
For tasks that need a formal case note or a bit of structure before execution.

Path:
```text
yamen-prefect -> yamen-entry -> zhubu -> kuaishou -> yamen-entry report -> yamen-prefect
```

### 3. `reviewed`
For higher-risk work that needs review before closure.

Path:
```text
yamen-prefect -> yamen-entry -> zhubu -> kuaishou -> dianshi -> yamen-entry report -> yamen-prefect
```

---

## Current architecture

### 1. Rule layer in this repo

This repo contains the institutional and orchestration rules:

- `contracts/`
  - case schema
  - entry output schema
  - operator status schema
  - prefect report schema
  - handoff contract
  - transition table
- `config/`
  - provisioning config
  - role/session mappings
  - runtime map
  - routing and escalation config
- `agents/*/SOUL.md`
  - role voice, intent, and boundaries
- `cases/templates/`
  - direct / filed / reviewed templates
- `docs/`
  - runtime notes, progression docs, integration plans, runbooks

### 2. Runtime reference layer in this repo

These files are **reference / rehearsal / bridge** code, not the final long-term architecture:

- `runtime/`
- `scripts/`

They are useful for:
- smoke tests
- bridge rehearsals
- payload exports
- reference orchestration behavior

### 3. Runtime layer in OpenClaw

The target execution model lives in OpenClaw via skills and session tools:

- `skills/yamen-provision/`
  - provision or refresh Yamen role workspaces
- `skills/yamen-operator/`
  - run Yamen case logic inside OpenClaw

That means the repo is no longer best understood as:
- “a standalone app waiting for a backend”

It is better understood as:
- **an institutional package + runtime references for OpenClaw-native operation**

---

## Repo status now

The project has already moved beyond a pure concept skeleton.

### What is already in place

#### Institutional structure
- `AGENTS.md`
- role `SOUL.md` files
- handoff and permission documents
- direct / filed / reviewed case templates

#### Contracts and schemas
- `contracts/case.schema.json`
- `contracts/entry-output.schema.json`
- `contracts/operator-status.schema.json`
- `contracts/prefect-report.schema.json`
- `contracts/transitions.json`

#### Runtime references
- case store / orchestrator / transition engine references in `runtime/`
- bridge relay and payload tooling
- prefect flow reference tools

#### Provisioning path
- `scripts/bootstrap-yamen-runtime.ps1`
- `docs/role-runtime-provisioning.md`
- `skills/yamen-provision/`

#### Operator path
- `skills/yamen-operator/`
- `scripts/run-operator-smoke.js`
- `scripts/run-operator-failure-smoke.js`

---

## What has been validated

The current repo already has a minimally testable operator path.

### Happy-path smoke coverage

`scripts/run-operator-smoke.js` validates:
- `direct`
- `filed`
- `reviewed`

### Failure smoke coverage

`scripts/run-operator-failure-smoke.js` validates representative failures:
- role timeout
- invalid JSON from role output
- `next_role` drifting outside configured Yamen roles
- entry closure/report generation failure

So the current maturity is roughly:

- **Yamen Provision**: minimally testable provisioning skill + operator-facing playbook
- **Yamen Operator**: minimally testable execution skill + happy/failure smoke references

---

## Core design principles

### 1. One external mouthpiece
Externally, Yamen should not sound like five agents arguing.

- `yamen-entry` is the internal mouthpiece of the Yamen system
- `yamen-prefect` is the visible superior-facing layer

### 2. Short chains by default
Not every task deserves planning, review, and committee behavior.

Default preference:
- shortest valid route
- escalate only when needed

### 3. Strict role boundaries
Roles should not collapse into each other just because the runtime can technically do so.

- entry classifies and routes
- zhubu structures
- kuaishou executes
- dianshi reviews

### 4. Stop-and-report on failure
If the runtime drifts, it should stop honestly and report.

Do not:
- silently bypass invalid outputs
- silently invent next roles
- silently close a broken case

### 5. Cases over free-form chatter
The primary object is the **case**, not the chat transcript.

The system should always be able to answer:
- what case is active
- which role handled it
- what transition happened
- why it stopped or completed

---

## Recommended reading order

If you want to understand the project quickly, read in this order.

### A. First: understand the contracts
- `contracts/case.schema.json`
- `contracts/transitions.json`
- `contracts/handoff.md`
- `contracts/entry-output.schema.json`
- `contracts/operator-status.schema.json`
- `contracts/prefect-report.schema.json`

### B. Then: understand the runtime model
- `docs/runtime-architecture.md`
- `docs/role-runtime-provisioning.md`
- `docs/prefect-flow.md`
- `docs/operator-runtime-progression.md`
- `docs/openclaw-integration-plan.md`

### C. Then: understand the OpenClaw skills
- `skills/yamen-provision/SKILL.md`
- `skills/yamen-provision/references/operator-playbook.md`
- `skills/yamen-operator/SKILL.md`
- `skills/yamen-operator/references/execution-flow.md`
- `skills/yamen-operator/references/failure-handling.md`
- `skills/yamen-operator/references/summary-report-contract.md`

---

## Getting started

## 1) Provision local Yamen role workspaces

Run:

```powershell
pwsh -File scripts/bootstrap-yamen-runtime.ps1
```

This creates or refreshes local runtime workspaces under:

```text
.openclaw/yamen-runtime/
├─ workspace-prefect/
├─ workspace-entry/
├─ workspace-zhubu/
├─ workspace-kuaishou/
└─ workspace-dianshi/
```

Expected workspace contents include:
- `AGENTS.md`
- `SOUL.md`
- `role.json`
- `README.md`
- local-only `auth-profiles.json`
- `memory/`
- `logs/`

Important:
- copied auth is **local runtime material only**
- do **not** commit copied auth files

---

## 2) Validate the operator reference flow

Run the smoke tests:

```bash
node scripts/run-operator-smoke.js
node scripts/run-operator-failure-smoke.js
```

What these give you:
- proof that the minimal route logic still matches the current contracts
- proof that representative failure modes still stop and report honestly

---

## 3) Rehearse bridge / payload flow when needed

To export an OpenClaw session-tool payload draft from a request:

```bash
node scripts/export-openclaw-session-payload.js <request-file>
```

To walk a filed bridge rehearsal:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json
```

Useful flags:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json -AutoScaffold
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json -AutoScaffold -AutoReport
```

---

## 4) Understand the intended live OpenClaw flow

Target live flow:

```text
external caller
-> yamen-prefect
-> yamen-entry
-> zhubu / kuaishou / dianshi
-> yamen-entry report
-> yamen-prefect
-> external caller
```

Where:
- OpenClaw session tools create or reuse role sessions
- Yamen contracts decide valid structure and transitions
- the operator layer validates outputs and routes the next step

---

## What this repo is not doing yet

This repo is **not yet** a full independent production platform with:
- standalone service API
- database-backed persistent case service
- frontend dashboard
- long-running autonomous multi-worker deployment

Those may come later.

Right now the project is optimized for:
- rule clarity
- OpenClaw integration
- reproducible reference flows
- minimally testable skills

---

## Near-term direction

The most natural next steps are:

1. keep tightening README/docs so they match the actual implementation
2. move more of the runtime behavior from reference scripts into OpenClaw-native execution
3. add more structured operator/provision contracts where useful
4. connect provision + operator into a cleaner end-to-end runbook

---

## Repository map

```text
yamen/
├─ agents/          # role identity / SOUL files
├─ cases/           # templates + local case storage references
├─ config/          # provisioning / sessions / routing / runtime maps
├─ contracts/       # schemas and handoff / state contracts
├─ docs/            # architecture and runbooks
├─ runtime/         # reference runtime / bridge / orchestrator code
├─ scripts/         # smoke tests, bootstrap, rehearsal helpers
└─ skills/          # OpenClaw-oriented provision/operator skills
```

---

## One-sentence summary

**Yamen is now best described as a lightweight institutional package for OpenClaw-native multi-agent execution, not just a metaphorical org chart and not yet a full standalone platform.**

---

## License

Follow the repository's existing license arrangement.
