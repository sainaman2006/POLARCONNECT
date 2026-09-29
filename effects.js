/* POLAR CONNECT — ambient graphics: drifting snow and an animated wave divider. */
(function () {
  "use strict";
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waves() {
    var f = document.querySelector(".footer");
    if (!f) return;
    var d = document.createElement("div");
    d.className = "wave-divider"; d.setAttribute("aria-hidden", "true");
    var p = "M0 30c100-30 200 30 300 0s200 30 300 0 200 30 300 0 200 30 300 0V60H0Z";
    d.innerHTML = '<svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="' + p + '"/></svg>';
    f.parentNode.insertBefore(d, f);
  }

  function snow() {
    if (still) return;
    var c = document.createElement("canvas"); c.id = "snow"; c.setAttribute("aria-hidden", "true");
    document.body.appendChild(c);
    var x = c.getContext("2d"), W, H, flakes = [], N = 55, i;
    function size() { W = c.width = innerWidth; H = c.height = innerHeight; }
    size(); addEventListener("resize", size);
    for (i = 0; i < N; i++) flakes.push({ x: Math.random() * 2000, y: Math.random() * 1200, r: 1 + Math.random() * 2.4, v: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28 });
    (function loop(t) {
      x.clearRect(0, 0, W, H);
      x.fillStyle = "rgba(33,150,201,.28)";
      flakes.forEach(function (f) {
        f.y += f.v; f.x += Math.sin(t / 1800 + f.ph) * 0.4;
        if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        if (f.x > W + 5) f.x = -5;
        x.beginPath(); x.arc(f.x % W, f.y, f.r, 0, 6.283); x.fill();
      });
      requestAnimationFrame(loop);
    })(0);
  }

  document.addEventListener("DOMContentLoaded", function () { waves(); snow(); });
})();
