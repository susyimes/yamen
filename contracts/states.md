# Case States

建议最小状态集：

- `received`：已受理
- `triaged`：已分流
- `accepted`：已立案
- `drafted`：任务单已生成
- `executing`：执行中
- `review_pending`：待复核
- `returned`：退回修正
- `done`：已结案
- `cancelled`：已取消

## 状态说明

- 门房负责推动 `received -> triaged`
- 县令负责推动 `triaged -> accepted`
- 主簿负责推动 `accepted -> drafted`
- 快手负责推动 `drafted -> executing`
- 典史负责 `executing -> review_pending -> done/returned`
