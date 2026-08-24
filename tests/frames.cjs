// "IT CHANGES FROM STILL TO HIT WITHOUT TRANSITIONS IN BETWEEN."
//
// The owner's report, twice over: the run pushed with one leg and slid on the
// other, and every attack held ONE drawing for its whole 240 ms and then
// snapped back. Both are the same defect — a body made of poses instead of
// moves — and neither was visible to any harness here, because every other one
// measures a single frame and this defect only exists BETWEEN frames.
//
// So this measures consecutive frames of one verb and asks whether the picture
// actually changed. A held pose scores near zero. A drawn move cannot.
//
// It also covers the mechanism the rest of the transitions will arrive
// through (js/entities.js HERO_TRANS / HERO_AIR_STRIP): that a fired strip is
// indexed by the clock the physics already keeps, and — the part that lets art
// land one piece at a time — that a transition with no art draws its pose cell
// and nothing breaks.
//
//   node tests/run.cjs frames        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── frames — a verb is a move, not a pose held for a quarter of a second\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash']; sv.abil = { dash: 1, key: 1 };
    sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r => setTimeout(r, 1400));
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.toasts = [];
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
  });

  // ---- 1. every attack is a MOVE ------------------------------------------
  // Her body is drawn alone: G.artProbe already suppresses the ground-anchored
  // decoration these harnesses must not measure, and the slash sheets are the
  // game's own effect rather than her body — a strip that never changed would
  // still "differ" frame to frame if the arc swinging over it were counted.
  const perAttack = await page.evaluate(async () => {
    const out = {};
    // THE STRIPS ARE WARMED FIRST, and finding out why is worth the note: art
    // in this engine is fetched LAZILY on first use, so drawStripCell returns
    // false until the sheet arrives and the pose cell covers the gap. With the
    // loop frozen and six frames drawn in the same tick, nothing ever arrives
    // — so the first run of this measured the POSE CELL, reported 0.7% change
    // across claw_1, and would have been read as the fix having failed.
    await Promise.all(['swingClaw1', 'swingClaw2', 'swingFinisher', 'swingBurst'].map(k => {
      mediaFetch(k);
      return new Promise(ok => {
        const t = setInterval(() => {
          const im = MEDIA_RAW[k];
          if (im && im.naturalWidth) { clearInterval(t); ok(); }
        }, 30);
        setTimeout(() => { clearInterval(t); ok(); }, 8000);
      });
    }));
    // THE LOOP IS FROZEN FIRST. A blow lasts 240 ms and the page's own rAF
    // drains it long before six frames can be posed by hand — the same lesson
    // tools/swingshot.cjs records. Nothing advances here but the clock this
    // harness sets.
    window.update = () => {};
    const W = 150, H = 150;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx2 = cv.getContext('2d', { willReadFrequently: true });
    const shot = () => {
      const cvs = document.querySelector('canvas');
      cx2.clearRect(0, 0, W, H);
      const sx = (player.x + player.w / 2 - cam.x) * (cvs.width / 960);
      const sy = (player.y + player.h - cam.y) * (cvs.height / 540);
      cx2.drawImage(cvs, Math.round(sx - W / 2), Math.round(sy - H + 24), W, H, 0, 0, W, H);
      return cx2.getImageData(0, 0, W, H).data;
    };
    // a mask of "there is something bright here", which is what a silhouette is
    const mask = (d) => {
      const m = new Uint8Array(W * H);
      for (let p = 0; p < W * H; p++) {
        const j = p << 2;
        m[p] = (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) > 96 ? 1 : 0;
      }
      return m;
    };
    const diff = (a, b) => {
      let n = 0, on = 0;
      for (let p = 0; p < a.length; p++) { if (a[p] !== b[p]) n++; if (a[p] || b[p]) on++; }
      return on ? n / on * 100 : 0;
    };
    for (const atk of ['claw_1', 'claw_2', 'finisher', 'burst']) {
      // the swing is SET rather than pressed: three of the four are unreachable
      // from a single press (a chain, a held charge) and a cooldown sits
      // between them, and what is under test is the drawing, not the input
      const t0 = atk === 'burst' ? 0.32 : 0.24;
      player.swingVis = { t: t0, t0, combo: atk === 'finisher' ? 3 : atk === 'claw_2' ? 2 : 1,
                          charged: atk === 'burst' };
      const masks = [];
      for (let i = 0; i < 6; i++) {
        player.swingVis.t = player.swingVis.t0 * (1 - (i + 0.5) / 6);
        // THE IMPACT PANEL IS NOT HER BODY. G.impact whites out the whole
        // screen and rakes 26 action lines across it, and its clock only ticks
        // in update() — which this harness has stubbed — so it froze over the
        // measurement and every frame came back 99.7% lit and identical.
        // Same species as the speech panel grammar.cjs seals: an effect drawn
        // over the character is not the character.
        G.impact = null;
        G.artProbe = 1;
        draw();
        G.artProbe = 0;
        masks.push(mask(shot()));
      }
      const ds = [];
      for (let i = 1; i < masks.length; i++) ds.push(+diff(masks[i - 1], masks[i]).toFixed(1));
      const lit = masks.map(m => m.reduce((a, b) => a + b, 0));
      out[atk] = { ds, lit, min: Math.min(...ds),
                   mean: +(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1) };
      player.swingVis = null;
    }
    return out;
  });

  // WHAT THE NUMBERS MEAN, so the thresholds are not folklore. A held pose
  // scores 0.0 on every pair — that is what these four measured before the
  // strips were fired, and it is the defect. A drawn blow measured 13 to 27%
  // mean silhouette change. The floor is set well under the measured values
  // and far above zero, so it catches a strip being lost, unwired or replaced
  // by its pose cell, and does not police how an animator paced the move.
  //
  // A pair is allowed to be small: claw_1's first two cells are both the
  // wind-up and differ by 0.7%, which is anticipation HOLDING, exactly as it
  // should. What is not allowed is the whole move sitting still — so the test
  // is on the mean and on the largest step, not on every pair.
  for (const atk of ['claw_1', 'claw_2', 'finisher', 'burst']) {
    const r = perAttack[atk];
    const max = r.ds ? Math.max(...r.ds) : 0;
    check(atk + ' is a move rather than a pose held for the whole blow',
      !r.err && r.mean >= 6 && max >= 12,
      r.err || 'frame-to-frame silhouette change ' + r.ds.join(' / ') + ' %, mean ' + r.mean
        + ', biggest step ' + max + '%');
  }

  // ---- 1b. THE STRIP IS PLAYED WHOLE ---------------------------------------
  // A strip declares how many cells it has and the renderer indexes by that
  // number. Get it wrong and the blow plays the wrong part of itself, silently
  // and forever: re-cutting these at the film's own frame rate turned six cells
  // into thirteen, and until the table caught up the game played cells 0-5 of
  // 13 — the first 46% of the swing, ending on the wind-up. Nothing looked
  // broken. It just was not the move.
  //
  // The image knows its own count: the cells are square, so width/height IS the
  // number of them, and the declared count has to agree.
  const counts = await page.evaluate(async () => {
    const out = {};
    for (const name of Object.keys(SWING_STRIP)) {
      const S = SWING_STRIP[name];
      mediaFetch(S.key);
      const im = await new Promise(ok => {
        const t0 = Date.now();
        const tick = () => {
          const i2 = MEDIA_RAW[S.key];
          if (i2 && i2.naturalWidth) return ok(i2);
          if (Date.now() - t0 > 8000) return ok(null);
          setTimeout(tick, 30);
        };
        tick();
      });
      out[name] = im
        ? { declared: S.cells, actual: Math.round(im.naturalWidth / im.naturalHeight) }
        : { declared: S.cells, actual: null };
    }
    return out;
  });
  for (const name of Object.keys(counts)) {
    const r = counts[name];
    check(name + ': the strip is played whole, every cell the film holds',
      r.actual !== null && r.actual === r.declared,
      'declared ' + r.declared + ' cells, the sheet holds ' + (r.actual === null ? 'nothing yet' : r.actual));
  }

  // ---- 2. the transition mechanism ----------------------------------------
  // A synthetic strip, because the point is the WIRING: that the cell drawn is
  // the cell the clock asks for. Six cells that differ only in which sixth of
  // the picture is filled, so the cell index can be read straight back off it.
  const mech = await page.evaluate(() => {
    const N = 6, S = 64;
    const cv = document.createElement('canvas'); cv.width = S * N; cv.height = S;
    const c2 = cv.getContext('2d');
    for (let i = 0; i < N; i++) {
      c2.fillStyle = 'rgb(' + (20 + i * 40) + ',' + (20 + i * 40) + ',' + (20 + i * 40) + ')';
      c2.fillRect(i * S, 0, S, S);
    }
    const im = new Image(); im.src = cv.toDataURL('image/png');
    MEDIA_RAW.__testStrip = im;
    const asked = [];
    const real = window.drawStripCell;
    window.drawStripCell = (c, key, cell, cells, cx, base, h, flip) => {
      if (key === '__testStrip') { asked.push(cell); return true; }
      return real(c, key, cell, cells, cx, base, h, flip);
    };

    // the jump arc, indexed by her own vertical speed
    HERO_AIR_STRIP = { key: '__testStrip', cells: N, k: 1, up: 770, down: 700 };
    const air = [];
    for (const vy of [-770, -400, -100, 0, 300, 690]) {
      asked.length = 0;
      player.vy = vy;
      player.drawRoboTrans(document.querySelector('canvas').getContext('2d'),
        vy < -140 ? 'rise' : vy < 140 ? 'apex' : 'fall');
      air.push(asked.length ? asked[0] : -1);
    }
    HERO_AIR_STRIP = null;

    // a grounded one-shot, indexed by the timer the physics already keeps
    HERO_TRANS.land = { key: '__testStrip', cells: N, k: 1,
                        t: p => p.landT, t0: p => p.land0 || 0.12 };
    const ground = [];
    player.land0 = 0.12;
    for (const frac of [1, 0.8, 0.5, 0.2, 0.02]) {
      asked.length = 0;
      player.landT = 0.12 * frac;
      player.drawRoboTrans(document.querySelector('canvas').getContext('2d'), 'land');
      ground.push(asked.length ? asked[0] : -1);
    }
    // ...and a spent clock draws no clip at all, so the pose cell gets the frame
    asked.length = 0;
    player.landT = 0;
    const spent = player.drawRoboTrans(document.querySelector('canvas').getContext('2d'), 'land');
    delete HERO_TRANS.land;

    // and with nothing fired — the state of the table as it ships — every
    // state falls through, which is what lets the art land one piece at a time
    let fellThrough = true;
    for (const st of ['idle', 'run_a', 'rise', 'apex', 'fall', 'land', 'skid', 'dash'])
      if (player.drawRoboTrans(document.querySelector('canvas').getContext('2d'), st)) fellThrough = false;

    window.drawStripCell = real;
    delete MEDIA_RAW.__testStrip;
    return { air, ground, spent, fellThrough };
  });

  check('the jump arc is indexed by her own vertical speed',
    JSON.stringify(mech.air) === JSON.stringify([0, 1, 2, 3, 4, 5]),
    'vy -770..+690 asked for cells ' + mech.air.join(','));
  check('a grounded transition is indexed by the clock the physics keeps',
    mech.ground[0] === 0 && mech.ground[mech.ground.length - 1] === 5
      && mech.ground.every((v, i, a) => i === 0 || v >= a[i - 1]),
    'over its timer it asked for cells ' + mech.ground.join(','));
  check('a spent clock hands the frame back to the pose cell', mech.spent === false);
  check('and with no strip fired every state falls through to its pose',
    mech.fellThrough);

  check('no page errors', errs.length === 0, errs[0] || '');

  console.log('');
  if (fails.length) {
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }
  console.log('OK — the verbs move, and the transition layer draws the cell its clock asks for');
  await browser.close();
})();
