/** Apply structured content to the ORIGINAL pageadmin/pages HTML containers.
 * No new visual layout is introduced: original classes and proportions remain.
 *
 * Media rule: every CMS/HTML image or video URL is resolved through
 * `resolveMedia()` so a Cloudinary URL (from `mediaMap`) wins while the local
 * or original URL is kept as fallback. Nothing is ever blanked when the
 * migration has not run yet.
 */
import albumReference from '../../album-source-map.json' with {type:'json'};
const urlValue = value => {
  if (typeof value !== 'string') return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const u=new URL(value); return ['https:','http:','mailto:','tel:'].includes(u.protocol)?value:''; } catch { return ''; }
};
export function cleanHtml(value){
      const doc=new DOMParser().parseFromString(String(value||''),'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,base,link,meta,svg,math').forEach(x=>x.remove());
  doc.body.querySelectorAll('*').forEach(el=>{
    for(const a of [...el.attributes]){
      if(/^on/i.test(a.name)||['srcdoc','formaction'].includes(a.name.toLowerCase())||/^(href|src|xlink:href)$/i.test(a.name)&&!urlValue(a.value)||a.name==='style'&&/url\s*\(|expression\s*\(|@import|behavior\s*:/i.test(a.value))el.removeAttribute(a.name);
    }
  });
  return doc.body.innerHTML;
}

/** Normalize a media URL to the key used by `mediaMap` (path on mihousespa.com). */
const mediaKey = value => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw)) return raw.replace(/^\/+/,'/');
  try {
    const u = new URL(raw);
    if (['mihousespa.com','www.mihousespa.com'].includes(u.hostname)) return u.pathname + (u.search||'');
  } catch { /* fall through */ }
  return raw;
};
/** Resolve one URL through the CMS media map; the original value is the fallback. */
export function resolveMedia(cms, value){
  if (typeof value !== 'string' || !value.trim()) return '';
  const map = cms?.mediaMap || {};
  const raw = value.trim();
  const candidates = [raw, mediaKey(raw)];
  if (/^https?:\/\//i.test(raw)) {
    const alt = raw.replace(/^http:\/\//,'https://').replace(/^https:\/\//,'http://');
    candidates.push(mediaKey(alt), alt);
  }
  for (const key of candidates) {
    const hit = map[key];
    if (typeof hit === 'string' && hit.trim()) return hit.trim();
  }
  return raw;
}
const setText=(root,selector,value)=>{const n=root?.querySelector(selector);if(n&&typeof value==='string'&&value.trim())n.textContent=value;};
    const setImage=(root,selector,value,alt='',cms=null)=>{
  const el=root?.querySelector(selector);if(!el)return;
  const url=resolveMedia(cms,value);if(!urlValue(url))return;
  el.src=url;el.alt=alt||el.alt||'';el.removeAttribute('srcset');el.closest('picture')?.querySelectorAll('source').forEach(s=>s.remove());
};
const findExistingRecord=(rows,route)=>Array.isArray(rows)?rows.find(x=>x.sourceRoute===route):null;
/** A record is public when it is published and not deleted by the admin. */
export const isPublished=record=>Boolean(record)&&record.status!=='draft'&&!record.deleted;
export const publishedOnly=rows=>Array.isArray(rows)?rows.filter(isPublished):[];
const byOrder=(a,b)=>(Number(a.order)||0)-(Number(b.order)||0);
/** Fallback to the attached HTML sequence only where CMS rows have no user-defined
 *  order. Explicit positive order values ALWAYS win, without mutating saved data. */
export function sortAlbumPhotos(rows,kind){
 const reference=albumReference[kind==='space'?1:0]?.images||[];
 const orderMap=new Map(reference.map((image,i)=>[typeof image==='string'?image:image?.src,i+1]));
 const order=row=>Number(row?.order)>0?Number(row.order):
   (orderMap.get(row?.image) ?? (reference.length+100));
 return [...(rows||[])].sort((a,b)=>order(a)-order(b));
}
export function originalAlbumFull(row,kind){
 if(row?.full)return row.full;
 const reference=albumReference[kind==='space'?1:0]?.images||[];
 if(!reference.some(entry=>(typeof entry==='string'?entry:entry?.src)===row?.image))return row?.image||'';
 return row?.image||''; // HTML source supplies thumbnails, not a verified full-size URL.
}
const setBody=(root,record)=>{
  if(!record||typeof record.body!=='string'||!record.body.trim())return;
  const target=root.querySelector('.content-main article')||root.querySelector('.content-main')||root.querySelector('.news-detail-main .content-main');
  if(target&&record.body!==undefined)target.innerHTML=cleanHtml(record.body);
};
    function gallerySource(root,rows,heading){
  const gallery=root.querySelector('.news-detail-gallery');if(!gallery)return;
  gallery.querySelectorAll('.album-item').forEach(x=>x.remove());
  const albumKind=heading==='album-nail'?'nail':heading==='album-space'?'space':null;
  for(const row of (albumKind?sortAlbumPhotos(publishedOnly(rows),albumKind):publishedOnly(rows).sort(byOrder))){
    const item=document.createElement('div');item.className='album-item';item.dataset.cmsGalleryId=row.id;
    const frame=document.createElement('div');frame.className='scale-img cursor-pointer';frame.dataset.fancybox=albumKind?'album':heading;frame.dataset.src=albumKind?originalAlbumFull(row,albumKind):(row.full||row.image);
    const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=row.image;img.alt=row.alt||' ';img.className='w-100';
    if(albumKind){img.width=360;img.height=360;}frame.append(img);item.append(frame);
    // Original Nail/Không gian HTML contains an EMPTY caption after every
    // photo. Do not substitute the category name under every image.
    if(albumKind||row.title){const name=document.createElement('h3');name.className='album-item__name text-split webkit-line-clamp-2';name.textContent=albumKind&&row.title?.toLowerCase()===(albumKind==='nail'?'nail hottrend':'không gian')?'':(row.title||' ');item.append(name)}
    gallery.append(item);
  }
  // The source page can carry a stale thumbnail variant; keep it in sync.
  gallery.querySelectorAll('[data-fancybox][data-src]').forEach(frame=>{
    const src=frame.getAttribute('data-src');if(!src)return;
    const match=publishedOnly(rows).find(x=>(x.full||x.image)===src);
    if(match&&match.image)frame.querySelector('img')?.setAttribute('src',match.image);
  });
}
function makeNewsRow(item,kind,cms){
      const li=document.createElement('li');li.className='news__item';li.dataset.cmsGenerated='true';li.dataset.cmsRecord=item.id;
  const card=document.createElement('article');card.className='news__card';
  const figure=document.createElement('figure');figure.className='news__media';
  const link=document.createElement('a');link.className='news__media-link scale-img';const sourceSlug=(item.sourceRoute||'').split('/').filter(Boolean).pop();link.href=(item.sourceRoute&&(!item.slug||item.slug===sourceSlug))?item.sourceRoute:`/${kind==='training'?'dao-tao':'tin-tuc'}/${item.slug}`;
  const image=resolveMedia(cms,item.displayImage||item.image);
  if(image){const img=document.createElement('img');img.className='news__media-image w-100';img.src=image;img.loading='lazy';img.decoding='async';img.alt=item.alt||item.title||'';link.append(img)}figure.append(link);
  const info=document.createElement('div');info.className='news__info';const name=document.createElement('h3');name.className='news__name';const a=document.createElement('a');a.href=link.href;a.textContent=item.title||'';name.append(a);info.append(name);
  if(item.description){const p=document.createElement('p');p.className='news__desc';p.textContent=item.description;info.append(p)}card.append(figure,info);li.append(card);return li;
}
export function applyManagedContent(root,route,cms){
  if(!root||!cms)return;
      const sections=cms.sections||{}, collections=cms.collections||{};
  if(route==='/'){
    const intro=sections.intro;
    if(intro){
      setText(root,'.intro__title',intro.homeSubtitle);
      setText(root,'.intro__name',intro.homeTitle||intro.title);
      const body=root.querySelector('.intro__desc');
      if(body){const html=intro.homeBody||intro.description;if(html)body.innerHTML=cleanHtml(html)}
      setImage(root,'.intro__media-image',intro.homeImage||intro.image,intro.alt||'Mi House Spa',cms);
    }
    const btn=root.querySelector('.intro__btn');if(btn&&!btn.getAttribute('href'))btn.href='/gioi-thieu';
        return;
  }
  if(route==='/gioi-thieu'){
    const record=sections.intro;
    if(record){
      setText(root,'.title-main h1',record.title);
      setBody(root,record);
      if(record.image)setImage(root,'.content-main article img',record.image,record.alt,cms);
      // Keep the body images in sync with the CMS media map.
      const mediaMap=cms.mediaMap||{};
      root.querySelectorAll('.content-main img').forEach(img=>{
        const next=resolveMedia(cms,img.getAttribute('src'));
        if(next&&next!==img.getAttribute('src'))img.setAttribute('src',next);
      });
    }
  }
      if(route==='/lien-he'){
    const record=sections.contact;
    if(record){
      setText(root,'.title-main h1',record.title);
      setText(root,'.contact-left .title-detail h1',record.title);
      const desc=root.querySelector('.contact-left .content-main')||root.querySelector('.contact-left .ck-editor');
      if(record.body&&desc)desc.innerHTML=cleanHtml(record.body);
      applyContactLinks(root,record,cms);
    }
  }
  const slugRecord=(rows,prefix)=>route.startsWith(prefix+'/') ? publishedOnly(rows).find(x=>x.slug&&route===prefix+'/'+x.slug) : null;
  const service=findExistingRecord(cms.services,route)||slugRecord(cms.services,'/dich-vu');
  const training=findExistingRecord(cms.training,route)||slugRecord(cms.training,'/dao-tao');
  const article=findExistingRecord(cms.articles,route)||slugRecord(cms.articles,'/tin-tuc');
  const detail=service||training||article;
  if(detail){
    if(!isPublished(detail)){root.innerHTML='<section class="wrap-content"><h1>Nội dung tạm ẩn</h1></section>';return;}
    setText(root,'.title-main h1,.title-detail h1,.news-detail-title h1',detail.title);
    setBody(root,detail);
        if(detail.image)setImage(root,'.content-main img,.news-detail-main img',detail.image,detail.alt,cms);
    if(detail.displayImage)setImage(root,'.content-main img,.news-detail-main img',detail.displayImage,detail.alt,cms);
  }
  if(route==='/dich-vu'){
    const list=root.querySelector('.service__list');if(!list)return;
    list.querySelectorAll('.service__item').forEach(node=>node.remove());
    for(const row of publishedOnly(cms.services).sort(byOrder)){
      const item=document.createElement('li');item.className='service__item';item.dataset.cmsRecord=row.id;
      const card=document.createElement('article');card.className='service__card';
      const fig=document.createElement('figure');fig.className='service__media';
      const a=document.createElement('a');const sourceSlug=(row.sourceRoute||'').split('/').filter(Boolean).pop();a.href=(row.sourceRoute&&(!row.slug||row.slug===sourceSlug))?row.sourceRoute:('/dich-vu/'+row.slug);a.className='service__media-link scale-img';
      const image=resolveMedia(cms,row.displayImage||row.image);
          if(image){const img=document.createElement('img');img.src=image;img.alt=row.alt||row.title||'';img.loading='lazy';img.decoding='async';img.className='service__media-image w-100';img.width=500;img.height=800;a.append(img)}fig.append(a);
      const info=document.createElement('div');info.className='service__info';const h=document.createElement('h3');h.className='service__name';const title=document.createElement('a');title.className='text-split transition';title.href=a.href;title.textContent=row.title;h.append(title);info.append(h);card.append(fig,info);item.append(card);list.append(item);
    }
  }
  if(route==='/dao-tao'){
    const list=root.querySelector('.news__list');if(list){list.replaceChildren(...publishedOnly(cms.training).sort(byOrder).map(x=>makeNewsRow(x,'training',cms)))}
  }
  if(route==='/tin-tuc'){
    const list=root.querySelector('.news__list');if(list){list.replaceChildren(...publishedOnly(cms.articles).sort(byOrder).map(x=>makeNewsRow(x,'articles',cms)))}
  }
     if(route==='/bang-gia')gallerySource(root,collections.menu||[],'menu');
  const categoryOn=(id)=>(cms.albumCategories||[]).some(x=>x.id===id&&x.status!=='draft');
  if(route==='/nail-hottrend')gallerySource(root,categoryOn('nail')?(collections.nail||[]):[],'album-nail');
  if(route==='/khong-gian')gallerySource(root,categoryOn('space')?(collections.space||[]):[],'album-space');
  if(route.split('?')[0]==='/album-anh'){
    // Exact pages.rar composition: 2 space, 8 nail, then remaining space.
    // Pagination is over the images, not over album categories.
    const heading=root.querySelector('.title-main h1');if(heading)heading.textContent='Album ảnh';
    const gallery=root.querySelector('.news-detail-gallery');
    if(gallery){
      const visible=publishedOnly(cms.albumCategories||[]);
      const space=visible.some(c=>c.id==='space')?categoryItems({id:'space'},cms):[];
      const nail=visible.some(c=>c.id==='nail')?categoryItems({id:'nail'},cms):[];
      const other=visible.filter(c=>!['space','nail'].includes(c.id)).flatMap(c=>categoryItems(c,cms));
      const records=[...space.slice(0,2),...nail,...space.slice(2),...other];
      const page=Number(new URLSearchParams(route.split('?')[1]||'').get('page'))||1;
      const per=12,subset=records.slice((page-1)*per,page*per);
      gallery.replaceChildren();
      for(const row of subset){
        const frame=document.createElement('div');frame.className='album-item';
        const media=document.createElement('div');media.className='scale-img cursor-pointer';
        media.dataset.fancybox='album';media.dataset.src=resolveMedia(cms,row.full||row.image);media.dataset.caption=row.title||'';
        const img=document.createElement('img');img.src=resolveMedia(cms,row.image);img.alt=row.alt||' ';img.loading='lazy';img.decoding='async';img.width=360;img.height=360;img.className='w-100';
        media.append(img);frame.append(media);
        const cap=document.createElement('h3');cap.className='album-item__name text-split webkit-line-clamp-2';cap.textContent=' ';frame.append(cap);gallery.append(frame);
      }
      const pagination=root.querySelector('.pagination');
      if(pagination){pagination.replaceChildren();const pages=Math.max(1,Math.ceil(records.length/per));const add=(text,to,disabled=false,selected=false)=>{const li=document.createElement('li');li.className='page-item'+(disabled?' disabled':'')+(selected?' active':'');const a=document.createElement(disabled?'span':'a');a.className='page-link';a.textContent=text;if(!disabled)a.href=to<=1?'/album-anh':'/album-anh?page='+to;li.append(a);pagination.append(li)};add('Page '+page+'/'+pages,page,true);add('First',1,page===1);for(let i=1;i<=pages;i++)add(String(i),i,i===page,i===page);add('Next',page+1,page>=pages);add('Last',pages,page>=pages);}
    }
  }
}
/** All media rows that belong to one album category (seed collections + CMS items). */
export function categoryItems(category,cms){
  if(!category)return [];
  if(category.id==='nail')return sortAlbumPhotos(publishedOnly(cms?.collections?.nail),'nail');
  if(category.id==='space')return sortAlbumPhotos(publishedOnly(cms?.collections?.space),'space');
  const items=publishedOnly(cms?.albumItems).filter(x=>x.categoryId===category.id);
  return items.length?items:publishedOnly(cms?.collections?.[category.id]);
}
/** Apply the contact links saved in the CMS to the contact page. */
function applyContactLinks(root,record,cms){
  const settings=cms?.settings||{};
  const phone=record.phone||settings.phone||'';
  const email=record.email||settings.email||'';
  const address=record.address||settings.address||'';
  const website=record.website||settings.website||'';
  const facebook=record.facebook||settings.facebook||'';
  const maps=record.maps||settings.maps||'';
  const contactLink=record.contactLink||settings.contactLink||'';
  const bookingLink=record.bookingLink||settings.bookingLink||'';
  const info=root.querySelector('.contact-left .content-main');
  // The original page ships four paragraphs (Địa Chỉ / Hotline / Email /
  // Website). Their text is refreshed in place so the markup - and every
  // link inside the contact block - survives a CMS edit. Only an EMPTY
  // container is rebuilt from scratch.
  if(info){
    const paragraphs=Array.from(info.querySelectorAll('p'));
    const pattern=(label)=>new RegExp('^('+label+')\\s*:\\s*','i');
    const write=(node,label,value)=>{
      if(!node||!value)return;
      const text=node.textContent||'';
      const head=text.match(pattern(label));
      node.textContent=head?head[0]+value:value;
    };
    const find=(label)=>paragraphs.find(p=>pattern(label).test(p.textContent||''));
    if(paragraphs.length){
      write(find('Địa Chỉ|Address'),'Địa Chỉ',address);
      write(find('Hotline|Điện thoại|SDT|Tel'),'Hotline',phone);
      write(find('Email'),'Email',email);
      write(find('Website'),'Website',website.replace(/^https?:\/\//,''));
    }else if(!record.body&&!info.querySelectorAll('a').length){
      const lines=[];
      if(address)lines.push('Địa Chỉ: '+address);
      if(phone)lines.push('Hotline: '+phone);
      if(email)lines.push('Email: '+email);
      if(website)lines.push('Website: '+website.replace(/^https?:\/\//,''));
      info.innerHTML=cleanHtml(lines.map(line=>'<p>'+line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>').join(''));
    }
  }
  // Any tel:/mailto: anchor in the page follows the CMS values.
  if(phone){
    const digits=phone.replace(/[^\d+]/g,'');
    root.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:'+digits});
  }
  if(email)root.querySelectorAll('a[href^="mailto:"]').forEach(a=>{a.href='mailto:'+email});
  if(facebook)root.querySelectorAll('a[href*="facebook.com"]').forEach(a=>{a.href=facebook});
  if(maps){
    root.querySelectorAll('a[href*="maps"],a[href*="google.com/maps"]').forEach(a=>{a.href=maps});
    const frame=root.querySelector('.contact-map iframe');
    if(frame&&!/google\.com\/maps\/embed/i.test(frame.getAttribute('src')||''))frame.setAttribute('src',maps);
  }
  if(contactLink)root.querySelectorAll('a[href*="zalo.me"],a[href*="zalo"]').forEach(a=>{a.href=contactLink});
  if(bookingLink)root.querySelectorAll('a[href*="zalo.me"],a[href*="dat-lich"],.contact-button').forEach(a=>{if(a.tagName==='A')a.href=bookingLink});
}
export function mapManagedMedia(root,cms){
 const mapping=cms?.mediaMap||{};
 if(!mapping||!Object.keys(mapping).length)return;
 const mapped=value=>{
   if(typeof value!=='string'||!value.trim())return '';
   const raw=value.trim();
   const candidates=[raw,mediaKey(raw)];
   if(/^https?:\/\//i.test(raw)){
     const alt=raw.replace(/^http:\/\//,'https://').replace(/^https:\/\//,'http://');
     candidates.push(mediaKey(alt),alt);
   }
   for(const key of candidates){const hit=mapping[key];if(typeof hit==='string'&&hit.trim())return hit.trim()}
   return '';
 };
 const applySrc=el=>{
   const original=el.getAttribute('src');if(!original)return;
   const result=mapped(original);
   if(result&&result!==original){
     el.setAttribute('src',result);
     el.removeAttribute('srcset');el.removeAttribute('data-srcset');
     el.closest('picture')?.querySelectorAll('source').forEach(source=>source.remove());
   }
 };
 // Media used by the original PHP templates is also stored in data-* props.
 // Preserve original classes/effects; only replace their URLs.
 root?.querySelectorAll('img[src],video[src],source[src],audio[src],iframe[src]').forEach(applySrc);
 // <video> posters and <source> children inside a picture/video element.
 root?.querySelectorAll('video[poster]').forEach(el=>{
   const original=el.getAttribute('poster');const result=mapped(original);
   if(result&&result!==original)el.setAttribute('poster',result);
 });
 root?.querySelectorAll('video source[src],audio source[src]').forEach(applySrc);
 root?.querySelectorAll('[data-bg-image]').forEach(el=>{
  const old=el.getAttribute('data-bg-image'),url=mapped(old);
  if(url&&url!==old){el.setAttribute('data-bg-image',url);if(el.style.backgroundImage)el.style.backgroundImage=`url("${url.replace(/"/g,'')}")`}
 });
 root?.querySelectorAll('[data-fancybox][data-src]').forEach(el=>{
   const old=el.getAttribute('data-src'),url=mapped(old);if(url&&url!==old)el.setAttribute('data-src',url);
 });
 // Deferred media that is not part of a fancybox group.
 root?.querySelectorAll('[data-src]:not([data-fancybox])').forEach(el=>{
   const old=el.getAttribute('data-src'),url=mapped(old);if(url&&url!==old)el.setAttribute('data-src',url);
 });
 // Responsive sources kept in srcset attributes.
 root?.querySelectorAll('[srcset]').forEach(el=>{
   const original=el.getAttribute('srcset');if(!original)return;
   const next=original.split(',').map(part=>{
     const trimmed=part.trim();if(!trimmed)return part;
     const [url,...rest]=trimmed.split(/\s+/);
     const mappedUrl=mapped(url);
     return [mappedUrl||url,...rest].join(' ');
   }).join(', ');
   if(next!==original)el.setAttribute('srcset',next);
 });
}
export function applyFooterContent(cms){
 const data=cms?.sections?.footer;if(!data)return;
 const root=document.querySelector('.footer');if(!root)return;
 if(data.title)setText(root,'.footer__name',data.title);
 if(data.description)setText(root,'.footer__desc',data.description);
 const content=root.querySelector('.footer__content');
 if(content&&data.body){const html=/<[a-z][\s>]/i.test(data.body)?data.body:data.body.split(/\n+/).filter(Boolean).map(line=>'<p>'+line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</p>').join('');content.innerHTML=cleanHtml(html)}
   }
