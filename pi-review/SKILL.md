---
name: pi-review
description: Use when reviewing frontend code for UI-design alignment and API parameter compliance - compares generated pages against Modao prototype screenshots, Frontend DSL definitions, and YApi interface documentation with three-layer validation.
---

# pi-review

Three-layer code review skill that validates generated code against multiple sources of truth:

1. **Layer 1: API Compliance** (YApi Docs) — Highest priority, auto-blocking on errors
2. **Layer 2: Frontend DSL Compliance** (Integrated DSL) — Structural validation
3. **Layer 3: UI Design Fidelity** (Modao Screenshots) — Visual validation

---

## Overview

`pi-review` uses a **priority-based three-layer validation approach** to ensure:

- **Layer 1 (Critical)**: API calls are 100% compliant with YApi contracts
- **Layer 2 (Major)**: Components and fields match the Frontend DSL definitions
- **Layer 3 (Minor)**: Visual layout aligns with Modao prototype screenshots

This approach catches blocking issues early (API errors) and allows incremental refinement for visual polish.

---

## Validation Priority

```
┌─────────────────────────────────────────────┐
│ Layer 1: API Compliance (YApi)              │
│ → BLOCKING: Wrong path/method/missing param │
│ → Score: 100% required to PASS              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 2: Frontend DSL Compliance            │
│ → MAJOR: Missing component/field in DSL     │
│ → Score: >= 90% to PASS                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 3: UI Design Fidelity (Modao)         │
│ → MINOR: Visual layout/style discrepancy    │
│ → Score: >= 80% to PASS                     │
└─────────────────────────────────────────────┘
```

**Rule**: A lower layer MUST pass before validating the next layer. Layer 1 failure blocks Layer 2 & 3.

---

## When to Use

Trigger this skill when:

- The user asks to **review code** for a page or component
- The user wants to **validate implementation** before commit
- After completing `/pi-integrate-fe-be` workflow
- Before submitting PR for a new page/component

---

## Inputs

| Input | Location | Layer | Purpose |
|-------|----------|-------|---------|
| Generated code files | Project source tree | All | Code under review |
| YApi interface docs | `docs/yapi/` | Layer 1 | API contract reference |
| Frontend DSL | `docs/dsl/frontend/` | Layer 2 | Component tree definition |
| Integrated DSL | `docs/dsl/integrated/` | Layer 2 | Full-stack binding spec |
| Modao screenshots | `docs/modao/` | Layer 3 | Visual design reference |

---

## Review Dimensions

### Layer 1: API Compliance (YApi Docs)

**Priority: BLOCKING** — Must pass 100% before Layer 2

| Check | Blocking? | Description |
|-------|-----------|-------------|
| URL Match | ✅ BLOCKING | Path matches YApi exactly |
| HTTP Method | ✅ BLOCKING | GET/POST/PUT/DELETE matches |
| Required Params | ✅ BLOCKING | All required params are sent |
| Param Names | ✅ BLOCKING | Exact casing match |
| Param Types | MAJOR | Types match contract |
| Response Fields | MAJOR | Consumed fields exist in response |
| Error Handling | MINOR | Has try/catch or .catch() |

**Scoring:**
- Blocking checks: Must be 100% PASS
- Overall: `(MAJOR_PASS + MINOR_PASS) / (MAJOR_TOTAL + MINOR_TOTAL) * 100%`

## Validation Architecture — Triangular Cross-Validation

```
                    Modao Screenshots (设计源)
                           ↑
                          / │
                         /  │
            Layer 3:   /    │ Layer 2.5 (新增)
           Code vs    /      │ DSL vs
           Modao     /        │ Modao
                    /          │
                   /            │
                  ↓              ↓
            Generated Code ←───── DSL
                           Layer 2
                         Code vs DSL
```

**三角验证原理：**

| 验证链 | 检测目标 | 发现的错误类型 |
|--------|----------|----------------|
| DSL vs Code | 代码是否实现DSL定义 | 代码遗漏、字段命名差异 |
| Code vs Modao | 代码是否符合设计 | DSL识别错误导致的代码错误 |
| DSL vs Modao | DSL是否正确识别设计 | DSL生成阶段的识别偏差 |

**交叉验证场景：**

| 场景 | DSL vs Code | Code vs Modao | DSL vs Modao | 诊断 |
|------|-------------|---------------|--------------|------|
| DSL正确，Code正确 | PASS | PASS | PASS | ✅ 全部正确 |
| DSL正确，Code错误 | FAIL | FAIL | PASS | Code生成阶段出错 |
| DSL错误，Code跟随DSL | PASS | FAIL | FAIL | DSL识别阶段出错 |
| DSL错误，Code自行修正 | FAIL | PASS | FAIL | DSL错误但Code人工修正 |

**核心价值：** 单链路对比可能遗漏"两者都错"的情况，三角验证通过交叉对比可以发现。

---

## Layer 2: DSL Compliance (Code ↔ DSL)

**Priority: MAJOR** — Must pass >= 90% before Layer 3

| Check | Severity | Description |
|-------|----------|-------------|
| Component Exists | MAJOR | Each component in DSL exists in code |
| Component Type | MAJOR | table/form/modal/tab matches DSL |
| Field Present | MAJOR | Each field in DSL appears in form/table |
| Field Required | MAJOR | Required fields have validation rules |
| Field Type | MINOR | Input/select/radio matches DSL |
| Action Present | MAJOR | Button actions from DSL are implemented |
| Data Binding | MAJOR | dataSource references correct API |

**Scoring:**
- MAJOR checks: Must be >= 90% PASS
- Overall: `(MAJOR_PASS + MINOR_PASS) / (MAJOR_TOTAL + MINOR_TOTAL) * 100%`

**Automation Script:**
```bash
node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
  --dsl-file docs/dsl/frontend/<page>.dsl \
  --code-dir src/views/<module>/ \
  --output docs/review/dsl-check.json
```

---

## Layer 2.5: DSL Accuracy (DSL ↔ Modao) — NEW

**Priority: MAJOR** — Validates DSL generation accuracy

| Check | Severity | Description |
|-------|----------|-------------|
| Field Names Match | MAJOR | DSL field names match Modao labels |
| Column Order | MAJOR | DSL column order matches Modao table |
| Required Marking | MAJOR | DSL required matches Modao annotations |
| Component Types | MAJOR | DSL component type matches Modao UI |
| Hidden Fields | MINOR | Check if DSL missed hidden/conditional fields |

**Purpose:**
- Detect DSL generation errors before blaming code
- If DSL vs Modao fails, DSL needs regeneration, not code fix

**Manual Check Process:**
1. Read DSL file
2. Open corresponding Modao screenshot
3. Compare key elements:
   - Table columns: order, names, width
   - Form fields: labels, types, required marks
   - Buttons: labels, positions

---

## Layer 3: UI Fidelity (Code ↔ Modao)

**Priority: MINOR** — Visual refinements, >= 80% to PASS

| Check | Severity | Description |
|-------|----------|-------------|
| Layout Structure | MINOR | Container hierarchy matches prototype |
| Text Labels | MINOR | Labels match Modao annotations |
| Button Positions | MINOR | Buttons in expected positions |
| Table Columns | MINOR | Column order matches prototype |
| Visual Hierarchy | MINOR | Heading levels, emphasis correct |
| State Coverage | MINOR | Loading/empty/error states handled |

**Scoring:**
- Overall: `PASS_CHECKS / TOTAL_CHECKS * 100%`

**Cross-Validation Note:**
- If Layer 2 passes but Layer 3 fails → Check Layer 2.5 (DSL vs Modao)
- If Layer 2.5 also fails → DSL error, regenerate DSL
- If Layer 2.5 passes but Layer 3 fails → Code visual implementation issue

---

## Verdict Rules

| Condition | Verdict |
|-----------|---------|
| Layer 1 = 100%, Layer 2 >= 90%, Layer 2.5 >= 90%, Layer 3 >= 80% | **PASS** |
| Layer 1 = 100%, Layer 2 >= 80%, Layer 2.5 >= 80%, Layer 3 >= 70% | **NEEDS_REVISION** |
| Layer 1 < 100% (any blocking issue) | **FAIL** |
| Layer 2 < 80% | **NEEDS_REVISION** |
| Layer 2.5 < 80% | **DSL_REGENERATE** — DSL has generation errors |
| Layer 3 < 70% | **NEEDS_REVISION** |

**Special Cases:**

| Scenario | Layer 2 | Layer 3 | Layer 2.5 | Action |
|----------|---------|---------|-----------|--------|
| DSL error propagating | PASS | FAIL | FAIL | Regenerate DSL, then re-run review |
| Code visual error | PASS | FAIL | PASS | Fix visual implementation in code |
| Both DSL and Code error | FAIL | FAIL | FAIL | Regenerate DSL + fix code |
| DSL error, Code fixed | FAIL | PASS | FAIL | Sync DSL with corrected code |

---

## Workflow

### Phase 1: API Compliance (Layer 1)

1. Parse all API calls from generated code
2. For each API call:
   - Extract URL, method, parameters sent
   - Read corresponding YApi doc
   - Check blocking rules (URL, method, required params)
   - If ANY blocking rule fails → STOP and report FAIL
3. Check non-blocking rules (types, response handling)
4. Calculate Layer 1 score

**If Layer 1 FAILS**: Generate report with blocking issues. Do NOT proceed to Layer 2.

### Phase 2: DSL Compliance (Layer 2)

1. Run automated DSL vs Code comparison:
   ```bash
   node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
     --dsl-file docs/dsl/frontend/<page>.dsl \
     --code-dir src/views/<module>/ \
     --output docs/review/dsl-check.json
   ```
2. Parse generated code for components and fields
3. For each DSL component:
   - Check if component exists in code
   - Verify component type matches
   - Validate all DSL fields appear in form/table
   - Check required fields have validation
   - Verify actions are implemented
4. Calculate Layer 2 score

**If Layer 2 < 90%**: Report MAJOR issues, continue to Phase 2.5 for diagnosis.

### Phase 2.5: DSL Accuracy Check (Layer 2.5 — NEW)

**Triggered when:** Layer 2 passes but Layer 3 fails, OR Layer 2 shows unexpected field mismatches

1. Read DSL file for the target page
2. Open corresponding Modao screenshot
3. Manual cross-check:
   - Compare DSL field names with Modao labels
   - Compare DSL column order with Modao table
   - Check DSL required marking matches Modao annotations
   - Verify DSL component types match Modao UI elements
4. Calculate Layer 2.5 score

**Diagnosis Logic:**

| Layer 2 | Layer 3 | Layer 2.5 | Diagnosis |
|---------|---------|-----------|-----------|
| PASS | PASS | (skip) | ✅ No issue |
| FAIL | FAIL | PASS | Code generation error — fix code |
| PASS | FAIL | FAIL | DSL generation error — regenerate DSL |
| FAIL | PASS | FAIL | DSL error, but Code manually corrected — sync DSL |
| PASS | FAIL | PASS | Visual implementation issue — adjust styles/layout |

### Phase 3: UI Fidelity (Layer 3)

1. Read Modao screenshots for the target page
2. Visual comparison:
   - Layout structure alignment
   - Label text matching
   - Interactive element positions
   - Table column order
3. Calculate Layer 3 score

**Cross-Validation Check:**
- If Layer 3 fails → Trigger Phase 2.5 (DSL vs Modao)
- Determine if error is from DSL or Code implementation

### Phase 4: Generate Report

Combine all layer scores into final verdict and write to `docs/review/review-report.md`.

**Report Structure:**
```markdown
## Triangular Cross-Validation Results

| Layer | Comparison | Score | Status |
|-------|------------|-------|--------|
| Layer 1 | Code ↔ YApi | 100% | PASS |
| Layer 2 | Code ↔ DSL | 92% | PASS |
| Layer 2.5 | DSL ↔ Modao | 95% | PASS |
| Layer 3 | Code ↔ Modao | 88% | PASS |

## Cross-Validation Analysis
- DSL generation accuracy: Verified via Layer 2.5
- Code implementation accuracy: Verified via Layer 2
- Visual fidelity: Verified via Layer 3
```

---

## Blocking Rules (Layer 1 Only)

| Rule | Description | Consequence |
|------|-------------|-------------|
| BR-01 | Wrong API path | **FAIL** |
| BR-02 | Wrong HTTP method | **FAIL** |
| BR-03 | Missing required parameter | **FAIL** |
| BR-04 | Hardcoded dynamic data (user IDs, tokens) | **FAIL** |
| BR-05 | Dangerous code (`eval`, unsanitized `v-html`) | **FAIL** |

---

## Output Template

```markdown
# Code Review Report

**Target:** `<file paths>`
**Date:** `<YYYY-MM-DD HH:mm>`
**Reviewer:** `pi-review (v3.0 - triangular cross-validation)`

## Final Verdict: `<PASS | FAIL | NEEDS_REVISION | DSL_REGENERATE>`

---

## Triangular Cross-Validation Architecture

```
        Modao (设计源)
           ↑
          / │
         /  │
  L3:   /    │ L2.5
 Code  /      │ DSL
 vs   /        │ vs
Modao          │ Modao
    ↓          ↓
   Code ←──── DSL (L2)
```

---

## Layer Scores

| Layer | Comparison | Priority | Score | Status |
|-------|------------|----------|-------|--------|
| 1. API Compliance | Code ↔ YApi | BLOCKING | `<M/N>` `<%>` | `<PASS/FAIL>` |
| 2. DSL Compliance | Code ↔ DSL | MAJOR | `<M/N>` `<%>` | `<PASS/FAIL>` |
| 2.5. DSL Accuracy | DSL ↔ Modao | MAJOR | `<M/N>` `<%>` | `<PASS/FAIL>` |
| 3. UI Fidelity | Code ↔ Modao | MINOR | `<M/N>` `<%>` | `<PASS/FAIL>` |

---

## Cross-Validation Diagnosis

| Finding | Diagnosis | Recommended Action |
|---------|-----------|-------------------|
| L2 PASS, L3 FAIL, L2.5 FAIL | DSL generation error | Regenerate DSL from Modao |
| L2 PASS, L3 FAIL, L2.5 PASS | Visual implementation error | Adjust code layout/styles |
| L2 FAIL, L3 FAIL, L2.5 PASS | Code generation error | Fix code to match DSL |
| L2 FAIL, L2.5 FAIL | Both DSL and Code error | Regenerate DSL + fix code |

---

## Layer 1: API Compliance

### Blocking Checks

| API | Path | Method | Required Params | Status |
|-----|------|--------|-----------------|--------|
| `<name>` | `<path>` | `<method>` | `<list>` | ✅ PASS |

### Non-Blocking Checks

| Check | Status | Notes |
|-------|--------|-------|

---

## Layer 2: DSL Compliance (Code ↔ DSL)

### Component Mapping

| DSL Component | Code Component | Type Match | Fields Match | Status |
|---------------|----------------|------------|--------------|--------|

### Field Coverage

| DSL Field | Code Field | Required Rule | Status |
|-----------|------------|---------------|--------|

---

## Layer 2.5: DSL Accuracy (DSL ↔ Modao)

### Manual Cross-Check Results

| Check Item | DSL Definition | Modao Design | Status |
|------------|----------------|--------------|--------|
| Field names | fieldName | 字段英文名 | ✅ PASS |
| Column order | [seq, dataItemId, ...] | Matches screenshot | ✅ PASS |
| Required marks | fieldComment: required | Annotation shows *必填 | ✅ PASS |

---

## Layer 3: UI Fidelity (Code ↔ Modao)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|

---

## Action Items

| Priority | Layer | Issue | File | Fix |
|----------|-------|-------|------|-----|

---

## References

- YApi: `docs/yapi/<project>/`
- DSL: `docs/dsl/frontend/<page>.dsl`
- Modao: `docs/modao/<project>/`
```

---

## Scripts

Use the automation script for structured DSL comparison:

```bash
node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
  --dsl-file docs/dsl/frontend/<page>.dsl \
  --code-dir src/views/<module>/ \
  --output docs/review/dsl-check.json
```

---

## Tips

1. **Always start with Layer 1** — API errors break functionality completely
2. **Triangular cross-validation prevents blind spots** — Single chain comparison can miss "both wrong" scenarios
3. **Layer 2.5 is diagnostic** — Triggered when Layer 2 vs Layer 3 results conflict
4. **DSL regeneration vs code fix** — Use cross-validation to determine which layer needs fixing
5. **YApi > DSL > Modao** — This priority order prevents wasted effort on fixing visual issues when API is broken
6. **When Layer 2 passes but Layer 3 fails** — Check Layer 2.5 first to determine if DSL or Code is the problem