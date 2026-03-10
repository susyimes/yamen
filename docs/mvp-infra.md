# Yamen MVP - Agent Infrastructure

本阶段只搭建 Agent 基础设施，不包含后端 API / 数据库存储 / 前端页面。

## 已搭建内容

- `agents/`：各角色 SOUL 骨架
- `contracts/`：输入输出契约、状态、权限、交接格式
- `cases/templates/`：三档流程案件模板
- `AGENTS.md`：整体系统规则

## 角色列表

- 门房 `menfang`
- 县令 `xianling`
- 主簿 `zhubu`
- 快手 `kuaishou`
- 典史 `dianshi`
- 账房 `zhangfang`（可选）

## 下一步推荐

1. 建 `config/agents.json`，把角色注册成可读配置
2. 建最小 case 状态机实现
3. 建命令行或 API 驱动的流转入口
4. 再补 FastAPI / SQLite / 简页面
