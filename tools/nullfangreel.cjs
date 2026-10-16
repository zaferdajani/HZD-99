// NULLFANG — EVERY MOVE. One film of the first guardian doing everything it
// can do, in the shipped build, with the sound the game makes for each move.
//
// Same rig as the cast reel (tools/castreel.cjs: the real update() stepped at
// a fixed rate, the real draw(), every sfx/playBuf rendered offline at the
// frame it fired), but the programme is a DIRECTOR rather than a free fight.
// A thirty-second brawl showed whichever moves the dice picked; the owner
// asked for all of them. So each chapter sets up the conditions the lion's own
// state machine needs to choose that move — the range she stands at, which
// cooldowns are spent, its health — and then lets the machine run. Neutral
// setup states are assigned between chapters, but trajectory-dependent attack
// states are not forced: a forced `dive` has no perch to dive from, a forced
// `pounce` no arc. The one exception is a logged daze-request fallback if the
// break has not landed by hand inside its window.
//
//   node tools/nullfangreel.cjs [out.mp4] [--keep]
//
// Serve the repo on 8220 first (the harnesses' port).
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { film } = require('./castreel.cjs');
const FF = (() => { const p = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg'); return fs.existsSync(p) ? p : 'ffmpeg'; })();

async function nullfang() {
  try { await nullfangReel(); } catch (e) { REEL.errors.push('program: ' + (e && e.stack || e)); if (REEL.sec) await REEL.secEnd(); }
  REEL.done = true;
  const res = REEL.resume; REEL.resume = null; if (res) res();
}
async function nullfangReel() {
  const R = REEL;
  let meetPlayed = false;
  R.brand = 'NULLFANG — EVERY MOVE';
  R.secStart('NULLFANG', 260);
  // ---- the corridor: the first meeting (A2) --------------------------------
  // The lion's first appearance is not the arena. In the corridor it drops in
  // from above, swats her across the floor, watches, coils and leaves — the
  // game's own scripted beat (meetCheck/meetStep), started the way the game
  // starts it: by her walking past MEET_X.
  {
    await R.loadRoom(MEET_ROOM);
    G.save.flags.nfMeet = 0; G.meet = null; G.boss = null; G.enemies = [];
    const x = MEET_X - 3 * TILE;
    const gc = typeof groundColumnAt === 'function' ? groundColumnAt(x + player.w / 2) : null;
    R.place(x, gc && gc.length ? Math.min(...gc) : (G.roomDef.h - 2) * TILE);
    player.face = 1;
    let t0 = R.t, began = false;
    // the film's own title first, over the corridor before anything happens;
    // then the chapter card as she walks on into it
    const card = (age, len) => age < 0 ? 0 : age < 0.25 ? age / 0.25 : age < len - 0.4 ? 1 : age < len ? (len - age) / 0.4 : 0;
    const capM = () => {
      const age = R.t - t0, bb = G.boss;
      const a1 = card(age, 2.8), a2 = card(age - 2.9, 2.0);
      const title = a1 > 0 ? 'NULLFANG' : a2 > 0 ? 'The First Meeting' : '';
      const sub = a1 > 0 ? 'the first guardian  ·  every move, effect and sound, recorded in-game'
        : 'the corridor  ·  it drops in, swats her aside, and leaves';
      return { name: 'NULLFANG', state: 'The First Meeting   [' + (G.meet ? G.meet.ph : bb ? bb.st : 'corridor') + ']',
        zoom: 1, title, sub, titleA: Math.max(a1, a2) };
    };
    await R.run(2.9, capM);
    R.hold('RIGHT', 1);
    await R.run(9.5, capM, () => {
      if (G.meet) { began = true; R.hold('RIGHT', 0); }
      if (player.dead) { player.dead = false; G.state = 'PLAY'; }
      if (player.hp < 2) player.hp = player.hpMax || 5;
      if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
    });
    R.clearKeys();
    meetPlayed = began;
    R.log.push('meet: ' + (began ? 'played' : 'NEVER STARTED'));
  }
  await R.loadRoom('A4');
  const b = G.boss;
  if (!b || b.kind !== 'glitch') { R.errors.push('A4 has no NULLFANG'); await R.secEnd(); return; }
  G.enemies = G.enemies.filter(e => e.boss);
  if (typeof BEAST_STRIPS !== 'undefined' && typeof mediaFetch === 'function') for (const k of BEAST_STRIPS) mediaFetch(k);
  await R.warm(5000);

  const FLOOR = 15 * TILE;
  const lionX = () => b.cx(), herX = () => player.x + player.w / 2;
  // she takes a blow only when a chapter says so; otherwise the lion's
  // attacks pass through her without the i-frame flicker a held iT would show
  const realHurt = player.hurt;
  let allowHit = false, hpFloor = b.hpMax * 0.56, chapter = '', sub = '', titleAt = 0, zoom = 1.45;
  player.hurt = function () { if (allowHit) return realHurt.apply(this, arguments); };
  let lastSt = '';
  const settle = () => {
    if (b.st !== lastSt) { R.log.push('st ' + R.t.toFixed(2) + ' ' + lastSt + '>' + b.st); lastSt = b.st; }
    if (player.dead) { player.dead = false; G.state = 'PLAY'; }
    if (player.hp < 2) player.hp = player.hpMax || 5;
    if (!b.dead && b.hp > 0 && b.hp < hpFloor) b.hp = hpFloor;
    if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
  };
  // the moves the chapter is NOT about stay on cooldown
  const hold = (want) => {
    if (want !== 'swipe') b.swipeCD = 99;
    if (want !== 'roar') b.roarCD = 99;
    if (want !== 'dive') b.ambushCD = 99;
    if (want !== 'null') b.nullUsed = true;
    if (want !== 'pounce') {
      b.lastMove = b.lastMove === 'pounce' || b.st === 'crouch' || b.st === 'pounce' ? b.lastMove : 'pounce';
      // the coil out of a prowl fires on the prowl's own timer; keeping the
      // timer up keeps the coil for its own chapter
      if (b.st === 'stalk' || b.st === 'run') b.t = Math.max(b.t, 0.5);
    }
  };
  const cap = () => () => {
    const age = R.t - titleAt;
    const a = age < 0.25 ? age / 0.25 : age < 1.5 ? 1 : age < 1.9 ? (1.9 - age) / 0.4 : 0;
    const mid = (lionX() + herX()) / 2;
    return {
      name: 'NULLFANG' + (b.phase > 1 ? '  ·  phase two' : ''),
      state: chapter + '   [' + (b.dead ? (b.purified ? 'freed' : 'falls') : b.st) + ']',
      focus: { x: mid, y: Math.min(b.cy(), player.y + player.h / 2) - 10 },
      zoom: 1, title: a > 0 ? chapter : '', sub: a > 0 ? sub : '', titleA: a,
    };
  };
  const scene = async (title, subtitle, sec, each, opt) => {
    if (!(opt && opt.cont)) titleAt = R.t;
    chapter = title; sub = subtitle || ''; zoom = (opt && opt.zoom) || 1.45;
    await R.run(sec, cap(), (i) => { if (each) each(i); settle(); });
  };
  const face = () => { player.face = lionX() > herX() ? 1 : -1; };
  const stand = (dx) => { R.clearKeys(); R.place(lionX() + dx - player.w / 2, FLOOR); face(); };
  // every chapter starts with the two of them where the move has room: the
  // lion where the chapter wants it, her at the range that move needs. A
  // chapter that inherits the last one's positions inherits its wall too.
  const MID = G.roomDef.w * TILE / 2;
  const arena = (lx, dx) => {
    b.x = lx - b.w / 2; b.y = FLOOR - b.h; b.vx = 0; b.vy = 0; b.stagT = 0;
    b.wdX = b.x; b.wdY = b.y; b.wdT = 0; b.face = dx < 0 ? -1 : 1;
    stand(dx);
    cam.room = null;          // a chapter is a cut: the fight camera snaps, not pans
  };
  const seenSt = {};
  const watch = () => { seenSt[b.st] = 1; };

  // ---- 0. the title, over the sleeping animal ------------------------------
  R.place(b.x - 560, FLOOR); player.face = 1;
  await scene('The Arena', 'Scrap Meadows  ·  it sleeps until she comes close', 2.6, () => { hold(''); watch(); });

  // ---- 1. the stir and the wake roar ---------------------------------------
  R.hold('RIGHT', 1);
  await scene('The Wake', 'it hears her  ·  servos, a breath  ·  then the roar', 5.2, (i) => {
    hold(''); watch();
    if (b.st !== 'dorm' || Math.abs(lionX() - herX()) < 330) R.hold('RIGHT', 0);
  });
  R.clearKeys();

  // ---- 2. the prowl -------------------------------------------------------
  // she runs for the far wall: past 520 px it gallops, inside 370 it stalks
  b.x = MID + 420; b.vx = 0; b.wdX = b.x; b.wdT = 0;
  R.place(40, FLOOR); player.face = 1;
  b.st = 'stalk'; b.t = 1;
  await scene('The Prowl', 'gallop at range  ·  a low stalk as it closes', 5.0, (i) => {
    hold(''); watch();
    if (Math.abs(lionX() - herX()) < 200) { b.st = 'idle'; b.t = 1; }
  }, { zoom: 1 });

  // ---- 3. the paw swipe ---------------------------------------------------
  arena(MID, -104); b.st = 'stalk'; b.t = 1; b.swipeCD = 0; allowHit = true;
  await scene('Paw Swipe', 'the paw rises (0.5 s tell)  ·  the strike  ·  the claws\' four light traces', 3.4, () => {
    hold('swipe'); watch();
    if (b.st === 'idle') { b.swipeCD = 99; allowHit = false; }
  });
  allowHit = false;

  // ---- 4. the coil and the pounce -----------------------------------------
  arena(MID + 160, -330); b.st = 'idle'; b.t = 0.05; b.lastMove = 'swipe';
  let dodged = false;
  await scene('The Coil & the Pounce', 'a full second gathering itself  ·  the leap leads her  ·  the landing is the opening', 5.0, (i) => {
    hold('pounce'); watch();
    if (b.st === 'pounce' && !dodged) { dodged = true; R.hold('LEFT', 1); R.press('DASH'); }
    if (dodged && b.st !== 'pounce') R.hold('LEFT', 0);
    if (dodged && (b.st === 'stalk' || b.st === 'run')) b.t = 1;   // one leap is the chapter
    if (b.st === 'idle' && dodged) b.lastMove = 'pounce';
  });
  R.clearKeys();

  // ---- 5. the roar ---------------------------------------------------------
  arena(MID, -150); b.st = 'stalk'; b.t = 1; b.roarCD = 0;
  await scene('The Roar', 'a virus orb gathers in the throat  ·  the shove  ·  the pack answers', 4.4, () => {
    hold('roar'); watch();
  });
  // the wolf it called has made its point; the film is about the lion
  for (const e of G.enemies) if (!e.boss && !e.dead) e.die(0, -60);
  await scene('The Roar', 'a virus orb gathers in the throat  ·  the shove  ·  the pack answers', 0.8, () => { hold(''); }, { cont: 1 });

  // ---- 6. ambush: perch and dive ------------------------------------------
  arena(MID, 260); b.st = 'stalk'; b.t = 1; b.ambushCD = 0;
  await scene('Ambush: Perch & Dive', 'up to the ledge  ·  it tracks her  ·  the eye flares  ·  claws-first drop', 5.0, () => {
    hold('dive'); watch();
    if (b.st === 'recover' || b.st === 'idle') b.ambushCD = 99;
  }, { zoom: 1 });

  // ---- 7. the break -------------------------------------------------------
  arena(MID, -66); b.st = 'idle'; b.t = 1; face();
  let forced = false;
  await scene('Broken Open', 'five blows close together  ·  it drops to its knees  ·  then gets its feet back', 6.0, (i) => {
    hold(''); watch();
    if (b.st === 'idle' || b.st === 'stalk') { b.st = 'idle'; b.t = 1; b.vx = 0; }
    if (b.st !== 'daze' && b.st !== 'recover' && !seenSt.daze) {
      face();
      if (Math.abs(lionX() - herX()) > 74) R.hold(lionX() > herX() ? 'RIGHT' : 'LEFT', 1); else { R.hold('LEFT', 0); R.hold('RIGHT', 0); }
      if (i % 8 === 0) R.press('ATK'); else if (i % 8 === 3) R.release('ATK');
      if (i === 105 && !forced) { forced = true; b.dazeReq = true; R.log.push('daze: fallback request at 3.5 s'); }
    } else { R.clearKeys(); }
  });
  R.clearKeys();

  // ---- 8. the midpoint ----------------------------------------------------
  arena(MID, -70); b.st = 'idle'; b.t = 1; hpFloor = 0;
  b.hp = b.hpMax * 0.5 + 1; b.dazeCD = 99;
  await scene('The Midpoint', 'below half: the turn  ·  a guaranteed opening  ·  then the harder half', 3.2, (i) => {
    hold(''); watch();
    if (b.phase === 1) { face(); if (i % 8 === 0) R.press('ATK'); else if (i % 8 === 3) R.release('ATK'); }
    else R.clearKeys();
    if (b.phase === 2) hpFloor = b.hpMax * 0.2;
  });
  hpFloor = b.hpMax * 0.2; R.clearKeys();

  // ---- 9. phase two: the double swipe -------------------------------------
  arena(MID, -100); b.st = 'stalk'; b.t = 1; b.swipeCD = 0; b.stagT = 0;
  let swipes = 0, wasSw = false;
  await scene('Phase Two: the Double Swipe', 'an angry lion swipes twice  ·  each with its full tell', 4.0, () => {
    hold('swipe'); watch();
    if (b.phase === 2 && b.st === 'swipe' && !wasSw) swipes++;
    wasSw = b.st === 'swipe';
    if (b.st === 'idle' && swipes) b.swipeCD = 99;
  });

  // ---- 10. null gravity ---------------------------------------------------
  arena(MID + 100, -280); b.st = 'stalk'; b.t = 1; b.nullUsed = false;
  await scene('Null Gravity', 'once, below half: the room\'s gravity is unplugged  ·  three field pounces  ·  the crash', 7.0, () => {
    hold(b.nullUsed && b.st === 'stalk' && !seenSt.nullcharge ? 'null' : '');
    if (!seenSt.nullcharge) b.nullUsed = false;
    watch();
  }, { zoom: 1 });

  // ---- 11. the phase-two pounce, landing on her ---------------------------
  arena(MID + 160, -300); b.st = 'idle'; b.t = 0.05; b.lastMove = 'swipe'; allowHit = true; player.iT = 0;
  await scene('When It Lands', 'phase two coils faster  ·  this time she stays put', 4.2, () => {
    hold('pounce'); watch();
    if (b.st === 'recover') { allowHit = false; b.lastMove = 'pounce'; }
  });
  allowHit = false;

  // ---- 12. the fork: freed ------------------------------------------------
  // the blade is what frees a guardian (brNeedsBlade); she carries it here
  G.save.flags.crystal = 1;
  // ...and the film stays in the arena: the reward cut, the evolution cards
  // and the next room are the story's, not the lion's
  const onDead = G.onBossDead; G.onBossDead = () => {};
  // the authored purification film plays on the wall clock, which this rig
  // has replaced; the freeing is filmed in the arena (the game's no-film
  // path) and the film itself is cut onto the end of the reel instead
  const cutFn = startPurifyCut; startPurifyCut = () => false;
  // ...and her evolution card is her reward, not the lion's: it would sit
  // over the cleansing for its whole length
  const evoFn = checkEvo; checkEvo = () => {};
  arena(MID + 120, -70); b.st = 'idle'; b.t = 1; hpFloor = 0; b.hp = 3; b.dazeCD = 99;
  let purifiedFollow = false;
  await scene('Freed', 'the last blow puts it on its knees  ·  the virus leaves  ·  the lion stays', 10.5, (i) => {
    hold(''); watch();
    if (i < 54) { face(); if (b.st === 'idle' || b.st === 'stalk') { b.st = 'idle'; b.t = 1; } return; }   // the card reads over the lion first
    if (!b.dead && b.hp > 0) {
      face(); if (b.st === 'idle' || b.st === 'stalk') { b.st = 'idle'; b.t = 1; }
      if (i % 8 === 0) R.press('ATK'); else if (i % 8 === 3) R.release('ATK');
    } else {
      R.clearKeys();
      // she walks off a few steps so it pads after her
      if (b.purified && b.pureT > 1.6 && b.pureT < 3.4) {
        R.hold('LEFT', 1);
        if (b.petWalk) purifiedFollow = true;
      } else R.hold('LEFT', 0);
    }
    if (G.state !== 'PLAY' && G.state !== 'CUT') { R.log.push('state ' + G.state + ' cleared'); G.state = 'PLAY'; }
  });
  R.clearKeys();
  G.onBossDead = onDead; startPurifyCut = cutFn; checkEvo = evoFn;
  chapter = 'The Purification Film'; sub = 'as the game plays it  ·  assets/video/purify_glitch.mp4'; titleAt = R.t;
  await R.run(1.6, cap(), () => { settle(); });
  player.hurt = realHurt;
  const requiredStates = ['dorm', 'intro', 'stalk', 'run', 'swipewarn', 'swipe', 'crouch', 'pounce',
    'roar', 'springwarn', 'spring', 'perch', 'dive', 'recover', 'daze', 'nullcharge', 'nullhop', 'nullend'];
  const observed = Object.keys(seenSt);
  const expected = ['meeting'].concat(requiredStates, ['phase-two-double-swipe', 'purified-follow']);
  const observedBeats = (meetPlayed ? ['meeting'] : []).concat(observed,
    swipes >= 2 ? ['phase-two-double-swipe'] : [], purifiedFollow ? ['purified-follow'] : []);
  R.coverage = {
    kind: 'staged-nullfang-reel', expected, observed: observedBeats,
    missing: expected.filter(k => !observedBeats.includes(k)),
    forcedFallbacks: forced ? ['dazeReq'] : [],
    note: 'Directed/staged capture; never evidence of an uninterrupted campaign playthrough.',
  };
  R.log.push('states seen: ' + observed.join(' '));
  R.log.push('coverage: ' + JSON.stringify(R.coverage));
  await R.secEnd();
}

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const out = args.find(a => !a.startsWith('--')) || 'restyle/reel/nullfang_moves.mp4';
  const reel = out.replace(/\.mp4$/, '') + '_arena.mp4';
  // bossFilter keeps the SHIPPED fight camera (its own zoom, framing both
  // bodies): the film shows the fight the way a player sees it
  await film({
    out: reel, fdir: path.join(path.dirname(out), 'nf_frames'), keep: args.includes('--keep'),
    cfg: { MAXF: 0, bossFilter: 'glitch' }, src: nullfang.toString() + '\n' + nullfangReel.toString(), start: 'nullfang', startArg: null,
    wavName: 'nullfang_moves', requireCoverage: true,
  });
  // ...and the purification film after it, as shipped. It carries no sound
  // of its own (the game plays it over the zone's music), so it rides on
  // silence rather than a borrowed track.
  const vid = path.join(__dirname, '..', 'assets', 'video', 'purify_glitch.mp4');
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', '-i', reel, '-i', vid,
    '-f', 'lavfi', '-t', '8.04', '-i', 'anullsrc=r=32000:cl=mono',
    '-filter_complex', '[1:v]scale=960:540,setsar=1,fps=30,format=yuv420p[fv];[0:a]aresample=32000,aformat=channel_layouts=mono[a0];' +
      '[0:v][a0][fv][2:a]concat=n=2:v=1:a=1[v][a]',
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (!args.includes('--keep')) fs.unlinkSync(reel);
  console.log('wrote', out, (fs.statSync(out).size / 1048576).toFixed(1) + ' MB');
})().catch(e => { console.error(e); process.exit(1); });
