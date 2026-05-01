// Conta Clara Lite — Service Worker leve
// Estratégia NetworkFirst para HTML (sem ficar preso a versão antiga)
// e CacheFirst para assets estáticos versionados (hash no nome).

const VERSION = "v1";
const STATIC_CACHE = `cc-static-${VERSION}`;
const HTML_CACHE = `cc-html-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => ![STATIC_CACHE, HTML_CACHE].includes(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Só lida com mesma origem
  if (url.origin !== self.location.origin) return;

  // Nunca cachear endpoints sensíveis
  if (
    url.pathname.startsWith("/auth") ||
    url.pathname.includes("supabase") ||
    url.pathname.startsWith("/functions/")
  ) {
    return;
  }

  // HTML / navegações: NetworkFirst com fallback de cache
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch (_e) {
          const cached = await caches.match(req);
          return cached || caches.match("/");
        }
      })()
    );
    return;
  }

  // Assets estáticos: CacheFirst
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|css|js)$/i)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (_e) {
          return cached || Response.error();
        }
      })()
    );
  }
});

// Permite ao app pedir update imediato
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
