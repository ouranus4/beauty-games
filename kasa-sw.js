/* Каса майстра — офлайн.
   Сторінку беремо з мережі, а без мережі — з кешу; стилі, скрипти
   й картинки — з кешу, якщо там саме ця версія. */
var CACHE = 'bg-kasa-v2';
var CORE = ['kasa.html', 'kasa.css', 'kasa.js', 'styles.css', 'squid.css', 'assets/logo-horizontal.svg', 'assets/kasa-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('bg-kasa-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('kasa.html', copy); });
      return res;
    }).catch(function () { return caches.match('kasa.html'); }));
    return;
  }
  /* Посилання з ?v=хеш — точний збіг у кеші завжди свіжий. Нема збігу —
     йдемо в мережу; без мережі віддаємо будь-яку збережену версію. */
  e.respondWith(caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res.ok && (url.origin === location.origin || url.hostname.indexOf('fonts.') === 0)) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return caches.match(req, { ignoreSearch: true }); });
  }));
});
