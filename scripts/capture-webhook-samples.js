#!/usr/bin/env node
/**
 * capture-webhook-samples.js
 *
 * Captures real webhook payloads from the readme_sync repo's webhook-response
 * docs and writes them to zapier/webhook_samples/<entity>/<event_type>.json (the
 * format the generator and GitHub Pages both consume). Re-run the generator
 * afterwards so triggers pick up the real shapes.
 *
 * Source of truth: readme_sync/reference/Platform_administration/webhooks-responses/**.md
 * Each payload is a ```json fence holding { entity_name, event_type, data }.
 *
 * The run is STRICT: if any ```json fence fails to parse, it is reported and
 * the script exits non-zero. We fix the docs at the source rather than tolerate
 * malformed JSON.
 *
 * Usage:
 *   node scripts/capture-webhook-samples.js [--source <dir>]
 *   (default source: ../readme_sync/reference/Platform_administration/webhooks-responses)
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.resolve(
  REPO,
  '..',
  'readme_sync',
  'reference',
  'Platform_administration',
  'webhooks-responses'
);

const JSON_FENCE = /```json\s*\n([\s\S]*?)```/g;

const isPayload = (v) =>
  v && typeof v === 'object' && v.entity_name && v.event_type && v.data !== undefined;

// Valid payload envelopes found in a markdown document.
const extractPayloads = (markdown) => {
  if (typeof markdown !== 'string') return [];
  const out = [];
  let m;
  JSON_FENCE.lastIndex = 0;
  while ((m = JSON_FENCE.exec(markdown))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      continue; // malformed is the gate's job (findMalformedFences), not here
    }
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      if (isPayload(item)) out.push(item);
    }
  }
  return out;
};

// The gate: ```json fences that do not parse. These are doc bugs to fix.
const findMalformedFences = (markdown) => {
  if (typeof markdown !== 'string') return [];
  const bad = [];
  let m;
  JSON_FENCE.lastIndex = 0;
  while ((m = JSON_FENCE.exec(markdown))) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      bad.push({ snippet: m[1].slice(0, 80).trim(), error: e.message.split('\n')[0] });
    }
  }
  return bad;
};

// payloads -> [{ path, content }] in the zapier/webhook_samples envelope format.
const toSampleFiles = (payloads) => {
  const seen = new Set();
  const files = [];
  for (const ev of payloads || []) {
    if (!ev || !ev.entity_name || !ev.event_type) continue;
    const id = `${ev.entity_name}/${ev.event_type}`;
    if (seen.has(id)) continue;
    seen.add(id);
    files.push({
      path: `zapier/webhook_samples/${ev.entity_name}/${ev.event_type}.json`,
      content: [{ entity_name: ev.entity_name, event_type: ev.event_type, data: ev.data || {} }],
    });
  }
  return files;
};

const writeSampleFiles = (files) => {
  for (const f of files) {
    const abs = path.join(REPO, f.path);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, `${JSON.stringify(f.content, null, 2)}\n`);
    console.log(`  wrote ${f.path}`);
  }
};

const walkMd = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkMd(p) : e.name.endsWith('.md') ? [p] : [];
  });

const main = () => {
  const argSrc = process.argv.indexOf('--source');
  const source = argSrc > -1 ? process.argv[argSrc + 1] : DEFAULT_SOURCE;
  if (!fs.existsSync(source)) {
    console.error(`Source not found: ${source}\nPass --source <webhooks-responses dir>.`);
    process.exit(1);
  }

  const files = walkMd(source);
  const malformed = [];
  const payloads = [];
  for (const f of files) {
    const md = fs.readFileSync(f, 'utf8');
    findMalformedFences(md).forEach((b) => malformed.push({ file: path.relative(source, f), ...b }));
    payloads.push(...extractPayloads(md));
  }

  if (malformed.length) {
    console.error(`\n${malformed.length} malformed JSON fence(s) — fix the docs at the source:`);
    malformed.forEach((b) => console.error(`  ✗ ${b.file}: ${b.error}  [${b.snippet}…]`));
    process.exit(1);
  }

  const sampleFiles = toSampleFiles(payloads);
  console.log(`Parsed ${payloads.length} payloads -> ${sampleFiles.length} sample files:`);
  writeSampleFiles(sampleFiles);
  console.log('\nNow re-run: node scripts/generate-zapier.js');
};

module.exports = { extractPayloads, findMalformedFences, toSampleFiles, writeSampleFiles };

if (require.main === module) main();
