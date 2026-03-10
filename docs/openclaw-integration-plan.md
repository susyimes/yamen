# OpenClaw Integration Plan

Yamen 现在重新定位为：
- **规则层 / 制度包**：由仓库提供
- **OpenClaw 内部工作模式**：由 OpenClaw skills 与 session runtime 承接

阶段 2 的目标，不再是继续加重 repo runtime，而是把 Yamen 正式变成 OpenClaw 内部工作模式。

当前接入模型：

- 主会话：`prefect / 知府 / 外部上级`
- Yamen 入口 session：`entry = menfang + xianling`
- entry 输出契约：`contracts/entry-output.schema.json`
- 角色 session：`zhubu / kuaishou / dianshi`
- 角色 session 规范：`config/role-sessions.json`
- provisioning 规范：`config/provisioning.json`
- OpenClaw 内部 skills：`skills/yamen-provision/`、`skills/yamen-operator/`
- role runner provider：`config/role-runners.json`（过渡层）

## 当前原则

1. 主会话负责以“知府”身份向 Yamen 下发任务，而不是直接充当 Yamen
2. `yamen-entry` 负责门房 + 县令合并入口
3. 支持角色通过 OpenClaw session 承接具体动作
4. 角色 session 不需要长期常驻，但必须有固定身份规则与独立 workspace
5. 角色 session 的创建/复用规则由 `role-sessions.json` 统一定义
6. 角色运行环境 provisioning 由 `yamen-provision` skill 主导；repo 脚本仅作参考实现
7. 具体案件流转由 `yamen-operator` skill 主导；repo runtime 仅作过渡层/参考实现
8. 非线程场景下，operator payload 默认退化为 `sessions_spawn(mode="run")`，避免 OpenClaw session 约束不满足

## 角色层级

### 主会话内角色
- `prefect`

### Yamen 入口 session
- `entry = menfang + xianling`

### OpenClaw 角色 session
- `zhubu`
- `kuaishou`
- `dianshi`

## 角色 session 规范字段

- `sessionLabel`
- `runtime`
- `agentId`
- `sessionMode`
- `spawnMode`
- `purpose`

## 当前实现意义

这意味着“创建对应角色 agent”这件事，已经从口头约定升级为工程配置：
- 不再由 prompt 临时决定角色身份
- 而是由 OpenClaw 集成配置明确角色 session 的创建与复用方式

当前实现已经说明：
- 仓库可以稳定提供规则与角色模板
- OpenClaw 可以承接 entry / zhubu / kuaishou / dianshi 的内部流转
- provisioned workspace、routing、operator payload 都已被验证

下一步重点不再是加重 repo runtime，而是把主要执行逻辑收敛到：
- `skills/yamen-provision/`
- `skills/yamen-operator/`
