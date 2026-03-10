# Yamen Phase 1 Runbook

这是 Yamen 接入 OpenClaw 的第一阶段运行手册。

## 目标

不做独立后端，不做 dashboard，不做自动调度器。
先让主会话能够稳定按 Yamen 规则运行。

## 运行方式

- 主会话 = 门房 + 县令
- 主簿 / 快手 / 典史 = 按需调用

## 最小执行闭环

1. 主会话读规则
2. 主会话整理请求
3. 主会话选择模式
4. 按模式调用支持角色
5. 主会话汇总回禀

## 检查清单

- [ ] 能读取 `config/bootstrap.json`
- [ ] 能读取 `config/entrypoint.md`
- [ ] 能按 `routing.json` 选择模式
- [ ] 能按需调用 `zhubu / kuaishou / dianshi`
- [ ] 交接文本遵循 `contracts/handoff.md`
- [ ] 回禀由主会话统一输出
