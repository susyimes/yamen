# OpenClaw Bridge Relay - Minimal Implementation Plan

本文定义 Yamen 的 OpenClaw bridge relay 如何从“协议已定义”走到“最小可运行”。

## 目标

在不把 OpenClaw 工具硬编码进仓库 Node runtime 的前提下，实现一个可逐步演进的 relay 层：

- 发现待处理 request
- 解析 session envelope
- 为 OpenClaw 主会话提供明确的执行入口
- 接收/校验角色 JSON
- 写回 response
- 为后续自动化 watcher 保留接口

## 分阶段方案

### Phase A：人工/半自动 relay（本次落地）
提供一个 bridge helper/CLI，支持：
- 列出 pending requests
- 查看 request 详情
- 生成 response 草稿模板
- 写入失败/阻塞响应

用途：
- 在 OpenClaw 主会话中人工承接 request
- 用 `sessions_spawn` / `sessions_send` 进行真实角色调用
- 再把 JSON 结果写回 response

### Phase B：会话中继 relay
在 OpenClaw 主会话中运行固定流程：
1. 读取 pending request
2. 根据 envelope 执行 `sessions_spawn` / `sessions_send`
3. 解析角色返回
4. 写回 response 文件

这一层仍可以是“主会话驱动”，不必先做长期守护进程。

### Phase C：自动 watcher
做成真正 watcher：
- 定时扫描 request 目录
- 自动调度 role sessions
- 自动落 response
- 记录 relay 日志

## 最小 relay 职责

一个最小可用 relay 至少要保证：

1. 不会漏掉 request
2. 不会把错误 JSON 直接写回 orchestrator
3. 能在角色输出异常时写 blocker response
4. 能让人类快速看到“当前该处理什么”

## 推荐目录职责

```text
runtime/
├─ openclaw-session-provider.js      # 由 orchestrator 侧调用
├─ openclaw-bridge-relay.js         # relay helper / minimal CLI
└─ bridge/openclaw-session/
   ├─ requests/
   ├─ responses/
   └─ relay-state.json              # 可选，记录处理状态
```

## 建议的最小命令

```bash
node runtime/openclaw-bridge-relay.js list
node runtime/openclaw-bridge-relay.js show <request-file>
node runtime/openclaw-bridge-relay.js scaffold <request-file>
node runtime/openclaw-bridge-relay.js fail <request-file> "reason"
```

## Phase B 如何接 OpenClaw tools

推荐由 OpenClaw 主会话执行：

1. `show` 查看 request envelope
2. 按 `session.mode` 决定：
   - `spawn` -> `sessions_spawn`
   - `send` -> `sessions_send`
3. 把 `prompt` 发给角色 session
4. 要求只返回 JSON
5. 将 JSON 粘贴/写入 response 文件

## blocker response 约定

如果角色调用失败，不要让 orchestrator 永远等超时。
relay 应写回标准 blocker 响应，例如：

- `completed: []`
- `pending: ["session_response_failed"]`
- `blockers: ["json_parse_failed"]`
- `note`: 说明失败原因

这样案件会进入可追踪的失败路径，而不是静默卡死。

## 本次落地结论

这一步先不做“自动调用 OpenClaw tools 的后台 watcher”，而是先交付：
- 清晰的 relay 操作面
- 半自动 bridge CLI
- 标准 response 模板与失败兜底

这样你马上就能用主会话手工/半自动跑通一条真正的 Yamen role session 流。 
