# OpenClaw Session Provider

本文定义 Yamen 如何把角色动作交给 OpenClaw 的真实 session 执行层。

## 目标

让这些角色最终能由 OpenClaw session 承接：
- `zhubu`
- `kuaishou`
- `dianshi`

同时保持：
- orchestrator 不直接依赖 OpenClaw 内部工具
- role-runner 仍然是统一 provider 接口
- OpenClaw 只需要充当 bridge / dispatcher

## 为什么不把 `sessions_spawn` 直接写进 Node runtime

因为当前 `runtime/*.js` 是仓库内普通 Node 脚本，离开 OpenClaw 宿主并没有工具能力。
如果把 `sessions_spawn` / `sessions_send` 直接硬编码进去，代码看起来像能跑，实际在纯 Node 环境下并不能成立。

所以更稳的边界是：

```text
yamen runtime (repo)
  -> openclaw-session provider
     -> request/response bridge
        -> OpenClaw main session
           -> sessions_spawn / sessions_send
```

## provider 设计

新增 provider kind：`openclaw-session`

它的职责不是自己直接调工具，而是：
1. 生成 session envelope
2. 写入 bridge request
3. 等待 OpenClaw bridge 写回 response
4. 把 response 交还 orchestrator

## 配置建议

```json
{
  "kind": "openclaw-session",
  "requestDir": "runtime/bridge/openclaw-session/requests",
  "responseDir": "runtime/bridge/openclaw-session/responses",
  "runtime": "subagent",
  "agentId": "openai-codex",
  "sessionMode": "spawn",
  "sessionLabelPrefix": "yamen-role",
  "timeoutMs": 60000,
  "pollIntervalMs": 1000
}
```

## request envelope

每次角色调用会生成一个 request envelope，其中包含：

- `protocol`: `yamen.openclaw-session.v1`
- `role`
- `session`：目标会话配置
- `transition`：from/action/to/next_role
- `payload`：完整案件 handoff payload
- `prompt`：给 OpenClaw 角色 session 的结构化提示词
- `manual_text`：便于人工查看的 handoff 文本
- `response_contract`：约束返回 JSON 字段

## OpenClaw bridge 要做什么

一个最小 bridge 需要：

1. watch `runtime/bridge/openclaw-session/requests/*.request.json`
2. 读取 envelope
3. 根据 `session.mode` 决定：
   - `spawn`：用 `sessions_spawn`
   - `send`：用 `sessions_send`
4. 把 `prompt` 发给角色 session
5. 等待 session 输出 JSON
6. 写入 `runtime/bridge/openclaw-session/responses/*.response.json`

## prompt 约束

给角色 session 的 prompt 应要求：
- 只处理当前动作
- 不越权推进状态
- 只输出 JSON
- 不写额外解释

这样 orchestrator 才能稳定消费结果。

## 推荐接法

### 阶段 1
- `zhubu` -> `openclaw-session`
- `kuaishou` -> `stub` 或 `exec`
- `dianshi` -> `stub`

### 阶段 2
- `kuaishou` -> `openclaw-session`
- `dianshi` -> `openclaw-session`

### 阶段 3
- `menfang/xianling` 仍留在主会话
- 支持角色全部外包给 role sessions

## 关键边界

OpenClaw session 角色要负责：
- 在角色边界内产出结果

OpenClaw main session / bridge 要负责：
- 会话生命周期
- tool routing
- JSON 清洗/兜底
- 写回 bridge response

Orchestrator 要负责：
- 合法状态推进
- case 更新
- 归档 / 回禀
