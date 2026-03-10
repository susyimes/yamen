# Request / Case Schema

## 建议基础字段

- `case_id`
- `title`
- `summary`
- `raw_request`
- `source`
- `priority`：低 / 中 / 高
- `risk_level`：低 / 中 / 高
- `mode`：direct / filed / reviewed
- `status`
- `owner_agent`
- `needs_review`
- `artifacts`
- `flow_log`

## 说明

Yamen MVP 阶段不要求完整数据库实现，但所有 Agent 基础设施应围绕这些字段思考输出。
