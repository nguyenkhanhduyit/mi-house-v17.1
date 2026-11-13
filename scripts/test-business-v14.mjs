import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TAB_LABELS,TAB_LABELS as TABS,MENU_GROUPS,NEWS_TABS,getRows,saveRecord,deleteRecords,slugify,seoChecklist,focusKeywordList,normalizeFocusKeyword,FOCUS_KEYWORD_LIMIT} from '../src/cms/businessModel.js';
const fixture=JSON.parse(fs.readFileSync(new URL('../src/cms/initialContent.json',import.meta.url),'utf8'));
const db=structuredClone(fixture);
let success=0;const ok=(label,fn)=>{fn();success++;console.log('PASS',label)};
ok('Nội dung Mi House không sao chép Legend',()=>{assert.equal(JSON.stringify(db).includes('Legend Car Studio'),false);assert(JSON.stringify(db.sections.intro).includes('Mi House'))});
ok('Các mục nghiệp vụ tách biệt; không có thống kê',()=>{for(const x of ['intro','services','menu','training','albumCategories','albumPhotos','articles','contact','slides','footer','media'])assert(TAB_LABELS[x]);assert(!TAB_LABELS.stats);assert(!MENU_GROUPS.some(g=>g.items.some(x=>x[0]==='stats')))});
ok('Seed đúng số lượng',()=>{assert.equal(db.services.length,3);assert.equal(db.training.length,1);assert.equal(db.articles.length,11);assert.equal(db.collections.nail.length,8);assert.equal(db.collections.space.length,12);assert.equal(db.collections.menu.length,12)});
ok('Danh mục album cấp 1',()=>{assert.deepEqual(db.albumCategories.map(x=>x.title),['Nail hottrend','Không gian'])});
ok('Thêm danh mục + hình -> frontend data',()=>{
 saveRecord(db,'albumCategories',{id:'k3',title:'Mẫu mới',slug:'mau-moi',status:'published'});
 saveRecord(db,'albumPhotos',{id:'p4',title:'Ảnh test',image:'https://res.cloudinary.com/mock/image/upload/p4.webp',categoryId:'k3',status:'published'});
 assert(getRows(db,'albumPhotos').some(x=>x.id==='p4'&&x.categoryId==='k3'));
});
ok('Chuyển ảnh giữa danh mục không bị trùng',()=>{const row=getRows(db,'albumPhotos').find(x=>x.id==='p4');saveRecord(db,'albumPhotos',{...row,categoryId:'nail'});assert.equal(getRows(db,'albumPhotos').filter(x=>x.id==='p4').length,1);assert(db.collections.nail.some(x=>x.id==='p4'))});
ok('Xóa danh mục cấp 1 xóa ảnh của danh mục',()=>{saveRecord(db,'albumPhotos',{id:'p5',categoryId:'k3',image:'https://res.cloudinary.com/mock/image/upload/p5.webp'});deleteRecords(db,'albumCategories',['k3']);assert(!db.albumCategories.some(x=>x.id==='k3'));assert(!getRows(db,'albumPhotos').some(x=>x.id==='p5'))});
ok('Sửa + xóa ảnh bảng giá',()=>{let r=db.collections.menu[0];saveRecord(db,'menu',{...r,image:'https://res.cloudinary.com/mock/image/upload/updated.webp'});assert.equal(db.collections.menu.find(x=>x.id===r.id).image,'https://res.cloudinary.com/mock/image/upload/updated.webp');deleteRecords(db,'menu',[r.id]);assert(!db.collections.menu.some(x=>x.id===r.id))});
ok('Xóa bài có trang HTML gốc -> bản ghi nháp/deleted',()=>{const r=db.services[0];deleteRecords(db,'services',[r.id]);assert(getRows(db,'services').every(x=>x.id!==r.id));assert(db.services.some(x=>x.id===r.id&&x.status==='draft'&&x.deleted))});
ok('Thêm dịch vụ mới và slug Latin',()=>{const slug=slugify('Dịch vụ mới Gò Vấp');assert.equal(slug,'dich-vu-moi-go-vap');saveRecord(db,'services',{id:'s4',title:'Dịch vụ mới Gò Vấp',slug,status:'published'});assert(getRows(db,'services').some(x=>x.id==='s4'))});
ok('Giới thiệu/Footer chỉnh sửa độc lập',()=>{saveRecord(db,'intro',{...db.sections.intro,title:'Giới thiệu đã sửa'});assert.equal(db.sections.intro.title,'Giới thiệu đã sửa');saveRecord(db,'footer',{title:'Footer riêng',description:'Mô tả footer'});assert.equal(db.sections.footer.title,'Footer riêng')});

/* ---------------- Menu nghiệp vụ (yêu cầu 1) ---------------- */
ok('Menu đúng nghiệp vụ, không thống kê/dashboard/SEO dashboard',()=>{
 const flat=MENU_GROUPS.flatMap(g=>g.items.map(x=>x[0]));
 for(const key of ['intro','services','menu','training','album','articles','contact','footer','slides','videos','media','settings','logout'])assert(flat.includes(key),'thiếu mục '+key);
 assert(!flat.includes('albumCategories')&&!flat.includes('albumPhotos'),'hai danh mục album phải nằm dưới menu cha Album');
 for(const forbidden of ['stats','analytics','dashboard','seo','seoHub','seoAudit'])assert(!flat.includes(forbidden),'mục không hợp lệ: '+forbidden);
 assert(!JSON.stringify(MENU_GROUPS).match(/Thống kê|Dashboard|SEO dashboard/i),'nhãn thống kê/dashboard còn sót');
});
ok('Video là mục quản lý riêng (không gộp vào Slideshow)',()=>{
 const flat=MENU_GROUPS.flatMap(g=>g.items);
 assert(flat.some(x=>x[0]==='slides'&&x[1]==='Slideshow'));
 assert(flat.some(x=>x[0]==='videos'&&x[1]==='Video'));
});
ok('Footer là mục nhập nội dung riêng',()=>{
 const flat=MENU_GROUPS.flatMap(g=>g.items);
 assert(flat.some(x=>x[0]==='footer'&&x[1]==='Footer'));
});

/* ---------------- SEO checklist (yêu cầu 3) ---------------- */
ok('Checklist SEO đánh giá theo dữ liệu thật',()=>{
 // Bài mẫu ĐẦY ĐỦ: đủ từ khóa, tiêu đề SEO, mô tả, alt, liên kết nội bộ, H2.
 const body='<p>Gội đầu dưỡng sinh là dịch vụ được nhiều khách hàng tại Mi House Spa lựa chọn khi muốn thả lỏng sau một ngày dài.</p>'
  +'<h2>Gội đầu dưỡng sinh phù hợp với ai</h2>'
  +'<p>Quy trình gội đầu dưỡng sinh tại Mi House Spa kết hợp thảo dược liệu, massage da đầu và chăm sóc tóc chuyên sâu.</p>'
  +'<p>Tham khảo <a href="/dich-vu">danh sách dịch vụ</a> hoặc <a href="/dao-tao">lớp đào tạo gội đầu</a> của Mi House Spa.</p>';
 const checks=seoChecklist({title:'Dịch vụ gội đầu dưỡng sinh',slug:'dich-vu-goi-dau',description:'Mô tả ngắn',body,alt:'gội đầu dưỡng sinh',seoTitle:'Dịch vụ gội đầu dưỡng sinh chuyên nghiệp tại Mi House Spa Gò Vấp',seoDescription:'Dịch vụ gội đầu dưỡng sinh'.padEnd(155,'.'),seoKeywords:'gội đầu, massage, nail',focusKeyword:'gội đầu'});
 const by=key=>checks.find(c=>c.key===key);
 assert.equal(by('keywordNotUsed').state,'pass');
 assert.equal(by('keywordInTitle').state,'pass');
 assert.equal(by('lengthTitle').state,'pass');
 assert.equal(by('keywordInMetaDescription').state,'pass');
 assert.equal(by('lengthMetaDescription').state,'pass');
 // URL Latin "dich-vu-goi-dau" khớp từ khóa "gội đầu" khi bỏ dấu.
 assert.equal(by('keywordInPermalink').state,'pass');
 assert.equal(by('lengthPermalink').state,'pass');
 assert.equal(by('keywordInContent').state,'pass');
 assert.equal(by('keywordInSubheadings').state,'pass');
 assert.equal(by('keywordInImageAlt').state,'pass');
 assert.equal(by('linksHasInternal').state,'pass');
 assert.equal(by('contentHasShortParagraphs').state,'pass');
 assert.equal(by('lengthContent').state,'warn');
 assert.equal(by('contentHasAssets').state,'warn');
 assert.equal(by('keywordDensity').state,'warn');
 assert.equal(by('titleStartWithKeyword').state,'warn');
});
ok('Checklist SEO báo fail khi thiếu dữ liệu',()=>{
 const checks=seoChecklist({title:'',slug:'',description:'',body:'',alt:'',seoTitle:'',seoDescription:'',seoKeywords:'',focusKeyword:''});
 const by=key=>checks.find(c=>c.key===key);
 assert.equal(by('keywordNotUsed').state,'fail');
 assert.equal(by('lengthTitle').state,'fail');
 assert.equal(by('lengthContent').state,'fail');
 assert.equal(by('keywordInPermalink').state,'fail');
});
ok('Keyword chính giới hạn 100 ký tự và tách danh sách',()=>{
 assert.equal(FOCUS_KEYWORD_LIMIT,100);
 assert.equal(normalizeFocusKeyword('gội đầu, massage, nail'),'gội đầu, massage, nail');
 assert.equal(normalizeFocusKeyword('  gội đầu ,,  massage  '),'gội đầu, massage');
 assert.equal(normalizeFocusKeyword('a'.repeat(200)).length,100);
 assert.deepEqual(focusKeywordList('gội đầu, massage'),['gội đầu','massage']);
});
ok('Mẫu demo Legend không được nhập vào dữ liệu thật',()=>{
 const checks=seoChecklist({title:'Legend Car Studio',slug:'legend-car-studio',description:'',body:'<p>Legend Car Studio</p>',alt:'',seoTitle:'',seoDescription:'',seoKeywords:'',focusKeyword:''});
 assert.equal(checks.find(c=>c.key==='lengthTitle').state,'warn');
 assert(!JSON.stringify(db).includes('legendcarstudio.com'),'URL mẫu không được lưu');
});

/* ---------------- Bảng giá & album (yêu cầu 4, 5) ---------------- */
ok('Mỗi ảnh bảng giá là một bản ghi độc lập',()=>{
 const priceDb=structuredClone(db);
 const before=getRows(priceDb,'menu').length;
 priceDb.collections.menu.push({id:'price-x',title:'Bảng giá mới',image:'https://res.cloudinary.com/mock/image/upload/price-x.webp',full:'https://res.cloudinary.com/mock/image/upload/price-x.webp',status:'published',order:1});
 assert.equal(getRows(priceDb,'menu').length,before+1);
 assert(getRows(priceDb,'menu').some(x=>x.id==='price-x'));
 deleteRecords(priceDb,'menu',['price-x']);
 assert(!priceDb.collections.menu.some(x=>x.id==='price-x'));
 assert.equal(getRows(priceDb,'menu').length,before);
});
ok('Ảnh album lưu đúng danh mục cấp 1',()=>{
 const albumDb=structuredClone(db);
 saveRecord(albumDb,'albumPhotos',{id:'ph-1',title:'Ảnh mới',image:'https://res.cloudinary.com/mock/image/upload/ph-1.webp',categoryId:'space',status:'published'});
 const row=getRows(albumDb,'albumPhotos').find(x=>x.id==='ph-1');
 assert.equal(row.categoryId,'space');
 assert(albumDb.collections.space.some(x=>x.id==='ph-1'));
 deleteRecords(albumDb,'albumPhotos',['ph-1']);
 assert(!getRows(albumDb,'albumPhotos').some(x=>x.id==='ph-1'));
});
ok('Dịch vụ và Đào tạo dùng chung mẫu bản ghi như Tin tức',()=>{
 for(const tab of ['articles','training','services']){
  assert(NEWS_TABS.has(tab),tab+' phải nằm trong nhóm form Tin tức');
  assert.equal(TABS[tab].length>0,true);
 }
 assert(!NEWS_TABS.has('menu'));
 assert(!NEWS_TABS.has('slides'));
});
console.log('BUSINESS CMS TEST',success,'PASS');
