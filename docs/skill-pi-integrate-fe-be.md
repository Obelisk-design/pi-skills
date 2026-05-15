# pi-integrate-fe-be 技能说明

## 一、概述

pi-integrate-fe-be 是前后端 DSL 集成技能，将前端视图 DSL 和后端数据 DSL 合成为统一的全栈 DSL。这个集成 DSL 明确了 UI 组件与 API 端点的绑定关系，定义了完整的数据流和交互逻辑。

**核心价值：**
- 明确 UI 组件消费哪个 API
- 定义数据流：选择 → 加载详情，提交 → 刷新列表
- 检测未绑定的组件/API，避免遗漏

---

## 二、使用方式

### 触发条件

用户触发 `/pi-integrate-fe-be` 命令，或说：
- "集成前端和后端 DSL"
- "绑定组件到 API"
- "生成全栈 DSL"

### 前置条件

必须先完成：
- `pi-fe-view-dsl-engine` → `docs/dsl/frontend/` 存在
- `pi-be-data-dsl-engine` → `docs/dsl/backend/` 存在

---

## 三、输入与输出

### 输入

| 输入项 | 来源 | 说明 |
|--------|------|------|
| 前端 DSL | docs/dsl/frontend/ | 组件树、布局、交互 |
| 后端 DSL | docs/dsl/backend/ | API 定义、数据结构 |

### 输出目录结构

```
docs/dsl/integrated/
├── index.md                          # 集成索引
└── {页面名}.dsl                       # 全栈集成 DSL
```

---

## 四、集成 DSL 语法结构

### 基本结构

```dsl
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

### 语法元素

| 元素 | 格式 | 说明 |
|------|------|------|
| `page "Name"` | `page "PageName" { }` | 页面定义 |
| `route` | `route: /path` | 客户端路由 |
| `components { }` | 组件块集合 | 所有 UI 组件 |
| `type` | `table/form/modal/...` | 组件类型 |
| `dataSource` | `api.resource.action (METHOD /path)` | 读 API |
| `submit` | `api.resource.action (METHOD /path)` | 写 API（表单） |
| `dataFlow { }` | 箭头表达式 | 组件间数据流 |

### 数据流表达式

| 表达式 | 含义 |
|--------|------|
| `ComponentA.select -> ComponentB.load` | 选择后加载详情 |
| `Form.submit -> List.refresh` | 提交后刷新列表 |
| `Form.cancel -> Form.close` | 取消关闭表单 |

---

## 五、绑定策略

### 优先级顺序

组件与 API 的匹配按以下优先级：

#### 1. 显式标注（最高优先）

前端 DSL 或后端 DSL 中的显式绑定：
```dsl
# 前端 DSL 标注
SpaceList @api(space.list)

# 后端 DSL 标注
GET /tSpace/list @ui(SpaceList)
```

#### 2. 命名约定

| 模式 | 前端组件 | 后端 API |
|------|----------|----------|
| 列表/查询 | `XxxList`, `XxxTable` | `GET /xxx/list` |
| 详情 | `XxxDetail`, `XxxForm` | `GET /xxx/detail` |
| 创建/更新 | `XxxForm` (submit) | `POST /xxx/addOrUpdate` |
| 删除 | 删除按钮 | `POST /xxx/delete` |

#### 3. URL 模式匹配

路由推断 API 前缀：
- `/space/manage` → `/tSpace/*`
- `/user/list` → `/tUser/*`

---

## 六、工作流程

```
┌─────────────────────────────────────────────┐
│  Step 1: 读取两份 DSL                        │
│  - docs/dsl/frontend/{page}.dsl             │
│  - docs/dsl/backend/{resource}.dsl          │
│  - 验证文件存在和语法有效                    │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 2: 匹配组件到 API                      │
│  - 检查显式 @api() 标注                      │
│  - 应用命名约定规则                          │
│  - URL 模式匹配                              │
│  - 无匹配标记 TBD                            │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 3: 生成集成 DSL                        │
│  - 写入 docs/dsl/integrated/{page}.dsl      │
│  - 包含所有组件 + 数据源                     │
│  - 定义数据流表达式                          │
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 4: 双向一致性校验                      │
│  - 前端→后端：每个 dataSource 有效           │
│  - 后端→前端：每个 API 被消费（或标记 unused）│
└────────────────────┬────────────────────────┘
                     ▼
┌─────────────────────────────────────────────┐
│  Step 5: 输出摘要                            │
│  - 绑定成功的组件数                          │
│  - 消费的 API 数                             │
│  - 未解析的绑定数                            │
└─────────────────────────────────────────────┘
```

---

## 七、最佳实践

### 1. 运行时机

在 `pi-fe-view-dsl-engine` 和 `pi-be-data-dsl-engine` 都完成后执行。

### 2. TBD 标记使用

早期阶段大量使用 `TBD` 标记，随 API 稳定逐步解析。

### 3. 集成 DSL 共享

集成 DSL 是前后端团队的契约文档，双方应同步查看。

### 4. 变更同步

API 变更时更新绑定，UI 变更时重新验证数据流。

---

## 八、常见问题

### Q1: 组件无匹配 API？

**表现：** `dataSource: TBD`

**解决：**
- 确认 YApi 是否有对应接口
- 手动标注绑定关系
- 或标记组件为纯展示组件

### Q2: API 无匹配组件？

**表现：** API 标记 `unused`

**解决：**
- 确认是否为内部接口
- 或前端遗漏组件
- 标记为后端专用接口

### Q3: 多候选 API 匹配？

**表现：** 一个组件有多个候选 API

**解决：**
- 按命名约定选最佳匹配
- 注释中标注歧义
- 人工确认后明确绑定

### Q4: 类型签名不匹配？

**表现：** 表单提交到 GET 接口

**解决：**
- 标记为类型错误
- 人工确认接口用途

---

## 九、与其他 Skill 的关系

| Skill | 关系 | 说明 |
|-------|------|------|
| **pi-fe-view-dsl-engine** | 输入源 | 提供前端 DSL |
| **pi-be-data-dsl-engine** | 输入源 | 提供后端 DSL |
| **pi-review** | 参考 | 验证集成 DSL 绑定是否实现 |
| **pi-workflow** | Phase 3 | 工作流第三步执行集成 |

---

## 十、后续步骤

完成 pi-integrate-fe-be 后，推荐执行：

1. **代码生成** — 基于集成 DSL 生成代码
2. **pi-review** — 审查代码是否实现 DSL 绑定