import React from 'react';
import albumGroups from '../../album-source-map.json';
import {resolveMedia,isPublished,sortAlbumPhotos,originalAlbumFull} from '../cms/managedContent.js';
/** Two continuous visual galleries: first heading before photos, second heading after photos.
 *  Follows the markup order of uploaded _home.html, not the legacy category template. */
export default function AlbumShowcase({cms}) {
  return (
    <section id="album-anh" className="album-featured py:80" aria-label="Album ảnh Mi House Spa">
      {albumGroups.map((group,index)=>!cms?.albumCategories||cms.albumCategories.some(c=>c.id===(index===0?'nail':'space')&&c.status!=='draft') ? (
        <div className="album-featured__list" id={index===0?'nail-hottrend':'khong-gian'} key={group.title}>
              {index===0&&<h3 className="album-featured__title">{group.title}</h3>}
          <div className="splide album-featured__splide">
            <div className="splide__track" tabIndex="0" aria-label={'Vuốt ngang để xem ảnh '+group.title}>
              <div className="splide__list">
                {(cms?.collectionsInitialized?sortAlbumPhotos((cms.collections?.[index===0?'nail':'space']||[]).filter(item=>isPublished(item)&&(item.image||item.video)),index===0?'nail':'space').map(item=>({src:item.image,full:originalAlbumFull(item,index===0?'nail':'space'),alt:item.alt||item.title||group.title,video:item.video,title:item.title||group.title})):group.images.map((item,i)=>({src:typeof item==='string'?item:item?.src,alt:(typeof item==='object'?item?.alt:null)||(group.title||'')+' '+(i+1)}))).map((photo,i)=>(
                  <div className="splide__slide" key={(photo.src||photo.video||'')+'-'+i}>
                    <figure className="album-featured__item">
                      <img className="album-featured__image w-100" src={resolveMedia(cms,photo.src)||'/media-placeholder.svg'} alt={photo.alt+' '+(i+1)} loading="lazy" decoding="async" width="360" height="360"/>
                    </figure>
                  </div>
                    ))}
              </div>
            </div>
          </div>
          {index===1&&<h3 className="album-featured__title">{group.title}</h3>}
        </div>
      ) : null)}
    </section>
  );
}
    
