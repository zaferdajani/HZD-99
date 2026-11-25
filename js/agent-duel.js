// THE AGENT'S DUEL — the Eye's robed agents as a real fight.
//
// Owner, 2026-11-24: "The agent is so minuscule, irrelevant, does not have obvious powers, does
// not have flashy powers, does not have moves, does not have anything. It's very easy to kill,
// very easy to fight." And: every boss after the rhino is harder than the rhino.
//
// He was right, and measured (scratchpad gauntlet, five player agents, one recorder with a human's
// 250 ms reaction): the old duel had two attacks — a double lunge and an ember ring that only hurt
// her on the ground — no armour, no answer to her in the air, no second phase. Every blow knocked
// it back for 0.26 s, longer than her own swing, and knockback cancelled its wind-up, so pressing
// attack stun-locked it against the wall: every cheap bot won, in 8-16 s, losing nothing. Its
// health was a dice roll (286 to 604 by seed). The rhino, for the record: a strong player wins in
// 37.5 s and the masher dies in 15.
//
// What it is now (prototyped by the agent player and measured before it came here):
//   THE MOVES — a weighted deck by distance, recency halved, two vetoes:
//     coil -> lunge (x2; phase two x3, the last from overhead)      close
//     gather -> the ember ring (phase two: two rings)                close
//     the COUNT — three ember beads lobbed where she stands, one tick each (phase two: five, twice)
//     the SIGHTING — it sights along its staff at her, locks, and the floor there erupts
//     the VAULT — over the room onto her, a slam, and two ground waves to jump
//     the PLUMB — her in the air over it: a sweep of the staff overhead
//   THE OPENINGS — only the exhale after a committed move. Everywhere else it is plated: a blow in
//     its neutral lands at a fifth, into a move at a tenth.
//   GREED — the opening holds two blows (one in phase two); the next is turned on the staff and
//     wakes it into the RIPOSTE (a 0.4 s wind, then
//     the staff round at the hip). Two blows in its neutral do the same. Face-hugged, it steps back.
//   PHASE TWO at 60%: the UNBINDING (1.2 s, untouchable), then a faster beat and harder versions.
//   NO DICE: a unique fight has one strength.
// Every wind-up is 0.40 s or more (the kingdom-1 floor). The flash is light on the floor, embers,
// sparks and sound — never a glow round its body (the ledger, four times).
const AGENT_DUEL = Object.freeze({
  beat1: 0.7, beat2: 0.55,          // (a decision every 0.7 s: the owner's 2026-11-20 order, js/sage-motion.js SAGE_DUEL_PROFILE.step)
  coil: 0.5, lunge: 0.22, replant: 0.18, lastcoil: 0.42, exh1: 0.7, exh2: 0.55,
  tick1: 0.2, tick2: 0.12, volRec: 0.5, beadR: 7, beadT: 0.75, spread1: 90, spread2: 80, wave2: 0.3,
  sight: 0.5, sightTrack: 0.3, markDelay: 0.7, markW: 56, markH: 170, sightRec: 0.5, markGap: 110,
  vcrouch: 0.55, vault: 0.6, vaultH: 170, land1: 0.8, land2: 0.6, slamR: 44, waveSpd: 380, waveLife: 0.9, waveH: 26,
  gather: 0.7, ringRec: 0.5, ring2: 0.45, ringSpd: 200, ringMax: 250,
  plumb: 0.42, sweep: 0.2, sweepR: 140, sweepRec: 0.5, aaCd: 2.2,
  spinprep: 0.4, spin: 0.25, spinR: 150, spinRec: 0.5, greed: 2, greed2: 1, idleGreed: 2, idleWin: 1.2,
  spinCd: 2.0, hug: 0.6, backstep: 0.3, bsDist: 170,
  unbind: 1.2, armAct: 0.08, armIdle: 0.15, denied: 0.8, p2: 0.6,
  // (its health is SAGE_DUEL_PROFILE.hpK, half as much again as an agent off the duel — the owner's
  // 2026-11-20 order, applied by sage-motion.js's own init, which this one runs first)
});
// the chapter-one agent's chamber. The later agents keep their own profiles (js/sage-motion.js, and
// tests/sage-motion.cjs guards that none is silently given this one); each gets its own duel in turn
const AGENT_DUEL_ROOMS = { GA1D: 1 };

(function agentDuelInstall() {
  if (typeof sageDuelStep !== 'function' || typeof agentRigMove !== 'function') return;
  const T = AGENT_DUEL;
  const W0 = () => G.roomDef.w * TILE;
  const hurt = (x, src) => { if (!player.dead && player.iT <= 0) player.hurt(DF().edmg, x, src); };
  const pbox = () => ({ x: player.x, y: player.y, w: player.w, h: player.h });
  const rectHit = (x0, y0, x1, y1) => { const b = pbox(); return b.x < x1 && b.x + b.w > x0 && b.y < y1 && b.y + b.h > y0; };
  // A BODY STANDS ON THE GROUND (the ledger): the vault lands on the floor UNDER its landing
  // point, read off the heightfield across the body's whole width
  function groundAt(x, w, from) {
    let best = null;
    for (const q of [-0.45, -0.2, 0, 0.2, 0.45]) { const g = typeof groundColumnAt === 'function' ? groundColumnAt(x + q * w) : null;
      if (g && g[0] > from - 200 && (best == null || g[0] < best)) best = g[0]; }
    return best == null ? from : best;
  }
  function S(e, st, t) {
    e.tSt = st; e.tT = t; e.tAge = 0;
    e.hideK = st === 'exhale' ? 1 : st === 'unbind' ? 0 : (st === 'stand' || st === 'walk') ? T.armIdle : T.armAct;
    if (st === 'exhale') e.openHits = 0;
    if (st !== 'lunge') e.lungeT = 0;
  }
  // THE OLD TIMERS, KEPT TRUE. The rest of the game (contact damage, the parry glint, the drawing of
  // an agent without a rig) and its harnesses read coilT / lungeT / gatherT / windedT / sageReplantT /
  // ringR. The duel runs on tSt, and after every step it writes what it is doing back into them; a
  // timer something ELSE set (a harness, a stagger) is read into the duel before the next step.
  const LEG = ['coilT', 'lungeT', 'gatherT', 'windedT', 'sageReplantT', 'ringR'];
  function exportLegacy(e) {
    const s = e.tSt, t = Math.max(0, e.tT || 0);
    e.coilT = (s === 'coil' || s === 'lastcoil') ? Math.max(t, 1e-3) : 0;
    e.lungeT = s === 'lunge' ? Math.max(t, 1e-3) : 0;
    e.gatherT = (s === 'gather' || s === 'gather2') ? Math.max(t, 1e-3) : 0;
    e.windedT = s === 'exhale' ? Math.max(t, 1e-3) : 0;
    e.sageReplantT = s === 'replant' ? Math.max(t, 1e-3) : 0;
    const rr = e.rr || []; e.ringR = rr.length ? rr[rr.length - 1].r : null;
    e._ex = {}; for (const k of LEG) e._ex[k] = e[k];
  }
  // set from outside since the duel last wrote them: whoever set it is asking for that pose
  const forced = e => LEG.some(k => k !== 'ringR' && (e[k] || 0) !== ((e._ex && e._ex[k]) || 0));
  function importLegacy(e) {
    const x = e._ex || {}, set = k => e[k] != null && e[k] !== x[k] && (k === 'ringR' || e[k] > 0);
    // a stagger, from whatever: the strike is spent, never resumed untold
    if ((e.kbT || 0) > 0 || (e.stagT || 0) > 0) {
      if (e.tSt === 'lunge' || e.tSt === 'coil' || e.tSt === 'replant' || e.tSt === 'lastcoil' || (e.lungeT || 0) > 0) {
        e.lunges = 0; e.vx = 0; S(e, 'exhale', 0.4); exportLegacy(e); return;
      }
    }
    if (set('windedT')) S(e, 'exhale', e.windedT);
    else if (set('lungeT')) { const v = e.vx; S(e, 'lunge', e.lungeT); e.vx = v; if (e.lunges == null) e.lunges = 0; }
    else if (set('coilT')) { S(e, 'coil', e.coilT); e.lunges = e.hp <= e.hpMax0 * T.p2 ? 2 : 1; }
    else if (set('gatherT')) { S(e, 'gather', e.gatherT); e.rings = 1; }
    else if (set('sageReplantT')) S(e, 'replant', e.sageReplantT);
    if (set('ringR')) { const rr = e.rr = e.rr || []; if (rr.length) rr[rr.length - 1].r = e.ringR; }
    for (const k of LEG) if (e[k] != null && e[k] !== x[k] && !(e[k] > 0) && k !== 'ringR') e[k] = x[k] || 0;
  }
  function markStruck(e) {
    const P = typeof SAGE_DUEL_PROFILE !== 'undefined' ? SAGE_DUEL_PROFILE : { hitShow: 0.26, chainGap: 0.9 };
    e.hitPoseT = P.hitShow; e._hitChain = e._hitChainT > 0 ? (e._hitChain || 0) + 1 : 1; e._hitChainT = P.chainGap;
  }
  // ONE STRENGTH: the traits a common machine rolls are taken off, once
  function normalize(e) {
    if (e._agentNorm) return; e._agentNorm = 1;
    let th = 1, ts = 1;
    for (const tr of e.traits || []) if (typeof TRAITS !== 'undefined' && TRAITS[tr]) { th *= TRAITS[tr].hp || 1; ts *= TRAITS[tr].spd || 1; }
    // (its health too: a 'tough' roll made it 906 and a 'swift' one 430 — one fight, two strengths.
    // The duel's own init multiplies what is left: tests/tallyman.cjs)
    e.traits = []; e.spd /= ts; e.hp = e.hpMax0 = Math.round((e.hpMax0 || e.hp) / th);
  }

  // ---- the duel ----
  const _init = sageDuelInit;
  sageDuelInit = function (e) {
    if (e.kind !== 'sage' || !AGENT_DUEL_ROOMS[G.roomId] || (typeof isHero === 'function' && isHero())) return;
    normalize(e);
    _init(e);
    if (!e.sageDuel) e.sageDuel = { home: G.roomId, phase: 'idle', elapsed: 0, duration: 0, face: e.dir || 1, ringOrigin: null, chain: 0 };
    e.sageReplantT = 0;
    // every picture of it, asked for now: the first lunge used to find its plate not yet arrived and
    // drew the procedural stand-in (a dark disc on a stick) for the length of the strike
    if (typeof mediaFetch === 'function' && typeof agentKey === 'function')
      for (const k of ['sageStand', 'sageWalk8', 'sageExhale', 'sageCoil', 'sageLunge', 'sageGather', 'sageLock', 'sagePure']) mediaFetch(agentKey(k));
    if (typeof bossVfxPrefetch === 'function') bossVfxPrefetch(['agent_bolt', 'agent_burst', 'agent_pillar', 'agent_slash', 'agent_wave']);
  };
  sageDuelActive = function (e) { return !!e && !!e.sageDuel && e.kind === 'sage' && !!AGENT_DUEL_ROOMS[e.sageDuel.home]; };

  // ---- the rig poses the duel's own state ----
  const _rm = agentRigMove;
  agentRigMove = function (e) { if (e.tame || e.locked || !e.tSt || !sageDuelActive(e) || forced(e) || (typeof sageHitPose === 'function' && sageHitPose(e))) return _rm(e); return AGENT_POSE[e.tSt] ? e.tSt : _rm(e); };

  // ---- no stun-lock: a blow does not knock a duelling agent back ----
  const _ak = attackKnock;
  attackKnock = function (e, id, dx, dy) {
    if (e && e.kind === 'sage' && sageDuelActive(e) && !e.locked && !e.tame) return false;
    return _ak(e, id, dx, dy);
  };

  // ---- the plate, and greed ----
  const _ss = sageStruck;
  sageStruck = function (e, dm, x, y) {
    if (sageDuelActive(e) && !e.locked && !e.tame) {
      const k = e.hideK == null ? 1 : e.hideK;
      if (e.tSt === 'exhale') {
        e.openHits = (e.openHits || 0) + 1;
        // GREED: the opening holds two blows (one in phase two: the owner, 2026-11-24, "decrease
        // the openings"). The next is turned, the breath is over, and the staff is already coming
        // round (the riposte, 400 ms of warning)
        if (e.openHits > (e.hp <= e.hpMax0 * T.p2 ? T.greed2 : T.greed)) {
          // (the greedy blow meets the staff coming round: it is turned like any blow outside an
          // opening. It used to land in full, and a player who then hopped the riposte had three
          // full blows from every breath — tests/boss-ladder.cjs)
          burst(x, y, 8, '#fff2d8', 230, 0.25, 120, 2, true); e.turnedT = 0.25; if (typeof sfx === 'function') sfx('block');
          const r0 = _ss(e, dm * T.armAct, x, y);
          if (!e.locked) { e.spinCd = T.spinCd; S(e, 'spinprep', T.spinprep); sfx('tellmid'); }
          return r0;
        }
      } else if (e.tSt === 'stand' || e.tSt === 'walk') { e.idleHits = (e.idleT > 0 ? e.idleHits : 0) + 1; e.idleT = T.idleWin; }
      if (k < 1) {
        // it says so: white sparks off the staff's metal instead of the hit's gold (and the blow
        // pays her almost nothing toward a heal — js/entities.js reads turnedT)
        burst(x, y, 8, '#fff2d8', 230, 0.25, 120, 2, true);
        e.turnedT = 0.25;
        if (typeof sfx === 'function') sfx('block');
      }
      dm = dm * k; if (dm <= 0) return 0;
      if (k >= 1) markStruck(e);
    }
    return _ss(e, dm, x, y);
  };

  // ---- its hazards, every frame ----
  sageDuelTick = function (e, dt) {
    if (!sageDuelActive(e)) return;
    e.sageDuel.elapsed += dt;
    if (e.tame || e.calm || e.locked || e.dead) { e.beads = []; e.marks = []; e.waves = []; e.rr = []; e.ringR = null; e.sageReplantT = 0; return; }
    if (!e.tSt) { e.tSt = 'stand'; e.tT = 0; e.tAge = 0; e.hideK = T.armIdle; }
    importLegacy(e);
    // STRUCK LIKE A BODY (owner, 2026-11-20; js/sage-motion.js sageHitPose): a blow that lands is
    // drawn on him — struck, and on the third of a quick chain doubled over — and gives no slide
    if (e.hitPoseT > 0) e.hitPoseT -= dt; if (e._hitChainT > 0) e._hitChainT -= dt;
    if ((e.kbT || 0) > 0) markStruck(e);
    e.kbT = 0; e.stagT = 0; e.ringR = null;
    const pcx = player.x + player.w / 2, py = player.y + player.h;
    for (const r of (e.rr = e.rr || [])) {
      r.r += T.ringSpd * dt;
      if (player.on && Math.abs(py - r.y) < 24 && Math.abs(Math.abs(pcx - r.x) - r.r) < 16) hurt(r.x, 'sage.ring');
    }
    e.rr = e.rr.filter(r => r.r <= T.ringMax);
    for (const b of (e.beads = e.beads || [])) {
      b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y >= b.floor) { b.dead = 1; if (!G.artProbe) { burst(b.x, b.floor - 2, 6, '#ff9a4a', 160, 0.3, 300, 2, true); bossVfx('agent_burst', b.x, b.floor - 10, { h: 64 }); } continue; }
      if (rectHit(b.x - T.beadR, b.y - T.beadR, b.x + T.beadR, b.y + T.beadR)) { hurt(b.x, 'sage.bead'); b.dead = 1; if (!G.artProbe) bossVfx('agent_burst', b.x, b.y, { h: 56 }); }
    }
    e.beads = e.beads.filter(b => !b.dead);
    for (const k of (e.marks = e.marks || [])) {
      const was = k.t; k.t -= dt;
      if (was > 0 && k.t <= 0) { sfx('blast'); cam.shake = Math.max(cam.shake, 4); if (!G.artProbe) burst(k.x, k.y - 20, 18, '#ffb070', 320, 0.45, -200, 3, true); }
      if (k.t <= 0 && k.t > -0.25 && rectHit(k.x - T.markW / 2, k.y - T.markH, k.x + T.markW / 2, k.y)) hurt(k.x, 'sage.mark');
      if (k.t <= -0.25) { k.dead = 1; if (!G.artProbe) bossVfx('agent_pillar', k.x, k.y, { h: T.markH * 1.1, wk: 1.75, seg: [[12, 15.99, 0.4]] }); }
    }
    e.marks = e.marks.filter(k => !k.dead);
    for (const w of (e.waves = e.waves || [])) {
      w.x += w.dir * T.waveSpd * dt; w.life -= dt;
      if (Math.abs(pcx - w.x) < 14 + player.w / 2 && py > w.y - T.waveH && py <= w.y + 4) hurt(w.x, 'sage.wave');
    }
    e.waves = e.waves.filter(w => w.life > 0);
    if (e.idleT > 0) e.idleT -= dt;
    if (e.spinCd > 0) e.spinCd -= dt;
    // phase two's second wave of beads, on the engine's own clock
    if (e.pendingWave && (e.pendingWave.t -= dt) <= 0) {
      const w = e.pendingWave; e.pendingWave = null;
      const cx = e.x + e.w / 2, sx = cx + (e.sageDuel.face || 1) * 18, sy = e.y + 10, tt = T.beadT, fl = e.y + e.h - 6;
      for (let i = 0; i < w.n; i++) {
        const tx = w.px + (i - (w.n - 1) / 2) * w.sp + w.off;
        e.beads.push({ x: sx, y: sy, vx: (tx - sx) / tt, vy: (fl - sy - 0.5 * 900 * tt * tt) / tt, floor: fl + 2 });
      }
    }
    if (e.tSt) exportLegacy(e);
  };

  function start(e, k, face, p2, px) {
    const m = e.sageDuel; m.face = face; e.dir = face; e.vx = 0; e.recent = [k, ...(e.recent || [])].slice(0, 2);
    if (k === 'coil') { e.lunges = p2 ? 2 : 1; S(e, 'coil', T.coil); }
    else if (k === 'gather') { e.rings = p2 ? 2 : 1; S(e, 'gather', T.gather); }
    else if (k === 'vault') S(e, 'vaultcrouch', T.vcrouch);
    else if (k === 'count') { e.ticks = 0; S(e, 'countprep', Math.max(0.4, (p2 ? 5 : 3) * (p2 ? T.tick2 : T.tick1))); }
    else if (k === 'sight') { e.sightX = px; S(e, 'sightprep', T.sight); }
    sfx('tellmid');
  }

  // ---- the fight ----
  sageDuelStep = function (e, dt) {
    const m = e.sageDuel, px = player.x + player.w / 2, py = player.y + player.h, cx = e.x + e.w / 2;
    normalize(e);
    if (e.locked) {
      e.vy += 900 * dt; e.vx = 0; moveEnt(e, dt);
      const goal = e.hpMax0 * .45; if (e.hp < goal) e.hp = Math.min(goal, e.hp + e.hpMax0 * .06 * dt);
      if (chance(dt * 5)) addPart(cx + rnd(-9, 9), e.y + rnd(0, 12), rnd(-8, 8), -30, .6, chance(.5) ? '#ff6a3a' : '#3a1a20', 2, -30, true);
      return;
    }
    if (!e.tSt) S(e, 'stand', 0);
    const p2 = e.hp <= e.hpMax0 * T.p2, face = Math.sign(px - cx) || m.face || 1, dx = px - cx, ad = Math.abs(dx);
    const floorY = e.y + e.h;
    e.tAge += dt; e.tT -= dt;
    if (e.tSt !== 'vault') e.vy += 900 * dt;
    switch (e.tSt) {
      case 'stand': case 'walk': {
        if (p2 && !e.p2done) {
          e.p2done = 1; e.vx = 0; S(e, 'unbind', T.unbind); sfx('tellbig'); cam.shake = Math.max(cam.shake, 8);
          // the floor is scored with burning tally strokes across the room
          if (!G.artProbe) for (let i = 0; i < 9; i++) burst(cx + (i - 4) * 70, floorY - 2, 5, '#ff7a3a', 160, 0.6, -60, 2.2, true);
          return;
        }
        e.vx = ad > 160 ? face * e.spd * .6 : ad < 70 ? -face * e.spd * .4 : 0; e.dir = face; m.face = face; moveEnt(e, dt);
        e.tSt = Math.abs(e.vx) > 12 ? 'walk' : 'stand'; e.hideK = T.armIdle;
        e.aaCd = (e.aaCd || 0) - dt;
        if (e.aaCd <= 0 && !player.on && ad < 110 && py < e.y - 10) { e.aaCd = T.aaCd; e.vx = 0; S(e, 'plumbprep', T.plumb); sfx('tellmid'); return; }
        if (e.idleHits >= T.idleGreed && e.idleT > 0 && !(e.spinCd > 0)) { e.idleHits = 0; e.vx = 0; e.spinCd = T.spinCd; S(e, 'spinprep', T.spinprep); sfx('tellmid'); return; }
        // face-hugged: a damage-free BACKSTEP (its one repositioning move; no opening, no damage)
        e.hugT = ad < 64 ? (e.hugT || 0) + dt : 0;
        if (e.hugT > T.hug) { e.hugT = 0; e.vx = 0; e.bsDir = -face; S(e, 'backstep', T.backstep); return; }
        if ((e.stepT -= dt) <= 0 && !player.dead && ad < 520) {
          if (!e.duelMus) { e.duelMus = 1; if (typeof setMusic === 'function') setMusic('sage'); }
          e.stepT = p2 ? T.beat2 : T.beat1;
          if (e.denied >= 3) { e.denied = 0; e.vx = 0; S(e, 'exhale', T.denied); return; }
          const Wt = ad < 150 ? { coil: 34, gather: 26, vault: 14, sight: 8 }
            : ad < 300 ? { coil: 35, vault: 25, gather: 12, count: 15, sight: 13 } : { count: 35, sight: 35, vault: 30 };
          for (const k of (e.recent || [])) if (Wt[k]) Wt[k] *= .5;
          if ((e.marks || []).length) delete Wt.gather;                                 // no ring over an armed mark
          if (e.lastRingAt != null && e.anim - e.lastRingAt < 1.0) delete Wt.count;     // no volley over a ring
          let sum = 0; for (const k in Wt) sum += Wt[k]; let r = Math.random() * sum, pick = 'coil';
          for (const k in Wt) { r -= Wt[k]; if (r <= 0) { pick = k; break; } }
          start(e, pick, face, p2, px);
        }
        return;
      }
      case 'coil': case 'replant': case 'lastcoil': e.vx = 0; moveEnt(e, dt);
        if (e.tT <= 0) { e.vx = m.face * e.spd * 2.2; S(e, 'lunge', T.lunge); e.lungeT = T.lunge; sfx('dash'); }
        return;
      case 'lunge': {
        const hit = moveEnt(e, dt); e.lungeT = Math.max(0, e.tT);
        if (!G.artProbe && chance(0.7)) addPart(cx - m.face * 12, floorY - rnd(4, 30), -m.face * rnd(40, 120), rnd(-30, 10), 0.3, '#ff8a4a', 2, 0, true);
        if (hit.l || hit.r) e.tT = 0;
        if (e.tT <= 0) {
          e.vx = 0; e.lungeT = 0;
          if (e.lunges > 0) {
            e.lunges--; m.face = face; e.dir = face;
            const last = p2 && e.lunges === 0;
            S(e, last ? 'lastcoil' : 'replant', last ? T.lastcoil : T.replant);
            if (last) sfx('tellmid');
          } else S(e, 'exhale', p2 ? T.exh2 : T.exh1);
        }
        return;
      }
      case 'countprep': {
        e.vx = 0; moveEnt(e, dt); const tk = p2 ? T.tick2 : T.tick1;
        if (e.tAge >= (e.ticks + 1) * tk - 1e-6 && e.tT > 1e-6) { e.ticks++; sfx('chirp'); }
        if (e.tT <= 0) {
          const n = p2 ? 5 : 3, sp = p2 ? T.spread2 : T.spread1, sx = cx + m.face * 18, sy = e.y + 10, tt = T.beadT, fl = floorY - 6;
          for (let i = 0; i < n; i++) {
            const tx = px + (i - (n - 1) / 2) * sp;
            e.beads.push({ x: sx, y: sy, vx: (tx - sx) / tt, vy: (fl - sy - 0.5 * 900 * tt * tt) / tt, floor: fl + 2 });
          }
          if (p2) e.pendingWave = { t: T.wave2, px, off: sp / 2, n, sp };
          sfx('shoot'); S(e, 'volley', 0.15);
        }
        return;
      }
      case 'volley': e.vx = 0; moveEnt(e, dt); if (e.tT <= 0) S(e, 'exhale', T.volRec); return;
      case 'sightprep': e.vx = 0; moveEnt(e, dt);
        if (e.tAge < T.sightTrack) e.sightX += clamp(px - e.sightX, -600 * dt, 600 * dt);
        if (e.tT <= 0) {
          const xs = p2 ? [e.sightX - T.markGap, e.sightX, e.sightX + T.markGap] : [e.sightX];
          xs.forEach((x, i) => e.marks.push({ x, y: groundAt(x, T.markW, floorY), t: T.markDelay + i * 0.15, t0: T.markDelay + i * 0.15 }));
          sfx('bosshit'); S(e, 'mark', 0.2);
        }
        return;
      case 'mark': e.vx = 0; moveEnt(e, dt); if (e.tT <= 0) S(e, 'exhale', T.sightRec); return;
      case 'vaultcrouch': e.vx = 0; moveEnt(e, dt);
        if (e.tT <= 0) {
          e.vFrom = cx; e.vTo = clamp(px, 64, W0() - 64); e.vFloor0 = floorY; e.vFloor = groundAt(e.vTo, e.w, floorY);
          m.face = Math.sign(e.vTo - cx) || m.face; e.dir = m.face; S(e, 'vault', T.vault); sfx('jump');
        }
        return;
      case 'vault': {
        const p = clamp(e.tAge / T.vault, 0, 1);
        e.x = lerp(e.vFrom, e.vTo, p) - e.w / 2; e.y = lerp(e.vFloor0, e.vFloor, p) - e.h - 4 * T.vaultH * p * (1 - p); e.vx = 0; e.vy = 0;
        if (p > 0.5 && rectHit(e.x, e.y, e.x + e.w, e.y + e.h)) hurt(e.x + e.w / 2, 'sage.vault');
        if (e.tT <= 0) {
          e.y = e.vFloor - e.h; const lx = e.x + e.w / 2;
          if (Math.abs(px - lx) < T.slamR && py > e.vFloor - 60) hurt(lx, 'sage.slam');
          e.waves.push({ x: lx, y: e.vFloor, dir: 1, life: T.waveLife }, { x: lx, y: e.vFloor, dir: -1, life: T.waveLife });
          cam.shake = Math.max(cam.shake, 7); sfx('slam');
          if (!G.artProbe) { burst(lx, e.vFloor - 2, 14, '#8a7f6c', 260, 0.5, 400, 3); burst(lx, e.vFloor - 4, 10, '#ff9a4a', 220, 0.35, 200, 2.4, true);
            bossVfx('agent_burst', lx, e.vFloor - 6, { h: 70, wk: 2.2 }); G.hitStop = Math.max(G.hitStop || 0, 0.05); }
          if (typeof fx === 'function') fx('cracks', lx, e.vFloor, { r: 60 });
          S(e, 'exhale', p2 ? T.land2 : T.land1);
        }
        return;
      }
      case 'gather': case 'gather2': e.vx = 0; moveEnt(e, dt);
        if (e.tT <= 0) {
          e.rr.push({ r: 20, x: cx, y: e.y + e.h }); e.rings--; e.lastRingAt = e.anim; sfx('shockring'); cam.shake = Math.max(cam.shake, 5);
          if (e.rings > 0) S(e, 'gather2', T.ring2); else S(e, 'exhale', T.ringRec);
        }
        return;
      case 'plumbprep': e.vx = 0; moveEnt(e, dt); if (e.tT <= 0) { S(e, 'sweep', T.sweep); sfx('whiff'); } return;
      case 'sweep': e.vx = 0; moveEnt(e, dt);
        { const pcy = player.y + player.h / 2; if (Math.hypot(px - cx, pcy - (e.y + 20)) < T.sweepR && pcy < e.y + 40) hurt(cx, 'sage.sweep'); }
        if (e.tT <= 0) S(e, 'exhale', T.sweepRec);
        return;
      case 'spinprep': e.vx = 0; moveEnt(e, dt); if (e.tT <= 0) { S(e, 'spin', T.spin); sfx('whiff'); } return;
      case 'spin': e.vx = 0; moveEnt(e, dt);
        if (Math.abs(px - cx) < T.spinR && py > e.y + 30 && player.y < e.y + e.h) hurt(cx, 'sage.spin');
        if (e.tT <= 0) S(e, 'exhale', T.spinRec);
        return;
      case 'backstep': {
        const p = clamp(e.tAge / T.backstep, 0, 1); e.vx = e.bsDir * T.bsDist / T.backstep; if (p < 0.5) e.vy = Math.min(e.vy, -120); moveEnt(e, dt);
        if (e.tT <= 0) { e.vx = 0; e.stepT = 0.15; S(e, 'stand', 0); }
        return;
      }
      case 'unbind': e.vx = 0; moveEnt(e, dt); if (e.tT <= 0) { e.stepT = 0.3; S(e, 'stand', 0); } return;
      case 'exhale': e.vx = 0; moveEnt(e, dt);
        if (e.tT <= 0) {
          if (e.openHits >= T.greed && ad < 95 && !(e.spinCd > 0)) { e.spinCd = T.spinCd; S(e, 'spinprep', T.spinprep); sfx('tellmid'); return; }
          if (!e.openHits) e.denied = (e.denied || 0) + 1; else e.denied = 0;
          S(e, 'stand', 0);
        }
        return;
      default: S(e, 'stand', 0); return;
    }
  };

  const _stepNew = sageDuelStep;
  sageDuelStep = function (e, dt) { _stepNew(e, dt); if (e.tSt && !e.locked) exportLegacy(e); };

  // ---- an agent without a rig wears the plate nearest its move ----
  const PLATE_OF = {
    coil: 'coil', replant: 'coil', lastcoil: 'coil', vaultcrouch: 'coil', spinprep: 'coil',
    lunge: 'lunge', vault: 'lunge', sweep: 'lunge', spin: 'lunge', volley: 'lunge', slam: 'lunge',
    gather: 'gather', gather2: 'gather', countprep: 'gather', sightprep: 'gather', plumbprep: 'gather', unbind: 'gather', mark: 'gather',
    exhale: 'exhale',
  };
  const _pose = sageDuelPose;
  sageDuelPose = function (e) {
    if (!e.tSt || e.tame || e.locked || forced(e) || (typeof sageHitPose === 'function' && sageHitPose(e))) return _pose(e);
    const k = PLATE_OF[e.tSt];
    const keep = { coilT: e.coilT, lungeT: e.lungeT, gatherT: e.gatherT, windedT: e.windedT, sageReplantT: e.sageReplantT };
    e.coilT = k === 'coil' ? 1 : 0; e.lungeT = k === 'lunge' ? 1 : 0; e.gatherT = k === 'gather' ? 1 : 0; e.windedT = k === 'exhale' ? 1 : 0; e.sageReplantT = 0;
    try { return _pose(e); } finally { Object.assign(e, keep); }
  };

  // ---- the rig's poses for the new moves (js/agentrig.js terms: limbs from straight down,
  //      spine/head/shin/staff from straight up, lengths in body heights; prototype pose_rows.js) ----
  Object.assign(AGENT_POSE, {
    replant: AGENT_POSE.coil, gather2: AGENT_POSE.gather,
    countprep: { rate: 12, sp: -0.12, hd: -0.35, aF: 2.5, bF: 0.25, aB: 1.3, bB: 1.1, stA: 0.35, stG: 0.75, stP: 0, skW: 1.05, tell: 1 },
    volley: { rate: 28, sp: 0.35, hd: -0.1, aF: 1.55, bF: 0.05, aB: -0.6, bB: 0.2, stA: 1.25, stG: 0.55, stP: 0, f1x: -0.12, k1: 0.2, tell: 0.6 },
    sightprep: { rate: 11, hp: 0.45, sp: 0.22, hd: -0.12, aF: 0.95, bF: 0.45, aB: 0.6, bB: 1.75, stA: -0.02, stP: 1, stG: 0.4, f1x: -0.1, k1: 0.15, tell: 1 },
    mark: { rate: 30, hp: 0.4, sp: 0.35, aF: 0.6, bF: 0.9, stA: 0.05, stP: 1, stG: 0.6, tell: 0.7 },
    vaultcrouch: { rate: 12, hp: 0.25, sp: 0.62, hd: -0.45, aF: 1.35, bF: 0.35, aB: 1.15, bB: 0.55, stA: 0.55, stP: 1, stG: 0.75,
      f1x: -0.14, k1: 0.55, f2x: 0.12, k2: -0.35, skL: 0.25, skW: 1.5, tell: 1 },
    vault: { rate: 20, air: 0.06, sp: 0.25, hd: 0.15, aF: -0.35, bF: 0.3, aB: -0.2, bB: 0.35, stA: 2.85, stG: 0.8, stP: 0,
      f1y: 0.22, k1: 1.6, f2y: 0.24, k2: 1.7, skA: 0.45, skL: 0.4, tell: 1 },
    slam: { rate: 32, hp: 0.22, sp: 0.95, hd: 0.35, aF: 1.95, bF: 0.05, aB: 1.8, bB: 0.15, stA: 2.1, stG: 0.85, stP: 0,
      k1: 0.6, k2: -0.45, skL: 0.22, skW: 1.6, tell: 0.5 },
    plumbprep: { rate: 14, hp: 0.47, sp: -0.18, hd: -0.65, aF: 2.95, bF: 0.15, aB: 2.75, bB: 0.3, stA: -0.05, stG: 0.55, stP: 0, tell: 1 },
    sweep: { rate: 34, sp: 0.3, hd: -0.25, aF: 2.0, bF: 0.15, aB: 1.6, bB: 0.2, stA: 0.95, stG: 0.4, tell: 0.8 },
    spinprep: { rate: 14, hp: 0.4, sp: -0.05, aF: -0.75, bF: 0.35, aB: -0.5, bB: 0.3, stA: -1.9, stG: 0.5, stP: 0, stZ: 0,
      f1x: -0.02, f2x: 0.16, k2: 0.3, tell: 1 },
    spin: { rate: 30, hp: 0.42, sp: 0.15, aF: 1.6, bF: 0.0, stA: 1.57, stG: 0.5, stP: 0, stZ: 1, skA: -0.4, skW: 1.3, tell: 0.7 },
    lastcoil: { rate: 15, hp: 0.3, sp: 0.45, hd: -0.6, aF: 3.0, bF: 0.3, aB: 2.8, bB: 0.4, stA: 1.5, stG: 0.5, stP: 0,
      f1x: -0.16, k1: 0.25, f2x: 0.14, k2: -0.2, skL: 0.27, skW: 1.45, tell: 1 },
    backstep: { rate: 22, air: 0.08, sp: -0.25, hd: -0.1, aF: 0.4, bF: 0.6, stA: 0.3, f1x: 0.1, f2x: 0.18, k1: 0.4, k2: 0.5, skA: 0.3 },
    unbind: { rate: 6, hp: 0.53, sp: -0.22, hd: -0.5, aF: 2.6, bF: 0.05, aB: -1.3, bB: 0.05, stA: 0.0, stG: 0.85, stP: 0, skW: 1.15, tell: 1, glowH: 1 },
  });
  // ---- what it throws, drawn: light on the floor and in the air, never round its body ----
  const _ds = drawSage;
  drawSage = function (c, e) {
    // (the duel draws its own rings, each where it was released: the old drawing's single ring is put by)
    if (sageDuelActive(e) && e.tSt) { const rr = e.ringR; e.ringR = null; try { _ds(c, e); } finally { e.ringR = rr; } } else _ds(c, e);
    if (!sageDuelActive(e) || e.tame || e.locked) return;
    const cx = e.x + e.w / 2, t = e.anim || 0;
    c.save();
    try {
      c.globalCompositeOperation = 'lighter';
      // EVERY ATTACK IS A GENERATED EFFECT (js/bossvfx.js), placed where it hurts, the size it hurts.
      // the sighting: a thin beam from the staff head to the floor it has chosen, and the floor there
      // already smouldering (the first cells of the pillar that will come out of it)
      if (e.tSt === 'sightprep' && e.sightX != null) {
        const fy = groundAt(e.sightX, T.markW, e.y + e.h), k = clamp(e.tAge / T.sight, 0, 1);
        const sx = cx + (e.sageDuel.face || 1) * 20, sy = e.y + 6, g = c.createLinearGradient(sx, sy, e.sightX, fy);
        g.addColorStop(0, 'rgba(255,236,190,' + (0.25 + 0.5 * k).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,140,50,' + (0.1 + 0.4 * k).toFixed(2) + ')');
        c.strokeStyle = g; c.lineWidth = 1 + 1.5 * k; c.beginPath(); c.moveTo(sx, sy); c.lineTo(e.sightX, fy - 4); c.stroke();
        if (typeof tellFloorLight === 'function') tellFloorLight(c, e.sightX, fy - 2, T.markW * 0.6, k);
        drawBossVfxCell(c, 'agent_pillar', 0, e.sightX, fy, T.markH * 1.1, false, 0, 0.5 + 0.5 * k, 1.75);
      }
      // the marks: the floor smoulders, flares, then a column of fire as wide and tall as it hurts
      for (const k of e.marks || []) {
        if (k.t > 0) {
          const q = 1 - k.t / (k.t0 || T.markDelay);
          if (typeof tellFloorLight === 'function') tellFloorLight(c, k.x, k.y - 2, T.markW * 0.6, Math.pow(q, 0.62));
          drawBossVfxCell(c, 'agent_pillar', q < 0.75 ? (q * 2.7 + t * 6) % 2 : 1 + (q - 0.75) * 8, k.x, k.y, T.markH * 1.1, false, 0, 0.7 + 0.3 * q, 1.75);
        } else drawBossVfxCell(c, 'agent_pillar', 3 + clamp(-k.t / 0.25, 0, 1) * 8.9, k.x, k.y, T.markH * 1.1, false, 0, 1, 1.75);
      }
      // the beads: ember bolts on their arcs, flying nose first
      for (const b of e.beads || []) drawBossVfxLoop(c, 'agent_bolt', t + b.x * 0.01, b.x, b.y, 30, false, Math.atan2(b.vy, b.vx), 1);
      // the ground waves: a crest of fire running the floor (as tall as it hurts)
      for (const w of e.waves || []) {
        const a = clamp(w.life / T.waveLife * 3, 0, 1);
        drawBossVfxLoop(c, 'agent_wave', t + w.dir, w.x, w.y + 2, T.waveH * 2.1, w.dir < 0, 0, a);
      }
      // the ember ring: it runs along the floor both ways from where it was released — two crests of
      // fire, never a ring drawn round the agent
      const rrL = e.rr || [];
      rrL.forEach((r0, i) => {
        // (the newest ring is the one the old timer ringR names: a caller that moved it is drawn moved)
        const R = (i === rrL.length - 1 && e.ringR != null) ? e.ringR : r0.r, a = clamp(1.6 - R / T.ringMax, 0, 1);
        for (const sd of [1, -1]) drawBossVfxLoop(c, 'agent_wave', t + sd * 0.3, r0.x + sd * R, r0.y + 2, 44, sd < 0, 0, a);
      });
      // the sweep (overhead) and the spin (at the hip): the staff's cut, as large as its reach
      if (e.tSt === 'sweep' || e.tSt === 'spin') {
        const sweep = e.tSt === 'sweep', R = sweep ? T.sweepR : T.spinR, f = e.sageDuel.face || 1;
        const p = clamp(e.tAge / (sweep ? T.sweep : T.spin), 0, 1);
        // only the strip's CRESCENT cells (0-2): its later cells close into a whole circle, and a circle
        // round the agent is a ring round a body. The cut is in front of it (the spin) or over its head
        // (the sweep), where the staff head travels and where it hurts.
        const a = p < 0.8 ? 1 : (1 - p) / 0.2;
        // (the sweep's crescent is turned to bulge UP — no mirror after the turn, which would point it
        // down; the spin hurts BOTH sides, so it is a crescent each side, open above and below)
        // (the strip's crescent itself travels right -> over the top -> left: that IS the overhead sweep,
        // started behind it. The spin is the strip's flat overhead cell, laid at the hip out to each side,
        // open between them so it never closes round the agent)
        if (sweep) drawBossVfxCell(c, 'agent_slash', p * 2.6, cx, e.y + 20, R * 2.1, f > 0, 0, a);
        else for (const sd of [1, -1]) { const h = R * 1.25; drawBossVfxCell(c, 'agent_slash', 0.8 + p * 0.7, cx + sd * R * 0.62, e.y + e.h * 0.55 + h * 0.3, h, sd < 0, 0, a); }
      }
      // the count: one ember bolt kindled over the staff head per tick, nose up
      if (e.tSt === 'countprep' && e.ticks > 0) {
        for (let i = 0; i < e.ticks; i++) {
          const x = cx + (e.sageDuel.face || 1) * (14 + i * 11), y = e.y - 12 - Math.sin(t * 9 + i) * 2;
          drawBossVfxLoop(c, 'agent_bolt', t + i, x, y, 16, false, -Math.PI / 2, 0.95);
        }
      }
    } finally { c.restore(); }
  };
})();
