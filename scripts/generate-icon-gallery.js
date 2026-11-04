#!/usr/bin/env node

/**
 * Regenerates the inTandem icon library reference under /icons.
 *
 * Source of truth is the platform IcoMoon stylesheet served from CloudFront
 * (the same font the inTandem UI loads). This script:
 *   1. downloads the stylesheet and extracts every `icon-*` class name
 *   2. writes icons/icon-names.txt and icons/icon-names.json
 *   3. downloads the woff2 so the gallery renders the real glyphs
 *   4. regenerates icons/index.html
 *
 * Run it whenever the platform icon font is bumped:
 *   npm run gen:icons
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const STYLE_URL = 'https://d2wdno3fcy3zvr.cloudfront.net/icons/frontage/style.css';
const ICONS_DIR = path.join(__dirname, '..', 'icons');
const FONT_FILE = 'intandem-icons.woff2';

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'developers-hub-icon-gallery' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return get(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`GET ${url} -> ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

/**
 * Extracts the `.icon-x:before { content: "\\eNNN" }` rules — the codepoint is what
 * actually renders the glyph, so the gallery needs it alongside the class name.
 */
function extractIcons(css) {
  const byName = new Map();
  const re = /\.(icon-[A-Za-z0-9_-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)"/g;
  let m;
  while ((m = re.exec(css)) !== null) byName.set(m[1], m[2].toLowerCase());
  return [...byName.entries()]
    .map(([name, codepoint]) => ({ name, codepoint }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function extractWoff2Url(css) {
  const m = css.match(/url\('([^']*\.woff2[^']*)'\)/);
  if (!m) throw new Error('Could not find a woff2 url in the stylesheet');
  return m[1];
}

function renderHtml(icons) {
  const glyphCss = icons
    .map(i => `  .${i.name}:before { content: "\\${i.codepoint}"; }`)
    .join('\n');

  const tiles = icons
    .map(
      i =>
        `      <button class="icon-card" data-name="${i.name}" type="button">` +
        `<span class="icon-glyph ${i.name}" aria-hidden="true"></span>` +
        `<span class="icon-name">${i.name}</span></button>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>inTandem Icon Library</title>
<style>
  @font-face {
    font-family: 'intandem-icons';
    src: url('${FONT_FILE}') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: block;
  }
  :root {
    --bg: #ffffff;
    --fg: #1b1c1e;
    --muted: #6b7280;
    --line: #e5e7eb;
    --accent: #3b5bdb;
    --card: #ffffff;
    --card-hover: #f4f6ff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #16181c;
      --fg: #e8eaed;
      --muted: #9aa0a6;
      --line: #2b2f36;
      --card: #1d2025;
      --card-hover: #262b33;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 24px 64px;
    background: var(--bg);
    color: var(--fg);
    font: 15px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  header { max-width: 960px; margin: 0 auto 24px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  p { margin: 0 0 12px; color: var(--muted); }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.9em;
    background: var(--card-hover);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .controls {
    max-width: 960px;
    margin: 0 auto 20px;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  #filter {
    flex: 1 1 260px;
    min-width: 0;
    padding: 9px 12px;
    font-size: 15px;
    color: var(--fg);
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  #filter:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  #count { color: var(--muted); font-size: 13px; }
  .grid {
    max-width: 960px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .icon-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 8px;
    font: inherit;
    color: inherit;
    text-align: center;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    cursor: pointer;
  }
  .icon-card:hover { background: var(--card-hover); border-color: var(--accent); }
  .icon-card.copied { border-color: var(--accent); background: var(--card-hover); }
  .icon-glyph {
    font-family: 'intandem-icons' !important;
    font-style: normal;
    font-weight: normal;
    font-size: 28px;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
  }
${glyphCss}
  .icon-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--muted);
    word-break: break-all;
  }
  #empty { max-width: 960px; margin: 24px auto; color: var(--muted); display: none; }
</style>
</head>
<body>
<header>
  <h1>inTandem Icon Library</h1>
  <p>
    These are the icon identifiers accepted by the <code>icon</code> property of a
    <a href="../entities/apps/md/navigation_item.md">navigation item</a> (and other platform
    objects that reference the icon library). Pass the full class name, e.g.
    <code>"icon-Dashboard_POV"</code>.
  </p>
  <p>
    Click any icon to copy its name. Machine-readable lists:
    <a href="icon-names.json">icon-names.json</a>, <a href="icon-names.txt">icon-names.txt</a>.
  </p>
</header>
<div class="controls">
  <input id="filter" type="search" placeholder="Filter icons&hellip;" autocomplete="off" aria-label="Filter icons">
  <span id="count"></span>
</div>
<div class="grid" id="grid">
${tiles}
</div>
<p id="empty">No icons match that filter.</p>
<script>
  (function () {
    var grid = document.getElementById('grid');
    var cards = Array.prototype.slice.call(grid.children);
    var filter = document.getElementById('filter');
    var count = document.getElementById('count');
    var empty = document.getElementById('empty');

    function update() {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var match = !q || card.dataset.name.toLowerCase().indexOf(q) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      count.textContent = shown + ' of ' + cards.length + ' icons';
      empty.style.display = shown ? 'none' : 'block';
    }

    filter.addEventListener('input', update);
    update();

    grid.addEventListener('click', function (event) {
      var card = event.target.closest('.icon-card');
      if (!card) return;
      var done = function () {
        card.classList.add('copied');
        setTimeout(function () { card.classList.remove('copied'); }, 600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(card.dataset.name).then(done, function () {});
      }
    });
  })();
</script>
</body>
</html>
`;
}

async function main() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  console.log(`Fetching ${STYLE_URL}`);
  const css = (await get(STYLE_URL)).toString('utf8');

  const icons = extractIcons(css);
  if (icons.length === 0) throw new Error('No icon-* rules found in the stylesheet');
  console.log(`Found ${icons.length} icons`);

  fs.writeFileSync(path.join(ICONS_DIR, 'icon-names.txt'), icons.map(i => i.name).join('\n') + '\n');
  fs.writeFileSync(
    path.join(ICONS_DIR, 'icon-names.json'),
    JSON.stringify(
      { font_family: 'intandem-icons', source: STYLE_URL, count: icons.length, icons },
      null,
      2
    ) + '\n'
  );

  const fontUrl = extractWoff2Url(css);
  console.log(`Fetching ${fontUrl}`);
  fs.writeFileSync(path.join(ICONS_DIR, FONT_FILE), await get(fontUrl));

  fs.writeFileSync(path.join(ICONS_DIR, 'index.html'), renderHtml(icons));
  console.log(`Wrote icons/index.html, icons/icon-names.json, icons/icon-names.txt, icons/${FONT_FILE}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
