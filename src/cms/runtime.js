import {applyManagedContent,applyFooterContent,mapManagedMedia,resolveMedia} from './managedContent.js';
// Content overlays bind the one-page React layout and CMS changes
// to the exact semantic nodes in the HTML snapshot. No unsafe innerHTML.
import sourceCatalog from './catalog.json';
const selector='h1,h2,h3,h4,p,a,button,img,video,iframe';
function eligible(el){if(['IMG','VIDEO','IFRAME'].includes(el.tagName))return true;if(el.querySelector('h1,h2,h3,h4,p,a,button'))return false;if(el.tagName==='A'&&el.querySelector('img'))return false;return (el.textContent||'').trim().length>2;}
const httpsOrRelative=(v)=>{if(typeof v!=='string')return '';if(v.startsWith('/')&&!v.startsWith('//'))return v;try{const u=new URL(v,location.href);return ['http:','https:','tel:','mailto:'].includes(u.protocol)?v:''}catch{return ''}};
export async function fetchCms(){try{const r=await fetch('/api/public',{signal:AbortSignal.timeout(3500)});if(r.ok)return await r.json()}catch{}return null;}
function mediaSwap(el,src){const safe=httpsOrRelative(src);if(!safe)return;const picture=el.closest('picture');picture?.querySelectorAll('source').forEach(n=>n.remove());el.removeAttribute('srcset');el.removeAttribute('data-srcset');el.setAttribute('src',safe);}
// The original CMS catalog indexes are stable identifiers, not the current DOM
// positions. V6 removes Share panels and adds native table-of-contents links;
// matching by source type/content preserves the IDs of previously saved edits.
const normalText=v=>String(v||'').normalize('NFC').replace(/\s+/g,'').toLocaleLowerCase('vi-VN');
function sameResource(a,b){
  if(a===b)return true;
  try{return new URL(a,location.href).pathname===new URL(b,location.href).pathname}catch{return false}
}
function matchesCatalog(el,item){
  if(el.tagName.toLowerCase()!==item.tag)return false;
  if(['img','video','iframe'].includes(item.tag))return sameResource(el.getAttribute('src')||el.getAttribute('data-src')||'',item.src||'');
  return normalText(el.textContent)===normalText(item.text||'');
}
export function applyScope(root,scope,cms){
 if(!root||!cms)return;
 const overrides=cms.overrides?.[scope]||{},mediaMap=cms.mediaMap||{};
 const entries=sourceCatalog[scope]||null;
 let cursor=0;
 root.querySelectorAll(selector).forEach((el,index)=>{
  if(!eligible(el))return;
  if(entries&&el.closest('.js-content-toc'))return; // generated TOC anchors are not CMS content
  let stableIndex=index;
  if(entries){
   const oldId=el.dataset.cmsIndex;
   const explicitId=el.dataset.cmsField;
   const found=explicitId!==undefined?entries.findIndex(x=>String(x.id)===explicitId):(oldId!==undefined?entries.findIndex(x=>String(x.id)===oldId):entries.findIndex((entry,i)=>i>=cursor&&matchesCatalog(el,entry)));
   if(found<0)return;
   if(!explicitId)cursor=Math.max(cursor,found+1);
   stableIndex=String(entries[found].id);
  }
  el.dataset.cmsIndex=String(stableIndex);
  const value=overrides[stableIndex];
  if(value){
   el.hidden=Boolean(value.hidden);
   if(value.hidden)el.style.setProperty('display','none','important');else el.style.removeProperty('display');
   if(value.editText&&typeof value.text==='string'&&!['IMG','VIDEO','IFRAME'].includes(el.tagName)){
    if(el.dataset.cmsField==='intro-more'&&el.querySelector('span'))el.querySelector('span').textContent=value.text;
    else el.textContent=value.text;
   }
   if(value.editHref&&el.tagName==='A')el.href=httpsOrRelative(value.href)||'#';
   if(value.editSrc&&['IMG','VIDEO','IFRAME'].includes(el.tagName))mediaSwap(el,value.src);
   if(el.tagName==='IMG'&&value.alt)el.alt=value.alt;
  }
  if(['IMG','VIDEO','IFRAME'].includes(el.tagName)){
   const original=el.getAttribute('src')||'';
   const match=resolveMedia(cms,original);
   if(match&&match!==original&&!value?.editSrc)mediaSwap(el,match);
  }
 });
}
function makeCard(title,description,image,href,classname='cms-card'){const node=document.createElement('article');node.className=classname;const link=document.createElement('a');link.href=httpsOrRelative(href)||'#';if(image){const img=document.createElement('img');img.loading='lazy';img.src=httpsOrRelative(image)||'/media-placeholder.svg';img.alt=title||'';link.append(img)}const h=document.createElement('h3');h.textContent=title||'Chưa đặt tên';link.append(h);if(description){const d=document.createElement('p');d.textContent=description;link.append(d)}node.append(link);return node}
function mountCustom(root,route,cms){root.querySelectorAll('[data-cms-generated]').forEach(el=>el.remove());const blocks=cms.blocks?.[route]||[];if(blocks.length){const host=document.createElement('section');host.className='cms-extra wrap-content';host.dataset.cmsGenerated='true';for(const block of blocks){if(block.visible===false)continue;const item=makeCard(block.title,block.body,block.image,block.href,'cms-custom-block');if(block.subtitle){const sub=document.createElement('p');sub.className='cms-custom-label';sub.textContent=block.subtitle;item.prepend(sub)}host.append(item)}root.append(host)}
 if(route==='/'){const parent=root.querySelector('.service-price__container')||root.querySelector('.price__list')||root.querySelector('.wrap-main .wrap-content');if(parent&&(cms.prices||[]).length){const group=document.createElement('div');group.dataset.cmsGenerated='true';group.className='cms-price-list';for(const row of cms.prices){const el=document.createElement('div');el.className='cms-price-row';const name=document.createElement('span');name.textContent=row.name;const price=document.createElement('strong');price.textContent=row.price;el.append(name,price);group.append(el)}parent.append(group)}}
}

function applyGlobalSettings(cms){
 const settings=cms.settings||{};
 if(settings.logo){
  const url=httpsOrRelative(settings.logo);
  if(url)document.querySelectorAll('.site-root .navigation__logo img,.site-root .footer__logo img').forEach(img=>{if(img.src!==url)mediaSwap(img,url)});
 }
 if(settings.favicon){const url=httpsOrRelative(settings.favicon);if(url){let icon=document.querySelector('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.append(icon)}icon.href=url}}
 const footer=document.querySelector('.footer');
 if(footer){
  const set=(selector,value)=>{const el=footer.querySelector(selector);if(el&&typeof value==='string'&&value.trim())el.textContent=value};
  set('.footer__name',settings.brand);set('.footer__desc',settings.description);
  const labels=['Địa Chỉ','Hotline','Email'];
  footer.querySelectorAll('.footer__content p').forEach(p=>{
   const txt=p.textContent.trim();
   if(/^Địa Chỉ:/i.test(txt)&&settings.address)p.textContent=labels[0]+': '+settings.address;
  if(/^Hotline:/i.test(txt)&&settings.phone)p.textContent=labels[1]+': '+settings.phone;
  if(/^Email:/i.test(txt)&&settings.email)p.textContent=labels[2]+': '+settings.email;
  });
 }
 // Contact links are site-wide: they must not depend on the footer existing.
 if(settings.phone){document.querySelectorAll('.site-root a[href^="tel:"]').forEach(a=>{a.href='tel:'+settings.phone.replace(/[^+\d]/g,'');if(/^\+?[\d ()-.]{8,}$/.test(a.textContent.trim()))a.textContent=settings.phone})}
 if(settings.email){document.querySelectorAll('.site-root a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+settings.email;if(a.textContent.includes('@'))a.textContent=settings.email})}
 if(settings.bookingLink){for(const a of document.querySelectorAll('.slideshow__btn')){a.href=httpsOrRelative(settings.bookingLink)||'/#footer-primary';if(/^https?:/.test(settings.bookingLink)){a.target='_blank';a.rel='noopener noreferrer'}}}
 for(const a of document.querySelectorAll('.site-root a[href="/lien-he"]'))a.href=httpsOrRelative(settings.contactLink||settings.bookingLink||'https://zalo.me/0767882407');
 if(settings.contactLink){for(const a of document.querySelectorAll('.navigation__contact')){a.href=httpsOrRelative(settings.contactLink)||'/#footer-primary';if(/^https?:/.test(settings.contactLink)){a.target='_blank';a.rel='noopener noreferrer'}}}
 for(const [key,needle] of [['facebook','facebook.com'],['maps','maps.app.goo.gl'],['maps','google.com/maps']]){if(settings[key])document.querySelectorAll('.footer a[href],.navigation a[href]').forEach(a=>{if(a.href.includes(needle))a.href=httpsOrRelative(settings[key])||a.href})}
}
export function applyCms(route,cms){if(!cms)return;document.documentElement.style.setProperty('--mh-brown',cms.settings?.primary||'#8f624a');document.documentElement.style.setProperty('--mh-cream',cms.settings?.background||'#f8f3ed');applyScope(document.querySelector('.navigation'),'@navigation',cms);applyScope(document.querySelector('.footer'),'@footer',cms);applyGlobalSettings(cms);applyFooterContent(cms);const main=document.getElementById('main-primary');applyScope(main,route,cms);if(main){mountCustom(main,route,cms);applyManagedContent(main,route,cms);mapManagedMedia(main,cms);/* collections are React-owned and updated through props */}if(cms.settings?.tiktok){const video=main?.querySelector('.video-featured');if(video){video.querySelectorAll('a[data-cms-tiktok]').forEach(n=>n.remove());const a=document.createElement('a');a.dataset.cmsTiktok='1';a.className='cms-tiktok-link';a.target='_blank';a.rel='noopener noreferrer';a.href=httpsOrRelative(cms.settings.tiktok)||'#';a.textContent='Xem kênh TikTok Mi House Spa ↗';video.append(a);}}}
