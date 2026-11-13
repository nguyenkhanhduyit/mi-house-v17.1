import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
process.env.ADMIN_USERNAME='admin';process.env.ADMIN_PASSWORD='v8_API_test_only_for_mock';process.env.CLOUDINARY_CLOUD_NAME='mock';process.env.CLOUDINARY_API_KEY='mock-key';process.env.CLOUDINARY_API_SECRET='mock-secret';
process.env.CMS_DB_PATH=path.join(os.tmpdir(),'mh-v13-test-'+process.pid+'.json');process.env.CMS_STATS_PATH=path.join(os.tmpdir(),'mh-v13-analytics-'+process.pid+'.json');
const realFetch=globalThis.fetch;let seq=0,deleted=[];let destroyShouldFailOnce=true;
globalThis.fetch=async(input,init)=>{
 const url=String(input);
 if(url.includes('api.cloudinary.com')){
  if(url.includes('/resources/')){
   const parsed=new URL(url);
   assert.match(parsed.pathname,/\/resources\/(image|video)\/upload$/,'Cloudinary Admin API requires delivery type upload');
   assert.equal(parsed.searchParams.get('prefix'),'mi-house/');
   assert.equal(parsed.searchParams.get('max_results'),'18');
   return new Response(JSON.stringify({resources:[
    {public_id:'mi-house/mock-gallery',secure_url:'https://res.cloudinary.com/mock/image/upload/mock-gallery.png',width:800,height:600},
    {public_id:'another-app/private',secure_url:'https://res.cloudinary.com/mock/image/upload/private.png'}
   ],next_cursor:'cursor-next'}),{status:200});
  }
  const keys=init.body;
  if(url.endsWith('/destroy')){if(destroyShouldFailOnce){destroyShouldFailOnce=false;return new Response(JSON.stringify({error:{message:'mock failure'}}),{status:503})}deleted.push(String(keys.get('public_id')));return new Response(JSON.stringify({result:'ok'}),{status:200})}
  seq++;return new Response(JSON.stringify({secure_url:'https://res.cloudinary.com/mock/image/upload/media-'+seq+'.png',public_id:'mi-house/test-'+seq,resource_type:'image'}),{status:200});
 }
 return realFetch(input,init);
};
const {createServer}=await import(new URL('../server/index.mjs?test='+Date.now(),import.meta.url).href);const server=createServer();
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
let cookie='';async function call(endpoint,method='GET',body){const headers={'X-CMS-Request':'1'};if(cookie)headers.Cookie=cookie;if(body instanceof Uint8Array){headers['Content-Type']='application/octet-stream'}else if(body!==undefined){headers['Content-Type']='application/json';body=JSON.stringify(body)}const r=await realFetch(base+endpoint,{method,headers,body,redirect:'manual'});const setCookie=r.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];const data=await r.json();return {status:r.status,data}}
let checks=[];try{
 let r=await call('/api/admin/login','POST',{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});assert.equal(r.status,200);checks.push('login');
 // Sai tài khoản hoặc sai mật khẩu phải bị từ chối rõ ràng.
 let badUser=await call('/api/admin/logout','POST');
 r=await call('/api/admin/login','POST',{username:'khong-ton-tai',password:process.env.ADMIN_PASSWORD});assert.equal(r.status,401);assert.match(r.data.error,/Tài khoản/);checks.push('login rejects wrong username');
 r=await call('/api/admin/login','POST',{username:process.env.ADMIN_USERNAME,password:'sai-mat-khau'});assert.equal(r.status,401);assert.match(r.data.error,/Mật khẩu/);checks.push('login rejects wrong password');
 r=await call('/api/admin/login','POST',{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});assert.equal(r.status,200);checks.push('login');
 r=await call('/api/admin/media-library?type=image');
 assert.equal(r.status,200);assert.equal(r.data.items.length,1);assert.equal(r.data.items[0].publicId,'mi-house/mock-gallery');assert.equal(r.data.nextCursor,'cursor-next');checks.push('Cloudinary live library cursor pagination');
 r=await call('/api/admin/media-library?type=video&cursor=cursor-next');assert.equal(r.status,200);assert.equal(r.data.kind,'video');checks.push('Cloudinary video listing');
 r=await call('/api/admin/media-library?type=invalid');assert.equal(r.status,400);checks.push('Cloudinary validates list resource type');
 r=await call('/api/admin/state');assert.equal(r.status,200);let db=r.data;checks.push('get state');
 db.collections.menu=[{id:'new-1',title:'Menu mới',image:'',status:'published'}];
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);assert.equal(r.data.revision,1);checks.push('state save revision');
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,409);checks.push('concurrent edits rejected');
 r=await call('/api/admin/state');db=r.data;db.settings.mapEmbed='https://www.google.com/maps/embed?pb=mock';db.services[0].sourceTemplateRoute='/goi-dau-duong-sinh';db.services[0].robots='noindex,nofollow';db.services[0].focusKeyword='gội đầu dưỡng sinh';db.services[0].schemaJson=JSON.stringify({'@context':'https://schema.org','@type':'Service'});db.collections.nail[0].customMetadata={caption:'Nail riêng',featured:true};r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.equal(r.data.settings.mapEmbed,'https://www.google.com/maps/embed?pb=mock');checks.push('map embed setting survives database and public API');
 assert.equal(r.data.services[0].sourceTemplateRoute,'/goi-dau-duong-sinh');checks.push('copied original template route persists');
 assert.equal(r.data.services[0].robots,'noindex,nofollow');assert.equal(r.data.services[0].focusKeyword,'gội đầu dưỡng sinh');assert.equal(JSON.parse(r.data.services[0].schemaJson)['@type'],'Service');checks.push('SEO robots, focus keyword and schema persisted');
 assert.deepEqual(r.data.collections.nail[0].customMetadata,{caption:'Nail riêng',featured:true});checks.push('gallery custom metadata survives CMS save');
 let png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4,5]);
 r=await call('/api/admin/media?filename=a.png','POST',png);assert.equal(r.status,200);let m=r.data;assert.match(m.url,/res.cloudinary.com/);checks.push('Cloudinary upload');
 r=await call('/api/admin/state');db=r.data;db.collections.menu[0].image=m.url;r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);checks.push('media referenced');
 r=await call('/api/admin/media/'+m.id,'DELETE');assert.equal(r.status,409);checks.push('prevent deleting referenced media');
 r=await call('/api/admin/media/'+m.id+'?filename=b.png','PATCH',png);assert.equal(r.status,200);assert.equal(r.data.cleanupPending,true);checks.push('Cloudinary replacement queues failed deletion');
 r=await call('/api/admin/media-cleanup','POST');assert.equal(r.status,200);assert.equal(r.data.remaining,0);assert.equal(deleted.length,1);checks.push('retry cleanup deletes old');
 r=await call('/api/admin/state');db=r.data;assert.equal(db.collections.menu[0].image,'https://res.cloudinary.com/mock/image/upload/media-2.png');checks.push('all references replaced');
 db.collections.menu=[];r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/admin/media/'+m.id,'DELETE');assert.equal(r.status,404);assert.equal(deleted.length,2);checks.push('Cloudinary auto-delete unused when content removed');
 r=await call('/api/public');assert.equal(r.status,200);assert.ok(r.data.collections);assert.equal(r.data.collections.nail.length,8);assert.equal(r.data.collections.space.length,12);assert.equal(r.data.articles.length,11);checks.push('public seeded original collections/articles');
    const track=await call('/api/analytics/pageview','POST',{route:'/gioi-thieu'});assert.equal(track.status,200);assert.equal(track.data.recorded,true);checks.push('real pageview recorded');
    const dedup=await call('/api/analytics/pageview','POST',{route:'/gioi-thieu'});assert.equal(dedup.data.recorded,false);checks.push('duplicate pageview window');
    const zone=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date());const [y,mo]=zone.split('-').map(Number);
    const summary=await call(`/api/admin/analytics?month=${mo}&year=${y}`);assert.equal(summary.status,200);assert.equal(summary.data.total,1);assert.equal(summary.data.ips.reduce((n,r)=>n+r.count,0),1);checks.push('monthly daily/IP/browser/device analytics');
    r=await call('/api/admin/state');const up=r.data;up.settings.logo='https://res.cloudinary.com/mock/image/upload/logo.webp';up.settings.favicon='https://res.cloudinary.com/mock/image/upload/favicon.webp';r=await call('/api/admin/state','PUT',up);assert.equal(r.status,200);
    r=await call('/api/public');assert.equal(r.data.settings.logo,'https://res.cloudinary.com/mock/image/upload/logo.webp');assert.equal(r.data.settings.favicon,'https://res.cloudinary.com/mock/image/upload/favicon.webp');checks.push('logo/favicon settings published');
 // Verify actual CMS edits are reflected by the public data used on every React page.
 r=await call('/api/admin/state');db=r.data;
 const articleRoute=db.articles[0].sourceRoute;const articleSlug=db.articles[0].slug;
 db.articles[0].title='Tiêu đề đã sửa trong admin';
 db.collections.nail[0].image='https://res.cloudinary.com/mock/image/upload/nail-updated.webp';
 db.overrides['/gioi-thieu']||={};
 db.overrides['/gioi-thieu']['0']={text:'Nội dung CMS đã thay đổi',editText:true,hidden:false};
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.equal(r.data.articles.find(a=>a.slug===articleSlug).title,'Tiêu đề đã sửa trong admin');
 assert.equal(r.data.collections.nail[0].image,'https://res.cloudinary.com/mock/image/upload/nail-updated.webp');
 assert.equal(r.data.overrides['/gioi-thieu']['0'].text,'Nội dung CMS đã thay đổi');checks.push('article, album and subpage edit reflected in frontend API');
 r=await call('/api/admin/state');db=r.data;
 db.articles.find(a=>a.slug===articleSlug).status='draft';
 db.collections.nail.splice(0,1);
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.equal(r.data.articles.some(a=>a.slug===articleSlug),false);
 assert.equal(r.data.collections.nail.length,7);
 assert(r.data.hiddenSourceRoutes.includes(articleRoute));checks.push('unpublish article and remove nail asset persist without reseeding');
 // Stable CMS fields are not numeric; intro CTA must survive safeDb and remain on the public site.
 r=await call('/api/admin/state');db=r.data;db.overrides['/']||={};db.overrides['/']['intro-more']={text:'Khám phá thêm',href:'/gioi-thieu',editText:true,editHref:true,hidden:false};
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.equal(r.data.overrides['/']['intro-more'].text,'Khám phá thêm');checks.push('intro CTA admin text/link persisted to public API');
 // Source-page component can be hidden and re-enabled without changing any unrelated route.
 r=await call('/api/admin/state');db=r.data;db.overrides['/']['intro-more'].hidden=true;
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.equal(r.data.overrides['/']['intro-more'].hidden,true);checks.push('intro CTA hide action reflected in public API');
 // Ordered CMS collections must be returned exactly as saved rather than re-seeded.
 r=await call('/api/admin/state');db=r.data;const ordered=db.collections.space.slice().reverse();db.collections.space=ordered;
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 r=await call('/api/public');assert.deepEqual(r.data.collections.space.map(x=>x.id),ordered.map(x=>x.id));checks.push('gallery collection order round-trip persisted');

 /* ---- Xóa bản ghi bảng giá / ảnh album phải xóa file Cloudinary sở hữu ---- */
 const deletedBefore=deleted.length;
 // Upload 2 file: M1 dùng riêng cho bảng giá, M2 dùng chung cho bảng giá + album.
 r=await call('/api/admin/media?filename=price.png','POST',png);const m1=r.data;assert.equal(r.status,200);
 r=await call('/api/admin/media?filename=shared.png','POST',png);const m2=r.data;assert.equal(r.status,200);
 r=await call('/api/admin/state');db=r.data;
 db.collections.menu=[{id:'p1',title:'Bảng giá 1',image:m1.url,full:m1.url,status:'published',order:1},
   {id:'p2',title:'Bảng giá 2',image:m2.url,full:m2.url,status:'published',order:2}];
 db.albumCategories=[{id:'cat1',title:'Không gian',slug:'khong-gian',status:'published'}];
 db.albumItems=[{id:'a1',title:'Ảnh dùng chung',image:m2.url,alt:'',categoryId:'cat1',status:'published',order:1}];
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);
 checks.push('price + album records reference uploaded media');
 // Xóa bản ghi bảng giá sở hữu riêng file -> file bị xóa trên Cloudinary.
 r=await call('/api/admin/state');db=r.data;db.collections.menu=db.collections.menu.filter(x=>x.id!=='p1');
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);assert.equal(r.data.cloudinaryCleaned,1);checks.push('deleting a price record deletes its owned Cloudinary file');
 // Xóa bản ghi bảng giá dùng chung file -> file KHÔNG bị xóa vì album còn dùng.
 r=await call('/api/admin/state');db=r.data;db.collections.menu=db.collections.menu.filter(x=>x.id!=='p2');
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);assert.equal(r.data.cloudinaryCleaned,0);checks.push('shared file is kept while another record still uses it');
 // Xóa ảnh album cuối cùng dùng file đó -> file mới bị xóa.
 r=await call('/api/admin/state');db=r.data;db.albumItems=[];
 r=await call('/api/admin/state','PUT',db);assert.equal(r.status,200);assert.equal(r.data.cloudinaryCleaned,1);checks.push('deleting the last album photo deletes the Cloudinary file');
 r=await call('/api/admin/media/'+m2.id,'DELETE');assert.equal(r.status,404);checks.push('deleted album asset is gone from the media library');
 assert.equal(deleted.length-deletedBefore,2);checks.push('exactly the two owned Cloudinary assets were destroyed');
 console.log('API TEST',checks.length,'PASS:',checks.join('; '));
}catch(error){console.error('FAILED',checks, error);process.exitCode=1}finally{server.close();for(const p of [process.env.CMS_DB_PATH,process.env.CMS_STATS_PATH])try{fs.unlinkSync(p)}catch{}}
