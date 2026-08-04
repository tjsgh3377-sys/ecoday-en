/* ECODAY (English-only site) — shared header/footer + interactions injected into every sub-page.
   All pages are x.html; internal links are plain .html. No language toggle.
   Each page: <body data-group="company|products|contact" data-page="greeting">
   Home links to index.html. */
(function () {

  var groups = {
    company: {
      label: "Company",
      items: [
        { label: "Greeting", href: "greeting.html" },
        { label: "History", href: "history.html" },
        { label: "Certification", href: "cert.html" }
      ]
    },
    business: {
      label: "Business Area",
      solo: "business.html"
    },
    products: {
      label: "Products",
      items: [
        { label: "Road Stud", href: "roadstud.html" },
        { label: "Bollard", href: "bollard.html" },
        { label: "LED Landscape Lighting", href: "lighting.html" },
        { label: "Design Fence", href: "fence.html" },
        { label: "Traffic & Chevron Sign", href: "sign.html" },
        { label: "In-Ground Traffic Light", href: "signal.html" }
      ]
    },
    contact: {
      label: "Contact Us",
      items: [
        { label: "Downloads", href: "resources.html" },
        { label: "Online Inquiry", href: "contact.html" },
        { label: "Location", href: "location.html" }
      ]
    }
  };
  var order = ["company", "business", "products", "contact"];
  var current = document.body.getAttribute("data-group");
  var currentPage = document.body.getAttribute("data-page");

  function menuHtml() {
    var out = "";
    order.forEach(function (key) {
      var g = groups[key];
      var active = key === current ? " class='active'" : "";
      if (g.solo) {
        out += "<li" + active + "><a href='" + g.solo + "'>" + g.label + "</a></li>";
        return;
      }
      out += "<li" + active + "><a href='" + g.items[0].href + "'>" + g.label +
        "<span class='caret'>▾</span></a><div class='dropdown'>";
      g.items.forEach(function (it) {
        out += "<a href='" + it.href + "'>" + it.label + "</a>";
      });
      out += "</div></li>";
    });
    return out;
  }

  var header =
    "<header class='site-header'><div class='container nav'>" +
      "<a class='brand' href='index.html'><img class='brand-logo' src='assets/logo_ecoday_mark.png' alt='ECODAY'></a>" +
      "<ul class='menu'>" + menuHtml() +
        "<li><a class='nav-cta' href='contact.html'>Contact</a></li>" +
      "</ul>" +
      "<button class='hamburger' aria-label='menu'>☰</button>" +
    "</div></header>";

  var footer =
    "<footer class='site-footer'><div class='container'>" +
      "<div class='footer-info'>" +
        "<img class='footer-logo' src='assets/logo_ecoday.png' alt='ECODAY CO., LTD.'>" +
        "<p class='ftag'>An eco-friendly specialist that puts customer safety first</p>" +
        "<p class='faddr'><b>HQ</b> B-510, 17 Geobuk-ro, Seo-gu, Incheon, Korea</p>" +
        "<p class='faddr'><b>Gyeonggi Branch</b> 1F, 29 Yeongbuk-ro 203beon-gil, Yeongbuk-myeon, Pocheon-si, Gyeonggi-do &nbsp;&nbsp;|&nbsp;&nbsp; <b>Chungcheong Branch</b> 92 Eumbong-ro, Eumbong-myeon, Asan-si, Chungcheongnam-do</p>" +
        "<p class='faddr'>T. 032-574-1770 &nbsp;&nbsp; F. 032-574-1772 &nbsp;&nbsp; M. ecoday-road@daum.net</p>" +
      "</div>" +
      "<div class='footer-bot'>" +
        "<span>© 2026 Ecoday Co., Ltd. All rights reserved.</span>" +
        "<span>Registered: Construction · Electrical · Outdoor Advertising</span>" +
      "</div>" +
    "</div></footer>";

  // inject
  var h = document.createElement("div"); h.innerHTML = header;
  document.body.insertBefore(h.firstChild, document.body.firstChild);
  var f = document.createElement("div"); f.innerHTML = footer;
  document.body.appendChild(f.firstChild);

  // mark current sub-page inside dropdown
  if (currentPage) {
    document.querySelectorAll(".dropdown a").forEach(function (a) {
      if (a.getAttribute("href") === location.pathname.split("/").pop()) {
        a.style.background = "var(--bg-soft)"; a.style.color = "var(--green-d)";
      }
    });
  }

  // mobile menu
  var burger = document.querySelector(".hamburger");
  var menu = document.querySelector(".menu");
  if (burger) burger.addEventListener("click", function () { menu.classList.toggle("open"); });

  // reveal on scroll (scroll+rAF; IntersectionObserver unreliable in headless preview)
  var els = [].slice.call(document.querySelectorAll(".reveal"));
  function check() {
    var vh = window.innerHeight;
    els = els.filter(function (el) {
      if (el.getBoundingClientRect().top < vh - 60) { el.classList.add("in"); return false; }
      return true;
    });
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { check(); ticking = false; }); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  check();
  setTimeout(function () { els.forEach(function (el) { el.classList.add("in"); }); }, 4000); // safety

  // product tabs
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var tabs = wrap.querySelectorAll(".ptab");
    var panels = wrap.querySelectorAll(".ppanel");
    function activate(id) {
      tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.tab === id); });
      panels.forEach(function (p) { p.classList.toggle("active", p.dataset.panel === id); });
      check();
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { activate(t.dataset.tab); history.replaceState(null, "", "#" + t.dataset.tab); }); });
    var hash = location.hash.replace("#", "");
    activate(hash && wrap.querySelector('.ptab[data-tab="' + hash + '"]') ? hash : tabs[0].dataset.tab);
  });
})();
