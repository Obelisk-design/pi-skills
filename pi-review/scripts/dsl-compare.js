#!/usr/bin/env node
/**
 * DSL Compare Script - Layer 2 Validation for pi-review
 * 对比 Frontend DSL 与生成的代码，检查组件和字段覆盖度
 *
 * Usage:
 *   node scripts/dsl-compare.js --dsl-file <dsl_file> --code-dir <code_dir> --output <output_file>
 *
 * Parameters:
 *   --dsl-file   Frontend DSL 文件路径 (如 docs/dsl/frontend/page.dsl)
 *   --code-dir   生成的代码目录 (如 src/views/module/)
 *   --output     输出 JSON 文件路径 (如 docs/review/dsl-check.json)
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dslFile: '',
    codeDir: '',
    output: 'docs/review/dsl-check.json',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dsl-file' && args[i + 1]) {
      options.dslFile = args[i + 1];
      i++;
    } else if (args[i] === '--code-dir' && args[i + 1]) {
      options.codeDir = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    }
  }

  return options;
}

// 解析 DSL 文件提取组件和字段
function parseDSL(dslContent) {
  const components = [];
  const fields = [];
  const actions = [];
  const apiBindings = [];

  // 使用更宽松的正则提取所有 { key: "xxx" } 模式
  // 匹配字段定义: { key: "fieldName", type: "...", required: true/false }
  const fieldPattern = /\{\s*key:\s*"([^"]+)"[^}]*\}/g;
  let fieldMatch;
  while ((fieldMatch = fieldPattern.exec(dslContent)) !== null) {
    const fullMatch = fieldMatch[0];
    const fieldName = fieldMatch[1];

    // 检查是否是 action button (包含 label 和 action)
    if (fullMatch.includes('label:') && fullMatch.includes('action:')) {
      const labelMatch = fullMatch.match(/label:\s*"([^"]+)"/);
      if (labelMatch) {
        actions.push({
          key: fieldName,
          label: labelMatch[1],
        });
      }
      continue;
    }

    // 检查 required 属性
    const requiredMatch = fullMatch.match(/required:\s*(true|false)/);
    const typeMatch = fullMatch.match(/type:\s*"([^"]+)"/);

    // 过滤掉非字段的 key (如 actions, columns 等)
    if (['actions', 'columns', 'items', 'fields', 'options', 'pagination'].includes(fieldName)) {
      continue;
    }

    fields.push({
      name: fieldName,
      required: requiredMatch ? requiredMatch[1] === 'true' : false,
      type: typeMatch ? typeMatch[1] : 'unknown',
    });
  }

  // 组件定义 - table "TableName" { } 或 form "FormName" { }
  const compPattern = /^\s*(table|form|modal|tabs|tab-panel|card|section)\s+"([^"]+)"\s*\{/gm;
  let compMatch;
  while ((compMatch = compPattern.exec(dslContent)) !== null) {
    if (compMatch[1] !== 'section') {
      components.push({
        type: compMatch[1],
        name: compMatch[2],
      });
    }
  }

  // API 绑定 - dataSource: ${api.resource.action} 或 submit: ${api.resource.action}
  const apiPattern = /(dataSource|submit):\s*\$\{api\.(\w+)\.(\w+)\}/g;
  let apiMatch;
  while ((apiMatch = apiPattern.exec(dslContent)) !== null) {
    apiBindings.push({
      type: apiMatch[1],
      resource: apiMatch[2],
      action: apiMatch[3],
    });
  }

  return { components, fields, actions, apiBindings };
}

// 解析 Vue 代码提取组件和字段
function parseVueCode(codeDir) {
  let vueFiles = [];

  // 递归查找所有 .vue 文件
  try {
    const allFiles = fs.readdirSync(codeDir, { recursive: true, withFileTypes: true });
    vueFiles = allFiles
      .filter(f => f.isFile() && f.name.endsWith('.vue'))
      .map(f => path.join(f.path || f.parentPath || codeDir, f.name));
  } catch (e) {
    // 如果递归失败，尝试单层目录
    vueFiles = fs.readdirSync(codeDir).filter(f => f.endsWith('.vue'));
  }

  const codeComponents = [];
  const codeFields = [];
  const codeActions = [];
  const codeApis = [];

  for (const file of vueFiles) {
    const content = fs.readFileSync(file, 'utf-8');

    // 提取组件名
    const nameMatch = content.match(/name:\s*'(\w+)'/);
    if (nameMatch) {
      codeComponents.push({
        file: path.basename(file),
        name: nameMatch[1],
        type: file.includes('list') || file.includes('table') ? 'table' :
              file.includes('add') || file.includes('edit') || file.includes('form') ? 'form' :
              file.includes('detail') ? 'detail' : 'unknown',
      });
    }

    // 提取 form-item prop (el-form-item 或 a-form-model-item)
    const propPattern = /<(el|a)-form-model-item[^>]*prop\s*=\s*"([^"]+)"/g;
    let propMatch;
    while ((propMatch = propPattern.exec(content)) !== null) {
      codeFields.push({
        name: propMatch[2],
        file: path.basename(file),
        source: 'form',
      });
    }

    // 提取 v-model="formData.xxx" 或 v-model="form.xxx"
    const vmodelPattern = /v-model\s*=\s*"([^"]+)\.(\w+)"/g;
    let vmodelMatch;
    while ((vmodelMatch = vmodelPattern.exec(content)) !== null) {
      const formKey = vmodelMatch[1];
      const fieldName = vmodelMatch[2];
      // 过滤掉一些通用字段名
      if (!['loading', 'visible', 'show', 'disabled', 'active', 'current'].includes(fieldName)) {
        codeFields.push({
          name: fieldName,
          file: path.basename(file),
          source: 'vmodel',
          formKey: formKey,
        });
      }
    }

    // 提取 s-table / el-table / a-table columns dataIndex
    const dataIndexPattern = /dataIndex\s*:\s*'([^']+)'/g;
    let dataIndexMatch;
    while ((dataIndexMatch = dataIndexPattern.exec(content)) !== null) {
      codeFields.push({
        name: dataIndexMatch[1],
        file: path.basename(file),
        source: 'table',
      });
    }

    // 提取 pi-form options prop 字段 (prop: 'xxx' 格式，多行对象)
    const optionsPropPattern = /prop:\s*'([^']+)'/g;
    let optionsMatch;
    while ((optionsMatch = optionsPropPattern.exec(content)) !== null) {
      codeFields.push({
        name: optionsMatch[1],
        file: path.basename(file),
        source: 'pi-form-options',
      });
    }

    // 提取按钮操作 @click="handleXxx"
    const clickPattern = /@click\s*=\s*"handle(\w+)"/g;
    let clickMatch;
    while ((clickMatch = clickPattern.exec(content)) !== null) {
      codeActions.push({
        action: clickMatch[1],
        file: path.basename(file),
      });
    }

    // 提取 API 导入
    const apiImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*'([^']+)'/);
    if (apiImportMatch) {
      const apis = apiImportMatch[1].split(',').map(a => a.trim());
      codeApis.push({
        file: path.basename(file),
        apis: apis,
        source: apiImportMatch[2],
      });
    }
  }

  // 去重字段
  const uniqueFields = [];
  const seenFields = new Set();
  for (const f of codeFields) {
    if (!seenFields.has(f.name)) {
      seenFields.add(f.name);
      uniqueFields.push(f);
    }
  }

  return {
    codeComponents,
    codeFields: uniqueFields,
    codeActions,
    codeApis
  };
}

// 对比 DSL 与代码
function compareDSLWithCode(dslData, codeData) {
  const results = {
    components: [],
    fields: [],
    actions: [],
    apiBindings: [],
    summary: {
      componentMatch: 0,
      componentTotal: 0,
      fieldMatch: 0,
      fieldTotal: 0,
      actionMatch: 0,
      actionTotal: 0,
    },
  };

  // 对比组件
  for (const comp of dslData.components) {
    const found = codeData.codeComponents.some(
      c => c.name.toLowerCase().includes(comp.name.toLowerCase()) ||
           c.file.toLowerCase().includes(comp.name.toLowerCase()) ||
           c.type === comp.type
    );
    results.components.push({
      dslComponent: comp.name,
      dslType: comp.type,
      found: found,
      status: found ? 'PASS' : 'FAIL',
    });
    results.summary.componentTotal++;
    if (found) results.summary.componentMatch++;
  }

  // 对比字段
  const codeFieldNames = codeData.codeFields.map(f => f.name.toLowerCase());
  for (const field of dslData.fields) {
    const found = codeFieldNames.includes(field.name.toLowerCase());
    results.fields.push({
      dslField: field.name,
      required: field.required,
      found: found,
      status: found ? 'PASS' : (field.required ? 'FAIL' : 'MISSING'),
    });
    results.summary.fieldTotal++;
    if (found) results.summary.fieldMatch++;
  }

  // 对比操作
  const codeActionNames = codeData.codeActions.map(a => a.action.toLowerCase());
  for (const action of dslData.actions) {
    const found = codeActionNames.some(a => a.includes(action.key.toLowerCase()));
    results.actions.push({
      dslAction: action.key,
      label: action.label,
      found: found,
      status: found ? 'PASS' : 'MISSING',
    });
    results.summary.actionTotal++;
    if (found) results.summary.actionMatch++;
  }

  // API 绑定检查
  for (const api of dslData.apiBindings) {
    const found = codeData.codeApis.some(c => c.apis.includes(api.action));
    results.apiBindings.push({
      type: api.type,
      resource: api.resource,
      action: api.action,
      found: found,
      status: found ? 'PASS' : 'MISSING',
    });
  }

  // 计算分数
  results.summary.componentScore = results.summary.componentTotal > 0
    ? Math.round((results.summary.componentMatch / results.summary.componentTotal) * 100)
    : 0;
  results.summary.fieldScore = results.summary.fieldTotal > 0
    ? Math.round((results.summary.fieldMatch / results.summary.fieldTotal) * 100)
    : 0;
  results.summary.actionScore = results.summary.actionTotal > 0
    ? Math.round((results.summary.actionMatch / results.summary.actionTotal) * 100)
    : 0;

  // 整体 Layer 2 分数 (组件 + 字段为主要指标)
  const majorChecks = results.summary.componentTotal + results.summary.fieldTotal;
  const majorPasses = results.summary.componentMatch + results.summary.fieldMatch;
  results.summary.layer2Score = majorChecks > 0
    ? Math.round((majorPasses / majorChecks) * 100)
    : 0;

  return results;
}

function main() {
  const options = parseArgs();

  if (!options.dslFile || !options.codeDir) {
    console.error('Usage: node dsl-compare.js --dsl-file <dsl> --code-dir <dir> [--output <json>]');
    process.exit(1);
  }

  if (!fs.existsSync(options.dslFile)) {
    console.error('DSL file not found: ' + options.dslFile);
    process.exit(1);
  }

  if (!fs.existsSync(options.codeDir)) {
    console.error('Code directory not found: ' + options.codeDir);
    process.exit(1);
  }

  // 解析 DSL
  const dslContent = fs.readFileSync(options.dslFile, 'utf-8');
  const dslData = parseDSL(dslContent);

  // 解析代码
  const codeData = parseVueCode(options.codeDir);

  // 对比
  const results = compareDSLWithCode(dslData, codeData);

  // 输出
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(options.output, JSON.stringify(results, null, 2));

  // 打印摘要
  console.log('\n=== Layer 2: DSL Compliance Check ===\n');
  console.log('Components: ' + results.summary.componentMatch + '/' + results.summary.componentTotal + ' (' + results.summary.componentScore + '%)');
  console.log('Fields: ' + results.summary.fieldMatch + '/' + results.summary.fieldTotal + ' (' + results.summary.fieldScore + '%)');
  console.log('Actions: ' + results.summary.actionMatch + '/' + results.summary.actionTotal + ' (' + results.summary.actionScore + '%)');
  console.log('\nLayer 2 Score: ' + results.summary.layer2Score + '%');
  console.log('\nStatus: ' + (results.summary.layer2Score >= 90 ? 'PASS' : results.summary.layer2Score >= 80 ? 'NEEDS_REVISION' : 'FAIL'));
  console.log('\nOutput: ' + options.output);

  // 打印缺失项
  const missingFields = results.fields.filter(f => !f.found && f.required);
  if (missingFields.length > 0) {
    console.log('\n=== Missing Required Fields ===');
    for (const f of missingFields) {
      console.log('  - ' + f.dslField);
    }
  }

  // 打印找到的代码字段（用于调试）
  if (process.env.DEBUG) {
    console.log('\n=== Code Fields Found ===');
    for (const f of codeData.codeFields) {
      console.log('  - ' + f.name + ' (' + f.source + ') from ' + f.file);
    }
  }
}

main();