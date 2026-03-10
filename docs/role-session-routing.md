# Role Session Routing

relay 层现在会结合 `config/role-sessions.json` 给出角色 session 路由建议。

## 当前规则

- `menfang` / `xianling`：主会话内承担
- `zhubu`：`yamen-zhubu`
- `kuaishou`：`yamen-kuaishou`
- `dianshi`：`yamen-dianshi`

## relay 输出内容

`node runtime/openclaw-bridge-relay.js next`
和
`node runtime/openclaw-bridge-relay.js show <request-file>`

都会带出：
- `label`
- `runtime`
- `agentId`
- `sessionMode`
- `spawnMode`
- `suggested_openclaw_action`
- `suggested_steps`
- `operator_payload`（可直接拿去构造 OpenClaw 工具调用）

## 当前意义

这让主会话 relay operator 不需要再自己猜：
- 要不要 spawn
- 要不要 send
- 该连到哪个角色 session

而是直接按 relay 建议执行。 
