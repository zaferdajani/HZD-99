// THE TOUCH LAYER THAT IS NOT WIRED IN YET IS STILL MEASURED.
//
// js/mobile-platform.js ships inert: nothing in the game calls it, js/touch.js
// is still the on-screen controller. Inert code with no harness is code that is
// broken by the time somebody needs it, and this one is generated — the next
// `derive.sh` silently replaces every line of it. So the contract is checked in
// the BUILT PAGE, through the same global the game would use, in both worlds.
//
// Three of the checks below are regressions for defects that were in the drop
// as supplied and were found by running it rather than reading it. Each one is
// a latch or a dropped input — the exact failure the file advertises it
// prevents — so each stays measured. docs/MOBILE_PLATFORM.md has the full story.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const PAGES = ['index.html', 'odyssey.html'];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const seen = {};
    for (const page of PAGES) {
      const p = await browser.newPage({ viewport: { width: 800, height: 400 } });
      const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.goto('http://127.0.0.1:8220/' + page);
      await p.waitForFunction(() => typeof MobilePlatform !== 'undefined');

      const r = await p.evaluate(() => {
        window.requestAnimationFrame = () => 0;
        const { TouchGestures, PlatformerBindings, Lifecycle } = MobilePlatform;
        const out = { exports: [TouchGestures, PlatformerBindings, Lifecycle].map(f => typeof f) };

        // Its own canvas: the game's belongs to the game, and the point is to
        // drive the recognizer, not the on-screen controller sitting over it.
        const el = document.createElement('canvas');
        el.width = 800; el.height = 400;
        document.body.appendChild(el);
        // A synthetic PointerEvent has no active pointer, so the real
        // setPointerCapture throws NotFoundError every time. That is not a
        // harness problem to paper over — it is check 4 below. Default to a
        // quiet stub and let that check put the throw back.
        let capture = () => {};
        el.setPointerCapture = (id) => capture(id);
        el.releasePointerCapture = () => {};

        const log = [];
        const bindings = new PlatformerBindings({ viewportWidth: 800 });
        const gestures = new TouchGestures(el, {
          onGesture: g => { log.push(g.type); bindings.handle(g); },
          toGameSpace: (cx, cy) => ({ x: cx, y: cy }),
        });
        const ev = (type, x, y, id) => el.dispatchEvent(new PointerEvent(type, {
          pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch',
        }));

        // 1. A HELD FINGER IS RELEASED. The drop emitted nothing when a
        //    long-press ended, so chargeHeld latched on forever.
        log.length = 0;
        ev('pointerdown', 600, 200, 11);
        gestures.update(performance.now() + 700);
        out.chargeWhileHeld = bindings.input.chargeHeld;
        ev('pointerup', 600, 200, 11);
        out.holdEvents = log.slice();
        out.chargeAfterRelease = bindings.input.chargeHeld;

        // ...and backgrounding mid-hold releases it too, through reset().
        bindings.releaseAll(); log.length = 0;
        ev('pointerdown', 600, 200, 12);
        gestures.update(performance.now() + 700);
        gestures.reset();
        out.resetEvents = log.slice();
        out.chargeAfterReset = bindings.input.chargeHeld;

        // 2. A CANCELLED TOUCH IS NEVER A TAP (the drop's own rule 3).
        bindings.releaseAll(); log.length = 0;
        ev('pointerdown', 600, 200, 13);
        ev('pointercancel', 600, 200, 13);
        out.cancelEvents = log.slice();
        out.jumpAfterCancel = bindings.input.jumpPressed;

        // ...while an uncancelled one in the right zone is a jump.
        bindings.releaseAll(); log.length = 0;
        ev('pointerdown', 600, 200, 14);
        ev('pointerup', 600, 200, 14);
        out.tapEvents = log.slice();
        out.jumpAfterTap = bindings.input.jumpPressed;

        // 3. THE FLOATING STICK anchors where the thumb landed and lets go.
        bindings.releaseAll();
        ev('pointerdown', 100, 300, 15);
        ev('pointermove', 148, 300, 15);
        out.stickAtRadius = bindings.input.moveX;
        ev('pointerup', 148, 300, 15);
        out.stickAfterRelease = bindings.input.moveX;

        // 4. A THROWING setPointerCapture DOES NOT EAT THE TOUCH. Unguarded,
        //    it threw above the phase assignment and the finger vanished.
        bindings.releaseAll(); log.length = 0;
        capture = () => { throw new DOMException('no active pointer', 'NotFoundError'); };
        ev('pointerdown', 600, 200, 16);
        ev('pointerup', 600, 200, 16);
        capture = () => {};
        out.throwEvents = log.slice();
        out.jumpThroughThrow = bindings.input.jumpPressed;

        gestures.destroy();
        el.remove();

        // 5. LIFECYCLE IS SYMMETRIC. A page born unfocused used to resume
        //    without ever pausing: audio never suspended, onResume alone.
        const realHasFocus = document.hasFocus.bind(document);
        let pauses = 0, resumes = 0;
        document.hasFocus = () => false;
        const born = new Lifecycle({ onPause: () => pauses++, onResume: () => resumes++ });
        out.bornPaused = born.isPaused;
        out.pausesAtBirth = pauses;
        document.hasFocus = realHasFocus;
        window.dispatchEvent(new Event('focus'));
        out.bornPair = [pauses, resumes];
        born.destroy();

        // ...and an ordinary round trip pauses once, resumes once, and clamps
        //    the first frame back so a backgrounded tab cannot tunnel physics.
        let p2 = 0, r2 = 0;
        const lc = new Lifecycle({ onPause: () => p2++, onResume: () => r2++, maxResumeDt: 1 / 30 });
        window.dispatchEvent(new Event('blur'));
        out.whilePaused = lc.frame(9);
        window.dispatchEvent(new Event('focus'));
        out.firstBack = lc.frame(9);
        out.secondBack = lc.frame(0.016);
        out.roundTrip = [p2, r2];
        lc.destroy();
        return out;
      });

      assert.deepEqual(r.exports, ['function', 'function', 'function'],
                       page + ': the built page must carry all three classes');

      assert.equal(r.chargeWhileHeld, true, page + ': a long press must arm the charge');
      assert.deepEqual(r.holdEvents, ['longPress', 'longPressEnd'],
                       page + ': lifting a held finger must announce the release');
      assert.equal(r.chargeAfterRelease, false, page + ': the charge must not latch past the finger');
      assert(r.resetEvents.includes('longPressEnd'),
             page + ': backgrounding mid-hold must release it, not only cancel');
      assert.equal(r.chargeAfterReset, false, page + ': ...and the binding must hear that');

      assert.deepEqual(r.cancelEvents, [], page + ': a cancelled touch emits nothing');
      assert.equal(r.jumpAfterCancel, false, page + ': a cancelled touch is never a jump');
      assert.deepEqual(r.tapEvents, ['tap'], page + ': an ordinary touch is a tap');
      assert.equal(r.jumpAfterTap, true, page + ': ...and in the right zone, a jump');

      assert.equal(r.stickAtRadius, 1, page + ': 48 px of travel saturates the stick');
      assert.equal(r.stickAfterRelease, 0, page + ': and releasing it centres the stick');

      assert.deepEqual(r.throwEvents, ['tap'],
                       page + ': a throwing setPointerCapture must not eat the touch');
      assert.equal(r.jumpThroughThrow, true, page + ': ...the action still lands');

      assert.equal(r.bornPaused, true, page + ': a page born unfocused is paused');
      assert.equal(r.pausesAtBirth, 1, page + ': ...and says so, so audio is actually suspended');
      assert.deepEqual(r.bornPair, [1, 1], page + ': no resume without its pause');
      assert.deepEqual(r.roundTrip, [1, 1], page + ': one pause, one resume per round trip');
      assert.equal(r.whilePaused.run, false, page + ': a paused frame does not run');
      assert.equal(r.firstBack.dt, 1 / 30, page + ': the first frame back is clamped');
      assert.equal(r.secondBack.dt, 0.016, page + ': and only the first');

      assert.deepEqual(errs, [], page + ': no page errors');
      seen[page] = r.holdEvents.join('+');
      await p.close();
    }
    console.log('PASS mobile-platform: both built pages carry the recognizer; held fingers release, '
      + 'cancels are never taps, the stick centres, a throwing capture does not eat the touch, '
      + 'and the lifecycle pauses and resumes in pairs', seen);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
