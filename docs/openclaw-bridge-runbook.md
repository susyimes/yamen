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

## 标准操作流（list -> show -> export -> execute -> write-response）

推荐统一按下面步骤走一轮：

1. 列待处理 request

```bash
node runtime/openclaw-bridge-relay.js list
```

2. 看一个 request 明细

```bash
node runtime/openclaw-bridge-relay.js show <request-file>
```

3. 导出可直接执行的 OpenClaw session tool 参数草案

```bash
node scripts/export-openclaw-session-payload.js <request-file>
```

输出会给出：
- `suggested_tool` (`sessions_spawn` / `sessions_send`)
- `directly_executable_args`

4. 在 OpenClaw 中执行对应 tool（用上一步的参数）

5. 把角色 JSON 写回 response

```bash
node runtime/openclaw-bridge-relay.js write-response-stdin <request-file>
```

把 role JSON 粘贴进 STDIN 即可。

## 半自动脚本（压缩步骤）

```bash
node scripts/relay-semi-auto.js <request-file>
```

它会：
- 自动 export 参数草案
- 打印可执行的 tool 参数
- 提示如何写回 response

如需“一次命令 + 从 STDIN 写回 response”，可用：

```bash
node scripts/relay-semi-auto.js <request-file> --stdin
```

## 一键 filed 演练脚本

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1
```

常用参数：
- `-RequestFile runtime/sample-request.filed.ascii.json`
- `-AutoScaffold`（自动写 scaffold response，适合干跑）
- `-AutoReport`（最后自动附加 entry report）

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

## Adapter bundle（给宿主/Operator 的最小交接包）

如果你希望把一次 bridge request 交给宿主侧 adapter / operator 去真正执行，可先导出一份 bundle：

```bash
node scripts/export-openclaw-adapter-bundle.js <request-file>
```

bundle 会包含：
- `execution_plan`：按顺序执行的 OpenClaw tool 调用计划
- `write_response.command`：成功后如何把 role JSON 写回
- `fail_response.command`：失败时如何写 blocker 结果

这让宿主侧不需要再自己拼：
- 先 ensure `yamen-entry` 可用
- 再 dispatch request
- 最后写回 response

而是直接消费 bundle 即可。

## Host-side adapter prototype

当前 repo 里已经有一个最小原型：

```bash
node runtime/openclaw-host-adapter.js <request-file> --stdout
```

它会：
1. 读取 request 对应的 adapter bundle
2. 顺序执行 `execution_plan`
3. 将最终 role JSON 自动写回 response 目录

默认 executor 仍然是：

```bash
node runtime/openclaw-session-bridge.example.js
```

所以这还不是直接调用 OpenClaw 内部 sessions 工具的最终版；
但 adapter 的输入、顺序、写回责任已经固定下来了。

## Smoke test

可直接运行：

```bash
node scripts/run-host-adapter-smoke.js
```

当前覆盖两条最小路径：
- 普通角色 request：直接 dispatch
- `entry` request：先 ensure，再 dispatch
