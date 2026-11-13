/** CMS groups are intentionally business-oriented, not one generic DOM list. */
export const TAB_LABELS={
 intro:'Giới thiệu',services:'Dịch vụ',menu:'Bảng giá dịch vụ',training:'Đào tạo',
 albumCategories:'Danh mục album cấp 1',albumPhotos:'Hình ảnh album',articles:'Tin tức',
 contact:'Liên hệ',slides:'Slideshow',videos:'Video',footer:'Footer',
 media:'Thư viện Cloudinary',settings:'Cấu hình website'
};
// Menu nghiệp vụ của Mi House Spa. KHÔNG có mục thống kê truy cập / dashboard /
// SEO dashboard - những mục đó chỉ tồn tại trong bản PHP gốc, không thuộc CMS này.
export const MENU_GROUPS=[
 {heading:'QUẢN LÝ NỘI DUNG',items:[
  ['intro','Giới thiệu','ti-info-circle'],
  ['services','Dịch vụ','ti-heart-handshake'],
  ['menu','Bảng giá dịch vụ','ti-receipt'],
  ['training','Đào tạo','ti-school'],
  ['album','Album','ti-photo'],
  ['articles','Tin tức','ti-news'],
  ['contact','Liên hệ','ti-phone'],
  ['footer','Footer','ti-layout-bottombar'],
 ]},
 {heading:'HÌNH ẢNH & VIDEO',items:[
  ['slides','Slideshow','ti-slideshow'],
  ['videos','Video','ti-video'],
  ['media','Thư viện Cloudinary','ti-photo'],
 ]},
 {heading:'HỆ THỐNG',items:[
  ['settings','Cấu hình website','ti-settings'],
  ['logout','Đăng xuất','ti-logout'],
 ]}
];
export const COLLECTION_KEYS=new Set(['slides','menu','videos']);
export const SECTION_KEYS=new Set(['intro','contact','footer']);
export const GALLERY_KEYS=new Set(['slides','menu','albumPhotos','videos']);
export const RICH_KEYS=new Set(['intro','contact','footer','articles','training','services']);
// Bản ghi dùng form "Tin tức" (có đường dẫn, trạng thái, SEO, ảnh đại diện).
export const NEWS_TABS=new Set(['articles','training','services']);
// Các bảng ghi không có khối trạng thái / SEO riêng.
export const PLAIN_TABS=new Set(['menu','albumPhotos','slides','videos','albumCategories']);
export const FIELD_LABELS={
 intro:[['title','Tiêu đề'],['description','Mô tả'],['body','Nội dung'],['image','Hình ảnh'],['alt','Alt photo']],
 contact:[['title','Tiêu đề'],['description','Mô tả'],['body','Nội dung'],['phone','Hotline'],['email','Email'],['address','Địa chỉ'],['website','Link website'],['facebook','Link Facebook'],['maps','Link Google Maps'],['contactLink','Link liên hệ / Zalo'],['bookingLink','Link đặt lịch']],
 footer:[['title','Tên thương hiệu'],['description','Mô tả'],['body','Nội dung footer']],
 articles:[['title','Tiêu đề'],['slug','Đường dẫn'],['description','Mô tả'],['body','Nội dung'],['image','Ảnh đại diện'],['alt','Alt photo'],['status','Hiển thị']],
 services:[['title','Tiêu đề'],['slug','Đường dẫn'],['description','Mô tả'],['body','Nội dung'],['image','Ảnh đại diện'],['alt','Alt photo'],['status','Hiển thị']],
 training:[['title','Tiêu đề'],['slug','Đường dẫn'],['description','Mô tả'],['body','Nội dung'],['image','Ảnh đại diện'],['alt','Alt photo'],['status','Hiển thị']],
 menu:[['title','Tên bảng giá'],['image','Hình ảnh'],['alt','Alt photo'],['status','Hiển thị']],
 albumCategories:[['title','Tên danh mục'],['slug','Đường dẫn'],['status','Hiển thị']],
 albumPhotos:[['title','Tên ảnh'],['image','Hình ảnh'],['alt','Alt photo'],['categoryId','Danh mục cấp 1'],['status','Hiển thị']],
 slides:[['title','Tiêu đề'],['image','Hình ảnh'],['href','Liên kết click'],['status','Hiển thị']],
 videos:[['title','Tiêu đề'],['video','Video'],['image','Ảnh đại diện'],['href','Liên kết click'],['status','Hiển thị']]
};
export const slugify=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
const sorted=rows=>[...rows].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
export function getRows(data,tab){
 if(SECTION_KEYS.has(tab))return data.sections?.[tab]?[{id:tab,...data.sections[tab]}]:[];
 if(COLLECTION_KEYS.has(tab))return sorted(data.collections?.[tab]||[]);
 if(tab==='albumPhotos'){
  return sorted([
   ...(data.collections?.nail||[]).map(row=>({...row,categoryId:'nail'})),
   ...(data.collections?.space||[]).map(row=>({...row,categoryId:'space'})),
   ...(data.albumItems||[])
  ]);
 }
 return Array.isArray(data[tab])?sorted(data[tab].filter(x=>!x.deleted)):[];
}
/** Deeply duplicate a CMS row, changing only unique identity fields. */
export function duplicateRecord(data,tab,source,newId){
 const copy=structuredClone(source);
 copy.id=newId;
 // Reuse the original page presentation for copies; never reuse its public URL.
 // This metadata is intentionally separate from the unique slug/identity.
 if(['services','training'].includes(tab)) copy.sourceTemplateRoute=source.sourceTemplateRoute||source.sourceRoute||'';
 if(Object.prototype.hasOwnProperty.call(copy,'sourceRoute'))copy.sourceRoute='';
 if(Object.prototype.hasOwnProperty.call(copy,'deleted'))copy.deleted=false;
 if(copy.slug){
  const base=slugify('ban-sao-'+copy.slug);let candidate=base,index=2;
  const known=new Set(getRows(data,tab).map(row=>row.slug).filter(Boolean));
  while(known.has(candidate))candidate=`${base}-${index++}`;
  copy.slug=candidate;
 }
 return copy;
}
export function saveRecord(data,tab,entry){
 if(SECTION_KEYS.has(tab)){data.sections ||= {};data.sections[tab]={...entry,updated:true};return;}
 if(tab==='albumPhotos'){
  data.collections ||= {};data.collections.nail ||= [];data.collections.space ||= [];data.albumItems ||= [];
  for(const target of [data.collections.nail,data.collections.space,data.albumItems]){const i=target.findIndex(x=>String(x.id)===String(entry.id));if(i>=0)target.splice(i,1)}
  const target=entry.categoryId==='nail'?data.collections.nail:entry.categoryId==='space'?data.collections.space:data.albumItems;
  target.push({...entry});return;
 }
 const rows=COLLECTION_KEYS.has(tab)?(data.collections[tab]||=[]) : (data[tab]||=[]);
 const pos=rows.findIndex(x=>String(x.id)===String(entry.id));if(pos>=0)rows[pos]=entry;else rows.unshift(entry);
}
export function deleteRecords(data,tab,ids){
 const set=new Set(ids.map(String));
 if(tab==='albumCategories'){
  data.albumCategories=(data.albumCategories||[]).filter(x=>!set.has(String(x.id)));
  if(set.has('nail'))data.collections.nail=[];
  if(set.has('space'))data.collections.space=[];
  data.albumItems=(data.albumItems||[]).filter(x=>!set.has(String(x.categoryId)));
  return;
 }
 if(tab==='albumPhotos'){
  for(const target of [data.collections.nail||[],data.collections.space||[],data.albumItems||[]]){
   for(let i=target.length-1;i>=0;i--)if(set.has(String(target[i].id)))target.splice(i,1);
  }return;
 }
 const rows=COLLECTION_KEYS.has(tab)?data.collections?.[tab]:data[tab];if(!Array.isArray(rows))return;
 for(let i=rows.length-1;i>=0;i--){if(!set.has(String(rows[i].id)))continue;
  // Original PHP-generated URLs remain valid React routes; hide the source
  // record explicitly so its archived JSX cannot come back as public content.
  if(rows[i].sourceRoute){rows[i].status='draft';rows[i].deleted=true;}else rows.splice(i,1);
 }
}
/* --------------------------------------------------------------------------
 SEO helpers. The checklist mirrors the original PHP "Nâng cao" panel but is
 evaluated against the REAL CMS data - never against demo content.
 ------------------------------------------------------------------------ */
const stripHtml=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const countWords=value=>stripHtml(value).split(' ').filter(Boolean).length;
// So sánh không phân biệt hoa/thường và dấu tiếng Việt: "Gội đầu" ~ "goi dau".
const normalize=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const occurrences=(haystack,needle)=>{
 if(!needle)return 0;
 const h=normalize(haystack),n=normalize(needle);
 if(!n)return 0;
 let count=0,index=h.indexOf(n);
 while(index!==-1){count++;index=h.indexOf(n,index+n.length)}
 return count;
};
// Every check returns {key,label,state} where state is 'pass' | 'warn' | 'fail'.
export function seoChecklist(values){
 const title=String(values.seoTitle||values.title||'');
 const description=String(values.seoDescription||values.description||'');
 const keywords=String(values.seoKeywords||'');
 const keyword=String(values.focusKeyword||'').trim();
 const body=String(values.body||'');
 const slug=String(values.slug||'');
 const alt=String(values.alt||'');
 const words=countWords(body);
 const plain=stripHtml(body);
 const keywordHits=occurrences(plain,keyword);
 const keywordWords=countWords(keyword);
 // Mật độ = (số lần xuất hiện * số từ của từ khóa) / tổng số từ.
 const density=words?Math.round((keywordHits*Math.max(1,keywordWords)/words)*1000)/10:0;
 const headings=String(body).match(/<h[234][^>]*>[\s\S]*?<\/h[234]>/gi)||[];
 const links=String(body).match(/<a\s[^>]*href[^>]*>/gi)||[];
 const images=String(body).match(/<img\s[^>]*>/gi)||[];
 const internalLinks=links.filter(l=>/href\s*=\s*["'](\/|#)/i.test(l));
 const headingWithKeyword=headings.some(h=>occurrences(h,keyword)>0);
 const checks=[
  {key:'keywordNotUsed',label:'Đặt từ khoá tập trung cho nội dung này',state:keyword?'pass':'fail'},
  {key:'keywordInTitle',label:'Thêm từ khóa chính vào tiêu đề SEO.',state:keyword?(occurrences(title,keyword)>0?'pass':'fail'):'fail'},
  {key:'titleStartWithKeyword',label:'Sử dụng từ khóa chính gần đầu tiêu đề SEO.',state:keyword?(normalize(title).startsWith(normalize(keyword))?'pass':'warn'):'fail'},
  {key:'lengthTitle',label:'Tiêu đề của bài viết phải lớn hơn 40 ký tự và khuyến cáo nhỏ hơn 70 ký tự',state:title.length>40&&title.length<=70?'pass':title.length?'warn':'fail'},
  {key:'keywordInMetaDescription',label:'Thêm Từ khóa tập trung vào Mô tả meta SEO của bạn.',state:keyword?(occurrences(description,keyword)>0?'pass':'fail'):'fail'},
  {key:'lengthMetaDescription',label:'Mô tả meta SEO của bạn nên có từ 155 đến 160 ký tự.',state:description.length>=155&&description.length<=160?'pass':description.length?'warn':'fail'},
  {key:'keywordInPermalink',label:'Sử dụng từ khóa chính trong URL.',state:keyword?(occurrences(slug,keyword)>0?'pass':'fail'):'fail'},
  {key:'lengthPermalink',label:'URL không khả dụng. Thêm URL ngắn.',state:slug?(slug.length>0&&slug.length<=75?'pass':'warn'):'fail'},
  {key:'keywordIn10Percent',label:'Sử dụng từ khóa chính ở đầu nội dung của bạn.',state:keyword?(occurrences(plain.slice(0,Math.ceil(plain.length/10)),keyword)>0?'pass':'warn'):'fail'},
  {key:'keywordInContent',label:'Sử dụng từ khóa chính trong nội dung.',state:keyword?(keywordHits>0?'pass':'fail'):'fail'},
  {key:'lengthContent',label:'Nội dung phải dài 600-2500 từ.',state:words>=600&&words<=2500?'pass':words?'warn':'fail'},
  {key:'linksHasInternal',label:'Thêm liên kết nội bộ vào nội dung của bạn.',state:internalLinks.length>0?'pass':'warn'},
  {key:'keywordInSubheadings',label:'Sử dụng từ khóa chính trong (các) tiêu đề phụ như H2, H3, H4, v.v..',state:keyword?(headingWithKeyword?'pass':'fail'):'fail'},
  {key:'keywordInImageAlt',label:'Thêm từ khóa vào thuộc tính alt của hình ảnh',state:keyword?(occurrences(alt,keyword)>0?'pass':'fail'):'fail'},
  {key:'keywordDensity',label:`Mật độ từ khóa là ${density}%. Nhắm đến khoảng 1% Mật độ từ khóa.`,state:keyword?(density>=0.5&&density<=2.5?'pass':density>0?'warn':'fail'):'fail'},
  {key:'contentHasShortParagraphs',label:'Thêm các đoạn văn ngắn và súc tích để dễ đọc và UX hơn.',state:shortParagraphScore(body)>0?'pass':'warn'},
  {key:'contentHasAssets',label:'Thêm một vài hình ảnh để làm cho nội dung của bạn hấp dẫn.',state:images.length>0?'pass':'warn'},
 ];
 return checks;
}
function shortParagraphScore(body){
 const paragraphs=String(body||'').split(/<\/p>/i).map(p=>stripHtml(p)).filter(Boolean);
 if(paragraphs.length<2)return 0;
 return paragraphs.filter(p=>p.split(' ').length<=120).length;
}
// "Keyword chính" accepts up to 100 characters. The stored contract field is
// the plain string `focusKeyword`; extra keywords are kept in the same field
// separated by ", " so the frontend keeps reading one value.
export const FOCUS_KEYWORD_LIMIT=100;
export function normalizeFocusKeyword(value){
 return String(value||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20).join(', ').slice(0,FOCUS_KEYWORD_LIMIT);
}
export function focusKeywordList(value){
 return String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
}
