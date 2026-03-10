# 🏮 Yamen

> 一个基于中国古代县衙 / 州府制度的轻量多 Agent 架构，适合日常事务、中小任务和低沟通成本场景。

Yamen 不是缩水版 Edict，也不是大而全框架。
它的目标很简单：

- **少角色**
- **短链路**
- **低沟通成本**
- **必要时才复核**
- **复杂任务再升级**

如果 Edict 更像“朝廷治理层”，那 Yamen 更像“地方办事层”。

---

## 核心角色

- **门房 `menfang`**：受理、分流、清洗输入
- **县令 `xianling`**：主官决断，选择处理模式
- **主簿 `zhubu`**：成案、写任务单、整理文书
- **快手 `kuaishou`**：承办执行
- **典史 `dianshi`**：风险复核
- **账房 `zhangfang`**：数据台账（可选）

---

## 最小流转

### 直办
```text
门房 → 县令 / 快手 → 回禀
```

### 立案
```text
门房 → 县令 → 主簿 → 快手 → 回禀
```

### 复核案
```text
门房 → 县令 → 主簿 / 快手 → 典史 → 回禀
```

---

## 县衙式架构总览

```text
用户
  ↓
门房（受理 / 分流）
  ↓
县令（拍板）
  ├─ 主簿（任务单 / 文书）
  ├─ 快手（执行）
  └─ 典史（复核）
  ↓
回禀
```

---

## 工程状态

当前仓库已包含：

- `AGENTS.md`：整体系统规则
- `agents/*/SOUL.md`：各角色骨架
- `contracts/*`：请求、模式、权限、状态、handoff 契约
- `cases/templates/*`：direct / filed / reviewed 模板
- `config/agents.json`：角色注册

为了让 Yamen 在 OpenClaw 中**基本顺利执行**，最少还需要这 3 个工程件：

1. `config/routing.json`
2. `config/runtime-map.json`
3. `config/escalation.json`

这 3 个文件现在也已经补上。

---

## OpenClaw Get Started（工程接入）

这一节只讲：**怎么把 Yamen 工程接进 OpenClaw。**

### 第 1 步：把仓库放进 OpenClaw workspace
保留这些文件结构：

```text
yamen/
├─ AGENTS.md
├─ agents/
├─ contracts/
├─ cases/templates/
├─ config/
└─ docs/
```

### 第 2 步：第一阶段先让主会话兼任两种角色
第一阶段最推荐的运行方式：

```text
主会话 = 门房 + 县令
按需调用 = 主簿 / 快手 / 典史
```

### 第 3 步：主会话先读取这些文件
至少读取：

- `AGENTS.md`
- `contracts/routing-modes.md`
- `contracts/handoff.md`
- `config/agents.json`
- `config/routing.json`
- `config/runtime-map.json`
- `config/escalation.json`

### 第 4 步：按需调用支持角色
工程接入阶段先只做这件事：

- 需要成案 → 调主簿
- 需要执行 → 调快手
- 需要复核 → 调典史

### 第 5 步：用 OpenClaw 的这些能力就够了

- `read`：读取规则文件
- `sessions_spawn`：按需创建角色会话
- `sessions_send`：把任务交给角色
- `write/edit`：生成任务单与回禀草稿
- `exec/browser`：让快手承办执行

### 最小接入完成标准
满足下面几条，就说明 Yamen 已经接进 OpenClaw：

- 主会话能按门房规则整理请求
- 主会话能按县令规则选择 direct / filed / reviewed
- 主会话能按需调用主簿 / 快手 / 典史
- 角色交接遵循 `contracts/handoff.md`

更详细的运行说明见：`docs/openclaw-runtime.md`

---

## License

沿用仓库中的 License 约定。
