// LOOK AT HER. A character sheet for the player, rendered from the real game
// code at a size where the drawing can actually be judged.
//
// Player.draw(c) takes its context, which is the whole reason this is possible:
// the same code the game runs can be pointed at a big offscreen canvas instead
// of the backbuffer, so what is critiqued here is exactly what ships — not a
// mock-up that agrees with the code and disagrees with the screen.
//
// Three panels per pose, because each answers a different question:
//   LIT      — on mid grey. Does it read as a lit, three-dimensional form?
//   FLAT     — desaturated. Are there genuinely light, mid and dark territories,
//              or is everything crushed into one narrow band?
//   SIL      — every pixel with alpha solid black. About seventy per cent of a
//              character's read is its silhouette; if that is a lump, no amount
//              of surface detail rescues it.
//
//   node tools/charshot.cjs <out.png> [scale]
const { chromium } = require('playwright');

const POSES = ['idle', 'run', 'air'];

(async () => {
  const [out, scaleArg] = process.argv.slice(2);
  const scale = parseFloat(scaleArg || '4');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse']; startGame(sv);
  });
  // let her settle into a real animated state rather than frame zero
  await page.evaluate(() => new Promise(r => {
    let i = 0; const t = () => { if (++i >= 50) return r(); requestAnimationFrame(t); };
    requestAnimationFrame(t);
  }));

  const url = await page.evaluate(async ({ scale, poses }) => {
    // set up the pose in the live player, by name — no function serialisation,
    // which was clever and therefore fragile
    const pose = (n) => {
      keys.ArrowRight = 0; player.onGround = true;
      if (n === 'run') { keys.ArrowRight = 1; player.vx = 260; player.anim += 0.3; }
      // the field is `on`, not `onGround` — this said onGround for a long time,
      // which meant the AIR panel was quietly photographing a grounded pose
      if (n === 'air') { player.on = false; player.vy = -120; }
    };
    const CW = 200, CH = 210;                      // one cell, in design units
    const sheet = document.createElement('canvas');
    sheet.width = CW * scale * 3; sheet.height = CH * scale * poses.length;
    const S = sheet.getContext('2d');

    for (let p = 0; p < poses.length; p++) {
      pose(poses[p]);
      // one cell: draw her into a private canvas at scale, feet on the baseline
      const cell = document.createElement('canvas');
      cell.width = CW * scale; cell.height = CH * scale;
      const x = cell.getContext('2d');
      x.setTransform(scale, 0, 0, scale, 0, 0);
      x.translate(CW / 2, CH * 0.82);
      const savedX = player.x, savedY = player.y;
      player.x = 0; player.y = 0;
      // draw() positions itself from x/y, so it is re-anchored to the origin
      x.save();
      x.translate(-player.w / 2, -player.h);
      player.draw(x);
      x.restore();
      player.x = savedX; player.y = savedY;

      const px = { lit: 0, flat: CW * scale, sil: CW * scale * 2 };
      const py = CH * scale * p;

      // LIT — over mid grey, the value the eye judges against
      S.fillStyle = '#6a6f77'; S.fillRect(px.lit, py, CW * scale, CH * scale);
      S.drawImage(cell, px.lit, py);

      // FLAT — desaturated, so value structure is all that is left
      S.fillStyle = '#6a6f77'; S.fillRect(px.flat, py, CW * scale, CH * scale);
      const tmp = document.createElement('canvas');
      tmp.width = cell.width; tmp.height = cell.height;
      const tx2 = tmp.getContext('2d');
      tx2.drawImage(cell, 0, 0);
      const d = tx2.getImageData(0, 0, tmp.width, tmp.height);
      const q = d.data;
      for (let i = 0; i < q.length; i += 4) {
        const l = q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11;
        q[i] = q[i + 1] = q[i + 2] = l;
      }
      tx2.putImageData(d, 0, 0);
      S.drawImage(tmp, px.flat, py);

      // SIL — the shape alone
      S.fillStyle = '#ffffff'; S.fillRect(px.sil, py, CW * scale, CH * scale);
      const sc = document.createElement('canvas');
      sc.width = cell.width; sc.height = cell.height;
      const sx2 = sc.getContext('2d');
      sx2.drawImage(cell, 0, 0);
      const sd = sx2.getImageData(0, 0, sc.width, sc.height);
      const sq = sd.data;
      for (let i = 0; i < sq.length; i += 4) {
        const on = sq[i + 3] > 8;
        sq[i] = sq[i + 1] = sq[i + 2] = 0;
        sq[i + 3] = on ? 255 : 0;
      }
      sx2.putImageData(sd, 0, 0);
      S.drawImage(sc, px.sil, py);

      S.fillStyle = '#0c0e12'; S.font = '600 13px monospace'; S.textAlign = 'left';
      S.fillText(poses[p] + '  lit / flat / silhouette', px.lit + 8, py + 18);
    }
    return sheet.toDataURL('image/png');
  }, { scale, poses: POSES });

  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  console.log('sheet -> ' + out);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
