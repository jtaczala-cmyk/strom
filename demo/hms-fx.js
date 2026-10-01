/*! Copyright (c) 2026 Jacek Mariusz Taczała. All rights reserved.
 *  Proprietary and not open source: no copying, modification, distribution or commercial use
 *  without prior written permission. Contact: https://github.com/jtaczala-cmyk/strom/issues. See LICENSE. */
/* STRØM – SPONSORDEMO · HMS layer (2026-10-01)
   1) enemy name plates off; each enemy type is introduced once per round in a small corner chip (1.5 s)
   2) 3–4 short HMS/FSE slogans per round as animated canvas set-pieces, placed in calm moments;
      no new enemy wave starts while a slogan is playing; never blocks input (pointer-events:none)
   3) "I dag lærte du" list on the game-over card
   4) synthesised heartbeat (Web Audio) that follows the number of enemies on screen
   Pure add-on: hooks window.__phaserGame / window.__store, no files, no external assets. */
(function () {
  "use strict";
  var CFG = {"slogans": [{"t": "113 – ambulanse", "k": "amb", "e": "🚑"}, {"t": "Lås og merk", "k": "lock", "e": "🔒"}, {"t": "Mål før du tar", "k": "meter", "e": "🔎"}, {"t": "Verneutstyr på", "k": "helmet", "e": "⛑️"}, {"t": "SJA – risikovurdering", "k": "sja", "e": "📋"}, {"t": "110 brann", "k": "fire", "e": "🚒"}, {"t": "Stopp ved tvil", "k": "stop", "e": "🛑"}, {"t": "Frakoble – sikre – verifisere", "k": "steps", "e": "🔌"}, {"t": "112 politi", "k": "police", "e": "🚓"}, {"t": "Hjertestarter – vit hvor", "k": "aed", "e": "❤️"}, {"t": "RUH – meld fra", "k": "ruh", "e": "📣"}, {"t": "Test testeren før/etter", "k": "test", "e": "✅"}, {"t": "Avstand til spenning", "k": "dist", "e": "⚡"}, {"t": "Strømulykke? Bryt strømmen", "k": "breaker", "e": "🔌"}, {"t": "Jord og kortslutt", "k": "ground", "e": "🔗"}, {"t": "Førstehjelp – øv årlig", "k": "generic", "e": "🩹"}], "ui": {"learned": "I dag lærte du:", "progress": "Du har sett {n} av {t} huskeregler. Spill videre for å se alle.", "done": "Du har sett alle {t} huskereglene. Neste runder repeterer dem.", "note": "Dette erstatter ikke FSE-kurset."}};
  var L = CFG.slogans, U = CFG.ui, KEY = "strom-demo-slogans-v1";
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function store() { return window.__store && window.__store.getState && window.__store.getState(); }
  function muted() { var s = store(); return !!(s && s.muted); }
  function ls() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function lsSave(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eOutBack(x) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function eOut(x) { return 1 - Math.pow(1 - x, 3); }
  function eIn(x) { return x * x * x; }
  function eBounce(x) { var n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; }
  var FONT = "Oswald, 'IBM Plex Sans', system-ui, sans-serif";

  /* ---------------- CSS: corner chip + learned list ---------------- */
  var css = document.createElement("style");
  css.textContent =
    "#hms-chip{position:fixed;left:10px;top:calc(env(safe-area-inset-top,0px) + 92px);z-index:59;max-width:min(62vw,230px);padding:4px 9px 5px;border-radius:8px;" +
    "background:rgba(12,10,9,.78);border-left:3px solid #facc15;color:#e7e5e4;font:400 11px/1.3 'IBM Plex Sans',system-ui,sans-serif;pointer-events:none;" +
    "opacity:0;transform:translateX(-8px);transition:opacity .2s ease,transform .25s ease}" +
    "#hms-chip.on{opacity:1;transform:none}#hms-chip b{font:600 11.5px/1.3 Oswald,'IBM Plex Sans',sans-serif;letter-spacing:.04em;color:#facc15;margin-right:4px}" +
    "#hms-cv{position:fixed;inset:0;width:100%;height:100%;z-index:58;pointer-events:none;display:none}" +
    ".sm-learn{margin:.6rem 0 0;padding:9px 11px;border-radius:12px;border:1px solid rgba(250,204,21,.5);background:rgba(250,204,21,.07);text-align:left}" +
    ".sm-learn h3{margin:0 0 6px;font:600 12px/1.2 Oswald,'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#facc15}" +
    ".sm-learn ul{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px}" +
    ".sm-learn li{margin:0;padding:3px 9px 3px 6px;border-radius:999px;background:rgba(250,204,21,.13);border:1px solid rgba(250,204,21,.35);font:600 13px/1.3 Oswald,'IBM Plex Sans',sans-serif;letter-spacing:.02em;color:#fef3c7;white-space:nowrap}" +
    ".sm-learn li span{margin-right:5px}.sm-learn p{margin:7px 0 0;font:400 11px/1.35 'IBM Plex Sans',system-ui,sans-serif;color:#a8a29e}";
  (document.head || document.documentElement).appendChild(css);

  /* ---------------- 1) enemy introductions (corner chip, once per type per round) ---------------- */
  var DESC = {
    plumber: ["Rørlegger", "rask, går tett på"], clerk: ["Kontor", "kaster tegninger"], bricklayer: ["Murer", "kaster murstein"],
    welder: ["Sveiser", "sveisegnister"], foreman: ["Formannen", "sjokkbølge – hold avstand"], manager: ["Byggelederen", "siste sjef"]
  };
  var chip = null, chipQ = [], chipBusy = false, seenRoles = {};
  function chipEl() {
    if (chip && document.body.contains(chip)) return chip;
    chip = document.createElement("div"); chip.id = "hms-chip"; chip.setAttribute("aria-live", "polite"); document.body.appendChild(chip); return chip;
  }
  function chipNext() {
    if (chipBusy || !chipQ.length) return;
    var r = chipQ.shift(), d = DESC[r] || [r, ""], c = chipEl();
    chipBusy = true;
    c.innerHTML = ""; var b = document.createElement("b"); b.textContent = d[0]; c.appendChild(b); c.appendChild(document.createTextNode(" " + d[1]));
    requestAnimationFrame(function () { c.classList.add("on"); });
    setTimeout(function () { c.classList.remove("on"); setTimeout(function () { chipBusy = false; chipNext(); }, 260); }, 1500);
  }
  function chipClear() { chipQ = []; if (chip) chip.classList.remove("on"); }

  /* ---------------- 2) slogan set-pieces on a canvas overlay ---------------- */
  var cv = null, g = null, W = 0, H = 0, anim = null, raf = 0, lastF = 0;
  function fit() {
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function canvas() {
    if (cv && document.body.contains(cv)) return;
    cv = document.createElement("canvas"); cv.id = "hms-cv"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
    g = cv.getContext("2d"); fit();
  }
  window.addEventListener("resize", function () { if (cv) fit(); });
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function text(s, x, y, px, fill, o) {
    o = o || {}; var size = px; g.font = "600 " + size + "px " + FONT;
    if (o.maxW) { while (g.measureText(s).width > o.maxW && size > 10) { size -= 1; g.font = "600 " + size + "px " + FONT; } }
    g.textAlign = o.align || "center"; g.textBaseline = "middle";
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || size * .45; }
    if (o.stroke !== false) { g.lineJoin = "round"; g.lineWidth = Math.max(3, size * .16); g.strokeStyle = o.stroke || "rgba(12,10,9,.9)"; g.strokeText(s, x, y); }
    g.fillStyle = fill; g.fillText(s, x, y); g.shadowBlur = 0;
  }
  function glowDot(x, y, r, col, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1;
  }
  function check(x, y, s, p, col) { /* animated tick, p 0..1 */
    if (p <= 0) return; g.strokeStyle = col || "#22c55e"; g.lineWidth = s * .22; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath();
    var a = [x - s * .5, y], b = [x - s * .12, y + s * .38], c = [x + s * .55, y - s * .42];
    g.moveTo(a[0], a[1]);
    if (p < .4) { var k = p / .4; g.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k); }
    else { var k2 = (p - .4) / .6; g.lineTo(b[0], b[1]); g.lineTo(b[0] + (c[0] - b[0]) * k2, b[1] + (c[1] - b[1]) * k2); }
    g.stroke();
  }
  function okBadge(x, y, r, p) { if (p <= 0) return; var s = eOutBack(clamp(p * 1.6, 0, 1)); g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = "#16a34a"; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill(); g.lineWidth = r * .14; g.strokeStyle = "#fff"; g.stroke(); check(0, 0, r * 1.05, clamp(p * 1.4 - .2, 0, 1), "#fff"); g.restore(); }

  /* --- art pieces (local coords, u = unit) --- */
  function padlock(x, y, u, close, col) { /* close 0 = open, 1 = shut */
    var lift = (1 - close) * 6 * u;
    g.lineWidth = 3.4 * u; g.strokeStyle = "#d4d4d8"; g.lineCap = "butt";
    g.beginPath(); g.moveTo(x - 7 * u, y - 4 * u - lift * .3); g.lineTo(x - 7 * u, y - 9 * u - lift); g.arc(x, y - 9 * u - lift, 7 * u, Math.PI, 0); g.lineTo(x + 7 * u, y - 9 * u - lift + (1 - close) * 2 * u); g.lineTo(x + 7 * u, y - 4 * u - lift * (1 - close)); g.stroke();
    rr(x - 12 * u, y - 6 * u, 24 * u, 20 * u, 3.5 * u); g.fillStyle = col || "#dc2626"; g.fill(); g.lineWidth = 1.2 * u; g.strokeStyle = "rgba(0,0,0,.45)"; g.stroke();
    g.fillStyle = "rgba(255,255,255,.22)"; rr(x - 10 * u, y - 4.5 * u, 20 * u, 3 * u, 1.5 * u); g.fill();
    g.fillStyle = "#1c1917"; g.beginPath(); g.arc(x, y + 3 * u, 2.4 * u, 0, 6.283); g.fill(); g.fillRect(x - 1 * u, y + 3 * u, 2 * u, 5 * u);
  }
  function meter(x, y, u, disp, dispCol) {
    rr(x - 14 * u, y - 20 * u, 28 * u, 38 * u, 4.5 * u); g.fillStyle = "#facc15"; g.fill(); g.lineWidth = 1.2 * u; g.strokeStyle = "rgba(0,0,0,.5)"; g.stroke();
    rr(x - 11 * u, y - 17 * u, 22 * u, 32 * u, 2.5 * u); g.fillStyle = "#1f2937"; g.fill();
    rr(x - 9 * u, y - 15 * u, 18 * u, 10 * u, 1.5 * u); g.fillStyle = "#bbf7d0"; g.fill();
    var fs = 6.2 * u; g.font = "600 " + fs + "px " + FONT; while (g.measureText(disp).width > 16 * u && fs > 4) { fs -= .5; g.font = "600 " + fs + "px " + FONT; } g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = dispCol || "#052e16"; g.fillText(disp, x, y - 10 * u);
    g.fillStyle = "#4b5563"; g.beginPath(); g.arc(x, y + 4 * u, 6 * u, 0, 6.283); g.fill(); g.strokeStyle = "#e5e7eb"; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(x, y + 4 * u); g.lineTo(x + 4 * u, y + .5 * u); g.stroke();
    g.fillStyle = "#dc2626"; g.beginPath(); g.arc(x - 5 * u, y + 13 * u, 1.6 * u, 0, 6.283); g.fill(); g.fillStyle = "#111"; g.beginPath(); g.arc(x + 5 * u, y + 13 * u, 1.6 * u, 0, 6.283); g.fill();
  }
  function breaker(x, y, u, on, sc) {
    sc = sc || 1; u *= sc;
    rr(x - 9 * u, y - 14 * u, 18 * u, 28 * u, 2.5 * u); g.fillStyle = "#e5e7eb"; g.fill(); g.lineWidth = 1 * u; g.strokeStyle = "rgba(0,0,0,.45)"; g.stroke();
    rr(x - 4.5 * u, y - 9 * u, 9 * u, 18 * u, 2 * u); g.fillStyle = "#374151"; g.fill();
    var ly = y + (on ? -1 : 1) * 4.5 * u; rr(x - 4 * u, ly - 4 * u, 8 * u, 8 * u, 1.5 * u); g.fillStyle = on ? "#16a34a" : "#dc2626"; g.fill();
    g.font = "600 " + (4 * u) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#111";
    g.fillText("I", x, y - 11.5 * u); g.fillText("O", x, y + 11.6 * u);
  }
  function helmet(x, y, u) {
    g.fillStyle = "#facc15"; g.beginPath(); g.ellipse(x, y, 16 * u, 14 * u, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#eab308"; rr(x - 2.2 * u, y - 14 * u, 4.4 * u, 14 * u, 2 * u); g.fill();
    rr(x - 21 * u, y - 1.5 * u, 42 * u, 4.5 * u, 2.2 * u); g.fillStyle = "#facc15"; g.fill(); g.lineWidth = 1 * u; g.strokeStyle = "rgba(0,0,0,.4)"; g.stroke();
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(x - 7 * u, y - 8 * u, 4 * u, 2.2 * u, -.6, 0, 6.283); g.fill();
  }
  function glove(x, y, u, flip) {
    g.save(); g.translate(x, y); g.scale(flip ? -1 : 1, 1); g.fillStyle = "#f97316"; g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = .8 * u;
    for (var i = 0; i < 4; i++) { rr(-5.4 * u + i * 2.8 * u, -11 * u + Math.abs(i - 1.5) * 1.2 * u, 2.6 * u, 8 * u, 1.3 * u); g.fill(); g.stroke(); }
    rr(-5.6 * u, -5 * u, 11.2 * u, 10 * u, 2.5 * u); g.fill(); g.stroke();
    g.save(); g.translate(5 * u, -1 * u); g.rotate(-.7); rr(-1.4 * u, -5 * u, 2.8 * u, 6.5 * u, 1.4 * u); g.fill(); g.stroke(); g.restore();
    g.fillStyle = "#1c1917"; rr(-6 * u, 4 * u, 12 * u, 4 * u, 1 * u); g.fill(); g.restore();
  }
  function octagon(x, y, r, fill) { g.beginPath(); for (var i = 0; i < 8; i++) { var a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = fill; g.fill(); }
  function triangle(x, y, r, fill, stroke, lw) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * .95, y + r * .65); g.lineTo(x - r * .95, y + r * .65); g.closePath(); g.lineJoin = "round"; g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
  function bolt(x, y, s, fill) { g.beginPath(); g.moveTo(x + 2 * s, y - 8 * s); g.lineTo(x - 4 * s, y + 1 * s); g.lineTo(x - .3 * s, y + 1 * s); g.lineTo(x - 2 * s, y + 8 * s); g.lineTo(x + 4 * s, y - 1 * s); g.lineTo(x + .3 * s, y - 1 * s); g.closePath(); g.fillStyle = fill; g.fill(); }
  function heart(x, y, s, fill) { g.beginPath(); g.moveTo(x, y + 6 * s); g.bezierCurveTo(x - 9 * s, y, x - 8 * s, y - 8 * s, x - 3.6 * s, y - 7.6 * s); g.bezierCurveTo(x - 1.6 * s, y - 7.5 * s, x, y - 6 * s, x, y - 4.4 * s); g.bezierCurveTo(x, y - 6 * s, x + 1.6 * s, y - 7.5 * s, x + 3.6 * s, y - 7.6 * s); g.bezierCurveTo(x + 8 * s, y - 8 * s, x + 9 * s, y, x, y + 6 * s); g.closePath(); g.fillStyle = fill; g.fill(); }
  function vehicle(kind, x, y, s, dir, flash, roll) {
    g.save(); g.translate(x, y); g.scale(dir * s, s);
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(0, 9, 30, 3, 0, 0, 6.283); g.fill();
    var body = kind === "fire" ? "#dc2626" : "#f8fafc";
    if (kind === "police") {
      rr(-28, -8, 56, 14, 4); g.fillStyle = body; g.fill(); rr(-14, -18, 27, 11, 5); g.fill();
      g.fillStyle = "#7dd3fc"; rr(-12, -16, 11, 8, 2); g.fill(); rr(1, -16, 10, 8, 2); g.fill();
      for (var i = 0; i < 14; i++) { g.fillStyle = i % 2 ? "#facc15" : "#1d4ed8"; g.fillRect(-28 + i * 4, -3, 4, 3.4); g.fillStyle = i % 2 ? "#1d4ed8" : "#facc15"; g.fillRect(-28 + i * 4, .4, 4, 3.4); }
      rr(-6, -21.5, 12, 3.6, 1.5); g.fillStyle = flash ? "#3b82f6" : "#1e3a8a"; g.fill();
    } else {
      rr(-30, -19, 45, 24, 2.5); g.fillStyle = body; g.fill(); rr(14, -13, 16, 18, 3.5); g.fill();
      g.fillStyle = "#7dd3fc"; rr(18, -11, 9, 7, 2); g.fill();
      g.fillStyle = kind === "fire" ? "#f8fafc" : "#dc2626"; g.fillRect(-30, -5, 60, 3.4);
      if (kind === "amb") { g.fillStyle = "#facc15"; g.fillRect(-30, -1.6, 60, 2.2); }
      if (kind === "fire") { g.fillStyle = "#d4d4d8"; g.fillRect(-28, -24, 40, 2); g.fillRect(-28, -21.5, 40, 1.5); for (var j = 0; j < 9; j++) g.fillRect(-27 + j * 4.6, -24, 1.2, 4); }
      rr(-22, -23.5, 12, 4, 1.5); g.fillStyle = flash ? "#3b82f6" : "#1e3a8a"; g.fill();
      if (kind === "amb") { rr(4, -23, 8, 3.5, 1.5); g.fillStyle = !flash ? "#3b82f6" : "#1e3a8a"; g.fill(); }
    }
    [[-17, 5], [18, 5]].forEach(function (w) {
      g.fillStyle = "#111827"; g.beginPath(); g.arc(w[0], w[1], 5.2, 0, 6.283); g.fill(); g.fillStyle = "#9ca3af"; g.beginPath(); g.arc(w[0], w[1], 2.2, 0, 6.283); g.fill();
      g.strokeStyle = "#111827"; g.lineWidth = .9; for (var k = 0; k < 3; k++) { var a = roll + k * 2.094; g.beginPath(); g.moveTo(w[0], w[1]); g.lineTo(w[0] + Math.cos(a) * 2.2, w[1] + Math.sin(a) * 2.2); g.stroke(); }
    });
    var lbl = kind === "amb" ? "113" : kind === "fire" ? "110" : "POLITI", lx = kind === "police" ? 0 : -8, ly = kind === "police" ? -11.5 : -12;
    g.save(); g.translate(lx, ly); g.scale(dir, 1); g.font = "600 " + (kind === "police" ? 4.6 : 8.5) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = kind === "fire" ? "#fff" : kind === "police" ? "#1e3a8a" : "#dc2626"; if (kind !== "police") g.fillText(lbl, 0, 0); else g.fillText(lbl, 0, -5.5);
    g.restore();
    if (flash) { var lxp = kind === "police" ? 0 : -16, lyp = kind === "police" ? -20 : -22; g.restore(); var gx = x + dir * lxp * s, gy = y + lyp * s; glowDot(gx, gy, 18 * s, "rgba(59,130,246,.95)", .9); return; }
    g.restore();
  }

  /* --- emergency number set-piece (113 / 110 / 112) --- */
  function emergency(kind, num, word, c1, c2, dir) {
    return { dur: 3.1, own: true, draw: function (t, Lo, dt) {
      var u = Lo.u, cx = Lo.cx, ay = Lo.ay, flash = Math.floor(t * 9) % 2 === 0;
      var inS = eOutBack(seg(t, 0, .35)), shrink = seg(t, 1.55, 2.0), drive = seg(t, 2.0, 3.1);
      // light-bar halos / flames / beam behind the number
      if (t < 2.05) {
        var a = (1 - shrink) * Math.min(1, t * 4);
        if (kind === "fire") {
          var P = this.parts || (this.parts = []);
          if (t < 1.6 && !reduced) for (var i = 0; i < 3; i++) P.push({ x: cx + (Math.random() * 2 - 1) * 24 * u, y: ay + 12 * u, vy: -(30 + Math.random() * 50) * u, l: .7 + Math.random() * .4, r: (3 + Math.random() * 4) * u });
          g.globalCompositeOperation = "lighter";
          for (var j = P.length - 1; j >= 0; j--) { var p = P[j]; p.l -= dt; if (p.l <= 0) { P.splice(j, 1); continue; } p.y += p.vy * dt; p.x += Math.sin(t * 9 + j) * 6 * u * dt;
            glowDot(p.x, p.y, p.r * 2.2, p.l > .5 ? "rgba(251,191,36,.9)" : "rgba(239,68,68,.8)", Math.min(1, p.l * 1.6) * a); }
          g.globalCompositeOperation = "source-over";
        } else if (kind === "police") {
          g.save(); g.translate(cx, ay - 20 * u); g.rotate(t * 7); g.globalAlpha = .35 * a;
          var gr = g.createLinearGradient(0, 0, 60 * u, 0); gr.addColorStop(0, "rgba(96,165,250,.95)"); gr.addColorStop(1, "rgba(96,165,250,0)");
          g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 60 * u, -.28, .28); g.closePath(); g.fill(); g.rotate(Math.PI); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 60 * u, -.28, .28); g.closePath(); g.fill();
          g.restore(); g.globalAlpha = 1; glowDot(cx, ay - 20 * u, 7 * u, "rgba(191,219,254,1)", a);
        } else {
          glowDot(cx - 26 * u, ay, 34 * u, flash ? c1 : "rgba(0,0,0,0)", .8 * a); glowDot(cx + 26 * u, ay, 34 * u, !flash ? c2 : "rgba(0,0,0,0)", .8 * a);
        }
        var s = inS * (1 - shrink * .85), x = cx + dir * shrink * 2 * u, y = ay + shrink * 8 * u;
        g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = 1 - shrink;
        text(num, 0, 0, 30 * u, "#fff", { glow: flash ? c1 : c2, blur: 9 * u, stroke: "rgba(12,10,9,.85)" });
        g.restore(); g.globalAlpha = 1;
      }
      // word under the number
      var wa = seg(t, .25, .5) * (1 - seg(t, 2.4, 2.8));
      if (wa > 0) { g.globalAlpha = wa; text(word, cx, Lo.ty, 9.5 * u, "#fef3c7", { glow: c1, blur: 4 * u, maxW: W * .9 }); g.globalAlpha = 1; }
      // vehicle pops out of the shrinking number and drives off
      if (t > 1.6) {
        var vs = eOutBack(seg(t, 1.6, 2.0)) * .62 * u, vx = cx + dir * eIn(drive) * (W / 2 + 50 * u), vy = ay + 6 * u + Math.sin(t * 30) * .3 * u;
        if (drive > 0) { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2 * u; for (var q = 0; q < 3; q++) { var ln = (8 + q * 5) * u * (.5 + drive); g.beginPath(); g.moveTo(vx - dir * (21 * u), vy - (8 - q * 5) * u); g.lineTo(vx - dir * (21 * u + ln), vy - (8 - q * 5) * u); g.stroke(); } }
        vehicle(kind, vx, vy, vs, dir, flash, (vx - cx) / (5 * u));
      }
    } };
  }
  /* --- generic shell: art (pop-in) + slogan text (glow) + slide out --- */
  function piece(dur, art, opts) {
    opts = opts || {};
    return { dur: dur, draw: function (t, Lo, dt, item) {
      var u = Lo.u, inS = eOutBack(seg(t, 0, .38)), out = seg(t, dur - .45, dur), ox = -eIn(out) * (W * .6), al = 1 - out;
      g.save(); g.translate(ox, 0); g.globalAlpha = al;
      if (art) { g.save(); g.translate(Lo.cx, Lo.ay); if (!opts.noScale) g.scale(inS, inS); g.translate(-Lo.cx, -Lo.ay); art.call(this, t, Lo, dt); g.restore(); }
      if (!opts.noText) {
        var ta = seg(t, opts.textAt || .3, (opts.textAt || .3) + .3), ts = .85 + .15 * eOutBack(ta), pulse = 1 + Math.sin(t * 6) * .03 * ta;
        g.globalAlpha = al * ta; g.save(); g.translate(Lo.cx, Lo.ty); g.scale(ts * pulse, ts * pulse);
        text(item.t, 0, 0, 9.5 * u, "#fff", { glow: opts.glow || "#facc15", blur: 5 * u, maxW: W * .88 });
        g.restore();
      }
      g.restore(); g.globalAlpha = 1;
    } };
  }
  var THEMES = {
    amb: function () { return emergency("amb", "113", "AMBULANSE", "rgba(59,130,246,.95)", "rgba(239,68,68,.95)", 1); },
    fire: function () { return emergency("fire", "110", "BRANN", "rgba(239,68,68,.95)", "rgba(251,146,60,.95)", -1); },
    police: function () { return emergency("police", "112", "POLITI", "rgba(59,130,246,.95)", "rgba(147,197,253,.95)", 1); },
    lock: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, cl = eIn(seg(t, .5, .72)), x = Lo.cx - 4 * u, y = Lo.ay + 2 * u;
      if (t > .72) { var rp = seg(t, .72, 1.2); g.strokeStyle = "rgba(250,204,21," + (1 - rp) + ")"; g.lineWidth = 2 * u * (1 - rp) + .5; g.beginPath(); g.arc(x, y, (12 + rp * 22) * u, 0, 6.283); g.stroke(); }
      var bump = t > .72 ? 1 + Math.sin(seg(t, .72, .95) * Math.PI) * .08 : 1;
      g.save(); g.translate(x, y); g.scale(bump, bump); g.translate(-x, -y); padlock(x, y, u, cl); g.restore();
      var ang = t < .72 ? Math.sin(t * 5) * .25 : .5 * Math.exp(-2.6 * (t - .72)) * Math.cos(9 * (t - .72));
      g.save(); g.translate(x + 9 * u, y + 6 * u); g.rotate(-.25 + ang); g.strokeStyle = "#e5e7eb"; g.lineWidth = .9 * u; g.beginPath(); g.moveTo(0, 0); g.lineTo(5 * u, 5 * u); g.stroke();
      g.translate(5 * u, 5 * u); g.rotate(-.35); rr(-1 * u, 0, 17 * u, 11 * u, 1.5 * u); g.fillStyle = "#facc15"; g.fill(); g.strokeStyle = "#111"; g.lineWidth = .8 * u; g.stroke();
      g.fillStyle = "#dc2626"; g.fillRect(-1 * u, 0, 17 * u, 3 * u); g.font = "600 " + (5.4 * u) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#111"; g.fillText("FARE", 7.5 * u, 7 * u);
      g.restore();
    }); },
    meter: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, v = Math.round(230 * (1 - eOut(seg(t, .4, 1.25)))), done = t > 1.3;
      if (done) glowDot(Lo.cx, Lo.ay, 32 * u, "rgba(34,197,94,.75)", .7 * seg(t, 1.3, 1.6));
      meter(Lo.cx, Lo.ay, u, t < .4 ? "– – –" : v + " V", v > 50 ? "#7f1d1d" : "#052e16");
      // probes touching the terminals
      g.strokeStyle = "#dc2626"; g.lineWidth = 1.4 * u; g.beginPath(); g.moveTo(Lo.cx - 5 * u, Lo.ay + 18 * u); g.quadraticCurveTo(Lo.cx - 18 * u, Lo.ay + 20 * u, Lo.cx - 22 * u, Lo.ay + 8 * u); g.stroke();
      g.strokeStyle = "#111"; g.beginPath(); g.moveTo(Lo.cx + 5 * u, Lo.ay + 18 * u); g.quadraticCurveTo(Lo.cx + 18 * u, Lo.ay + 20 * u, Lo.cx + 22 * u, Lo.ay + 8 * u); g.stroke();
      g.fillStyle = "#e5e7eb"; g.fillRect(Lo.cx - 23 * u, Lo.ay - 1 * u, 2 * u, 9 * u); g.fillRect(Lo.cx + 21 * u, Lo.ay - 1 * u, 2 * u, 9 * u);
      okBadge(Lo.cx + 15 * u, Lo.ay - 18 * u, 6 * u, seg(t, 1.3, 1.8));
    }); },
    test: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, ph = t < .9 ? 0 : t < 1.6 ? 1 : 2, blink = Math.floor(t * 6) % 2 === 0;
      var disp = t < .35 ? "– – –" : t < .9 ? (blink ? "TEST" : "") : t < 1.6 ? "FØR ✓" : "ETTER ✓";
      if (ph) glowDot(Lo.cx, Lo.ay, 30 * u, "rgba(34,197,94,.7)", .6);
      meter(Lo.cx, Lo.ay, u, disp, "#052e16");
      okBadge(Lo.cx - 18 * u, Lo.ay - 14 * u, 5 * u, seg(t, .95, 1.4)); okBadge(Lo.cx + 18 * u, Lo.ay - 14 * u, 5 * u, seg(t, 1.65, 2.1));
    }); },
    helmet: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, d = seg(t, 0, .65), y = Lo.ay - 4 * u - (1 - eBounce(d)) * 40 * u;
      helmet(Lo.cx, y, u);
      var gi = eOutBack(seg(t, .55, .95)); if (gi > 0) { glove(Lo.cx - 32 * u + (1 - gi) * -30 * u, Lo.ay + 6 * u, u * .95, false); glove(Lo.cx + 32 * u + (1 - gi) * 30 * u, Lo.ay + 6 * u, u * .95, true); }
      if (t > .9) for (var i = 0; i < 4; i++) { var a = i * 1.57 + .6, sp = seg(t, .9 + i * .1, 1.5 + i * .1), r = 22 * u + sp * 10 * u, sx = Lo.cx + Math.cos(a) * r, sy = Lo.ay - 4 * u + Math.sin(a) * r * .7, ss = Math.sin(sp * Math.PI) * 3 * u;
        if (ss > 0) { g.fillStyle = "#fef08a"; g.beginPath(); g.moveTo(sx, sy - ss); g.lineTo(sx + ss * .3, sy - ss * .3); g.lineTo(sx + ss, sy); g.lineTo(sx + ss * .3, sy + ss * .3); g.lineTo(sx, sy + ss); g.lineTo(sx - ss * .3, sy + ss * .3); g.lineTo(sx - ss, sy); g.lineTo(sx - ss * .3, sy - ss * .3); g.fill(); } }
    }); },
    stop: function () { return piece(2.7, function (t, Lo) {
      var u = Lo.u, sl = seg(t, 0, .28), s = 2.4 - 1.4 * eIn(sl), sh = t > .28 ? Math.sin(t * 70) * 2.2 * u * Math.exp(-7 * (t - .28)) : 0;
      if (t > .28) { var rp = seg(t, .28, .8); g.strokeStyle = "rgba(255,255,255," + (.6 * (1 - rp)) + ")"; g.lineWidth = 1.5 * u; g.beginPath(); g.ellipse(Lo.cx, Lo.ay + 19 * u, (16 + rp * 26) * u, (3 + rp * 4) * u, 0, 0, 6.283); g.stroke(); }
      g.save(); g.translate(Lo.cx + sh, Lo.ay); g.scale(s, s); g.globalAlpha *= Math.min(1, sl * 2.5);
      octagon(0, 0, 18 * u, "#fff"); octagon(0, 0, 16.3 * u, "#dc2626"); text("STOPP", 0, .5 * u, 8.2 * u, "#fff", { stroke: false });
      g.restore();
      if (t > .7) { var hp = eOutBack(seg(t, .7, 1.05)); g.save(); g.translate(Lo.cx + 23 * u, Lo.ay + 10 * u); g.scale(hp, hp); g.font = (12 * u) + "px system-ui,'Apple Color Emoji','Segoe UI Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("\u270B", 0, 0); g.restore(); }
    }, { noScale: true }); },
    sja: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, x = Lo.cx, y = Lo.ay;
      rr(x - 15 * u, y - 20 * u, 30 * u, 40 * u, 3 * u); g.fillStyle = "#a16207"; g.fill();
      rr(x - 12.5 * u, y - 16.5 * u, 25 * u, 34 * u, 1.5 * u); g.fillStyle = "#fafaf9"; g.fill();
      rr(x - 6 * u, y - 22 * u, 12 * u, 5.5 * u, 1.5 * u); g.fillStyle = "#9ca3af"; g.fill();
      g.font = "600 " + (5.5 * u) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#1c1917"; g.fillText("SJA", x, y - 11 * u);
      for (var i = 0; i < 3; i++) { var ry = y - 3 * u + i * 7.5 * u; g.strokeStyle = "#57534e"; g.lineWidth = .8 * u; g.strokeRect(x - 10 * u, ry - 2.2 * u, 4.4 * u, 4.4 * u);
        g.fillStyle = "#d6d3d1"; g.fillRect(x - 3.5 * u, ry - 1 * u, 12 * u - i * 2 * u, 2 * u); check(x - 7.8 * u, ry - .4 * u, 5 * u, seg(t, .45 + i * .3, .7 + i * .3), "#16a34a"); }
      if (t > 1.4) { var p = seg(t, 1.4, 1.9); g.save(); g.translate(x + 13 * u, y + 15 * u); g.rotate(-.6 + Math.sin(t * 14) * .08 * (1 - p)); g.fillStyle = "#facc15"; g.fillRect(-1.3 * u, -11 * u, 2.6 * u, 10 * u); g.fillStyle = "#1c1917"; g.beginPath(); g.moveTo(-1.3 * u, -1 * u); g.lineTo(1.3 * u, -1 * u); g.lineTo(0, 2 * u); g.fill(); g.restore(); }
    }); },
    steps: function () { return piece(3.0, function (t, Lo) {
      var u = Lo.u, sp = Math.min(27 * u, W * .3), xs = [Lo.cx - sp, Lo.cx, Lo.cx + sp], W3 = ["FRAKOBLE", "SIKRE", "VERIFISERE"];
      for (var i = 0; i < 3; i++) {
        var a0 = .1 + i * .5, p = eOutBack(seg(t, a0, a0 + .35)); if (p <= 0) continue;
        g.save(); g.translate(xs[i], Lo.ay); g.scale(p, p);
        g.fillStyle = "#facc15"; g.beginPath(); g.arc(-9 * u, -15 * u, 3.2 * u, 0, 6.283); g.fill(); text(String(i + 1), -9 * u, -14.8 * u, 4.2 * u, "#1c1917", { stroke: false });
        if (i === 0) breaker(0, 0, u, t < a0 + .45, .62);
        if (i === 1) padlock(0, 2 * u, u * .62, eIn(seg(t, a0 + .25, a0 + .45)));
        if (i === 2) { meter(0, 0, u * .5, t < a0 + .45 ? "230" : "0 V", "#052e16"); okBadge(7 * u, -9 * u, 3.4 * u, seg(t, a0 + .45, a0 + .8)); }
        g.restore();
        if (i < 2 && t > a0 + .3) { var ap = seg(t, a0 + .3, a0 + .5); g.strokeStyle = "rgba(250,204,21," + ap + ")"; g.lineWidth = 1.2 * u; g.beginPath(); var mx = (xs[i] + xs[i + 1]) / 2; g.moveTo(mx - 3 * u, Lo.ay - 2 * u); g.lineTo(mx + 1 * u, Lo.ay); g.lineTo(mx - 3 * u, Lo.ay + 2 * u); g.stroke(); }
        var wa = seg(t, a0 + .15, a0 + .4); g.globalAlpha *= 1; g.save(); g.globalAlpha = g.globalAlpha * wa; text(W3[i], xs[i], Lo.ty, 6.4 * u, "#fff", { glow: "#facc15", blur: 3 * u, maxW: sp * .98 }); g.restore();
      }
    }, { noText: true, noScale: true }); },
    aed: function () { return piece(2.9, function (t, Lo) {
      var u = Lo.u, x = Lo.cx, y = Lo.ay, bt = (t * 1.4) % 1, beat = Math.exp(-14 * bt) + .6 * Math.exp(-14 * Math.max(0, bt - .22)) * (bt > .22 ? 1 : 0);
      // ECG trace across the sign
      var p = seg(t, .1, 1.9), x0 = x - 42 * u, x1 = x + 42 * u, hx = x0 + (x1 - x0) * p;
      g.strokeStyle = "#4ade80"; g.lineWidth = 1.3 * u; g.shadowColor = "#22c55e"; g.shadowBlur = 4 * u; g.beginPath();
      for (var X = x0; X <= hx; X += u) { var k = ((X - x0) / (18 * u)) % 1, Y = y + 22 * u; if (k > .35 && k < .42) Y -= (k - .35) * 120 * u; else if (k >= .42 && k < .5) Y -= (.5 - k) * 105 * u - 2 * u; else if (k >= .5 && k < .56) Y += (.56 - k) * 40 * u; if (X === x0) g.moveTo(X, Y); else g.lineTo(X, Y); }
      g.stroke(); g.shadowBlur = 0; if (p < 1) glowDot(hx, y + 22 * u, 4 * u, "rgba(187,247,208,1)", 1);
      rr(x - 17 * u, y - 17 * u, 34 * u, 32 * u, 6 * u); g.fillStyle = "#16a34a"; g.fill(); g.lineWidth = 1.2 * u; g.strokeStyle = "#fff"; g.stroke();
      var hs = 1.65 * u * (1 + beat * .14); heart(x, y, hs, "#fff"); bolt(x, y - 1 * hs, .62 * hs, "#16a34a");
      g.fillStyle = "#fff"; g.fillRect(x + 9 * u, y - 14 * u, 2 * u, 6 * u); g.fillRect(x + 7 * u, y - 12 * u, 6 * u, 2 * u);
    }, { glow: "#22c55e" }); },
    ruh: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, wob = Math.sin(t * 12) * .08 * Math.exp(-3 * t);
      g.save(); g.translate(Lo.cx - 6 * u, Lo.ay); g.rotate(wob); triangle(0, 0, 19 * u, "#facc15", "#1c1917", 2.2 * u); text("!", 0, 3 * u, 17 * u, "#1c1917", { stroke: false }); g.restore();
      for (var i = 0; i < 3; i++) { var p = ((t * 1.3) + i / 3) % 1; if (t < .4) break; g.strokeStyle = "rgba(250,204,21," + (1 - p) + ")"; g.lineWidth = 1.4 * u; g.beginPath(); g.arc(Lo.cx + 10 * u, Lo.ay, (8 + p * 18) * u, -.7, .7); g.stroke(); }
    }); },
    dist: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, r = (16 + eOut(seg(t, .3, 1.1)) * 16) * u;
      g.setLineDash([3 * u, 3 * u]); g.lineDashOffset = -t * 20 * u; g.strokeStyle = "rgba(248,113,113,.9)"; g.lineWidth = 1.4 * u; g.beginPath(); g.arc(Lo.cx, Lo.ay, r, 0, 6.283); g.stroke(); g.setLineDash([]);
      glowDot(Lo.cx, Lo.ay, r, "rgba(239,68,68,.35)", .7);
      triangle(Lo.cx, Lo.ay + 1 * u, 13 * u, "#facc15", "#1c1917", 1.8 * u); bolt(Lo.cx, Lo.ay + 2.5 * u, .85 * u, "#1c1917");
      if (Math.floor(t * 10) % 3 === 0 && !reduced) { g.strokeStyle = "rgba(147,197,253,.9)"; g.lineWidth = 1 * u; g.beginPath(); var a = Math.random() * 6.283; g.moveTo(Lo.cx + Math.cos(a) * 12 * u, Lo.ay + Math.sin(a) * 12 * u); g.lineTo(Lo.cx + Math.cos(a + .2) * (r - 3 * u), Lo.ay + Math.sin(a + .2) * (r - 3 * u)); g.stroke(); }
      var ap = seg(t, 1.1, 1.4); if (ap > 0) { g.globalAlpha *= ap; g.strokeStyle = "#fff"; g.lineWidth = 1.2 * u; [-1, 1].forEach(function (s) { var ex = Lo.cx + s * (r + 7 * u); g.beginPath(); g.moveTo(Lo.cx + s * (r - 1 * u), Lo.ay); g.lineTo(ex, Lo.ay); g.moveTo(ex - s * 2 * u, Lo.ay - 2 * u); g.lineTo(ex, Lo.ay); g.lineTo(ex - s * 2 * u, Lo.ay + 2 * u); g.stroke(); }); }
    }); },
    breaker: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, on = t < .7;
      if (on && !reduced) for (var i = 0; i < 2; i++) { var a = Math.random() * 6.283; g.strokeStyle = "rgba(125,211,252,.9)"; g.lineWidth = .9 * u; g.beginPath(); g.moveTo(Lo.cx, Lo.ay); g.lineTo(Lo.cx + Math.cos(a) * 20 * u, Lo.ay + Math.sin(a) * 20 * u); g.stroke(); }
      if (!on) glowDot(Lo.cx, Lo.ay, 26 * u, "rgba(34,197,94,.6)", .6 * seg(t, .7, 1));
      breaker(Lo.cx, Lo.ay, u, on, 1.05);
      if (t > .55 && t < .9) { var hp = seg(t, .55, .7); g.font = (11 * u) + "px system-ui,'Apple Color Emoji','Segoe UI Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("\uD83D\uDC46", Lo.cx + 9 * u, Lo.ay - 10 * u + hp * 9 * u); }
      okBadge(Lo.cx + 15 * u, Lo.ay - 14 * u, 5 * u, seg(t, .85, 1.3));
    }); },
    ground: function () { return piece(2.8, function (t, Lo) {
      var u = Lo.u, x = Lo.cx, y0 = Lo.ay - 20 * u, p = seg(t, .1, .7), y1 = y0 + 22 * u * p;
      for (var yy = y0; yy < y1; yy += 3 * u) { g.fillStyle = Math.round((yy - y0) / (3 * u)) % 2 ? "#facc15" : "#16a34a"; g.fillRect(x - 1.6 * u, yy, 3.2 * u, Math.min(3 * u, y1 - yy)); }
      for (var i = 0; i < 3; i++) { var bp = eOutBack(seg(t, .7 + i * .15, .95 + i * .15)); if (bp <= 0) continue; var hw = (12 - i * 4) * u * bp; g.fillStyle = "#e5e7eb"; g.fillRect(x - hw, y0 + 23 * u + i * 4.2 * u, hw * 2, 2.2 * u); }
      if (t > 1.2) { var gp = seg(t, 1.2, 1.6); glowDot(x, y0 + 28 * u, 22 * u, "rgba(250,204,21,.5)", .7 * gp * (1 - seg(t, 1.8, 2.3))); }
    }); },
    generic: function (item) { return piece(2.6, function (t, Lo) {
      var u = Lo.u, pulse = 1 + Math.sin(t * 5) * .05;
      glowDot(Lo.cx, Lo.ay, 26 * u * pulse, "rgba(250,204,21,.55)", .8);
      g.fillStyle = "rgba(12,10,9,.75)"; g.beginPath(); g.arc(Lo.cx, Lo.ay, 15 * u, 0, 6.283); g.fill(); g.strokeStyle = "#facc15"; g.lineWidth = 1.4 * u; g.stroke();
      g.font = (15 * u) + "px system-ui,'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(item.e || "\u26A1", Lo.cx, Lo.ay + 1 * u);
    }); }
  };
  function layout() { var u = Math.min(W, 460) / 100; var cy = clamp(H * .3, 150, H * .42); return { u: u, cx: W / 2, cy: cy, ay: cy - 4 * u, ty: cy + 26 * u }; }
  function frame(now) {
    raf = 0; if (!anim) return;
    var dt = Math.min(.05, (now - (lastF || now)) / 1000); lastF = now;
    var s = store(); if (!(s && s.phase === "paused")) anim.t += dt;
    g.clearRect(0, 0, W, H);
    if (anim.t >= anim.th.dur) { stopAnim(); return; }
    var Lo = layout(), k = Math.min(1, anim.t * 4) * (1 - seg(anim.t, anim.th.dur - .35, anim.th.dur));
    // soft backdrop for legibility (no hard box)
    var gr = g.createRadialGradient(Lo.cx, Lo.cy, 0, Lo.cx, Lo.cy, 62 * Lo.u); gr.addColorStop(0, "rgba(8,8,8,.5)"); gr.addColorStop(1, "rgba(8,8,8,0)");
    g.globalAlpha = k; g.fillStyle = gr; g.fillRect(0, Lo.cy - 62 * Lo.u, W, 124 * Lo.u); g.globalAlpha = 1;
    try { anim.th.draw(anim.t, Lo, dt, anim.item); } catch (e) { if (!frame.err) { frame.err = 1; console.warn("hms-fx", e); } stopAnim(); return; }
    raf = requestAnimationFrame(frame);
  }
  function stopAnim() { anim = null; if (raf) cancelAnimationFrame(raf); raf = 0; if (g) g.clearRect(0, 0, W, H); if (cv) cv.style.display = "none"; }
  function playSlogan(i) {
    canvas(); fit();
    var item = L[i], mk = THEMES[item.k] || THEMES.generic, th = mk(item);
    anim = { i: i, item: item, th: th, t: 0, until: Date.now() + th.dur * 1000 };
    cv.style.display = "block"; lastF = 0; if (!raf) raf = requestAnimationFrame(frame);
    var p = document.getElementById("extras-pop"); if (p) p.style.opacity = "0";
    window.__smBusyUntil = Date.now() + th.dur * 1000 + 600;
    sting(item.k);
    return th.dur;
  }
  function animLeft() { return anim ? Math.max(0, anim.th.dur - anim.t) : 0; }

  /* ---------------- audio: heartbeat + small stingers (shares the extras.js AudioContext) ---------------- */
  var HB = { bpm: 70, vol: 0, next: 0, count: 0, gain: null, lp: null, ctx: null };
  function ac() {
    var f = window.__extrasAudio, a = f && f(); if (!a || !a.ctx || a.ctx.state !== "running") return null;
    if (HB.ctx !== a.ctx) {
      HB.ctx = a.ctx; HB.gain = a.ctx.createGain(); HB.gain.gain.value = 1; HB.lp = a.ctx.createBiquadFilter(); HB.lp.type = "lowpass"; HB.lp.frequency.value = 650; HB.lp.Q.value = .7;
      HB.lp.connect(HB.gain); HB.gain.connect(a.out); HB.out = a.out; HB.next = 0;
    }
    return a.ctx;
  }
  function thump(c, t, f0, f1, vol, dec) {
    [["triangle", 1], ["sine", .8]].forEach(function (w, i) {
      var o = c.createOscillator(), e = c.createGain(); o.type = w[0];
      o.frequency.setValueAtTime(f0 / (i + 1) * (i ? 1.2 : 1), t); o.frequency.exponentialRampToValueAtTime(f1 / (i + 1) * (i ? 1.2 : 1), t + dec * .8);
      e.gain.setValueAtTime(.0001, t); e.gain.exponentialRampToValueAtTime(Math.max(.0002, vol * w[1]), t + .008); e.gain.exponentialRampToValueAtTime(.0001, t + dec);
      o.connect(e); e.connect(HB.lp); o.start(t); o.stop(t + dec + .03);
    });
  }
  function beat(c, t, vol, per) {
    thump(c, t, 110, 55, vol, .16);                                   // lub
    thump(c, t + clamp(per * .36, .17, .3), 135, 68, vol * .7, .12);  // dub
  }
  function hbTarget() {
    var s = store(), n = HB.count;
    if (!s || s.phase !== "playing" || muted() || document.hidden) return null;
    if (n < 3) return { bpm: 70, vol: 0 };
    var k = clamp((n - 3) / 9, 0, 1);
    return { bpm: 70 + k * 66, vol: .16 + k * .34 };
  }
  var hbLast = 0;
  setInterval(function () {
    var now = performance.now(), dt = hbLast ? Math.min(.25, (now - hbLast) / 1000) : .06; hbLast = now;
    var tg = hbTarget();
    if (!tg) { HB.vol = 0; HB.bpm = 70; HB.next = 0; if (HB.gain && HB.ctx) HB.gain.gain.setTargetAtTime(0, HB.ctx.currentTime, .03); return; }
    var c = ac(); if (!c) return;
    HB.gain.gain.setTargetAtTime(1, c.currentTime, .05);
    HB.bpm += clamp(tg.bpm - HB.bpm, -5 * dt, 9 * dt);
    HB.vol += clamp(tg.vol - HB.vol, -.22 * dt, .3 * dt);
    if (HB.vol < .02) { HB.next = 0; return; }
    if (!HB.next || HB.next < c.currentTime) HB.next = c.currentTime + .06;
    while (HB.next < c.currentTime + .2) { var per = 60 / HB.bpm; beat(c, HB.next, HB.vol, per); HB.next += per; }
  }, 60);
  function tone(c, t, f, d, type, vol, f2) {
    var o = c.createOscillator(), e = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    e.gain.setValueAtTime(.0001, t); e.gain.exponentialRampToValueAtTime(vol, t + .01); e.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(e); e.connect(HB.out); o.start(t); o.stop(t + d + .02);
  }
  function sting(k) {
    if (muted()) return; var c = ac(); if (!c) return; var t = c.currentTime + .02, i;
    if (k === "amb" || k === "fire" || k === "police") { var hi = k === "police" ? 880 : 960, lo = k === "police" ? 660 : 640; for (i = 0; i < 4; i++) tone(c, t + i * .2, i % 2 ? lo : hi, .19, "triangle", .07); }
    else if (k === "lock") { tone(c, t + .55, 2200, .03, "square", .05); tone(c, t + .58, 900, .05, "square", .05); }
    else if (k === "meter" || k === "test") { tone(c, t + .4, 1760, .07, "sine", .06); tone(c, t + 1.3, 1320, .08, "sine", .06); tone(c, t + 1.4, 1760, .12, "sine", .06); }
    else if (k === "stop") tone(c, t + .26, 160, .25, "triangle", .14, 60);
    else if (k === "breaker") { tone(c, t + .65, 300, .06, "square", .06, 120); tone(c, t + .9, 1320, .1, "sine", .05); }
    else { tone(c, t, 880, .06, "triangle", .06); tone(c, t + .07, 1320, .09, "triangle", .06); }
  }

  /* ---------------- round logic: calm-moment scheduling + spawn hold ---------------- */
  var round = null;
  function startRound() {
    var o = ls(), idx = (o.next || 0) % L.length;
    round = { idx: idx, shown: [], last: 999, winKey: null, winT: 0 };
    seenRoles = {}; chipClear(); stopAnim();
  }
  function onScreen(sc) {
    var cam = sc.cameras && sc.cameras.main, v = cam && cam.worldView, n = 0, roles = [];
    if (!v || !sc.enemies) return { n: 0, roles: roles };
    sc.enemies.getChildren().forEach(function (e) {
      if (!e.active || !e.visible) return;
      var inV = e.x > v.x - 20 && e.x < v.right + 20 && e.y > v.y - 20 && e.y < v.bottom + 20; if (!inV) return;
      n++; roles.push(e.role);
    });
    return { n: n, roles: roles };
  }
  function popupVisible() { var p = document.getElementById("extras-pop"); return p && p.style.opacity === "1"; }
  function schedule(sc, os, dt) {
    if (!round || anim || round.shown.length >= 4) return;
    var t = sc.timeLeft; if (t > 56.5 || t < 4.5) return;
    if (round.last - t < 6) return; /* min gap between slogans (timeLeft counts down) */
    var DUR = 3.1, noMore = sc.spawnN >= 6, fits = noMore ? t > DUR + 1.5 : sc.spawnIn > DUR + .4;
    if (!fits || popupVisible()) return;
    var key = sc.spawnN; if (round.winKey !== key) { round.winKey = key; round.winT = 0; }
    round.winT += dt;
    var allowed = round.shown.length < 3 && t < 36 ? 1e9 : 2 + Math.floor(round.winT / 1.0); /* calm moment preferred; 3 per round guaranteed */
    if (os.n > allowed) return;
    var i = (round.idx + round.shown.length) % L.length;
    round.shown.push(i); round.last = t; playSlogan(i);
    var o = ls(); o.seen = o.seen || []; if (o.seen.indexOf(i) < 0) o.seen.push(i); o.next = (i + 1) % L.length; lsSave(o);
  }
  var scene = null;
  function hookScene() {
    var game = window.__phaserGame; if (!game || !window.__gameReady) return;
    var sc = game.scene.getScene("game"); if (!sc || !sc.enemies || !sc.sys.isActive() || sc.__hms) return;
    sc.__hms = true; scene = sc;
    // name plates off (each type gets one short corner intro instead)
    sc.labelApproaching = function (list) { (list || []).forEach(function (e) { if (e && e.plate) e.plate.setVisible(false); }); };
    // wave banners ("N på tomten", "Formannen på tomten", ...) off – the corner chip introduces new types
    var sb = sc.spawnBurst;
    sc.spawnBurst = function () { var r = sb.apply(this, arguments); try { this.bannerT = 0; window.__store.getState().patch({ banner: null }); } catch (e) {} return r; };
    sc.events.on("postupdate", function () {
      try {
        var live = sc.playing && !sc.paused && !sc.over, dt = Math.min(.05, (sc.game.loop.delta || 16) / 1000);
        if (!live) return;
        var os = onScreen(sc); HB.count = os.n;
        os.roles.forEach(function (r) { if (r && !seenRoles[r]) { seenRoles[r] = 1; chipQ.push(r); chipNext(); } });
        // hold the next enemy wave while a slogan is playing
        if (anim && sc.spawnN < 6 && sc.spawnIn < animLeft() + .3) sc.spawnIn = animLeft() + .3;
        schedule(sc, os, dt);
      } catch (e) { if (!hookScene.err) { hookScene.err = 1; console.warn("hms-fx", e); } }
    });
    sc.events.once("shutdown", function () { sc.__hms = false; scene = null; });
  }

  /* ---------------- 3) "I dag lærte du" on the game-over card ---------------- */
  function learned() {
    if (!round || !round.shown.length) return;
    var shown = round.shown.slice(), tries = 0;
    (function attempt() {
      var card = null;
      document.querySelectorAll(".z-30").forEach(function (c) { if (!card && /\d/.test(c.textContent || "") && c.querySelector("button")) card = c; });
      var anchor = card && card.querySelector(".extras-title");
      if (!anchor) { if (tries++ < 40) setTimeout(attempt, 100); return; }
      if (card.querySelector(".sm-learn")) return;
      var d = document.createElement("div"); d.className = "sm-learn";
      var h = document.createElement("h3"); h.textContent = U.learned; d.appendChild(h);
      var ul = document.createElement("ul");
      shown.forEach(function (i) { var li = document.createElement("li"), sp = document.createElement("span"); sp.setAttribute("aria-hidden", "true"); sp.textContent = L[i].e || "\u26A1"; li.appendChild(sp); li.appendChild(document.createTextNode(L[i].t)); ul.appendChild(li); });
      d.appendChild(ul);
      var n = (ls().seen || []).length, p = document.createElement("p");
      p.textContent = (n >= L.length ? U.done : U.progress).replace("{n}", n).replace("{t}", L.length) + " " + U.note;
      d.appendChild(p); anchor.after(d);
    })();
  }

  /* ---------------- store hook ---------------- */
  var hooked = false, prev = null;
  function hookStore() {
    var s = window.__store; if (!s || hooked) return; hooked = true; prev = s.getState().phase;
    s.subscribe(function (x) {
      if (x.phase === prev) return;
      var p = prev; prev = x.phase;
      if (x.phase === "playing" && p !== "paused") startRound();
      if (x.phase === "over") { stopAnim(); chipClear(); HB.count = 0; learned(); }
      if (x.phase !== "playing" && x.phase !== "paused") { stopAnim(); chipClear(); }
    });
  }
  window.__hms = { list: L, play: function (i) { return playSlogan(i % L.length); }, hb: HB, state: function () { return { anim: anim && { i: anim.i, t: anim.t }, round: round, count: HB.count, bpm: Math.round(HB.bpm), vol: +HB.vol.toFixed(3) }; } };
  function boot() { setInterval(function () { hookStore(); hookScene(); }, 400); }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
