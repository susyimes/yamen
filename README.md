# 🏮 Yamen

> 用中国古代 **县衙 / 州府** 的治理逻辑，设计一套 **更轻量、少 Agent、低沟通成本** 的 AI 协作架构。

如果说 **Edict / 三省六部** 适合中高复杂度、强审议、强治理的大任务，
那么 **Yamen（衙门）** 想解决的就是另一类问题：

> **不是所有事都需要上朝。很多日常事务，更像是县衙办案、州府理事：链路更短、角色更少、决断更快。**

所以 Yamen 的目标不是做一个缩水版 Edict，而是做一套 **适合轻量任务、中等任务、日常事务处理** 的制度化多 Agent 架构。

---

## 它想解决什么问题？

多 Agent 系统很容易出现两个极端：

### 极端 1：只有一个万能 Agent
优点：
- 快
- 简单
- 用户容易理解

缺点：
- 规划、执行、审查全混在一起
- 容易遗漏风险
- 任务一复杂就混乱
- 很难审计和复盘

### 极端 2：制度太完整，链路太长
优点：
- 分工清楚
- 质量高
- 风险可控

缺点：
- 简单任务也要层层流转
- token 和等待成本高
- 用户会觉得“你怎么还在开会”

Yamen 想走的是中间路线：

> **保留制度，减少层级；保留分工，减少官僚化。**

它更适合：

- 日常任务
- 轻量工程任务
- 中等复杂度需求
- 查询、整理、写作、修补、执行类任务
- 需要一点分工，但不值得启用完整朝廷体制的事情

---

## 为什么是“县衙 / 州府”？

县衙和州府的特点，不是没有制度，而是：

- **离事最近**
- **链路更短**
- **主官拍板更快**
- **分工有，但不铺张**
- **既能办日常事务，也能处理一定复杂度案件**

如果把它映射成 AI Agent 体系，就是：

- 不搞十几个部门同时上阵
- 不让每个请求都经过长链路审议
- 保留必要的分工和复核
- 强调 **“一人统办 + 分工协办 + 必要时复核”**

这比三省六部更适合做“少 Agent 版”的主力工作流。

---

## 🏮 县衙式架构总览

```text
┌──────────────────────────────────────────────────────────────┐
│                        👤 用户 / 苦主                         │
│                提需求、报事务、追问进展、收结果              │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        🚪 门房 / 受理                         │
│     接待来意、分辨闲聊/查询/立案、清洗输入、提炼标题          │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     🧑‍⚖️ 县令 / 主官决断                      │
│      判断轻重缓急，决定直办 / 立案 / 复核案，统一拍板         │
└──────────────┬───────────────────────┬───────────────────────┘
               │                       │
               ▼                       ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│      📚 主簿 / 书办         │   │      🪶 典史 / 复核         │
│  写任务单、补计划、整理文书 │   │  风险把关、规则复核、放行   │
└──────────────┬─────────────┘   └──────────────┬─────────────┘
               │                                │
               ▼                                │
┌──────────────────────────────────────────────────────────────┐
│                    ⚒️ 快手 / 承办执行                        │
│     查询、写作、修改、编码、调试、整理、实际完成任务          │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                 🧮 账房 / 库吏（可选）                        │
│          数据台账、资源清单、成本核算、统计汇总              │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     📜 回禀 / 结案回复                        │
│           对用户输出：结果、进展、遗留项、风险说明           │
└──────────────────────────────────────────────────────────────┘
```

这套图想表达的不是“官职好看”，而是县衙式治理的三个特点：

- **入口统一**：先由门房受理，不让原始请求直接冲进执行层
- **主官拍板**：由县令决定是直办、立案还是复核案
- **少人协同**：主簿辅助梳理、快手实际执行、典史按需复核

一句话说：

> **县衙不是没有制度，而是制度更短、更贴近办事本身。**

---

## Yamen 的核心设计原则

### 1. 少角色，但每个角色要清楚
Yamen 不追求部门齐全，而追求：

- 谁接案
- 谁主办
- 谁协办
- 谁复核
- 谁回话

角色少，但职责必须稳。

---

### 2. 默认短链路，不默认多轮流转
大部分任务应该：

- 快速受理
- 快速判断
- 快速执行
- 快速回报

而不是一上来就规划、审议、派发、再汇总。

---

### 3. 复杂任务才升级制度
Yamen 不是没有复核，而是：

- 简单任务：直接办
- 中等任务：主簿协助拆解
- 风险任务：加司理/复核
- 特殊任务：必要时再升级到更重制度

这是一套“逐级加制度”的架构，而不是“默认最重”。

---

### 4. 对用户要像“县太爷办事”，不是“朝廷开大会”
用户最关心的不是内部官职，而是：

- 你听懂没有
- 你准备怎么办
- 你什么时候给结果

所以 Yamen 需要做到：

> **内部有制度，外部像一个干练的衙门。**

---

## 🏮 Yamen 的建议组织架构

这里我建议把 Yamen 做成 **4+1 或 5+1 Agent 架构**。

说明一下：
- 这是制度设计上的完整表达
- 当前 OpenClaw 接入实现里，最小主路径已经收敛为：`yamen-prefect + yamen-entry + zhubu / kuaishou / dianshi`
- 其中 `yamen-entry` 是 **门房 + 县令的合并入口**
- `账房 / 库吏` 目前仍保留在制度层，但还不在当前最小运行主路径里

### 基础版：4+1

```text
用户
  ↓
门房 / 受理
  ↓
县令 / 主官
  ↓
主簿 / 书办
  ↓
快手 / 承办
  ↓
典史 / 复核（按需）
  ↓
回禀用户
```

### 扩展版：5+1

```text
用户
  ↓
门房（受理）
  ↓
县令（主官决断）
  ├── 主簿（规划、记录、文书）
  ├── 快手（执行）
  └── 典史（风控、复核）
  ↓
账房 / 库吏（数据、资源、台账，可选）
  ↓
回禀用户
```

这套结构的重点是：

- **门房**：负责接待和分流
- **县令**：负责统一判断和拍板
- **主簿**：负责文书、规划、记录、任务拆解
- **快手**：负责动手执行
- **典史**：负责风控、合法性、复核
- **账房 / 库吏**：负责数据、清单、资源核算（可选）

这比三省六部轻得多，但仍然有组织感。

---

## 各角色怎么分工？

## 🚪 门房 —— 入口受理
门房是系统入口，负责：

- 接收用户请求
- 判断是闲聊、查询、待办还是正式任务
- 清洗输入
- 提炼标题
- 决定是否直接回复，还是送县令判断

它像“衙门门口的第一道口子”。

门房应该处理的典型事情：

- "今天天气怎么样？" → 直接答
- "帮我润色这段文案" → 可以直转轻办
- "帮我改个 bug" → 送县令判断是否立案
- "帮我做一个登录系统" → 明显属于正式任务

门房的价值：

> **别让所有原始输入直接冲进主流程。**

---

## 🧑‍⚖️ 县令 —— 主官 / 决策中枢
县令是 Yamen 的核心。

和三省六部相比，Yamen 没有把“规划、审议、派发”拆成三层，而是把大量判断集中到县令这里。

县令负责：

- 判断任务轻重缓急
- 决定走直办、协办还是复核流
- 指定主办人
- 在需要时让主簿补规划
- 在有风险时让典史复核
- 最终决定怎么回禀用户

这就是县衙体制和朝廷体制的差别：

> **朝廷强调分权制衡；县衙强调主官统办。**

县令不是执行者，而是“少 Agent 架构里的大脑”。

---

## 📚 主簿 —— 任务书写员 / 规划员
主簿是县令最重要的助手。

它负责：

- 把口头需求整理成清晰任务
- 写出简要计划
- 必要时拆成 2~5 个子项
- 记录过程与结论
- 整理交付文书

它相当于把三省六部里的部分中书省、部分礼部能力合并起来。

适合主簿处理的事情：

- 写一页执行计划
- 梳理需求边界
- 整理接口说明
- 生成任务单
- 写总结和回报

主簿不是重型 Planner，而是：

> **在轻量制度下，把事情讲明白的人。**

---

## ⚒️ 快手 —— 承办执行员
快手是实际干活的人。

它负责：

- 查询
- 撰写
- 修改
- 编码
- 调试
- 汇总素材
- 跑流程

在很多任务里，快手就是最常用的执行 Agent。

它相当于把三省六部里的：

- 兵部（工程）
- 礼部（文稿）
- 工部（工具）
- 户部的一部分（简单数据）

做了一个轻量合并。

Yamen 的思路不是极致专业分工，而是：

> **让一个承办角色覆盖多数日常任务，再在必要时调用额外角色协助。**

---

## 🪶 典史 —— 风控 / 复核 / 规矩官
典史不是时时都要出场。

它只在这些场景出现：

- 涉及外部发布
- 涉及生产环境
- 涉及账号、权限、密钥
- 涉及较大改动
- 涉及用户可能会追责的输出
- 快手执行结果存在疑点

典史负责：

- 复核是否越权
- 复核是否高风险
- 看结果是否达标
- 判断是否允许回禀

它相当于一个轻量版门下省 + 刑部。

这也是 Yamen 和单 Agent 最大的差别之一：

> **默认不审，但关键时刻有人管。**

---

## 🧮 账房 / 库吏 —— 数据与台账（可选）
这是一个可选角色。

在很多任务里未必需要；但如果做成 5+1 架构，它会很有用。

它负责：

- 数据整理
- 清单记录
- 成本核算
- 台账维护
- 资源清点

比如：

- 统计某项目现状
- 汇总接口清单
- 生成日报/周报数据
- 做简单财务/成本分析

它相当于一个轻量版户部。

---

## 一条任务在 Yamen 里怎么走？

### 例子 1：轻任务 —— 润色一段公告
用户说：

> 帮我把这段团队公告改得更清楚一点。

流程：

```text
门房受理 → 县令判断为轻办 → 快手直接处理 → 主簿整理回话 → 回复用户
```

特点：

- 不需要立复杂任务树
- 不需要复核
- 不需要多人并行
- 目标是快

---

### 例子 2：中任务 —— 修一个小 bug
用户说：

> 登录页按钮点击后偶尔没反应，帮我排查一下。

流程：

```text
门房受理 → 县令立案 → 主簿写简单任务单 → 快手排查与修改 → 必要时典史复核 → 回禀用户
```

特点：

- 有主线
- 有执行
- 有必要时复核
- 但不需要动用完整朝廷体制

---

### 例子 3：较复杂任务 —— 做一个小功能
用户说：

> 帮我给这个项目加一个反馈入口，前端表单 + 后端接口 + 简单说明文档。

流程：

```text
门房受理
→ 县令判断为中复杂任务
→ 主簿拆成前端 / 后端 / 文档三个子项
→ 快手执行主任务
→ 账房整理字段/清单（可选）
→ 典史做风险复核（如涉及数据采集）
→ 县令统一回禀
```

这时它已经有一点“州府办案”的味道了：

- 不是只有一个人乱干
- 也不是十几个部门一起开会
- 而是主官主导、书办组织、快手执行、典史把关

---

## Yamen 和 Edict 的差别

### 一句话对比

- **Edict / 三省六部**：像中央朝廷，适合大事、难事、风险高的事
- **Yamen / 县衙州府**：像地方衙门，适合日常事务、中小任务、讲究效率的事

---

## 差别对比表

| 维度 | Edict（三省六部） | Yamen（县衙 / 州府） |
|---|---|---|
| **适用任务** | 中高复杂度、跨部门、强审议 | 轻量任务、中小任务、日常事务 |
| **组织风格** | 分层治理、制度完备 | 主官统办、短链决断 |
| **默认链路** | 较长 | 较短 |
| **角色数量** | 多 | 少 |
| **审核机制** | 强审核、强制衡 | 按需复核、风险触发 |
| **执行模式** | 多部门并行 | 少量角色协同 |
| **沟通成本** | 较高 | 较低 |
| **适合体验** | 像“AI 上朝” | 像“有人替你办事” |
| **优势** | 规范、可审计、适合复杂治理 | 快、轻、顺手、理解成本低 |
| **风险** | 容易过重、官僚化 | 容易过度依赖主官判断 |

---

## Yamen 的制度优势

### 1. 更适合日常高频任务
很多真实工作，并没有复杂到需要完整审议链路。

Yamen 更适合：

- 写文案
- 查资料
- 做小改动
- 补文档
- 跑简单排查
- 做轻量信息整理

---

### 2. 用户更容易理解
普通用户不一定关心“中书省和门下省谁先谁后”。

但他很容易理解：

- 门房先接待
- 县令判断怎么办
- 主簿整理任务
- 快手去办
- 典史必要时复核

这套隐喻很自然。

---

### 3. 链路更短，适合速度优先
Yamen 天生适合：

- 先出结果
- 再决定是否需要补复核
- 在保证基本规矩的前提下提高响应速度

---

## Yamen 的潜在问题

### 1. 县令可能变成瓶颈
因为主官集中决策，所以县令很容易成为：

- 判断瓶颈
- 协调瓶颈
- 上下文瓶颈

所以 Yamen 必须控制范围，不要让所有复杂任务都压给县令。

---

### 2. 容易“看起来轻”，实际职责混杂
如果边界不写清楚，就会出现：

- 县令既在判断，也在规划，也在派发
- 主簿既写文书，也在替快手执行
- 快手既改东西，也自己复核自己

所以即使是轻量架构，也要写清楚角色边界。

---

### 3. 需要明确什么时候升级制度
Yamen 不适合所有任务。

如果用户要做的是：

- 跨团队复杂项目
- 高风险部署
- 强审计要求
- 多轮并行大任务

那就应该升级到更重制度，而不是硬塞进县衙模式。

---

## OpenClaw Get Started（工程接入）

这一节只讲：**怎么把 Yamen 作为规则层接进 OpenClaw，并在 OpenClaw 内部运行成一种工作模式。**

### 当前定位

- **Yamen repo** = 规则层
- **OpenClaw** = 运行层
- **`skills/yamen-provision`** = 角色运行环境 provisioning
- **`skills/yamen-operator`** = 内部执行 skill，负责 `yamen-prefect -> entry -> internal roles -> entry report`

也就是说：
- repo 负责 contract / transitions / references
- OpenClaw 负责 session / relay / execution / stop-and-report
- `yamen-operator` 负责把规则真的驱动起来

---

### 第 0 步：先 provision 一套角色运行环境

在仓库根目录运行：

```powershell
pwsh -File scripts/bootstrap-yamen-runtime.ps1
```

它会在 `.openclaw/yamen-runtime/` 下生成：

- `workspace-prefect`
- `workspace-entry`
- `workspace-zhubu`
- `workspace-kuaishou`
- `workspace-dianshi`

每个 workspace 至少会包含：
- `AGENTS.md`
- `SOUL.md`
- `role.json`
- `README.md`
- `auth-profiles.json`
- `memory/`
- `logs/`

说明：
- `auth-profiles.json` 属于本地 runtime 材料，只用于角色环境可运行化
- 这些复制出来的 auth 文件不应提交进 git

---

### 第 1 步：确认最小可测试路径

#### A. 先验证规则和 contract 没漂

```bash
node scripts/run-operator-smoke.js
node scripts/run-operator-failure-smoke.js
```

这两条分别验证：
- 3 条 happy path：`direct / filed / reviewed`
- 4 类简单失败：timeout / invalid JSON / `next_role` 漂移 / `entry` closure fail

也就是说，当前 repo 里的 `yamen-operator` 已经至少具备了：
- 最小 happy path 验证
- 最小失败 stop-and-report 验证

#### B. 把一个 bridge request 导出成可执行的 OpenClaw session tool 参数

```bash
node scripts/export-openclaw-session-payload.js <request-file>
```

它会输出：
- `suggested_tool`：`sessions_spawn` 或 `sessions_send`
- `directly_executable_args`：可直接照着执行的参数草案

#### C. 走一遍 filed 半自动演练

推荐先用 ASCII sample，避免 PowerShell 中文 case_id 编码问题：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json
```

常用参数：

```powershell
# 自动写 scaffold response，适合干跑
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json -AutoScaffold

# 最后自动附加 entry report
powershell -ExecutionPolicy Bypass -File scripts/run-filed-bridge-rehearsal.ps1 -RequestFile runtime/sample-request.filed.ascii.json -AutoScaffold -AutoReport
```

---

### 第 2 步：理解正式接入模型

推荐运行方式：

```text
main session = external caller / OpenClaw host surface
visible superior session = yamen-prefect
entry session = menfang + xianling (merged as yamen-entry)
internal role sessions = zhubu / kuaishou / dianshi
```

也就是说：
- 主会话不直接扮演 Yamen
- 用户先进入 OpenClaw 标准可见层上的 `yamen-prefect`
- `yamen-prefect` 再向独立的 `yamen-entry` 提交案件
- `yamen-entry` 决定 `direct / filed / reviewed`
- 再按需调 `zhubu / kuaishou / dianshi`

---

### 第 3 步：最小 bridge 操作流

先按下面这条标准顺序跑：

```bash
node runtime/openclaw-bridge-relay.js list
node runtime/openclaw-bridge-relay.js show <request-file>
node scripts/export-openclaw-session-payload.js <request-file>
# 在 OpenClaw 中执行上一步导出的 sessions_spawn / sessions_send 参数
node runtime/openclaw-bridge-relay.js write-response-stdin <request-file>
```

如果想压缩步骤，用：

```bash
node scripts/relay-semi-auto.js <request-file>
```

或：

```bash
node scripts/relay-semi-auto.js <request-file> --stdin
```

---

### 第 4 步：阶段 2 的主路径

现在 repo 里的主路径是：

```text
external caller
-> yamen-prefect
-> yamen-entry
-> zhubu / kuaishou / dianshi
-> yamen-entry report
-> yamen-prefect
-> external caller
```

可直接用：

```bash
node runtime/prefect-flow.js submit runtime/sample-request.filed.json
node runtime/prefect-flow.js show <case_id>
node runtime/prefect-flow.js report <case_id> <entry-report.json>
```

---

### 第 5 步：OpenClaw 里真正需要的能力

工程接入阶段，先只依赖这些能力：

- `read`：读取规则文件与 contract
- `sessions_spawn`：按需创建角色会话
- `sessions_send`：向已有角色会话发 handoff
- `write/edit`：生成任务单、报告、桥接 response
- `exec/browser`：让快手承办执行具体动作

---

### 最小接入完成标准

满足下面几条，就说明 Yamen 已经以“规则层 + 运行层”方式接进 OpenClaw：

- 用户能通过 OpenClaw 标准界面进入 `yamen-prefect`
- `yamen-prefect` 能以知府/上级身份提交案件
- `yamen-entry` 能输出合法 intake / report 结构
- `zhubu / kuaishou / dianshi` 能通过 OpenClaw session 或 bridge 被调用
- 角色交接遵循 `contracts/handoff.md`
- 失败时能 stop-and-report，而不是静默漂移

---

### 推荐先读这些文件

**规则层 / 核心 contract**
- `contracts/case.schema.json`
- `contracts/entry-output.schema.json`
- `contracts/operator-status.schema.json`
- `contracts/prefect-report.schema.json`
- `contracts/transitions.json`
- `contracts/handoff.md`

**运行层 / 接入路径**
- `docs/openclaw-integration-plan.md`
- `docs/prefect-flow.md`
- `docs/openclaw-bridge-runbook.md`
- `docs/openclaw-session-payload-exporter.md`
- `docs/operator-runtime-progression.md`

**skills**
- `skills/yamen-provision/SKILL.md`
- `skills/yamen-provision/references/operator-playbook.md`
- `skills/yamen-operator/SKILL.md`
- `skills/yamen-operator/references/execution-flow.md`
- `skills/yamen-operator/references/failure-handling.md`
- `skills/yamen-operator/references/session-payloads.md`
- `skills/yamen-operator/references/bridge-driver.md`

---

## License

沿用仓库中的 License 约定。
