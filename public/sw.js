/**
 * Service Worker - 离线支持和缓存策略
 * 版本: 1.0.0
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `script-app-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
  // API 请求：网络优先
  api: /\/api\//,
  // 图片：缓存优先，过期时间 7 天
  images: /\.(png|jpg|jpeg|gif|webp|svg)$/,
};

// 缓存过期时间（毫秒）
const CACHE_EXPIRATION = {
  static: 30 * 24 * 60 * 60 * 1000, // 30 天
  api: 5 * 60 * 1000, // 5 分钟
  images: 7 * 24 * 60 * 60 * 1000, // 7 天
};

/**
 * 安装事件 - 预缓存静态资源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // 强制激活新的 Service Worker
      return self.skipWaiting();
    })
  );
});

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

/**
 * 获取事件 - 处理网络请求
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }
  
  // 根据请求类型选择缓存策略
  if (CACHE_STRATEGIES.static.test(url.pathname)) {
    // 静态资源：缓存优先
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.api.test(url.pathname)) {
    // API 请求：网络优先
    event.respondWith(networkFirst(request));
  } else if (CACHE_STRATEGIES.images.test(url.pathname)) {
    // 图片：缓存优先
    event.respondWith(cacheFirst(request));
  } else {
    // 其他：网络优先
    event.respondWith(networkFirst(request));
  }
});

/**
 * 缓存优先策略
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // 检查缓存是否过期
    const cacheTime = await getCacheTime(request.url);
    const now = Date.now();
    
    if (cacheTime && now - cacheTime < CACHE_EXPIRATION.static) {
      console.log('[SW] 缓存命中:', request.url);
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
      await setCacheTime(request.url, Date.now());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] 网络失败，使用缓存:', request.url);
    return cached || new Response('离线状态', { status: 503 });
  }
}

/**
 * 网络优先策略
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request);
    
    // 缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
      await setCacheTime(request.url, Date.now());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] 网络失败，尝试缓存:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response('离线状态', { status: 503 });
  }
}

/**
 * 获取缓存时间
 */
async function getCacheTime(url) {
  const cache = await caches.open(`${CACHE_NAME}-meta`);
  const response = await cache.match(url);
  
  if (response) {
    const data = await response.json();
    return data.time;
  }
  
  return null;
}

/**
 * 设置缓存时间
 */
async function setCacheTime(url, time) {
  const cache = await caches.open(`${CACHE_NAME}-meta`);
  const response = new Response(JSON.stringify({ time }));
  await cache.put(url, response);
}

/**
 * 消息事件 - 处理客户端消息
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/**
 * 后台同步事件
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * 同步数据
 */
async function syncData() {
  console.log('[SW] 后台同步数据...');
  // 这里可以实现数据同步逻辑
}

/**
 * 推送通知事件
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || '您有新的消息',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '剧本创作系统', options)
  );
});

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] Service Worker 已加载', CACHE_VERSION);
