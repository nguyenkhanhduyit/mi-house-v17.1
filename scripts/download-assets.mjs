/**
 * Cache publicly accessible static resources referenced by the user's supplied HTML.
 * Downloads are optional: original markup stays untouched and failed downloads
 * NEVER overwrite a functioning remote URL. No authentication, scraping forms,
 * private endpoints, server-side code or tracking APIs are requested.
 *
 * Run: npm run assets:download
 *      npm run assets:download -- --limit=120 --concurrency=6
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://mihousespa.com';
const publicDir = path.join(root, 'public');
const manifestPath = path.join(root, 'src', 'assetMap.json');
const reportPath = path.join(root, 'asset-download-report.json');
const args = process.argv.slice(2);
function arg(name, fallback) {
  const value = args.find(v => v.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  return value == null ? fallback : Number(value);
}
const concurrency = Math.min(12, Math.max(1, arg('concurrency', 6)));
const limit = Math.max(1, arg('limit', 5000));
const timeoutMs = Math.max(1500, arg('timeout', 15000));
const maxBytes = Math.max(1, arg('max-mb', 15)) * 1024 * 1024;
const prefix = /^\/(?:assets|thumbs|upload|images|media)\//;
const discovered = new Map();
let failures = [], succeeded = [], reused = [];

function resource(value, base = origin) {
  if (!value || /^(?:data:|blob:|javascript:|mailto:|tel:)/i.test(value)) return;
  try {
    const url = new URL(value.replace(/^\/\//, 'https://'), base);
    if (!['mihousespa.com', 'www.mihousespa.com'].includes(url.hostname)) return;
    if (!prefix.test(url.pathname) || url.pathname.endsWith('/')) return;
    // Skip directory traversal and unexpected encoded slashes.
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('..') || decoded.includes('\\') || decoded.includes('\0')) return;
    url.protocol = 'https:';
    url.hostname = 'mihousespa.com';
    const key = url.pathname;
    if (!discovered.has(key)) discovered.set(key, url.href);
  } catch { /* Ignore malformed references. */ }
}

function fromText(text, base = origin) {
  // Absolute or protocol-relative references found in IMG, source/srcset,
  // style attributes, src and href in each archived HTML file.
  for (const m of text.matchAll(/(?:https?:)?\/\/(?:www\.)?mihousespa\.com\/(?:assets|thumbs|upload|images|media)\/[^\s"'<>`\\()]+/gi)) {
    resource(m[0].replace(/[;,]+$/, ''), base);
  }
  // Relative resource URLs in CSS: url(../fonts/X.woff2), url('/upload/X.jpg')
  for (const m of text.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gi)) resource(m[1].trim(), base);
  // @import "..." (without url())
  for (const m of text.matchAll(/@import\s+['"]([^'"]+)['"]/gi)) resource(m[1], base);
}

function destination(urlPath) {
  const file = path.resolve(publicDir, '.' + decodeURI(urlPath));
  if (!file.startsWith(publicDir + path.sep)) throw new Error('Invalid resource destination');
  return file;
}

async function fetchResource(url) {
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, {
    signal,
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MiHouseAssetCache/1.0; static-resource-archiver)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (/text\/html/i.test(contentType) && !/\.html?$/i.test(new URL(url).pathname)) {
    throw new Error('Tài nguyên trả về HTML thay vì file tĩnh (có thể bị chặn)');
  }
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('File vượt giới hạn dung lượng');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { await reader.cancel(); throw new Error('File vượt giới hạn dung lượng'); }
    chunks.push(Buffer.from(value));
  }
  const data = Buffer.concat(chunks, total);
  if (!data.length) throw new Error('Empty response');
  return data;
}

async function main() {
  const oldMap = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(() => '{}'));
  const inputs = [path.join(root, 'index.html'), path.join(root, 'src', 'externalAssets.json')];
  for (const dir of [path.join(root, 'original-html'), path.join(root, 'src', 'pages'), path.join(root, 'src', 'components')]) {
    for (const name of await fs.readdir(dir)) if (/\.(?:html|jsx|txt)$/.test(name)) inputs.push(path.join(dir, name));
  }
  for (const file of inputs) fromText(await fs.readFile(file, 'utf8'));
  console.log(`Đã nhận diện ${discovered.size} URL tài nguyên tĩnh của website gốc.`);
  if (!discovered.size) return;

  // Probe before queuing hundreds of requests. A failed DNS, timeout, or 403
  // must not damage a working React project.
  const firstCSS = [...discovered.values()].find(u => u.includes('/assets/css/')) || discovered.values().next().value;
  try {
    const data = await fetchResource(firstCSS);
    const key = new URL(firstCSS).pathname;
    const file = destination(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    succeeded.push({ url: firstCSS, bytes: data.length, path: key });
    oldMap[key] = key;
    if (/\.css$/i.test(key)) fromText(data.toString('utf8'), firstCSS);
    console.log(`Kết nối OK: ${firstCSS}`);
  } catch (error) {
    console.warn(`Không thể truy cập website gốc: ${error.message}`);
    console.warn('Giữ toàn bộ liên kết gốc. Không thay thế file nào khi chưa tải được.');
    await fs.writeFile(reportPath, JSON.stringify({ status: 'origin-unreachable', message: error.message, detected: discovered.size, downloaded: 0, errors: [{ url: firstCSS, error: error.message }] }, null, 2));
    return;
  }

  const processed = new Set(succeeded.map(x => x.path));
  // CSS references may add more resources while workers are running.
  let cursor = 0;
  const urls = [...discovered.values()];
  async function worker() {
    while (true) {
      // Expand CSS discoveries incrementally; cap by --limit.
      if (cursor >= urls.length) {
        for (const [pathname, url] of discovered) {
          if (!urls.some(v => new URL(v).pathname === pathname)) urls.push(url);
        }
      }
      if (cursor >= Math.min(urls.length, limit)) break;
      const url = urls[cursor++];
      const key = new URL(url).pathname;
      if (processed.has(key)) continue;
      processed.add(key);
      const file = destination(key);
      try {
        // Previously cached files remain usable without re-downloading.
        const stat = await fs.stat(file).catch(() => null);
        if (stat?.size) {
          oldMap[key] = key;
          reused.push({ path: key, bytes: stat.size });
          if (/\.css$/i.test(key)) fromText(await fs.readFile(file, 'utf8'), url);
          continue;
        }
        const body = await fetchResource(url);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, body);
        oldMap[key] = key;
        succeeded.push({ url, bytes: body.length, path: key });
        if (/\.css$/i.test(key)) fromText(body.toString('utf8'), url);
      } catch (error) {
        failures.push({ url, error: String(error.message || error) });
      }
      if ((succeeded.length + failures.length + reused.length) % 25 === 0) {
        console.log(`Tiến độ: ${processed.size}/${Math.min(discovered.size, limit)} file, tải ${succeeded.length}, lỗi ${failures.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // Write mapping only for paths that we have verified exist on disk.
  const verified = {};
  for (const [remote, local] of Object.entries(oldMap)) {
    if ((await fs.stat(destination(local)).catch(() => null))?.size) verified[remote] = local;
  }
  await fs.writeFile(manifestPath, JSON.stringify(verified, null, 2) + '\n');

  // Rewrite external host references in locally downloaded CSS when
  // the matching target file was actually saved. Unresolved links are retained.
  for (const css of Object.keys(verified).filter(x => x.endsWith('.css'))) {
    const file = destination(css);
    let text = await fs.readFile(file, 'utf8');
    text = text.replace(/https?:\/\/(?:www\.)?mihousespa\.com\/(?:assets|thumbs|upload|images|media)\/[^\s"'()<>]+/gi, raw => {
      try {
        const u = new URL(raw);
        return verified[u.pathname] || raw;
      } catch { return raw; }
    });
    await fs.writeFile(file, text);
  }

  const report = { status: 'completed', detected: discovered.size, downloaded: succeeded.length,
    reused: reused.length, failures: failures.length, bytesDownloaded: succeeded.reduce((n, x) => n + x.bytes, 0),
    savedPaths: Object.keys(verified), errors: failures };
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`Hoàn tất: ${succeeded.length} file mới, ${reused.length} file đã có, ${failures.length} lỗi. Kiểm tra asset-download-report.json.`);
  console.log('Restart npm run dev để React và CSS dùng các tài nguyên cục bộ mới.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
