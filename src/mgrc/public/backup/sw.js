// Service Worker
const cacheName = "tarn-os-pwa";
const filesToCache = [
  "/",
  "index.html",
  "images/star.svg",
  'lib/dotdom.js',
  'routes/Auth/script.js',
  'routes/Auth/style.css',
  'tos.js',
  'tos.css'
];

self.addEventListener("install", e => {
  console.log("[ServiceWorker**] Install");
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log("[ServiceWorker**] Caching app shell");
      return cache.addAll(filesToCache);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  //console.log('[Service Worker] Activating Service Worker ...', event);
	event.waitUntil(
		caches.keys()
			.then(function (keyList){
				return Promise.all(keyList.map(function (key){
					if(key!==cacheName){
						return caches.delete(key);
					}
				}));
			})
	);
  return self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(response => {
      return response || fetch(event.request);
    })
  );
});
