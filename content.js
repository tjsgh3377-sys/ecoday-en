/* ECODAY — renders editable sections from content.json, and product detail
   pages from the shared normalized catalog (data/catalog_products.json +
   data/catalog_installs.json). KO (/ko/) and EN share the SAME catalog data;
   language is chosen at render time. Works on static hosting (GitHub Pages). */
(function () {
  // Korean pages live under /ko/, so shared assets/data resolve with "../".
  var LANG = (document.documentElement.getAttribute("lang") || "en").slice(0, 2).toLowerCase() === "ko" ? "ko" : "en";
  var BASE = LANG === "ko" ? "../" : "";
  var KO = LANG === "ko";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function L(ko, en) { return KO ? ko : en; }

  // English labels for subcategory tabs (data stores subcategory in Korean)
  var SUBEN = {
    "Ø138": "Ø138", "모듈교체형": "Module-Replacement", "전기형": "Mains",
    "라인조명": "Line Light", "벽부등": "Wall Light", "경계석조명": "Curb-Stone Light",
    "로고젝터": "Logo Projector", "공원등": "Park Light", "공원보안등": "Park Security Light",
    "포인트조명": "Accent Light", "바닥매립등": "Recessed Floor Light", "펜스기둥조명": "Fence-Post Light",
    "볼라드조명": "Bollard Light", "투광조명": "Floodlight", "지중등": "In-ground Light", "열주등": "Column Light",
    "LED 볼라드": "LED Bollard", "비조명형 볼라드": "Non-illuminated Bollard", "스테인리스 볼라드": "Stainless Bollard",
    "차량방호책": "Vehicle Guard", "보행자용 방호울타리": "Pedestrian Fence", "보차도경계용 울타리": "Road/Sidewalk Boundary",
    "바닥형보행신호등": "In-Ground Signal", "교통안전표지": "Traffic Safety Sign", "갈매기표지판": "Chevron Sign"
  };
  function subLabel(s) { return KO ? s : (SUBEN[s] || s); }

  // Spec/label term translation for the EN site (data spec values are Korean-mixed).
  var TR_EXACT = {
    "백/황/녹/적/청 (1 선택)": "White/Yellow/Green/Red/Blue (choose 1)",
    "보행신호 연동": "Synced with pedestrian signal",
    "라인바": "Line Bar", "핸드레일바": "Handrail Bar", "바": "Bar",
    "부착형(Attach)": "Attach type", "매립형(Flush)": "Flush type"
  };
  var TR_SUB = [
    ["표지병미니", "mini stud"], ["사각표지병", "square stud"],
    ["LED 스탭등", "LED step light"], ["스탭등", "step light"],
    ["222각", "222 sq."], ["118각", "118 sq."],
    ["알루미늄 다이캐스팅", "die-cast aluminum"], ["알루미늄 압출", "extruded aluminum"],
    ["스테인리스강", "stainless steel"], ["초고휘도 반사지", "ultra-high-brightness reflective sheet"],
    ["고휘도 반사지", "high-brightness reflective sheet"], ["고강도 폴리카보네이트", "high-strength polycarbonate"],
    ["다이캐스팅", "die-casting"], ["압출", "extruded"],
    ["폴리카보네이트", "polycarbonate"], ["폴리우레탄", "polyurethane"], ["강화유리", "tempered glass"],
    ["스테인레스", "stainless"], ["스테인리스", "stainless"], ["알루미늄", "aluminum"],
    ["기준 조도 100lx 이하 작동", "Operates at ≤100lx"], ["기준 조도 100Ix 이하 작동", "Operates at ≤100lx"],
    ["부조일수 5일 이상", "5+ days without sun"], ["전원인입", "mains input"], ["전기인입", "mains input"],
    ["점등 또는 점멸", "steady-on or flashing"], ["선택가능(패턴설정)", "selectable (pattern)"],
    ["컨트롤러 구동방식", "controller-driven"], ["컨트롤러 구동", "controller-driven"],
    ["이미지 배광 방식", "image light distribution"], ["이미지 배광", "image light distribution"],
    ["조명부", "lighting section"], ["충격흡수", "shock absorber"], ["반사지", "reflective sheet"],
    ["몸체", "body"], ["등주", "post"], ["표출부", "Display"], ["제어부", "Control Unit"],
    ["옵션보드", "Option Board"], ["태양광", "solar"], ["LED 내부조명", "LED internal lighting"],
    ["디밍", "dimming"], ["별도", "separate"], ["점등", "steady-on"], ["디자인형울타리", "design fence"],
    ["매립식", "embedded"], ["앵커식", "surface"], ["이동식", "detachable"],
    ["단면 전기", "single-sided mains"], ["단면 태양광", "single-sided solar"],
    ["양면 전기", "double-sided mains"], ["양면 태양광", "double-sided solar"],
    ["전기형", "mains"], ["배터리형", "battery"], ["하이브리드형", "hybrid"], ["태양광형", "solar"],
    ["UV 코팅", "UV coating"], ["코팅", "coating"],
    ["모델별 상이", "varies per model"], ["모델별", "per model"], ["상이", "varies"],
    ["입력전압", "input voltage"], ["소비전력", "power consumption"],
    ["조정가능", "adjustable"], ["조정", "adjustable"],
    ["부착형", "attach type"], ["매립형", "flush type"],
    ["경계석", "curb"], ["조명형", "lighting type"],
    ["100단계", "100-step"], ["단계", "-step"], ["실리콘", "silicone"], ["점멸", "flashing"],
    ["통신", "communication"], ["적색", "red"], ["황색", "yellow"], ["녹색", "green"], ["백색", "white"],
    ["최대", "max."], ["소등", "off"], ["일부", "some"], ["이하", "or less"], ["작동", "operation"],
    ["입력", "input"], [" 등", " etc."], ["단면", "single-sided"], ["양면", "double-sided"],
    ["가능", "available"], ["전기", "mains"],
    ["전기 ", "mains "], ["각)", "sq.)"]
  ];
  function tr(s) {
    if (KO || s == null) return s;
    s = String(s);
    if (TR_EXACT[s]) return TR_EXACT[s];
    for (var i = 0; i < TR_SUB.length; i++) s = s.split(TR_SUB[i][0]).join(TR_SUB[i][1]);
    return s;
  }

  // ---- editable sections (home/company/business/downloads) ----
  fetch("content.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.history && data.history.items) {
        set("cms-history", data.history.items.map(function (it) {
          return '<div class="tl-item reveal in"><div class="tl-year">' +
            esc(it.year) + '</div><p>' + esc(it.desc) + '</p></div>';
        }).join(""));
      }
      if (data.business && data.business.items) {
        set("cms-business", data.business.items.map(function (it) {
          return '<a class="card reveal in" href="' + esc(it.href) + '">' +
            '<div class="thumb"><img src="' + esc(BASE + it.img) + '" alt="' + esc(it.title) + '"></div>' +
            '<div class="body"><div class="en">' + esc(it.en) + '</div><h3>' + esc(it.title) +
            '</h3><p>' + esc(it.desc) + '</p></div></a>';
        }).join(""));
      }
      if (data.products && data.products.items) {
        set("cms-products", data.products.items.map(function (it) {
          var chips = (it.chips || []).map(function (c) {
            return '<span class="chip">' + esc(c) + "</span>";
          }).join("");
          return '<a class="card reveal in" href="' + esc(it.href) + '">' +
            '<div class="thumb"><img loading="lazy" decoding="async" src="' + esc(BASE + it.img) +
            '" alt="' + esc(it.title) + '"></div>' +
            '<div class="body"><h3>' + esc(it.title) + '</h3><div class="en">' + esc(it.en) +
            '</div><div class="chips">' + chips + '</div></div></a>';
        }).join(""));
      }
      if (data.downloads && data.downloads.items) {
        set("cms-downloads", data.downloads.items.map(function (it) {
          var inner = '<div class="ic">▤</div><div><b>' + esc(it.title) + '</b><span>' + esc(it.desc) + '</span></div>';
          if (it.soon) {
            return '<div class="dl reveal in" style="cursor:default">' + inner +
              '<div class="go" style="color:var(--muted)">' + L("준비 중", "Coming soon") + '</div></div>';
          }
          var hasUrl = it.url && String(it.url).trim();
          var href = hasUrl ? esc(String(it.url).trim())
            : ("mailto:ecoday-road@daum.net?subject=" + esc("[Material Request] " + (it.subject || it.title || "")));
          var extra = hasUrl ? ' target="_blank" rel="noopener"' : '';
          var label = hasUrl ? L("보기 →", "View →") : L("자료 요청 →", "Request →");
          return '<a class="dl reveal in" href="' + href + '"' + extra + '>' + inner +
            '<div class="go">' + label + '</div></a>';
        }).join(""));
      }

      // product hero/lineup headings still come from content.json (bilingual)
      var phost = document.getElementById("cms-product");
      if (phost) {
        var key = document.body.getAttribute("data-page");
        var pg = (data.productPages && data.productPages[key]) || {};
        loadCatalog(phost, key, pg);
      }
      var ihost = document.getElementById("cms-installations");
      if (ihost) loadInstalls(ihost);
    })
    .catch(function () {
      var phost = document.getElementById("cms-product");
      if (phost) loadCatalog(phost, document.body.getAttribute("data-page"), {});
      var ihost = document.getElementById("cms-installations");
      if (ihost) loadInstalls(ihost);
    });

  // ---- shared catalog (products + installs) ----
  function loadCatalog(host, category, pg) {
    Promise.all([
      fetch(BASE + "data/catalog_products.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
      fetch(BASE + "data/catalog_installs.json", { cache: "no-store" }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      var groups = (res[0].groups || []).filter(function (g) { return g.category === category; });
      var products = (res[0].products || []).filter(function (p) { return p.category === category; });
      var installs = (res[1].installs || []).filter(function (i) { return i.category === category; });
      renderProduct(host, pg, groups, products, installs);
    }).catch(function () { /* keep static fallback */ });
  }

  // ---- installations page (independent gallery with filters + lightbox) ----
  function loadInstalls(host) {
    fetch(BASE + "data/catalog_installs.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (res) { renderInstallations(host, res.installs || []); })
      .catch(function () { });
  }
  function instFilterKey(cat) { return (cat === "sign" || cat === "chevron") ? "signs" : cat; }

  function renderInstallations(host, installs) {
    var FILTERS = [
      ["all", L("전체", "All")], ["roadstud", L("도로표지병", "Road Stud")],
      ["lighting", L("LED 경관조명기구", "LED Landscape Lighting")], ["bollard", L("볼라드", "Bollard")],
      ["fence", L("디자인형 울타리", "Design Fence")], ["signal", L("바닥형 보행신호등", "In-Ground Traffic Light")],
      ["signs", L("교통안전·갈매기표지판", "Traffic / Chevron Signs")]
    ];
    var out = '<section class="pagehero"><div class="container">' +
      '<div class="crumb"><a href="index.html">' + L("홈", "HOME") + '</a><span>/</span> ' + L("설치사례", "Installations") + '</div>' +
      '<span class="eyebrow">INSTALLATION CASES</span><h1>' + L("설치사례", "Installation Cases") + '</h1>' +
      '<p class="lead">' + L("에코데이 제품이 적용된 다양한 설치 환경을 만나보세요.", "Explore the diverse environments where Ecoday products are installed.") + '</p>' +
      '</div></section>';
    out += '<section class="section"><div class="container" data-instwrap>';
    out += '<div class="ptabs inst-filters reveal in">' + FILTERS.map(function (f) {
      return '<button class="ptab inst-filter" data-filter="' + f[0] + '">' + esc(f[1]) + '</button>';
    }).join("") + '</div>';
    out += '<div class="grid cols-3 instgrid">' + installs.map(function (c, i) {
      var fk = instFilterKey(c.category); var title = KO ? c.titleKo : c.titleEn;
      var sub = KO ? (c.subcategoryKo || "") : (c.subcategoryEn || "");
      return '<button class="card reveal in instcard" data-filter="' + fk + '" data-lb="' + i + '" type="button">' +
        '<div class="thumb"><img loading="lazy" decoding="async" src="' + esc(BASE + c.image) + '" alt="' + esc(title) + '"></div>' +
        '<div class="body">' + (sub ? '<div class="en" style="font-size:12px">' + esc(sub) + '</div>' : '') +
        '<h3 style="font-size:16px">' + esc(title) + '</h3></div></button>';
    }).join("") + '</div>';
    out += '<div class="pnohit" hidden>' + L("해당 설치사례가 없습니다.", "No installations in this category.") + '</div>';
    out += '</div></section>';
    out += '<section class="section soft"><div class="container"><div class="cta-band reveal in">' +
      '<h2>' + L("제품과 설치가 궁금하세요?", "Interested in our products and installation?") + '</h2>' +
      '<p>' + L("제품소개에서 상세 사양을 확인하거나 온라인으로 문의해 주세요.", "Check detailed specs on the product pages or send us an inquiry.") + '</p>' +
      '<a class="btn btn-green" href="roadstud.html">' + L("제품소개 →", "Products →") + '</a>' +
      ' <a class="btn btn-outline" href="contact.html">' + L("온라인 문의 →", "Online Inquiry →") + '</a>' +
      '</div></div></section>';
    host.innerHTML = out;

    var wrap = host.querySelector("[data-instwrap]");
    var btns = wrap.querySelectorAll(".inst-filter");
    var cards = wrap.querySelectorAll(".instcard");
    var nohit = wrap.querySelector(".pnohit");
    function apply(fk) {
      btns.forEach(function (b) { b.classList.toggle("active", b.dataset.filter === fk); });
      var n = 0;
      cards.forEach(function (c) { var hit = (fk === "all" || c.dataset.filter === fk); c.style.display = hit ? "" : "none"; if (hit) n++; });
      if (nohit) nohit.hidden = n !== 0;
      try { history.replaceState(null, "", "?category=" + fk); } catch (e) { }
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { apply(b.dataset.filter); }); });
    var q = (new URLSearchParams(location.search)).get("category") || "all";
    if (!FILTERS.some(function (f) { return f[0] === q; })) q = "all";
    apply(q);
    wireInstLightbox(host, installs, cards);
  }

  function wireInstLightbox(host, installs, cards) {
    var ov = document.createElement("div");
    ov.className = "lb-overlay"; ov.hidden = true;
    ov.innerHTML = '<button class="lb-close" aria-label="close">×</button>' +
      '<button class="lb-nav lb-prev" aria-label="prev">‹</button>' +
      '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-nav lb-next" aria-label="next">›</button>';
    document.body.appendChild(ov);
    var img = ov.querySelector(".lb-img"), cap = ov.querySelector(".lb-cap");
    var visible = [], cur = 0;
    function rebuild() {
      visible = Array.prototype.slice.call(cards)
        .filter(function (c) { return c.style.display !== "none"; })
        .map(function (c) { return +c.getAttribute("data-lb"); });
    }
    function show(i) {
      if (!visible.length) return;
      cur = (i + visible.length) % visible.length;
      var c = installs[visible[cur]];
      img.src = BASE + c.image; img.alt = KO ? c.titleKo : c.titleEn; cap.textContent = KO ? c.titleKo : c.titleEn;
    }
    function openByIdx(idx) { rebuild(); var p = visible.indexOf(idx); show(p < 0 ? 0 : p); ov.hidden = false; document.body.style.overflow = "hidden"; }
    function close() { ov.hidden = true; document.body.style.overflow = ""; }
    cards.forEach(function (c) { c.addEventListener("click", function () { openByIdx(+c.getAttribute("data-lb")); }); });
    ov.querySelector(".lb-close").addEventListener("click", close);
    ov.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    ov.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) {
      if (ov.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  function head(h, cls) {
    return '<div class="section-head ' + cls + '">' +
      (h.eyebrow ? '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' : '') +
      (h.title ? '<h2>' + esc(h.title) + '</h2>' : '') +
      (h.desc ? '<p>' + esc(h.desc) + '</p>' : '') + '</div>';
  }

  var SPECK = [
    ["lighting", "조명장치", "Lighting"],
    ["power", "전원장치", "Power"],
    ["materials", "주요재질", "Materials"],
    ["size", "크기/규격", "Size"],
    ["method", "점등방식", "Lighting Method"],
    ["consumption", "소비전력", "Power Consumption"]
  ];

  // ONE independent block per MODEL: own image + own spec table + own description.
  function productBlock(p, grp) {
    var name = KO ? p.nameKo : p.nameEn;
    var ptype = KO ? p.powerTypeKo : p.powerTypeEn;
    var variant = p.variantKo ? tr(p.variantKo) : "";
    var desc = KO ? p.descriptionKo : p.descriptionEn;
    var feats = (KO ? p.featuresKo : p.featuresEn) || [];
    var sp = p.specifications || {};
    var rows = SPECK.map(function (k) {
      var v = sp[k[0]];
      if (!v || v === "-") return "";
      return '<tr><th>' + esc(KO ? k[1] : k[2]) + '</th><td>' + esc(tr(v)) + '</td></tr>';
    }).join("");
    var pid = p.procurementId
      ? '<span class="mp">' + L("나라장터 ", "Procurement ") + esc(p.procurementId) + '</span>'
      : '<span class="mp muted">' + L("식별번호 확인 중", "Procurement TBC") + '</span>';
    var note = (p.verificationStatus && p.verificationStatus !== "ok")
      ? ' <span class="vnote" title="' + esc(p.verificationStatus) + '">※</span>' : '';
    var ledc = (p.ledColors && p.ledColors.length && p.ledColors[0] !== "-")
      ? '<div class="model">LED: ' + esc(tr(p.ledColors.join(" · "))) + '</div>' : "";
    var featsHtml = feats.length ? '<ul class="plist">' + feats.map(function (f) {
      return '<li>' + esc(f) + '</li>';
    }).join("") + '</ul>' : "";
    var shared = p.sharedImage ? ' <span class="shimg">' + L("공통 이미지", "shared image") + '</span>' : '';
    var search = ((name || "") + " " + p.model + " " + (p.procurementId || "") + " " + variant).toLowerCase();
    return '<div class="prow reveal in pcard" data-search="' + esc(search) + '">' +
      '<div class="pimg pc"><img loading="lazy" decoding="async" src="' + esc(BASE + (p.image || "")) +
        '" alt="' + esc(name + " " + p.model) + '"></div>' +
      '<div>' +
        (ptype && ptype !== "-" ? '<span class="tag-line">' + esc(ptype) + (variant ? ' · ' + esc(variant) : '') + '</span>'
          : (variant ? '<span class="tag-line">' + esc(variant) + '</span>' : '')) +
        '<h3>' + esc(name) + '</h3>' +
        '<div class="model-id"><b>' + esc(p.model.trim()) + '</b>' + note + ' ' + pid + shared + '</div>' +
        ledc +
        (desc ? '<p class="pdesc">' + esc(desc) + '</p>' : '') +
        (rows ? '<table class="spec">' + rows + '</table>' : '') +
        featsHtml +
      '</div></div>';
  }

  // system diagram rendered once (separate system area), e.g. in-ground signal.
  function sysDiagram() {
    var steps = KO
      ? ["표준교통신호제어기", "옵션보드 (EDOB-200)", "제어부 (EDCB-200)", "표출부 (EDBL-200)"]
      : ["Standard Signal Controller", "Option Board (EDOB-200)", "Control Unit (EDCB-200)", "Display (EDBL-200)"];
    return '<div class="sysbox reveal in"><h4>' + L("시스템 구성 및 통신", "System & Communication") + '</h4>' +
      '<div class="sysflow" aria-label="system diagram">' +
      steps.map(function (s, i) {
        return (i ? '<span class="sysar">→</span>' : '') + '<span class="sysnode">' + esc(s) + '</span>';
      }).join("") + '</div>' +
      '<p class="sysnote">' +
      L("RS485 통신 · 보행신호 녹색 점등 / 적색 소등 연동", "RS485 communication · green = on, red = off, synced with the pedestrian signal") +
      '</p></div>';
  }

  function renderProduct(host, pg, groups, products, installs) {
    var h = pg.hero || {};
    var out = '<section class="pagehero"><div class="container">' +
      '<div class="crumb"><a href="index.html">' + L("홈", "HOME") + '</a><span>/</span> ' +
      L("제품소개", "Products") + ' <span>/</span> ' + esc(h.crumb || h.title || "") + '</div>' +
      (h.eyebrow ? '<span class="eyebrow">' + esc(h.eyebrow) + '</span>' : '') +
      '<h1>' + esc(h.title || "") + '</h1>' +
      (h.lead ? '<p class="lead">' + esc(h.lead) + '</p>' : '') +
      '</div></section>';

    // group lookup (name / systemDiagram) + per-subcategory product lists
    var groupMap = {}; groups.forEach(function (g) { groupMap[g.productGroup] = g; });
    var subOrder = [], subMap = {};
    products.forEach(function (p) {
      if (!subMap[p.subcategory]) { subMap[p.subcategory] = []; subOrder.push(p.subcategory); }
      subMap[p.subcategory].push(p);
    });
    var modelCount = products.length;

    out += '<section class="section"><div class="container" data-tabs>' +
      head(pg.lineup || { title: L("제품 라인업", "Product Line-up") }, "reveal in") +
      '<div class="ptools reveal in">' +
        '<div class="pcount">' + L("전체 모델", "Total models") + ' <b data-total>' + modelCount + '</b></div>' +
        '<input class="psearch" type="search" placeholder="' +
          L("모델명 · 식별번호 검색", "Search model · procurement no.") + '" aria-label="search">' +
      '</div>';

    if (subOrder.length > 1) {
      out += '<div class="ptabs reveal in">' + subOrder.map(function (s, i) {
        return '<button class="ptab" data-tab="sub' + i + '">' + esc(subLabel(s)) + '</button>';
      }).join("") + '</div>';
    }
    // each subcategory panel: group heading per productGroup, then one block per model
    subOrder.forEach(function (s, i) {
      var body = "", lastGrp = null;
      subMap[s].forEach(function (p) {
        if (p.productGroup !== lastGrp) {
          // close previous group's optional system diagram
          if (lastGrp && groupMap[lastGrp] && groupMap[lastGrp].systemDiagram) body += sysDiagram();
          lastGrp = p.productGroup;
          var g = groupMap[p.productGroup] || {};
          var gname = KO ? g.nameKo : g.nameEn;
          var cnt = subMap[s].filter(function (q) { return q.productGroup === p.productGroup; }).length;
          body += '<div class="pgroup-head reveal in"><h3>' + esc(gname || "") + '</h3>' +
            '<span class="pgroup-count">' + cnt + L(" 모델", " models") + '</span></div>';
        }
        body += productBlock(p, groupMap[p.productGroup]);
      });
      if (lastGrp && groupMap[lastGrp] && groupMap[lastGrp].systemDiagram) body += sysDiagram();
      out += '<div class="ppanel" data-panel="sub' + i + '">' + body + '</div>';
    });
    out += '<div class="pnohit" hidden>' + L("검색 결과가 없습니다.", "No results.") + '</div>';
    out += '</div></section>';

    // installation cases (gallery + lightbox)
    if (installs.length) {
      out += '<section class="section soft"><div class="container">' +
        head({ eyebrow: L("설치사례", "Installation"), title: L("설치사례", "Installation Cases"),
               desc: L("최종 카탈로그에 수록된 실제 설치 현장 사진입니다.",
                       "Real installation photos from the final product catalog.") }, "reveal in") +
        '<div class="grid cols-3 instgrid">' + installs.map(function (c, idx) {
          var title = KO ? c.titleKo : c.titleEn;
          return '<button class="card reveal in instcard" data-lb="' + idx + '" type="button">' +
            '<div class="thumb"><img loading="lazy" decoding="async" src="' + esc(BASE + c.image) +
              '" alt="' + esc(title) + '"></div>' +
            '<div class="body"><h3 style="font-size:16px">' + esc(title) + '</h3></div></button>';
        }).join("") + '</div>' +
        '<div style="text-align:center;margin-top:40px" class="reveal in">' +
          '<a class="btn btn-green" href="contact.html">' + L("제품 견적 문의 →", "Request a Product Quote →") + '</a></div>' +
        '</div></section>';
    }

    host.innerHTML = out;
    wireTabs(host);
    wireSearch(host);
    wireLightbox(host, installs);
  }

  function wireTabs(host) {
    host.querySelectorAll("[data-tabs]").forEach(function (wrap) {
      var ts = wrap.querySelectorAll(".ptab");
      var ps = wrap.querySelectorAll(".ppanel");
      if (!ts.length) { ps.forEach(function (p) { p.classList.add("active"); }); return; }
      function activate(id) {
        ts.forEach(function (t) { t.classList.toggle("active", t.dataset.tab === id); });
        ps.forEach(function (p) { p.classList.toggle("active", p.dataset.panel === id); });
      }
      ts.forEach(function (t) {
        t.addEventListener("click", function () {
          if (wrap.classList.contains("searching")) return;
          activate(t.dataset.tab);
          history.replaceState(null, "", "#" + t.dataset.tab);
        });
      });
      var hash = location.hash.replace("#", "");
      activate(hash && wrap.querySelector('.ptab[data-tab="' + hash + '"]') ? hash : ts[0].dataset.tab);
      wrap._activate = activate; wrap._first = ts[0].dataset.tab;
    });
  }

  function wireSearch(host) {
    var wrap = host.querySelector("[data-tabs]");
    if (!wrap) return;
    var input = wrap.querySelector(".psearch");
    var cards = Array.prototype.slice.call(wrap.querySelectorAll(".pcard"));
    var heads = Array.prototype.slice.call(wrap.querySelectorAll(".pgroup-head"));
    var panels = wrap.querySelectorAll(".ppanel");
    var nohit = wrap.querySelector(".pnohit");
    var totalEl = wrap.querySelector("[data-total]");
    var total = totalEl ? totalEl.textContent : "";
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        wrap.classList.remove("searching");
        cards.forEach(function (c) { c.style.display = ""; });
        heads.forEach(function (h) { h.style.display = ""; });
        panels.forEach(function (p) { p.classList.remove("force"); });
        if (nohit) nohit.hidden = true;
        if (totalEl) totalEl.textContent = total;
        if (wrap._activate) wrap._activate(wrap._first);
        return;
      }
      wrap.classList.add("searching");
      panels.forEach(function (p) { p.classList.add("force"); });
      heads.forEach(function (h) { h.style.display = "none"; });
      var n = 0;
      cards.forEach(function (c) {
        var hit = (c.getAttribute("data-search") || "").indexOf(q) !== -1;
        c.style.display = hit ? "" : "none";
        if (hit) n++;
      });
      if (nohit) nohit.hidden = n !== 0;
      if (totalEl) totalEl.textContent = n;
    });
  }

  function wireLightbox(host, installs) {
    var cards = host.querySelectorAll(".instcard");
    if (!cards.length) return;
    var cur = 0;
    var ov = document.createElement("div");
    ov.className = "lb-overlay"; ov.hidden = true;
    ov.innerHTML = '<button class="lb-close" aria-label="close">×</button>' +
      '<button class="lb-nav lb-prev" aria-label="prev">‹</button>' +
      '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>' +
      '<button class="lb-nav lb-next" aria-label="next">›</button>';
    document.body.appendChild(ov);
    var img = ov.querySelector(".lb-img"), cap = ov.querySelector(".lb-cap");
    function show(i) {
      cur = (i + installs.length) % installs.length;
      var c = installs[cur];
      img.src = BASE + c.image;
      img.alt = KO ? c.titleKo : c.titleEn;
      cap.textContent = KO ? c.titleKo : c.titleEn;
    }
    function open(i) { show(i); ov.hidden = false; document.body.style.overflow = "hidden"; }
    function close() { ov.hidden = true; document.body.style.overflow = ""; }
    cards.forEach(function (card) {
      card.addEventListener("click", function () { open(+card.getAttribute("data-lb")); });
    });
    ov.querySelector(".lb-close").addEventListener("click", close);
    ov.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    ov.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) {
      if (ov.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "ArrowRight") show(cur + 1);
    });
  }
})();
