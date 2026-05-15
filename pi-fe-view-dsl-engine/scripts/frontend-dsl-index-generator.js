#!/usr/bin/env node
/**
 * Frontend DSL Index Generator
 * 为前端 DSL 文件生成索引文件
 *
 * Usage:
 *   node scripts/frontend-dsl-index-generator.js --dsl-dir <dsl_directory>
 *
 * Parameters:
 *   --dsl-dir   DSL 文件目录 (默认: docs/dsl/frontend)
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dslDir: 'docs/dsl/frontend'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dsl-dir' && args[i + 1]) {
      options.dslDir = args[i + 1];
      i++;
    }
  }

  return options;
}

// 解析 DSL 文件提取元信息
function parseDSL(content) {
  const lines = content.split('\n');
  const meta = {
    title: '',
    layout: '',
    source: '',
    components: []
  };

  for (const line of lines) {
    if (line.startsWith('# Page:')) {
      meta.title = line.replace('# Page:', '').trim();
    }
    if (line.startsWith('# Source:')) {
      meta.source = line.replace('# Source:', '').trim();
    }
    if (line.includes('layout:')) {
      const match = line.match(/layout:\s*(\w+)/);
      if (match) meta.layout = match[1];
    }
    // 提取组件类型
    if (line.match(/^\s*(page|section|form|table|modal|tabs|toolbar|breadcrumb|tab-panel|footer)/)) {
      const compMatch = line.match(/^\s*(\w+)/);
      if (compMatch && !meta.components.includes(compMatch[1])) {
        meta.components.push(compMatch[1]);
      }
    }
  }

  return meta;
}

function main() {
  const options = parseArgs();
  const dslDir = options.dslDir;

  if (!fs.existsSync(dslDir)) {
    console.error('DSL directory not found: ' + dslDir);
    process.exit(1);
  }

  const dslFiles = fs.readdirSync(dslDir).filter(f => f.endsWith('.dsl'));

  if (dslFiles.length === 0) {
    console.error('No DSL files found in ' + dslDir);
    process.exit(1);
  }

  const entries = [];

  for (const file of dslFiles) {
    const filePath = path.join(dslDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const meta = parseDSL(content);

    entries.push({
      fileName: file,
      title: meta.title || file.replace('.dsl', ''),
      layout: meta.layout || 'standard-page',
      source: meta.source,
      components: meta.components.join(', ') || '-'
    });
  }

  // 生成索引
  let readme = '# Frontend DSL Index\n\n';
  readme += '> Generated from Modao prototype analysis\n';
  readme += '> Output: ' + dslDir + '\n\n';
  readme += '## Page DSL Files\n\n';
  readme += '| Page | DSL File | Layout | Source | Components |\n';
  readme += '|------|---------|--------|--------|----------|\n';

  for (const entry of entries) {
    readme += '| ' + entry.title + ' | `' + entry.fileName + '` | ' + entry.layout + ' | ' + (entry.source || '-') + ' | ' + entry.components + ' |\n';
  }

  fs.writeFileSync(path.join(dslDir, 'index.md'), readme);
  console.log('Generated: index.md');
  console.log('Total: ' + entries.length + ' DSL files');
  console.log('Output: ' + dslDir);
}

main();