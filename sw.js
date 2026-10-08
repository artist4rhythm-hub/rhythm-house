// 리듬 하우스 서비스 워커
// 앱 껍데기만 캐시하고, 예약 데이터(Firebase)는 항상 네트워크에서 가져옵니다.

const CACHE = 'rhythm-house-v13';
const SHELL = ['./index.html', './board.html', './manifest.json', './logo.png',
               './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase·구글·CDN 요청은 건드리지 않는다 (실시간 데이터 유지)
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;

  // 네트워크 우선, 실패하면 캐시 (오프라인 대비)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
