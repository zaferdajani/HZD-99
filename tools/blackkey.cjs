// Cut a black-field plate out of its background, WITHOUT eating the dark parts
// of the subject.
//
// Every generated plate in this pipeline arrives on pure black (ART_BIBLE.md
// §3.2), which is right for parts that get composited additively and wrong for
// an environment prop that has to sit in a room and occlude what is behind it.
// Those need real alpha.
//
// The obvious key — alpha from luminance — is wrong here and wrong in a way
// that looks fine on the ice peak and destroys the lion's den: half of that
// prop IS near-black gunmetal, and a luma key deletes it. So the background is
// found by FLOOD FILL from the borders instead. Only black that is connected to
// the edge of the plate is background; black in a hollow, under an overhang, or
// inside a crevice is the subject and stays.
//
// The edge is then feathered over a couple of pixels, because a hard cut-out
// reads as a sticker laid on the scene — the same lesson media.js learned about
// the guardians.
//
// Generators do not always honour "pure black background" — one plate in ten
// comes back on WHITE instead, and a black key on it keeps 100% of the image.
// So the field colour is a flag rather than an assumption.
//
//   node tools/blackkey.cjs <in.png> <out.png> [threshold 0-255] [feather px] [--white]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const argv = process.argv.slice(2);
  const white = argv.includes('--white');
  const [inp, out, thrArg, fArg] = argv.filter(a => a !== '--white');
  if (!inp || !out) { console.log('usage: blackkey.cjs <in> <out> [thr] [feather]'); process.exit(1); }
  const thr = parseInt(thrArg || '38', 10), feather = parseFloat(fArg || '2');
  const b64 = fs.readFileSync(inp).toString('base64');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async ({ b64, thr, feather, white }) => {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = 'data:image/png;base64,' + b64; });
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(im, 0, 0);
    const img = c.getImageData(0, 0, W, H), d = img.data;

    const dark = new Uint8Array(W * H);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      // max channel for a black field (a deep blue shadow has a low mean and is
      // not background); MIN channel for a white one, for the mirror reason —
      // a pale highlight on the subject is not the paper behind it
      if (white) {
        const m = Math.min(d[i], d[i + 1], d[i + 2]);
        dark[p] = m >= 255 - thr ? 1 : 0;
      } else {
        const m = Math.max(d[i], d[i + 1], d[i + 2]);
        dark[p] = m <= thr ? 1 : 0;
      }
    }
    // flood the connected background in from all four borders
    const bg = new Uint8Array(W * H);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const p = y * W + x;
      if (bg[p] || !dark[p]) return;
      bg[p] = 1; stack.push(p);
    };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
    for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p / W) | 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    // distance-to-background feather, so the cut has a soft shoulder
    let kept = 0;
    for (let p = 0; p < W * H; p++) {
      if (bg[p]) { d[p * 4 + 3] = 0; continue; }
      kept++;
      if (feather <= 0) continue;
      const x = p % W, y = (p / W) | 0;
      let near = 0;
      const r = Math.ceil(feather);
      for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (bg[ny * W + nx]) { near = Math.max(near, 1 - Math.hypot(dx, dy) / (feather + 1)); }
      }
      if (near > 0) d[p * 4 + 3] = Math.round(255 * (1 - near * 0.85));
    }
    c.putImageData(img, 0, 0);
    // crop to the subject's bounds — a prop padded with transparent margin is
    // impossible to place, because its anchor is a guess
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let p = 0; p < W * H; p++) {
      if (d[p * 4 + 3] < 8) continue;
      const x = p % W, y = (p / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return null;
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const oc = document.createElement('canvas'); oc.width = cw; oc.height = ch;
    oc.getContext('2d').drawImage(cv, x0, y0, cw, ch, 0, 0, cw, ch);
    return { url: oc.toDataURL('image/png'), kept, W, H, cw, ch };
  }, { b64, thr, feather, white });
  await browser.close();
  if (!url) { console.log('nothing survived the key — raise the threshold'); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(url.url.split(',')[1], 'base64'));
  console.log(inp.split('/').pop() + '  ' + url.W + 'x' + url.H + ' -> ' + out.split('/').pop()
    + ' ' + url.cw + 'x' + url.ch + '  (' + Math.round(url.kept / (url.W * url.H) * 100) + '% kept)');
})().catch(e => { console.error(e); process.exit(1); });
