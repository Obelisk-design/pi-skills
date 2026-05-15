# pi-workflow 技能说明

## 一、概述

pi-workflow 是全流程编排器，协调 PI-Skills 家族的所有技能按严格顺序执行。它从设计捕获开始，经过 DSL 生成、集成，到代码审查结束，实现从原型到代码的完整交付链路。

**核心价值：**
- 自动编排 7 个技能的执行顺序
- 并行执行无依赖的阶段，提升效率
- 提供阶段状态报告，便于追踪进度
- 失败恢复机制，支持从断点继续

---

## 二、流程概览

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
│   开发者/工具基于DSL生成Vue页面代码       │
└───────────────────────────────────────────┘
                    ↓
Phase 5: 三角交叉验证审查
┌───────────────────────────────────────────┐
│           pi-review                       │
│  四层验证：API > DSL > DSL准确性 > UI     │
└───────────────────────────────────────────┘
```

---

## 三、各阶段说明

### Phase 1：设计 & API 捕获（并行）

两个阶段独立执行，可同时进行。

#### 1a. 设计捕获

**执行：** `pi-modao-capture`

**产出：**
- `docs/modao/screenshots/` — 页面截图
- `docs/modao/annotations/` — 页面标注
- `docs/modao/index.md` — 页面层级

**入口条件：**
- 墨刀分享链接可用
- 密码（如需要）

**失败处理：**
- 截图生成失败 → 检查链接有效性
- 页面层级不完整 → 手动补充

#### 1b. API 捕获

**执行：** `pi-yapi`

**产出：**
- `docs/yapi/{project}/README.md` — 接口索引
- `docs/yapi/{project}/{id}_{title}.md` — 接口详情

**入口条件：**
- YApi Cookie 有效
- 项目/分类 ID 可用

**失败处理：**
- Cookie 过期 → 刷新 `~/.yapi_cookie_raw.txt`
- 无接口 → 检查分类 ID

---

### Phase 2：DSL 生成（并行）

依赖 Phase 1 产出，两个 DSL 引擎独立运行。

#### 2a. 前端视图 DSL

**执行：** `pi-fe-view-dsl-engine`

**输入：** `docs/modao/`

**产出：**
- `docs/dsl/frontend/{page}.dsl` — 组件树 DSL
- `docs/dsl/frontend/index.md` — DSL 索引

**验证：**
- 每个页面都有对应 DSL
- 所有标注字段出现在 DSL
- 数据绑定使用 `${api.X}` 占位符

#### 2b. 后端数据 DSL

**执行：** `pi-be-data-dsl-engine`

**输入：** `docs/yapi/{project}/`

**产出：**
- `docs/dsl/backend/{interface}.dsl` — 数据转换 DSL
- `docs/dsl/backend/README.md` — DSL 索引

**验证：**
- 每个接口都有 DSL
- required 字段标注正确
- 枚举值保留

---

### Phase 3：集成

依赖 Phase 2 产出，前后端 DSL 必须都存在。

**执行：** `pi-integrate-fe-be`

**输入：**
- `docs/dsl/frontend/` — 前端组件树
- `docs/dsl/backend/` — 后端数据定义

**产出：**
- `docs/dsl/integrated/{page}.dsl` — 全栈集成 DSL
- `docs/dsl/integrated/index.md` — 集成摘要

**验证：**
- 每个组件绑定 API（或标记 TBD）
- 每个 API 被消费（或标记 unused）
- 双向一致性验证

---

### Phase 4：代码生成

开发者或工具基于 DSL 生成代码。

**输入：**
- `docs/dsl/integrated/` — 全栈规格
- `docs/dsl/frontend/` — 详细组件树
- `docs/dsl/backend/` — 数据校验规则

**约定：**
- 使用项目现有 UI 组件库
- 不引入新依赖
- 复用现有 hooks 和 services

---

### Phase 5：审查

依赖 Phase 4 生成的代码及所有上游产物。

**执行：** `pi-review`

**输入：**
- 生成的代码文件
- `docs/yapi/` — API 合约
- `docs/dsl/frontend/` — DSL 定义
- `docs/modao/` — 设计参考

**验证架构：**
- Layer 1：Code ↔ YApi（阻塞级）
- Layer 2：Code ↔ DSL（主要级）
- Layer 2.5：DSL ↔ Modao（诊断层）
- Layer 3：Code ↔ Modao（次要级）

**产出：**
- `docs/review/review-report.md` — 审查报告
- `docs/review/dsl-check.json` — 自动化对比结果

**判定：**
- PASS → 允许提交
- FAIL → 阻断提交
- NEEDS_REVISION → 带警告提交
- DSL_REGENERATE → 重生成 DSL

---

## 四、使用方式

### 快速启动

用户说"启动工作流"、"执行完整流程"：

1. 确认用户有：
   - 墨刀分享链接
   - YApi 项目/分类信息
2. 并行执行 Phase 1a 和 1b
3. 按序执行后续阶段
4. 每阶段完成后报告状态

### 阶段状态报告

```
=== Phase 1 Complete ===
✅ pi-modao-capture: 12 pages captured
✅ pi-yapi: 8 interfaces exported

=== Phase 2 Complete ===
✅ pi-fe-view-dsl-engine: 12 DSL files generated
✅ pi-be-data-dsl-engine: 8 DSL files generated

=== Phase 3 Complete ===
✅ pi-integrate-fe-be: 12 integrated DSL files
⚠️  3 components with TBD bindings

=== Phase 4: Manual ===
⏳ Waiting for code generation...

=== Phase 5 Complete ===
✅ pi-review: PASS
```

---

## 五、失败恢复

| 失败点 | 恢复方法 |
|--------|----------|
| 墨刀链接过期 | 获取新分享链接 |
| YApi Cookie 过期 | 刷新 `~/.yapi_cookie_raw.txt` |
| DSL（前端）缺失 | 重运行 pi-fe-view-dsl-engine |
| DSL（后端）缺失 | 重运行 pi-be-data-dsl-engine |
| 审查 FAIL | 修复问题后重运行 pi-review |
| 集成缺口 | 标记 TBD，后续人工解决 |

---

## 六、最佳实践

### 1. 并行执行

Phase 1 和 Phase 2 的两个分支可并行，节省时间。

### 2. 分阶段验证

每阶段完成后验证产出，避免问题累积。

### 3. TBD 标记

集成阶段大量使用 TBD 标记，随 API 稳定逐步解析。

### 4. 代码生成约定

遵循项目现有约定，不引入新依赖。

### 5. 审查顺序

严格按 Layer 顺序审查，下层失败阻断上层。

---

## 七、常见问题

### Q1: Phase 1 失败？

**解决：** 检查墨刀链接和 YApi Cookie，修复后重运行。

### Q2: DSL 生成不完整？

**解决：** 确认 Phase 1 输出完整，重运行 DSL 引擎。

### Q3: 集成阶段大量 TBD？

**解决：** 正常现象，随 API 稳定逐步解析，或人工标注绑定。

### Q4: 审查返回 DSL_REGENERATE？

**解决：** DSL 生成阶段出错，重生成 DSL 和代码。

---

## 八、技能依赖关系

```
pi-modao-capture ──→ pi-fe-view-dsl-engine ──┐
                                              ├──→ pi-integrate-fe-be ──→ Code ──→ pi-review
pi-yapi ───────────→ pi-be-data-dsl-engine ──┘
```

---

## 九、完整输出目录

```
docs/
├── modao/                     # Phase 1 输出
│   ├── screenshots/
│   └── annotations/
│
├── yapi/                      # Phase 1 输出
│   └── {project}/
│
├── dsl/                       # Phase 2-3 输出
│   ├── frontend/
│   ├── backend/
│   └── integrated/
│
└── review/                    # Phase 5 输出
    ├── review-report.md
    └── dsl-check.json
```