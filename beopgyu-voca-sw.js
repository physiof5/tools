/* 법규보카 서비스 워커.
   이게 있어야 크롬이 '앱 설치'를 띄운다 — 설치하면 주소창 없이 전체 화면으로 뜬다.
   scope를 beopgyu-voca.html 하나로 좁혀 등록하므로, 같은 폴더의 다른 앱은 건드리지 않는다.
   앱이 html 한 장에 다 들어 있어서 그것만 캐시하면 오프라인이 된다.
   네트워크를 먼저 보고 안 되면 캐시로 떨어진다 — 캐시를 먼저 보면 새 판을 올려도 옛 화면이 남는다. */
const CACHE = "beopgyu-voca-v1";
const PAGE  = "beopgyu-voca.html";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(PAGE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match(PAGE)))
  );
});
