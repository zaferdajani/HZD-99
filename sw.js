// Build-scoped, app-scoped offline cache. Other apps on this origin are not ours.
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const PREFIX = 'clawbyte:' + SCOPE_PATH + ':';
const CACHE = PREFIX + VERSION;
const STREAM_RE = /\.(m4a|ogg|mp3|wav|mp4|webm|mov)$/i;
async function store(request, response) {
  // A 206 response is not a complete movie and Cache.put rejects it.
  if (!response || response.status !== 200 || response.type === 'opaque') return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
    const keys=await cache.keys(); const media=[],art=[];
    for (const k of keys) (STREAM_RE.test(new URL(k.url).pathname)?media:art).push(k);
    for (const k of media.slice(0,Math.max(0,media.length-6))) await cache.delete(k);
    for (const k of art.slice(0,Math.max(0,art.length-400))) await cache.delete(k);
  } catch (_) { /* Quota/private browsing must not turn a successful fetch into failure. */ }
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async()=>{
  for (const key of await caches.keys())
    if ((key.startsWith(PREFIX) && key !== CACHE) || key === 'clawbyte-v2') await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req=e.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE_PATH)) return;
  // Let the origin/browser stream and seek correctly. Do not try to assemble
  // partial media responses into an offline movie cache.
  if(req.headers.has('Range')) return;
  const code=req.mode==='navigate'||/\.(html|js|json)$/.test(url.pathname);
  e.respondWith((async()=>{
    // Cache Storage can be denied independently of network access.
    let hit=null;
    try { const cache=await caches.open(CACHE); hit=await cache.match(req,code?{ignoreSearch:true}:undefined); } catch (_) {}
    if(hit&&!code) return hit;
    try {
      const response=await fetch(req,code?{cache:'no-cache'}:undefined);
      if(response.status===200) e.waitUntil(store(req,response.clone()));
      if(!response.ok&&hit) return hit;
      return response;
    } catch (_) {
      return hit || new Response('This file is not available offline. Reconnect and retry.',{
        status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
