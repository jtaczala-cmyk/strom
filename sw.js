const CACHE = "strom-v3-gh-strom-v3";
const PRECACHE = ["/strom/", "/strom/favicon.svg", "/strom/apple-touch-icon.png", "/strom/icon-192.png", "/strom/icon-512.png", "/strom/qr.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/strom/api/") || url.pathname.startsWith("/strom/__grok/")) return;

  if (url.pathname.startsWith("/strom/game/") || url.pathname.startsWith("/strom/icon") || url.pathname.startsWith("/strom/splash") || url.pathname === "/strom/favicon.svg" || url.pathname === "/strom/apple-touch-icon.png") {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.mode !== "navigate") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/strom/"))),
  );
});
