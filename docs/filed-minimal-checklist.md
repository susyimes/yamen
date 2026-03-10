# Filed Minimal Checklist

最小 filed 验收顺序：

1. `node runtime/orchestrator.js create runtime/sample-request.filed.json`
2. `node runtime/orchestrator.js step <case_id> classify_request`
3. `node runtime/orchestrator.js step <case_id> open_filed_case`
4. `node runtime/orchestrator.js step <case_id> draft_case_note`
5. 用 `node runtime/openclaw-bridge-relay.js list/show` 读取 request
6. 用 OpenClaw 角色 session 生成 `zhubu` JSON，写回 response
7. 再执行 `draft_case_note`，让案件进入 `drafted`
8. `node runtime/orchestrator.js step <case_id> execute_task`
9. 用 OpenClaw 角色 session 生成 `kuaishou` JSON，写回 response
10. 再执行 `execute_task` / `submit_result`，直到案件进入 `done`

验收完成标志：
- case 归档到 `cases/archive/`
- `status = done`
- 至少存在主簿任务单与快手结果产物
