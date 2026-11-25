// THE SMALL LIFE OF A PLACE.
//
// Owner, 2026-11-25: "add insects proper to the place or the screen, distributed in caves and the
// game all around, like butterflies, like um, dragonflies near swamps in the swamp area. These insects
// will add richer environment to the background. They are not NPCs, they're just flying away. We
// can't interact with them. And they're small."
//
// So: a handful of insects per room, chosen by what the room IS — butterflies over the meadows,
// dragonflies over the swamp, moths in the caves and the Nest — drawn small, behind the level (with
// the room's plants, js/game.js drawFlora), and they fly off when she comes close. Nothing collides
// with them, nothing can hit them, nothing counts them. Each kind is one small generated picture
// (assets/fx/insects/, Higgsfield, archived in assets/source/insects/); the wings beat in code by
// folding the picture about its body, so one picture is a whole flight. At most eight per room and
// no allocation per frame: it costs nothing a phone would notice.
const INSECT_KIND = {
  // h: drawn height px · spd: cruising px/s · flap: wingbeats/s · how: the way it flies
  butterfly: { key: 'bugButterfly', h: 9, spd: 30, flap: 9, how: 'flutter' },
  dragonfly: { key: 'bugDragonfly', h: 8, spd: 70, flap: 26, how: 'dart' },
  moth: { key: 'bugMoth', h: 7, spd: 34, flap: 14, how: 'jitter' },
};
// what lives where: [kind, how many]
function insectSet(id, def) {
  if (!def || def.indoor || (typeof isHero === 'function' && isHero())) return [];
  if (def.mus === 'swamp') return [['dragonfly', 4], ['butterfly', 1]];
  const z = def.zone, cave = /^CV|^V/.test(id) || z === 'X';
  if (cave) return [['moth', 3]];
  if (z === 'A') return def.sky ? [['butterfly', 4]] : [['butterfly', 2], ['moth', 1]];
  if (z === 'E') return [['moth', 3]];
  if (z === 'B') return def.sky ? [['butterfly', 2]] : [['moth', 2]];
  return [];                                   // the Foundry burns and the Archives are frozen
}
const INSECTS = { room: null, list: [] };

function insectImg(key) {
  if (typeof mediaFetch === 'function') mediaFetch(key);
  const im = typeof MEDIA_IMG !== 'undefined' ? MEDIA_IMG[key] : null;
  return im && im.naturalWidth ? im : null;
}
function insectAir(x, y) {
  if (typeof tileAt !== 'function') return true;
  const ch = tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
  return !(ch === '#' || ch === '=' || ch === 'B');
}
// a place in the open air of this room, away from her (they are seen arriving, never popping in)
function insectSpot(q, far) {
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  for (let i = 0; i < 24; i++) {
    const x = 20 + Math.random() * (W - 40), y = 20 + Math.random() * (H * 0.72);
    if (!insectAir(x, y) || !insectAir(x, y + 10)) continue;
    if (far && typeof player !== 'undefined' && player && Math.abs(x - player.x) < 260) continue;
    q.x = x; q.y = y; return true;
  }
  return false;
}
function insectTarget(q) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 110;
    const x = q.x + Math.cos(a) * r, y = q.y + Math.sin(a) * r * 0.6;
    if (insectAir(x, y) && y > 16 && y < G.roomDef.h * TILE - 24) { q.tx = x; q.ty = y; return; }
  }
  q.tx = q.x; q.ty = q.y - 30;
}
function insectsFor() {
  if (INSECTS.room === G.roomId) return INSECTS.list;
  INSECTS.room = G.roomId; INSECTS.list.length = 0;
  const lowTier = typeof QUAL !== 'undefined' && !QUAL.glow;
  for (const [k, n] of insectSet(G.roomId, G.roomDef)) {
    insectImg(INSECT_KIND[k].key);
    for (let i = 0; i < (lowTier ? Math.ceil(n / 2) : n); i++) {
      const q = { k, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ph: Math.random() * 6.3, t: Math.random() * 2, flee: 0, hold: 0, face: 1 };
      if (insectSpot(q, false)) { insectTarget(q); INSECTS.list.push(q); }
    }
  }
  return INSECTS.list;
}

function updateInsects(dt) {
  if (!G.roomDef || G.state !== 'PLAY') return;
  const list = insectsFor(); if (!list.length) return;
  const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
  const px = player ? player.x + player.w / 2 : -1e9, py = player ? player.y + player.h / 2 : -1e9;
  for (const q of list) {
    const K = INSECT_KIND[q.k]; q.ph += dt * K.flap * Math.PI * 2; q.t -= dt;
    // she comes close: it is gone, up and away from her
    const dx = q.x - px, dy = q.y - py, d = Math.hypot(dx, dy);
    if (d < 64 && q.flee <= 0) { q.flee = 1.4; const s = Math.max(110, K.spd * 3.2) / (d || 1); q.vx = dx * s; q.vy = Math.min(-K.spd * 1.5, dy * s - K.spd); }
    if (q.flee > 0) {
      q.flee -= dt; q.vy -= 20 * dt;
      if (q.flee <= 0) insectTarget(q);
    } else {
      const ex = q.tx - q.x, ey = q.ty - q.y, e = Math.hypot(ex, ey);
      if (e < 8 || q.t <= 0) { insectTarget(q); q.t = 1.5 + Math.random() * 2.5; }
      let sp = K.spd;
      if (K.how === 'dart') {                                   // hover, then a straight dash
        if (q.hold > 0) { q.hold -= dt; sp = 4; } else if (e < 14) q.hold = 0.4 + Math.random() * 0.9;
        sp = q.hold > 0 ? 4 : K.spd * 2.2;
      }
      const want = e > 0 ? sp / e : 0, steer = K.how === 'dart' ? 9 : 2.6;
      q.vx += (ex * want - q.vx) * Math.min(1, dt * steer);
      q.vy += (ey * want - q.vy) * Math.min(1, dt * steer);
      if (K.how === 'flutter') q.vy += Math.sin(q.ph * 0.18) * 40 * dt;           // the bob of a wingbeat
      if (K.how === 'jitter') { q.vx += (Math.random() - 0.5) * 300 * dt; q.vy += (Math.random() - 0.5) * 300 * dt; }
    }
    const nx = q.x + q.vx * dt, ny = q.y + q.vy * dt;
    // against rock it slides along it (a fleeing wing does not bounce back toward her)
    if (insectAir(nx, ny)) { q.x = nx; q.y = ny; }
    else if (insectAir(nx, q.y)) { q.x = nx; q.vy *= -0.3; }
    else if (insectAir(q.x, ny)) { q.y = ny; q.vx *= -0.3; }
    else { q.vx *= -0.5; q.vy *= -0.5; if (q.flee <= 0) insectTarget(q); }
    if (Math.abs(q.vx) > 3) q.face = q.vx > 0 ? 1 : -1;
    // flown out of the room: another arrives elsewhere, out of her sight
    if (q.x < -20 || q.x > W + 20 || q.y < -30 || q.y > H) { if (insectSpot(q, true)) { q.flee = 0; insectTarget(q); } }
  }
}

function drawInsects(c) {
  if (G.artProbe || G.fringeProbe || INSECTS.room !== G.roomId) return;
  for (const q of INSECTS.list) {
    const K = INSECT_KIND[q.k], im = insectImg(K.key); if (!im) continue;
    const h = K.h, w = h * im.naturalWidth / im.naturalHeight;
    c.save(); c.translate(q.x, q.y);
    if (K.how === 'dart') {
      // a dragonfly is seen along its body: it points where it flies, and its wings are a blur
      c.scale(q.face, 1); c.rotate(Math.max(-0.5, Math.min(0.5, q.vy / 260)));
      c.globalAlpha = 0.85 + 0.15 * Math.sin(q.ph);
      c.drawImage(im, -w / 2, -h / 2, w, h);
    } else {
      // a butterfly or a moth beats its wings: the picture folds about its body, each half alone
      const f = 0.25 + 0.75 * Math.abs(Math.cos(q.ph * 0.5)), iw = im.naturalWidth, ih = im.naturalHeight;
      c.scale(q.face, 1);
      c.drawImage(im, 0, 0, iw / 2, ih, -w / 2 * f, -h / 2, w / 2 * f, h);
      c.drawImage(im, iw / 2, 0, iw / 2, ih, 0, -h / 2, w / 2 * f, h);
    }
    c.restore();
  }
}
