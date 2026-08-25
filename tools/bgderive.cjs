// DERIVE A SHIPPED BACKGROUND FROM ITS MASTER.
//
// RULE ZERO, applied to wallpaper: the plate Higgsfield returns is 2752 px
// wide and belongs in assets/source/, which nothing ships. What the game loads
// is a 1920-wide JPEG in assets/backgrounds/, and it is GENERATED — so the
// decision "how big does a phone need this" is made once, here, and can be
// re-made by re-running the tool rather than by re-firing the art.
//
// It refuses to write a plate whose aspect ratio differs from the one it is
// replacing by more than a hair. A backdrop is drawn to fill a room whose
// shape was measured against the old plate; a plate of a different shape
// silently letterboxes or crops, and that is not visible in a thumbnail.
//
//   node tools/bgderive.cjs <master> <assets/backgrounds/name.jpg> [width=1920]
//
// After it: node tools/lowres.cjs && node build.cjs  (the low tier is derived
// from the shipped tier, so it is stale the moment this runs).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const QUALITY = 0.92;
const ASPECT_SLACK = 0.02;   // 2%: enough for a 2752x1536 to replace a 1920x1080

(async () => {
  const args = process.argv.slice(2);
  const W = parseInt(args[2] || '1920', 10);
  const [master, dest] = args;
  if (!master || !dest) {
    console.error('  node tools/bgderive.cjs <master> <assets/backgrounds/name.jpg> [width]');
    process.exit(2);
  }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8220/');

  const r = await page.evaluate(async ({ master, dest, W, QUALITY }) => {
    const load = src => new Promise(res => {
      const m = new Image(); m.onload = () => res(m); m.onerror = () => res(null); m.src = '/' + src;
    });
    const im = await load(master);
    if (!im) return { err: 'cannot read ' + master };
    const old = await load(dest);
    const H = Math.round(im.height / im.width * W);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.drawImage(im, 0, 0, W, H);
    const url = cv.toDataURL('image/jpeg', QUALITY);
    return {
      b64: url.slice(url.indexOf(',') + 1), W, H,
      srcW: im.width, srcH: im.height,
      oldW: old ? old.width : 0, oldH: old ? old.height : 0,
    };
  }, { master, dest, W, QUALITY });

  await browser.close();
  if (r.err) { console.error('  ' + r.err); process.exit(1); }

  if (r.oldW) {
    const a = r.W / r.H, b = r.oldW / r.oldH;
    if (Math.abs(a - b) / b > ASPECT_SLACK) {
      console.error('  REFUSED ' + path.basename(dest) + ': the plate is ' + a.toFixed(3)
        + ':1 and it replaces a ' + b.toFixed(3) + ':1. A backdrop of a different shape'
        + ' crops or letterboxes in a room measured against the old one.');
      process.exit(1);
    }
  }
  const out = path.resolve(ROOT, dest);
  fs.writeFileSync(out, Buffer.from(r.b64, 'base64'));
  console.log('  ' + path.basename(dest).padEnd(22) + r.srcW + 'x' + r.srcH + ' -> '
    + r.W + 'x' + r.H + '  ' + (fs.statSync(out).size / 1024).toFixed(0) + ' kB'
    + (r.oldW ? '  (was ' + r.oldW + 'x' + r.oldH + ')' : '  NEW'));
})();
