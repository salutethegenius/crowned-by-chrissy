const CACHE = "cbc-static-v1";
const ALLOW = ["/icons/", "/media/derived/brand-logo/", "/owner/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/owner") && !url.pathname.includes("manifest")) {
    return;
  }
  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    ALLOW.some((p) => url.pathname.startsWith(p));
  if (!cacheable) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const res = await fetch(event.request);
      if (res.ok) cache.put(event.request, res.clone());
      return res;
    }),
  );
});
