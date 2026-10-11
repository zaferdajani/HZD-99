// THE ATTACK TABLE, AS THE PLAYER FEELS IT (handoff Part 2, A1-A3).
//
// Every move she has is swung, thrown or released at a dummy on the real
// build, through the same input and the same methods play uses, and three
// things are read off the dummy and the world: the damage it took, the
// velocity the blow gave it, and the hit-stop the blow put on the game. The
// table it prints is what the player experiences, not what ATTACKS claims.
//
// What it holds the build to:
//   1. DAMAGE IS UNCHANGED by the table refactor. The expected numbers below
//      are the PRE-REFACTOR formulas, written out here by hand from the code
//      as it stood at 5b32ae4 (Player.dmg(), the inline swing multipliers,
//      the plunge ring, the throw, the swirl, the burst, the bolt, the
//      grappling claw's bite and arrival). They are deliberately NOT read
//      from ATTACKS: a table that drifted would otherwise agree with itself.
//      Each move is measured across a matrix of builds (difficulty, weapon
//      tier, crests, relics, the resolve flag, skills, feral claws, a forced
//      lens crit, a corrupted target) so every rounding path is exercised.
//   2. KNOCKBACK IS PER ATTACK (A2): a finisher throws farther than a jab,
//      the thrown blade is a spear (~1.5x a jab), and a multi-hit PINS.
//   3. A MULTI-HIT RE-HITS ON A FIXED CLOCK (A3): the swirl's passes land
//      `every` seconds of game time apart, plus or minus one SIM_STEP, the
//      same count whether update() is driven at 1/60 or 1/30.
//   4. ONLY THE FIRST CONTACT FREEZES (A3): the first pass of a multi-hit
//      sets the hit-stop; the later passes leave it at zero.
const { chromium } = require('playwright');
let bad = 0;
const check = (name, ok, note) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : '')); if (!ok) bad++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const r = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1;
    sv.abil = { dash: 1 }; G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r => setTimeout(r, 1500));
    G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.enemies = [];
    const DT = 1 / 60;
    const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyX', 'KeyU', 'ShiftLeft'];
    const clear = () => { for (const k of KEYS) { keys[k] = 0; keysP[k] = 0; } };
    clear();
    for (let i = 0; i < 90; i++) { update(DT); G.dialog = null; G.state = 'PLAY'; }
    // ...on the floor of A1, with the open side of the room in front of her
    const home = { x: player.x, y: player.y };
    const theme0 = G.save.theme;
    const realRandom = Math.random;

    // ---- THE PRE-REFACTOR FORMULAS (5b32ae4), written out ----------------
    const WA = { claws: 1, single: 1.3, dual: 1.6, joined: 1.95 };
    const has = (list, id) => (list || []).indexOf(id) >= 0;
    // Player.dmg(), same factor order, so the rounding is the same rounding
    const base0 = (c) => Math.round(12 * WA[c.mode || 'claws'] * (has(c.crests, 'claws') ? 1.25 : 1)
      * (c.resolve ? 1.18 : 1) * (1 + (has(c.relics, 'fang') ? 0.08 : 0) + (has(c.relics, 'whisker') ? 0.06 : 0))
      * [1.25, 1, 1][c.diff == null ? 1 : c.diff]);
    const wieldOf = (c) => { const m = c.mode || 'claws'; return m === 'joined' ? 2 : m === 'claws' ? 0 : 1; };
    const OLD = {
      swing(c) {
        const w = wieldOf(c);
        let dm = Math.round(base0(c) * (c.combo === 2 ? (has(c.skills, 'calc') ? 1.55 : 1.35) : 1)
          * (c.clawT > 0 ? 1.45 : 1) * (w === 2 ? 1.45 : w ? 1.25 : 1));
        if (w >= 1 && has(c.skills, 'purity') && c.miniboss) dm = Math.round(dm * 1.3);
        if (has(c.relics, 'lens') && c.crit) dm *= 2;
        return dm;
      },
      plunge: (c) => Math.round(base0(c) * 0.6),
      throw: (c) => Math.round(base0(c) * (has(c.skills, 'boomer') ? 1.45 : 1.15)),
      swirl: (c) => Math.max(1, Math.round(base0(c) * 0.95)),
      burst: (c) => Math.round(base0(c) * 3.2),
      thunder: (c) => Math.round(base0(c) * 1.6),
      grapBite: (c) => Math.max(1, Math.round(base0(c) * 0.35)),
      grapHit: (c) => Math.max(1, Math.round(base0(c) * 0.8)),
    };

    // ---- staging -----------------------------------------------------------
    const reset = (c) => {
      clear();
      const s = G.save;
      s.diff = c.diff == null ? 1 : c.diff;
      s.equip = (c.crests || []).slice(); s.relics = (c.relics || []).slice(); s.skills = (c.skills || []).slice();
      s.flags.resolve = c.resolve ? 1 : 0;
      const m = c.mode || 'claws';
      s.flags.crystal = m !== 'claws' ? 1 : 0;
      s.flags.crystal2 = (m === 'dual' || m === 'joined') ? 1 : 0;
      s.flags.connector = m === 'joined' ? 1 : 0;
      s.weaponMode = m;
      s.theme = c.theme || theme0;
      Object.assign(player, { x: c.x != null ? c.x : home.x, y: c.y != null ? c.y : home.y, vx: 0, vy: 0, on: c.air ? false : true,
        face: 1, faceVis: 1, swing: null, swingVis: null, atkCD: 0, atkBuf: 0, combo: 0, comboT: 0, chargeT: 0,
        swirlT: 0, swirlTick: 0, swirlHits: 0, clawT: c.clawT || 0, volts: 99, iT: 999, grap: null, grapCD: 0, grapAir: 0,
        dashT: 0, pogoT: 0, downBuf: 0, healT: 0, guardT: 0, stunT: 0, dizzyT: 0 });
      G.boomer = null; G.enemies.length = 0; G.projs.length = 0; G.hitStop = 0;
    };
    const dummy = (cx, feet, c) => {
      const e = new Enemy('crawler', 0, 0);
      e.x = cx - e.w / 2; e.y = feet - e.h;
      e.hp = e.hpMax = 99999; e.vx = 0; e.vy = 0; e.update = function () {};
      if (c && c.miniboss) e.miniboss = true;
      G.enemies.push(e); return e;
    };
    const pcx = () => player.x + player.w / 2, feet = () => player.y + player.h;
    // run steps until `done`, recording every step on which the dummy lost hp
    // (walk: the body's own speed going into each step, so a PIN has to stop
    // something that is moving rather than merely not push something still)
    const watch = (e, n, dt, step, walk) => {
      const hits = []; let tt = 0;
      for (let i = 0; i < n; i++) {
        const hp0 = e.hp; G.hitStop = 0; e.vx = walk || 0; e.vy = 0;
        step(i); tt += dt;
        if (e.hp < hp0) hits.push({ t: +tt.toFixed(4), dmg: hp0 - e.hp, vx: +e.vx.toFixed(1), vy: +e.vy.toFixed(1), hs: +(G.hitStop || 0).toFixed(4) });
      }
      return hits;
    };

    // a swing through the real input: combo n of the chain, optionally up-aimed
    const swing = (c) => {
      reset(c);
      const e = c.up ? dummy(pcx(), player.y - 6, c) : dummy(player.x + player.w + 14, feet(), c);
      if (c.combo) { player.combo = c.combo - 1; player.comboT = 0.5; }
      if (has(c.relics, 'lens')) Math.random = () => (c.crit ? 0 : 0.999);
      keys.KeyX = 1; keysP.KeyX = 1; if (c.up) keys.ArrowUp = 1;
      let combo = null, ay = null;
      const hits = watch(e, 6, DT, (i) => {
        player.update(DT); keysP.KeyX = 0; keys.KeyX = 0;
        if (player.swing && combo == null) { combo = player.swing.combo; ay = player.swing.ay; }
      });
      Math.random = realRandom; clear();
      return { hits, gotCombo: combo, ay, expect: OLD.swing(c) };
    };
    // the down-slash's plunge ring: one dummy under her feet, one beside her
    const plunge = (c) => {
      reset(Object.assign({ air: true, y: home.y - 70 }, c));
      const under = dummy(pcx(), feet() + 34, c);
      // narrow, so the twin's wider down-box (dual) cannot claim it first: a
      // body the swing already struck is skipped by the ring, by design
      const side = dummy(pcx() + 72, feet(), c);
      side.w = 12; side.x = pcx() + 72 - 6;
      keys.ArrowDown = 1; keys.KeyX = 1; keysP.KeyX = 1;
      let pogo = false;
      const hits = watch(side, 4, DT, () => { player.update(DT); keysP.KeyX = 0; keys.KeyX = 0; if (player.vy < -500) pogo = true; });
      clear();
      return { hits, pogo, underHit: under.hp < 99999, expect: OLD.plunge(c) };
    };
    const thrown = (c) => {
      reset(c);
      const e = dummy(pcx() + 90, feet(), c);
      player.chargeT = 1; player.releaseCharged();
      const out = !!G.boomer;
      const hits = watch(e, 120, DT, () => player.update(DT));
      return { hits, out, expect: OLD.throw(c) };
    };
    const swirl = (c, dt) => {
      reset(c);
      const e = dummy(pcx() + 20, feet(), c);
      player.chargeT = 1; player.releaseCharged();
      const n = Math.ceil(0.9 / dt);
      const hits = watch(e, n, dt, () => player.update(dt), 90);
      return { hits, expect: OLD.swirl(c) };
    };
    const burstAt = (c) => {
      reset(c);
      const e = dummy(pcx() + 70, feet(), c);
      const hits = watch(e, 1, DT, () => { player.chargeT = 1; player.releaseCharged(); });
      return { hits, expect: OLD.burst(c) };
    };
    // NOSTOS's feral finisher calls a bolt; staged above her so only the bolt lands
    const thunder = (c) => {
      reset(Object.assign({ theme: 'hero', clawT: 5 }, c));
      const e = dummy(pcx() + 46, player.y + player.h / 2 - 95 + 12, c);
      player.combo = 1; player.comboT = 0.5;
      keys.KeyX = 1; keysP.KeyX = 1;
      const hits = watch(e, 2, DT, () => { player.update(DT); keysP.KeyX = 0; keys.KeyX = 0; });
      clear(); G.save.theme = theme0;
      return { hits, expect: OLD.thunder(c) };
    };
    const grapple = (c) => {
      reset(c);
      // the open side of the room: whichever way has no wall inside reach
      const open = (dir) => { for (let d = 16; d < 240; d += 8) if (solidAt(Math.floor((pcx() + dir * d) / TILE), Math.floor((player.y + player.h * 0.42) / TILE))) return false; return true; };
      const dir = open(1) ? 1 : -1;
      player.face = player.faceVis = dir;
      const e = dummy(pcx() + dir * 170, feet(), c);
      if (dir < 0) keys.ArrowLeft = 1;
      keysP.KeyU = 1;
      const hits = watch(e, 60, DT, (i) => { player.update(DT); keysP.KeyU = 0; keys.ArrowLeft = 0; });
      clear();
      return { hits, dir, expect: [OLD.grapBite(c), OLD.grapHit(c)] };
    };

    // ---- the build matrix ----------------------------------------------------
    const BUILDS = [
      { name: 'claws, normal', mode: 'claws' },
      { name: 'claws, easy, crest+resolve+fang+whisker', mode: 'claws', diff: 0, crests: ['claws'], resolve: 1, relics: ['fang', 'whisker'] },
      { name: 'single crystal', mode: 'single' },
      { name: 'single, calc+purity, corrupted target', mode: 'single', skills: ['calc', 'purity'], miniboss: 1 },
      { name: 'dual', mode: 'dual' },
      { name: 'joined, easy, crest', mode: 'joined', diff: 0, crests: ['claws'] },
      { name: 'joined, boomer skill, fang', mode: 'joined', skills: ['boomer'], relics: ['fang'] },
    ];
    const out = { swings: [], plunge: [], thrown: [], swirl: [], burst: [], thunder: [], grapple: [] };
    for (const B of BUILDS) {
      for (const combo of [0, 1, 2]) for (const clawT of [0, 3])
        out.swings.push(Object.assign({ build: B.name, combo, clawT }, swing(Object.assign({}, B, { combo, clawT }))));
      // the lens: a forced crit and a forced miss, on the opener and the finisher
      for (const combo of [0, 2]) for (const crit of [true, false])
        out.swings.push(Object.assign({ build: B.name + ' +lens', combo, crit }, swing(Object.assign({}, B, { combo, crit, relics: (B.relics || []).concat('lens') }))));
      if (B.mode !== 'claws') {
        out.swings.push(Object.assign({ build: B.name + ' up', combo: 0, up: true }, swing(Object.assign({}, B, { combo: 0, up: true }))));
        out.plunge.push(Object.assign({ build: B.name }, plunge(Object.assign({}, B, { skills: (B.skills || []).concat('plunge') }))));
      }
      if (B.mode === 'joined') out.thrown.push(Object.assign({ build: B.name }, thrown(B)));
      if (B.mode === 'dual') {
        out.swirl.push(Object.assign({ build: B.name, dt: '1/60' }, swirl(B, 1 / 60)));
        out.swirl.push(Object.assign({ build: B.name, dt: '1/30' }, swirl(B, 1 / 30)));
      }
      if (B.mode === 'claws' || B.mode === 'single') out.burst.push(Object.assign({ build: B.name }, burstAt(B)));
      if (B.mode === 'claws') out.thunder.push(Object.assign({ build: B.name }, thunder(B)));
      if (B.mode === 'claws' || B.mode === 'joined') out.grapple.push(Object.assign({ build: B.name }, grapple(B)));
    }
    // a swirl on the dual build with the easy multiplier, so its floor and
    // rounding are walked through a second base value
    const dEasy = { name: 'dual, easy, crest+resolve', mode: 'dual', diff: 0, crests: ['claws'], resolve: 1 };
    out.swirl.push(Object.assign({ build: dEasy.name, dt: '1/60' }, swirl(dEasy, 1 / 60)));
    // the up-slash launcher with risecut, on a crystal
    out.risecut = swing({ mode: 'single', skills: ['risecut'], combo: 0, up: true });
    out.every = typeof ATTACKS !== 'undefined' && ATTACKS.swirl ? ATTACKS.swirl.every : SWIRL_STEP;
    out.simStep = typeof SIM_STEP === 'number' ? SIM_STEP : 1 / 30;
    out.table = typeof ATTACKS !== 'undefined' ? JSON.parse(JSON.stringify(ATTACKS)) : null;
    reset({}); G.save.theme = theme0;
    return out;
  });

  // ---- 1. damage, per attack, per build --------------------------------------
  const f = (h) => h ? h.dmg : 'miss';
  let dmgBad = 0;
  const same = (name, got, want) => { if (got !== want) { dmgBad++; console.log('  FAIL damage ' + name + ': dealt ' + got + ', pre-refactor ' + want); } };
  for (const s of r.swings) {
    const id = s.up ? 'up-slash' : s.combo === 2 ? 'finisher' : 'slash ' + (s.combo + 1);
    same(s.build + ' ' + id + (s.clawT ? ' feral' : '') + (s.crit != null ? (s.crit ? ' CRIT' : ' no-crit') : ''), f(s.hits[0]), s.expect);
    if (s.gotCombo !== s.combo) { dmgBad++; console.log('  FAIL ' + s.build + ' ' + id + ': swung combo ' + s.gotCombo + ', staged ' + s.combo); }
  }
  for (const s of r.plunge) same(s.build + ' plunge ring', f(s.hits[0]), s.expect);
  for (const s of r.thrown) { same(s.build + ' throw (out)', f(s.hits[0]), s.expect); same(s.build + ' throw (back)', f(s.hits[1]), s.expect); }
  for (const s of r.swirl) for (let i = 0; i < 4; i++) same(s.build + ' swirl pass ' + (i + 1) + ' @' + s.dt, f(s.hits[i]), s.expect);
  for (const s of r.burst) same(s.build + ' burst', f(s.hits[0]), s.expect);
  for (const s of r.thunder) same(s.build + ' thunderfall', f(s.hits[0]), s.expect);
  for (const s of r.grapple) { same(s.build + ' claw bite', f(s.hits[0]), s.expect[0]); same(s.build + ' claw arrival', f(s.hits[1]), s.expect[1]); }
  const nMeasured = r.swings.length + r.plunge.length + r.thrown.length * 2 + r.swirl.length * 4 + r.burst.length + r.thunder.length + r.grapple.length * 2;
  check('every attack deals exactly its pre-refactor damage', dmgBad === 0, nMeasured + ' hits measured across ' + 7 + ' builds, ' + dmgBad + ' differ');

  // ---- THE TABLE THE PLAYER EXPERIENCES (claws build, normal difficulty, or the
  // first build that owns the move) -------------------------------------------
  const row = (id, h, extra) => console.log('  ' + id.padEnd(16) + String(h ? h.dmg : '-').padStart(5)
    + String(h ? h.vx : '-').padStart(9) + String(h ? h.vy : '-').padStart(9)
    + String(h ? Math.round(h.hs * 60) + 'f' : '-').padStart(7) + '   ' + (extra || ''));
  console.log('\n  THE TABLE AS PLAYED  (damage, enemy vx, enemy vy, hit-stop in 60 Hz frames)');
  console.log('  ' + 'attack'.padEnd(16) + 'dmg'.padStart(5) + 'vx'.padStart(9) + 'vy'.padStart(9) + 'stop'.padStart(7));
  const pick = (b, combo, clawT, up) => r.swings.find(s => s.build === b && s.combo === combo && (s.clawT || 0) === clawT && !!s.up === !!up && s.crit == null);
  row('slash 1 (claws)', pick('claws, normal', 0, 0).hits[0], 'base ' + pick('claws, normal', 0, 0).expect);
  row('slash 2 (claws)', pick('claws, normal', 1, 0).hits[0]);
  row('finisher (claws)', pick('claws, normal', 2, 0).hits[0]);
  row('feral slash', pick('claws, normal', 0, 3).hits[0], 'feral claws x1.45');
  row('crystal slash', pick('single crystal', 0, 0).hits[0], 'wield x1.25');
  row('crystal finisher', pick('single crystal', 2, 0).hits[0], 'rises: aim ay ' + pick('single crystal', 2, 0).ay);
  row('joined slash', pick('joined, easy, crest', 0, 0).hits[0], 'wield x1.45 (easy, crest)');
  row('risecut', r.risecut.hits[0], 'the launcher');
  row('plunge ring', r.plunge[0].hits[0], 'beside the pogo');
  row('throw (out)', r.thrown[0].hits[0], 'spear');
  row('throw (back)', r.thrown[0].hits[1]);
  const sw = r.swirl[0];
  for (let i = 0; i < sw.hits.length; i++) row('swirl pass ' + (i + 1), sw.hits[i], 't=' + sw.hits[i].t + 's');
  row('burst (claws)', r.burst[0].hits[0]);
  row('thunderfall', r.thunder[0].hits[0], 'NOSTOS feral finisher');
  row('claw bite', r.grapple[0].hits[0]);
  row('claw arrival', r.grapple[0].hits[1]);
  if (r.table) {
    console.log('\n  ATTACKS (the table in the build)');
    for (const k in r.table) console.log('    ' + k.padEnd(10) + JSON.stringify(r.table[k]));
  }
  console.log('');

  // ---- 2. knockback per attack (A2) ------------------------------------------
  const jab = pick('claws, normal', 0, 0).hits[0], fin = pick('claws, normal', 2, 0).hits[0];
  check('a finisher throws farther than a jab', !!(jab && fin) && Math.abs(fin.vx) > Math.abs(jab.vx) * 1.2,
    'jab vx ' + (jab && jab.vx) + ', finisher vx ' + (fin && fin.vx));
  const cjab = pick('single crystal', 0, 0).hits[0], cfin = pick('single crystal', 2, 0).hits[0];
  check('...on a crystal too, where the finisher rises', !!(cjab && cfin) && Math.abs(cfin.vx) > Math.abs(cjab.vx),
    'jab vx ' + (cjab && cjab.vx) + ', rising finisher vx ' + (cfin && cfin.vx));
  const pinned = r.swirl.every(s => s.hits.length && s.hits.every(h => Math.abs(h.vx) <= 1));
  check('a multi-hit PINS: every swirl pass stops a body walking at 90 px/s dead', pinned,
    'pass vx ' + r.swirl[0].hits.map(h => h.vx).join(' / '));
  const th = r.thrown[0].hits[0];
  check('the thrown blade is a spear: ~1.5x a jab', !!(th && jab) && Math.abs(Math.abs(th.vx) / Math.abs(jab.vx) - 1.5) < 0.08,
    'throw vx ' + (th && th.vx) + ' vs jab ' + (jab && jab.vx));
  check('the risecut still LAUNCHES', !!r.risecut.hits[0] && r.risecut.hits[0].vy <= -400, 'vy ' + (r.risecut.hits[0] && r.risecut.hits[0].vy));

  // ---- 3. the multi-hit clock (A3) ---------------------------------------------
  const s60 = r.swirl.find(s => s.dt === '1/60'), s30 = r.swirl.find(s => s.dt === '1/30');
  const gaps = (s) => s.hits.slice(1).map((h, i) => +(h.t - s.hits[i].t).toFixed(4));
  const onClock = (s) => s.hits.length >= 2 && gaps(s).every(g => Math.abs(g - r.every) <= r.simStep + 1e-6);
  check('the swirl re-hits every ' + r.every + ' s of game time (+-1 SIM_STEP) at 1/60', onClock(s60), 'gaps ' + gaps(s60).join(' '));
  check('...and at 1/30', onClock(s30), 'gaps ' + gaps(s30).join(' '));
  const rate = (s) => s.hits.length / (s.hits[s.hits.length - 1].t - s.hits[0].t + r.every);
  check('...the same number of hits per second whatever the step', s60.hits.length === s30.hits.length && Math.abs(rate(s60) - rate(s30)) < 0.75,
    s60.hits.length + ' hits (' + rate(s60).toFixed(2) + '/s) at 1/60, ' + s30.hits.length + ' (' + rate(s30).toFixed(2) + '/s) at 1/30');

  // ---- 4. only the first contact freezes (A3) --------------------------------
  const firstOnly = r.swirl.every(s => s.hits.length >= 2 && s.hits[0].hs >= 0.03 && s.hits.slice(1).every(h => h.hs <= 0.001));
  check('only the first swirl pass freezes the game; the later ticks do not stutter it', firstOnly,
    'hit-stop per pass ' + r.swirl.map(s => s.hits.map(h => Math.round(h.hs * 1000) + 'ms').join('/')).join('  |  '));
  check('single-contact moves still freeze on contact', [jab, fin, th, r.burst[0].hits[0], r.grapple[0].hits[1]].every(h => h && h.hs >= 0.05),
    [jab, fin, th, r.burst[0].hits[0], r.grapple[0].hits[1]].map(h => h ? Math.round(h.hs * 60) + 'f' : 'miss').join(' '));
  check('no page errors', !errs.length, errs[0] || '');
  await b.close();
  if (bad) { console.log('\n' + bad + ' attack check(s) failed'); process.exit(1); }
  console.log('\nOK — one claw stat, a row per move, and the player feels the table that is written');
})().catch(e => { console.error(e); process.exit(1); });
