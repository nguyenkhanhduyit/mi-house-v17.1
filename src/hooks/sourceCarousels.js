/** Identical runtime libraries and motion parameters from the supplied _home.html
 * and public/assets/js/apps.js. The scripts are bundled locally, never fetched
 * from the live website. Returns a disposer safe for React remounts/CMS updates.
 */
const scripts = new Map();
function loadLocal(src, ready) {
  if (ready()) return Promise.resolve();
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.async = false; script.dataset.mhLibrary = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Không tải được thư viện giao diện: ' + src));
      document.head.appendChild(script);
    }));
  }
  return scripts.get(src);
}

export function initSourceCarousels(root) {
  if (!root) return () => {};
  let cancelled = false;
  const instances = [];
  (async () => {
    try {
      await Promise.all([
        loadLocal('/assets/splide/splide.min.js', () => Boolean(window.Splide)),
        loadLocal('/assets/swiper/swiper-bundle.min.js', () => Boolean(window.Swiper)),
      ]);
      await loadLocal('/assets/splide/splide-extension-auto-scroll.min.js', () => Boolean(window.splide?.Extensions?.AutoScroll));
      if (cancelled || !root.isConnected) return;

      // Settings reproduced from NN_FRAMEWORK.Others in bundled apps.js.
      root.querySelectorAll('.album-featured__splide').forEach((container) => {
        const slideCount = container.querySelectorAll('.splide__list > .splide__slide').length;
        if (slideCount < 2 || container.classList.contains('is-initialized')) return;
        const instance = new window.Splide(container, {
          type: 'loop', drag: 'free', focus: 'center', perPage: 7, gap: 2,
          breakpoints: {
            321: { perPage: 2 }, 577: { perPage: 3 }, 851: { perPage: 4 },
            1025: { perPage: 5 }, 1201: { perPage: 6 },
          },
          autoScroll: { speed: container.closest('#nail-hottrend') ? 2 : -2 },
          pagination: false, arrows: false,
        });
        instance.mount(window.splide.Extensions);
        instances.push(instance);
      });

      // Settings reproduced from the data-swiper attribute of _home.html.
      const price = root.querySelector('.service-price .swiper-auto');
      if (price && !price.classList.contains('swiper-initialized')) {
        const instance = new window.Swiper(price, {
          slidesPerView: 1, spaceBetween: 10, loop: true,
          breakpoints: {
            321: { slidesPerView: 1, spaceBetween: 10 },
            577: { slidesPerView: 2, spaceBetween: 10 },
            851: { slidesPerView: 2, spaceBetween: 10 },
            1025: { slidesPerView: 2, spaceBetween: 16 },
            1201: { slidesPerView: 2, spaceBetween: 20 },
          },
          autoplay: { delay: 3000, pauseOnMouseEnter: true, disableOnInteraction: false },
          speed: 1000, lazy: true, grabCursor: true, allowTouchMove: true,
        });
        instances.push(instance);
      }
      root.dataset.sourceCarouselsReady = 'true';
    } catch (error) {
      console.error('[Mi House Spa] Không khởi tạo được slider gốc:', error);
      root.dataset.sourceCarouselsError = error.message;
    }
  })();
  return () => {
    cancelled = true;
    instances.forEach(instance => {
      try { instance.destroy(true); } catch (error) { console.warn(error); }
    });
    delete root.dataset.sourceCarouselsReady;
  };
}
