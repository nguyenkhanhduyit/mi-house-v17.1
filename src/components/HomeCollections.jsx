import React from 'react';
import seed from '../cms/initialContent.json';
import {resolveMedia,isPublished} from '../cms/managedContent.js';

// Pure React rendering keeps the original Swiper/Splide DOM intact while CMS
// inserts, edits, deletes or reorders slides. No imperative React child removal.
const collection=(cms,key)=>{
 const list=cms?.collectionsInitialized?(cms.collections?.[key]||[]):(seed.collections?.[key]||[]);
 return list.filter(row=>isPublished(row)).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
};
const safeHref=value=>{
 if(typeof value!=='string'||!value.trim())return '';
 if(value.startsWith('/')&&!value.startsWith('//'))return value;
 try{const url=new URL(value);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?value:''}catch{return ''}
};
const resolvedMedia=(cms,value)=>resolveMedia(cms,value);
const originalSlides=new Map((seed.collections.slides||[]).map(row=>[row.id,row.image]));
const screenSizes=[
 ['(max-width: 768px)','768x400x1'],
 ['(max-width: 1024px)','1024x534x1'],
 ['(max-width: 1366px)','1366x712x1'],
 ['(max-width: 1600px)','1600x834x1'],
 ['(max-width: 1920px)','1920x1000x1'],
];
function SlidePicture({item,index}){
 const original=originalSlides.get(item.id);
 const hasSizes=original===item.image && /\/thumbs\/1920x1000x1\//.test(original||'');
 const img=<img className="slideshow__media-image w-100" src={item.image} sizes="100vw" loading={index===0?'eager':'lazy'} fetchPriority={index===0?'high':'auto'} decoding="async" alt={item.title||''} width="1920" height="1000"/>;
 if(!hasSizes)return img;
 return <picture className="w-100">{screenSizes.map(([media,size])=><source key={size} media={media} srcSet={item.image.replace('1920x1000x1',size)} type="image/webp"/>)}{img}</picture>;
}
export function HomeSlides({cms}){
 const rows=collection(cms,'slides').filter(x=>x.image).map(x=>({...x,image:resolvedMedia(cms,x.image)}));
 return <>{rows.map((item,index)=>{
  const originalNumber=Number(item.id?.match(/original-slides-(\d+)/)?.[1]||0);
  const settingLink=originalNumber===1?cms?.settings?.slide1Link:originalNumber===2?cms?.settings?.slide2Link:'';
  const storedHref=safeHref(item.href);
  const href=(storedHref&&storedHref!=='/lien-he'?storedHref:'')||safeHref(settingLink)||storedHref||safeHref(cms?.settings?.bookingLink)||'/lien-he';
  const booking=safeHref(cms?.settings?.bookingLink)||'/lien-he';
  return <div className="splide__slide slideshow__item" key={item.id}>
    <figure className="slideshow__media"><SlidePicture item={item} index={index}/></figure>
    <a className="mh-slide-coverage" href={href} aria-label={item.title||'Xem slide'} target={/^https?:/i.test(href)?'_blank':undefined} rel={/^https?:/i.test(href)?'noopener noreferrer':undefined}/>
    <div className="slideshow__info"><div className="slideshow__info-card">
      <h3 className="slideshow__name">{item.title||''}</h3>
      <p className="slideshow__desc">{item.description??(originalNumber===2?'Gội đầu dưỡng sinh':'')}</p>
      <a className="slideshow__btn" href={booking} target={/^https?:/i.test(booking)?'_blank':undefined} rel={/^https?:/i.test(booking)?'noopener noreferrer':undefined}><span>Đặt lịch hẹn ngay</span></a>
    </div></div>
   </div>
 })}</>;
}
export function HomeMenuImages({cms}){
 return <>{collection(cms,'menu').filter(x=>x.image).map(row=><li className="swiper-slide" key={row.id}>
  <figure className="service-price__item" data-fancybox="menu" data-src={resolvedMedia(cms,row.full||row.image)} data-caption={row.title||''}>
    <img className="service-price__image w-100" src={resolvedMedia(cms,row.image)} loading="lazy" fetchPriority="auto" decoding="async" alt={row.title||''} width="480" height="710"/>
  </figure>
 </li>)}</>;
}
export function HomeVideos({cms}){
 return <>{collection(cms,'videos').filter(x=>x.image||x.video).map(row=><li className="swiper-slide" key={row.id}>
    <div className="video__item"><article className="video__card" data-fancybox="video" data-src={resolvedMedia(cms,row.video||'')} data-caption={row.title||' '}>
      <figure className="video__media scale-img play-icon"><img className="video__media-image w-100" src={resolvedMedia(cms,row.image)||'/media-placeholder.svg'} loading="lazy" fetchPriority="auto" decoding="async" alt={row.title||''} width="420" height="670"/></figure>
      <h3 className="video__name text-split">{row.title==='Video TikTok'?' ':row.title||' '}</h3>
    </article></div>
  </li>)}</>;
}
