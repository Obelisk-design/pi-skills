# pi-review 技能说明

## 一、概述

pi-review 是三角交叉验证代码审查技能，通过四层验证架构确保代码质量。它对比代码与 YApi、DSL、墨刀原型，使用交叉验证发现各环节的独立错误。

**核心价值：**
- Layer 1：API 合规验证（阻塞级）
- Layer 2：DSL 合规验证（主要级）
- Layer 2.5：DSL 准确性验证（诊断层）
- Layer 3：UI 保真验证（次要级）
- 交叉验证：发现"两者都错"的盲区

---

## 二、验证架构

### 三角交叉验证

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

### 四层验证优先级

| 层级 | 对比关系 | 优先级 | 阈值 | 说明 |
|------|----------|--------|------|------|
| Layer 1 | Code ↔ YApi | 阻塞级 | 100% | API 合规：URL、方法、必填参数 |
| Layer 2 | Code ↔ DSL | 主要级 | ≥90% | DSL 合规：组件、字段、数据绑定 |
| Layer 2.5 | DSL ↔ Modao | 主要级 | ≥90% | DSL 准确性：检测 DSL 生成错误 |
| Layer 3 | Code ↔ Modao | 次要级 | ≥80% | UI 保真：布局、标签、视觉层级 |

---

## 三、使用方式

### 触发条件

用户触发 `/pi-review` 命令，或：
- 代码生成完成后自动审查
- 提交 PR 前验证
- 用户说"审查代码"

### 前置条件

需要准备的输入：
- 生成的代码文件
- `docs/yapi/` — API 合约参考
- `docs/dsl/frontend/` — DSL 定义
- `docs/dsl/integrated/` — 集成规格
- `docs/modao/` — 设计参考

---

## 四、验证流程

### Layer 1：API 合规

**阻塞级验证：**

| 检查项 | 说明 | 失败后果 |
|--------|------|----------|
| URL 匹配 | 路径与 YApi 完全一致 | FAIL 阻断 |
| HTTP 方法 | GET/POST/PUT/DELETE 匹配 | FAIL 阻断 |
| 必填参数 | 所有 required 参数发送 | FAIL 阻断 |
| 参数命名 | 大小写完全一致 | FAIL 阻断 |

**规则：** Layer 1 必须 100% 通过，否则阻断后续验证。

### Layer 2：DSL 合规

**主要级验证：**

| 检查项 | 说明 |
|--------|------|
| 组件存在 | DSL 中的组件在代码中实现 |
| 组件类型 | table/form/modal 类型匹配 |
| 字段存在 | DSL 字段在代码中出现 |
| 必填规则 | required 字段有验证规则 |
| 动作实现 | DSL 按钮动作已实现 |
| 数据绑定 | dataSource 引用正确 API |

**自动化脚本：**
```bash
node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
  --dsl-file docs/dsl/frontend/{page}.dsl \
  --code-dir src/views/{module}/ \
  --output docs/review/dsl-check.json
```

### Layer 2.5：DSL 准确性（诊断层）

**触发条件：** Layer 2 通过但 Layer 3 失败

**检查项：**

| 检查项 | 说明 |
|--------|------|
| 字段名匹配 | DSL 字段名与 Modao 标签一致 |
| 列顺序 | DSL 列顺序与 Modao 表格一致 |
| 必填标记 | DSL required 与 Modao 标注一致 |
| 组件类型 | DSL 类型与 Modao UI 元素一致 |

**诊断逻辑：**

| L2 | L3 | L2.5 | 诊断 |
|----|----|------|------|
| PASS | PASS | — | ✅ 全部正确 |
| PASS | FAIL | FAIL | DSL 生成错误 → 重生成 DSL |
| PASS | FAIL | PASS | 视觉实现错误 → 调整样式 |
| FAIL | FAIL | PASS | 代码生成错误 → 修正代码 |
| FAIL | PASS | FAIL | DSL 错误但 Code 已人工修正 → 同步 DSL |

### Layer 3：UI 保真

**次要级验证：**

| 检查项 | 说明 |
|--------|------|
| 布局结构 | 容器层级与原型一致 |
| 文本标签 | 标签文字匹配 |
| 按钮位置 | 按钮在预期位置 |
| 表格列 | 列顺序与原型一致 |
| 状态覆盖 | 加载/空/错误状态处理 |

---

## 五、判定规则

### 最终判定

| 条件 | 判定 | 说明 |
|------|------|------|
| L1=100%, L2≥90%, L2.5≥90%, L3≥80% | **PASS** | 允许提交 |
| L1=100%, L2≥80%, L2.5≥80%, L3≥70% | **NEEDS_REVISION** | 带警告提交 |
| L1 < 100% | **FAIL** | 阻断提交 |
| L2.5 < 80% | **DSL_REGENERATE** | 重生成 DSL |
| L2 < 80% 或 L3 < 70% | **NEEDS_REVISION** | 修复问题 |

### 阻断规则

| 规则 | 说明 | 后果 |
|------|------|------|
| BR-01 | API 路径错误 | FAIL |
| BR-02 | HTTP 方法错误 | FAIL |
| BR-03 | 必填参数缺失 | FAIL |
| BR-04 | 硬编码动态数据 | FAIL |
| BR-05 | 危险代码（eval、v-html） | FAIL |

---

## 六、输出报告

### 报告结构

审查报告输出到 `docs/review/review-report.md`：

```markdown
# Code Review Report

**Target:** <file paths>
**Date:** <YYYY-MM-DD HH:mm>

## Final Verdict: <PASS | FAIL | NEEDS_REVISION | DSL_REGENERATE>

---

## Layer Scores

| Layer | Comparison | Score | Status |
|-------|------------|-------|--------|
| 1. API Compliance | Code ↔ YApi | 100% | PASS |
| 2. DSL Compliance | Code ↔ DSL | 92% | PASS |
| 2.5. DSL Accuracy | DSL ↔ Modao | 95% | PASS |
| 3. UI Fidelity | Code ↔ Modao | 88% | PASS |

---

## Cross-Validation Diagnosis

| Finding | Diagnosis | Recommended Action |
|---------|-----------|-------------------|
| L2 PASS, L3 FAIL, L2.5 FAIL | DSL generation error | Regenerate DSL |

---

## Action Items

| Priority | Layer | Issue | File | Fix |
|----------|-------|-------|------|-----|
| BLOCKING | 1 | Missing required param | form.vue | Add validation |
```

---

## 七、最佳实践

### 1. 验证顺序

严格按 Layer 1 → 2 → 2.5 → 3 顺序，下层失败阻断上层。

### 2. 交叉验证触发

Layer 2 通过但 Layer 3 失败时，必须检查 Layer 2.5。

### 3. 错误溯源

- L2.5 失败 → DSL 问题，不修代码
- L2 失败但 L2.5 通过 → 代码问题
- L3 失败但 L2.5 通过 → 视觉问题

### 4. 修复方向

| 诊断 | 修复方向 |
|------|----------|
| DSL 生成错误 | 重生成 DSL → 重生成代码 |
| 代码生成错误 | 直接修正代码 |
| 视觉实现错误 | 调整样式，不动结构 |
| DSL 错误已修正 | 同步 DSL 文档 |

---

## 八、常见问题

### Q1: Layer 1 阻断怎么办？

**解决：** 修复 API 路径/方法/必填参数问题后重新审查。

### Q2: Layer 2 通过但 Layer 3 失败？

**解决：** 必须检查 Layer 2.5，判断是 DSL 错误还是视觉问题。

### Q3: DSL 评分过低？

**解决：** 
- 检查是否 DSL 字段遗漏
- 对比 Modao 确认 DSL 准确性
- 重生成 DSL

### Q4: 自动化脚本失败？

**解决：** 
- 确认 DSL 文件路径正确
- 确认代码目录存在
- 检查 JSON 输出文件

---

## 九、与其他 Skill 的关系

| Skill | 关系 | 说明 |
|-------|------|------|
| **pi-yapi** | Layer 1 参考 | 提供 API 合约 |
| **pi-fe-view-dsl-engine** | Layer 2 参考 | 提供 DSL 定义 |
| **pi-modao-capture** | Layer 3 参考 | 提供设计原型 |
| **pi-workflow** | Phase 5 | 工作流最后一步执行审查 |

---

## 十、自动化脚本

```bash
node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
  --dsl-file docs/dsl/frontend/{page}.dsl \
  --code-dir src/views/{module}/ \
  --output docs/review/dsl-check.json
```

脚本输出 JSON 格式的对比结果，用于 Layer 2 自动化验证。