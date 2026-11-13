import React, {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import source from './sourceAdminTemplates.json';
import catalog from './catalog.json';
import {TAB_LABELS as TABS,MENU_GROUPS,COLLECTION_KEYS as COLLECTIONS,SECTION_KEYS as SECTIONS,GALLERY_KEYS as GALLERY,NEWS_TABS,PLAIN_TABS,FIELD_LABELS as FIELDS,getRows,saveRecord,deleteRecords,duplicateRecord,slugify,seoChecklist,focusKeywordList,FOCUS_KEYWORD_LIMIT} from './businessModel.js';
import './source-admin.css';

const EMPTY={revision:0,settings:{},sections:{},overrides:{},blocks:{},articles:[],services:[],training:[],albumCategories:[],albumItems:[],media:[],collections:{nail:[],space:[],menu:[],videos:[],slides:[]}};
const uuid=()=>crypto?.randomUUID?.()||'id'+Date.now()+Math.random().toString(36).slice(2);
const attr=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const api=async(path,method='GET',value)=>{
 const options={method,credentials:'same-origin',headers:{'X-CMS-Request':'1'}};
 if(value!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(value)}
 const response=await fetch(path,options);
 const json=await response.json().catch(()=>({error:`Phản hồi API không hợp lệ (${response.status})`}));
 if(!response.ok)throw Error(json.error||'API error '+response.status);
 return json;
};
const listFor=(data,tab)=>getRows(data,tab);
const mediaFor=row=>row?.image||row?.src||row?.cover||row?.video||'';
const nameFor=row=>row?.title||row?.name||row?.label||'Chưa đặt tiêu đề';
const sourceCss=['vendor/fonts/fontawesome.css','vendor/fonts/tabler-icons.css','css/style-tailwind.css','vendor/css/rtl/core.css','vendor/css/rtl/theme-default.css','confirm/confirm.css','vendor/libs/perfect-scrollbar/perfect-scrollbar.css','vendor/libs/typeahead-js/typeahead.css','vendor/libs/select2/select2.css','fancybox5/fancybox.css','cropper/cropper.min.css','css/main.css','css/ai_studio.css','css/chunk_uploader.css','css/product_qrcode.css','vendor/libs/flatpickr/flatpickr.css'];
const cssHtml=sourceCss.map(x=>`<link rel="stylesheet" href="/admin-source/assets/admin/${x}">`).join('');
const PUBLIC_FONT_CSS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap"><link rel="stylesheet" href="/cms-controls-v16.css">';
function makeDoc(authorized,tab,mode){
 if(!authorized){return `<!doctype html><html lang="vi" class="light-style" data-bs-theme-color="color-3"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${PUBLIC_FONT_CSS}${cssHtml}<link rel="stylesheet" href="/admin-source/assets/admin/login-source.css"><link rel="stylesheet" href="/source-admin-frame.css"></head><body>${source.login}</body></html>`}
 const key=mode==='edit'||mode==='create'?(tab==='settings'?'settings':SECTIONS.has(tab)?'pageform':tab==='albumCategories'?'galleryform':GALLERY.has(tab)?'galleryform':'form'):(tab==='media'?'media':tab==='albumCategories'?'categorylist':GALLERY.has(tab)?'gallerylist':'list');
 const body=source[key]||source.list;
 const html=`<!doctype html><html lang="vi" class="light-style layout-navbar-fixed layout-menu-fixed layout-compact" data-template="vertical-menu-template" data-theme="theme-default" data-bs-theme-color="color-4"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="/"><title>Administrator - Mi House Spa</title>${PUBLIC_FONT_CSS}${cssHtml}<link rel="stylesheet" href="/admin-source/assets/admin/cropper/cropper.min.css"><link rel="stylesheet" href="/source-admin-frame.css"></head><body><div class="layout-wrapper layout-content-navbar"><div class="layout-container">${source.aside}<div class="layout-page">${source.navbar}<div class="content-wrapper"><div id="source-admin-body">${body}</div>${source.footer}<div class="content-backdrop fade"></div></div></div></div><div class="layout-overlay layout-menu-toggle"></div><div class="drag-target"></div></div><script src="/admin-source/assets/admin/vendor/libs/flatpickr/flatpickr.js"></script><script src="/admin-source/assets/admin/js/cropper.js"></script></body></html>`;
 return html;
}
function makeElem(doc,html){const template=doc.createElement('template');template.innerHTML=html;return template.content.firstElementChild;}
const iconPaths={
 'ti-plus':'M12 5v14M5 12h14','ti-trash':'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
 'ti-search':'M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16M17 17l4 4','ti-edit':'M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 5l3 3M12 15l9-9-3-3-9 9-1 4z',
 'ti-menu-2':'M4 6h16M4 12h16M4 18h16','ti-x':'M5 5l14 14M19 5L5 19','ti-eye':'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6',
 'ti-eye-check':'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM9 12l2 2 4-4','ti-chevron-down':'M6 9l6 6 6-6','ti-chevron-right':'M9 6l6 6-6 6','ti-chevron-left':'M15 6l-6 6 6 6','ti-layout-grid':'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
 'ti-layout-list':'M4 6h16M4 12h16M4 18h16','ti-upload':'M12 16V3M7 8l5-5 5 5M4 17v4h16v-4','ti-device-floppy':'M4 3h14l3 3v15H3V3zM7 3v7h10V3M7 21v-8h10v8',
 'ti-copy':'M8 8h13v13H8zM4 17H3V3h14v1','ti-calendar':'M5 3v4M19 3v4M3 9h18M3 5h18v16H3z','ti-user':'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8M4 21v-2a8 8 0 0 1 16 0v2',
 'ti-logout':'M10 4H4v16h6M14 8l4 4-4 4M8 12h10','ti-world':'M2 12h20M12 2a16 16 0 0 1 0 20M12 2a16 16 0 0 0 0 20M2 12a10 10 0 1 1 20 0a10 10 0 1 1-20 0',
 'ti-settings':'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
 'ti-chart-line':'M4 19h16M5 15l5-5 4 3 5-7','ti-refresh':'M20 7V3h-4M4 17v4h4M20 7a8 8 0 0 0-14-2M4 17a8 8 0 0 0 14 2',
 'ti-photo':'M3 3h18v18H3zM8 9a2 2 0 1 0 0-4a2 2 0 0 0 0 4M3 17l6-5 4 3 3-4 5 6',
 'ti-home':'M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
 'ti-check':'M4 12l5 5L20 6','ti-repeat':'M3 11V5h6M21 13v6h-6M20 8a8 8 0 0 0-14-3L3 11M4 16a8 8 0 0 0 14 3l3-6',
 'ti-info-circle':'M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20M12 11v6M12 7v1',
 'ti-heart-handshake':'M12 21l-8.5-8A5 5 0 0 1 10 5l2 2 2-2a5 5 0 0 1 6.5 8zM7 13l4 3 4-3',
 'ti-receipt':'M5 2h14v20l-3-2-4 2-4-2-3 2zM8 7h8M8 11h8M8 15h5',
 'ti-school':'M2 10l10-6 10 6-10 6zM6 13v5c4 3 8 3 12 0v-5M22 10v8',
 'ti-news':'M4 4h15v16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M7 8h8M7 12h3M12 12h4M7 16h9',
 'ti-slideshow':'M3 5h18v14H3zM10 9l5 3-5 3zM6 2v3M18 2v3',
 'ti-video':'M3 5h14v14H3zM17 10l5-3v10l-5-3',
 'ti-phone':'M8 3L5 2 2 6c-1 8 8 17 16 16l4-4-3-4-4 2a13 13 0 0 1-7-7z',
 'ti-layout-bottombar':'M3 3h18v18H3zM3 16h18',
 'ti-folders':'M2 6h8l2 2h10v12H2zM4 3h7l2 2h7',
 'ti-folder':'M2 6h8l2 2h10v12H2z',
 'ti-folder-plus':'M2 6h8l2 2h10v12H2zM14 14h5M16.5 11.5v5',
 'ti-folder-x':'M2 6h8l2 2h10v12H2zM14 12l5 5M19 12l-5 5',
 'ti-crop':'M5 3v14a2 2 0 0 0 2 2h14M3 5h14a2 2 0 0 1 2 2v14',
 'ti-rotate-2':'M4 10a8 8 0 1 1 2 7M4 4v6h6','ti-rotate-clockwise-2':'M20 10a8 8 0 1 0-2 7M20 4v6h-6',
 'ti-zoom-in':'M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16M17 17l4 4M11 7v8M7 11h8',
 'ti-zoom-out':'M11 19a8 8 0 1 0 0-16a8 8 0 0 0 0 16M17 17l4 4M7 11h8',
 'ti-aspect-ratio':'M3 3h18v18H3zM7 7h6M7 7v6M17 17h-6M17 17v-6',
 'ti-cloud-upload':'M7 18H5a4 4 0 0 1 0-8 7 7 0 0 1 13-3 5 5 0 0 1 0 10h-1M12 21V10M8 14l4-4 4 4',
 'ti-adjustments-horizontal':'M3 7h18M3 17h18M8 4v6M16 14v6',
 'ti-sparkles':'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z',
 'ti-photo-x':'M3 3h18v18H3zM4 17l5-5 4 3 3-4 4 6M9 8h.01M15 7l4 4M19 7l-4 4',
 'ti-photo-cancel':'M3 3h18v18H3zM4 17l5-5 4 3 3-4 4 6M14 7l5 5',
 'ti-photo-heart':'M3 3h18v18H3zM4 17l5-5 4 3 3-4 4 6M12 8c1-2 3-2 4 0 1-2 4-1 4 1 0 2-4 4-4 4s-4-2-4-5',
 'ti-user-circle':'M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8M5 19a7 7 0 0 1 14 0',
 'ti-external-link':'M14 3h7v7M21 3l-10 10M21 13v8H3V3h8',
 'ti-eye-off':'M3 3l18 18M10.5 5a10 10 0 0 1 11 7 11 11 0 0 1-3 4M6 6a11 11 0 0 0-4 6c2 4 6 7 10 7a10 10 0 0 0 4-1M10 10l4 4',
 'ti-alert-triangle':'M12 2L1 21h22zM12 8v5M12 17v1',
 'ti-bolt':'M13 2L5 13h7l-1 9 8-12h-7z',
 'ti-lock':'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',
 'ti-lock-access':'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3M12 14v3',
 'ti-shield-check':'M12 2l9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6zM8 12l3 3 5-6',
 'ti-star':'M12 2l3.1 6.4L22 9.3l-5 4.8 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-4.8 6.9-1z',
 'ti-arrow-right':'M4 12h16M14 6l6 6-6 6',

};
function enhanceIcons(doc){
 doc.querySelectorAll('i.ti,span.ti').forEach(icon=>{
  if(icon.querySelector('svg'))return;
  const kind=[...icon.classList].find(c=>iconPaths[c]);if(!kind)return;
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','18');svg.setAttribute('height','18');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
  const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',iconPaths[kind]);svg.appendChild(path);icon.appendChild(svg);
 });
}
function populateList(doc,data,tab,route,query,page=1,selected=new Set()){
 const all=listFor(data,tab);const range=doc.querySelector('#flatpickr-range')?.value||'';
 const [since,until]=range.split(' to ').map(v=>{const m=v.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?new Date(Number(m[3]),Number(m[2])-1,Number(m[1])):null});
 const rows=all.filter(r=>{
  if(query&&!JSON.stringify(r).toLowerCase().includes(query.toLowerCase()))return false;
  if(!since&&!until)return true;
  const stamp=r.createdAt||r.date||r.updatedAt;if(!stamp)return true;
  const when=new Date(stamp);if(Number.isNaN(when.getTime()))return true;
  if(since&&when<since)return false;
  if(until){const limit=new Date(until);limit.setDate(limit.getDate()+1);if(when>=limit)return false}
  return true;
 });
 const gallery=GALLERY.has(tab);const isCategory=tab==='albumCategories';const per=10;const sliced=rows.slice((page-1)*per,page*per);
 const body=doc.querySelector('[data-cms-rows]');if(!body)return;
 body.replaceChildren();
 const fragment=doc.createDocumentFragment();
 for(let i=0;i<sliced.length;i++){
  const row=sliced[i], idx=(page-1)*per+i;
  const tr=makeElem(doc,isCategory?source.categoryrow:gallery?source.galleryrow:source.newsrow);
  const cells=tr.querySelectorAll(':scope > td');
  tr.setAttribute('data-row-id',String(row.id));
  const checkbox=cells[0]?.querySelector('input');if(checkbox){checkbox.checked=selected.has(String(row.id));checkbox.value=String(row.id);checkbox.setAttribute('data-cms-act','select');checkbox.removeAttribute('id')}
  const order=cells[1]?.querySelector('input');if(order){order.value=idx+1;order.setAttribute('data-cms-act','order');order.setAttribute('data-row-id',String(row.id));order.removeAttribute('data-id')}
  const label=cells[2]?.querySelector('a.text-dark');if(label){label.textContent=nameFor(row);label.href='#';label.setAttribute('data-cms-act','edit')}
  if(isCategory){
   const slug=cells[3];if(slug)slug.textContent=row.slug||'—';
   const count=cells[4];if(count){
    // Ảnh album nằm ở albumItems hoặc trong collections.nail / collections.space
    // theo danh mục cấp 1 tương ứng.
    const photoCount=(data.albumItems||[]).filter(x=>x.categoryId===row.id).length
     +(row.id==='nail'?(data.collections?.nail||[]).length:0)
     +(row.id==='space'?(data.collections?.space||[]).length:0);
    count.textContent=String(photoCount);
   }
  }else if(gallery){
   const img=cells[3]?.querySelector('img');if(img){img.src=mediaFor(row)||'/admin-source/noimage.png';img.alt=nameFor(row);img.removeAttribute('onerror')}
   const link=cells[4]?.querySelector('a');if(link){link.textContent=row.href||row.video||'';link.href='#';link.setAttribute('data-cms-act','edit')}
  }else{
   if(cells[3])cells[3].textContent=tab==='albumPhotos'?(data.albumCategories||[]).find(x=>x.id===row.categoryId)?.title||'Album':TABS[tab]||'—';
   const img=cells[4]?.querySelector('img');if(img){const media=mediaFor(row);img.src=media||'/admin-source/noimage.png';img.alt=nameFor(row);img.removeAttribute('onerror')}
   const view=cells[2]?.querySelector('a[target]');if(view){view.href=(row.href&&/^(https?:|\/)/.test(row.href))?row.href:'#';view.setAttribute('data-cms-act','view')}
   const copy=cells[2]?.querySelector('#dropdownCopy');if(copy){copy.href='#';copy.setAttribute('data-cms-act','duplicate');copy.removeAttribute('id')}
  }
  const statusCell=cells[gallery?5:5];
  if(statusCell){const button=statusCell.querySelector('.status-dropdown-btn');if(button){
   statusCell.innerHTML=`<div class="dropdown status-dropdown d-inline-block"><button type="button" class="status-dropdown-btn btn btn-sm dropdown-toggle d-inline-flex align-items-center gap-1 shadow-none" data-cms-act="toggle-status"><span class="status-btn-content d-inline-flex align-items-center gap-1"><span class="status-indicator-dot ${row.status==='draft'?'':'status-dot-active'}"></span><span class="status-label-text">${row.status==='draft'?'Ẩn':'Hiển thị'}</span></span><i class="ti ti-chevron-down"></i></button></div>`;
  }}
  const actions=cells[6]?.querySelectorAll('a');if(actions?.length){actions[0].href='#';actions[0].setAttribute('data-cms-act','edit');actions[1]?.setAttribute('data-cms-act','delete');if(actions[1])actions[1].href='#';}
  fragment.appendChild(tr);
 }
 if(!sliced.length){const tr=doc.createElement('tr');tr.innerHTML='<td colspan="7" class="text-center text-muted py-5">Chưa có nội dung trong danh mục này.</td>';fragment.appendChild(tr)}
 body.appendChild(fragment);
 const heading=doc.querySelector('.container-p-y h4');if(heading)heading.innerHTML='<span>Quản lý</span><span aria-hidden="true" class="page-title-separator"></span>'+attr(TABS[tab]);
 doc.querySelectorAll('a[title="Thêm mới"]').forEach(a=>{a.href='#';a.dataset.cmsAct='create'});
 doc.querySelectorAll('[data-cms-action="bulk-delete"]').forEach(a=>{a.dataset.cmsAct='bulk-delete';a.removeAttribute('id');a.setAttribute('aria-label','Xóa mục đã chọn')});
 const allCheck=doc.querySelector('#selectall-checkbox');if(allCheck){allCheck.checked=Boolean(sliced.length&&sliced.every(r=>selected.has(String(r.id))));allCheck.dataset.cmsAct='select-all'}
 const pag=doc.querySelector('[data-cms-pagination]');if(pag){pag.innerHTML=`<div class="d-flex align-items-center gap-2"><span class="text-muted">Hiển thị: ${per} / trang</span><span class="text-muted">Tổng: ${rows.length} bản ghi</span></div><div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-outline-secondary" data-cms-act="prev-page" ${page<=1?'disabled':''}>‹</button><span class="btn btn-sm btn-light">${page} / ${Math.max(1,Math.ceil(rows.length/per))}</span><button type="button" class="btn btn-sm btn-outline-secondary" data-cms-act="next-page" ${page>=Math.ceil(rows.length/per)?'disabled':''}>›</button></div>`}
 doc.querySelectorAll('[data-cms-grid]').forEach(el=>{
  el.innerHTML='';const grid=doc.createElement('div');grid.className='source-grid card mb-3 p-3';
  for(const r of sliced){const card=makeElem(doc,`<article class="card shadow-sm p-3"><div class="source-grid-media"></div><h5></h5><div class="d-flex gap-2"><button class="btn btn-sm btn-secondary" data-cms-act="edit">Chỉnh sửa</button><button class="btn btn-sm btn-outline-danger" data-cms-act="delete">Xóa</button></div></article>`);card.dataset.rowId=String(r.id);const img=doc.createElement('img');img.src=mediaFor(r)||'/admin-source/noimage.png';img.loading='lazy';img.alt=nameFor(r);card.querySelector('.source-grid-media').appendChild(img);card.querySelector('h5').textContent=nameFor(r);grid.appendChild(card)}
  el.appendChild(grid);
 });
 const dropdown=doc.querySelector('#id_list');if(dropdown){dropdown.innerHTML='';const opts=Object.entries(TABS).filter(([k])=>!SECTIONS.has(k)&&!['settings','media'].includes(k));for(const [key,label] of opts){const opt=doc.createElement('option');opt.value=key;opt.textContent=label;opt.selected=key===tab;dropdown.appendChild(opt)}dropdown.dataset.cmsAct='choose-tab'}
 renderAlbumTabs(doc,tab);
 enhanceIcons(doc);
}
/* Album có 2 tab: "Danh mục album cấp 1" và "Hình ảnh album".
   Thanh tab dùng đúng class Bootstrap/tabler của bản admin gốc. */
const ALBUM_TABS=[['albumCategories','Danh mục album cấp 1'],['albumPhotos','Hình ảnh album']];
function renderAlbumTabs(doc,tab){
 if(!ALBUM_TABS.some(([key])=>key===tab))return;
 const host=doc.querySelector('.container-p-y')||doc.querySelector('#source-admin-body');
 if(!host)return;
 if(doc.querySelector('#cms-album-tabs'))return;
 const bar=makeElem(doc,'<ul class="nav nav-tabs mb-3" id="cms-album-tabs" role="tablist"></ul>');
 for(const [key,label] of ALBUM_TABS){
  const li=doc.createElement('li');li.className='nav-item';
  const a=doc.createElement('a');a.className='nav-link'+(key===tab?' active':'');a.href='#';a.dataset.cmsAct='choose-album-tab';a.dataset.cmsAlbumTab=key;a.setAttribute('role','tab');a.textContent=label;
  li.appendChild(a);bar.appendChild(li);
 }
 const heading=host.querySelector('h4');if(heading)heading.insertAdjacentElement('afterend',bar);else host.prepend(bar);
}
function populateMedia(doc,data,kind='image',page=1,remote=null){
 const cloudReady=remote?.loaded===true&&remote.kind===kind;
 const all=cloudReady?remote.items:(data.media||[]).filter(item=>kind==='video'?item.resourceType==='video':item.resourceType!=='video');
 const keyword=String(doc.querySelector('#keyword')?.value||'').toLowerCase().trim();
 const perPage=18,totalPages=cloudReady?page+(remote.nextCursor?1:0):Math.max(1,Math.ceil(all.length/perPage));
 page=Math.min(Math.max(1,page),totalPages);
 const files=doc.querySelector('.fu-right .fu-files');if(!files)return;
 doc.querySelector('.fu-left')?.classList.add('cms-legacy-tree-hidden');
 doc.querySelectorAll('.delete-folder,.add-folder,.unused-folder,.delete-selected-files,.delete-all-unused-files').forEach(el=>{el.hidden=true;el.title='Chức năng quản lý thư mục PHP gốc không áp dụng với Cloudinary; đã được ẩn để tránh thao tác sai.'});
 doc.querySelector('.fu-right')?.classList.add('cms-media-main');
 files.replaceChildren();files.classList.add('source-grid');
 const toolbar=doc.querySelector('#cms-media-toolbar')||doc.createElement('div');
 if(!toolbar.id){toolbar.id='cms-media-toolbar';files.parentElement.insertBefore(toolbar,files)}
 toolbar.className='d-flex flex-wrap align-items-center justify-content-between gap-3 py-3';
 toolbar.replaceChildren();
 const tabs=doc.createElement('div');tabs.className='btn-group';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Loại tài nguyên');
 for(const [key,label] of [['image','Ảnh'],['video','Video']]){
  const button=doc.createElement('button');button.type='button';button.className='btn btn-sm '+(key===kind?'btn-primary':'btn-outline-primary');
  button.textContent=label;button.dataset.cmsAct='media-kind';button.dataset.kind=key;button.setAttribute('aria-pressed',String(key===kind));tabs.appendChild(button);
 }
 toolbar.appendChild(tabs);
 const actions=doc.createElement('div');actions.className='d-flex flex-wrap gap-2';actions.innerHTML='<button type="button" class="btn btn-sm btn-outline-secondary" data-cms-act="media-refresh">Làm mới</button><button type="button" class="btn btn-sm btn-primary" data-cms-act="media-upload">Tải ảnh/video</button>';toolbar.append(actions);
 const pageBar=doc.createElement('div');pageBar.className='d-flex align-items-center gap-2';
 const count=doc.createElement('span');count.className='text-muted';count.textContent=cloudReady?`Cloudinary · ${kind==='video'?'Video':'Ảnh'} · Trang ${page}${remote.nextCursor?' (còn trang tiếp)':''}`:`${all.length} ${kind==='video'?'video':'ảnh'} trong CMS · Trang ${page}/${totalPages}`;pageBar.appendChild(count);
 for(const [text,dir,disabled] of [['‹','previous',page===1],['›','next',page===totalPages]]){
  const button=doc.createElement('button');button.type='button';button.className='btn btn-sm btn-outline-secondary';button.dataset.cmsAct='media-page';button.dataset.direction=dir;button.textContent=text;button.disabled=disabled;pageBar.appendChild(button);
 }
 toolbar.appendChild(pageBar);
 if(remote?.loading){const wait=doc.createElement('span');wait.className='text-muted';wait.setAttribute('role','status');wait.textContent='Đang tải danh sách thật từ Cloudinary...';toolbar.append(wait)}
 if(remote?.error){const warning=doc.createElement('p');warning.className='text-warning w-100';warning.textContent=remote.error;toolbar.append(warning)}
 for(const item of (cloudReady?all:all.slice((page-1)*perPage,page*perPage)).filter(x=>!keyword||[x.name,x.publicId].some(v=>String(v||'').toLowerCase().includes(keyword)))){
  const box=makeElem(doc,'<article class="card shadow-sm p-3"><div class="source-grid-media"></div><h6></h6><small class="text-muted"></small><div class="d-flex gap-1 mt-2"><button type="button" class="btn btn-sm btn-outline-secondary" data-cms-act="copy-media">Copy</button><button type="button" class="btn btn-sm btn-outline-primary" data-cms-act="replace-media">Thay</button><button type="button" class="btn btn-sm btn-outline-danger" data-cms-act="delete-media">Xóa</button></div></article>');
  if(item.id)box.dataset.mediaId=item.id;
  box.dataset.mediaUrl=item.url||'';
  if(!item.id){for(const button of box.querySelectorAll('[data-cms-act="replace-media"],[data-cms-act="delete-media"]')){button.disabled=true;button.title='Tài nguyên chưa được đăng ký trong CMS; chỉ có thể sao chép URL.'}}
  const preview=doc.createElement(item.resourceType==='video'?'video':'img');preview.src=item.url;preview.loading='lazy';preview.alt=item.name||'';
  if(item.resourceType==='video'){preview.controls=true;preview.preload='metadata'}
  box.querySelector('.source-grid-media').appendChild(preview);
  box.querySelector('h6').textContent=item.name||item.publicId;
  box.querySelector('small').textContent=item.publicId||'';
  files.appendChild(box);
 }
 if(!files.children.length){const empty=doc.createElement('p');empty.className='text-muted p-4';empty.textContent=`Chưa có ${kind==='video'?'video':'ảnh'} nào trong thư viện. Tải tài nguyên lên Cloudinary để quản lý.`;files.append(empty)}
 for(const el of doc.querySelectorAll('.fu-folder-meta'))if(el.closest('[data-path="/"]'))el.textContent=`${all.length} ${kind==='video'?'video':'ảnh'}`;
 const counter=doc.querySelector('.fu-right .fu-files-count,.fu-right .file-count');if(counter)counter.textContent=String(all.length);
 doc.querySelector('#file-folder')?.setAttribute('accept','image/*,video/mp4,video/webm,video/quicktime');
 enhanceIcons(doc);
}

function configureBusinessMenu(doc,tab){
 const menu=doc.querySelector('#layout-menu .menu-inner');if(!menu)return;
 menu.replaceChildren();
 MENU_GROUPS.forEach((group,index)=>{
  const item=doc.createElement('li');item.className='menu-header small'+(index===0?' open':'');
  const title=doc.createElement('a');title.href='#';title.className='menu-title';title.dataset.cmsAct='toggle-group';title.setAttribute('aria-expanded',index===0?'true':'false');
  const div=doc.createElement('div');div.className='text-uppercase bold';div.textContent=group.heading;title.append(div);item.append(title);
  const children=doc.createElement('ul');children.className='menu-body';
  group.items.forEach(([key,label,icon])=>{
   const li=doc.createElement('li');li.className='menu-item menu-item-main'+(key===tab?' active':'');
   const a=doc.createElement('a');a.href='#';a.className='menu-link';a.dataset.cmsTab=key;
   a.dataset.cmsAct=key==='album'?'toggle-album-group':'choose-menu';
   const i=doc.createElement('i');i.className='menu-icon tf-icons ti '+icon;
   const span=doc.createElement('div');span.textContent=label;a.append(i,span);li.append(a);
   if(key==='album'){
    const expanded=['albumCategories','albumPhotos'].includes(tab);li.classList.add('has-sub');li.classList.toggle('open',expanded);
    a.classList.add('menu-toggle');a.setAttribute('aria-expanded',String(expanded));
    const sub=doc.createElement('ul');sub.className='menu-sub';
    for(const [subKey,subLabel] of ALBUM_TABS){
     const child=doc.createElement('li');child.className='menu-item'+(subKey===tab?' active':'');
     const link=doc.createElement('a');link.href='#';link.className='menu-link';link.dataset.cmsAct='choose-menu';link.dataset.cmsTab=subKey;
     const text=doc.createElement('div');text.textContent=subLabel;link.append(text);child.append(link);sub.append(child);
    }
    li.append(sub);
   }
   children.append(li);
  });item.append(children);menu.append(item);
 });
 menu.style.overflowY='auto';menu.style.maxHeight='calc(100vh - 115px)';menu.style.scrollbarWidth='thin';
 enhanceIcons(doc);
}
const formField=(doc,key,label,value='',type='text',description='')=>{
 const wrapper=doc.createElement('div');wrapper.className='mb-3 source-business-field';
 const title=doc.createElement('label');title.className='form-label';title.textContent=label;
 const input=type==='textarea'?doc.createElement('textarea'):doc.createElement('input');if(type==='textarea')input.rows=4;else input.type=type;
 input.className='form-control';input.dataset.cmsKey=key;input.value=String(value??'');
 if(type==='textarea')input.rows=key==='body'?9:3;
 wrapper.append(title,input);if(description){const text=doc.createElement('small');text.className='text-muted d-block mt-1';text.textContent=description;if(description.startsWith('Ký tự:')){text.dataset.cmsCounter=key;const match=description.match(/\/(\d+)$/);if(match)text.dataset.cmsLimit=match[1]}wrapper.append(text)}return wrapper;
};
/* ---------------------------------------------------------------------------
 SEO helpers. The checklist is evaluated against the real record values only.
 ------------------------------------------------------------------------ */
const SEO_LIMITS={seoTitle:70,seoKeywords:70,seoDescription:160};
const RICH_EDITOR_TABS=new Set(['intro','contact','footer','articles','training','services']);
function syncSeoCounters(doc,values){
 for(const [key,limit] of Object.entries(SEO_LIMITS)){
  const input=doc.querySelector(`[data-cms-key="${key}"]`);if(!input)continue;
  const counter=doc.querySelector(`[data-cms-counter-text="${key}"]`);
  if(counter)counter.textContent=String(String(values[key]||input.value||'').length);
  input.classList.toggle('is-over-limit',String(input.value||'').length>limit);
 }
 const focus=doc.querySelector('[data-cms-key="focusKeyword"]');const point=doc.querySelector('#seo_point_vi');
 if(focus&&point)point.textContent=String(String(focus.value||'').length);
}
function renderSeoChecklist(doc,values){
 const host=doc.querySelector('#cms-seo-checklist');if(!host)return;
 const checks=seoChecklist({...values,seoTitle:doc.querySelector('[data-cms-key="seoTitle"]')?.value??values.seoTitle,seoDescription:doc.querySelector('[data-cms-key="seoDescription"]')?.value??values.seoDescription,focusKeyword:doc.querySelector('[data-cms-key="focusKeyword"]')?.value??values.focusKeyword,seoKeywords:doc.querySelector('[data-cms-key="seoKeywords"]')?.value??values.seoKeywords});
 host.replaceChildren();
 for(const check of checks){
  const li=doc.createElement('li');li.className='seo-check-keywordNotUsed '+({pass:'test-pass',warn:'test-warn',fail:'test-fail'}[check.state]);
  const icon=doc.createElement('span');icon.className='icon';const i=doc.createElement('i');i.className='ti '+({pass:'ti-check',warn:'ti-alert-triangle',fail:'ti-x'}[check.state]);icon.appendChild(i);
  const txt=doc.createElement('span');txt.className='txt';txt.textContent=check.label;
  li.append(icon,txt);host.appendChild(li);
 }
}
function ensureSeoCard(doc,values){
 const form=doc.querySelector('form.validation-form')||doc.querySelector('form');if(!form)return;
 let card=doc.querySelector('#cms-seo-card');
 if(!card){
  const old=doc.querySelector('.card-seo .seo_focus_keyword')?.closest('.card-seo') || doc.querySelector('.card-seo');
  card=old?.closest('.card.mb-4')||old?.closest('.col-12')||old?.parentElement;
 }
 if(!card)return;card.id='cms-seo-card';
 const sourceNames={
  'dataSeo[titlevi]':'seoTitle','dataSeo[keywordsvi]':'seoKeywords',
  'dataSeo[descriptionvi]':'seoDescription','dataSeo[seo_focusvi]':'focusKeyword'
 };
 for(const [name,key] of Object.entries(sourceNames)){
  const field=Array.from(card.querySelectorAll('[name]')).find(el=>el.name===name);
  if(field){field.dataset.cmsKey=key;field.value=String(values[key]??'');}
 }
 const focus=card.querySelector('[data-cms-key="focusKeyword"]');
 const vi=card.querySelector('#tabs-seolang-vi');
 if(focus&&vi){
  const group=focus.closest('.form-group');
  if(group&&!vi.contains(group))vi.append(group);
 }
 const pane=card.querySelector('#tabs-seolang-nangcao');
 const advancedTab=card.querySelector('[data-bs-target="#tabs-seolang-nangcao"]');
 if(advancedTab)advancedTab.textContent='Phân tích & đánh giá SEO';
 let checklist=card.querySelector('.seo-checklist');
 if(!checklist&&pane){checklist=doc.createElement('ul');checklist.className='seo-checklist';pane.append(checklist)}
 if(checklist)checklist.id='cms-seo-checklist';
 if(pane&&!card.querySelector('#tabs-seolang-robots')){
  const advanced=makeElem(doc,`<div class="tab-pane fade" id="tabs-seolang-robots" role="tabpanel"><div class="p-3"><h5>Robots Meta</h5><div class="d-flex flex-wrap gap-4 mb-3"><label class="form-label">Lập chỉ mục<select class="form-select" data-cms-robot="index"><option value="index">Index</option><option value="noindex">No Index</option></select></label><label class="form-label">Theo liên kết<select class="form-select" data-cms-robot="follow"><option value="follow">Follow</option><option value="nofollow">No Follow</option></select></label></div><div class="d-flex flex-wrap gap-3"><label><input type="checkbox" data-cms-robot="noarchive"> No Archive</label><label><input type="checkbox" data-cms-robot="noimageindex"> No Image Index</label><label><input type="checkbox" data-cms-robot="nosnippet"> No Snippet</label></div><p class="text-muted mt-3">Chỉ dẫn robots được lưu và xuất thành meta robots trên trang công khai.</p></div></div>`);
  pane.parentElement.append(advanced);
  const link=doc.createElement('a');link.className='nav-link';link.href='#tabs-seolang-robots';link.dataset.bsToggle='tab';link.dataset.bsTarget='#tabs-seolang-robots';link.setAttribute('role','tab');link.textContent='Nâng cao';
  const li=doc.createElement('li');li.className='nav-item';li.append(link);advancedTab?.closest('.nav-tabs')?.append(li);
 }
 const robots=String(values.robots||values.metaRobots||'index,follow').toLowerCase().split(',').map(x=>x.trim());
 for(const field of card.querySelectorAll('[data-cms-robot]')){
  const key=field.dataset.cmsRobot;
  if(field.tagName==='SELECT')field.value=key==='index'?(robots.includes('noindex')?'noindex':'index'):(robots.includes('nofollow')?'nofollow':'follow');
  else field.checked=robots.includes(key);
 }
 let input=form.querySelector('input[data-cms-key="robots"]');
 if(!input){input=doc.createElement('input');input.type='hidden';input.dataset.cmsKey='robots';form.append(input)}
 input.value=robots.join(',');
 syncSeoCounters(doc,values);renderSeoChecklist(doc,values);
}
function syncRobots(doc){
 const form=doc.querySelector('form');if(!form)return;
 const values=Array.from(form.querySelectorAll('[data-cms-robot]')).filter(el=>el.tagName==='SELECT'||el.checked).map(el=>el.tagName==='SELECT'?el.value:el.dataset.cmsRobot);
 const target=form.querySelector('input[data-cms-key="robots"]');if(target){target.value=values.join(',');target.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}))}
}
function ensureSchemaCard(doc,values){
 // The Schema JSON card exists in the archived form template. Add it when a
 // template variant does not ship one.
 if(doc.querySelector('[data-cms-key="schemaJson"]'))return;
 const form=doc.querySelector('form.validation-form')||doc.querySelector('form');if(!form)return;
 const card=makeElem(doc,`<div class="col-12 col-lg-12"><div class="card mb-4"><div class="card-header flex items-center justify-between"><h3 class="card-title flex-1">Schema JSON <a href="https://developers.google.com/search/docs/advanced/structured-data/search-gallery" target="_blank" rel="noopener noreferrer">Tài liệu tham khảo</a></h3></div><div class="card-body"><div class="card-seo"><div class="card card-primary card-outline card-outline-tabs"><div class="card-header p-0 border-bottom-0"><ul class="nav nav-tabs" role="tablist"><li class="nav-item"><a class="nav-link active" data-bs-toggle="pill" data-bs-target="#tabs-schemalang-vi" role="tab" aria-controls="tabs-schemalang-vi" aria-selected="true">Schema JSON (Tiếng Việt)</a></li></ul></div><div class=""><div class="tab-content"><div class="tab-pane fade show active" id="tabs-schemalang-vi" role="tabpanel"><div class="form-group mb-0"><textarea class="form-control schema-seo code-javascript" data-cms-key="schemaJson" rows="15" placeholder="Nội dung schema"></textarea></div></div></div></div></div></div></div></div>`);
 const input=card.querySelector('[data-cms-key="schemaJson"]');if(input)input.value=String(values.schemaJson||'');
 const row=card.parentElement;if(row&&row.classList.contains('row'))row.appendChild(card);else form.appendChild(card);
}
function ensureSlugBlock(doc,values){
 // "Đường dẫn" card of the original news form. The source template already
 // ships it (sample URL + latin note + slug input), so it is REUSED instead of
 // being injected a second time. The sample URL comes from the real site
 // domain - it is a hint only, never stored data.
 const form=doc.querySelector('form.validation-form')||doc.querySelector('form');if(!form)return;
 let card=doc.querySelector('#cms-slug-card');
 if(!card){
  const existing=form.querySelector('.card-slug');
  if(existing)card=existing.closest('.card')||existing;
 }
 if(!card){
  card=makeElem(doc,`<div class="card card-primary card-outline text-sm mb-4" id="cms-slug-card"><div class="card-header d-flex"><h3 class="card-title">Đường dẫn</h3><span class="ms-2 text-danger">(Vui lòng không nhập trùng tiêu đề)</span></div><div class="card-body card-slug"><div class="card card-primary card-outline card-outline-tabs"><div class="card-header p-0 border-bottom-0"><ul class="nav nav-tabs" role="tablist"><li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabs-sluglang-vi" role="tab" aria-controls="tabs-sluglang-vi" aria-selected="true">Tiếng Việt</a></li></ul></div><div class=""><div class="tab-content"><div class="tab-pane fade show active" id="tabs-sluglang-vi" role="tabpanel"><div class="form-gourp mb-0"><label class="d-block form-label">Đường dẫn mẫu (vi):<span class="mx-2 font-weight-normal" id="slugurlpreviewvi">https://mihousespa.com/<strong class="text-main"></strong></span></label><p class="note-slug">Chú ý: Đường dẫn phải là chữ latin</p><input type="text" class="form-control slug-input no-validate text-sm" name="slugvi" id="slugvi" data-cms-key="slug" placeholder="Đường dẫn (vi)" value="" required><input type="hidden" id="slug-defaultvi" value=""><p class="alert-slugvi text-danger d-none mt-2 mb-0" id="alert-slug-dangervi"><i class="fas fa-exclamation-triangle mr-1"></i><span>Đường dẫn đã tồn tại, vui lòng nhập đường dẫn khác.</span></p><p class="alert-slugvi text-success d-none mt-2 mb-0" id="alert-slug-successvi"><i class="fas fa-check-circle mr-1"></i><span>Đường dẫn hợp lệ.</span></p></div></div></div></div></div></div></div>`);
  const anchor=form?.querySelector('.col-12.col-lg-8');
  if(anchor)anchor.insertBefore(card,anchor.firstChild);else form?.prepend(card);
 }
 const input=card.querySelector('[data-cms-key="slug"]')||card.querySelector('#slugvi');
 if(input){input.dataset.cmsKey='slug';input.value=String(values.slug||'')}
}
function sanitizeEditorHtml(doc,html){
 const parsed=new doc.defaultView.DOMParser().parseFromString(String(html||''),'text/html');
 parsed.querySelectorAll('script,iframe,object,embed,form,base,link,meta,style,svg,math').forEach(el=>el.remove());
 parsed.body.querySelectorAll('*').forEach(el=>{
  for(const a of Array.from(el.attributes)){
   const key=a.name.toLowerCase(),v=a.value.trim();
   if(key.startsWith('on')||['srcdoc','formaction','contenteditable'].includes(key))el.removeAttribute(a.name);
   else if(['href','src'].includes(key)&&!(/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(v)))el.removeAttribute(a.name);
   else if(key==='style'&&/(url\s*\(|expression\s*\(|@import|behavior\s*:)/i.test(v))el.removeAttribute(a.name);
  }
 });
 return parsed.body.innerHTML;
}
function mountRichEditor(doc,textarea){
 if(textarea.closest('.cms-rich-host'))return;
 const box=doc.createElement('div');box.className='cms-rich-host';
 const toolbar=doc.createElement('div');toolbar.className='cms-rich-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Định dạng nội dung');
 const commands=[['bold','B'],['italic','I'],['underline','U'],['insertUnorderedList','• List'],['insertOrderedList','1. List'],['justifyLeft','Trái'],['justifyCenter','Giữa'],['justifyRight','Phải'],['createLink','Liên kết'],['insertImage','Ảnh'],['insertTable','Bảng'],['removeFormat','Xóa định dạng']];
 for(const [key,label] of commands){const button=doc.createElement('button');button.type='button';button.className='btn btn-sm btn-outline-secondary';button.dataset.cmsRich=key;button.textContent=label;toolbar.append(button)}
 for(const [key,items] of [['formatBlock',[['p','Đoạn'],...Array.from({length:6},(_,i)=>['h'+(i+1),'H'+(i+1)])]],['fontName',[['Arial','Arial'],['Georgia','Georgia'],['Times New Roman','Times'],['Verdana','Verdana'],['Tahoma','Tahoma']]],['fontSize',[['2','Nhỏ'],['3','Vừa'],['4','Lớn'],['5','Rất lớn']]]]){
  const select=doc.createElement('select');select.className='form-select form-select-sm';select.dataset.cmsRichSelect=key;select.setAttribute('aria-label',key);for(const [v,label] of items){const opt=doc.createElement('option');opt.value=v;opt.textContent=label;select.append(opt)}toolbar.append(select);
 }
 for(const [key,label,value] of [['foreColor','Màu chữ','#333333'],['hiliteColor','Màu nền','#ffffff']]){const wrap=doc.createElement('label');wrap.className='cms-color-control';wrap.textContent=label;const input=doc.createElement('input');input.type='color';input.dataset.cmsRichColor=key;input.value=value;wrap.append(input);toolbar.append(wrap)}
 const source=doc.createElement('button');source.type='button';source.className='btn btn-sm btn-outline-primary';source.dataset.cmsRich='toggle-source';source.textContent='HTML Source';toolbar.append(source);
 const visual=doc.createElement('div');visual.className='cms-rich-editable';visual.setAttribute('contenteditable','true');visual.dataset.cmsRichEditable='1';visual.setAttribute('role','textbox');visual.setAttribute('aria-multiline','true');visual.setAttribute('aria-label','Nội dung (vi)');visual.innerHTML=sanitizeEditorHtml(doc,textarea.value);
 textarea.classList.add('cms-rich-source');textarea.setAttribute('aria-label','HTML Source (vi)');textarea.hidden=true;
 textarea.parentElement.insertBefore(box,textarea);box.append(toolbar,visual,textarea);
}
function richEditorAction(doc,key,control){
 const host=control.closest('.cms-rich-host');if(!host)return;
 const visual=host.querySelector('[data-cms-rich-editable]'),source=host.querySelector('textarea[data-cms-key="body"]');if(!visual||!source)return;
 if(key==='toggle-source'){
  const htmlMode=!host.classList.contains('cms-html-mode');
  if(htmlMode){source.value=sanitizeEditorHtml(doc,visual.innerHTML);source.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}))}
  else{visual.innerHTML=sanitizeEditorHtml(doc,source.value);source.value=visual.innerHTML;source.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}))}
  host.classList.toggle('cms-html-mode',htmlMode);return;
 }
 if(host.classList.contains('cms-html-mode'))return;
 visual.focus();
 if(key==='insertTable'){doc.execCommand('insertHTML',false,'<table border="1"><tbody><tr><td>Ô 1</td><td>Ô 2</td></tr><tr><td>Ô 3</td><td>Ô 4</td></tr></tbody></table>')}
 else if(key==='createLink'||key==='insertImage'){
  const url=window.prompt(key==='createLink'?'Nhập liên kết (https://...)':'Nhập URL hình ảnh (https://...)','https://');
  if(url&&/^(https?:\/\/|\/(?!\/))/i.test(url))doc.execCommand(key,false,url);
 }else doc.execCommand(key,false,control.value||null);
 source.value=sanitizeEditorHtml(doc,visual.innerHTML);source.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
}
function ensurePhotoDimension(doc,text){
 doc.querySelectorAll('.photoUpload-dimension,.view-size').forEach(hint=>{hint.textContent=text});
}
function fillForm(doc,tab,data,route,id,mode){
 const sections=SECTIONS.has(tab);
 const row=tab==='settings'?data.settings:sections?data.sections?.[tab]:listFor(data,tab).find(x=>String(x.id)===String(id));
 const values={...(tab==='contact'?data.settings:{}),...(row||{})};
 const form=doc.querySelector('form.validation-form')||doc.querySelector('form');if(!form)return;
 // Never attach save actions to the form: delegated closest('[data-cms-act]')
 // would treat EVERY click inside it as an explicit save.
 form.removeAttribute('data-cms-act');form.noValidate=true;
 const richEditor=form.querySelector('textarea[name="data[contentvi]"]');if(richEditor){richEditor.style.minHeight='280px';richEditor.setAttribute('aria-label','Nội dung HTML');}
 const common={'dataSeo[titlevi]':'seoTitle','dataSeo[keywordsvi]':'seoKeywords','dataSeo[descriptionvi]':'seoDescription','dataSeo[seo_focusvi]':'focusKeyword','data[namevi]':'title','data[descvi]':'description','data[contentvi]':'body','data[link]':'href','data[numb]':'order','status[is_show]':'status','status[noibat]':'featured','data[date_publish]':'publishedAt','dataSchema[schemavi]':'schemaJson','slugvi':'slug'};
 if(tab==='settings')Object.assign(common,{'data[namevi]':'brand','data[addressvi]':'address','data[options][email]':'email','data[options][hotline]':'phone','data[options][phone]':'phone','data[options][zalo]':'contactLink','data[options][website]':'website','data[options][fanpage]':'facebook','data[options][link_googlemaps]':'maps','data[options][coords_iframe]':'mapEmbed'});
 for(const el of doc.querySelectorAll('input[name],textarea[name],select[name]')){
  const key=common[el.name];if(!key)continue;el.dataset.cmsKey=key;
  if(el.type==='checkbox')el.checked=key==='featured'?Boolean(values[key]):values[key]!=='draft';
  else if(el.type!=='file'&&el.type!=='radio')el.value=String(values[key]??'');
 }
 if(richEditor&&RICH_EDITOR_TABS.has(tab))mountRichEditor(doc,richEditor);
 const fieldHost=form.querySelector('.card-article .card-body')||form.querySelector('.card-article')||form.querySelector('.card-body')||form;
 // Source PHP template layout and classes are retained. New fields are inserted
 // into the SAME card structure; no unrelated SEO dashboard is copied.
 const existingKey=key=>Boolean(form.querySelector(`[data-cms-key="${key}"]`));
 const extra=doc.createElement('div');extra.className='card source-business-extra mt-3';
 const head=doc.createElement('div');head.className='card-header';head.innerHTML='<h5 class="card-title mb-0">Thông tin bổ sung</h5>';
 const body=doc.createElement('div');body.className='card-body';
 const add=(key,label,type='text',desc='')=>{if(!existingKey(key))body.append(formField(doc,key,label,values[key]||'',type,desc))};
 if(tab==='settings'){
  for(const [key,label,kind] of [['logo','Logo'],['favicon','Favicon'],['bookingLink','Link đặt lịch'],['contactLink','Link liên hệ'],['mapEmbed','Mã nhúng Google Maps (iframe)'],['tiktok','Link TikTok'],['description','Mô tả'],['website','Tên miền']]){
    add(key,label);if(['logo','favicon'].includes(key)){
     const field=body.querySelector(`[data-cms-key="${key}"]`);if(field){const choose=doc.createElement('button');choose.className='btn btn-outline-secondary mt-2';choose.type='button';choose.dataset.cmsAct='pick-setting-media';choose.textContent='Chọn hình từ thư viện Cloudinary';field.closest('.source-business-field')?.append(choose)}
    }
   }
 }else{
  // Tin tức / Đào tạo / Dịch vụ dùng chung một mẫu: Đường dẫn + Thông tin +
  // Ảnh đại diện + Trạng thái + Nội dung seo + Schema JSON.
  if(NEWS_TABS.has(tab)){
   ensureSlugBlock(doc,values);
   // The source template carries a "Danh mục" card bound to the PHP news
   // categories. Mi House Spa groups articles by menu, so the card would show
   // an empty selector. It is removed instead of showing a dead field.
   doc.querySelectorAll('.form-group-category').forEach(node=>node.remove());
  }
  if(!existingKey('slug')&&!SECTIONS.has(tab)&&!PLAIN_TABS.has(tab))add('slug','Đường dẫn (vi)','text','Chỉ dùng chữ Latin không dấu, số và dấu gạch ngang; không nhập trùng.');
  if(tab==='albumPhotos'){
   const box=formField(doc,'categoryId','Danh mục cấp 1');const old=box.querySelector('input');const select=doc.createElement('select');select.dataset.cmsKey='categoryId';select.className='form-select';
   for(const c of data.albumCategories||[]){const option=doc.createElement('option');option.value=c.id;option.textContent=c.title;option.selected=c.id===(values.categoryId||'nail');select.append(option)}old.replaceWith(select);body.append(box);
  }
  if(tab==='contact'){
   for(const [key,label] of [['phone','Hotline'],['email','Email'],['address','Địa chỉ'],['website','Link website'],['facebook','Link Facebook'],['maps','Link Google Maps'],['contactLink','Link liên hệ / Zalo'],['bookingLink','Link đặt lịch']])add(key,label);
  }
  if(tab==='intro'){
   add('homeSubtitle','Tiêu đề nhỏ trang chủ');add('homeTitle','Tiêu đề giới thiệu trang chủ');add('homeBody','Nội dung giới thiệu ở trang chủ','textarea');add('homeImage','Hình trang chủ');
   const homePicture=body.querySelector('[data-cms-key="homeImage"]')?.closest('.source-business-field');if(homePicture){const choose=doc.createElement('button');choose.className='btn btn-outline-secondary mt-2';choose.type='button';choose.dataset.cmsAct='pick-setting-media';choose.textContent='Chọn ảnh trang chủ từ Cloudinary';homePicture.append(choose);}
  }
  if(tab==='videos')add('video','Link video Cloudinary');
  // "Alt photo" belongs to the image block of the source form, not to an
  // extra card. It is only added as a fallback when the form has no image.
  if(!form.querySelector('.photoUpload-zone'))add('alt','Alt photo');
  // Mẫu gallery dùng chung cho Slideshow / Video / Bảng giá / Album:
  // đổi tiêu đề khối theo đúng mục đang mở.
  const galleryTitle=form.querySelector('.card-header .card-title');
  if(galleryTitle){
   const label={slides:'Thông tin Slideshow',videos:'Thông tin Video',menu:'Thông tin Bảng giá dịch vụ',albumCategories:'Thông tin Danh mục album cấp 1',albumPhotos:'Thông tin Hình ảnh album'}[tab];
   if(label)galleryTitle.textContent=label;
  }
  if(!SECTIONS.has(tab)&&!PLAIN_TABS.has(tab)){
   add('status','Trạng thái');add('featured','Nổi bật','checkbox');add('order','Số thứ tự','number');add('publishedAt','Ngày hiển thị','datetime-local');
  }
  if(tab==='albumCategories'){add('order','Số thứ tự','number');}
  if(!PLAIN_TABS.has(tab)){
   // "Nội dung seo" + "Nâng cao" (keyword chính, checklist) + Schema JSON.
   ensureSeoCard(doc,values);
   ensureSchemaCard(doc,values);
  }
 }
 extra.append(head,body);if(body.children.length)fieldHost.append(extra);
 const srcImage=values.image||values.displayImage||'';
 const imageHidden=doc.createElement('input');imageHidden.type='hidden';imageHidden.dataset.cmsKey='image';imageHidden.value=String(srcImage);form.append(imageHidden);
 if(tab==='videos'){const videoHidden=doc.createElement('input');videoHidden.type='hidden';videoHidden.dataset.cmsKey='video';videoHidden.value=String(values.video||'');form.append(videoHidden)}
 if(!SECTIONS.has(tab)&&!existingKey('status')){const check=doc.createElement('input');check.type='hidden';check.dataset.cmsKey='status';check.value=values.status||'published';form.append(check)}
 const image=form.querySelector('.photoUpload-detail img');if(image){image.removeAttribute('onerror');image.src=srcImage||'/admin-source/noimage.png';image.alt=values.alt||values.title||'Hình ảnh'}
 // Alt photo + các nút ảnh của mẫu gốc.
 const altHost=form.querySelector('.photoUpload-zone .photoUpload-detail')?.parentElement;
 if(altHost&&!existingKey('alt')){
  const altBox=formField(doc,'alt','Alt photo',values.alt||'');
  altHost.appendChild(altBox);
 }
 for(const input of form.querySelectorAll('input[type=file]')){input.dataset.cmsAct='file-upload';input.accept='image/*,video/mp4,video/webm,video/quicktime'}
 for(const button of form.querySelectorAll('.js-choose-from-upload')){button.dataset.cmsAct='pick-media';button.type='button'}
 for(const button of form.querySelectorAll('.delete-photo')){button.dataset.cmsAct='clear-photo';button.removeAttribute('id')}
 // Gợi ý kích thước ảnh theo đúng từng mẫu gốc.
 if(tab==='intro')ensurePhotoDimension(doc,'Width: 480 px - Height: 360 px (jpg,gif,png,jpeg,gif,webp)');
 else if(NEWS_TABS.has(tab))ensurePhotoDimension(doc,'Width: 525 px - Height: 730 px (jpg,gif,png,jpeg,gif,webp)');
 else if(tab==='menu')ensurePhotoDimension(doc,'Width: 480 px - Height: 710 px (jpg,gif,png,jpeg,gif,webp)');
 else if(tab==='slides')ensurePhotoDimension(doc,'Width: 1920 px - Height: 830 px (jpg,gif,png,jpeg,gif,webp)');
 else if(tab==='videos')ensurePhotoDimension(doc,'Width: 1080 px - Height: 1920 px (jpg,gif,png,jpeg,gif,webp)');
 else if(tab==='albumPhotos')ensurePhotoDimension(doc,'Width: 800 px - Height: 800 px (jpg,gif,png,jpeg,gif,webp)');
 form.querySelectorAll('button[type=submit]').forEach(btn=>btn.dataset.cmsAct='save-form');
 doc.querySelectorAll('.btn-header a').forEach(link=>{link.href='#';link.dataset.cmsAct='cancel-form'});
 const title=doc.querySelector('.container-p-y h4');if(title)title.textContent=(mode==='create'?'Thêm mới ':'Chỉnh sửa ')+(TABS[tab]||tab);
 enhanceIcons(doc);
}
// Admin route is URL-backed so reloading /admin never unexpectedly resets to Giới thiệu.
function adminScreenFromUrl(){
 const params=new URLSearchParams(window.location.search);
 const tab=params.get('module')||'intro';
 const safeTab=TABS[tab]?tab:'intro';
 const asked=params.get('mode')||'list';
 const mode=safeTab==='settings'||SECTIONS.has(safeTab)?'edit':asked==='edit'||asked==='create'?'edit':'list';
 const editId=params.get('id')||null;
 return {tab:safeTab,mode:mode==='edit'&&!editId&&asked!=='create'&&!SECTIONS.has(safeTab)&&safeTab!=='settings'?'list':mode,route:'/',editId,newItem:asked==='create',newId:asked==='create'?uuid():undefined};
}
function adminScreenUrl(screen){
 const url=new URL(window.location.href);
 url.pathname='/admin';url.search='';
 url.searchParams.set('module',screen.tab);
 if(screen.newItem)url.searchParams.set('mode','create');
 else if(screen.mode==='edit'&&!SECTIONS.has(screen.tab)&&screen.tab!=='settings'){
  url.searchParams.set('mode','edit');if(screen.editId)url.searchParams.set('id',screen.editId);
 }
 return url.pathname+url.search;
}
export default function SourceAdmin(){
 const [loading,setLoading]=useState(true),[authorized,setAuthorized]=useState(false);
 const [state,setState]=useState(EMPTY),[screen,setScreen]=useState(adminScreenFromUrl);
 const [revisionToken,setRevisionToken]=useState(0),[message,setMessage]=useState('');
 const frame=useRef(null),dataRef=useRef(EMPTY),screenRef=useRef(screen),queryRef=useRef(''),pageRef=useRef(1),selectedRef=useRef(new Set());
 const replacingRef=useRef(''),pendingFieldRef=useRef(null),pendingFileRef=useRef(null),uploadedDraftRef=useRef(null),busyRef=useRef(false),savingFormRef=useRef(false),noticeTimer=useRef(null),mediaKindRef=useRef('image'),mediaPageRef=useRef(1);
 const mediaLibraryRef=useRef({image:null,video:null}),mediaCursorsRef=useRef({image:[''],video:['']});
 useEffect(()=>{screenRef.current=screen},[screen]);
 useEffect(()=>{dataRef.current=state},[state]);
 function inform(text){setMessage(text);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setMessage(''),6000)}
 function navigate(tab,mode='list',route,editId,options={}){
  if(tab==='logout'){logout();return false}
  if(!TABS[tab]){inform('Mục này không có trong CMS Mi House Spa');return false}
  const existing=frame.current?.contentDocument?.querySelector('form[data-cms-changed="1"]');
  if(!options.skipUnsaved && existing && !window.confirm('Biểu mẫu có thay đổi chưa lưu. Bạn muốn rời trang và bỏ thay đổi?'))return false;
  queryRef.current='';pageRef.current=1;selectedRef.current=new Set();pendingFileRef.current=null;uploadedDraftRef.current=null;
  const next={tab,mode:tab==='settings'||SECTIONS.has(tab)?'edit':mode==='create'||mode==='edit'?'edit':mode,route:route??'/',editId:editId||null,newItem:mode==='create',newId:mode==='create'?uuid():undefined};
  screenRef.current=next;setScreen(next);
  if(!options.fromHistory){const url=adminScreenUrl(next);if(location.pathname+location.search!==url)window.history.pushState({admin:true},'',url)}
  const f=frame.current;f?.contentDocument?.documentElement?.classList?.remove('layout-menu-expanded');if(f?.contentWindow)f.contentWindow.scrollTo({top:0,behavior:'instant'});
  return true;
 }
 async function refresh(){const [data,session]=await Promise.all([api('/api/admin/state'),api('/api/admin/session')]);setState(data);dataRef.current=data;return session}
 const connect=useCallback(async()=>{try{await api('/api/admin/session');const d=await api('/api/admin/state');setAuthorized(true);dataRef.current=d;setState(d)}catch{setAuthorized(false)}finally{setLoading(false)}},[]);
 useEffect(()=>{connect();return()=>clearTimeout(noticeTimer.current)},[connect]);
 useEffect(()=>{
  const pop=()=>{
   const next=adminScreenFromUrl();
   const existing=frame.current?.contentDocument?.querySelector('form[data-cms-changed="1"]');
   if(existing&&!window.confirm('Biểu mẫu có thay đổi chưa lưu. Rời trang?')){
    history.pushState({admin:true},'',adminScreenUrl(screenRef.current));return;
   }
   screenRef.current=next;setScreen(next);queryRef.current='';selectedRef.current.clear();pageRef.current=1;pendingFileRef.current=null;uploadedDraftRef.current=null;
  };
  window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);
 },[]);
 useEffect(()=>{const fn=e=>{if(screenRef.current.mode==='edit'){const doc=frame.current?.contentDocument;const active=doc?.querySelector('form');if(active?.dataset.cmsChanged==='1'){e.preventDefault();e.returnValue='';}}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn)},[]);
 async function logout(){try{await api('/api/admin/logout','POST')}catch{}setAuthorized(false);setState(EMPTY);dataRef.current=EMPTY;const next=adminScreenFromUrl();screenRef.current=next;setScreen(next)}
 const save=async next=>{
  if(busyRef.current)throw Error('Đang thực hiện một thao tác khác.');
  busyRef.current=true;
  try{
   const response=await api('/api/admin/state','PUT',next);
   const updated={...next,revision:response.revision};dataRef.current=updated;setState(updated);try{localStorage.setItem('mi-house-cms-revision',String(response.revision))}catch{}return updated;
  }finally{busyRef.current=false}
 };
 const updateRow=async(id,fn)=>{
  const tab=screenRef.current.tab;
  const next=structuredClone(dataRef.current);
  const record=listFor(next,tab).find(x=>String(x.id)===String(id));
  if(!record)return;
  saveRecord(next,tab,fn({...record}));await save(next);
 };
 async function deleteRows(ids){
  if(!ids.length||SECTIONS.has(screenRef.current.tab)||screenRef.current.tab==='settings')return;
  const tab=screenRef.current.tab;
  if(tab==='albumCategories'){
   const linked=(dataRef.current.albumItems||[]).filter(item=>ids.map(String).includes(String(item.categoryId))).length
    +(ids.map(String).includes('nail')?(dataRef.current.collections?.nail||[]).length:0)
    +(ids.map(String).includes('space')?(dataRef.current.collections?.space||[]).length:0);
   if(linked){inform(`Không thể xóa danh mục đang chứa ${linked} hình ảnh. Hãy chuyển hình ảnh sang danh mục khác trước.`);return}
  }
  if(!window.confirm(`Xóa ${ids.length} mục khỏi ${TABS[tab]}? File Cloudinary do bản ghi này sở hữu cũng sẽ bị xóa nếu không còn được dùng ở vị trí khác.`))return;
  const next=structuredClone(dataRef.current);
  const removed=ids.map(id=>listFor(next,tab).find(x=>String(x.id)===String(id))).filter(Boolean);
  const removedUrls=[...new Set(removed.flatMap(row=>[row.image,row.full,row.video].filter(Boolean)))];
  deleteRecords(next,tab,ids);
  // Asset do bản ghi sở hữu: xóa nếu không còn tham chiếu, giữ lại nếu dùng chung.
  const stillUsed=removedUrls.filter(url=>JSON.stringify(next).includes(url));
  if(removedUrls.length&&stillUsed.length)inform(`Cảnh báo: ${stillUsed.length} file vẫn đang được dùng ở vị trí khác nên KHÔNG bị xóa trên Cloudinary.`);
  const response=await api('/api/admin/state','PUT',{...next,revision:dataRef.current.revision});
  const updated={...next,revision:response.revision};dataRef.current=updated;setState(updated);
  selectedRef.current.clear();
  inform(response.cloudinaryCleaned?`Đã xóa bản ghi và ${response.cloudinaryCleaned} file Cloudinary không còn được dùng.`:'Đã cập nhật danh sách và dữ liệu công khai');
  renderCurrent(frame.current?.contentDocument);
 }
 async function loadMediaPage(doc,kind='image',page=1){
  if(!doc||screenRef.current.tab!=='media')return;
  const cursors=mediaCursorsRef.current[kind]||[''];const cursor=cursors[page-1];
  if(cursor===undefined)return;
  mediaLibraryRef.current[kind]={kind,loading:true,loaded:false,error:null};renderCurrent(doc);
  try{
   const result=await api(`/api/admin/media-library?type=${encodeURIComponent(kind)}&cursor=${encodeURIComponent(cursor)}`);
   if(screenRef.current.tab!=='media'||kind!==mediaKindRef.current||mediaPageRef.current!==page)return;
   mediaLibraryRef.current[kind]={kind,loaded:true,loading:false,error:null,items:result.items||[],nextCursor:result.nextCursor||null};
   mediaCursorsRef.current[kind]=cursors.slice(0,page);
   if(result.nextCursor)mediaCursorsRef.current[kind][page]=result.nextCursor;
  }catch(error){
   if(kind!==mediaKindRef.current)return;
   mediaLibraryRef.current[kind]={kind,loaded:false,loading:false,error:error.message};
  }
  renderCurrent(frame.current?.contentDocument);
 }
 async function uploadFile(file,replaceId=''){
  if(!file)return;
  if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)&&!/^video\/(mp4|webm|quicktime)$/.test(file.type))throw Error('Chỉ chấp nhận JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV.');
  if(file.size>100*1024*1024)throw Error('Giới hạn 100 MB cho mỗi file');
  // Signed direct browser -> Cloudinary upload avoids Vercel's request-body limit.
  const signed=await api('/api/admin/media-sign','POST',{filename:file.name,size:file.size});
  const payload=new FormData();payload.set('file',file);payload.set('api_key',signed.apiKey);
  payload.set('timestamp',String(signed.timestamp));payload.set('public_id',signed.publicId);payload.set('signature',signed.signature);
  const uploaded=await fetch(signed.uploadUrl,{method:'POST',body:payload});
  const cloud=await uploaded.json().catch(()=>({}));
  if(!uploaded.ok||!cloud.public_id)throw Error(cloud.error?.message||'Cloudinary upload thất bại');
  // The server independently verifies the new asset via Cloudinary Admin API.
  let result;
  for(let attempt=0;attempt<3;attempt++){
   try{result=await api('/api/admin/media-register','POST',{publicId:cloud.public_id,resourceType:cloud.resource_type,replaceId,filename:file.name});break;}
   catch(error){if(attempt===2||!error.message.includes('Dữ liệu thay đổi'))throw error;}
  }
  await refresh();inform(replaceId?'Đã thay ảnh/video trên Cloudinary và cập nhật URL':'Đã tải ảnh/video lên Cloudinary');
  if(screenRef.current.tab==='media'){
   mediaCursorsRef.current={image:[''],video:['']};mediaLibraryRef.current={image:null,video:null};
   mediaPageRef.current=1;
   await loadMediaPage(frame.current?.contentDocument,mediaKindRef.current,1);
  }
  return result;
 }
 const openMediaPicker=doc=>{
  doc.getElementById('source-admin-picker')?.remove();
  const overlay=makeElem(doc,`<div class="modal fade show" id="source-admin-picker" role="dialog" aria-modal="true" style="display:block;background:#0007"><div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Thư viện Cloudinary</h5><button type="button" class="btn-close" data-cms-act="close-picker" aria-label="Đóng"></button></div><div class="modal-body"><div class="source-grid" id="source-picker-grid"></div></div><div class="modal-footer"><button class="btn btn-secondary" data-cms-act="upload-from-form">Tải lên Cloudinary</button><button class="btn btn-outline-secondary" data-cms-act="close-picker">Đóng</button></div></div></div></div>`);
  const grid=overlay.querySelector('#source-picker-grid');
  for(const m of dataRef.current.media||[]){const b=makeElem(doc,'<button type="button" class="btn btn-outline-light source-picker-item" data-cms-act="select-media"><div class="source-grid-media"></div><small></small></button>');b.dataset.mediaUrl=m.url;const img=doc.createElement(m.resourceType==='video'?'video':'img');img.src=m.url;img.loading='lazy';if(m.resourceType==='video')img.muted=true;b.querySelector('.source-grid-media').appendChild(img);b.querySelector('small').textContent=m.name||m.publicId;grid.appendChild(b)}
  doc.body.appendChild(overlay);
 };
 const saveForm=async(doc,button)=>{
  if(!doc||busyRef.current||savingFormRef.current)return;
  if(!button?.matches?.('button[type=submit],input[type=submit],button[data-cms-save=true]'))return;
  savingFormRef.current=true;
  try{
  const screen=screenRef.current,tab=screen.tab;
  const fieldValues={};
  // Uploaded media is stored in Cloudinary BEFORE writing CMS references.
  if(pendingFileRef.current){
   const file=pendingFileRef.current;
   // Successful upload is cached until CMS save succeeds. A failed PUT must
   // not discard the image or upload another duplicate on retry.
   let asset=uploadedDraftRef.current?.file===file?uploadedDraftRef.current.asset:null;
   if(!asset){asset=await uploadFile(file);uploadedDraftRef.current={file,asset};}
   if(asset)fieldValues[file.type.startsWith('video/')?'video':'image']=asset.url;
  }
  for(const input of doc.querySelectorAll('form [data-cms-key]')){
   const key=input.dataset.cmsKey;if(!key||key in fieldValues)continue;
   if(input.type==='checkbox')fieldValues[key]=key==='featured'?input.checked:(input.checked?'published':'draft');
   else fieldValues[key]=input.value;
  }
  const next=structuredClone(dataRef.current);
  if(tab==='settings'){
   next.settings={...next.settings,...fieldValues};
   // The contact page reads sections.contact first, then settings. Saving the
   // global configuration must not leave a stale copy on the contact page.
   const contactKeys=['phone','email','address','website','facebook','maps','contactLink','bookingLink'];
   const touched=contactKeys.filter(key=>key in fieldValues);
   if(touched.length&&next.sections?.contact){
    next.sections.contact={...next.sections.contact};
    for(const key of touched)next.sections.contact[key]=fieldValues[key];
   }
   await save(next);
   pendingFileRef.current=null;uploadedDraftRef.current=null;
   inform('Đã lưu cấu hình chung');doc.querySelector('form')?.removeAttribute('data-cms-changed');if(button?.value==='out')navigate('intro','edit',undefined,undefined,{skipUnsaved:true});return;
  }
  if(SECTIONS.has(tab)){
   if(tab==='contact'){for(const key of ['phone','email','address','website','facebook','maps','contactLink','bookingLink'])if(key in fieldValues)next.settings[key]=fieldValues[key];}
   next.sections ||= {};
   next.sections[tab]={...(next.sections[tab]||{}),...fieldValues,updated:true};
   await save(next);pendingFileRef.current=null;uploadedDraftRef.current=null;doc.querySelector('form')?.removeAttribute('data-cms-changed');inform('Đã lưu nội dung '+TABS[tab]);return;
  }
  const records=listFor(next,tab);
  let item=screen.newItem?null:records.find(x=>String(x.id)===String(screen.editId));
  item=item?{...item}:{id:screen.newId||uuid(),status:'published',createdAt:new Date().toISOString()};
  const oldBody=item.body,oldImage=item.image;
  Object.assign(item,fieldValues);
  if('body' in fieldValues && fieldValues.body!==oldBody)item.bodyEdited=true;
  if('image' in fieldValues && fieldValues.image!==oldImage){item.imageEdited=true;if(tab==='menu')item.full=fieldValues.image;}
  if(item.status!=='draft')item.status='published';
  if(NEWS_TABS.has(tab)){
   item.slug=slugify(item.slug||item.title);
   if(!item.slug)throw Error('Đường dẫn không hợp lệ: cần chữ Latin, số và dấu gạch ngang.');
   const conflict=records.some(x=>String(x.id)!==String(item.id)&&x.slug===item.slug&&!x.deleted);
   if(conflict)throw Error('Đường dẫn đã tồn tại trong danh mục. Hãy nhập đường dẫn khác.');
   if('focusKeyword' in fieldValues)item.focusKeyword=fieldValues.focusKeyword.slice(0,FOCUS_KEYWORD_LIMIT);
  }
  if(tab==='albumPhotos'){
   item.categoryId=item.categoryId||next.albumCategories?.[0]?.id;
   if(!(next.albumCategories||[]).some(x=>x.id===item.categoryId))throw Error('Hãy chọn danh mục album hợp lệ.');
  }
  if(tab==='albumCategories')item.slug=item.slug||slugify(item.title);
  if(NEWS_TABS.has(tab)&&!item.sourceRoute){
   item.sourceRoute=''; // dynamically created routes are derived from /tin-tuc/, /dao-tao/, /dich-vu/
  }
  saveRecord(next,tab,item);
  await save(next);pendingFileRef.current=null;uploadedDraftRef.current=null;doc.querySelector('form')?.removeAttribute('data-cms-changed');inform('Đã lưu thành công: '+(item.title||TABS[tab]));
  if(button?.value==='in')navigate(tab,'edit',screen.route,item.id,{skipUnsaved:true});
  else navigate(tab,'list',undefined,undefined,{skipUnsaved:true});
  }finally{savingFormRef.current=false;}
 };
 const onClick=async(evt)=>{
  const doc=frame.current?.contentDocument;if(!doc)return;
  const actionEl=evt.target.closest?.('[data-cms-act]');const act=actionEl?.dataset.cmsAct;
  const src=evt.target.closest?.('[data-cms-original-path]');
  const navToggle=evt.target.closest?.('.menu-toggle,.menu-title');
  try{
   const rich=evt.target.closest?.('[data-cms-rich]');if(rich){evt.preventDefault();richEditorAction(doc,rich.dataset.cmsRich,rich);return;}
   if(evt.target.closest('.toggle-password')){evt.preventDefault();const input=doc.querySelector('#password');if(input)input.type=input.type==='password'?'text':'password';return}
   // The admin templates use Bootstrap tabs ("SEO (Tiếng Việt)" / "Nâng cao"),
   // but the archived iframe does not ship Bootstrap JS. Switch the panes by
   // hand so the tabs never fall through as a navigation.
   const tabLink=evt.target.closest?.('[data-bs-toggle="tab"],[data-bs-toggle="pill"]');
   if(tabLink){
    evt.preventDefault();
    const target=tabLink.getAttribute('data-bs-target')||tabLink.getAttribute('href');
    if(!target||!target.startsWith('#'))return;
    const pane=doc.querySelector(target);if(!pane)return;
    const tabList=tabLink.closest('.nav-tabs,.nav-pills');
    if(tabList){
     for(const link of tabList.querySelectorAll('[data-bs-toggle="tab"],[data-bs-toggle="pill"]')){
      const on=link===tabLink;
      link.classList.toggle('active',on);link.setAttribute('aria-selected',on?'true':'false');
     }
    }
    const paneGroup=pane.parentElement;
    if(paneGroup){
     for(const sibling of paneGroup.children){
      if(!sibling.classList.contains('tab-pane')&&!sibling.classList.contains('active'))continue;
      sibling.classList.remove('show','active');
     }
    }
    pane.classList.add('show','active');
    pane.classList.remove('fade');
    return;
   }
   if(evt.target.closest('button[type=reset]')){evt.preventDefault();pendingFileRef.current=null;uploadedDraftRef.current=null;const s=screenRef.current;if(s.mode==='edit')fillForm(doc,s.tab,dataRef.current,s.route,s.editId,s.newItem?'create':'edit');inform('Đã khôi phục dữ liệu của biểu mẫu');return}
   if(evt.target.closest('.search-toggler')){
    evt.preventDefault();const pane=doc.querySelector('.navbar-search-wrapper.search-input-wrapper');if(pane){pane.classList.toggle('d-none');if(!pane.classList.contains('d-none'))pane.querySelector('input.search-input')?.focus()};return;
   }
   if(act==='choose-menu'){
    evt.preventDefault();const tab=actionEl.dataset.cmsTab;
    if(tab==='logout'){await logout();return}
    navigate(tab,SECTIONS.has(tab)||tab==='settings'?'edit':'list');return;
   }
   if(act==='toggle-album-group'){evt.preventDefault();const li=actionEl.closest('li.menu-item');li?.classList.toggle('open');actionEl.setAttribute('aria-expanded',String(Boolean(li?.classList.contains('open'))));return}
   if(act==='toggle-group'){
    evt.preventDefault();const header=actionEl.closest('li.menu-header');header?.classList.toggle('open');actionEl.setAttribute('aria-expanded',header?.classList.contains('open')?'true':'false');return;
   }
   if(act==='view-website'){return}
   if(act?.startsWith('system-')){evt.preventDefault();const section=act.slice(7);if(section==='logout')await logout();else if(section==='settings')navigate('settings','edit');else if(section==='media')navigate('media');return}
   const navItem=evt.target.closest('#layout-menu .menu-link.menu-toggle');
   if(navItem){evt.preventDefault();const li=navItem.closest('li.menu-item');li?.classList.toggle('open');navItem.setAttribute('aria-expanded',li?.classList.contains('open')?'true':'false');return}
   if(act==='pick-setting-media'){evt.preventDefault();pendingFieldRef.current=actionEl.closest('.source-business-field')?.querySelector('input[data-cms-key]')?.dataset.cmsKey;openMediaPicker(doc);return}
   if(act==='choose-album-tab'){
    evt.preventDefault();const target=actionEl.dataset.cmsAlbumTab;if(target)navigate(target,'list');return;
   }
   if(act==='create'){evt.preventDefault();navigate(screenRef.current.tab,'create');return}
   if(act==='edit'){evt.preventDefault();const row=evt.target.closest('[data-row-id]');if(row)navigate(screenRef.current.tab,'edit',screenRef.current.route,row.dataset.rowId);return}
   if(act==='cancel-form'){evt.preventDefault();navigate(screenRef.current.tab,'list');return}
   if(act==='delete'){evt.preventDefault();const row=evt.target.closest('[data-row-id]');if(row)await deleteRows([row.dataset.rowId]);return}
   if(act==='duplicate'){
    evt.preventDefault();const row=evt.target.closest('[data-row-id]');
    const tab=screenRef.current.tab,record=listFor(dataRef.current,tab).find(x=>String(x.id)===row?.dataset.rowId);
    if(record&&!SECTIONS.has(tab)){
     const next=structuredClone(dataRef.current);
     const cloned=duplicateRecord(next,tab,record,uuid());
     saveRecord(next,tab,cloned);await save(next);renderCurrent(doc);
     inform(`Đã sao chép chính xác nội dung: ${nameFor(record)}`);
    }return;
   }
   if(act==='toggle-status'){
    evt.preventDefault();const row=evt.target.closest('[data-row-id]');
    if(row){await updateRow(row.dataset.rowId,r=>({...r,status:r.status==='draft'?'published':'draft'}));renderCurrent(doc)}return;
   }
   if(act==='bulk-delete'){evt.preventDefault();await deleteRows([...selectedRef.current]);return}
   if(act==='prev-page'||act==='next-page'){evt.preventDefault();pageRef.current+=act==='prev-page'?-1:1;pageRef.current=Math.min(Math.max(1,Math.ceil(listFor(dataRef.current,screenRef.current.tab).length/10)),Math.max(1,pageRef.current));renderCurrent(doc);return}
   if(act==='pick-media'){evt.preventDefault();openMediaPicker(doc);return}
   if(act==='media-refresh'){evt.preventDefault();mediaCursorsRef.current[mediaKindRef.current]=[''];mediaPageRef.current=1;await loadMediaPage(doc,mediaKindRef.current,1);return;}
   if(act==='media-upload'){evt.preventDefault();doc.getElementById('file-folder')?.click();return;}
   if(act==='media-kind'){evt.preventDefault();mediaKindRef.current=actionEl.dataset.kind==='video'?'video':'image';mediaPageRef.current=1;renderCurrent(doc);await loadMediaPage(doc,mediaKindRef.current,1);return}
   if(act==='media-page'){evt.preventDefault();mediaPageRef.current=Math.max(1,mediaPageRef.current+(actionEl.dataset.direction==='next'?1:-1));renderCurrent(doc);await loadMediaPage(doc,mediaKindRef.current,mediaPageRef.current);return}
   if(act==='clear-photo'){evt.preventDefault();const input=doc.querySelector('input[data-cms-key="image"]');if(input)input.value='';const preview=doc.querySelector('.photoUpload-detail img');if(preview)preview.src='/admin-source/noimage.png';pendingFileRef.current=null;uploadedDraftRef.current=null;doc.querySelector('form')?.setAttribute('data-cms-changed','1');return}
   if(act==='close-picker'){evt.preventDefault();doc.getElementById('source-admin-picker')?.remove();return}
   if(act==='select-media'){evt.preventDefault();const url=actionEl.dataset.mediaUrl;const targetKey=pendingFieldRef.current|| (screenRef.current.tab==='videos'&&/\/video\/upload\//.test(url)?'video':'image');const input=doc.querySelector(`input[data-cms-key="${targetKey}"]`);if(input){input.value=url;input.dispatchEvent(new Event('input',{bubbles:true}));const preview=doc.querySelector('.photoUpload-detail img');if(preview)preview.src=url;pendingFileRef.current=null;uploadedDraftRef.current=null}doc.getElementById('source-admin-picker')?.remove();pendingFieldRef.current=null;return}
   if(act==='upload-from-form'){evt.preventDefault();const input=doc.createElement('input');input.type='file';input.accept='image/*,video/mp4,video/webm,video/quicktime';input.style.display='none';input.onchange=async()=>{try{const m=await uploadFile(input.files?.[0]);if(m){const targetKey=pendingFieldRef.current||(m.resourceType==='video'?'video':'image');const field=doc.querySelector(`input[data-cms-key="${targetKey}"]`);if(field){field.value=m.url;field.dispatchEvent(new Event('input',{bubbles:true}));}const img=doc.querySelector('.photoUpload-detail img');if(img)img.src=m.url;doc.getElementById('source-admin-picker')?.remove();pendingFieldRef.current=null}}catch(e){inform(e.message)}finally{input.remove()}};doc.body.appendChild(input);input.click();return}
   if(act==='delete-media'||act==='replace-media'||act==='copy-media'){
    evt.preventDefault();const card=evt.target.closest('[data-media-id],[data-media-url]');
    const id=card?.dataset.mediaId;const media=(dataRef.current.media||[]).find(m=>m.id===id);
    if(act==='copy-media'){const url=card?.dataset.mediaUrl||media?.url;if(url){await navigator.clipboard?.writeText(url);inform('Đã sao chép URL')}return}
    if(!media)throw Error('Tài nguyên Cloudinary này chưa được đăng ký trong CMS. Không thể thay thế hoặc xóa từ đây.');
    if(act==='delete-media'){if(window.confirm(`Xóa file ${media.name} khỏi Cloudinary?`)){await api('/api/admin/media/'+encodeURIComponent(id),'DELETE');await refresh();mediaCursorsRef.current[mediaKindRef.current]=[''];mediaPageRef.current=1;await loadMediaPage(doc,mediaKindRef.current,1);inform('Đã xóa file Cloudinary')};return}
    const input=doc.createElement('input');input.type='file';input.accept='image/*,video/mp4,video/webm,video/quicktime';input.style.display='none';input.onchange=async()=>{try{await uploadFile(input.files?.[0],id);renderCurrent(doc)}catch(e){inform(e.message)}finally{input.remove()}};doc.body.appendChild(input);input.click();return;
   }
   // Exact source crop toolbar: its zoom / rotate / reset / apply buttons remain in the same DOM.
   const cropControl=evt.target.closest('.photoUpload-zone .cropButton,.photoUpload-zone .crop-popup,.photoUpload-zone .crop-reset,.photoUpload-zone .saveButton,.photoUpload-zone [data-method]');
   if(cropControl){
    evt.preventDefault();const zone=cropControl.closest('.photoUpload-zone');const img=zone?.querySelector('.photoUpload-detail img');
    if(!img||!img.src)throw Error('Hãy chọn ảnh trước khi chỉnh sửa');
    const Cropper=doc.defaultView.Cropper;
    if(!Cropper)throw Error('Không nạp được thư viện Cropper của HTML mẫu');
    if(!zone.__miCropper){try{await img.decode()}catch{}zone.__miCropper=new Cropper(img,{viewMode:1,autoCropArea:1,responsive:true})}
    const cropper=zone.__miCropper;
    const method=cropControl.dataset.method;
    if(method==='zoom'||method==='rotate'){cropper[method](Number(cropControl.dataset.option||0));return}
    if(cropControl.classList.contains('crop-reset')){cropper.reset();return}
    if(cropControl.classList.contains('saveButton')){
      const canvas=cropper.getCroppedCanvas({imageSmoothingEnabled:true,imageSmoothingQuality:'high'});
      if(!canvas)throw Error('Không lấy được ảnh đã cắt');
      const file=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(new File([blob],'mi-house-cropped.png',{type:'image/png'})):reject(Error('Không tạo được ảnh mới')),'image/png'));
      pendingFileRef.current=file;uploadedDraftRef.current=null;const imageUrl=URL.createObjectURL(file);cropper.destroy();zone.__miCropper=null;img.src=imageUrl;doc.querySelector('form')?.setAttribute('data-cms-changed','1');inform('Đã áp dụng chỉnh ảnh. Nhấn Lưu để upload Cloudinary.');return;
    }
    return;
   }
   if(act==='save-form'){evt.preventDefault();
    // The delegation contract is button-only. A form/div/label may never write.
    if(!actionEl?.matches?.('button[type=submit],input[type=submit],button[data-cms-save=true]'))return;
    await saveForm(doc,actionEl);return}

   if(src){evt.preventDefault();inform('Chức năng tham chiếu này chưa được kết nối với module hiện tại.');return}
   if(navToggle&&navToggle.closest('#layout-menu')){evt.preventDefault();const li=navToggle.closest('li');li?.classList.toggle('open');navToggle.setAttribute('aria-expanded',li?.classList.contains('open')?'true':'false');return}
   if(evt.target.closest('#layout-navbar .layout-menu-toggle, #layout-menu .close-left-admin, .layout-overlay')){evt.preventDefault();if(doc.defaultView.innerWidth<1200){const expanded=!doc.documentElement.classList.contains('layout-menu-expanded');doc.documentElement.classList.remove('layout-menu-collapsed');doc.documentElement.classList.toggle('layout-menu-expanded',expanded)}else{doc.documentElement.classList.remove('layout-menu-expanded');doc.documentElement.classList.toggle('layout-menu-collapsed')}return}
   if(evt.target.closest('.btn-filter-toggle')){evt.preventDefault();const panel=doc.querySelector('#filterCategoryCollapse');panel?.classList.toggle('show');return}
   const viewMode=evt.target.closest('[data-view-mode]');if(viewMode){evt.preventDefault();const active=viewMode.dataset.viewMode;doc.querySelector('#view-mode-table')?.classList.toggle('d-none',active!=='table');doc.querySelector('#view-mode-grid')?.classList.toggle('d-none',active!=='grid');doc.querySelectorAll('[data-view-mode]').forEach(b=>b.classList.toggle('active',b.dataset.viewMode===active));return}
   if(evt.target.closest('button.btn-search-action')){evt.preventDefault();renderCurrent(doc);return}
   if(evt.target.closest('.navbar-nav-right .dropdown-toggle')){
     evt.preventDefault();const parent=evt.target.closest('.dropdown');const menu=parent?.querySelector('.dropdown-menu');
     doc.querySelectorAll('.navbar-nav-right .dropdown-menu.show').forEach(m=>{if(m!==menu)m.classList.remove('show')});
     menu?.classList.toggle('show');return;
   }
   if(evt.target.closest('a[href="#"],button[type="button"]')){evt.preventDefault()}
  }catch(error){inform('Lỗi: '+error.message)}
 };
 const onChange=async(evt)=>{
  const doc=frame.current?.contentDocument;if(!doc)return;
  const el=evt.target,act=el.dataset.cmsAct;
  try{
   if(el.dataset.cmsRobot){syncRobots(doc);return;}
   if(el.dataset.cmsRichSelect){richEditorAction(doc,el.dataset.cmsRichSelect,el);return;}
   if(el.dataset.cmsRichColor){richEditorAction(doc,el.dataset.cmsRichColor,el);return;}
   if(el.id==='flatpickr-range'){pageRef.current=1;renderCurrent(doc);return}
   if(act==='select'){el.checked?selectedRef.current.add(el.value):selectedRef.current.delete(el.value);return}
   if(act==='select-all'){selectedRef.current=new Set(el.checked?listFor(dataRef.current,screenRef.current.tab,screenRef.current.route).map(x=>String(x.id)):[]);renderCurrent(doc);return}
   if(act==='choose-tab'){navigate(el.value);return}
   if(act==='order'){
    // A change event must not silently persist data. User must confirm the save.
    const tab=screenRef.current.tab,next=structuredClone(dataRef.current);
    const row=listFor(next,tab).find(x=>String(x.id)===el.dataset.rowId);
    if(!row)return;
    const requested=Math.max(1,Number(el.value)||1);
    if(requested===Number(row.order||1))return;
    if(!window.confirm('Lưu thay đổi số thứ tự này?')){el.value=String(row.order||1);return;}
    row.order=requested;saveRecord(next,tab,row);await save(next);renderCurrent(doc);return;
   }
   if(el.type==='file'&&el.files?.length){if(screenRef.current.tab==='media'){for(const file of el.files)await uploadFile(file);renderCurrent(doc)}else{pendingFileRef.current=el.files[0];uploadedDraftRef.current=null;const preview=doc.querySelector('.photoUpload-detail img');if(preview){preview.src=URL.createObjectURL(el.files[0]);preview.onload=()=>URL.revokeObjectURL(preview.src)}doc.querySelector('form')?.setAttribute('data-cms-changed','1')}return}
   if(el.dataset.cmsKey)doc.querySelector('form')?.setAttribute('data-cms-changed','1');
  }catch(error){inform(error.message)}
 };
 const onInput=evt=>{
  if(evt.target.matches?.('[data-cms-rich-editable]')){const source=evt.target.closest('.cms-rich-host')?.querySelector('textarea[data-cms-key="body"]');if(source){source.value=sanitizeEditorHtml(evt.target.ownerDocument,evt.target.innerHTML);source.dispatchEvent(new evt.target.ownerDocument.defaultView.Event('input',{bubbles:true}))}return;}
  if(evt.target.matches('.navbar-search-wrapper input.search-input')){queryRef.current=evt.target.value;pageRef.current=1;renderCurrent(frame.current?.contentDocument);return}
  if(evt.target.id==='keyword'){queryRef.current=evt.target.value;pageRef.current=1;const doc=frame.current?.contentDocument;const input=evt.target;const i=input.selectionStart;renderCurrent(doc);const next=doc?.getElementById('keyword');if(next){next.focus();next.setSelectionRange(i,i)}return}
  if(!evt.target.dataset.cmsKey)return;
  evt.target.closest('form')?.setAttribute('data-cms-changed','1');
  const doc=frame.current?.contentDocument;if(!doc)return;
  const key=evt.target.dataset.cmsKey;
  const counter=doc.querySelector(`[data-cms-counter-text="${key}"]`);
  if(counter){const limit=SEO_LIMITS[key]||70;counter.textContent=String(String(evt.target.value||'').length);evt.target.classList.toggle('is-over-limit',String(evt.target.value||'').length>limit)}
  const point=doc.querySelector('#seo_point_vi');if(point&&key==='focusKeyword')point.textContent=String(String(evt.target.value||'').length);
  // Checklist + đếm ký tự được cập nhật trực tiếp theo dữ liệu thật.
  const form=doc.querySelector('form');const values={};
  for(const input of form.querySelectorAll('[data-cms-key]'))values[input.dataset.cmsKey]=input.value;
  renderSeoChecklist(doc,values);
 };
 const onSubmit=async(evt)=>{
  evt.preventDefault();
  try{
   if(!authorized){
    const username=evt.target.querySelector('#username')?.value||'';
    const password=evt.target.querySelector('#password')?.value||'';
    if(!username.trim())throw Error('Vui lòng nhập tài khoản.');
    if(!password)throw Error('Vui lòng nhập mật khẩu.');
    await api('/api/admin/login','POST',{username:username.trim(),password});
    await refresh();setAuthorized(true);inform('Đăng nhập thành công');
   }else if(evt.submitter?.matches?.('button[type=submit],input[type=submit],button[data-cms-save=true]')){
    await saveForm(frame.current?.contentDocument,evt.submitter);
  }
  }catch(error){inform(error.message)}
 };
 function renderCurrent(doc){
  if(!doc||!authorized)return;
  const s=screenRef.current, data=dataRef.current;
  if(s.mode==='edit')fillForm(doc,s.tab,data,s.route,s.editId,s.newItem?'create':'edit');
  else if(s.tab==='media'){
   populateMedia(doc,data,mediaKindRef.current,mediaPageRef.current,mediaLibraryRef.current[mediaKindRef.current]);
  }else if(s.tab==='settings')fillForm(doc,'settings',data,s.route,null,'edit');
  else populateList(doc,data,s.tab,s.route,queryRef.current,pageRef.current,selectedRef.current);
  // Replace misleading reference credentials with the actual target product identity.
  const brand=doc.querySelector('.php-version');if(brand){const label=brand.querySelector('.php-version-label');if(label)label.textContent='Mi House';const number=brand.querySelector('.php-version-number');if(number)number.textContent='React CMS'}
  const logo=doc.querySelector('#layout-menu .app-brand-logo img');if(logo)logo.src='/admin-source/assets/admin/img/avatars/nasani.png';
  doc.querySelectorAll('#layout-menu [data-cms-tab]').forEach(a=>a.closest('li.menu-item')?.classList.toggle('active',a.dataset.cmsTab===s.tab));
  enhanceIcons(doc);
 }
 const onFrameLoad=()=>{
  const doc=frame.current?.contentDocument;if(!doc)return;
  doc.addEventListener('click',onClick);doc.addEventListener('change',onChange);doc.addEventListener('input',onInput);doc.addEventListener('submit',onSubmit);
  doc.addEventListener('mousedown',e=>{if(e.target.closest?.('button[data-cms-rich]'))e.preventDefault()});
  doc.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key==='/'){e.preventDefault();const pane=doc.querySelector('.navbar-search-wrapper.search-input-wrapper');pane?.classList.remove('d-none');pane?.querySelector('input.search-input')?.focus()}
   // Enter in a text field may implicitly activate the first submit button;
   // saving requires direct activation of that button.
   if(authorized&&screenRef.current.mode==='edit'&&e.key==='Enter'&&!e.isComposing&&e.target.closest?.('form')&&
      e.target.matches?.('input:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio])')){e.preventDefault();return}
   if(e.key==='Escape'){doc.querySelector('.navbar-search-wrapper.search-input-wrapper')?.classList.add('d-none');doc.querySelector('#source-admin-picker')?.remove()}
  });
  if(!authorized){
   doc.querySelector('.website-link')?.setAttribute('href','/');
   // Tài khoản KHÔNG readonly: người dùng phải nhập cả tài khoản và mật khẩu.
   const username=doc.querySelector('#username');if(username){username.removeAttribute('readonly');username.removeAttribute('value');username.value='';username.setAttribute('placeholder','Nhập tài khoản quản trị...');username.setAttribute('autocomplete','username')}
   const password=doc.querySelector('#password');if(password){password.setAttribute('type','password');password.setAttribute('autocomplete','current-password')}
   const loginImg=doc.querySelector('.login-logo-box img');if(loginImg)loginImg.src='/admin-source/assets/admin/img/avatars/login.png';
   doc.querySelectorAll('.login-page .login-footer').forEach(x=>{x.textContent='Mi House Spa · Hệ thống quản trị'});
   enhanceIcons(doc);return;
  }
  configureBusinessMenu(doc,screenRef.current.tab);
  renderCurrent(doc);
  if(screenRef.current.tab==='media')loadMediaPage(doc,mediaKindRef.current,mediaPageRef.current);
  // Admin follows the supplied pageadmin.rar default color palette (color-4).
  const sidebar=doc.querySelector('#layout-menu .menu-inner');if(sidebar){sidebar.style.overflowY='auto';sidebar.style.maxHeight='calc(100vh - 115px)';sidebar.style.scrollbarWidth='thin'}
  const input=doc.getElementById('flatpickr-range');
  if(input&&typeof doc.defaultView.flatpickr==='function'){
   doc.defaultView.flatpickr(input,{dateFormat:'d/m/Y',mode:'range',allowInput:true,onChange:()=>{pageRef.current=1;renderCurrent(doc)}});
  }
 };
 const docHtml=useMemo(()=>makeDoc(authorized,screen.tab,screen.mode),[authorized,screen.tab,screen.mode,screen.editId,screen.route,screen.newId]);
 if(loading)return <div className="source-admin-loading" role="status">Đang kiểm tra phiên quản trị…</div>;
 // Critical viewport sizing must not depend on async CSS loading. The
 // source UI still keeps its own styles in the iframe's isolated document.
 return <div className="source-admin-host" style={{position:'fixed',inset:0,width:'100vw',height:'100dvh',maxWidth:'none',overflow:'hidden',margin:0,padding:0,background:'#f8f7fa'}}>
  <iframe ref={frame} key={`${authorized}-${screen.tab}-${screen.mode}-${screen.editId||screen.newId||''}-${screen.route}`} title="Mi House Spa - Nasani Admin" srcDoc={docHtml} onLoad={onFrameLoad} className="source-admin-iframe" style={{position:'absolute',inset:0,display:'block',width:'100%',height:'100%',maxWidth:'none',border:0,margin:0,padding:0,background:'#f8f7fa'}} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" />
  {message&&<div className="source-admin-notice" role="status"><span>{message}</span><button type="button" onClick={()=>setMessage('')} aria-label="Đóng">×</button></div>}
 </div>;
}
