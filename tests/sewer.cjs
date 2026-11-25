// THE SEWER (owner, 2026-11-24): UNDERTOW's caves are a sewer in the robot
// world, entered Super-Mario-style through a floor hatch she hauls open (her own
// fired art, a rusty creak and a clang), dropped into from the top onto a lift
// that takes her down. Rivet the pipe-smith asks for MIREJAW's shed skin and
// forges the HIDE SHELL from it: worn on her back, slower, turns blows from
// behind. This holds all of it.
//
//   node tests/sewer.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fails = [];
const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
console.log('── sewer — the hatch, the drop, Rivet, the skin and the shell');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function');
  const R = await p.evaluate(async () => {
    const out = {};
    const flags0 = { tut: 1, woke: 1, crystal: 1, bossGlitch: 1, ch2Climb: 1, k2Road: 1 };
    const fresh = (extra, theme) => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; if (theme) sv.theme = theme; Object.assign(sv.flags, flags0, extra || {}); return sv; };
    // the game's own frame loop, on a clock this file owns
    const realNow = performance.now, realRAF = window.requestAnimationFrame;
    let clk = realNow.call(performance);
    await new Promise(k => realRAF(k));
    window.requestAnimationFrame = () => 0;
    await new Promise(k => setTimeout(k, 40));
    performance.now = () => clk;
    const run = async (n, each) => { for (let i = 0; i < n; i++) { if (G.state === 'DIALOG' && !G.dialog) G.state = 'PLAY'; clk += 1000 / 60; mainLoop(clk); if (each) each(); await new Promise(k => setTimeout(k, 0)); } };
    const settle = async () => { for (let i = 0; i < 6; i++) { G.dialog = null; G.state = 'PLAY'; G.toasts = []; if (typeof overlayClear === 'function') overlayClear(); await run(2); } };
    const sounds = []; const pb0 = window.playBuf;
    window.playBuf = function (k) { sounds.push(k); return pb0.apply(this, arguments); };

    // ---- the hero's world keeps its caves; this one has the sewer -----------
    G.state = 'PLAY';
    startGame(fresh({}, 'hero'));
    out.heroCave = !!(ROOMS.GB1.cave && ROOMS.GB1T.cave && ROOMS.GB1D.cave);
    startGame(fresh({}));
    out.roboSewer = ['GB1', 'GB1T', 'GB1D'].every(id => !ROOMS[id].cave && ROOMS[id].mus === 'sewer' && /^sewer/.test(ROOM_VISTA[id] || ''));
    out.undertow = (ROOMS.GB1D.ents || []).some(e => e[0] === 'sage');
    // ---- the hatch: dark before the CARRIER falls -----------------------------
    loadRoom('B6'); await settle();
    const d0 = gateDoors().find(d => d.style === 'hatch');
    out.hatchDoor = d0 ? { to: d0.to, locked: gateLocked(d0), line: d0.lockLine } : null;
    out.lockLine = t('sw_hatch_rusted');
    loadRoom('GB1T'); await settle();
    out.tunnelRingBack = gateDoors().some(d => d.to === 'B6');
    // ---- open it, drop in -----------------------------------------------------
    startGame(fresh({ bossCarrier: 1 })); loadRoom('B6'); await settle();
    for (const k of ['sewerHatch', 'heroHatchBare', 'heroHatchSingle', 'heroHatchDual', 'heroHatchJoined', 'sewerGallery']) mediaFetch(k, 1);
    for (let i = 0; i < 80 && !(MEDIA_IMG.sewerHatch && MEDIA_IMG.sewerHatch.naturalWidth && MEDIA_IMG.heroHatchSingle && MEDIA_IMG.heroHatchSingle.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    out.strips = ['heroHatchBare', 'heroHatchSingle', 'heroHatchDual', 'heroHatchJoined'].map(k => !!(MEDIA_SRC.images[k] && MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth === 8 * MEDIA_IMG[k].naturalHeight));
    G.enemies = [];
    const hd = GATE_STORY.B6;
    player.x = gateWorldX(hd) + 40; player.y = (G.roomDef.h - 3) * TILE; player.vy = 0;
    await run(30);
    // from a ledge above it the hatch is not hers to open (it is in the floor)
    const y0 = player.y; player.y = (G.roomDef.h - 2) * TILE - 6 * TILE - player.h; player.on = true;
    out.fromLedge = !!gateHere();
    player.y = y0; await run(20);
    const cores0 = player.cores;
    sounds.length = 0;
    out.entered = gateEnter();
    const cells = [], lids = [], keys = new Set(); let tWalk = 0, sawFace = new Set();
    // what the door pass actually DREW, frame by frame (G._hatchRect): the lid
    // the player saw, and whether the hatch was on screen at all
    let beatFrames = 0, hatchDrawn = 0, hole = null;
    G._hatchRect = null;
    await run(200, () => {
      const g = G.gateWalk, hr = G._hatchRect; G._hatchRect = null;
      if (g && g.hatch) {
        tWalk += 1 / 60;
        if (g.align >= 1 && g.ht < SW_HATCH.fadeAt) {
          beatFrames++; if (hr) hatchDrawn++;
          if (hr && hr.cell === 0 && !hole) {
            // the closed hatch's INK above and below the floor line, as drawn
            const im = MEDIA_IMG.sewerHatch, cw = im.naturalWidth / 4, ch = im.naturalHeight;
            const cv2 = document.createElement('canvas'); cv2.width = cw; cv2.height = ch;
            const x2 = cv2.getContext('2d'); x2.drawImage(im, 0, 0, cw, ch, 0, 0, cw, ch);
            const a = x2.getImageData(0, 0, cw, ch).data; let top = ch, bot = 0;
            for (let y = 0; y < ch; y++) for (let x = cw * 0.3 | 0; x < cw * 0.7; x++) if (a[(y * cw + x) * 4 + 3] > 60) { if (y < top) top = y; if (y > bot) bot = y; }
            const k = hr.h / ch, floorRow = (hr.gy - hr.y) / k;
            hole = { above: +((floorRow - top) * k).toFixed(1), below: +((bot - floorRow) * k).toFixed(1) };
          }
          if (G.gateStepCell >= 0 && cells[cells.length - 1] !== G.gateStepCell) cells.push(G.gateStepCell);
          const l = hr ? hr.cell : -1; if (lids[lids.length - 1] !== l) lids.push(l);
          if (G.gateBackKey) keys.add(G.gateBackKey);
          sawFace.add(player.face);
        }
      }
    });
    out.drawn = { beatFrames, hatchDrawn }; out.hole = hole;
    out.cells = cells; out.lids = lids; out.keys = [...keys]; out.faces = [...sawFace]; out.tWalk = +tWalk.toFixed(2);
    out.sounds = { creak: sounds.includes('sw_creak'), clang: sounds.includes('sw_clang') };
    out.unhurt = player.cores === cores0;
    out.room = G.roomId;
    // ---- the top of the shaft, the lift, the floor ---------------------------
    const L = swLift();
    out.arrive = { y: player.y | 0, liftTop: L && L.st !== 'bot' ? 1 : 0 };
    const ys = [];
    await run(260, () => { const q = swLift(); if (q) ys.push(q.y); });
    const floorY = SW_LIFT.bot * TILE;
    out.lift = { st: swLift() && swLift().st, start: ys[0] | 0, end: ys[ys.length - 1] | 0, feet: (player.y + player.h) | 0, floorY, on: player.on };
    // the lift never jumps: no frame moves it more than its speed allows
    let maxStep = 0; for (let i = 1; i < ys.length; i++) maxStep = Math.max(maxStep, Math.abs(ys[i] - ys[i - 1]));
    out.lift.maxStep = +maxStep.toFixed(1);
    // ---- the tunnel is Rivet's to open --------------------------------------
    const rx = ROOMS.GB1.exits.R;
    out.exitShut = !exitOpen(rx);
    out.whyLine = t(rx.why);
    // ---- Rivet: he asks first ------------------------------------------------
    const sm = G.statics.find(s => s.type === 'swsmith');
    out.smith = !!sm;
    out.goalBefore = progressGoal(G.save.flags);
    G.dialog = null; swInteract(sm); out.askLines = G.dialog ? G.dialog.lines.length : 0;
    const end1 = G.dialog && G.dialog.onEnd; G.dialog = null; if (end1) end1();
    out.asked = !!G.save.flags.smithAsked;
    out.goalAfterAsk = progressGoal(G.save.flags);
    // ---- MIREJAW gives his skin ----------------------------------------------
    G.save.flags.bossMirejaw = 1;
    G.dialog = null; G.state = 'PLAY';
    G.onBossDead('mirejaw');
    out.skin = !!(G.save.bag && G.save.bag.mjSkin);
    out.skinCard = !!(G.dialog && G.dialog.item && G.dialog.lines.join(' ').includes(t('sw_skin')));
    out.bagLists = typeof bagList === 'function' && bagList().some(i => i.id === 'mjSkin');
    G.dialog = null; G.state = 'PLAY';
    out.goalWithSkin = progressGoal(G.save.flags);
    // ---- the forge -----------------------------------------------------------
    const spd0 = player.speed();
    swInteract(sm); const end2 = G.dialog && G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (end2) end2();
    G.enemies = [];
    for (let i = 0; i < 90 && !(G.dialog && G.dialog.item); i++) await run(1);
    out.forged = { made: !!G.save.flags.shellMade, on: !!G.save.flags.shellOn, skinGone: !(G.save.bag && G.save.bag.mjSkin), card: !!(G.dialog && G.dialog.item) };
    G.dialog = null; G.state = 'PLAY';
    out.exitOpenAfter = exitOpen(rx);
    out.goalAfterShell = progressGoal(G.save.flags);
    out.speed = { before: spd0, after: player.speed() };
    // ---- the shell: behind is turned (heating), the front cut, never hidden in
    G.enemies = []; player.iT = 0; player.cores = 6; player.face = player.faceVis = 1;
    const cx = player.x + player.w / 2;
    const hits = [];
    for (let i = 0; i < 3; i++) { player.iT = 0; const c0 = player.cores; player.hurt(1, cx - 60, 'test'); hits.push(c0 - player.cores); }
    out.behind = hits;
    SW.shellHeat = 0; player.iT = 0; let c1 = player.cores; player.hurt(2, cx + 60, 'test'); out.front2 = c1 - player.cores;
    // off: no shell, nothing turned, full speed
    G.save.flags.shellOn = 0; SW.shellHeat = 0; player.iT = 0; c1 = player.cores; player.hurt(1, cx - 60, 'test');
    out.offBehind = c1 - player.cores; out.offSpeed = player.speed();
    G.save.flags.shellOn = 1; player.cores = 6;
    // ---- the gear screen wears it and takes it off ---------------------------
    const row = gearRows(G.save).find(r => r.id === 'shell');
    out.gearRow = !!row && row.installed;
    G.crestIdx = gearRows(G.save).findIndex(r => r.id === 'shell'); gearActivate(); out.gearOff = !G.save.flags.shellOn;
    G.crestIdx = gearRows(G.save).findIndex(r => r.id === 'shell'); gearActivate(); out.gearOn = !!G.save.flags.shellOn;
    // ---- it is drawn, ON HER BACK, behind her ---------------------------------
    mediaFetch('sewerShellSide', 1);
    for (let i = 0; i < 60 && !(MEDIA_IMG.sewerShellSide && MEDIA_IMG.sewerShellSide.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 400; const cc = cv.getContext('2d');
    const order = []; const d0i = cc.drawImage.bind(cc);
    cc.drawImage = function (im) { order.push(im === MEDIA_IMG.sewerShellSide ? 'shell' : 'x'); return d0i.apply(cc, arguments); };
    const sides = [];
    for (const face of [1, -1]) {
      player.face = player.faceVis = face; player.vx = 0;
      player.draw(cc); order.length = 0;
      cc.setTransform(1, 0, 0, 1, 0, 0); cc.clearRect(0, 0, 400, 400);
      cc.translate(200 - (player.x + player.w / 2), 320 - (player.y + player.h));
      player.draw(cc);
      const pose = player._echoPose, bb = pose && swBackOf(pose.key, pose.f, pose.cells);
      // where the shell's middle sits against her middle, in her facing
      if (bb) sides.push({ face, back: bb.ax < 0.5 === !pose.flip, first: order.indexOf('shell') >= 0 && order.indexOf('shell') < order.lastIndexOf('x') });
    }
    out.sides = sides;
    // ---- the channels are water: in, and she is pulled out --------------------
    loadRoom('GB1T'); await settle(); G.enemies = [];
    const [x0, x1, row2] = SW_WATER.GB1T[0];
    player.lastSafe = { x: 3 * TILE, y: row2 * TILE - player.h };
G.rescue = null; player.cores = player.maxCores();
    player.iT = 0; player.x = ((x0 + x1) / 2) * TILE; player.y = row2 * TILE + 4; player.vy = 0;
    const c2 = player.cores;
    await run(3);
    out.water = { hurt: c2 - player.cores, rescue: !!G.rescue };
    // ---- the words, in all five languages -------------------------------------
    const want = ['n_swsmith', 'sw_hatch_rusted', 'sw_smith_1', 'sw_smith_2', 'sw_smith_3', 'sw_smith_remind', 'sw_smith_craft', 'sw_smith_after', 'sw_smith_wait', 'sw_skin', 'sw_skind', 'i_mjSkin', 'i_mjSkind', 'sw_shell', 'sw_shelld', 'sw_shell_card', 'sw_backslot', 'pg_goal_sewer', 'pg_goal_smith'];
    const missing = [];
    for (const L2 of ['en', 'ar', 'tr', 'zh', 'ru']) for (const k of want) if (!TEXT_LAYERS.some(l => l[L2] && l[L2][k])) missing.push(L2 + ':' + k);
    out.missing = missing;
    out.freeVerb = TEXT_LAYERS.some(l => l.en && Object.keys(l.en).some(k => /^sw_/.test(k) && /\bfree/i.test(l.en[k])));
    return out;
  });
  check('the hero\'s world keeps its three caves', R.heroCave);
  check('the robot world\'s GB1/GB1T/GB1D are the sewer: its paintings, its score, no cave', R.roboSewer);
  check('UNDERTOW still waits in the cistern', R.undertow);
  check('the relay gallery\'s door is a hatch into the sewer, rusted shut before the CARRIER falls', R.hatchDoor && R.hatchDoor.to === 'GB1' && R.hatchDoor.locked && R.hatchDoor.line === 'sw_hatch_rusted', JSON.stringify(R.hatchDoor) + ' "' + R.lockLine + '"');
  check('the old ring back up from the tunnel is gone (one way in: the hatch)', !R.tunnelRingBack);
  check('from a ledge above it the hatch cannot be opened (she stands on the floor it is in)', R.fromLedge === false);
  check('her four hatch strips (one per blade) are named, on disk, eight cells each', R.strips.every(Boolean), JSON.stringify(R.strips));
  check('she opens it in her own art: all eight cells, in order (crouch, strain, lift, push, look, hop, air, drop)', R.cells.join() === '0,1,2,3,4,5,6,7', R.cells.join(' ') + ' ' + R.keys.join(','));
  check('the hatch is on screen through the whole opening (it was once drawn over by a cave mouth)', R.drawn.beatFrames > 60 && R.drawn.hatchDrawn === R.drawn.beatFrames, JSON.stringify(R.drawn));
  check('the lid the player SEES follows her hands: closed, cracked, raised, thrown open', R.lids.join() === '0,1,2,3', R.lids.join(' '));
  check('it is a hole IN the floor (owner, 2026-11-25): closed, the broken slab and shaft hang below the floor line, little stands above it', R.hole && R.hole.below > 2.5 * R.hole.above && R.hole.below > 80, JSON.stringify(R.hole));
  check('coming from the east she opens it from the east, facing it the whole time (her strip mirrored, never a flip)', R.faces.length === 1 && R.faces[0] === -1, R.faces.join());
  check('it creaks as it lifts and clangs as it falls open (recorded, CC0)', R.sounds.creak && R.sounds.clang, JSON.stringify(R.sounds));
  check('nothing bites her while her controls are held', R.unhurt);
  check('one shot, not a wait: walk, open and drop in under 3 seconds', R.tWalk > 1.5 && R.tWalk < 3, R.tWalk + ' s');
  check('she comes in at the top of the gallery\'s shaft, the lift waiting up there', R.room === 'GB1' && R.arrive.y < 200 && R.arrive.liftTop === 1, JSON.stringify(R.arrive));
  check('the lift takes her down to the floor and she stands on it there', R.lift.st === 'bot' && Math.abs(R.lift.end - (R.lift.floorY - 2)) < 2 && Math.abs(R.lift.feet - R.lift.end) < 6 && R.lift.on, JSON.stringify(R.lift));
  check('...and it moves, it does not jump (no frame further than its speed)', R.lift.maxStep > 0 && R.lift.maxStep <= 230 / 60 + 0.5, R.lift.maxStep + ' px/frame');
  check('the tunnel east is shut until Rivet makes the shell, and says why', R.exitShut && /Rivet/.test(R.whyLine), R.whyLine);
  check('Rivet stands in the gallery; the goal points to the sewer until he has asked', R.smith && R.goalBefore === 'pg_goal_sewer', R.goalBefore);
  check('he asks for the crocodile\'s shed skin, in three lines', R.askLines === 3 && R.asked && /pg_goal_(ferry|mire)/.test(R.goalAfterAsk), R.askLines + ' ' + R.goalAfterAsk);
  check('MIREJAW, beaten, gives his shed skin, said on its own card, kept in the bag', R.skin && R.skinCard && R.bagLists);
  check('with the skin the goal is Rivet', R.goalWithSkin === 'pg_goal_smith', R.goalWithSkin);
  check('Rivet forges the shell from it: skin gone, shell made and on her back, a card', R.forged.made && R.forged.on && R.forged.skinGone && R.forged.card, JSON.stringify(R.forged));
  check('the shell opens the tunnel, and the goal goes on to UNDERTOW', R.exitOpenAfter && R.goalAfterShell === 'pg_goal_undertow', R.goalAfterShell);
  check('she runs slower in it', R.speed.after < R.speed.before * 0.9 && R.offSpeed === R.speed.before, JSON.stringify(R.speed) + ' off ' + R.offSpeed);
  check('a blow from behind rings off it twice, the third gets through (it heats: no hiding in it)', R.behind.join() === '0,0,1', R.behind.join(' '));
  check('a heavy blow from the front comes through one core lighter', R.front2 === 1, R.front2);
  check('taken off, it turns nothing and costs no speed', R.offBehind === 1);
  check('the gear screen lists it, takes it off and puts it back on', R.gearRow && R.gearOff && R.gearOn, R.gearOff + ' ' + R.gearOn);
  check('it is drawn behind her body, on her BACK, whichever way she faces', R.sides.length === 2 && R.sides.every(s => s.back && s.first), JSON.stringify(R.sides));
  check('a channel is water: in it she is hurt and pulled out where she went in', R.water.hurt === 1 && R.water.rescue, JSON.stringify(R.water));
  check('every word in all five languages', R.missing.length === 0, R.missing.slice(0, 6).join(' '));
  check('no "free" in its words (the verb is purify)', !R.freeVerb);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the hatch, the drop, Rivet\'s quest and the shell all hold');
})().catch(e => { console.error(e); process.exit(1); });
