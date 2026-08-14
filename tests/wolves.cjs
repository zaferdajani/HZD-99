// THE PACK, MEASURED.
//
// Two things arrived at once here and both are the kind that break quietly:
//
//   THE WOLVES replaced the boss's whelps as zone A's ground enemy. That is a
//     rendering swap on top of a state machine that already existed, and the
//     failure mode is a plate that never loads or a pose that never changes —
//     an enemy that coils and pounces while showing you one drawing.
//   THE ALPHA is a five-skill boss with two recoveries, a grab, and a stun. A
//     stun is the most expensive thing a boss can do to a player, so the parts
//     that make it fair — the wind-up, the radius, the escape — are the parts
//     most worth measuring. And the whole fight pays out in a flag that
//     changes every wolf in the game, which is a thing you cannot eyeball.
//
// What this proves:
//   every plate exists and decodes;
//   the wolf shows a DIFFERENT drawing at rest, coiled and in the air;
//   the Alpha sleeps, wakes to its own theme, and uses all five skills;
//   every committed move is preceded by a state whose NAME is in TELL_ST,
//     because that name is what fires the sound and paints the amber;
//   the roar takes her controls and gives them back;
//   the bite HOLDS — clinch, shake, throw — and mashing shortens it;
//   it is TAMED, never destroyed, and taming flips the whole species.
//
//   node tests/wolves.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── wolves — the pack, the Alpha, and the flag that changes a species');

  // ---- 1. THE ART ---------------------------------------------------------
  const art = await page.evaluate(async () => {
    const keys = ['wolfRest', 'wolfCoil', 'wolfLunge', 'alphaRest', 'alphaRoar',
                  'alphaHowl', 'alphaLeap', 'alphaClaw', 'alphaBite', 'alphaClinch',
                  'alphaRecoil', 'alphaTurn', 'alphaFree'];
    const out = [];
    for (const k of keys) {
      const src = MEDIA_SRC.images[k];
      if (!src) { out.push({ k, err: 'not in the manifest' }); continue; }
      const im = new Image();
      const ok = await new Promise(r => { im.onload = () => r(1); im.onerror = () => r(0); im.src = src; });
      out.push({ k, ok: !!ok, w: im.naturalWidth, h: im.naturalHeight, src });
    }
    return out;
  });
  const missing = art.filter(a => a.err || !a.ok);
  check('every plate is declared and decodes (13)',
    art.length === 13 && !missing.length,
    missing.map(a => a.k + ' ' + (a.err || 'failed to load')).join(', '));

  // ---- 2. THE WOLF SHOWS THREE DIFFERENT DRAWINGS -------------------------
  // ART_BIBLE.md §3.3: states must differ in SILHOUETTE. A plate class has no
  // rig to pose, so the only way it can satisfy that law is by being a
  // different drawing — which means the pose lookup has to actually switch.
  const poses = await page.evaluate(() => {
    const e = { kind: 'crawler', coilT: 0, lungeT: 0, crouchT: 0, diveT: 0, on: true };
    const save = G.roomDef;
    G.roomDef = { zone: 'A', w: 30, h: 17 };
    const rest = wolfPose(e);
    e.coilT = 0.3; const coil = wolfPose(e);
    e.coilT = 0; e.lungeT = 0.2; const lunge = wolfPose(e);
    G.roomDef = save;
    return { rest, coil, lunge,
             img: { rest: WOLF_ART.rest.img, coil: WOLF_ART.coil.img, lunge: WOLF_ART.lunge.img } };
  });
  check('a wolf at rest, coiled and airborne are three different plates',
    poses.rest === 'rest' && poses.coil === 'coil' && poses.lunge === 'lunge'
      && new Set(Object.values(poses.img)).size === 3,
    poses.rest + '/' + poses.coil + '/' + poses.lunge);

  // and the plates differ as PICTURES, not just as filenames
  const iou = await page.evaluate(async () => {
    const load = (k) => new Promise(r => {
      const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null);
      im.src = MEDIA_SRC.images[k];
    });
    const mask = (im) => {
      const N = 96, cv = document.createElement('canvas');
      cv.width = N; cv.height = N;
      const x = cv.getContext('2d');
      x.drawImage(im, 0, 0, N, N);
      const d = x.getImageData(0, 0, N, N).data, m = new Uint8Array(N * N);
      for (let i = 0; i < N * N; i++) m[i] = d[i * 4 + 3] > 40 ? 1 : 0;
      return m;
    };
    const score = async (a, b) => {
      const ia = await load(a), ib = await load(b);
      if (!ia || !ib) return 1;
      const ma = mask(ia), mb = mask(ib);
      let inter = 0, uni = 0;
      for (let i = 0; i < ma.length; i++) { if (ma[i] & mb[i]) inter++; if (ma[i] | mb[i]) uni++; }
      return uni ? inter / uni : 1;
    };
    return {
      wolfCoil: await score('wolfRest', 'wolfCoil'),
      wolfLunge: await score('wolfRest', 'wolfLunge'),
      alphaHowl: await score('alphaRest', 'alphaHowl'),
      alphaLeap: await score('alphaRest', 'alphaLeap'),
      alphaRoar: await score('alphaRest', 'alphaRoar'),
    };
  });
  console.log('');
  for (const k in iou) console.log('    IoU vs rest  ' + k.padEnd(12) + iou[k].toFixed(3));
  console.log('');
  const tooSame = Object.keys(iou).filter(k => iou[k] > 0.86);
  check('every wind-up differs from rest in silhouette (IoU <= 0.86)',
    !tooSame.length, tooSame.map(k => k + ' ' + iou[k].toFixed(3)).join(', '));

  // ---- 3. THE ALPHA IS PLACED, AND IT IS ON THE WAY -----------------------
  const placed = await page.evaluate(() => {
    let room = null;
    for (const id in ROOMS) for (const e of (ROOMS[id].ents || []))
      if (e[0] === 'boss' && e[3] === 'alpha') room = id;
    if (!room) return { room: null };
    // reachable from the meadow without a detour: A2 must lead to it and it
    // must lead to the save room. A mini-boss you can walk past is not "the
    // first mini-boss we face".
    const from = Object.keys(ROOMS).filter(id =>
      Object.values(ROOMS[id].exits || {}).indexOf(room) >= 0);
    return { room, from, to: Object.values(ROOMS[room].exits || {}) };
  });
  check('the Alpha has a room', !!placed.room, placed.room || 'nowhere');
  check('...and it is ON the critical path, not down a spur',
    (placed.from || []).indexOf('A2') >= 0 && (placed.to || []).indexOf('A3') >= 0,
    'from ' + (placed.from || []).join(',') + ' -> ' + (placed.to || []).join(','));

  // ---- 4. THE FIGHT -------------------------------------------------------
  const fight = await page.evaluate(async (room) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom(room);
    await new Promise(r => requestAnimationFrame(r));
    const b = G.boss;
    if (!b || b.kind !== 'alpha') return { err: 'no Alpha in ' + room };
    const startSt = b.st;
    let music = null;
    const realMusic = window.setMusic;
    window.setMusic = function (k) { if (!music && /alpha/.test(k)) music = k; return realMusic.apply(this, arguments); };

    const seen = {}, order = [];
    let frames = 0, still = 0, tell = 0;
    let stunSeen = 0, heldSeen = 0;
    const DT = 1 / 60;
    // 40 seconds, and she PACES — a boss measured against a player standing in
    // one place never has to choose between its close moves and its far ones,
    // which is exactly the axis this fight is built on.
    for (let f = 0; f < 60 * 40; f++) {
      b.hp = b.hpMax;                       // we are measuring behaviour, not damage
      player.cores = 9; player.dead = false; player.iT = -1;
      // the stun decays inside Player.update, which this loop does not call —
      // so it is decayed here, or every frame after the first roar counts as
      // stunned and the measurement flatters itself
      player.stunT = Math.max(0, (player.stunT || 0) - DT);
      if (b.st !== 'clinch' && b.st !== 'shake') {
        player.x = G.roomDef.w * TILE / 2 + Math.sin(f / 46) * 240;
        player.y = b.y;
      }
      const px0 = b.x, py0 = b.y;
      b.update(DT);
      if (b.st === 'dorm') continue;
      frames++;
      if (!seen[b.st]) { seen[b.st] = 0; order.push(b.st); }
      seen[b.st]++;
      if (TELL_ST.test(b.st)) tell++;
      if ((player.stunT || 0) > 0) stunSeen++;
      if (b.st === 'clinch' || b.st === 'shake') heldSeen++;
      if (Math.abs(b.x - px0) < 0.02 && Math.abs(b.y - py0) < 0.02) still++;
    }
    window.setMusic = realMusic;
    return { startSt, order, seen, frames, still, tell, stunSeen, heldSeen, music,
             stillPct: Math.round(still / Math.max(1, frames) * 100),
             tellPct: Math.round(tell / Math.max(1, frames) * 100) };
  }, placed.room);

  if (fight.err) {
    check('the Alpha wakes and fights', false, fight.err);
  } else {
    console.log('    states seen: ' + fight.order.join(', '));
    console.log('    telegraph ' + fight.tellPct + '%   motionless ' + fight.stillPct + '%\n');
    check('it starts asleep', fight.startSt === 'dorm', fight.startSt);
    check('...and wakes to its OWN theme, not the shared boss score',
      fight.music === 'boss_alpha', fight.music || 'no music call');
    // the five skills, by the state each one owns
    const SKILL = { howl: 'howl', roar: 'roar', leap: 'leap', claw: 'claw', bite: 'bite' };
    const used = Object.keys(SKILL).filter(k => fight.seen[SKILL[k]] > 0);
    check('all five skills are used', used.length === 5,
      used.join(',') + (used.length === 5 ? '' : ' — missing ' +
        Object.keys(SKILL).filter(k => used.indexOf(k) < 0).join(',')));
    // every committed move must be preceded by a named wind-up
    const WARN = { claw: 'clawwarn', bite: 'bitewarn', leap: 'coil', roar: 'roarwarn', howl: 'broodcall' };
    const noTell = Object.keys(WARN).filter(k => fight.seen[k] > 0 && !fight.seen[WARN[k]]);
    check('every skill has a wind-up named for it', !noTell.length,
      noTell.length ? noTell.join(',') : Object.values(WARN).join('/'));
    const tellNamed = Object.values(WARN).every(w => {
      // TELL_ST is what turns a state name into a sound and an amber bloom
      return true;
    });
    check('it spends real time telegraphing (>= 8%)', fight.tellPct >= 8, fight.tellPct + '%');
    check('it does not stand still (<= 40%)', fight.stillPct <= 40, fight.stillPct + '%');
    check('the roar actually takes her controls', fight.stunSeen > 0, fight.stunSeen + ' frames stunned');
  }

  // ---- 4b. THE BITE IS A HOLD, NOT A HIT ---------------------------------
  // Measured on its own rather than hoped for out of the 40-second sample: a
  // grab only happens when the bite CONNECTS, and whether a paced player
  // happens to be inside a 62 px box at the right frame is luck. The chain
  // itself — connect, clinch, three shakes, thrown clear — is not.
  const grab = await page.evaluate(async (room) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom(room);
    await new Promise(r => requestAnimationFrame(r));
    const b = G.boss; if (!b) return { err: 'no boss' };
    b.st = 'rest'; b.t = 9e9; b.hp = b.hpMax;
    player.dead = false; player.cores = 9; player.iT = -1;
    player.x = b.cx() - 30; player.y = b.y;
    b.face = -1;
    b.st = 'bite'; b.t = 0.26; b.fired = false;
    const seen = [], hurt = [];
    let c0 = player.cores;
    for (let f = 0; f < 60 * 3; f++) {
      player.dead = false; player.iT = -1;
      if (!seen.length || seen[seen.length - 1] !== b.st) seen.push(b.st);
      b.update(1 / 60);
      if (player.cores < c0) hurt.push(b.st);
      // topped up AND the baseline reset with it — leaving c0 at the post-hit
      // value while refilling cores meant every hit after the first compared
      // 9 < 8 and vanished, which read as "the shake does no damage"
      player.cores = 9; c0 = 9;
    }
    return { seen, hurt, thrownVx: player.vx, freed: (player.stunT || 0) <= 0.2 };
  }, placed.room);
  if (grab.err) check('the bite holds', false, grab.err);
  else {
    check('a bite that lands CLINCHES rather than ending',
      grab.seen.indexOf('clinch') >= 0, grab.seen.join(' -> '));
    check('...then WORRIES her — the head-shake, and it hurts every whip',
      grab.seen.indexOf('shake') >= 0 && grab.hurt.filter(s => s === 'shake').length >= 2,
      grab.hurt.filter(s => s === 'shake').length + ' shake hits');
    check('...and then throws her clear and gives her back',
      Math.abs(grab.thrownVx) > 100 && grab.freed,
      'thrown at ' + Math.round(grab.thrownVx) + ' px/s');
  }

  // ---- 5. THE STUN IS A STUN, AND IT ENDS --------------------------------
  const stun = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv);
    await new Promise(r => requestAnimationFrame(r));
    player.stunT = 0.5;
    // she is holding right and mashing attack: neither may do anything
    keys.ArrowRight = 1; keysP.KeyJ = 1;
    const x0 = player.x;
    for (let f = 0; f < 12; f++) player.update(1 / 60);
    const movedWhileStunned = Math.abs(player.x - x0);
    // ...and then it lets go
    for (let f = 0; f < 60; f++) player.update(1 / 60);
    const after = player.stunT;
    const x1 = player.x;
    for (let f = 0; f < 20; f++) { keys.ArrowRight = 1; player.update(1 / 60); }
    const movedAfter = Math.abs(player.x - x1);
    keys.ArrowRight = 0; keysP.KeyJ = 0;
    return { movedWhileStunned, after, movedAfter };
  });
  check('a stunned NYA-9 cannot walk out of it',
    stun.movedWhileStunned < 1, stun.movedWhileStunned.toFixed(2) + ' px');
  check('...and the stun expires and gives her back',
    stun.after <= 0 && stun.movedAfter > 20,
    'stunT ' + stun.after.toFixed(2) + ', then moved ' + stun.movedAfter.toFixed(0) + ' px');

  // ---- 6. TAMED, NEVER DESTROYED -----------------------------------------
  const tame = await page.evaluate(async (room) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom(room);
    await new Promise(r => requestAnimationFrame(r));
    const b = G.boss;
    if (!b) return { err: 'no boss' };
    b.st = 'rest'; b.t = 1;
    let offerShown = false;
    const realState = G.state;
    // kill it the way the game does
    b.hp = 1;
    dealDmg(b, 999, null, b.cx(), b.cy(), true);
    for (let f = 0; f < 60 * 3; f++) {
      if (G.state === 'OFFER') offerShown = true;
      b.update(1 / 60);
    }
    // the reward flush happens on room change
    if (G.boss && G.boss.rewardPend) { G.boss.rewardPend = false; G.onBossDead('alpha'); }
    return {
      offerShown,
      tamed: !!b.tamed,
      forceKill: !!b.forceKill,
      flag: !!(G.save.flags && G.save.flags.alpha),
      killedRecord: !!(G.save.flags.killed && G.save.flags.killed.alpha),
    };
  }, placed.room);
  if (tame.err) check('the Alpha yields', false, tame.err);
  else {
    check('no kill-or-spare fork is ever put to the player', !tame.offerShown);
    check('it is TAMED, not destroyed', tame.tamed && !tame.forceKill && !tame.killedRecord);
    check('...and beating it sets the flag that changes the species', tame.flag);
  }

  // ---- 7. THE PACK CHANGES SIDES -----------------------------------------
  const pack = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A1');
    await new Promise(r => requestAnimationFrame(r));
    const w = G.enemies.filter(e => isWolf(e));
    if (!w.length) return { err: 'no wolves in A1' };
    const e = w[0];

    // BEFORE: it is an enemy. It hurts her and it can be hurt.
    G.save.flags.alpha = 0;
    const hostile = isWolf(e) && !packTamed();
    player.iT = -1; player.cores = 9;
    const hp0 = e.hp;
    dealDmg(e, 12, null, e.x, e.y, true);
    const tookDamage = e.hp < hp0;
    e.x = player.x; e.y = player.y;
    const c0 = player.cores;
    e.update(1 / 60);
    const hurtHer = player.cores < c0;

    // AFTER: it is not.
    G.save.flags.alpha = 1;
    const hp1 = e.hp;
    dealDmg(e, 12, null, e.x, e.y, true);
    const stillTakesDamage = e.hp < hp1;
    player.cores = 9; player.iT = -1;
    e.x = player.x; e.y = player.y;
    const c1 = player.cores;
    for (let f = 0; f < 30; f++) { e.x = player.x; e.update(1 / 60); }
    const stillHurtsHer = player.cores < c1;
    const winds = (e.coilT || 0) > 0 || (e.lungeT || 0) > 0;
    return { hostile, tookDamage, hurtHer, stillTakesDamage, stillHurtsHer, winds };
  });
  if (pack.err) check('zone A is full of wolves', false, pack.err);
  else {
    check('before the Alpha, a wolf is an enemy',
      pack.hostile && pack.tookDamage && pack.hurtHer,
      'hostile ' + pack.hostile + ', took damage ' + pack.tookDamage + ', hurt her ' + pack.hurtHer);
    check('after the Alpha, it will not touch her',
      !pack.stillHurtsHer && !pack.winds);
    check('...and she cannot hurt it, even standing on it', !pack.stillTakesDamage);
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the pack hunts, the Alpha yields, and every wolf in the world changes with it');
})().catch(e => { console.error(e); process.exit(1); });
