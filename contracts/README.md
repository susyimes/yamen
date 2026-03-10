# Yamen Contracts

这里定义 Yamen 各 Agent 的输入输出契约。

这些契约是后续接 API、状态机、存储层的基础。

## 文件

- `case.schema.json`：机器可读的案件主数据契约（runtime / 存储 / 校验入口）
- `request-schema.md`：请求与案件输入格式说明
- `routing-modes.md`：直办 / 立案 / 复核案模式
- `permissions.md`：动作级权限模型
- `states.md`：案件状态机说明
- `transitions.json`：机器可读的状态迁移表（角色动作 / 状态推进 / 下一责任角色）
- `handoff.md`：Agent 间交接格式
