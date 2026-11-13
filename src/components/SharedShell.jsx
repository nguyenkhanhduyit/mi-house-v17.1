import React from 'react';
// Shared header, navigation, footer and floating contact actions extracted as real JSX.
export function Header() {
  return (
    <header id="header-primary">
      <ul className="h-card hidden-seo">
        <li className="h-fn fn">
          {"Mi House Spa Beauty"}
        </li>
        <li className="h-org org">
          {"Mi House Spa Beauty"}
        </li>
        <li className="h-tel tel">
          {"0767882407"}
        </li>
        <li>
          <a className="u-url ul" href="/">
            {"https://mihousespa.com/"}
          </a>
        </li>
      </ul>
      <h1 className="hidden-seo">
        {"Mi House Spa Beauty"}
      </h1>
    </header>
  );
}

export function Navigation({route='/',settings={}}) {
  const [open,setOpen]=React.useState(false);
  const [albumOpen,setAlbumOpen]=React.useState(false);
  React.useEffect(()=>{setOpen(false);setAlbumOpen(false)},[route]);
  React.useEffect(()=>{
    const onEscape=e=>{if(e.key==='Escape')setOpen(false)};
    document.addEventListener('keydown',onEscape);
    document.body.classList.toggle('no-scroll',open);
    return()=>{document.removeEventListener('keydown',onEscape);document.body.classList.remove('no-scroll')};
  },[open]);
  const raw=settings.contactLink||settings.bookingLink||'https://zalo.me/0767882407';
  const contact=/^(https?:\/\/|tel:|mailto:|\/(?!\/))/i.test(raw)&&raw!=='/lien-he'?raw:'https://zalo.me/0767882407';
  // Navigation follows the original source's category and detail page hierarchy.
  const items=[['Trang chủ','/'],['Giới thiệu','/gioi-thieu'],['Dịch vụ','/dich-vu'],['Bảng giá','/bang-gia'],['Đào tạo','/dao-tao'],['Album ảnh','/album-anh'],['Tin tức','/tin-tuc']];
  const galleryLinks=[['Nail hottrend','/nail-hottrend'],['Không gian','/khong-gian']];
  const logo=<a className="logo__photo" href="/" onClick={()=>setOpen(false)} aria-label="Trang chủ Mi House Spa"><img src="/thumbs/120x120x1/upload/photo/2026/09/18/99cc7455-142a-44ff-8b8d-2e4b90c81c10-removebg-preview-1789700965.webp" alt="Mi House Spa" width="120" height="120"/></a>;
  const root=route.split('?')[0];
  const active=(href)=>{
    if(href===root)return true;
    if(href==='/dich-vu'&&['/nail','/massage','/goi-dau-duong-sinh'].includes(root))return true;
    if(href==='/dao-tao'&&root==='/dao-tao-hoc-vien')return true;
    if(href==='/album-anh'&&['/nail-hottrend','/khong-gian'].includes(root))return true;
    if(href==='/tin-tuc'&&root!=='/'&&!items.some((x)=>x[1]===root)&&!['/lien-he','/dao-tao-hoc-vien','/nail','/massage','/goi-dau-duong-sinh','/nail-hottrend','/khong-gian'].includes(root))return true;
    return false;
  };
  function renderItems(mobile=false){return items.map(([label,href],i)=><React.Fragment key={href}>
    {!mobile&&i>0&&<li className="navigation__separator" role="separator"/>}
    <li className={'navigation__item'+(active(href)?' active':' inactive')+(href==='/album-anh'?' has-child':' no-child')}>
      <a className="navigation__link" href={href} aria-current={active(href)?'page':undefined} onClick={mobile?()=>setOpen(false):undefined}>{label}</a>
      {href==='/album-anh'&&<>
        <button className="navigation__button show-child" type="button" aria-label="Mở các album ảnh" aria-expanded={albumOpen} onClick={()=>setAlbumOpen(x=>!x)}>⌄</button>
        <ul className={'navigation__list level-1'+(mobile&&albumOpen?' show':'')}>
          {galleryLinks.map(([title,url])=><li className="navigation__item no-child" key={url}><a className="navigation__link" href={url} onClick={()=>setOpen(false)}>{title}</a></li>)}
        </ul>
      </>}
    </li>
  </React.Fragment>)}
  const ext=/^https?:/i.test(contact)?{target:'_blank',rel:'noopener noreferrer'}:{};
  const contactItem=(mobile=false)=><li className="navigation__item"><a className="navigation__link navigation__contact" href={contact} {...ext} onClick={mobile?()=>setOpen(false):undefined}>Liên hệ</a></li>;
  return <header className={'navigation will-fixed virtual-space '+(route==='/'?'is-index':'not-index')+(open?' nav-open':'')}>
    <div className="navigation__container wrap-content">
      <div className="navigation__bar">
        <figure className="logo navigation__logo">{logo}</figure>
        <nav className="navigation__main mh-desktop-nav" aria-label="Menu website"><ul className="navigation__list level-0">{renderItems()}<li className="navigation__separator" role="separator"/>{contactItem()}</ul></nav>
        {!open && <button className="navigation__button open-nav" type="button" aria-label="Mở menu" aria-expanded={false} aria-controls="mh-mobile-navigation" onClick={()=>setOpen(true)}><span/><span/><span/></button>}
      </div>
      <div className={'navigation__overlay'+(open?' is-active nav-show':'')} onClick={()=>setOpen(false)} aria-hidden="true"/>
      <nav className={'navigation__mobile'+(open?' is-open nav-show':'')} id="mh-mobile-navigation" aria-label="Menu điện thoại" aria-hidden={!open}>
        <div className="mh-mobile-head"><figure className="logo navigation__logo">{logo}</figure><button className="mh-mobile-close" type="button" aria-label="Đóng menu" onClick={()=>setOpen(false)}>×</button></div>
        <ul className="navigation__list level-0">{renderItems(true)}{contactItem(true)}</ul>
      </nav>
    </div>
  </header>;
}

function safeMapsEmbed(value){
 const raw=String(value||'').trim();
 const match=raw.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
 const url=match?.[1]||raw;
 try {const parsed=new URL(url);return parsed.protocol==='https:'&&parsed.hostname==='www.google.com'&&parsed.pathname.startsWith('/maps/embed')?parsed.href:'';}catch{return ''}
}
export function Footer({settings={}}) {
  const external=(value,fallback)=>/^(https?:\/\/|tel:|mailto:|\/(?!\/))/i.test(value||'')?value:fallback;
  const address=settings.address||'43 đường Quang Trung, phường Gò Vấp, Thành Phố Hồ Chí Minh';
  const phone=settings.phone||'0767882407';
  const email=settings.email||'nguyenquynhdiem1988@gmail.com';
  const website=settings.website||'mihousespa.com';
  const facebook=settings.facebook||'https://www.facebook.com/mihousespa/';
  const maps=settings.maps??'';
  const mapEmbed=safeMapsEmbed(settings.mapEmbed);
  const contact=settings.contactLink||'https://zalo.me/0767882407';
  const logo=settings.logo||'https://mihousespa.com/thumbs/140x140x1/upload/photo/2026/09/18/99cc7455-142a-44ff-8b8d-2e4b90c81c10-removebg-preview-1789700957.webp';
  return (
    <footer className="footer mh-footer" id="footer-primary">
      <div className="footer__group lazy-background" data-bg-image="https://mihousespa.com/assets/images/footer-bg.jpg" data-bg-options="center / cover no-repeat">
        <section className="footer__article py:60">
          <div className="wrap-content">
            <div className="footer__article-list">
              <div className="footer__article-item">
                <figure className="logo footer__logo">
                  <a className="logo__photo" href="/">
                    <img className="" src={logo} loading="lazy" fetchPriority="auto" decoding="async" alt={settings.brand||'Mi House Spa'} width="140" height="140" />
                  </a>
                </figure>
                <h2 className="footer__name">
                  {settings.brand||'Mi House Spa'}
                </h2>
                <p className="footer__desc">
                  {settings.description||'Gội đầu dưỡng sinh - Massage body - Nail'}
                </p>
              </div>
              <div className="footer__article-item">
                <div className="footer__info">
                  <h2 className="footer__title">
                    {"Thông tin liên hệ"}
                  </h2>
                  <address className="footer__content ck-editor">
                    <p>
                      {"Địa Chỉ: 43 đường Quang Trung, phường Gò Vấp, Thành Phố Hồ Chí Minh"}
                    </p>
                    <p>
                      {"Hotline: 0767882407"}
                    </p>
                    <p>
                      {"Email: nguyenquynhdiem1988@gmail.com"}
                    </p>
                    <p>
                      {"Website: "+website.replace(/^https?:\/\//,'')}
                    </p>
                  </address>
                </div>
              </div>
              <div className="footer__article-item">
                <div className="footer__nav footer__policy">
                  <h2 className="footer__title">
                    {"Danh mục"}
                  </h2>
                  <ul className="footer__nav-list">
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/">
                        {"Trang chủ"}
                      </a>
                    </li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/gioi-thieu">
                        {"Giới thiệu"}
                      </a>
                    </li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/dich-vu">
                        {"Dịch vụ"}
                      </a>
                    </li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/bang-gia">
                        {"Bảng giá"}
                      </a>
                    </li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/album-anh">
                        {"Album ảnh"}
                      </a>
                    </li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href="/dao-tao">
                        {"Đào tạo"}
                      </a>
                    </li>
                    <li className="footer__nav-item"><a className="footer__nav-name hvr-underline" href="/tin-tuc">Tin tức</a></li>
                    <li className="footer__nav-item">
                      <a className="footer__nav-name hvr-underline" href={external(settings.contactLink,'https://zalo.me/0767882407')}>
                        {"Liên hệ"}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="footer__article-item">
                <div className="footer__social">
                  <h2 className="footer__title">
                    {"Follow us"}
                  </h2>
                  <div className="social">
                    <ul className="social__list">
                      <li className="social__item">
                        <a className="social__item-inner block-normal" href={facebook} target="_blank" rel="nofollow">
                          <figure className="social__photo">
                            <img className="" src="https://mihousespa.com/thumbs/26x26x1/upload/photo/2026/09/04/fb-1788513580.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Facebook" width="26" height="26" />
                          </figure>
                          <span className="social__name">
                            {"Facebook"}
                          </span>
                        </a>
                      </li>
                      <li className="social__item">
                        <a className="social__item-inner block-normal" href={maps} target="_blank" rel="nofollow">
                          <figure className="social__photo">
                            <img className="" src="https://mihousespa.com/thumbs/26x26x1/upload/photo/2026/09/04/ggmap-1788513613.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Google Map" width="26" height="26" />
                          </figure>
                          <span className="social__name">
                            {"Google Map"}
                          </span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="footer__powered">
          <div className="wrap-content">
            <div className="footer__copyright">
              {"Copyright ©\n "}
              <span>
                {"Mi House Spa Beauty"}
              </span>
              {".\n "}
              <span>
                {"All rights reserved."}
              </span>
              <span>
                {"Designed by "}
                <a href="https://nasani.vn" target="_blank" rel="nofollow">
                  {"Nasani.vn"}
                </a>
              </span>
            </div>
          </div>
        </section>
      </div>
      {mapEmbed&&<section className="footer__map">
        <div className="google-map footer__map-iframe">
          <iframe title="Bản đồ Mi House Spa" src={mapEmbed} width="600" height="450" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      </section>}
    </footer>
  );
}

export function FloatingContact({settings={}}) {
  const phone=settings.phone||'0767882407';
  const contact=settings.contactLink||'https://zalo.me/0767882407';
  const facebook=settings.facebook||'https://www.facebook.com/mihousespa/';
  const maps=settings.maps||'https://maps.app.goo.gl/FGYh7DnPTGSz6qNc8';
  const digits=phone.replace(/[^+\d]/g,'');
  return (
    <div className="main-widget">
      <div className="def-content unsee element">
        <div className="def-header">
          {"\n Liên hệ với chúng tôi\n "}
          <div className="close-icon" title="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
            </svg>
          </div>
        </div>
        <div className="item phone">
          <a href={"tel:"+digits}>
            <span className="img">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path fill="currentColor" d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path>
              </svg>
            </span>
            <div className="detail">
              <b className="arcu-item-title">
                {"Hotline:"}
              </b>
              <span className="arcu-item-subtitle">
                {phone}
              </span>
            </div>
          </a>
        </div>
        <div className="item zalo">
          <a target="_blank" href={contact}>
            <span className="img">
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 614.501 613.667" xmlSpace="preserve">
                <path fill="currentColor" d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202   c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z"></path>
                <path fill="currentColor" d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502   c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z"></path>
                <path fill="currentColor" d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142   c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083   c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621   c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652   c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789   c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725   c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z    M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084   c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866   c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053   c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z    M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512   c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833   c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868   c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986   C524.207,366.492,498.534,392.205,463.981,391.868z"></path>
              </svg>
            </span>
            <div className="detail">
              <b className="arcu-item-title">
                {"\n Zalo chat:\n "}
              </b>
              <span className="arcu-item-subtitle">
                {"\n Tài khoản Zalo: "+phone+"\n "}
              </span>
            </div>
          </a>
        </div>
        <div className="item mess">
          <a target="_blank" href={facebook}>
            <span className="img">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-messenger" viewBox="0 0 16 16">
                <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z"></path>
              </svg>
            </span>
            <div className="detail">
              <b className="arcu-item-title">
                {"\n Messenger:\n "}
              </b>
              <span className="arcu-item-subtitle">
                {"\n Mi House Spa Beauty\n "}
              </span>
            </div>
          </a>
        </div>
        <div className="item map">
          <a target="_blank" href={maps}>
            <span className="img">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pin-map" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8l3-4z"></path>
                <path fillRule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"></path>
              </svg>
            </span>
            <div className="detail">
              <b className="arcu-item-title">
                {"Địa chỉ:"}
              </b>
              <span className="arcu-item-subtitle">
                {"Xem địa chỉ"}
              </span>
            </div>
          </a>
        </div>
      </div>
      <div className="out-circle">
        <div className="pregan element"></div>
        <div className="pregan element"></div>
        <div className="main-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <g transform="translate(-825 -308)">
              <g>
                <path transform="translate(825 308)" fill="#FFFFFF" d="M 19 4L 17 4L 17 13L 4 13L 4 15C 4 15.55 4.45 16 5 16L 16 16L 20 20L 20 5C 20 4.45 19.55 4 19 4ZM 15 10L 15 1C 15 0.45 14.55 0 14 0L 1 0C 0.45 0 0 0.45 0 1L 0 15L 4 11L 14 11C 14.55 11 15 10.55 15 10Z"></path>
              </g>
            </g>
          </svg>
          <p>
            {"Liên hệ"}
          </p>
        </div>
        <div className="ser-icon element">
          <div className="main-widget-process">
            <span className="img phone item">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 512 512">
                <path fill="currentColor" d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path>
              </svg>
            </span>
            <span className="img zalo item">
              <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 614.501 613.667" xmlSpace="preserve">
                <path fill="currentColor" d="M464.721,301.399c-13.984-0.014-23.707,11.478-23.944,28.312c-0.251,17.771,9.168,29.208,24.037,29.202   c14.287-0.007,23.799-11.095,24.01-27.995C489.028,313.536,479.127,301.399,464.721,301.399z"></path>
                <path fill="currentColor" d="M291.83,301.392c-14.473-0.316-24.578,11.603-24.604,29.024c-0.02,16.959,9.294,28.259,23.496,28.502   c15.072,0.251,24.592-10.87,24.539-28.707C315.214,313.318,305.769,301.696,291.83,301.392z"></path>
                <path fill="currentColor" d="M310.518,3.158C143.102,3.158,7.375,138.884,7.375,306.3s135.727,303.142,303.143,303.142   c167.415,0,303.143-135.727,303.143-303.142S477.933,3.158,310.518,3.158z M217.858,391.083   c-33.364,0.818-66.828,1.353-100.133-0.343c-21.326-1.095-27.652-18.647-14.248-36.583c21.55-28.826,43.886-57.065,65.792-85.621   c2.546-3.305,6.214-5.996,7.15-12.705c-16.609,0-32.784,0.04-48.958-0.013c-19.195-0.066-28.278-5.805-28.14-17.652   c0.132-11.768,9.175-17.329,28.397-17.348c25.159-0.026,50.324-0.06,75.476,0.026c9.637,0.033,19.604,0.105,25.304,9.789   c6.22,10.561,0.284,19.512-5.646,27.454c-21.26,28.497-43.015,56.624-64.559,84.902c-2.599,3.41-5.119,6.88-9.453,12.725   c23.424,0,44.123-0.053,64.816,0.026c8.674,0.026,16.662,1.873,19.941,11.267C237.892,379.329,231.368,390.752,217.858,391.083z    M350.854,330.211c0,13.417-0.093,26.841,0.039,40.265c0.073,7.599-2.599,13.647-9.512,17.084   c-7.296,3.642-14.71,3.028-20.304-2.968c-3.997-4.281-6.214-3.213-10.488-0.422c-17.955,11.728-39.908,9.96-56.597-3.866   c-29.928-24.789-30.026-74.803-0.211-99.776c16.194-13.562,39.592-15.462,56.709-4.143c3.951,2.619,6.201,4.815,10.396-0.053   c5.39-6.267,13.055-6.761,20.271-3.357c7.454,3.509,9.935,10.165,9.776,18.265C350.67,304.222,350.86,317.217,350.854,330.211z    M395.617,369.579c-0.118,12.837-6.398,19.783-17.196,19.908c-10.779,0.132-17.593-6.966-17.646-19.512   c-0.179-43.352-0.185-86.696,0.007-130.041c0.059-12.256,7.302-19.921,17.896-19.222c11.425,0.752,16.992,7.448,16.992,18.833   c0,22.104,0,44.216,0,66.327C395.677,327.105,395.828,348.345,395.617,369.579z M463.981,391.868   c-34.399-0.336-59.037-26.444-58.786-62.289c0.251-35.66,25.304-60.713,60.383-60.396c34.631,0.304,59.374,26.306,58.998,61.986   C524.207,366.492,498.534,392.205,463.981,391.868z"></path>
              </svg>
            </span>
            <span className="img mess item">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-messenger" viewBox="0 0 16 16">
                <path d="M0 7.76C0 3.301 3.493 0 8 0s8 3.301 8 7.76-3.493 7.76-8 7.76c-.81 0-1.586-.107-2.316-.307a.639.639 0 0 0-.427.03l-1.588.702a.64.64 0 0 1-.898-.566l-.044-1.423a.639.639 0 0 0-.215-.456C.956 12.108 0 10.092 0 7.76zm5.546-1.459-2.35 3.728c-.225.358.214.761.551.506l2.525-1.916a.48.48 0 0 1 .578-.002l1.869 1.402a1.2 1.2 0 0 0 1.735-.32l2.35-3.728c.226-.358-.214-.761-.551-.506L9.728 7.381a.48.48 0 0 1-.578.002L7.281 5.98a1.2 1.2 0 0 0-1.735.32z"></path>
              </svg>
            </span>
            <span className="img map item">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-pin-map" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8l3-4z"></path>
                <path fillRule="evenodd" d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z"></path>
              </svg>
            </span>
          </div>
        </div>
        <div className="close-icon unsee element">
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ScrollToTop() {
  return (
    <button type="button" className="scroll-to-top" id="scroll-to-top">
      <span></span>
      <span></span>
    </button>
  );
}

