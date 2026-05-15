# pi-be-data-dsl-engine 技能说明

## 一、概述

pi-be-data-dsl-engine 是后端数据 DSL 生成技能，将 YApi 接口文档转化为结构化的数据处理 DSL。这个 DSL 定义了请求参数校验、响应数据结构、字段映射规则，为数据转换管道和代码审查提供 API 合约规格。

**核心价值：**
- 结构化记录 API 合约，避免字段遗漏
- 自动推断校验规则和转换规则
- 提供字段映射基准，确保前后端命名一致

---

## 二、使用方式

### 触发条件

用户触发 `/pi-be-data-dsl-engine` 命令，或说：
- "生成数据 DSL"
- "接口转 DSL"
- "生成后端数据处理规则"

### 前置条件

必须先完成 `pi-yapi`，确保 `docs/yapi/{project_name}/` 目录存在接口文档。

### 输入读取

AI 会自动读取：
- `docs/yapi/{project_name}/README.md` — 接口索引
- `docs/yapi/{project_name}/{id}_{title}.md` — 接口详情

---

## 三、输入与输出

### 输入

| 输入项 | 来源 | 说明 |
|--------|------|------|
| 接口索引 | docs/yapi/{project}/README.md | 接口列表 |
| 接口详情 | docs/yapi/{project}/{id}_{title}.md | 每个接口的详细定义 |

### 输出目录结构

```
docs/dsl/backend/
├── README.md                          # DSL 索引
└── {接口ID}_{接口标题}.dsl             # 每个接口的数据 DSL
```

---

## 四、DSL 语法结构

### 基本结构

每个接口对应一个 DSL 文件，包含三个区块：

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

### input 区块（请求参数）

```dsl
input {
  spaceName: string(required, max=100, "空间名称")
  spaceCode: string(required, max=50, "空间英文缩写")
  status: enum(active, inactive, default="active", "状态")
  sort: number(min=0, max=999, "排序号")
  description: string(max=500, optional, "描述信息")
  parentId: number(optional, "父级ID")
}
```

### output 区块（响应数据）

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

### transform 区块（字段映射）

```dsl
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

## 五、类型系统

### 支持的数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `string` | 字符串 | `string(required, max=100, "名称")` |
| `number` | 数字 | `number(min=0, max=999, "数量")` |
| `boolean` | 布尔值 | `boolean(default=false, "是否启用")` |
| `enum` | 枚举 | `enum(active, inactive, default="active")` |
| `datetime` | 日期时间 | `datetime(format="YYYY-MM-DD HH:mm:ss")` |
| `date` | 日期 | `date(format="YYYY-MM-DD")` |
| `array` | 数组 | `array(item=number, maxItems=100)` |
| `object` | 嵌套对象 | `object { ... }` |

### 约束修饰符

| 修饰符 | 说明 |
|--------|------|
| `required` | 必填 |
| `optional` | 可选（默认） |
| `default=value` | 默认值 |
| `min=N` | 最小值/最小长度 |
| `max=N` | 最大值/最大长度 |
| `regex=pattern` | 正则校验 |
| `format=...` | 格式说明 |

### 转换规则

| 规则 | 说明 |
|------|------|
| `trim` | 去除首尾空格 |
| `upper_first` | 首字母大写 |
| `lower` | 转小写 |
| `upper` | 转大写 |
| `sanitize_html` | 清洗 HTML 标签 |
| `default=value` | 设置默认值 |
| `clamp=min..max` | 数值范围限制 |

---

## 六、嵌套对象与数组

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
  ids: array(item=number, required, minItems=1, maxItems=100, "ID列表")

  items: array(item=object, required, "批量创建") {
    name: string(required, max=100, "名称")
    code: string(required, max=50, "编码")
  }
}
```

---

## 七、工作流程

```
┌─────────────────────────────────────────────┐
│  Step 1: 确认输入源                          │
│  - 检查 docs/yapi/{project}/ 目录存在       │
│  - 验证接口文档完整性                        │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 2: 解析接口文档                        │
│  - 读取接口元信息                            │
│  - 解析 JSON Schema                          │
│  - 提取 properties 和 required              │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 3: 映射类型系统                        │
│  - YApi integer → DSL number                │
│  - YApi string → DSL string                 │
│  - YApi boolean → DSL boolean               │
│  - 时间字段 → datetime                      │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 4: 推断校验规则                        │
│  - required 数组 → required 标注            │
│  - maxLength → max=N                        │
│  - enum → enum(...)                         │
│  - description → 中文注释                   │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 5: 生成字段映射                        │
│  - 驼峰 → 下划线自动推断                     │
│  - 格式转换规则                              │
│  - 默认值设置                                │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 6: 生成 DSL 文件                       │
│  - 写入 docs/dsl/backend/{id}_{title}.dsl   │
│  - 更新 README.md 索引                       │
└─────────────────────────────────────────────┘
```

---

## 八、最佳实践

### 1. 完整性优先

保留 YApi 中的所有字段，不主动删减。遗漏字段由后续 Review 发现比过度推断更安全。

### 2. 中文描述保持

YApi 的 `description` 字段原样保留到 DSL 注释中，作为字段业务含义的来源。

### 3. 类型推断保守

严格按 YApi 声明的类型映射，不自行升级类型精度：
- `integer` → `number`
- `string` → `string`
- 时间字段名 → `datetime`

### 4. 枚举推断

优先使用 YApi 的 `enum` 声明。无枚举声明但描述含"状态"、"类型"关键词时，从示例值推断并标注 `[推断]`。

### 5. 驼峰转下划线

自动推断字段映射，但需显式写出：
```dsl
req.spaceName -> db.space_name
```

---

## 九、常见问题

### Q1: YApi 字段类型不规范？

**原因：** YApi 中可能用 `string` 表示数字

**解决：** 保守映射，人工确认异常情况

### Q2: 枚举值推断不准确？

**原因：** YApi 未声明 enum

**解决：** DSL 标注 `[推断]`，人工确认后修正

### Q3: 嵌套层级过深？

**原因：** 复杂嵌套结构难以展开

**解决：** 超过 3 层嵌套时，拆分为独立 DSL 文件

### Q4: 响应字段缺失？

**原因：** YApi 响应定义不完整

**解决：** DSL 标注遗漏字段，后续补充

---

## 十、与其他 Skill 的关系

| Skill | 关系 | 说明 |
|-------|------|------|
| **pi-yapi** | 输入源 | 提供接口文档 |
| **pi-fe-view-dsl-engine** | 并行输出 | 生成前端视图 DSL |
| **pi-integrate-fe-be** | 消费者 | 合成前端 DSL + 后端 DSL |
| **pi-review** | 参考 | Layer 1 对比 Code 与 YApi |

---

## 十一、后续步骤

完成 pi-be-data-dsl-engine 后，推荐执行：

1. **pi-integrate-fe-be** — 集成前端 DSL 与后端 DSL
2. **代码生成** — 基于 DSL 生成代码
3. **pi-review** — 审查代码是否符合 API 合约