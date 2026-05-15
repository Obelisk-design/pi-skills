---
name: pi-modao-capture
description: Use when user provides Modao URL (matches https://modao.cc/proto/*/sharing or https://modao.cc/*) or requests Modao prototype capture/design review. URL trigger prompts user for intent before action.
---

## Modao Prototype Capture

Extract pages, screenshots, and annotations from Modao (墨刀) prototype sharing links. Generates structured markdown documentation with visual references for project use.

### Invocation

Run the capture script via Node.js:

```bash
node ~/.claude/skills/pi-modao-capture/scripts/modao-capture.js \
    --url "<sharing_url>" \
    [--output "<output_dir>"] \
    [--password "<password>"] \
    [--scale <quality>] \
    [--concurrency <workers>]
```

### Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-u, --url <url>` | Modao prototype sharing link (required) | — |
| `-p, --password <password>` | Password for protected prototypes | — |
| `-o, --output <dir>` | Output directory | `process.cwd()` |
| `-c, --concurrency <number>` | Concurrent page processing count | `3` |
| `-s, --scale <number>` | Screenshot scale factor (1–5) | `3` |

### Workflow

1. **Capture** — Execute the script to fetch all pages from the sharing link.
2. **Review** — Read the generated `README.md` index and per-page markdown files.
3. **Annotate** — Use the extracted screenshots and annotations to inform design or implementation decisions.

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

### Examples

```bash
# Basic — output to current directory
node ~/.claude/skills/pi-modao-capture/scripts/modao-capture.js \
    --url "https://modao.cc/proto/xxx/sharing"

# Specify output directory
node ~/.claude/skills/pi-modao-capture/scripts/modao-capture.js \
    --url "https://modao.cc/proto/xxx/sharing" \
    --output "D:/projects/my-project"

# Password-protected prototype
node ~/.claude/skills/pi-modao-capture/scripts/modao-capture.js \
    --url "https://modao.cc/proto/xxx/sharing" \
    --password "ziguangyun"

# High-quality screenshots (scale=5)
node ~/.claude/skills/pi-modao-capture/scripts/modao-capture.js \
    --url "https://modao.cc/proto/xxx/sharing" \
    --scale 5
```

### Output Structure

```
<output_dir>/modao_<canvas_name>/
├── README.md                 # Page index and overview
├── 01_page_name_1.png        # Screenshot for page 1
├── 01_page_name.md           # Page documentation with annotations
└── ...
```

### Notes

- The password can also be provided via the `MODAO_PASSWORD` environment variable.
- The sharing link must be publicly accessible (sharing mode enabled).
- Output defaults to `modao_<canvas_name>/` under the specified or current working directory.

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
