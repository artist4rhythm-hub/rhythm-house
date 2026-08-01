// 리듬 하우스 서비스 워커
// 앱 셸을 캐시해서 빠르게 열리게 하고, PWA 설치 요건을 충족합니다.
// Firebase 데이터는 캐시하지 않고 항상 네트워크로 갑니다 (실시간성 유지).

const CACHE_NAME = 'rhythm-house-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 앱 셸 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 활성화: 옛 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Firebase·구글 API는 캐시하지 않음 (항상 네트워크)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('firestore')) {
    return; // 기본 네트워크 동작
  }

  // 앱 셸: 네트워크 우선, 실패 시 캐시 (항상 최신 유지하되 오프라인 대비)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공하면 캐시 갱신
        if (e.request.method === 'GET' && res.ok && url.origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});
