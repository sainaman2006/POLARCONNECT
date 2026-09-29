/* POLAR CONNECT — PolarAI assistant.
   1. If the Node backend is running with ANTHROPIC_API_KEY set, questions go to /api/v1/ai/chat (a real LLM,
      grounded in the parameter knowledge base).
   2. Otherwise (file:// or no key) it answers locally from parameters.js, so it always works. */
(function () {
  "use strict";
  var PARAMS = window.POLAR_PARAMS || {}, DOMAINS = window.POLAR_DOMAINS || {};
  var msgs = document.getElementById("msgs"), input = document.getElementById("q"), btn = document.getElementById("sendBtn"), badge = document.getElementById("aiMode");
  var history = [], busy = false, serverOk = null;

  var ALIASES = {
    ph: ["ph", "acidification", "acidity"], salinity: ["salinity", "salt", "psu"],
    seatemp: ["sea water temp", "seawater temp", "sea temp", "ocean temp", "water temp", "sea surface temp", "sst"],
    "do": ["dissolved oxygen", "oxygen", "deoxygenation"], chla: ["chlorophyll", "chla", "phytoplankton"],
    sealevel: ["sea level", "sea-level"], icethick: ["ice thickness", "thickness"], glaciervel: ["glacier velocity", "glacier speed", "ice flow"],
    surftemp: ["surface temp", "snow temp"], seaiceext: ["sea ice extent", "ice extent"],
    icemelt: ["ice melt", "melt rate", "melting"], iceform: ["ice formation", "ice growth", "freeze", "freezing", "ice deformation", "formation rate"],
    airtemp: ["air temp", "atmospheric temp", "temperature"], uv: ["uv", "ultraviolet", "ozone"],
    pressure: ["pressure", "hpa", "barometer", "atmospheric pressure"], wind: ["wind"],
    bc: ["black carbon", "soot"], sulphate: ["sulphate", "sulfate"], om: ["organic matter", "organic aerosol"],
    cloudcover: ["cloud cover", "oktas"], visibility: ["visibility", "fog"], cloudbase: ["cloud base", "ceiling"], cloudtype: ["cloud type", "stratus", "cirrus"],
    humidity: ["humidity"], species: ["species", "penguin", "krill", "seal"], ecoindex: ["ecosystem index", "marine ecosystem"],
    microbes: ["microbe", "bacteria"], nutrients: ["nutrient", "nitrate", "phosphate", "silicate", "iron"]
  };
  var DOMAIN_WORDS = { ocean: ["ocean", "sea water", "seawater"], ice: ["glacier", "ice"], atmosphere: ["atmosphere", "air", "weather"], clouds: ["cloud", "sky"], bio: ["biodiversity", "bio", "wildlife", "ecosystem", "life"] };
  var STATIONS = {
    maitri: "Maitri is India's Antarctic research station in the Schirmacher Oasis, Dronning Maud Land, used for atmospheric, glaciological, geological and biological studies.",
    bharati: "Bharati is India's Antarctic station on the Larsemann Hills, Prydz Bay, built for year-round work in oceanography, glaciology, meteorology and biology.",
    himadri: "Himadri is India's Arctic research station at Ny-Ålesund, Svalbard, used for studies of glaciers, fjord oceanography, atmosphere and biodiversity."
  };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>"); }
  function add(cls, html) { var d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d; }

  function findParams(q) {
    var found = [], best = {};
    Object.keys(ALIASES).forEach(function (id) {
      ALIASES[id].forEach(function (a) {
        var re = a.length <= 3 ? new RegExp("\\b" + a + "\\b") : new RegExp(a.replace(/[-\s]/g, "[-\\s]?"));
        if (re.test(q) && (!best[id] || a.length > best[id])) best[id] = a.length;
      });
    });
    Object.keys(best).sort(function (x, y) { return best[y] - best[x]; }).forEach(function (id) { if (PARAMS[id]) found.push(id); });
    // "ice melt" should not also trigger the generic "temperature" hit, etc.: keep the most specific matches
    var top = found.length ? best[found[0]] : 0;
    return found.filter(function (id) { return best[id] >= Math.min(top, 5) || found.length === 1; }).slice(0, 2);
  }

  function paramAnswer(id) {
    var p = PARAMS[id], link = "live.html?d=" + (Object.keys(DOMAINS).filter(function (d) { return DOMAINS[d].params.indexOf(id) > -1; })[0] || "ocean") + "&p=" + id;
    return "**" + p.name + "** (" + p.unit + ")\n" + p.what + "\n\n**Why it is measured:** " + p.why + "\n\n**Why it matters for India:** " + p.india + "\n\n**How it is measured:** " + p.how +
      '\n\n<a href="' + link + '">See it on Polar Live →</a>';
  }

  function localAnswer(raw) {
    var q = raw.toLowerCase(), i, ids;
    for (var st in STATIONS) if (q.indexOf(st) > -1) return esc(STATIONS[st]) + '<br><br><a href="explorer.html">Find it on the Explorer →</a> · <a href="research.html">Research repository →</a>';
    ids = findParams(q);
    if (/(list|all|what).*(parameter|measure|indicator)/.test(q) || /parameters/.test(q) && !ids.length) {
      return Object.keys(DOMAINS).map(function (d) { return "<b>" + esc(DOMAINS[d].label) + ":</b> " + DOMAINS[d].params.map(function (p) { return esc(PARAMS[p].name); }).join(", "); }).join("<br>") + '<br><br>Ask about any of them, or open <a href="live.html">Polar Live</a>.';
    }
    if (ids.length) return ids.map(function (id) { return fmt(paramAnswer(id).split("<a ")[0]) + "<a " + paramAnswer(id).split("<a ")[1]; }).join("<hr>");
    for (var d in DOMAIN_WORDS) for (i = 0; i < DOMAIN_WORDS[d].length; i++) if (q.indexOf(DOMAIN_WORDS[d][i]) > -1) {
      return "<b>" + esc(DOMAINS[d].label) + "</b><br>" + esc(DOMAINS[d].intro) + "<br><br>Parameters tracked: " + DOMAINS[d].params.map(function (p) { return '<a href="live.html?d=' + d + "&p=" + p + '">' + esc(PARAMS[p].name) + "</a>"; }).join(", ") + ".";
    }
    if (/hello|hi\b|hey|namaste/.test(q)) return "Hello! Ask me about a polar parameter (for example UV, dissolved oxygen or ice melt rate), an Indian station, or how to use this site.";
    return "I couldn't match that to a topic I know. Try a parameter such as <b>salinity, UV, sea-water temperature, dissolved oxygen, ice melt rate, nutrients or air pressure</b>, a station (<b>Maitri, Bharati, Himadri</b>), or type <b>list parameters</b>.";
  }

  function setMode(m) { if (badge) badge.textContent = m; }

  async function askServer(text) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 30000);
    try {
      var r = await fetch("/api/v1/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ messages: history.slice(-10) }) });
      if (!r.ok) { serverOk = false; return null; }
      var j = await r.json();
      serverOk = true;
      return j.reply || null;
    } catch (e) { serverOk = false; return null; } finally { clearTimeout(t); }
  }

  async function send() {
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true; btn.disabled = true; input.value = "";
    add("user", esc(text));
    history.push({ role: "user", content: text });
    var typing = add("bot", '<div class="typing"><span></span><span></span><span></span></div>');
    var reply = null, html;
    if (serverOk !== false && location.protocol.indexOf("http") === 0) reply = await askServer(text);
    if (reply) { html = fmt(reply) + '<br><span class="small">Source: PolarAI (LLM) grounded in the POLAR CONNECT knowledge base</span>'; setMode("Live AI"); }
    else { reply = localAnswer(text); html = reply + '<br><span class="small">Source: POLAR CONNECT knowledge base</span>'; setMode("Built-in knowledge base"); }
    typing.remove();
    add("bot", html);
    history.push({ role: "assistant", content: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500) });
    busy = false; btn.disabled = false; input.focus();
  }

  btn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ask]"), function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); input.value = b.dataset.ask; send(); });
  });
})();
