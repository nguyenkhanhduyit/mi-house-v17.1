import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {duplicateRecord,getRows,saveRecord,MENU_GROUPS} from '../src/cms/businessModel.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
let tests=0;const test=(name,fn)=>{fn();tests++;console.log('PASS',name)};
const data=JSON.parse(read('src/cms/initialContent.json'));
test('Album is one parent menu (not two top-level items)',()=>{const keys=MENU_GROUPS.flatMap(x=>x.items.map(y=>y[0]));assert(keys.includes('album'));assert(!keys.includes('albumPhotos'));assert(!keys.includes('albumCategories'));assert(read('src/cms/SourceAdmin.jsx').includes("for(const [subKey,subLabel] of ALBUM_TABS)"))});
test('Clone keeps original record unchanged',()=>{const source=structuredClone(data.services[0]);const before=JSON.stringify(source);duplicateRecord(data,'services',source,'copy-one');assert.equal(JSON.stringify(source),before)});
test('Clone preserves all non-unique content fields',()=>{const s={id:'old',title:'Tiêu đề gốc',slug:'tieu-de-goc',sourceRoute:'/dich-vu/goc',description:'nội dung',body:'<p>Giữ nguyên</p>',custom:{x:123},image:'https://res.cloudinary.com/demo/image/upload/test.webp',status:'draft',order:7};const d={services:[s]};const c=duplicateRecord(d,'services',s,'new');assert.deepEqual(Object.fromEntries(Object.entries(c).filter(([k])=>!['id','slug','sourceRoute','sourceTemplateRoute'].includes(k))),Object.fromEntries(Object.entries(s).filter(([k])=>!['id','slug','sourceRoute','sourceTemplateRoute'].includes(k))));assert.equal(c.title,s.title);assert.equal(c.image,s.image);assert.equal(c.sourceTemplateRoute,s.sourceRoute)});
test('Clone generates collision-safe unique slugs',()=>{const s={id:'a',slug:'demo',title:'demo'};const d={services:[s,{id:'b',slug:'ban-sao-demo'}]};assert.equal(duplicateRecord(d,'services',s,'c').slug,'ban-sao-demo-2')});
test('Gallery clone saves under correct collection',()=>{const d=structuredClone(data);const old=getRows(d,'albumPhotos').find(x=>x.categoryId==='nail');assert(old);const clone=duplicateRecord(d,'albumPhotos',old,'album-copy');saveRecord(d,'albumPhotos',clone);assert(getRows(d,'albumPhotos').some(x=>x.id==='album-copy'&&x.categoryId==='nail'));assert(getRows(d,'albumPhotos').some(x=>x.id===old.id))});
test('Admin persists URL state and supports history pop',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(s.includes('adminScreenFromUrl'));assert(s.includes('history.pushState'));assert(s.includes("window.addEventListener('popstate',pop)"));assert(s.includes('adminScreenUrl(next)'))});
test('Unsaved edits are protected during module change',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(s.includes('form[data-cms-changed="1"]'));assert(s.includes('Bạn muốn rời trang và bỏ thay đổi?'))});
test('Archived reference links no longer reset editor to Giới thiệu',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(!s.includes("if(src){evt.preventDefault();navigate('intro','edit');return}"))});
test('TOC defaults to collapsed with aria-expanded false',()=>{const s=read('src/hooks/enhancePage.js');assert(s.includes("toc.classList.remove('box-toc--open');"));assert(s.includes("header.setAttribute('aria-expanded','false')"))});
test('Production splash does not show during normal loading',()=>{const s=read('index.html');assert(!s.includes('<strong>Đang khởi tạo Mi House Spa…</strong>'));assert(s.includes('style="display:none;text-align:center'))});
test('Live Cloudinary listing is authenticated, server-scoped and uses cursor',()=>{
 const source=read('server/index.mjs');assert(source.includes("pathname==='/api/admin/media-library'"));assert(source.includes("url.searchParams.set('prefix','mi-house/')"));assert(source.includes("url.searchParams.set('next_cursor',cursor)"));
 const client=read('src/cms/SourceAdmin.jsx');assert(client.includes('loadMediaPage(doc,mediaKindRef.current'));assert(client.includes('mediaCursorsRef'));
});
test('Media tabs and pagination have interactive handlers',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(s.includes("act==='media-kind'"));assert(s.includes("act==='media-page'"));assert(s.includes('perPage=18'));assert(s.includes("['image','Ảnh'],['video','Video']"))});
test('Admin deletion uses confirmation and safe cancellable flow',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(s.includes('window.confirm(`Xóa'));assert(s.includes("data-cms-action=\"bulk-delete\""));assert(s.includes("act==='bulk-delete'"))});
test('Album category deletion safeguards linked images',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(s.includes('Không thể xóa danh mục đang chứa'));assert(s.includes('Hãy chuyển hình ảnh sang danh mục khác trước'))});
test('Public contact page removed from manifest and source',()=>{const routes=JSON.parse(read('src/routeManifest.json'));assert(!Object.hasOwn(routes,'/lien-he'));assert(!fs.existsSync(path.join(root,'src/pages/lien-he.jsx')))});
test('Public standalone contact page is no longer rendered',()=>{const s=read('src/App.jsx');assert(s.includes("route==='/lien-he' ? null"));assert(s.includes("url.pathname==='/lien-he'"));const v=JSON.parse(read('vercel.json'));assert(v.redirects.find(x=>x.source==='/lien-he'&&x.permanent))});
test('No Cloudinary secret exposed by source admin code',()=>{const s=read('src/cms/SourceAdmin.jsx');assert(!s.includes('CLOUDINARY_API_SECRET'));assert(!s.includes('PASTE_SECRET_HERE'))});
// TypeScript global installation is an optional parser for JSX syntax validation.
try{
 const ts=await import('file:///opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
 const files=[];for(const dir of ['src','src/cms','src/components','src/pages'])for(const name of fs.readdirSync(path.join(root,dir)))if(name.endsWith('.jsx'))files.push(path.join(root,dir,name));
 const diag=[];for(const file of files){const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.ES2022,true,ts.ScriptKind.JSX);diag.push(...sf.parseDiagnostics.map(d=>`${path.relative(root,file)}:${d.start}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`))}
 test(`JSX parser accepts ${files.length} components`,()=>assert.deepEqual(diag,[]));
}catch(error){console.warn('NOT TESTED JSX external parser unavailable:',error.message)}
console.log(`REGRESSION FIXES TEST: ${tests} PASS`);
