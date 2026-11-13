import React from 'react';
import {cleanHtml,resolveMedia,categoryItems,isPublished} from '../cms/managedContent.js';
const groups=[['services','/dich-vu','Dịch vụ'],['training','/dao-tao','Đào tạo']];
/** Render one album item: an image, or a video when the record carries one. */
function AlbumMedia({item,cms,group}){
 const image=resolveMedia(cms,item.image);
 const video=resolveMedia(cms,item.video);
 if(video){
  return <div className="scale-img cursor-pointer" data-fancybox={group} data-src={video} data-caption={item.title||''}>
    <img src={image||'/media-placeholder.svg'} className="w-100" loading="lazy" alt={item.alt||item.title||''}/>
  </div>;
 }
 return <div className="scale-img cursor-pointer" data-fancybox={group} data-src={item.full||image} data-caption={item.title||''}>
  <img src={image} className="w-100" loading="lazy" alt={item.alt||item.title||''}/>
 </div>;
}
export default function CmsManagedPage({cms,route}){
 const album=route.startsWith('/album/');
 if(album){
  const slug=route.slice('/album/'.length);
  const category=(cms?.albumCategories||[]).find(x=>x&&x.slug===slug&&isPublished(x));
  if(!category)return <main id="main-primary" className="mh-source-page"><div className="wrap-content"><h1>Không tìm thấy album</h1><p>Danh mục album không tồn tại hoặc đã bị ẩn.</p><a href="/album-anh">Xem tất cả album</a></div></main>;
  const pictures=categoryItems(category,cms);
  return <main id="main-primary" className="mh-source-page"><div className="breadCrumbs"><div className="wrap-content"><ol className="breadcrumb"><li><a href="/">Trang chủ</a></li><li><a href="/album-anh">Album ảnh</a></li><li className="active">{category.title}</li></ol></div></div><div className="wrap-main"><div className="wrap-content"><div className="title-main"><h1>{category.title}</h1></div><div className="news-detail-gallery">{pictures.filter(p=>p.image||p.video).map(p=><div className="album-item" key={p.id}><AlbumMedia item={p} cms={cms} group={category.id}/><h3 className="album-item__name text-split webkit-line-clamp-2">{' '}</h3></div>)}</div></div></div></main>;
 }
 const group=groups.find(([,prefix])=>route.startsWith(prefix+'/'));const type=group?.[0];
 const item=(cms?.[type]||[]).find(x=>isPublished(x)&&x.slug&&route===group[1]+'/'+x.slug);
 if(!item)return <main id="main-primary" className="mh-source-page"><div className="wrap-content"><h1>Không tìm thấy nội dung</h1><p>Bài viết không tồn tại hoặc đã bị ẩn.</p><a href={group?group[1]:'/'}>{group?group[2]:'Về trang chủ'}</a></div></main>;
 const content=typeof window==='undefined'?'':cleanHtml(item.body||'');
 const cover=resolveMedia(cms,item.displayImage||item.image);
 return <main id="main-primary" className="mh-source-page"><div className="breadCrumbs"><div className="wrap-content"><ol className="breadcrumb"><li><a href="/">Trang chủ</a></li><li><a href={group[1]}>{group[2]}</a></li><li className="active">{item.title}</li></ol></div></div><div className="wrap-main"><div className="wrap-content"><div className="news-detail-layout"><article className="news-detail-main"><div className="title-detail news-detail-title"><h1>{item.title}</h1></div>{item.description?<p className="news-detail-desc">{item.description}</p>:null}<div className="content-toc-wrap"><div className="box-toc js-content-toc"><div className="box-toc__header"><div className="box-toc__title">Mục lục</div></div><div className="box-toc__body"><ul className="box-toc__list"/></div></div><div className="content-main">{cover?<img src={cover} alt={item.alt||item.title} style={{maxWidth:'100%',height:'auto'}}/>:null}{content?<article dangerouslySetInnerHTML={{__html:content}}/>:<p>{item.description}</p>}</div></div></article><aside className="news-detail-side"/></div></div></div></main>;
}
