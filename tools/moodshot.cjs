// LOOK AT HER FACE. Every mood, on her real body, drawn by the real game code.
//
// She has no mouth and no brows: her whole emotional range is two lights, and
// two lights at gameplay size are about four pixels each. That is not a reason
// to skip reviewing them — it is the reason reviewing them by eye at 1x is
// impossible and this exists. Each panel is her HEAD, cropped and blown up,
// with the mood named under it.
//
// What to check, in order:
//   1. is `calm` CUTE? Big, round, soft, open. If the resting face is a sensor
//      rather than a kid, everything after it is a machine changing modes.
//   2. does each mood differ from calm AT A GLANCE, with the labels covered?
//   3. is the old baked pair gone? A crescent of the plate's original eye
//      peeking out from behind the repaint is the failure this crop finds.
//
//   node tools/moodshot.cjs <out.png> [scale] [state]
const { chromium } = require('playwright');

const MOODS = ['calm', 'happy', 'excited', 'determined', 'angry', 'sad', 'hurt', 'curious', 'weary'];

(async () => {
  const [out, scaleArg, stateArg] = process.argv.slice(2);
  const scale = parseFloat(scaleArg || '10');
  const state = stateArg || 'idle';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse']; startGame(sv);
  });
  await page.evaluate(() => new Promise(r => {
    let i = 0; const t = () => { if (++i >= 50) return r(); requestAnimationFrame(t); };
    requestAnimationFrame(t);
  }));

  const res = await page.evaluate(async ({ scale, moods, state }) => {
    if (typeof HERO_MOOD === 'undefined') return { err: 'HERO_MOOD missing — old build?' };
    if (typeof MEDIA_IMG === 'undefined' || !MEDIA_IMG.heroStates) return { err: 'state sheet not loaded' };
    // head-sized window in design units: her eyes sit high on a ~60u body
    const CW = 46, CH = 46, COLS = 5;
    const rows = Math.ceil(moods.length / COLS);
    const sheet = document.createElement('canvas');
    sheet.width = CW * scale * COLS; sheet.height = (CH + 7) * scale * rows;
    const S = sheet.getContext('2d');
    S.fillStyle = '#4a5261'; S.fillRect(0, 0, sheet.width, sheet.height);

    const savedX = player.x, savedY = player.y;
    for (let i = 0; i < moods.length; i++) {
      const cx = (i % COLS) * CW * scale, cy = ((i / COLS) | 0) * (CH + 7) * scale;
      // pin the mood and the pose, and freeze the blink so a panel is never
      // photographed mid-blink and read as "this mood closes her eyes"
      player.mood = moods[i]; player.moodT = 99;
      player.anim = 1.0;
      player.x = 0; player.y = 0; player.on = true; player.vx = 0;
      const cell = document.createElement('canvas');
      cell.width = CW * scale; cell.height = CH * scale;
      const x = cell.getContext('2d');
      x.setTransform(scale, 0, 0, scale, 0, 0);
      // centre the HEAD. She is drawn feet-at-origin with up negative, and her
      // eyes sit about 40 units above the floor, so putting the floor 58 units
      // down the panel lands the face in the middle of it.
      x.translate(CW / 2, 58);
      x.save(); x.translate(-player.w / 2, -player.h); player.draw(x); x.restore();
      S.drawImage(cell, cx, cy);
      S.fillStyle = '#dfe6f0';
      S.font = 'bold ' + Math.round(3.2 * scale) + 'px monospace';
      S.fillText(moods[i], cx + 6, cy + (CH + 5.2) * scale);
    }
    player.x = savedX; player.y = savedY; player.mood = null; player.moodT = 0;
    return { url: sheet.toDataURL('image/png') };
  }, { scale, moods: MOODS, state });

  if (res.err) { console.error('FAILED: ' + res.err); process.exit(1); }
  require('fs').writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log('moods -> ' + out + (errs.length ? '  PAGE ERRORS: ' + errs[0] : ''));
  await browser.close();
})();
