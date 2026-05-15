---
name: pi-workflow
description: Use when orchestrating the full pi-skills pipeline end-to-end — from design capture through code review — coordinates pi-yapi, pi-modao-capture, pi-fe-view-dsl-engine, pi-be-data-dsl-engine, pi-integrate-fe-be, and pi-review in strict sequence.
---

# pi-workflow — Full-Stack Delivery Pipeline Orchestrator

End-to-end orchestration for the pi-skills family. Coordinates design capture, API analysis, DSL generation, integration, and code review in strict sequence.

This skill does **NOT** directly modify code or generate code. It orchestrates the specialized pi-skills.

---

## Pipeline Overview

```
Phase 1: Design Capture          Phase 2: API Capture
┌───────────────────┐            ┌───────────────────┐
│ pi-modao-capture  │            │    pi-yapi        │
│ screenshots +     │            │ interface docs    │
│ annotations       │            │ (yapi exports)    │
└────────┬──────────┘            └────────┬──────────┘
         │                                │
         ▼                                ▼
┌──────────────────────────────────────────────────┐
│              Phase 3: DSL Generation             │
│  ┌──────────────────────┐  ┌───────────────────┐ │
│  │ pi-fe-view-dsl-engine│  │pi-be-data-dsl-eng │ │
│  │ component tree DSL   │  │data transform DSL │ │
│  └──────────┬───────────┘  └────────┬──────────┘ │
└─────────────┼───────────────────────┼────────────┘
              │                       │
              ▼                       ▼
┌──────────────────────────────────────────────────┐
│            Phase 4: Integration                  │
│        pi-integrate-fe-be                        │
│  merge FE + BE DSL → full-stack DSL              │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│            Phase 5: Code Generation              │
│  (developer or tool generates code from DSLs)    │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────┐
│            Phase 6: Review                       │
│          pi-review                               │
│  verify UI vs design, API vs contract            │
└──────────────────────────────────────────────────┘
```

---

## Phase 1 — Design & API Capture (parallel)

These two phases run independently and can execute in parallel.

### 1a. Design Capture

**Invoke:** `pi-modao-capture`

**Artifacts produced:**
- `docs/modao/screenshots/` — page screenshots
- `docs/modao/annotations/` — annotation markdown
- `docs/modao/index.md` — page hierarchy

**Entry gate:**
- Modao sharing link required
- Password if prototype is protected

**Abort conditions:**
- Screenshots fail to generate
- Page hierarchy incomplete

### 1b. API Capture

**Invoke:** `pi-yapi`

**Artifacts produced:**
- `docs/yapi/{project_name}/README.md` — interface index
- `docs/yapi/{project_name}/{id}_{title}.md` — per-interface detail docs

**Entry gate:**
- YApi cookie valid (not `40011`)
- Project ID or category ID available

**Abort conditions:**
- Cookie expired
- No interfaces found in category

---

## Phase 2 — DSL Generation (parallel)

Depends on Phase 1 outputs. Both DSL engines run independently.

### 2a. Frontend View DSL

**Invoke:** `pi-fe-view-dsl-engine`

**Input:** `docs/modao/`

**Artifacts produced:**
- `docs/dsl/frontend/<page>.dsl` — component tree per page
- `docs/dsl/frontend/index.md` — DSL index

**Output validation:**
- Every page from Modao index has a corresponding DSL file
- All annotated fields and buttons appear in DSL
- Data bindings use `${api.X}` placeholders (not hardcoded)

### 2b. Backend Data DSL

**Invoke:** `pi-be-data-dsl-engine`

**Input:** `docs/yapi/{project_name}/`

**Artifacts produced:**
- `docs/dsl/backend/<interface>.dsl` — data transform per interface
- `docs/dsl/backend/README.md` — DSL index

**Output validation:**
- Every interface from YApi docs has a DSL file
- All required fields marked `required`
- Enum values preserved from YApi

---

## Phase 3 — Integration

Depends on Phase 2 outputs. Both frontend and backend DSLs must be present.

### Integration

**Invoke:** `pi-integrate-fe-be`

**Input:**
- `docs/dsl/frontend/` — frontend component trees
- `docs/dsl/backend/` — backend data transforms

**Artifacts produced:**
- `docs/dsl/integrated/<page>.dsl` — full-stack integration per page
- `docs/dsl/integrated/index.md` — integration summary

**Output validation:**
- Every component bound to an API (or marked `TBD`)
- Every API consumed by at least one component (or marked `unused`)
- Bidirectional consistency verified

---

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

---

## Phase 5 — Review

Depends on Phase 4 (generated code) and all upstream artifacts.

### Triangular Cross-Validation Review

**Invoke:** `pi-review`

**Inputs:**
- Generated code files
- `docs/yapi/` — API contract reference
- `docs/dsl/frontend/` — DSL definitions
- `docs/dsl/integrated/` — integration spec
- `docs/modao/` — design reference

**Validation Architecture:**

```
        Modao (设计源)
           ↑
          / │
         /  │
  L3:   /    │ L2.5 (新增)
 Code  /      │ DSL
 vs   /        │ vs
Modao          │ Modao
    ↓          ↓
   Code ←──── DSL (L2)
```

**Four-Layer Validation:**

| Layer | Comparison | Priority | Source | Threshold | Description |
|-------|------------|----------|---------|-----------|-------------|
| Layer 1 | Code ↔ YApi | BLOCKING | YApi | 100% | API Compliance — URL, method, required params |
| Layer 2 | Code ↔ DSL | MAJOR | DSL | ≥90% | DSL Compliance — components, fields, data bindings |
| Layer 2.5 | DSL ↔ Modao | MAJOR | Modao | ≥90% | DSL Accuracy — detect DSL generation errors |
| Layer 3 | Code ↔ Modao | MINOR | Modao | ≥80% | UI Fidelity — layout, labels, visual hierarchy |

**Cross-Validation Logic:**

| Layer 2 | Layer 3 | Layer 2.5 | Diagnosis |
|---------|---------|-----------|-----------|
| PASS | PASS | (skip) | ✅ All correct |
| PASS | FAIL | FAIL | DSL generation error → regenerate DSL |
| PASS | FAIL | PASS | Visual implementation error → fix code styles |
| FAIL | FAIL | PASS | Code generation error → fix code |
| FAIL | PASS | FAIL | DSL error but Code manually fixed → sync DSL |

**Validation Flow:**
```
Layer 1 (API) ──→ FAIL? Block and fix
                 └─→ PASS? Continue to Layer 2
Layer 2 (DSL) ──→ FAIL? Continue, check Layer 2.5
                 └─→ PASS? Continue to Layer 3
Layer 3 (UI)  ──→ FAIL? Trigger Layer 2.5
Layer 2.5     ──→ FAIL? DSL_REGENERATE verdict
                 └─→ PASS? Visual fix needed
```

**Outputs:**
- `docs/review/review-report.md` — review report with triangular cross-validation scores
- `docs/review/dsl-check.json` — automated DSL vs Code comparison results

**Verdicts:**
| Condition | Verdict | Action |
|-----------|---------|--------|
| L1 = 100%, L2 ≥ 90%, L2.5 ≥ 90%, L3 ≥ 80% | **PASS** | Allow commit |
| L1 = 100%, L2 ≥ 80%, L2.5 ≥ 80%, L3 ≥ 70% | **NEEDS_REVISION** | Commit with warning |
| L1 < 100% (any blocking issue) | **FAIL** | Block commit |
| L2.5 < 80% | **DSL_REGENERATE** | Regenerate DSL from Modao |
| L2 < 80% or L3 < 70% | **NEEDS_REVISION** | Fix reported issues |

**Automation Script:**
```bash
node ~/.claude/skills/pi-review/scripts/dsl-compare.js \
  --dsl-file docs/dsl/frontend/<page>.dsl \
  --code-dir src/views/<module>/ \
  --output docs/review/dsl-check.json
```

---

## Quick Start

When the user says "start the pipeline", "run full workflow", or "从原型到上线":

1. Confirm the user has:
   - Modao sharing link (for pi-modao-capture)
   - YApi project/category info (for pi-yapi)
2. Run Phase 1a and 1b in parallel
3. Proceed through phases sequentially
4. Report a status summary after each phase

## Failure Recovery

| Failure Point | Recovery |
|---------------|----------|
| Modao link expired | Ask user for new sharing link |
| YApi cookie expired | Ask user to refresh `~/.yapi_cookie_raw.txt` |
| Missing DSL (frontend) | Re-run pi-fe-view-dsl-engine |
| Missing DSL (backend) | Re-run pi-be-data-dsl-engine |
| Review FAIL | Fix reported issues, re-run pi-review |
| DSL integration gap | Mark as `TBD`, proceed, flag for manual resolution |

---

## Skills Reference

| Skill | Phase | Status |
|-------|-------|--------|
| `pi-modao-capture` | 1a | Required |
| `pi-yapi` | 1b | Required |
| `pi-fe-view-dsl-engine` | 2a | Required |
| `pi-be-data-dsl-engine` | 2b | Required |
| `pi-integrate-fe-be` | 3 | Required |
| `pi-review` | 5 | Required |
