---
name: pi-be-data-dsl-engine
description: Use when generating data transformation DSL patterns from YApi interface documentation - maps API request/response schemas to structured data DSL definitions for backend data processing pipelines.
---

# PI Backend Data DSL Engine

将 YApi 接口文档（由 pi-yapi 导出）转换为后端数据处理 DSL 定义，为数据转换管道、字段映射、参数校验等提供结构化的规则描述语言。

**核心能力：**
- 读取 pi-yapi 导出的接口文档，自动生成 DSL 文件
- 定义请求参数校验规则、响应数据转换管道、字段映射、类型转换、枚举定义
- 支持嵌套对象、数组、枚举等复杂数据结构的 DSL 描述
- 输出标准化的 DSL 文件供后续代码生成或运行时校验使用

**注意事项：**
- 保持 YApi 原始字段完整，不遗漏任何字段
- 使用 YApi 中的中文描述作为字段注释
- 与 pi-fe-view-dsl-engine 保持 DSL 风格一致性，但侧重点不同（本 skill 面向后端数据处理）

---

## 输入来源

读取 pi-yapi 导出的接口文档，目录结构如下：

```
docs/yapi/{project_name}/
├── README.md                          # 接口索引
└── {接口ID}_{接口标题}.md             # 每个接口的详细文档
```

接口详情文档包含：
- 请求路径（path）、请求方法（method）
- 请求参数（Query、Path、Body JSON Schema）
- 响应参数（res_body JSON Schema）
- 枚举定义（如果有）

---

## 输出格式

DSL 文件输出到项目目录：

```
docs/dsl/backend/
├── README.md                          # DSL 索引
└── {接口ID}_{接口标题}.dsl            # 每个接口的 DSL 定义
```

---

## DSL 语法规范

### 基本结构

每个接口对应一个 DSL 文件，包含 `input`、`output`、`transform` 三个区块：

```dsl
# Interface: {接口标题}
# Source: {method} {path}
# YApi ID: {接口ID}

input {
  # 请求参数定义（校验规则）
}

output {
  # 响应数据定义（类型+格式）
}

transform {
  # 字段映射与转换规则
}
```

### input 区块

定义请求参数的类型、必填性、校验规则和中文描述：

```dsl
input {
  # 基础类型：type(required?, constraints, "中文描述")

  spaceName: string(required, max=100, "空间名称")
  spaceCode: string(required, max=50, "空间英文缩写")
  status: enum(active, inactive, default="active", "状态")
  sort: number(min=0, max=999, "排序号")
  description: string(max=500, optional, "描述信息")
  parentId: number(optional, "父级ID")
}
```

### output 区块

定义响应数据的类型和格式：

```dsl
output {
  id: number
  spaceName: string
  spaceCode: string
  status: enum(active, inactive)
  sort: number
  description: string
  createdAt: datetime(format="YYYY-MM-DD HH:mm:ss")
  updatedAt: datetime(format="YYYY-MM-DD HH:mm:ss")
}
```

### transform 区块

定义字段从请求到数据库的映射和转换规则：

```dsl
transform {
  # 格式：req.{字段} -> db.{字段} (转换规则...)

  req.spaceName -> db.space_name (trim, upper_first)
  req.spaceCode -> db.space_code (lower, regex="^[a-z][a-z0-9_]*$")
  req.status -> db.status (default="active")
  req.sort -> db.sort (default=0, clamp=0..999)
  req.description -> db.description (trim, sanitize_html)
  req.parentId -> db.parent_id (optional)
}
```

---

## 类型系统

### 支持的数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `string` | 字符串 | `string(required, max=100, "名称")` |
| `number` | 数字（整数/浮点） | `number(min=0, max=999, "数量")` |
| `boolean` | 布尔值 | `boolean(default=false, "是否启用")` |
| `enum` | 枚举 | `enum(active, inactive, default="active", "状态")` |
| `datetime` | 日期时间 | `datetime(format="YYYY-MM-DD HH:mm:ss")` |
| `date` | 日期 | `date(format="YYYY-MM-DD")` |
| `array` | 数组 | `array(item=number, maxItems=100, "ID列表")` |
| `object` | 嵌套对象 | 见嵌套对象语法 |

### 约束修饰符

| 修饰符 | 说明 | 示例 |
|--------|------|------|
| `required` | 必填 | `string(required, "名称")` |
| `optional` | 可选（默认） | `string(optional, "描述")` |
| `default=value` | 默认值 | `enum(active, inactive, default="active")` |
| `min=N` | 最小值（number）/ 最小长度（string） | `number(min=0)` / `string(min=1)` |
| `max=N` | 最大值（number）/ 最大长度（string） | `string(max=100)` |
| `minItems=N` | 数组最小长度 | `array(minItems=1)` |
| `maxItems=N` | 数组最大长度 | `array(maxItems=100)` |
| `regex=pattern` | 正则校验 | `string(regex="^[a-z]+$")` |
| `format=...` | 格式说明 | `datetime(format="YYYY-MM-DD HH:mm:ss")` |

### 转换规则（transform 区块）

| 规则 | 说明 |
|------|------|
| `trim` | 去除首尾空格 |
| `upper_first` | 首字母大写 |
| `lower` | 转小写 |
| `upper` | 转大写 |
| `sanitize_html` | 清洗 HTML 标签 |
| `default=value` | 设置默认值 |
| `clamp=min..max` | 数值范围限制 |
| `optional` | 可选映射 |
| `nullable` | 允许为空 |

---

## 嵌套对象与数组

### 嵌套对象

```dsl
input {
  space: object(required, "空间信息") {
    name: string(required, max=100, "空间名称")
    code: string(required, max=50, "空间编码")
    config: object(optional, "扩展配置") {
      theme: string(max=20, optional, "主题")
      layout: enum(list, grid, default="list", "布局方式")
    }
  }
}
```

### 数组

```dsl
input {
  ids: array(item=number, required, minItems=1, maxItems=100, "空间ID列表")
}

input {
  items: array(item=object, required, "批量创建") {
    name: string(required, max=100, "名称")
    code: string(required, max=50, "编码")
  }
}
```

### 嵌套转换规则

```dsl
transform {
  req.space.name -> db.space_name (trim, upper_first)
  req.space.code -> db.space_code (lower, regex="^[a-z]+$")
  req.space.config.theme -> db.config_theme (optional)
  req.space.config.layout -> db.config_layout (default="list")
}
```

---

## 工作流

### Step 1：确认输入源

检查 `docs/yapi/{project_name}/` 目录是否存在且包含完整的接口文档。

- 如果目录不存在或文档不完整，提示用户先运行 pi-yapi 导出接口文档
- 确认用户需要的接口范围（全部 or 指定分类/接口）

### Step 2：解析接口文档

逐个读取接口详情文档，提取：

1. 接口元信息：标题、路径、方法、YApi ID
2. 请求参数：从 Body JSON Schema 解析 properties 和 required 数组
3. 响应参数：从 res_body JSON Schema 解析 properties
4. Query/Path 参数：补充到 input 区块

### Step 3：生成 DSL 文件

根据解析结果，按照 DSL 语法规范生成文件。

规则：
- 文件名：`{接口ID}_{接口标题}.dsl`
- 保留所有原始字段，不遗漏
- 使用 YApi 中的中文描述（`description` 字段）
- 必填字段标注 `required`，可选字段不标注（默认 optional）
- 枚举类型从 YApi 的 enum 或示例值推断
- 时间字段自动识别为 `datetime` 类型

### Step 4：生成 DSL 索引

在 `docs/dsl/backend/README.md` 生成索引，格式：

```markdown
# Backend Data DSL Index

> 生成自 YApi 接口文档

| DSL 文件 | 接口 | 路径 | 方法 |
|---------|------|------|------|
| [187399_空间新增编辑.dsl](./187399_空间新增编辑.dsl) | 空间新增/编辑 | /tSpace/addOrUpdate | POST |
```

### Step 5：校验与输出

校验规则：
- 所有 `input` 中的字段在 YApi 文档中存在对应定义
- `transform` 中的映射关系完整（每个需要转换的字段都有规则）
- DSL 语法格式正确（括号匹配、引号配对）

输出完成信息，列出：
- 生成的 DSL 文件数量
- 输出目录路径
- 注意事项（如推断的枚举值、需要人工确认的字段等）

---

## 完整示例

### 输入：YApi 接口文档

接口：空间新增/编辑
路径：`POST /tSpace/addOrUpdate`

请求体（JSON Schema）：
```json
{
  "type": "object",
  "required": ["spaceName", "spaceCode"],
  "properties": {
    "spaceName": { "type": "string", "description": "空间名称" },
    "spaceCode": { "type": "string", "description": "空间英文缩写" },
    "status": { "type": "string", "description": "状态", "enum": ["active", "inactive"] },
    "sort": { "type": "integer", "description": "排序号" },
    "description": { "type": "string", "description": "描述信息" },
    "parentId": { "type": "integer", "description": "父级ID" }
  }
}
```

### 输出：DSL 文件

```dsl
# Interface: 空间新增/编辑
# Source: POST /tSpace/addOrUpdate
# YApi ID: 187399

input {
  spaceName: string(required, max=100, "空间名称")
  spaceCode: string(required, max=50, "空间英文缩写")
  status: enum(active, inactive, default="active", "状态")
  sort: number(min=0, max=999, "排序号")
  description: string(max=500, optional, "描述信息")
  parentId: number(optional, "父级ID")
}

output {
  id: number
  spaceName: string
  spaceCode: string
  status: enum(active, inactive)
  sort: number
  description: string
  parentId: number
  createdAt: datetime(format="YYYY-MM-DD HH:mm:ss")
  updatedAt: datetime(format="YYYY-MM-DD HH:mm:ss")
}

transform {
  req.spaceName -> db.space_name (trim, upper_first)
  req.spaceCode -> db.space_code (lower, regex="^[a-z][a-z0-9_]*$")
  req.status -> db.status (default="active")
  req.sort -> db.sort (default=0, clamp=0..999)
  req.description -> db.description (trim, sanitize_html)
  req.parentId -> db.parent_id (optional)
}
```

---

## 规则与最佳实践

1. **完整性优先**：保留 YApi 中的所有字段，不主动删减。遗漏的字段由后续 Review 发现比过度推断更安全。

2. **中文描述保持**：YApi 中的 `description` 字段原样保留到 DSL 注释中，作为字段业务含义的来源。

3. **类型推断保守**：
   - 严格按 YApi 声明的类型映射，不自行升级类型精度
   - `integer` → `number`，`string` → `string`，`boolean` → `boolean`
   - 字段名包含 `time`、`date`、`datetime` 且类型为 string 时，推断为 `datetime` 类型

4. **枚举推断**：
   - 优先使用 YApi 的 `enum` 声明
   - 无枚举声明但描述中包含 "状态"、"类型" 等关键词时，从示例值推断
   - 推断的枚举值在输出中标注 `[推断]`

5. **嵌套处理**：
   - 嵌套对象使用 `{ }` 展开定义
   - transform 中使用点号路径引用嵌套字段（如 `req.config.theme`）
   - 超过 3 层嵌套时，建议拆分为独立 DSL 文件并在注释中引用

6. **数组处理**：
   - 明确标注 `item` 类型
   - item 为 object 时，展开定义其字段
   - 标注 `minItems` / `maxItems` 约束（如果 YApi 中有声明）

7. **Transform 规则生成**：
   - 默认字段映射不生成 transform（隐式同名映射）
   - 仅在有格式转换、默认值、校验规则时生成 transform 行
   - 驼峰转下划线的字段映射自动推断，但需显式写出

---

## 关联 Skill

| Skill | 关系 | 说明 |
|-------|------|------|
| **pi-yapi** | 输入源 | 提供 YApi 接口文档，是 pi-be-data-dsl-engine 的前置依赖 |
| **pi-fe-view-dsl-engine** | 并行输出 | 面向前端视图的 DSL，与本 skill 风格一致但侧重点不同 |
| **pi-integrate-fe-be** | 消费者 | 消费本 skill 生成的 DSL，驱动前后端集成流程 |

---

## 触发条件

当用户出现以下意图时触发此 skill：

- "生成数据 DSL"、"导出 DSL 定义"
- "接口转 DSL"、"API → DSL 映射"
- "生成后端数据处理规则"
- "生成字段映射规则"
- 提到需要处理后端数据转换管道、参数校验规则定义
