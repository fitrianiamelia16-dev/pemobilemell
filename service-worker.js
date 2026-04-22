const CACHE_NAME = "moia-pwa-v3"; // Saya ubah versinya ke v3 agar cache lama terhapus
const BASE_URL = self.registration.scope;

const urlsToCache = [
  `${BASE_URL}`,
  `${BASE_URL}index.html`,
  `${BASE_URL}offline.html`, // Pastikan file ini ada di folder root
  `${BASE_URL}assets/style.css`,
  `${BASE_URL}manifest.json`,
  `${BASE_URL}icons/icon-192x192-A.png`, // File ini disesuaikan dengan index.html
];

// Install Service Worker & simpan file ke cache
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Membuka cache dan menyimpan aset utama");
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error("Cache gagal dimuat:", err))
  );
});

// Aktivasi dan hapus cache lama
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Menghapus cache lama:", key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event: cache-first untuk file lokal
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // Abaikan request non-GET dan protokol browser
  if (url.protocol.startsWith("chrome-extension")) return;
  if (request.method !== "GET") return;

  // File lokal (statis)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(response => {
        return (
          response ||
          fetch(request).catch(() => {
            // Jika gagal fetch, arahkan ke offline.html
            if (request.headers.get("accept").includes("text/html")) {
              return caches.match(`${BASE_URL}offline.html`);
            }
          })
        );
      })
    );
  } 
});