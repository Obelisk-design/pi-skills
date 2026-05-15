// pi-code-gen/scripts/parse-constraints.js
/**
 * Parse CLAUDE.md to extract code generation constraints
 *
 * @param {string} content - CLAUDE.md file content
 * @returns {Object} - constraintConfig object
 */

function parseConstraints(content) {
  const config = {
    componentRules: {},
    outputPaths: {},
    templateRefs: {},
    forbidden: [],
    reuseHooks: [],
  };

  if (!content || content.trim() === '') {
    return config;
  }

  // 解析组件库规则
  // 格式: - 表单布局：使用 `pi-form`
  const componentPatterns = {
    form: /表单[^：]*：\s*使用\s*`([^`]+)`/i,
    table: /表格[^：]*：\s*使用\s*`([^`]+)`/i,
    dialog: /弹窗[^：]*：\s*使用\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(componentPatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.componentRules[key] = match[1];
    }
  }

  // 解析输出路径
  // 格式: - 页面路径：`src/views/<module>/<page>.vue`
  const pathPatterns = {
    page: /页面路径[^：]*：\s*`([^`]+)`/i,
    component: /组件路径[^：]*：\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(pathPatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.outputPaths[key] = match[1];
    }
  }

  // 解析模板引用
  // 格式: - 页面模板：`docs/templates/page-base.md`
  const templatePatterns = {
    page: /页面模板[^：]*：\s*`([^`]+)`/i,
    form: /表单模板[^：]*：\s*`([^`]+)`/i,
    table: /表格模板[^：]*：\s*`([^`]+)`/i,
  };

  for (const [key, pattern] of Object.entries(templatePatterns)) {
    const match = content.match(pattern);
    if (match) {
      config.templateRefs[key] = match[1];
    }
  }

  // 解析禁止事项
  // 格式: - 禁止在视图层直接调用 axios
  const forbiddenPattern = /禁止[^。，\n]+/g;
  const forbiddenMatches = content.matchAll(forbiddenPattern);
  for (const match of forbiddenMatches) {
    const text = match[0].replace(/^禁止/, '').trim();
    config.forbidden.push(text);
  }

  // 解析 Hooks/Services 复用
  // 格式: - 表单提交：复用 `useFormSubmit` hook
  const hookPattern = /复用\s*`([^`]+)`\s*hook/gi;
  const hookMatches = content.matchAll(hookPattern);
  for (const match of hookMatches) {
    config.reuseHooks.push(match[1]);
  }

  return config;
}

module.exports = parseConstraints;