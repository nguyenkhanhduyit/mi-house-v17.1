import React from 'react';
import AlbumShowcase from '../components/AlbumShowcase.jsx';
import HomeServiceCards from '../components/HomeServiceCards.jsx';
import {HomeSlides,HomeMenuImages,HomeVideos} from '../components/HomeCollections.jsx';
// Generated from the original Mi House Spa HTML; content and class names preserved.
export default function Page({cms}) {
  return (
    <main id="main-primary" data-landing="true">
      <div id="top" className="splide slideshow" style={{"aspectRatio": "1920/1000"}}>
        <div className="splide__track">
          <div className="splide__list slideshow__list">
            <HomeSlides cms={cms}/>
</div>
        </div>
      </div>
      <section id="gioi-thieu" className="intro">
        <div className="intro__container">
          <div className="intro__left lazy-background py:80 lg:w-100" data-bg-image="https://mihousespa.com/assets/images/intro-bg.jpg" data-bg-options="center / cover no-repeat">
            <div className="intro__info">
              <h2 className="intro__title">
                {"Đôi nét về"}
              </h2>
              <h3 className="intro__name">
                {"MI HOUSE SPA"}
              </h3>
              <p className="intro__slogan">
                {"Gội đầu dưỡng sinh - Massage body"}
              </p>
              <div className="intro__desc ck-editor">
                <p>
                  <strong>
                    {"Mi House Spa"}
                  </strong>
                  {" là địa chỉ chăm sóc sức khỏe và sắc đẹp theo phong cách dưỡng sinh tại Gò Vấp, TP.HCM. Với không gian mang gam màu "}
                  <strong>
                    {"nâu – be"}
                  </strong>
                  {" ấm áp, nhẹ nhàng cùng phong cách phục vụ tận tâm, Mi House Spa mang đến một nơi để bạn tạm gác lại những mệt mỏi, thư giãn cơ thể và chăm sóc bản thân sau những giờ làm việc, học tập bận rộn."}
                </p>
                <p>
                  {"Nếu bạn đang tìm kiếm một địa chỉ "}
                  <strong>
                    {"GỘI ĐẦU DƯỠNG SINH "}
                  </strong>
                  {" có không gian thư giãn, dịch vụ đa dạng và thuận tiện, Mi House Spa là một lựa chọn đáng để trải nghiệm. Spa tập trung vào các dịch vụ chăm sóc thư giãn như "}
                  <strong>
                    {"gội đầu dưỡng sinh, massage và nail"}
                  </strong>
                  {", đáp ứng nhu cầu chăm sóc cơ thể và làm đẹp trong cùng một không gian."}
                </p>
              </div>
              <a className="home__btn intro__btn" data-cms-field="intro-more" href="/gioi-thieu"><span>Xem thêm</span><span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="intro__right lg:w-100">
            <figure className="intro__media">
              <img className="intro__media-image w-100" src="https://mihousespa.com/thumbs/960x940x1/upload/news/2026/09/20/1wupukm89irozafcsrti31nwnjrvqtmdan2rgrkyqmrks5xaqqx5ys4mbt7cyoqazwh-1789886518.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="MI HOUSE SPA" width="960" height="940" />
            </figure>
          </div>
        </div>
      </section>
      <div className="marquee home__welcome bg:theme-brand py:30" data-speed="80">
        <div className="marquee__track">
          <div className="marquee__group">
            <img src="https://mihousespa.com/assets/images/icon-3stars.png" alt="" width="86" height="33" />
            <span>
              {"Mi House Spa"}
            </span>
          </div>
          <div className="marquee__group">
            <img src="https://mihousespa.com/assets/images/icon-3stars.png" alt="" width="86" height="33" />
            <span>
              {"Mi House Spa"}
            </span>
          </div>
        </div>
      </div>
      <section id="dich-vu" className="service-featured py:100">
        <div className="service-featured__container wrap-content">
          <header className="home__header service-featured__header xl:flex-100">
            <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1">
              {"Services"}
            </div>
            <h2 className="home__title ff:title fw:700 fsz:60 text-uppercase text:theme-brand m-0">
              {"Dịch vụ tiêu biểu"}
            </h2>
          </header>
          <div className="service__list service-featured__body xl:w-100">
            <div className="swiper swiper-auto" data-swiper="slidesPerView:1|breakpoints:{321:{slidesPerView:1},577:{slidesPerView:2},851:{slidesPerView:3},1025:{slidesPerView:3},1201:{slidesPerView:3}}|autoplay:{delay:5000,pauseOnMouseEnter:true,disableOnInteraction:false}|speed:1000|lazy:true|loop:true">
              <ul className="swiper-wrapper"><HomeServiceCards cms={cms}/></ul>
            </div>
          </div>
        </div>
      </section>
      <section id="bang-gia" className="service-price lazy-background py:100" data-bg-image="https://mihousespa.com/assets/images/service-price-bg.png" data-bg-options="center top / cover no-repeat">
        <div className="wrap-content">
          <header className="home__header text-center mb:2.5rem">
            <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#ffffff80 mb:-32">
              {"Price service"}
            </div>
            <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:white">
              {"Bảng giá dịch vụ"}
            </h2>
          </header>
          <div className="service-price__list">
            <div className="swiper swiper-auto" data-swiper="slidesPerView:1|spaceBetween:10|breakpoints:{321:{slidesPerView:1,spaceBetween:10},577:{slidesPerView:2,spaceBetween:10},851:{slidesPerView:2,spaceBetween:10},1025:{slidesPerView:2,spaceBetween:16},1201:{slidesPerView:2,spaceBetween:20}}|autoplay:{delay:3000,pauseOnMouseEnter:true,disableOnInteraction:false}|speed:1000|lazy:true|loop:true">
              <ul className="swiper-wrapper">
                <HomeMenuImages cms={cms}/>
</ul>
            </div>
            <div className="service-price__aside">
              <p className="service-price__aside-title">
                {"Menu"}
              </p>
              <div className="service-price__aside-group">
                <p className="service-price__aside-name">
                  {"Mi House Spa"}
                </p>
                <a className="service-price__aside-btn" href="/bang-gia">Xem chi tiết</a>
                
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="vi-sao-chon" className="why-choose py:80">
        <div className="wrap-content">
          <header className="home__header text-center mb:2.5rem">
            <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1 my:-32">
              {"Why"}
            </div>
            <h2 className="home__title ff:title fw:600 fsz:42 leading:tight text-uppercase text:theme-brand-dark">
              {"Vì sao chọn Mi House Spa"}
            </h2>
            <p className="home__desc ff:body fsz:17 mb-0">
              {"Mi House Spa mang đến trải nghiệm dưỡng sinh tinh tế trong không gian nâu – be thanh lịch, ấm cúng. Với dịch vụ gội đầu dưỡng sinh, massage và nail được chăm chút chỉn chu, mỗi lần ghé spa là một lần bạn tận hưởng sự thư giãn trọn vẹn."}
            </p>
          </header>
          <div className="why-choose__list">
            <div className="swiper swiper-auto" data-swiper="slidesPerView:1|spaceBetween:16|breakpoints:{321:{slidesPerView:1,spaceBetween:16},577:{slidesPerView:2,spaceBetween:16},851:{slidesPerView:3,spaceBetween:16},1025:{slidesPerView:4,spaceBetween:16},1201:{slidesPerView:4,spaceBetween:16}}|autoplay:{delay:5000,pauseOnMouseEnter:true,disableOnInteraction:false}|speed:1000|lazy:true|loop:true">
              <ul className="swiper-wrapper">
                <li className="swiper-slide">
                  <article className="why-choose__item">
                    <figure className="why-choose__media">
                      <img className="why-choose__media-image" src="https://mihousespa.com/thumbs/100x70x2/upload/news/2026/09/05/why-choose-1-1788572570.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Uy tín chất lượng" width="100" height="70" />
                    </figure>
                    <div className="why-choose__info">
                      <h3 className="why-choose__name">
                        {"Uy tín chất lượng"}
                      </h3>
                      <p className="why-choose__desc">
                        {"Tận tâm trong từng dịch vụ, chú trọng chất lượng và mang đến trải nghiệm chăm sóc sắc đẹp, thư giãn đáng tin cậy cho mỗi khách hàng."}
                      </p>
                    </div>
                  </article>
                </li>
                <li className="swiper-slide">
                  <article className="why-choose__item">
                    <figure className="why-choose__media">
                      <img className="why-choose__media-image" src="https://mihousespa.com/thumbs/100x70x2/upload/news/2026/09/05/why-choose-2-1788572589.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Chi phí hợp lý" width="100" height="70" />
                    </figure>
                    <div className="why-choose__info">
                      <h3 className="why-choose__name">
                        {"Chi phí hợp lý"}
                      </h3>
                      <p className="why-choose__desc">
                        {"Mức giá hợp lý, minh bạch, phù hợp với nhu cầu làm đẹp và thư giãn của nhiều khách hàng."}
                      </p>
                    </div>
                  </article>
                </li>
                <li className="swiper-slide">
                  <article className="why-choose__item">
                    <figure className="why-choose__media">
                      <img className="why-choose__media-image" src="https://mihousespa.com/thumbs/100x70x2/upload/news/2026/09/05/why-choose-3-1788572598.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Không gian sang trọng" width="100" height="70" />
                    </figure>
                    <div className="why-choose__info">
                      <h3 className="why-choose__name">
                        {"Không gian sang trọng"}
                      </h3>
                      <p className="why-choose__desc">
                        {"Không gian nâu – be tinh tế, ấm cúng và thanh lịch, mang đến cảm giác thư giãn và thoải mái ngay từ khi bước vào."}
                      </p>
                    </div>
                  </article>
                </li>
                <li className="swiper-slide">
                  <article className="why-choose__item">
                    <figure className="why-choose__media">
                      <img className="why-choose__media-image" src="https://mihousespa.com/thumbs/100x70x2/upload/news/2026/09/05/why-choose-4-1788572607.webp" loading="lazy" fetchPriority="auto" decoding="async" alt="Tư vấn nhiệt tình" width="100" height="70" />
                    </figure>
                    <div className="why-choose__info">
                      <h3 className="why-choose__name">
                        {"Tư vấn nhiệt tình"}
                      </h3>
                      <p className="why-choose__desc">
                        {"Đội ngũ Mi House Spa luôn lắng nghe, tư vấn tận tình và hỗ trợ khách hàng lựa chọn dịch vụ phù hợp với nhu cầu, sở thích và mong muốn cá nhân."}
                      </p>
                    </div>
                  </article>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section id="dao-tao" className="training-featured training-landing py:100">
        <div className="wrap-content">
          <header className="home__header text-center"><div className="home__subtitle">TRAIN</div><h2 className="home__title">Đào tạo học viên</h2></header>
          <div className="training-landing__grid mh-swipe-strip" aria-label="Các chuyên ngành đào tạo">
            {[
              ['Đào tạo Nail','trainingNail','https://mihousespa.com/thumbs/500x800x1/upload/news/2026/09/10/anh-chup-man-hinh-2026-09-10-luc-124213-1789018938.webp'],
              ['Đào tạo Gội đầu','trainingHair','https://mihousespa.com/thumbs/500x690x1/upload/news/2026/09/10/khong-gian-3-1789038355.webp'],
              ['Đào tạo Massage','trainingMassage','https://mihousespa.com/thumbs/500x800x1/upload/news/2026/09/10/anh-chup-man-hinh-2026-09-10-luc-124320-1789019006.webp'],
            ].map(([title,key,src])=><article className="training-landing__card" key={key}>
              <a className="training-landing__image-button" href="/dao-tao-hoc-vien" aria-label={'Xem chi tiết '+title}>
                <img className="training-landing__image" src={cms?.settings?.[key+'Image']||src} alt={cms?.settings?.[key+'Title']||title} loading="lazy"/>
              </a>
              <h3 className="training-landing__name"><a href="/dao-tao-hoc-vien">{cms?.settings?.[key+'Title']||title}</a></h3>
            </article>)}
          </div>
        </div>
      </section>
      <AlbumShowcase cms={cms}/>
      <div className="marquee home__welcome bg:theme-brand py:30" data-speed="80">
        <div className="marquee__track">
          <div className="marquee__group">
            <img src="https://mihousespa.com/assets/images/icon-3stars.png" alt="" width="86" height="33" />
            <span>
              {"Mi House Spa"}
            </span>
          </div>
          <div className="marquee__group">
            <img src="https://mihousespa.com/assets/images/icon-3stars.png" alt="" width="86" height="33" />
            <span>
              {"Mi House Spa"}
            </span>
          </div>
        </div>
      </div>
      <section id="tiktok" className="video-featured my:100">
        <div className="video-featured__container wrap-content">
          <header className="home__header video-featured__header xl:flex-100">
            <div className="home__subtitle fw:600 fsz:90 leading:tightest text-uppercase text-gradient gradient:#EDE3D1">
              {"Tiktok"}
            </div>
            <h2 className="home__title ff:title fw:700 fsz:60 text-uppercase text:theme-brand m-0">
              {"Liên kết tiktok"}
            </h2>
          </header>
          <div className="video__list video-featured__body xl:w-100">
            <div className="swiper swiper-auto" data-swiper="slidesPerView:1|spaceBetween:10|breakpoints:{321:{slidesPerView:2,spaceBetween:10},577:{slidesPerView:2,spaceBetween:10},851:{slidesPerView:3,spaceBetween:16},1025:{slidesPerView:3,spaceBetween:24},1201:{slidesPerView:3,spaceBetween:40}}|autoplay:{delay:5000,pauseOnMouseEnter:true,disableOnInteraction:false}|speed:1000|lazy:true|loop:true">
              <ul className="swiper-wrapper">
                <HomeVideos cms={cms}/>
</ul>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
