/* ECODAY — shared header/footer + interactions injected into every sub-page.
   Bilingual: English site at root, Korean site under /ko/.
   Language is taken from <html lang="ko"> (Korean) else English.
   Each page: <body data-group="company|products|contact" data-page="greeting">
   Home links to index.html. A KO / EN switch sits at the top-right of the header. */
(function () {

  var LANG = (document.documentElement.getAttribute("lang") || "en").slice(0, 2).toLowerCase() === "ko" ? "ko" : "en";
  // Korean pages live one folder deeper (/ko/), so shared assets resolve with "../".
  var BASE = LANG === "ko" ? "../" : "";

  var NAV = {
    en: {
      company:  { label: "Company",       items: [
        { label: "Greeting", href: "greeting.html" },
        { label: "History", href: "history.html" },
        { label: "Certification", href: "cert.html" } ] },
      business: { label: "Business Area",  solo: "business.html" },
      products: { label: "Products",       items: [
        { label: "Road Stud", href: "roadstud.html" },
        { label: "Bollard", href: "bollard.html" },
        { label: "LED Landscape Lighting", href: "lighting.html" },
        { label: "Design Fence", href: "fence.html" },
        { label: "Traffic & Chevron Sign", href: "sign.html" },
        { label: "In-Ground Traffic Light", href: "signal.html" } ] },
      contact:  { label: "Contact Us",     items: [
        { label: "Downloads", href: "resources.html" },
        { label: "Online Inquiry", href: "contact.html" },
        { label: "Location", href: "location.html" } ] },
      cta: "Contact"
    },
    ko: {
      company:  { label: "회사소개",       items: [
        { label: "인사말", href: "greeting.html" },
        { label: "연혁", href: "history.html" },
        { label: "인증현황", href: "cert.html" } ] },
      business: { label: "사업분야",       solo: "business.html" },
      products: { label: "제품소개",       items: [
        { label: "도로표지병", href: "roadstud.html" },
        { label: "볼라드", href: "bollard.html" },
        { label: "LED 경관조명", href: "lighting.html" },
        { label: "디자인형 울타리", href: "fence.html" },
        { label: "교통안전·갈매기 표지", href: "sign.html" },
        { label: "바닥형 보행신호등", href: "signal.html" } ] },
      contact:  { label: "고객지원",       items: [
        { label: "자료실", href: "resources.html" },
        { label: "온라인 문의", href: "contact.html" },
        { label: "오시는 길", href: "location.html" } ] },
      cta: "문의하기"
    }
  };

  // Footer UI labels per language.
  var FOOT = {
    en: { hq: "HQ", gyeonggi: "Gyeonggi Branch", chungcheong: "Chungcheong Branch" },
    ko: { hq: "본사", gyeonggi: "경기지사", chungcheong: "충청지사" }
  };

  // Default header/footer values — overridden by content.json > site (editable in admin).
  var SITE_DEFAULT = {
    en: {
      headerLogo: "assets/logo_ecoday_mark.png",
      footerLogo: "assets/logo_ecoday.png",
      tagline: "An eco-friendly specialist that puts customer safety first",
      addrHQ: "B-510, 17 Geobuk-ro, Seo-gu, Incheon, Korea",
      addrGyeonggi: "1F, 29 Yeongbuk-ro 203beon-gil, Yeongbuk-myeon, Pocheon-si, Gyeonggi-do",
      addrChungcheong: "92 Eumbong-ro, Eumbong-myeon, Asan-si, Chungcheongnam-do",
      tel: "+82 32-574-1770",
      fax: "+82 32-574-1772",
      email: "ecoday-road@daum.net",
      copyright: "© 2026 Ecoday Co., Ltd. All rights reserved.",
      registered: "Registered: Construction · Electrical · Outdoor Advertising"
    },
    ko: {
      headerLogo: "assets/logo_ecoday_mark.png",
      footerLogo: "assets/logo_ecoday.png",
      tagline: "고객의 안전을 최우선으로 하는 친환경 전문기업",
      addrHQ: "인천광역시 서구 거북로 17, 나동 510호 (인천테크피아)",
      addrGyeonggi: "경기도 포천시 영북면 영북로203번길 29, 1층",
      addrChungcheong: "충청남도 아산시 음봉면 음봉면로 92, 3층",
      tel: "+82 32-574-1770",
      fax: "+82 32-574-1772",
      email: "ecoday-road@daum.net",
      copyright: "© 2026 주식회사 에코데이. All rights reserved.",
      registered: "등록: 건설업 · 전기공사업 · 옥외광고업"
    }
  };

  var groups = NAV[LANG];
  var FL = FOOT[LANG];
  var order = ["company", "business", "products", "contact"];
  var current = document.body.getAttribute("data-group");
  var currentPage = document.body.getAttribute("data-page");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

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

  // KO / EN language switch — links to the counterpart page in the other language.
  function langSwitchHtml() {
    var file = location.pathname.split("/").pop();
    if (!file) file = "index.html";
    var enHref, koHref;
    if (LANG === "ko") { koHref = file; enHref = "../" + file; }
    else { koHref = "ko/" + file; enHref = file; }
    return "<div class='lang-switch'>" +
      "<a href='" + koHref + "'" + (LANG === "ko" ? " class='on'" : "") + ">KO</a>" +
      "<span class='sep'>/</span>" +
      "<a href='" + enHref + "'" + (LANG === "en" ? " class='on'" : "") + ">EN</a>" +
      "</div>";
  }

  var D = SITE_DEFAULT[LANG];
  var header =
    "<header class='site-header'><div class='container nav'>" +
      "<a class='brand' href='index.html'><img class='brand-logo' src='" + esc(BASE + D.headerLogo) + "' alt='ECODAY'></a>" +
      "<ul class='menu'>" + menuHtml() +
        "<li><a class='nav-cta' href='contact.html'>" + esc(groups.cta) + "</a></li>" +
      "</ul>" +
      langSwitchHtml() +
      "<button class='hamburger' aria-label='menu'>☰</button>" +
    "</div></header>";

  var footer =
    "<footer class='site-footer'><div class='container'>" +
      "<div class='footer-info'>" +
        "<img class='footer-logo' src='" + esc(BASE + D.footerLogo) + "' alt='ECODAY CO., LTD.'>" +
        "<p class='ftag'>" + esc(D.tagline) + "</p>" +
        "<p class='faddr faddr-hq'><b>" + esc(FL.hq) + "</b> " + esc(D.addrHQ) + "</p>" +
        "<p class='faddr faddr-branch'><b>" + esc(FL.gyeonggi) + "</b> " + esc(D.addrGyeonggi) + " &nbsp;&nbsp;|&nbsp;&nbsp; <b>" + esc(FL.chungcheong) + "</b> " + esc(D.addrChungcheong) + "</p>" +
        "<p class='faddr faddr-contact'>T. " + esc(D.tel) + " &nbsp;&nbsp; F. " + esc(D.fax) + " &nbsp;&nbsp; M. " + esc(D.email) + "</p>" +
      "</div>" +
      "<div class='footer-bot'>" +
        "<span class='fcopy'>" + esc(D.copyright) + "</span>" +
        "<span class='freg'>" + esc(D.registered) + "</span>" +
      "</div>" +
    "</div></footer>";

  // inject
  var h = document.createElement("div"); h.innerHTML = header;
  document.body.insertBefore(h.firstChild, document.body.firstChild);
  var f = document.createElement("div"); f.innerHTML = footer;
  document.body.appendChild(f.firstChild);

  // Apply editable header/footer overrides from content.json > site (admin-managed).
  function applySite(s) {
    var q = function (sel) { return document.querySelector(sel); };
    var hl = q(".brand-logo"); if (hl && s.headerLogo) hl.src = BASE + s.headerLogo;
    var fl = q(".footer-logo"); if (fl && s.footerLogo) fl.src = BASE + s.footerLogo;
    var tag = q(".ftag"); if (tag && s.tagline != null) tag.textContent = s.tagline;
    var hq = q(".faddr-hq"); if (hq) hq.innerHTML = "<b>" + esc(FL.hq) + "</b> " + esc(s.addrHQ);
    var br = q(".faddr-branch"); if (br) br.innerHTML = "<b>" + esc(FL.gyeonggi) + "</b> " + esc(s.addrGyeonggi) + " &nbsp;&nbsp;|&nbsp;&nbsp; <b>" + esc(FL.chungcheong) + "</b> " + esc(s.addrChungcheong);
    var ct = q(".faddr-contact"); if (ct) ct.innerHTML = "T. " + esc(s.tel) + " &nbsp;&nbsp; F. " + esc(s.fax) + " &nbsp;&nbsp; M. " + esc(s.email);
    var cp = q(".fcopy"); if (cp && s.copyright != null) cp.textContent = s.copyright;
    var rg = q(".freg"); if (rg && s.registered != null) rg.textContent = s.registered;
  }
  fetch("content.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.site) {
        var s = {}; for (var k in D) s[k] = D[k];
        for (var j in data.site) if (data.site[j] != null && data.site[j] !== "") s[j] = data.site[j];
        applySite(s);
      }
    })
    .catch(function () { /* keep default header/footer */ });

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
