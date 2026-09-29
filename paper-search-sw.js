/* 논문 서칭 · 송쌤 전용 서비스워커
   - 이 도구 주소(paper-search.html 또는 확장자 없는 paper-search) 범위로만 등록됩니다. 같은 사이트의 다른 송쌤 도구는 건드리지 않습니다.
   - 크롬이 「설치」를 띄우는 조건이고, 인터넷이 끊겼을 때 마지막으로 연 화면을 보여 줍니다.
   - 항상 인터넷에서 먼저 받아옵니다(네트워크 우선). 파일을 새로 올리면 바로 새 버전이 열립니다.
   - 캐시 이름은 songssaem-paper-로 시작하며, 정리할 때도 자기 캐시만 지웁니다.
   - 구글(Gemini)·PubMed 요청에는 관여하지 않습니다. */
const PREFIX = 'songssaem-paper-';
const CACHE  = PREFIX + 'v1';
const PAGE   = new URL('paper-search.html', self.location).href;

self.addEventListener('install', e => {
  e.waitUntil(
    fetch(PAGE).then(r => r.ok ? caches.open(CACHE).then(c => c.put(PAGE, new Response(r.body, {status: r.status, statusText: r.statusText, headers: r.headers}))) : null)
      .catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;   /* 화면(페이지) 열기만 담당 */
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(PAGE, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(PAGE).then(hit => hit || Response.error()))
  );
});
