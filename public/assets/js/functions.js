function getAjax(url = "", el_show = "", format = "") {
   if (!url) return;

   const uri = new URL(url, window.location.origin);

   if (!uri.searchParams.has("el_show")) {
      uri.searchParams.set("el_show", el_show);
   }

   return $.ajax({
      url: uri.toString(),
      type: "GET",
      success(result) {
         $(el_show).html(result);

         if (format === "swiper") {
            NN_FRAMEWORK.Swiper();
         }
      },
   });
}

function getAjaxConfig($container, $item = null) {
   const source = {
      ...$container.data(),
      ...($item ? $item.data() : {}),
   };
   const { url, response, ...params } = source;

   return { url, response, params };
}

function requestAjax($container, $item = null) {
   const { url, response, params } = getAjaxConfig($container, $item);

   getAjax(`${url}?${new URLSearchParams(params).toString()}`, response, params.format);
}

function GetRestWidth(eleCal, cssVar, eleRe = eleCal, outer = "body") {
   const bodyWidth = $(outer).width(),
      eleWidth = $(eleCal).width(),
      restWidth = bodyWidth - eleWidth;
   $(eleRe).css({
      ["--" + cssVar]: restWidth / 2 + "px",
   });
}

function isMobile() {
   return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

var debounce = (mainFunction, delay) => {
   let timer;

   return function (...args) {
      clearTimeout(timer);

      timer = setTimeout(() => {
         mainFunction.apply(this, args);
      }, delay);
   };
};

$.fn.lightGalleryNews = function () {
   $(this).each(function (n) {
      var i = $(this),
         r = i.attr("title"),
         t = i.attr("src");
      t != "upload/hinhanh/logo-final-2337.png" &&
         t != "/assets/img/embed.png" &&
         t != "/content/images/video.png" &&
         t != "/images/gl.png" &&
         t != "/images/fb.png" &&
         i.replaceWith("<a data-src='" + t + "' title = '' class='imageGallery' id='imageGallery-" + n + "'>" + this.outerHTML + "</a>");
   });
};
$(document).ready(function () {
   $(".content-main img").lightGalleryNews();
});

function isExist(ele) {
   return ele.length;
}

function isNumeric(value) {
   return /^\d+$/.test(value);
}

function getLen(str) {
   return /^\s*$/.test(str) ? 0 : str.length;
}

function showNotify(text = "Notify text", title = LANG.thongbao, status = "success") {
   new Notify({
      status: status, // success, warning, error
      title: title,
      text: text,
      effect: "fade",
      speed: 400,
      customClass: null,
      customIcon: null,
      showIcon: true,
      showCloseButton: true,
      autoclose: true,
      autotimeout: 3000,
      gap: 10,
      distance: 10,
      type: 3,
      position: "right top",
   });
}

function notifyDialog(content = "", title = LANG.thongbao, icon = "fas fa-exclamation-triangle", type = "blue") {
   $.alert({
      title: title,
      icon: icon, // font awesome
      type: type, // red, green, orange, blue, purple, dark
      content: content, // html, text
      backgroundDismiss: true,
      animationSpeed: 600,
      animation: "zoom",
      closeAnimation: "scale",
      typeAnimated: true,
      animateFromElement: false,
      autoClose: "accept|3000",
      escapeKey: "accept",
      buttons: {
         accept: {
            text: LANG.dongy,
            btnClass: "btn-sm btn-primary",
         },
      },
   });
}

function confirmDialog(action, text, value, title = LANG.thongbao, icon = "fas fa-exclamation-triangle", type = "blue") {
   $.confirm({
      title: title,
      icon: icon, // font awesome
      type: type, // red, green, orange, blue, purple, dark
      content: text, // html, text
      backgroundDismiss: true,
      animationSpeed: 600,
      animation: "zoom",
      closeAnimation: "scale",
      typeAnimated: true,
      animateFromElement: false,
      autoClose: "cancel|3000",
      escapeKey: "cancel",
      buttons: {
         success: {
            text: LANG.dongy,
            btnClass: "btn-sm btn-primary",
            action: function () {
               if (action == "delete-procart") deleteCart(value);
            },
         },
         cancel: {
            text: LANG.huy,
            btnClass: "btn-sm btn-danger",
         },
      },
   });
}

function validateForm(ele = "") {
   if (ele) {
      $("." + ele)
         .find("*[type=submit]")
         .removeAttr("disabled");
      var forms = document.getElementsByClassName(ele);
      var validation = Array.prototype.filter.call(forms, function (form) {
         form.addEventListener(
            "submit",
            function (event) {
               if (form.checkValidity() === false) {
                  event.preventDefault();
                  event.stopPropagation();
               }
               form.classList.add("was-validated");
            },
            false,
         );
      });
   }
}

function readImage(inputFile, elementPhoto) {
   if (inputFile[0].files[0]) {
      if (inputFile[0].files[0].name.match(/.(jpg|jpeg|png|gif)$/i)) {
         var size = parseInt(inputFile[0].files[0].size) / 1024;

         if (size <= 4096) {
            var reader = new FileReader();
            reader.onload = function (e) {
               $(elementPhoto).attr("src", e.target.result);
            };
            reader.readAsDataURL(inputFile[0].files[0]);
         } else {
            notifyDialog(LANG["dungluonghinhanhlon"]);
            return false;
         }
      } else {
         $(elementPhoto).attr("src", "");
         notifyDialog(LANG["dinhdanghinhanhkhonghople"]);
         return false;
      }
   } else {
      $(elementPhoto).attr("src", "");
      return false;
   }
}

function photoZone(eDrag, iDrag, eLoad) {
   if ($(eDrag).length) {
      /* Drag over */
      $(eDrag).on("dragover", function () {
         $(this).addClass("drag-over");
         return false;
      });

      /* Drag leave */
      $(eDrag).on("dragleave", function () {
         $(this).removeClass("drag-over");
         return false;
      });

      /* Drop */
      $(eDrag).on("drop", function (e) {
         e.preventDefault();
         $(this).removeClass("drag-over");

         var lengthZone = e.originalEvent.dataTransfer.files.length;

         if (lengthZone == 1) {
            $(iDrag).prop("files", e.originalEvent.dataTransfer.files);
            readImage($(iDrag), eLoad);
         } else if (lengthZone > 1) {
            notifyDialog(LANG["banchiduocchon1hinhanhdeuplen"]);
            return false;
         } else {
            notifyDialog(LANG["dulieukhonghople"]);
            return false;
         }
      });

      /* File zone */
      $(iDrag).change(function () {
         readImage($(this), eLoad);
      });
   }
}

function generateCaptcha(action, id, id_form) {
   if (RECAPTCHA_ACTIVE && action && id && $("#" + id).length) {
      grecaptcha.execute(RECAPTCHA_SITEKEY, { action: action }).then(function (token) {
         var recaptchaResponse = document.getElementById(id);
         recaptchaResponse.value = token;
         document.getElementById(id_form).submit();
      });
   }
}

async function loadPaging(url = "", eshow = "") {
   if (url) {
      let result = await fetchData(url, "GET", {}, "html");
      if (result) {
         let selector = eshow && eshow.indexOf(".") === 0 ? eshow : "." + eshow;
         $(selector).html(result);
         if (window.SA && typeof window.SA.refresh === "function") {
            window.SA.refresh();
         }
      }
   }
}

function doEnter(event, obj) {
   if (event.keyCode == 13 || event.which == 13) onSearch(obj);
}

function onSearch(obj) {
   var keyword = $("#" + obj).val();

   if (keyword == "") {
      swal_notifyDialog(LANG.chuanhaptukhoatimkiem, "warning");
      return false;
   } else {
      location.href = CART_URL["PAGE_SEARCH"] + "?keyword=" + encodeURI(keyword);
   }
}

function goToByScroll(id, minusTop) {
   minusTop = parseInt(minusTop) ? parseInt(minusTop) : 0;
   id = id.replace("#", "");
   $("html,body").animate(
      {
         scrollTop: $("#" + id).offset().top - minusTop,
      },
      "slow",
   );
}

function holdonOpen(theme = "sk-circle", text = "Loading...", backgroundColor = "rgba(0,0,0,0.8)", textColor = "white") {
   var options = {
      theme: theme,
      message: text,
      backgroundColor: backgroundColor,
      textColor: textColor,
   };

   HoldOn.open(options);
}

function holdonClose() {
   HoldOn.close();
}

function FirstLoadAPI(div, url, name_api) {
   $(div).addClass("active");
   var id = $(div).data("id");
   var tenkhongdau = $(div).data("tenkhongdau");
   FrameAjax(
      url,
      "POST",
      {
         id: id,
         tenkhongdau: tenkhongdau,
      },
      name_api,
   );
}

function LoadAPI(div, url, name_api) {
   $(div).click(function (event) {
      $(div).removeClass("active");
      $(this).addClass("active");
      var id = $(this).data("id");
      var tenkhongdau = $(this).data("tenkhongdau");
      FrameAjax(
         url,
         "POST",
         {
            id: id,
            tenkhongdau: tenkhongdau,
         },
         name_api,
      );
   });
}

function FrameAjax(url, type, data, name) {
   $.ajax({
      url: url,
      type: type,
      data: data,
      success: function (data) {
         $(name).html(data);
         NN_FRAMEWORK.Lazys();
      },
   });
}

function Filter() {
   holdonOpen();
   var url = $(".url-search").val();
   var sort = $(".sort-select-main p .check").data("sort");
   var idCat = {};
   $('input[name="ip-search"]:checked').each(function (index, element) {
      var id = $(this).data("list");
      if (!idCat[id]) idCat[id] = [];
      idCat[id].push($(this).val());
   });
   var queryString = Object.keys(idCat)
      .map(function (key) {
         return key + "=" + idCat[key].join(",");
      })
      .join("&");
   url += "?sort=" + sort + (queryString ? "&" + queryString : "");
   window.location.href = url;
}

function TextSort() {
   var text = $(".sort-select-main p .check").text();
   $(".sort-show").text(text);
}

function useStrict(val = "") {
   return Function(`"use strict";return ${val}`)();
}

function showLoading(container) {
   const loadingOverlay = container.querySelector(".loading-overlay");
   if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
   }
}

// Function để ẩn loading trong đúng class .products
function hideLoading(container) {
   const loadingOverlay = container.querySelector(".loading-overlay");
   if (loadingOverlay) {
      loadingOverlay.style.display = "none";
   }
}

function reloadTextarea() {
   $("textarea").each(function () {
      const $this = $(this);

      if ($this.val().trim() != "") {
         $this.height(this.scrollHeight);
      } else {
         $this.css("height", "auto");
      }

      $this.on("input", function () {
         if ($this.val().trim() == "") {
            $this.css("height", "auto");
         } else {
            $this.css("height", "auto").height(this.scrollHeight - 20);
         }
      });
   });
}
function initSumoselect() {
   if ($(".sumoselect").length) {
      $(".sumoselect").each(function () {
         if ($(this).parent().hasClass("SumoSelect")) return;
         $(this).wrap('<div class="position-relative"></div>').SumoSelect({
            placeholder: "Chọn danh mục",
            search: true,
            searchText: "Nhập từ khóa tìm kiếm",
            okCancelInMulti: true,
            selectAll: true,
            forceCustomRendering: true,
            renderOption: true,
         });
      });

      $(".sumoselect").on("change", function () {
         var $form = $(this).closest("form");
         if ($form.hasClass("was-validated")) {
            var val = $(this).val();
            var $wrap = $(this).closest(".SumoSelect");

            if (val == "0" || val === null || val === "") {
               $wrap.removeClass("success").addClass("error");
            } else {
               $wrap.removeClass("error").addClass("success");
            }
         }
      });

      $(".sumoselect").on("change", function () {
         var $form = $(this).closest("form");
         var val = $(this).val();
         var $wrap = $(this).closest(".SumoSelect");
         var $feedback = $(this).parents(".form-group-select").find(".invalid-feedback");

         if ($form.hasClass("was-validated")) {
            if (val == "0" || val === null || val === "") {
               $wrap.removeClass("success").addClass("error");
               $feedback.show();
            } else {
               $wrap.removeClass("error").addClass("success");
               $feedback.hide();
            }
         }
      });
   }
}

function swal_notifyDialog(content = "", icon = "info", title = LANG.thongbao) {
   Swal.fire({
      title: title,
      text: content,
      icon: icon,
   });
}

async function fetchData(
   url = "",
   method = "GET",
   data = {},
   type = "json",
   headers = {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": CSRF_TOKEN,
   },
) {
   let fullUrl = url;
   let body;

   if (method === "GET") {
      const query = new URLSearchParams(data).toString();
      if (query) fullUrl += `?${query}`;
   } else {
      body = JSON.stringify(data);
   }

   const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      credentials: "same-origin",
   });

   return type === "json" ? response.json() : response.text();
}

function animateText(selector) {
   var els = document.querySelectorAll(selector);
   els.forEach(function (el) {
      // Cleanup trÆ°á»›c náº¿u cÃ³ span cÅ©
      el.innerHTML = el.textContent.trim().replace(/\S/g, "<span class='letter'>$&</span>");

      anime
         .timeline({ loop: true })
         .add({
            targets: el.querySelectorAll(".letter"),
            scale: [4, 1],
            opacity: [0, 1],
            easing: "easeOutExpo",
            duration: 950,
            delay: (el, i) => 70 * i,
         })
         .add({
            targets: el,
            opacity: 0,
            duration: 1000,
            easing: "easeOutExpo",
            delay: 1000,
         });
   });
}

function resizeFlipbook() {
   var w_book = 860;
   var h_book = 645;
   var w_rs_body = $("body").outerWidth();
   var w_rs_boook = w_book;
   var h_rs_boook = h_book;
   if (w_rs_body < w_book) {
      w_rs_boook = w_rs_body - 40;
      h_rs_boook = (w_rs_boook / 2 - 20) * (w_book / h_book);
   }
   $(".flipbook").turn("size", w_rs_boook, h_rs_boook);
}
