var TILT_KEY = 'strom_tilt_v1';
/* Optional tilt steering (DeviceOrientation). Off by default; touch stays the default. Test build only. */
var TILT = (function () {
  var K = typeof TILT_KEY === 'string' ? TILT_KEY : 'tilt_v1';
  var T = { on: false, have: false, rx: 0, ry: 0, x0: 0, y0: 0, cal: true, ix: 0, iy: 0, last: 0, granted: false, ang: -1, dz: 3, full: 18, onchange: null, lt: 0 };
  try { T.on = localStorage.getItem(K) === '1'; } catch (e) {}
  function scrAngle() { var a = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0); return ((a % 360) + 360) % 360; }
  function dz(v) { var a = Math.abs(v); if (a <= T.dz) return 0; return (v < 0 ? -1 : 1) * Math.min(1, (a - T.dz) / (T.full - T.dz)); }
  window.addEventListener('deviceorientation', function (e) {
    if (e.beta == null || e.gamma == null) return;
    var b = e.beta, gm = e.gamma, a = scrAngle(), x, y;
    // x: tilt right = +, y: top edge away from you (forward) = - ; same feel in portrait and landscape
    if (a === 90) { x = b; y = -gm; } else if (a === 270) { x = -b; y = gm; } else if (a === 180) { x = -gm; y = -b; } else { x = gm; y = b; }
    if (T.cal || T.ang !== a) { T.x0 = x; T.y0 = y; T.cal = false; T.ang = a; }   // calibrate: current angle = neutral (also after rotating the phone)
    T.rx = x - T.x0; T.ry = y - T.y0; T.have = true; T.last = Date.now();
  });
  T.active = function () { return T.on && T.have && Date.now() - T.last < 1000; };
  T.update = function (dt) { // smoothing; dt in s (if omitted, measured)
    if (dt == null) { var n = (window.performance ? performance.now() : Date.now()); dt = T.lt ? Math.min(0.1, (n - T.lt) / 1000) : 0.016; T.lt = n; }
    var k = Math.min(1, dt * 10), act = T.active();
    T.ix += ((act ? dz(T.rx) : 0) - T.ix) * k; T.iy += ((act ? dz(T.ry) : 0) - T.iy) * k;
  };
  T.calibrate = function () { T.cal = true; T.ix = T.iy = 0; };
  T.set = function (on) { T.on = on; try { localStorage.setItem(K, on ? '1' : '0'); } catch (e) {} if (T.onchange) T.onchange(); };
  T.perm = function (cb) { var D = window.DeviceOrientationEvent;
    if (!D) { cb(false, 'tiltNone'); return; }
    if (T.granted || typeof D.requestPermission !== 'function') { T.granted = true; cb(true); return; }
    try { D.requestPermission().then(function (r) { T.granted = r === 'granted'; cb(T.granted, 'tiltDenied'); }).catch(function () { cb(false, 'tiltDenied'); }); } catch (e) { cb(false, 'tiltDenied'); } };
  T.toggle = function (msg) { // must run inside a tap (iOS permission prompt)
    if (T.on) { T.set(false); msg(''); return; }
    T.perm(function (ok, why) { if (ok) { T.calibrate(); T.set(true); msg(''); setTimeout(function () { if (T.on && !T.have) { T.set(false); msg('tiltNone'); } }, 1500); } else { T.set(false); msg(why); } });
  };
  T.ensure = function (msg) { // remembered ON from an earlier visit: iOS needs the permission again, asked on the "play" tap
    if (T.on && !T.granted) T.perm(function (ok, why) { if (!ok) { T.set(false); msg(why); } });
  };
  T.L = {
    no: { tilt: 'Styr med vipping', calib: 'Kalibrer', on: 'PÅ', off: 'AV', tiltDenied: 'Ingen tilgang til bevegelsessensor – berøring brukes.', tiltNone: 'Fant ingen bevegelsessensor – berøring brukes.', tiltCal: 'Kalibrert: denne vinkelen er nøytral.' },
    pl: { tilt: 'Steruj pochyleniem', calib: 'Kalibruj', on: 'WŁ.', off: 'WYŁ.', tiltDenied: 'Brak dostępu do czujnika ruchu – używam dotyku.', tiltNone: 'Nie znaleziono czujnika ruchu – używam dotyku.', tiltCal: 'Skalibrowano: ten kąt jest neutralny.' },
    en: { tilt: 'Tilt control', calib: 'Calibrate', on: 'ON', off: 'OFF', tiltDenied: 'Motion sensor access denied – using touch.', tiltNone: 'No motion sensor found – using touch.', tiltCal: 'Calibrated: this angle is neutral.' }
  };
  return T;
})();
/* Tilt toggle on the title screen (outside the React tree, added after hydration) */
(function () {
  var LG = ({ nb: 'no', no: 'no', pl: 'pl', en: 'en' })[(document.documentElement.lang || 'en').slice(0, 2)] || 'en';
  var S = TILT.L[LG];
  var SUB = { no: 'Vipp mobilen for å gå – dra og STRØM-knappen virker som før', pl: 'Pochyl telefon, by chodzić – przeciąganie i przycisk PRĄD działają jak dotąd', en: 'Tilt the phone to walk – drag and the POWER button still work' }[LG];
  var BC = 'flex items-center justify-center gap-2 rounded-md border border-border bg-surface/80 px-3 py-2.5 text-sm text-fg';
  function msg(k) { var el = document.getElementById('tiltMsg'); if (el) { el.textContent = k ? S[k] : ''; el.hidden = !k; } }
  function upd() { var b = document.getElementById('tiltBtn'); if (!b) return; b.textContent = S.tilt + ': ' + (TILT.on ? S.on : S.off); b.setAttribute('aria-pressed', TILT.on ? 'true' : 'false'); b.style.borderColor = TILT.on ? '#fbbf24' : ''; document.getElementById('tiltCal').hidden = !TILT.on; }
  TILT.onchange = upd;
  function build() {
    var box = document.createElement('div'); box.id = 'tiltBox'; box.className = 'flex w-full max-w-sm flex-col items-stretch gap-1';
    box.innerHTML = '<div style="display:flex;gap:8px"><button type="button" id="tiltBtn" class="' + BC + '" style="flex:1"></button><button type="button" id="tiltCal" class="' + BC + '" hidden></button></div><p class="text-xs text-subtle" style="margin:0">' + SUB + '</p><p id="tiltMsg" role="status" class="text-xs" style="color:#fbbf24;margin:0" hidden></p>';
    box.querySelector('#tiltCal').textContent = S.calib;
    box.querySelector('#tiltBtn').addEventListener('click', function (e) { e.stopPropagation(); TILT.toggle(msg); });
    box.querySelector('#tiltCal').addEventListener('click', function (e) { e.stopPropagation(); TILT.calibrate(); msg('tiltCal'); });
    return box;
  }
  function place() { var m = document.getElementById('qrl-more'); if (m && !document.getElementById('tiltBox')) { m.appendChild(build()); upd(); } }
  document.addEventListener('click', function () { TILT.ensure(msg); }, true);   // iOS: re-ask on the next tap (e.g. Start) if remembered ON
  (function wait() { if (!window.__gameReady) { setTimeout(wait, 200); return; } place(); new MutationObserver(place).observe(document.body, { childList: true, subtree: true }); })();
})();
