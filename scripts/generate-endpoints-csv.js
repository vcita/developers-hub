#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MCP_SWAGGER_DIR = path.join(__dirname, '..', 'mcp_swagger');
const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'reference', 'endpoints.csv');
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const TOKEN_ALIASES = {
  client: 'Client',
  staff: 'Staff',
  'application user': 'Staff',
  business: 'Staff',
  directory: 'Directory',
  application: 'Directory',
  app: 'Directory',
  internal: 'Internal',
  admin: 'Internal',
  operator: 'Staff',
};

function parseTokensFromDescription(description) {
  if (!description) return new Set();
  const match = description.match(/Available for \*\*([^*]+)\*\*/i);
  if (!match) return new Set();

  const raw = match[1]
    .replace(/tokens?/gi, '')
    .replace(/only/gi, '')
    .replace(/OAuth/gi, '')
    .trim();

  const parts = raw.split(/[,&]|\band\b/i).map(s => s.trim().toLowerCase()).filter(Boolean);
  const tokens = new Set();
  for (const part of parts) {
    const mapped = TOKEN_ALIASES[part];
    if (mapped) tokens.add(mapped);
  }
  return tokens;
}

function escapeCsvField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function extractFirstSentence(description) {
  if (!description) return '';
  let text = description
    .replace(/^##\s*Overview\s*\n/i, '')
    .replace(/\\n/g, ' ')
    .trim();
  const cutoffs = [
    text.indexOf('Available for **'),
    text.indexOf('## '),
    text.indexOf('\n\n'),
  ].filter(i => i > 0);
  if (cutoffs.length > 0) {
    text = text.substring(0, Math.min(...cutoffs)).trim();
  }
  if (text.length > 300) text = text.substring(0, 297) + '...';
  return text;
}

function run() {
  const files = fs.readdirSync(MCP_SWAGGER_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'))
    .sort();

  const rows = [];

  for (const file of files) {
    const filePath = path.join(MCP_SWAGGER_DIR, file);
    const spec = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const domain = path.basename(file, '.json');
    const paths = spec.paths || {};

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!operation) continue;

        const summary = operation.summary || '';
        const description = extractFirstSentence(operation.description);
        const methodUpper = method.toUpperCase();

        const tokens = parseTokensFromDescription(operation.description);

        rows.push({
          domain,
          summary,
          description,
          path: pathStr,
          method: methodUpper,
          Client: tokens.has('Client') ? 'Y' : '',
          Staff: tokens.has('Staff') ? 'Y' : '',
          Directory: tokens.has('Directory') ? 'Y' : '',
          Internal: tokens.has('Internal') ? 'Y' : '',
        });
      }
    }
  }

  const headers = ['Domain', 'Summary', 'Description', 'Path', 'Method', 'Client', 'Staff', 'Directory', 'Internal'];
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    csvLines.push([
      escapeCsvField(row.domain),
      escapeCsvField(row.summary),
      escapeCsvField(row.description),
      escapeCsvField(row.path),
      escapeCsvField(row.method),
      row.Client,
      row.Staff,
      row.Directory,
      row.Internal,
    ].join(','));
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, csvLines.join('\n') + '\n', 'utf-8');
  console.log(`Generated ${OUTPUT_PATH}`);
  console.log(`Total endpoints: ${rows.length}`);
  console.log(`Files processed: ${files.length} (${files.join(', ')})`);
}

run();
