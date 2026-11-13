import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sortAlbumPhotos,originalAlbumFull} from '../src/cms/managedContent.js';
import source from '../album-source-map.json' with {type:'json'};
import cms from '../server/data/content.json' with {type:'json'};
const root=new URL('../',import.meta.url);
const admin=fs.readFileSync(new URL('src/cms/SourceAdmin.jsx',root),'utf8');
const album=fs.readFileSync(new URL('src/components/AlbumShowcase.jsx',root),'utf8');
const carousels=fs.readFileSync(new URL('src/hooks/sourceCarousels.js',root),'utf8');
const tests=[];
function check(name,fn){fn();tests.push(name);console.log('PASS',name)}
check('No delegated save action on the form itself',()=>{
 assert.doesNotMatch(admin,/form\.dataset\.cmsAct\s*=\s*['"]save-form['"]/);
 assert.match(admin,/form\.removeAttribute\('data-cms-act'\)/);
});
check('Save action is restricted to explicit save buttons',()=>{
 assert.match(admin,/if\(act==='save-form'\)/);
 assert.match(admin,/actionEl\?\.matches\?\.\('button\[type=submit\],input\[type=submit\],button\[data-cms-save=true\]'\)/);
 assert.match(admin,/if\(!button\?\.matches\?\./);
 assert.match(admin,/evt\.submitter\?\.matches\?/);
});
check('Enter prevention only affects authenticated editing (not login)',()=>{
 assert.match(admin,/if\(authorized&&screenRef\.current\.mode==='edit'&&e\.key==='Enter'/);
});
check('Save lock, failure preservation and media retry caching',()=>{
 assert.match(admin,/savingFormRef\.current=true/);
 assert.match(admin,/finally\{savingFormRef\.current=false;\}/);
 assert.match(admin,/uploadedDraftRef\.current\?\.file===file/);
 assert.match(admin,/if\(!asset\)\{asset=await uploadFile\(file\);uploadedDraftRef\.current=\{file,asset\};\}/);
});
check('Changing list order requires an explicit confirmation',()=>{
 assert.match(admin,/window\.confirm\('Lưu thay đổi số thứ tự này\?'\)/);
});
for(const [i,kind] of ['nail','space'].entries()){
 check(`Album ${kind} uses the exact ${source[i].images.length} source image order when CMS order empty`,()=>{
  const rows=sortAlbumPhotos(cms.collections[kind],kind);
  assert.deepEqual(rows.slice(0,source[i].images.length).map(x=>x.image),source[i].images.map(x=>x.src));
  assert(rows.length>=source[i].images.length,'Không xóa ảnh mới do người quản trị tải lên');
  rows.filter(x=>!x.full).forEach(x=>assert.equal(originalAlbumFull(x,kind),x.image));
 });
}
check('User-defined album ordering and fullscreen URL take priority',()=>{
 const rows=[{image:source[0].images[1].src,order:2,full:'/upload/custom.jpg'},{image:source[0].images[0].src,order:1}];
 assert.equal(sortAlbumPhotos(rows,'nail')[0].order,1);
 assert.equal(originalAlbumFull(rows[0],'nail'),'/upload/custom.jpg');
});
check('Legacy fallback gallery accepts image objects, not [object Object]',()=>{
 assert.match(album,/typeof item==='string'\?item:item\?\.src/);
 assert.doesNotMatch(album,/data-fancybox=\{'album-'\+index\}/); // source homepage album is not lightbox-enabled
});
check('Source animation behavior is retained for 2 opposite carousels',()=>{
 assert.match(carousels,/autoScroll: \{ speed: container\.closest\('#nail-hottrend'\) \? 2 : -2 \}/);
 assert.match(carousels,/drag: 'free', focus: 'center', perPage: 7, gap: 2/);
});
console.log(`CRITICAL V15 TESTS: ${tests.length} PASS`);
