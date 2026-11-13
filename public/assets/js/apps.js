/* Validation form */
validateForm("validation-contact");
validateForm("validation-newsletter");
validateForm("validation-cart");
// validateForm('validation-user');

/* Load name input file */
NN_FRAMEWORK.loadNameInputFile = function () {
   if (isExist($(".custom-file input[type=file]"))) {
      $("body").on("change", ".custom-file input[type=file]", function () {
         var fileName = $(this).val();
         fileName = fileName.substr(fileName.lastIndexOf("\\") + 1, fileName.length);
         $(this).siblings("label").html(fileName);
      });
   }
};

/* Menu */
NN_FRAMEWORK.Menu = function () {
   if (isExist($(".plus-nClick"))) {
      $(document).on("click", ".plus-nClick", function (e) {
         e.preventDefault();
         e.stopPropagation();

         var $currentLi = $(this).closest("li.has-submenu");
         $currentLi.toggleClass("opened");
         $currentLi.children("ul").slideToggle(200);
      });

      $("li.has-submenu").each(function () {
         var $li = $(this);
         var $ul = $li.children("ul");

         if (!isExist($ul)) {
            $li.find("> a .plus-nClick").remove();
         }

         if ($li.hasClass("opened")) {
            $ul.show();
         }
      });
   }

   if (isExist($(".menu_lvl"))) {
      $(".menu_lvl > ul > li").hover(function () {
         var vitri = $(this).position().top;
         $(this)
            .find(".menu_lvl")
            .css({ top: vitri + "px" });
      });
   }

   if (isExist($(".slide-wrap"))) {
      $(window).scroll(function () {
         if ($(window).scrollTop() >= $(".slide-wrap").height() / 2) {
            $(".menu").addClass("menu_fix");
         } else {
            $(".menu").removeClass("menu_fix");
         }
      });
   }

   /* Menu remove empty ul */
   if (isExist($(".menu"))) {
      $(".menu ul li a").each(function () {
         $this = $(this);

         if (!isExist($this.next("ul").find("li"))) {
            $this.next("ul").remove();
            $this.removeClass("has-child");
         }
      });
   }

   /* Menu mobile */
   var menu_mobi = $("ul.menu_desktop").html();
   $(".load-menu").each(function () {
      $(this).append("<ul>" + menu_mobi + "</ul>");
   });
   $(".load-menu ul li").removeClass("menu_dmsp");

   $(".menu_mobi_add ul li").each(function (index, element) {
      if ($(this).children("div").children("ul").children("li").length > 0) {
         $(this).children("a").append('<i class="fas fa-chevron-right"></i>');
      }
   });
   $(".menu_mobi_add ul li a i").click(function () {
      if ($(this).parent("a").hasClass("active2")) {
         $(this).parent("a").removeClass("active2");
         if ($(this).parent("a").parent("li").children("div").children("ul").children("li").length > 0) {
            $(this).parent("a").parent("li").children("div").children("ul").hide(300);
            return false;
         }
      } else {
         $(this).parent("a").addClass("active2");
         if ($(this).parents("li").children("div").children("ul").children("li").length > 0) {
            $(".menu_m ul li ul").hide(0);
            $(this).parents("li").children("div").children("ul").show(300);
            return false;
         }
      }
   });

   $(".icon_menu_mobi,.close_menu,.menu_baophu,#mmenu_trigger").click(function () {
      if ($(".menu_mobi_add").hasClass("menu_mobi_active")) {
         $(".menu_mobi_add").removeClass("menu_mobi_active");
         $(".menu_baophu").fadeOut(300);
      } else {
         $(".menu_mobi_add").addClass("menu_mobi_active");
         $(".menu_baophu").fadeIn(300);
      }
      return false;
   });
};

/* Popup */
NN_FRAMEWORK.Popup = function () {
   if (isExist($("#popup"))) {
      validateForm("validation-popup");
      $("#popup").modal("show");
   }
};

/* Wow */
NN_FRAMEWORK.Wows = function () {
   new WOW().init();
};

/* Search */
NN_FRAMEWORK.Search = function () {
   if (isExist($(".search-toggle .search__icon"))) {
      $(".search-toggle .search__icon").click(function () {
         if ($(this).hasClass("active")) {
            $(this).removeClass("active");
            $(".search__grid").stop(true, true).animate(
               {
                  opacity: "0",
                  width: "0px",
               },
               200,
            );
         } else {
            $(this).addClass("active");
            $(".search__grid").stop(true, true).animate(
               {
                  opacity: "1",
                  width: "250px",
               },
               200,
            );
         }

         document.getElementById($(this).next().find("input").attr("id")).focus();
         $(".search-toggle .search__icon>span").toggleClass("fa-regular fa-magnifying-glass fa-light fa-xmark");
      });
      $(document).click(function (event) {
         var $target = $(event.target);
         if (!$target.closest(".search-toggle").length && $(".search-toggle .search__icon").hasClass("active") && $target !== $(".search-toggle")) {
            $(".search-toggle .search__icon").removeClass("active");
            $(".search-toggle .search__grid").stop(true, true).animate(
               {
                  opacity: "0",
                  width: "0px",
               },
               200,
            );
            $(".search-toggle .search__icon>span").toggleClass("fa-regular fa-magnifying-glass fa-light fa-xmark");
         }
      });
   }

   if (isExist($(".search-auto"))) {
      $(".show-search").hide();
      $(".search-auto").keyup(function () {
         $keyword = $(this).val();
         if ($keyword.length >= 2) {
            $.get("tim-kiem-goi-y?keyword=" + $keyword, function (data) {
               if (data) {
                  $(".show-search").show();
                  $(".show-search").html(data);
               } else {
                  $(".show-search").hide();
               }
            });
         } else {
            $(".show-search").hide();
         }
      });

      $(document).on("click", function (e) {
         if (!$(e.target).closest(".bean-header__search").length) {
            $(".show-search").hide();
         }
      });
   }
};

NN_FRAMEWORK.SwiperData = function (obj) {
   if (!isExist(obj)) return false;
   var name = obj.attr("data-swiper-name") || "swiper";
   var thumbs = obj.attr("data-swiper-thumbs");
   var more = obj.attr("data-swiper");

   if (more && more.search("|") >= 0) {
      more = more.split("|");
      var on = more.reduce((a, b) => {
         if (b.search("{") < 0) {
            var c = {
               [b.split(":")[0]]: useStrict(b.split(":")[1]),
            };
         } else {
            const b1 = String(b.split(":", 1));
            const b2 = useStrict(b.slice(String(b.split(":", 1)).length + 1).trim());
            var c = {
               [b1]: b2,
            };
         }
         return Object.assign({}, a, c);
      }, {});
   } else {
      on = "";
   }
   if (thumbs) {
      on.thumbs = { swiper: window[thumbs] };
   }

   window[name] = new Swiper(obj[0], on);

   if (window[name].passedParams.breakpoints) {
      if (window[name].params.direction == "vertical") {
         const entries = Object.entries(window[name].passedParams.breakpoints);
         function setHeight() {
            var height = obj.find(".item").outerHeight();
            var countItem = obj.find(".item").length;
            entries.forEach((v) => {
               var Breakpoint = v[0] > 0 ? v[0] : 0;
               if (Breakpoint > 0 && Breakpoint == window[name].currentBreakpoint) {
                  var items = v[1].slidesPerView != undefined ? v[1].slidesPerView : 0;
                  var margin = v[1].spaceBetween != undefined ? v[1].spaceBetween : 0;
               } else if (window[name].currentBreakpoint == "max") {
                  var items = window[name].passedParams.slidesPerView;
                  var margin = window[name].passedParams.spaceBetween;
               }
               if (window[name].params.direction == "vertical") {
                  if (countItem < items) {
                     obj.css({
                        height: height * countItem + (countItem - 1) * margin,
                     });
                     obj.find(".swiper-slide").addClass("h-auto");
                  } else {
                     obj.css({
                        height: height * items + (items - 1) * margin,
                     });
                  }
                  window[name].update();
               } else {
                  obj.css({ height: "" });
                  window[name].update();
               }
            });
         }
         setHeight();
         $(window).resize(setHeight());
      }
   } else {
      if (window[name].params.direction == "vertical") {
         function setHeight() {
            var height = obj.find(".item").outerHeight();
            var countItem = obj.find(".item").length;
            var items = window[name].passedParams.slidesPerView;
            var margin = window[name].passedParams.spaceBetween;
            if (countItem < items) {
               obj.css({
                  height: height * countItem + (countItem - 1) * margin,
               });
               obj.find(".swiper-slide").addClass("h-auto");
            } else {
               obj.css({ height: height * items + (items - 1) * margin });
            }
            window[name].update();
         }
         setHeight();
         $(window).resize(setHeight());
      }
   }
   return window[name];
};

/* Swiper */
NN_FRAMEWORK.Swiper = function () {
   if (isExist($(".swiper-auto"))) {
      $(".swiper-auto[data-swiper-name]").each(function () {
         if ($(this).closest(".training-featured").length) return;
         NN_FRAMEWORK.SwiperData($(this));
      });
      $(".swiper-auto:not([data-swiper-name])").each(function () {
         if ($(this).closest(".training-featured").length) return;
         NN_FRAMEWORK.SwiperData($(this));
      });
   }
};

/* Training featured Swipers */
NN_FRAMEWORK.TrainingFeatured = function () {
   document.querySelectorAll(".training-featured [data-swiper-thumbs]").forEach(function (parent) {
      var section = parent.closest(".training-featured");
      var name = parent.getAttribute("data-swiper-thumbs");
      var children = section.querySelectorAll('[data-swiper-name="' + name + '"]');
      if (!children.length || typeof Swiper === "undefined") return;

      function getOptions(element) {
         var data = element.getAttribute("data-swiper") || "";
         return data
            .split("|")
            .filter(Boolean)
            .reduce(function (result, item) {
               var separator = item.indexOf(":");
               if (separator === -1) return result;
               var key = item.slice(0, separator);
               var value = item.slice(separator + 1).trim();
               result[key] = typeof useStrict === "function" ? useStrict(value) : value;
               return result;
            }, {});
      }

      var parentSwiper = new Swiper(parent, getOptions(parent));
      var childSwipers = Array.prototype.map.call(children, function (child) {
         var settings = getOptions(child);
         settings.thumbs = { swiper: parentSwiper };
         return new Swiper(child, settings);
      });

      parentSwiper.on("slideChange", function () {
         childSwipers.forEach(function (childSwiper) {
            if (childSwiper.realIndex !== parentSwiper.realIndex) {
               childSwiper.slideToLoop(parentSwiper.realIndex);
            }
         });
      });
   });
};

NN_FRAMEWORK.Api = function () {
   if (isExist($(".myPaging"))) {
      $(document).on("click", ".myPaging .tab", async function (event) {
         event.preventDefault();

         const $this = $(this);
         if ($this.hasClass("active")) return;

         $this.parents(".myPaging").find(".tab").removeClass("active");
         $this.addClass("active");
         const url = $this.data("url");
         const table = $this.data("table");
         const type = $this.data("type");
         const eshow = $this.data("eshow");
         const per_page = $this.data("perpage");
         const id_list = $this.data("list");
         const id_cat = $this.data("cat");
         const status = $this.data("status");
         const format = $this.data("format");
         try {
            $.ajax({
               url: url,
               type: "GET",
               data: {
                  table_select: table,
                  type_select: type,
                  el_show: eshow,
                  per_page: per_page,
                  id_list: id_list,
                  id_cat: id_cat,
                  status: status,
                  format: format,
               },
               success: function (result) {
                  $("." + eshow).html(result);
                  if (format == "splide") {
                     NN_FRAMEWORK.Splide();
                  }
                  // Animate các item mới load qua AJAX
                  if (window.SA && typeof window.SA.refresh === "function") {
                     window.SA.refresh();
                  }
               },
            });
         } catch (err) {
            console.error("Lỗi khi fetch dữ liệu:", err);
         }
      });

      $(".myPaging").each(function () {
         const $container = $(this);
         setTimeout(function () {
            $container.find(".tab").first().trigger("click");
         }, 1000);
      });

      // Nếu muốn scroll về vị trí
      // $(document).on('click', '.page-link', function (event) {
      //     $('html, body').animate({
      //         scrollTop: $('.myPaging').offset().top,
      //     }, 0);
      // });
   }

   if (isExist($(".tt-bt h2"))) {
      $(document).on("click", ".tt-bt h2", async function (event) {
         $(".tt-bt h2").removeClass("active");
         $(this).addClass("active");
         var type = $(this).data("type");
         var url = "api/load-news";
         $.ajax({
            url: url,
            type: "GET",
            data: {
               type: type,
            },
            success: function (result) {
               $(".show-news").html(result);
               NN_FRAMEWORK.Splide();
            },
         });
      });
   }

   if (isExist($(".item-search"))) {
      $(".item-search input").click(function () {
         Filter();
      });
   }

   if (isExist($(".footer-main__branch-name"))) {
      $(document).on("click", ".footer-main__branch-name", function (event) {
         event.preventDefault();
         const $this = $(this);
         const id = $this.data("id");
         if (!id) return;

         $.ajax({
            url: (typeof BASE !== "undefined" ? BASE : "") + "api/load-footer-map",
            type: "GET",
            dataType: "json",
            data: {
               id: id,
               type: "he-thong",
            },
            success: function (result) {
               if (result && result.status === "success" && result.iframe) {
                  $(".footer-main__branch-name").removeClass("active").attr("aria-selected", "false");
                  $this.addClass("active").attr("aria-selected", "true");
                  $(".footer-main__map").html(result.iframe);
               }
            },
            error: function (err) {
               console.error("Load footer map failed:", err);
            },
         });
      });
   }

   if (isExist($(".sort-select-main"))) {
      $(".sort-select-main p a").click(function () {
         $(".sort-select-main p a").removeClass("check");
         $(this).addClass("check");
         Filter();
      });
   }

   $(".filter").click(function (e) {
      $(".left-product").toggleClass("show");
   });
   TextSort();
};

NN_FRAMEWORK.Main = function () {
   $(".social-item__arrow").click(function (e) {
      var pa = $(this).parents(".name-link");
      pa.find(".social-item__button").toggleClass("active");
   });

   $(".title-menu h4").click(function (e) {
      $("ul.down").slideToggle();
   });

   $(document).on("click", ".news-side-toggle", function () {
      const $item = $(this).closest(".news-side-category__item");
      $item.toggleClass("is-open");
      $item.children(".news-side-children").stop(true, true).slideToggle(200);
   });

   $(".js-content-toc").each(function () {
      const $toc = $(this);
      const $wrap = $toc.closest(".content-toc-wrap");
      const $content = $wrap.find(".content-main").first();
      const $list = $toc.find(".box-toc__list").first();
      const slugify = function (text) {
         return text
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
      };

      if (!$content.length || !$list.length) return;

      $content.find("h2, h3, h4").each(function (index) {
         const node = this;
         let id = node.id;
         const text = $.trim($(node).text());
         const tag = node.tagName.toLowerCase();

         if (!text) return;
         if (!id) {
            id = slugify(text) + "-" + (index + 1);
            node.id = id;
         }

         $list.append('<li class="box-toc__item box-toc__item--' + tag + '"><a href="#' + id + '" class="box-toc__link">' + text + "</a></li>");
      });

      if ($list.children().length) $toc.show();
   });

   $(document).on("click", ".box-toc__title", function () {
      $(this).closest(".box-toc").toggleClass("box-toc--open");
   });

   $(document).on("click", ".box-toc__link", function (e) {
      e.preventDefault();
      const id = $(this).attr("href");
      const $target = $(id);

      if (!$target.length) return;
      $(".box-toc__link").removeClass("box-toc__link--active");
      $(this).addClass("box-toc__link--active");
      $("html, body").animate({ scrollTop: $target.offset().top - 100 }, 450);
   });

   $(document).on("change", ".home-video-select", function () {
      const $selected = $(this).find("option:selected");
      const src = $selected.val();
      const type = $selected.data("type");
      const title = $selected.data("title") || $selected.text();
      const photo = $selected.data("photo");
      const $player = $(this).closest(".js-home-video-player");
      const $frame = $player.find(".home-video-player__frame");

      if (!src || !$frame.length) return;

      $frame.attr({
         href: src,
         "data-src": src,
         "data-type": type,
         "data-caption": title,
      });
      if (photo) $frame.find(".home-video-player__thumb").attr({ src: photo, alt: title });
      $player.find(".home-video-player__title").text(title);
   });

   var imgElements = document.querySelectorAll("img");
   imgElements.forEach(function (img) {
      if (!img.hasAttribute("alt")) {
         img.alt = WEBSITE_NAME;
      }
   });

   var anchorElements = document.querySelectorAll("a");
   anchorElements.forEach(function (anchor) {
      if (!anchor.hasAttribute("aria-label")) {
         anchor.setAttribute("aria-label", WEBSITE_NAME); // Thêm thuộc tính aria-label
      }
   });

   Fancybox.bind("[data-fancybox]");

   $(".content-main table").each(function () {
      if (!$(this).parent().hasClass("table-responsive")) {
         $(this).before('<div class="table-responsive"></div>');
         $(this).prev(".table-responsive").append($(this));
      }
   });

   $(".content-main img").each(function () {
      const $img = $(this);
      const src = $img.attr("src");
      const $parent = $img.parent();

      if (!$parent.is("a")) {
         $img.wrap(`<a data-fancybox href="${src}"></a>`);
      } else {
         $parent.attr({
            "data-fancybox": "",
            href: src,
         });
      }
   });

   if (isExist($(".toolbar"))) {
      $("#footer-primary").css({
         marginBottom: $(".toolbar").innerHeight(),
      });
   }
};

NN_FRAMEWORK.Img = function () {
   const images = document.querySelectorAll("img");
   images.forEach((img) => {
      const handleImageLoad = () => {
         const width = img.clientWidth;
         const height = img.clientHeight;
         const hw = img.getAttribute("width");
         if (width > 0 && height > 0 && !hw) {
            img.setAttribute("width", width);
            img.setAttribute("height", height);
         }
      };

      img.addEventListener("load", handleImageLoad);
      if (img.complete) {
         handleImageLoad();
      }
   });
};

NN_FRAMEWORK.FormStuff = function () {
   initSumoselect();
   $("form").on("submit", function (e) {
      var $form = $(this);
      var isValid = true;

      $form.find(".sumoselect").each(function () {
         var val = $(this).val();
         var $sumoWrap = $(this).closest(".SumoSelect");
         var $feedback = $(this).parents(".form-group-select").find(".invalid-feedback");

         if (val == "0" || val === null || val === "") {
            $sumoWrap.addClass("error");
            $feedback.show();
            isValid = false;
         } else {
            $sumoWrap.removeClass("error");
            $feedback.hide();
         }
      });

      if (!isValid) {
         e.preventDefault();
         e.stopPropagation();
      }

      $form.addClass("was-validated");
   });

   $("body").on("click", ".show-password", function () {
      if ($(this).hasClass("active")) {
         $(this).removeClass("active");
         $(this).parents(".input-user").find("#password").attr("type", "password");
      } else {
         $(this).addClass("active");
         $(this).parents(".input-user").find("#password").attr("type", "text");
      }
      $(this).find("i").toggleClass("fas fa-eye fas fa-eye-slash");
   });

   reloadTextarea();
};

NN_FRAMEWORK.ScrollAnimate = function () {
   // scroll-animate.js tự động init khi DOM ready.
   // Hàm này chỉ được gọi sau ready() để refresh nếu cần.
   if (window.SA && typeof window.SA.refresh === "function") {
      window.SA.refresh();
   }
};
NN_FRAMEWORK.Splide = function () {
   // const { Grid } = window.splide.Extensions;

   if (isExist($(".splide.videonb:not(.is-initialized)"))) {
      let videonb = new Splide(".splide.videonb", {
         lazyLoad: "nearby",
         pauseOnHover: false,
         pauseOnFocus: false,
         type: "slide",
         rewind: true,
         autoplay: true,
         interval: 3000,
         speed: 3000,
         perPage: 3,
         perMove: 1,
         gap: 20,
         pagination: false,
         arrows: false,
         waitForTransition: false,
         updateOnMove: true,
         breakpoints: {
            870: { perPage: 3, gap: 15 },
            600: { perPage: 3, gap: 10 },
         },
      });

      function syncHomeVideoShowcase(slider) {
         let slide = slider.Components.Slides.getAt(slider.index);
         if (!slide || !slide.slide) return;

         let $videoShowcase = $(slide.slide).closest(".video-showcase");
         let $featured = $videoShowcase.find(".video-card--featured");
         let $activeCard = $(slide.slide).find(".video-card--small").first();

         if (!isExist($featured) || !isExist($activeCard)) return;

         let $featuredImg = $featured.find("img").first();
         let $activeImg = $activeCard.find("img").first();
         let title = $.trim($activeCard.find(".video-card__title").first().text());

         $featured.attr({
            href: $activeCard.attr("href") || "",
            title: $activeCard.attr("title") || title,
         });

         $.each(["data-src", "data-type", "data-fancybox"], function (_, attr) {
            let value = $activeCard.attr(attr);
            if (value) $featured.attr(attr, value);
         });

         if (isExist($featuredImg) && isExist($activeImg)) {
            $.each(["src", "srcset", "data-src", "data-srcset", "sizes", "alt"], function (_, attr) {
               let value = $activeImg.attr(attr);
               if (value) $featuredImg.attr(attr, value);
            });
         }

         $featured.find(".video-card__title").first().text(title);
         $videoShowcase.find(".video-card--small").removeClass("is-current");
         $activeCard.addClass("is-current");
      }

      videonb.on("mounted moved", function () {
         syncHomeVideoShowcase(videonb);
      });

      videonb.mount();
   }

   if (isExist($(".splide.slideshow:not(.is-initialized)"))) {
      new Splide(".splide.slideshow", {
         lazyLoad: "nearby",
         pauseOnHover: false,
         pauseOnFocus: false,
         type: "slide",
         rewind: true,
         autoplay: true,
         interval: 2500,
         speed: 1000,
         perPage: 1,
         perMove: 1,
         gap: 15,
         pagination: false,
         arrows: false,
         waitForTransition: false,
         updateOnMove: true,
      }).mount();
   }

   if (isExist($(".splide.prodetail__thumb"))) {
      if (window.prodetail_thumb && typeof window.prodetail_thumb.destroy === "function") {
         window.prodetail_thumb.destroy();
      }
      if (window.prodetail_nav && typeof window.prodetail_nav.destroy === "function") {
         window.prodetail_nav.destroy();
      }

      window.prodetail_thumb = new Splide(".splide.prodetail__thumb", {
         lazyLoad: "nearby",
         pauseOnHover: false,
         pauseOnFocus: false,
         type: "slide",
         rewind: true,
         pagination: false,
         arrows: false,
         gap: 15,
         waitForTransition: false,
         updateOnMove: true,
      });

      if (isExist($(".splide.prodetail__nav"))) {
         window.prodetail_nav = new Splide(".splide.prodetail__nav", {
            lazyLoad: "nearby",
            pauseOnHover: false,
            pauseOnFocus: false,
            type: "slide",
            perPage: 4,
            perMove: 1,
            gap: 10,
            pagination: false,
            arrows: false,
            isNavigation: true,
            waitForTransition: false,
            updateOnMove: true,
         });

         window.prodetail_thumb.on("move", function (newIndex) {
            let newVerticalIndex = newIndex % window.prodetail_nav.length;
            window.prodetail_nav.go(newVerticalIndex);
         });

         window.prodetail_nav.on("move", function (newIndex) {
            let newVerticalIndex = newIndex % window.prodetail_thumb.length;
            window.prodetail_thumb.go(newVerticalIndex);
         });

         const navSlides = document.querySelectorAll(".splide.prodetail__nav .splide__slide");
         navSlides.forEach((slide, index) => {
            slide.addEventListener("click", () => {
               window.prodetail_thumb.go(index);
            });
         });

         window.prodetail_nav.mount();
      }
      window.prodetail_thumb.mount();
   }
};

NN_FRAMEWORK.Flipbook = function () {
   if (isExist($(".flipbook"))) {
      $(".flipbook").turn({
         width: 860,
         height: 645,
         elevation: 50,
         gradients: true,
         autoCenter: true,
         display: "double",
         page: 2,
      });

      // Nút next / prev
      $(".turn-next").click(function () {
         $(".flipbook").turn("next");
      });

      $(".turn-prev").click(function () {
         $(".flipbook").turn("previous");
      });

      // 👉 AUTO FLIP
      let autoFlip = setInterval(function () {
         let currentPage = $(".flipbook").turn("page");
         let totalPages = $(".flipbook").turn("pages");

         if (currentPage < totalPages) {
            $(".flipbook").turn("next");
         } else {
            $(".flipbook").turn("page", 1); // quay lại đầu
         }
      }, 3000); // 3 giây / lần lật

      resizeFlipbook();

      $(window).resize(function () {
         resizeFlipbook();
      });
   }
};

NN_FRAMEWORK.CountUp = function () {
   const items = document.querySelectorAll(".js-count-up:not(.is-counted)");
   if (!items.length) return;

   const run = function (el) {
      const target = parseInt(el.dataset.count || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 1200;
      const start = performance.now();

      el.classList.add("is-counted");

      const tick = function (now) {
         const progress = Math.min((now - start) / duration, 1);
         const eased = 1 - Math.pow(1 - progress, 3);
         const value = Math.round(target * eased);
         el.textContent = value.toLocaleString("vi-VN") + suffix;

         if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
   };

   if (!("IntersectionObserver" in window)) {
      items.forEach(run);
      return;
   }

   const observer = new IntersectionObserver(
      function (entries) {
         entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            run(entry.target);
            observer.unobserve(entry.target);
         });
      },
      { threshold: 0.35 },
   );

   items.forEach(function (el) {
      observer.observe(el);
   });
};

NN_FRAMEWORK.RelatedPaging = function () {
   const $container = $(".prodetail-related-result");
   if (isExist($container)) {
      const url = $container.data("url");
      const idExclude = $container.data("exclude");
      const idList = $container.data("list");
      const idCat = $container.data("cat");
      const idItem = $container.data("item");
      const idSub = $container.data("sub");
      const typeSelect = $container.data("type");
      const perPage = $container.data("perpage");

      // Load initial page 1
      const initialUrl = `${url}?id_exclude=${idExclude}&id_list=${idList}&id_cat=${idCat}&id_item=${idItem}&id_sub=${idSub}&type_select=${typeSelect}&per_page=${perPage}&el_show=prodetail-related-result`;
      loadPaging(initialUrl, "prodetail-related-result");
   }
};

/* Back to top */
NN_FRAMEWORK.BackToTop = function () {
   if (isExist($("#scroll-to-top"))) {
      const OFFSET_TOP = 100;

      $(window).scroll(function () {
         if ($(this).scrollTop() > OFFSET_TOP) {
            $("#scroll-to-top").addClass("show");
         } else {
            $("#scroll-to-top").removeClass("show");
         }
         // Detect OS then Check if scroll at bottom
         if (navigator.userAgent.indexOf("Mac OS X") != -1) {
            // For Mac OS
            if (window.innerHeight + Math.ceil(window.pageYOffset + 1) >= document.body.offsetHeight) {
               $("#scroll-to-top").addClass("is-bottom");
            } else {
               $("#scroll-to-top").removeClass("is-bottom");
            }
         } else {
            // For Windows
            if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
               $("#scroll-to-top").addClass("is-bottom");
            } else {
               $("#scroll-to-top").removeClass("is-bottom");
            }
         }
      });
      // Check if webste is reload (Using: Navigation Timing API)
      if (performance.navigation.type == performance.navigation.TYPE_RELOAD && $(window).scrollTop() > OFFSET_TOP) {
         setTimeout(() => {
            $("#scroll-to-top").addClass("show");
         }, 500);
      }
      $("body").on("click", "#scroll-to-top", function () {
         $("html, body").animate(
            {
               scrollTop: 0,
            },
            200,
         );
         return false;
      });
   }
};

/* Ajax */
NN_FRAMEWORK.Ajax = function () {
   /* Ajax Response */
   if (isExist($(".ajax-response"))) {
      $(".ajax-response").each(function () {
         requestAjax($(this));
      });
   }

   /* Choose List */
   if (isExist($(".choose__list"))) {
      $(document).on("click", ".choose__item", function () {
         const $item = $(this);

         if ($item.hasClass("active")) return;

         const $list = $item.closest(".choose__list");

         $item.addClass("active").siblings(".choose__item").removeClass("active");
         requestAjax($list, $item);
      });

      $(".choose__list:not(.choose--manual)").each(function () {
         $(this).find(".choose__item").first().trigger("click");
      });
   }

   /* Video Selection */
   if (isExist($("#video-select"))) {
      $("#video-select").on("load change", function () {
         const data = {
            id: $(this).val() ? $(this).val() : 0,
            type: $(this).parent().data("type") ? $(this).parent().data("type") : 0,
         };
         const url = $(this).parent().data("url"),
            response = $(this).parent().data("response");

         loadPaging(url + "?" + $.param(data), response);
      });
      $("#video-select").trigger("change");
   }
};

/* PeShiner */
NN_FRAMEWORK.PeShiner = function () {
   if (isExist($(".peShiner"))) {
      jQuery.browser = {};
      (function () {
         jQuery.browser.msie = false;
         jQuery.browser.version = 0;
         if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
            jQuery.browser.msie = true;
            jQuery.browser.version = RegExp.$1;
         }
      })();
      $(".peShiner").each(function () {
         const color = $(this).data("color") ? $(this).data("color") : "oceanHL";

         let api = $(this).peShiner({
            api: true,
            paused: true,
            reverse: true,
            repeat: 1,
            glow: 0,
            color: color,
         });
         api.resume();
      });
   }
};

/* Grab Container */
NN_FRAMEWORK.GrabContainer = function () {
   if (isExist($(".grab-container"))) {
      const sliders = document.querySelectorAll(".grab-container");
      sliders.forEach((slider) => {
         let mouseDown = false;
         let moved = false;
         let startX, scrollLeft;

         let startDragging = function (e) {
            mouseDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            e.preventDefault();
            slider.style.userSelect = "none";
            slider.style.webkitUserSelect = "none";
            slider.querySelectorAll("img").forEach((img) => {
               img.setAttribute("draggable", "false");
            });
         };
         let stopDragging = function (e) {
            mouseDown = false;
            slider.style.userSelect = "";
            slider.style.webkitUserSelect = "";
            // keep moved true briefly to block click after drag
            setTimeout(() => {
               moved = false;
            }, 50);
         };

         slider.addEventListener("mousemove", (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!mouseDown) {
               return;
            }
            const x = e.pageX - slider.offsetLeft;
            const scroll = x - startX;
            if (Math.abs(scroll) > 3) moved = true; // threshold to consider as drag
            slider.scrollLeft = scrollLeft - scroll;
         });

         // Prevent clicks when a drag just occurred
         slider.addEventListener(
            "click",
            function (e) {
               if (moved) {
                  e.preventDefault();
                  e.stopImmediatePropagation();
               }
            },
            true,
         );

         slider.addEventListener("selectstart", (e) => e.preventDefault(), false);
         slider.addEventListener("dragstart", (e) => e.preventDefault(), false);
         slider.addEventListener(
            "wheel",
            (e) => {
               if (slider.scrollWidth <= slider.clientWidth) {
                  return;
               }

               const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
               if (!delta) {
                  return;
               }

               slider.scrollLeft += delta;
               e.preventDefault();
               e.stopPropagation();
            },
            { passive: false },
         );

         // Add the event listeners
         slider.addEventListener("mousedown", startDragging, false);
         slider.addEventListener("mouseup", stopDragging, false);
         slider.addEventListener("mouseleave", stopDragging, false);
      });
   }
};

/* Lazy Background */
NN_FRAMEWORK.LazyBackground = function () {
   if (isExist($(".lazy-background"))) {
      if ("IntersectionObserver" in window) {
         function handleIntersection(entries) {
            entries.map((entry) => {
               const bgImage = entry.target.dataset.bgImage,
                  bgOptions = entry.target.dataset.bgOptions ? entry.target.dataset.bgOptions : "";

               if (entry.isIntersecting) {
                  entry.target.style[bgOptions ? "background" : "backgroundImage"] = "url('" + bgImage + "') " + bgOptions;
                  observer.unobserve(entry.target);
               }
            });
         }

         const elements = document.querySelectorAll(".lazy-background");
         const observer = new IntersectionObserver(handleIntersection, {
            rootMargin: "300px",
         });
         elements.forEach((element) => observer.observe(element));
      } else {
         const elements = document.querySelectorAll(".lazy-background");
         elements.forEach((element) => {
            const bgImage = element.dataset.bgImage,
               bgOptions = element.dataset.bgOptions ? element.dataset.bgOptions : "";

            element.style[bgOptions ? "background" : "backgroundImage"] = "url('" + bgImage + "') " + bgOptions;
         });
      }
   }
};

/* Counter */
NN_FRAMEWORK.Counter = function () {
   const counterSelector = ".counter-value, [data-count], [data-counter]";
   const items = document.querySelectorAll(counterSelector);
   if (!items.length) return;

   const parseCounterText = function (value) {
      const text = (value || "").toString().trim();
      const match = text.match(/(-?\d[\d.,\s]*)/);

      if (!match) {
         return {
            prefix: "",
            number: 0,
            precision: 0,
            suffix: text,
         };
      }

      const rawNumber = match[1].replace(/\s+/g, "");
      const prefix = text.slice(0, match.index);
      const suffix = text.slice((match.index || 0) + match[1].length);

      let normalized = rawNumber;
      const containsComma = normalized.includes(",");
      const containsDot = normalized.includes(".");

      if (containsComma && containsDot) {
         normalized = normalized.lastIndexOf(",") > normalized.lastIndexOf(".") ? normalized.replace(/\./g, "").replace(",", ".") : normalized.replace(/,/g, "");
      } else if (containsComma) {
         const commaParts = normalized.split(",");
         if (commaParts.length > 2) {
            normalized = commaParts.join("");
         } else if (commaParts[1] && commaParts[1].length <= 2) {
            normalized = commaParts.join(".");
         } else {
            normalized = commaParts.join("");
         }
      } else if (containsDot) {
         const dotParts = normalized.split(".");
         if (dotParts.length > 2) {
            normalized = dotParts.join("");
         }
      }

      const precision = normalized.includes(".") ? (normalized.split(".")[1] || "").length : 0;
      const number = Number.parseFloat(normalized);

      return {
         prefix,
         number: Number.isFinite(number) ? number : 0,
         precision: Number.isFinite(number) ? precision : 0,
         suffix,
      };
   };

   const formatCounterValue = function (value, precision) {
      if (!Number.isFinite(value)) return "0";
      if (precision > 0) {
         return Number(value).toFixed(precision);
      }
      return Math.trunc(value).toLocaleString("vi-VN");
   };

   const animateCounter = function (el) {
      if (el.classList.contains("is-counted")) return;

      const rawValue = el.getAttribute("data-count") || el.getAttribute("data-counter") || el.textContent;
      const parsed = parseCounterText(rawValue);

      if (!/[\d]/.test(String(rawValue || ""))) {
         el.textContent = String(rawValue || "");
         el.classList.add("is-counted");
         return;
      }

      const duration = Number.parseInt(el.getAttribute("data-duration") || "1000", 10);
      const startValue = Number.parseFloat(el.getAttribute("data-start") || "0");
      const endValue = parsed.number;
      const startTime = performance.now();

      el.classList.add("is-counted");

      const tick = function (now) {
         const progress = Math.min((now - startTime) / duration, 1);
         const eased = 1 - Math.pow(1 - progress, 3);
         const current = startValue + (endValue - startValue) * eased;
         const shown = formatCounterValue(current, parsed.precision);

         el.textContent = parsed.prefix + shown + parsed.suffix;

         if (progress < 1) {
            requestAnimationFrame(tick);
         }
      };

      requestAnimationFrame(tick);
   };

   if (!("IntersectionObserver" in window)) {
      items.forEach(animateCounter);
      return;
   }

   const observer = new IntersectionObserver(
      function (entries) {
         entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
         });
      },
      {
         threshold: 0.35,
         rootMargin: "0px 0px -10% 0px",
      },
   );

   items.forEach(function (el) {
      observer.observe(el);
   });
};

NN_FRAMEWORK.AOS = function () {
   function onElementHeightChange(elm, callback) {
      var lastHeight = elm.clientHeight;
      var newHeight;
      (function run() {
         newHeight = elm.clientHeight;
         if (lastHeight !== newHeight) callback();
         lastHeight = newHeight;
         if (elm.onElementHeightChangeTimer) {
            clearTimeout(elm.onElementHeightChangeTimer);
         }
         elm.onElementHeightChangeTimer = setTimeout(run, 500);
      })();
   }

   AOS.init({
      duration: 1000,
      once: true,
      startEvent: "manual",
      disable: "mobile",
      disableMutationObserver: true,
   });

   onElementHeightChange(document.body, function () {
      AOS.refresh();
      checkAOS();
   });

   function checkAOS() {
      const scrollTop = $(window).scrollTop();
      const windowHeight = $(window).height();
      const offsetTrigger = 150;

      $("[data-aos]:not(.aos-animate)").each(function () {
         const $elem = $(this);
         const elemTop = $elem.offset().top;
         if (scrollTop + windowHeight > elemTop + offsetTrigger) {
            $elem.addClass("aos-animate");
         }
      });
   }

   checkAOS();
   $(window).on("scroll", function () {
      checkAOS();
   });
};

/* Category */
NN_FRAMEWORK.Category = function () {
   if (isExist($(".category"))) {
      $("body").on("click", ".category__button", function (e) {
         e.preventDefault();
         e.stopPropagation();

         var $button = $(this);
         var $item = $button.closest("li.category__item");
         var $subList = $item.find("> .category__list");

         if ($subList.length) {
            $item.toggleClass("opened");
            $subList.slideToggle(300);
         }
      });

      $(".category__item.has-child").each(function () {
         var $li = $(this);
         var $subList = $li.find("> .category__list");

         if ($li.hasClass("opened")) {
            $subList.show();
         }
      });
   }
};

/* Others */
NN_FRAMEWORK.Others = function () {
   if (isExist($(".navigation"))) {
      GetRestWidth(".navigation__container", "rest-vw", "#main-primary");
      var resizeDebounce;
      $(window).resize(function () {
         clearTimeout(resizeDebounce);
         resizeDebounce = setTimeout(function () {
            GetRestWidth(".navigation__container", "rest-vw", "#main-primary");
         }, 100);
      });
   }

   if (isExist($(".album-featured"))) {
      $(".album-featured__splide").each(function (index) {
         const SPEED = index === 0 ? 2 : -2;

         const splide = new Splide(this, {
            type: "loop",
            drag: "free",
            focus: "center",
            perPage: 7,
            gap: 2,
            breakpoints: {
               321: { perPage: 2 },
               577: { perPage: 3 },
               851: { perPage: 4 },
               1025: { perPage: 5 },
               1201: { perPage: 6 },
            },
            autoScroll: {
               speed: SPEED,
            },
            pagination: false,
            arrows: false,
         });

         splide.mount(window.splide.Extensions);
      });
   }
};

/* Ready */
$(document).ready(function () {
   NN_FRAMEWORK.Api();
   NN_FRAMEWORK.RelatedPaging();
   NN_FRAMEWORK.FormStuff();
   NN_FRAMEWORK.Popup();
   NN_FRAMEWORK.Swiper();
   NN_FRAMEWORK.Splide();
   NN_FRAMEWORK.Menu();
   NN_FRAMEWORK.Search();
   NN_FRAMEWORK.loadNameInputFile();
   NN_FRAMEWORK.Main();
   NN_FRAMEWORK.ScrollAnimate();
   NN_FRAMEWORK.Flipbook();
   NN_FRAMEWORK.CountUp();
   NN_FRAMEWORK.BackToTop();
   NN_FRAMEWORK.Ajax();
   // NN_FRAMEWORK.PeShiner();
   // NN_FRAMEWORK.GrabContainer();
   NN_FRAMEWORK.LazyBackground();
   NN_FRAMEWORK.TrainingFeatured();
   // NN_FRAMEWORK.Counter();
   // NN_FRAMEWORK.AOS();
   // NN_FRAMEWORK.Category();
   NN_FRAMEWORK.Others();
   // if (isExist($(".comment-page"))) {
   //    new Comments(".comment-page", { url: BASE });
   // }
   // new Cart(BASE);
});
