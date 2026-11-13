/** Audit: media URLs used in the React source (pages, components, asset maps)
 *  must exist in public/ so the site never shows a broken image.
 *  Run: node scripts/audit-source-media.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(?:jsx?|json)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const urls = new Set();
for (const file of walk(srcDir)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/["'`]((?:https?:\/\/(?:www\.)?mihousespa\.com)?\/[^"'`\s]*?\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|mov))["'`]/gi)) {
    urls.add(match[1]);
  }
}

const strip = (u) => u.replace(/^https?:\/\/(?:www\.)?mihousespa\.com/i, '').replace(/^\/+/, '/');
const assetMap = JSON.parse(fs.readFileSync(path.join(srcDir, 'assetMap.json'), 'utf8'));
const missing = [];
let local = 0, mapped = 0;

for (const url of urls) {
  const rel = strip(url);
  if (assetMap[rel]) { mapped++; continue; }
  if (fs.existsSync(path.join(root, 'public', decodeURIComponent(rel)))) { local++; continue; }
  missing.push(url);
}

console.log(`Source media URLs: ${urls.size}`);
console.log(`  present in public/          : ${local}`);
console.log(`  covered by assetMap.json    : ${mapped}`);
console.log(`  missing (would break)       : ${missing.length}`);
for (const url of missing.slice(0, 40)) console.log('  -', url);
if (missing.length > 40) console.log(`  ... and ${missing.length - 40} more`);
process.exitCode = missing.length ? 1 : 0;
