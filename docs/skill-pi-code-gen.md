# pi-code-gen Skill Documentation

## Purpose

从 integrated DSL 生成完整 Vue 页面代码,结合项目 CLAUDE.md 约束,通过测试驱动方式确保代码质量。

---

## Flow

```
Load CLAUDE.md → Load DSL → Generate Code → Validate → Arbitrate → Iterate
```

---

## Key Features

### 1. Constraint-Driven Generation

- 从项目 CLAUDE.md 读取编码规范
- 应用指定组件库(pi-form, el-table 等)
- 遵守禁止事项(禁止 axios in view 等)
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

Phase 3 完成后自动触发:

```
/pi-workflow  → Phase 1-3 → Phase 4 (pi-code-gen)
```

### Manual

```bash
/pi-code-gen --dsl-dir docs/dsl/integrated/ --output-dir src/views/<module>/
```

---

## Configuration

在项目 `.claude/CLAUDE.md` 中定义约束:

```markdown
## 代码生成规范

### 组件库
- 表单:使用 `pi-form`
- 表格:使用 `el-table`

### 输出路径
- 页面路径:`src/views/<module>/<page>.vue`

### 禁止事项
- 禁止在视图层直接调用 axios

### Hooks 复用
- 表单提交:复用 `useFormSubmit` hook
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