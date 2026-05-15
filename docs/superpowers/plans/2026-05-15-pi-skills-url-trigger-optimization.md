# pi-yapi & pi-modao-capture URL Trigger Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable URL direct trigger for pi-yapi and pi-modao-capture skills, with intent prompt and incremental update behavior.

**Architecture:** Modify SKILL.md descriptions to match URL patterns, add URL Trigger Flow sections, add Incremental vs Full sections, update pi-workflow Quick Start, sync to global skills.

**Tech Stack:** Markdown, Claude Code skill system

---

## File Structure

```
Files to modify:
├── pi-yapi/SKILL.md            # Add URL trigger + incremental logic
├── pi-modao-capture/SKILL.md   # Add URL trigger + incremental logic
├── pi-workflow/SKILL.md        # Update Quick Start for URL trigger
└── ~/.claude/skills/pi-skills/ # Sync copies (after local changes)
    ├── pi-yapi/SKILL.md
    └── pi-modao-capture/SKILL.md
```

---

### Task 1: Update pi-yapi SKILL.md - Description

**Files:**
- Modify: `pi-yapi/SKILL.md` (lines 1-4)

- [ ] **Step 1: Update frontmatter description**

Replace lines 1-4:

```markdown
---
name: pi-yapi
description: Use when user provides YApi URL (matches http://10.0.53.135/project/{project_id}/interface/api/{interface_id} or http://10.0.53.135/project/{project_id}/interface/api/cat_{cat_id}) or requests YApi interface documentation export/query. URL trigger prompts user for intent before action.
---
```

- [ ] **Step 2: Verify change**

Read `pi-yapi/SKILL.md` lines 1-4 and confirm description contains URL pattern.

- [ ] **Step 3: Commit**

```bash
git add pi-yapi/SKILL.md
git commit -m "feat(pi-yapi): update description for URL trigger matching"
```

---

### Task 2: Update pi-yapi SKILL.md - URL Trigger Flow

**Files:**
- Modify: `pi-yapi/SKILL.md` (insert after line ~80, after Workflows section)

- [ ] **Step 1: Find insertion point**

Read `pi-yapi/SKILL.md` and locate the end of "## Workflows" section (around line 80-100).

- [ ] **Step 2: Insert URL Trigger Flow section**

Insert after Workflows section:

```markdown
---

## URL Trigger Flow

When user provides a YApi URL, **ASK FIRST** before taking action:

**Question:**
> "检测到 YApi 链接。请确认您需要的操作：
> 1. **查看接口** — 仅显示接口详情，不生成文件
> 2. **导出到本地** — 生成 Markdown 文档到 `docs/yapi/`
> 3. **更新现有文档** — 已有文档时增量更新
> 4. **重新生成** — 覆盖现有文档（全量）

**URL Pattern Detection:**

| URL Pattern | Extracted ID | Default Suggestion |
|-------------|--------------|-------------------|
| `/interface/api/{id}` | interface_id | 查看接口 |
| `/interface/api/cat_{id}` | cat_id | 导出分类 |

**Example:**
- User: `http://10.0.53.135/project/3054/interface/api/187387`
- Skill: "检测到单个接口链接。建议操作：查看接口。请确认或选择其他操作。"
```

- [ ] **Step 3: Verify insertion**

Read the file and confirm section appears after Workflows.

- [ ] **Step 4: Commit**

```bash
git add pi-yapi/SKILL.md
git commit -m "feat(pi-yapi): add URL Trigger Flow section"
```

---

### Task 3: Update pi-yapi SKILL.md - Incremental Logic

**Files:**
- Modify: `pi-yapi/SKILL.md` (insert after Cookie Expiry Handling, around line 220)

- [ ] **Step 1: Find insertion point**

Read `pi-yapi/SKILL.md` and locate end of "## Cookie Expiry Handling" section.

- [ ] **Step 2: Insert Incremental section**

Insert after Cookie Expiry Handling:

```markdown
---

## Incremental vs Full Generation

**Default behavior: Incremental update**

When `docs/yapi/{project}/` already exists:

| Scenario | Behavior |
|----------|----------|
| User says "新增页面" or "添加接口" | Append new interface docs, keep existing |
| User says "重新生成" or "覆盖" | Delete existing, regenerate all |
| User provides URL without explicit intent | Ask: "已有文档，新增接口 or 重新生成？" |

**Incremental process:**
1. Check if `docs/yapi/{project}/README.md` exists
2. If exists → ask user intent
3. If incremental → only add/update specified interfaces
4. Update README.md index with new entries
```

- [ ] **Step 3: Verify insertion**

Read file and confirm section appears.

- [ ] **Step 4: Commit**

```bash
git add pi-yapi/SKILL.md
git commit -m "feat(pi-yapi): add Incremental vs Full Generation section"
```

---

### Task 4: Update pi-modao-capture SKILL.md - Description

**Files:**
- Modify: `pi-modao-capture/SKILL.md` (lines 1-4)

- [ ] **Step 1: Update frontmatter description**

Replace lines 1-4:

```markdown
---
name: pi-modao-capture
description: Use when user provides Modao URL (matches https://modao.cc/proto/*/sharing or https://modao.cc/*) or requests Modao prototype capture/design review. URL trigger prompts user for intent before action.
---
```

- [ ] **Step 2: Verify change**

Read `pi-modao-capture/SKILL.md` lines 1-4 and confirm.

- [ ] **Step 3: Commit**

```bash
git add pi-modao-capture/SKILL.md
git commit -m "feat(pi-modao-capture): update description for URL trigger matching"
```

---

### Task 5: Update pi-modao-capture SKILL.md - URL Trigger Flow

**Files:**
- Modify: `pi-modao-capture/SKILL.md` (insert after Workflow section, around line 35)

- [ ] **Step 1: Find insertion point**

Read file and locate end of "### Workflow" section.

- [ ] **Step 2: Insert URL Trigger Flow section**

Insert after Workflow section:

```markdown
---

## URL Trigger Flow

When user provides a Modao URL, **ASK FIRST** before taking action:

**Question:**
> "检测到 Modao 链接。请确认您需要的操作：
> 1. **截图捕获** — 抓取原型截图到 `docs/modao/`
> 2. **查看原型** — 在浏览器预览，不生成文件
> 3. **UI 对比验证** — 用截图与现有代码对比（调用 pi-review）
> 4. **生成 DSL** — 从截图生成前端 DSL（调用 pi-fe-view-dsl-engine）

**URL Pattern Detection:**

| URL Pattern | Detected Type |
|-------------|---------------|
| `https://modao.cc/proto/*/sharing` | Sharing link (可截图) |
| `https://modao.cc/proto/*` (无 sharing) | Preview link (可能需要密码) |
| `https://modao.cc/design/*` | Design link |

**Example:**
- User: `https://modao.cc/proto/xxx/sharing`
- Skill: "检测到 Modao 分享链接。建议操作：截图捕获。请确认或选择其他操作。"
```

- [ ] **Step 3: Verify insertion**

Read file and confirm.

- [ ] **Step 4: Commit**

```bash
git add pi-modao-capture/SKILL.md
git commit -m "feat(pi-modao-capture): add URL Trigger Flow section"
```

---

### Task 6: Update pi-modao-capture SKILL.md - Incremental Logic

**Files:**
- Modify: `pi-modao-capture/SKILL.md` (insert after Notes section, around line 77)

- [ ] **Step 1: Find insertion point**

Read file and locate end of "### Notes" section.

- [ ] **Step 2: Insert Incremental section**

Insert after Notes section:

```markdown
---

## Incremental vs Full Capture

**Default behavior: Incremental capture**

When `docs/modao/{project}/` already exists:

| Scenario | Behavior |
|----------|----------|
| User says "新增页面" | Append new page screenshots, keep existing |
| User says "重新截图" or "覆盖" | Delete existing, capture all pages |
| User provides URL without explicit intent | Ask: "已有截图，新增页面 or 重新捕获？" |

**Incremental process:**
1. Check if `docs/modao/{project}/README.md` exists
2. If exists → ask user intent
3. If incremental → only capture new/updated pages
4. Update README.md index with new entries

**Note:** Modao pages may change over time. Use "重新截图" to refresh all.
```

- [ ] **Step 3: Verify insertion**

Read file and confirm.

- [ ] **Step 4: Commit**

```bash
git add pi-modao-capture/SKILL.md
git commit -m "feat(pi-modao-capture): add Incremental vs Full Capture section"
```

---

### Task 7: Update pi-workflow SKILL.md - Quick Start

**Files:**
- Modify: `pi-workflow/SKILL.md` (Quick Start section, around lines 268-277)

- [ ] **Step 1: Find Quick Start section**

Read `pi-workflow/SKILL.md` and locate "## Quick Start" section.

- [ ] **Step 2: Update Quick Start to include URL trigger**

Replace the Quick Start section (lines 268-277) with:

```markdown
## Quick Start

**Traditional invocation:**

When the user says "start the pipeline", "run full workflow", or "从原型到上线":

1. Confirm the user has:
   - Modao sharing link (for pi-modao-capture)
   - YApi project/category info (for pi-yapi)
2. Run Phase 1a and 1b in parallel
3. Proceed through phases sequentially
4. Report a status summary after each phase

**URL direct trigger (NEW):**

When user provides a URL directly:

| URL Type | Triggered Skill | Skill asks user intent |
|----------|-----------------|------------------------|
| `http://10.0.53.135/project/*/interface/api/*` | `pi-yapi` | 查看接口 / 导出 / 更新 / 重新生成 |
| `https://modao.cc/proto/*/sharing` | `pi-modao-capture` | 截图捕获 / 查看 / UI对比 / 生成DSL |

After URL-triggered skill completes:
- If user chose "导出" or "截图捕获" → Proceed to Phase 2 (DSL Generation)
- If user chose other options → End, no further phases
```

- [ ] **Step 3: Verify update**

Read pi-workflow/SKILL.md Quick Start and confirm URL trigger table present.

- [ ] **Step 4: Commit**

```bash
git add pi-workflow/SKILL.md
git commit -m "feat(pi-workflow): add URL direct trigger in Quick Start"
```

---

### Task 8: Sync to Global Skills

**Files:**
- Copy to: `~/.claude/skills/pi-skills/pi-yapi/SKILL.md`
- Copy to: `~/.claude/skills/pi-skills/pi-modao-capture/SKILL.md`
- Copy to: `~/.claude/skills/pi-skills/pi-workflow/SKILL.md`

- [ ] **Step 1: Copy pi-yapi SKILL.md**

```bash
cp pi-yapi/SKILL.md ~/.claude/skills/pi-skills/pi-yapi/SKILL.md
```

- [ ] **Step 2: Copy pi-modao-capture SKILL.md**

```bash
cp pi-modao-capture/SKILL.md ~/.claude/skills/pi-skills/pi-modao-capture/SKILL.md
```

- [ ] **Step 3: Copy pi-workflow SKILL.md**

```bash
cp pi-workflow/SKILL.md ~/.claude/skills/pi-skills/pi-workflow/SKILL.md
```

- [ ] **Step 4: Verify sync**

```bash
diff pi-yapi/SKILL.md ~/.claude/skills/pi-skills/pi-yapi/SKILL.md
diff pi-modao-capture/SKILL.md ~/.claude/skills/pi-skills/pi-modao-capture/SKILL.md
diff pi-workflow/SKILL.md ~/.claude/skills/pi-skills/pi-workflow/SKILL.md
```

Expected: No differences (files identical).

- [ ] **Step 5: Report sync complete**

No commit needed for global skills (user's local environment).

---

### Task 9: Final Verification

- [ ] **Step 1: Verify all local changes**

```bash
git log --oneline -10
```

Expected: 7 commits for this feature.

- [ ] **Step 2: Test URL trigger simulation**

Manually verify:
- pi-yapi description contains `http://10.0.53.135/project/*/interface/api/*`
- pi-modao-capture description contains `https://modao.cc/proto/*/sharing`
- URL Trigger Flow sections present in both files
- Incremental sections present in both files
- pi-workflow Quick Start has URL trigger table

- [ ] **Step 3: Final commit (if any pending)**

```bash
git status
git add -A
git commit -m "feat: complete URL trigger optimization for pi-yapi and pi-modao-capture"
```

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | pi-yapi/SKILL.md | Description update |
| 2 | pi-yapi/SKILL.md | URL Trigger Flow section |
| 3 | pi-yapi/SKILL.md | Incremental vs Full section |
| 4 | pi-modao-capture/SKILL.md | Description update |
| 5 | pi-modao-capture/SKILL.md | URL Trigger Flow section |
| 6 | pi-modao-capture/SKILL.md | Incremental vs Full section |
| 7 | pi-workflow/SKILL.md | Quick Start URL trigger |
| 8 | ~/.claude/skills/ | Sync to global |
| 9 | Final verification | Confirm all changes |