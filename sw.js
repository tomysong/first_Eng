const CACHE_NAME = "kid-english-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./modules/data.js",
  "./modules/dom.js",
  "./modules/profiles.js",
  "./modules/progress.js",
  "./modules/store.js",
  "./modules/api.js",
  "./modules/tts.js",
  "./modules/chat.js",
  "./modules/parent.js",
  "./modules/garden.js",
  "./modules/stt.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // AI API 호출 등 외부 요청은 캐시하지 않는다
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // 네트워크 우선: 온라인이면 항상 최신 파일, 오프라인이면 캐시로 동작
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
