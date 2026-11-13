import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** Accessible React gallery with swipe, pinch zoom and mouse drag. It contains no third-party CDN dependencies. */
export function GalleryLightbox({gallery,onClose,onChange}) {
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [moving,setMoving]=useState(false);
  const touch=useRef(null), pointers=useRef(new Map()), pointerStart=useRef(null), picture=useRef(null);
  const items=gallery?.items||[];
  const index=gallery?.index||0;
  const active=items[index];
  const updateZoom=(next)=>setZoom(Math.max(1,Math.min(5,Math.round(next*100)/100)));
  const go=(delta)=>{if(items.length<2)return;onChange((index+delta+items.length)%items.length)};
  useEffect(()=>{setZoom(1);setPan({x:0,y:0});pointers.current.clear()},[gallery?.index]);
  // Lock scrolling only on opening, with stable document width. Render as a
  // portal so existing page transforms/stacking contexts cannot affect overlay.
  const isOpen=Boolean(active);
  useEffect(()=>{
    if(!isOpen)return undefined;
    const body=document.body, html=document.documentElement;
    const before={bodyOverflow:body.style.overflow,htmlOverflow:html.style.overflow,htmlGutter:html.style.scrollbarGutter};
    const scrollX=window.scrollX,scrollY=window.scrollY;
    html.style.scrollbarGutter='stable';
    html.style.overflow='hidden';
    body.style.overflow='hidden';
    body.classList.add('mh-gallery-active');
    return ()=>{
      html.style.overflow=before.htmlOverflow;
      html.style.scrollbarGutter=before.htmlGutter;
      body.style.overflow=before.bodyOverflow;
      body.classList.remove('mh-gallery-active');
      if(Math.abs(window.scrollY-scrollY)>1||Math.abs(window.scrollX-scrollX)>1)window.scrollTo(scrollX,scrollY);
    };
  },[isOpen]);
  useEffect(()=>{
    if(!isOpen)return undefined;
    const key=(e)=>{
      if(e.key==='Escape'){e.preventDefault();onClose()}
      else if(e.key==='ArrowRight'){e.preventDefault();go(1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}
      else if(e.key==='+'||e.key==='='){e.preventDefault();updateZoom(zoom+.25)}
      else if(e.key==='-'){e.preventDefault();updateZoom(zoom-.25)}
    };
    document.addEventListener('keydown',key);
    return ()=>document.removeEventListener('keydown',key);
  },[isOpen,index,zoom,onClose,onChange,items.length]);
  if(!active)return null;
  const video=active.kind==='video';
  const pointDist=(points)=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
  function onPointerDown(e){
    if(e.target.closest('button')||video)return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.current.size===1)pointerStart.current={x:e.clientX,y:e.clientY,pan};
    if(pointers.current.size===2){touch.current={distance:pointDist([...pointers.current.values()]),initialZoom:zoom};pointerStart.current=null}
    setMoving(true);
  }
  function onPointerMove(e){
    if(!pointers.current.has(e.pointerId))return;
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.current.size>=2){
      const p=[...pointers.current.values()];
      if(touch.current)updateZoom(touch.current.initialZoom*pointDist(p)/touch.current.distance);
    }else if(zoom>1&&pointerStart.current){
      setPan({x:pointerStart.current.pan.x+e.clientX-pointerStart.current.x,y:pointerStart.current.pan.y+e.clientY-pointerStart.current.y});
    }
  }
  function onPointerUp(e){
    if(!pointers.current.has(e.pointerId))return;
    const start=pointerStart.current;
    pointers.current.delete(e.pointerId);
    if(pointers.current.size===0){
      if(start&&zoom===1){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15)go(dx<0?1:-1)}
      touch.current=null;pointerStart.current=null;setMoving(false);
    }
  }
  function wheel(e){if(e.ctrlKey||zoom>1){e.preventDefault();updateZoom(zoom+(e.deltaY<0?.2:-.2))}}
  return createPortal(<div className="mh-lightbox" role="dialog" aria-modal="true" aria-label="Thư viện ảnh" onClick={onClose}>
    <div className="mh-lightbox__toolbar" onClick={e=>e.stopPropagation()}>
      <span className="mh-lightbox__counter">{index+1} / {items.length}</span>
      {!video&&<><button type="button" aria-label="Thu nhỏ ảnh" onClick={()=>updateZoom(zoom-.25)} disabled={zoom<=1}>−</button><output aria-label="Tỉ lệ phóng to">{Math.round(zoom*100)}%</output><button type="button" aria-label="Phóng to ảnh" onClick={()=>updateZoom(zoom+.25)} disabled={zoom>=5}>+</button><button type="button" onClick={()=>{setZoom(1);setPan({x:0,y:0})}}>Đặt lại</button></>}
      <button type="button" className="mh-lightbox__close" aria-label="Đóng ảnh" onClick={onClose}>×</button>
    </div>
    {items.length>1&&<button className="mh-lightbox__arrow mh-lightbox__prev" type="button" aria-label="Ảnh trước" onClick={e=>{e.stopPropagation();go(-1)}}>‹</button>}
    <div className="mh-lightbox__stage" onClick={e=>e.stopPropagation()} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={wheel}>
      {video?<video key={active.src} src={active.src} controls autoPlay playsInline/>:<img ref={picture} src={active.src} alt={active.caption||'Ảnh Mi House Spa'} onError={(e)=>{if(active.thumbnail&&e.currentTarget.src!==active.thumbnail)e.currentTarget.src=active.thumbnail}} draggable={false} style={{transform:`translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,cursor:zoom>1?'grab':'zoom-in',transition:moving?'none':'transform .2s ease'}} onDoubleClick={()=>{setPan({x:0,y:0});updateZoom(zoom===1?2:1)}}/>}
    </div>
    {items.length>1&&<button className="mh-lightbox__arrow mh-lightbox__next" type="button" aria-label="Ảnh tiếp" onClick={e=>{e.stopPropagation();go(1)}}>›</button>}
    {active.caption&&<p className="mh-lightbox__caption" onClick={e=>e.stopPropagation()}>{active.caption}</p>}
    <p className="mh-lightbox__hint">Vuốt ngang để chuyển ảnh · Chụm hai ngón để phóng to · Nhấn Esc để đóng</p>
  </div>, document.body);
}
