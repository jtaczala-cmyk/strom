/*! Copyright (c) 2026 Jacek Mariusz Taczała. All rights reserved.
 *  Proprietary and not open source: no copying, modification, distribution or commercial use
 *  without prior written permission. Contact: kontakt (at) stop60.no. See LICENSE.
 *  Third-party open-source components keep their own licences, see THIRD-PARTY-NOTICES.md. */
const CACHE = "strom-demo-v19";
const ASSETS = "strom-demo-assets-v1"; /* long-lived: survives version bumps (assets are renamed / ?v= versioned when they change) */
const BASE = "/strom/demo/";
const PRECACHE = [BASE, BASE + "favicon.svg", BASE + "apple-touch-icon.png", BASE + "icon-192.png", BASE + "icon-512.png", BASE + "qr.png", BASE + "extras.js", BASE + "config.js", BASE + "fonts/fonts.css", BASE + "fonts/ibm-plex-sans-latin.woff2", BASE + "fonts/ibm-plex-sans-latin-ext.woff2", BASE + "fonts/oswald-latin.woff2", BASE + "fonts/oswald-latin-ext.woff2", BASE + "sponsor.js", BASE + "sponsor-fx.js", BASE + "hms-fx.js"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" })))).catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("strom-demo-") && k !== CACHE && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Pages/HTML and the SW-adjacent files: always network first, bypassing the HTTP cache.
  const isDoc = req.mode === "navigate" || url.pathname === BASE || url.pathname.endsWith(".html") || url.pathname.endsWith(".webmanifest") || url.pathname.endsWith("/config.js") || url.pathname.endsWith("/extras.js") || url.pathname.endsWith("/sponsor.js") || url.pathname.endsWith("/sponsor-fx.js") || url.pathname.endsWith("/hms-fx.js");
  if (isDoc) {
    event.respondWith(
      fetch(req.url, { cache: "no-store", credentials: "same-origin" })
        .then((res) => {
          if (res.ok && url.pathname === BASE) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(BASE, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(BASE))),
    );
    return;
  }

  // Versioned game images and icons: cache first.
  const p = url.pathname.slice(BASE.length - 1);
  if (p.startsWith("/game/") || p.startsWith("/fonts/") || p.startsWith("/icon") || p.startsWith("/splash") || p === "/favicon.svg" || p === "/apple-touch-icon.png" || p === "/qr.png") {
    event.respondWith(
      caches.open(ASSETS).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Everything else (hashed JS/CSS): network first, cache as offline fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
