#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

function titleCase(str) {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1));
}

function isPlainObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function renderType(schema) {
  if (!schema) return 'unknown';
  if (schema.$ref) {
    const ref = schema.$ref;
    const name = ref.split('/').pop();
    return `ref to ${name}`;
  }
  if (schema.type === 'array') {
    return `array<${renderType(schema.items)}>`;
  }
  if (schema.type) return schema.type;
  return 'object';
}

function renderEnum(schema) {
  if (!schema) return '';
  const e = schema.enum;
  if (Array.isArray(e) && e.length) {
    return ` (enum: ${e.map((v) => `\`${String(v)}\``).join(', ')})`;
  }
  return '';
}

function renderProperties(properties, requiredKeys = []) {
  if (!properties || !isPlainObject(properties)) return '';
  const requiredSet = new Set(Array.isArray(requiredKeys) ? requiredKeys : []);
  const rows = Object.entries(properties).map(([name, prop]) => {
    const type = renderType(prop);
    const enumSuffix = renderEnum(prop);
    const desc = (prop && prop.description) ? prop.description : '';
    const required = requiredSet.has(name) ? 'Yes' : '';
    return `| ${name} | ${desc} | ${type}${enumSuffix} | ${required} |`;
  });
  if (rows.length === 0) return '';
  return [
    '| Name | Description | Type | Required |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function renderExample(example) {
  if (!example) return '';
  try {
    const json = JSON.stringify(example, null, 2);
    return 'JSON\n\n```json\n' + json + '\n```';
  } catch (e) {
    return '';
  }
}

function generateMarkdown(entityName, schema) {
  const displayName = titleCase(entityName.replace(/\.json$/i, ''));
  const description = schema.description || `The ${displayName} entity.`;
  const required = Array.isArray(schema.required) ? schema.required : [];

  const header = `## ${displayName}\n\n${description}`;

  const propsTable = renderProperties(schema.properties, required);
  const requiredList = required.length ? `\n\n**Required fields**: ${required.map((r) => `\`${r}\``).join(', ')}` : '';

  let sections = [header];

  if (propsTable) {
    sections.push('\n\n### Properties\n\n' + propsTable + requiredList);
  }

  // Render nested known objects as subsections for one level (display/context/target/status etc.)
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propSchema && propSchema.type === 'object' && propSchema.properties) {
        const subTable = renderProperties(propSchema.properties, propSchema.required);
        if (subTable) {
          sections.push(`\n\n### ${titleCase(propName)} Properties\n\n${subTable}`);
        }
      }
    }
  }

  if (schema.example) {
    sections.push('\n\n### Example\n\n' + renderExample(schema.example));
  }

  // Support OpenAPI-style examples array as well
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    if (!schema.example) {
      // If no single example already rendered, title as Example when there is exactly one
      if (schema.examples.length === 1) {
        sections.push('\n\n### Example\n\n' + renderExample(schema.examples[0]));
      } else {
        sections.push('\n\n### Examples');
        schema.examples.forEach((ex, idx) => {
          sections.push(`\n\n#### Example ${idx + 1}\n\n` + renderExample(ex));
        });
      }
    } else {
      // If a single example already exists, append additional examples
      if (schema.examples.length === 1) {
        sections.push('\n\n#### Additional Example\n\n' + renderExample(schema.examples[0]));
      } else {
        sections.push('\n\n### Additional Examples');
        schema.examples.forEach((ex, idx) => {
          sections.push(`\n\n#### Example ${idx + 1}\n\n` + renderExample(ex));
        });
      }
    }
  }

  // Footer: note about source
 // sections.push(`\n\n_Generated from entities schema: ${entityName}_`);

  return sections.join('');
}

async function collectEntityFiles(rootDir) {
  const results = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        results.push(full);
      }
    }
  }
  await walk(rootDir);
  return results;
}

function toMdFileName(jsonFileName) {
  const base = jsonFileName.replace(/\.json$/i, '').replace(/\s+/g, '_');
  return `${base}.md`;
}

async function generateForFile(filePath, entitiesRoot) {
  const rel = path.relative(entitiesRoot, filePath);
  const dir = path.dirname(filePath);
  const fileName = path.basename(filePath);
  const mdDir = path.join(dir, 'md');
  await fs.ensureDir(mdDir);

  const schema = await fs.readJson(filePath);
  const md = generateMarkdown(fileName, schema);
  const mdFilePath = path.join(mdDir, toMdFileName(fileName));
  await fs.writeFile(mdFilePath, md, 'utf8');
  return { input: rel, output: path.relative(entitiesRoot, mdFilePath) };
}

async function main() {
  const args = process.argv.slice(2);
  const entitiesRoot = path.resolve(__dirname, '..', 'entities');

  let target = null; // relative path from entities root or base name
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--entity' && args[i + 1]) {
      target = args[i + 1];
      i++;
    }
  }

  if (target) {
    // Allow passing either a relative path under entities or just a base name
    let candidate = path.isAbsolute(target) ? target : path.join(entitiesRoot, target);
    if (!candidate.endsWith('.json')) {
      // try to resolve by searching for a matching file name under entities
      const all = await collectEntityFiles(entitiesRoot);
      const match = all.find((p) => path.basename(p).toLowerCase() === (target.toLowerCase().endsWith('.json') ? target.toLowerCase() : `${target.toLowerCase()}.json`));
      if (match) candidate = match;
    }
    if (!(await fs.pathExists(candidate))) {
      console.error(`[ERROR] Entity not found: ${target}`);
      process.exit(1);
    }
    const res = await generateForFile(candidate, entitiesRoot);
    console.log(`[OK] Generated ${res.output} from ${res.input}`);
    return;
  }

  const files = await collectEntityFiles(entitiesRoot);
  const results = [];
  for (const f of files) {
    try {
      const r = await generateForFile(f, entitiesRoot);
      results.push(r);
    } catch (e) {
      console.error(`[WARN] Failed to generate for ${path.relative(entitiesRoot, f)}: ${e.message}`);
    }
  }
  console.log(`Generated ${results.length} markdown files under md/ folders.`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { generateMarkdown };


