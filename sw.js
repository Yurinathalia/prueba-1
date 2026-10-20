const CACHE_NAME = "epq-directorio-v10";
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
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(APP_SHELL.map(async (url) => {
        const versionedUrl = new URL(url);
        versionedUrl.searchParams.set("v", CACHE_NAME);
        const response = await fetch(versionedUrl.href, { cache: "reload" });
        if (!response.ok) {
          throw new Error(`No se pudo descargar ${url} para actualizar la aplicación.`);
        }
        await cache.put(url, response);
      }));
    })
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
