# Prefect Flow

这条主路径用于阶段 2 的正式接入模型：

```text
external caller / main session
-> yamen-prefect
-> yamen-entry
-> zhubu / kuaishou / dianshi
-> yamen-entry report
-> yamen-prefect
-> external caller
```

## CLI

```bash
node runtime/prefect-flow.js submit runtime/sample-request.filed.json
node runtime/prefect-flow.js show <case_id>
node runtime/prefect-flow.js report <case_id> <entry-report.json>
```

## 当前作用

- `submit`：从 `yamen-prefect` 口径创建案件，并把 prefect / entry / internal role workspace 挂进 case runtime 信息
- `submit` 同时会产出 `ensure_entry_available` 草案，要求在 prefect 正式 dispatch 前先保证 `yamen-entry` 已可接手
- `report`：把 `yamen-entry` 的统一回禀正式落回 case，形成 `yamen-prefect` 可读收口

## 现在的定位

这还不是全自动 orchestrator 替代品，但它已经把：
- 知府提交
- entry 接案
- entry 回禀

三件事正式纳入 runtime 主路径，而不是停留在手工演示层。
