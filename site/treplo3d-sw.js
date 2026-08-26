/* Птица должна открываться и без сети: иначе «поставил на рабочий стол» —
   это ярлык на страницу, которая однажды не откроется.
   Кэш версионированный: сменилось имя — старый выметается целиком. */
const CACHE = "treplo3d-1";
const FILES = ["/treplo3d.html?pet=1", "/treplo3d.html", "/icons/parrot-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* сеть первой, кэш — страховка: птица обновляется сама, но не пропадает */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/treplo3d.html")))
  );
});
