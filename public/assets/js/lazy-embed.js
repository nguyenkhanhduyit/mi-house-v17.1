/**
 * Lazy Embed Loader v2
 * - Google Maps iframes trong .contact-map / .footer-main__map:
 *   Tự động bọc thành click-to-load map (lazy-map)
 * - Tất cả iframes có class .lazy-embed[data-src]:
 *   Load khi vào viewport (IntersectionObserver)
 * - Facebook SDK: load sau scroll đầu tiên, không block page load
 */

(function () {
   "use strict";

   /* ─────────────────────────────────────────
    * 1. AUTO-WRAP GOOGLE MAP IFRAMES
    *    Tìm các container .contact-map, .footer-main__map
    *    và tự động bọc iframe bên trong thành lazy-map
    * ───────────────────────────────────────── */
   function wrapMapIframes() {
      var mapContainers = document.querySelectorAll(".contact-map, .footer__map-iframe");

      mapContainers.forEach(function (container) {
         var iframe = container.querySelector("iframe");
         if (!iframe) return;

         // Lấy src của iframe
         var src = iframe.src || iframe.getAttribute("src") || "";
         if (!src) return;

         // Lấy kích thước gốc nếu có
         var origHeight = iframe.height || iframe.style.height || "";
         if (!origHeight || origHeight === "0") origHeight = "400px";
         else if (!isNaN(origHeight)) origHeight = origHeight + "px";

         // Ẩn iframe gốc
         iframe.style.display = "none";
         // Lưu src để dùng sau, xóa src để ngăn load
         iframe.removeAttribute("src");

         // Tạo wrapper lazy-map
         var wrapper = document.createElement("div");
         wrapper.className = "lazy-map";
         wrapper.setAttribute("data-src", src);
         wrapper.style.height = origHeight;

         // Static map thumbnail (dùng Google Maps Static API)
         // Trích xuất tọa độ từ URL nếu có
         var staticThumb = "";
         var qParam = src.match(/[?&]q=([^&]+)/);
         var pbParam = src.match(/!3d([\d.]+)!4d([\d.]+)/);
         if (pbParam && window.GOOGLE_MAP_API_KEY) {
            staticThumb = "https://maps.googleapis.com/maps/api/staticmap?center=" + pbParam[1] + "," + pbParam[2] + "&zoom=15&size=800x400&key=" + window.GOOGLE_MAP_API_KEY;
         }

         var thumbHtml = staticThumb
            ? '<img class="lazy-map__thumb" src="' + staticThumb + '" alt="Map" loading="lazy">'
            : '<div class="lazy-map__thumb lazy-map__thumb--nophoto"></div>';

         wrapper.innerHTML =
            thumbHtml +
            '<div class="lazy-map__overlay">' +
            '<div class="lazy-map__icon">' +
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#ea4335"/>' +
            "</svg>" +
            "</div>" +
            '<button class="lazy-map__btn" type="button">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285f4"/>' +
            "</svg>" +
            (window.LANG_MAP_BTN || "Xem bản đồ") +
            "</button>" +
            '<span class="lazy-map__label">' +
            (window.LANG_MAP_LABEL || "Nhấn để tải Google Maps") +
            "</span>" +
            "</div>";

         // Thêm wrapper vào container (trước iframe đã bị ẩn)
         container.insertBefore(wrapper, iframe);
      });
   }

   /* ─────────────────────────────────────────
    * 2. LAZY IFRAME (IntersectionObserver)
    *    Dùng cho các wrapper có class .lazy-embed
    *    HTML mẫu:
    *    <div class="lazy-embed" data-src="https://maps.google.com/...">
    *        <div class="lazy-embed__placeholder">...</div>
    *    </div>
    * ───────────────────────────────────────── */
   function activateLazyEmbeds() {
      var wrappers = document.querySelectorAll(".lazy-embed[data-src]");
      if (!wrappers.length) return;

      if (!("IntersectionObserver" in window)) {
         // Fallback: load all immediately
         wrappers.forEach(function (el) {
            loadEmbed(el);
         });
         return;
      }

      var observer = new IntersectionObserver(
         function (entries) {
            entries.forEach(function (entry) {
               if (entry.isIntersecting) {
                  loadEmbed(entry.target);
                  observer.unobserve(entry.target);
               }
            });
         },
         { rootMargin: "200px 0px" },
      ); // preload 200px trước khi vào màn hình

      wrappers.forEach(function (el) {
         observer.observe(el);
      });
   }

   function loadEmbed(wrapper) {
      var src = wrapper.getAttribute("data-src");
      if (!src) return;

      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      iframe.frameBorder = "0";
      iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";

      ["data-allow", "data-title"].forEach(function (attr) {
         var val = wrapper.getAttribute(attr);
         if (val) {
            var name = attr.replace("data-", "");
            if (name === "allow") iframe.allow = val;
            if (name === "title") iframe.title = val;
         }
      });

      wrapper.innerHTML = "";
      wrapper.appendChild(iframe);
      wrapper.classList.add("lazy-embed--loaded");
      wrapper.removeAttribute("data-src");
   }

   /* ─────────────────────────────────────────
    * 3. CLICK-TO-LOAD MAP
    *    Wrapper có class .lazy-map với .lazy-map__btn bên trong
    * ───────────────────────────────────────── */
   function activateClickMaps() {
      document.addEventListener("click", function (e) {
         var btn = e.target.closest(".lazy-map__btn, .lazy-map__overlay");
         if (!btn) return;

         var wrapper = btn.closest(".lazy-map");
         if (!wrapper) return;

         var src = wrapper.getAttribute("data-src");
         if (!src) return;

         var iframe = document.createElement("iframe");
         iframe.src = src;
         iframe.loading = "lazy";
         iframe.allowFullscreen = true;
         iframe.frameBorder = "0";
         iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
         iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

         wrapper.innerHTML = "";
         wrapper.appendChild(iframe);
         wrapper.classList.add("lazy-map--loaded");
         wrapper.removeAttribute("data-src");
      });
   }

   /* ─────────────────────────────────────────
    * 4. LAZY FACEBOOK SDK
    *    Load Facebook SDK sau lần scroll đầu tiên
    * ───────────────────────────────────────── */
   function lazyLoadFacebookSDK() {
      if (typeof FB !== "undefined") return;

      var fbRoot = document.getElementById("fb-root");
      if (!fbRoot) return;

      var hasFbEl = document.querySelector('.fb-page, .fb-like, .fb-share-button, .fb-comments, [class*="a2a_button_facebook"]');
      if (!hasFbEl) return;

      var loaded = false;
      function doLoad() {
         if (loaded) return;
         loaded = true;

         (function (d, s, id) {
            var js,
               fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s);
            js.id = id;
            js.async = true;
            js.src = "//connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v15.0";
            fjs.parentNode.insertBefore(js, fjs);
         })(document, "script", "facebook-jssdk");
      }

      window.addEventListener("scroll", doLoad, { once: true, passive: true });

      var shareEls = document.querySelectorAll('[class*="a2a"], .fb-like, .fb-share-button,.fb-page');
      shareEls.forEach(function (el) {
         el.addEventListener("mouseenter", doLoad, { once: true });
         el.addEventListener("touchstart", doLoad, { once: true, passive: true });
      });

      // Fallback sau 6 giây
      setTimeout(doLoad, 6000);
   }

   /* ─────────────────────────────────────────
    * 5. ADD loading="lazy" cho TẤT CẢ iframes còn lại
    * ───────────────────────────────────────── */
   function addLazyToExistingIframes() {
      document.querySelectorAll("iframe:not([loading])").forEach(function (iframe) {
         iframe.setAttribute("loading", "lazy");
      });
   }

   /* ─────────────────────────────────────────
    * INIT
    * ───────────────────────────────────────── */
   function init() {
      wrapMapIframes();
      activateLazyEmbeds();
      activateClickMaps();
      lazyLoadFacebookSDK();
      addLazyToExistingIframes();
   }

   if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
   } else {
      init();
   }
})();
