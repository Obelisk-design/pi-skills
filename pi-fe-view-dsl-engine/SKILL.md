---
name: pi-fe-view-dsl-engine
description: Use when generating frontend page structure DSL from Modao prototype screenshots and annotations - transforms design mockups into component tree definitions with layout and interaction specifications.
---

# pi-fe-view-dsl-engine

## Overview

Transforms Modao prototype screenshots and annotations into **frontend page structure DSL** — a declarative definition of the UI component tree, layout rules, interaction patterns, and data binding pointers. This DSL serves as the single source of truth between design intent and frontend implementation.

This skill reads the output of `pi-modao-capture` (screenshots + annotation markdown) and produces structured DSL files that frontend developers or code-generation tools can consume to build actual Vue components.

## When to Use

Trigger this skill when the user:

- Asks to analyze design mockups and generate page structure
- Requests a component tree derived from prototype screenshots
- Wants to create a frontend DSL definition from design artifacts
- Says phrases like:
  - "从原型生成页面结构"
  - "分析设计稿生成 DSL"
  - "把墨刀截图转成组件树"
  - "生成前端页面 DSL"

## Input

Reads from `pi-modao-capture` output in the `docs/modao/` directory:

| Input File | Purpose |
|---|---|
| `docs/modao/screenshots/*.png` | Page screenshots showing the visual layout |
| `docs/modao/annotations/*.md` | Annotation markdown with component descriptions, interaction notes, and field details |
| `docs/modao/index.md` | Page hierarchy and navigation structure |

**Validation**: Before proceeding, confirm that:

1. Screenshot images exist and are readable
2. Annotation markdown contains component-level details (labels, fields, buttons)
3. Page hierarchy is established

If any input is missing, halt and report what is needed.

## Output

Generates page structure DSL files in `docs/dsl/frontend/`:

| Output File | Content |
|---|---|
| `docs/dsl/frontend/<page-slug>.dsl` | DSL definition for a single page |
| `docs/dsl/frontend/index.md` | Index listing all generated DSL files with cross-references |

Each DSL file defines:

- **page-meta**: Page identity, title, source reference
- **component-tree**: Hierarchical UI component structure
- **layout-rules**: Layout mode, spacing, alignment
- **interaction-rules**: Click handlers, modal triggers, form actions
- **data-binding-pointers**: Placeholder references to backend data sources (resolved later by `pi-be-data-dsl-engine`)

## DSL Syntax

The DSL uses a clean, brace-delimited block format that is human-readable and machine-parseable.

### Page Root Block

```
page "ComponentName" {
  title: "Display Title"
  layout: standard-page

  // ... nested component blocks
}
```

### Layout Types

| Layout | Description |
|---|---|
| `standard-page` | Full page with breadcrumb, toolbar, and content area |
| `modal` | Overlay dialog with form fields |
| `drawer` | Side panel sliding from edge |
| `card-section` | Card-wrapped content block |
| `tab-panel` | Tabbed container with multiple panels |

### Component Blocks

Every UI element is a block with properties and optional children:

```
  breadcrumb {
    items: [首页, 空间管理]
  }

  toolbar {
    actions: [
      Button { label: "新增空间", icon: "plus", action: "openForm" }
    ]
    search: { field: "spaceName", placeholder: "搜索空间名称" }
  }

  table "SpaceTable" {
    dataSource: "${api.space.list}"
    columns: [
      { key: "id", title: "ID", width: 80 },
      { key: "spaceName", title: "空间名称", sortable: true },
      { key: "spaceCode", title: "空间编码" },
      { key: "status", title: "状态", type: "tag" },
      { key: "createdAt", title: "创建时间", type: "date" }
    ]
    actions: [
      { key: "edit", label: "编辑", icon: "edit", action: "openForm" },
      { key: "delete", label: "删除", icon: "delete", action: "confirmDelete" }
    ]
  }

  modal "SpaceForm" {
    title: "${isNew ? '新增空间' : '编辑空间'}"
    fields: [
      { key: "spaceName", type: "input", label: "空间名称", required: true, max: 100 },
      { key: "spaceCode", type: "input", label: "空间编码", required: true, max: 50, pattern: "^[a-z]+$" },
      { key: "status", type: "select", label: "状态", options: ["active", "inactive"], default: "active" }
    ]
    actions: ["submit", "cancel"]
  }
```

### Complete Example

```
# Page: Space Management
# Source: Modao 空间管理页面
# Captured: doc/modao/screenshots/space-management.png

page "SpaceManagement" {
  title: "空间管理"
  layout: standard-page

  breadcrumb {
    items: [首页, 空间管理]
  }

  toolbar {
    actions: [
      Button { label: "新增空间", icon: "plus", action: "openForm" }
    ]
    search: { field: "spaceName", placeholder: "搜索空间名称" }
  }

  table "SpaceTable" {
    dataSource: "${api.space.list}"
    columns: [
      { key: "id", title: "ID", width: 80 },
      { key: "spaceName", title: "空间名称", sortable: true },
      { key: "spaceCode", title: "空间编码" },
      { key: "status", title: "状态", type: "tag" },
      { key: "createdAt", title: "创建时间", type: "date" }
    ]
    actions: [
      { key: "edit", label: "编辑", icon: "edit", action: "openForm" },
      { key: "delete", label: "删除", icon: "delete", action: "confirmDelete" }
    ]
    pagination: { pageSize: 20, showTotal: true }
  }

  modal "SpaceForm" {
    title: "${isNew ? '新增空间' : '编辑空间'}"
    width: 520
    fields: [
      { key: "spaceName", type: "input", label: "空间名称", required: true, max: 100 },
      { key: "spaceCode", type: "input", label: "空间编码", required: true, max: 50, pattern: "^[a-z_]+$" },
      { key: "description", type: "textarea", label: "描述", max: 500 },
      { key: "status", type: "select", label: "状态", options: ["active", "inactive"], default: "active" }
    ]
    actions: ["submit", "cancel"]
  }
}
```

### Field Types

| Type | Description |
|---|---|
| `input` | Text input |
| `textarea` | Multi-line text |
| `select` | Dropdown selection |
| `date` | Date picker |
| `dateRange` | Date range picker |
| `number` | Numeric input |
| `switch` | Toggle switch |
| `upload` | File upload |
| `cascader` | Cascading selector |

### Data Binding Syntax

Use `${...}` placeholders to mark where backend data connects:

- `${api.space.list}` — API endpoint reference (resolved by backend DSL)
- `${isNew ? 'A' : 'B'}` — Conditional expression
- `${form.spaceName}` — Form field reference
- `${row.status}` — Table row field reference

## Analysis Process

Follow these steps when processing Modao screenshots and annotations:

### Step 1: Identify Page Structure

Read the page hierarchy from `docs/modao/index.md`. Determine:

- Page name and display title
- Parent/child page relationships
- Breadcrumb trail

### Step 2: Extract Component Types from Screenshots

Analyze each screenshot systematically:

1. **Top area**: Look for breadcrumbs, page titles, action buttons
2. **Toolbar area**: Look for search inputs, filter panels, "Add" buttons
3. **Content area**: Identify the primary display component (table, card grid, form, chart)
4. **Bottom area**: Check for pagination, summary bars, action footers
5. **Overlays**: Note any visible modals, drawers, or tooltips

For each component found, record:

- Component type (table, form, button, input, select, etc.)
- Visible labels and text
- Column headers and field names
- Button labels and their positions

### Step 3: Cross-Reference with Annotations

Read the annotation markdown files to supplement what screenshots show:

- **Interaction descriptions**: What happens on click, hover, submit
- **Validation rules**: Required fields, max length, patterns
- **State indicators**: Tags, badges, status colors
- **Empty states**: What shows when no data exists

### Step 4: Infer Data Bindings

Based on component types and labels, infer where data connects:

- Table columns imply a list/collection data source
- Form fields imply a create/update payload
- Filter/search inputs imply query parameters
- Status fields imply enum values

Mark these with `${...}` placeholders — do not invent API paths; use descriptive placeholders that `pi-be-data-dsl-engine` will resolve.

### Step 5: Define Interactions

From annotations and visual cues, define interaction rules:

- "新增" button opens a form modal
- "编辑" button opens the same modal pre-filled
- "删除" triggers a confirmation dialog
- Table row click navigates to detail page
- Search input triggers filtered list reload

### Step 6: Write DSL File

Generate the DSL file following the syntax defined above. Write it to `docs/dsl/frontend/<page-slug>.dsl`.

### Step 7: Update Index

Append an entry to `doc/dsl/frontend/index.md`:

```markdown
## Generated DSL Files

| Page | DSL File | Source | Components |
|---|---|---|---|
| 空间管理 | `space-management.dsl` | modao/screenshots/space-management.png | table, form, modal, toolbar |
```

## Rules

1. **Preserve all annotated details** — Every field label, button text, and validation rule mentioned in annotations must appear in the DSL. Nothing gets dropped.
2. **Use project component conventions** — The project uses `pi-form` for form layouts. Prefer it in DSL field definitions rather than inventing custom form structures.
3. **No new UI libraries** — Only use components that exist in the project's current UI library. If unsure, mark the component as `custom:<name>` for developer review.
4. **Placeholder data bindings** — Use `${api.<resource>.<action>}` format for data sources. Do not hardcode real API paths; these are resolved by the backend DSL engine.
5. **One DSL file per page** — Each distinct page/view from the prototype gets its own file. Modals and drawers that are triggered from a page are nested blocks within that page's DSL.
6. **Name components descriptively** — Use PascalCase component names that reflect their purpose: `SpaceForm`, `SpaceTable`, `UserFilterPanel`.
7. **Validate before writing** — If a screenshot is too blurry to read labels, or annotations are missing critical details, report the gap instead of guessing.

## Cross-References

| Skill | Role | Relationship |
|---|---|---|
| `pi-modao-capture` | Input source | Provides screenshots and annotations this skill consumes |
| `pi-be-data-dsl-engine` | Parallel output | Generates backend data DSL; FE DSL references its outputs via `${...}` bindings |
| `pi-integrate-fe-be` | Consumer | Merges FE view DSL and BE data DSL into implementation-ready specs |

## Workflow Summary

```
pi-modao-capture          pi-fe-view-dsl-engine          pi-be-data-dsl-engine
┌─────────────────┐      ┌──────────────────────┐      ┌───────────────────────┐
│ screenshots.png │─────▶│ space-management.dsl │      │ space-api.dsl         │
│ annotations.md  │      │ (component tree +    │      │ (data model +         │
│                 │      │  layout + actions)   │      │  endpoints + enums)   │
└─────────────────┘      └──────────────────────┘      └───────────┬───────────┘
                                                                    │
                                                                    ▼
                                                          ┌───────────────────────┐
                                                          │ pi-integrate-fe-be      │
                                                          │ (merge → implementation │
                                                          │  spec)                  │
                                                          └───────────────────────┘
```
