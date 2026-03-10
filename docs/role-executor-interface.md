# Role Executor Interface

本文定义 Yamen runtime 如何把一个角色动作真正交给“主会话 / 角色 session / 外部 worker”。

## 目标

把 `runtime/role-runner.js` 从纯 stub，升级为可插拔执行层：

- 默认可本地 stub 跑通
- 可切到文件桥接（file bridge）
- 可切到命令执行桥接（exec bridge）
- 后续可继续接 OpenClaw sessions

## 总体结构

```text
orchestrator
  -> role-runner
     -> provider adapter
        -> stub | file | exec | openclaw-session
```

## 输入：handoff payload

每次角色调用都接收统一 JSON：

- `case_id`
- `title`
- `mode`
- `current_status`
- `target_status`
- `action_requested`
- `acting_role`
- `next_role`
- `risk_level`
- `priority`
- `summary`
- `raw_request`
- `completed`
- `blockers`
- `artifacts`
- `reply_summary`
- `role_prompt`

其中：
- `role_prompt` 来自 `agents/<role>/SOUL.md`
- `completed/blockers/artifacts` 来自当前 case

## 输出：role result

角色执行器必须返回 JSON：

- `role`
- `action`
- `note`
- `completed`
- `pending`
- `blockers`
- `artifacts`
- `reply_summary`
- `occurred_at`

这与 orchestrator 现有 `applyTransition()` 直接兼容。

## Provider 说明

### 1. stub
本地模拟器。

用途：
- 跑测试
- 演示状态机
- 在未接真实角色前验证主干

### 2. file
把 handoff 写入请求目录，等待外部系统写回响应目录。

适合：
- 你后面想接 OpenClaw 主会话中转器
- 想接本地 watcher / bridge service
- 想做人工半自动验收

### 3. exec
直接执行外部命令，把 handoff JSON 作为 stdin 传入，读取 stdout JSON 结果。

适合：
- 独立 worker 进程
- Python / Node / shell bridge
- 未来 sessions bridge wrapper

## openclaw-session provider

当前仓库已正式新增：
- `kind: openclaw-session`
- role-runner 可根据 role 映射到 openclaw-session provider
- handoff payload 会转成 session envelope + prompt
- provider 通过 request/response bridge 等待 OpenClaw 写回 JSON 结果

这意味着：
1. runtime 层已经认识 openclaw-session 这种执行后端
2. OpenClaw bridge 只需要实现目录监听 + session 调度
3. orchestrator 无需再改

相关文档：
- `docs/openclaw-session-provider.md`
- `docs/openclaw-bridge-runbook.md`

## 配置文件

见：`config/role-runners.json`

角色与 provider 解耦：
- role 决定“谁来干”
- provider 决定“怎么调用”

这样后面可逐角色替换：
- `menfang` / `xianling` 继续主会话
- `zhubu` 走 exec bridge
- `kuaishou` 走 openclaw-session
- `dianshi` 走 file bridge

都不需要重写 orchestrator。
