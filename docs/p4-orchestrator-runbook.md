# P4 Orchestrator Runbook

这是 Yamen P4 的最小可运行编排器说明。

## 当前实现

当前提供一个 **零依赖 Node.js 文件驱动版 orchestrator**：

- `runtime/orchestrator.js`
- `runtime/transition-engine.js`
- `runtime/case-store.js`
- `runtime/role-runner.js`
- `runtime/handoff.js`
- `runtime/types.js`

角色执行层已升级为 adapter 结构：
- `stub`：本地模拟
- `file`：文件桥接
- `exec`：命令执行桥接

它的定位不是完整业务系统，而是：

- 验证 `case.schema.json` + `transitions.json` 能否支撑运行
- 提供最小 CLI 驱动
- 支持文件级 case 持久化
- 为下一步接 OpenClaw 会话调用做骨架

## 目录

```text
runtime/
├─ orchestrator.js
├─ transition-engine.js
├─ case-store.js
├─ role-runner.js
├─ types.js
└─ sample-request.direct.json
```

## CLI 用法

在仓库根目录运行：

```bash
node runtime/orchestrator.js create runtime/sample-request.direct.json
node runtime/orchestrator.js list
node runtime/orchestrator.js allowed <case_id>
node runtime/orchestrator.js step <case_id> classify_request
node runtime/orchestrator.js step <case_id> route_direct
node runtime/orchestrator.js step <case_id> submit_result
```

## 文件落盘位置

- 活跃案件：`cases/active/<case_id>.json`
- 已归档案件：`cases/archive/<case_id>.json`

## 当前能力边界

当前已验证两条路径：
- `stub` provider：本地 direct 流程可跑通
- `exec` provider：`zhubu` 可通过 bridge 示例完成 `draft_case_note`


### 已具备
- 创建案件
- 列出活跃案件
- 查询当前合法动作
- 按 transition 表推进状态
- 自动写入 `flow_log`
- 到达终态后自动归档

### 还没有
- 严格 JSON Schema 校验
- 原生 OpenClaw `sessions_spawn` / `sessions_send` provider
- 守卫条件（guards）
- 自动策略决策
- API / DB / UI

### 新增接口层
- `config/role-runners.json`：角色到 provider 的映射
- `docs/role-executor-interface.md`：真实调用接口设计
- `docs/openclaw-session-provider.md`：OpenClaw session provider 协议
- `docs/openclaw-bridge-runbook.md`：OpenClaw bridge 落地说明
- `runtime/openclaw-session-provider.js`：openclaw-session provider 实现
- `runtime/openclaw-session-bridge.example.js`：exec bridge 示例

## 设计说明

当前 `role-runner.js` 还是一个 stub runner：
- 不直接连接 OpenClaw agent
- 只模拟各角色动作结果
- 目的是先验证 orchestration 主干是否成立

下一步接入时，可以把 `runRoleAction()` 替换为：
- 主会话内角色模板调用
- `sessions_spawn` / `sessions_send` 调用
- 或未来独立 role worker
