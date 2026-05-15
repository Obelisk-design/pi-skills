---
name: pi-code-gen-design
date: 2026-05-15
status: draft
---

# pi-code-gen Skill 设计文档

从 integrated DSL 生成完整 Vue 页面代码，结合项目 CLAUDE.md 约束，通过测试驱动方式确保代码质量。

---

## 一、核心决策

| 维度 | 决策 |
|------|------|
| 目标 | 结合 CLAUDE.md 约束，生成完整页面代码 |
| 测试驱动方式 | DSL 作为测试契约 |
| 冲突仲裁 | 三角仲裁（回溯 YApi/Modao） |
| 触发时机 | Phase 3 完成后自动衔接 |
| 约束来源 | 项目 CLAUDE.md |
| 验证策略 | 立即全量验证 + 迭代修正 |

---

## 二、Skill 结构

### 目录结构

```
pi-code-gen/
├── SKILL.md
└── scripts/
    └── parse-constraints.js  # 解析 CLAUDE.md 约束
```

**不内置 templates** — 模板从项目 CLAUDE.md 或模板文件引用，保持 skill 通用性。

### 元数据

```yaml
name: pi-code-gen
description: Use when generating complete Vue pages from integrated DSL with project CLAUDE.md constraints — auto-validates via pi-review and iteratively fixes until validation passes.
```

### 依赖关系

- **输入：**
  - `docs/dsl/integrated/*.dsl` — full-stack DSL
  - 目标项目 `.claude/CLAUDE.md` — 编码约束
- **调用：** `pi-review` 进行验证
- **输出：**
  - `src/views/<module>/<page>.vue` — 页面代码
  - `docs/code-gen/report.md` — 生成报告

---

## 三、核心流程

```
Step 1: 加载约束
┌─────────────────────────────────────┐
│ 读取目标项目的 CLAUDE.md             │
│ 解析编码规范、组件库、禁止事项       │
│ 输出: constraintConfig 对象          │
└────────────────┬────────────────────┘
                 ▼
Step 2: 加载 DSL
┌─────────────────────────────────────┐
│ 读取 docs/dsl/integrated/*.dsl      │
│ 按页面分组，准备生成队列             │
└────────────────┬────────────────────┘
                 ▼
Step 3: 代码生成（逐页面）
┌─────────────────────────────────────┐
│ 对每个页面 DSL:                      │
│  - 解析组件树结构                    │
│  - 应用 CLAUDE.md 约束               │
│  - 生成 Vue 页面代码                 │
│  - 写入目标路径                      │
└────────────────┬────────────────────┘
                 ▼
Step 4: 全量验证
┌─────────────────────────────────────┐
│ 调用 pi-review                       │
│ 执行四层验证                         │
│ 输出: verdict + issues 列表          │
└────────────────┬────────────────────┘
                 ▼
Step 5: 结果判断
        ┌── PASS ──→ 结束，输出报告
        │
        ├── FAIL/L2.5低 ──→ Step 6（三角仲裁）
        │
        └── 达标但非完美 ──→ 可选 Step 6
                 ▼
Step 6: 三角仲裁 + 修正
┌─────────────────────────────────────┐
│ 分析每个 issue 的错误来源:           │
│  - L1 问题 → 回溯 YApi → 修正代码   │
│  - L2.5 问题 → 回溯 Modao → 修正DSL │
│  - L2/L3 问题 → 修正代码            │
│ 重新生成/修正问题部分                │
└────────────────┬────────────────────┘
                 │
                 ▼ (迭代)
           返回 Step 4
           (最多 3 次迭代)
```

### 迭代限制

- **最大迭代次数：** 3
- **超过限制后：** 输出当前最佳状态 + 未解决问题清单，交给开发者手动处理

---

## 四、三角仲裁规则

当 pi-review 发现问题后，根据问题类型决定修正目标：

| 问题类型 | Layer | 回溯源 | 修正目标 | 说明 |
|----------|-------|--------|----------|------|
| API URL/method 错误 | L1 | YApi | 代码 | YApi 是 API 契约权威 |
| 字段命名不一致 | L1 | YApi | 代码 | 字段名以 YApi 为准 |
| 组件/字段缺失 | L2 | DSL | 代码 | DSL 是组件契约 |
| DSL 字段名 vs YApi 不一致 | L2.5 | YApi | DSL | DSL 识别错误，修正 DSL |
| DSL 字段 vs Modao 截图不匹配 | L2.5 | Modao | DSL | 重新确认 DSL |
| 布局/样式/标签与设计不符 | L3 | Modao | 代码 | UI 保真修正 |

### 仲裁执行逻辑

```
issue 分析:
  if issue.layer === "L1":
    → 查 YApi 文档确认正确值
    → 修正代码中的 API 调用
  
  if issue.layer === "L2":
    → 确认 DSL 中确实定义了该组件/字段
    → 修正代码实现
  
  if issue.layer === "L2.5":
    → 回溯上游（YApi 或 Modao）
    → 判断 DSL 是否错误
    → if DSL 错误: 修正 DSL + 重新生成代码
    → if DSL 正确: 标记为代码问题
  
  if issue.layer === "L3":
    → 查 Modao 截图确认设计
    → 修正代码中的 UI 实现
```

### 特殊情况处理

- **多个问题指向同一来源：** 合并修正，一次性解决
- **DSL 修正后：** 触发该页面的重新生成（而非全量）
- **仲裁无法判断：** 记录为 `MANUAL_FIX_REQUIRED`，跳过自动修正

---

## 五、CLAUDE.md 约束读取

### CLAUDE.md 约束格式示例

```markdown
# 项目编码约束

## 代码生成规范

### 组件库
- 表单布局：使用 `pi-form`，禁止引入新表单组件
- 表格：使用 `el-table`
- 弹窗：使用 `pi-dialog`

### 输出路径
- 页面路径：`src/views/<module>/<page>.vue`
- 组件路径：`src/components/<module>/`

### 模板引用
- 页面模板：`docs/templates/page-base.md`
- 表单模板：`docs/templates/form-block.md`

### 禁止事项
- 禁止在视图层直接调用 axios
- 禁止硬编码 API URL，必须从 services 层导入
- 禁止引入新的 UI 库（antd、vant 等）

### Hooks/Services 复用
- 表单提交：复用 `useFormSubmit` hook
- 表格数据：复用 `useTableData` hook
```

### 读取逻辑

```
Step 1: 定位 CLAUDE.md
┌─────────────────────────────────────┐
│ 从目标项目根目录读取                 │
│ .claude/CLAUDE.md 或 CLAUDE.md      │
└────────────────┬────────────────────┘
                 ▼
Step 2: 解析约束
┌─────────────────────────────────────┐
│ 提取关键约束:                        │
│  - componentRules: { form, table, dialog } │
│  - outputPaths: { page, component }  │
│  - templateRefs: { page, form, table } │
│  - forbidden: [ "axios in view", ... ] │
│  - reuseHooks: [ useFormSubmit, ... ] │
└────────────────┬────────────────────┘
                 ▼
Step 3: 加载模板（如有引用）
┌─────────────────────────────────────┐
│ 如果 templateRefs 定义了模板路径     │
│ 则从项目读取模板文件                 │
│ 否则使用通用 Vue 页面结构            │
└─────────────────────────────────────┘
```

---

## 六、输出产物

### 目录结构

```
src/views/<module>/           # 生成的页面代码
├── list.vue
├── detail.vue
└── components/
    └── search-form.vue

docs/code-gen/                # 生成报告
├── report.md                 # 验证结果 + 修正记录
└── issues-resolved.json      # 已解决的问题清单
└── issues-unresolved.json    # 需人工处理的问题
```

### report.md 结构

```markdown
# 代码生成报告

## 生成概况
- 页面数量：5
- 生成时间：2026-05-15 14:30
- 迭代次数：2

## 验证结果
| 页面 | L1 | L2 | L2.5 | L3 | Verdict |
|------|----|----|------|----|---------|
| list.vue | 100% | 92% | 95% | 88% | PASS |
| detail.vue | 100% | 90% | 92% | 85% | PASS |

## 修正记录
### 第1次迭代
- list.vue: 修正 API URL（YApi 仲裁）
- detail.vue: 补充遗漏字段（DSL 仲裁）

### 第2次迭代
- list.vue: 调整表格列顺序（Modao 仲裁）

## 未解决问题
- search-form.vue: 级联逻辑复杂，需人工处理
```

---

## 七、与 pi-workflow 集成

pi-workflow 的 Phase 4 部分更新：

```markdown
## Phase 4 — Code Generation

**Invoke:** `pi-code-gen`

**Trigger:** Phase 3 (pi-integrate-fe-be) 完成后自动触发

**Inputs:**
- `docs/dsl/integrated/` — full-stack specs
- 目标项目 `.claude/CLAUDE.md` — 编码约束

**Process:**
- 加载约束 → 加载 DSL → 生成代码 → 验证 → 仲裁修正（最多3次迭代）

**Outputs:**
- `src/views/<module>/` — 页面代码
- `docs/code-gen/report.md` — 生成报告

**Gate to Phase 5:**
- 全部页面 PASS → 自动进入 Phase 5 (pi-review 最终审查)
- 有未解决问题 → 提示开发者确认后再进入 Phase 5
```

---

## 八、边界情况处理

| 场景 | 处理方式 |
|------|----------|
| CLAUDE.md 不存在 | 使用通用 Vue 规范，警告提示 |
| 模板文件不存在 | 使用默认结构，警告提示 |
| DSL 文件缺失 | 报错终止，提示先运行 Phase 2-3 |
| 迭代次数耗尽 | 输出当前状态 + 未解决清单 |
| YApi/Modao 无法访问 | 标记仲裁失败，需人工判断 |

---

## 九、验证阈值

继承 pi-review 的验证阈值：

| Layer | 阈值 | 说明 |
|-------|------|------|
| L1 (API) | 100% | BLOCKING，必须满分 |
| L2 (DSL) | ≥90% | MAJOR，达标可 PASS |
| L2.5 (DSL vs Modao) | ≥90% | MAJOR，DSL准确性 |
| L3 (UI) | ≥80% | MINOR，UI保真 |

**PASS 条件：** L1=100% AND L2≥90% AND L2.5≥90% AND L3≥80%

---

## 十、下一步

设计完成后，调用 `writing-plans` skill 创建详细实现计划。