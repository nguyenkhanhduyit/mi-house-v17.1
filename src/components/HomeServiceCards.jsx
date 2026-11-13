import React from 'react';
import {resolveMedia,isPublished} from '../cms/managedContent.js';
// Keep the original HTML class structure and Swiper configuration. Content is
// React-owned so a CMS update never appends duplicate cards to a mounted slider.
const fallback=[
 {id:'service-goi-dau-duong-sinh',title:'GỘI ĐẦU DƯỠNG SINH',sourceRoute:'/goi-dau-duong-sinh',image:'https://mihousespa.com/thumbs/500x800x1/upload/news/2026/09/10/anh-chup-man-hinh-2026-09-10-luc-124429-1789019075.webp'},
 {id:'service-massage',title:'MASSAGE',sourceRoute:'/massage',image:'https://mihousespa.com/thumbs/500x800x1/upload/news/2026/09/10/anh-chup-man-hinh-2026-09-10-luc-124320-1789019006.webp'},
 {id:'service-nail',title:'NAIL',sourceRoute:'/nail',image:'https://mihousespa.com/thumbs/500x800x1/upload/news/2026/09/10/anh-chup-man-hinh-2026-09-10-luc-124213-1789018938.webp'}
];
export default function HomeServiceCards({cms}){
 const rows=Array.isArray(cms?.services)?cms.services:fallback;
 return <>{rows.filter(x=>isPublished(x)).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)).map(row=>{
  const sourceSlug=(row.sourceRoute||'').split('/').filter(Boolean).pop();
  const href=row.sourceRoute&&(!row.slug||row.slug===sourceSlug)?row.sourceRoute:`/dich-vu/${row.slug||''}`;
  const image=resolveMedia(cms,row.displayImage)||resolveMedia(cms,row.image);
  return <li className="swiper-slide" key={row.id} data-cms-record={row.id}><div className="service__item"><article className="service__card"><figure className="service__media"><a className="service__media-link scale-img" href={href} title={row.title}><img className="service__media-image w-100" src={image} loading="lazy" decoding="async" alt={row.alt||row.title} width="500" height="800"/></a></figure><div className="service__info"><h3 className="service__name"><a className="text-split transition" href={href} title={row.title}>{row.title}</a></h3></div></article></div></li>
 })}</>;
}
