/** Audit: every media URL referenced by the CMS must exist in public/ or in mediaMap.
 *  Run: node scripts/audit-media-coverage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.resolve(process.env.CMS_DB_PATH || path.join(root, 'server/data/content.json'));
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const map = db.mediaMap || {};

// Collect every media-like URL the CMS publishes.
const urls = new Set();
const push = (value) => { if (typeof value === 'string' && value.trim()) urls.add(value.trim()); };
const walk = (node) => {
  if (Array.isArray(node)) return node.forEach(walk);
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (['image','full','video','logo','favicon','homeImage','displayImage','cover','thumbnail'].includes(key)) push(value);
      else if (typeof value === 'string' && /\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|mov)$/i.test(value)) push(value);
      else walk(value);
    }
  }
};
for (const key of ['services','training','articles','albumCategories','albumItems','sections','collections','settings']) walk(db[key]);

const strip = (u) => u.replace(/^https?:\/\/(?:www\.)?mihousespa\.com/i, '').replace(/^\/+/, '/');
const exists = (rel) => fs.existsSync(path.join(root, 'public', decodeURIComponent(rel)));

let mapped = 0, local = 0, missing = 0;
const missingList = [];
for (const url of urls) {
  const rel = strip(url);
  if (map[url] || map[rel]) { mapped++; continue; }
  if (exists(rel)) { local++; continue; }
  missing++; missingList.push(url);
}

console.log(`CMS media URLs: ${urls.size}`);
console.log(`  already mapped to Cloudinary : ${mapped}`);
console.log(`  present in public/ (local)    : ${local}`);
console.log(`  missing locally and unmapped  : ${missing}`);
if (missingList.length) {
  console.log('\nMissing media (frontend would fall back to a placeholder):');
  for (const url of [...missingList].slice(0, 40)) console.log('  -', url);
  if (missingList.length > 40) console.log(`  ... and ${missingList.length - 40} more`);
}
process.exitCode = missing ? 1 : 0;
