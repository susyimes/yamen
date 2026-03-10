# Filed Minimal Checklist

最小 filed 验收顺序：

1. `node runtime/orchestrator.js create runtime/sample-request.filed.json`
2. `node runtime/orchestrator.js step <case_id> classify_request`
3. `node runtime/orchestrator.js step <case_id> open_filed_case`
4. `node runtime/orchestrator.js step <case_id> draft_case_note`
5. 用 `node runtime/openclaw-bridge-relay.js next` 看当前 pending request 与推荐下一步
6. 用 `node runtime/openclaw-bridge-relay.js scaffold-json <request-file>` 生成标准 response JSON 骨架
7. 用 OpenClaw 角色 session 生成 `zhubu` / `kuaishou` JSON
8. 可直接粘贴 JSON：`node runtime/openclaw-bridge-relay.js write-response-stdin <request-file>`
9. 用 `node runtime/openclaw-bridge-relay.js step-filed <case_id>` 看当前 filed 推荐推进动作
10. 再执行对应的 orchestrator step，重复直到案件进入 `done`

验收完成标志：
- case 归档到 `cases/archive/`
- `status = done`
- 至少存在主簿任务单与快手结果产物
