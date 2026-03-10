# Yamen Runtime Architecture

本文定义 Yamen 从“制度骨架”进入“可运行系统”时的最小运行架构。

目标不是一开始就做成重型多 Agent 平台，而是先让 Yamen 在 OpenClaw 中具备：

- 稳定案件流转
- 明确角色边界
- 结构化交接
- 基本可审计
- 可逐步演进到独立 runtime

---

## 1. 设计目标

Yamen 的 runtime 要解决的，不是“如何同时养很多人格会话”，而是：

1. 用户请求进入后，能否形成统一 `case`
2. `case` 能否按规则推进状态
3. 每个角色是否只做自己该做的动作
4. 交接是否结构化且可追踪
5. 失败后是否能退回、补材料、重派、终止

因此，Yamen runtime 的核心对象不是“角色聊天”，而是：

> **Case-driven orchestration（以案件为中心的编排）**

---

## 2. 核心原则

### 2.1 Case 是唯一主线
所有角色都围绕 `case` 工作，不围绕自由对话工作。

- 用户发来的请求 -> 创建或更新 `case`
- 角色的动作 -> 更新 `case.status`
- 角色的产物 -> 进入 `case.artifacts`
- 重要决策与交接 -> 进入 `case.flow_log`

### 2.2 Orchestrator 负责调度，不负责越权代办
Orchestrator 是运行控制器，不是超级执行员。

它负责：
- 读取 `case`
- 校验当前状态
- 匹配允许的 transition
- 调用对应角色
- 写回 `case`
- 决定下一责任角色

它不应：
- 自己伪装成所有角色直接产出结果
- 绕过状态机私自推进
- 随意跳过复核

### 2.3 角色是状态处理器，不是任意人格扮演
角色的价值在于职责边界：

- 门房：受理、清洗、分类、建议模式
- 县令：决定模式、立案、重派、终止、回禀拍板
- 主簿：任务单、补材料、交付物定义、回禀草稿
- 快手：实际执行、产出材料、报告阻塞
- 典史：风险复核、退回、放行
- 账房：台账、统计、数据侧支持（可选）

---

## 3. 运行时组件

Yamen 的最小 runtime 建议包含 4 个组件。

### 3.1 Intake Layer（入口层）
负责把用户输入变成标准化案件输入。

输入：
- 用户原始请求
- 来源渠道信息
- 会话上下文（可选）

输出：
- 初始 `case`
- 初始状态：`received`

入口层通常由主会话承担第一阶段职责。

---

### 3.2 Orchestrator（编排器）
这是 Yamen runtime 的核心控制器。

职责：
- 读取 `contracts/case.schema.json`
- 读取 `contracts/transitions.json`
- 根据 `case.status + mode + current_role` 找到可执行动作
- 调用对应角色
- 记录 `flow_log`
- 写回新状态
- 判断是否完成或需要下一角色

它应当是“严格按表走”的系统件。

---

### 3.3 Role Executors（角色执行器）
角色执行器负责承接 orchestrator 的调用。

在 Phase 1 中，它们可以是：
- 主会话内的角色提示模板
- `sessions_spawn` 拉起的按需角色会话
- 将来独立化的 role worker

执行器输入：
- 当前 `case`
- 指定动作（action）
- 结构化 handoff

执行器输出：
- 动作结果
- 变更建议
- 新产物 / 风险 / 阻塞项
- 给 orchestrator 的 next step 建议

重点是：

> **角色不直接决定最终状态；角色返回结果，由 orchestrator 按 transition 表决定状态推进是否合法。**

---

### 3.4 Case Store（案件存储）
负责把 `case` 持久化。

Phase 1 可以很轻：
- JSON 文件
- Markdown 案件卡片
- 简单目录存储

Phase 2 再升级到：
- SQLite
- Postgres
- API 层

Case store 最少要支持：
- create case
- get case
- update case
- append flow_log
- attach artifact
- list active cases

---

## 4. 最小数据流

一个请求进入 Yamen 后，建议按以下链路工作：

```text
User Request
  -> Intake Layer
  -> create case(status=received)
  -> Orchestrator
  -> Role Executor
  -> transition validation
  -> case update
  -> next role or finish
  -> user reply
```

如果拆成更细：

```text
用户
  -> 门房受理
  -> 县令判模式
  -> 主簿/快手/典史按需处理
  -> orchestrator 合法推进状态
  -> 县令统一回禀
```

---

## 5. Phase 1：OpenClaw 内嵌运行模式

这是当前最推荐的第一阶段运行方式。

### 5.1 角色映射
- 主会话 = `menfang + xianling`
- 按需拉起 = `zhubu / kuaishou / dianshi`

### 5.2 为什么这样设计
原因很简单：
- 先保留一个统一入口，避免“谁都能接案”
- 先把制度跑通，而不是先造复杂基础设施
- 减少常驻会话数量，降低上下文漂移
- 更适合 OpenClaw 当前工作方式

### 5.3 主会话职责
主会话承担：
- 读规则
- 创建 case
- 执行门房动作
- 执行县令动作
- 按需调用支持角色
- 汇总结果并回禀用户

### 5.4 支持角色职责
- `zhubu`：生成任务单 / 交付定义 / 补材料说明
- `kuaishou`：实际执行
- `dianshi`：风险复核

---

## 6. 建议目录结构

在现有工程基础上，后续建议增加：

```text
yamen/
├─ runtime/
│  ├─ orchestrator.ts           # 或 orchestrator.py
│  ├─ transition-engine.ts
│  ├─ case-store.ts
│  ├─ role-runner.ts
│  └─ types.ts
├─ cases/
│  ├─ active/
│  ├─ archive/
│  └─ templates/
├─ contracts/
│  ├─ case.schema.json
│  ├─ transitions.json
│  └─ ...
└─ docs/
   ├─ runtime-architecture.md
   └─ ...
```

如果 Phase 1 只做文件存储，建议：
- `cases/active/<case_id>.json`
- `cases/archive/<case_id>.json`

---

## 7. Orchestrator 的最小职责模型

建议把 orchestrator 限定为以下几个函数：

### 7.1 `createCase(request)`
作用：
- 生成 `case_id`
- 按 schema 初始化 `case`
- 写入 `received`

### 7.2 `getAllowedTransitions(case)`
作用：
- 根据 `status + mode` 过滤 `transitions.json`
- 返回当前合法动作列表

### 7.3 `dispatch(case, action)`
作用：
- 找到该动作对应角色
- 调用角色执行器
- 获取结构化结果

### 7.4 `applyTransition(case, action, roleResult)`
作用：
- 校验 action 是否允许
- 更新 `status`
- 写入 `current_role / owner_agent / artifacts / flow_log`

### 7.5 `closeOrContinue(case)`
作用：
- 若到达终态，则归档并输出回禀
- 否则交给下一个角色

---

## 8. 伪代码

```ts
case = createCase(userRequest)

while (!isTerminal(case.status)) {
  allowed = getAllowedTransitions(case)
  chosen = decideNextAction(case, allowed)

  roleResult = dispatch(case, chosen.action)
  case = applyTransition(case, chosen.action, roleResult)

  saveCase(case)
}

replyToUser(case.reply_summary)
archiveIfDone(case)
```

注意：
- `decideNextAction` 在 Phase 1 可以由主会话承担
- Phase 2 可以移入独立 policy engine

---

## 9. Handoff 设计

所有角色交接都应遵循统一格式。

建议 handoff 至少包含：
- case_id
- from_role
- to_role
- current_status
- action_requested
- summary
- completed
- pending
- blockers
- artifacts
- risk_flags

对应关系：
- 面向人类的格式：`contracts/handoff.md`
- 面向机器的载体：`case.flow_log` + 结构化结果对象

原则：

> **自然语言可读，但 runtime 判断不能依赖自然语言本身。**

---

## 10. 失败、退回与重试

Yamen 不是只设计“顺利办结”，还要设计“不顺利时怎么处理”。

### 10.1 信息不足
- 主簿可将案件打回 `returned`
- 县令负责决定补问用户、补材料或终止

### 10.2 执行受阻
- 快手通过 `report_blocker` 进入 `returned`
- 县令判断是否重派、降级、升级或取消

### 10.3 复核不通过
- 典史通过 `reject_result` 打回 `returned`
- 县令决定重新整理还是直接退回快手

### 10.4 升级更重制度
若命中高风险条件：
- 多专业域
- 外部发布
- 高权限操作
- 长周期强审计要求

则不应硬跑 Yamen 轻链路，而应：
- 标记升级
- 终止当前轻流程
- 转入更重制度（如 Edict）

---

## 11. 审计与可回放性

Yamen 的轻，不等于不可审计。

每个 case 至少要能回答：
- 谁接的
- 谁判的
- 谁写的任务单
- 谁执行的
- 谁复核的
- 为什么被退回
- 最终为什么结案或取消

因此 `flow_log` 至少要记录：
- 时间
- 角色
- 动作
- 状态
- 备注
- 下一责任角色

---

## 12. 从 Phase 1 到 Phase 2 的演进路径

### Phase 1：主会话内嵌编排
- 主会话兼任门房 + 县令
- 支持角色按需 spawn
- 文件级 case store
- 人工/半自动选择 next action

### Phase 2：最小独立 runtime
- 独立 orchestrator 脚本
- 自动读取 transition 表
- case JSON 持久化
- 角色执行器标准化接口

### Phase 3：服务化
- API 层
- 数据库存储
- 案件列表/状态页面
- 多 case 并发调度

### Phase 4：制度增强
- 守卫条件（guards）
- SLA / 优先级队列
- 自动升级与回退规则
- 成本统计 / 账房介入

---

## 13. 当前建议结论

Yamen 的下一步不应是“先养一堆常驻角色会话”，而应是：

1. 先把 `case` 和 `transition` 定死
2. 再让 orchestrator 成为唯一状态推进者
3. 角色只负责在边界内产出结果
4. 最后再谈是否把角色长期驻留化

一句话：

> **先把县衙的办案逻辑跑顺，再决定衙役是不是常驻。**
