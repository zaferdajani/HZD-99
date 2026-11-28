// ===========================================================================
// THE PACK LADDER — and the screen that shows it (owner, 2026-11-26).
//
// "the wolf I'm riding on should be at the same size as the wolf I am summoning — you're summoning
// a small one and then riding a big one. You probably should summon the beaten Alpha and ride it,
// so that I can use its power, or at least starting with one of its powers, alongside my hitting
// and hold-and-hit power. This does not happen at the beginning: at the beginning I can only
// summon one of the small ones ... I upgrade, it becomes stronger, which allows me to summon the
// Alpha instead. When I summon the Alpha it fights alongside me, and then alongside the upgrades I
// can mount it ... there should be a new skill tree opening ... showing at the end Alpha mount ...
// a better way to access my skill tree, showing it in a nicer way that does not look like a
// mathematically generated AI layout." · "Since this is the last upgrade of the wolf, it's only
// going to happen in the later stages of the game ... It should not be easy, but it should not be
// hard."
//
// THE LADDER (G.save.packLv; the ride is flags.alphaRide):
//   1 THE PACK          the Alpha's yield: one small wolf, ten seconds (js/packcall.js)
//   2 A STRONGER WOLF   Ratchet's shelf: it stays 15 s and bites 22
//   3 CALL THE ALPHA    Ratchet's shelf: the purified Alpha comes instead, at HIS OWN size, and
//                       fights beside her with his CLAW (the rake his fight is known by)
//   4 THE ALPHA'S HOWL  Ratchet's shelf: a second power — the machines near him stagger
//   5 RIDE THE ALPHA    the Tinker (Patch-7, the Foundry, Kingdom 3): his harness task first — the
//                       ALPHA she calls brings down three of his machines — then the ride, for
//                       shards on his own shelf. She rides the Alpha she calls, the same size.
// Ratchet sells 2-4 on ONE row of his shelf, always the next rung (ptNextRatchet); nothing is
// bought anywhere else and nothing buys by surprise (the shop's question card, js/game.js).
// The prices are measured against what each kingdom pays: docs/OWNER_ORDERS.md, THE PACK LADDER,
// tools/shardincome.cjs and tests/pack-prices.cjs.
// ===========================================================================
const PACK_TREE = [
  { id: 'pack',   lv: 1, at: 'alpha',   art: 'wolf',  cost: 0 },
  { id: 'packup', lv: 2, at: 'ratchet', art: 'wolf',  cost: 700 },
  { id: 'alcall', lv: 3, at: 'ratchet', art: 'alpha', cost: 1150 },
  { id: 'alhowl', lv: 4, at: 'ratchet', art: 'alpha', cost: 400 },
  { id: 'alride', lv: 5, at: 'patch',   art: 'ride',  cost: 800, need: 'alcall' },
];
function ptNode(id) { return PACK_TREE.find(n => n.id === id); }
function ptLv() { return (G.save && G.save.packLv) | 0; }
function ptHas(id) {
  if (!G.save || (typeof isHero === 'function' && isHero())) return false;
  if (id === 'pack') return !!(G.save.arms && G.save.arms.includes('pack'));
  if (id === 'alride') return !!(G.save.flags && G.save.flags.alphaRide) && ptLv() >= 3;
  return ptHas('pack') && ptLv() >= ptNode(id).lv;
}
// the rung before this one (the ride's is the Alpha's call, not his howl: a side branch)
function ptPrev(n) { if (n.need) return ptNode(n.need); const i = PACK_TREE.indexOf(n); return i > 0 ? PACK_TREE[i - 1] : null; }
// RATCHET'S ROW: always the next rung he sells
function ptNextRatchet() { return PACK_TREE.find(n => n.at === 'ratchet' && !ptHas(n.id)) || null; }
function ptShelfCost() { const n = ptNextRatchet(); return n ? n.cost : ptNode('packup').cost; }
function ptBuy(n) {
  if (!n || !G.save) return;
  if (n.id === 'alride') { G.save.flags.alphaRide = 1; if (typeof armLessonStart === 'function') armLessonStart('alride'); }
  else G.save.packLv = Math.max(ptLv(), n.lv);
  G.save.shop = G.save.shop || {};
  if (typeof showItem === 'function') showItem(t('pk_n_' + n.id), t('pk_n_' + n.id + 'd'));
  if (typeof persist === 'function') persist();
}
// THE RIDE IS DRAWN FROM WHOLE-RIDER STRIPS ONLY (owner: "becoming on it" refused): one image is
// the Alpha with her on him. Until every strip of this table is in the manifest the ride cannot be
// bought — no composite stands in for it.
// feet: the lowest body pixel of each cell (assets/source/beasts/alpha2/ride/cut_report.json), so
// every cell stands on the floor line — the gallop's camera drift (256 -> 251) and the leap's own
// lift come out, and the physics does the lifting.
const RIDE_ART = {
  gallop: { key: 'alRideGallop', cells: 15, ch: 260, dist: 16, feet: [256, 256, 258, 258, 257, 256, 256, 255, 255, 255, 254, 253, 252, 251, 251] },
  leap:   { key: 'alRideLeap', cells: 10, ch: 282, feet: [276, 273, 247, 227, 215, 250, 280, 280, 280, 280] },
  rear:   { key: 'alRideRear', cells: 11, ch: 263, feet: [260, 259, 259, 259, 259, 259, 259, 259, 259, 259, 259] },
};
function ptRideArt() { return typeof MEDIA_SRC !== 'undefined' && Object.values(RIDE_ART).every(s => !!MEDIA_SRC.images[s.key]); }
// the Tinker's shelf holds the ride once his harness is fitted
const TINKER_SHOP = [{ id: 'alride', type: 'alride', get cost() { return ptNode('alride').cost; } }];
function ptHarness() { return !!(G.save && G.save.flags && G.save.flags.wolfMount); }
function ptRideOpen() { return ptHarness() && ptHas('alcall') && ptRideArt(); }
function ptTinkerSells() { return !(typeof isHero === 'function' && isHero()) && ptHarness() && !ptHas('alride'); }

// ===========================================================================
// THE ALPHA, CALLED. He comes in from behind her at a run, at his own size (the boss's box and
// the boss's draw scale: BSTAT.alpha, ALPHA_PX), in the cure's teal he has worn since the yield.
// He hunts what hunts her and rakes it with his CLAW — the filmed wind-up and swipe of his own
// fight (ALPHA_STRIP.clawwarn/claw), the hit the reach of the drawn paw in front of him. With the
// howl bought he also throws his head back now and then (ALPHA_STRIP.broodcall/howl) and the
// machines near him stagger. He is not a body she can hit or that can hit her: he is in neither
// G.enemies nor G.boss, and nothing of his reads her box. She keeps every attack of her own.
// His stay and the call's cooldown: ALPHA_SIDE.stay / .cd.
// ===========================================================================
const ALPHA_SIDE = {
  stay: 12, cd: 22, spd: 330, reach: 118, warn: 0.36, claw: 0.32, again: 0.85, dmg: 26,
  clawW: 128, clawH: 72,
  howlWarn: 0.45, howl: 0.7, howlCD: 6.5, howlR: 300, stun: 1.1, boss: 0.3,
  heel: 150, leave: 3,
};
function alcBox() { const B = typeof BSTAT !== 'undefined' && BSTAT.alpha; return { w: (B && B.w) || 104, h: (B && B.h) || 58 }; }
function alcCall(p, o) {
  if (G.packWolf) return false;
  const quiet = !!(o && o.quiet);          // brought through a door with her (packcall.js packArrive): no second howl
  const bx = alcBox(), back = -(p.face || 1);
  let x = p.x + p.w / 2 + back * 220 - bx.w / 2;
  const W = G.roomDef ? G.roomDef.w * TILE : 4000;
  x = clamp(x, 8, W - bx.w - 8);
  const w = {
    alpha: 1, pack: 1, kind: 'alpha', x, y: p.y + p.h - bx.h, w: bx.w, h: bx.h,
    vx: -back * ALPHA_SIDE.spd, vy: -200, on: false, anim: 0, t: ALPHA_SIDE.stay,
    dir: -back, face: -back, st: 'run', stT: 0, stDur: 0, clawCD: 0.2, howlCD: 1.2,
    hitSet: null, leaveT: 0, dist: 0, airT: 0, hp: 1,
  };
  const g = typeof groundColumnAt === 'function' ? groundColumnAt(x + bx.w / 2) : null;
  if (g && g.length) { const top = g.filter(y => y >= p.y - 40); if (top.length) w.y = Math.min.apply(null, top) - bx.h; }
  if (typeof solidAt === 'function' && solidAt(Math.floor((w.x + w.w / 2) / TILE), Math.floor((w.y + w.h / 2) / TILE))) { w.x = p.x + p.w / 2 - bx.w / 2; w.y = p.y + p.h - bx.h; }
  G.packWolf = w;
  if (quiet) return true;
  p.armCD = Math.max(p.armCD || 0, ALPHA_SIDE.cd);
  if (typeof sfx === 'function') sfx('alpha_howl_far');
  if (typeof burst === 'function') burst(w.x + w.w / 2, w.y + w.h, 12, '#b9a88a', 180, 0.5, 300, 2.6, false);
  if (typeof mediaFetch === 'function' && typeof ALPHA_STRIPS !== 'undefined') for (const k of ALPHA_STRIPS) mediaFetch(k);
  return true;
}
function alcFoes() {
  const out = (G.enemies || []).filter(e => e && !e.dead && !e.disabled && !e.rescued && !e.calm && !e.meek
    && !(typeof isPet === 'function' && isPet(e)) && !(typeof isWolf === 'function' && isWolf(e) && typeof packTamed === 'function' && packTamed()));
  if (G.boss && !G.boss.dead && !G.boss.purified && typeof bossActive === 'function' && bossActive()) out.push(G.boss);
  return out;
}
function alcHit(w, q, dmg) {
  const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
  const dm = Math.round(dmg * ((typeof DF === 'function' && DF().pdmg) || 1));
  dealDmg(q, dm, null, b.x + b.w / 2, b.y + b.h / 2, true, 'pack');
  if (typeof sfx === 'function') sfx('wolf_bite');
  if (typeof burst === 'function') burst(b.x + b.w / 2, b.y + b.h / 2, 8, '#ffe6c8', 180, 0.3, 200, 2.2, false);
  if (!(typeof Boss !== 'undefined' && q instanceof Boss) && q.kind !== 'turret') { q.kbT = Math.max(q.kbT || 0, 0.2); q.vx = (q.vx || 0) + w.dir * 240; q.vy = (q.vy || 0) - 90; }
  if (q.hp <= 0 && !q.dead && typeof q.die === 'function') { q.die(w.dir, -0.3); if (typeof questPackKill === 'function') questPackKill(q); }
}
// the rake's reach: in front of him, at the height of his forelegs
function alcClawBox(w) {
  const A = ALPHA_SIDE, cx = w.x + w.w / 2;
  return { x: w.face > 0 ? cx + w.w * 0.1 : cx - w.w * 0.1 - A.clawW, y: w.y + w.h - A.clawH, w: A.clawW, h: A.clawH };
}
function alcHowl(w) {
  const A = ALPHA_SIDE, cx = w.x + w.w / 2, cy = w.y + w.h / 2;
  if (typeof sfx === 'function') sfx('alpha_howl');
  cam.shake = Math.max(cam.shake || 0, 4);
  let n = 0;
  for (const q of alcFoes()) {
    const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
    if (Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy) > A.howlR) continue;
    n++;
    if (typeof Boss !== 'undefined' && q instanceof Boss) { q.stagT = Math.max(q.stagT || 0, A.boss); q.howlT = A.boss; }
    else { q.kbT = Math.max(q.kbT || 0, A.stun); q.howlT = A.stun; q.vx = Math.sign(b.x + b.w / 2 - cx || 1) * 80; }
    // dust off what it shook — never a ring of light (the ledger)
    if (typeof burst === 'function') burst(b.x + b.w / 2, b.y + b.h, 6, '#b9a88a', 120, 0.4, 300, 2, false);
  }
  return n;
}
function alcSet(w, st, dur) { w.st = st; w.stT = dur; w.stDur = dur; }
function alcStep(w, dt) {
  if (G.state !== 'PLAY') return;
  if (G.mount && G.mount.w === w) return;          // ridden: he goes where she does (js/wolfmount.js)
  const A = ALPHA_SIDE;
  w.anim += dt; w.t -= dt; w.clawCD -= dt; w.howlCD -= dt;
  w.vy += 2000 * dt;
  const px = player.x + player.w / 2, cx = w.x + w.w / 2;
  let want = 0;
  if (w.t <= 0 && !w.leaveT) { w.leaveT = A.leave; alcSet(w, 'run', 0); }
  if (w.leaveT > 0) {
    // HIS TIME IS UP: he lopes off, away from her, and is gone
    w.leaveT -= dt;
    const away = Math.sign(cx - px) || w.dir || 1;
    w.dir = away; want = away * A.spd * 1.1;
    const sx = typeof worldScreenX === 'function' ? worldScreenX(cx) : cx - cam.x;
    if (w.leaveT <= 0 || sx < -140 || sx > 1100) { G.packWolf = null; return; }
  } else if (w.st === 'clawwarn' || w.st === 'claw' || w.st === 'howlwarn' || w.st === 'howl') {
    w.stT -= dt;
    if (w.st === 'claw') {
      const box = alcClawBox(w);
      for (const q of alcFoes()) {
        if (w.hitSet.has(q)) continue;
        const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
        if (aabb(box, b)) { w.hitSet.add(q); alcHit(w, q, A.dmg); }
      }
    }
    if (w.stT <= 0) {
      if (w.st === 'clawwarn') { alcSet(w, 'claw', A.claw); w.hitSet = new Set(); if (typeof sfx === 'function') sfx('alpha_claw'); }
      else if (w.st === 'howlwarn') { alcSet(w, 'howl', A.howl); alcHowl(w); }
      else alcSet(w, 'run', 0);
    }
    w.vx *= Math.pow(0.02, dt);
  } else {
    const q = typeof packQuarry === 'function' ? packQuarry(w) : null;
    w.hunt = q ? 1 : 0;
    if (q) {
      const b = typeof hurtBoxOf === 'function' ? hurtBoxOf(q) : q;
      const d = b.x + b.w / 2 - cx, ad = Math.abs(d) - b.w / 2;
      w.dir = Math.sign(d) || w.dir;
      const near = alcFoes().filter(e => { const h = typeof hurtBoxOf === 'function' ? hurtBoxOf(e) : e; return Math.hypot(h.x + h.w / 2 - cx, h.y + h.h / 2 - (w.y + w.h / 2)) < A.howlR * 0.8; }).length;
      if (ptHas('alhowl') && w.howlCD <= 0 && near > 0 && w.on) { w.howlCD = A.howlCD; w.face = w.dir; alcSet(w, 'howlwarn', A.howlWarn); w.vx = 0; }
      else if (ad < A.reach && w.clawCD <= 0 && w.on) { w.face = w.dir; alcSet(w, 'clawwarn', A.warn); w.clawCD = A.again + A.warn + A.claw; w.vx = 0; }
      else want = ad < A.reach * 0.55 ? 0 : w.dir * A.spd;
    } else {
      // nothing to hunt: at her side
      const d = px - cx, ad = Math.abs(d);
      if (ad > A.heel) { w.dir = Math.sign(d) || w.dir; want = w.dir * A.spd * (ad > 320 ? 1 : 0.55); }
    }
  }
  // he turns before he runs the other way (a wolf, not a slide)
  const ws = Math.sign(want);
  if (!/warn|claw|howl/.test(w.st)) {
    if (ws && ws !== w.face) { w.vx *= Math.pow(0.02, dt); if (Math.abs(w.vx) < 60) w.face = ws; }
    else w.vx += clamp(want - w.vx, -A.spd * 6 * dt, A.spd * 6 * dt);
  }
  const x0 = w.x;
  const col = moveEnt(w, dt);
  w.on = !!col.d;
  w.airT = w.on ? 0 : w.airT + dt;
  w.dist += Math.abs(w.x - x0);
  w.stuckT = (col.l || col.r) && want && Math.abs(w.x - x0) < 0.5 ? (w.stuckT || 0) + dt : 0;
  if (w.stuckT > 0.25 && w.on) { w.vy = -620; w.on = false; w.stuckT = 0; }
  if (G.roomDef && w.y > G.roomDef.h * TILE + 60) { w.x = player.x + player.w / 2 - w.w / 2; w.y = player.y + player.h - w.h; w.vy = 0; }
}
// which filmed take and cell he wears this frame (the boss's own strips: ALPHA_STRIP)
function alcPick(w) {
  if (typeof ALPHA_STRIP === 'undefined') return null;
  let st = w.st;
  if (st === 'howlwarn') st = 'broodcall';
  if (!/clawwarn|claw|broodcall|howl/.test(st)) st = !w.on && w.airT > 0.08 ? 'leap' : Math.abs(w.vx) > 25 ? 'prowl' : 'rest';
  const S = ALPHA_STRIP[st] || ALPHA_STRIP.rest;
  const from = S.from || 0, to = S.to == null ? S.cells - 1 : S.to, n = to - from + 1;
  let cell;
  if (S.loop) cell = from + Math.floor((w.anim || 0) * S.loop) % n;
  else if (S.dist) { let k = Math.floor((w.dist || 0) / S.dist) % n; if ((w.vx || 0) * w.face < 0) k = n - 1 - k; cell = from + k; }
  else if (S.float) cell = from + Math.min(n - 1, Math.floor((w.airT || 0) / 0.09));
  else cell = from + Math.min(n - 1, Math.floor(clamp(1 - (w.stT || 0) / (w.stDur || 1), 0, 0.999) * n));
  return { S, cell };
}
function alcDraw(c2, w) {
  if (!w || (G.mount && G.mount.w === w)) return;  // ridden: the ride strip is the picture (wolfmount.js)
  const pk = alcPick(w); if (!pk) return;
  const S = pk.S, H = w.h * ALPHA_PX * S.ch;
  const base = S.float ? H / 2 - w.h * 0.55 : ALPHA_PAD * H / S.ch;
  c2.save();
  c2.translate(w.x + w.w / 2, w.y + w.h);
  c2.scale(w.face > 0 ? -1 : 1, 1);
  w._drewKey = S.key; w._drewH = H;
  drawStripCell(c2, S.key, pk.cell, S.cells, 0, base, H, false, true);
  c2.restore();
}
// THE RIDE, DRAWN: one whole-rider cell at his box, his scale (wolfmount.js calls this in place
// of her body and his). Picks the take from what the ride is doing.
function ptRidePick(p, M) {
  const W = M.w;
  if (M.howlT > 0) { const u = 1 - M.howlT / WOLF_MOUNT.howl.t; return { S: RIDE_ART.rear, cell: 5 + Math.min(5, Math.floor(u * 6)) }; }
  if (M.scrT > 0) { const u = 1 - M.scrT / WOLF_MOUNT.scratch.t; return { S: RIDE_ART.rear, cell: Math.min(6, Math.floor(u * 7)) }; }
  if (p.dashT > 0) { const u = clamp(1 - p.dashT / 0.18, 0, 0.999); return { S: RIDE_ART.leap, cell: Math.floor(u * 3) }; }
  if (!p.on) {
    // the flight cells by the arc: rising 2-3, the top 4, falling 5
    const cell = p.vy < -300 ? 2 : p.vy < -60 ? 3 : p.vy < 160 ? 4 : 5;
    return { S: RIDE_ART.leap, cell };
  }
  if (M.landT > 0) return { S: RIDE_ART.leap, cell: 6 + Math.min(3, Math.floor((1 - M.landT / 0.24) * 4)) };
  // no filmed stand: the gallop's first cell held still, and its stride paced by the ground covered
  const G2 = RIDE_ART.gallop;
  if (Math.abs(p.vx) < 30) return { S: G2, cell: 0 };
  let k = Math.floor((W.dist || 0) / G2.dist) % G2.cells;
  return { S: G2, cell: k };
}
function ptRideDraw(c2, p) {
  const M = G.mount; if (!M || !M.w) return false;
  const W = M.w, pk = ptRidePick(p, M), S = pk.S;
  const H = W.h * ALPHA_PX * S.ch;
  const base = (S.ch - S.feet[pk.cell]) * H / S.ch;   // that cell's own lowest pixel on the floor line
  c2.save();
  c2.translate(W.x + W.w / 2, W.y + W.h);
  c2.scale((p.face || 1) > 0 ? -1 : 1, 1);
  M._drewKey = S.key; M._drewCell = pk.cell; M._drewH = H;
  const ok = drawStripCell(c2, S.key, pk.cell, S.cells, 0, base, H, false, true);   // the cure's teal, as the Alpha she calls wears it
  c2.restore();
  return ok;
}

// ===========================================================================
// THE SKILL TREES SCREEN (G.state 'TREE'). Opened from the pause menu, its own key (O) and a
// touch button in the left column. Hand-composed, not computed: the path climbs from the small
// wolf at the foot of the frame, through the stronger wolf, to the Alpha, and on up to the ride;
// his howl hangs off his node as a side branch. Each node is the creature itself, cut from its
// own filmed strip, in a socket; under it its name and, in a few words, what it is now: yours,
// where it is bought and for how much, or what comes first.
// The frame, sockets and card are Wenrexa's "UI Minimalism SciFi" kit (CC0, assets/CREDITS.md).
// Other trees join by adding a row to PT_TREES; one geometry (ptLayout) is read by the drawing
// AND by the touch layer.
// ===========================================================================
const PT_TREES = [{ id: 'pack', nodes: PACK_TREE }];
const PT_POS = { pack: [176, 396], packup: [318, 300], alcall: [486, 238], alhowl: [548, 418], alride: [752, 158] };
const PT_HEX = { w: 104, h: 92 };
function ptLayout() {
  const T = PT_TREES[0];
  return {
    nodes: T.nodes.map(n => ({ n, x: PT_POS[n.id][0], y: PT_POS[n.id][1] })),
    card: { x: 648, y: 334, w: 268, h: 140 },
    frame: { x: 30, y: 8, w: 900, h: 524 },
  };
}
function ptOpen(from) {
  G.treeBack = from || 'PLAY'; G.state = 'TREE';
  const L = ptLayout();
  // the cursor starts on the next thing she can get
  const i = L.nodes.findIndex(q => !ptHas(q.n.id));
  G.treeIdx = i < 0 ? L.nodes.length - 1 : i;
  if (typeof mediaFetch === 'function') for (const k of ['ptFrame', 'ptSocket', 'ptCard', 'wolfIdle6', 'alRest', 'alRideGallop', 'alRideLeap', 'alRideRear']) mediaFetch(k, 1);
  if (typeof sfx === 'function') sfx('ui');
}
function ptClose() { G.state = G.treeBack === 'PAUSE' ? 'PAUSE' : 'PLAY'; if (typeof sfx === 'function') sfx('ui'); }
// what a node is NOW, in a few words
function ptState(n) {
  if (ptHas(n.id)) return { k: 'own', line: t('pk_own'), why: '' };
  const prev = ptPrev(n);
  const where = n.at === 'alpha' ? t('pk_at_alpha') : n.at === 'patch' ? t('pk_at_tinker') : t('pk_at_ratchet');
  if (n.at === 'alpha') return { k: 'lock', line: where, why: '', where };
  // a rung for sale always says WHERE and FOR HOW MUCH; a shut one also says what comes first
  const line = '⬢ ' + n.cost + '  ·  ' + where;
  if (prev && !ptHas(prev.id)) return { k: 'lock', line, why: t('pk_first').replace('%s', t('pk_n_' + prev.id)), where };
  if (n.id === 'alride' && !ptHarness()) return { k: 'lock', line, why: t('pk_harness'), where };
  if (n.id === 'alride' && !ptRideArt()) return { k: 'lock', line, why: t('pk_soon'), where };
  return { k: 'buy', line, why: '', where };
}
function updateTree() {
  if (inP('TREE') || inP('BACK') || inP('PAUSE')) { ptClose(); return; }
  const L = ptLayout(), n = L.nodes.length;
  // the path's own order, both ways along it
  if (inP('RIGHT') || inP('UP') || inP('DOWN')) { G.treeIdx = ((G.treeIdx | 0) + (inP('DOWN') ? n - 1 : 1)) % n; sfx('ui'); }
  if (inP('LEFT')) { G.treeIdx = ((G.treeIdx | 0) + n - 1) % n; sfx('ui'); }
  // NOTHING BUYS HERE (ledger: nothing opens or buys by surprise): shards are spent at the
  // people who sell; OK on a node says where
  if (inP('OK')) { const s = ptState(L.nodes[G.treeIdx | 0].n); G.toast(s.why || s.where || s.line); sfx(s.k === 'own' ? 'ui' : 'no'); }
}
function ptHexPath(c2, x, y, w, h) {
  const a = w / 2, b = h / 2;
  c2.beginPath();
  c2.moveTo(x - a, y); c2.lineTo(x - a / 2, y - b); c2.lineTo(x + a / 2, y - b);
  c2.lineTo(x + a, y); c2.lineTo(x + a / 2, y + b); c2.lineTo(x - a / 2, y + b); c2.closePath();
}
// the creature in the socket: the whole body of its first filmed cell, fitted
const PT_ART = { wolf: ['wolfIdle6', 6], alpha: ['alRest', 9], ride: ['alRideGallop', 15] };
function ptPortrait(c2, art, x, y, w, h, dim) {
  const A = PT_ART[art], im = typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[A[0]];
  if (typeof mediaFetch === 'function') mediaFetch(A[0], 1);
  if (!im || !im.naturalWidth) return false;
  const src = typeof pureArt === 'function' ? pureArt(im) : im;
  const cw = src.naturalWidth ? src.naturalWidth / A[1] : src.width / A[1], ch = src.naturalHeight || src.height;
  const k = Math.min(w / cw, h / ch), dw = cw * k, dh = ch * k;
  c2.save();
  ptHexPath(c2, x, y, PT_HEX.w - 10, PT_HEX.h - 8); c2.clip();
  if (dim) c2.globalAlpha = 0.42;
  // the strips face left; the path climbs to the right, so they look up it
  c2.translate(x, y); c2.scale(-1, 1);
  c2.drawImage(src, 0, 0, cw, ch, -dw / 2, -dh / 2 + 4, dw, dh);
  c2.restore();
  return true;
}
function ptArt(key) { const im = typeof MEDIA_RAW !== 'undefined' && MEDIA_RAW[key]; if (typeof mediaFetch === 'function') mediaFetch(key, 1); return im && im.naturalWidth ? im : null; }
function drawTree() {
  const L = ptLayout(), F = L.frame, now = performance.now() / 1000;
  c.fillStyle = 'rgba(3,6,10,0.9)'; c.fillRect(0, 0, 960, 540);
  const fr = ptArt('ptFrame');
  if (fr) c.drawImage(fr, F.x, F.y, F.w, F.h);
  else { c.fillStyle = '#16202a'; rr(c, F.x + 20, F.y + 10, F.w - 40, F.h - 20, 14); c.fill(); }
  // the tree's name in the frame's own tab
  ftxt(t('pk_tree'), 480, F.y + 14, 15, '#bfeee6', 'center', null, '700');
  ftxt('⬢ ' + ((G.save && G.save.scrap) | 0), 860, 46, 15, '#ffd76a', 'right');
  // THE PATH: a cable from rung to rung, lit where she has climbed
  const P = {}; for (const q of L.nodes) P[q.n.id] = q;
  const cable = (a, b, lit) => {
    const A = P[a], B = P[b]; if (!A || !B) return;
    const mx = (A.x + B.x) / 2, my = Math.min(A.y, B.y) - 34;
    const path = () => { c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx, my, B.x, B.y); };
    c.save(); c.lineCap = 'round';
    path(); c.strokeStyle = '#0a1016'; c.lineWidth = 11; c.stroke();
    path(); c.strokeStyle = lit ? '#46d6c2' : '#3a4a56'; c.lineWidth = lit ? 4 : 3;
    if (!lit) c.setLineDash([7, 7]);
    c.stroke(); c.restore();
  };
  for (const q of L.nodes) { const pv = ptPrev(q.n); if (pv) cable(pv.id, q.n.id, ptHas(q.n.id)); }
  const sock = ptArt('ptSocket');
  L.nodes.forEach((q, i) => {
    const s = ptState(q.n), sel = i === (G.treeIdx | 0);
    if (sock) c.drawImage(sock, q.x - PT_HEX.w / 2 - 6, q.y - PT_HEX.h / 2 - 6, PT_HEX.w + 12, PT_HEX.h + 12);
    else { ptHexPath(c, q.x, q.y, PT_HEX.w, PT_HEX.h); c.fillStyle = '#16232d'; c.fill(); }
    ptPortrait(c, q.n.art, q.x, q.y, PT_HEX.w - 14, PT_HEX.h - 16, s.k === 'lock');
    // the socket's edge says the state: teal hers, amber for sale, slate shut; the Alpha's violet seam
    ptHexPath(c, q.x, q.y, PT_HEX.w - 4, PT_HEX.h - 4);
    c.lineWidth = sel ? 3 : 2;
    c.strokeStyle = s.k === 'own' ? '#46d6c2' : s.k === 'buy' ? '#ffcf6a' : '#44525e';
    c.stroke();
    if (q.n.art !== 'wolf') { ptHexPath(c, q.x, q.y, PT_HEX.w + 6, PT_HEX.h + 6); c.lineWidth = 1; c.strokeStyle = 'rgba(176,132,255,0.55)'; c.stroke(); }
    if (sel) { ptHexPath(c, q.x, q.y, PT_HEX.w + 14, PT_HEX.h + 14); c.lineWidth = 2; c.strokeStyle = 'rgba(238,243,250,' + (0.55 + 0.3 * Math.sin(now * 5)) + ')'; c.stroke(); }
    const ny = q.y + PT_HEX.h / 2 + 14;
    ftxt(t('pk_n_' + q.n.id), q.x, ny, 14, s.k === 'lock' ? '#8798a6' : '#eef3fa', 'center', null, '700');
    ftxt(s.line, q.x, ny + 17, 11, s.k === 'own' ? '#7fe0cf' : s.k === 'buy' ? '#ffd98a' : '#9aa8b4', 'center', null, '600');
    if (s.why) ftxt(s.why, q.x, ny + 32, 11, '#8fa0ad', 'center', null, '600');
  });
  // THE CARD: the selected rung — what it does
  const C = L.card, cur = L.nodes[G.treeIdx | 0].n, cs = ptState(cur);
  const card = ptArt('ptCard');
  if (card) c.drawImage(card, C.x, C.y, C.w, C.h);
  else { c.fillStyle = '#121b24'; rr(c, C.x, C.y, C.w, C.h, 10); c.fill(); }
  ftxt(t('pk_n_' + cur.id), C.x + C.w / 2, C.y + 26, 16, '#eef3fa', 'center', null, '700');
  wrapText(t('pk_n_' + cur.id + 'd'), C.w - 34, 13).slice(0, 3).forEach((ln, i) => ftxt(ln, C.x + C.w / 2, C.y + 54 + i * 18, 13, '#b8cad8', 'center', null, '600'));
  if (cs.why) ftxt(cs.why, C.x + C.w / 2, C.y + C.h - 38, 12, '#9aa8b4', 'center', null, '600');
  ftxt(cs.line, C.x + C.w / 2, C.y + C.h - 20, 12, cs.k === 'own' ? '#7fe0cf' : cs.k === 'buy' ? '#ffd98a' : '#9aa8b4', 'center', null, '700');
  // (the way out is the menu's own: Esc / O on a keyboard, the touch layer's ✕ on a phone —
  //  ONE close control, never a second one drawn inside the frame)
  ftxt(t('pk_hint'), 480, 48, 12, '#7d93a8', 'center');
}
// every box the screen draws (the harness checks none overlaps and all are on the screen)
function ptBoxes() {
  const L = ptLayout(), out = [];
  c.font = '700 14px "Segoe UI", Tahoma, sans-serif';
  const wOf = (str, size) => { c.font = '700 ' + size + 'px "Segoe UI", Tahoma, sans-serif'; return c.measureText(str).width; };
  for (const q of L.nodes) {
    const s = ptState(q.n), ny = q.y + PT_HEX.h / 2 + 14;
    out.push({ id: q.n.id + ':hex', x: q.x - PT_HEX.w / 2 - 6, y: q.y - PT_HEX.h / 2 - 6, w: PT_HEX.w + 12, h: PT_HEX.h + 12 });
    const lines = [[t('pk_n_' + q.n.id), 14, ny], [s.line, 11, ny + 17]].concat(s.why ? [[s.why, 11, ny + 32]] : []);
    let w = 0; for (const l of lines) w = Math.max(w, wOf(l[0], l[1]));
    out.push({ id: q.n.id + ':label', x: q.x - w / 2, y: ny - 9, w, h: lines[lines.length - 1][2] + 7 - (ny - 9) });
  }
  out.push(Object.assign({ id: 'card' }, L.card));
  const hw = wOf(t('pk_hint'), 12);
  out.push({ id: 'hint', x: 480 - hw / 2, y: 40, w: hw, h: 16 });
  return out;
}
// a tap: a node selects (a second tap on it says where); the touch layer's ✕ closes (BACK)
function ptTap(x, y) {
  const L = ptLayout();
  for (let i = 0; i < L.nodes.length; i++) {
    const q = L.nodes[i];
    if (Math.abs(x - q.x) < PT_HEX.w / 2 + 6 && Math.abs(y - q.y) < PT_HEX.h / 2 + 6) {
      if ((G.treeIdx | 0) === i) { const s = ptState(q.n); G.toast(s.why || s.where || s.line); }
      else { G.treeIdx = i; if (typeof sfx === 'function') sfx('ui'); }
      return true;
    }
  }
  return false;
}
// the tree's own button shows once there is a tree to show (her first rung)
function ptButtonShown() { return !!(G.save && ptHas('pack')); }

// ---- her words, five languages (measured by tests/text-budget.cjs as part of TEXT_LITE) -----
const PK_TEXT = {
  en: { pk_tree: 'THE PACK', pk_menu: 'Skill trees', pk_own: 'Yours', pk_at_ratchet: 'Ratchet, at the camp', pk_at_tinker: 'Patch-7, in the Foundry',
        pk_at_alpha: 'Beat the Alpha in his den', pk_first: '%s first', pk_harness: 'Patch-7\'s harness task first', pk_soon: 'Not yet', pk_hint: 'Shards are spent at Ratchet and Patch-7',
        pk_n_pack: 'The Pack', pk_n_packd: 'One small wolf comes and bites for you.',
        pk_n_packup: 'A Stronger Wolf', pk_n_packupd: 'Your wolf stays longer and bites harder.',
        pk_n_alcall: 'Call the Alpha', pk_n_alcalld: 'The Alpha himself fights beside you with his claws.',
        pk_n_alhowl: 'The Alpha\'s Howl', pk_n_alhowld: 'He howls: the machines near him stagger.',
        pk_n_alride: 'Ride the Alpha', pk_n_alrided: 'Climb on him: lunge, claws, leap and howl.' },
  ar: { pk_tree: 'القطيع', pk_menu: 'أشجار المهارات', pk_own: 'لكِ', pk_at_ratchet: 'راتشيت، في المخيم', pk_at_tinker: 'ترقيع-7، في المسبك',
        pk_at_alpha: 'اهزمي الألفا في عرينه', pk_first: '%s أولاً', pk_harness: 'مهمة لجام ترقيع-7 أولاً', pk_soon: 'ليس بعد', pk_hint: 'تُنفق الشظايا عند راتشيت وترقيع-7',
        pk_n_pack: 'القطيع', pk_n_packd: 'يأتي ذئب صغير ويعضّ لأجلكِ.',
        pk_n_packup: 'ذئب أقوى', pk_n_packupd: 'يبقى ذئبكِ أطول ويعضّ أقوى.',
        pk_n_alcall: 'استدعي الألفا', pk_n_alcalld: 'الألفا بنفسه يقاتل بجانبكِ بمخالبه.',
        pk_n_alhowl: 'عواء الألفا', pk_n_alhowld: 'يعوي: فتترنّح الآلات القريبة منه.',
        pk_n_alride: 'اركبي الألفا', pk_n_alrided: 'اركبيه: انقضاض، مخالب، قفز وعواء.' },
  tr: { pk_tree: 'SÜRÜ', pk_menu: 'Yetenek ağaçları', pk_own: 'Senin', pk_at_ratchet: 'Ratchet, kampta', pk_at_tinker: 'Patch-7, Dökümhanede',
        pk_at_alpha: 'Alfa\'yı ininde yen', pk_first: 'Önce %s', pk_harness: 'Önce Patch-7\'nin koşum görevi', pk_soon: 'Henüz değil', pk_hint: 'Parçalar Ratchet ve Patch-7\'de harcanır',
        pk_n_pack: 'Sürü', pk_n_packd: 'Küçük bir kurt gelir, senin için ısırır.',
        pk_n_packup: 'Daha Güçlü Kurt', pk_n_packupd: 'Kurdun daha uzun kalır, daha sert ısırır.',
        pk_n_alcall: 'Alfa\'yı Çağır', pk_n_alcalld: 'Alfa\'nın kendisi pençeleriyle yanında dövüşür.',
        pk_n_alhowl: 'Alfa\'nın Uluması', pk_n_alhowld: 'Ulur: yakınındaki makineler sendeler.',
        pk_n_alride: 'Alfa\'ya Bin', pk_n_alrided: 'Sırtına çık: atılma, pençe, sıçrama, uluma.' },
  zh: { pk_tree: '狼群', pk_menu: '技能树', pk_own: '已拥有', pk_at_ratchet: '营地的拉切特', pk_at_tinker: '铸造厂的帕奇-7',
        pk_at_alpha: '在巢穴击败头狼', pk_first: '先获得%s', pk_harness: '先完成帕奇-7的挽具任务', pk_soon: '尚未开放', pk_hint: '碎片在拉切特和帕奇-7处花费',
        pk_n_pack: '狼群', pk_n_packd: '一只小狼前来替你撕咬。',
        pk_n_packup: '更强的狼', pk_n_packupd: '你的狼停留更久，咬得更狠。',
        pk_n_alcall: '召唤头狼', pk_n_alcalld: '头狼亲自用利爪在你身旁作战。',
        pk_n_alhowl: '头狼之嚎', pk_n_alhowld: '它一嚎，附近的机器便踉跄。',
        pk_n_alride: '骑乘头狼', pk_n_alrided: '骑上它：猛扑、利爪、跃起、嚎叫。' },
  ru: { pk_tree: 'СТАЯ', pk_menu: 'Деревья умений', pk_own: 'Твоё', pk_at_ratchet: 'Рэтчет, в лагере', pk_at_tinker: 'Патч-7, в Литейной',
        pk_at_alpha: 'Победи Альфу в логове', pk_first: 'Сначала: %s', pk_harness: 'Сначала задание Патча-7 с упряжью', pk_soon: 'Пока нет', pk_hint: 'Осколки тратятся у Рэтчета и Патча-7',
        pk_n_pack: 'Стая', pk_n_packd: 'Приходит волчонок и кусает за тебя.',
        pk_n_packup: 'Волк сильнее', pk_n_packupd: 'Волк держится дольше и кусает сильнее.',
        pk_n_alcall: 'Призвать Альфу', pk_n_alcalld: 'Сам Альфа бьётся рядом когтями.',
        pk_n_alhowl: 'Вой Альфы', pk_n_alhowld: 'Он воет: машины рядом шатаются.',
        pk_n_alride: 'Верхом на Альфе', pk_n_alrided: 'Садись на него: бросок, когти, прыжок, вой.' },
};
if (typeof TEXT_LITE !== 'undefined') for (const L of Object.keys(PK_TEXT)) Object.assign(TEXT_LITE[L] = TEXT_LITE[L] || {}, PK_TEXT[L]);
