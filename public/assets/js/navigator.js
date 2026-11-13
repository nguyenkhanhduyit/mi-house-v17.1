class Navigator {
   static MOBILE_BREAKPOINT = 1024;
   static instances = [];
   static ticking = false;

   constructor(element, options = {}) {
      if (!element || element.__navigatorInitialized) return;

      this.nav = element;
      this.options = options;

      this.navMobile = this.nav.querySelector(".navigation__mobile .navigation__main");
      this.navClone = this.nav.querySelectorAll(".navigation__bar .navigation__list.level-0");
      this.mobileContainer = this.nav.querySelector(".navigation__mobile");

      this.openButton = document.querySelector(".open-nav");
      this.overlay = this.nav.querySelector(".navigation__overlay");

      this.nextElement = this.nav.nextElementSibling ?? this.nav.parentElement?.nextElementSibling;

      this.height = Math.ceil(this.nav.offsetHeight);
      this.scrolledHeight = 0;
      this.lastScrollTop = 0;

      this.threshold = options.threshold ?? 5;

      this.triggerElement = this.findFirstBodyElement() || this.findVisibleTriggerElement(this.nav);
      this.triggerOffset = this.triggerElement ? Math.ceil(this.triggerElement.offsetHeight) : 0;
      if (this.triggerOffset === this.height && this.triggerElement.classList.contains("navigation")) this.triggerOffset = 0;

      this.handleMobileClick = this.handleMobileClick.bind(this);

      this.init();
   }

   /* ---------------- INIT ---------------- */

   init() {
      this.nav.__navigatorInitialized = true;

      this.setNavHeightVar();
      this.createMobileMenu();
      this.bindMobileTrigger();
      this.bindMobileSubmenu();

      Navigator.instances.push(this);
   }

   destroy() {
      this.resetMobileMenuState();
      this.nav.__navigatorInitialized = false;
   }

   /* ---------------- GLOBAL HANDLERS ---------------- */

   static handleScrollAll() {
      if (Navigator.ticking) return;
      Navigator.ticking = true;

      requestAnimationFrame(() => {
         requestAnimationFrame(() => {
            Navigator.instances.forEach((i) => {
               i.applyPositionClass();
               i.handleScroll();
            });
            Navigator.ticking = false;
         });
      });
   }

   static handleResizeAll() {
      Navigator.instances.forEach((i) => i.handleResize());
   }

   /* ---------------- CORE ---------------- */

   isMobile() {
      return window.visualViewport ? window.visualViewport.width <= Navigator.MOBILE_BREAKPOINT : document.documentElement.clientWidth <= Navigator.MOBILE_BREAKPOINT;
   }
   handleResize() {
      const first = this.findFirstBodyElement();

      this.height = Math.ceil(this.nav.offsetHeight);

      if (first) {
         this.triggerElement = first;
         this.triggerOffset = Math.ceil(first.offsetHeight);
      }

      if (this.triggerOffset === this.height && this.triggerElement.classList.contains("navigation")) this.triggerOffset = 0;

      if (!this.isMobile()) this.resetMobileMenuState();

      this.setNavHeightVar();
      this.updateNavOffsetVar();
      this.createMobileMenu();
   }

   handleScroll() {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScroll <= this.triggerOffset) {
         this.resetScrollState(currentScroll);
         return;
      }

      this.updateNavOffsetVar();

      this.nav.classList.add("was-scrolled");

      const direction = this.scrollDirection(currentScroll);
      if (!direction) return;

      this.updateDirectionClasses(direction);
      this.lastScrollTop = Math.max(0, currentScroll);
   }

   scrollDirection(currentScroll) {
      const diff = currentScroll - this.lastScrollTop;
      if (Math.abs(diff) < this.threshold) return null;

      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      return diff > 0 ? "down" : "up";
   }

   updateDirectionClasses(direction) {
      this.nav.classList.toggle("scrolling-down", direction === "down");
      this.nav.classList.toggle("scrolling-up", direction === "up");
   }

   updateNavOffsetVar() {
      if (this.nav.classList.contains("virtual-space") && this.nextElement) {
         this.nextElement.style.setProperty("--nav-offset", `${this.height}px`);
      }

      if (this.nav.classList.contains("was-scrolled") && this.nextElement) {
         const __newHeight = Math.round(this.nav.getBoundingClientRect().height);
         if (this.scrolledHeight !== __newHeight) {
            this.scrolledHeight = __newHeight;
         }

         this.nextElement.style.setProperty("--nav-offset-scrolled", `${this.scrolledHeight}px`);
      }
   }

   resetScrollState(scrollTop) {
      this.nav.classList.remove("was-scrolled", "scrolling-up", "scrolling-down");

      this.lastScrollTop = scrollTop;

      if (this.nav.classList.contains("is-fixed") && this.nextElement) {
         this.nextElement.style.setProperty("--nav-offset", "0px");
         this.nextElement.style.setProperty("--nav-offset-scrolled", "0px");
         this.nav.classList.remove("is-fixed");
      }
   }

   /* ---------------- MOBILE ---------------- */

   resetMobileMenuState() {
      if (!this.mobileContainer) return;

      this.mobileContainer.classList.remove("is-open");
      this.overlay?.classList.remove("is-active");
      this.openButton?.classList.remove("opened");

      document.body.classList.remove("no-scroll");

      const clone = this.navMobile?.querySelectorAll(".is-clone");
      if (!this.isMobile()) {
         clone?.forEach((el) => el.remove());
      }

      this.nav.querySelectorAll(".opened").forEach((el) => {
         el.classList.remove("opened");
         el.style.maxHeight = null;
      });
   }

   bindMobileTrigger() {
      if (!this.openButton) return;

      const toggle = () => {
         this.mobileContainer.classList.toggle("is-open");
         this.openButton.classList.toggle("opened");
         this.overlay?.classList.toggle("is-active");
         document.body.classList.toggle("no-scroll");
      };

      this.openButton.addEventListener("click", toggle);
      this.overlay?.addEventListener("click", () => this.resetMobileMenuState());
   }

   bindMobileSubmenu() {
      this.nav.addEventListener("click", this.handleMobileClick);
   }

   handleMobileClick(e) {
      const btn = e.target.closest(".navigation__button.show-child");
      if (!btn) return;

      const child = btn.parentElement.lastElementChild;
      if (!child) return;

      child.classList.contains("opened") ? this.closeSubmenu(child, btn) : this.openSubmenu(child, btn);
   }

   openSubmenu(child, btn) {
      child.classList.add("opened");
      btn.classList.add("opened");

      child.style.maxHeight = child.scrollHeight + "px";

      child.addEventListener("transitionend", function handler() {
         child.style.maxHeight = "none";
         child.removeEventListener("transitionend", handler);
      });
   }

   closeSubmenu(child, btn) {
      child.style.maxHeight = child.scrollHeight + "px";

      requestAnimationFrame(() => {
         child.style.maxHeight = "0px";
      });

      child.classList.remove("opened");
      btn.classList.remove("opened");

      child.querySelectorAll(".opened").forEach((el) => {
         el.classList.remove("opened");
         el.style.maxHeight = null;
      });
   }

   createMobileMenu() {
      if (!this.isMobile() || !this.navClone || !this.navMobile) return;
      if (this.navMobile.querySelector(".is-clone")) return;

      this.navClone.forEach((el) => {
         const clone = el.cloneNode(true);
         clone.classList.add("is-clone");
         this.navMobile.appendChild(clone);
      });

      this.navMobile.querySelectorAll(".navigation__mobile--hidden,.navigation__separator, hr").forEach((el) => el.remove());
   }

   /* ---------------- UTILS ---------------- */

   applyPositionClass() {
      if (this.nav.classList.contains("will-fixed")) this.nav.classList.add("is-fixed");
      if (this.nav.classList.contains("will-sticky")) this.nav.classList.add("is-sticky");
   }

   setNavHeightVar() {
      if (!this.nextElement) return;

      if (this.nav.classList.contains("virtual-space")) {
         this.nextElement.style.setProperty("--nav-offset", `${this.height}px`);
      }
   }

   findFirstBodyElement() {
      let el = document.body.firstElementChild;
      while (el) {
         if (el.offsetHeight > 0) return el;
         el = el.nextElementSibling;
      }
      return null;
   }

   findVisibleTriggerElement(el) {
      let prev = el.previousElementSibling;
      while (prev) {
         if (prev.offsetHeight > 0) return prev;
         prev = prev.previousElementSibling;
      }
      return null;
   }
}

/* ---------------- MANAGER ---------------- */

class NavigatorManager {
   constructor(selector = ".navigation", options = {}) {
      this.selector = selector;
      this.options = options;
      this.init();
   }

   init() {
      document.querySelectorAll(this.selector).forEach((el) => {
         if (!el.__navigatorInitialized) {
            new Navigator(el, this.options);
         }
      });
   }

   destroy() {
      Navigator.instances.forEach((i) => i.destroy());
      Navigator.instances = [];
   }
}

/* ---------------- AUTO INIT ---------------- */

window.Navigator = Navigator;
window.NavigatorManager = NavigatorManager;

if (!window.__NAVIGATOR__) {
   window.__NAVIGATOR__ = new NavigatorManager();

   window.addEventListener("scroll", Navigator.handleScrollAll, { passive: true });
   window.addEventListener("resize", Navigator.handleResizeAll);

   new MutationObserver(() => {
      window.__NAVIGATOR__.init();
   }).observe(document.body, { childList: true, subtree: true });
}
