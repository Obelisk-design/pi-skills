---
name: pi-skills-url-trigger-optimization
date: 2026-05-15
status: draft
---

# pi-yapi & pi-modao-capture URL 触发优化设计

优化 YApi 和 Modao skills 的 URL 直接触发能力，以及增量更新策略。

---

## 一、核心决策

| 问题 | 决策 |
|------|------|
| YApi URL 触发粒度 | URL 触发后询问用户意图 |
| Modao URL 触发场景 | URL 触发后询问用户意图 |
| 增量 vs 全量策略 | 默认增量更新，用户显式指定才全量覆盖 |

---

## 二、实现方案

**方案 A：修改现有 SKILL.md 的 description + 增加交互流程**

- 更新 pi-yapi 和 pi-modao-capture 的 description，添加 URL pattern 匹配
- 在 SKILL.md 中增加 "URL Trigger Flow" 流程说明
- 增加 "Incremental vs Full Generation/Capture" 部分定义默认行为

**优点：** 改动最小，保持 skills 轻量，无需新增脚本

---

## 三、pi-yapi SKILL.md 改动

### 1. 更新 description

```yaml
---
name: pi-yapi
description: Use when user provides YApi URL (matches http://10.0.53.135/project/{project_id}/interface/api/{interface_id} or http://10.0.53.135/project/{project_id}/interface/api/cat_{cat_id}) or requests YApi interface documentation export/query. URL trigger prompts user for intent before action.
---
```

### 2. 新增 URL Trigger Flow 部分

插入位置：Workflows 部分之后（约 Line 80）

```markdown
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

### 3. 新增 Incremental vs Full Generation 部分

插入位置：Cookie Expiry Handling 部分之后（约 Line 220）

```markdown
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

---

## 四、pi-modao-capture SKILL.md 改动

### 1. 更新 description

```yaml
---
name: pi-modao-capture
description: Use when user provides Modao URL (matches https://modao.cc/proto/*/sharing or https://modao.cc/*) or requests Modao prototype capture/design review. URL trigger prompts user for intent before action.
---
```

### 2. 新增 URL Trigger Flow 部分

插入位置：Workflow 部分之后（约 Line 35）

```markdown
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

### 3. 新增 Incremental vs Full Capture 部分

插入位置：Notes 部分之后（约 Line 77）

```markdown
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

---

## 五、改动文件汇总

| 文件 | 改动类型 | 改动内容 |
|------|----------|----------|
| `pi-yapi/SKILL.md` | 修改 | description + URL Trigger Flow + Incremental |
| `pi-modao-capture/SKILL.md` | 修改 | description + URL Trigger Flow + Incremental |

**无需新增文件。**

---

## 六、测试场景验证

| 场景 | 预期行为 |
|------|----------|
| 用户粘贴 `http://10.0.53.135/project/3054/interface/api/187387` | Skill 自动触发，询问操作意图 |
| 用户粘贴 `https://modao.cc/proto/xxx/sharing` | Skill 自动触发，询问操作意图 |
| `docs/yapi/3054/` 已存在，用户说"新增接口" | 增量添加，不覆盖现有 |
| `docs/yapi/3054/` 已存在，用户说"重新生成" | 全量覆盖 |
| `docs/modao/{project}/` 已存在，用户说"重新截图" | 全量重新捕获 |
| 目录不存在，用户粘贴 URL | 默认导出/捕获，不询问增量问题 |

---

## 七、下一步

设计完成后，调用 `writing-plans` skill 创建实现计划。