// 学伴 Service Worker — 离线缓存支持
const CACHE_NAME = 'studybuddy-v1';

const PRE_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/ai.js',
  '/js/render.js',
  '/js/app.js',
  '/js/modules/dashboard.js',
  '/js/modules/courses.js',
  '/js/modules/notes.js',
  '/js/modules/errors.js',
  '/js/modules/resume.js',
  '/js/modules/codecheck.js',
  '/js/modules/interview.js',
  '/js/modules/career.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRE_CACHE).catch(err => {
        console.warn('[SW] Pre-cache partial failure:', err.message);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 不缓存 API 请求
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 先尝试网络，失败再用缓存
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        return cached || new Response('离线模式 — 请连接网络后重试', { status: 503 });
      });
    })
  );
});
