/* Гармония Рациона — офлайн-сервис-воркер (stale-while-revalidate) */
const CACHE = "kaloriyka-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  
  // Страницы healthcheck не кэшируем
  if (url.pathname.startsWith("/api/")) return;
  
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      
      return cached || network;
    })()
  );
});
