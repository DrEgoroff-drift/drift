/* Игра как приложение: тот же рецепт, что у птицы (parrot-sw.js), только
   файл один и большой. Сеть первой — игра обновляется с каждой выкладкой;
   кэш — страховка, чтобы поставленный на рабочий стол «Дрейф» открывался
   и без сети. Имя кэша версионировано: сменилось — старый выметается. */
const CACHE = "drift-1";
const FILES = ["/play.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* Кэшируем только саму игру: api.php — это учётные записи и сохранения,
   их ответы устаревают мгновенно и в кэше им делать нечего. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || u.pathname !== "/play.html") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put("/play.html", copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match("/play.html"))
  );
});
