/**
 * scroll-animate.js — Custom Scroll Animation Engine
 * Nhẹ (~3KB), không dependency, thay thế AOS.js
 *
 * Cách dùng trong HTML:
 *   data-sa="fade-up"        — fade lên từ dưới (mặc định)
 *   data-sa="fade-down"      — fade xuống từ trên
 *   data-sa="fade-left"      — fade từ phải sang trái
 *   data-sa="fade-right"     — fade từ trái sang phải
 *   data-sa="zoom-in"        — phóng to vào
 *   data-sa="zoom-out"       — thu nhỏ vào
 *   data-sa="flip-up"        — lật từ dưới lên
 *   data-sa="slide-up"       — trượt lên mạnh hơn
 *   data-sa="none"           — không animation (chỉ trigger class)
 *
 * Modifier attributes:
 *   data-sa-delay="200"      — delay ms (0-3000)
 *   data-sa-duration="600"   — thời gian animation ms (default 600)
 *   data-sa-easing="ease"    — CSS easing (default ease)
 *   data-sa-once="false"     — replay khi scroll lại (default true = once)
 *   data-sa-offset="100"     — px từ bottom viewport để trigger (default 80)
 */

(function () {
  'use strict';

  var SA_SELECTOR = '[data-sa]';
  var SA_ACTIVE_CLASS = 'sa-animate';
  var DEFAULT_DURATION = 600;
  var DEFAULT_OFFSET = 80; // px từ bottom viewport

  /* ──────────────────────────────────────────
   * Khởi tạo từng element
   * ────────────────────────────────────────── */
  function initElement(el) {
    if (el.hasAttribute('data-sa-init')) return;
    el.setAttribute('data-sa-init', '1');

    var duration = parseInt(el.getAttribute('data-sa-duration') || DEFAULT_DURATION, 10);
    var delay    = parseInt(el.getAttribute('data-sa-delay')    || 0, 10);
    var easing   = el.getAttribute('data-sa-easing') || 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    el.style.transitionDuration = duration + 'ms';
    el.style.transitionDelay    = delay + 'ms';
    el.style.transitionTimingFunction = easing;
  }

  /* ──────────────────────────────────────────
   * Kích hoạt animation
   * ────────────────────────────────────────── */
  function activateElement(el) {
    if (el.classList.contains(SA_ACTIVE_CLASS)) return;
    el.classList.add(SA_ACTIVE_CLASS);
  }

  /* ──────────────────────────────────────────
   * Deactivate (dùng khi once=false)
   * ────────────────────────────────────────── */
  function deactivateElement(el) {
    el.classList.remove(SA_ACTIVE_CLASS);
  }

  /* ──────────────────────────────────────────
   * Stagger: tự động thêm delay cho các child elements
   * Nếu parent có data-sa-stagger, mỗi child sẽ delay thêm Nms
   * ────────────────────────────────────────── */
  function initStagger() {
    document.querySelectorAll('[data-sa-stagger]').forEach(function (parent) {
      var step   = parseInt(parent.getAttribute('data-sa-stagger') || 80, 10);
      var base   = parseInt(parent.getAttribute('data-sa-delay')   || 0, 10);
      var target = parent.getAttribute('data-sa-stagger-target') || '[data-sa]';

      parent.querySelectorAll(target).forEach(function (child, i) {
        child.setAttribute('data-sa-delay', base + step * i);
      });
    });
  }

  /* ──────────────────────────────────────────
   * IntersectionObserver engine
   * ────────────────────────────────────────── */
  function buildObserver(offset) {
    // Negative rootMargin = chỉ trigger khi element cách bottom viewport = offset px
    var rootMargin = '0px 0px -' + offset + 'px 0px';

    return new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var el   = entry.target;
        var once = el.getAttribute('data-sa-once') !== 'false';

        if (entry.isIntersecting) {
          activateElement(el);
          if (once) this.unobserve(el);
        } else if (!once) {
          deactivateElement(el);
        }
      }.bind(this));
    }, {
      rootMargin: rootMargin,
      threshold:  0
    });
  }

  /* ──────────────────────────────────────────
   * Fallback: scroll event cho browser cũ
   * ────────────────────────────────────────── */
  function fallbackScroll(elements) {
    function check() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var vh = window.innerHeight || document.documentElement.clientHeight;

      elements.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var offset = parseInt(el.getAttribute('data-sa-offset') || DEFAULT_OFFSET, 10);

        if (rect.top < vh - offset) {
          activateElement(el);
        }
      });
    }

    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ──────────────────────────────────────────
   * Auto-apply: thêm data-sa vào các section phổ biến
   * nếu chưa có data-sa
   * ────────────────────────────────────────── */
  function autoApply(fromAjax) {
    var rules = [
      /* ── Section wrappers (animate section header) ── */
      { sel: '.title-main:not([data-sa])',                  sa: 'fade-up'    },
      { sel: '.title-list:not([data-sa])',                  sa: 'fade-up'    },
      { sel: '.title-detail:not([data-sa])',                sa: 'fade-up'    },
      { sel: '.section-title:not([data-sa])',               sa: 'fade-up'    },
      { sel: '.title-page:not([data-sa])',                  sa: 'fade-up'    },

      /* ── Cards / items ── */
      { sel: '.pro-item:not([data-sa]):not(.splide__slide)', sa: 'fade-up'   },
      { sel: '.news-item:not([data-sa]):not(.splide__slide)', sa: 'fade-up'  },
      { sel: '.blog-item:not([data-sa]):not(.splide__slide)', sa: 'fade-up'  },

      /* ── Home sections ── */
      { sel: '.home-news-video__col:not([data-sa])',        sa: 'fade-up'    },
      { sel: '.home-customer-contact__col:not([data-sa])',  sa: 'fade-up'    },
      { sel: '.home-video-player:not([data-sa])',           sa: 'zoom-in'    },
      { sel: '.info-main:not([data-sa])',                   sa: 'fade-up'    },
      { sel: '.info-product:not([data-sa])',                sa: 'fade-up'    },
      { sel: '.info-news:not([data-sa])',                   sa: 'fade-up'    },

      /* ── Contact ── */
      { sel: '.contact-left:not([data-sa])',                sa: 'fade-right' },
      { sel: '.contact-right:not([data-sa])',               sa: 'fade-left'  },
      { sel: '.contact-map:not([data-sa])',                 sa: 'zoom-in'    },

      /* ── About / static (KHÔNG apply cho content-main vì ảnh hưởng SEO) ── */
      { sel: '.about-content:not([data-sa])',               sa: 'fade-right' },
      { sel: '.about-image:not([data-sa])',                 sa: 'fade-left'  },
      /* .content-main bị loại khỏi auto-apply để Googlebot đọc được nội dung */

      /* ── Statistics & count-up ── */
      { sel: '.statistical-item:not([data-sa])',            sa: 'zoom-in'    },
      { sel: '.js-count-up:not([data-sa])',                 sa: 'fade-up'    },

      /* ── Partner, slider wrappers ── */
      { sel: '.partner-item:not([data-sa])',                sa: 'zoom-in'    },
      { sel: '.home-partner:not([data-sa])',                sa: 'fade-up'    },
      { sel: '.home-intro:not([data-sa])',                  sa: 'fade-up'    },
      { sel: '.info-banner:not([data-sa])',                 sa: 'fade-up'    },
    ];

    rules.forEach(function (rule) {
      var els = document.querySelectorAll(rule.sel);
      els.forEach(function (el, i) {
        // Khi gọi từ page load: bỏ qua elements above-fold
        // Khi gọi từ AJAX (fromAjax=true): apply tất cả (chúng mới được inject)
        if (!fromAjax) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.6) return;
        }
        el.setAttribute('data-sa', rule.sa);

        // Stagger: các element cùng loại trong 1 wrapper, max delay 400ms
        if (!el.hasAttribute('data-sa-delay')) {
          var idx = i % 8;
          if (idx > 0) el.setAttribute('data-sa-delay', idx * 70);
        }
      });
    });
  }


  /* ──────────────────────────────────────────
   * INIT
   * ────────────────────────────────────────── */
  function init() {
    // Auto-apply cho các element không có data-sa thủ công
    autoApply();

    // Xử lý stagger containers
    initStagger();

    var elements = document.querySelectorAll(SA_SELECTOR);
    if (!elements.length) return;

    // Init styles cho mọi element
    elements.forEach(initElement);

    if ('IntersectionObserver' in window) {
      // Nhóm theo offset khác nhau
      var offsetGroups = {};
      elements.forEach(function (el) {
        var offset = el.getAttribute('data-sa-offset') || DEFAULT_OFFSET;
        if (!offsetGroups[offset]) offsetGroups[offset] = [];
        offsetGroups[offset].push(el);
      });

      Object.keys(offsetGroups).forEach(function (offset) {
        var observer = buildObserver(parseInt(offset, 10));
        offsetGroups[offset].forEach(function (el) {
          observer.observe(el);
        });
      });
    } else {
      // Fallback cho IE / Safari cũ
      fallbackScroll(elements);
    }
  }

  // Chạy sau DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Đợi một tick để layout xong
    setTimeout(init, 0);
  }

  /* ──────────────────────────────────────────
   * Expose global
   * ────────────────────────────────────────── */
  window.SA = {
    init: init,

    /**
     * refresh() — gọi sau khi inject HTML mới (AJAX)
     * - Tự động thêm data-sa cho elements mới (autoApply)
     * - Animate ngay các item đang trong viewport (AJAX items)
     * - Observe các item chưa trong viewport
     */
    refresh: function () {
      // Auto-apply cho elements mới không có data-sa
      // fromAjax=true: không bỏ qua elements đang trong viewport
      autoApply(true);
      initStagger();

      var newEls = document.querySelectorAll(SA_SELECTOR + ':not([data-sa-init])');
      if (!newEls.length) return;

      // Init styles
      newEls.forEach(initElement);

      if ('IntersectionObserver' in window) {
        var observer = buildObserver(DEFAULT_OFFSET);
        var vh = window.innerHeight || document.documentElement.clientHeight;

        newEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          // Nếu element đang trong viewport → animate ngay (có delay từ data-sa-delay)
          if (rect.top < vh && rect.bottom > 0) {
            // Dùng requestAnimationFrame để đảm bảo CSS transition đã được áp dụng
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                activateElement(el);
              });
            });
          } else {
            // Chưa vào viewport → dùng Observer
            observer.observe(el);
          }
        });
      } else {
        fallbackScroll(newEls);
      }
    }
  };

})();
