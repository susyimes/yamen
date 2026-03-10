# Role Runtime Provisioning

本方案定义 Yamen 在 OpenClaw 中的最小角色运行环境（runtime environment provisioning）。

## 设计调整

当前采用的新模型不是：
- 主会话 = Yamen

而是：
- **主会话 = 知府 / 外部上级**
- **Yamen = 独立运行系统**
- **Yamen 入口 = 门房 + 县令合并的 entry session**

也就是说，主会话不再直接承担门房/县令，而是对 Yamen 系统下发任务。

## 最小目录规范

建议根目录：

```text
.openclaw/yamen-runtime/
├─ workspace-entry/
├─ workspace-zhubu/
├─ workspace-kuaishou/
└─ workspace-dianshi/
```

其中：
- `workspace-entry`：门房+县令合并入口
- `workspace-zhubu`：主簿运行环境
- `workspace-kuaishou`：快手运行环境
- `workspace-dianshi`：典史运行环境

## 每个 workspace 最小生成文件

- `AGENTS.md`：该角色 workspace 的运行说明
- `SOUL.md`：角色人格/职责文本
- `role.json`：角色元信息（role id / label / runtime / purpose）
- `README.md`：workspace 来源说明
- `auth-profiles.json`：从主环境复制的一份最小 auth profiles（本地 provision，不入库）
- `memory/`：角色本地记忆目录（本地状态）
- `logs/`：角色本地日志目录（本地状态）

## auth 继承策略

当前最小策略：`copy-main-profile`

即：
- 优先从主环境复制 `auth-profiles.json`
- 当前优先源为：`.openclaw/agents/main/agent/auth-profiles.json`
- bootstrap 会继续尝试其他常见来源路径作为兜底
- 若确实不存在，可用 `-Force` 先生成占位文件

原因：
- 先保证角色 workspace 能实际发起会话
- 先解决“逻辑配置存在，但运行时无模型/鉴权”的问题

## entry session

新的核心角色不是 main session，而是：
- `yamen-entry`

它承担：
- 门房受理
- 县令判案
- 创建 case
- 决定 direct / filed / reviewed
- 调用 zhubu / kuaishou / dianshi
- 向知府/主会话回禀

## bootstrap 当前行为

`bootstrap-yamen-runtime.ps1` 现在会：
1. 创建目录树
2. 写入各角色最小文件
3. 尝试复制 auth profiles
4. 生成 entry / zhubu / kuaishou / dianshi 的 role.json
5. 输出创建结果

## 当前意义

这样做完后，“创建对应角色 agent”才从：
- label 和 prompt 约定

升级为：
- 具备真实 workspace / 配置 / auth 的可运行角色环境
