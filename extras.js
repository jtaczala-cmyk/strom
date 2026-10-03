/*! Copyright (c) 2026 Stop60. All rights reserved.
 *  Proprietary and not open source: no copying, modification, distribution or commercial use
 *  without prior written permission. Contact: kontakt (at) stop60.no. See LICENSE.
 *  Third-party open-source components keep their own licences, see THIRD-PARTY-NOTICES.md. */
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
   "Regel 1: frakoble – fra alle steder anlegget kan få spenning.",
   "Regel 2: sikre mot innkobling – lås og merk.",
   "Regel 3: kontroller at anlegget er spenningsløst – alle faser.",
   "Regel 4: jord og kortslutt – alltid ved høyspenning, ved lavspenning etter risikovurdering.",
   "Regel 5: beskytt mot spenningssatte deler nær arbeidsstedet.",
   "Hver jobb har en utpekt ansvarlig for arbeidet (AFA) eller leder for sikkerhet (LFS).",
   "Før jobben: risikovurdering og sikker jobbanalyse (SJA).",
   "Test spenningstesteren rett før og rett etter bruk.",
   "Kan det frakobles? Jobb spenningsløst. AUS krever egen opplæring og prosedyre.",
   "Kan det ikke gjøres sikkert? Stopp jobben og si fra.",
   "Meld avvik og nestenulykker – hver gang.",
   "Før innkobling: varsle alle, fjern jordingen, alle ut av anlegget."
  ],
  "hurt": [
   "Bryt strømmen først",
   "113 – ambulanse"
  ],
  "medkit": [
   "Førstehjelp – øv årlig",
   "Hjertestarter – vet du hvor?"
  ],
  "tool": [
   "Sjekk isolasjonen",
   "Riktig spenningstester"
  ],
  "armor": [
   "Verneutstyr på",
   "Hjelm, briller, hansker",
   "Ødelagt utstyr? Bytt det",
   "Vernesko – alltid på",
   "Vernehansker – alltid på"
  ],
  "coffee": [
   "Trøtt? Ta pause",
   "Etter pause: sjekk låsene"
  ],
  "titles": [
   "Lærling med kost",
   "Hjelpemann på prøve",
   "Bas",
   "Elektriker med fagbrev",
   "Legenden i sikringsskapet"
  ],
  "titleLabel": "Tittelen din:",
  "newHigh": "ny rekord! På jobb: sikkerhet før tempo.",
  "tips": [
   "Prinsipp: de fem sikkerhetsreglene – frakoble, sikre mot innkobling, kontrollere spenningsløshet, jorde og kortslutte, beskytte mot spenningssatte deler nær arbeidsstedet.",
   "Prinsipp: alltid minst to sikkerhetsbarrierer – svikter én, skal den andre fortsatt beskytte deg fullt ut.",
   "Prinsipp: klare roller – driftsansvarlig for anlegget, ansvarlig for arbeidet (AFA) eller leder for sikkerhet (LFS) for jobben.",
   "Prinsipp: før arbeidet – innhent opplysninger om anlegget, gjør risikovurdering og SJA.",
   "Prinsipp: test spenningstesteren rett før og rett etter spenningskontrollen.",
   "Spillet erstatter ikke FSE-kurset. FSE- og førstehjelpsopplæring hvert år (maks 12 måneder mellom)."
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

  /* ---------------- Leaderboard adapter (online: Supabase REST, fallback: this device) ---------------- */
  var LB_CFG = window.LEADERBOARD_CONFIG || {};
  var SB_URL = String(LB_CFG.supabaseUrl || "").replace(/\/+$/, "");
  var SB_KEY = String(LB_CFG.supabaseKey || LB_CFG.supabasePublishableKey || LB_CFG.supabaseAnonKey || "");
  var ONLINE = !!(SB_URL && SB_KEY && /^https:\/\//.test(SB_URL));
  var LOCAL_KEY = "lb-local-" + GAME;
  function optedOut() { return ls("lb-online-consent") !== "1"; } /* GDPR: online only after the player ticked the box */
  var MAX_SCORE = GAME === "strom-demo" ? 7500 : 6000, MAX_KO = 48;

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
  /* Client-side name check (the database checks the same and more). */
  var NAME_RE = /^[0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźżÆØÅæøåÄÖÜäöüÉÈÁéèáß][0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźżÆØÅæøåÄÖÜäöüÉÈÁéèáß _.'-]*$/;
  var BAD_SUB = ["kurw","chuj","pierdol","pierdal","jeban","jebac","jebie","zajeb","wyjeb","pizd","dziwk","szmat","kutas","cwel","ruchac",
    "faen","fitte","fitta","hestkuk","jaevel","jaevla","fanden","rasshol","rasshul","drittsekk","neger",
    "fuck","shit","cunt","bitch","pussy","whore","nigg","faggot","asshole","bastard","retard","hitler","penis","porn","twat","dildo","wanker"];
  var BAD_WORD = ["huj","cipa","fiut","pedal","debil","dupa","ciota","murzyn","kuk","kukk","pikk","hore","javel","javla","soper",
    "fuk","fck","dick","cock","fag","rape","rapist","ass","sex","cum","tits","slut","nazi","wank","kkk","heil"];
  function norm(s) {
    s = String(s).toLowerCase().replace(/æ/g, "ae").replace(/ß/g, "ss");
    var F = "ąćęłńóśźżøåäöüéèêáàâíìîúùûýçñ0134578@$!|", T = "acelnoszzoaaoueeeaaaiiiuuuycnoieastbasii", o = "";
    for (var i = 0; i < s.length; i++) { var j = F.indexOf(s[i]); o += j < 0 ? s[i] : T[j]; }
    return o;
  }
  function dd(s) { return s.replace(/(.)\1+/g, "$1"); }
  function nameBlocked(n) {
    var x = norm(n), c = x.replace(/[^a-z]/g, ""), cd = dd(c);
    var w = x.split(/[^a-z]+/).filter(Boolean), wd = w.map(dd);
    for (var i = 0; i < BAD_SUB.length; i++) if (c.indexOf(BAD_SUB[i]) >= 0 || cd.indexOf(dd(BAD_SUB[i])) >= 0) return true;
    for (var k = 0; k < BAD_WORD.length; k++) {
      var b = BAD_WORD[k];
      if (w.indexOf(b) >= 0 || wd.indexOf(dd(b)) >= 0 || c === b || cd === dd(b)) return true;
    }
    return false;
  }
  function onlineName(n) {
    n = String(n || "").replace(/\s+/g, " ").trim();
    return n.length >= 2 && n.length <= 16 && NAME_RE.test(n) && !/\s\s/.test(n) && !nameBlocked(n) ? n : "";
  }
  function sbFetch(path, opts) {
    opts = opts || {};
    var h = { apikey: SB_KEY };
    if (/^eyJ/.test(SB_KEY)) h.Authorization = "Bearer " + SB_KEY; // legacy anon JWT only; sb_publishable_ keys go in apikey only
    if (opts.body) { h["Content-Type"] = "application/json"; h.Prefer = "return=minimal"; }
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
    return fetch(SB_URL + "/rest/v1/" + path, { method: opts.method || "GET", headers: h, body: opts.body, signal: ctl ? ctl.signal : undefined, credentials: "omit", referrerPolicy: "no-referrer" })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.status === 204 || opts.body ? null : res.json();
      }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  var pend = null; /* own score while it is being sent / if it could not be sent */
  function sendTry(body, n) {
    return sbFetch("scores", { method: "POST", body: body }).catch(function (e) {
      var st = +(String(e && e.message).match(/HTTP (\d+)/) || [])[1] || 0;
      if (n >= 2 || (st >= 400 && st < 500 && st !== 429 && st !== 408)) throw e;   /* rejected for good: don't retry */
      return new Promise(function (r) { setTimeout(r, (n + 1) * 2500 + Math.random() * 2500); }).then(function () { return sendTry(body, n + 1); });
    });
  }
  function withPend(rows) {
    if (!pend) return rows;
    var r = rows.filter(function (x) { return !(x.name === pend.name && x.score === pend.score); });
    r.push({ id: "pend", name: pend.name + (pend.failed ? " · ikke sendt" : " · sendes…"), score: pend.score, kills: pend.kills });
    r.sort(function (a, b) { return b.score - a.score; });
    return r.slice(0, 10);
  }
  var lb = {
    online: ONLINE,
    game: GAME,
    list: function () {
      if (!ONLINE) { lb.online = false; return Promise.resolve(top10(localRows())); }
      return sbFetch("scores?select=id,name,score,ko&game=eq." + encodeURIComponent(GAME) + "&order=score.desc,created_at.asc&limit=100")
        .then(function (rows) {
          lb.online = true;
          return withPend(top10((rows || []).map(function (r) { return { id: r.id, name: r.name, score: r.score, kills: r.ko || 0 }; })));
        })
        .catch(function () { lb.online = false; return top10(localRows()); });
    },
    submit: function (d) {
      d = d || {};
      var row = { name: cleanName(d.name), score: Math.max(0, Math.floor(+d.score || 0)), kills: Math.max(0, Math.floor(+d.kills || 0)) };
      if (!row.name) return lb.list();
      localAdd(row);
      if (!ONLINE) return lb.list();
      var nm = onlineName(row.name);
      if (optedOut() || !nm || row.score > MAX_SCORE || row.kills > MAX_KO) { pend = { name: row.name, score: row.score, kills: row.kills, failed: true }; return lb.list(); }
      var st = window.__store && window.__store.getState && window.__store.getState();
      var body = { game: GAME, name: nm, score: row.score, ko: row.kills };
      if (st && typeof st.wave === "number" && st.wave >= 0 && st.wave <= 6) body.wave = Math.floor(st.wave);
      var mine = pend = { name: nm, score: row.score, kills: row.kills, failed: false };
      return new Promise(function (res) { setTimeout(res, Math.random() * 15000); })   /* spread peaks */
        .then(function () { return sendTry(JSON.stringify(body), 0); })
        .then(function () { if (pend === mine) pend = null; }, function () { mine.failed = true; })
        .then(function () { return lb.list(); });
    },
    nameOk: onlineName,
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
  window.__extrasAudio = function () { return ctx ? { ctx: ctx, out: master } : null; };
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
    if (force && now < (window.__smBusyUntil || 0)) { setTimeout(function () { popup(text, true); }, window.__smBusyUntil - now + 80); return; }
    if (!force && now - lastPop < 4000) return; if (!force && now < (window.__smBusyUntil || 0)) return;
    lastPop = now;
    var el = ensurePop();
    el.textContent = text;
    el.style.opacity = "1";
    el.style.transform = "translate(-50%,0)";
    SFX.pop();
    clearTimeout(popTimer);
    popTimer = setTimeout(function () { el.style.opacity = "0"; el.style.transform = "translate(-50%,-8px)"; }, Math.min(6000, 2800 + Math.max(0, String(text).length - 40) * 45));
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
    muteBtn.style.cssText = "position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;z-index:60;width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(18,17,15,.72);font-size:20px;line-height:40px;text-align:center;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent";
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
      if (false) popup(pick(T.random));
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
          /* start pop-up removed (onboarding: one text at a time) */
          scheduleRandom();
        }
        if (s.phase === "over") {
          clearTimeout(randomTimer);
          if (popEl) { clearTimeout(popTimer); popEl.style.opacity = "0"; }
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

/* ---- legal footer + optional cookie-free analytics (added 2026-09-30) ---- */
(function () {
  "use strict";
  var FOOT = "© 2026 Stop60 · Alle rettigheter forbeholdt";
  function phase() { var s = window.__store && window.__store.getState && window.__store.getState(); return s && s.phase; }
  var el = null;
  function foot() {
    if (!document.body) return;
    if (!el || !document.body.contains(el)) {
      el = document.createElement("p");
      el.id = "legal-foot";
      el.textContent = FOOT + " \u00b7 ";
      var a = document.createElement("a");
      a.id = "legal-priv"; a.href = "/strom/personvern/"; a.textContent = "Personvern";
      a.style.cssText = "color:inherit;text-decoration:underline;text-underline-offset:2px;pointer-events:auto;display:inline-block;padding:16px 8px;margin:-16px -8px";
      el.appendChild(a);
      el.appendChild(document.createElement("br"));
      var g = document.createElement("span"); g.textContent = "Created with Grok"; el.appendChild(g);
      el.style.cssText = "position:fixed;left:0;right:0;bottom:0;margin:0;padding:3px 8px calc(env(safe-area-inset-bottom,0px) + 3px);background:linear-gradient(to top,rgba(18,17,15,.92),rgba(18,17,15,.72));z-index:55;text-align:center;font:400 10px/1.2 'IBM Plex Sans',system-ui,sans-serif;letter-spacing:.02em;color:rgba(245,241,232,.55);pointer-events:none;user-select:none";
      document.body.appendChild(el);
    }
    var p = phase();
    el.style.display = (p === "playing" || p === "paused" || p === "over") ? "none" : "block";
  }
  /* Analytics: off unless window.ANALYTICS_CONFIG.goatcounter (config.js) holds a GoatCounter code. */
  var A = window.ANALYTICS_CONFIG || {};
  var GC = String(A.goatcounter || "").trim().toLowerCase();
  var GAME = (function () { var m = location.pathname.match(/^\/([^/]+(?:\/demo)?)\//); return m ? m[1].replace("/", "-") : "game"; })();
  var on = /^[a-z0-9][a-z0-9-]{1,49}$/.test(GC);
  if (on) {
    var s = document.createElement("script");
    s.async = true; s.src = "/" + GAME.replace("-demo", "/demo") + "/count.js"; /* self-hosted copy of GoatCounter count.js (ISC) */
    s.setAttribute("data-goatcounter", "https://" + GC + ".goatcounter.com/count");
    (document.head || document.documentElement).appendChild(s);
  }
  function ev(name) {
    if (!on) return;
    setTimeout(function () { evNow(name); }, Math.random() * 15000);
  }
  function evNow(name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: GAME + "-" + name, title: GAME + " " + name, event: true }); } catch (e) {}
  }
  window.__track = ev;
  var hooked = false, last;
  function tick() {
    foot();
    var st = window.__store;
    if (!hooked && st && st.subscribe) {
      hooked = true; last = st.getState().phase;
      st.subscribe(function (x) {
        if (x.phase === last) return;
        var prev = last; last = x.phase; foot();
        if (x.phase === "playing" && prev !== "paused") ev("start");
        if (x.phase === "over") ev("finish");
      });
    }
  }
  var go = function () { setTimeout(function () { tick(); setInterval(tick, 700); }, 1200); };
  if (document.readyState === "complete") go(); else window.addEventListener("load", go);
})();
/* ---- leaderboard notice (privacy, 2026-09-30) ---- */
(function () {
  "use strict";
  var TXT = "Kallenavnet og resultatet vises på den offentlige topplisten på nett. Ikke bruk fullt navn eller e-post.", LINK = "Personvern", BOX = "Vis resultatet mitt på topplisten på nett", HREF = "/strom/personvern/", KEY = "lb-online-off";
  function on() { return !!(window.__lb && window.__lb.online !== undefined && (window.LEADERBOARD_CONFIG || {}).supabaseUrl); }
  function tick() {
    if (!on()) return;
    document.querySelectorAll('input[maxlength="16"]').forEach(function (inp) {
      var lab = inp.closest("label") || inp;
      var nx = lab.nextElementSibling;
      if (nx && nx.classList && nx.classList.contains("lb-note")) return;
      var d = document.createElement("div");
      d.className = "lb-note";
      d.style.cssText = "width:100%;max-width:24rem;margin:-2px 0 0;font:400 11px/1.4 'IBM Plex Sans',system-ui,sans-serif;color:#a8a29e;text-align:left";
      var p = document.createElement("p"); p.style.margin = "0";
      p.appendChild(document.createTextNode(TXT + " "));
      var a = document.createElement("a"); a.href = HREF; a.textContent = LINK;
      a.style.cssText = "color:#2dd4bf;text-decoration:underline;text-underline-offset:2px;display:inline-block;padding:15px 6px;margin:-15px -6px";
      p.appendChild(a); d.appendChild(p);
      var l = document.createElement("label");
      l.style.cssText = "display:flex;align-items:center;gap:10px;margin-top:0;min-height:44px;cursor:pointer";
      var c = document.createElement("input"); c.type = "checkbox"; c.className = "lb-opt";
      var on = false; try { on = window.localStorage.getItem("lb-online-consent") === "1"; } catch (e) {}
      c.checked = on; c.style.cssText = "width:22px;height:22px;accent-color:#2dd4bf;margin:0;flex:none";
      c.addEventListener("change", function () {
        try { window.localStorage.setItem(KEY, c.checked ? "0" : "1"); window.localStorage.setItem("lb-online-consent", c.checked ? "1" : "0"); } catch (e) {}
        document.querySelectorAll(".lb-opt").forEach(function (o) { o.checked = c.checked; });
      });
      l.appendChild(c); l.appendChild(document.createTextNode(BOX)); d.appendChild(l);
      lab.after(d);
    });
  }
  var st = function () { tick(); setInterval(tick, 600); };
  if (document.readyState === "complete") setTimeout(st, 300); else window.addEventListener("load", function () { setTimeout(st, 300); });
})();
/* ---- end leaderboard notice ---- */
/* ---- tech fixes 2026-10-01: photosensitivity-safe flashes, touch/desktop hints, WebP probe, touch targets ---- */
(function () {
  "use strict";
  var mqR = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)"), reduced = !!(mqR && mqR.matches);
  try { mqR.addEventListener("change", function () { reduced = mqR.matches; }); } catch (e) {}
  var TOUCH = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  window.__hmsTouch = TOUCH;
  document.documentElement.classList.add(TOUCH ? "hms-touch" : "hms-desk");
  (function () { var im = new Image(); im.onload = function () { window.__hmsWebp = im.width === 1; }; im.onerror = function () { window.__hmsWebp = false; };
    im.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"; })();
  document.addEventListener("error", function (e) { var t = e.target; if (t && t.tagName === "IMG" && /\/title-art\.webp/.test(t.src || "")) t.src = t.src.replace("title-art.webp", "title-art.png"); }, true);
  /* one global flash gate: max 2 flashes/s, none under reduced motion */
  var lastFlash = -1e9, flashEl = null; window.__hmsFlashN = 0;
  window.__flashGate = function () { if (reduced) return false; var n = performance.now(); if (n - lastFlash < 500) return false; lastFlash = n; window.__hmsFlashN++; return true; };
  window.__hmsReduced = function () { return reduced; };
  function softFlash(r, gr, b, ms) { /* subtle full-screen tint, alpha 0.16 max */
    if (!window.__flashGate() || !document.body) return;
    if (!flashEl || !document.body.contains(flashEl)) { flashEl = document.createElement("div"); flashEl.id = "hms-flash"; flashEl.style.cssText = "position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0"; document.body.appendChild(flashEl); }
    flashEl.style.transition = "none"; flashEl.style.background = "rgb(" + (r | 0) + "," + (gr | 0) + "," + (b | 0) + ")"; flashEl.style.opacity = ".16"; void flashEl.offsetWidth;
    flashEl.style.transition = "opacity " + Math.max(160, ms || 0) + "ms ease-out"; flashEl.style.opacity = "0";
  }
  var css = document.createElement("style");
  css.textContent = "html:root{--color-subtle:#a39e97;--color-muted:#bdb7ae}" +
    "html:not(.hms-touch) .hms-touch-only{display:none!important}html.hms-touch .hms-desk-only{display:none!important}" +
    ".hms-tap{min-height:44px;min-width:44px;padding:0 16px}" +
    ".z-20 button:has(svg.lucide-share),.z-20 button:has(svg.lucide-smartphone),.goscroll button:has(svg.lucide-share),.z-30 button:has(svg.lucide-share){min-height:44px}" +
    "@media (prefers-reduced-motion:reduce){#hms-flash{display:none!important}}";
  (document.head || document.documentElement).appendChild(css);
  function hookScene() {
    var game = window.__phaserGame; if (!game || !window.__gameReady) return;
    var sc = game.scene.getScene("game"); if (!sc || !sc.sys.isActive() || sc.__hmsFx) return;
    sc.__hmsFx = true;
    var cam = sc.cameras.main, oShake = cam.shake;
    cam.flash = function (d, r, gr, b) { softFlash(r, gr, b, d); return cam; };
    cam.shake = function () { if (reduced) return cam; return oShake.apply(cam, arguments); };
    sc.events.on("postupdate", function () { try { if (reduced) { sc.trauma = 0; if (sc.cameras.main.rotation) sc.cameras.main.setAngle(0); } } catch (e) {} });
  }
  window.__hmsFx = { flashes: function () { return window.__hmsFlashN; } };
  setInterval(hookScene, 400);
})();
/* ---- end tech fixes 2026-10-01 ---- */
