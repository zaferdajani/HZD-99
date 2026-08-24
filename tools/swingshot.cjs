// Photograph a SWING out of the real game, frame by frame.
//
// The defect this exists for is invisible in a still: the owner reported that
// attacks "change from still to hit without transitions in between", and the
// only way to see whether that is fixed is to look at consecutive frames of one
// blow. It drives her to swing, then captures every frame of swingVis with the
// canvas cropped to her body.
//
//   node tools/swingshot.cjs <out.png> [frames=6] [attack]  (repo on :8220)
//
// attack is claw_1 (default), claw_2, finisher or burst. There are four strips
// now and three of them are unreachable from a single press — combo 2 and the
// finisher need a chain, the burst needs a held charge — so the swing is
// opened once and then told which blow it is, which is exactly the state the
// renderer reads.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [out, nArg, atkArg] = process.argv.slice(2);
  const N = parseInt(nArg || '6', 10);
  const ATK = atkArg || 'claw_1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash']; sv.abil = { dash: 1, key: 1 };
    sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r => setTimeout(r, 1500));
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.toasts = [];
    // THE CANVAS IS SCALED. cam/player are world units and the backbuffer is
    // its own size, so the crop is computed from the canvas rect rather than
    // assumed 1:1 — the first version of this cropped empty scenery.
  });
  // THE SWING IS FASTER THAN A SCREENSHOT. swingVis runs 240 ms and a
  // page.screenshot round-trip is far longer than one frame, so racing it
  // caught one frame of seven. The blow is STEPPED instead: the swing is
  // started once and its clock is set by hand to each p in turn, then drawn.
  // That is the same p the renderer indexes the strip by, so what comes out is
  // exactly the frames the player sees, in order.
  const shots = [];
  await page.evaluate((ATK) => {
    keysP['KeyX'] = 1; keys['KeyX'] = 1;
    update(1 / 120);                       // one step to open the swing
    if (player.swingVis) {
      player.swingVis.charged = ATK === 'burst';
      player.swingVis.combo = ATK === 'finisher' ? 3 : ATK === 'claw_2' ? 2 : 1;
    }
    // ...AND THEN FREEZE THE LOOP. The page's own rAF keeps running between
    // screenshots and drains swingVis.t to zero long before the next capture,
    // which is why stepping p by hand still caught one frame of six. With
    // update() stubbed out nothing advances but the clock this tool sets.
    window.__realUpdate = update;
    window.update = () => {};
  }, ATK);
  for (let i = 0; i < N; i++) {
    const box = await page.evaluate((k) => {
      if (player.swingVis) {
        player.swingVis.t = player.swingVis.t0 * (1 - k);   // set p directly
      }
      // the manga impact panel whites out the frame and its clock only ticks
      // in update(), which is stubbed above — so it would sit over every shot
      G.impact = null;
      if (typeof draw === 'function') draw();
      const cv = document.querySelector('canvas');
      const r = cv.getBoundingClientRect();
      const kx = r.width / cv.width, ky = r.height / cv.height;
      const sx = (player.x + player.w / 2 - cam.x) * kx + r.left;
      const sy = (player.y + player.h - cam.y) * ky + r.top;
      return { x: Math.round(sx - 70), y: Math.round(sy - 120), swing: !!player.swingVis };
    }, (i + 0.5) / N);
    shots.push({
      png: await page.screenshot({ clip: {
        x: Math.max(0, Math.min(820, box.x)), y: Math.max(0, Math.min(400, box.y)),
        width: 140, height: 140,
      } }),
      swing: box.swing,
    });
  }
  const b64 = shots.map(s => s.png.toString('base64'));
  const strip = await page.evaluate(async ({ b64, w, h }) => {
    const cv = document.createElement('canvas');
    cv.width = w * b64.length; cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = '#5a6472'; c.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < b64.length; i++) {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64[i];
      await im.decode(); c.drawImage(im, i * w, 0);
    }
    return cv.toDataURL('image/png');
  }, { b64, w: 140, h: 140 });
  fs.writeFileSync(out, Buffer.from(strip.split(',')[1], 'base64'));
  console.log('  ' + out + '  ' + N + ' frames, swingVis live in '
    + shots.filter(s => s.swing).length);
  if (errs.length) console.log('  page error: ' + errs[0]);
  await browser.close();
})();
