// Guarda la app la primera vez. Después abre siempre desde lo guardado, con o sin internet,
// y actualiza en segundo plano: una versión nueva nunca interrumpe, llega en la siguiente apertura.
const CACHE = 'manto-v4';
const FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // 'reload' y 'no-cache' esquivan la caché del navegador: GitHub Pages la deja 10 minutos y se guardaría lo viejo.
  const fresh = FILES.map(f => new Request(f, {cache: 'reload'}));
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(fresh)).then(() => self.skipWaiting()));
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
    const fresh = fetch(req.url, {cache: 'no-cache'}).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    });
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved; }
    return fresh;
  }));
});
