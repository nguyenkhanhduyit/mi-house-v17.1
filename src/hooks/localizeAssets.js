import cache from '../assetMap.json';

const ORIGIN = 'mihousespa.com';
const PLACEHOLDER = '/media-placeholder.svg';

function localized(value) {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return value;
  try {
    const u = new URL(value, window.location.href);
    if ((u.hostname === ORIGIN || u.hostname === `www.${ORIGIN}`) && cache[u.pathname]) {
      return cache[u.pathname];
    }
  } catch { /* Ignore non-URLs. */ }
  return value;
}

export function localizeAssets(root) {
  if (!root) return;
  for (const el of root.querySelectorAll('img, picture source, video, video source, iframe')) {
    if (el.hasAttribute('src')) {
      const original = el.getAttribute('src');
      const next = localized(original);
      if (next !== original) el.setAttribute('src', next);
    }
    for (const name of ['srcset', 'poster', 'data-src']) {
      const original = el.getAttribute(name);
      if (!original) continue;
      const next = name === 'srcset' ? original.replace(/https?:\/\/(?:www\.)?mihousespa\.com\/[^,\s]+/gi, (url) => localized(url)) : localized(original);
      if (next !== original) el.setAttribute(name, next);
    }
  }
  for (const el of root.querySelectorAll('[data-bg-image]')) {
    const original = el.getAttribute('data-bg-image');
    const next = localized(original);
    if (next !== original) el.setAttribute('data-bg-image', next);
  }
  for (const el of root.querySelectorAll('a[href]')) {
    const href = el.getAttribute('href');
    if (href && /\.(?:webp|jpe?g|png|gif|svg|mp4)(?:\?|$)/i.test(href)) {
      const next = localized(href);
      if (next !== href) el.setAttribute('href', next);
    }
  }
  // Prevent a failed external image from turning the section into a blank space.
  for (const img of root.querySelectorAll('img:not([data-recovery-attached])')) {
    img.dataset.recoveryAttached = '1';
    img.addEventListener('error', () => {
      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';
      if (img.parentElement?.tagName === 'PICTURE') {
        img.parentElement.querySelectorAll('source').forEach(source => source.remove());
      }
      img.src = PLACEHOLDER;
      img.classList.add('asset-image-fallback');
    });
  }
}
