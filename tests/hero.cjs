// HZD-99'S OWN BODY, MEASURED — and one rule with a tripwire under it.
//
// She is the one character in this game drawn procedurally rather than from
// authored plates (ART_BIBLE.md §2): her arms are IK-solved, her scarf is a
// spring chain, her double jump is a real rotation. That freedom is why her
// construction has drifted, and drifted in the same direction twice.
//
// THE RULE: HER ARM IS ONE PIECE. No pucks, no hinges, no rings, nothing on
// the limb that reads as a bead on a string. The owner has ruled this out more
// than once and it kept coming back, because it lived only in prose — and
// prose was argued with. The last round did not even reverse it, it SOFTENED
// it: three beads became two and the code comment congratulated itself.
//
// A rule half-applied is a rule ignored with extra steps. So it is arithmetic
// now: `armJoint` still exists, is never called, and counts every call it ever
// receives. If anything stamps hardware onto her arm again, this fails.
//
//   node tests/hero.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── hero — her arm is one piece, she has two of them, and nothing is bolted on');

  const m = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 900));
    G.wake = null;

    // Every state she has a limb in — standing, running, airborne, mid-swing,
    // dashing, hurt. A rule that only holds in the idle pose is not a rule.
    const POSES = [
      { n: 'idle', f: (p) => { p.vx = 0; p.on = true; } },
      { n: 'run', f: (p) => { p.vx = 300; p.on = true; } },
      { n: 'air', f: (p) => { p.vy = -260; p.on = false; } },
      { n: 'fall', f: (p) => { p.vy = 320; p.on = false; } },
      { n: 'swing', f: (p) => { p.swing = { t: 0.1, t0: 0.24, combo: 0, ang: -0.3 }; p.swingVis = p.swing; } },
      { n: 'combo2', f: (p) => { p.swing = { t: 0.1, t0: 0.24, combo: 2, ang: 0.4 }; p.swingVis = p.swing; } },
      { n: 'dash', f: (p) => { p.dashT = 0.12; p.vx = 620; } },
      // the two that BLINK. She flickers while invulnerable and while repairing,
      // which is correct and which means a single sample can legitimately catch
      // her mid-blink and see nothing. They are swept across the blink phase
      // below rather than excluded — the joint tripwire has to cover them too,
      // and those are exactly the states where a limb gets redrawn specially.
      { n: 'hurt', f: (p) => { p.hurtT = 0.3; p.iT = 0.9; }, blink: 1 },
      { n: 'heal', f: (p) => { p.healT = 0.5; p.vx = 0; }, blink: 1 },
    ];
    const cv2 = document.createElement('canvas');
    cv2.width = 320; cv2.height = 320;
    const x = cv2.getContext('2d');

    G._armJointCalls = 0;
    const shots = [];
    for (const pose of POSES) {
      for (const face of [1, -1]) {
        // a clean slate per pose so one does not leak into the next
        player.vx = 0; player.vy = 0; player.on = true; player.dashT = 0;
        player.swing = null; player.swingVis = null; player.hurtT = 0; player.healT = 0;
        player.face = face; player.faceVis = face; player.anim = 1.2;
        pose.f(player);
        // a blinking state is sampled across the blink until she is on screen,
        // so the measurement is of her BODY and not of the flicker's duty cycle
        let d0 = null;
        for (let ph = 0; ph < (pose.blink ? 8 : 1); ph++) {
          if (pose.blink) { player.iT = 0.9 - ph * 0.09; player.anim = 1.2 + ph * 0.07; }
          x.clearRect(0, 0, 320, 320);
          x.save();
          x.translate(160, 250); x.scale(3.4, 3.4);
          x.translate(-(player.x + player.w / 2), -(player.y + player.h));
          player.draw(x);
          x.restore();
          d0 = x.getImageData(0, 0, 320, 320).data;
          let any = 0;
          for (let i = 3; i < d0.length; i += 4 * 37) if (d0[i] > 40) { any = 1; break; }
          if (any) break;
        }
        // count the lit pixels either side of her centre line, so "she has two
        // arms" is measured rather than assumed: a one-armed character is
        // strongly asymmetric about its own spine at the shoulder height.
        const d = d0;
        let left = 0, right = 0;
        for (let yy = 150; yy < 215; yy++) for (let xx = 0; xx < 320; xx++) {
          if (d[(yy * 320 + xx) * 4 + 3] > 40) { if (xx < 160) left++; else right++; }
        }
        shots.push({ pose: pose.n, face, left, right });
      }
    }
    return { joints: G._armJointCalls, shots };
  });

  // ---- 1. THE TRIPWIRE ----------------------------------------------------
  check('nothing stamps a joint onto her arm, in any state',
    m.joints === 0, m.joints + ' armJoint call(s) across ' + m.shots.length + ' poses');

  // ---- 2. SHE HAS TWO OF THEM ---------------------------------------------
  // Both sides of her spine carry limb material at shoulder height. The ratio
  // is generous on purpose — the far arm is drawn darker and is often partly
  // behind her, and in a swing one arm is thrown out and the other is not —
  // but a character with ONE arm shows a side with almost nothing on it.
  const lopsided = m.shots.filter(s => {
    const lo = Math.min(s.left, s.right), hi = Math.max(s.left, s.right);
    return hi > 0 && lo / hi < 0.16;
  });
  console.log('');
  for (const s of m.shots.slice(0, 6))
    console.log('    ' + (s.pose + '/' + (s.face > 0 ? 'R' : 'L')).padEnd(12)
      + 'left ' + String(s.left).padStart(5) + '   right ' + String(s.right).padStart(5));
  console.log('');
  check('she reads as two-armed in every pose',
    !lopsided.length,
    lopsided.map(s => s.pose + '/' + (s.face > 0 ? 'R' : 'L')).join(', '));

  // ---- 3. AND SHE IS ACTUALLY THERE ---------------------------------------
  const empty = m.shots.filter(s => s.left + s.right < 200);
  check('...and she is drawn at all in every state',
    !empty.length, empty.map(s => s.pose).join(', '));

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one limb, two arms, no hardware bolted to the outside');
})().catch(e => { console.error(e); process.exit(1); });
