class Marquee {
   constructor(opts = {}) {
      this.selector = opts.selector || ".marquee";
      this.speed = opts.speed || 80;
      this.items = [...document.querySelectorAll(this.selector)];
      this.resizeTimer = null;

      this.init();
      this.observe();
      this.bindResize();
   }

   init() {
      const syncMap = {};

      this.items.forEach((el) => {
         // normalize structure
         if (!el.querySelector(".marquee__track")) {
            const text = el.innerHTML;
            el.innerHTML = `
            <div class="marquee__track">
              <div class="marquee__group">${text}</div>
              <div class="marquee__group">${text}</div>
            </div>
          `;
         }

         const track = el.querySelector(".marquee__track");
         const groups = el.querySelectorAll(".marquee__group");

         const containerW = el.getBoundingClientRect().width;
         let groupW = groups[0].getBoundingClientRect().width;

         // expand text (string, no DOM loop)
         if (groupW < containerW) {
            const repeat = Math.ceil(containerW / groupW);
            const expanded = groups[0].innerHTML.repeat(repeat);
            groups.forEach((g) => (g.innerHTML = expanded));
            groupW = groups[0].getBoundingClientRect().width;
         }

         const speed = +el.dataset.speed || this.speed;
         const sync = el.dataset.sync;

         if (sync) {
            if (!syncMap[sync]) syncMap[sync] = { max: 0, els: [] };
            syncMap[sync].max = Math.max(syncMap[sync].max, groupW);
            syncMap[sync].els.push({ track, speed });
         } else {
            track.style.animationDuration = groupW / speed + "s";
         }
      });

      // apply sync groups
      Object.values(syncMap).forEach((g) => {
         g.els.forEach(({ track, speed }) => {
            track.style.animationDuration = g.max / speed + "s";
         });
      });
   }

   observe() {
      const io = new IntersectionObserver((entries) => {
         entries.forEach((e) => {
            const track = e.target.querySelector(".marquee__track");
            if (track) {
               track.style.animationPlayState = e.isIntersecting ? "running" : "paused";
            }
         });
      });

      this.items.forEach((el) => io.observe(el));
   }

   bindResize() {
      window.addEventListener("resize", () => {
         clearTimeout(this.resizeTimer);
         this.resizeTimer = setTimeout(() => this.init(), 150);
      });
   }
}

window.Marquee = Marquee;

if (!window.__MARQUEE__) {
   window.__MARQUEE__ = new Marquee();

   // optional: auto-detect new elements
   new MutationObserver(() => {
      window.__MARQUEE__.init();
   }).observe(document.body, { childList: true, subtree: true });
}
