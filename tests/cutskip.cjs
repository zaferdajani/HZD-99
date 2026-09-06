// THE STORY IS THE ONE THING A PLAYER CANNOT GET BACK BY TRYING AGAIN.
//
// Two defects the owner hit, both invisible to every other harness here because
// both live in the handful of frames between a film being asked for and a film
// being on screen.
//
//   A TAP USED TO SPEND IT. skip was `inP('OK') || inP('JUMP') || ...` — one
//   press, one skipped film. On a phone the screen IS the button, and the film
//   asks to be touched so its sound can start, so the story was one stray
//   thumb away from gone. It is a HOLD now, and this measures that a press
//   costs nothing and only sustained contact pays.
//
//   AND IT USED TO START IN THE MIDDLE. Asking for currentTime = 0 and calling
//   play() on the same frame is a race, and priming — which is itself a play()
//   — leaves the opening clip already running when the cut begins. The rewind
//   is a state now: the film holds in the dark until the clip is really at the
//   start. This measures that a cut parked near its end does NOT go to 'play'
//   until it has rewound.
//
//   node tests/cutskip.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cutskip — a story costs a deliberate hold, and it starts at the start\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(z => setTimeout(z, 900));
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.toasts = [];

    // a cut, with a video element that reports itself ready and rewindable.
    // The real decoder is not the subject here — the state machine around it is,
    // and headless Chromium will not decode the shipped h264 anyway.
    const fake = (at) => ({
      readyState: 4, _primed: true, currentTime: at, duration: 8, ended: false, error: null,
      play() { this._played = true; return { catch() {} }; },
      pause() { this._paused = true; },
    });
    // REGISTERED, not just handed over: the hold phase asks purifyReady(kind),
    // which looks the clip up in purifyPre rather than reading ct.v. A fake
    // that is only on the cut is a fake the state machine never sees as ready,
    // and the film waits out its four-second patience instead.
    const mk = (at) => {
      const v = fake(at);
      purifyPre['memory'] = v;
      G.cut = { kind: 'memory', v, snap: null, t: 0, ph: 'hold',
                hint: 0, failed: false, held: 0 };
      G.state = 'CUT';
      return G.cut;
    };

    const out = {};

    // ---- 1. a clip parked near its end must not play until it has rewound ---
    let ct = mk(7.5);
    updateCut(1 / 60);
    out.parkedPhase = ct.ph;
    out.parkedPlayed = !!ct.v._played;
    out.askedRewind = ct.v.currentTime;
    // now let the seek "land" and step again
    ct.v.currentTime = 0;
    updateCut(1 / 60);
    out.afterSeekPhase = ct.ph;
    out.afterSeekPlayed = !!ct.v._played;

    // ---- 2. a clip already at zero plays immediately ------------------------
    ct = mk(0);
    updateCut(1 / 60);
    out.freshPhase = ct.ph;
    out.freshPlayed = !!ct.v._played;

    // ---- 3. one press does not skip; a sustained hold does -----------------
    ct = mk(0);
    updateCut(1 / 60);                       // -> play
    const press = () => { keysP['Enter'] = 1; keys['Enter'] = 1; };
    const hold = () => { keys['Enter'] = 1; };
    const release = () => { keys['Enter'] = 0; keysP['Enter'] = 0; };

    press(); updateCut(1 / 60); release();
    out.afterTapPhase = ct.ph;
    out.afterTapSkipped = !!ct.skipped;

    // hold for a second of frames
    let held = 0;
    for (let i = 0; i < 90 && ct.ph !== 'out'; i++) { hold(); updateCut(1 / 60); held += 1 / 60; }
    release();
    out.afterHoldPhase = ct.ph;
    out.afterHoldSkipped = !!ct.skipped;
    out.heldFor = +held.toFixed(2);

    // ---- 4. letting go resets the meter -------------------------------------
    ct = mk(0);
    updateCut(1 / 60);
    for (let i = 0; i < 20; i++) { hold(); updateCut(1 / 60); }   // ~0.33 s
    release(); updateCut(1 / 60);
    out.releasedMeter = ct.skipHold || 0;
    out.releasedPhase = ct.ph;

    // ---- 5. THE PHONE. A film is skipped by holding, so a touch has to hold.
    // Every other tap-state screen means "yes" on contact and routes through
    // tPress, which auto-releases via TOUCH.tapRel — down for a frame or two.
    // If the cut used that, hold-to-skip would work on a keyboard and be
    // unreachable on the platform the accidental skipping was reported on.
    ct = mk(0);
    updateCut(1 / 60);
    TOUCH.held = {}; TOUCH.tapRel = null;
    keys.VOK = 0; keysP.VOK = 0;
    tStart({ preventDefault() {}, changedTouches: [{ identifier: 77, clientX: 480, clientY: 270 }] });
    out.touchHeldCode = TOUCH.held[77] || null;
    out.touchAutoReleases = !!(TOUCH.tapRel && TOUCH.tapRel.length);
    // it must survive frames without the finger moving
    let survived = true;
    for (let i = 0; i < 70 && ct.ph !== 'out'; i++) { updateCut(1 / 60); if (!keys.VOK) survived = false; }
    out.touchStayedDown = survived;
    out.touchSkipped = !!ct.skipped;
    tEnd({ preventDefault() {}, changedTouches: [{ identifier: 77 }] });
    out.touchReleased = !keys.VOK;

    G.cut = null; G.state = 'PLAY';
    return out;
  });

  check('a clip parked near its end holds in the dark instead of playing',
        r.parkedPhase === 'hold' && !r.parkedPlayed, 'phase ' + r.parkedPhase + ', played ' + r.parkedPlayed);
  check('...and it asks for the rewind while it waits', r.askedRewind === 0,
        'currentTime ' + r.askedRewind);
  check('...and plays only once the seek has landed',
        r.afterSeekPhase === 'play' && r.afterSeekPlayed, 'phase ' + r.afterSeekPhase);
  check('a clip already at the start plays at once',
        r.freshPhase === 'play' && r.freshPlayed, 'phase ' + r.freshPhase);
  check('ONE PRESS DOES NOT SPEND THE STORY',
        r.afterTapPhase === 'play' && !r.afterTapSkipped,
        'phase ' + r.afterTapPhase + ', skipped ' + r.afterTapSkipped);
  check('...but a sustained hold does', r.afterHoldPhase === 'out' && r.afterHoldSkipped,
        'skipped after ' + r.heldFor + ' s');
  check('...and letting go puts the meter back', r.releasedMeter === 0 && r.releasedPhase === 'play',
        'meter ' + r.releasedMeter);
  check('a touch during a film HOLDS instead of auto-releasing',
        r.touchHeldCode === 'VOK' && !r.touchAutoReleases,
        'held ' + r.touchHeldCode + ', queued for auto-release ' + r.touchAutoReleases);
  check('...so the phone can reach the skip at all',
        r.touchStayedDown && r.touchSkipped, 'stayed down ' + r.touchStayedDown + ', skipped ' + r.touchSkipped);
  check('...and lifting the finger lets go', r.touchReleased);
  check('no page errors', errs.length === 0, errs[0] || '');

  console.log('');
  if (fails.length) {
    console.log('FAILED:');
    for (const f of fails) console.log('  ' + f);
    process.exit(1);
  }
  console.log('OK — a tap is not a skip, and the film starts where it should');
  await browser.close();
})();
