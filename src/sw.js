// Service Worker for 宠乐到家 PWA
const CACHE_NAME = 'chongle-v2';
const RUNTIME_CACHE = 'chongle-runtime';
const urlsToCache = [
  '/',
  '/static/manifest.json',
  '/static/logo.png',
  '/static/favicon.ico',
  '/src/main.ts',
  '/pages/home/index',
  '/pages/publish/index',
  '/pages/orders/index',
  '/pages/profile/index',
  '/pages/message/index',
  '/pages/wallet/index'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 处理API请求 - 网络优先策略
  if (url.pathname.includes('/api/') || url.pathname.includes('/rest/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 缓存成功的响应
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时返回缓存
          return caches.match(request);
        })
    );
    return;
  }
  
  // 处理静态资源 - 缓存优先策略
  if (request.destination === 'image' || 
      url.pathname.includes('.css') || 
      url.pathname.includes('.js') ||
      url.pathname.includes('/static/')) {
    
    // 特殊处理favicon - 总是从网络获取
    if (url.pathname.includes('favicon')) {
      event.respondWith(fetch(request));
      return;
    }
    
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 处理页面导航 - 网络优先，回退到缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(response => {
            return response || caches.match('/').then(response => {
              return response || Response.error();
            });
          });
        })
    );
    return;
  }
  
  // 默认策略 - 网络优先
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});