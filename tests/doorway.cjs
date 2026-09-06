// THE PAINTED DOOR IS WHERE SHE WALKS IN.
//
// The owner: "running into the store door should makes the character run into
// the door itself, not into the wall. The store has a door, has walls, and I
// should be running inside the door... instead of just fading into the walls
// of this store."
//
// He was reading a real number. Every plate-drawn depth door was blitted
// CENTRED on its stand spot, which silently asserts the painted way in sits at
// the plate's middle. The booth's sits at 0.62 — so the stall was drawn 37 px
// right of where the game aimed her, and 37 px is very nearly her whole body
// width (36). She was standing squarely in front of the cloth panel BESIDE the
// door, and the walk-away played her dissolving into it.
//
// A5 already carries the hand-typed version of this fix — `gx: 0.68`, "aiming
// the walk at the old 0.64 sent her into rock a shoulder's width left of the
// hole". plateDoorFrac derives it instead, so a re-fired plate brings its own
// door with it rather than going quietly stale.
//
// THIS HARNESS GUARDS THE INSTRUMENT, because the instrument is the part that
// was subtly wrong and would go wrong again in silence. The first version of
// it locked onto the booth's LANTERN — the most intensely warm pixel on the
// plate, and not a way in — and reported 0.83, shoving the stall 104 px the
// other way. A test that only checked "the door moved" would have passed that.
const { chromium } = require('playwright');

const PLATES = ['boothFront', 'oracleBooth', 'forgeFront', 'carrelFront', 'hollowFront'];
const fails = [];
const check = (name, ok, note) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : ''));
  if (!ok) fails.push(name + (note ? ' — ' + note : ''));
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  // ---- 1. THE INSTRUMENT, on pictures whose answer is known ---------------
  const synth = await p.evaluate(async () => {
    // a stall: dark body, a WIDE warm opening at 0.30, and a small ferociously
    // bright lantern at 0.80 — the exact shape that fooled the first version
    const mk = (doorFrac, doorW, lantern) => {
      const W = 400, H = 300;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d');
      x.fillStyle = '#20242c'; x.fillRect(0, 0, W, H);
      const dx = Math.round(W * doorFrac), dw = Math.round(W * doorW);
      x.fillStyle = 'rgb(240,170,80)';                 // the lit way in
      x.fillRect(dx - dw / 2, Math.round(H * 0.45), dw, Math.round(H * 0.55));
      if (lantern) { x.fillStyle = 'rgb(255,240,190)'; x.fillRect(Math.round(W * 0.80), Math.round(H * 0.60), 6, 10); }
      const im = new Image(); im.src = cv.toDataURL();
      return im.decode().then(() => im);
    };
    const out = {};
    const a = await mk(0.30, 0.16, true);
    PLATE_DOOR.__t1 = null; delete PLATE_DOOR.__t1;
    out.doorWithLantern = plateDoorFrac(a, '__t1');
    const c2 = await mk(0.66, 0.14, false);
    delete PLATE_DOOR.__t2;
    out.doorPlain = plateDoorFrac(c2, '__t2');
    // ...and a plate with NO lit opening keeps the old behaviour exactly
    const W = 400, H = 300;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const xx = cv.getContext('2d'); xx.fillStyle = '#20242c'; xx.fillRect(0, 0, W, H);
    const flat = new Image(); flat.src = cv.toDataURL(); await flat.decode();
    delete PLATE_DOOR.__t3;
    out.noDoor = plateDoorFrac(flat, '__t3');
    return out;
  });
  check('a wide lit opening is found, and a bright lantern does not win it',
        Math.abs(synth.doorWithLantern - 0.30) <= 0.04,
        'found ' + synth.doorWithLantern.toFixed(3) + ' for a door painted at 0.300, lantern at 0.80');
  check('...and it is not just reporting the middle',
        Math.abs(synth.doorPlain - 0.66) <= 0.04,
        'found ' + synth.doorPlain.toFixed(3) + ' for a door painted at 0.660');
  check('a plate with no lit way in falls back to centred, exactly as before',
        synth.noDoor === 0.5, 'frac ' + synth.noDoor);

  // ---- 2. THE REAL PLATES ------------------------------------------------
  const real = await p.evaluate(async (PLATES) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    const out = {};
    for (const k of PLATES) {
      if (typeof mediaFetch === 'function') mediaFetch(k, 1);
    }
    // the plates are lazy; give the network real time rather than guessing
    for (let s = 0; s < 60; s++) {
      if (PLATES.every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth)) break;
      await new Promise(r => setTimeout(r, 100));
    }
    for (const k of PLATES) {
      const im = MEDIA_IMG[k];
      if (!(im && im.naturalWidth)) { out[k] = null; continue; }   // not fired yet: not a failure
      delete PLATE_DOOR[k];
      out[k] = plateDoorFrac(im, k);
    }
    return out;
  }, PLATES);
  const fired = Object.entries(real).filter(([, v]) => v != null);
  console.log('    derived door position per fired plate: ' +
    (fired.length ? fired.map(([k, v]) => k + ' ' + v.toFixed(3)).join('  ') : '(none fired yet)'));
  // A door has to be ON the structure. Anything outside this band is the
  // measure having found an edge highlight rather than a way in, which is the
  // failure mode that shipped.
  // A plate whose door cannot be read keeps 0.5 — the behaviour every plate had
  // before this existed, so declining costs nothing. What must NOT happen is a
  // plate acting on a reading it should have declined: the Sage's carrel scores
  // 0.93 off a rim highlight, and shifting on that would move it 135 px to fix
  // a door that was never there.
  const wild = fired.filter(([, v]) => v !== 0.5 && (v < 0.15 || v > 0.85));
  check('no plate acts on a reading it should have declined',
        !wild.length, wild.length ? wild.map(([k, v]) => k + ' ' + v.toFixed(3)).join(' ') : fired.length + ' plate(s) read');
  const declined = fired.filter(([, v]) => v === 0.5).map(([k]) => k);
  if (declined.length) console.log('    declined (drawn centred, as before): ' + declined.join(' '));
  // ...and the one the owner reported must actually be READ, or this whole
  // harness is green over a fix that silently stopped happening.
  check('the booth — the shop he reported — is read, and is not centred',
        real.boothFront != null && real.boothFront !== 0.5,
        'boothFront ' + (real.boothFront == null ? 'not fired' : real.boothFront.toFixed(3)));

  // ---- 3. AND THE STALL IS DRAWN SO THAT DOOR LANDS ON THE STAND SPOT -----
  const placed = await p.evaluate(async () => {
    loadRoom('A0');
    const d = gateDoors('A0')[0], dx = gateWorldX(d);
    player.x = dx - player.w / 2; player.vx = 0;
    for (let s = 0; s < 60; s++) {
      if (MEDIA_IMG.boothFront && MEDIA_IMG.boothFront.naturalWidth) break;
      for (let i = 0; i < 6; i++) update(1 / 60);
      await new Promise(r => setTimeout(r, 100));
    }
    const bim = MEDIA_IMG.boothFront;
    if (!(bim && bim.naturalWidth)) return null;
    const frac = plateDoorFrac(bim, 'boothFront');
    const dh = 236, dw = dh * (bim.naturalWidth / bim.naturalHeight);
    // the draw, reproduced: where does the painted opening actually land?
    const dcx = dx - dw * (frac - 0.5);
    const doorOnScreen = (dcx - dw / 2) + dw * frac;
    return { standSpot: dx, paintedDoorAt: doorOnScreen, plateW: dw, hadNoFix: dx + dw * (frac - 0.5), herW: player.w };
  });
  if (placed) {
    const off = Math.abs(placed.paintedDoorAt - placed.standSpot);
    const was = Math.abs(placed.hadNoFix - placed.standSpot);
    check('the painted door lands on the stand spot', off <= 1,
          off.toFixed(1) + ' px off (centred, it was ' + was.toFixed(1) +
          ' px — against a body ' + placed.herW + ' px wide)');
    check('...and that correction was worth making', was >= placed.herW * 0.5,
          'the door was ' + was.toFixed(0) + ' px from where she stood');
  } else {
    check('the booth plate loaded so its placement could be measured', false, 'boothFront never arrived');
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await b.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she walks in through the door, not through the wall beside it');
})();
