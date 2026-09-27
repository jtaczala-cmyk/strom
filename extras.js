/* Extras for the game: leaderboard adapter, sound/vibration, mute toggle, humor.
   Plain classic script, loaded in <head> before the app bundle. */
(function () {
  "use strict";
  var CFG = {
 "game": "strom",
 "lang": "nb",
 "thresholds": [
  0,
  300,
  800,
  1500,
  2200
 ],
 "text": {
  "soundOn": "Lyd på",
  "soundOff": "Lyd av",
  "start": "Ett minutt. Sjefen teller.",
  "random": [
   "Sjefen: dette skulle vært ferdig i går!",
   "Tomt for materialer! Grossisten åpner på mandag.",
   "Noen har «lånt» drillen min igjen …",
   "Verneombudet er her. Se ut som du følger planen.",
   "Hvem lot denne kabelen stå strømførende?!",
   "Basen: ser vater nok ut for meg.",
   "Betongbilen venter ikke på noen!",
   "Tegningene er endret. Igjen.",
   "«Det har alltid vært sånn.» – forrige gjeng",
   "Snart matpause. Kanskje.",
   "Hvem flyttet stillaset?",
   "Leveransen skulle komme kl. 07.00. Nå er klokka 11.30."
  ],
  "hurt": [
   "Au! Det sto ikke i SJA-en.",
   "Spenningstesteren sier: strømførende. Det er deg.",
   "Strømmen tilgir ikke. Ikke sjefen heller."
  ],
  "medkit": [
   "Førstehjelpsskrin! Plaster fikser alt.",
   "HMS-ansvarlig ville vært stolt."
  ],
  "tool": [
   "Nytt verktøy! Du får det tilbake på fredag. Kanskje.",
   "Den som finner, får beholde. Byggeplassregel."
  ],
  "armor": [
   "Hjelmen på. Nå kan mor sove godt i natt."
  ],
  "coffee": [
   "Kaffe fra termosen. +10 motivasjon.",
   "Uten kaffe, ingen byggeplass."
  ],
  "titles": [
   "Lærling med kost",
   "Hjelpemann på prøve",
   "Bas",
   "Elektriker med fagbrev",
   "Legenden i sikringsskapet"
  ],
  "titleLabel": "Tittelen din:",
  "newHigh": "ny rekord! Sjefen smilte nesten.",
  "tips": [
   "Tips: en strømførende kabel biter ikke. Den sparker.",
   "Tips: hjelmen skal på hodet, ikke på albuen.",
   "Tips: vet du ikke hva du skal gjøre? Bær en planke. Da ser du alltid travel ut.",
   "Tips: «snarest» betyr i går.",
   "Tips: frakoble først, heltemot etterpå.",
   "Tips: mål to ganger, kapp én gang, skyld på tegningene."
  ]
 }
};
  var GAME = CFG.game;
  var T = CFG.text;
  var MUTE_KEY = "site-sound-muted";

  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      window.localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function cleanName(n) { return String(n || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 16); }

  /* ---------------- Leaderboard adapter ---------------- */
  var LB_CFG = window.LEADERBOARD_CONFIG || {};
  var SB_URL = String(LB_CFG.supabaseUrl || "").replace(/\/+$/, "");
  var SB_KEY = String(LB_CFG.supabaseKey || LB_CFG.supabasePublishableKey || LB_CFG.supabaseAnonKey || "");
  var ONLINE = !!(SB_URL && SB_KEY && /^https:\/\//.test(SB_URL));
  var LOCAL_KEY = "lb-local-" + GAME;

  function localRows() {
    try { var r = JSON.parse(ls(LOCAL_KEY) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function localAdd(row) {
    var r = localRows();
    r.push({ id: String(Date.now()), name: row.name, score: row.score, kills: row.kills });
    r.sort(function (a, b) { return b.score - a.score; });
    r = r.slice(0, 20);
    ls(LOCAL_KEY, JSON.stringify(r));
    return r;
  }
  function top10(rows) {
    var seen = {}, out = [];
    rows.forEach(function (r) {
      var k = String(r.name).toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      out.push(r);
    });
    return out.slice(0, 10);
  }
  function sbFetch(path, opts) {
    opts = opts || {};
    var h = { apikey: SB_KEY };
    if (/^eyJ/.test(SB_KEY)) h.Authorization = "Bearer " + SB_KEY; // legacy anon JWT only; sb_publishable_ keys go in apikey only
    if (opts.body) { h["Content-Type"] = "application/json"; h.Prefer = "return=minimal"; }
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
    return fetch(SB_URL + "/rest/v1/" + path, { method: opts.method || "GET", headers: h, body: opts.body, signal: ctl ? ctl.signal : undefined })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.status === 204 || opts.body ? null : res.json();
      });
  }
  var lb = {
    online: ONLINE,
    game: GAME,
    list: function () {
      if (!ONLINE) return Promise.resolve(top10(localRows()));
      return sbFetch("scores?select=id,name,score,kills&game=eq." + GAME + "&order=score.desc,created_at.asc&limit=60")
        .then(function (rows) {
          return top10((rows || []).map(function (r) { return { id: r.id, name: r.name, score: r.score, kills: r.kills || 0 }; }));
        })
        .catch(function () { return top10(localRows()); });
    },
    submit: function (d) {
      d = d || {};
      var row = { name: cleanName(d.name), score: Math.max(0, Math.floor(+d.score || 0)), kills: Math.max(0, Math.floor(+d.kills || 0)) };
      if (!row.name) return lb.list();
      localAdd(row);
      if (!ONLINE) return lb.list();
      return sbFetch("scores", { method: "POST", body: JSON.stringify({ game: GAME, name: row.name, score: row.score, kills: row.kills }) })
        .catch(function () { /* keep local copy */ })
        .then(function () { return lb.list(); });
    },
  };
  window.__lb = lb;

  /* ---------------- Web Audio synth ---------------- */
  var ctx = null, master = null;
  function isMuted() {
    var st = window.__store && window.__store.getState && window.__store.getState();
    if (st && typeof st.muted === "boolean") return st.muted;
    return ls(MUTE_KEY) === "1";
  }
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC({ latencyHint: "interactive" }); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state !== "running") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function unlock() {
    var c = audio();
    if (!c) return;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(master); s.start(0); } catch (e) {}
  }
  ["pointerdown", "touchend", "keydown", "click"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  });
  function tone(freq, t0, dur, type, vol, slideTo) {
    var c = ctx; if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function seq(notes, type, vol, step) {
    if (isMuted()) return;
    var c = audio(); if (!c || c.state !== "running") return;
    var t = c.currentTime + 0.01;
    notes.forEach(function (n, i) { if (n) tone(n, t + i * step, step * 1.6, type, vol); });
  }
  var SFX = {
    heal: function () { seq([523, 659, 784, 1047], "triangle", 0.22, 0.07); },
    start: function () { seq([392, 523, 659, 784], "square", 0.12, 0.08); },
    timeUp: function () { seq([784, 659, 523, 392, 330], "square", 0.12, 0.11); },
    fanfare: function () { seq([523, 523, 523, 659, 0, 784, 1047, 1047], "square", 0.13, 0.09); },
    pop: function () { seq([880, 1320], "triangle", 0.08, 0.04); },
    click: function () { seq([1400], "square", 0.06, 0.02); },
  };
  window.__extrasSfx = SFX;
  function vibrate(p) { try { if (!isMuted() && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------------- Humor pop-ups ---------------- */
  var popEl = null, popTimer = 0, lastPop = 0;
  function ensurePop() {
    if (popEl && document.body.contains(popEl)) return popEl;
    popEl = document.createElement("div");
    popEl.id = "extras-pop";
    popEl.setAttribute("role", "status");
    popEl.style.cssText = "position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 178px);transform:translate(-50%,-8px);z-index:60;max-width:min(88vw,360px);padding:9px 14px;border-radius:12px;background:rgba(18,17,15,.88);border:1px solid rgba(45,212,191,.55);color:#f5f1e8;font:600 14px/1.35 'IBM Plex Sans',system-ui,sans-serif;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.45);pointer-events:none;opacity:0;transition:opacity .25s,transform .25s";
    document.body.appendChild(popEl);
    return popEl;
  }
  function popup(text, force) {
    var now = Date.now();
    if (!force && now - lastPop < 4000) return;
    lastPop = now;
    var el = ensurePop();
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transform = "translate(-50%,0)";
    SFX.pop();
    clearTimeout(popTimer);
    popTimer = setTimeout(function () { el.style.opacity = "0"; el.style.transform = "translate(-50%,-8px)"; }, 2800);
  }
  window.__extrasPopup = popup;

  /* ---------------- Mute toggle (home screen) ---------------- */
  var muteBtn = null;
  function renderMute() {
    if (!muteBtn) return;
    var m = isMuted();
    muteBtn.textContent = m ? "\uD83D\uDD07" : "\uD83D\uDD0A";
    muteBtn.setAttribute("aria-label", m ? T.soundOff : T.soundOn);
    muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
  }
  function setMuted(m) {
    ls(MUTE_KEY, m ? "1" : "0");
    var s = window.__store;
    if (s && s.getState().muted !== m) s.setState({ muted: m });
    renderMute();
  }
  function ensureMute() {
    if (muteBtn && document.body.contains(muteBtn)) return;
    muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.id = "extras-mute";
    muteBtn.setAttribute("data-no-stick", "");
    muteBtn.style.cssText = "position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;z-index:60;width:42px;height:42px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(18,17,15,.72);font-size:20px;line-height:40px;text-align:center;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent";
    muteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      setMuted(!isMuted());
      if (!isMuted()) { unlock(); SFX.click(); }
    });
    document.body.appendChild(muteBtn);
    renderMute();
  }

  /* ---------------- Tips on home / intro screens ---------------- */
  var tipIdx = Math.floor(Math.random() * T.tips.length);
  function ensureTip() {
    var btn = document.querySelector(".z-20 button.h-14");
    if (!btn) return;
    var next = btn.nextElementSibling;
    if (next && next.classList && next.classList.contains("extras-tip")) return;
    var old = document.querySelector(".extras-tip");
    if (old) old.remove();
    var p = document.createElement("p");
    p.className = "extras-tip";
    p.style.cssText = "margin:0;max-width:24rem;width:100%;font-size:12px;line-height:1.4;color:#a8a29e;font-style:italic;text-align:inherit";
    p.textContent = T.tips[tipIdx % T.tips.length];
    btn.after(p);
  }
  setInterval(function () {
    tipIdx++;
    var p = document.querySelector(".extras-tip");
    if (p) p.textContent = T.tips[tipIdx % T.tips.length];
  }, 6000);

  /* ---------------- Game-over title ---------------- */
  function titleFor(score) {
    var t = T.titles, th = CFG.thresholds, i = 0;
    for (var k = 0; k < th.length; k++) if (score >= th[k]) i = k;
    return t[i];
  }
  function injectTitle(score, isHigh) {
    var tries = 0;
    (function attempt() {
      var cards = document.querySelectorAll(".z-30");
      var card = null;
      cards.forEach(function (c) { if (!card && /\d/.test(c.textContent || "") && c.querySelector("button")) card = c; });
      var head = card && (card.querySelector("h2") || card.querySelector("h1") || card.querySelector(".font-display"));
      if (!head) { if (tries++ < 30) setTimeout(attempt, 100); return; }
      if (card.querySelector(".extras-title")) return;
      var p = document.createElement("p");
      p.className = "extras-title";
      p.style.cssText = "margin:.5rem 0 0;font:600 15px/1.3 'Oswald','IBM Plex Sans',system-ui,sans-serif;letter-spacing:.04em;color:#2dd4bf";
      p.textContent = T.titleLabel + " " + titleFor(score) + (isHigh ? " \u2014 " + T.newHigh : "");
      head.after(p);
    })();
  }

  /* ---------------- Hook into the game (store + sfx) ---------------- */
  var hooked = false, randomTimer = 0, prev = {}, highAtStart = 0;
  function scheduleRandom() {
    clearTimeout(randomTimer);
    randomTimer = setTimeout(function () {
      var st = window.__store && window.__store.getState();
      if (st && st.phase === "playing") popup(pick(T.random));
      scheduleRandom();
    }, 11000 + Math.random() * 7000);
  }
  function wrap(sfx, name, before) {
    var orig = sfx[name];
    if (typeof orig !== "function" || orig.__wrapped) return;
    var f = function () { try { before.apply(null, arguments); } catch (e) {} return orig.apply(this, arguments); };
    f.__wrapped = true;
    sfx[name] = f;
  }
  function hook() {
    var store = window.__store, sfx = window.__sfx;
    if (!store || !sfx || hooked) return !!hooked;
    hooked = true;
    var saved = ls(MUTE_KEY);
    if (saved === "1" || saved === "0") store.setState({ muted: saved === "1" });
    wrap(sfx, "hurt", function () { vibrate(45); if (Math.random() < 0.35) popup(pick(T.hurt)); });
    wrap(sfx, "pickup", function () { vibrate(15); });
    wrap(sfx, "over", function () { vibrate([90, 50, 140]); });
    wrap(sfx, "zap", function () { vibrate(8); });
    wrap(sfx, "gulp", function () { if (Math.random() < 0.5) popup(pick(T.coffee)); });
    prev = store.getState();
    store.subscribe(function (s) {
      var p = prev; prev = s;
      if (s.muted !== p.muted) { ls(MUTE_KEY, s.muted ? "1" : "0"); renderMute(); }
      if (s.phase !== p.phase) {
        if (s.phase === "playing" && p.phase !== "paused") {
          highAtStart = p.highScore || 0;
          SFX.start();
          setTimeout(function () { popup(T.start, true); }, 1800);
          scheduleRandom();
        }
        if (s.phase === "over") {
          clearTimeout(randomTimer);
          var isHigh = s.score > highAtStart && s.score > 0;
          if (s.endReason === "time") SFX.timeUp();
          if (isHigh) setTimeout(SFX.fanfare, 700);
          injectTitle(s.score, isHigh);
        }
        updateChrome();
      }
      if (s.phase === "playing") {
        if (typeof s.hp === "number" && typeof p.hp === "number" && s.hp > p.hp + 5) { SFX.heal(); vibrate([20, 30, 20]); popup(pick(T.medkit)); }
        if (s.tools && p.tools && s.tools.length > p.tools.length) popup(pick(T.tool));
        if (s.armor && !p.armor) popup(pick(T.armor));
      }
    });
    updateChrome();
    return true;
  }
  function updateChrome() {
    if (!document.body) return;
    var st = window.__store && window.__store.getState();
    var playing = st && (st.phase === "playing" || st.phase === "paused" || st.phase === "over");
    ensureMute();
    muteBtn.style.display = playing ? "none" : "block";
    renderMute();
    if (!playing) ensureTip();
  }
  function tick() {
    if (!hooked) hook();
    if (document.readyState !== "loading") updateChrome();
  }
  // Wait for hydration before touching the DOM.
  var start = function () { setTimeout(function () { tick(); setInterval(tick, 700); }, 1200); };
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
