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
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
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
    await Promise.all(Object.values(SWING_STRIP).map(s => s.key).map(k => {
      mediaFetch(k);
      return new Promise((ok, no) => {
        const t = setInterval(() => {
          const im = MEDIA_RAW[k];
          if (im && im.naturalWidth) { clearInterval(t); clearTimeout(limit); ok(); }
        }, 30);
        const limit = setTimeout(() => {
          clearInterval(t); no(new Error('attack strip did not load: ' + k));
        }, 8000);
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
      // Measure the production player renderer directly. The former crop used
      // an unzoomed world coordinate after presentWorld had projected the scene,
      // so a camera change made this sample scenery instead of the character.
      cx2.setTransform(1, 0, 0, 1, 0, 0);
      cx2.clearRect(0, 0, W, H);
      cx2.fillStyle = '#000'; cx2.fillRect(0, 0, W, H);
      cx2.save();
      cx2.translate(W / 2 - player.x - player.w / 2, H - 24 - player.y - player.h);
      const probe = G.artProbe; G.artProbe = 1;
      try { player.draw(cx2); } finally { G.artProbe = probe; cx2.restore(); }
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
      player.swingVis = { t: t0, t0, combo: atk === 'finisher' ? 2 : atk === 'claw_2' ? 1 : 0,
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

  // ---- 1c. EVERY CELL IS A NEW PICTURE -------------------------------------
  // The owner, looking at a contact sheet of a generated take: "the images that
  // Higgsfield is generating does not always create the correct sequence of the
  // movements... a big percentage of what is inside is replicated images."
  //
  // He was right, and it was invisible from inside the game: a strip whose
  // cells repeat has the right count, the right size and the right anchor, and
  // plays as a move that stutters and then jumps. Measured when he said it,
  // THIRTY-EIGHT cells across the shipped strips were the same drawing as the
  // cell before them — 19 of patch's 24 and 12 of mono's.
  //
  // The cause was sampling on a clock; the fix is choosing frames by content
  // (tools/vidstrip.cjs `auto:N`). This is the guard that keeps it fixed, and
  // it covers every strip in the game rather than the four attacks, because the
  // defect is a property of how a strip was CUT and every strip is cut the same
  // way.
  const dupes = await page.evaluate(async () => {
    const keys = [];
    for (const n of Object.keys(SWING_STRIP)) keys.push([n, SWING_STRIP[n].key]);
    if (typeof NPC_LOOP !== 'undefined')
      for (const n of Object.keys(NPC_LOOP)) keys.push([n, NPC_LOOP[n]]);
    const out = [];
    for (const [name, key] of keys) {
      mediaFetch(key);
      const im = await new Promise(ok => {
        const t0 = Date.now();
        const tick = () => {
          const i2 = MEDIA_RAW[key];
          if (i2 && i2.naturalWidth) return ok(i2);
          if (Date.now() - t0 > 8000) return ok(null);
          setTimeout(tick, 30);
        };
        tick();
      });
      if (!im) { out.push({ name, err: 'not loaded' }); continue; }
      const H = im.naturalHeight, n = Math.round(im.naturalWidth / H), W = H;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx2 = cv.getContext('2d', { willReadFrequently: true });
      const S = 40, sig = [];
      for (let i = 0; i < n; i++) {
        cx2.clearRect(0, 0, W, H);
        cx2.drawImage(im, i * W, 0, W, H, 0, 0, W, H);
        const d = cx2.getImageData(0, 0, W, H).data;
        const a = new Float32Array(S * S), v = new Float32Array(S * S);
        const bx = W / S, by = H / S;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
          let sa = 0, sv = 0, cnt = 0;
          for (let yy = Math.floor(y * by); yy < Math.floor((y + 1) * by); yy += 3)
            for (let xx = Math.floor(x * bx); xx < Math.floor((x + 1) * bx); xx += 3) {
              const j = ((yy * W + xx) << 2);
              sa += d[j + 3] / 255;
              sv += (0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]) / 255 * (d[j + 3] / 255);
              cnt++;
            }
          a[y * S + x] = cnt ? sa / cnt : 0;
          v[y * S + x] = cnt ? sv / cnt : 0;
        }
        sig.push({ a, v });
      }
      let dead = 0, worst = 100, at = -1;
      for (let i = 1; i < n; i++) {
        let d2 = 0, on = 0;
        for (let q = 0; q < S * S; q++) {
          const cov = Math.max(sig[i - 1].a[q], sig[i].a[q]);
          if (cov < 0.02) continue;
          d2 += Math.abs(sig[i - 1].a[q] - sig[i].a[q]) * 0.5 + Math.abs(sig[i - 1].v[q] - sig[i].v[q]);
          on += cov;
        }
        const pc = on ? (d2 / on) * 100 : 0;
        if (pc < worst) { worst = pc; at = i; }
        if (pc < 2.5) dead++;
      }
      out.push({ name, n, dead, worst: +worst.toFixed(1), at });
    }
    return out;
  });
  const deadTotal = dupes.reduce((a, d) => a + (d.dead || 0), 0);
  check('every strip in the game is a sequence, not a flip-book of one picture',
    deadTotal === 0 && !dupes.some(d => d.err),
    dupes.map(d => d.err ? d.name + ' ' + d.err
      : d.name + ' ' + d.n + 'c' + (d.dead ? ' DEAD:' + d.dead : '') ).join('  '));

  // ---- 2. the transition mechanism ----------------------------------------
  // A synthetic strip, because the point is the WIRING: that the cell drawn is
  // the cell the clock asks for. Six cells that differ only in which sixth of
  // the picture is filled, so the cell index can be read straight back off it.
  const mech = await page.evaluate(() => {
    // This section tests the LEGACY strip-clock route in isolation. A loaded
    // owner atlas legitimately wins before the injected __testStrip. Remove
    // only that atlas for this fixture, then restore every original value.
    // The owner route itself is tested separately below with its real pixels.
    const ownerAtlas = MEDIA_RAW.heroOwnerAtlas;
    const ownerLow = typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW.heroOwnerAtlas;
    delete MEDIA_RAW.heroOwnerAtlas;
    const savedAir=HERO_AIR_STRIP, savedTrans={...HERO_TRANS};
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
    // drawRoboTrans's jump-arc and grounded-transition cases now draw through
    // drawHeroMotionCell (js/mobility_fix.js), not drawStripCell — it blends
    // between two neighbouring cells, so it takes the CONTINUOUS float the
    // clock computes rather than a pre-floored index. Same interception, same
    // question: is the cell drawn the one the clock asked for.
    const realMotion = window.drawHeroMotionCell;
    window.drawHeroMotionCell = (p, c, key, frame, cells, cx, base, h, flip) => {
      if (key === '__testStrip') { asked.push(frame); return true; }
      return realMotion(p, c, key, frame, cells, cx, base, h, flip);
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
    // ...the gait loops and the standing loop are fired now (§2aw), so they
    // are unplugged for this question the way the air strip is above
    const gaitSave = HERO_GAIT, idleSave = HERO_IDLE;
    HERO_GAIT = null; HERO_IDLE = null;
    let fellThrough = true;
    for (const st of ['idle', 'run_a', 'rise', 'apex', 'fall', 'land', 'skid', 'dash'])
      if (player.drawRoboTrans(document.querySelector('canvas').getContext('2d'), st)) fellThrough = false;
    HERO_GAIT = gaitSave; HERO_IDLE = idleSave;

    window.drawStripCell = real;
    window.drawHeroMotionCell = realMotion;
    delete MEDIA_RAW.__testStrip;
    if (ownerAtlas) MEDIA_RAW.heroOwnerAtlas=ownerAtlas;
    if (typeof MEDIA_LOW !== 'undefined') MEDIA_LOW.heroOwnerAtlas=ownerLow;
    HERO_AIR_STRIP=savedAir;
    for (const k of Object.keys(HERO_TRANS)) delete HERO_TRANS[k];
    Object.assign(HERO_TRANS,savedTrans);
    return { air, ground, spent, fellThrough };
  });

  // drawHeroMotionCell blends two neighbouring cells, so the clock now hands
  // it a CONTINUOUS position across the strip rather than a pre-floored
  // index — the six cells span 0..cells-1 (5), not six integer stops. The
  // guarantee under test is unchanged: the position only ever moves the
  // direction the clock moves, start to end of its own range.
  check('the jump arc is indexed by her own vertical speed',
    mech.air[0] === 0 && mech.air[mech.air.length - 1] >= 4.9
      && mech.air.every((v, i, a) => i === 0 || v > a[i - 1]),
    'vy -770..+690 asked for cells ' + mech.air.map(v => v.toFixed(2)).join(','));
  check('a grounded transition is indexed by the clock the physics keeps',
    mech.ground[0] === 0 && mech.ground[mech.ground.length - 1] >= 4.5
      && mech.ground.every((v, i, a) => i === 0 || v >= a[i - 1]),
    'over its timer it asked for cells ' + mech.ground.map(v => v.toFixed(2)).join(','));
  check('a spent clock hands the frame back to the pose cell', mech.spent === false);
  check('and with no strip fired every state falls through to its pose',
    mech.fellThrough);

  // The actual owner-atlas route must satisfy the same physics-clock
  // contract. Assertions examine selected frames AND the actual body pixels.
  const owner = await page.evaluate(() => {
    if (typeof ownerHeroImage !== 'function') return { absent:true };
    const im=ownerHeroImage();
    if (!im) return { error:'Owner artwork module exists but atlas did not decode' };
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    Object.assign(player,{dead:false,on:false,vx:0,vy:0,face:1,faceVis:1,chargeT:0,
      swingVis:null,landT:0,dashT:0,hurtPoseT:0,healT:0,songT:0,idleT:0,cores:5,mood:null,moodT:0});
    const snapshot=(st) => {
      ctx.setTransform(1,0,0,1,128,210);ctx.clearRect(-128,-210,256,256);
      G.ownerHeroArt=null;
      const ok=player.drawRoboTrans(ctx,st),meta=G.ownerHeroArt;
      const pixels=ctx.getImageData(0,0,256,256).data;let opaque=0;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]>180)opaque++;
      return {ok,clip:meta&&meta.clip,frame:meta&&meta.frame,opaque};
    };
    const air=[];
    for(const vy of [-770,-400,-100,0,300,690]) {
      player.vy=vy;air.push(snapshot(vy < -140 ? 'rise' : vy < 140 ? 'apex' : 'fall'));
    }
    const ground=[];player.on=true;player.vy=0;player.land0=.12;
    for(const f of [1,.8,.5,.3,.02]){player.landT=.12*f;ground.push(snapshot('land'));}
    const ended=[];
    for(const [st,timer] of [['land','landT'],['dash','dashT'],['hurt','hurtPoseT']]){
      player.landT=player.dashT=player.hurtPoseT=0;
      for(const t of [0,-.01]){player[timer]=t;ended.push({st,t,...snapshot(st)});}
    }
    const missing=MEDIA_RAW.heroOwnerAtlas;delete MEDIA_RAW.heroOwnerAtlas;
    const saved={air:HERO_AIR_STRIP,gait:HERO_GAIT,idle:HERO_IDLE,trans:{...HERO_TRANS}};
    HERO_AIR_STRIP=null;HERO_GAIT=null;HERO_IDLE=null;
    for(const k of Object.keys(HERO_TRANS))delete HERO_TRANS[k];
    let noArtClaims=false;
    try {noArtClaims=['idle','run_a','rise','apex','fall','land','skid','dash'].every(st=>snapshot(st).ok===false);}
    finally {MEDIA_RAW.heroOwnerAtlas=missing;HERO_AIR_STRIP=saved.air;HERO_GAIT=saved.gait;HERO_IDLE=saved.idle;Object.assign(HERO_TRANS,saved.trans);}
    return {air,ground,ended,noArtClaims};
  });
  if (!owner.absent) {
    check('the owner atlas decodes before it claims an action',!owner.error,owner.error||'ready');
    if (!owner.error) {
      const a=owner.air,g=owner.ground;
      check('owner airborne frames advance with vertical speed and contain a body',
        a.every(x=>x.ok&&x.clip==='jump'&&x.opaque>150)
          && a[0].frame===1 && a[a.length-1].frame===5
          && a.every((x,i)=>i===0||x.frame>=a[i-1].frame)
          && new Set(a.map(x=>x.frame)).size>=4,JSON.stringify(a));
      check('owner landing progresses from compression through recovery on its timer',
        g.every(x=>x.ok&&x.opaque>150)
          && g.map(x=>x.clip+':'+x.frame).join(',')==='fall_land:5,fall_land:5,fall_land:3,fall_land:2,idle:0',JSON.stringify(g));
      check('expired owner actions release their render claim instead of holding a pose',
        owner.ended.every(x=>x.ok===false&&x.opaque===0),JSON.stringify(owner.ended));
      check('neither artwork path claims to draw an unavailable clip',owner.noArtClaims);
    }
  }

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
