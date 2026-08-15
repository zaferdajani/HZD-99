// CLAWBYTE service worker — repeat opens come from cache, code stays fresh.
// index.html is network-first (the newest build always wins; cache only as
// the offline fallback). Assets are cache-first with background refresh.
const CACHE = 'clawbyte-v2';
// TWO BUCKETS, BECAUSE THE PACKAGE IS TWO DIFFERENT PROBLEMS.
//
// Measured 2026-08-15: 111 art files totalling 32 MB, and 125 music/video files
// totalling 100 MB. One cache with one ceiling put those in competition, and the
// streams won every time — a handful of 4 MB tracks would evict the entire art
// set, so the next open re-downloaded sheets the prefetcher had already paid
// for. On mobile data that is the same bytes bought twice.
//
// So art and streams are counted separately:
//   ART     all of it fits, and it is what the game needs to LOOK right. Held.
//   STREAM  4 MB each and played through once. A handful of recent ones is all
//           the value there is; the rest re-fetch on demand as they always did.
const CACHE_MAX_ART = 130;      // > the 111 that exist: the whole art set stays
const CACHE_MAX_STREAM = 6;     // ~24 MB of the most recently heard/seen
const STREAM_RE = /\.(m4a|ogg|mp3|wav|mp4|webm|mov)$/i;
async function trim() {
  const c = await caches.open(CACHE);
  const keys = await c.keys();
  const stream = [], art = [];
  for (const k of keys) (STREAM_RE.test(k.url) ? stream : art).push(k);
  // insertion order, so the oldest of each kind goes first
  for (let i = 0; i < stream.length - CACHE_MAX_STREAM; i++) await c.delete(stream[i]);
  for (let i = 0; i < art.length - CACHE_MAX_ART; i++) await c.delete(art[i]);
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // drop the old single-bucket cache, or its 60 mixed entries sit there forever
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const isCode = req.mode === 'navigate' || /(^|\/)index\.html$/.test(url.pathname);
  if (isCode) {
    // 'reload' skips the BROWSER's own HTTP cache on the way out. GitHub Pages
    // serves the page with ten minutes of freshness, so without this a player
    // who opens the link right after a deploy can still be handed the previous
    // build by their own browser, before this worker ever sees the network.
    e.respondWith(
      fetch(req, { cache: 'reload' }).catch(() => fetch(req)).then((r) => {
        if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
        return r;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
  } else {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((r) => {
          if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)).then(trim); }
          return r;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
