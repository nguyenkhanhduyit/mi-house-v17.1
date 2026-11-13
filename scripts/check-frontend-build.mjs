/** Parse/transform check for the frontend files owned by the frontend worker.
 *  Run: node scripts/check-frontend-build.mjs
 *  Uses esbuild (already a Vite dependency) so no new package is required.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'src/App.jsx',
  'src/cms/managedContent.js',
  'src/cms/runtime.js',
  'src/pages/_home.jsx',
  'src/pages/album-anh.jsx',
  'src/pages/bang-gia.jsx',
  'src/pages/dao-tao.jsx',
  'src/pages/dich-vu.jsx',
  'src/pages/gioi-thieu.jsx',
  'src/pages/lien-he.jsx',
  'src/pages/nail-hottrend.jsx',
  'src/pages/khong-gian.jsx',
  'src/pages/tin-tuc.jsx',
  'src/components/AlbumShowcase.jsx',
  'src/components/CmsArticlePage.jsx',
  'src/components/CmsManagedPage.jsx',
  'src/components/HomeCollections.jsx',
  'src/components/HomeServiceCards.jsx',
  'src/components/SharedShell.jsx',
  'src/components/GalleryLightbox.jsx',
  'src/hooks/enhancePage.js',
  'src/hooks/localizeAssets.js',
  'src/hooks/sourceCarousels.js',
  'src/hooks/fidelityMotion.js',
  'src/hooks/loadOriginalStyles.js',
];

let failed = 0;
for (const rel of targets) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) { console.log('SKIP', rel); continue; }
  try {
    await transform(fs.readFileSync(full, 'utf8'), { loader: 'jsx', jsx: 'automatic' });
    console.log('OK  ', rel);
  } catch (error) {
    failed++;
    console.error('FAIL', rel, '-', error.message);
  }
}
console.log(failed ? `FRONTEND BUILD CHECK FAILED: ${failed}` : `FRONTEND BUILD CHECK PASS: ${targets.length} files`);
process.exitCode = failed ? 1 : 0;
