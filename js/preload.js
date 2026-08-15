// ROOM-GRAPH PREFETCH — the art for where she can GO, fetched before she goes.
//
// THE PROBLEM. media.js is a lazy map: a sheet is fetched the first time
// something asks for it, and the asking happens inside draw(), on the frame the
// room appears. On a desk that is invisible — the file is local and the frame
// after it is fine. On a phone on mobile data it is the guardian arriving a
// second into its own fight, or the floor of a room painting in after she has
// already walked across it.
//
// THE SHAPE OF THE PACKAGE decides the whole strategy, so it is worth writing
// down (measured 2026-08-15, tools/roomassets.cjs):
//
//     total package        132 MB
//     music + video        100 MB   <- NEVER preloaded. See below.
//     images                32 MB   <- this is the entire problem space
//       boot set          11.6 MB   (22 sheets, shared by everything)
//       per-room art      18.9 MB   (spread over 43 rooms, 24 of which add none)
//       heaviest room      3.6 MB   (A10)
//
// SO: three quarters of the package is streamed. Music goes through <audio> and
// is never decoded (audio.js learned that the hard way — decodeAudioData turned
// 2 MB into 60 MB resident), and video is played straight off disk. Preloading
// either would spend a phone's data plan on bytes the streamer is about to
// fetch anyway. This prefetcher touches IMAGES ONLY, and the whole image set is
// 32 MB — small enough that on a good connection the correct end state is
// simply "all of it", which is what makes the full experience possible at all.
//
// THE ALGORITHM is breadth-first over the room graph, which the game already
// has: ROOMS[id].exits is an adjacency list. From the room she is standing in,
// rooms one door away are fetched first, then two, then three. Distance in
// doors is a far better predictor than distance in metres or order in the file,
// and it is exact — there is no heuristic to tune.
//
// Priority, in order:
//   0  the current room            — if it is somehow missing, it blocks nothing
//                                    else; it is already being fetched lazily
//   1  rooms 1 door away           — she can be there in seconds
//   2  rooms 2..depth doors away   — the near future
//   3  everything else             — only on a connection that can afford it
//
// WHAT STOPS IT. A prefetcher that runs while the game needs the network or the
// main thread is a downgrade, so it yields to:
//   - a live boss fight (bandwidth and CPU belong to the fight)
//   - room transitions (the one moment latency is visible)
//   - Save-Data, 2g and 3g (policy below)
// and it never runs more than a couple of requests at once, because a phone
// opening twelve sockets is slower than one opening two.
//
// WHAT IT DOES NOT DO: evict. The whole image set is 32 MB and the browser can
// drop decoded frames under pressure by itself; throwing sheets away to save
// memory would risk a pop-in exactly like the one this exists to remove, in
// exchange for a saving nobody measured. If that ever changes, measure first.

const PRE = {
  q: [],            // [key, priority] — sorted, deduped
  seen: {},         // keys already queued or fetched
  inflight: 0,
  max: 2,           // concurrent image requests
  depth: 3,         // how many doors ahead
  far: true,        // fetch the rest of the game once the near set is done
  on: true,
  started: 0,
};

// CONNECTION POLICY. Cellular data is somebody's money, so the depth shrinks
// with the connection and Save-Data turns the whole thing off but for the next
// door. A packaged app pays nothing — the files are already on the device — so
// it prefetches everything immediately and the only cost is decode time.
function preloadPolicy() {
  // Capacitor / desktop shell: assets are local, there is no data plan to spend
  const packaged = (typeof window !== 'undefined') &&
    (!!window.Capacitor || location.protocol === 'file:' || location.protocol === 'capacitor:');
  if (packaged) return { depth: 99, far: true, max: 4 };
  const c = (typeof navigator !== 'undefined') &&
    (navigator.connection || navigator.mozConnection || navigator.webkitConnection);
  if (!c) return { depth: 3, far: true, max: 2 };            // unknown: assume desktop-ish
  if (c.saveData) return { depth: 1, far: false, max: 1 };   // they asked. Respect it.
  const t = c.effectiveType || '4g';
  if (t === 'slow-2g' || t === '2g') return { depth: 1, far: false, max: 1 };
  if (t === '3g') return { depth: 2, far: false, max: 2 };
  return { depth: 3, far: true, max: 2 };
}

// Rooms within `depth` doors, breadth-first, returned with their distance.
function preloadNear(from, depth) {
  if (typeof ROOMS === 'undefined' || !ROOMS[from]) return [];
  const dist = { [from]: 0 }, out = [[from, 0]], q = [from];
  while (q.length) {
    const id = q.shift(), d = dist[id];
    if (d >= depth) continue;
    const ex = ROOMS[id] && ROOMS[id].exits;
    for (const k in ex) {
      const n = ex[k];
      if (!ROOMS[n] || dist[n] !== undefined) continue;
      dist[n] = d + 1; out.push([n, d + 1]); q.push(n);
    }
  }
  return out;
}

function preloadPush(key, pri) {
  if (!key || PRE.seen[key]) return;
  if (typeof mediaHas === 'function' && mediaHas(key)) { PRE.seen[key] = 1; return; }
  PRE.seen[key] = 1;
  PRE.q.push([key, pri]);
}

// Called when a room loads. Rebuilds the queue around where she is now.
function preloadRoom(roomId) {
  const M = (typeof window !== 'undefined') && window.ROOM_ASSETS;
  if (!M || !PRE.on) return;
  const P = preloadPolicy();
  PRE.depth = P.depth; PRE.far = P.far; PRE.max = P.max;
  // a re-sort rather than a reset: anything already queued keeps its place in
  // `seen`, so walking back and forth between two rooms does not re-enqueue
  for (const [id, d] of preloadNear(roomId, PRE.depth)) {
    const r = M.rooms[id];
    if (!r) continue;
    for (const k of r.keys) preloadPush(k, d);
  }
  if (PRE.far) {
    for (const id in M.rooms) for (const k of M.rooms[id].keys) preloadPush(k, 9);
  }
  PRE.q.sort((a, b) => a[1] - b[1]);
}

// Is now a good moment to spend a request and a decode?
function preloadIdle() {
  if (typeof G === 'undefined') return false;
  if (G.state !== 'PLAY') return false;          // menus, dialogue, the film
  if (G.trans) return false;                     // mid-transition: the visible moment
  if (typeof bossActive === 'function' && bossActive()) return false;
  return true;
}

function preloadTick() {
  if (!PRE.on || !PRE.q.length || PRE.inflight >= PRE.max) return;
  if (!preloadIdle()) return;
  const M = (typeof window !== 'undefined') && window.ROOM_ASSETS;
  const src = (typeof MEDIA_SRC !== 'undefined') && MEDIA_SRC.images;
  if (!src) return;
  while (PRE.q.length && PRE.inflight < PRE.max) {
    const [key] = PRE.q.shift();
    const url = src[key];
    if (!url) continue;
    if (typeof mediaHas === 'function' && mediaHas(key)) continue;
    PRE.inflight++;
    // Going through the lazy map rather than around it: mediaFetch() is what
    // owns the pending set, the onload bookkeeping and the tile-repaint hook,
    // and a second loader racing it would fetch some sheets twice.
    try { mediaFetch(key); } catch (e) {}
    // mediaFetch has no completion callback, so the slot is freed on a short
    // timer. This is a THROTTLE, not a tracker: its only job is to stop the
    // queue emptying itself into the network in one frame.
    setTimeout(() => { PRE.inflight = Math.max(0, PRE.inflight - 1); }, 220);
  }
}
