// THE ART THAT WAS FIRED IS THE ART THAT IS DRAWN.
// 2026-11-17, the queue fired once the credits were in (ART_QUEUE §2bu, §2bt,
// §2bv, §2br). Each of these was a thing the owner had looked at and refused:
//   "it looks exactly like the first one I fought, which means there is no
//    story behind it"                               — the Eye's agents
//   "the platforms are so translucent, it does not actually indicate a
//    platform... It should have its own objective structure drawn"  — decks
//   "its standing still !!!"                        — a bound cat
//   "the npc needs a lot of improvement to be like hatchet"  — the Oracle
// and each has been "fixed" once already by art that was fired, archived,
// declared and never reached a frame. So this draws them and measures.
//   A  each fired agent wears its OWN eight plates in its own chamber, they are
//      seven different pictures, and a chamber with no set keeps the shared one
//   B  a state is one size: a crouch is lower than the standing body, a leap is
//      not a doll, and the duel's drawing agrees with the plain one
//   C  a deck is an OBJECT: opaque along its slab, in the city, the caves and
//      the Conduits — never in a furnished interior, never in NOSTOS
//   D  a cat she beats FOLDS: the filmed take plays from its first cell to its
//      last over most of a second, then holds the last
//   E  the Oracle rests on his own plate while unpowered and speaks through his
//      talking pair
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const fresh = (flags) => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1, rubbleA5: 1, rubbleCV1B: 1 }, flags || {}); startGame(sv); G.agentRig = 0;   /* this harness measures the fired PLATES: the rig that mixes with them in GA1D (tests/agent-rig.cjs) is switched off */ };
    const enter = (room) => { loadRoom(room); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; };
    const STATES = ['Stand', 'Walk8', 'Exhale', 'Coil', 'Lunge', 'Gather', 'Lock', 'Pure'];
    // ---- A, B: the agents ---------------------------------------------------
    fresh({ bossGlitch: 1, alpha: 1, bossHorn: 1 });
    out.agents = {};
    const POSE = { Stand: {}, Walk8: { vx: -60, walkD: 30 }, Exhale: { windedT: 0.5 }, Coil: { coilT: 0.2 }, Lunge: { lungeT: 0.1 }, Gather: { gatherT: 0.3 }, Lock: { locked: true }, Pure: { tame: 1, calm: true } };
    const shoot = (e, st, duel) => { const keep = {}; for (const k of ['vx', 'walkD', 'coilT', 'lungeT', 'gatherT', 'windedT', 'locked', 'tame', 'calm', 'sageDuel', 'kbT', 'stagT', 'tSt', '_ex']) keep[k] = e[k];
      Object.assign(e, { vx: 0, coilT: 0, lungeT: 0, gatherT: 0, windedT: 0, locked: false, tame: 0, calm: false, kbT: 0, stagT: 0, tSt: undefined, _ex: undefined }, POSE[st]);   // (tSt: the duel's own state, js/agent-duel.js — the timers name the pose here) if (!duel) e.sageDuel = null;
      const o = Object.assign(document.createElement('canvas'), { width: 420, height: 320 }), x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 210 - (e.x + e.w / 2), 280 - (e.y + e.h));
      G.artProbe = 1; G.sageMotion = null; try { e.draw(x); } finally { G.artProbe = 0; }
      const art = duel && G.sageMotion ? G.sageMotion.art : null;
      for (const k in keep) e[k] = keep[k];
      const d = x.getImageData(0, 0, 420, 320).data; let y0 = 320, y1 = -1, n = 0, r = 0, g = 0, b = 0;
      for (let yy = 0; yy < 320; yy++) for (let xx = 0; xx < 420; xx++) { const j = (yy * 420 + xx) * 4; if (d[j + 3] > 200) { if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; n++; r += d[j]; g += d[j + 1]; b += d[j + 2]; } }
      let x0 = 420, x1 = -1; for (let yy = y0; yy <= y1; yy++) for (let xx = 0; xx < 420; xx++) if (d[(yy * 420 + xx) * 4 + 3] > 200) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; }
      const sig = []; if (n) for (let gy = 0; gy < 10; gy++) for (let gx = 0; gx < 6; gx++) { let cr = 0, cg = 0, cb = 0, ca = 0, cn = 0;
        for (let yy = Math.floor(y0 + (y1 - y0 + 1) * gy / 10); yy < Math.floor(y0 + (y1 - y0 + 1) * (gy + 1) / 10); yy++) for (let xx = Math.floor(x0 + (x1 - x0 + 1) * gx / 6); xx < Math.floor(x0 + (x1 - x0 + 1) * (gx + 1) / 6); xx++) { const j = (yy * 420 + xx) * 4, al = d[j + 3] / 255; cr += d[j] * al; cg += d[j + 1] * al; cb += d[j + 2] * al; ca += al; cn++; }
        sig.push(Math.round(cr / Math.max(1, cn)), Math.round(cg / Math.max(1, cn)), Math.round(cb / Math.max(1, cn)), Math.round(255 * ca / Math.max(1, cn))); }
      return { h: y1 - y0 + 1, n, rgb: n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : null, sig, art }; };
    for (const room of Object.keys(AGENT_ART)) {
      enter(room); const e = G.enemies.find(q => q.kind === 'sage'); if (!e) { out.agents[room] = { missing: 'no agent in the room' }; continue; }
      player.x = e.x - 200;
      const keys = STATES.map(s => agentKey('sage' + s)); for (const k of keys) mediaFetch(k, true);
      for (let n = 0; n < 60 && !keys.every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth); n++) await wait(120);
      const A = { h: e.h, keys, own: keys.every((k, i) => k !== 'sage' + STATES[i]), loaded: keys.every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth), plain: {}, duel: null };
      // with crystal light in her hands nothing is drawn round it: the same pixels as without (the ember ring is withdrawn)
      { const px = (on) => { G.save.flags.crystal = on; const o = Object.assign(document.createElement('canvas'), { width: 420, height: 320 }), x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 210 - (e.x + e.w / 2), 280 - (e.y + e.h));
          const sd = e.sageDuel; e.sageDuel = null; G.artProbe = 1; try { e.draw(x); } finally { G.artProbe = 0; e.sageDuel = sd; } const d = x.getImageData(0, 0, 420, 320).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
        const keepC = G.save.flags.crystal; A.ring = { sense: px(1), bare: px(0) }; G.save.flags.crystal = keepC; }
      const sense = G.save.flags.crystal; G.save.flags.crystal = 0; const cr = G.save.crystal; G.save.crystal = 0;
      for (const s of STATES) A.plain[s] = shoot(e, s, false);
      if (typeof sageDuelActive === 'function' && sageDuelActive(e)) { A.duel = {}; for (const s of ['Stand', 'Coil', 'Lunge', 'Gather']) A.duel[s] = shoot(e, s, true); }
      G.save.flags.crystal = sense; G.save.crystal = cr;
      out.agents[room] = A; }
    // a chamber with no set of its own keeps the shared one — and the shared one is the yardstick for how tall an agent stands.
    // (All seven chambers have a set now, so the first is measured with its row taken away for a moment.)
    { const room = 'GA1D', row = AGENT_ART[room]; delete AGENT_ART[room];
      try { enter(room); out.unfired = { room, key: agentKey('sageStand') };
        const e = G.enemies.find(q => q.kind === 'sage'); mediaFetch('sageStand', true); for (let n = 0; n < 60 && !(MEDIA_IMG.sageStand && MEDIA_IMG.sageStand.naturalWidth); n++) await wait(120);
        player.x = e.x - 200; const sense = G.save.flags.crystal; G.save.flags.crystal = 0; out.unfired.stand = shoot(e, 'Stand', false).h; out.unfired.body = e.h; G.save.flags.crystal = sense;
      } finally { AGENT_ART[room] = row; } }
    // ---- C: the decks ---------------------------------------------------------
    out.decks = {};
    const deckRoom = async (room) => { fresh(); enter(room); G.enemies = [];
      const PO = platObjSet(); if (!PO) return { set: null };
      mediaFetch(PO.key, 1); for (let n = 0; n < 60 && !platObjReady(PO); n++) await wait(120);
      // (the layer is a cache, and it waits for the zone's rock to load before it bakes)
      tileDirty = true; for (let n = 0; n < 80; n++) { draw(performance.now()); if (!tileDirty) break; await wait(100); }
      const g = G.grid, x = tileCv.getContext('2d'); const runs = [];
      for (let ty = 0; ty < g.length; ty++) for (let tx = 0; tx < g[ty].length; tx++) if (g[ty][tx] === '=' && g[ty][tx - 1] !== '=') { let e = tx; while (g[ty][e + 1] === '=') e++;
        // the slab's own depth, a few px under where she stands, across the middle four fifths of the run
        const X0 = Math.round(tx * TILE + (e - tx + 1) * TILE * 0.1), Wd = Math.round((e - tx + 1) * TILE * 0.8); let best = 0;
        for (const dy of [4, 8, 12]) { const d = x.getImageData(X0, ty * TILE + dy, Wd, 1).data; let op = 0; for (let i = 3; i < d.length; i += 4) if (d[i] >= 235) op++; best = Math.max(best, op / Wd); }
        runs.push({ tx, ty, n: e - tx + 1, opaque: +best.toFixed(2) }); }
      return { set: PO.key, ready: platObjReady(PO), baked: !tileDirty, runs: runs.length, worst: runs.length ? runs.slice().sort((a, b) => a.opaque - b.opaque)[0] : null }; };
    for (const room of ['A1', 'CV1B', 'B6']) out.decks[room] = await deckRoom(room);
    fresh(); enter('A0B'); out.den = { set: platObjSet() ? platObjSet().key : null, decks: ROOMS.A0B.decks || 0 };
    // ---- D: the cat folds -------------------------------------------------------
    { fresh({ pl_cshard: 1 }); let cat = null, where = null;
      for (const room of ['CV2', 'CV1B', 'CV1', 'CV3']) { enter(room); cat = G.enemies.find(q => q.storyKey && q.actorRole === 'infected-person' && (q.kind === 'crawler' || q.kind === 'hopper')); if (cat) { where = room; break; } }
      if (!cat) out.cat = { missing: 'no cat with a story key in the cave' };
      else { mediaFetch(CHEETAH_ART.down.img, 1); for (let n = 0; n < 60 && !(MEDIA_IMG[CHEETAH_ART.down.img] && MEDIA_IMG[CHEETAH_ART.down.img].naturalWidth); n++) await wait(120);
        cat.die(0, 0);
        const o = Object.assign(document.createElement('canvas'), { width: 400, height: 300 }), x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 200 - cat.x, 200 - cat.y);
        const cells = [], t0 = cat.anim || 0;
        for (let i = 0; i <= 80; i++) { cat.anim = t0 + i / 60; cat._shownImg = null; cat.draw(x); cells.push(cat._shownImg === CHEETAH_ART.down.img ? cat._shownCell : -1); }
        out.cat = { room: where, disabled: !!cat.disabled, fall: CHEETAH_ART.down.fall, n: CHEETAH_ART.down.cells, first: cells[0], at: cells.findIndex(q => q === CHEETAH_ART.down.cells - 1) / 60,
          monotone: cells.every((q, i) => i === 0 || q >= cells[i - 1]), distinct: Array.from(new Set(cells)).length, last: cells[cells.length - 1], unknown: cells.filter(q => q < 0).length };
        // ...and through the GAME'S OWN UPDATE, not a clock set by hand: the
        // bound body's update returned before its animation clock moved, so in
        // play the fold sat on its first cell — the cat standing — for good
        // (owner, 2026-11-19: "they should fall down the floor in a kneeling way,
        // not standing still"). Every cell above was right and none of it showed.
        const a0 = cat.anim || 0; cat._fallAt = a0;
        for (let i = 0; i < 60; i++) cat.update(1 / 60);
        cat._shownImg = null; cat.draw(x);
        out.cat.live = { clock: +((cat.anim || 0) - a0).toFixed(2), cell: cat._shownImg === CHEETAH_ART.down.img ? cat._shownCell : -1 }; } }
    // ---- E: the Oracle ------------------------------------------------------------
    { const T = NPC_TALL.mono; out.mono = { rest: T.rest, talk: T.talk };
      for (const k of [T.rest].concat(T.talk)) mediaFetch(k, 1);
      for (let n = 0; n < 60 && ![T.rest].concat(T.talk).every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth); n++) await wait(120);
      const stand = () => { enter('B3B'); player.x = 13 * TILE; const gc = groundColumnAt(player.x + 12); if (gc) player.y = Math.min.apply(null, gc) - player.h; for (let i = 0; i < 20; i++) { if (G.dialog) dialogClose(G.dialog); G.state = 'PLAY'; update(1 / 60); } };
      fresh({ bossGlitch: 1 }); stand(); G.npcFrame = null; draw(performance.now()); out.mono.unpowered = G.npcFrame;
      fresh({ bossGlitch: 1, 'on_B3B|mono': 1 }); stand(); G.state = 'DIALOG'; G.dialog = { npc: 'mono', lines: ['…'], i: 0, t: 0 };
      const seen = new Set(); for (let i = 0; i < 28; i++) { G.npcFrame = null; try { draw(performance.now()); } catch (e) { out.mono.err = String(e); } if (G.npcFrame) seen.add(G.npcFrame); await wait(60); }
      out.mono.talking = Array.from(seen); }
    return out; });
  console.log('── fired-art  — the agents, the decks, the bound cat and the Oracle wear what was fired for them');
  const AG = R.agents, names = { GA1D: 'TALLYMAN', GA2D: 'LEASH', GB1D: 'UNDERTOW', GC1D: 'SLAGFATHER', GD1D: 'REDACTOR', GX1D: 'LAPIDARY', GE1D: 'PUPIL' };
  check('A  every one of the seven chambers has its own agent', Object.keys(names).every(r => AG[r] && AG[r].own) && Object.keys(AG).length === 7, Object.keys(AG));
  for (const room of Object.keys(names)) { const A = AG[room] || {};
    check('A  ' + names[room] + ' (' + room + ') wears its own eight plates, and they load', A.own === true && A.loaded === true, A.missing || A.keys);
    if (!A.plain) continue;
    check('   ...and with crystal light in her hands nothing is drawn round it (no ring, no halo)', A.ring.sense === A.ring.bare && A.ring.bare > 1500, A.ring);
    const st = A.plain.Stand.h, P = A.plain;
    const yard = R.unfired.stand * A.h / R.unfired.body, prop = room === 'GA1D' ? 1.09 : 1;   // (TALLYMAN's staff stands over his hood)
    check('B  ...standing it is the height the shared agent stands (within 8%), taller than she is', st >= 52 * 1.5 && Math.abs(st / prop - yard) <= yard * 0.08, { shared: Math.round(yard), stand: st, staff: prop });
    check('   ...its crouch is LOWER than its standing body', P.Coil.h <= st * 0.82 && P.Coil.h >= st * 0.45, { stand: st, coil: P.Coil.h });
    check('   ...its leap is not a doll', P.Lunge.h >= st * 0.75 && P.Lunge.h <= st * 1.2, { stand: st, lunge: P.Lunge.h });
    check('   ...it kneels lower than it stands, bound and purified', P.Lock.h <= st * 0.9 && P.Lock.h >= st * 0.5 && P.Pure.h <= st * 0.95 && P.Pure.h >= st * 0.5, { stand: st, lock: P.Lock.h, pure: P.Pure.h });
    check('   ...every state draws a body', Object.keys(P).every(s => P[s].n > 1500), Object.keys(P).map(s => s + ':' + P[s].n).join(' '));
    if (A.duel) check('   ...and the duel draws each state the size the plain drawing does (within 8%)', ['Stand', 'Coil', 'Lunge', 'Gather'].every(s => A.duel[s].art && Math.abs(A.duel[s].h - P[s].h) <= P[s].h * 0.08),
      ['Stand', 'Coil', 'Lunge', 'Gather'].map(s => s + ' ' + P[s].h + '/' + A.duel[s].h + ' ' + A.duel[s].art).join(', '));
  }
  { const rooms = Object.keys(names).filter(r => AG[r] && AG[r].plain && AG[r].plain.Stand.sig.length);
    const diff = (a, b) => { let t = 0; for (let i = 0; i < a.length; i++) t += Math.abs(a[i] - b[i]); return t / a.length; };
    const pairs = []; for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) pairs.push({ a: names[rooms[i]], b: names[rooms[j]], d: +diff(AG[rooms[i]].plain.Stand.sig, AG[rooms[j]].plain.Stand.sig).toFixed(1) });
    pairs.sort((p, q) => p.d - q.d);
    check('A  ...seven different pictures: no two standing bodies are alike (the nearest pair still differs by 10 levels a cell)', rooms.length === 7 && pairs[0].d >= 10, pairs.slice(0, 3)); }
  check('A  ...and a chamber with no set of its own keeps the shared one', R.unfired.key === 'sageStand', R.unfired);
  for (const room of ['A1', 'CV1B', 'B6']) { const D = R.decks[room];
    check('C  ' + room + ': its decks are an object plate (' + (D.set || 'none') + '), opaque along the slab', !!D.set && D.ready && D.runs > 0 && D.worst.opaque >= 0.85, D); }
  check('C  ...a furnished interior keeps its furniture (the den\'s table is not a gantry)', R.den.set === null && R.den.decks > 0, R.den);
  const C = R.cat;
  check('D  a cat she beats is bound, and its fold starts at the first cell', C.disabled === true && C.first === 0 && C.unknown === 0, C);
  check('   ...plays every cell in order, reaching the last in most of a second', C.monotone && C.distinct === C.n && C.at >= C.fall * 0.6 && C.at <= C.fall * 1.05, { cells: C.distinct + '/' + C.n, lastAt: C.at + ' s', fall: C.fall });
  check('   ...and then lies in the last', C.last === C.n - 1, C.last);
  check('   ...and in play it gets there by itself: its clock runs while it is bound, and a second after the blow it is lying down',
    !!C.live && C.live.clock >= 0.9 && C.live.cell === C.n - 1, C.live);
  const M = R.mono;
  check('E  unpowered, the Oracle rests on his own plate', M.unpowered === 'mono:' + M.rest, M.unpowered);
  check('   ...and speaking, he goes between his two talking plates', M.talk.every(k => M.talking.includes('mono:' + k)) && M.talking.every(k => M.talk.includes(k.slice(5))), M.talking);
  // NOSTOS takes none of it
  await page.goto('http://127.0.0.1:' + PORT + '/odyssey.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const N = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const sv = newSave(1); sv.time = 99; startGame(sv); G.state = 'PLAY';
    const rooms = Object.keys(ROOMS).filter(id => ROOMS[id].grid || ROOMS[id].build).slice(0, 6); let any = 0;
    for (const id of rooms) { try { loadRoom(id); if (platObjSet()) any++; } catch (e) {} }
    return { rooms: rooms.length, any, agent: (G.roomId = 'GA1D', agentKey('sageStand')) }; });
  check('NOSTOS keeps its own decks and its own sage', N.any === 0 && N.agent === 'sageStand', N);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — what was fired is what is drawn');
})().catch(e => { console.error(e); process.exit(1); });
