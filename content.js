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
    })
    .catch(function () { /* keep static fallback markup */ });
})();
