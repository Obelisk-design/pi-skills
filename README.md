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

### 1. pi-modao-capture

从墨刀原型分享链接提取页面截图和标注。

```bash
/pi-modao-capture --url "https://modao.cc/proto/xxx/sharing" --password "可选密码"
```

**输出：**
- `docs/modao/screenshots/*.png`
- `docs/modao/*.md`

---

### 2. pi-yapi

从YApi平台导出接口文档到本地项目。

```bash
/pi-yapi http://10.0.53.135/project/xxx/interface/api/cat_xxx
```

**输出：**
- `docs/yapi/{项目名}/README.md`
- `docs/yapi/{项目名}/{ID}_{标题}.md`

---

### 3. pi-fe-view-dsl-engine

将墨刀截图转化为前端组件树DSL。

**输入：** `docs/modao/`

**输出：**
- `docs/dsl/frontend/{页面}.dsl`

---

### 4. pi-be-data-dsl-engine

将YApi接口转化为数据转换DSL。

**输入：** `docs/yapi/`

**输出：**
- `docs/dsl/backend/{接口}.dsl`

---

### 5. pi-integrate-fe-be

合成前端视图DSL和后端数据DSL。

**输入：** `docs/dsl/frontend/` + `docs/dsl/backend/`

**输出：**
- `docs/dsl/integrated/{页面}.dsl`

---

### 6. pi-review

四层交叉验证生成的代码。

```bash
/pi-review
```

**验证层级：**

| 层级 | 对比 | 优先级 | 阈值 |
|------|------|--------|------|
| Layer 1 | Code ↔ YApi | 阻塞级 | 100% |
| Layer 2 | Code ↔ DSL | 主要级 | ≥90% |
| Layer 2.5 | DSL ↔ Modao | 主要级 | ≥90% |
| Layer 3 | Code ↔ Modao | 次要级 | ≥80% |

---

### 7. pi-workflow

协调所有技能按序执行的编排器。

```bash
/pi-workflow
```

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
├── pi-be-data-dsl-engine/ # 后端DSL技能
│   └── SKILL.md
├── pi-integrate-fe-be/    # DSL集成技能
│   └── SKILL.md
├── pi-review/             # 代码审查技能
│   └── SKILL.md
│   └── scripts/
│       └── dsl-compare.js
├── pi-workflow/           # 工作流编排
│   └── SKILL.md
│   └── README-CN.md
├── docs/                  # 文档
├── scripts/               # 安装脚本
├── SKILL.md               # 入口技能
├── README.md              # 本文档
├── VERSION                # 版本号
├── setup                  # 安装脚本
└── package.json           # npm配置
```

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