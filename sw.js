const CACHE_NAME = "epq-directorio-v8";
const APP_ROOT = new URL("./", self.registration.scope);
const APP_SHELL = [
  "",
  "index.html",
  "pages/empleados.html",
  "pages/estadisticas.html",
  "pages/cumpleanos.html",
  "pages/dependencias.html",
  "styles/styles.css",
  "js/config.js",
  "js/api.js",
  "js/buscar.js",
  "js/estadisticas.js",
  "js/pwa.js",
  "manifest.webmanifest",
  "assets/epq%20logo.png",
  "assets/pwa-icon-192.png",
  "assets/pwa-icon-512.png"
].map((path) => new URL(path, APP_ROOT).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("epq-directorio-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match(APP_ROOT.href);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          );
        }
        return response;
      });
    })
  );
});
