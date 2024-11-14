self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // CORSヘッダーの設定
  event.waitUntil(
    caches.open('my-cache').then(cache => {
      return cache.addAll([
        '/index.html',  // 必要なファイルを追加
        // 他にキャッシュしたいファイルがあればここに追加
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const headers = new Headers(response.headers);
      headers.append('Cross-Origin-Opener-Policy', 'same-origin');
      headers.append('Cross-Origin-Embedder-Policy', 'require-corp');
      
      return new Response(response.body, { 
        status: response.status, 
        statusText: response.statusText, 
        headers: headers 
      });
    })
  );
});
