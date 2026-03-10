# OpenClaw Bridge Runbook

本文描述如何让 OpenClaw 主会话接手 `openclaw-session` provider 的 request/response 桥接。

## 最小工作流

1. 监听目录：
   - `runtime/bridge/openclaw-session/requests/`
2. 读入 `*.request.json`
3. 提取：
   - `session`
   - `payload`
   - `prompt`
4. 使用 OpenClaw：
   - `sessions_spawn` 创建角色 session，或
   - `sessions_send` 向既有角色 session 发消息
5. 要求角色 session 只返回 JSON
6. 将 JSON 写入：
   - `runtime/bridge/openclaw-session/responses/*.response.json`

## bridge 侧建议逻辑

### 如果 `session.mode = spawn`
- label: `session.label`
- runtime: `session.runtime`
- agentId: `session.agentId`
- task/message: `prompt`

### 如果 `session.mode = send`
- 根据 label 或 sessionKey 找到现有角色 session
- 把 `prompt` 发送进去

## 角色 session prompt 关键要求

必须强调：
- 只处理当前角色动作
- 不自行推进案件状态
- 不输出 markdown
- 不输出解释
- 只返回 JSON object

## JSON 兜底

若角色 session 返回非 JSON：
- bridge 应做一次清洗/抽取
- 若仍失败，则写回一个 blocker 结果，而不是让 orchestrator 卡死

## 推荐起步方式

第一阶段可以人工 bridge：
- 看到 request 文件
- 用 OpenClaw 主会话手动/半自动转发给角色 session
- 把返回 JSON 写回 response 文件

当前仓库已提供最小 relay helper：

```bash
node runtime/openclaw-bridge-relay.js list
node runtime/openclaw-bridge-relay.js show <request-file>
node runtime/openclaw-bridge-relay.js scaffold <request-file>
node runtime/openclaw-bridge-relay.js fail <request-file> "reason"
```

第二阶段再做自动 watcher。
