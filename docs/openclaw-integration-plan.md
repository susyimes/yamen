# OpenClaw Integration Plan

阶段 2 的目标不是继续验证 runtime demo，而是把 Yamen 正式接进 OpenClaw。

当前接入模型：

- 主会话：`prefect / 知府 / 外部上级`
- Yamen 入口 session：`entry = menfang + xianling`
- 角色 session：`zhubu / kuaishou / dianshi`
- 角色 session 规范：`config/role-sessions.json`
- provisioning 规范：`config/provisioning.json`
- role runner provider：`config/role-runners.json`

## 当前原则

1. 主会话负责以“知府”身份向 Yamen 下发任务，而不是直接充当 Yamen
2. `yamen-entry` 负责门房 + 县令合并入口
3. 支持角色通过 OpenClaw session 承接具体动作
4. 角色 session 不需要长期常驻，但必须有固定身份规则与独立 workspace
5. 角色 session 的创建/复用规则由 `role-sessions.json` 统一定义
6. 角色运行环境 provisioning 由 `config/provisioning.json` 与 bootstrap 脚本定义
7. 非线程场景下，operator payload 默认退化为 `sessions_spawn(mode="run")`，避免 OpenClaw session 约束不满足

## 角色层级

### 主会话内角色
- `menfang`
- `xianling`

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

当前 relay 已可直接读出：
- 该交给哪个角色
- session label 是谁
- 建议用 `sessions_spawn` 还是 `sessions_send`
- 该复用还是新建
- 对应的 operator payload 应该长什么样
