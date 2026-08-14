/* SOOQ system docs — theme toggle + TOC scroll-spy. Shared by docs/system/*.html */
(function () {
  var KEY = "sooq-docs-theme";

  /* ---- Theme -------------------------------------------------------- */
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* file:// or blocked */ }
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }

  function currentTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      var sync = function () {
        btn.textContent = currentTheme() === "dark" ? "Light" : "Dark";
      };
      sync();
      btn.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
        sync();
      });
    }

    /* ---- TOC scroll-spy --------------------------------------------- */
    var links = Array.prototype.slice.call(
      document.querySelectorAll("nav.toc a[href^='#']")
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!el) return;
      byId[el.id] = a;
      targets.push(el);
    });

    var visible = new Set();
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // Highlight the topmost section currently in view.
        var top = targets.filter(function (t) { return visible.has(t.id); })[0];
        if (!top) return;
        links.forEach(function (a) { a.classList.remove("active"); });
        if (byId[top.id]) byId[top.id].classList.add("active");
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach(function (t) { observer.observe(t); });
  });
})();
