// THE PICTURE ANSWERS, AND NOTHING ELSE CHANGED.
//
// js/mobile-platform.js stopped being inert: the right half of the game frame
// is now tap-to-hop, swipe-to-strike, swipe-down-to-dash, hold-to-charge, and
// it writes the same VJUMP / VATK / VDASH codes a button writes. Two things
// therefore have to be true at once, and only a running browser can say so —
// the gestures fire where they should, and they are silent everywhere the old
// controller already owns: the gutters, the stick's half, any button at its
// CURRENT laid-out position, every state that is not play, and the row in the
// pause menu that switches them off.
//
// The scope check is the one that matters most. The recognizer owns one finger
// at a time, so if it were listening to the whole overlay the thumb on the
// stick would be the owner and a tap would arrive as a pan — every tap made
// while moving, which is nearly all of them.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const p = await browser.newPage({ viewport: { width: 900, height: 450 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof startGame === 'function' && typeof tGestureSetup === 'function');

    const r = await p.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const s = newSave(1); s.time = 99; s.flags.tut = 1; s.flags.woke = 1;
      startGame(s); loadRoom('A1');
      G.wake = G.cut = G.dialog = G.trans = null; G.state = 'PLAY';

      // This machine has no touchscreen, so the controller never installed
      // itself. Install it exactly as a phone would.
      TOUCH.enabled = true;
      tcSetup();
      tcResize();
      const el = document.getElementById('tc');
      el.setPointerCapture = () => {};            // no active pointer for a synthetic event
      el.releasePointerCapture = () => {};

      const L = tLayout();
      const inZone = { x: (Math.max(L.W * 0.46, L.r.left) + L.r.right) / 2, y: (L.r.top + L.r.bottom) / 2 };
      const stickHalf = { x: L.r.left + 10, y: L.r.bottom - 20 };
      const btn = L.btns.find(b => b.show() && b.code === 'VJUMP');
      const out = { zone: inZone, stickHalf, btnAt: btn ? { x: btn.x, y: btn.y } : null };
      out.zoneIsInside = inZone.x > L.r.left && inZone.x < L.r.right;

      const ev = (type, pt, id) => el.dispatchEvent(new PointerEvent(type, {
        pointerId: id, clientX: pt.x + TOUCH.ox, clientY: pt.y + TOUCH.oy,
        bubbles: true, cancelable: true, pointerType: 'touch',
      }));
      const clear = () => { for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0; tGestureRelease(); };
      const tap = (pt, id) => { clear(); ev('pointerdown', pt, id); ev('pointerup', pt, id); return { j: keys.VJUMP | 0, a: keys.VATK | 0 }; };

      // 1. a tap on the picture is a hop; the gutters and the stick's half are not
      out.tapInZone = tap(inZone, 1);
      out.tapStickHalf = tap(stickHalf, 2);
      out.tapLeftGutter = tap({ x: 8, y: L.H / 2 }, 3);
      out.tapRightGutter = tap({ x: L.W - 8, y: L.H / 2 }, 4);
      // ...and never on a control, wherever the layout editor has put it
      out.tapOnButton = btn ? tap({ x: btn.x, y: btn.y }, 5) : null;

      // 2. THE SCOPE. A thumb already down in the stick's half must not make the
      //    recognizer the stick's owner, or this tap arrives as a pan.
      clear();
      ev('pointerdown', stickHalf, 6);              // the moving thumb
      ev('pointerdown', inZone, 7); ev('pointerup', inZone, 7);
      out.tapWhileMoving = keys.VJUMP | 0;
      ev('pointerup', stickHalf, 6);

      // 3. swipes
      clear();
      ev('pointerdown', inZone, 8);
      ev('pointermove', { x: inZone.x + 60, y: inZone.y }, 8);
      out.swipeSide = keys.VATK | 0;
      ev('pointerup', { x: inZone.x + 60, y: inZone.y }, 8);
      clear();
      ev('pointerdown', inZone, 9);
      ev('pointermove', { x: inZone.x, y: inZone.y + 60 }, 9);
      out.swipeDown = keys.VDASH | 0;
      ev('pointerup', { x: inZone.x, y: inZone.y + 60 }, 9);

      // 4. the hold is the charge, and it LETS GO
      clear();
      ev('pointerdown', inZone, 10);
      tGestureUpdate(performance.now() + 600);
      out.chargeHeld = keys.VATK | 0;
      ev('pointerup', inZone, 10);
      out.chargeReleased = keys.VATK | 0;

      // 5. not while the game is not being played
      clear(); G.state = 'PAUSE';
      out.tapWhilePaused = tap(inZone, 11);
      G.state = 'PLAY';
      // ...nor with the pause row switched off
      G.save.gestOff = 1;
      out.tapWhenOff = tap(inZone, 12);
      G.save.gestOff = 0;
      out.tapBackOn = tap(inZone, 13);

      // 6. the pause menu really carries that row, and it toggles
      const rows = pauseItems().map(i => i.id);
      out.hasRow = rows.includes('gest');
      out.rowsHaveOneGeometry = pauseLayout().items.length === rows.length;

      // 7. LIFECYCLE. One owner, and it suspends the audio nobody suspended.
      out.lifeInstalled = !!LIFE;
      let suspended = 0, resumed = 0;
      const realAC = AC;
      AC = { state: 'running', suspend() { suspended++; this.state = 'suspended'; return Promise.resolve(); },
             resume() { resumed++; this.state = 'running'; return Promise.resolve(); } };
      const wasUnlocked = AUD_UNLOCKED; AUD_UNLOCKED = true;
      keys.KeyZ = 1;
      window.dispatchEvent(new Event('blur'));
      out.pausedInput = inputSuspended;
      out.releasedHeldKey = keys.KeyZ | 0;
      out.audioSuspended = suspended;
      window.dispatchEvent(new Event('focus'));
      out.resumedInput = inputSuspended;
      out.audioResumed = resumed;
      AC = realAC; AUD_UNLOCKED = wasUnlocked;

      clear();
      return out;
    });

    assert.equal(r.zoneIsInside, true, 'the probe point must be inside the picture');
    assert.equal(r.tapInZone.j, 1, 'a tap on the picture is a hop');
    assert.equal(r.tapStickHalf.j, 0, "the stick's half is the stick's");
    assert.equal(r.tapLeftGutter.j, 0, 'the left gutter is not the picture');
    assert.equal(r.tapRightGutter.j, 0, 'nor the right');
    if (r.tapOnButton) assert.equal(r.tapOnButton.j, 0, 'a control owns its own circle');
    assert.equal(r.tapWhileMoving, 1, 'a tap must still land while the other thumb is on the stick');
    assert.equal(r.swipeSide, 1, 'a sideways swipe strikes');
    assert.equal(r.swipeDown, 1, 'a downward swipe dashes');
    assert.equal(r.chargeHeld, 1, 'a hold charges');
    assert.equal(r.chargeReleased, 0, '...and letting go releases it');
    assert.equal(r.tapWhilePaused.j, 0, 'the picture is deaf outside play');
    assert.equal(r.tapWhenOff.j, 0, 'the pause row really switches it off');
    assert.equal(r.tapBackOn.j, 1, '...and back on');
    assert.equal(r.hasRow, true, 'the pause menu carries the row');
    assert.equal(r.rowsHaveOneGeometry, true, 'one geometry, drawn and tapped');
    assert.equal(r.lifeInstalled, true, 'the lifecycle owner is installed at boot');
    assert.equal(r.pausedInput, true, 'going away suspends input');
    assert.equal(r.releasedHeldKey, 0, '...through the game\'s own releaseInput');
    assert.equal(r.audioSuspended, 1, '...and suspends the audio context, which nothing used to do');
    assert.equal(r.resumedInput, false, 'coming back gives the controls straight back');
    assert.equal(r.audioResumed, 1, '...and the context with them');
    assert.deepEqual(errs, [], 'no page errors');

    console.log('PASS gesture-input: the picture hops, strikes, dashes and charges; the gutters, the '
      + "stick's half, every control and every other state stay exactly as they were; a tap lands while "
      + 'the other thumb is moving; and one lifecycle owner suspends the audio nobody was suspending', r.tapInZone);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
