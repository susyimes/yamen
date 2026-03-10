# OpenClaw Integration Plan

阶段 2 的目标不是继续验证 runtime demo，而是把 Yamen 正式接进 OpenClaw。

当前接入模型：

- 主会话：`menfang + xianling`
- 角色 session：`zhubu / kuaishou / dianshi`
- 角色 session 规范：`config/role-sessions.json`
- role runner provider：`config/role-runners.json`

## 当前原则

1. 主会话负责入口、判案、汇总回禀
2. 支持角色通过 OpenClaw session 承接具体动作
3. 角色 session 不需要长期常驻，但必须有固定身份规则
4. 角色 session 的创建/复用规则由 `role-sessions.json` 统一定义

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
