---
name: pi-code-gen
description: Use when generating complete Vue pages from integrated DSL with project CLAUDE.md constraints — auto-validates via pi-review and iteratively fixes until validation passes.
---

# pi-code-gen — DSL to Code Generation with TDD

从 integrated DSL 生成完整 Vue 页面代码,结合项目 CLAUDE.md 约束,通过测试驱动方式确保代码质量。

---

## Overview

`pi-code-gen` 是 pi-skills 流程的 **Phase 4**,负责:
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