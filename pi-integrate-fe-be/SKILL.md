---
name: pi-integrate-fe-be
description: Use when merging frontend page structure DSL and backend data DSL into unified full-stack integration definitions - binds UI components to API data sources and defines complete data flow.
---

# pi-integrate-fe-be — Full-Stack DSL Integration Skill

Merges the outputs of **pi-be-data-dsl-engine** (backend data DSL) and **pi-fe-view-dsl-engine** (frontend page structure DSL) into a unified full-stack DSL that connects frontend UI components with backend data APIs.

---

## Overview

This skill produces **integrated DSL definitions** that bind frontend UI components to backend data sources, creating a single source of truth for the complete data flow across the stack.

It answers:
- Which UI component consumes which API endpoint?
- How does data flow between components on user interaction?
- What is the complete lifecycle from user action to backend mutation and UI refresh?

---

## When to Use

Trigger this skill when:

- The user needs to define **frontend-backend integration** for a page or feature
- UI components need to be **bound to API data sources**
- A **full-stack data flow** must be documented (component → API → state → component)
- The user asks to "integrate frontend and backend", "bind components to APIs", or "generate full-stack DSL"

---

## Inputs

| Source | Path | Content |
|--------|------|---------|
| **pi-be-data-dsl-engine** | `docs/dsl/backend/` | Data transformation patterns, API endpoint definitions, request/response schemas |
| **pi-fe-view-dsl-engine** | `docs/dsl/frontend/` | Page structure definitions, component trees, layout specifications |

Both DSLs must be present before integration. If either is missing, report the gap and abort.

---

## Output

Integrated DSL files are written to `docs/dsl/integrated/`.

Each file corresponds to **one page** and contains:

| Section | Purpose |
|---------|---------|
| `components` | UI component tree with type, data source, and actions |
| `dataSources` | API endpoints mapped to each component |
| `apiMappings` | Explicit binding: component → HTTP method + endpoint |
| `eventHandlers` | User interactions and their corresponding API calls |
| `stateFlow` | Data flow between components (selection, submission, refresh) |

---

## Integrated DSL Syntax

### Example

```
# Page: Space Management
# Integrated from: frontend view DSL + backend data DSL

page "SpaceManagement" {
  route: /space/manage

  components {
    SpaceList {
      type: table
      dataSource: api.space.list (GET /tSpace/list)
      columns: [id, spaceName, spaceCode, status, createdAt]
      actions: [add, edit, delete]
    }

    SpaceForm {
      type: form
      dataSource: api.space.detail (GET /tSpace/detail)
      submit: api.space.save (POST /tSpace/addOrUpdate)
      fields: [spaceName, spaceCode, status]
    }
  }

  dataFlow {
    SpaceList.select -> SpaceForm.load
    SpaceForm.submit -> SpaceList.refresh
  }
}
```

### Syntax Reference

| Construct | Format | Description |
|-----------|--------|-------------|
| `page "Name"` | `page "PageName" { ... }` | Top-level page definition |
| `route` | `route: /path/to/page` | Client-side route |
| `components { ... }` | Component blocks | All UI components on the page |
| `type` | `table`, `form`, `card`, `tree`, `modal`, `detail` | Component type from frontend DSL |
| `dataSource` | `api.resource.action (METHOD /endpoint)` | Read API binding |
| `submit` | `api.resource.action (METHOD /endpoint)` | Write API binding (for forms) |
| `columns` / `fields` | `[field1, field2, ...]` | Data shape the component uses |
| `actions` | `[add, edit, delete, ...]` | User-facing operations |
| `dataFlow { ... }` | Arrow expressions | Inter-component data flow |

### Data Flow Expressions

```
ComponentA.event -> ComponentB.action
```

| Event | Meaning |
|-------|---------|
| `select` | Row/item selected in a list or tree |
| `submit` | Form submitted |
| `cancel` | Form dismissed |
| `refresh` | Reload component data |
| `load` | Fetch detail data for the selected item |

---

## Integration Rules

Components are matched to APIs using three strategies, applied in priority order:

### 1. Explicit Annotations

If the frontend DSL contains `@api(resource.action)` or the backend DSL contains `@ui(componentName)`, use the explicit binding directly.

```
# Frontend DSL annotation
SpaceList @api(space.list)

# Backend DSL annotation
GET /tSpace/list @ui(SpaceList)
```

### 2. Naming Conventions

Match by convention when no annotation exists:

| Pattern | Frontend | Backend |
|---------|----------|---------|
| List/Query | `XxxList`, `XxxTable` | `GET /xxx/list`, `xxx.query` |
| Detail | `XxxDetail`, `XxxForm` | `GET /xxx/detail`, `xxx.get` |
| Create/Update | `XxxForm` (submit) | `POST /xxx/addOrUpdate`, `xxx.save` |
| Delete | Action button | `POST /xxx/delete`, `xxx.remove` |

### 3. URL Pattern Matching

Fall back to path-based matching:

- Route `/space/manage` → API prefix `/tSpace/*`
- Route `/user/list` → API prefix `/tUser/*`

Strip common prefixes (`/t`, `api/`) and match the resource name.

---

## Workflow

### Step 1 — Read Both DSLs

```
Read: docs/dsl/frontend/<page>.dsl
Read: docs/dsl/backend/<resource>.dsl
```

Verify both files exist and are syntactically valid.

### Step 2 — Match Components to APIs

For each component in the frontend DSL:

1. Check for explicit `@api()` annotation → use it
2. Apply naming convention rules → find candidate API
3. Fall back to URL pattern matching → confirm resource match
4. If no match found, mark as `dataSource: TBD` and continue

### Step 3 — Generate Integrated DSL

Write the integrated definition to `docs/dsl/integrated/<page>.dsl` using the syntax defined above.

Include:
- All components from the frontend DSL
- Data sources resolved from the backend DSL
- Data flow expressions derived from user interactions

### Step 4 — Validate Bidirectional Consistency

Check both directions:

| Direction | Check |
|-----------|-------|
| Frontend → Backend | Every `dataSource` and `submit` references a valid API in the backend DSL |
| Backend → Frontend | Every API endpoint in the backend DSL is consumed by at least one component (or explicitly marked as unused) |

Report any mismatches:
- Components with no API binding → `TBD`
- APIs with no UI consumer → `unused`
- Type mismatches (e.g., form submits to a GET endpoint)

### Step 5 — Output Summary

```
Integrated DSL generated: docs/dsl/integrated/<page>.dsl
  Components bound: N/M
  APIs consumed: N/M
  Unresolved bindings: K
```

---

## Cross-Reference

| Skill | Role |
|-------|------|
| **pi-be-data-dsl-engine** | Provides backend data DSL — API definitions, request/response schemas, data transformations |
| **pi-fe-view-dsl-engine** | Provides frontend view DSL — page structure, component trees, layout specs |
| **pi-integrate-fe-be** (this skill) | Consumes both outputs and produces integrated full-stack DSL |

### Dependency Chain

```
pi-fe-view-dsl-engine → docs/dsl/frontend/  ─┐
                                               ├──→ pi-integrate-fe-be → docs/dsl/integrated/
pi-be-data-dsl-engine → docs/dsl/backend/   ─┘
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Frontend DSL missing | Report missing file, abort |
| Backend DSL missing | Report missing file, abort |
| Component has no matching API | Mark `dataSource: TBD`, continue integration |
| API has no matching component | Mark as `unused`, continue integration |
| Type/signature mismatch | Flag in validation step with details |
| Multiple candidate APIs for one component | Choose best match by naming convention, note ambiguity |

---

## Tips

- Run this skill **after** both `pi-fe-view-dsl-engine` and `pi-be-data-dsl-engine` have produced their outputs
- The integrated DSL serves as a contract for frontend-backend handshake — share it with both teams
- Keep the integrated DSL in sync: when APIs change, update the binding; when UI changes, re-validate data flow
- Use `TBD` markers liberally during early stages, then resolve them as the API surface stabilizes
