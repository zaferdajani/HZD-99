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
    // `recover` and `daze` joined with the punish-window pass (2026-10-08):
    // the recovery must not wear the amber (an opening that looks like a
    // wind-up teaches the player to back off from it), and the hit-group break
    // is the one time she is on the ground — so it is a different SHAPE from
    // her flight and its hooves are on the floor.
    states: { idle: { vx: 40, vy: 0, t: 1 }, lancewarn: { vx: 0, vy: 0, t: 0.3 },
              dashwarn: { vx: 0, vy: 0, t: 0.2 }, recover: { vx: 0, vy: 0, t: 0.5 },
              daze: { vx: 0, vy: 0, t: 1.2, dazeDur: 1.8 } },
    rest: 'idle', pairs: [['idle', 'lancewarn', 0.94], ['idle', 'dashwarn', 0.94], ['idle', 'daze', 0.90]],
    tell: ['lancewarn'], cold: ['idle', 'recover', 'daze'], grnd: ['daze'],
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

// ---------------------------------------------------------------------------
// THE ENEMY CAST — every machine that attacks, in each state of its attack.
// The guardians above were held to the silhouette law for months while the
// roster they share rooms with was not held to anything: a wolf's punish
// window was the standing plate, the flier's wind-up was its flap, the
// sage's exhale was the sage waiting. Plan §1 fix 5 gives every attacking
// enemy a wind-up pose and a recovery pose, and this is where that is true
// or false.
//   set     — fields written onto a freshly built Enemy for that state
//   pairs   — [a, b, ceiling], as above; the BODY's silhouette (G.artProbe on,
//             so the shared amber ring is not counted as shape)
//   tell    — must raise the amber over rest (the ring, the wash, the plate)
//   cold    — must not pass for a wind-up
//   grnd    — feet on the floor (±10 px)
// The four kingdom machines carry AUTHORED plates per state (ART_QUEUE §2i,
// §2l, §2n, §2p); their spent plates are the art's own shapes and sit close to
// rest, so their rest/recovery ceiling is the authored-plate one the furnace
// and GLACIERE are held to (0.95) — the re-fire that would tighten it is
// briefed in ART_QUEUE §2cc. The blob's hazard is danger RED by registry, not
// amber, so it answers to the silhouette law only.
const W_ST = {
  rest:     { vx: 0 },
  windup:   { coilT: 0.15 },
  active:   { lungeT: 0.12, vxK: -4 },
  recovery: { windedT: 0.4 },
};
const ENEMY_CAST = [
  { kind: 'crawler', name: 'WOLF', room: 'A1', st: W_ST,
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86], ['active', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'crawler', name: 'CHEETAH', room: 'C2', st: W_ST,
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86], ['active', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'hopper', name: 'HOPPER-WOLF', room: 'A2',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.15 }, active: { on: false, airT: 0.2, vy: -420, vxK: 1.1 }, recovery: { landT: 0.2 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'hopper', name: 'HOPPER-CHEETAH', room: 'C2',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.15 }, active: { on: false, airT: 0.2, vy: -420, vxK: 1.1 }, recovery: { landT: 0.2 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'guard', name: 'GUARD', room: 'A1', st: W_ST,
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'flier', name: 'FLIER', room: 'A2',
    st: { rest: { vx: 0 }, windup: { holdT: 0.15 }, active: { diveT: 0.4, vy: 430 }, recovery: { riseT: 0.5, vy: -180 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'blob', name: 'BLOB', room: 'C2',
    st: { rest: { vx: 0 }, windup: { drip0: 0.9, dripT: 0.03 }, recovery: { blobReb: 0.2 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86]],
    tell: [], cold: [], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'turret', name: 'TURRET', room: 'B1',
    st: { rest: { vx: 0 }, windup: { lockT: 0.2, lock0: 0.55 }, recovery: { kickT: 0.2 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'windup', 'recovery'] },
  { kind: 'bat', name: 'BAT', room: 'A1',
    st: { rest: { hang: 1 }, windup: { hang: 1, holdT: 0.15 }, active: { hang: 0, diveT: 0.4, vy: 300 }, recovery: { hang: 0, riseT: 0.5, vy: -230 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'surge', name: 'BREAKER', room: 'B2',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.3 }, recovery: { windedT: 0.5 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.95], ['windup', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'kiln', name: 'KILN VENT', room: 'C2',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.3 }, recovery: { windedT: 0.5 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.95], ['windup', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'rime', name: 'RIME COIL', room: 'D1',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.3 }, recovery: { windedT: 0.5 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.95], ['windup', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'snare', name: 'NEST SNARE', room: 'E1',
    st: { rest: { vx: 0 }, windup: { crouchT: 0.3 }, recovery: { windedT: 0.5 } },
    pairs: [['rest', 'windup', 0.86], ['rest', 'recovery', 0.95], ['windup', 'recovery', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: [] },
  { kind: 'sage', name: 'SAGE', room: 'A1',
    st: { rest: { vx: 0 }, windup: { coilT: 0.3 }, active: { lungeT: 0.15 }, recovery: { windedT: 0.5 } },
    pairs: [['rest', 'windup', 0.90], ['rest', 'recovery', 0.86], ['windup', 'recovery', 0.86], ['rest', 'active', 0.86]],
    tell: ['windup'], cold: ['rest', 'recovery'], grnd: ['rest', 'recovery'] },
];

(async () => {
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };

  console.log('── artbible — the rules in ART_BIBLE.md, measured rather than asserted');

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
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
      // ...and a production repair layer (js/boss_aaa_fix.js) wraps
      // Boss.prototype.update, which replaces what .toString() shows here —
      // it stashes the pre-wrap function so those states stay checkable too.
      const src = (Boss.prototype.update || function () {}).toString()
        + (typeof alphaStep === 'function' ? alphaStep.toString() : '')
        + (Boss.prototype.__aaaOriginalUpdate ? Boss.prototype.__aaaOriginalUpdate.toString() : '');
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

  // =========================================================================
  // THE ENEMY CAST. Same three laws, held to the machines in the rooms.
  // =========================================================================
  for (const S of ENEMY_CAST) {
    const shot = await page.evaluate(async ({ S, TELL_RGB }) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom(S.room); G.boss = null; G.enemies = [];
      // a pack that has been tamed draws a cyan eye on the wolf — this is the
      // hostile animal, measured as she first meets it
      if (G.save.flags) G.save.flags.alpha = 0;
      const W = 320, H = 260, GY = 200;
      const build = (st) => {
        const e = new Enemy(S.kind, 0, 0);
        e.traits = []; e.tr = []; e.anim = 1.7; e.faceVis = -1; e.dir = -1; e.on = true; e.hang = 0;
        e.x = W / 2 - e.w / 2; e.y = GY - e.h;
        // the guard's plate is up whenever it is not committed or winded —
        // what its own update would say, written here because nothing runs it
        e.guard = S.kind === 'guard' && !(S.st[st].lungeT || S.st[st].windedT);
        // she stands on the same floor, 120 px in front of it, for every
        // machine — so a beam or a tendril aimed at her lands in the frame
        player.x = W / 2 - 120 - player.w / 2; player.y = GY - player.h; player.dead = false;
        const set = S.st[st];
        for (const k in set) if (k !== 'vxK') e[k] = set[k];
        if (set.vxK) e.vx = e.dir * e.spd * Math.abs(set.vxK);   // moving the way it faces
        return e;
      };
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d', { willReadFrequently: true });
      const paint = (e, probe) => {
        G.artProbe = probe ? 1 : 0;
        c.clearRect(0, 0, W, H); c.save();
        try { e.draw(c); } catch (er) { /* an empty mask reports it */ }
        c.restore(); G.artProbe = 0;
        return c.getImageData(0, 0, W, H).data;
      };
      // ART ON DEMAND: every state is drawn once to start its own fetches,
      // then nothing is measured until every one of them has fully landed
      for (const st in S.st) paint(build(st), false);
      const pend = () => Object.keys(MEDIA_PEND).filter(k => MEDIA_LOW[k] !== 3);
      const t0 = Date.now();
      while (Date.now() - t0 < 25000 && pend().length) await new Promise(r => setTimeout(r, 60));
      for (const st in S.st) paint(build(st), false);
      while (Date.now() - t0 < 30000 && pend().length) await new Promise(r => setTimeout(r, 60));
      const out = {};
      for (const st in S.st) {
        const e = build(st);
        const d = paint(e, false), dp = paint(e, true);
        const mask = new Uint8Array(W * H);
        let n = 0, amber = 0, lit = 0, lowestLit = -1;
        for (let i = 0, q = 0; i < dp.length; i += 4, q++) {
          if (dp[i + 3] < 40) continue;
          mask[q] = 1; n++;
          if (dp[i] + dp[i + 1] + dp[i + 2] < 150) continue;   // the contact shadow
          const y = (q / W) | 0; if (y > lowestLit) lowestLit = y;
        }
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 40) continue;
          const r = d[i], g = d[i + 1], bl = d[i + 2];
          if (r + g + bl < 150) continue;
          lit++;
          const dr = r - TELL_RGB[0], dg = g - TELL_RGB[1], db = bl - TELL_RGB[2];
          if (r > 150 && r > bl + 55 && g > bl + 20 && g < r - 10
              && dr * dr + dg * dg + db * db < 150 * 150) amber++;
        }
        out[st] = { mask: Array.from(mask), n, amber, lit, lowestLit, GY };
      }
      return { out, pending: pend() };
    }, { S, TELL_RGB });
    const M = shot.out;
    console.log('  ── ' + S.name + ' (' + S.kind + '@' + S.room + ')' + (shot.pending.length ? '  still loading: ' + shot.pending.join(',') : ''));
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
    const restPct = M.rest && M.rest.lit ? M.rest.amber / M.rest.lit : 0;
    for (const st of S.tell) {
      const m = M[st]; const pct = m && m.lit ? m.amber / m.lit : 0;
      check(S.name + ': ' + st + ' raises the amber above its own rest', pct >= restPct + 0.08 && pct > 0.05,
        (pct * 100).toFixed(1) + '% vs rest ' + (restPct * 100).toFixed(1) + '%');
    }
    for (const st of S.cold) {
      const m = M[st]; const pct = m && m.lit ? m.amber / m.lit : 0;
      check(S.name + ': ' + st + ' does not pass for a wind-up', pct < restPct + 0.08,
        (pct * 100).toFixed(1) + '% of lit pixels');
    }
    for (const st of S.grnd) {
      const m = M[st];
      if (!m || !m.n) { check(S.name + ': ' + st + ' draws', false, 'empty'); continue; }
      const off = m.lowestLit - m.GY;
      check(S.name + ': ' + st + ' has its feet on the floor (±10 px)', Math.abs(off) <= 10, (off >= 0 ? '+' : '') + off + ' px');
    }
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the bible was followed, and this is how you know without looking');
})().catch(e => { console.error(e); process.exit(1); });
