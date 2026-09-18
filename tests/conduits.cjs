// KINGDOM B — THE DATA CONDUITS' MOVES, MEASURED.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." tests/foelevel.cjs owns the
// FRAMEWORK — what a level is, what it can afford, and that a `@B` row reaches
// kingdom B and nowhere else. This owns kingdom B's CONTENT: the three moves
// actually firing, in the real build, in a real conduits room.
//
// Three things are measured for every move, and the third is the one that is
// law here:
//
//   1. IT FIRES. The behaviour happens — a wave comes back off a wall, a packet
//      is delivered to the floor, a train of three leaves the gun.
//   2. IT IS OPTIONAL. The same machine with `moves` emptied behaves exactly as
//      it does today. A move that leaked into the machines that never bought it
//      would be a difficulty change nobody authored.
//   3. IT WARNED FIRST. "An enemy is never harder because it warned you less."
//      So each tell is measured for LENGTH (never below the constant the plain
//      attack uses, and the two new ones are longer) and for PIXELS — the
//      warning is rendered by drawConduitFX, and it draws nothing at all for a
//      machine that did not buy the move.
//
//      The pixel half matters because of how this exact failure has happened
//      before: the turret's lock light lived inside the procedural body art and
//      silently stopped being drawn the day the sprite atlas started loading.
//      drawConduitFX is called above every early return in Enemy.draw, and this
//      harness renders it directly to an offscreen canvas and counts what
//      landed, so "the warning is on screen" is a number and not a claim.
//
//   node tests/conduits.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── conduits — kingdom B\'s three moves fire, stay optional, and warn first\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof foeMovesFor === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('B2');
    G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));

    // ---- what the conduits can afford, and where it stops -------------------
    // B's floor is level 2 = ONE point, so a fresh save meets the courier and
    // nothing else; the repeater and the train want a run behind them.
    out.freshB = foeLevel('B');
    out.packetOnFreshSave = foeMovesFor('flier', out.freshB, 'B');
    out.relayNotOnFreshSave = foeMovesFor('surge', out.freshB, 'B');
    out.relayLater = foeMovesFor('surge', 3, 'B');
    out.trainLater = foeMovesFor('turret', 3, 'B');
    // ...and none of it reaches the kingdoms next door, at any level, for any
    // machine. Asked this way round — "where does a conduit move turn up?" —
    // rather than "is that kingdom's list empty?", because the neighbours are
    // filling their own lists in parallel and an emptiness check would go red
    // the day one of them gave a flier something of their own.
    const MINE = ['packet', 'relay', 'train'];
    out.leaked = [];
    for (const z of ['A', 'B', 'C', 'D', 'E', 'X'])
      for (const k of Object.keys(EKIND))
        for (const id of foeMovesFor(k, 7, z))
          if (MINE.indexOf(id) >= 0 && z !== 'B') out.leaked.push(k + '@' + z + ':' + id);
    // and they DO all turn up at home, on a machine levelled enough to buy them
    out.atHome = MINE.filter(id =>
      Object.keys(EKIND).some(k => foeMovesFor(k, 7, 'B').indexOf(id) >= 0));

    // a run far enough along that a conduit machine can afford everything
    G.save.abil = { dash: 1, djump: 1, wall: 1, emp: 1 };
    G.save.skills = ['mind', 'calc', 'reflex', 'nerve', 'edge'];
    G.save.flags = { tut: 1, woke: 1, bossGlitch: 1, bossBrood: 1, bossAtlas: 1, bossZero: 1, bossPrism: 1 };
    out.lateB = foeLevel('B');

    // ---- the room, read rather than assumed --------------------------------
    // A stretch of level conduit rail, clear overhead for three tiles either
    // side, with a WALL four to eight tiles off to the left: the breaker needs
    // open floor to send a wave down and something to send it back from, and
    // both have to be far enough off the drum that its own body never touches
    // her while the wave is being measured.
    const rows = G.grid.length;
    const groundRow = (tx) => { for (let ty = 2; ty < rows; ty++) if (solidAt(tx, ty)) return ty; return -1; };
    let railTx = -1, railTy = -1, wallTx = -1;
    for (let tx = 6; tx < 30 && railTx < 0; tx++) {
      const gy = groundRow(tx);
      if (gy < 3) continue;
      let ok = true;
      for (let k = -3; k <= 3; k++) if (groundRow(tx + k) !== gy || solidAt(tx + k, gy - 1)) ok = false;
      if (!ok) continue;
      for (let j = 4; j <= 8; j++)
        if (solidAt(tx - j, gy - 1) && groundRow(tx - j) >= 0) { railTx = tx; railTy = gy; wallTx = tx - j; break; }
    }
    out.railFound = railTx > 0;
    if (!out.railFound) return out;
    out.wallTiles = railTx - wallTx;
    const footY = railTy * TILE;

    // park the player: high above the floor by default, which is out of every
    // grounded band in this file, so nothing lands on her except where a check
    // deliberately puts her in the way
    G.enemies = []; G.projs = []; G.pools = [];
    const park = (up) => {
      player.x = (railTx + 2) * TILE;
      player.y = footY - player.h - (up == null ? 240 : up);
      player.vx = player.vy = 0; player.iT = 0; player.on = up === 0 ? 1 : 0;
    };
    park();

    // count every blow the machines land, rather than reading hp through the
    // armour/invulnerability maze — what is being measured is whether the code
    // reached the hit, not what the hit was worth
    let hits = [];
    const realHurt = player.hurt.bind(player);
    player.hurt = (d, fx, src) => { hits.push(src || '?'); player.iT = 0; };
    const step = (e, n) => { for (let i = 0; i < n; i++) e.update(1 / 60); };

    // ---- 1. THE REPEATER ----------------------------------------------------
    const mkSurge = (withMove) => {
      const e = new Enemy('surge', railTx * TILE, footY - 24);
      e.moves = withMove ? ['relay'] : [];
      e.iq = 1; G.enemies = [e]; return e;
    };
    // she has to be IN its band for it to charge at all, which is the thing
    // being measured: that the charge it opens is TELL_SWIPE long either way
    const vent = (e) => {
      park(0); e.atkCD = 0; e.crouchT = 0; e.windedT = 0; e.waves = [];
      let tell = 0;
      for (let i = 0; i < Math.ceil(TELL_SWIPE * 60) + 8; i++) { e.update(1 / 60); tell = Math.max(tell, e.crouchT || 0); }
      // isolate the LEFT wave and take her back out of the band: the right-hand
      // wave and a second charge would both land on the measurement below
      e.waves = (e.waves || []).filter(w => w.dir < 0);
      e.atkCD = 999; park();
      return tell;
    };
    const sA = mkSurge(true);  out.relayTellLen = +vent(sA).toFixed(3);
    const sB = mkSurge(false); out.plainTellLen = +vent(sB).toFixed(3);
    // THE WAVE TRAVELS AT ALL. It did not: the rail probe read the air over the
    // heightfield and every wave died the frame after the vent, in both of the
    // breaker's own rooms. railSurfaceY is the fix and this is its number — no
    // relay is worth measuring on a wave that never leaves the drum.
    out.waveBornX = (sB.waves[0] || {}).x;
    let travel = 0, aliveFrames = 0;
    for (let i = 0; i < 90; i++) {
      sB.update(1 / 60);
      const w = (sB.waves || [])[0];
      if (w) { aliveFrames++; travel = Math.abs(w.x - out.waveBornX); }
    }
    out.waveTravel = +travel.toFixed(1);
    out.waveAliveFrames = aliveFrames;
    // ...then send it again, so the control below starts from a fresh vent
    sB.waves = []; sB.windedT = 0; out.plainTellLen2 = +vent(sB).toFixed(3);

    // the left wave runs into the frame wall. With the move it latches there,
    // stationary and harmless, for CONDUIT_RELAY_HOLD; without it, it is gone.
    G.enemies = [sA];
    let heldFrames = 0, heldX = null, heldMoved = 0, reversed = false, hitsWhileHeld = 0;
    hits = [];
    for (let i = 0; i < 300; i++) {
      sA.update(1 / 60);
      const w = (sA.waves || [])[0];
      if (w && w.hold > 0) {
        heldFrames++;
        // stand her exactly where it latched: it must not touch her until it lets go
        if (heldX == null) { heldX = w.x; player.x = w.x - player.w / 2; player.y = w.y - player.h; player.on = 1; player.iT = 0; }
        else if (Math.abs(w.x - heldX) > 0.01) heldMoved++;
        hitsWhileHeld = hits.length;
      }
      if (heldX != null && w && w.hold <= 0 && w.dir > 0) { reversed = true; break; }
    }
    out.relayHeldSec = +(heldFrames / 60).toFixed(3);
    out.relayHoldWanted = CONDUIT_RELAY_HOLD;
    out.relayStoodStill = heldMoved === 0;
    out.relayHarmlessWhileHeld = hitsWhileHeld === 0;
    out.relayCameBack = reversed;
    // ...and the returning wave is live again: she has not moved, and it runs
    // back over the spot it was just sitting on harmlessly
    hits = []; player.iT = 0;
    step(sA, 30);
    out.relayBitesOnReturn = hits.filter(h => h === 'surge.wave').length > 0;
    // the control: no move, no latch, no return — the wave simply ends
    G.enemies = [sB]; park();
    let plainLatched = false, plainReversed = false;
    for (let i = 0; i < 300; i++) {
      sB.update(1 / 60);
      for (const w of sB.waves || []) { if (w.hold > 0) plainLatched = true; if (w.dir > 0) plainReversed = true; }
    }
    out.plainNeverReturns = !plainLatched && !plainReversed;
    out.plainWavesGone = (sB.waves || []).length === 0;

    // ---- 2. THE COURIER -----------------------------------------------------
    const mkFlier = (withMove) => {
      const e = new Enemy('flier', (railTx + 2) * TILE, footY - 150);
      e.moves = withMove ? ['packet'] : [];
      e.iq = 1; e.packetCD = 0; G.enemies = [e]; return e;
    };
    park(0);
    const fA = mkFlier(true);
    let packTell = 0, packX = null, packStill = true;
    for (let i = 0; i < 1200; i++) {
      fA.update(1 / 60);
      if ((fA.packetT || 0) > 0) {
        packTell = Math.max(packTell, fA.packetT);
        if (packX == null) packX = fA.x; else if (Math.abs(fA.x - packX) > 6) packStill = false;
      }
      if (fA.drops && fA.drops.length) break;
    }
    out.packetTellLen = +packTell.toFixed(3);
    out.packetHoldsStation = packStill;
    out.packetDropped = !!(fA.drops && fA.drops.length);
    const pk = fA.drops && fA.drops[0];
    // the lane the tell drew ends on the floor the packet will actually hit
    out.packetLaneY = pk ? conduitFloorY(pk.x, pk.y) : -1;
    // it falls, it lands, and the floor it lands on is briefly hostile
    hits = [];
    let landed = false, liveFrames = 0, landY = -1;
    for (let i = 0; i < 600 && pk; i++) {
      if (!landed && pk.live > 0) {
        landed = true; landY = pk.y;
        player.x = pk.x - player.w / 2; player.y = pk.y - player.h; player.on = 1; player.iT = 0;
      }
      if (landed && pk.live > 0) liveFrames++;
      fA.update(1 / 60);
      if (landed && (fA.drops || []).indexOf(pk) < 0) break;
    }
    out.packetLanded = landed;
    out.packetLandedOnFloor = landed && Math.abs(landY - out.packetLaneY) < 1;
    out.packetLiveSec = +(liveFrames / 60).toFixed(2);
    out.packetLiveWanted = CONDUIT_PACK_LIVE;
    out.packetBites = hits.filter(h => h === 'conduit.packet').length > 0;
    out.packetCleansUp = (fA.drops || []).indexOf(pk) < 0;
    // the control: a flier that never bought it never delivers, and still dives
    park(0);
    const fB = mkFlier(false);
    let ctrlDrops = 0, ctrlTell = 0, ctrlDived = false;
    for (let i = 0; i < 1200; i++) {
      fB.update(1 / 60);
      ctrlDrops += (fB.drops || []).length;
      ctrlTell = Math.max(ctrlTell, fB.packetT || 0);
      if ((fB.diveT || 0) > 0) ctrlDived = true;
    }
    out.plainFlierNeverDelivers = ctrlDrops === 0 && ctrlTell === 0;
    out.plainFlierStillDives = ctrlDived;

    // ---- 3. THE METERED TRAIN ----------------------------------------------
    const mkTurret = (withMove, far) => {
      const tx = far ? railTx + 9 : railTx + 1;
      const e = new Enemy('turret', tx * TILE, footY - 30);
      e.moves = withMove ? ['train'] : [];
      e.iq = 1; e.t = 0; G.enemies = [e]; return e;
    };
    const runGun = (e) => {                     // one full cycle: lock, then fire
      G.projs = [];
      let lock0 = 0, shots = 0, before = 0;
      for (let i = 0; i < 300; i++) {
        e.update(1 / 60);
        lock0 = Math.max(lock0, e.lockT || 0);
        if (G.projs.length > before) { shots = G.projs.length; before = G.projs.length; }
        if (shots > 0 && (e.lockT || 0) <= 0 && (e.trainT || 0) <= 0 && e.t > 1) break;
      }
      return { lock: +lock0.toFixed(3), shots };
    };
    park(0);
    const tNear = runGun(mkTurret(true, false));
    const tFar = runGun(mkTurret(true, true));
    const pNear = runGun(mkTurret(false, false));
    out.trainLock = tNear.lock; out.plainLock = pNear.lock;
    out.trainLockWanted = CONDUIT_TRAIN_LOCK;
    out.trainNear = tNear.shots; out.trainFar = tFar.shots; out.plainNear = pNear.shots;
    out.trainWanted = CONDUIT_TRAIN_N;

    // ---- the telegraphs, in pixels -----------------------------------------
    // drawConduitFX renders to a bare canvas; anything it puts down is the
    // warning. A machine without the move must put down nothing.
    const ink = (setup) => {
      const cv = document.createElement('canvas'); cv.width = 260; cv.height = 220;
      const cc = cv.getContext('2d');
      const e = setup();
      // draw it into the middle of the scratch canvas, in world coordinates
      cc.save(); cc.translate(120 - (e.x + e.w / 2), 60 - e.y);
      drawConduitFX(cc, e, e.x + e.w / 2);
      cc.restore();
      const px = cc.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 16) n++;
      return n;
    };
    const chargingSurge = (mv) => () => {
      const e = new Enemy('surge', 120 * 4, footY - 24);
      e.moves = mv; e.crouchT = TELL_SWIPE * 0.5; e.anim = 1.1; return e;
    };
    out.inkRelayTell = ink(chargingSurge(['relay']));
    out.inkRelayNone = ink(chargingSurge([]));
    const latchedSurge = (mv) => () => {
      const e = new Enemy('surge', 120 * 4, footY - 24);
      e.moves = mv; e.anim = 1.1;
      e.waves = [{ x: e.x + 10, y: e.y + e.h, dir: -1, spd: 250, life: 1, life0: 1, ph: 0, hold: CONDUIT_RELAY_HOLD * 0.5, relay: 0 }];
      return e;
    };
    out.inkLatch = ink(latchedSurge(['relay']));
    out.inkLatchNone = ink(latchedSurge([]));
    const tellingFlier = (mv) => () => {
      const e = new Enemy('flier', (railTx + 2) * TILE, footY - 120);
      e.moves = mv; e.packetT = TELL_SWIPE * 0.5; e.anim = 1.1; return e;
    };
    out.inkPacketTell = ink(tellingFlier(['packet']));
    out.inkPacketNone = ink(tellingFlier([]));
    const lockingGun = (mv) => () => {
      const e = new Enemy('turret', (railTx + 2) * TILE, footY - 30);
      e.moves = mv; e.lockT = CONDUIT_TRAIN_LOCK * 0.5; e.lock0 = CONDUIT_TRAIN_LOCK; e.anim = 1.1; return e;
    };
    out.inkTrainPips = ink(lockingGun(['train']));
    out.inkTrainNone = ink(lockingGun([]));

    player.hurt = realHurt;
    G.enemies = []; G.projs = [];
    return out;
  });

  if (!r.railFound) {
    check('a stretch of conduit rail with a wall off it', false, 'B2 gave none — the geometry moved');
    await browser.close(); process.exit(1);
  }

  console.log('  — what the kingdom can afford —');
  check('a fresh save meets the courier and nothing else',
    r.packetOnFreshSave.join() === 'packet' && r.relayNotOnFreshSave.length === 0,
    'lv ' + r.freshB + ': flier ' + JSON.stringify(r.packetOnFreshSave) + ', surge ' + JSON.stringify(r.relayNotOnFreshSave));
  check('a run behind her buys the repeater and the train',
    r.relayLater.join() === 'relay' && r.trainLater.join() === 'train' && r.lateB >= 3,
    'lv ' + r.lateB);
  check('all three are on the conduits\' own machines',
    r.atHome.length === 3, r.atHome.join(', '));
  check('...and not one of them reaches another kingdom',
    r.leaked.length === 0, r.leaked.join(' ') || 'checked every kind in all six zones');

  console.log('  — the repeater —');
  check('the breaker\'s wave leaves the drum at all',
    r.waveTravel > 64 && r.waveAliveFrames > 12,
    r.waveTravel + 'px over ' + r.waveAliveFrames + ' frames, wall ' + r.wallTiles + ' tiles off');
  check('the breaker\'s tell is TELL_SWIPE, with the move and without it',
    Math.abs(r.relayTellLen - r.plainTellLen) < 1e-6 && r.relayTellLen >= 0.49,
    'relay ' + r.relayTellLen + 's vs plain ' + r.plainTellLen + 's');
  check('the wave latches at the wall for its full hold',
    r.relayHeldSec >= r.relayHoldWanted * 0.9, r.relayHeldSec + 's of ' + r.relayHoldWanted + 's');
  check('...standing still for all of it', r.relayStoodStill);
  check('...and harmless for all of it', r.relayHarmlessWhileHeld);
  check('then it comes back down the rail', r.relayCameBack);
  check('...live, and it bites where it latched', r.relayBitesOnReturn);
  check('a breaker without the move never sends one back',
    r.plainNeverReturns && r.plainWavesGone);

  console.log('  — the courier —');
  check('the delivery holds TELL_SWIPE of station before it lets go',
    r.packetTellLen >= 0.49 && r.packetHoldsStation, r.packetTellLen + 's');
  check('and a packet is delivered', r.packetDropped);
  check('it falls to the floor the lane pointed at',
    r.packetLanded && r.packetLaneY > 0 && r.packetLandedOnFloor, 'floor y ' + r.packetLaneY);
  check('what it spills is live for its second, then gone',
    r.packetLiveSec >= r.packetLiveWanted * 0.8 && r.packetCleansUp,
    r.packetLiveSec + 's of ' + r.packetLiveWanted + 's');
  check('...and standing in it costs a core', r.packetBites);
  check('a flier without the move never delivers one', r.plainFlierNeverDelivers);
  check('...and still dives exactly as it always did', r.plainFlierStillDives);

  console.log('  — the metered train —');
  check('the conduit gun\'s lock is LONGER than the plain gun\'s',
    Math.abs(r.trainLock - r.trainLockWanted) < 0.02 && r.trainLock > r.plainLock,
    r.trainLock + 's vs ' + r.plainLock + 's');
  check('it sends the count it declared, near and far alike',
    r.trainNear === r.trainWanted && r.trainFar === r.trainWanted,
    'near ' + r.trainNear + ', far ' + r.trainFar + ', wanted ' + r.trainWanted);
  check('a gun without the move is the single shot it always was',
    r.plainNear === 1, r.plainNear + ' shot(s) close up');

  console.log('  — and every warning is actually drawn —');
  check('the repeater wears its second ring through the charge',
    r.inkRelayTell > 200 && r.inkRelayNone === 0, r.inkRelayTell + 'px vs ' + r.inkRelayNone);
  check('...and flares where it latched', r.inkLatch > 100 && r.inkLatchNone === 0,
    r.inkLatch + 'px vs ' + r.inkLatchNone);
  check('the courier draws its lane before it drops',
    r.inkPacketTell > 200 && r.inkPacketNone === 0, r.inkPacketTell + 'px vs ' + r.inkPacketNone);
  check('the train shows the count it is about to spend',
    r.inkTrainPips > 40 && r.inkTrainNone === 0, r.inkTrainPips + 'px vs ' + r.inkTrainNone);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
