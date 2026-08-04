/* ECODAY (English site) — renders editable sections from content.json.
   Works on static hosting (GitHub Pages). Each page keeps its original markup as a
   fallback; if content.json loads, the matching container is re-rendered from data.
   Editable via admin.html (local serve.ps1). */
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  fetch("content.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // Company > History (history.html)
      if (data.history && data.history.items) {
        set("cms-history", data.history.items.map(function (it) {
          return '<div class="tl-item reveal in"><div class="tl-year">' +
            esc(it.year) + '</div><p>' + esc(it.desc) + '</p></div>';
        }).join(""));
      }

      // Business Area (business.html)
      if (data.business && data.business.items) {
        set("cms-business", data.business.items.map(function (it) {
          return '<a class="card reveal in" href="' + esc(it.href) + '">' +
            '<div class="thumb"><img src="' + esc(it.img) + '" alt="' + esc(it.title) + '"></div>' +
            '<div class="body"><div class="en">' + esc(it.en) + '</div><h3>' + esc(it.title) +
            '</h3><p>' + esc(it.desc) + '</p></div></a>';
        }).join(""));
      }

      // Products (index.html)
      if (data.products && data.products.items) {
        set("cms-products", data.products.items.map(function (it) {
          var chips = (it.chips || []).map(function (c) {
            return '<span class="chip">' + esc(c) + "</span>";
          }).join("");
          return '<a class="card reveal in" href="' + esc(it.href) + '">' +
            '<div class="thumb"><img loading="lazy" decoding="async" src="' + esc(it.img) +
            '" alt="' + esc(it.title) + '"></div>' +
            '<div class="body"><h3>' + esc(it.title) + '</h3><div class="en">' + esc(it.en) +
            '</div><div class="chips">' + chips + '</div></div></a>';
        }).join(""));
      }

      // Contact Us > Downloads (resources.html)
      if (data.downloads && data.downloads.items) {
        set("cms-downloads", data.downloads.items.map(function (it) {
          return '<a class="dl reveal in" href="mailto:ecoday-road@daum.net?subject=' +
            esc("[Material Request] " + (it.subject || it.title || "")) + '">' +
            '<div class="ic">▤</div><div><b>' + esc(it.title) + '</b><span>' + esc(it.desc) +
            '</span></div><div class="go">Request →</div></a>';
        }).join(""));
      }

      // Products > detail pages (roadstud/bollard/lighting/fence/sign/signal)
      var phost = document.getElementById("cms-product");
      if (phost && data.productPages) {
        var key = document.body.getAttribute("data-page");
        var pg = data.productPages[key];
        if (pg) { renderProduct(phost, pg); }
      }
    })
    .catch(function () { /* keep static fallback markup */ });

  function card(c) {
    var rows = (c.specs || []).map(function (s) {
      return '<tr><th>' + esc(s.k) + '</th><td>' + esc(s.v) + '</td></tr>';
    }).join("");
    var feats = (c.features || []).map(function (f) {
      return '<li>' + esc(f) + '</li>';
    }).join("");
    return '<div class="prow reveal in">' +
      '<div class="pimg' + (c.pc ? ' pc' : '') + '"><img src="' + esc(c.img) + '" alt="' + esc(c.alt || c.title) + '"></div>' +
      '<div>' +
        (c.tagLine ? '<span class="tag-line">' + esc(c.tagLine) + '</span>' : '') +
        '<h3>' + esc(c.title) + '</h3>' +
        (c.model ? '<div class="model">' + esc(c.model) + '</div>' : '') +
        (rows ? '<table class="spec">' + rows + '</table>' : '') +
        (feats ? '<ul class="plist">' + feats + '</ul>' : '') +
      '</div></div>';
  }

  function head(h, cls) {
    return '<div class="section-head ' + cls + '">' +
      (h.eyebrow ? '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' : '') +
      '<h2>' + esc(h.title) + '</h2>' +
      (h.desc ? '<p>' + esc(h.desc) + '</p>' : '') + '</div>';
  }

  function renderProduct(host, pg) {
    var h = pg.hero || {};
    var out = '<section class="pagehero"><div class="container">' +
      '<div class="crumb"><a href="index.html">HOME</a><span>/</span> Products <span>/</span> ' + esc(h.crumb || h.title) + '</div>' +
      (h.eyebrow ? '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' : '') +
      '<h1>' + esc(h.title) + '</h1>' +
      (h.lead ? '<p class="lead">' + esc(h.lead) + '</p>' : '') +
      '</div></section>';

    // line-up
    var tabs = pg.tabs || [];
    if (pg.hasTabs) {
      var btns = tabs.map(function (t) {
        return '<button class="ptab" data-tab="' + esc(t.id) + '">' + esc(t.label) + '</button>';
      }).join("");
      var panels = tabs.map(function (t) {
        return '<div class="ppanel" data-panel="' + esc(t.id) + '">' +
          (t.cards || []).map(card).join("") + '</div>';
      }).join("");
      out += '<section class="section"><div class="container" data-tabs>' +
        head(pg.lineup || {}, "reveal in") +
        '<div class="ptabs reveal in">' + btns + '</div>' + panels +
        '</div></section>';
    } else {
      var allCards = (tabs[0] && tabs[0].cards ? tabs[0].cards : []).map(card).join("");
      out += '<section class="section"><div class="container">' +
        head(pg.lineup || {}, "reveal in") + allCards +
        '</div></section>';
    }

    // soft section (install cases OR feat-grid)
    if (pg.hasInstall && pg.install) {
      var ins = pg.install, body = "";
      if (ins.layout === "feats") {
        body = '<div class="feat-grid">' + (ins.feats || []).map(function (f) {
          return '<div class="feat reveal in"><span class="no">' + esc(f.no) + '</span>' +
            '<h4>' + esc(f.title) + '</h4><p>' + esc(f.desc) + '</p></div>';
        }).join("") + '</div>';
      } else {
        body = '<div class="grid cols-3">' + (ins.cases || []).map(function (cs) {
          return '<div class="card reveal in"><div class="thumb"><img src="' + esc(cs.img) +
            '" alt="' + esc(cs.alt || cs.title) + '"></div>' +
            '<div class="body"><h3 style="font-size:16px">' + esc(cs.title) + '</h3></div></div>';
        }).join("") + '</div>';
      }
      var ctaBand = ins.cta ? '<div style="text-align:center;margin-top:40px" class="reveal in">' +
        '<a class="btn btn-green" href="' + esc(ins.ctaHref || "contact.html") + '">' + esc(ins.cta) + '</a></div>' : "";
      out += '<section class="section soft"><div class="container">' +
        head(ins, "reveal in") + body + ctaBand + '</div></section>';
    }

    host.innerHTML = out;

    // wire product tabs (include.js already ran before this async render)
    host.querySelectorAll("[data-tabs]").forEach(function (wrap) {
      var ts = wrap.querySelectorAll(".ptab");
      var ps = wrap.querySelectorAll(".ppanel");
      function activate(id) {
        ts.forEach(function (t) { t.classList.toggle("active", t.dataset.tab === id); });
        ps.forEach(function (p) { p.classList.toggle("active", p.dataset.panel === id); });
      }
      ts.forEach(function (t) {
        t.addEventListener("click", function () {
          activate(t.dataset.tab);
          history.replaceState(null, "", "#" + t.dataset.tab);
        });
      });
      var hash = location.hash.replace("#", "");
      if (ts.length) {
        activate(hash && wrap.querySelector('.ptab[data-tab="' + hash + '"]') ? hash : ts[0].dataset.tab);
      }
    });
  }
})();
