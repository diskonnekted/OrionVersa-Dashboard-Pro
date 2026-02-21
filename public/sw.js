const CACHE_NAME = "orionversa-cache-v1";
const URLS_TO_CACHE = ["/portal", "/logo.png", "/orion-light.png", "/logo-banjarnegara.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;
      return fetch(request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return networkResponse;
        })
        .catch(() => caches.match("/portal"));
    })
  );
});

