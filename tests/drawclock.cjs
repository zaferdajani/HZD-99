// DRAW MUST NOT READ A CLOCK THE HARNESS CANNOT FREEZE.
//
// tests/meadow.cjs isolates the grass by drawing the SAME simulation state
// twice and subtracting: whatever differs between two identical draws is not
// grass. That only works if a draw is a pure function of the state and the
// clock the harness froze. It was not. The autosave toast stored its deadline
// as Date.now() + 1700 and drawSaveFeedback compared it against Date.now() —
// neither of which meadow freezes, because nothing in the game loop is
// supposed to be on the wall clock. So when the two draws straddled the 1.7s
// expiry, frame one had the toast and frame two did not, and meadow failed on
// 2629 differing pixels in the bottom-right corner, which reads exactly like a
// rendering regression in a part of the screen that has no grass in it. It
// failed about two runs in four and cost a bisect that cleared every commit it
// looked at, because the flake was older than all of them.
//
// This reproduces that on purpose rather than waiting for the race to land:
// freeze performance.now the way meadow does, plant the toast, burn two real
// seconds WITHOUT advancing the frozen clock, and draw again. Under a frozen
// clock the two frames must be identical, whatever the wall clock did.
//
//   node tests/drawclock.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── drawclock — a frozen clock freezes the frame\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    G.dialog = null; G.tut = null; G.gateWalk = null;
    for (let i = 0; i < 120; i++) await new Promise(k => requestAnimationFrame(k));

    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const grab = () => new Uint8ClampedArray(ctx.getImageData(0, 0, cv.width, cv.height).data);
    const realNow = performance.now, realRand = Math.random;
    const tNow = realNow.call(performance);
    performance.now = () => tNow; Math.random = () => 0.5;

    // the toast is planted UNDER the frozen clock, so a deadline measured on
    // that clock can never arrive; a deadline measured on any other clock will
    const out = {};
    try {
      persist();
      out.planted = G.saveFeedback ? G.saveFeedback.until : null;
      out.frozen = tNow;
      const w0 = cv.width, h0 = cv.height;
      draw(tNow);
      const A = grab();
      // real time passes — more than any deadline the toast sets — while the
      // frozen clock does not move. A busy wait, not a sleep: an await would
      // let the game loop run and change the state we are holding still.
      const spin = realNow.call(performance);
      while (realNow.call(performance) - spin < 2100) { /* burn wall clock */ }
      draw(tNow);
      const B = grab();
      if (cv.width !== w0 || cv.height !== h0 || A.length !== B.length) { out.resized = 1; return out; }
      let n = 0, box = [1e9, 1e9, -1, -1];
      for (let i = 0; i < A.length / 4; i++) {
        const d = Math.abs(A[i*4] - B[i*4]) + Math.abs(A[i*4+1] - B[i*4+1]) + Math.abs(A[i*4+2] - B[i*4+2]);
        if (d < 24) continue;
        n++;
        const x = i % cv.width, y = (i / cv.width) | 0;
        if (x < box[0]) box[0] = x; if (y < box[1]) box[1] = y;
        if (x > box[2]) box[2] = x; if (y > box[3]) box[3] = y;
      }
      out.diff = n; out.box = n ? box : null;
    } finally {
      performance.now = realNow; Math.random = realRand;
    }
    return out;
  });

  check('the save toast dates itself on the frozen clock',
    r.planted != null && r.frozen != null && Math.abs(r.planted - r.frozen - 1700) < 50,
    'planted=' + (r.planted == null ? '-' : Math.round(r.planted)) +
    ' frozen=' + (r.frozen == null ? '-' : Math.round(r.frozen)));
  check('two seconds of wall clock change nothing in a frozen frame',
    !r.resized && r.diff === 0,
    r.resized ? 'backbuffer resized mid-measure' : r.diff + 'px' + (r.box ? ' at ' + JSON.stringify(r.box) : ''));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
