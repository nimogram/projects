// ==== VERSION管理（ここだけ更新すればOK）====
const VERSION = "v7-20260329";
const STATIC_CACHE = `static-${VERSION}`;

// キャッシュ対象（JS/CSS/画像など）
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// ==== INSTALL ====
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 即時反映

  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ==== ACTIVATE ====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key); // 古いキャッシュ削除
          }
        })
      )
    )
  );
  self.clients.claim(); // 既存ページも更新
});

// ==== FETCH戦略 ====
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // ★① HTMLは常に最新（最重要）
  if (req.mode === "navigate") {
    event.respondWith(fetch(req));
    return;
  }

  // ★② APIなどはネット優先
  if (req.url.includes("/exec")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // ★③ その他はキャッシュ優先（高速化）
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        return caches.open(STATIC_CACHE).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      });
    })
  );
});
