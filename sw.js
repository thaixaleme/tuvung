// Service Worker: lưu các file của web vào máy để dùng khi không có mạng.
// Khi sửa web và upload lại: tăng số phiên bản ở CACHE (v1 -> v2 ...).
const CACHE = 'tuvung-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Có mạng: lấy bản mới nhất (và cập nhật bộ nhớ). Mất mạng / mạng chậm quá 3 giây: dùng bản đã lưu.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const fromCache = () => caches.match(e.request, { ignoreSearch: true })
    .then(r => r || caches.match('./index.html'));
  const fromNet = fetch(e.request).then(r => {
    if (r.ok) {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return r;
  });
  const timeout = new Promise((_, reject) => setTimeout(reject, 3000));
  e.respondWith(
    Promise.race([fromNet, timeout]).catch(() => fromCache().then(r => r || fromNet))
  );
});
