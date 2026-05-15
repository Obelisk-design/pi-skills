# pi-yapi 技能说明

## 一、概述

pi-yapi 是 PI-Skills 流程的 API 捕获阶段，负责从 YApi 平台导出接口文档到本地项目。它将接口定义转化为结构化 Markdown 文档，为后端 DSL 生成和代码审查提供 API 合约参考。

**核心价值：**
- 自动化导出接口文档，避免人工复制遗漏
- 结构化输出，便于 AI 分析和 DSL 生成
- 提供 Layer 1 审查的 API 合约基准

---

## 二、使用方式

### 认证准备

**Cookie 文件位置：** `~/.yapi_cookie_raw.txt`

**获取 Cookie 方法：**
1. 打开 YApi 平台并登录
2. 按 F12 打开开发者工具 → Console
3. 执行 `document.cookie` 复制输出
4. 保存到文件：
   ```bash
   echo '_yapi_token=xxx; _yapi_uid=yyy' > ~/.yapi_cookie_raw.txt
   ```

### 调用方式

用户通过 `/pi-yapi` 命令触发，AI 执行以下流程：

1. 从 YApi URL 解析项目/分类 ID
2. 使用 Cookie 认证调用 YApi API
3. 导出接口列表和详情
4. 生成结构化 Markdown 文档

### 示例输入

```
/pi-yapi http://10.0.53.135/project/3054/interface/api/cat_28333
```

---

## 三、输入与输出

### 输入

| 输入项 | 说明 |
|--------|------|
| YApi 项目 URL | 如 `http://10.0.53.135/project/3054` |
| YApi 分类 URL | 如 `http://10.0.53.135/project/3054/interface/api/cat_28333` |
| YApi 接口 URL | 如 `http://10.0.53.135/project/3054/interface/api/187399` |
| Cookie 文件 | `~/.yapi_cookie_raw.txt` |

### 输出目录结构

```
docs/yapi/{project_name}/
├── README.md                          # 接口索引
└── {接口ID}_{接口标题}.md              # 接口详情文档
```

### 输出文件内容

**README.md（接口索引）：**
- 项目名称和来源链接
- 接口列表表格（ID、标题、路径、方法）
- 快速导航链接

**接口详情文档：**
- 接口元信息（ID、路径、方法、状态）
- 请求参数（Query、Path、Body）
- 响应参数结构
- JSON Schema 定义

---

## 四、工作流程

```
┌─────────────────────────────────────────────┐
│  Step 1: 解析 YApi URL                      │
│  - 提取项目 ID 或分类 ID                    │
│  - 确定导出范围                             │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 2: 验证 Cookie                        │
│  - 读取 ~/.yapi_cookie_raw.txt              │
│  - 测试 /api/user/info 验证有效性           │
│  - 失败时提示用户刷新                       │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 3: 获取项目信息                       │
│  - 调用 /api/project?id=xxx                 │
│  - 提取项目名称                             │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 4: 遍历接口列表                       │
│  - 调用 /api/interface/list_cat             │
│  - 分页获取所有接口                         │
│  - 提取 ID、标题、路径、方法                │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 5: 获取接口详情                       │
│  - 对每个接口调用 /api/interface/get        │
│  - 解析 JSON Schema                         │
│  - 提取请求/响应参数                        │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 6: 生成 Markdown 文档                 │
│  - 创建项目索引 README.md                   │
│  - 为每个接口生成详情文档                   │
│  - 输出到 docs/yapi/{project_name}/         │
└─────────────────────────────────────────────┘
```

---

## 五、API 端点参考

| 端点 | 说明 | 参数 |
|------|------|------|
| `/api/user/info` | 用户信息（验证 Cookie） | — |
| `/api/project` | 项目详情 | `id=<project_id>` |
| `/api/interface/list_menu` | 分类菜单 | `project_id=<id>` |
| `/api/interface/list_cat` | 分类下接口列表 | `catid=<cat_id>` |
| `/api/interface/get` | 接口详情 | `id=<interface_id>` |

### 请求格式

```bash
COOKIE=$(cat ~/.yapi_cookie_raw.txt)
curl -s -H "Cookie: $COOKIE" "http://10.0.53.135/api/interface/get?id=187399"
```

---

## 六、最佳实践

### 1. Cookie 管理

| 实践 | 说明 |
|------|------|
| 定期刷新 | Cookie 有效期有限，过期时需重新获取 |
| 统一存储 | 使用固定文件路径，便于多项目复用 |
| 验证优先 | 导出前先验证 Cookie 有效性 |

### 2. 导出范围选择

| 场景 | 推荐方式 |
|------|----------|
| 全项目导出 | 使用项目 URL |
| 单模块导出 | 使用分类 URL |
| 单接口查询 | 使用接口 URL |

### 3. 目录命名

输出目录自动使用 YApi 项目名称，确保跨项目时目录不冲突。

### 4. 与 DSL 流程配合

建议与 pi-modao-capture 并行执行，同时完成设计捕获和 API 捕获。

---

## 七、常见问题

### Q1: Cookie 过期（返回 40011）

**表现：** API 返回 `{ errcode: 40011 }`

**解决：**
1. 打开 YApi 平台重新登录
2. 执行 `document.cookie` 获取新 Cookie
3. 更新 `~/.yapi_cookie_raw.txt`

### Q2: 接口列表不完整

**原因：** 分页参数过小

**解决：** 使用 `limit=100` 或更大值获取完整列表

### Q3: 项目名称获取失败

**原因：** 项目 ID 错误或无权限

**解决：**
- 确认 URL 中项目 ID 正确
- 检查用户是否有项目访问权限

### Q4: JSON Schema 解析困难

**原因：** YApi 中的 Schema 可能不规范

**解决：**
- AI 会尽力解析，标注不明确字段
- 人工确认复杂结构

---

## 八、与其他 Skill 的关系

| Skill | 关系 | 说明 |
|-------|------|------|
| **pi-be-data-dsl-engine** | 消费者 | 读取 pi-yapi 输出生成后端数据 DSL |
| **pi-review** | 参考 | Layer 1 对比 Code 与 YApi 验证 API 合规 |
| **pi-workflow** | Phase 1 | 工作流第一步并行执行 API 捕获 |

---

## 九、后续步骤

完成 pi-yapi 后，推荐执行：

1. **pi-be-data-dsl-engine** — 将接口文档转化为后端数据 DSL
2. **pi-integrate-fe-be** — 集成前端 DSL 与后端数据 DSL
3. **pi-review** — 代码审查时使用 YApi 作为 Layer 1 参考