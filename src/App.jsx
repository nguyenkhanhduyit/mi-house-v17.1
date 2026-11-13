import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Header, Navigation, Footer, FloatingContact, ScrollToTop } from './components/SharedShell.jsx';
import { enhancePage } from './hooks/enhancePage.js';
import manifest from './routeManifest.json';
import { loadOriginalStyles } from './hooks/loadOriginalStyles.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { localizeAssets } from './hooks/localizeAssets.js';
import {fetchCms,applyCms} from './cms/runtime.js';
import { initFidelityMotion } from './hooks/fidelityMotion.js';
import { initSourceCarousels } from './hooks/sourceCarousels.js';
import { GalleryLightbox } from './components/GalleryLightbox.jsx';
import CmsArticlePage from './components/CmsArticlePage.jsx';
import CmsManagedPage from './components/CmsManagedPage.jsx';
import assetMap from './assetMap.json';

// Load each JSX page eagerly to prevent route-chunk failures and show content immediately.
// These are genuine React components, not iframe or injected HTML.
const modules = import.meta.glob('./pages/*.jsx', { eager: true });
const components = {};
for (const item of Object.values(manifest)) {
  const key = `./pages/${item.file}.jsx`;
  if (modules[key]?.default && !components[item.file]) components[item.file] = modules[key].default;
}

// Each route is a real React page generated from the corresponding HTML in pages.rar.
// Keep the V3 landing page as /; the original nested pages are now restored.
function getRoute() {
  const path=decodeURI(window.location.pathname).replace(/\/$/, '') || '/';
  if (path==='/album-anh') {
    const page=new URLSearchParams(window.location.search).get('page');
    if ((page==='1' || page==='2') && manifest[`/album-anh?page=${page}`]) return `/album-anh?page=${page}`;
  }
  return path.endsWith('.html')?path.slice(0,-5):path;
}

const originalSheets=[
  '/assets/bootstrap/bootstrap-purged.css', '/assets/css/animate.min.css',
  '/assets/fontawesome640/all.css', '/assets/fancybox5/fancybox.min.css',
  '/assets/splide/splide.min.css', '/assets/swiper/swiper-bundle.min.css',
  '/assets/css/google/map.css', '/assets/css/effect.css',
  '/assets/css/lazy-embed.css', '/assets/css/scroll-animate.css',
  '/assets/css/fonts.css', '/assets/css/reset.css',
  '/assets/css/utility.css', '/assets/css/hvr-animation.css',
  '/assets/css/simply-animation.css', '/assets/css/navigation.css',
  '/assets/css/style.css', '/assets/css/prettier.css',
  '/assets/css/media.css', '/assets/css/responsive.css', '/subpages.css', '/interaction-fixes.css', '/app-ui.css',
];
function useSourcePageStyles(route) {
  useLayoutEffect(()=>{
    const internal=route!=='/';
    document.body.classList.toggle('mh-internal-page',internal);
    document.documentElement.classList.toggle('mh-internal-page',internal);
    // V3 home-specific styles must not override the exact CSS from pages.rar.
    for(const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      if (/^\/(fallback|site|fidelity|landing|onepage|source-fidelity)\.css$/.test(link.getAttribute('href')||'')) {
        link.media=internal?'not all':'all';
      }
    }
    if(internal){
      originalSheets.forEach(href=>{
        if(!document.querySelector(`link[data-source-page-css="${href}"]`)) {
          const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=href;
          sheet.dataset.sourcePageCss=href;document.head.appendChild(sheet);
        }
      });
    }
    document.querySelectorAll('link[data-source-page-css]').forEach(link=>{link.media=internal?'all':'not all'});
    // Repair rules are always LAST, including after all original subpage CSS.
    let repair=document.querySelector('link[data-mh-final-repair],link[href="/route-repairs-v7.css"]');
    if(!repair){repair=document.createElement('link');repair.rel='stylesheet';repair.href='/route-repairs-v7.css';}
    repair.dataset.mhFinalRepair='true';
    document.head.appendChild(repair);
    return ()=>{};
  },[route]);
}

function pathForNavigation(href) {
  if (!href) return null;
  if (href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return null;
  try {
    const url = new URL(href, window.location.origin);
    // Ignore offsite resources and links, retain original social/phone links.
    if (url.origin !== window.location.origin && !['mihousespa.com', 'www.mihousespa.com'].includes(url.hostname)) return null;
    let path = decodeURI(url.pathname).replace(/\/$/, '') || '/';
    if (path.endsWith('.html')) path = path.slice(0, -5);
    if (path === '/index' || path === '/_home') path = '/';
    if (path === '/album-anh') {
      const page = url.searchParams.get('page');
      if (page === '1' || page === '2') return `${path}?page=${page}`;
    }
    return path;
  } catch {
    return null;
  }
}

/** A CMS record is public only when it is published and not deleted by the admin. */
const isPublished = record => Boolean(record) && record.status !== 'draft' && !record.deleted;
const publicRecords = (rows) => (Array.isArray(rows) ? rows.filter(isPublished) : []);

/** Resolve the CMS record that owns a route (detail page or source page). */
function findRecord(route, cms) {
  if (!cms) return null;
  const families = [
    ['/tin-tuc/', cms.articles],
    ['/dich-vu/', cms.services],
    ['/dao-tao/', cms.training],
  ];
  for (const [prefix, rows] of families) {
    const hit = publicRecords(rows).find(x => x && x.slug && route === `${prefix}${x.slug}`);
    if (hit) return hit;
  }
  const source = [...publicRecords(cms.articles), ...publicRecords(cms.services), ...publicRecords(cms.training)]
    .find(x => x && x.sourceRoute === route);
  return source || null;
}

/** A CMS slug route is only reachable while its record is published. */
function hasPublicSlugRoute(target, cms) {
  if (!cms) return false;
  if (target.startsWith('/tin-tuc/')) return publicRecords(cms.articles).some(a => a && a.slug && `/tin-tuc/${a.slug}` === target);
  if (target.startsWith('/dich-vu/')) return publicRecords(cms.services).some(a => a && a.slug && `/dich-vu/${a.slug}` === target);
  if (target.startsWith('/dao-tao/')) return publicRecords(cms.training).some(a => a && a.slug && `/dao-tao/${a.slug}` === target);
  if (target.startsWith('/album/')) return publicRecords(cms.albumCategories).some(a => a && a.slug && `/album/${a.slug}` === target);
  return false;
}

/** Parse the admin-authored JSON-LD; an invalid payload never breaks the page. */
function parseSchema(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function applySeo(route,cms) {
  const section=route==='/gioi-thieu'?cms?.sections?.intro:route==='/lien-he'?cms?.sections?.contact:null;
  const entity=findRecord(route,cms);
  const preset=manifest[route]||{};
  const meta={...preset,title:section?.seoTitle||entity?.seoTitle||preset.title,description:section?.seoDescription||entity?.seoDescription||preset.description,keywords:section?.seoKeywords||entity?.seoKeywords||preset.keywords};
  document.title = meta.title || 'Mi House Spa';
  document.documentElement.lang = 'vi';
  const nodes = [];
  const robotsRaw=String(section?.robots||entity?.robots||section?.metaRobots||entity?.metaRobots||'index,follow');
  const robots=robotsRaw.toLowerCase().split(',').map(x=>x.trim());
  const supported=new Set(['index','noindex','follow','nofollow','noarchive','noimageindex','nosnippet']);
  const directives=[robots.includes('noindex')?'noindex':'index',robots.includes('nofollow')?'nofollow':'follow',...['noarchive','noimageindex','nosnippet'].filter(x=>robots.includes(x))].filter(x=>supported.has(x));
  let robotsMeta=document.head.querySelector('meta[name="robots"]');
  if(!robotsMeta){robotsMeta=document.createElement('meta');robotsMeta.name='robots';document.head.append(robotsMeta)}
  robotsMeta.content=directives.join(',');
  for (const name of ['description', 'keywords']) {
    const value = meta[name];
    if (!value) continue;
    let el = document.head.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.append(el);
    }
    el.content = value;
  }
  // Structured data: the CMS record wins over the static manifest so a new or
  // edited record always ships its own JSON-LD.
  const schemas = [];
  const recordSchema = parseSchema(entity?.schemaJson);
  if (recordSchema) schemas.push(JSON.stringify(recordSchema));
  const sectionSchema = parseSchema(section?.schemaJson);
  if (sectionSchema) schemas.push(JSON.stringify(sectionSchema));
  for (const schema of schemas) {
    // JSON-LD is preserved as structured data, not evaluated as JavaScript.
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = schema;
    document.head.append(script);
    nodes.push(script);
  }
  for (const schema of meta.schemas || []) {
    // The generic Organization block is redundant once a CMS schema exists.
    if (schemas.length && String(schema).includes('"Organization"')) continue;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = schema;
    document.head.append(script);
    nodes.push(script);
  }
  // Focus keyword is a CMS authoring aid; expose it for audits/SEO tooling.
  const focus = entity?.focusKeyword || section?.focusKeyword;
  if (!focus) document.head.querySelector('meta[name="mh:focus-keyword"]')?.remove();
  if (focus) {
    let el = document.head.querySelector('meta[name="mh:focus-keyword"]');
    if (!el) { el = document.createElement('meta'); el.name = 'mh:focus-keyword'; document.head.append(el); }
    el.content = focus;
  }
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  const origin = cms?.settings?.website?.replace(/\/+$/,'') || 'https://mihousespa.com';
  try {const canonicalOrigin=new URL(origin).origin;canonical.href = `${canonicalOrigin}${route.split('?')[0]}`;}catch{canonical.href=`https://mihousespa.com${route.split('?')[0]}`;}
  return () => nodes.forEach((node) => node.remove());
}

function syncNavigation(route) {
  const serviceRoutes = new Set(['/goi-dau-duong-sinh', '/massage', '/nail']);
  const trainingRoutes = new Set(['/dao-tao-hoc-vien']);
  const galleryRoutes = new Set(['/nail-hottrend', '/khong-gian']);
  const isNewsArticle = !serviceRoutes.has(route) && manifest[route]?.schemas?.some(schema => schema.includes('NewsArticle'));
  let activeRoot = route === '/' ? '/' : `/${route.split('/')[1].split('?')[0]}`;
  if (serviceRoutes.has(route)) activeRoot = '/dich-vu';
  else if (trainingRoutes.has(route)) activeRoot = '/dao-tao';
  else if (galleryRoutes.has(route)) activeRoot = '/album-anh';
  else if (isNewsArticle) activeRoot = '/tin-tuc';
  const nav = document.querySelector('.navigation');
  if (!nav) return;
  nav.classList.toggle('is-index', route === '/');
  nav.classList.toggle('not-index', route !== '/');
  nav.querySelectorAll('.navigation__item').forEach((li) => {
    const link = li.querySelector(':scope > a.navigation__link');
    if (!link) return;
    const isActive = pathForNavigation(link.getAttribute('href')) === activeRoot;
    li.classList.toggle('active', isActive);
    li.classList.toggle('inactive', !isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  nav.classList.remove('nav-open');
  document.body.classList.remove('nav-open');
}

function PageBoundary({ page: Page, route, cms }) {
  // Layout effects prevent one-frame flashes of removed sharing controls/empty TOC.
  useLayoutEffect(() => {
    localizeAssets(document.getElementById('main-primary'));
    // Apply text/media overrides before deriving TOC and related content.
    // The previous order left the TOC pointing at pre-CMS headings.
    applyCms(route,cms);
    const cleanup=enhancePage({route,cms});
    const cleanupMotion=initFidelityMotion(document.getElementById('main-primary'));
    const cleanupSource=initSourceCarousels(document.getElementById('main-primary'));
    return () => { cleanupSource?.(); cleanupMotion?.(); cleanup?.(); };
  }, [route,cms]);
  return <Page cms={cms} route={route}/>;
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('react-ready');
    document.getElementById('app-boot-status')?.remove();
    localizeAssets(document.querySelector('.site-root'));
    loadOriginalStyles();
  }, []);
  const [route, setRoute] = useState(getRoute);
  useSourcePageStyles(route);
  const [cms,setCms]=useState(null);
  const cmsRevision=useRef(-1);
  useEffect(()=>{
    let active=true;
    fetchCms().then(state=>{if(active && state){cmsRevision.current=state.revision;setCms(state)}});
    return()=>{active=false};
  },[route]);
  // Changes saved from /admin (another tab) are reflected without a full reload.
  useEffect(()=>{
    let live=true;
    const refresh=()=>{if(!document.hidden)fetchCms().then(next=>{if(live&&next&&next.revision!==cmsRevision.current){cmsRevision.current=next.revision;setCms(next)}})};
    window.addEventListener('storage',refresh);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    const timer=window.setInterval(refresh,20000);
    return()=>{live=false;window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.clearInterval(timer)};
  },[]);

  const [gallery, setGallery] = useState(null);
  const pendingScrollRef=useRef(null);
  const pointerRef=useRef(null);
  const draggedRef=useRef(0);
  const [notice, setNotice] = useState('');
  const changeRoute = useCallback((target) => {
    if (!manifest[target] && !hasPublicSlugRoute(target, cms)) return false;
    const full = target;
    if (window.location.pathname + window.location.search !== full) window.history.pushState({}, '', full);
    setRoute(target);
    setGallery(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }, [cms]);

  useEffect(() => {
    const popState = () => { setRoute(getRoute()); setGallery(null); }; 
    window.addEventListener('popstate', popState);
    return () => window.removeEventListener('popstate', popState);
  }, []);
  useEffect(() => {
    const cleanup=applySeo(route,cms);
    const record=publicRecords(cms?.articles).find(a=>a&&a.slug&&`/tin-tuc/${a.slug}`===route);
    if(record)document.title=`${record.title} | Mi House Spa`;
    return cleanup;
  }, [route,cms]);
  useEffect(() => {
    const onScroll = () => {
      document.querySelector('.navigation')?.classList.toggle('is-fixed', window.scrollY > 140);
      document.querySelector('.scroll-to-top')?.classList.toggle('is-visible', window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cmsArticle=publicRecords(cms?.articles).find(a=>a&&a.slug&&'/tin-tuc/'+a.slug===route);
  const cmsManaged=route.startsWith('/dich-vu/')&&publicRecords(cms?.services).some(x=>x&&x.slug&&route==='/dich-vu/'+x.slug)||route.startsWith('/dao-tao/')&&publicRecords(cms?.training).some(x=>x&&x.slug&&route==='/dao-tao/'+x.slug)||route.startsWith('/album/')&&publicRecords(cms?.albumCategories).some(x=>x&&x.slug&&route==='/album/'+x.slug);
  // An item copied from an archived HTML service/training page must preserve
  // that page's DOM/CSS, not fall back to a generic detail-card template.
  const copyGroup=route.startsWith('/dich-vu/')?'services':route.startsWith('/dao-tao/')?'training':null;
  const copyRecord=copyGroup&&publicRecords(cms?.[copyGroup]).find(row=>row.slug&&route===(copyGroup==='services'?'/dich-vu/':'/dao-tao/')+row.slug);
  const originRows=copyGroup?publicRecords(cms?.[copyGroup]).filter(row=>row.sourceRoute):[];
  const sourceTemplate=copyRecord&&!copyRecord.sourceRoute ?
    (copyRecord.sourceTemplateRoute||
      originRows.find(row=>row.body&&row.body===copyRecord.body)?.sourceRoute||
      originRows.find(row=>copyRecord.slug?.replace(/^(ban-sao-)+/,'')===row.slug)?.sourceRoute) : null;
  const copiedPage=sourceTemplate&&manifest[sourceTemplate]?.file ? components[manifest[sourceTemplate].file] : null;
  const Page = route==='/lien-he' ? null : components[manifest[route]?.file] || copiedPage || (cmsArticle ? CmsArticlePage : null) || (cmsManaged ? CmsManagedPage : null);

  useEffect(()=>{
    if(route!=='/')return;
    const hash = pendingScrollRef.current || decodeURIComponent(window.location.hash.slice(1));
    if(!hash)return;
    const raf=requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.getElementById(hash)?.scrollIntoView({behavior:'smooth',block:'start'});
      pendingScrollRef.current=null;
    }));
    return ()=>cancelAnimationFrame(raf);
  },[route]);
  function goSection(hash){
    if(!hash)return;
    window.history.pushState({},'',`/#${encodeURIComponent(hash)}`);
    if(route!=='/'){
      pendingScrollRef.current=hash;
      setRoute('/');
    } else {
      document.getElementById(hash)?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  function mediaCandidates(element){
    const fancy=element.closest('[data-fancybox]');
    const image=element.closest('img');
    const main=document.getElementById('main-primary');
    if(!main || !main.contains(element))return null;
    let root=null;
    let nodes=[];
    let selected=0;
    if(fancy){
      // data-fancybox is the authoritative grouping from pages.rar.
      const group=fancy.getAttribute('data-fancybox');
      root=fancy.closest('.news-detail-gallery,.album-featured__list,.service-price,.album-grid')||main;
      nodes=[...root.querySelectorAll('[data-fancybox]')].filter(el=>el.getAttribute('data-fancybox')===group&&!el.closest('.is-clone'));
      selected=nodes.indexOf(fancy);
    }else if(image){
      if(image.closest('.breadcrumb,.news-side-item,.news__card,.service__card,.training__card,.pagination,.navigation,.footer'))return null;
      if(route==='/'){
        const sections=[
          ['.training-landing','.training-landing__image'],
          ['.album-featured__list','.album-featured__image'],
          ['.service-featured','.service__media-image'],
          ['.intro','.intro__media-image'],
          ['.slideshow','.slideshow__media-image'],
          ['.service-price','.service-price__image'],
        ];
        for(const [container,child] of sections)if(image.matches(child)){root=image.closest(container);nodes=[...(root?.querySelectorAll(child)||[])];break;}
      }else{
        // Article body photographs and cover images are a single independent gallery.
        root=image.closest('.content-toc-wrap,.news-detail-gallery,.album-grid,.album-detail,.photo-gallery,.gallery-detail,.album-list,.pic-album')||null;
        if(root){
          nodes=[...root.querySelectorAll('img')].filter(img=>!img.closest('.breadcrumb,.news-side-item,.news__card,.service__card,.training__card,.pagination,.box-toc'));
        }
      }
      selected=nodes.indexOf(image);
    }
    if(!nodes.length)return null;
    const items=nodes.map(node=>{
      const cover=node.matches('img')?node:node.querySelector('img');
      const source=node.getAttribute('data-src')||cover?.getAttribute('data-full')||node.getAttribute('href')||cover?.getAttribute('src')||'';
      const preferred=cms?.mediaMap?.[source]||source;
      let local=preferred;
      try{const uri=new URL(preferred,window.location.origin);if(['mihousespa.com','www.mihousespa.com'].includes(uri.hostname)&&assetMap[uri.pathname])local=assetMap[uri.pathname]}catch{}
      return {src:local,thumbnail:cover?.src||'',caption:node.getAttribute('data-caption')||cover?.alt||'',kind:/\.(mp4|webm|mov)(\?|$)/i.test(local)?'video':'image'};
    }).filter(x=>x.src);
    return items.length?{items,index:Math.max(0,Math.min(selected,items.length-1))}:null;
  }
  function handlePointerDown(event){pointerRef.current={x:event.clientX,y:event.clientY};}
  function handlePointerUp(event){if(pointerRef.current&&Math.abs(event.clientX-pointerRef.current.x)>12&&Math.abs(event.clientX-pointerRef.current.x)>Math.abs(event.clientY-pointerRef.current.y)){draggedRef.current=Date.now()}pointerRef.current=null;}

  function handleClick(event) {
    if (event.defaultPrevented) return;
    const element = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!element) return;
    if (element.closest('.scroll-to-top')) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (element.closest('.main-widget .out-circle, .main-widget .close-icon')) {
      event.preventDefault();
      const widget = document.querySelector('.main-widget');
      widget?.querySelector('.def-content')?.classList.toggle('unsee');
      widget?.classList.toggle('widget-open');
      return;
    }
    if (element.closest('[data-gallery-open=menu]')) {
      event.preventDefault();
      const first = document.querySelector('.service-price [data-fancybox=menu]');
      if (first) { const selected = mediaCandidates(first); if (selected) setGallery(selected); }
      return;
    }
    const scroll = element.closest('.scroll');
    if (scroll) {
      const target = document.querySelector('.footer__fanpage');
      if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      return;
    }
    // Native carousel swipe/drag must never accidentally open a slide link.
    if(Date.now()-draggedRef.current<350 && element.closest('.slideshow,.service-price,.album-featured')){
      event.preventDefault();return;
    }
    const navLink=element.closest('a[href]');
    if(navLink){
      const url=new URL(navLink.href,window.location.href);
      if(url.pathname==='/lien-he' && url.origin===window.location.origin){
        event.preventDefault();
        const target=cms?.settings?.contactLink||cms?.settings?.bookingLink||'https://zalo.me/0767882407';
        if(/^(https?:\/\/|mailto:|tel:)/i.test(target))window.location.assign(target);
        else changeRoute('/');
        return;
      }
      if(url.origin===window.location.origin && url.pathname==='/' && url.hash){
        event.preventDefault();goSection(decodeURIComponent(url.hash.slice(1)));return;
      }
    }
    // Click-to-preview only, never hijack swipe gestures or action links.
    const parentNavLink=element.closest('a[href]');
    const explicitInternalPage=parentNavLink && pathForNavigation(parentNavLink.getAttribute('href')) && manifest[pathForNavigation(parentNavLink.getAttribute('href'))];
    const contentPhoto=route!=='/' && !!element.closest('img') && !!element.closest('.content-main,.content-toc-wrap,.news-detail-gallery,.album-grid,.album-detail,.photo-gallery') && !element.closest('.news-side-item,.breadcrumb,.news__card,.service__card,.training__card');
    if((!explicitInternalPage||contentPhoto) && Date.now()-draggedRef.current>350){
      const overlay=element.closest('.slideshow__info');
      const previewNode=overlay&&!element.closest('a,button')?overlay.closest('.slideshow__item')?.querySelector('img'):element;
      const selection=mediaCandidates(previewNode||element);
      if(selection){event.preventDefault();setGallery(selection);return;}
    }
    const a = element.closest('a[href]');
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.hasAttribute('download') || a.target === '_blank') return;
    const routeTarget = pathForNavigation(a.getAttribute('href'));
    if (routeTarget && (manifest[routeTarget] || hasPublicSlugRoute(routeTarget, cms))) {
      event.preventDefault();
      changeRoute(routeTarget);
    } else if (routeTarget==='/' && route!=='/') {
      event.preventDefault();changeRoute('/');
    }
  }

  function handleAssetError(event) {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    if (img.parentElement?.tagName === 'PICTURE') {
      img.parentElement.querySelectorAll('source').forEach((source) => source.remove());
    }
    img.src = img.closest('.navigation__logo,.footer__logo') ? '/logo-fallback.svg' : '/media-placeholder.svg';
    img.classList.add('asset-image-fallback');
  }

  function handleSubmit(event) {
    if (!event.target.matches('#form-contact, #form-newsletter')) return;
    event.preventDefault();
    const form = event.target;
    if (form.id === 'form-newsletter') {
      const email = new FormData(form).get('dataNewsletter[email]') || new FormData(form).get('email') || '';
      setNotice(`Form đăng ký nhận tin chưa có API gửi dữ liệu. ${email ? `Email nhập: ${email}` : ''}`);
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      setNotice('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    const data = new FormData(form);
    const lines = [...data.entries()]
      .filter(([key,value]) => value && !/csrf|recaptcha|type/i.test(key))
      .map(([key,value]) => `${key.replace(/dataContact\[|\]/g,'')}: ${value}`);
    const mailto = `mailto:nguyenquynhdiem1988@gmail.com?subject=${encodeURIComponent('Liên hệ từ website Mi House Spa')}&body=${encodeURIComponent(lines.join('\n'))}`;
    setNotice('Bản React chưa có máy chủ xử lý biểu mẫu. Đang mở ứng dụng email để gửi thông tin.');
    window.location.href = mailto;
  }

  // A source route stays reachable only while its CMS record is published.
// Deleted records (deleted:true) and drafts both hide the page.
  const hiddenRoute = Boolean(cms) && (
    (cms?.hiddenSourceRoutes||[]).includes(route)
    || [...publicRecords(cms?.articles), ...publicRecords(cms?.services), ...publicRecords(cms?.training)].some(x => x && x.sourceRoute === route && !isPublished(x))
    || (route.startsWith('/tin-tuc/') && !publicRecords(cms?.articles).some(a => a && a.slug && `/tin-tuc/${a.slug}` === route))
    || (route.startsWith('/dich-vu/') && !publicRecords(cms?.services).some(a => a && a.slug && `/dich-vu/${a.slug}` === route))
    || (route.startsWith('/dao-tao/') && !publicRecords(cms?.training).some(a => a && a.slug && `/dao-tao/${a.slug}` === route))
    || (route.startsWith('/album/') && !publicRecords(cms?.albumCategories).some(a => a && a.slug && `/album/${a.slug}` === route))
  );
  return (
    <div className="site-root" onClick={handleClick} onPointerDownCapture={handlePointerDown} onPointerUpCapture={handlePointerUp} onSubmit={handleSubmit} onErrorCapture={handleAssetError}>
      <Header />
      <Navigation route={route} settings={cms?.settings||{}} additions={cms?.navigation||[]}/>
      {Page && !hiddenRoute ? (
        <ErrorBoundary key={`${route}:${cms?.revision??0}`}>
          <PageBoundary page={Page} route={route} cms={cms} />
        </ErrorBoundary>
      ) : (
        <main className="page-not-found"><h1>Không tìm thấy trang</h1><p>Đường dẫn này không có trong các trang HTML đã cung cấp.</p><a href="/">Về trang chủ</a></main>
      )}
      <Footer settings={cms?.settings||{}} />
      <FloatingContact settings={cms?.settings||{}} />
      <ScrollToTop />
      <GalleryLightbox gallery={gallery} onClose={()=>setGallery(null)} onChange={(index)=>setGallery(g=>g?{...g,index}:g)}/>
      {notice && <div className="react-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
    </div>
  );
}
