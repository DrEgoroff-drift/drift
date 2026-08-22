/* Птица должна жить и без сети — иначе «поставил на рабочий стол» превращается
   в ярлык на страницу, которая однажды не откроется.
   Кэш простой и версионированный: меняется имя — старый выметается целиком. */
const CACHE = "treplo-1";
const FILES = ["/parrot.html?pet=1", "/parrot.html", "/site.css", "/sky.js", "/favicon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Сеть первой, кэш — страховка: так птица обновляется сама, но не пропадает,
   когда сети нет. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/parrot.html")))
  );
});
