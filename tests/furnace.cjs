// FURNACE CHOIR, MEASURED (handoff Part 2 A5 — zone C's guardian gets the
// NULLFANG treatment: a bespoke move set, every move told and opened, a parry
// with a use, a phase two that changes the question). The machine is
// js/furnace-fight.js; the move table it is held to is docs/combat/BOSS_FURNACE.md.
//
// Everything runs in the real build. The world is stepped at a fixed 1/60 s
// through the game's own update() (performance.now pinned to the same clock),
// so a run is the same run on every machine, and every duration is read off
// HIS state log (b.fcLog, stamped on his own simulation clock) — not off the
// browser's frames. What is staged is where the two of them stand and which
// move he is asked to start (fcStart, the same entry the deck uses); the move
// itself runs on his machine, and her side of it is done with the keys.
//
//   1. every move is TELL -> ACTIVE -> RECOVERY: the tell is a TELL_ST name
//      (its cue sounds, the amber rises), the active and recovery are not; the
//      tells clear their floors; every recovery is an opening >= 250 ms
//   2. the openings, struck: she lands two hits in the slam's opening and the
//      third wakes the bellows — the greed test, as a mechanism
//   3. THE BELLOWS: the cone takes a body in front of him, misses one behind
//      him or in the air, a brace held from the start only blocks, and a
//      perfect guard turns it — he chokes (stagger), the counter opens, the
//      glint is lit only in its window
//   4. THE DROP (phase two): it locks where he is, lands there, a body that
//      stays is hit and one that leaves the mark (and clears the wave) is not
//   5. phase two changes the question: the drop enters the far deck, every
//      opening is guarded (a lob's walk-in wakes the bellows only in p2), the
//      hymn rings three times
//   6. the veto list and the cold-dice floor hold
//   7. every state draws, and no page errors
//
//   node tests/furnace.cjs
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null || detail === '' ? '' : '  ' + detail));
  if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof fcStep === 'function', { timeout: 30000 });
  console.log('── furnace — FURNACE CHOIR, every move told and opened, the bellows, the drop, phase two');

  await page.evaluate(() => {
    const realNow = performance.now.bind(performance);
    let clk = realNow();
    window.F = {
      DT: 1 / 60,
      floor: 15 * TILE,
      pin() { performance.now = () => clk; },
      unpin() { performance.now = realNow; },
      seed(tag) {
        let sd = 0; for (let q = 0; q < tag.length; q++) sd = (sd * 131 + tag.charCodeAt(q)) >>> 0;
        sd = (sd + 0x9e3779b9) >>> 0;
        F._rand = F._rand || Math.random;
        Math.random = () => {
          sd = (sd + 0x6d2b79f5) >>> 0;
          let x = sd; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
          return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
        };
      },
      unseed() { if (F._rand) Math.random = F._rand; },
      clear() { for (const k in keys) delete keys[k]; for (const k in keysP) delete keysP[k]; },
      // a fresh C3 with the wake done: he is on the arena floor at bx, she at px
      stage(bx, px, o) {
        o = o || {};
        const sv = newSave(1); sv.time = 99;
        Object.assign(sv.flags, { tut: 1, woke: 1, hymnTold: 1, fcBellowsTold: 1, parryTold: 1 });
        sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
        startGame(sv); loadRoom('C3');
        G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.cut = null; G.wake = null; G.bossEntry = null; G.tut = null;
        G.projs.length = 0; G.enemies.length = 0;
        F.clear();
        const b = G.boss;
        b.st = 'idle'; b.t = 99; b.nestLanded = true; b.dead = false; b.stagT = 0; b.hurtT = 0;
        b.phase = o.phase || 1; b.hp = b.phase === 2 ? Math.floor(b.hpMax * 0.45) : b.hpMax;
        b.meltUsed = o.melt ? false : true; b.dazeCD = 99; b.fbCD = 99; b.slamCD = 0; b.hymnCD = 0; b.dropCD = 0;
        b.openT = 0; b.forge = []; b.slag = null; b.hymn = null; b.whiteHot = 0;
        b.fcArm = false; b.fcHits = 0; b.fcStreak = 0; b.fcGotHer = false; b.fcLast = null; b.deckLast = [];
        b._fcPh = b.phase; b.embT = 99;
        b.x = bx - b.w / 2; b.y = F.floor - b.h; b.vx = 0; b.vy = 0;
        player.x = px - player.w / 2; player.y = F.floor - player.h; player.vx = 0; player.vy = 0; player.on = true;
        player.iT = 99; player.dead = false; player.cores = player.maxCores(); player.guardT = 0; player.guardHeat = 0;
        player.guardBreakT = 0; player.parryLockT = 0; player.counterT = 0; player.counterAct = null; player.atkCD = 0;
        player.face = player.faceVis = Math.sign(bx - px) || 1; player.swing = null; player.dizzyT = 0;
        b.face = b.faceVis = Math.sign(px - bx) || -1;
        // let both settle onto the drawn floor (C3's ground rolls)
        for (let i = 0; i < 12; i++) { b.t = 99; F.tick(); }
        player.x = px - player.w / 2; player.vx = 0;
        b.fcLog = []; b._fcLogSt = null;
        return b;
      },
      tick() { clk += 1000 / 60; G.dialog = null; if (G.state !== 'PLAY') G.state = 'PLAY'; update(F.DT); },
      // run until `done(b)` or `secs`; the hold callback runs before each step
      run(secs, done, hold) {
        const b = G.boss, n = Math.round(secs / F.DT);
        for (let i = 0; i < n; i++) {
          if (hold) hold(b, i);
          F.tick();
          if (done && done(b)) return i + 1;
        }
        return n;
      },
      log() { return (G.boss.fcLog || []).slice(); },
      // durations of each logged state, in ms (the last one is still running)
      durs(L) { return L.map((e, i) => [e[0], i + 1 < L.length ? Math.round((L[i + 1][1] - e[1]) * 1000) : null]); },
      swing() { keysP.KeyX = 1; keys.KeyX = 1; F.tick(); keysP.KeyX = 0; keys.KeyX = 0; },
    };
    F.pin();
  });

  // ======================================================================
  // 1. EVERY MOVE: TELL -> ACTIVE -> RECOVERY
  // ======================================================================
  const moves = await page.evaluate(() => {
    const out = {};
    const tellRe = TELL_ST;
    const TELLS = { lob: 'lobwarn', slam: 'slamwarn', forgebell: 'forgebell', hymn: 'hymn', vent: 'ventwarn', drop: 'dropcrouch', melt: 'meltwarn' };
    for (const phase of [1, 2]) for (const mv of ['lob', 'slam', 'forgebell', 'hymn', 'vent', 'drop', 'melt']) {
      if (mv === 'drop' && phase === 1) continue;
      F.seed('move|' + mv + '|' + phase);
      const near = mv === 'slam' || mv === 'vent';
      const b = F.stage(560, near ? 480 : 300, { phase, melt: mv === 'melt' });
      const p0 = G.projs.length;
      let projAt = null, strikes = [], landedX = null;
      fcStart(b, mv);
      const lockX = { v: null };
      const n = F.run(9, (bb) => {
        if (projAt == null && G.projs.length > p0) projAt = bb._fcClk;
        if ((bb.fbStruck || 0) > strikes.length) strikes.push(bb._fcClk);
        if (bb.st === 'droplock' && lockX.v == null) lockX.v = bb.cx();
        if (bb.st === 'recover' && bb.recMv === 'drop' && landedX == null) landedX = bb.cx();
        // stop at the next wind-up after the move has gone off (the drop's
        // lock is a tell inside its own sentence, not the next move)
        const L = bb.fcLog, last = L[L.length - 1];
        return L.length > 1 && last[0] !== 'droplock' && tellRe.test(last[0]);
      }, (bb) => { player.iT = 99; player.cores = player.maxCores(); bb.fbCD = 99; if (mv !== 'melt') bb.meltUsed = true; });
      const L = F.log();
      const t0 = L.length ? L[0][1] : 0;
      out[phase + ':' + mv] = {
        seq: F.durs(L), steps: n,
        projMs: projAt == null ? null : Math.round((projAt - t0) * 1000),
        strikesMs: strikes.map(s => Math.round((s - t0) * 1000)),
        lockX: lockX.v, landedX, rings: G.boss.hymn ? G.boss.hymn.n : null,
      };
      F.unseed();
    }
    return out;
  });
  const D = (k, st, nth) => { const m = moves[k]; if (!m) return null; const e = m.seq.filter(d => d[0] === st)[nth || 0]; return e ? e[1] : null; };
  const seqStr = k => moves[k].seq.map(d => d[0] + (d[1] != null ? '(' + d[1] + ')' : '')).join(' > ');
  const tellRe = /warn|charge|crouch|coil|lock|prep|spin|gather|roar|volley|broodcall|forgebell|hymn/i;
  const SENT = {
    lob: ['lobwarn', null, 'idle'], slam: ['slamwarn', null, 'recover'], forgebell: ['forgebell', null, 'idle'],
    hymn: ['hymn', null, 'recover'], vent: ['ventwarn', 'vent', 'recover'], drop: ['dropcrouch', 'dive', 'recover'],
    melt: ['meltwarn', null, 'recover'],
  };
  const table = {};
  for (const phase of [1, 2]) for (const mv of Object.keys(SENT)) {
    const k = phase + ':' + mv; if (!moves[k]) continue;
    const [tell, act, rec] = SENT[mv];
    const names = moves[k].seq.map(d => d[0]);
    const iT = names.indexOf(tell), iA = act ? names.indexOf(act) : iT, iR = names.indexOf(rec, iA + 1);
    check('p' + phase + ' ' + mv + ': tell -> active -> recovery', iT === 0 && iA >= iT && iR > iA, seqStr(k));
    const restNames = names.slice(iT + 1, iR + 1);
    check('p' + phase + ' ' + mv + ': the tell is a TELL_ST name, nothing after it in the move is',
      tellRe.test(tell) && restNames.every(n => !tellRe.test(n) || n === 'droplock'), tell + ' / ' + restNames.join(','));
    table[k] = { tell: D(k, tell), act: act ? D(k, act) : null, rec: D(k, rec, rec === 'idle' ? 0 : 0) };
  }
  // the tells, each against its floor (the zone-C floor is 400 ms; the
  // backdraft's phase-two 400 is the shortest, answered by a step back)
  const tellFloor = { lob: 430, slam: 530, forgebell: 1480, hymn: 980, vent: 380, drop: 580, melt: 1180 };
  for (const k in table) {
    const mv = k.split(':')[1];
    check(k + ' tell >= ' + tellFloor[mv] + ' ms', table[k].tell >= tellFloor[mv], table[k].tell + ' ms');
  }
  // the forge bell's first strike, and the drop's lock -> impact (the read)
  for (const ph of [1, 2]) {
    const fb = moves[ph + ':forgebell'];
    check('p' + ph + ' forgebell: the first clapper strike lands >= 430 ms in, three strikes 300 ms apart',
      fb.strikesMs.length === 3 && fb.strikesMs[0] >= 430 && Math.abs(fb.strikesMs[1] - fb.strikesMs[0] - 300) <= 34,
      fb.strikesMs.join(', ') + ' ms');
    const lb = moves[ph + ':lob'];
    check('p' + ph + ' lob: the fireball leaves as the tell ends', lb.projMs != null && Math.abs(lb.projMs - table[ph + ':lob'].tell) <= 34, lb.projMs + ' ms');
  }
  const lockToImpact = (D('2:drop', 'droplock') || 0) + (D('2:drop', 'dive') || 0);
  check('p2 drop: lock -> impact gives the read >= 400 ms', lockToImpact >= 400, lockToImpact + ' ms (lock ' + D('2:drop', 'droplock') + ' + fall ' + D('2:drop', 'dive') + ')');
  check('p2 drop: he lands where the lock marked (no tracking after the lock)', moves['2:drop'].lockX != null && Math.abs(moves['2:drop'].lockX - moves['2:drop'].landedX) < 2,
    'lock ' + Math.round(moves['2:drop'].lockX) + ' / landed ' + Math.round(moves['2:drop'].landedX));
  check('hymn: two rings in phase one, three in phase two', moves['1:hymn'].rings === 2 && moves['2:hymn'].rings === 3, moves['1:hymn'].rings + ' / ' + moves['2:hymn'].rings);
  // every recovery is an opening: planted ones by their own length, the
  // walk-ins by how long before the next wind-up may begin
  const opening = {};
  for (const k in table) {
    const mv = k.split(':')[1];
    if (mv === 'lob' || mv === 'forgebell') {
      // released into the walk-in: the time until his next wind-up
      const seq = moves[k].seq, i = seq.findIndex(d => d[0] === 'idle');
      opening[k] = i >= 0 && seq[i][1] != null ? seq[i][1] - 33 : null;
    } else opening[k] = table[k].rec != null ? table[k].rec - 33 : null;
  }
  const thin = Object.entries(opening).filter(([, v]) => !(v >= 250));
  check('every recovery is an opening >= 250 ms (opening = recovery - 33 ms)', !thin.length,
    Object.entries(opening).map(([k, v]) => k + ' ' + v).join(', '));

  // ======================================================================
  // 2. THE OPENINGS, STRUCK — two hits fit; the third wakes the bellows
  // ======================================================================
  const struck = await page.evaluate(() => {
    const res = {};
    for (const [mv, phase] of [['slam', 1], ['hymn', 1], ['lob', 1], ['lob', 2], ['forgebell', 2], ['drop', 2]]) {
      F.seed('struck|' + mv + '|' + phase);
      const b = F.stage(560, 470, { phase });
      // nothing else may start inside the window being struck
      b.slamCD = 99; b.hymnCD = 99; b.dropCD = 99;
      fcStart(b, mv);
      // through the move to its release
      const rel = mv === 'lob' || mv === 'forgebell' ? 'idle' : 'recover';
      F.run(5, bb => bb.st === rel && bb.fcLog.length > 1, () => { player.iT = 99; });
      // she stands at his edge, facing him, and swings on a combo's pace
      const hits = []; let vent = null, swings = 0;
      const hp0 = b.hp; let hpPrev = b.hp;
      for (let i = 0; i < 90 && !vent; i++) {
        const side = player.x + player.w / 2 < b.cx() ? -1 : 1;
        player.x = b.cx() + side * (b.w / 2 + 8) - (side < 0 ? player.w : 0);
        player.y = b.y + b.h - player.h; player.vx = 0; player.iT = 99;
        player.face = player.faceVis = -side;
        if (i % 16 === 0 && hits.length < 3) { F.swing(); swings++; } else F.tick();
        if (b.hp < hpPrev) hits.push({ st: b.st, k: hits.length + 1 });
        hpPrev = b.hp;
        if (b.st === 'ventwarn') vent = { afterHit: hits.length };
        if (/warn|forgebell|hymn|crouch/.test(b.st) && b.st !== 'ventwarn') break;
      }
      res[phase + ':' + mv] = { hits: hits.length, during: hits.map(h => h.st), vent, armed: !!vent || b.fcArm, swings };
      F.unseed();
    }
    // a window she was GIVEN is hers: three hits inside the Song's stagger in a
    // guarded opening do not wake the bellows (dealDmg, as her claws call it)
    {
      const b = F.stage(560, 470, { phase: 2 });
      b.slamCD = 99; b.hymnCD = 99; b.dropCD = 99;
      fcStart(b, 'slam');
      F.run(3, bb => bb.st === 'recover', () => { player.iT = 99; });
      b.stagT = 0.9;
      for (let i = 0; i < 3; i++) { dealDmg(b, 1, null, b.cx(), b.cy(), true); F.tick(); }
      F.run(1.2, null, () => { player.iT = 99; });
      res.songStagger = { st: b.st, hits: b.fcHits, sawVent: b.fcLog.some(e => e[0] === 'ventwarn') };
    }
    return res;
  });
  for (const k of ['1:slam', '1:hymn']) {
    const r = struck[k];
    check(k + ': the opening takes two hits, and the THIRD wakes the bellows',
      r.vent && r.vent.afterHit === 3 && r.during.slice(0, 2).every(s => s === 'recover' || s === 'idle'), JSON.stringify(r));
  }
  check('p1 lob: the walk-in is free — three hits do not wake the bellows in phase one',
    !struck['1:lob'].vent && struck['1:lob'].hits >= 3, JSON.stringify(struck['1:lob']));
  for (const k of ['2:lob', '2:forgebell', '2:drop']) {
    const r = struck[k];
    check(k + ': phase two guards every opening — the third hit wakes it', r.vent && r.vent.afterHit === 3, JSON.stringify(r));
  }

  check('...but not inside a stagger she was given (the Song): a reward does not bite back',
    !struck.songStagger.sawVent, JSON.stringify(struck.songStagger));

  // ======================================================================
  // 3. THE BELLOWS — the cone, its answers, and the parry
  // ======================================================================
  const bel = await page.evaluate(() => {
    const out = {};
    const go = (o) => {
      F.seed('vent|' + JSON.stringify(o));
      const b = F.stage(560, 490, { phase: o.phase || 1 });
      player.iT = 0; player.parryLockT = 0;
      fcStart(b, 'vent');
      const c0 = player.cores; let parryableEarly = null, parryableLate = false, raised = null, jumped = null;
      let maxFeet = 0; const L0 = G.parryLog ? G.parryLog.length : 0;
      F.run(1.6, bb => bb.st === 'recover' || bb.st === 'stagger', (bb, i) => {
        if (bb.st === 'ventwarn' && parryableEarly == null) parryableEarly = !!bb.parryable;
        if (o.behind && bb.st === 'ventwarn' && bb.t < 0.3 && !o._moved) {
          o._moved = 1; player.x = bb.cx() - bb.face * (bb.w / 2 + 30) - player.w / 2;
        }
        if (o.guard === 'held') keys.KeyL = 1;
        if (o.guard === 'fresh' && bb.st === 'ventwarn' && bb.t <= 0.06 && raised == null) { raised = +bb.t.toFixed(3); keys.KeyL = 1; }
        if (o.jump != null && bb.st === 'ventwarn' && bb.t <= o.jump && jumped == null) { jumped = +bb.t.toFixed(3); keysP.KeyZ = 1; keys.KeyZ = 1; }
        else if (jumped != null) { keysP.KeyZ = 0; }
        if (bb.st === 'vent') maxFeet = Math.max(maxFeet, F.floor - (player.y + player.h));
      });
      // the glint is read from the machine a step before the blow
      const b2 = G.boss;
      const res = { st: b2.st, lost: c0 - player.cores, parries: (G.parryLog ? G.parryLog.length : 0) - L0,
        parryKind: G.parryLog && G.parryLog.length > L0 ? G.parryLog[G.parryLog.length - 1].kind : null,
        counter: player.counterT > 0, raised, jumped, parryableEarly, airborneAt: Math.round(maxFeet),
        stagger: b2.st === 'stagger' ? +b2.t.toFixed(2) : null };
      F.clear(); F.unseed();
      return res;
    };
    out.front = go({});
    out.behind = go({ behind: true });
    out.held = go({ guard: 'held' });
    out.fresh = go({ guard: 'fresh' });
    out.fresh2 = go({ guard: 'fresh', phase: 2 });
    // the jump: which take-off times (s before the vent) clear the cone
    out.jumps = [0.4, 0.3, 0.22, 0.16, 0.1, 0.05].map(j => { const r = go({ jump: j }); return { j, lost: r.lost, air: r.airborneAt }; });
    // the glint's window, sampled frame by frame through one wind-up
    {
      const g = [];
      const b3 = F.stage(560, 490, {}); fcStart(b3, 'vent');
      for (let i = 0; i < 60 && (b3.st === 'ventwarn' || b3.st === 'vent'); i++) {
        player.iT = 99; F.tick();
        g.push([b3.st, +(b3.t || 0).toFixed(3), !!b3.parryable]);
      }
      const lit = g.filter(e => e[2]);
      out.glint = { first: lit.length ? lit[0] : null, warnLitMs: Math.round(g.filter(e => e[0] === 'ventwarn' && e[2]).length * F.DT * 1000), anyEarly: g.some(e => e[0] === 'ventwarn' && e[1] > 0.17 && e[2]) };
    }
    // the counter lands: a parry, then ATTACK inside the counter window
    {
      const b = F.stage(560, 490, {}); player.iT = 0; fcStart(b, 'vent');
      let raised = false;
      F.run(1.2, bb => bb.st === 'stagger', (bb) => { if (bb.st === 'ventwarn' && bb.t <= 0.05 && !raised) { raised = true; keys.KeyL = 1; } });
      keys.KeyL = 0; F.tick();
      const hp0 = b.hp; G.lastCounter = null;
      F.swing();
      F.run(0.5, () => !!G.lastCounter);
      out.counter = { kind: G.lastCounter && G.lastCounter.kind, dealt: G.lastCounter && G.lastCounter.dealt, hpDrop: hp0 - b.hp, st: b.st };
      F.clear();
    }
    return out;
  });
  check('the backdraft takes a body standing in front of him (the control)', bel.front.lost >= 1 && bel.front.parries === 0, JSON.stringify(bel.front));
  check('...a body that steps BEHIND him during the breath is not in the cone', bel.behind.lost === 0, JSON.stringify(bel.behind));
  const clear = bel.jumps.filter(j => j.lost === 0);
  check('...a jump timed off the breath clears it (some take-off in the last 400 ms is safe)', clear.length >= 1,
    bel.jumps.map(j => j.j + 's:' + (j.lost ? 'hit' : 'clear') + '@' + j.air + 'px').join(' '));
  check('...a brace held from the start of the breath only blocks: no core, no clash', bel.held.lost === 0 && bel.held.parries === 0 && bel.held.st !== 'stagger', JSON.stringify(bel.held));
  check('a PERFECT GUARD turns it: he chokes (stagger), she takes nothing, the counter opens',
    bel.fresh.parries === 1 && bel.fresh.parryKind === 'atlas' && bel.fresh.st === 'stagger' && bel.fresh.lost === 0 && bel.fresh.counter, JSON.stringify(bel.fresh));
  check('...in phase two as well (the 400 ms breath)', bel.fresh2.parries === 1 && bel.fresh2.st === 'stagger' && bel.fresh2.lost === 0, JSON.stringify(bel.fresh2));
  check('...and the choke is an opening of >= 867 ms (the one gift-sized window, for the hardest read)',
    bel.fresh.stagger != null && bel.fresh.stagger >= 0.9, bel.fresh.stagger + ' s left after the clash');
  check('the lime glint is lit only in its window (the last 150 ms of the breath, and the blast)',
    bel.glint.first && !bel.glint.anyEarly && bel.glint.warnLitMs >= 117 && bel.glint.warnLitMs <= 184, JSON.stringify(bel.glint));
  check('the counter lands on him after the clash', bel.counter.kind === 'atlas' && bel.counter.hpDrop > 0, JSON.stringify(bel.counter));

  // ======================================================================
  // 4. THE DROP — locks, lands where it locked, and has two answers
  // ======================================================================
  const drop = await page.evaluate(() => {
    const run = (mode) => {
      F.seed('drop|' + mode);
      const b = F.stage(560, 380, { phase: 2 });
      player.iT = 0;
      fcStart(b, 'drop');
      const c0 = player.cores; let lockAt = null, jumped = false, dx = null;
      F.run(3, bb => bb.st === 'idle' || (bb.st === 'recover' && bb._fcClk - (lockAt || 0) > 0.8), (bb) => {
        if (bb.st === 'droplock' && lockAt == null) lockAt = bb._fcClk;
        if (mode === 'leave' && lockAt != null && bb.st !== 'idle') {
          // she walks off the mark the moment it locks, and jumps the wave when it comes
          const away = Math.sign(player.x + player.w / 2 - (bb.dropX || bb.cx())) || -1;
          keys[away < 0 ? 'ArrowLeft' : 'ArrowRight'] = 1;
          const pcx = player.x + player.w / 2;
          const wave = G.projs.find(p => !p.friendly && Math.abs(p.vy || 0) < 1 && Math.abs(p.x - pcx) < 70 && Math.sign(p.vx) === away);
          if (wave && !jumped && player.on) { jumped = true; keysP.KeyZ = 1; keys.KeyZ = 1; } else keysP.KeyZ = 0;
        }
        if (mode === 'dash' && lockAt != null && !jumped) {
          const away = Math.sign(player.x + player.w / 2 - (bb.dropX || bb.cx())) || -1;
          keys[away < 0 ? 'ArrowLeft' : 'ArrowRight'] = 1;
          if (bb._fcClk - lockAt > 0.05 && !dx) { dx = 1; keysP.KeyC = 1; keys.KeyC = 1; } else { keysP.KeyC = 0; keys.KeyC = 0; }
          const pcx = player.x + player.w / 2;
          const wave = G.projs.find(p => !p.friendly && Math.abs(p.vy || 0) < 1 && Math.abs(p.x - pcx) < 70 && Math.sign(p.vx) === away);
          if (wave && player.on) { jumped = true; keysP.KeyZ = 1; keys.KeyZ = 1; }
        }
      });
      const r = { lost: c0 - player.cores, gap: Math.round(Math.abs(player.x + player.w / 2 - G.boss.cx())), log: F.durs(F.log()).map(d => d[0]).join('>'), jumped };
      F.clear(); F.unseed();
      return r;
    };
    return { stay: run('stay'), leave: run('leave'), dash: run('dash') };
  });
  check('the drop takes a body that stays on the marked floor (the control)', drop.stay.lost >= 1, JSON.stringify(drop.stay));
  check('...a body that leaves the mark at the lock and jumps the wave takes nothing', drop.leave.lost === 0, JSON.stringify(drop.leave));
  check('...and so does one that DASHES off the mark', drop.dash.lost === 0, JSON.stringify(drop.dash));

  // ======================================================================
  // 5. PHASE TWO CHANGES THE QUESTION — the deck by phase and range
  // ======================================================================
  const deck = await page.evaluate(() => {
    const out = {};
    for (const phase of [1, 2]) for (const [band, dist] of [['near', 120], ['far', 520]]) {
      F.seed('deck|' + phase + '|' + band);
      const b = F.stage(560, 560 - dist, { phase });
      const cnt = {}; let n = 0;
      for (let i = 0; i < 400; i++) {
        b.hymnCD = 0; b.dropCD = 0; b.forge = []; b.slag = null; b.openT = 0;
        if (i % 2) b.fcLast = null;           // half the draws fresh off a different move
        const mv = fcDraw(b, dist);
        cnt[mv] = (cnt[mv] || 0) + 1; n++; b.fcLast = mv;
      }
      for (const k in cnt) cnt[k] = Math.round(cnt[k] / n * 100);
      out[phase + ':' + band] = cnt;
      F.unseed();
    }
    return out;
  });
  console.log('       deck %  ' + Object.entries(deck).map(([k, v]) => k + ' ' + JSON.stringify(v)).join('  '));
  check('phase one never draws the drop', !deck['1:near'].drop && !deck['1:far'].drop, JSON.stringify(deck['1:far']));
  check('phase two: the drop takes distance away (>= 30% of far draws)', (deck['2:far'].drop || 0) >= 30, JSON.stringify(deck['2:far']));
  check('...and never at his feet (the near deck has no drop)', !deck['2:near'].drop, JSON.stringify(deck['2:near']));
  check('the near deck is not the far deck in either phase (the bells close, the lob far)',
    (deck['1:near'].hymn || 0) > (deck['1:far'].hymn || 0) && (deck['1:far'].lob || 0) > (deck['1:near'].lob || 0), JSON.stringify(deck));

  // ======================================================================
  // 6. THE VETO LIST AND THE COLD-DICE FLOOR
  // ======================================================================
  const veto = await page.evaluate(() => {
    const out = {};
    F.seed('veto');
    const b = F.stage(560, 40, { phase: 2 });
    const draw = (setup) => { const c = {}; for (let i = 0; i < 200; i++) { b.hymnCD = 0; b.dropCD = 0; b.fcLast = null; b.openT = 0; setup(); const mv = fcDraw(b, 520); c[mv] = (c[mv] || 0) + 1; } return c; };
    out.forge = draw(() => { b.forge = [{ x: 100, y: 0, landed: false, t: 3 }]; b.slag = null; });
    out.slag = draw(() => { b.forge = []; b.slag = { t: 0, life: 6, h: 0 }; });
    out.nearSlag = (() => { const c = {}; for (let i = 0; i < 200; i++) { b.hymnCD = 0; b.dropCD = 0; b.fcLast = null; b.forge = []; b.slag = { t: 0, life: 6, h: 0 }; const mv = fcDraw(b, 120); c[mv] = (c[mv] || 0) + 1; } return c; })();
    b.slag = null; b.forge = [];
    b.fcLast = 'drop'; b.openT = 0.3;
    out.dropSlam = fcVeto(b, 'slam');
    b.fcLast = 'drop'; b.dropCD = 0;
    out.dropDrop = fcVeto(b, 'drop');
    // the cold-dice floor: three moves in a row that REACHED her (she stands
    // in them, open) -> the next is a lob, read off the ledger the fight keeps
    const b2 = F.stage(560, 480, { phase: 1 });
    const got = [];
    for (const mv of ['slam', 'hymn', 'slam']) {
      player.iT = 0; player.cores = player.maxCores();
      fcStart(b2, mv);
      const c0 = player.cores;
      F.run(3, bb => bb.st === 'idle' && bb.fcLog.length > 2, (bb) => { player.x = bb.cx() - 80 - player.w / 2; player.vx = 0; bb.slamCD = 99; bb.hymnCD = 99; bb.t = Math.max(bb.t, bb.st === 'idle' ? 1 : -1); });
      got.push(c0 - player.cores);
      b2.fcLog = [];
    }
    b2.st = 'idle'; b2.t = 0; b2.openT = 0; b2.slamCD = 0; b2.hymnCD = 0;
    const streak = (b2.fcStreak || 0) + (b2.fcGotHer ? 1 : 0);
    player.iT = 99; F.tick();
    out.cold = { got, streak, next: b2.st };
    // ...and with a cold ledger the same spot draws the slam (it is near)
    const b3 = F.stage(560, 480, { phase: 1 });
    b3.st = 'idle'; b3.t = 0; b3.openT = 0; b3.slamCD = 0; b3.fcStreak = 0;
    F.tick();
    out.warm = { next: b3.st };
    F.unseed();
    return out;
  });
  check('veto: no drop while forge weapons are live', !veto.forge.drop, JSON.stringify(veto.forge));
  check('veto: no drop and no hymn while the slag pours', !veto.slag.drop && !veto.slag.hymn && !veto.nearSlag.hymn, JSON.stringify(veto.slag) + ' near ' + JSON.stringify(veto.nearSlag));
  check('veto: no slam straight off a drop, no drop straight off a drop', veto.dropSlam && veto.dropDrop);
  check('the cold-dice floor: after three moves that reached her, the next is the lob (a cold ledger slams)',
    veto.cold.got.every(n => n >= 1) && veto.cold.streak >= 3 && veto.cold.next === 'lobwarn' && veto.warm.next === 'slamwarn', JSON.stringify(veto.cold) + ' / ' + JSON.stringify(veto.warm));

  // ======================================================================
  // 7. EVERY STATE DRAWS
  // ======================================================================
  const drawn = await page.evaluate(async () => {
    F.unpin();
    const b = F.stage(560, 300, { phase: 2 });
    if (typeof mediaFetch === 'function') mediaFetch(BOSS_ART.atlas, true);
    const t0 = Date.now();
    while (!(typeof drgImg === 'function' && drgImg() && drgImg().naturalWidth) && Date.now() - t0 < 20000) await new Promise(r => setTimeout(r, 50));
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
    const c = cv.getContext('2d');
    const out = {};
    for (const [st, set] of [['idle', {}], ['lobwarn', { t: 0.2 }], ['slamwarn', { t: 0.3 }], ['forgebell', { t: 1 }], ['hymn', { t: 0.5 }],
      ['ventwarn', { t: 0.2 }], ['vent', { t: 0.1 }], ['stagger', { t: 0.5 }], ['recover', { t: 0.4, recMv: 'vent' }], ['recover', { t: 0.4, recMv: 'drop' }],
      ['dropcrouch', { t: 0.3 }], ['rise', { t: 0.2, dropFloor: 480 }], ['droplock', { t: 0.2, dropFloor: 480, dropX: 560 }], ['dive', { t: 0.5, dropFloor: 480, dropX: 560 }],
      ['meltwarn', { t: 0.5 }]]) {
      b.st = st; Object.assign(b, set);
      let ok = false, err = null;
      try { c.save(); c.translate(200 - b.cx(), 260 - (b.y + b.h)); ok = drawFurnace(c, b) === true; c.restore(); } catch (e) { err = String(e); }
      out[st + (set.recMv ? ':' + set.recMv : '')] = err || ok;
    }
    F.pin();
    return out;
  });
  const bad = Object.entries(drawn).filter(([, v]) => v !== true);
  check('every state of the fight draws from his own sheet', !bad.length, bad.map(([k, v]) => k + '=' + v).join(', ') || Object.keys(drawn).length + ' states');

  await page.evaluate(() => F.unpin());
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

  // the move table, as measured, for docs/combat/BOSS_FURNACE.md
  console.log('\n  measured sentences:');
  for (const k of Object.keys(moves)) console.log('    ' + k.padEnd(12) + seqStr(k));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — FURNACE CHOIR tells every move, opens after every move, answers the third hit, and changes the question in phase two');
})().catch(e => { console.error(e); process.exit(1); });
