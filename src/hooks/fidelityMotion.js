/* Behaviour matched to the supplied page captures: true leftward loop marquees,
   touch-scrollable media strips and synchronized editorial panes. No external library. */

function seamlessMarquees(root, disposers) {
  for (const marquee of root.querySelectorAll('.marquee.home__welcome')) {
    const track = marquee.querySelector('.marquee__track');
    if (!track) continue;
    const originals = [...track.children];
    if (!originals.length) continue;
    let clones = [];
    let timer;
    const build = () => {
      track.style.animation = 'none';
      clones.forEach(node => node.remove());
      clones = [];
      const width = Math.max(marquee.clientWidth, window.innerWidth);
      let guard = 0;
      // Form one complete, self-contained sequence that always covers the viewport.
      while (track.scrollWidth < width + 120 && guard++ < 35) {
        const node = originals[(guard - 1) % originals.length].cloneNode(true);
        node.setAttribute('aria-hidden', 'true');
        track.append(node);
        clones.push(node);
      }
      const phase = [...track.children];
      const distance = track.scrollWidth;
      for (const item of phase) {
        const node = item.cloneNode(true);
        node.setAttribute('aria-hidden', 'true');
        track.append(node);
        clones.push(node);
      }
      track.style.setProperty('--mh-marquee-distance', `${distance}px`);
      track.style.setProperty('--mh-marquee-duration', `${Math.max(14,Math.round(distance / 82))}s`);
      // Web Animations and CSS both animate; CSS is the authoritative implementation.
      void track.offsetWidth;
      track.style.animation = '';
      track.dataset.marqueeReady = 'true';
    };
    const debounced = () => { clearTimeout(timer); timer = setTimeout(build, 120); };
    build();
    window.addEventListener('resize', debounced);
    disposers.push(() => {
      clearTimeout(timer);
      window.removeEventListener('resize', debounced);
      track.style.animation = 'none';
      clones.forEach(node => node.remove());
      track.removeAttribute('data-marquee-ready');
    });
  }
}

function albumAutoplay(root, disposers) {
  for (const gallery of root.querySelectorAll('.album-featured__splide')) {
    const track = gallery.querySelector('.splide__track');
    const list = gallery.querySelector('.splide__list');
    if (!track || !list || list.children.length < 2) continue;
    const slides = [...list.children];
    gallery.classList.add('mh-album-active');
    let paused = false;
    let debounce;
    function tick() {
      if (paused || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const first = slides[0];
      if (!first) return;
      const step = first.getBoundingClientRect().width + 14;
      const max = track.scrollWidth - track.clientWidth;
      if (max < 5) return;
      track.scrollTo({ left: track.scrollLeft + step > max + 3 ? 0 : track.scrollLeft + step, behavior: 'smooth' });
    }
    const timer = window.setInterval(tick, gallery.closest('.album-featured__list')?.matches(':nth-child(2)') ? 2800 : 3400);
    const stop = () => { paused = true; clearTimeout(debounce); };
    const resume = () => { debounce = window.setTimeout(() => { paused = false; }, 1800); };
    track.addEventListener('pointerdown', stop);
    track.addEventListener('pointerup', resume);
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('focusin', stop);
    track.addEventListener('focusout', resume);
    disposers.push(() => {
      window.clearInterval(timer); clearTimeout(debounce);
      track.removeEventListener('pointerdown', stop);
      track.removeEventListener('pointerup', resume);
      track.removeEventListener('mouseenter', stop);
      track.removeEventListener('mouseleave', resume);
      track.removeEventListener('focusin', stop);
      track.removeEventListener('focusout', resume);
    });
  }
}

function priceCarousel(root, disposers) {
  const target = root.querySelector('.service-price .swiper-auto');
  if (!target) return;
  const viewport = target.querySelector('.swiper-wrapper');
  if (!viewport || viewport.children.length < 2) return;
  let pauseUntil = 0;
  const pause = () => { pauseUntil = Date.now() + 5500; };
  const scroll = dir => {
    const slide = viewport.querySelector('.swiper-slide');
    if (!slide) return;
    const gap = Number.parseFloat(getComputedStyle(viewport).gap) || 20;
    viewport.scrollBy({ left: dir * (slide.getBoundingClientRect().width + gap), behavior: 'smooth' });
  };
  const prev = document.createElement('button');
  const next = document.createElement('button');
  prev.className = 'mh-price-arrow mh-price-arrow--prev';
  next.className = 'mh-price-arrow mh-price-arrow--next';
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label', 'Xem bảng giá trước');
  next.setAttribute('aria-label', 'Xem bảng giá tiếp theo');
  prev.textContent = '‹'; next.textContent = '›';
  const backward = () => { pause(); scroll(-1); };
  const forward = () => { pause(); scroll(1); };
  prev.addEventListener('click', backward); next.addEventListener('click', forward);
  target.append(prev,next);
  viewport.addEventListener('pointerdown', pause);
  viewport.addEventListener('touchstart', pause, { passive:true });
  // Existing swiper autoplay remains active; do not add a second interval.
  disposers.push(() => { prev.remove();next.remove();viewport.removeEventListener('pointerdown', pause);viewport.removeEventListener('touchstart', pause); });
}

function addReveal(root, disposers) {
  const selectors = ['.service-featured__header','.service__item','.why-choose__item','.training-featured__left','.training-featured__right','.news-featured__left','.news-featured__right'];
  const items = [...root.querySelectorAll(selectors.join(','))];
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('mh-revealed'); observer.unobserve(entry.target); }
  }), {threshold:0.08,rootMargin:'60px'});
  items.forEach(item => observer.observe(item));
  disposers.push(() => observer.disconnect());
}

export function initFidelityMotion(root) {
  if (!root) return () => {};
  const disposers = [];
  seamlessMarquees(root, disposers);
  // Source Splide AutoScroll is initialized in sourceCarousels.js; do not compete.
  // Source Swiper handles the price menu; avoid synthetic scrolling and arrows.
  addReveal(root, disposers);
  return () => disposers.forEach(fn => fn());
}
