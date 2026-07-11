  // Framebusting guard: break out if this page is loaded inside a frame.
  // (meta-CSP can't set frame-ancestors and GitHub Pages can't send X-Frame-Options.)
  try { if (self !== top) { top.location = self.location; } } catch (e) {}

  // Sticky header: add subtle background once the user scrolls past the hero top.
  (function () {
    var header = document.getElementById("site-header");
    function onScroll() {
      if (window.scrollY > 12) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  })();

  // Reveal-on-scroll: fade/slide elements in once as they enter the viewport.
  // Honors prefers-reduced-motion (the CSS already shows everything in that case).
  (function () {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  })();

