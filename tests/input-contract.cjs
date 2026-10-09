// THE GAME CAN BE PLAYED WITHOUT A DEVICE.
//
// Player.update used to read TOUCH.axis to find out how hard a thumb was
// pushing and the raw GP_L / GP_R codes to decide whether a pad was walking.
// The movement resolver therefore knew which device was live — so a fourth
// device could not be added without editing physics, and nothing that was not a
// real finger could drive the game at all.
//
// PI is the contract that replaces both reads, and setInputSource is the seam.
// This harness checks the two halves that matter: the devices still produce
// exactly what they produced before, and the game is drivable by a struct with
// no keyboard, no pad and no touch anywhere in the sentence.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const p = await browser.newPage({ viewport: { width: 900, height: 500 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof startGame === 'function' && typeof setInputSource === 'function');

    const r = await p.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const out = {};
      const stage = () => {
        const s = newSave(1); s.time = 99; s.flags.tut = 1; s.flags.woke = 1;
        startGame(s); loadRoom('A1');
        G.wake = G.cut = G.dialog = G.trans = null; G.state = 'PLAY';
        G.enemies = []; G.projs = [];
        const col = groundColumnAt(player.x + player.w / 2);
        player.y = Math.min(...col) - player.h; player.vx = player.vy = 0; player.on = true;
        setInputSource(null);
        return s;
      };
      const settle = (n) => { for (let i = 0; i < n; i++) update(1 / 60); return Math.abs(player.vx); };

      // ---- 1. THE DEVICES STILL SAY WHAT THEY SAID.
      stage();
      keys.ArrowRight = 1; pollInput();
      out.keyboard = { moveX: PI.moveX, run: PI.run, down: PI.down.RIGHT };
      keys.ArrowRight = 0;

      // the stick's push is a speed, and it is the magnitude the contract carries
      TOUCH.axis = 0.5; keys.VR = 1; pollInput();
      out.stick = { moveX: +PI.moveX.toFixed(3), run: PI.run };
      TOUCH.axis = 0; keys.VR = 0;

      // the pad walks until the stick is clicked, and gives the run up at centre
      keys.GP_R = 1; pollInput();
      out.padWalk = PI.run;
      keysP.GP_RUN = 1; pollInput();
      out.padAfterClick = PI.run;
      keysP.GP_RUN = 0; pollInput();
      out.padHoldsRun = PI.run;
      keys.GP_R = 0; pollInput();
      // PI.run is "give me full speed" and is vacuously true when nothing is
      // asking to move; the latch is the thing that has to let go.
      out.padCentred = PAD.run;
      keys.GP_R = 1; pollInput();
      out.padWalksAgain = PI.run;
      keys.GP_R = 0; pollInput();

      // ---- 2. AND THE PUSH REACHES THE PHYSICS. Same room, same frames, two
      //         magnitudes: the only difference is the number in the struct.
      const walkFor = (mx) => {
        stage();
        setInputSource(() => ({ moveX: mx, run: true, down: { RIGHT: 1 }, pressed: {} }));
        const v = settle(120);
        const x = player.x;
        setInputSource(null);
        return { v: Math.round(v), x: Math.round(x) };
      };
      out.full = walkFor(1);
      out.half = walkFor(0.4);

      // ---- 3. NO DEVICE IN THE SENTENCE. A struct alone plays the game.
      stage();
      let frame = 0;
      setInputSource(() => ({
        moveX: 1, run: true,
        down: { RIGHT: 1, JUMP: frame > 30 && frame < 40 },
        pressed: { JUMP: frame === 31 },
      }));
      const startX = player.x;
      let leftGround = false;
      for (frame = 0; frame < 90; frame++) { update(1 / 60); if (!player.on) leftGround = true; }
      out.struct = { moved: Math.round(player.x - startX), jumped: leftGround };
      // ...and inD / inP answer from the struct while it is installed
      frame = 35;
      pollInput();
      out.readsThrough = { right: inD('RIGHT'), left: inD('LEFT'), jump: inD('JUMP') };
      // every key on the board is down and the game does not care
      for (const c of ['ArrowLeft', 'KeyZ', 'KeyX']) keys[c] = 1;
      pollInput();
      out.devicesIgnored = { left: inD('LEFT'), atk: inD('ATK') };
      setInputSource(null);
      for (const c of ['ArrowLeft', 'KeyZ', 'KeyX']) keys[c] = 0;

      // ---- 4. HANDING BACK. The devices work again, and nothing is stuck.
      pollInput();
      out.afterHandback = { anyDown: Object.values(PI.down).some(Boolean), moveX: PI.moveX };
      stage();
      keys.ArrowRight = 1;
      out.deviceWalks = Math.round(settle(120));
      keys.ArrowRight = 0; setInputSource(null);
      return out;
    });

    assert.deepEqual(r.keyboard, { moveX: 1, run: true, down: true }, 'a key is a full push and always wants full speed');
    assert.equal(r.stick.moveX, 0.5, "the stick's push is the magnitude the contract carries");
    assert.equal(r.stick.run, true, 'a thumb expresses speed through magnitude, so it always wants its full');
    assert.equal(r.padWalk, false, 'a pad walks until the stick is clicked');
    assert.equal(r.padAfterClick, true, '...the click arms the run');
    assert.equal(r.padHoldsRun, true, '...and it holds while the stick is pushed');
    assert.equal(r.padCentred, false, '...and the latch is given up when the stick centres');
    assert.equal(r.padWalksAgain, false, '...so the next push starts at a walk');

    assert(r.full.v > r.half.v + 40, 'the magnitude must reach the physics: ' + r.full.v + ' vs ' + r.half.v);
    assert(r.half.v > 0, 'and a light push is still a push');
    assert(r.full.x > r.half.x, '...so a full push covers more ground');

    assert(r.struct.moved > 200, 'a struct alone walks her across the room (' + r.struct.moved + ' px)');
    assert.equal(r.struct.jumped, true, '...and jumps');
    assert.deepEqual(r.readsThrough, { right: true, left: false, jump: true }, 'inD answers from the struct');
    assert.deepEqual(r.devicesIgnored, { left: false, atk: false }, 'a held keyboard cannot reach past an installed source');
    assert.equal(r.afterHandback.anyDown, false, 'handing back releases everything');
    assert(r.deviceWalks > 0, 'and the devices drive the game again afterwards');
    assert.deepEqual(errs, [], 'no page errors');

    console.log('PASS input-contract: keyboard, stick and pad still say exactly what they said; the '
      + 'magnitude reaches the physics (' + r.full.v + ' px/s at full push, ' + r.half.v + ' at 0.4); and a '
      + 'struct with no device behind it walks and jumps her ' + r.struct.moved + ' px', r);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
