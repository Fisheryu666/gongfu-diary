// 功夫日记 Service Worker：离线可用
// 策略：HTML 网络优先（保证用户总能拿到最新版本），静态资源缓存优先（带哈希，永久安全）
// 注意：CACHE 版本号每次发布递增，旧缓存会在激活时清除 —— 不影响 localStorage 里的日记数据
const CACHE = 'gongfu-diary-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add('./')));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // 页面导航：网络优先，离线时回退缓存
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put('./', copy));
          }
          return resp;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // 静态资源（JS/CSS/图标带哈希）：缓存优先，未命中则网络并写入缓存
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request).then((resp) => {
          if (resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return resp;
        })
    )
  );
});
