// Turn a drawn material plate into THE ROCK: a tile that wraps on both axes.
//
// Every solid tile in the game — floor, wall, ceiling — is sampled out of one
// slab per kingdom at world position modulo the slab's size, so the slab has to
// join itself on all four edges or every wall in the game carries a hard line
// across it.
//
// A generator cannot be asked for that; it is arithmetic, so it is done here.
// OFFSET AND HEAL: shift the plate by half its width and half its height with
// wrap, which makes the four borders join by construction because they are now
// the plate's own interior — and moves the whole discontinuity to a cross
// through the middle, where it can be painted over with the plate's original
// centre through a feathered mask. Nothing is invented and the edges are never
// touched.
//
// One more thing happens here, and js/game.js says why in its own bake: a
// surface at full strength "read as a bright band rather than as stone", so the
// procedural slab takes a quiet pass down before it is used. A drawn slab is
// brighter than that bake, not darker, so it takes the same pass — otherwise
// the floor is the loudest thing on screen and the character is not.
//
//   node tools/rockslab.cjs <in.png> <out.png> [w=512] [h=256] [darken=0.22]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [inp, out, wArg, hArg] = process.argv.slice(2);
  if (!inp || !out) { console.error('usage: rockslab.cjs <in.png> <out.png> [w] [h]'); process.exit(2); }
  const W = parseInt(wArg || '512', 10), H = parseInt(hArg || '256', 10);
  const DARK = process.argv[6] == null ? 0.22 : +process.argv[6];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('plateBytes', () => fs.readFileSync(inp).toString('base64'));

  const res = await page.evaluate(async ({ W, H, DARK }) => {
    const im = new Image();
    im.src = 'data:image/png;base64,' + await window.plateBytes();
    await im.decode();

    // 1. the plate at tile size. Cover-fit: a generator's 16:9 return squashed
    //    into 2:1 stretches the grain, and grain that is stretched one way in
    //    every kingdom is a tell you cannot unsee once you have seen it.
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    const bc = base.getContext('2d');
    bc.imageSmoothingQuality = 'high';
    const s = Math.max(W / im.width, H / im.height);
    const dw = im.width * s, dh = im.height * s;
    bc.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);

    // 2. offset by half on both axes, with wrap
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const oc = off.getContext('2d');
    for (const ox of [-W / 2, W / 2]) for (const oy of [-H / 2, H / 2])
      oc.drawImage(base, ox, oy);

    // 3. the mask: a feathered cross over the seam, and nothing near the border
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H;
    const mc = mask.getContext('2d');
    const bandW = W * 0.42, bandH = H * 0.42;
    const gx = mc.createLinearGradient(W / 2 - bandW / 2, 0, W / 2 + bandW / 2, 0);
    gx.addColorStop(0, 'rgba(255,255,255,0)');
    gx.addColorStop(0.5, 'rgba(255,255,255,1)');
    gx.addColorStop(1, 'rgba(255,255,255,0)');
    mc.fillStyle = gx; mc.fillRect(W / 2 - bandW / 2, 0, bandW, H);
    const gy = mc.createLinearGradient(0, H / 2 - bandH / 2, 0, H / 2 + bandH / 2);
    gy.addColorStop(0, 'rgba(255,255,255,0)');
    gy.addColorStop(0.5, 'rgba(255,255,255,1)');
    gy.addColorStop(1, 'rgba(255,255,255,0)');
    mc.globalCompositeOperation = 'lighter';
    mc.fillStyle = gy; mc.fillRect(0, H / 2 - bandH / 2, W, bandH);
    // ...and the cross MUST NOT REACH THE BORDER. The vertical arm runs the
    // full height by construction, so without this it paints the plate's own
    // (discontinuous) top and bottom rows back over the wrap the offset had
    // just fixed — measured as a vertical seam twice as bad as the interior.
    mc.globalCompositeOperation = 'destination-out';
    const fadeW = W * 0.14, fadeH = H * 0.14;
    const wipe = (x0, y0, x1, y1, w2, h2) => {
      const g = mc.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mc.fillStyle = g; mc.fillRect(Math.min(x0, x1), Math.min(y0, y1), w2, h2);
    };
    wipe(0, 0, fadeW, 0, fadeW, H);
    wipe(W, 0, W - fadeW, 0, fadeW, H);
    wipe(0, 0, 0, fadeH, W, fadeH);
    wipe(0, H, 0, H - fadeH, W, fadeH);
    mc.globalCompositeOperation = 'source-over';

    // 4. heal
    const heal = document.createElement('canvas'); heal.width = W; heal.height = H;
    const hc = heal.getContext('2d');
    hc.drawImage(base, 0, 0);
    hc.globalCompositeOperation = 'destination-in';
    hc.drawImage(mask, 0, 0);
    oc.globalCompositeOperation = 'source-over';
    oc.drawImage(heal, 0, 0);

    // 4b. the quiet pass down — see the header
    if (DARK > 0) {
      oc.globalAlpha = DARK; oc.fillStyle = '#000'; oc.fillRect(0, 0, W, H);
      oc.globalAlpha = 1;
    }

    // 5. and MEASURE that it wraps, rather than trusting the arithmetic: the
    //    mean absolute difference across the wrap must be no worse than the
    //    difference one pixel inside it, which is what "no visible seam" means.
    const d = oc.getImageData(0, 0, W, H).data;
    const px = (x, y, i) => d[((y * W + x) << 2) + i];
    const rowDiff = (xa, xb) => {
      let t = 0; for (let y = 0; y < H; y++) for (let i = 0; i < 3; i++)
        t += Math.abs(px(xa, y, i) - px(xb, y, i));
      return t / (H * 3);
    };
    const colDiff = (ya, yb) => {
      let t = 0; for (let x = 0; x < W; x++) for (let i = 0; i < 3; i++)
        t += Math.abs(px(x, ya, i) - px(x, yb, i));
      return t / (W * 3);
    };
    return {
      png: off.toDataURL('image/png'),
      wrapX: rowDiff(W - 1, 0), innerX: rowDiff(W / 2 | 0, (W / 2 | 0) + 1),
      wrapY: colDiff(H - 1, 0), innerY: colDiff(H / 2 | 0, (H / 2 | 0) + 1),
    };
  }, { W, H, DARK });

  fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  const f = n => n.toFixed(2);
  console.log('  ' + out + '  ' + W + 'x' + H
    + '  wrap x ' + f(res.wrapX) + ' (inner ' + f(res.innerX) + ')'
    + '  wrap y ' + f(res.wrapY) + ' (inner ' + f(res.innerY) + ')');
  await browser.close();
})();
