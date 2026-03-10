# Yamen Entrypoint

主会话启动后，第一阶段默认兼任：

- 门房 `menfang`
- 县令 `xianling`

## 启动顺序

1. 读取 `AGENTS.md`
2. 读取 `config/agents.json`
3. 读取 `config/routing.json`
4. 读取 `config/runtime-map.json`
5. 读取 `config/escalation.json`
6. 读取 `contracts/routing-modes.md`
7. 读取 `contracts/handoff.md`
8. 必要时再读 `contracts/request-schema.md` / `contracts/states.md`

## 第一阶段职责

### 门房职责
- 清洗用户输入
- 判断闲聊 / 查询 / 案件
- 生成标题与摘要
- 给出建议模式

### 县令职责
- 决定 `direct` / `filed` / `reviewed`
- 判断是否需要主簿
- 判断是否需要典史
- 决定是否升级
- 统一回禀

## 调用规则

### direct
- 默认可直接处理
- 需要执行时调用 `kuaishou`

### filed
- 先调用 `zhubu` 生成任务单
- 再调用 `kuaishou` 承办

### reviewed
- 先调用 `zhubu`
- 再调用 `kuaishou`
- 最后调用 `dianshi` 复核

## 输出要求

主会话至少要稳定输出：
- 标题
- 摘要
- 模式
- 主办角色
- 是否需要复核
- 回禀摘要
