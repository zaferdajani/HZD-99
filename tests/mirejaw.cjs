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
    // THE HIDE AND ITS WEAK POINTS (types.js dealDmg -> e.hideAt)
    const blow = (st, x) => { B.st = st; B.t = 1; B.mj.t0 = 1; B.hp = B.hpMax; B.iT = 0; B.dazeCD = 99; const h = B.hp; dealDmg(B, 80, null, x, B.mj.feet - 40, false, 'test'); return h - B.hp; };
    B.mj.feet = mjGroundAt(18 * TILE) || 400; B.mj.wx = 18 * TILE; B.mj.face = -1;
    out.back = blow('beached', B.mj.wx + 80);
    out.jaws = blow('beached', mjHeadX(B));
    out.walkHead = blow('backoff', mjHeadX(B));
    out.under = blow('sub', B.mj.wx);
    out.belly = blow('leap', B.mj.wx);
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
  check('the camera pulls back to frame the whole pool', U.zoom <= U.fitZoom + 0.02, 'zoom ' + U.zoom.toFixed(2) + ' (fit ' + U.fitZoom.toFixed(2) + ')');
  check('THE HIDE: a blow on his back turns (an eighth of it)', U.back > 0 && U.back <= U.jaws * 0.2, U.back + ' vs ' + U.jaws);
  check('...the open jaws of a beached crocodile take it whole', U.jaws >= 60, U.jaws);
  check('...the head is armour again once the jaws are not open', U.walkHead <= U.jaws * 0.2, U.walkHead);
  check('...under the water nothing reaches him', U.under === 0, U.under);
  check('...and the pale belly in the air is the other weak point', U.belly >= 60, U.belly);
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
