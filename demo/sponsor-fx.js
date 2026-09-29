/* STRØM – SPONSORDEMO effects layer. Reads window.SPONSOR (sponsor.js).
   Pure add-on: hooks the running game (window.__phaserGame / __store) without
   changing game rules, except the optional sponsor power-up bonus. */
(function () {
  "use strict";
  var S = window.SPONSOR || {};
  var C = S.colors || {};
  var P = C.primary || "#ffc400", D = C.secondary || "#0a2a66", A = C.accent || "#39e1ff";
  var NAME = S.name || "Din logo her", SHORT = S.short || NAME.toUpperCase();
  var EX = S.isExample !== false, EXL = S.exampleLabel || "Eksempelsponsor";
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function hex(c) { return parseInt(String(c).replace("#", ""), 16); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function st() { return window.__store && window.__store.getState(); }

  /* ---------- logo ---------- */
  function iconSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">' +
      '<defs><linearGradient id="spg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="' + P + '"/><stop offset="1" stop-color="' + P + '"/></linearGradient></defs>' +
      '<rect x="7" y="7" width="106" height="106" rx="28" fill="url(#spg)" stroke="' + D + '" stroke-width="7"/>' +
      '<circle cx="60" cy="60" r="36" fill="none" stroke="' + D + '" stroke-width="5" stroke-dasharray="14 9" opacity=".35"/>' +
      '<path d="M68 16 L32 66 H55 L46 104 L88 50 H64 L74 16 Z" fill="' + D + '" stroke="' + D + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M66 22 L40 60 H58" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></svg>';
  }
  var ICON_URL = S.logoUrl || ("data:image/svg+xml;charset=utf-8," + encodeURIComponent(iconSVG()));
  function iconImg(size, cls) { return '<img alt="" class="' + (cls || "") + '" src="' + esc(ICON_URL) + '" width="' + size + '" height="' + size + '" style="width:' + size + 'px;height:' + size + 'px;display:block">'; }
  window.SPONSOR_ICON_URL = ICON_URL;

  /* ---------- CSS ---------- */
  var css = [
    ":root{--sp-p:" + P + ";--sp-d:" + D + ";--sp-a:" + A + ";--sp-lb:" + JSON.stringify("Toppliste levert av " + NAME) + "}",
    "#sp-splash{position:fixed;inset:0;z-index:10000;background:radial-gradient(120% 80% at 50% 40%," + D + " 0%,#05070f 70%);display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity .55s ease,transform .55s ease;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "#sp-splash.out{opacity:0;transform:scale(1.06);pointer-events:none}",
    "#sp-splash canvas{position:absolute;inset:0;width:100%;height:100%}",
    ".sp-in{position:relative;text-align:center;color:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;padding:24px}",
    ".sp-pres{font:600 13px/1 'Oswald',system-ui,sans-serif;letter-spacing:.42em;text-transform:uppercase;color:" + A + ";opacity:0;animation:spUp .6s .15s forwards}",
    ".sp-logo{margin:22px auto 14px;width:132px;height:132px;border-radius:34px;opacity:0;transform:scale(.3) rotate(-12deg);animation:spPop .7s .45s cubic-bezier(.2,1.6,.4,1) forwards,spFlick 2.6s 1.1s infinite;filter:drop-shadow(0 0 22px " + P + ")}",
    ".sp-name{font:600 30px/1.05 'Oswald',system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;opacity:0;animation:spUp .6s .95s forwards;text-shadow:0 0 18px rgba(255,255,255,.25)}",
    ".sp-tag{margin-top:6px;font-size:14px;color:#cbd5e1;opacity:0;animation:spUp .6s 1.15s forwards}",
    ".sp-ex{display:inline-block;margin-top:12px;padding:3px 10px;border-radius:999px;border:1px dashed rgba(255,255,255,.45);font-size:11px;letter-spacing:.08em;color:#e2e8f0;opacity:0;animation:spUp .6s 1.3s forwards}",
    ".sp-game{margin-top:34px;font:600 64px/1 'Oswald',system-ui,sans-serif;letter-spacing:.02em;color:#f5f1e8;opacity:0;animation:spZap .9s 1.7s forwards}",
    ".sp-game small{display:block;margin-top:8px;font:500 11px/1 'Oswald',sans-serif;letter-spacing:.35em;color:" + A + "}",
    ".sp-skip{margin-top:30px;font-size:11px;color:#94a3b8;opacity:0;animation:spUp .5s 2.4s forwards}",
    "@keyframes spUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}",
    "@keyframes spPop{to{opacity:1;transform:none}}",
    "@keyframes spFlick{0%,100%{filter:drop-shadow(0 0 22px " + P + ")}8%{filter:drop-shadow(0 0 4px " + P + ") brightness(1.5)}10%{filter:drop-shadow(0 0 30px " + A + ")}12%{filter:drop-shadow(0 0 22px " + P + ")}}",
    "@keyframes spZap{0%{opacity:0;transform:scale(1.4);filter:blur(6px)}40%{opacity:1;filter:blur(0) drop-shadow(0 0 20px " + A + ")}55%{opacity:.35}70%{opacity:1}100%{opacity:1;transform:none;filter:drop-shadow(0 0 10px " + A + ")}}",
    /* demo ribbon */
    "#sp-ribbon{position:fixed;left:-46px;bottom:26px;z-index:9000;transform:rotate(45deg);width:170px;padding:5px 0;text-align:center;background:repeating-linear-gradient(135deg," + P + " 0 12px,#111 12px 24px);pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,.5)}",
    "#sp-ribbon span{display:inline-block;padding:1px 8px;background:#111;color:" + P + ";font:700 10px/1.3 'Oswald',system-ui,sans-serif;letter-spacing:.2em}",
    /* home chip */
    ".sp-chip{display:flex;align-items:center;gap:10px;margin:0 auto 2px;padding:6px 12px 6px 6px;border-radius:14px;background:rgba(5,7,15,.62);border:1px solid color-mix(in srgb," + P + " 55%,transparent);box-shadow:0 0 24px color-mix(in srgb," + P + " 25%,transparent);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);text-align:left;animation:spUp .6s both}",
    ".sp-chip img{border-radius:9px}",
    ".sp-chip b{display:block;font:600 15px/1.1 'Oswald',sans-serif;letter-spacing:.04em;color:#fff;text-transform:uppercase}",
    ".sp-chip i{display:block;font-style:normal;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:" + A + "}",
    ".sp-chip em{font-style:normal;margin-left:6px;padding:1px 6px;border-radius:6px;border:1px dashed rgba(255,255,255,.4);font-size:9px;letter-spacing:.06em;color:#cbd5e1;text-transform:none}",
    /* leaderboard header */
    ".lbx-head{flex-wrap:wrap;row-gap:4px}",
    ".lbx-h{font-size:0!important;display:flex;align-items:center;gap:8px;flex:1 1 100%;min-width:0}",
    ".lbx-h::before{content:'';flex:none;width:22px;height:22px;border-radius:6px;background:url(\"" + ICON_URL.replace(/"/g, "%22") + "\") center/contain no-repeat;box-shadow:0 0 10px " + P + "}",
    ".lbx-h::after{content:var(--sp-lb);font-size:15px;line-height:1.15;color:" + P + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lbx{border-color:color-mix(in srgb," + P + " 55%,transparent)!important;box-shadow:0 0 22px color-mix(in srgb," + P + " 18%,transparent)}",
    /* start button glow */
    ".z-20 button.h-14:not([disabled]){animation:spGlow 2.2s ease-in-out infinite}",
    "@keyframes spGlow{0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.0),0 0 14px rgba(45,212,191,.35)}50%{box-shadow:0 0 0 3px color-mix(in srgb," + P + " 45%,transparent),0 0 30px color-mix(in srgb," + P + " 45%,transparent)}}",
    /* over + pause cards: smooth entrance */
    ".goscroll>div{animation:spCard .45s cubic-bezier(.2,1.2,.35,1) both}",
    ".z-30>div{animation:spCard .4s cubic-bezier(.2,1.2,.35,1) both}",
    "@keyframes spCard{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1;transform:none}}",
    /* tip card */
    ".sp-tip{position:relative;margin-top:16px;padding:14px 14px 12px;border-radius:14px;text-align:left;color:#fff;background:linear-gradient(135deg," + D + " 0%,#0b1020 100%);border:1.5px solid " + P + ";box-shadow:0 0 0 1px rgba(0,0,0,.4),0 8px 28px color-mix(in srgb," + P + " 30%,transparent);overflow:hidden;animation:spUp .6s .35s both}",
    ".sp-tip::after{content:'';position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.18),transparent);animation:spShine 3.2s 1s infinite}",
    "@keyframes spShine{0%{left:-60%}35%,100%{left:130%}}",
    ".sp-tip-h{display:flex;align-items:center;gap:10px;font:600 12px/1.2 'Oswald',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:" + P + "}",
    ".sp-tip-h img{border-radius:8px;box-shadow:0 0 12px " + P + "}",
    ".sp-tip-h b{display:block;color:#fff;font-size:15px;letter-spacing:.04em}",
    ".sp-tip p{margin:10px 0 6px;font-size:14px;line-height:1.45;color:#e2e8f0}",
    ".sp-tip small{display:block;font-size:10px;color:#94a3b8;letter-spacing:.06em}",
    /* pause chip */
    "#sp-pause{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);z-index:65;display:none;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:12px;background:rgba(5,7,15,.85);border:1px solid " + P + ";color:#e2e8f0;font:500 12px/1.2 'IBM Plex Sans',sans-serif;white-space:nowrap;pointer-events:none;animation:spUp .4s both}",
    "#sp-pause img{border-radius:6px}",
    /* hurt vignette */
    "#sp-hurt{position:fixed;inset:0;z-index:5;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(220,38,38,.55) 100%);transition:opacity .35s ease-out}",
    "#sp-boost{position:fixed;inset:0;z-index:5;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 50%,color-mix(in srgb," + P + " 45%,transparent) 100%);transition:opacity .6s ease-out}",
    "#sp-fx{position:fixed;inset:0;z-index:70;pointer-events:none}",
    "@media (prefers-reduced-motion: reduce){.sp-logo,.sp-game,.z-20 button.h-14{animation-duration:.01s!important}}"
  ].join("\n");
  var style = document.createElement("style");
  style.id = "sp-style";
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- helpers: electric bolts on a 2d canvas ---------- */
  function boltPts(x1, y1, x2, y2, n, jag) {
    var pts = [[x1, y1]], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (var i = 1; i < n; i++) { var t = i / n, o = (Math.random() * 2 - 1) * jag * (1 - Math.abs(t - .5) * 1.4); pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); }
    pts.push([x2, y2]);
    return pts;
  }
  function strokeBolt(g, pts, w, col, a) {
    g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }
  function drawBolt(g, pts, k) {
    g.lineCap = "round"; g.lineJoin = "round";
    strokeBolt(g, pts, 10, A, .12 * k); strokeBolt(g, pts, 5, A, .45 * k); strokeBolt(g, pts, 2, "#ffffff", .95 * k);
    g.globalAlpha = 1;
  }
  function fitCanvas(cv) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g: g, w: w, h: h };
  }

  /* ---------- splash ---------- */
  function splash() {
    var el = document.createElement("div");
    el.id = "sp-splash";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Presentert av " + NAME);
    el.innerHTML = '<canvas></canvas><div class="sp-in"><div class="sp-pres">Presentert av</div>' +
      '<div class="sp-logo">' + iconImg(132) + '</div><div class="sp-name">' + esc(NAME) + '</div>' +
      '<div class="sp-tag">' + esc(S.tagline || "") + '</div>' +
      (EX ? '<div class="sp-ex">' + esc(EXL) + ' · fiktivt merke for demo</div>' : "") +
      '<div class="sp-game">STRØM<small>ELEKTRIKER PÅ BYGGEPLASSEN</small></div><div class="sp-skip">Trykk for å starte</div></div>';
    document.body.appendChild(el);
    var cv = el.querySelector("canvas"), c = fitCanvas(cv), sparks = [], bolts = [], t0 = performance.now(), raf = 0, done = false, burst = false;
    function logoC() { var r = el.querySelector(".sp-logo").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width / 2]; }
    function spark(x, y, n, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = (sp || 1) * (60 + Math.random() * 260); sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, l: .5 + Math.random() * .7, m: 1.2, c: Math.random() < .5 ? P : (Math.random() < .5 ? A : "#fff") }); } }
    var last = t0;
    function frame(now) {
      if (done) return;
      var dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
      var g = c.g; g.clearRect(0, 0, c.w, c.h);
      var L = logoC();
      if (t > .45 && !burst) { burst = true; spark(L[0], L[1], reduced ? 20 : 90, 1.2); }
      if (!reduced && Math.random() < (t < 1.4 ? .35 : .14)) {
        var a = Math.random() * 6.283, R = L[2] + 70 + Math.random() * 120;
        bolts.push({ p: boltPts(L[0] + Math.cos(a) * R, L[1] + Math.sin(a) * R, L[0] + Math.cos(a) * L[2] * .9, L[1] + Math.sin(a) * L[2] * .9, 9, 22), l: .22, m: .22 });
        if (Math.random() < .5) spark(L[0] + Math.cos(a) * L[2], L[1] + Math.sin(a) * L[2], 6, .5);
      }
      if (t > 1.7 && t < 1.85 && !reduced) { var gm = el.querySelector(".sp-game").getBoundingClientRect(); bolts.push({ p: boltPts(L[0], L[1] + L[2], gm.left + gm.width / 2, gm.top + 8, 12, 18), l: .25, m: .25 }); }
      // orbit ring
      g.globalAlpha = .5; g.strokeStyle = A; g.lineWidth = 1.5; g.setLineDash([4, 10]); g.lineDashOffset = -t * 60;
      g.beginPath(); g.arc(L[0], L[1], L[2] + 26 + Math.sin(t * 3) * 3, 0, 6.283); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      for (var i = bolts.length - 1; i >= 0; i--) { var b = bolts[i]; b.l -= dt; if (b.l <= 0) { bolts.splice(i, 1); continue; } drawBolt(g, b.p, b.l / b.m); }
      g.globalCompositeOperation = "lighter";
      for (var j = sparks.length - 1; j >= 0; j--) { var s = sparks[j]; s.l -= dt; if (s.l <= 0) { sparks.splice(j, 1); continue; } s.vy += 320 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .985;
        g.globalAlpha = Math.min(1, s.l * 1.6); g.strokeStyle = s.c; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * .03, s.y - s.vy * .03); g.stroke(); }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    function close() { if (done) return; done = true; cancelAnimationFrame(raf); el.classList.add("out"); setTimeout(function () { el.remove(); }, 600); }
    el.addEventListener("click", close);
    setTimeout(close, 4200);
    window.__spSplashClose = close;
  }

  /* ---------- confetti + electric celebration ---------- */
  function celebrate(big) {
    if (reduced) return;
    var cv = document.createElement("canvas"); cv.id = "sp-fx"; document.body.appendChild(cv);
    var c = fitCanvas(cv), g = c.g, parts = [], bolts = [], t0 = performance.now(), last = t0, cols = [P, A, "#ffffff", D, P];
    var N = big ? 170 : 90;
    for (var i = 0; i < N; i++) {
      var fromL = i % 2 === 0;
      parts.push({ x: fromL ? -10 : c.w + 10, y: c.h * (.55 + Math.random() * .3), vx: (fromL ? 1 : -1) * (160 + Math.random() * 320), vy: -(420 + Math.random() * 480), r: Math.random() * 6.28, vr: (Math.random() * 2 - 1) * 12, w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, c: cols[i % cols.length], d: Math.random() * .25 });
    }
    function frame(now) {
      var dt = Math.min(.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
      g.clearRect(0, 0, c.w, c.h);
      if (t < 1.4 && Math.random() < .3) { var x = Math.random() * c.w; bolts.push({ p: boltPts(x, -10, x + (Math.random() * 2 - 1) * 90, c.h * (.15 + Math.random() * .3), 12, 26), l: .2, m: .2 }); }
      for (var k = bolts.length - 1; k >= 0; k--) { var b = bolts[k]; b.l -= dt; if (b.l <= 0) { bolts.splice(k, 1); continue; } drawBolt(g, b.p, b.l / b.m); }
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j]; if (t < p.d) continue;
        p.vy += 620 * dt; p.vx *= .99; p.vy *= .995; if (p.vy > 260) p.vy = 260;
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.r * 1.7));
        g.globalAlpha = Math.max(0, Math.min(1, 4 - t)); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      }
      if (t < 4.2) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }
  window.__spCelebrate = celebrate;

  /* ---------- DOM chrome ---------- */
  var ribbon, pauseEl, hurtEl, boostEl;
  function chrome() {
    if (!window.__store) return; // wait for hydration before touching the React tree
    if (!ribbon) {
      ribbon = document.createElement("div"); ribbon.id = "sp-ribbon"; ribbon.setAttribute("aria-hidden", "true");
      ribbon.innerHTML = "<span>" + esc(S.demoBadge || "SPONSORDEMO") + "</span>"; document.body.appendChild(ribbon);
      pauseEl = document.createElement("div"); pauseEl.id = "sp-pause"; pauseEl.innerHTML = iconImg(24) + "<span>Pausen er levert av <b>" + esc(NAME) + "</b>" + (EX ? " · " + esc(EXL) : "") + "</span>"; document.body.appendChild(pauseEl);
      hurtEl = document.createElement("div"); hurtEl.id = "sp-hurt"; document.body.appendChild(hurtEl);
      boostEl = document.createElement("div"); boostEl.id = "sp-boost"; document.body.appendChild(boostEl);
    }
    if (document.title.indexOf("Sponsordemo") === -1) document.title = "STRØM – Sponsordemo";
    var s = st(), ph = s && s.phase;
    pauseEl.style.display = ph === "paused" ? "flex" : "none";
    if (!ph || ph === "title" || ph === "boot") homeChip();
  }
  function homeChip() {
    var h1 = document.querySelector(".z-20 h1");
    if (!h1) return;
    var box = h1.parentElement;
    if (box.querySelector(".sp-chip")) return;
    var d = document.createElement("div"); d.className = "sp-chip";
    d.innerHTML = iconImg(40) + '<div><i>Presentert av' + (EX ? '<em>' + esc(EXL) + '</em>' : '') + '</i><b>' + esc(NAME) + '</b></div>';
    box.insertBefore(d, box.firstChild);
  }
  function flash(el, a, ms) { if (!el) return; el.style.transition = "none"; el.style.opacity = a; void el.offsetWidth; el.style.transition = ""; setTimeout(function () { el.style.opacity = 0; }, ms || 60); }

  /* ---------- end of shift ---------- */
  var tipI = Math.floor(Math.random() * 100), highAtStart = 0;
  function tipCard(score) {
    var tries = 0;
    (function attempt() {
      var card = document.querySelector(".goscroll > div");
      var btn = card && card.querySelector("button");
      if (!btn) { if (tries++ < 40) setTimeout(attempt, 100); return; }
      if (card.querySelector(".sp-tip")) return;
      var tips = S.tips && S.tips.length ? S.tips : ["Riktig verktøy halverer jobben."];
      var d = document.createElement("div"); d.className = "sp-tip";
      d.innerHTML = '<div class="sp-tip-h">' + iconImg(36) + '<div>Dagens tips levert av<b>' + esc(NAME) + '</b></div></div><p>' + esc(tips[tipI++ % tips.length]) + '</p>' + (EX ? '<small>' + esc(EXL) + ' · demo – ingen ekte bedrift</small>' : '');
      btn.parentElement.insertBefore(d, btn);
    })();
  }

  /* ---------- Phaser layer ---------- */
  var scene = null, T = {}, hooked = false, kit = null, kitNext = 7, gfx = null, sparks = [], brand = new Map(), world = [];
  function loadImg(src) { return new Promise(function (res) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
  function mk(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function fitText(g, txt, maxW, px, weight) { var s = px; do { g.font = weight + " " + s + "px Oswald, 'IBM Plex Sans', sans-serif"; s--; } while (g.measureText(txt).width > maxW && s > 8); }
  function buildTextures(icon) {
    var k;
    // icon
    k = mk(128, 128); if (icon) k[1].drawImage(icon, 0, 0, 128, 128); T.icon = k[0];
    // badge (round sticker)
    k = mk(64, 64); var g = k[1];
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.arc(32, 34, 29, 0, 6.283); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(32, 32, 29, 0, 6.283); g.fill();
    g.fillStyle = P; g.beginPath(); g.arc(32, 32, 25, 0, 6.283); g.fill();
    if (icon) g.drawImage(icon, 12, 12, 40, 40); T.badge = k[0];
    // glow
    k = mk(128, 128); g = k[1]; var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); T.glow = k[0];
    // banner on posts
    k = mk(460, 200); g = k[1];
    g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(230, 190, 220, 10, 0, 0, 6.283); g.fill();
    g.fillStyle = "#6b7280"; g.fillRect(14, 10, 10, 182); g.fillRect(436, 10, 10, 182);
    g.fillStyle = "#9ca3af"; g.fillRect(16, 10, 4, 182); g.fillRect(438, 10, 4, 182);
    rr(g, 24, 16, 412, 132, 8); g.fillStyle = D; g.fill(); g.lineWidth = 6; g.strokeStyle = P; g.stroke();
    g.fillStyle = P; g.fillRect(24, 124, 412, 24);
    for (var x = 24; x < 436; x += 26) { g.fillStyle = "#111"; g.beginPath(); g.moveTo(x, 148); g.lineTo(x + 13, 124); g.lineTo(x + 26, 124); g.lineTo(x + 13, 148); g.fill(); }
    if (icon) g.drawImage(icon, 36, 28, 90, 90);
    g.fillStyle = "#fff"; fitText(g, SHORT, 290, 40, "700"); g.textBaseline = "alphabetic"; g.fillText(SHORT, 138, 70);
    g.fillStyle = P; fitText(g, S.tagline || "", 290, 20, "500"); g.fillText(S.tagline || "", 138, 98);
    if (EX) { g.fillStyle = "rgba(255,255,255,.75)"; g.font = "600 13px 'IBM Plex Sans', sans-serif"; g.fillText(EXL.toUpperCase(), 138, 117); }
    T.banner = k[0];
    // van (3/4 view)
    k = mk(300, 200); g = k[1];
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(150, 178, 140, 18, 0, 0, 6.283); g.fill();
    rr(g, 26, 22, 250, 30, 12); g.fillStyle = "#e5e7eb"; g.fill(); // roof
    rr(g, 16, 40, 272, 124, 14); g.fillStyle = "#f8fafc"; g.fill();
    g.fillStyle = "#cbd5e1"; g.fillRect(16, 148, 272, 16);
    // cab
    g.fillStyle = "#1e293b"; rr(g, 214, 50, 62, 44, 8); g.fill();
    g.fillStyle = "rgba(125,211,252,.55)"; rr(g, 220, 55, 50, 34, 6); g.fill();
    g.fillStyle = P; g.fillRect(16, 100, 198, 36); g.fillStyle = D; g.fillRect(16, 136, 198, 8);
    if (icon) g.drawImage(icon, 26, 50, 70, 70);
    g.fillStyle = D; fitText(g, SHORT, 108, 22, "700"); g.fillText(SHORT, 102, 126);
    g.fillStyle = "#334155"; fitText(g, S.tagline || "", 108, 12, "500"); g.fillText(S.tagline || "", 102, 90);
    g.fillStyle = "#fde68a"; g.fillRect(278, 110, 10, 12); g.fillStyle = "#ef4444"; g.fillRect(16, 110, 5, 14);
    [[70, 164], [236, 164]].forEach(function (w) { g.fillStyle = "#111827"; g.beginPath(); g.arc(w[0], w[1], 20, 0, 6.283); g.fill(); g.fillStyle = "#9ca3af"; g.beginPath(); g.arc(w[0], w[1], 8, 0, 6.283); g.fill(); });
    T.van = k[0];
    // sponsor toolbox power-up
    k = mk(112, 96); g = k[1];
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(56, 88, 46, 7, 0, 0, 6.283); g.fill();
    g.lineWidth = 7; g.strokeStyle = D; rr(g, 36, 6, 40, 26, 8); g.stroke();
    rr(g, 8, 24, 96, 62, 10); g.fillStyle = P; g.fill(); g.lineWidth = 4; g.strokeStyle = D; g.stroke();
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(14, 29, 84, 6);
    g.fillStyle = D; g.fillRect(8, 46, 96, 5);
    if (icon) { g.fillStyle = "#fff"; g.beginPath(); g.arc(56, 60, 20, 0, 6.283); g.fill(); g.drawImage(icon, 40, 44, 32, 32); }
    T.kit = k[0];
    // soft dot
    k = mk(24, 24); g = k[1]; gr = g.createRadialGradient(12, 12, 0, 12, 12, 12); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 24, 24); T.dot = k[0];
  }
  function addTex(sc) { Object.keys(T).forEach(function (k) { var key = "sp-" + k; if (!sc.textures.exists(key)) sc.textures.addCanvas(key, T[k]); }); }

  function place(sc) {
    world.forEach(function (o) { o.destroy(); }); world = [];
    var h = { x: 1388, y: 1364 };
    // branded van + banner near the start (decorative, no collision)
    var van = sc.add.image(h.x - 110, h.y - 200, "sp-van").setOrigin(.5, .9).setScale(.95); van.setDepth(van.y); world.push(van);
    var ban = sc.add.image(h.x + 95, h.y + 290, "sp-banner").setOrigin(.5, .95).setScale(.56); ban.setDepth(ban.y); world.push(ban);
    // more banners around the yard
    [[700, 1260], [2060, 1260], [1400, 700], [1380, 2000]].forEach(function (p) { var b = sc.add.image(p[0], p[1], "sp-banner").setOrigin(.5, .95).setScale(.6); b.setDepth(b.y); world.push(b); });
    [[2120, 1980], [600, 800]].forEach(function (p) { var v = sc.add.image(p[0], p[1], "sp-van").setOrigin(.5, .9).setScale(.95); v.setDepth(v.y); world.push(v); });
    // stickers on equipment / containers
    sc.walls.getChildren().forEach(function (w) {
      var k = w.texture && w.texture.key;
      if (!/prop-(generator|trailer|toolbox|cabinet|dumpster|tank)/.test(k)) return;
      var s = Math.max(.35, Math.min(.8, w.displayWidth / 260));
      var b = sc.add.image(w.x + w.displayWidth * .12, w.y - w.displayHeight * .42, "sp-badge").setScale(s); b.setDepth(w.depth + 1); world.push(b);
    });
  }
  function brandPickups(sc, t) {
    var seen = new Set();
    sc.pickups.getChildren().forEach(function (p) {
      var b = brand.get(p);
      if (!p.active || !p.visible) { if (b) { b.badge.setVisible(false); b.glow.setVisible(false); } return; }
      seen.add(p);
      if (!b) {
        b = { glow: sc.add.image(p.x, p.y, "sp-glow").setBlendMode(1).setTint(hex(P)), badge: sc.add.image(p.x, p.y, "sp-badge").setScale(.36) };
        brand.set(p, b);
      }
      var ph = t * 4 + p.x;
      b.glow.setVisible(true).setPosition(p.x, p.y + 4).setDepth(p.depth - 1).setScale(.62 + Math.sin(ph) * .06).setAlpha(.42 + Math.sin(ph) * .12);
      b.badge.setVisible(true).setPosition(p.x + p.displayWidth * .32, p.y - p.displayHeight * .3).setDepth(p.depth + 1);
    });
  }
  function freeSpot(sc) {
    var bw = sc.physics.world.bounds;
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * 6.283, r = 150 + Math.random() * 110;
      var x = Math.max(bw.x + 120, Math.min(bw.right - 120, sc.player.x + Math.cos(a) * r));
      var y = Math.max(bw.y + 120, Math.min(bw.bottom - 120, sc.player.y + Math.sin(a) * r * .8));
      var ok = true;
      sc.walls.getChildren().forEach(function (w) { if (Math.abs(w.x - x) < w.displayWidth * .6 + 30 && Math.abs(w.y - w.displayHeight * .35 - y) < w.displayHeight * .6 + 30) ok = false; });
      if (ok) return { x: x, y: y };
    }
    return { x: sc.player.x + 160, y: sc.player.y - 60 };
  }
  function spawnKit(sc, at) {
    removeKit();
    var p = at || freeSpot(sc);
    kit = { x: p.x, y: p.y, life: 14, t: 0,
      glow: sc.add.image(p.x, p.y, "sp-glow").setBlendMode(1).setTint(hex(A)).setDepth(p.y - 1),
      glow2: sc.add.image(p.x, p.y, "sp-glow").setBlendMode(1).setTint(hex(P)).setDepth(p.y - 1),
      rays: sc.add.graphics().setDepth(p.y - 2).setBlendMode(1),
      img: sc.add.image(p.x, p.y, "sp-kit").setScale(.62).setOrigin(.5, .8).setDepth(p.y),
      label: sc.add.text(p.x, p.y - 58, (S.kitName || "Sponsor-verktøykasse").toUpperCase(), { fontFamily: "Oswald, sans-serif", fontSize: "12px", fontStyle: "700", color: P, stroke: "#0c0a09", strokeThickness: 4 }).setOrigin(.5).setDepth(p.y + 30) };
    sc.fx && sc.fx.burst(p.x, p.y, 12);
  }
  function removeKit() { if (!kit) return; ["glow", "glow2", "rays", "img", "label"].forEach(function (k) { kit[k].destroy(); }); kit = null; }
  function emit(x, y, n, speed, cols) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = speed * (.3 + Math.random()); sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: .4 + Math.random() * .6, m: 1, r: 1.5 + Math.random() * 2.5, c: cols[i % cols.length] }); } }
  function collectKit(sc) {
    var x = kit.x, y = kit.y; removeKit();
    kitNext = 16;
    var bonus = S.kitBonus || 250;
    sc.hp = Math.min(sc.maxHp, sc.hp + 40); sc.armor = true; sc.score += bonus;
    sc.player.iframes = Math.max(sc.player.iframes || 0, 2.5);
    var n = 0;
    sc.enemies.getChildren().forEach(function (e) {
      if (!e.active || n >= 8) return;
      if (Math.hypot(e.x - sc.player.x, e.y - sc.player.y) > 330) return;
      n++; sc.fx.bolt(sc.player.x, sc.player.y - 12, e.x, e.y - 12, 3.6);
      try { sc.hitEnemy(e, 30, 160, undefined, 2.2); } catch (err) {}
    });
    sc.fx.ring(sc.player.x, sc.player.y, 120); sc.fx.burst(x, y, 24);
    emit(x, y - 10, 70, 360, [hex(P), hex(A), 0xffffff]);
    var c = Phaser_rgb(P); sc.cameras.main.flash(180, c[0], c[1], c[2], true); sc.cameras.main.shake(260, .01);
    var tx = sc.add.text(sc.player.x, sc.player.y - 70, "SPONSOR-BOOST  +" + bonus, { fontFamily: "Oswald, sans-serif", fontSize: "22px", fontStyle: "700", color: P, stroke: "#0c0a09", strokeThickness: 6 }).setOrigin(.5).setDepth(2100).setScale(.4);
    sc.tweens.add({ targets: tx, scale: 1.1, duration: 260, ease: "Back.easeOut", onComplete: function () { sc.tweens.add({ targets: tx, y: tx.y - 40, alpha: 0, delay: 500, duration: 600, onComplete: function () { tx.destroy(); } }); } });
    sc.syncHud();
    try { window.__extrasSfx && window.__extrasSfx.heal(); setTimeout(function () { window.__extrasSfx && window.__extrasSfx.fanfare(); }, 200); } catch (e) {}
    try { navigator.vibrate && navigator.vibrate([30, 40, 30, 40, 60]); } catch (e) {}
    try { window.__extrasPopup && window.__extrasPopup((S.kitName || "Sponsor-verktøykasse") + "! Levert av " + NAME + (EX ? " (" + EXL.toLowerCase() + ")" : ""), true); } catch (e) {}
    flash(boostEl, .95, 500);
    boostT = 2.5;
  }
  var boostT = 0;
  function Phaser_rgb(h) { var v = hex(h); return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
  function tick(sc) {
    var dt = Math.min(.05, (sc.game.loop.delta || 16) / 1000), t = sc.time.now / 1000;
    brandPickups(sc, t);
    var live = sc.playing && !sc.paused && !sc.over;
    if (live) {
      if (!kit) { kitNext -= dt; if (kitNext <= 0 && sc.timeLeft > 6) spawnKit(sc); }
      else {
        kit.life -= dt; kit.t += dt;
        if (kit.life <= 0) { emit(kit.x, kit.y, 16, 120, [hex(P)]); removeKit(); kitNext = 12; }
        else if (Math.hypot(sc.player.x - kit.x, sc.player.y - (kit.y - 6)) < 40) collectKit(sc);
      }
    }
    if (kit) {
      var k = kit, bob = Math.sin(k.t * 4) * 5, pulse = 1 + Math.sin(k.t * 6) * .08, fade = k.life < 3 ? (Math.sin(k.t * 20) > 0 ? 1 : .35) : 1;
      k.img.setY(k.y + bob).setAlpha(fade); k.label.setY(k.y - 58 + bob).setAlpha(fade);
      k.glow.setScale(1.1 * pulse).setAlpha(.55 * fade); k.glow2.setScale(.7 / pulse).setAlpha(.6 * fade);
      var g = k.rays; g.clear(); g.setPosition(k.x, k.y - 14);
      for (var i = 0; i < 10; i++) { var a = k.t * 1.3 + i * .628, L = 70 + Math.sin(k.t * 3 + i) * 12; g.fillStyle(i % 2 ? hex(P) : hex(A), .16 * fade); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - .09) * L, Math.sin(a - .09) * L); g.lineTo(Math.cos(a + .09) * L, Math.sin(a + .09) * L); g.closePath(); g.fillPath(); }
      if (Math.random() < .5) sparks.push({ x: k.x + (Math.random() * 2 - 1) * 26, y: k.y + 6, vx: (Math.random() * 2 - 1) * 20, vy: -60 - Math.random() * 80, l: .8, m: .8, r: 1.6 + Math.random() * 1.6, c: Math.random() < .5 ? hex(P) : hex(A) });
      if (Math.random() < .03 && sc.fx) sc.fx.bolt(k.x + (Math.random() * 2 - 1) * 40, k.y - 50, k.x, k.y - 16, 1.6);
    }
    // player aura during boost
    if (boostT > 0) {
      boostT -= dt;
      if (Math.random() < .8) { var a2 = Math.random() * 6.283; sparks.push({ x: sc.player.x + Math.cos(a2) * 30, y: sc.player.y - 20 + Math.sin(a2) * 34, vx: 0, vy: -50, l: .5, m: .5, r: 2, c: Math.random() < .5 ? hex(P) : hex(A) }); }
    }
    // sparks
    gfx.clear();
    for (var j = sparks.length - 1; j >= 0; j--) {
      var s = sparks[j]; s.l -= dt; if (s.l <= 0) { sparks.splice(j, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= .94; s.vy *= .94;
      var al = Math.min(1, s.l / s.m * 1.4);
      gfx.fillStyle(s.c, al * .35); gfx.fillCircle(s.x, s.y, s.r * 2.4);
      gfx.fillStyle(0xffffff, al); gfx.fillCircle(s.x, s.y, s.r * .8);
    }
    if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
  }
  function wrapScene(sc) {
    var oh = sc.hurtPlayer;
    sc.hurtPlayer = function (d) {
      var hp = this.hp, ar = this.armor;
      var r = oh.apply(this, arguments);
      if (this.hp < hp) { this.cameras.main.shake(200, .012); flash(hurtEl, 1, 90); }
      else if (ar && !this.armor) this.cameras.main.shake(120, .006);
      return r;
    };
    var ok = sc.killEnemy;
    sc.killEnemy = function (e) { var r = ok.apply(this, arguments); this.cameras.main.shake(90, .004); return r; };
    var fp = sc.foremanPulse;
    if (fp) sc.foremanPulse = function () { var r = fp.apply(this, arguments); this.cameras.main.shake(160, .007); return r; };
    var bs = sc.beginShift;
    sc.beginShift = function () { removeKit(); kitNext = 7; sparks = []; boostT = 0; return bs.apply(this, arguments); };
  }
  function hookPhaser() {
    var game = window.__phaserGame;
    if (!game || !window.__gameReady || hooked) return;
    var sc = game.scene.getScene("game");
    if (!sc || !sc.walls || !sc.sys.isActive()) return;
    hooked = true; scene = sc;
    var go = function (icon) {
      buildTextures(icon); addTex(sc);
      gfx = sc.add.graphics().setDepth(1650).setBlendMode(1);
      place(sc); wrapScene(sc);
      sc.events.on("postupdate", function () { try { tick(sc); } catch (e) { if (!tick.err) { tick.err = 1; console.warn("sponsor-fx", e); } } });
      sc.events.once("shutdown", function () { hooked = false; brand.clear(); world = []; kit = null; });
      window.__spScene = sc;
    };
    ((document.fonts && document.fonts.ready) || Promise.resolve()).then(function () { return loadImg(ICON_URL); }).then(go);
  }
  window.__spSpawnKit = function () { if (scene) spawnKit(scene, { x: scene.player.x + 120, y: scene.player.y - 40 }); };

  /* ---------- store hooks ---------- */
  var storeHooked = false, prevPhase = null;
  function hookStore() {
    var s = window.__store; if (!s || storeHooked) return;
    storeHooked = true; prevPhase = s.getState().phase;
    s.subscribe(function (n) {
      if (n.phase === prevPhase) return;
      var p = prevPhase; prevPhase = n.phase;
      if (n.phase === "playing" && p !== "paused") highAtStart = n.highScore || 0;
      if (n.phase === "over") {
        tipCard(n.score);
        var good = n.score >= 700 || (n.score > highAtStart && n.score > 0);
        if (good) setTimeout(function () { celebrate(n.score >= 1500 || n.score > highAtStart); }, 350);
      }
      chrome();
    });
  }

  /* ---------- keep the main game's offline fallback clean ----------
     A visitor who already has the main STRØM service worker may load /strom/demo/
     through it once (before the demo SW takes over); that SW stores the last
     navigation under "/strom/". Restore the real main page in that case. */
  function repairMainCache() {
    if (!window.caches || !navigator.onLine) return;
    caches.keys().then(function (keys) {
      keys.filter(function (k) { return /^strom-nb/.test(k); }).forEach(function (k) {
        caches.open(k).then(function (c) {
          return c.match("/strom/").then(function (r) {
            if (!r) return;
            return r.clone().text().then(function (txt) {
              if (txt.indexOf("sponsor.js") === -1) return;
              return fetch("/strom/", { cache: "no-store", credentials: "same-origin" }).then(function (res) { if (res.ok) return c.put("/strom/", res); });
            });
          });
        });
      });
    }).catch(function () {});
  }

  function start() {
    splash();
    setInterval(function () { hookStore(); hookPhaser(); chrome(); }, 400);
    setTimeout(repairMainCache, 5000);
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
