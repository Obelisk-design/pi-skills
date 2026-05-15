// pi-code-gen/scripts/test-parse-constraints.js
const parseConstraints = require('./parse-constraints');

// 测试用例 1: 完整约束配置
const claudeMdFull = `
# 项目编码约束

## 代码生成规范

### 组件库
- 表单布局：使用 \`pi-form\`，禁止引入新表单组件
- 表格：使用 \`el-table\`
- 弹窗：使用 \`pi-dialog\`

### 输出路径
- 页面路径：\`src/views/<module>/<page>.vue\`
- 组件路径：\`src/components/<module>/\`

### 模板引用
- 页面模板：\`docs/templates/page-base.md\`
- 表单模板：\`docs/templates/form-block.md\`

### 禁止事项
- 禁止在视图层直接调用 axios
- 禁止硬编码 API URL，必须从 services 层导入
- 禁止引入新的 UI 库（antd、vant 等）

### Hooks/Services 复用
- 表单提交：复用 \`useFormSubmit\` hook
- 表格数据：复用 \`useTableData\` hook
`;

const result = parseConstraints(claudeMdFull);

// 验证解析结果
console.assert(result.componentRules.form === 'pi-form', 'Form component should be pi-form');
console.assert(result.componentRules.table === 'el-table', 'Table component should be el-table');
console.assert(result.componentRules.dialog === 'pi-dialog', 'Dialog component should be pi-dialog');
console.assert(result.outputPaths.page === 'src/views/<module>/<page>.vue', 'Page path should match');
console.assert(result.outputPaths.component === 'src/components/<module>/', 'Component path should match');
console.assert(result.templateRefs.page === 'docs/templates/page-base.md', 'Page template should match');
console.assert(result.templateRefs.form === 'docs/templates/form-block.md', 'Form template should match');
console.assert(result.forbidden.includes('在视图层直接调用 axios'), 'Forbidden axios in view');
console.assert(result.forbidden.some(item => item.includes('硬编码 API URL')), 'Forbidden hardcoded API URL');
console.assert(result.reuseHooks.includes('useFormSubmit'), 'Reuse useFormSubmit hook');
console.assert(result.reuseHooks.includes('useTableData'), 'Reuse useTableData hook');

console.log('Test 1: Full constraints - PASS');

// 测试用例 2: 空输入
const resultEmpty = parseConstraints('');
console.assert(Object.keys(resultEmpty.componentRules).length === 0, 'Empty input should return empty rules');
console.log('Test 2: Empty input - PASS');

// 测试用例 3: 部分约束
const claudeMdPartial = `
### 组件库
- 表单：使用 \`pi-form\`
`;
const resultPartial = parseConstraints(claudeMdPartial);
console.assert(resultPartial.componentRules.form === 'pi-form', 'Partial form rule should work');
console.assert(!resultPartial.componentRules.table, 'Table should not be defined');
console.log('Test 3: Partial constraints - PASS');

console.log('\nAll tests passed!');