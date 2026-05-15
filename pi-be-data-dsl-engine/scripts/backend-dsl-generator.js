#!/usr/bin/env node
/**
 * Backend Data DSL Generator
 * 从 YApi 接口文档生成后端数据处理 DSL 文件
 *
 * Usage:
 *   node scripts/backend-dsl-generator.js --yapi-dir <yapi_docs_dir> --dsl-dir <output_dir>
 *
 * Parameters:
 *   --yapi-dir  YApi 接口文档目录 (默认: docs/yapi)
 *   --dsl-dir   DSL 输出目录 (默认: doc/dsl/backend)
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    yapiDir: 'docs/yapi',
    dslDir: 'docs/dsl/backend'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--yapi-dir' && args[i + 1]) {
      options.yapiDir = args[i + 1];
      i++;
    } else if (args[i] === '--dsl-dir' && args[i + 1]) {
      options.dslDir = args[i + 1];
      i++;
    }
  }

  return options;
}

// 解析 JSON Schema
function parseJsonSchema(schemaStr) {
  if (!schemaStr) return null;
  try {
    return JSON.parse(schemaStr);
  } catch (e) {
    return null;
  }
}

// 生成 input 区块字段
function generateInputFields(schema, indent = '') {
  if (!schema || !schema.properties) return '';
  const required = schema.required || [];
  const lines = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const isRequired = required.includes(name);
    const reqStr = isRequired ? 'required' : 'optional';
    const desc = prop.description || '';
    const constraints = [];

    if (prop.type === 'array' && prop.items) {
      if (prop.items.type === 'object') {
        const nestedInput = generateInputFields(prop.items, indent + '  ');
        if (nestedInput) {
          lines.push(indent + name + ': array(item=object, ' + reqStr + ', "' + desc + '") {');
          lines.push(nestedInput);
          lines.push(indent + '}');
          continue;
        }
      }
      constraints.push('item=' + prop.items.type);
      lines.push(indent + name + ': array(' + constraints.join(', ') + ', ' + reqStr + ', "' + desc + '")');
    } else if (prop.type === 'object' && prop.properties) {
      const nestedInput = generateInputFields(prop, indent + '  ');
      if (nestedInput) {
        lines.push(indent + name + ': object(' + reqStr + ', "' + desc + '") {');
        lines.push(nestedInput);
        lines.push(indent + '}');
        continue;
      }
    } else {
      const typeMap = { 'string': 'string', 'integer': 'number', 'number': 'number', 'boolean': 'boolean' };
      const dslType = typeMap[prop.type] || prop.type;
      constraints.push(reqStr);

      if (prop.enum && prop.enum.length > 0) {
        const enumValues = prop.enum.map(v => typeof v === 'string' ? v : String(v)).join(', ');
        lines.push(indent + name + ': enum(' + enumValues + ', "' + desc + '")');
      } else if (prop.type === 'string' && (name.includes('time') || name.includes('date'))) {
        lines.push(indent + name + ': datetime(format="YYYY-MM-DD HH:mm:ss", ' + reqStr + ', "' + desc + '")');
      } else {
        lines.push(indent + name + ': ' + dslType + '(' + constraints.join(', ') + ', "' + desc + '")');
      }
    }
  }

  return lines.join('\n');
}

// 生成 output 区块字段
function generateOutputFields(schema, indent = '') {
  if (!schema || !schema.properties) return '';
  const lines = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const desc = prop.description || '';

    if (prop.type === 'array' && prop.items && prop.items.type === 'object') {
      const nestedOutput = generateOutputFields(prop.items, indent + '  ');
      if (nestedOutput) {
        lines.push(indent + name + ': array {');
        lines.push(nestedOutput);
        lines.push(indent + '}');
        continue;
      }
    } else if (prop.type === 'object' && prop.properties) {
      const nestedOutput = generateOutputFields(prop, indent + '  ');
      if (nestedOutput) {
        lines.push(indent + name + ': object {');
        lines.push(nestedOutput);
        lines.push(indent + '}');
        continue;
      }
    } else {
      const typeMap = { 'string': 'string', 'integer': 'number', 'number': 'number', 'boolean': 'boolean' };
      const dslType = typeMap[prop.type] || prop.type;

      if (prop.type === 'string' && (name.includes('time') || name.includes('date'))) {
        lines.push(indent + name + ': datetime(format="YYYY-MM-DD HH:mm:ss")');
      } else if (prop.enum && prop.enum.length > 0) {
        const enumValues = prop.enum.map(v => typeof v === 'string' ? v : String(v)).join(', ');
        lines.push(indent + name + ': enum(' + enumValues + ')');
      } else {
        lines.push(indent + name + ': ' + dslType);
      }
    }
  }

  return lines.join('\n');
}

// 生成 transform 区块字段
function generateTransformFields(schema, prefix = '') {
  if (!schema || !schema.properties) return '';
  const lines = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    const fieldPath = prefix ? prefix + '.' + name : name;

    if (prop.type === 'array' && prop.items && prop.items.type === 'object') {
      const nestedTransform = generateTransformFields(prop.items, fieldPath);
      if (nestedTransform) lines.push(nestedTransform);
    } else if (prop.type === 'object' && prop.properties) {
      const nestedTransform = generateTransformFields(prop, fieldPath);
      if (nestedTransform) lines.push(nestedTransform);
    } else {
      const rules = [];
      if (prop.type === 'string') rules.push('trim');
      if (name === 'dataItemId' || name === 'fieldName' || name.includes('Code')) rules.push('lower');

      const ruleStr = rules.length > 0 ? ' (' + rules.join(', ') + ')' : '';
      lines.push('  req.' + fieldPath + ' -> db.' + fieldPath.replace(/([A-Z])/g, '_$1').toLowerCase() + ruleStr);
    }
  }

  return lines.join('\n');
}

// 生成完整 DSL 文件
function generateDSL(data) {
  const reqSchema = parseJsonSchema(data.req_body_other);
  const resSchema = parseJsonSchema(data.res_body);

  let dsl = '# Interface: ' + data.title + '\n';
  dsl += '# Source: ' + data.method + ' ' + data.path + '\n';
  dsl += '# YApi ID: ' + data._id + '\n\n';

  // Input block
  dsl += 'input {\n';
  if (reqSchema) {
    if (data.req_query && data.req_query.length > 0) {
      for (const q of data.req_query) {
        const reqStr = q.required === '1' ? 'required' : 'optional';
        dsl += '  ' + q.name + ': string(' + reqStr + ', "' + (q.desc || '') + '")\n';
      }
    }
    const inputFields = generateInputFields(reqSchema);
    if (inputFields) dsl += inputFields + '\n';
  } else if (data.req_query && data.req_query.length > 0) {
    for (const q of data.req_query) {
      const reqStr = q.required === '1' ? 'required' : 'optional';
      dsl += '  ' + q.name + ': string(' + reqStr + ', "' + (q.desc || '') + '")\n';
    }
  }
  dsl += '}\n\n';

  // Output block
  dsl += 'output {\n';
  if (resSchema) {
    const outputFields = generateOutputFields(resSchema);
    if (outputFields) dsl += outputFields + '\n';
  }
  dsl += '}\n\n';

  // Transform block
  dsl += 'transform {\n';
  if (reqSchema) {
    const transformFields = generateTransformFields(reqSchema);
    if (transformFields) dsl += transformFields + '\n';
  }
  dsl += '}\n';

  return dsl;
}

// 主函数
function main() {
  const options = parseArgs();
  const yapiDir = options.yapiDir;
  const dslDir = options.dslDir;

  // 查找所有 YApi 项目目录
  const projectDirs = fs.readdirSync(yapiDir).filter(f => {
    const fullPath = path.join(yapiDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  if (projectDirs.length === 0) {
    console.error('No YApi project directories found in ' + yapiDir);
    process.exit(1);
  }

  // 确保 DSL 输出目录存在
  if (!fs.existsSync(dslDir)) {
    fs.mkdirSync(dslDir, { recursive: true });
  }

  const dslEntries = [];

  for (const projectName of projectDirs) {
    const projectPath = path.join(yapiDir, projectName);
    const rawFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('_raw.json'));

    for (const file of rawFiles) {
      const filePath = path.join(projectPath, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (content.errcode !== 0) {
        console.error('Error in ' + file + ': ' + content.errmsg);
        continue;
      }

      const data = content.data;
      const dsl = generateDSL(data);
      const dslFileName = data._id + '_' + data.title.replace(/[/\\?%*:|"<>]/g, '_') + '.dsl';
      const dslPath = path.join(dslDir, dslFileName);

      fs.writeFileSync(dslPath, dsl);
      console.log('Generated: ' + dslFileName);

      dslEntries.push({
        id: data._id,
        title: data.title,
        path: data.path,
        method: data.method,
        fileName: dslFileName,
        project: projectName
      });

      // 清理临时文件
      fs.unlinkSync(filePath);
    }
  }

  // 生成索引文件
  let readme = '# Backend Data DSL Index\n\n';
  readme += '> Generated from YApi interface documentation\n\n';
  readme += '| DSL File | Interface | Path | Method | Project |\n';
  readme += '|---------|------|------|------|-------|\n';

  for (const entry of dslEntries) {
    readme += '| [' + entry.fileName + '](./' + entry.fileName + ') | ' + entry.title + ' | ' + entry.path + ' | ' + entry.method + ' | ' + entry.project + ' |\n';
  }

  fs.writeFileSync(path.join(dslDir, 'README.md'), readme);
  console.log('\nGenerated: README.md');
  console.log('Total: ' + dslEntries.length + ' DSL files');
  console.log('Output: ' + dslDir);
}

main();