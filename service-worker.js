self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // CORS�w�b�_�[�̐ݒ�
  event.waitUntil(
    caches.open('my-cache').then(cache => {
      return cache.addAll([
        '/index.html',  // �K�v�ȃt�@�C����ǉ�
        // ���ɃL���b�V���������t�@�C��������΂����ɒǉ�
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
