// THE ART BIBLE, MEASURED.
//
// ART_BIBLE.md is the document; this is the part of it that cannot be skipped.
// Everything checked here was written as prose first and then broken anyway,
// because prose does not run:
//
//   "a pose is a pose, scaling a drawing is not"  -> NULLFANG's whole leap was
//      one standing drawing at six scales, and the sheet that proved it was
//      only ever looked at because somebody complained.
//   "the wind-up wears the amber"                 -> a guardian shipped whose
//      tell was the same colour as its idle.
//   "feet on the floor"                           -> a crouch translate the
//      limb fold did not pay for put four paws through the ground.
//   "if it is not in assets/source/ it did not happen" -> art was generated,
//      archived, DECLARED in atlas.js, and never wired to anything, and the
//      claim "every character got 3D art" was false for a year.
//
// Each of those is now arithmetic, per guardian, per state, every run.
//
//   node tests/artbible.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// ---------------------------------------------------------------------------
// THE SUBJECTS. Room, and the states each guardian must be able to be in.
//   rest  — the pose everything else is measured AGAINST
//   pairs — [a, b, ceiling]: silhouettes of a and b must overlap no more than
//           `ceiling`. Identical-shape-different-scale scores ~0.97 and fails.
//   tell  — states whose name says "this is coming"; must wear the amber
//   cold  — states that must NOT wear it
//   grnd  — states in which the feet are on the floor
const CAST = [
  {
    kind: 'glitch', name: 'NULLFANG', room: 'A4',
    states: {
      stalk:   { vx: -160, vy: 0, t: 1.2 },
      crouch:  { vx: 0, vy: 0, t: 0.12 },      // the coil, near its flash
      pounce:  { vx: -520, vy: -560, t: 0 },   // launched
      swipe:   { vx: 0, vy: 0, t: 0.15 },
      daze:    { vx: 0, vy: 0, t: 1.6, dazeDur: 1.7 },
    },
    rest: 'stalk',
    pairs: [['stalk', 'crouch', 0.86], ['stalk', 'pounce', 0.80],
            ['crouch', 'pounce', 0.80], ['stalk', 'swipe', 0.90],
            ['stalk', 'daze', 0.88]],
    tell: ['crouch'], cold: ['stalk', 'pounce'],
    grnd: ['stalk', 'crouch', 'swipe', 'daze'],
  },
  {
    // the first mini-boss, plates not a rig; its tells are the five states
    // alphaStep names, and the coil has its own plate since 2026-09-02 (it
    // borrowed the roar's, and two tells that share a drawing are one tell)
    kind: 'alpha', name: 'THE ALPHA', room: 'A10',
    states: {
      rest:     { vx: 0, vy: 0, t: 1 },
      coil:     { vx: 0, vy: 0, t: 0.08, windT: 0.5 },
      clawwarn: { vx: 0, vy: 0, t: 0.05, windT: 0.35 },
      roarwarn: { vx: 0, vy: 0, t: 0.1, windT: 0.7 },
      leap:     { vx: -480, vy: -300, t: 0.6 },
    },
    rest: 'rest',
    pairs: [['rest', 'coil', 0.88], ['coil', 'roarwarn', 0.88], ['rest', 'leap', 0.85]],
    tell: ['coil', 'clawwarn', 'roarwarn'], cold: ['rest', 'leap'],
    grnd: ['rest', 'coil'],
  },
  {
    kind: 'brood', name: 'TALONHOST', room: 'B4',
    states: { idle: { vx: 0, vy: 0, t: 1 }, dive: { vx: -400, vy: 420, t: 0 } },
    rest: 'idle', pairs: [['idle', 'dive', 0.90]],
    tell: [], cold: ['idle'], grnd: [],
  },
  {
    kind: 'atlas', name: 'FURNACE CHOIR', room: 'C3',
    states: { idle: { vx: 60, vy: 0, t: 1 }, lobwarn: { vx: 0, vy: 0, t: 0.2 } },
    rest: 'idle', pairs: [['idle', 'lobwarn', 0.94]],
    tell: ['lobwarn'], cold: ['idle'], grnd: ['idle', 'lobwarn'],
  },
  {
    kind: 'zero', name: 'GLACIERE', room: 'D3',
    // 'charge' is not one of GLACIERE's states, and asking for it drew the
    // default pose twice — IoU 1.000 against itself. Its real wind-ups are
    // lancewarn / shardwarn / dashwarn; the state list is the boss's, not a
    // guess, and a name that does not exist must be caught by the harness
    // rather than quietly scoring a pass.
    states: { idle: { vx: 40, vy: 0, t: 1 }, lancewarn: { vx: 0, vy: 0, t: 0.3 },
              dashwarn: { vx: 0, vy: 0, t: 0.2 } },
    rest: 'idle', pairs: [['idle', 'lancewarn', 0.94], ['idle', 'dashwarn', 0.94]],
    tell: ['lancewarn'], cold: ['idle'], grnd: [],
  },
  // ---- CLASS E: the Eye's constructs ------------------------------------
  // They are procedural geometry and light rather than authored creatures
  // (ART_BIBLE.md §1), but the SILHOUETTE LAW and the HUE LAW are about what
  // the player can read, not about how the pixels were made, so they are held
  // to both. `grnd` only where the construct stands on the floor.
  { kind: 'chime', name: 'CHIME', room: 'A9',
    states: { idle: { vx: 0, vy: 0, t: 1 }, ringwarn: { vx: 0, vy: 0, t: 0.15 } },
    rest: 'idle', pairs: [], tell: ['ringwarn'], cold: ['idle'], grnd: [] },
  { kind: 'carrier', name: 'CARRIER', room: 'B8',
    states: { idle: { vx: 0, vy: 0, t: 1 }, tosswarn: { vx: 0, vy: 0, t: 0.15 } },
    rest: 'idle', pairs: [], tell: ['tosswarn'], cold: ['idle'], grnd: [] },
  { kind: 'moth', name: 'KILN-MOTH', room: 'C7',
    states: { idle: { vx: 0, vy: 0, t: 1 }, cinderwarn: { vx: 0, vy: 0, t: 0.15 } },
    rest: 'idle', pairs: [], tell: ['cinderwarn'], cold: ['idle'], grnd: [] },
  { kind: 'lattice', name: 'LATTICE', room: 'D6',
    states: { idle: { vx: 0, vy: 0, t: 1 }, growwarn: { vx: 0, vy: 0, t: 0.15 } },
    rest: 'idle', pairs: [], tell: ['growwarn'], cold: ['idle'], grnd: ['idle', 'growwarn'] },
  { kind: 'lens', name: 'THE LENS', room: 'E6',
    states: { idle: { vx: 0, vy: 0, t: 1 }, beamwarn: { vx: 0, vy: 0, t: 0.15 } },
    rest: 'idle', pairs: [], tell: ['beamwarn'], cold: ['idle'], grnd: [] },
];

// the game's one reserved "this is coming" amber, from js/entities.js
const TELL_RGB = [0xff, 0xc2, 0x4a];

(async () => {
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };

  console.log('── artbible — the rules in ART_BIBLE.md, measured rather than asserted');

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  // =========================================================================
  // §7 THE ARCHIVE RULE — every rig part has a file, every file has a part.
  // Node side reads the disk; the page reports the rig's own key list, so the
  // two can never drift into agreeing by being written from the same guess.
  // =========================================================================
  const rigs = await page.evaluate(() => {
    const out = {};
    const grab = (dir, g) => { if (typeof window[g] === 'object' && window[g]) out[dir] = Object.keys(window[g]); };
    grab('beast', 'BEAST_P'); grab('eagle', 'EAGLE_P');
    grab('furnace', 'DRG_P'); grab('glaciere', 'GLC_P');
    return out;
  });
  for (const dir in rigs) {
    const root = path.join(__dirname, '..', 'assets', 'source', dir);
    const onDisk = fs.existsSync(root)
      ? fs.readdirSync(root).filter(f => /\.jpe?g$/i.test(f)).map(f => f.replace(/\.jpe?g$/i, ''))
      : [];
    const keys = rigs[dir];
    // authored FIGURES (aIdle/aRoar/…) are whole-body plates, not rig rects —
    // they are archived but never appear as a key, and that is correct
    const extra = onDisk.filter(f => !keys.includes(f) && !/^a[A-Z]/.test(f));
    const missing = keys.filter(k => !onDisk.includes(k));
    check('archive ' + dir + ': every rig part is on disk (' + keys.length + ' keys)',
      !missing.length, missing.length ? 'missing ' + missing.join(',') : '');
    check('archive ' + dir + ': no orphan files',
      !extra.length, extra.length ? 'orphan ' + extra.join(',') : '');
  }

  // =========================================================================
  // §2 / §4 DECLARED ART MUST BE DRAWN. A turnaround row that nothing selects
  // is the exact shape of the failure that made this file necessary.
  // =========================================================================
  const dead = await page.evaluate(() => {
    const subs = Object.keys((typeof ATLAS !== 'undefined' && ATLAS.sub) || {})
      .concat(Object.keys((typeof ATLAS2 !== 'undefined' && ATLAS2.sub) || {}));
    // drawAtlas is only ever reached with an entity's `kind`, so a subject is
    // live iff some spawnable kind carries that name
    const kinds = new Set(Object.keys(typeof BSTAT !== 'undefined' ? BSTAT : {})
      .concat(['crawler', 'hopper', 'blob', 'flier', 'turret', 'guard', 'husk']));
    // NPCs are selected by their `extra` name rather than by a kind, so read
    // the actual world: every ['npc', x, y, 'servo'] placed in any room is a
    // live subject. Doing this from ROOMS rather than from a hand-kept list is
    // the point — a list would have to be remembered, and this cannot be.
    for (const id in (typeof ROOMS !== 'undefined' ? ROOMS : {})) {
      for (const e of (ROOMS[id].ents || [])) {
        if (e[0] === 'npc' && typeof e[3] === 'string') kinds.add(e[3]);
      }
    }
    return subs.filter(s => !kinds.has(s));
  });
  // `hzd` is the ONE knowing exception and ART_BIBLE.md §2 says why: she is
  // drawn procedurally because her arms are IK-solved and her scarf is
  // simulated, and the generated row was never wired. It is listed here so the
  // exception is a decision on the record and not an oversight nobody noticed.
  const ALLOWED_DEAD = ['hzd'];
  const surprise = dead.filter(s => !ALLOWED_DEAD.includes(s));
  check('no atlas subject is declared and never drawn',
    !surprise.length, surprise.length ? surprise.join(',') : 'known: ' + ALLOWED_DEAD.join(','));

  // =========================================================================
  // Silhouettes. Each guardian is drawn offscreen, in each state, at a fixed
  // position, and reduced to a boolean coverage mask.
  // =========================================================================
  for (const S of CAST) {
    const shot = await page.evaluate(async ({ S, TELL_RGB }) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
      startGame(sv); loadRoom(S.room);
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));
      const b = G.boss;
      if (!b || b.kind !== S.kind) return { err: 'no ' + S.kind + ' in ' + S.room };
      // ART ON DEMAND MEANS THE ART IS NOT HERE YET. Sheets are lazy-loaded, and
      // until the guardian's own atlas lands, draw() paints drawBossHold — a
      // dark ellipse that is IDENTICAL in every state. Shooting before the wait
      // scored every silhouette pair at IoU 1.000 and blamed the rig.
      // and a state the boss does not have must not pass by rendering its
      // default: every name in the list has to appear in the boss's own code.
      // Two ways a state name can be real. Most are string literals in the
      // update switch. The Eye's constructs BUILD theirs — `K.far + 'warn'` —
      // so the literal never appears in the source and a source scan called
      // every one of them a typo. Check those against the kit that names them,
      // which is the game's own data rather than a second list here.
      // ...and the Alpha's live in alphaStep (js/wolves.js), not in the switch
      const src = (Boss.prototype.update || function () {}).toString()
        + (typeof alphaStep === 'function' ? alphaStep.toString() : '');
      const kit = (typeof MINI_KIT !== 'undefined' && MINI_KIT[S.kind]) || null;
      const built = kit ? [kit.close, kit.far, kit.close + 'warn', kit.far + 'warn'] : [];
      const bogus = Object.keys(S.states).filter(st =>
        !src.includes("'" + st + "'") && built.indexOf(st) < 0);
      if (bogus.length) return { err: 'not a real state: ' + bogus.join(',') };
      // the Eye's constructs load two authored plates of their own, lazily like
      // everything else — shooting before they land measured an empty mask
      const MA = (typeof MINI_ART !== 'undefined' && MINI_ART[S.kind]) || null;
      if (MA) {
        mediaFetch(MA.rest); mediaFetch(MA.warn);
        const t1 = Date.now();
        while (Date.now() - t1 < 20000 && !(mediaHas(MA.rest) && mediaHas(MA.warn)))
          await new Promise(r => setTimeout(r, 50));
        if (!mediaHas(MA.rest) || !mediaHas(MA.warn)) return { err: 'eye plates never loaded' };
      }
      // the Alpha is nine plates, fetched lazily like the Eye's
      if (S.kind === 'alpha' && typeof ALPHA_ART !== 'undefined') {
        const imgs = Object.values(ALPHA_ART).map(a => a.img);
        imgs.forEach(k => mediaFetch(k, true));
        const t2 = Date.now();
        while (Date.now() - t2 < 30000 && !imgs.every(k => mediaHas(k)))
          await new Promise(r => setTimeout(r, 50));
        if (!imgs.every(k => mediaHas(k))) return { err: 'alpha plates never loaded' };
      }
      const sheet = BOSS_ART[S.kind];
      if (sheet) {
        mediaFetch(sheet);
        const t0 = Date.now();
        while (!mediaHas(sheet) && Date.now() - t0 < 20000)
          await new Promise(r => setTimeout(r, 50));
        if (!mediaHas(sheet)) return { err: sheet + ' never loaded' };
        await new Promise(r => requestAnimationFrame(r));
      }

      const W = 620, H = 560, GY = 470;          // GY: the ground line in-cell
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true });
      const out = {};
      for (const st in S.states) {
        const set = S.states[st];
        b.st = st; b.dead = false; b.hurtT = 0; b.stagT = 0; b.purified = false;
        b.anim = 1.7; b.face = -1; b.faceVis = -1; b.phase = 1;
        for (const k in set) b[k] = set[k];
        // park it so its FEET land on GY and its centre on W/2 — the states
        // must be compared in the same frame or every pair "differs"
        b.x = W / 2 - b.w / 2; b.y = GY - b.h;
        c.clearRect(0, 0, W, H);
        c.save();
        try { b.draw(c); } catch (e) { /* reported via the mask being empty */ }
        c.restore();
        const d = c.getImageData(0, 0, W, H).data;
        // ...and a second pass with ground-anchored DECORATION off, which is
        // what the feet-on-the-floor check reads. A telegraph paints a hot ring
        // on the floor beneath the animal on purpose; measuring that as the
        // lowest lit pixel reported every wind-up as 17 px through the ground.
        G.artProbe = 1;
        c.clearRect(0, 0, W, H);
        c.save();
        try { b.draw(c); } catch (e) {}
        c.restore();
        const dp = c.getImageData(0, 0, W, H).data;
        G.artProbe = 0;
        // coverage mask, plus the two measurements the bible needs from it
        const mask = new Uint8Array(W * H);
        let n = 0, amber = 0, lit = 0, lowest = -1, lowestLit = -1;
        // VALUE BANDS inside the silhouette. A guardian assembled from a
        // sheet of drawn parts cannot be one flat tone; a keyed-out plate
        // can, and a flat blob with two lit eyes and a lava ring passes
        // every other rule in this file. Eight buckets over the opaque
        // pixels is the cheapest question that tells them apart.
        const bands = new Int32Array(8);
        for (let i = 0, p = 0; i < d.length; i += 4, p++) {
          const a = d[i + 3];
          if (a < 40) continue;
          mask[p] = 1; n++;
          const y = (p / W) | 0; if (y > lowest) lowest = y;
          const r = d[i], g = d[i + 1], bl = d[i + 2];
          bands[Math.min(7, ((r * 2 + g * 5 + bl) / 8) >> 5)]++;
          if (r + g + bl < 150) continue;              // ignore near-black plate
          lit++;
          // ...and the ground-contact measurement uses the LIT pixels only.
          // Every guardian paints a soft contact shadow below its own feet
          // (#04070b at 0.34), which is opaque enough to pass an alpha test —
          // so measuring the lowest opaque pixel reported all four paws 15 px
          // through the floor, in every state, identically. That constant
          // offset was the tell that the harness was measuring the shadow.
          if (y > lowestLit) lowestLit = y;
          // "is this pixel the reserved amber": warm, clearly not grey, and
          // within reach of #ffc24a. Distance in RGB is crude but the colour is
          // far enough from everything else in the palette for it to hold.
          const dr = r - TELL_RGB[0], dg = g - TELL_RGB[1], db = bl - TELL_RGB[2];
          if (r > 150 && r > bl + 55 && g > bl + 20 && g < r - 10
              && dr * dr + dg * dg + db * db < 150 * 150) amber++;
        }
        lowestLit = -1;
        for (let i = 0, p = 0; i < dp.length; i += 4, p++) {
          if (dp[i + 3] < 40) continue;
          if (dp[i] + dp[i + 1] + dp[i + 2] < 150) continue;   // the contact shadow
          const y = (p / W) | 0; if (y > lowestLit) lowestLit = y;
        }
        out[st] = { mask: Array.from(mask), n, amber, lit, lowest, lowestLit, GY,
                    bands: Array.from(bands) };
      }
      return { out, W, H, GY };
    }, { S, TELL_RGB });

    if (shot.err) { check(S.name + ': present in ' + S.room, false, shot.err); continue; }
    const M = shot.out;
    console.log('  ── ' + S.name);

    // ---- §3.3 THE SILHOUETTE LAW -----------------------------------------
    for (const [a, b2, ceil] of S.pairs) {
      const A = M[a], B = M[b2];
      if (!A || !B || !A.n || !B.n) { check(S.name + ' ' + a + '/' + b2 + ': both states draw', false, 'empty mask'); continue; }
      let inter = 0, uni = 0;
      for (let i = 0; i < A.mask.length; i++) {
        const x = A.mask[i], y = B.mask[i];
        if (x || y) uni++;
        if (x && y) inter++;
      }
      const iou = uni ? inter / uni : 1;
      check(S.name + ': ' + a + ' vs ' + b2 + ' is a different SHAPE (IoU <= ' + ceil + ')',
        iou <= ceil, 'IoU ' + iou.toFixed(3));
    }

    // ---- §3.5 THE HUE LAW -------------------------------------------------
    // The rule is a DELTA, not an absolute, and FURNACE CHOIR is why. She is a
    // fire dragon: her identity colour already sits inside the reserved amber,
    // so an absolute threshold declares her permanently telegraphing and can
    // never see her actual wind-up. What has to be true for every guardian is
    // that the tell raises the warning colour CLEARLY ABOVE that guardian's own
    // rest state — the player reads the change, not the hue.
    const restPct = (() => { const m = M[S.rest]; return m && m.lit ? m.amber / m.lit : 0; })();
    for (const st of S.tell) {
      const m = M[st];
      const pct = m && m.lit ? m.amber / m.lit : 0;
      check(S.name + ': ' + st + ' raises the amber above its own rest',
        pct >= restPct + 0.08 && pct > 0.05,
        (pct * 100).toFixed(1) + '% vs rest ' + (restPct * 100).toFixed(1) + '%');
    }
    for (const st of S.cold) {
      const m = M[st];
      const pct = m && m.lit ? m.amber / m.lit : 0;
      // a non-telegraph may carry its own warm identity, but it must not reach
      // the level a telegraph does — nothing cold may pass for a wind-up
      check(S.name + ': ' + st + ' does not pass for a wind-up',
        pct < restPct + 0.08, (pct * 100).toFixed(1) + '% of lit pixels');
    }

    // ---- §1 THE PARTS ARE STILL THERE -------------------------------------
    // Written after a restyle returned THE FURNACE CHOIR as a featureless dark
    // egg with two lit dots and every check in this file stayed green: shapes
    // differed (the ring animates), the tell wore its amber (the eyes), the
    // feet were down. Nothing asked whether the animal still had the parts it
    // is assembled from. This does, and it does it without a reference image:
    // spread the opaque pixels over eight value bands and require at least
    // three of them to carry real area. Sixteen drawn pieces under one key
    // light cannot land in one bucket; a keyed-out plate can only land in one.
    {
      const m = M[S.rest];
      if (m && m.n && m.bands) {
        const live = m.bands.filter(b3 => b3 >= m.n * 0.04).length;
        check(S.name + ': ' + S.rest + ' still reads as PARTS, not one flat tone (>= 3 value bands)',
          live >= 3, live + ' of 8 bands carry area');
      }
    }

    // ---- §3.4 GROUND TRUTH ------------------------------------------------
    for (const st of S.grnd) {
      const m = M[st];
      if (!m || !m.n) { check(S.name + ': ' + st + ' draws', false, 'empty'); continue; }
      const off = m.lowestLit - m.GY;
      check(S.name + ': ' + st + ' has its feet on the floor (±10 px)',
        Math.abs(off) <= 10, (off >= 0 ? '+' : '') + off + ' px');
    }
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the bible was followed, and this is how you know without looking');
})().catch(e => { console.error(e); process.exit(1); });
