// WHERE DOES THE CUT ACTUALLY LAND? A contact sheet of the claw rake, drawn by
// the real Player.draw, in the states it was reported broken in: standing,
// sprinting, and mid-spiral on the double jump.
//
// The complaint was that the slash appears ON her rather than in front of her,
// "especially when jumping and moving fast" — which is exactly the set of states
// that deform her local transform. Reading the code cannot settle that; a column
// per state and a row per moment of the swing can.
//
// TWO THINGS THIS HARNESS HAD TO GET RIGHT, both learned by getting them wrong:
//
//  - The cell must be filled with the backdrop BEFORE she is drawn. The rake is
//    composited with 'lighter', and 'lighter' adds the ALPHA channel too — so on
//    a transparent canvas the sheet's black field becomes an opaque black
//    rectangle. In the game the destination is already opaque and the black
//    vanishes, which is the whole point of the sheet. Draw it on transparency
//    and you are photographing a bug the game does not have.
//  - "On core" means her TORSO AND HEAD, in a fixed box, and NOT the extended
//    paw. A cut touching the claws is correct; a cut lying across her chest is
//    the bug, and only a box can tell those apart.
//
// What the number is, honestly: everything the swing adds to the frame — the
// thrown limb as well as the cut — measured against her torso and head. The
// limb legitimately crosses her, so the figure never reaches zero; roughly a
// tenth is the floor. It is a regression signal, not a verdict. The verdict is
// the picture, which is why this writes one.
//
//   node tools/slashshot.cjs <out.png> [scale]
const { chromium } = require('playwright');

// combo 0/1 are the two jabs, 2 the finisher; p is how far through the swing
const MOMENTS = [{ p: 0.12, combo: 0 }, { p: 0.35, combo: 0 },
                 { p: 0.6, combo: 1 }, { p: 0.35, combo: 2 }];
const STATES = ['stand', 'sprint', 'flip', 'sprint-left'];

(async () => {
  const [out, scaleArg] = process.argv.slice(2);
  const scale = parseFloat(scaleArg || '4');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
  });
  await page.evaluate(() => new Promise(r => {
    let i = 0; const t = () => { if (++i >= 50) return r(); requestAnimationFrame(t); };
    requestAnimationFrame(t);
  }));

  const res = await page.evaluate(async ({ scale, moments, states }) => {
    const CW = 170, CH = 150, BG = '#5f646c';
    const FEETX = CW / 2, FEETY = CH * 0.76;
    // her torso and head, in design units from the feet. Deliberately does NOT
    // include the extended paw: a cut touching the claws is correct, a cut
    // lying across her chest is the bug.
    const CORE = { x0: -15, x1: 15, y0: -47, y1: -5 };
    const sheet = document.createElement('canvas');
    sheet.width = CW * scale * states.length;
    sheet.height = CH * scale * moments.length;
    const S = sheet.getContext('2d');
    const report = [];

    const pose = (st, mo) => {
      player.face = st === 'sprint-left' ? -1 : 1;
      player.faceVis = player.face;
      player.on = st !== 'flip'; player.onGround = player.on;
      player.vx = st === 'stand' ? 0 : (st === 'sprint-left' ? -330 : 330);
      player.vy = st === 'flip' ? -180 : 0;
      player.flipT = st === 'flip' ? FLIP_DUR * 0.55 : 0;
      player.lean = st === 'stand' ? 0 : (st === 'sprint-left' ? 0.1 : -0.1);
      player.combo = mo.combo;
      player.swingVis = { t: 0.24 * (1 - mo.p), t0: 0.24, ang: 0, combo: mo.combo };
      player.rigDt = 1 / 60;                 // no frame of spring catch-up
    };

    // one render of her, on `bg` (null = transparent, for the silhouette pass)
    const render = (bg, withFx) => {
      const cv = document.createElement('canvas');
      cv.width = CW * scale; cv.height = CH * scale;
      const x = cv.getContext('2d');
      if (bg) { x.fillStyle = bg; x.fillRect(0, 0, cv.width, cv.height); }
      x.setTransform(scale, 0, 0, scale, 0, 0);
      x.translate(FEETX, FEETY);
      const sx = player.x, sy = player.y, held = player.swingVis;
      player.x = 0; player.y = 0;
      if (!withFx) player.swingVis = null;
      x.save(); x.translate(-player.w / 2, -player.h);
      player.draw(x);
      x.restore();
      player.swingVis = held; player.x = sx; player.y = sy;
      return cv;
    };
    const pix = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;

    for (let m = 0; m < moments.length; m++) {
      for (let s = 0; s < states.length; s++) {
        pose(states[s], moments[m]);
        const full = render(BG, true);          // as the game composites it
        const bodyG = render(BG, false);        // same, with the swing removed
        const bodyA = render(null, false);      // silhouette, for the mask
        const fd = pix(full), bg2 = pix(bodyG), ba = pix(bodyA);

        // Two counts. `lit` is everything the swing adds — the thrown limb as
        // well as the cut — and the limb legitimately crosses her, so that
        // number has a floor around a tenth and can only ever be a coarse
        // signal. `glow` is the cut alone, isolated by the one property only
        // the cut has: it is composited with 'lighter', so it can only ever
        // make a pixel BRIGHTER, and by a lot. Steel drawn over steel does not
        // move the luminance 45 points; an additive claw arc does.
        let lit = 0, onCore = 0, glow = 0, glowCore = 0;
        const W = full.width;
        const lum = (a, i) => a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
        for (let i = 0; i < fd.length; i += 4) {
          const d = Math.abs(fd[i] - bg2[i]) + Math.abs(fd[i + 1] - bg2[i + 1])
                  + Math.abs(fd[i + 2] - bg2[i + 2]);
          if (d < 30) continue;
          const bright = lum(fd, i) - lum(bg2, i) >= 45;
          const px = ((i / 4) % W) / scale - FEETX, py = Math.floor((i / 4) / W) / scale - FEETY;
          lit++; if (bright) glow++;
          if (px < CORE.x0 || px > CORE.x1 || py < CORE.y0 || py > CORE.y1) continue;
          if (ba[i + 3] <= 24) continue;        // ...and she is solid underneath
          onCore++; if (bright) glowCore++;
        }
        const pct = lit ? Math.round(onCore / lit * 100) : 0;
        const gpct = glow ? Math.round(glowCore / glow * 100) : 0;
        report.push({ state: states[s], combo: moments[m].combo, p: moments[m].p, pct, gpct });

        const px0 = CW * scale * s, py0 = CH * scale * m;
        S.drawImage(full, px0, py0);
        S.strokeStyle = 'rgba(255,0,190,0.55)'; S.lineWidth = 1;
        S.strokeRect(px0 + (FEETX + CORE.x0) * scale, py0 + (FEETY + CORE.y0) * scale,
          (CORE.x1 - CORE.x0) * scale, (CORE.y1 - CORE.y0) * scale);
        S.fillStyle = '#0b0d11'; S.font = '600 12px monospace'; S.textAlign = 'left';
        S.fillText(states[s] + '  combo ' + moments[m].combo + '  p=' + moments[m].p, px0 + 8, py0 + 16);
        S.fillStyle = gpct > 8 ? '#ff3a3a' : '#0b0d11';
        S.fillText('CUT on core ' + gpct + '%   (swing ' + pct + '%)', px0 + 8, py0 + 32);
      }
    }
    return { url: sheet.toDataURL('image/png'), report };
  }, { scale, moments: MOMENTS, states: STATES });

  require('fs').writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  let worst = 0, sum = 0;
  for (const o of res.report) {
    console.log(`${o.state.padEnd(12)} combo ${o.combo} p=${o.p}   CUT on core ${String(o.gpct).padStart(3)}%   (whole swing ${o.pct}%)`);
    worst = Math.max(worst, o.gpct); sum += o.gpct;
  }
  console.log(`CUT ON CORE — WORST ${worst}%   MEAN ${Math.round(sum / res.report.length)}%`);
  if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  console.log('sheet -> ' + out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
