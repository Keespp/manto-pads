// Guarda la app la primera vez. Después abre siempre desde lo guardado, con o sin internet,
// y actualiza en segundo plano: una versión nueva nunca interrumpe, llega en la siguiente apertura.
const CACHE = 'manto-v1';
const FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './' : req;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(key);
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    });
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  }));
});
