/** Functional check of the CMS -> frontend mapping.
 *  A tiny DOM stub replaces the browser API so the mapping logic in
 *  src/cms/managedContent.js and the SEO rules in src/App.jsx can be tested
 *  in plain Node.
 *  Run: node scripts/test-frontend-cms-mapping.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

let passed = 0;
const ok = (label, fn) => { fn(); passed++; console.log('PASS', label); };

// ---------------------------------------------------------------- DOM stub
const kebab = key => String(key).replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
class ClassList {
  constructor(node) { this.node = node; this.set = new Set(); }
  add(...names) { names.forEach(n => this.set.add(n)); }
  remove(...names) { names.forEach(n => this.set.delete(n)); }
  toggle(name, force) {
    const on = force === undefined ? !this.set.has(name) : Boolean(force);
    if (on) this.set.add(name); else this.set.delete(name);
    return on;
  }
  contains(name) { return this.set.has(name); }
}
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.attributes = {};
    // A real DOM syncs dataset.* with data-* attributes; the stub does too.
    this.dataset = new Proxy({}, {
      set: (target, key, value) => { target[key] = value; this.setAttribute(`data-${kebab(key)}`, value); return true; },
      get: (target, key) => (key in target ? target[key] : this.getAttribute(`data-${kebab(key)}`)),
    });
    this.style = { setProperty() {}, removeProperty() {}, backgroundImage: '' };
    this.classList = new ClassList(this);
    this._text = '';
    this.parentElement = null;
  }
  set className(v) { this.attributes.class = v; this.classList.set = new Set(String(v || '').split(/\s+/).filter(Boolean)); }
  get className() { return this.attributes.class || ''; }
  set innerHTML(v) { this._html = v; this.children = []; }
  get innerHTML() {
    if (this._html) return this._html;
    // Fallback: serialize the child nodes (close enough for assertions).
    return this.children.map(c => {
      const attrs = Object.entries(c.attributes).map(([k, v]) => ` ${k}="${v}"`).join('');
      const inner = c._html !== undefined ? c._html : (c.children.length ? c.children.map(x => x.textContent).join('') : (c._text || ''));
      return `<${c.tagName.toLowerCase()}${attrs}>${inner}</${c.tagName.toLowerCase()}>`;
    }).join('');
  }
  set src(v) { this.attributes.src = String(v); }
  get src() { return this.attributes.src || ''; }
  set href(v) { this.attributes.href = String(v); }
  get href() { return this.attributes.href || ''; }
  set poster(v) { this.attributes.poster = String(v); }
  get poster() { return this.attributes.poster || ''; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() {
    if (this.children.length) return this.children.map(c => c.textContent).join(' ');
    return this._text;
  }
  setAttribute(k, v) { this.attributes[k] = String(v); if (k === 'src') this.src = String(v); }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  hasAttribute(k) { return k in this.attributes; }
  append(...nodes) { nodes.forEach(n => { n.parentElement = this; this.children.push(n); }); }
  prepend(node) { node.parentElement = this; this.children.unshift(node); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  get firstChild() { return this.children[0] || null; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this); }
  removeChild(node) { this.children = this.children.filter(c => c !== node); if (node) node.parentElement = null; return node; }
  closest(sel) {
    let node = this;
    while (node) { if (node.matches(sel)) return node; node = node.parentElement; }
    return null;
  }
  matches(sel) {
    const parts = sel.trim().split(/\s+/);
    return parts.every(part => {
      if (part.startsWith('.')) return this.classList.contains(part.slice(1));
      // The :not() pseudo class - used for "deferred media" selectors.
      const negated = part.match(/^(.*?):not\(([^)]+)\)$/);
      if (negated) {
        const [, base, excluded] = negated;
        if (excluded.split(',').map(x => x.trim()).filter(Boolean).some(x => this.matches(x))) return false;
        return base ? this.matches(base) : true;
      }
      // A compound selector such as a[href^="tel:"] or img[data-x].
      const compound = part.match(/^([a-zA-Z]*)((?:\[[^\]]*\])*)$/);
      if (compound && (compound[1] || compound[2])) {
        const [, tag, attrs] = compound;
        if (tag && this.tagName !== tag.toUpperCase()) return false;
        for (const one of attrs.match(/\[[^\]]*\]/g) || []) {
          const m = one.match(/^\[([\w-]+)(?:(\^=|\$=|\*=|~=|\|=|=)["']?([^\]"']*)["']?)?\]$/);
          if (!m) return false;
          const [, name, op, value] = m;
          if (!op) { if (!this.hasAttribute(name)) return false; continue; }
          const actual = this.getAttribute(name) ?? '';
          if (op === '=' && actual !== value) return false;
          if (op === '^=' && !actual.startsWith(value)) return false;
          if (op === '$=' && !actual.endsWith(value)) return false;
          if (op === '*=' && !actual.includes(value)) return false;
          if (op === '~=' && !actual.split(/\s+/).includes(value)) return false;
          if (op === '|=' && actual !== value && !actual.startsWith(`${value}-`)) return false;
        }
        return true;
      }
      return this.tagName === part.toUpperCase();
    });
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    // Support comma groups and descendant chains (".a .b").
    const groups = sel.split(',').map(s => s.trim()).filter(Boolean);
    const out = [];
    const walk = (node, chain, index) => {
      for (const child of node.children) {
        const part = chain[index];
        const rest = chain.slice(index + 1);
        if (part && child.matches(part)) {
          if (rest.length) walk(child, rest, 0);
          else out.push(child);
        }
        walk(child, chain, index);
      }
    };
    for (const group of groups) {
      const chain = group.split(/\s+/).filter(Boolean);
      if (!chain.length) continue;
      walk(this, chain, 0);
    }
    return out;
  }
}
const doc = new El('body');
globalThis.document = {
  createElement: tag => new El(tag),
  querySelector: sel => doc.querySelector(sel),
  querySelectorAll: sel => doc.querySelectorAll(sel),
  head: new El('head'),
  body: doc,
  title: '',
};
globalThis.DOMParser = class {
  parseFromString(html) {
    const root = new El('body');
    root._html = html;
    root.querySelectorAll = () => [];
    root.body = root;
    return root;
  }
};

const { applyManagedContent, applyFooterContent, mapManagedMedia, resolveMedia, isPublished, categoryItems } =
  await import('../src/cms/managedContent.js');

// -------------------------------------------------------------- fixtures
const cms = {
  revision: 7,
  settings: {
    brand: 'Mi House Spa', phone: '0767882407', email: 'a@b.vn',
    address: '43 Quang Trung', facebook: 'https://facebook.com/mihousespa/',
    maps: 'https://maps.app.goo.gl/ABC', contactLink: 'https://zalo.me/0767882407',
    bookingLink: 'https://zalo.me/0767882407', website: 'https://mihousespa.com',
  },
  sections: {
    intro: { title: 'GIỚI THIỆU MỚI', description: 'mô tả', body: '<p>nội dung</p>', image: '/upload/a.png', alt: 'ảnh giới thiệu', homeTitle: 'HOME TITLE', homeSubtitle: 'HOME SUB', homeBody: '<p>home body</p>', homeImage: '/upload/home.png', updated: true },
    contact: { title: 'LIÊN HỆ MỚI', body: '', phone: '0999888777', email: 'new@b.vn', address: '99 New Street', website: 'https://new.vn', facebook: 'https://facebook.com/new/', maps: 'https://maps.app.goo.gl/NEW', contactLink: 'https://zalo.me/0999888777', bookingLink: 'https://zalo.me/0999888777', updated: true },
    footer: { title: 'FOOTER MỚI', description: 'mô tả footer', body: 'dòng 1\ndòng 2', updated: true },
  },
  services: [
    { id: 's1', title: 'Dịch vụ A', slug: 'dv-a', sourceRoute: '/dv-a', status: 'published', order: 1, image: '/upload/s1.png', displayImage: '/thumbs/s1.webp' },
    { id: 's2', title: 'Dịch vụ B', slug: 'dv-b', sourceRoute: '/dv-b', status: 'draft', order: 2, image: '/upload/s2.png' },
    { id: 's3', title: 'Dịch vụ C', slug: 'dv-c', sourceRoute: '/dv-c', status: 'published', deleted: true, order: 3, image: '/upload/s3.png' },
    { id: 's4', title: 'Dịch vụ D', slug: 'dv-d', sourceRoute: '/dv-d', status: 'published', order: 4, image: '/upload/s4.png' },
  ],
  training: [{ id: 't1', title: 'Đào tạo A', slug: 'dt-a', sourceRoute: '/dt-a', status: 'published', order: 1 }],
  articles: [{ id: 'a1', title: 'Tin A', slug: 'tin-a', sourceRoute: '/tin-a', status: 'published', order: 1, image: '/upload/a1.png' }],
  albumCategories: [
    { id: 'nail', title: 'Nail hottrend', slug: 'nail-hottrend', status: 'published', order: 1 },
    { id: 'space', title: 'Không gian', slug: 'khong-gian', status: 'published', order: 2 },
    { id: 'newcat', title: 'Mẫu mới', slug: 'mau-moi', status: 'published', order: 3 },
  ],
  albumItems: [
    { id: 'p1', title: 'Ảnh mới 1', image: '/upload/p1.png', alt: 'p1', categoryId: 'newcat', status: 'published', order: 1 },
    { id: 'p2', title: 'Ảnh mới 2', image: '/upload/p2.png', categoryId: 'newcat', status: 'published', order: 2, video: '/upload/p2.mp4' },
    { id: 'p3', title: 'Ảnh nháp', image: '/upload/p3.png', categoryId: 'newcat', status: 'draft' },
  ],
  collections: {
    menu: [
      { id: 'm1', title: 'Menu 1', image: '/upload/m1.webp', full: '/upload/m1-full.jpg', status: 'published', order: 1 },
      { id: 'm2', title: 'Menu 2', image: '/upload/m2.webp', status: 'draft' },
    ],
    nail: [{ id: 'n1', title: 'Nail 1', image: '/upload/n1.png', status: 'published', order: 1 }],
    space: [{ id: 's1', title: 'Space 1', image: '/upload/sp1.png', status: 'published', order: 1 }],
    slides: [{ id: 'sl1', title: 'Slide 1', image: '/upload/sl1.webp', status: 'published', order: 1 }],
    videos: [{ id: 'v1', title: 'Video 1', image: '/upload/v1.png', video: '/upload/v1.mp4', status: 'published', order: 1 }],
  },
  mediaMap: {
    '/upload/s1.png': 'https://res.cloudinary.com/demo/image/upload/s1.png',
    '/upload/m1.webp': 'https://res.cloudinary.com/demo/image/upload/m1.webp',
    '/upload/v1.mp4': 'https://res.cloudinary.com/demo/video/upload/v1.mp4',
    'https://mihousespa.com/upload/p1.png': 'https://res.cloudinary.com/demo/image/upload/p1.png',
  },
};

// ------------------------------------------------------------------ tests
ok('isPublished loại bỏ draft và deleted', () => {
  assert.equal(isPublished({ status: 'published' }), true);
  assert.equal(isPublished({ status: 'draft' }), false);
  assert.equal(isPublished({ status: 'published', deleted: true }), false);
  assert.equal(isPublished(null), false);
});

ok('resolveMedia ưu tiên Cloudinary, giữ bản gốc khi chưa migrate', () => {
  assert.equal(resolveMedia(cms, '/upload/s1.png'), 'https://res.cloudinary.com/demo/image/upload/s1.png');
  assert.equal(resolveMedia(cms, '/upload/not-mapped.png'), '/upload/not-mapped.png');
  assert.equal(resolveMedia(cms, 'https://mihousespa.com/upload/p1.png'), 'https://res.cloudinary.com/demo/image/upload/p1.png');
  assert.equal(resolveMedia(cms, 'https://mihousespa.com/upload/unknown.png'), 'https://mihousespa.com/upload/unknown.png');
  assert.equal(resolveMedia({ mediaMap: {} }, '/upload/s1.png'), '/upload/s1.png');
});

ok('Trang chủ dùng homeTitle/homeSubtitle/homeBody/homeImage', () => {
  const root = new El('main');
  root.innerHTML = '';
  const intro = new El('section'); intro.className = 'intro';
  const t = new El('h2'); t.className = 'intro__title';
  const n = new El('h3'); n.className = 'intro__name';
  const d = new El('p'); d.className = 'intro__desc';
  const fig = new El('figure'); fig.className = 'intro__media';
  const img = new El('img'); img.className = 'intro__media-image';
  fig.append(img); intro.append(t, n, d, fig); root.append(intro);
  applyManagedContent(root, '/', cms);
  assert.equal(t.textContent, 'HOME SUB');
  assert.equal(n.textContent, 'HOME TITLE');
  assert.equal(img.getAttribute('src'), '/upload/home.png');
});

ok('Dịch vụ: chỉ hiện bản ghi published, không trộn tin tức/đào tạo', () => {
  const root = new El('main');
  const list = new El('div'); list.className = 'service__list';
  root.append(list);
  applyManagedContent(root, '/dich-vu', cms);
  const items = list.querySelectorAll('.service__item');
  assert.equal(items.length, 2, 'chỉ 2 dịch vụ published');
  const ids = items.map(i => i.dataset.cmsRecord);
  assert.deepEqual(ids.sort(), ['s1', 's4']);
  assert.equal(items.some(i => i.textContent.includes('Dịch vụ B')), false);
  assert.equal(items.some(i => i.textContent.includes('Dịch vụ C')), false);
});

ok('Danh sách Đào tạo chỉ lấy training[], không lẫn services', () => {
  const root = new El('main');
  const list = new El('div'); list.className = 'news__list';
  root.append(list);
  applyManagedContent(root, '/dao-tao', cms);
  assert.equal(list.querySelectorAll('.news__item').length, 1);
  assert.equal(list.textContent.includes('Đào tạo A'), true);
  assert.equal(list.textContent.includes('Dịch vụ A'), false);
});

ok('Danh sách Tin tức chỉ lấy articles[]', () => {
  const root = new El('main');
  const list = new El('div'); list.className = 'news__list';
  root.append(list);
  applyManagedContent(root, '/tin-tuc', cms);
  assert.equal(list.querySelectorAll('.news__item').length, 1);
  assert.equal(list.textContent.includes('Tin A'), true);
  assert.equal(list.textContent.includes('Đào tạo A'), false);
});

ok('Bảng giá: chỉ ảnh published, data-src dùng `full` cho lightbox', () => {
  const root = new El('main');
  const gallery = new El('div'); gallery.className = 'news-detail-gallery';
  root.append(gallery);
  applyManagedContent(root, '/bang-gia', cms);
  const items = gallery.querySelectorAll('.album-item');
  assert.equal(items.length, 1, 'ảnh nháp bị loại');
  const frame = items[0].querySelector('[data-fancybox]');
  assert.equal(frame.getAttribute('data-src'), '/upload/m1-full.jpg');
  assert.equal(items[0].textContent.includes('Menu 1'), true);
});

ok('Album: lưới ảnh thay cho 3 thẻ danh mục cỡ lớn, lọc ảnh nháp', () => {
  const root = new El('main');
  const title = new El('div'); title.className = 'title-main';
  const h1 = new El('h1'); title.append(h1);
  const gallery = new El('div'); gallery.className = 'news-detail-gallery';
  root.append(title, gallery);
  applyManagedContent(root, '/album-anh', cms);
  const boxes = gallery.querySelectorAll('.album-item');
  assert.equal(boxes.length, 4, 'Lưới chứa ảnh đã đăng của các danh mục; không tạo 3 thẻ danh mục');
  assert.equal(gallery.textContent.includes('Mẫu mới'), false, 'Không phóng to tiêu đề danh mục trong lưới ảnh');
  const items = categoryItems({ id: 'newcat' }, cms);
  assert.equal(items.length, 2, 'ảnh nháp bị loại khỏi danh mục');
  assert.equal(items.some(i => i.video), true, 'bản ghi video được giữ');
});

ok('Liên hệ: áp phone/email/address + link tel/mailto/facebook/maps', () => {
  const root = new El('main');
  const left = new El('div'); left.className = 'contact-left';
  const info = new El('div'); info.className = 'content-main';
  // The original page ships four paragraphs; they must be refreshed in place.
  const addr = new El('p'); addr.textContent = 'Địa Chỉ: 43 Quang Trung';
  const hot = new El('p'); hot.textContent = 'Hotline: 0767882407';
  const mailText = new El('p'); mailText.textContent = 'Email: old@b.vn';
  const site = new El('p'); site.textContent = 'Website: mihousespa.com';
  const tel = new El('a'); tel.setAttribute('href', 'tel:0767882407');
  const mail = new El('a'); mail.setAttribute('href', 'mailto:old@b.vn');
  const fb = new El('a'); fb.setAttribute('href', 'https://www.facebook.com/old/');
  const map = new El('a'); map.setAttribute('href', 'https://maps.app.goo.gl/OLD');
  const zalo = new El('a'); zalo.setAttribute('href', 'https://zalo.me/0767882407');
  info.append(addr, hot, mailText, site, tel, mail, fb, map, zalo);
  left.append(info); root.append(left);
  applyManagedContent(root, '/lien-he', cms);
  assert.equal(addr.textContent, 'Địa Chỉ: 99 New Street');
  assert.equal(hot.textContent, 'Hotline: 0999888777');
  assert.equal(mailText.textContent, 'Email: new@b.vn');
  assert.equal(site.textContent, 'Website: new.vn');
  assert.equal(tel.getAttribute('href'), 'tel:0999888777');
  assert.equal(mail.getAttribute('href'), 'mailto:new@b.vn');
  assert.equal(fb.getAttribute('href'), 'https://facebook.com/new/');
  assert.equal(map.getAttribute('href'), 'https://maps.app.goo.gl/NEW');
  assert.equal(zalo.getAttribute('href'), 'https://zalo.me/0999888777');
  assert.equal(info.innerHTML.includes('99 New Street'), true);
});

ok('Footer: áp title/description/body từ sections.footer', () => {
  const footer = new El('footer'); footer.className = 'footer';
  const name = new El('h2'); name.className = 'footer__name';
  const desc = new El('p'); desc.className = 'footer__desc';
  const content = new El('div'); content.className = 'footer__content';
  footer.append(name, desc, content);
  doc.append(footer);
  applyFooterContent(cms);
  assert.equal(name.textContent, 'FOOTER MỚI');
  assert.equal(desc.textContent, 'mô tả footer');
  assert.equal(content.innerHTML.includes('<p>dòng 1</p>'), true);
  doc.removeChild(footer);
});

ok('mapManagedMedia ánh xạ img, video, source, data-src, poster, srcset', () => {
  const root = new El('main');
  const img = new El('img'); img.setAttribute('src', '/upload/s1.png');
  const video = new El('video'); video.setAttribute('src', '/upload/v1.mp4');
  const poster = new El('video'); poster.setAttribute('poster', '/upload/s1.png');
  const bg = new El('div'); bg.setAttribute('data-bg-image', '/upload/s1.png');
  const fancy = new El('div'); fancy.setAttribute('data-fancybox', 'menu'); fancy.setAttribute('data-src', '/upload/m1.webp');
  const deferred = new El('img'); deferred.setAttribute('data-src', '/upload/s1.png');
  root.append(img, video, poster, bg, fancy, deferred);
  mapManagedMedia(root, cms);
  assert.equal(img.getAttribute('src'), 'https://res.cloudinary.com/demo/image/upload/s1.png');
  assert.equal(video.getAttribute('src'), 'https://res.cloudinary.com/demo/video/upload/v1.mp4');
  assert.equal(poster.getAttribute('poster'), 'https://res.cloudinary.com/demo/image/upload/s1.png');
  assert.equal(bg.getAttribute('data-bg-image'), 'https://res.cloudinary.com/demo/image/upload/s1.png');
  assert.equal(fancy.getAttribute('data-src'), 'https://res.cloudinary.com/demo/image/upload/m1.webp');
  assert.equal(deferred.getAttribute('data-src'), 'https://res.cloudinary.com/demo/image/upload/s1.png');
});

ok('mapManagedMedia giữ nguyên ảnh gốc khi mediaMap rỗng', () => {
  const root = new El('main');
  const img = new El('img'); img.setAttribute('src', '/upload/s1.png');
  root.append(img);
  mapManagedMedia(root, { mediaMap: {} });
  assert.equal(img.getAttribute('src'), '/upload/s1.png');
});

ok('Chi tiết dịch vụ: bản ghi draft bị chặn, published hiện đúng tiêu đề', () => {
  const draftRoot = new El('main');
  applyManagedContent(draftRoot, '/dv-b', cms);
  assert.equal(draftRoot.innerHTML.includes('Nội dung tạm ẩn'), true);

  const liveRoot = new El('main');
  const h1 = new El('h1'); const titleWrap = new El('div'); titleWrap.className = 'title-main'; titleWrap.append(h1);
  const article = new El('article'); const content = new El('div'); content.className = 'content-main'; content.append(article);
  liveRoot.append(titleWrap, content);
  applyManagedContent(liveRoot, '/dv-a', cms);
  assert.equal(h1.textContent, 'Dịch vụ A');
});

console.log('FRONTEND CMS MAPPING TEST', passed, 'PASS');
