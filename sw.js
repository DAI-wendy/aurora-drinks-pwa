/* ============================================================
   極光特調 Aurora Drinks — Service Worker
   改版時請把 VERSION 加一，使用者就會收到「有新版本」提示
   ============================================================ */
const VERSION = 'v1.1.0';

const PRECACHE = `aurora-shell-${VERSION}`;
const RUNTIME  = `aurora-runtime-${VERSION}`;
const FONTS    = `aurora-fonts-${VERSION}`;
const IMAGES   = `aurora-images-${VERSION}`;

const CURRENT_CACHES = [PRECACHE, RUNTIME, FONTS, IMAGES];

/* 應用程式外殼：安裝時就抓下來，之後完全離線可用 */
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/app.css',
  './css/fontawesome/all.min.css',
  './css/fontawesome/webfonts/fa-solid-900.woff2',
  './css/fontawesome/webfonts/fa-regular-400.woff2',
  './css/fontawesome/webfonts/fa-brands-400.woff2',
  './js/app.js',
  './js/pwa.js',
  './js/supabase-config.js',
  './js/supabase.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/* 不攔截的網域（分析工具需即時上傳） */
const BYPASS_HOSTS = [
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
  'stats.g.doubleclick.net'
];

/* ============================================================
   安裝
   ============================================================ */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    // 逐一加入，避免單一檔案失敗導致整批 addAll 失敗
    await Promise.all(PRECACHE_URLS.map(url =>
      cache.add(new Request(url, { cache: 'reload' }))
        .catch(err => console.warn('[SW] 預先快取失敗：', url, err))
    ));
  })());
});

/* ============================================================
   啟用：清掉舊版快取
   ============================================================ */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('aurora-') && !CURRENT_CACHES.includes(k))
          .map(k => caches.delete(k))
    );

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

/* ============================================================
   訊息：立即套用新版本
   ============================================================ */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ============================================================
   快取策略
   ============================================================ */

/** 快取優先：靜態資源、圖片 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }
  return response;
}

/** 先用快取再背景更新：字型、CDN 資源 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || network || Response.error();
}

/** 網路優先：HTML 頁面（確保拿到最新內容，離線時退回快取）*/
async function networkFirst(request, cacheName, preloadPromise) {
  const cache = await caches.open(cacheName);

  try {
    const preloaded = preloadPromise ? await preloadPromise : null;
    const response = preloaded || await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request) || await caches.match('./index.html');
    if (cached) return cached;
    return caches.match('./offline.html');
  }
}

/* ============================================================
   攔截請求
   ============================================================ */
self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 分析工具與 Supabase API 直接放行（資料必須即時，不能吃快取）
  if (BYPASS_HOSTS.includes(url.hostname)) return;
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) return;

  // 非 http(s)（例如 chrome-extension）不處理
  if (!url.protocol.startsWith('http')) return;

  // 1) 頁面導覽 → 網路優先
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME, event.preloadResponse));
    return;
  }

  // 2) Google Fonts → 先快取再背景更新
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }

  // 3) 同網域資源
  if (url.origin === self.location.origin) {
    // 商品圖片
    if (request.destination === 'image') {
      event.respondWith(
        cacheFirst(request, IMAGES).catch(() => caches.match('./icons/icon-192.png'))
      );
      return;
    }
    // CSS / JS / 字型 / manifest
    event.respondWith(staleWhileRevalidate(request, PRECACHE));
    return;
  }

  // 4) 其他跨網域資源 → 先快取再背景更新
  event.respondWith(staleWhileRevalidate(request, RUNTIME));
});

/* ============================================================
   背景同步（離線訂單）
   實務上這裡會呼叫後端 API；Demo 僅通知前端進行補送
   ============================================================ */
self.addEventListener('sync', event => {
  if (event.tag !== 'sync-orders') return;

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientList.forEach(client => client.postMessage({ type: 'FLUSH_ORDERS' }));
  })());
});
