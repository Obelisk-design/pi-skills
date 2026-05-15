---
name: pi-yapi
description: Use when user provides YApi URL (matches http://10.0.53.135/project/{project_id}/interface/api/{interface_id} or http://10.0.53.135/project/{project_id}/interface/api/cat_{cat_id}) or requests YApi interface documentation export/query. URL trigger prompts user for intent before action.
---

# PI YApi Skill

Query, export, and generate structured Markdown documentation from the YApi platform.

**YApi base URL:** `http://10.0.53.135`

## Core Capabilities

- Query project categories, interface lists, and individual interface details
- Export interface documentation to local `docs/yapi/` directory with structured Markdown output
- Generate parameter references from YApi JSON Schema definitions

## Authentication

All requests use Cookie-based authentication via the `-H "Cookie: ..."` header.

> **Do not use `curl -b`.** Cookie file parsing is unreliable in Windows / Git Bash environments.

### Cookie File Location

```
~/.yapi_cookie_raw.txt
```

### Obtaining a Cookie

1. Open `http://10.0.53.135` and log in
2. Press **F12** to open DevTools, go to the **Console** tab
3. Execute `document.cookie` and copy the output
4. Save it to the cookie file:

   ```bash
   echo '_yapi_token=xxx; _yapi_uid=yyy' > ~/.yapi_cookie_raw.txt
   ```

### Validating the Cookie

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" "http://10.0.53.135/api/user/info"
```

### Cookie Expiry

If the API returns `40011`, the cookie has expired. Repeat the steps above to refresh `~/.yapi_cookie_raw.txt`.

## Request Pattern

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" "http://10.0.53.135/api/<endpoint>"
```

| Flag | Purpose |
|------|---------|
| `-H "Cookie: $COOKIE"` | Authentication (required for all calls) |
| `-H "Content-Type: application/json"` | Set request content type |
| `-d '{"key":"value"}'` | Send JSON body |
| `-s` | Silent mode (suppress progress) |

## API Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `/api/user/info` | Current user info | — |
| `/api/project/list` | Project list | — |
| `/api/project` | Project details | `?id=<project_id>` |
| `/api/interface/list_menu` | Category menu | `?project_id=<project_id>` |
| `/api/interface/list_cat` | Categories with interface list | `?page=1&limit=20&catid=<cat_id>` |
| `/api/interface/list` | Interface list | `?project_id=<id>&cat_id=<cat_id>` |
| `/api/interface/get` | Single interface detail | `?id=<interface_id>` |
| `/api/interface/search` | Search interfaces | `?project_id=<id>&q=<keyword>` |

## Workflows

### 1. List All Interfaces in a Category

Extract `catid` from a YApi category URL (e.g. `http://10.0.53.135/project/3054/interface/api/28333` -> `catid=28333`), then paginate through results:

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" \
  "http://10.0.53.135/api/interface/list_cat?page=1&limit=100&catid=28333"
```

Parse the `list` array from the response to extract each interface `_id`, `title`, `path`, and `method`.

### 2. Query a Single Interface

Extract the interface `id` from a YApi URL (e.g. `http://10.0.53.135/project/3054/interface/api/187399` -> `id=187399`):

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" \
  "http://10.0.53.135/api/interface/get?id=187399"
```

### 3. Export Interface Documentation to Local `docs/yapi/` Directory

**Step 1 -- Fetch project info:**

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" \
  "http://10.0.53.135/api/project?id=3054"
```

Extract `project_name` from the response.

**Step 2 -- Fetch interface list:**

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" \
  "http://10.0.53.135/api/interface/list_cat?page=1&limit=100&catid=28333"
```

Extract `_id`, `title`, `path`, and `method` from each item in the `list` array.

**Step 3 -- Fetch detail for each interface:**

For every interface ID obtained in Step 2:

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" \
  "http://10.0.53.135/api/interface/get?id=<interface_id>"
```

**Step 4 -- Generate Markdown files:**

Create the following directory structure in the project:

```
docs/
└── yapi/
    └── {project_name}/
        ├── README.md                            # Interface index
        └── {interface_id}_{title}.md            # Detail per interface
```

**README.md (index template):**

```markdown
# {project_name} API Documentation

> Source: YApi http://10.0.53.135/project/3054

| ID | Title | Path | Method | Detail |
|----|-------|------|--------|--------|
| 187399 | Space Add/Update | /tSpace/addOrUpdate | POST | [View](./187399_Space_Add_Update.md) |
```

**Interface detail template (`{interface_id}_{title}.md`):**

```markdown
# {title}

- **ID:** {interface_id}
- **Path:** {path}
- **Method:** {method}
- **Status:** {status}
- **Author:** {username}

## Request Headers

| Name | Value | Required |
|------|-------|----------|
| Content-Type | application/json | Yes |

## Request Parameters

### Query Parameters

(req_query array)

### Path Parameters

(req_params array)

### Body Parameters (JSON)

(Parse the JSON Schema from req_body_other; extract fields from properties.)

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| spaceName | string | Space name | Yes |
| spaceCode | string | Space code | Yes |
```

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

---

## Interface Detail -- Key Fields

Fields returned in the `data` object from `/api/interface/get`:

| Field | Description |
|-------|-------------|
| `title` | Interface title |
| `path` | Request path |
| `method` | HTTP method (GET / POST / PUT / DELETE) |
| `status` | Status (e.g. `done`, `undone`) |
| `username` | Maintainer |
| `req_body_type` | Body type (`json`, `form`, etc.) |
| `req_body_other` | JSON Schema string (contains `properties`, `required`) |
| `req_query` | Array of query parameters |
| `req_params` | Array of path parameters |
| `req_headers` | Array of request headers |
| `res_body` | Response JSON Schema string |
| `add_time` | Created timestamp (Unix) |
| `up_time` | Updated timestamp (Unix) |

## Cookie Expiry Handling

When a response returns `40011`:

1. Notify the user that the cookie has expired
2. Instruct them to run `document.cookie` in the browser console
3. Update `~/.yapi_cookie_raw.txt` with the new value

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
