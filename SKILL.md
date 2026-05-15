---
name: pi-skills
description: Use when orchestrating the full pi-skills pipeline end-to-end — from design capture through code review — coordinates pi-yapi, pi-modao-capture, pi-fe-view-dsl-engine, pi-be-data-dsl-engine, pi-integrate-fe-be, and pi-review in strict sequence with triangular cross-validation.
---

# PI-Skills — 前端开发全流程管理技能集合

从设计原型到代码审查的完整开发链路，支持三角交叉验证确保代码质量。

---

## 快速开始

### 安装（30秒）

在 Claude Code 中粘贴以下命令：

```bash
git clone --single-branch --depth 1 https://github.com/Obelisk-design/pi-skills.git ~/.claude/skills/pi-skills && cd ~/.claude/skills/pi-skills && ./setup
```

### 可用技能

| 技能 | 用途 | 触发命令 |
|------|------|----------|
| pi-modao-capture | 墨刀原型截图捕获 | `/pi-modao-capture` |
| pi-yapi | YApi接口文档导出 | `/pi-yapi` |
| pi-fe-view-dsl-engine | 前端视图DSL生成 | `/pi-fe-view-dsl-engine` |
| pi-be-data-dsl-engine | 后端数据DSL生成 | `/pi-be-data-dsl-engine` |
| pi-integrate-fe-be | DSL集成合并 | `/pi-integrate-fe-be` |
| pi-code-gen | DSL到代码生成+验证循环 | `/pi-code-gen` |
| pi-review | 三角交叉验证代码审查 | `/pi-review` |
| pi-workflow | 完整工作流编排 | `/pi-workflow` |

---

## 工作流程

```
Phase 1: 设计捕获（并行）
┌───────────────────┐     ┌───────────────────┐
│ pi-modao-capture  │     │    pi-yapi        │
│ 墨刀原型截图      │     │ YApi接口文档      │
└───────────────────┘     └───────────────────┘
           ↓                       ↓
Phase 2: DSL生成（并行）
┌───────────────────┐     ┌───────────────────┐
│ pi-fe-view-dsl    │     │ pi-be-data-dsl    │
│ 前端组件树DSL     │     │ 后端数据DSL       │
└───────────────────┘     └───────────────────┘
           ↓                       ↓
Phase 3: DSL集成
┌───────────────────────────────────────────┐
│           pi-integrate-fe-be              │
│     合成全栈DSL（组件绑定API）            │
└───────────────────────────────────────────┘
                    ↓
Phase 4: 代码生成
┌───────────────────────────────────────────┐
│           pi-code-gen                      │
│  从DSL生成代码+自动验证+迭代修正           │
└───────────────────────────────────────────┘
                    ↓
Phase 5: 三角交叉验证审查
┌───────────────────────────────────────────┐
│           pi-review                       │
│  四层验证：API > DSL > DSL准确性 > UI     │
└───────────────────────────────────────────┘
```

---

## 三角交叉验证架构

```
        Modao截图（设计源）
           ↑
          / │
         /  │
  L3:   /    │ L2.5
 Code  /      │ DSL
 vs   /        │ vs
Modao          │ Modao
    ↓          ↓
   Code ←──── DSL（L2）
```

| 层级 | 对比关系 | 作用 |
|------|----------|------|
| Layer 1 | Code ↔ YApi | API合规验证 |
| Layer 2 | Code ↔ DSL | DSL合规验证 |
| Layer 2.5 | DSL ↔ Modao | DSL准确性验证 |
| Layer 3 | Code ↔ Modao | UI保真验证 |

---

## 输出目录结构

```
docs/
├── modao/                 # Phase 1输出
│   ├── screenshots/
│   └── *.md
├── yapi/                  # Phase 1输出
│   └── {项目名}/
├── dsl/                   # Phase 2-3输出
│   ├── frontend/
│   ├── backend/
│   └── integrated/
└── review/                # Phase 5输出
    └── review-report.md
```

---

## 详细文档

- [README.md](./README.md) — 完整文档
- [README-CN.md](./pi-workflow/README-CN.md) — 中文简介
- [DSL价值分析](./docs/dsl-value-analysis.md) — DSL中间层价值
- [DSL错误分析](./docs/dsl-error-analysis.md) — DSL生成错误处理
- [三角验证分析](./docs/triangular-validation-analysis.md) — 交叉验证原理

---

## 依赖项

- Claude Code CLI
- Node.js >= 18.0.0
- Git
- YApi 平台访问权限（如需使用 pi-yapi）
- 墨刀原型分享链接（如需使用 pi-modao-capture）