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
- `auth-profiles.json`：从主环境复制的一份最小 auth profiles

## auth 继承策略

当前最小策略：`copy-main-profile`

即：
- 源：主环境的 `auth-profiles.json`
- 目标：复制到每个角色 workspace

原因：
- 先保证角色 workspace 能实际发起会话
- 先解决“逻辑配置存在，但运行时无模型/鉴权”的问题

后续再考虑：
- 引用式继承
- 多 profile 分流
- 角色独立认证

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

## provisioning 脚本目标

bootstrap 脚本最少要做到：
1. 创建目录树
2. 写入各角色最小文件
3. 复制 auth profiles
4. 生成 entry / zhubu / kuaishou / dianshi 的 role.json
5. 输出创建结果

## 当前意义

这样做完后，“创建对应角色 agent”才从：
- label 和 prompt 约定

升级为：
- 具备真实 workspace / 配置 / auth 的可运行角色环境
