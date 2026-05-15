#!/usr/bin/env node
/**
 * Frontend-Backend DSL Integration Script
 * 合并前端 DSL 和后端 DSL，生成完整的前后端集成 DSL
 *
 * Usage:
 *   node scripts/integrate-dsl.js --frontend-dir <frontend_dsl_dir> --backend-dir <backend_dsl_dir> --output-dir <output_dir>
 *
 * Parameters:
 *   --frontend-dir  前端 DSL 目录 (默认: docs/dsl/frontend)
 *   --backend-dir   后端 DSL 目录 (默认: docs/dsl/backend)
 *   --output-dir    集成 DSL 输出目录 (默认: docs/dsl/integrated)
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    frontendDir: 'docs/dsl/frontend',
    backendDir: 'docs/dsl/backend',
    outputDir: 'docs/dsl/integrated'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--frontend-dir' && args[i + 1]) {
      options.frontendDir = args[i + 1];
      i++;
    } else if (args[i] === '--backend-dir' && args[i + 1]) {
      options.backendDir = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    }
  }

  return options;
}

// 解析后端 DSL
function parseBackendDSL(content) {
  const lines = content.split('\n');
  const api = {
    id: '',
    title: '',
    method: '',
    path: '',
    inputFields: [],
    outputFields: []
  };

  let currentBlock = '';
  let inArray = false;
  let arrayPath = '';

  for (const line of lines) {
    if (line.startsWith('# Interface:')) {
      api.title = line.replace('# Interface:', '').trim();
    }
    if (line.startsWith('# Source:')) {
      const source = line.replace('# Source:', '').trim();
      const parts = source.split(' ');
      if (parts.length >= 2) {
        api.method = parts[0];
        api.path = parts[1];
      }
    }
    if (line.startsWith('# YApi ID:')) {
      api.id = line.replace('# YApi ID:', '').trim();
    }

    // 识别区块
    if (line.trim() === 'input {') currentBlock = 'input';
    if (line.trim() === 'output {') currentBlock = 'output';
    if (line.trim() === '}') {
      if (inArray) {
        inArray = false;
        arrayPath = '';
      } else {
        currentBlock = '';
      }
    }

    // 解析字段
    if (currentBlock && line.match(/^\s*\w+:/)) {
      const fieldMatch = line.match(/^\s*(\w+):\s*(\w+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];

        // 处理嵌套数组
        if (line.includes('array(item=object') || line.includes('array {')) {
          inArray = true;
          arrayPath = fieldName;
        }

        if (currentBlock === 'input') {
          if (inArray) {
            api.inputFields.push({ name: arrayPath + '.' + fieldName, type: fieldType });
          } else {
            api.inputFields.push({ name: fieldName, type: fieldType });
          }
        } else if (currentBlock === 'output') {
          if (inArray) {
            api.outputFields.push({ name: arrayPath + '.' + fieldName, type: fieldType });
          } else {
            api.outputFields.push({ name: fieldName, type: fieldType });
          }
        }
      }
    }
  }

  return api;
}

// 解析前端 DSL
function parseFrontendDSL(content) {
  const lines = content.split('\n');
  const page = {
    name: '',
    route: '',
    components: [],
    dataSources: []
  };

  for (const line of lines) {
    if (line.startsWith('# Page:')) {
      page.name = line.replace('# Page:', '').trim();
    }

    // 提取 dataSource 占位符
    const dsMatch = line.match(/dataSource:\s*\$\{api\.(\w+)\.(\w+)\}/);
    if (dsMatch) {
      page.dataSources.push({
        resource: dsMatch[1],
        action: dsMatch[2],
        placeholder: '${api.' + dsMatch[1] + '.' + dsMatch[2] + '}'
      });
    }

    // 提取组件类型
    const compMatch = line.match(/^\s*(\w+)\s+"?(\w+)"?\s*\{/);
    if (compMatch) {
      page.components.push({
        type: compMatch[1],
        name: compMatch[2]
      });
    }
  }

  return page;
}

// 匹配 API 和组件
function matchAPIs(backendApis, frontendPages) {
  const mappings = [];
  const tbdList = [];

  for (const page of frontendPages) {
    for (const ds of page.dataSources) {
      const matchedApi = backendApis.find(api => {
        // 匹配规则: 资源名 + 动作名
        const pathParts = api.path.split('/');
        const resourceName = pathParts[pathParts.length - 2] || '';
        const actionName = pathParts[pathParts.length - 1] || '';

        return (
          ds.action.toLowerCase() === actionName.toLowerCase() ||
          ds.resource.toLowerCase() === resourceName.toLowerCase().replace('masterdatamodel', 'masterDataModel')
        );
      });

      if (matchedApi) {
        mappings.push({
          placeholder: ds.placeholder,
          api: matchedApi,
          page: page.name
        });
      } else {
        tbdList.push({
          placeholder: ds.placeholder,
          resource: ds.resource,
          action: ds.action,
          page: page.name
        });
      }
    }
  }

  return { mappings, tbdList };
}

// 生成集成 DSL
function generateIntegratedDSL(page, apis, mappings, tbdList) {
  const pageMappings = mappings.filter(m => m.page === page.name);
  const pageTbd = tbdList.filter(t => t.page === page.name);

  let dsl = '# Page: ' + page.name + '\n';
  dsl += '# Integrated from: frontend DSL + backend DSL\n\n';
  dsl += 'page "' + page.name + '" {\n';
  dsl += '  route: TBD\n\n';
  dsl += '  components {\n';

  for (const comp of page.components) {
    dsl += '    ' + comp.name + ' {\n';
    dsl += '      type: ' + comp.type + '\n';

    // 查找对应的 API 绑定
    const relatedMapping = pageMappings.find(m => m.placeholder.includes(comp.name.toLowerCase()));
    if (relatedMapping) {
      dsl += '      dataSource: api.' + relatedMapping.api.path + ' (' + relatedMapping.api.method + ' ' + relatedMapping.api.path + ')\n';
    } else {
      dsl += '      dataSource: TBD\n';
    }

    dsl += '    }\n';
  }

  dsl += '  }\n\n';
  dsl += '  apiMappings {\n';

  for (const mapping of pageMappings) {
    dsl += '    ' + mapping.api.title + ': api.' + mapping.api.path + ' (' + mapping.api.method + ' ' + mapping.api.path + ') -> ' + mapping.placeholder + '\n';
  }

  for (const tbd of pageTbd) {
    dsl += '    ' + tbd.action + ': TBD -> ' + tbd.placeholder + '\n';
  }

  dsl += '  }\n}\n';

  return dsl;
}

function main() {
  const options = parseArgs();

  // 检查目录是否存在
  if (!fs.existsSync(options.frontendDir)) {
    console.error('Frontend DSL directory not found: ' + options.frontendDir);
    process.exit(1);
  }
  if (!fs.existsSync(options.backendDir)) {
    console.error('Backend DSL directory not found: ' + options.backendDir);
    process.exit(1);
  }

  // 创建输出目录
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // 读取所有后端 DSL
  const backendFiles = fs.readdirSync(options.backendDir).filter(f => f.endsWith('.dsl'));
  const backendApis = [];

  for (const file of backendFiles) {
    const content = fs.readFileSync(path.join(options.backendDir, file), 'utf-8');
    const api = parseBackendDSL(content);
    backendApis.push(api);
    console.log('Parsed backend: ' + api.title);
  }

  // 读取所有前端 DSL
  const frontendFiles = fs.readdirSync(options.frontendDir).filter(f => f.endsWith('.dsl'));
  const frontendPages = [];

  for (const file of frontendFiles) {
    const content = fs.readFileSync(path.join(options.frontendDir, file), 'utf-8');
    const page = parseFrontendDSL(content);
    frontendPages.push(page);
    console.log('Parsed frontend: ' + page.name);
  }

  // 匹配 API
  const { mappings, tbdList } = matchAPIs(backendApis, frontendPages);
  console.log('\nAPI Mappings: ' + mappings.length);
  console.log('TBD APIs: ' + tbdList.length);

  // 生成集成 DSL
  for (const page of frontendPages) {
    const dsl = generateIntegratedDSL(page, backendApis, mappings, tbdList);
    const fileName = page.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.dsl';
    fs.writeFileSync(path.join(options.outputDir, fileName), dsl);
    console.log('Generated: ' + fileName);
  }

  // 生成索引
  let index = '# Integrated DSL Index\n\n';
  index += '> Generated from frontend DSL + backend DSL integration\n\n';
  index += '## API Binding Status\n\n';
  index += '| Status | Count | Details |\n';
  index += '|--------|-------|--------|\n';
  index += '| Bound | ' + mappings.length + ' | APIs matched to components |\n';
  index += '| TBD | ' + tbdList.length + ' | APIs pending definition |\n\n';

  if (tbdList.length > 0) {
    index += '## Unresolved APIs\n\n';
    for (const tbd of tbdList) {
      index += '- ' + tbd.placeholder + ' (page: ' + tbd.page + ')\n';
    }
  }

  fs.writeFileSync(path.join(options.outputDir, 'index.md'), index);
  console.log('\nGenerated: index.md');
  console.log('Output: ' + options.outputDir);
}

main();