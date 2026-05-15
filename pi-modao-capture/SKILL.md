---
name: pi-modao-capture
description: Use when capturing Modao (墨刀) prototype designs - extracts pages, screenshots, and annotations from Modao sharing links to generate project documentation with markdown annotations and visual references.
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
