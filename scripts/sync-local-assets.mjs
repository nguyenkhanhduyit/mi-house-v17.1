/** Index static assets supplied manually from the original website. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public');
const files = {};
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.isFile() && (await fs.stat(absolute)).size) {
      const urlPath = '/' + path.relative(dir, absolute).split(path.sep).map(encodeURIComponent).join('/');
      files[urlPath] = urlPath;
    }
  }
}
for (const folder of ['assets', 'thumbs', 'upload', 'images', 'media']) await walk(path.join(dir, folder));
await fs.writeFile(path.join(root, 'src', 'assetMap.json'), JSON.stringify(files, null, 2) + '\n');
console.log(`Đã nhận diện ${Object.keys(files).length} tài nguyên tĩnh trong public/. Restart npm run dev.`);
