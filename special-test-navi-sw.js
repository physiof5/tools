/* 스페셜 테스트 내비 · 송쌤 전용 서비스워커 (v3 MVP)
   - 이 페이지(special-test-navi.html) 범위로만 등록됩니다. 같은 사이트의 다른 송쌤 도구는 건드리지 않습니다.
   - 크롬이 「앱 설치」를 띄우는 조건이고, 인터넷이 끊겼을 때 마지막으로 연 화면을 보여 줍니다.
   - 항상 인터넷에서 먼저 받아옵니다(네트워크 우선). 파일을 새로 올리면 바로 새 버전이 열립니다.
     단, 인터넷이 3초 넘게 응답하지 않으면 저장된 화면을 먼저 열고 새 버전은 뒤에서 저장합니다(병원 지하·약한 와이파이 대비).
   - 캐시 이름은 songssaem-stnavi-로 시작하며, 정리할 때도 자기 캐시만 지웁니다.
   - 글꼴(jsdelivr)·유튜브 요청에는 관여하지 않습니다. */
const PREFIX  = 'songssaem-stnavi-';
const CACHE   = PREFIX + 'v3';
const PAGE    = new URL('special-test-navi.html', self.location).href;
const SLOW_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(PAGE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.indexOf(PREFIX) === 0 && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;   /* 화면(페이지) 열기만 담당 */
  const net = fetch(req);
  /* 새로 받은 화면은 오프라인용으로 저장 */
  e.waitUntil(net.then(res => {
    if (res && res.ok) {
      const copy = res.clone();
      return caches.open(CACHE).then(c => c.put(PAGE, copy));
    }
  }).catch(() => {}));
  e.respondWith(new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    net.then(finish, () => caches.match(PAGE).then(hit => finish(hit || Response.error())));
    /* 인터넷이 느리면 저장된 화면을 먼저 */
    setTimeout(() => { caches.match(PAGE).then(finish, () => {}); }, SLOW_MS);
  }));
});
