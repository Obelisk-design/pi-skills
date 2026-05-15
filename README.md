# PI-Skills

> 前端开发全流程管理 AI 技能集合 — 从设计原型捕获到代码审查的完整开发链路

## 概述

PI-Skills 是一套用于前端开发全流程管理的 AI 辅助技能集合，覆盖从设计原型捕获到代码审查的完整开发链路。

**核心特性：**
- 🎨 **设计捕获** — 从墨刀原型自动提取页面截图和标注
- 📋 **API导出** — 从YApi平台导出接口文档
- 📝 **DSL生成** — 自动生成前端组件树DSL和后端数据DSL
- 🔗 **DSL集成** — 合成全栈DSL，绑定组件与API
- ✅ **三角验证** — 四层交叉验证确保代码质量
- 🔄 **工作流编排** — 自动协调所有技能按序执行

---

## 安装

### 方式一：Git Clone（推荐）

```bash
git clone --single-branch --depth 1 https://github.com/Obelisk-design/pi-skills.git ~/.claude/skills/pi-skills && cd ~/.claude/skills/pi-skills && ./setup
```

### 方式二：手动安装

1. 下载本仓库到 `~/.claude/skills/pi-skills/`
2. 运行 `./setup` 安装脚本
3. 在项目 CLAUDE.md 中添加技能引用

---

## 技能列表

| 技能 | 用途 | 触发命令 | 详细文档 |
|------|------|----------|----------|
| pi-modao-capture | 墨刀原型截图捕获 | `/pi-modao-capture` | [skill-pi-modao-capture.md](docs/skill-pi-modao-capture.md) |
| pi-yapi | YApi接口文档导出 | `/pi-yapi` | [skill-pi-yapi.md](docs/skill-pi-yapi.md) |
| pi-fe-view-dsl-engine | 前端视图DSL生成 | `/pi-fe-view-dsl-engine` | [skill-pi-fe-view-dsl-engine.md](docs/skill-pi-fe-view-dsl-engine.md) |
| pi-be-data-dsl-engine | 后端数据DSL生成 | `/pi-be-data-dsl-engine` | [skill-pi-be-data-dsl-engine.md](docs/skill-pi-be-data-dsl-engine.md) |
| pi-integrate-fe-be | DSL集成合并 | `/pi-integrate-fe-be` | [skill-pi-integrate-fe-be.md](docs/skill-pi-integrate-fe-be.md) |
| pi-review | 三角交叉验证代码审查 | `/pi-review` | [skill-pi-review.md](docs/skill-pi-review.md) |
| pi-workflow | 完整工作流编排 | `/pi-workflow` | [skill-pi-workflow.md](docs/skill-pi-workflow.md) |

---

## 工作流程

```
Phase 1: 设计捕获
    ↓
Phase 2: DSL生成
    ↓
Phase 3: DSL集成
    ↓
Phase 4: 代码生成
    ↓
Phase 5: 三角验证审查
```

详细流程图见 [README-CN.md](./pi-workflow/README-CN.md)

---

## 三角交叉验证

```
        Modao（设计源）
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

**核心价值：**
- 单链路对比遗漏"两者都错"的情况
- 三角验证可发现DSL或Code的独立错误
- Layer 2.5专门检测DSL生成阶段的识别偏差

详见 [三角验证分析](./docs/triangular-validation-analysis.md)

---

## 目录结构

```
pi-skills/
├── pi-modao-capture/      # 墨刀捕获技能
│   └── SKILL.md
│   └── scripts/
├── pi-yapi/               # YApi导出技能
│   └── SKILL.md
├── pi-fe-view-dsl-engine/ # 前端DSL技能
│   └── SKILL.md
│   └── scripts/
├── pi-be-data-dsl-engine/ # 后端DSL技能
│   └── SKILL.md
│   └── scripts/
├── pi-integrate-fe-be/    # DSL集成技能
│   └── SKILL.md
│   └── scripts/
├── pi-review/             # 代码审查技能
│   └── SKILL.md
│   └── scripts/
│       └── dsl-compare.js
├── pi-workflow/           # 工作流编排
│   └── SKILL.md
│   └── README-CN.md
├── docs/                  # 文档
│   ├── skill-*.md         # 技能说明文档
│   ├── dsl-value-analysis.md
│   ├── dsl-error-analysis.md
│   ├── triangular-validation-analysis.md
│   └── PUBLISH-GUIDE.md   # 发布指南
├── scripts/               # 安装脚本
├── SKILL.md               # 入口技能
├── README.md              # 本文档
├── VERSION                # 版本号
├── setup                  # 安装脚本
└── package.json           # npm配置
```

---

## 文档索引

### 技能说明文档

| 文档 | 说明 |
|------|------|
| [skill-pi-modao-capture.md](docs/skill-pi-modao-capture.md) | 墨刀原型捕获技能详细说明 |
| [skill-pi-yapi.md](docs/skill-pi-yapi.md) | YApi接口导出技能详细说明 |
| [skill-pi-fe-view-dsl-engine.md](docs/skill-pi-fe-view-dsl-engine.md) | 前端DSL生成技能详细说明 |
| [skill-pi-be-data-dsl-engine.md](docs/skill-pi-be-data-dsl-engine.md) | 后端DSL生成技能详细说明 |
| [skill-pi-integrate-fe-be.md](docs/skill-pi-integrate-fe-be.md) | DSL集成技能详细说明 |
| [skill-pi-review.md](docs/skill-pi-review.md) | 三角验证审查技能详细说明 |
| [skill-pi-workflow.md](docs/skill-pi-workflow.md) | 工作流编排技能详细说明 |

### 分析报告文档

| 文档 | 说明 |
|------|------|
| [dsl-value-analysis.md](docs/dsl-value-analysis.md) | DSL中间层价值分析 |
| [dsl-error-analysis.md](docs/dsl-error-analysis.md) | DSL生成错误分析与应对 |
| [triangular-validation-analysis.md](docs/triangular-validation-analysis.md) | 三角交叉验证原理分析 |

---

## 版本管理

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2025-05-15 | 初始版本，包含7个核心技能 |

---

## 许可证

MIT License

---

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/new-skill`)
3. 提交变更 (`git commit -m 'Add new skill'`)
4. 推送到分支 (`git push origin feature/new-skill`)
5. 创建 Pull Request

---

## 支持

- 问题反馈：GitHub Issues
- 功能建议：GitHub Discussions