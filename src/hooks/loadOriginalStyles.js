import external from '../externalAssets.json';
import cached from '../assetMap.json';

let loaded = false;

/**
 * The old ZIP linked 22 remote CSS files synchronously in index.html.
 * If the source host stalls, those links can block all meaningful first paint.
 * Load asynchronously after React has already rendered its main content.
 * Previously downloaded CSS is preferred from the local public/ directory.
 */
export function loadOriginalStyles() {
  if (loaded) return;
  loaded = true;

  const unique = [...new Set(external.css || [])];
  for (const url of unique) {
    let source = url;
    try {
      const path = new URL(url).pathname;
      if (cached[path]) source = cached[path];
    } catch { /* Keep the original URL. */ }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = source;
    link.media = 'print'; // Non-blocking CSS fetch; page remains visible on network failures.
    link.dataset.sourceCss = url;
    link.onload = () => { link.media = 'all'; };
    link.onerror = () => {
      link.remove();
      if (import.meta.env.DEV) console.warn('[Mi House] CSS gốc chưa truy cập được:', source);
    };
    const fidelity = document.head.querySelector('link[href="/fidelity.css"]');
    if (fidelity) document.head.insertBefore(link, fidelity);
    else document.head.appendChild(link);
  }
}
