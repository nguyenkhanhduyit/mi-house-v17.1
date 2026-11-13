import React, {useMemo} from 'react';
import {resolveMedia,isPublished} from '../cms/managedContent.js';

/** Newly published CMS articles use the same HTML structure as the legacy source articles. */
function cleanEditorHtml(value) {
  if(typeof window==='undefined' || !value) return '';
  const dom=new DOMParser().parseFromString(String(value),'text/html');
  dom.querySelectorAll('script,iframe,object,embed,form,style,link,meta,base').forEach(el=>el.remove());
  dom.body.querySelectorAll('*').forEach(el=>{
    for(const attr of [...el.attributes]) {
      const name=attr.name.toLowerCase(),raw=attr.value.trim();
      if(name.startsWith('on') || name==='srcdoc' || name==='style' && /url\s*\(/i.test(raw) || ['href','src','xlink:href'].includes(name) && /^(javascript:|data:text\/html)/i.test(raw))el.removeAttribute(attr.name);
    }
  });
  return dom.body.innerHTML;
}
export default function CmsArticlePage({cms,route}) {
  const article=(cms?.articles||[]).find(a=>isPublished(a)&&a.slug&&`/tin-tuc/${a.slug}`===route);
  const content=useMemo(()=>cleanEditorHtml(article?.body),[article?.body]);
  const cover=resolveMedia(cms,article?.cover||article?.displayImage||article?.image);
  if(!article)return <main className="mh-source-page"><div className="wrap-content" style={{padding:'90px 12px'}}><h1>Bài viết chưa công khai</h1><a href="/tin-tuc">Xem tin tức</a></div></main>;
  return <main id="main-primary" className="mh-source-page mh-cms-article">
    <div className="breadCrumbs"><div className="wrap-content"><ol className="breadcrumb"><li><a href="/">Trang chủ</a></li><li><a href="/tin-tuc">Tin tức</a></li><li className="active">{article.title}</li></ol></div></div>
    <div className="wrap-main"><div className="wrap-content"><div className="news-detail-layout">
      <article className="news-detail-main"><div className="title-detail news-detail-title"><h1>{article.title}</h1></div>
        <div className="news-detail-meta"><span>Mi House Spa Beauty</span></div>
        <div className="content-toc-wrap">
          <div className="box-toc js-content-toc" style={{display:'none'}}><div className="box-toc__header"><div className="box-toc__title">Nội dung bài viết</div></div><div className="box-toc__body"><ul className="box-toc__list"/></div></div>
          {cover&&<img src={cover} alt={article.alt||article.title} style={{width:'100%',height:'auto',objectFit:'cover',marginBottom:18}}/>}
          <div className="content-main">{content ? <div dangerouslySetInnerHTML={{__html:content}}/> : <p>{article.description||''}</p>}</div>
        </div>
      </article>
      <aside className="news-detail-side"><div className="news-side"><h3 className="news-side-title">Tin liên quan</h3><div className="news-side-list"/></div></aside>
    </div></div></div>
  </main>;
}
