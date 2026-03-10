# OpenClaw Runtime Notes

Yamen 在 OpenClaw 内要“基本顺利执行”，最少需要补齐 3 个工程件：

1. `config/routing.json`
   - 定义 direct / filed / reviewed 三种模式
   - 定义每种模式需要哪些角色
   - 定义哪些角色按需 spawn

2. `config/runtime-map.json`
   - 定义主会话在第一阶段兼任 `menfang + xianling`
   - 定义 `zhubu / kuaishou / dianshi` 的按需调用方式

3. `config/escalation.json`
   - 定义何时升级到 Edict
   - 避免 Yamen 被硬塞进超复杂、高风险任务

## Phase 1 运行方式

- 主会话先兼任：门房 + 县令
- 按需拉起：主簿 / 快手 / 典史
- 角色之间交接：统一遵循 `contracts/handoff.md`
- 模式判断：统一参考 `contracts/routing-modes.md`

## 成功标准

如果主会话能做到以下 4 件事，就说明 Yamen 已经在 OpenClaw 中具备基本可执行性：

- 能读规则文件
- 能判断 direct / filed / reviewed
- 能按需调用主簿 / 快手 / 典史
- 能按 handoff 规范汇总回禀
