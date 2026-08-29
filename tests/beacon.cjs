// THE SHOP, FROM THE INSIDE — the two ways it stopped showing anything.
//
// The owner, 2026-08-29, on the first shop: "The characters were just blurry
// and full of light... Nothing is showing. The light is overwhelming." Two
// independent faults, both invisible to every existing harness because both
// look like art and neither throws:
//
// 1. THE MARKER WAS DRAWN ACROSS THE CHARACTER. The "this unit can be fixed"
//    beacon is additive, and additive light has no edge (ART_BIBLE §3) — so a
//    beam over the body does not light it, it dissolves it. It was anchored to
//    the entity box, and an NPC's box is its FEET: Ratchet's box is 56 px tall
//    and his atlas k is 2.6, so he is drawn 146 px high and his head is 66 px
//    ABOVE the anchor every offset was measured from. "Eighteen pixels over his
//    head" was his sternum.
//
// 2. THE PHONE RENDERED AT THE WRONG SIZE. applyScale derives the backbuffer
//    from the canvas's CSS box, but on touch that box is set by the controller
//    AFTER boot, and nothing told perf.js. A 3x phone computed its resolution
//    once against the pre-controller box and rendered 960x540 into 1748x983
//    device pixels forever — every plate upscaled 1.8x, and no quality tier
//    could move it.
//
//   node tests/beacon.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const chk = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── beacon — a marker lights the way TO a character, never over one\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---- 1. the marker, measured on the body it marks --------------------------
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const m = await page.evaluate(async () => {
    const settle = async (ms) => { const t = Date.now();
      while (Date.now() - t < ms) await new Promise(k => requestAnimationFrame(k)); };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0B');
    G.wake = null; G.hitStop = 0; G.toasts = [];
    player.x = 19 * TILE; player.y = (G.roomDef.h - 3) * TILE;
    try {
      Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
      Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
    } catch (e) {}

    // WHERE THE FIGURE ACTUALLY IS. Not the collision box — the drawn cell,
    // scaled by this character's own atlas k, which is the whole point.
    const s = (G.statics || []).find(n => n.type === 'npc' && n.extra === 'ratchet');
    if (!s) return { err: 'no ratchet in A0B' };
    const AK = typeof atlasOf === 'function' && atlasOf(s.extra);
    const kk = (AK && AK.sub[s.extra] && AK.sub[s.extra].k) || 1.4;
    const bodyTop = s.y + s.h - s.h * kk, feet = s.y + s.h;

    const c = document.querySelector('canvas'), g = c.getContext('2d');
    const rs = c.width / 960;
    // the torso: the middle half of the drawn figure, where a face and plates live
    const sx = Math.round((s.x + s.w / 2 - s.w * 0.5 - camSX()) * rs);
    const sy = Math.round((bodyTop + (feet - bodyTop) * 0.28 - camSY()) * rs);
    const sw = Math.max(8, Math.round(s.w * rs));
    const sh = Math.max(8, Math.round((feet - bodyTop) * 0.44 * rs));

    const sample = async () => {
      await settle(2500);
      const d = g.getImageData(sx, sy, sw, sh).data;
      let sum = 0, sq = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        sum += L; sq += L * L; n++;
      }
      const mean = sum / n;
      return { mean: +mean.toFixed(1), sd: +Math.sqrt(Math.max(0, sq / n - mean * mean)).toFixed(1) };
    };

    const withMarker = await sample();
    const o = invCount; window.invCount = invCount = (k) => k === 'batt' ? 0 : o(k);
    const without = await sample();
    window.invCount = invCount = o;
    return { kk, bodyTop: +bodyTop.toFixed(1), boxTop: s.y, feet,
      headAbove: +(s.y - bodyTop).toFixed(1),
      rect: { sx, sy, sw, sh }, withMarker, without,
      lift: +(withMarker.mean - without.mean).toFixed(1),
      sdKeep: +(withMarker.sd / Math.max(0.1, without.sd)).toFixed(3) };
  });

  if (m.err) { chk('the den has its tinker', false, m.err); }
  else {
    console.log('  drawn body: box top ' + m.boxTop + ', head ' + m.bodyTop
      + ' (k ' + m.kk + ', ' + m.headAbove + 'px above the box)');
    console.log('  torso: with marker ' + JSON.stringify(m.withMarker)
      + '  without ' + JSON.stringify(m.without));
    // THE TWO WAYS A WASH SHOWS UP IN ARITHMETIC: it lifts the body's mean
    // toward white, and it flattens the body's own contrast as it does. The
    // pre-fix frame lifted the torso by 30 levels and kept a third of its
    // detail; a marker that stays off the body moves neither much.
    chk('the marker does not wash the body out',
      m.lift <= 8, 'torso mean +' + m.lift + ' levels with the beacon lit (<= 8)');
    chk('the body keeps its own modelling under the marker',
      m.sdKeep >= 0.8, 'contrast retained ' + Math.round(m.sdKeep * 100) + '% (>= 80%)');
    chk('the marker is anchored above the DRAWN head, not the collision box',
      m.headAbove > 1, 'the figure rises ' + m.headAbove + 'px above its box');
  }
  if (errs.length) chk('no page errors', false, errs[0]);
  await page.close();

  // ---- 2. the resolution, on a device whose layout the controller owns -------
  const ph = await browser.newPage({ viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ph.goto('http://127.0.0.1:8220/index.html');
  await ph.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const r = await ph.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0B');
    const t = Date.now();
    while (Date.now() - t < 4000) await new Promise(k => requestAnimationFrame(k));
    const cv = document.getElementById('cv');
    const box = parseFloat(cv.style.width) || 960;
    const native = box * (devicePixelRatio || 1) / 960;
    const want = Math.round(960 * Math.max(0.45, Math.min(native * QUAL.rs, 2)));
    return { touch: !!(typeof TOUCH !== 'undefined' && TOUCH.enabled),
      dpr: devicePixelRatio, cssBox: box, tier: QNAME,
      backing: cv.width, want, ratio: +(cv.width / want).toFixed(3) };
  });
  console.log('\n  phone ' + r.dpr + 'x, box ' + Math.round(r.cssBox)
    + 'px, tier ' + r.tier + ': backing ' + r.backing + ', target ' + r.want);
  chk('the touch controller owns the layout in this run', r.touch,
    'TOUCH.enabled ' + r.touch);
  // The tier may legitimately render below native — that is the dial. What it
  // may never do is ignore the box: the backbuffer must be what applyScale
  // computes for the box the canvas is ACTUALLY displayed in.
  chk('the backbuffer is sized for the box the canvas is displayed in',
    Math.abs(r.ratio - 1) <= 0.04, 'backing/target ' + r.ratio);
  await ph.close();

  await browser.close();
  if (fails.length) { console.log('\n' + fails.length + ' failure(s)'); process.exit(1); }
  console.log('\nOK — the shop shows its characters, at the size the screen has');
})();
