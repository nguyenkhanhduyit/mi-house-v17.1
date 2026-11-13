// Native React-side progressive enhancement for the original CSS class structure.
// Core page rendering does not depend on the old jQuery/PHP runtime.
import cachedAssets from '../assetMap.json';
import relatedCatalog from '../relatedCatalog.json';
import sourceCmsCatalog from '../cms/catalog.json';

const ORIGIN = 'https://mihousespa.com/';

function makeAbsolute(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, ORIGIN);
    if (['mihousespa.com', 'www.mihousespa.com'].includes(parsed.hostname) && cachedAssets[parsed.pathname]) {
      return cachedAssets[parsed.pathname];
    }
    if (url.startsWith('/') && url in cachedAssets) return cachedAssets[url];
    return parsed.href.replace(/^http:\/\/mihousespa\.com/i, ORIGIN.slice(0, -1));
  } catch { return url; }
}

function backgrounds(container) {
  for (const el of container.querySelectorAll('[data-bg-image]')) {
    const url = makeAbsolute(el.dataset.bgImage);
    const opts = el.dataset.bgOptions || 'center / cover no-repeat';
    if (url) {
      el.style.background = `url("${url}") ${opts}`;
      if (el.classList.contains("service-price")) {
        el.style.backgroundImage = `linear-gradient(90deg,rgba(34,16,8,.79),rgba(42,21,11,.55)),url("${url}")`;
      }
    }
  }
}

function sliders(container, cleanup) {
  for (const slider of container.querySelectorAll('.splide')) {
    // Album galleries use native horizontal scrolling to support dragging and continuous autoplay.
    if (slider.classList.contains('album-featured__splide')) continue;
    const list = slider.querySelector('.splide__list');
    const track = slider.querySelector('.splide__track');
    if (!list || !track) continue;
    const slides = [...list.querySelectorAll(':scope > .splide__slide')];
    if (slides.length < 2) continue;
    slider.classList.add('is-initialized');
    track.style.overflow = 'hidden';
    list.style.display = 'flex';
    list.style.transition = 'transform 650ms cubic-bezier(.22,.61,.36,1)';
    list.style.willChange = 'transform';
    slides.forEach(s => { s.style.flex = '0 0 100%'; s.style.minWidth = '0'; });
    let index = 0;
    const previous = document.createElement('button');
    const next = document.createElement('button');
    previous.className = 'react-slider-arrow react-slider-arrow--prev';
    next.className = 'react-slider-arrow react-slider-arrow--next';
    previous.type = 'button'; next.type = 'button';
    previous.textContent = '‹'; next.textContent = '›';
    previous.setAttribute('aria-label', 'Ảnh trước');
    next.setAttribute('aria-label', 'Ảnh tiếp theo');
    const dots = document.createElement('div');
    dots.className = 'react-slider-dots';
    const dotButtons = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Đến ảnh ${i + 1}`);
      dot.addEventListener('click', () => show(i));
      dots.append(dot);
      return dot;
    });
    function show(n) {
      index = (n + slides.length) % slides.length;
      list.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide,i) => slide.classList.toggle('is-active', i === index));
      dotButtons.forEach((dot,i) => dot.classList.toggle('is-active', i === index));
    }
    const goPrevious = () => show(index - 1);
    const goNext = () => show(index + 1);
    previous.addEventListener('click', goPrevious);
    next.addEventListener('click', goNext);
    slider.append(previous,next,dots);
    show(0);
    // Swipe left/right on the slideshow, with mouse or a finger.
    let startX = null, startY = null;
    const touchStart = event => { startX = event.touches[0]?.clientX ?? null; startY = event.touches[0]?.clientY ?? null; };
    const touchEnd = event => {
      if (startX === null || !event.changedTouches[0]) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) show(index + (dx < 0 ? 1 : -1));
      startX = null; startY = null;
    };
    track.addEventListener('touchstart',touchStart,{passive:true});
    track.addEventListener('touchend',touchEnd,{passive:true});
    let timer = setInterval(goNext, 6000);
    const pause = () => clearInterval(timer);
    const resume = () => { clearInterval(timer); timer = setInterval(goNext, 6000); };
    slider.addEventListener('mouseenter', pause);
    slider.addEventListener('mouseleave', resume);
    cleanup.push(() => {
      clearInterval(timer);
      slider.removeEventListener('mouseenter', pause);
      slider.removeEventListener('mouseleave', resume);
      previous.removeEventListener('click', goPrevious);
      next.removeEventListener('click', goNext);
      track.removeEventListener('touchstart',touchStart);
      track.removeEventListener('touchend',touchEnd);
      previous.remove(); next.remove(); dots.remove();
    });
  }
}

function swiperCarousels(container, cleanup) {
  for (const swiper of container.querySelectorAll('.swiper-auto')) {
    if (swiper.closest('.service-price')) continue; // original Swiper is initialized separately
    const list = swiper.querySelector('.swiper-wrapper');
    if (!list) continue;
    const children = [...list.children].filter(el => el.classList.contains('swiper-slide'));
    if (children.length < 2) continue;
    const spec = swiper.dataset.swiper || '';
    const breakpoints = [...spec.matchAll(/(\d+):\{slidesPerView:(\d+)/g)].map(m => ({ w:Number(m[1]), count:Number(m[2]) }));
    const gap = Number(spec.match(/spaceBetween:(\d+)/)?.[1] || 16);
    const delay = Number(spec.match(/autoplay:\{delay:(\d+)/)?.[1] || 0);
    const isPrice = !!swiper.closest('.service-price');
    list.style.display = 'flex';
    list.style.overflowX = 'auto';
    list.style.overflowY = 'hidden';
    list.style.scrollBehavior = 'smooth';
    list.style.scrollSnapType = 'x mandatory';
    list.style.gap = `${gap}px`;
    list.style.scrollbarWidth = 'none';
    children.forEach(el => { el.style.scrollSnapAlign = 'start'; el.style.minWidth='0'; });
    function resize() {
      const width = window.innerWidth;
      const allowed = breakpoints.filter(x => x.w <= width);
      const perView = isPrice ? (width >= 720 ? 2 : 1) : (allowed.length ? allowed[allowed.length-1].count : 1);
      children.forEach(el => { el.style.flex = `0 0 calc((100% - ${(perView - 1) * gap}px) / ${perView})`; });
    }
    resize();
    window.addEventListener('resize', resize);
    let interval;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    if (spec.includes('pauseOnMouseEnter:true')) {
      swiper.addEventListener('mouseenter', pause);
      swiper.addEventListener('mouseleave', resume);
    }
    if (delay > 0) interval = setInterval(() => {
      if (paused || document.hidden) return;
      const max = list.scrollWidth - list.clientWidth;
      if (max <= 0) return;
      const step = children[0].getBoundingClientRect().width + gap;
      list.scrollTo({ left: list.scrollLeft >= max - 2 ? 0 : Math.min(max,list.scrollLeft + step), behavior: 'smooth' });
    }, delay);
    cleanup.push(() => {
      window.removeEventListener('resize', resize);
      swiper.removeEventListener('mouseenter', pause);
      swiper.removeEventListener('mouseleave', resume);
      clearInterval(interval);
    });
  }
}

function addObserver(container, cleanup) {
  // Most images already have src; data-src is used for deferred media and lazy embeds.
  const list = [...container.querySelectorAll('img[data-src], iframe[data-src], video[data-src]')];
  const load = (el) => {
    if (!el.getAttribute('src')) el.src = makeAbsolute(el.dataset.src);
    if (el.dataset.srcset && !el.getAttribute('srcset')) el.srcset = el.dataset.srcset;
  };
  if (!('IntersectionObserver' in window)) { list.forEach(load); return; }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      load(entry.target);
      observer.unobserve(entry.target);
    });
  },{ rootMargin: '350px' });
  list.forEach(el => observer.observe(el));
  cleanup.push(() => observer.disconnect());
}

/** Restore table of contents using the ORIGINAL box-toc--open classes from style.css. */
function tableOfContents(container, cleanup) {
  const tocs=container.querySelectorAll('.js-content-toc');
  tocs.forEach((toc)=>{
    const content=toc.closest('.content-toc-wrap')?.querySelector('.content-main')||container.querySelector('.content-main');
    const list=toc.querySelector('.box-toc__list');
    const header=toc.querySelector('.box-toc__header');
    if(!content||!list||!header)return;
    const headings=[...content.querySelectorAll('h2,h3,h4')].filter(h=>h.textContent.trim());
    if(!headings.length){toc.style.display='none';return;}
    const generatedIds=[];
    list.replaceChildren();
    headings.forEach((heading,i)=>{
      if(!heading.id){heading.id=`mh-toc-${i+1}`;generatedIds.push(heading)}
      const level=heading.tagName.toLowerCase();
      const li=document.createElement('li');li.className=`box-toc__item box-toc__item--${level}`;
      const anchor=document.createElement('a');anchor.className='box-toc__link';
      anchor.href=`#${heading.id}`;anchor.textContent=heading.textContent.trim();
      anchor.addEventListener('click',(event)=>{
        event.preventDefault();
        heading.scrollIntoView({behavior:'smooth',block:'start'});
        try {window.history.replaceState(window.history.state,'',`${window.location.pathname}${window.location.search}#${encodeURIComponent(heading.id)}`)} catch { /* embedded/offline previews can have opaque origins */ }
        list.querySelectorAll('.box-toc__link--active').forEach(a=>a.classList.remove('box-toc__link--active'));
        anchor.classList.add('box-toc__link--active');
      });
      li.append(anchor);list.append(li);
    });
    toc.style.display='block';
    toc.classList.remove('box-toc--open');
    header.tabIndex=0;header.setAttribute('role','button');header.setAttribute('aria-expanded','false');
    let toggleIcon=header.querySelector('.box-toc__toggle-icon');
    if(!toggleIcon){toggleIcon=document.createElement('span');toggleIcon.className='box-toc__toggle-icon';toggleIcon.textContent='⌄';header.append(toggleIcon)}
    const toggle=()=>{const open=toc.classList.toggle('box-toc--open');header.setAttribute('aria-expanded',String(open))};
    const key=(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle()}};
    header.addEventListener('click',toggle);header.addEventListener('keydown',key);
    cleanup.push(()=>{
      header.removeEventListener('click',toggle);header.removeEventListener('keydown',key);
      generatedIds.forEach(el=>el.removeAttribute('id'));
      list.replaceChildren();toc.classList.remove('box-toc--open');
    });
  });
}

/** Related content is recomputed from the actual supplied HTML + live CMS records.
 *  Source-related links remain a relevance signal; unavailable/deleted drafts are excluded. */
function relatedArticles(container,route,cms){
  let host=container.querySelector('.news-side-list');
  // The original training-detail HTML has no sidebar although it is a detail
  // article. Mount the same source news-side-box pattern for dynamic content.
  if(!host && (route==='/dao-tao-hoc-vien' || container.classList.contains('mh-cms-article'))){
    const layout=container.querySelector('.news-detail-layout');
    if(layout){
      const aside=document.createElement('aside');aside.className='news-detail-sidebar';
      const box=document.createElement('div');box.className='news-side-box';
      const title=document.createElement('h3');title.className='news-side-title';title.textContent='Tin liên quan';
      host=document.createElement('div');host.className='news-side-list';
      box.append(title,host);aside.append(box);layout.append(aside);
    }
  }
  if(!host)return;
  // Reconcile source-HTML articles with live CMS changes (title/cover), rather
  // than showing stale hardcoded metadata in the related-news sidebar.
  const sourceItems=relatedCatalog.map(item=>{
    const entries=sourceCmsCatalog[item.href]||[];
    const changes=cms?.overrides?.[item.href]||{};
    const editedTitle=entries.filter(e=>e.tag==='h1').map(e=>changes[e.id]).find(e=>e?.editText&&e.text?.trim())?.text;
    const editedCover=entries.filter(e=>e.kind==='media').map(e=>changes[e.id]).find(e=>e?.editSrc&&e.src)?.src;
    return {...item,title:editedTitle||cms?.pageMeta?.[item.href]?.title||item.title,image:editedCover||item.image};
  });
  const current=sourceItems.find(a=>a.href===route)||null;
  const activeCmsArticle=(cms?.articles||[]).find(a=>a.status!=='draft'&&`/tin-tuc/${encodeURIComponent(a.slug)}`===route);
  const context=current|| (activeCmsArticle?{title:activeCmsArticle.title,category:activeCmsArticle.category||'Tin tức',sourceRelated:[]}:null);
  const cmsItems=(cms?.articles||[]).filter(a=>a&&a.status!=='draft'&&a.slug&&a.title).map(a=>({
    href:`/tin-tuc/${encodeURIComponent(a.slug)}`,
    title:String(a.title),date:String(a.date||a.publishedAt||''),
    image:a.image||a.thumbnail||a.cover||'',category:String(a.category||'Tin tức'),cms:true,
  }));
  const all=[...cmsItems,...sourceItems].filter(a=>a.href!==route&&a.href&&a.title);
  const dedup=[...new Map(all.map(a=>[a.href,a])).values()];
  // Keep recommendations in the same content family. The former flat sort
  // promoted an unrelated newly published article above relevant services.
  const candidates=context?.category
    ? dedup.filter(a=>a.category===context.category || (context.category==='Tin tức' && a.cms))
    : dedup.filter(a=>a.category==='Tin tức' || a.cms);
  const seeds=context?.sourceRelated||[];
  const tokens=(value)=>String(value||'').toLocaleLowerCase('vi-VN').split(/[^\p{L}\p{N}]+/u).filter(word=>word.length>3);
  const mainWords=new Set(tokens(context?.title||container.querySelector('.title-detail h1')?.textContent||''));
  const sharedWords=(item)=>new Set(tokens(item.title).filter(word=>mainWords.has(word))).size;
  const score=(item)=>{
    const sourceIndex=seeds.indexOf(item.href);
    const sameCategory=context&&item.category===context.category;
    return (sameCategory?25:0)+Math.min(sharedWords(item),8)*5+(sourceIndex<0?0:Math.max(0,20-sourceIndex))+(item.cms?1:0);
  };
  candidates.sort((a,b)=>score(b)-score(a)||(a.cms===b.cms?0:a.cms?-1:1));
  // Respect manually selected source-related content, while making room for
  // newly published CMS articles with actual topical overlap. A title edited
  // in CMS should not disappear just because its keywords changed.
  const seeded=seeds.map(url=>candidates.find(a=>a.href===url)).filter(Boolean);
  const fresh=candidates.filter(a=>a.cms&&sharedWords(a)>=2);
  const ordered=[...seeded.slice(0,4),...fresh.slice(0,2),...candidates];
  // Training has only one source detail: fall back to the real news catalog.
  // Include only entries that resolve to an actual route or a published CMS article.
  const fallback=dedup.filter(a=>a.category==='Tin tức'||a.cms).sort((a,b)=>sharedWords(b)-sharedWords(a));
  const related=[...new Map([...ordered,...fallback].map(a=>[a.href,a])).values()].slice(0,7);
  host.replaceChildren();
  for(const a of related){
    const link=document.createElement('a');link.href=a.href;link.className='news-side-item';
    const photo=document.createElement('span');photo.className='news-side-photo';
    if(a.image){const img=document.createElement('img');img.className='w-100';img.loading='lazy';img.decoding='async';img.alt=a.title;img.src=makeAbsolute(a.image);img.width=120;img.height=80;photo.append(img)}
    else {photo.classList.add('mh-related-no-photo');photo.textContent='Mi House Spa'}
    const info=document.createElement('span');info.className='news-side-info';
    const name=document.createElement('span');name.className='news-side-name text-split webkit-line-clamp-2';name.textContent=a.title;
    info.append(name);
    if(a.date){const date=document.createElement('span');date.className='news-side-date';date.textContent=a.date;info.append(date)}
    link.append(photo,info);host.append(link);
  }
}

function stripUnusedShare(container){container.querySelectorAll('.share').forEach(el=>el.remove())}

function animateOnScroll(container, cleanup) {
  const items = container.querySelectorAll('[data-aos], [data-scroll-animate], .scroll-animate');
  if (!items.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated','is-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.12 });
  items.forEach(el => observer.observe(el));
  cleanup.push(() => observer.disconnect());
}

export function enhancePage({route="/",cms=null}={}) {
  const container = document.getElementById('main-primary');
  if (!container) return undefined;
  const cleanup = [];
  backgrounds(container);
  sliders(container, cleanup);
  swiperCarousels(container, cleanup);
  addObserver(container, cleanup);
  animateOnScroll(container, cleanup);
  tableOfContents(container, cleanup);
  relatedArticles(container,route,cms);
  stripUnusedShare(container);
  return () => cleanup.forEach(dispose => dispose());
}
