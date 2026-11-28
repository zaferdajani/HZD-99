// MIREJAW — the swamp crocodile (owner, 2026-11-21). Holds what he asked for:
//   "biting on you and rolling over, which will hurt you more... reduces 2 points"
//   "If it catches you and takes you into the water, that will be bad"
//   "biting should be epic... one of the strongest bites in the whole world"
//   "crocodile skin is super thick, so it needs a weak point to hit"
//   "a swamp with water, platforms on the water, like small islands... zoom out"
// and the ledger's boss law: a player who only mashes LOSES, a player who reads
// him WINS, and no light is drawn round his body.
//
//   node tests/mirejaw.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  const errors = [];
  const page = async () => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    p.on('pageerror', e => errors.push(String(e)));
    await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
    await p.goto('http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => typeof startGame === 'function');
    return p;
  };
  const FLAGS = { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, crystal: 1, bossGlitch: 1, ch2Climb: 1, bossCarrier: 1, ferryPaid: 1, sageTame_GA1D: 1, bossChime: 1, bossHorn: 1, gateOpened: 1, k2Road: 1 };
  let S2 = null;
  console.log('── mirejaw — the hide, the weak points, the death roll, the bite, the bellow, the pool');
  const p = await page();
  const U = await p.evaluate(async (FLAGS) => {
    const out = {};
    for (const k of Object.keys(MEDIA_SRC.images)) if (/^mj/.test(k)) mediaFetch(k, true);
    for (let i = 0; i < 100 && !Object.keys(MEDIA_SRC.images).filter(k => /^mj/.test(k)).every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const fresh = () => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FLAGS); sv.weaponMode = 'single'; startGame(sv); loadRoom('SW3'); G.state = 'PLAY'; G.dialog = null; G.bossEntry = null; };
    fresh();
    const B = G.boss; mjInit(B);
    // the pool: islands, every gap a jump, and the whole of it in the frame
    const g = G.grid, row = MJ.surfRow; let gaps = [], run = 0;
    for (let x = 1; x < g[0].length - 1; x++) { if (mjIsWater(x * TILE + 16)) run++; else { if (run) gaps.push(run); run = 0; } }
    if (run) gaps.push(run);
    out.gaps = gaps;
    out.isles = (() => { let n = 0, inI = false; for (let x = 1; x < g[0].length - 1; x++) { const w = mjIsWater(x * TILE + 16); if (!w && !inI) n++; inI = !w; } return n; })();
    player.x = 18 * TILE; player.y = 200; for (let k = 0; k < 120; k++) { update(1 / 60); G.dialog = null; }
    out.zoom = cam.zoom; out.fitZoom = 960 / (G.roomDef.w * TILE);
    // he comes up only in water a body fits in: never the one-tile channel at a wall
    out.walls = []; { const W = G.roomDef.w * TILE;
      for (let x = 2 * TILE; x < W - 2 * TILE; x += 16) { const wx = mjNearestWater(x); if (wx - 150 < TILE * 0.5 || wx + 150 > W - TILE * 0.5 || !mjIsWater(wx - 44) || !mjIsWater(wx + 44)) out.walls.push(Math.round(x / TILE) + '>' + Math.round(wx)); } }
    // THE HIDE AND ITS WEAK POINTS (types.js dealDmg -> e.hideAt)
    const blow = (st, x) => { B.st = st; B.t = 1; B.mj.t0 = 1; B.hp = B.hpMax; B.iT = 0; B.dazeCD = 99; const h = B.hp; dealDmg(B, 80, null, x, B.mj.feet - 40, false, 'test'); return h - B.hp; };
    B.mj.feet = mjGroundAt(18 * TILE) || 400; B.mj.wx = 18 * TILE; B.mj.face = -1;
    out.back = blow('beached', B.mj.wx + 80);
    out.jaws = blow('beached', mjHeadX(B));
    out.walkHead = blow('backoff', mjHeadX(B));
    out.under = blow('sub', B.mj.wx);
    out.belly = blow('leap', B.mj.wx);
    // HE STANDS ON THE GROUND (owner, 2026-11-21: "four of its limbs is almost on
    // the air"): seated anywhere on any island, facing either way, every paw over
    // land is ON its ground (never in it, never more than a few px over it), a paw
    // over the water is under the surface, and he pitches with the ground
    out.seat = { worst: 0, under: 0, wetAbove: 0, n: 0, tilts: 0 };
    for (let x = 2 * TILE; x < (G.roomDef.w - 2) * TILE; x += 24) {
      if (mjGroundAt(x) == null) continue;
      for (const face of [-1, 1]) {
        B.st = 'beached'; B.t = 1; B.mj.t0 = 1; B.mj.wx = x - face * 70; B.mj.face = face; B.mj.drawY = null; B.mj.tilt = null;
        mjPoseStep(B, 1);
        for (const pw of B.mj.paws) {
          if (pw.wet) { if (pw.y < mjSurfY()) out.seat.wetAbove++; continue; }
          out.seat.n++;
          out.seat.worst = Math.max(out.seat.worst, pw.ground - pw.y);
          if (pw.y > pw.ground + 1) out.seat.under++;
        }
        if (Math.abs(B.mj.tilt) > 0.05) out.seat.tilts++;
      }
    }
    // HE SURFACES ON THE SLANT (owner: "comes up as an elevator instead of
    // swimming up diagonally"): through the warning he travels forward at least
    // as far as he rises, nose first
    { fresh(); const B3 = G.boss; mjInit(B3);
      player.x = 18 * TILE; player.y = 200; for (let k = 0; k < 60; k++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; }
      B3.mj.wx = mjNearestWater(player.x + player.w / 2) - 200; B3.st = 'sub'; B3.t = 0; B3.mj.t0 = 0;
      let a = null, z = null, nose = 0;
      for (let k = 0; k < 600 && !z; k++) {
        G.dialog = null; G.state = 'PLAY'; player.iT = 9; update(1 / 60);
        if (B3.st === 'bitewarn' && !a) a = { x: B3.mj.wx, y: B3.mj.feet };
        if (B3.st === 'bitewarn') nose = Math.max(nose, -B3.mj.face * (B3.mj.tilt || 0));
        if (a && B3.st !== 'bitewarn') z = { x: B3.mj.wx, y: B3.mj.feet };
      }
      out.rise = a && z ? { dx: Math.round(Math.abs(z.x - a.x)), dy: Math.round(a.y - z.y), nose: +nose.toFixed(2) } : null; }
    // THE DEATH ROLL: the jaws close on her, she is held, dragged under, and
    // lets go two cores lighter, on an island
    fresh(); const B2 = G.boss; mjInit(B2);
    player.x = 18 * TILE; player.y = 200; for (let k = 0; k < 60; k++) { update(1 / 60); G.dialog = null; }
    player.cores = player.coresMax || 5; player.iT = 0;
    const c0 = player.cores; let held = false, snap = null, inRoll = 0, lostAt = null, mash = 0; const hurts = [];
    { const h0 = player.hurt.bind(player); player.hurt = function (d, fx, src) { const c = player.cores; const r = h0(d, fx, src); if (player.cores < c) hurts.push((src || '?') + ':' + (c - player.cores)); return r; }; }
    const realPlay = window.playBuf; const heard = [];
    window.playBuf = (k, v, r) => { heard.push(k); return realPlay ? realPlay(k, v, r) : false; };
    B2.mj.wx = mjNearestWater(player.x + player.w / 2); B2.mj.face = Math.sign(player.x - B2.mj.wx) || 1; B2.st = 'sub'; B2.t = 0;
    for (let k = 0; k < 60 * 8; k++) {
      const hs = G.hitStop || 0; player.iT = Math.min(player.iT, 0); update(1 / 60); G.dialog = null;
      if (B2.mj.snapped && !snap) snap = { hitStop: G.hitStop, shake: cam.shake, impact: !!G.impact };
      if (B2.st === 'roll') { inRoll++; held = held || !!G.ghHold; }
      if (inRoll && B2.st !== 'roll') { lostAt = c0 - player.cores; break; }
    }
    out.roll = { inRoll, held, lost: lostAt, hurts, snap, heard: heard.filter(k => /^mj_/.test(k)), onLand: mjGroundAt(player.x + player.w / 2) != null, inWater: mjIsWater(player.x + player.w / 2) && player.y + player.h > mjSurfY() + 14 };
    window.playBuf = realPlay;
    // ...and mashing loosens it
    const rollLen = (presses) => {
      fresh(); const B3 = G.boss; mjInit(B3); player.x = 18 * TILE; player.y = 200;
      for (let k = 0; k < 60; k++) { update(1 / 60); G.dialog = null; }
      B3.mj.held = true; B3.mj.rollFrom = { x: B3.mj.wx, feet: B3.mj.feet }; B3.mj.rollTo = mjNearestWater(B3.mj.wx); mjSet(B3, 'roll', MJ.roll);
      let f = 0; for (; f < 600 && B3.st === 'roll'; f++) { for (const kk in keysP) keysP[kk] = 0; if (presses && f % 6 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } update(1 / 60); keys.KeyX = 0; }
      return f / 60;
    };
    out.rollStill = rollLen(false); out.rollMash = rollLen(true);
    // PHASE TWO: at half, the bellow (a recorded alligator), and his lights go red
    fresh(); const B4 = G.boss; mjInit(B4);
    const heard4 = []; const rp = window.playBuf; window.playBuf = (k) => { heard4.push(k); return false; };
    let rageCalls = 0; const ra = window.rageArt; window.rageArt = (im) => { rageCalls++; return ra(im); };
    B4.mj.feet = mjGroundAt(18 * TILE) || 400; B4.mj.wx = 18 * TILE; B4.hp = Math.floor(B4.hpMax / 2) - 1; B4.mj.hpPrev = B4.hp; B4.st = 'beached'; B4.t = 1; B4.mj.t0 = 1;
    update(1 / 60);
    out.p2 = { phase: B4.phase, st: B4.st, bellow: heard4.indexOf('mj_bellow') >= 0 };
    draw(performance.now());
    out.p2.red = rageCalls > 0;
    window.playBuf = rp; window.rageArt = ra;
    // NO LIGHT ROUND HIS BODY: the shared tell glow is not drawn for him
    let chakra = 0; const dc = window.drawChakra; window.drawChakra = function () { chakra++; return dc.apply(this, arguments); };
    B4.st = 'bitewarn'; B4.t = 0.5; B4.mj.t0 = 0.8; draw(performance.now()); B4.st = 'tailwarn'; draw(performance.now());
    window.drawChakra = dc; out.chakra = chakra;
    // BEATEN: he collapses, sinks, and the seal he swallowed comes back
    fresh(); const B5 = G.boss; mjInit(B5); B5.mj.feet = mjGroundAt(18 * TILE) || 400; B5.st = 'beached';
    G.save.relics = []; B5.die();
    for (let k = 0; k < 60 * 6 && !B5.dead; k++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; }
    out.gone = { dead: B5.dead, flag: !!G.save.flags.bossMirejaw, seal: relicHas('sigil2') };
    return out;
  }, FLAGS);
  check('the wallow is islands in open water: at least four islands', U.isles >= 4, U.isles + ' islands, gaps ' + U.gaps.join('/'));
  check('...and every gap between them is a jump (at most 9 tiles), never a wall of water', U.gaps.every(n => n <= 9), U.gaps.join('/'));
  check('he comes up only in open water his body fits in, never half inside a wall', U.walls.length === 0, U.walls.slice(0, 6).join(' ') || 'every island');
  // (owner, 2026-11-28: every guardian's arena is framed 15% in from whole — "do the same for the rest"; js/engine.js BOSS_FRAME_IN)
  check('the camera pulls back to frame most of the pool: 15% in from the whole of it', U.zoom <= U.fitZoom * 1.15 + 0.02, 'zoom ' + U.zoom.toFixed(2) + ' (whole ' + U.fitZoom.toFixed(2) + ', 15% in ' + (U.fitZoom * 1.15).toFixed(2) + ')');
  check('THE HIDE: a blow on his back turns (an eighth of it)', U.back > 0 && U.back <= U.jaws * 0.2, U.back + ' vs ' + U.jaws);
  check('...the open jaws of a beached crocodile take it whole', U.jaws >= 60, U.jaws);
  check('...the head is armour again once the jaws are not open', U.walkHead <= U.jaws * 0.2, U.walkHead);
  check('...under the water nothing reaches him', U.under === 0, U.under);
  check('...and the pale belly in the air is the other weak point', U.belly >= 60, U.belly);
  check('HE STANDS ON THE GROUND: every paw over an island is on it, none in it, none floating', U.seat.n > 20 && U.seat.under === 0 && U.seat.worst <= 6, JSON.stringify(U.seat));
  check('...a paw past the bank is under the water, and he pitches with the ground', U.seat.wetAbove === 0 && U.seat.tilts > 4, JSON.stringify(U.seat));
  check('HE SURFACES ON THE SLANT, never straight up: forward at least as far as he rises, nose first', U.rise && U.rise.dy >= 30 && U.rise.dx >= U.rise.dy && U.rise.nose >= 0.1, JSON.stringify(U.rise));
  check('THE DEATH ROLL: the bite catches her and drags her under', U.roll.inRoll > 30 && U.roll.held, JSON.stringify({ inRoll: U.roll.inRoll, held: U.roll.held }));
  check('...and costs exactly two cores', U.roll.lost === 2, U.roll.lost + ' (' + U.roll.hurts.join(',') + ')');
  check('...and lets her go on an island, not in the water', U.roll.onLand && !U.roll.inWater, JSON.stringify({ onLand: U.roll.onLand, inWater: U.roll.inWater }));
  check('...and mashing ATTACK shortens it', U.rollMash < U.rollStill - 0.4, U.rollStill.toFixed(2) + ' s still, ' + U.rollMash.toFixed(2) + ' s mashing');
  check('THE BITE is a crunch: the frame stops, the camera jolts, the impact frame', U.roll.snap && U.roll.snap.hitStop >= 0.1 && U.roll.snap.shake >= 12 && U.roll.snap.impact, JSON.stringify(U.roll.snap));
  check('...heard as recordings: the hiss, the eruption, the snap', ['mj_hiss', 'mj_splash', 'mj_snap'].every(k => U.roll.heard.indexOf(k) >= 0), U.roll.heard.join(','));
  check('PHASE TWO at half: the bellow, from a recorded alligator', U.p2.phase === 2 && U.p2.st === 'roarwarn' && U.p2.bellow, JSON.stringify(U.p2));
  check('...and his lights go red', U.p2.red);
  check('no light round his body: the shared tell glow is never drawn for him', U.chakra === 0, U.chakra + ' glows');
  check('beaten: he sinks, and the second seal comes back up', U.gone.dead && U.gone.flag && U.gone.seal, JSON.stringify(U.gone));
  await p.close();

  // ---- NOTHING SLIDES (owner, 2026-11-22: "go on diagonal move, not like
  // sliding, but like either swimming using its tail or legs... or to walk on the
  // inclines"): in a played fight, while a swimming, walking or running strip is
  // drawn, its cell turns over within a stride's share of the distance covered;
  // every other strip is drawn only while his body stands still (the leap, the
  // roll and a dead body sinking are the exceptions: they ARE the travel)
  {
    const q = await page();
    S2 = await q.evaluate(async ({ FLAGS }) => {
      for (const k of Object.keys(MEDIA_SRC.images)) if (/^mj/.test(k)) mediaFetch(k, true);
      for (let i = 0; i < 200 && !Object.keys(MEDIA_SRC.images).filter(k => /^mj/.test(k)).every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 25));
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FLAGS); sv.weaponMode = 'single'; startGame(sv); loadRoom('SW3');
      G.state = 'PLAY'; G.dialog = null; player.x = 18 * TILE; player.y = 150;
      const B = G.boss; const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 600; const c = cv.getContext('2d');
      const LOCO = { mjSwim: 230 / 14, mjWalk: 150 / 16, mjRun: 260 / 14 }, TRAVEL = { mjLeap: 1, mjRoll: 1, mjDown: 1 };
      const run = {}, still = {}; let last = null, worst = { k: '', moved: 0 }, frames = 0, statesSeen = {};
      const tick = () => {
        if (G.dialog || G.state !== 'PLAY') { G.dialog = null; G.cut = null; G.state = 'PLAY'; }
        for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
        player.iT = 9; player.cores = player.coresMax || 5;      // she is a camera here
        update(1 / 60); mjDraw(c, B); frames++;
        const M = B.mj, key = M.drawKey, cell = M.drawCell, pos = [M.wx, M.drawY];
        statesSeen[key] = 1;
        if (last && last.key === key && !B.dead) {
          const d = Math.hypot(pos[0] - last.pos[0], pos[1] - last.pos[1]);
          if (LOCO[key]) {
            if (cell === last.cell) { run[key] = (run[key] || 0) + d; if (run[key] / LOCO[key] > worst.moved) worst = { k: key, moved: +(run[key] / LOCO[key]).toFixed(2), st: B.st }; }
            else run[key] = 0;
          } else if (!TRAVEL[key] && !(key === 'mjBite' && B.st === 'leap') && d > 1.2) { still[key + '@' + B.st] = Math.max(still[key + '@' + B.st] || 0, +d.toFixed(1)); }
        } else { for (const k in run) run[k] = 0; }
        last = { key, cell, pos };
      };
      for (let f = 0; f < 60 * 70 && !B.dead; f++) { if (f === 60 * 25) B.hp = B.hpMax * 0.45; tick(); }   // phase two is seen too
      // ...and a full beaching on the widest island, where his whole body is on land:
      // phase one walks back to the water, phase two turns round and runs for it
      for (const ph of [1, 2]) {
        B.dead = false; B.phase = ph; B.hp = ph === 2 ? B.hpMax * 0.4 : B.hpMax; B.dazeReq = false;
        player.x = 1.5 * TILE; player.y = mjGroundAt(1.5 * TILE) - player.h; player.vx = 0;
        B.mj.wx = 5 * TILE; B.mj.face = -1; B.mj.drawY = null; B.mj.hurtT = 0; B.st = 'beached'; B.t = 0.05; B.mj.t0 = 1;
        last = null;
        for (let f = 0; f < 60 * 3 && B.st !== 'sub'; f++) tick();
      }
      return { worst, still, frames, seen: Object.keys(statesSeen) };
    }, { FLAGS });
    await q.close();
  }
  // ---- SHE IS IN HIS JAWS (owner, 2026-11-22: "create artwork for my hero when it's
  // caught in the alligator's mouth and rolling with it"): through the roll her own
  // held sheet for her weapon tier is drawn at his grip, spinning with him, and her
  // ordinary body is not drawn
  let HELD = null;
  {
    const q = await page();
    HELD = await q.evaluate(async ({ FLAGS }) => {
      const out = {};
      for (const w of ['single', 'dual']) {
        const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FLAGS); sv.weaponMode = w; startGame(sv);
        if (w !== 'single' && typeof grantWeapon === 'function') grantWeapon(w); G.save.weaponMode = w; loadRoom('SW3');
        G.state = 'PLAY'; G.dialog = null; G.bossEntry = null;
        for (const k of ['mjRoll', mjHeldKey()]) mediaFetch(k, true);
        for (let i = 0; i < 200 && !(MEDIA_IMG.mjRoll && MEDIA_IMG.mjRoll.naturalWidth && MEDIA_IMG[mjHeldKey()] && MEDIA_IMG[mjHeldKey()].naturalWidth); i++) await new Promise(r => setTimeout(r, 25));
        const B = G.boss; mjInit(B); const M = B.mj;
        player.x = 18 * TILE; player.y = 300; M.wx = mjNearestWater(18 * TILE); M.feet = mjSurfY() + 40; M.face = 1;
        M.held = true; M.rollFrom = { x: M.wx, feet: M.feet }; M.rollTo = M.wx; G.ghHold = true; mjSet(B, 'roll', 1.9);
        let ordinary = 0; const d0 = player.draw.bind(player); player.draw = function (...a) { ordinary++; return d0(...a); };
        const cells = new Set(), keysSeen = new Set(); let far = 0;
        for (let f = 0; f < 80 && B.st === 'roll'; f++) {
          G.dialog = null; update(1 / 60); draw(performance.now());
          if (M.heroDrawn) { cells.add(M.heroDrawn.cell); keysSeen.add(M.heroDrawn.key); }
          far = Math.max(far, Math.abs((player.x + player.w / 2) - mjHeadX(B)));
        }
        out[w] = { keys: [...keysSeen], cells: cells.size, ordinary, far: Math.round(far) };
      }
      return out;
    }, { FLAGS });
    await q.close();
  }
  check('IN HIS JAWS: through the roll she is drawn from her own held sheet, spinning (most of its turns)', HELD.single.keys.join() === 'heroHeldSingle' && HELD.single.cells >= 6, JSON.stringify(HELD.single));
  check('...holding what she holds (her twin blades with them)', HELD.dual.keys.join() === 'heroHeldDual', JSON.stringify(HELD.dual));
  check('...and her ordinary body is not drawn over it', HELD.single.ordinary === 0 && HELD.dual.ordinary === 0, HELD.single.ordinary + ' / ' + HELD.dual.ordinary);
  check('NOTHING SLIDES: a swimming, walking or running strip turns over with the distance he covers', S2.worst.moved <= 1.8, JSON.stringify(S2.worst) + ' (strides moved on one cell)');
  check('...and every other strip is drawn only while his body is still', Object.keys(S2.still).length === 0, JSON.stringify(S2.still));
  check('...his whole move set shows in a played fight', ['mjSwim', 'mjNotice', 'mjCrouch', 'mjLeap', 'mjLand', 'mjGape', 'mjWalk', 'mjTurn', 'mjRun'].every(k => S2.seen.includes(k)), S2.seen.join(' '));

  // ---- THE BOTS: a masher loses, a player who reads him wins ----
  const fight = async (bot, seed) => {
    const q = await page();
    const r = await q.evaluate(({ FLAGS, bot, seed }) => {
      let h = seed * 2654435761 >>> 0; Math.random = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9 >>> 0) % 100000) / 100000;
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FLAGS); sv.weaponMode = 'single'; startGame(sv); loadRoom('SW3');
      G.state = 'PLAY'; G.dialog = null;
      player.x = 18 * TILE; player.y = 150;
      const B = G.boss; let frames = 0, lost = 0, last = player.cores, rolls = 0, prev = '', st = {}; const srcs = [];
      { const h0 = player.hurt.bind(player); player.hurt = function (d, fx, src) { const c = player.cores; const r = h0(d, fx, src); if (player.cores < c) srcs.push(src || '?'); return r; }; }
      for (; frames < 60 * 180; frames++) {
        if (G.dialog || G.state !== 'PLAY') { G.dialog = null; G.cut = null; G.state = 'PLAY'; }
        if (B.dead || player.dead) break;
        for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
        if (B.st !== prev) { st[B.st] = (st[B.st] || 0) + 1; if (B.st === 'roll') rolls++; prev = B.st; }
        const px = player.x + player.w / 2, M = B.mj || {};
        const go = (tx, tol) => { const d = tx - px; if (Math.abs(d) > (tol || 12)) { const dir = d > 0 ? 1 : -1; keys[dir > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1;
          // a gap of water ahead is JUMPED, never walked into
          if (player.on && mjIsWater(px + dir * 26) && !mjIsWater(px)) { keysP.Space = 1; keys.Space = 1; } else if (!player.on && player.vy < 0) keys.Space = 1; }
          return Math.abs(d) <= (tol || 12); };
        const atk = () => { if (frames % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } };
        if (bot === 'mash') {
          // stands on her island and swings at whatever is in front of her
          go(18 * TILE, 30);
          if (M.wx != null) { const d = M.wx - px; if (Math.sign(d) !== player.face && frames % 20 === 0) keys[d > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; }
          atk();
        } else {
          // READS HIM: away from the boil, onto the jaws when he beaches, over the tail
          if (B.st === 'bitewarn' || B.st === 'leap') {
            const T = M.tgt ? M.tgt.x : px, away = px >= T ? 1 : -1;
            let dest = T + away * 200;
            if (mjGroundAt(dest) == null) dest = T - away * 200;
            if (mjGroundAt(dest) == null) dest = mjNearestLand(T + away * 300) || dest;
            go(dest, 8);
            if (B.st === 'bitewarn' && B.t < 0.35 && Math.abs(px - T) < 120) { keysP.KeyC = 1; keys.KeyC = 1; }
          } else if (B.st === 'beached' || B.st === 'spent') {
            const hx = mjHeadX(B), stand = hx + M.face * 34;
            if (go(stand, 10)) { if (Math.sign(hx - px) !== player.face) keys[hx > px ? 'ArrowRight' : 'ArrowLeft'] = 1; atk(); }
          } else if (B.st === 'tailwarn' || B.st === 'tail' || (M.wave && player.on)) {
            if (player.on && (B.st === 'tail' || M.wave)) { keysP.Space = 1; keys.Space = 1; }
          } else if (B.st === 'daze' || B.st === 'down') {
            go(mjHeadX(B), 30); atk();
          } else {
            const home = mjNearestLand(px); if (home != null) go(home, 40);
          }
        }
        update(1 / 60);
        if (player.cores < last) lost += last - player.cores; last = player.cores;
      }
      return { bot, won: !!B.dead || B.st === 'down' || B.st === 'sink', died: !!player.dead, secs: +(frames / 60).toFixed(1), lost, rolls, boss: Math.round(B.hp) + '/' + B.hpMax, st, srcs };
    }, { FLAGS, bot, seed });
    await q.close(); return r;
  };
  const line = d => d.secs + ' s, ' + (d.won ? 'won' : d.died ? 'DIED' : 'timed out') + ', ' + d.lost + ' cores lost (' + d.rolls + ' rolls; ' + d.srcs.join(',') + '), croc at ' + d.boss;
  const mash = [await fight('mash', 1), await fight('mash', 2)];
  const read = [await fight('read', 1), await fight('read', 2), await fight('read', 3)];
  check('MASH: a player who stands and swings never beats him', mash.every(d => !d.won), mash.map(line).join(' | '));
  check('...he drags her under for it: at least one death roll', mash.every(d => d.rolls >= 1), mash.map(d => d.rolls).join(' | '));
  const wins = read.filter(d => d.won);
  check('READ: a player who reads him wins', wins.length >= 2, read.map(line).join(' | '));
  check('...in a fight, not a formality (at least 30 s)', wins.length > 0 && wins.every(d => d.secs >= 30), wins.map(d => d.secs).join(' | '));
  check('...and he showed his kit: the ambush, the beaching, the bellow', wins.length > 0 && wins.every(d => (d.st.bitewarn || 0) >= 3 && (d.st.beached || 0) >= 2 && (d.st.roarwarn || 0) === 1), wins.map(d => JSON.stringify(d.st)).join(' | '));
  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the hide turns, the jaws and belly do not, the roll costs two, a masher loses and a reader wins');
})().catch(e => { console.error(e); process.exit(1); });
