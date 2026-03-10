# Case States

建议最小状态集：

- `received`：已受理
- `triaged`：已分流
- `accepted`：已立案
- `drafted`：任务单已生成
- `executing`：执行中
- `review_pending`：待复核
- `returned`：退回修正 / 待补材料 / 待重做
- `done`：已结案
- `cancelled`：已取消

> 机器可读迁移表见：`contracts/transitions.json`

## 角色推进关系

- 门房负责推动 `received -> triaged`
- 县令负责在 `triaged` 阶段决定：直办 / 立案 / 终止
- 主簿负责推动 `accepted -> drafted`，或在信息不足时退回 `returned`
- 快手负责推动执行阶段，并将结果提交为 `done` 或 `review_pending`
- 典史负责 `review_pending -> done/returned`
- 县令负责从 `returned` 重新指派或终止

## 模式差异

### `direct`
最短链路：

`received -> triaged -> executing -> done`

### `filed`
标准立案链路：

`received -> triaged -> accepted -> drafted -> executing -> done`

### `reviewed`
带复核链路：

`received -> triaged -> accepted -> drafted -> executing -> review_pending -> done`

如果复核不通过，则：

`review_pending -> returned -> drafted/executing`
