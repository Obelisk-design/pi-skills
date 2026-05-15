# pi-code-gen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create pi-code-gen skill that generates Vue pages from integrated DSL with CLAUDE.md constraints, validates via pi-review, and iteratively fixes until PASS.

**Architecture:** Single skill with parse-constraints.js script, invokes pi-review for validation, triangular arbitration for error resolution, max 3 iterations.

**Tech Stack:** Node.js, Vue.js, pi-review integration

---

## File Structure

```
pi-code-gen/
├── SKILL.md                      # Skill 主文件，定义流程和仲裁规则
└── scripts/
    └── parse-constraints.js      # 解析 CLAUDE.md 提取约束配置
```

**Integration points:**
- pi-workflow Phase 4 调用 pi-code-gen
- pi-code-gen 调用 pi-review 进行验证

---

### Task 1: Create parse-constraints.js Script

**Files:**
- Create: `pi-code-gen/scripts/parse-constraints.js`
- Test: `pi-code-gen/scripts/test-parse-constraints.js`

- [ ] **Step 1: Write the failing test**

Create test file with sample CLAUDE.md content and expected output structure.

```javascript
// pi-code-gen/scripts/test-parse-constraints.js
const parseConstraints = require('./parse-constraints');

// 测试用例 1: 完整约束配置
const claudeMdFull = `
# 项目编码约束

## 代码生成规范

### 组件库
- 表单布局：使用 \`pi-form\`，禁止引入新表单组件
- 表格：使用 \`el-table\`
- 弹窗：使用 \`pi-dialog\`

### 输出路径
- 页面路径：\`src/views/<module>/<page>.vue\`
- 组件路径：\`src/components/<module>/\`

### 模板引用
- 页面模板：\`docs/templates/page-base.md\`
- 表单模板：\`docs/templates/form-block.md\`

### 禁止事项
- 禁止在视图层直接调用 axios
- 禁止硬编码 API URL，必须从 services 层导入
- 禁止引入新的 UI 库（antd、vant 等）

### Hooks/Services 复用
- 表单提交：复用 \`useFormSubmit\` hook
- 表格数据：复用 \`useTableData\` hook
`;

const result = parseConstraints(claudeMdFull);

// 验证解析结果
console.assert(result.componentRules.form === 'pi-form', 'Form component should be pi-form');
console.assert(result.componentRules.table === 'el-table', 'Table component should be el-table');
console.assert(result.componentRules.dialog === 'pi-dialog', 'Dialog component should be pi-dialog');
console.assert(result.outputPaths.page === 'src/views/<module>/<page>.vue', 'Page path should match');
console.assert(result.outputPaths.component === 'src/components/<module>/', 'Component path should match');
console.assert(result.templateRefs.page === 'docs/templates/page-base.md', 'Page template should match');
console.assert(result.templateRefs.form === 'docs/templates/form-block.md', 'Form template should match');
console.assert(result.forbidden.includes('axios in view'), 'Forbidden axios in view');
console.assert(result.forbidden.includes('hardcoded API URL'), 'Forbidden hardcoded API URL');
console.assert(result.reuseHooks.includes('useFormSubmit'), 'Reuse useFormSubmit hook');
console.assert(result.reuseHooks.includes('useTableData'), 'Reuse useTableData hook');

console.log('Test 1: Full constraints - PASS');

// 测试用例 2: 空输入
const resultEmpty = parseConstraints('');
console.assert(Object.keys(resultEmpty.componentRules).length === 0, 'Empty input should return empty rules');
console.log('Test 2: Empty input - PASS');

// 测试用例 3: 部分约束
const claudeMdPartial = `
### 组件库
- 表单：使用 \`pi-form\`
`;
const resultPartial = parseConstraints(claudeMdPartial);
console.assert(resultPartial.componentRules.form === 'pi-form', 'Partial form rule should work');
console.assert(!resultPartial.componentRules.table, 'Table should not be defined');
console.log('Test 3: Partial constraints - PASS');

console.log('\nAll tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node pi-code-gen/scripts/test-parse-constraints.js`
Expected: Error - `Cannot find module './parse-constraints'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// pi-code-gen/scripts/parse-constraints.js
/**
 * Parse CLAUDE.md to extract code generation constraints
 *
 * @param {string} content - CLAUDE.md file content
 * @returns {Object} - constraintConfig object
 */

function parseConstraints(content) {
  const config = {
    componentRules: {},
    outputPaths: {},
    templateRefs: {},
    forbidden: [],
    reuseHooks: [],
  };

  if (!content || content.trim() === '') {
    return config;
  }

  // 解析组件库规则
  // 格式: - 表单布局：使用 `pi-form`
  const componentPatterns = {
    form: /表单[^：]*：\s*使用\s*`([^`]+)`/i,
    table: /表格[^：]*：\s*使用\s*`([^`]+)`/i,
    dialog: /弹窗[^：]*：\s*使用\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(componentPatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.componentRules[key] = match[1];
    }
  }

  // 解析输出路径
  // 格式: - 页面路径：`src/views/<module>/<page>.vue`
  const pathPatterns = {
    page: /页面路径[^：]*：\s*`([^`]+)`/i,
    component: /组件路径[^：]*：\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(pathPatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.outputPaths[key] = match[1];
    }
  }

  // 解析模板引用
  // 格式: - 页面模板：`docs/templates/page-base.md`
  const templatePatterns = {
    page: /页面模板[^：]*：\s*`([^`]+)`/i,
    form: /表单模板[^：]*：\s*`([^`]+)`/i,
    table: /表格模板[^：]*：\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(templatePatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.templateRefs[key] = match[1];
    }
  }

  // 解析禁止事项
  // 格式: - 禁止在视图层直接调用 axios
  const forbiddenPattern = /禁止[^。，\n]+/g;
  const forbiddenMatches = content.matchAll(forbiddenPattern);
  for (const match of forbiddenMatches) {
    const text = match[0].replace(/^禁止/, '').trim();
    config.forbidden.push(text);
  }

  // 解析 Hooks/Services 复用
  // 格式: - 表单提交：复用 `useFormSubmit` hook
  const hookPattern = /复用\s*`([^`]+)`\s*hook/gi;
  const hookMatches = content.matchAll(hookPattern);
  for (const match of hookMatches) {
    config.reuseHooks.push(match[1]);
  }

  return config;
}

module.exports = parseConstraints;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node pi-code-gen/scripts/test-parse-constraints.js`
Expected: `All tests passed!`

- [ ] **Step 5: Commit**

```bash
git add pi-code-gen/scripts/parse-constraints.js pi-code-gen/scripts/test-parse-constraints.js
git commit -m "feat(pi-code-gen): add parse-constraints.js script with tests"
```

---

### Task 2: Create SKILL.md - Part 1: Metadata and Inputs

**Files:**
- Create: `pi-code-gen/SKILL.md`

- [ ] **Step 1: Write metadata and input sections**

```markdown
---
name: pi-code-gen
description: Use when generating complete Vue pages from integrated DSL with project CLAUDE.md constraints — auto-validates via pi-review and iteratively fixes until validation passes.
---

# pi-code-gen — DSL to Code Generation with TDD

从 integrated DSL 生成完整 Vue 页面代码，结合项目 CLAUDE.md 约束，通过测试驱动方式确保代码质量。

---

## Overview

`pi-code-gen` 是 pi-skills 流程的 **Phase 4**，负责：
- 从 integrated DSL 生成页面代码
- 应用项目 CLAUDE.md 约束
- 自动调用 pi-review 验证
- 三角仲裁修正错误
- 迭代直到验证通过

---

## When to Use

Trigger this skill when:
- Phase 3 (pi-integrate-fe-be) 完成
- 用户请求生成代码 `/pi-code-gen`
- 需要重新生成某个页面的代码

---

## Inputs

| Input | Location | Purpose |
|-------|----------|---------|
| Integrated DSL | `docs/dsl/integrated/*.dsl` | Full-stack spec with API bindings |
| Project CLAUDE.md | `.claude/CLAUDE.md` or `CLAUDE.md` | Encoding constraints |
| YApi docs | `docs/yapi/` | API contract reference (for arbitration) |
| Modao screenshots | `docs/modao/` | Design reference (for arbitration) |
```

- [ ] **Step 2: Write constraints loading section**

```markdown
---

## Step 1: Load Constraints

**Process:**

1. Locate CLAUDE.md in target project
   - Check `.claude/CLAUDE.md` first
   - Fallback to `CLAUDE.md` in project root

2. Parse constraints using `parse-constraints.js`:
   ```bash
   node ~/.claude/skills/pi-code-gen/scripts/parse-constraints.js --claude-md <path>
   ```

3. Extract constraint config:
   - `componentRules`: { form, table, dialog }
   - `outputPaths`: { page, component }
   - `templateRefs`: { page, form, table }
   - `forbidden`: [ "axios in view", ... ]
   - `reuseHooks`: [ useFormSubmit, ... ]

4. Load template files if referenced

**Fallback:** If CLAUDE.md missing, use generic Vue conventions:
- Form: `el-form` or `pi-form`
- Table: `el-table`
- Dialog: `el-dialog`
- Output: `src/views/`
```

- [ ] **Step 3: Commit this part**

```bash
git add pi-code-gen/SKILL.md
git commit -m "feat(pi-code-gen): add SKILL.md metadata and inputs section"
```

---

### Task 3: Create SKILL.md - Part 2: Code Generation Logic

**Files:**
- Modify: `pi-code-gen/SKILL.md`

- [ ] **Step 1: Add DSL loading and generation sections**

```markdown
---

## Step 2: Load DSL

**Process:**

1. Read all integrated DSL files from `docs/dsl/integrated/`
2. Group by page:
   ```
   pages/
   ├── list.dsl → list.vue
   ├── detail.dsl → detail.vue
   └── add.dsl → add.vue
   ```
3. For each DSL, extract:
   - Component tree structure
   - Field definitions with types
   - API bindings (`${api.xxx.yyy}`)
   - Actions and event handlers

---

## Step 3: Generate Code (Per Page)

**For each page DSL:**

1. **Parse component structure:**
   - `form "SearchForm" { ... }` → Search form component
   - `table "DataTable" { ... }` → Data table component
   - `modal "EditModal" { ... }` → Edit dialog component

2. **Apply CLAUDE.md constraints:**
   - Use specified component library
   - Follow output path template
   - Avoid forbidden patterns
   - Reuse hooks/services

3. **Generate Vue file:**

```vue
<template>
  <!-- Generate template from DSL component tree -->
</template>

<script>
// Generate imports, hooks, methods from DSL
</script>

<style scoped>
/* Minimal scoped styles if needed */
</style>
```

4. **Key transformations:**
   - DSL field `{ key: "fieldName", type: "input" }` → `<el-input v-model="formData.fieldName" />`
   - DSL field `{ key: "status", type: "select", options: [...] }` → `<el-select v-model="formData.status">...`
   - DSL binding `dataSource: ${api.user.list}` → `import { userList } from '@/services/user'`
   - DSL action `{ key: "submit", action: "handleSubmit" }` → `@click="handleSubmit"`

**Output:** Write generated code to `src/views/<module>/<page>.vue`
```

- [ ] **Step 2: Commit**

```bash
git add pi-code-gen/SKILL.md
git commit -m "feat(pi-code-gen): add DSL loading and code generation sections"
```

---

### Task 4: Create SKILL.md - Part 3: Validation Loop

**Files:**
- Modify: `pi-code-gen/SKILL.md`

- [ ] **Step 1: Add validation and arbitration sections**

```markdown
---

## Step 4: Validation

**Invoke pi-review:**

```bash
/pi-review --code-dir src/views/<module>/ --dsl-dir docs/dsl/integrated/
```

**Parse review output:**
- Layer 1 score: API compliance (100% required)
- Layer 2 score: DSL compliance (≥90% required)
- Layer 2.5 score: DSL accuracy (≥90% required)
- Layer 3 score: UI fidelity (≥80% required)
- Verdict: PASS | FAIL | NEEDS_REVISION | DSL_REGENERATE

---

## Step 5: Result Judgment

```
        ┌── PASS (all thresholds met)
        │   → End, output report
        │
        ├── FAIL (L1 < 100%)
        │   → Step 6: Triangular Arbitration
        │
        ├── DSL_REGENERATE (L2.5 < 80%)
        │   → DSL has errors, fix DSL first
        │
        └── NEEDS_REVISION
            → Step 6: Triangular Arbitration
```

---

## Step 6: Triangular Arbitration

**Arbitration decision table:**

| Issue Layer | Source | Fix Target | Action |
|-------------|--------|------------|--------|
| L1 (API error) | YApi | Code | Read YApi → fix API call in code |
| L2 (DSL missing) | DSL | Code | Add missing component/field to code |
| L2.5 (DSL wrong) | YApi/Modao | DSL | Fix DSL → regenerate page |
| L3 (UI mismatch) | Modao | Code | Adjust layout/styles |

**Execution flow:**

1. **Classify each issue by layer**
2. **Group by fix target (DSL or Code)**
3. **For DSL fixes:**
   - Read YApi or Modao to get correct value
   - Update DSL file
   - Regenerate affected pages
4. **For Code fixes:**
   - Apply specific corrections
   - Keep other pages unchanged
5. **Re-run validation (return to Step 4)**

**Iteration limit: 3 attempts**
- After 3 iterations, output current state + unresolved issues
```

- [ ] **Step 2: Commit**

```bash
git add pi-code-gen/SKILL.md
git commit -m "feat(pi-code-gen): add validation loop and arbitration sections"
```

---

### Task 5: Create SKILL.md - Part 4: Output and Edge Cases

**Files:**
- Modify: `pi-code-gen/SKILL.md`

- [ ] **Step 1: Add output and edge case sections**

```markdown
---

## Output Artifacts

```
src/views/<module>/           # Generated pages
├── list.vue
├── detail.vue
└── components/
    └── search-form.vue

docs/code-gen/                # Generation report
├── report.md                 # Validation results + fix history
├── issues-resolved.json      # Resolved issues list
└── issues-unresolved.json    # Manual fix required
```

### report.md Template

```markdown
# Code Generation Report

## Summary
- Pages generated: 5
- Generation time: YYYY-MM-DD HH:mm
- Iterations: 2
- Final verdict: PASS

## Validation Results

| Page | L1 | L2 | L2.5 | L3 | Verdict |
|------|----|----|------|----|---------|
| list.vue | 100% | 92% | 95% | 88% | PASS |
| detail.vue | 100% | 90% | 92% | 85% | PASS |

## Fix History

### Iteration 1
- list.vue: Fixed API URL (YApi arbitration)
- detail.vue: Added missing field (DSL arbitration)

### Iteration 2
- list.vue: Adjusted table column order (Modao arbitration)

## Unresolved Issues
- None

## References
- DSL: docs/dsl/integrated/
- CLAUDE.md: .claude/CLAUDE.md
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| CLAUDE.md missing | Use generic Vue conventions, warn user |
| Template file missing | Use default structure, warn user |
| DSL file missing | Abort, ask user to run Phase 2-3 first |
| Max iterations reached | Output current state, list unresolved issues |
| YApi/Modao inaccessible | Mark arbitration failed, manual fix required |
| L1 API error persists | Block commit, require manual API fix |

---

## Verification Thresholds

| Layer | Threshold | Priority |
|-------|-----------|----------|
| L1 (API) | 100% | BLOCKING |
| L2 (DSL) | ≥90% | MAJOR |
| L2.5 (DSL accuracy) | ≥90% | MAJOR |
| L3 (UI) | ≥80% | MINOR |

**PASS condition:** All thresholds met
```

- [ ] **Step 2: Commit**

```bash
git add pi-code-gen/SKILL.md
git commit -m "feat(pi-code-gen): add output artifacts and edge cases sections"
```

---

### Task 6: Update pi-workflow SKILL.md - Phase 4 Integration

**Files:**
- Modify: `pi-workflow/SKILL.md`

- [ ] **Step 1: Update Phase 4 section**

Find the Phase 4 section (lines ~154-167) and replace with:

```markdown
## Phase 4 — Code Generation

**Invoke:** `pi-code-gen`

**Trigger:** Automatically after Phase 3 (pi-integrate-fe-be) completes

**Inputs:**
- `docs/dsl/integrated/*.dsl` — full-stack specs
- Target project `.claude/CLAUDE.md` — encoding constraints
- `docs/yapi/` — API contract (for arbitration)
- `docs/modao/` — design reference (for arbitration)

**Process:**
1. Load constraints from CLAUDE.md
2. Load integrated DSL files
3. Generate Vue page code per DSL
4. Invoke pi-review for validation
5. Triangular arbitration for errors
6. Iterate (max 3 times) until PASS

**Outputs:**
- `src/views/<module>/` — generated pages
- `docs/code-gen/report.md` — generation report

**Gate to Phase 5:**
- All pages PASS → Auto proceed to Phase 5 (pi-review final)
- Unresolved issues → Prompt user to confirm before Phase 5
- L1 blocking errors → Block, require manual fix
```

- [ ] **Step 2: Commit**

```bash
git add pi-workflow/SKILL.md
git commit -m "feat(pi-workflow): integrate pi-code-gen as Phase 4"
```

---

### Task 7: Update pi-skills SKILL.md - Add to Available Skills

**Files:**
- Modify: `pi-skills/SKILL.md`

- [ ] **Step 1: Add pi-code-gen to available skills table**

Add row to the skills table (after pi-integrate-fe-be):

```markdown
| pi-code-gen | DSL到代码生成+验证循环 | `/pi-code-gen` |
```

- [ ] **Step 2: Update workflow diagram**

Update Phase 4 section in the workflow diagram:

```markdown
Phase 4: 代码生成
┌───────────────────────────────────────────┐
│           pi-code-gen                      │
│  从DSL生成代码+自动验证+迭代修正           │
└───────────────────────────────────────────┘
```

- [ ] **Step 3: Commit**

```bash
git add pi-skills/SKILL.md
git commit -m "feat(pi-skills): add pi-code-gen to available skills"
```

---

### Task 8: Create Skill Documentation

**Files:**
- Create: `docs/skill-pi-code-gen.md`

- [ ] **Step 1: Write skill documentation**

```markdown
# pi-code-gen Skill Documentation

## Purpose

从 integrated DSL 生成完整 Vue 页面代码，结合项目 CLAUDE.md 约束，通过测试驱动方式确保代码质量。

---

## Flow

```
Load CLAUDE.md → Load DSL → Generate Code → Validate → Arbitrate → Iterate
```

---

## Key Features

### 1. Constraint-Driven Generation

- 从项目 CLAUDE.md 读取编码规范
- 应用指定组件库（pi-form, el-table 等）
- 遵守禁止事项（禁止 axios in view 等）
- 复用已有 hooks/services

### 2. Test-Driven Validation

- DSL 作为测试契约
- 自动调用 pi-review 进行四层验证
- 不达标则迭代修正

### 3. Triangular Arbitration

- L1 问题 → YApi 仲裁 → 修正代码
- L2.5 问题 → Modao/YApi 仲裁 → 修正 DSL
- L2/L3 问题 → DSL/Modao 仲裁 → 修正代码

---

## Usage

### Automatic (Recommended)

Phase 3 完成后自动触发：

```
/pi-workflow  → Phase 1-3 → Phase 4 (pi-code-gen)
```

### Manual

```bash
/pi-code-gen --dsl-dir docs/dsl/integrated/ --output-dir src/views/<module>/
```

---

## Configuration

在项目 `.claude/CLAUDE.md` 中定义约束：

```markdown
## 代码生成规范

### 组件库
- 表单：使用 `pi-form`
- 表格：使用 `el-table`

### 输出路径
- 页面路径：`src/views/<module>/<page>.vue`

### 禁止事项
- 禁止在视图层直接调用 axios

### Hooks 复用
- 表单提交：复用 `useFormSubmit` hook
```

---

## Output

| Artifact | Location | Description |
|----------|----------|-------------|
| Vue pages | `src/views/<module>/` | Generated page files |
| report.md | `docs/code-gen/` | Validation + fix history |

---

## Integration

- **Upstream:** pi-integrate-fe-be (Phase 3)
- **Downstream:** pi-review (Phase 5)
- **Called by:** pi-workflow orchestrator

---

## Related Skills

- [pi-workflow](./skill-pi-workflow.md) — Full pipeline orchestrator
- [pi-review](./skill-pi-review.md) — Code validation
- [pi-integrate-fe-be](./skill-pi-integrate-fe-be.md) — DSL integration
```

- [ ] **Step 2: Commit**

```bash
git add docs/skill-pi-code-gen.md
git commit -m "docs: add pi-code-gen skill documentation"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Verify file structure**

Run: `find pi-code-gen -type f && find docs -name "*code-gen*"`
Expected output:
```
pi-code-gen/SKILL.md
pi-code-gen/scripts/parse-constraints.js
pi-code-gen/scripts/test-parse-constraints.js
docs/skill-pi-code-gen.md
```

- [ ] **Step 2: Run parse-constraints test**

Run: `node pi-code-gen/scripts/test-parse-constraints.js`
Expected: `All tests passed!`

- [ ] **Step 3: Verify SKILL.md syntax**

Read `pi-code-gen/SKILL.md` and check:
- Metadata block present
- All 6 steps defined
- Arbitration table complete
- Output artifacts documented

- [ ] **Step 4: Verify pi-workflow integration**

Read `pi-workflow/SKILL.md` Phase 4 section and confirm pi-code-gen is integrated.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(pi-code-gen): complete skill implementation with TDD approach"
```