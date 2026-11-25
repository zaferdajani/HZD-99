// THE DOOR TO KINGDOM 2 — NULLFANG's door, grown over until he is free and roars it open.
//
// The owner, 2026-11-25 (docs/OWNER_ORDERS.md "The door to Kingdom 2, and the paid game"): cover
// the door in his arena "with leaves and plants that stick to it, just like the climbing plants";
// when he is freed "it does a move like a roar or something" and the plants come off, "and the
// trees will just respond and create an opening for it"; the door leads to the second kingdom
// "instead of going up into the sky, into the light, which means you will remove the light from
// the screen before it"; and the way in past it is "a place that requires the dash".
//
// This plays it, it does not read a table:
//   1. COVERED BEFORE. Before he is free the door is shut, the vines are DRAWN over it (the frame
//      changes when the vine drawing is switched off), and UP at it refuses with its own line.
//   2. FREED, STILL ASLEEP. Purified, he has not roared yet: the vines still hold it.
//   3. OPENED BY HIS ROAR. Played frame by frame: he walks to the door, faces it, ROARS (his
//      roar is drawn), and only then do the vines tear off — torn pieces that travel, turn and
//      come down (never a fade: drawn at full strength; never a slide: they rotate and fall).
//      No white-out over it. The clumps either side stay bent out of its way. The save keeps it
//      open. Then she walks through it to the frontier road (A14).
//   4. THE DASH ROOM. A14's two pits of teeth cannot be crossed by the longest run-up jump
//      without the dash (from the ground, and from the hull's top before the second) and can with
//      it — the real Player, the real keys, not arithmetic.
//   5. IT LEADS TO B1. A14's east edge is the Conduits' first room, and B1's west edge is A14.
//   6. THE OLD CLIMB AND THE LIGHT ARE GONE from the robot story: no way up out of the camp
//      (A3), no way down from B1 to it, no frontier light; NOSTOS keeps its own climb.
//   7. THE DEMO WALL sits on the new threshold: A14 -> B1 is the door the free chapter ends at,
//      and the lion's door before it is not.
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── k2-door — NULLFANG\'s door: covered, roared open, the dash road, into the Conduits');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { try { localStorage.setItem('cb_intro_seen', '1'); } catch (e) {} window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof k2VinesDraw === 'function', { timeout: 20000 });

  // the robot story, the meadow's guardians behind her; `more` are the flags under test
  await page.evaluate(async () => {
    window.__fresh = (more, abil) => {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
      Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1, bossChime: 1, sageTame_GA1D: 1 }, more || {});
      if (abil) sv.abil = abil;
      startGame(sv); G.rescue = null;
    };
    window.__clear = () => { if (G.dialog || G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; } G.toasts = []; G.card = null; G.zoneToast = null; };
    __fresh({});
    for (const k of ['ringConduit', 'ringConduitVines']) mediaFetch(k, true);
    const t0 = performance.now();
    while (performance.now() - t0 < 15000 && !(MEDIA_IMG.ringConduit && MEDIA_IMG.ringConduit.naturalWidth && MEDIA_IMG.ringConduitVines && MEDIA_IMG.ringConduitVines.naturalWidth))
      await new Promise(r => setTimeout(r, 100));
  });

  // ---- 1. COVERED BEFORE --------------------------------------------------
  const before = await page.evaluate(() => {
    __fresh({}); loadRoom('A4'); __clear(); G.state = 'PLAY';
    const d = gateDoors()[0];
    if (!d) return { none: true };
    const gx = gateWorldX(d);
    player.x = gx - player.w / 2; player.y = 13 * TILE; player.vx = 0;
    updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
    G.enemies = []; G.parts = []; G.projs = [];
    // the vines are drawn: the same frame with the vine drawing switched off is a different frame
    const x = cv.getContext('2d');
    const box = () => { const p = x.getImageData(0, 0, cv.width, cv.height).data; let s = 0; for (let i = 0; i < p.length; i += 16) s += p[i] + p[i + 1] + p[i + 2]; return s; };
    const realNow = performance.now, realRand = Math.random;
    performance.now = () => 0; Math.random = () => 0.5;
    draw(0); const on = box();
    const keep = window.k2VinesDraw; window.k2VinesDraw = function () {};
    draw(0); const off = box();
    window.k2VinesDraw = keep;
    performance.now = realNow; Math.random = realRand;
    // ...and UP at it does not take her
    G.toasts = []; G._rubToldT = 0;
    const went = gateEnter();
    const said = (G.toasts || []).map(q => q.text).join(' | ');
    return { to: d.to, style: d.style, ring: ringGateFor(d), locked: gateLocked(d), vines: k2VinesOn(d), drawn: Math.abs(on - off), went, said, line: t(d.lockLine), walk: !!G.gateWalk };
  });
  check('the lion\'s arena (A4) has one door, the Conduits\' own ring, leading to the frontier road (A14)',
        before.to === 'A14' && before.style === 'k2' && before.ring === 'ringConduit', JSON.stringify({ to: before.to, style: before.style, ring: before.ring }));
  check('before he is free it is shut, and the metal vines hold it', before.locked === true && before.vines === true, JSON.stringify({ locked: before.locked, vines: before.vines }));
  check('...and the vines are really drawn over it (the frame changes without them)', before.drawn > 20000, 'difference ' + before.drawn);
  check('...UP at it refuses, and says why in her language', before.went === false && !before.walk && before.said.indexOf(before.line) >= 0 && before.line !== 'k2_door_vines',
        before.said.slice(0, 120));

  // ---- 2. FREED, STILL ASLEEP --------------------------------------------
  const asleep = await page.evaluate(() => {
    __fresh({ bossGlitch: 1 }); loadRoom('A4'); __clear(); G.state = 'PLAY';
    const d = gateDoors()[0];
    return { locked: gateLocked(d), asleep: ringAsleep(d), vines: k2VinesOn(d) };
  });
  check('purified, he has not opened it yet: unlocked, asleep, still grown over',
        asleep.locked === false && asleep.asleep === true && asleep.vines === true, JSON.stringify(asleep));

  // ---- 3. OPENED BY HIS ROAR, played -------------------------------------
  const wake = await page.evaluate(() => {
    __fresh({ bossGlitch: 1 }); loadRoom('A4'); __clear(); G.state = 'PLAY';
    const d = gateDoors()[0], gx = gateWorldX(d);
    player.x = 26 * TILE; player.y = 13 * TILE; player.iT = 99;
    const clumps = () => typeof nfCoverList === 'function' ? nfCoverList() : null;
    let T = performance.now();
    const out = { started: null, roarAt: null, tornAt: null, openAt: null, flashMax: 0, prevFlash: 0, shakeMax: 0,
                  bx0: G.boss ? G.boss.cx() : null, bxRoar: null, faceRoar: null, travel: 0, turn: 0, landed: 0, alpha: 1 };
    let first = null;
    const realAlpha = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalAlpha');
    for (let f = 0; f < 60 * 10; f++) {
      __clear(); player.iT = 99;
      T += 1000 / 60; mainLoop(T);
      const w = G.ringWake;
      if (w && out.started == null) out.started = f;
      // (a flash ADDED by the wake: the save's own evolution sting, on its first frame, is still fading as he sets off)
      if (w && (G.flash || 0) > out.prevFlash + 1e-6) out.flashMax = Math.max(out.flashMax, G.flash);
      out.prevFlash = G.flash || 0;
      if (G.boss && G.boss.petAct === 'roar' && out.roarAt == null) { out.roarAt = f; out.bxRoar = G.boss.cx(); out.faceRoar = G.boss.face; }
      if (K2D.pieces && out.tornAt == null) { out.tornAt = f; first = K2D.pieces.map(q => ({ x: q.x, y: q.y, rot: q.rot })); }
      if (K2D.pieces && first) {
        K2D.pieces.forEach((q, i) => { const a = first[i]; if (!a) return;
          out.travel = Math.max(out.travel, Math.hypot(q.x - a.x, q.y - a.y)); out.turn = Math.max(out.turn, Math.abs(q.rot - a.rot)); });
        out.landed = Math.max(out.landed, K2D.pieces.filter(q => q.down > 0).length);
        // drawn at full strength while they fly: sample the canvas alpha the vine drawing leaves
        out.alpha = Math.min(out.alpha, c.globalAlpha);
      }
      if (G.save.flags['rw_A4>A14'] && out.openAt == null) out.openAt = f;
      if (out.openAt != null && !G.ringWake && f - out.openAt > 30) break;
    }
    const cl = clumps();
    const near = cl ? cl.filter(q => Math.abs(q.x - gx) < 300) : [];
    out.way = near.map(q => +((q.way || 0) * (Math.sign(q.x - gx) || 1)).toFixed(2));   // + = leaning away from the door
    out.nClumps = cl ? cl.length : 0;
    out.n = first ? first.length : 0;
    out.gx = gx;
    out.vinesAfter = k2VinesOn(d);
    out.wakeLeft = !!G.ringWake;
    out.peek = cam.peek;
    // ...and she can walk through it now
    player.x = gx - player.w / 2 - 20; player.y = 13 * TILE; player.vx = 0; player.vy = 0;
    for (let i = 0; i < 20; i++) { __clear(); T += 1000 / 60; mainLoop(T); }
    out.enter = gateEnter();
    for (let i = 0; i < 60 * 6 && G.roomId === 'A4'; i++) { __clear(); T += 1000 / 60; mainLoop(T); }
    out.room = G.roomId;
    return out;
  });
  check('freed, he goes to his door on his own legs', wake.started != null && wake.bx0 != null && wake.bxRoar != null && Math.abs(wake.bxRoar - wake.gx) < Math.abs(wake.bx0 - wake.gx),
        'from ' + Math.round(wake.bx0) + ' to ' + Math.round(wake.bxRoar) + ', door at ' + Math.round(wake.gx));
  check('...faces it and ROARS', wake.roarAt != null && Math.sign(wake.gx - wake.bxRoar) === Math.sign(wake.faceRoar || 0),
        'roar at frame ' + wake.roarAt + ', facing ' + wake.faceRoar);
  check('...and his roar is what tears the vines off (not before it)', wake.tornAt != null && wake.roarAt != null && wake.tornAt >= wake.roarAt && wake.tornAt - wake.roarAt < 30,
        'roar ' + wake.roarAt + ', torn ' + wake.tornAt);
  check('...into ragged pieces that are thrown, turn over and come down (real motion, never a fade or a slide)',
        wake.n >= 10 && wake.travel > 120 && wake.turn > 1.5 && wake.landed >= wake.n * 0.6 && wake.alpha === 1,
        wake.n + ' pieces, travel ' + Math.round(wake.travel) + 'px, turn ' + wake.turn.toFixed(1) + ' rad, landed ' + wake.landed + ', alpha ' + wake.alpha);
  check('...with no white-out over it', wake.flashMax === 0, 'flash ' + wake.flashMax);
  check('...the clumps beside the door stay bent out of its way', wake.way.length >= 1 && wake.way.every(v => v > 0.5) && wake.nClumps >= 6,
        'way ' + wake.way.join(',') + ' of ' + wake.nClumps + ' clumps');
  check('...the save keeps it open, the vines are gone and the wake is over', wake.openAt != null && !wake.vinesAfter && !wake.wakeLeft && wake.peek == null,
        JSON.stringify({ openAt: wake.openAt, vines: wake.vinesAfter, wake: wake.wakeLeft, peek: wake.peek }));
  check('...and she walks through it to the frontier road', wake.enter === true && wake.room === 'A14', 'enter ' + wake.enter + ', room ' + wake.room);

  const again = await page.evaluate(() => {
    __fresh({ bossGlitch: 1, 'rw_A4>A14': 1 }); loadRoom('A4'); __clear(); G.state = 'PLAY';
    const d = gateDoors()[0];
    let T = performance.now();
    for (let i = 0; i < 60; i++) { __clear(); T += 1000 / 60; mainLoop(T); }
    return { asleep: ringAsleep(d), vines: k2VinesOn(d), wake: !!G.ringWake, way: nfCoverList().filter(q => Math.abs(q.x - gateWorldX(d)) < 300).map(q => +((q.way || 0) * (Math.sign(q.x - gateWorldX(d)) || 1)).toFixed(2)) };
  });
  check('coming back, the door is still open and the trees still stand aside (no second roar)',
        !again.asleep && !again.vines && !again.wake && again.way.length >= 1 && again.way.every(v => v > 0.5), JSON.stringify(again));

  // ---- 4. THE DASH ROOM --------------------------------------------------
  const road = await page.evaluate(() => {
    __fresh({ bossGlitch: 1, 'rw_A4>A14': 1 }); loadRoom('A14'); __clear();
    const g = G.grid, H = g.length, W = g[0].length;
    // the pits: runs of teeth on the floor row
    const pits = []; let s = -1;
    for (let x = 0; x < W; x++) {
      const tooth = [H - 1, H - 2, H - 3].some(y => g[y] && g[y][x] === '^');
      if (tooth && s < 0) s = x;
      if (!tooth && s >= 0) { pits.push([s, x - 1]); s = -1; }
    }
    // the longest run-up jump at the lip, the real Player and keys; with the dash, at its top
    const cross = (startTx, lipTx, useDash) => {
      __fresh({ bossGlitch: 1, 'rw_A4>A14': 1 }, useDash ? { dash: 1 } : {}); loadRoom('A14'); __clear(); G.state = 'PLAY';
      G.enemies = [];
      // stand on the ground at the start: drop her onto it
      player.x = startTx * TILE; player.y = 2 * TILE; player.vx = 0; player.vy = 0;
      for (let i = 0; i < 90 && !player.on; i++) { __clear(); update(1 / 60); }
      let jumped = false, dashed = false, land = null, fell = false;
      for (let i = 0; i < 300; i++) {
        for (const k in keysP) keysP[k] = 0; keys.ArrowRight = 1; keys.Space = 0;
        const cx = player.x + player.w / 2;
        if (!jumped && player.on && cx + player.w / 2 >= (lipTx + 1) * TILE - 4) { keysP.Space = 1; keys.Space = 1; jumped = true; }
        else if (jumped && !player.on) keys.Space = 1;
        if (useDash && jumped && !dashed && !player.on && player.vy > -80) { keysP.KeyC = 1; keys.KeyC = 1; dashed = true; }
        __clear(); player.iT = 99;
        update(1 / 60); keys.KeyC = 0;
        if (G.rescue || player.y > (H - 2) * TILE) { fell = true; break; }
        if (jumped && i > 8 && player.on) { land = (player.x + player.w / 2) / TILE; break; }
      }
      for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
      return { land: land == null ? null : +land.toFixed(1), fell, dashed, runup: 0 };
    };
    // the ground each pit is jumped from: the last standing column before it
    const lipOf = (p) => { for (let x = p[0] - 1; x > 0; x--) for (let y = 1; y < H - 1; y++) if ('#=~'.indexOf(g[y][x]) >= 0 || (g[y][x] && g[y][x] !== '.' && g[y][x] !== '^')) return x; return p[0] - 1; };
    const out = { pits, w: W, runs: [] };
    let floor0 = 1;
    for (const p of pits) {
      const lip = lipOf(p);
      const start = Math.max(floor0, lip - 9);      // (the run-up is all the ground there is: never inside the pit before)
      floor0 = p[1] + 1;
      out.runs.push({ pit: p, lip, plain: cross(start, lip, false), dash: cross(start, lip, true) });
    }
    return out;
  });
  check('the frontier road has two pits of teeth, each wider than a jump (at least 10 tiles)',
        road.pits.length === 2 && road.pits.every(p => p[1] - p[0] + 1 >= 10), JSON.stringify(road.pits));
  road.runs.forEach((r, i) => {
    const far = r.pit[1] + 1;
    check('pit ' + (i + 1) + ': the longest run-up jump without the dash does not cross it' + (i ? ' (from the hull\'s top)' : ''),
          r.plain.fell || r.plain.land == null || r.plain.land < far, 'jumped at the lip ' + r.lip + ', ' + (r.plain.fell ? 'fell into the teeth' : 'landed at tile ' + r.plain.land));
    check('pit ' + (i + 1) + ': with the dash at the top of the jump she crosses it',
          !r.dash.fell && r.dash.dashed && r.dash.land != null && r.dash.land >= far, (r.dash.fell ? 'fell' : 'landed at tile ' + r.dash.land) + ', far side ' + far);
  });

  // ---- 5. IT LEADS TO B1 ------------------------------------------------
  const lead = await page.evaluate(() => {
    __fresh({ bossGlitch: 1, 'rw_A4>A14': 1, k1End: 1 });   // (the card at this edge is section 8)
    loadRoom('A14'); __clear(); G.state = 'PLAY';
    const ex = Object.assign({}, ROOMS.A14.exits), back = Object.assign({}, ROOMS.B1.exits);
    const far = gateDoorsAll('A14').map(d => d.to);
    player.x = G.roomDef.w * TILE + 4; player.y = 13 * TILE; player.vx = 200; G.trans = null; checkTransitions();
    const to = (G.trans && G.trans.to) || (G.roomId !== 'A14' ? G.roomId : null);
    return { ex, back, far, to, zone: ROOMS.B1.zone };
  });
  check('the road\'s east edge is the Conduits\' first room (B1)', lead.ex.R === 'B1' && lead.to === 'B1' && lead.zone !== 'A', JSON.stringify(lead.ex) + ' -> ' + lead.to);
  check('...B1\'s west edge comes back to it, and the road\'s door goes back to the lion\'s arena',
        lead.back.L === 'A14' && lead.far.indexOf('A4') >= 0, JSON.stringify(lead.back) + ' / ' + lead.far.join(','));

  // ---- 6. THE OLD CLIMB AND THE LIGHT ARE GONE -------------------------
  const gone = await page.evaluate(() => {
    __fresh({ bossGlitch: 1, 'rw_A4>A14': 1 });
    const robo = { a3: Object.assign({}, ROOMS.A3.exits), b1: Object.assign({}, ROOMS.B1.exits), frontier: Object.keys(FRONTIER) };
    loadRoom('A3'); robo.gap = !!(G.grid.tGap);
    robo.ledges = 0; for (const y of [3, 6, 9]) for (let tx = 18; tx <= 28; tx++) if (G.grid[y][tx] === '=') robo.ledges++;
    // NOSTOS keeps its own climb (its story was never told through the lion's door)
    G.save.theme = 'hero';
    const hero = { a3: Object.assign({}, ROOMS.A3.exits), b1: Object.assign({}, ROOMS.B1.exits) };
    G.save.theme = 'robo';
    return { robo, hero };
  });
  check('the camp (A3) has no way up any more: no exit, no gap, no ledges up to it', !gone.robo.a3.T && !gone.robo.gap && gone.robo.ledges === 0, JSON.stringify(gone.robo.a3) + ' gap ' + gone.robo.gap + ' ledges ' + gone.robo.ledges);
  check('...B1 has no way down to it', !gone.robo.b1.B, JSON.stringify(gone.robo.b1));
  check('...and no light is drawn over it (no frontier room left)', gone.robo.frontier.length === 0, gone.robo.frontier.join(','));
  check('NOSTOS keeps its own climb', !!gone.hero.a3.T && gone.hero.b1.B === 'A3', JSON.stringify(gone.hero));

  // ---- 7. THE DEMO WALL ON THE NEW THRESHOLD ---------------------------
  const demo = await page.evaluate(() => {
    __fresh({ bossGlitch: 1, 'rw_A4>A14': 1 });
    const real = demoOn; demoOn = () => true;
    loadRoom('A14'); const road = demoWall('B1');
    loadRoom('A4'); const door = demoWall('A14');
    loadRoom('A3'); const camp = demoWall('A4');
    demoOn = real;
    return { road, door, camp, zone: ROOMS.A14.zone };
  });
  check('switched on, the free chapter ends at the road\'s east edge (A14 -> B1)', demo.road === true && demo.zone === 'A', JSON.stringify(demo));
  check('...and not at the lion\'s door before it, or anywhere in the Meadows', demo.door === false && demo.camp === false, JSON.stringify(demo));

  // ---- 8. THE END OF THE FIRST KINGDOM, played at the threshold ---------
  // The owner, 2026-11-25: "You can show it as end of, okay, or something catchy for the first
  // kingdom. And moving on to the next one. The quest is still going. And then it shows the
  // payment or whatever gate or the message." So she walks east off the road on her own legs
  // (the real keys, the real frames): the card comes FIRST, in her language, with few words; it
  // closes itself; and on the web (this page) she walks on into the Conduits — never stopped,
  // with the offer on as well as off. A second crossing has no card.
  const end = await page.evaluate(() => {
    const walk = (offer, more) => {
      DEMO_OFFER = offer;
      __fresh(Object.assign({ bossGlitch: 1, 'rw_A4>A14': 1 }, more || {})); loadRoom('A14'); __clear(); G.state = 'PLAY';
      G.enemies = [];
      player.x = (G.roomDef.w - 3) * TILE; player.y = 13 * TILE; player.vx = 0; player.vy = 0; player.iT = 99;
      let T = performance.now(); const seq = []; let note = null, cardF = 0, words = null;
      for (let f = 0; f < 60 * 9 && G.roomId === 'A14'; f++) {
        keys[KEYB.RIGHT[0]] = 1;
        if (G.state === 'DIALOG') { G.dialog = null; G.state = 'PLAY'; }
        T += 1000 / 60; mainLoop(T);
        const st = G.state === 'KEND' ? 'card' : G.state === 'MORE' ? 'gate' : G.state === 'PANELS' ? 'teaser' : (G.state === 'PLAY' || G.state === 'DIALOG') ? null : G.state;
        if (st && seq[seq.length - 1] !== st) seq.push(st);
        if (G.state === 'KEND') { cardF++; if (note == null) note = !!G.k1End.tester; }
      }
      for (const k in keys) keys[k] = 0;
      if (G.roomId !== 'A14') seq.push(G.roomId);
      return { seq: seq.join('>'), note, secs: +(cardF / 60).toFixed(2) };
    };
    const keep = DEMO_OFFER;
    const off = walk(false), on = walk(true), again = walk(true, { k1End: 1 });
    DEMO_OFFER = keep;
    const ws = k => (t(k).match(/[\p{L}\p{N}’'%+-]+/gu) || []).length;
    return { off, on, again, title: t('k1_end1'), line: t('k1_end2'), web: t('k1_end_web'),
             words: [ws('k1_end1'), ws('k1_end2'), ws('k1_end_web')], T: K1_END.T };
  });
  check('at the threshold the end-of-kingdom card comes first, then she walks on into the Conduits (web, offer off)',
        /^card>(teaser>)?B1$/.test(end.off.seq), end.off.seq + ', card ' + end.off.secs + 's');
  check('...and with the offer ON the web still walks on, the card carrying its one tester note',
        /^card>(teaser>)?B1$/.test(end.on.seq) && end.on.note === true, end.on.seq + ', note ' + end.on.note);
  check('...the card is short (it closes itself within ' + end.T + 's) and few words',
        end.off.secs > 0.5 && end.off.secs <= end.T + 0.2 && end.words.every(n => n <= 10),
        end.off.secs + 's; "' + end.title + '" / "' + end.line + '" / "' + end.web + '"');
  check('...and it is once per save: the next crossing has no card', end.again.seq.indexOf('card') < 0 && /B1$/.test(end.again.seq), end.again.seq);

  if (errs.length) check('no page errors', false, errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log(fails.length ? '\nFAIL — ' + fails.length + ' problem(s)' : '\nOK — the door is covered, his roar opens it, the road needs the dash and leads into the Conduits');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
