// CLAWBYTE service worker — repeat opens come from cache, code stays fresh.
// index.html is network-first (the newest build always wins; cache only as
// the offline fallback). Assets are cache-first with background refresh.
const CACHE = 'clawbyte-v1';
// A phone is not a hard drive. Cache-first with no ceiling means every asset the
// player ever loads sits on their device forever; this keeps the most recent
// slice and lets the browser re-fetch the rest from the cloud on demand.
const CACHE_MAX = 60;
async function trim() {
  const c = await caches.open(CACHE);
  const keys = await c.keys();
  if (keys.length <= CACHE_MAX) return;
  for (let i = 0; i < keys.length - CACHE_MAX; i++) await c.delete(keys[i]);
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
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
