/* POLAR CONNECT — Polar Live dashboard.
   Every parameter card is selectable and opens a "why we measure this" explainer (see parameters.js). */
(function () {
  "use strict";

  var DOMAINS = window.POLAR_DOMAINS, PARAMS = window.POLAR_PARAMS;

  // [id, value, unit, delta, meter 0-1]  (sample values until live NPDC/NCPOR feeds are connected)
  var D = {
    ocean: [["ph", "8.12", "unitless", "+0.8%"], ["salinity", "34.6", "PSU", "−0.3%"], ["seatemp", "−1.4", "°C", "+0.2°C"], ["do", "7.9", "mg/L", "−1.2%"], ["chla", "1.82", "mg/m³", "+4.2%"], ["sealevel", "+2.7", "mm", "+0.4%"]],
    ice: [["icethick", "2.14", "m", "−1.9%"], ["glaciervel", "18.4", "m/yr", "+6.7%"], ["surftemp", "−14.2", "°C", "+1.1°C"], ["seaiceext", "—", "km²", "updating"], ["icemelt", "0.8", "cm/day", "+9.3%"], ["iceform", "1.6", "cm/day", "−4.5%"]],
    atmosphere: [["airtemp", "−9.6", "°C", "+0.9°C"], ["uv", "4.2", "index", "+7.7%", 0.38], ["pressure", "981", "hPa", "−0.6%", 0.6], ["wind", "18.4", "km/h", "+3.1%"], ["bc", "—", "µg/m³", "updating"], ["sulphate", "—", "µg/m³", "updating"], ["om", "—", "µg/m³", "updating"]],
    clouds: [["cloudcover", "78", "%", "+5.4%", 0.78], ["visibility", "12.4", "km", "−8.1%", 0.41], ["cloudbase", "640", "m", "−3.2%", 0.32], ["cloudtype", "Stratus", "class", "steady", 0.55], ["humidity", "86", "%", "+1.9%", 0.86], ["pressure", "981", "hPa", "−0.6%", 0.6]],
    bio: [["species", "—", "records", "updating"], ["ecoindex", "—", "index", "updating"], ["chla", "1.82", "mg/m³", "+4.2%"], ["microbes", "—", "records", "updating"], ["nutrients", "24.3", "µmol/L", "−2.1%"]]
  };
  // 7-day sample trend per parameter (chart follows the selected card); domain fallback below
  var SP = {
    ph: [8.05, 8.08, 8.09, 8.12, 8.10, 8.12, 8.14], salinity: [34.9, 34.8, 34.8, 34.7, 34.7, 34.6, 34.6],
    seatemp: [-1.7, -1.6, -1.6, -1.5, -1.5, -1.4, -1.4], "do": [8.2, 8.1, 8.1, 8.0, 8.0, 7.9, 7.9],
    chla: [1.4, 1.5, 1.5, 1.6, 1.7, 1.8, 1.82], sealevel: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7],
    icethick: [2.36, 2.32, 2.28, 2.24, 2.21, 2.17, 2.14], glaciervel: [16.9, 17.2, 17.4, 17.8, 18.0, 18.2, 18.4],
    surftemp: [-16.1, -15.6, -15.2, -14.9, -14.6, -14.4, -14.2], icemelt: [0.5, 0.5, 0.6, 0.6, 0.7, 0.8, 0.8],
    iceform: [2.1, 2.0, 1.9, 1.8, 1.7, 1.7, 1.6],
    airtemp: [-12.1, -11.4, -10.9, -10.4, -10.1, -9.8, -9.6], uv: [3.1, 3.4, 3.6, 3.8, 4.0, 4.1, 4.2],
    pressure: [992, 990, 988, 986, 984, 982, 981], wind: [18, 16, 17, 19, 18, 20, 18.4],
    cloudcover: [55, 62, 70, 64, 81, 74, 78], visibility: [16, 15, 14, 14, 13, 13, 12.4], cloudbase: [780, 760, 730, 700, 680, 660, 640],
    humidity: [78, 80, 82, 83, 84, 85, 86], nutrients: [26.8, 26.3, 25.8, 25.4, 25.0, 24.6, 24.3]
  };
  var S = {
    ocean: [8.05, 8.08, 8.09, 8.12, 8.10, 8.12, 8.14],
    ice: [2.36, 2.32, 2.28, 2.24, 2.21, 2.17, 2.14],
    atmosphere: [18, 16, 17, 19, 18, 20, 18.4],
    clouds: [55, 62, 70, 64, 81, 74, 78],
    bio: [12, 16, 14, 19, 22, 20, 24]
  };

  var metrics = document.getElementById("metrics");
  var explain = document.getElementById("explain");
  var intro = document.getElementById("domainIntro");
  var titleEl = document.getElementById("title");
  var state = { domain: "ocean", param: null };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function spark(id, down) {
    var seed = 0, i, pts = [], y = down ? 5 : 21;
    for (i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 997;
    for (i = 0; i < 8; i++) {
      seed = (seed * 57 + 13) % 997;
      var t = i / 7, base = down ? 5 + t * 14 : 21 - t * 14;
      pts.push((i * 14.2).toFixed(1) + "," + Math.max(3, Math.min(23, base + (seed % 7) - 3)).toFixed(1));
    }
    return '<polyline points="' + pts.join(" ") + '" pathLength="1"/><circle cx="99.4" cy="' + pts[7].split(",")[1] + '" r="2.2"/>';
  }

  function countUp() {
    Array.prototype.forEach.call(metrics.querySelectorAll(".num"), function (el) {
      var txt = el.textContent, n = parseFloat(txt.replace("−", "-"));
      if (isNaN(n) || !/^[+−-]?\d/.test(txt)) return;
      var dec = (txt.split(".")[1] || "").length, plus = txt.charAt(0) === "+", t0 = performance.now();
      (function tick(now) {
        var p = Math.min(1, (now - t0) / 900), v = n * (1 - Math.pow(1 - p, 3));
        el.textContent = (plus && v >= 0 ? "+" : "") + v.toFixed(dec).replace("-", "−");
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  function renderSky() {
    var panel = document.getElementById("skyPanel"), box = document.getElementById("sky");
    if (state.domain !== "clouds") { panel.hidden = true; return; }
    var r = {}; D.clouds.forEach(function (x) { r[x[0]] = x; });
    var cover = parseFloat(r.cloudcover[1]), vis = parseFloat(r.visibility[1]), n = Math.max(1, Math.round(cover / 100 * 7)), i, c = "";
    for (i = 0; i < n; i++) {
      var y = 18 + (i * 29) % 90, sc = (0.7 + (i % 3) * 0.25).toFixed(2), dur = 38 + (i * 9) % 30;
      c += '<g class="cloud-g" style="--y:' + y + 'px;--s:' + sc + ';animation-duration:' + dur + 's;animation-delay:-' + (i * 11) + 's"><ellipse cx="40" cy="30" rx="34" ry="13"/><circle cx="28" cy="22" r="14"/><circle cx="52" cy="19" r="17"/><circle cx="70" cy="27" r="11"/></g>';
    }
    box.innerHTML = '<svg viewBox="0 0 700 230" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sky with ' + Math.round(cover / 12.5) + ' oktas of cloud and ' + vis + ' km visibility">' +
      '<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4e8"/><stop offset="1" stop-color="#e6f5fc"/></linearGradient></defs>' +
      '<rect width="700" height="230" fill="url(#skyG)"/><g class="sun" transform="translate(590 52)"><circle r="20" fill="#fff6d6"/><g class="rays" stroke="#fff6d6" stroke-width="3" stroke-linecap="round"><path d="M0-32v-10M0 32v10M-32 0h-10M32 0h10M23-23l7-7M-23 23l-7 7M23 23l7 7M-23-23l-7-7"/></g></g>' +
      '<g class="clouds" fill="#fff" opacity=".95">' + c + '</g>' +
      '<path d="M0 190c60-26 120-30 190-8s130 6 210-14 190-16 300 14v48H0Z" fill="#f4fbff"/><path d="M0 208c90-18 170-14 260 0s190 12 440-8v30H0Z" fill="#dff1fa"/>' +
      '<rect class="haze" width="700" height="230" fill="#eef7fb" style="opacity:' + (1 - Math.min(vis, 30) / 30) * 0.75 + '"/></svg>' +
      '<div class="sky-cap"><span><b>' + Math.round(cover / 12.5) + '/8</b> oktas</span><span><b>' + cover + '%</b> cloud cover</span><span><b>' + vis + ' km</b> visibility</span><span><b>' + esc(r.cloudtype[1]) + '</b> · base ' + r.cloudbase[1] + ' m</span></div>';
    panel.hidden = false;
  }

  function renderMetrics() {
    metrics.innerHTML = D[state.domain].map(function (row) {
      var p = PARAMS[row[0]], down = row[3].charAt(0) === "−";
      var on = state.param === row[0];
      return '<button type="button" class="metric param" data-p="' + row[0] + '" aria-pressed="' + on + '">' +
        '<div class="small">' + esc(p.name) + '</div>' +
        '<svg class="spark" viewBox="0 0 100 26" preserveAspectRatio="none">' + spark(row[0], down) + '</svg>' + '<div class="value"><b class="num">' + esc(row[1]) + '</b> <span class="small">' + esc(row[2]) + '</span></div>' +
        '<div class="delta' + (down ? " down" : "") + '">' + esc(row[3]) + '</div>' +
        (row[4] != null ? '<div class="meter"><i style="--w:' + Math.round(row[4] * 100) + '%"></i></div>' : "") + '<div class="small">NPDC · NCPOR</div>' +
        '<span class="why-link">Why we measure this <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m0 0-5-5m5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</button>';
    }).join("");
    Array.prototype.forEach.call(metrics.querySelectorAll(".param"), function (b) {
      b.addEventListener("click", function () { selectParam(b.dataset.p, true); });
    });
  }

  function renderExplain() {
    var p = PARAMS[state.param], d = D[state.domain].filter(function (r) { return r[0] === state.param; })[0];
    explain.innerHTML =
      '<div class="explain-head"><div><div class="eyebrow">Why we measure this</div>' +
      '<h3>' + esc(p.name) + ' <span class="unit-chip">' + esc(d ? d[2] : p.unit) + '</span></h3></div></div>' +
      '<p class="explain-what">' + esc(p.what) + '</p>' +
      '<div class="explain-grid">' +
      '<div class="explain-block"><b>Why it is measured</b><p>' + esc(p.why) + '</p></div>' +
      '<div class="explain-block"><b>Why it matters for India</b><p>' + esc(p.india) + '</p></div>' +
      '<div class="explain-block"><b>How it is typically measured</b><p>' + esc(p.how) + '</p></div>' +
      '</div>';
    explain.classList.remove("swap"); void explain.offsetWidth; explain.classList.add("swap");
  }

  function selectParam(id, scroll) {
    state.param = id;
    Array.prototype.forEach.call(metrics.querySelectorAll(".param"), function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.p === id));
    });
    renderExplain();
    renderChart();
    if (scroll && window.matchMedia("(max-width:950px)").matches) {
      explain.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function renderChart() {
    if (!window.Plotly) return; // CDN blocked/offline: the explainers still work
    var sp = SP[state.param], row = D[state.domain].filter(function (r) { return r[0] === state.param; })[0];
    titleEl.textContent = sp ? PARAMS[state.param].name + " · 7-day trend (" + row[2] + ")" : DOMAINS[state.domain].label + " parameter trend";
    Plotly.react("chart", [{
      x: ["D−6", "D−5", "D−4", "D−3", "D−2", "D−1", "Now"], y: SP[state.param] || S[state.domain],
      mode: "lines+markers", fill: "tozeroy", fillcolor: "rgba(33,150,201,.12)", line: { color: "#2196c9", width: 2.5, shape: "spline" }, marker: { color: "#0e6e9e", size: 7 }
    }], {
      margin: { l: 45, r: 15, t: 10, b: 35 }, paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#5f7890" }, xaxis: { gridcolor: "#dcecf4" }, yaxis: { gridcolor: "#dcecf4" }
    }, { displayModeBar: false, responsive: true, transition: { duration: 500 } });
  }

  function render(domain, param) {
    state.domain = domain;
    intro.innerHTML = '<b>Why ' + esc(DOMAINS[domain].label.toLowerCase()) + ' parameters?</b><p>' + esc(DOMAINS[domain].intro) + '</p>';
    state.param = param || D[domain][0][0];
    renderMetrics();
    renderExplain();
    renderChart();
    renderSky();
    countUp();
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.classList.toggle("active", t.dataset.d === domain);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () { render(b.dataset.d); });
  });

  // deep link: live.html?d=ice&p=glaciervel
  var q = new URLSearchParams(location.search), qd = q.get("d"), qp = q.get("p");
  var startDomain = D[qd] ? qd : "ocean";
  var startParam = qp && D[startDomain].some(function (r) { return r[0] === qp; }) ? qp : null;
  render(startDomain, startParam);
})();
