// Cut a generated ink plate off its field, without a matting service.
//
// The generator will not give a clean field. Told "flat black, no ground", it
// paints an ink wash; told that louder, it paints a white paper border with a
// brushed black rectangle inside it. Both are the same problem for keying: the
// field is not one tone, so a luminance threshold cannot find it — the mistake
// that once reduced the foreground plates to floating blue pips.
//
// What IS true of every one of these plates: the field is CONNECTED and it
// touches the frame border, and the character is separated from it by a drawn
// ink contour. So this walks inward from the border, following smooth colour
// change and stopping where the change is abrupt. A wash that fades black to
// grey to paper is one walk; the contour line is a wall.
//
// Two guards, both learned from what the naive version ate:
//   - CHROMA: never cross into a saturated pixel. The red cape reads as a dark
//     mass next to a dark wash and a luminance walk will happily eat it.
//   - COMPONENT: after the walk, keep only the subject's own connected mass
//     plus anything big enough to be a real limb or effect. Ink splatter that
//     the walk could not reach — a dot surrounded by field — is not a limb.
//
//   node tools/inkkey.cjs <in.png> <out.png> [step] [chromaMax]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [inp, out, stepArg, chromaArg] = process.argv.slice(2);
  const b64 = fs.readFileSync(inp).toString('base64');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const res = await page.evaluate(async ({ b64, step, chromaMax }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const W = im.naturalWidth, H = im.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.drawImage(im, 0, 0);
    const img = c.getImageData(0, 0, W, H), d = img.data;
    const N = W * H;

    const lum = new Float32Array(N), chr = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      lum[i] = (r * 0.299 + g * 0.587 + b * 0.114);
      chr[i] = (Math.max(r, g, b) - Math.min(r, g, b));
    }

    // Walk in from the border. A neighbour joins the field when it is close in
    // tone to the pixel we came from — so a smooth wash is followed and a drawn
    // line is not — and when it is not saturated enough to be part of her.
    const field = new Uint8Array(N);
    const q = new Int32Array(N); let qh = 0, qt = 0;
    const push = i => { if (!field[i] && chr[i] < chromaMax) { field[i] = 1; q[qt++] = i; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (qh < qt) {
      const i = q[qh++], x = i % W, y = (i / W) | 0, L = lum[i];
      const tryN = j => {
        if (field[j] || chr[j] >= chromaMax) return;
        if (Math.abs(lum[j] - L) > step) return;
        field[j] = 1; q[qt++] = j;
      };
      if (x > 0) tryN(i - 1);
      if (x < W - 1) tryN(i + 1);
      if (y > 0) tryN(i - W);
      if (y < H - 1) tryN(i + W);
    }

    // Keep the subject's own mass. Anything the walk could not reach but that
    // is too small to be a limb is field it merely failed to touch.
    const lab = new Int32Array(N).fill(-1);
    const sizes = []; const st = new Int32Array(N);
    for (let s = 0; s < N; s++) {
      if (field[s] || lab[s] >= 0) continue;
      const id = sizes.length; let n = 0, sp = 0; st[sp++] = s; lab[s] = id;
      while (sp) {
        const i = st[--sp]; n++;
        const x = i % W, y = (i / W) | 0;
        const t = j => { if (!field[j] && lab[j] < 0) { lab[j] = id; st[sp++] = j; } };
        if (x > 0) t(i - 1);
        if (x < W - 1) t(i + 1);
        if (y > 0) t(i - W);
        if (y < H - 1) t(i + W);
      }
      sizes.push(n);
    }
    // Culling by "is it the biggest piece?" is wrong for this art, and wrong in
    // a way that only shows on the worst plate: the broken contour shatters the
    // FINISHER pose into 1205 components, the largest of which is 58k px — one
    // half of her cape. Keeping the biggest and its neighbours threw the rest
    // of her away.
    //
    // So the mass is the UNION of every substantial piece, and a piece is only
    // spatter when it is BOTH small AND clear of that mass. Either alone is
    // innocent: a hand is small but touching, a cape is far but large.
    const boxes = sizes.map(() => [1e9, 1e9, -1, -1]);
    for (let i = 0; i < N; i++) {
      const id = lab[i]; if (id < 0) continue;
      const x = i % W, y = (i / W) | 0, b = boxes[id];
      if (x < b[0]) b[0] = x; if (x > b[2]) b[2] = x;
      if (y < b[1]) b[1] = y; if (y > b[3]) b[3] = y;
    }
    const biggest = sizes.length ? sizes.reduce((a, b) => a > b ? a : b, 0) : 0;
    const mass = [1e9, 1e9, -1, -1];
    for (let id = 0; id < sizes.length; id++) {
      if (sizes[id] < biggest * 0.2) continue;
      const b = boxes[id];
      if (b[0] < mass[0]) mass[0] = b[0]; if (b[2] > mass[2]) mass[2] = b[2];
      if (b[1] < mass[1]) mass[1] = b[1]; if (b[3] > mass[3]) mass[3] = b[3];
    }
    const slack = Math.max(W, H) * 0.04;
    const keep = sizes.map((n, id) => {
      if (n < 300) return false;
      if (n >= biggest * 0.08) return true;
      const b = boxes[id];
      return b[2] >= mass[0] - slack && b[0] <= mass[2] + slack
          && b[3] >= mass[1] - slack && b[1] <= mass[3] + slack;
    });
    const alive = new Uint8Array(N);
    for (let i = 0; i < N; i++) alive[i] = (!field[i] && lab[i] >= 0 && keep[lab[i]]) ? 1 : 0;

    // CLOSE THE HOLES. The chosen ink style has a contour that deliberately
    // BREAKS — that is the whole look — and every break is a doorway the walk
    // above marches through, so it eats the torso from the inside while the
    // outline survives. The pixels it took are not gone: their colour is still
    // in the plate, only their alpha was cleared. So anything BOXED IN by her
    // on all eight directions is hers, and gets its alpha back.
    // Eight rays, not four: four fills the gap between her legs as well.
    const dirs = [], L = new Uint8Array(N), R = new Uint8Array(N),
      U = new Uint8Array(N), D = new Uint8Array(N),
      UL = new Uint8Array(N), UR = new Uint8Array(N),
      DL = new Uint8Array(N), DR = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      L[i] = x ? (alive[i - 1] || L[i - 1]) : 0;
      U[i] = y ? (alive[i - W] || U[i - W]) : 0;
      UL[i] = (x && y) ? (alive[i - W - 1] || UL[i - W - 1]) : 0;
      UR[i] = (x < W - 1 && y) ? (alive[i - W + 1] || UR[i - W + 1]) : 0;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      R[i] = x < W - 1 ? (alive[i + 1] || R[i + 1]) : 0;
      D[i] = y < H - 1 ? (alive[i + W] || D[i + W]) : 0;
      DR[i] = (x < W - 1 && y < H - 1) ? (alive[i + W + 1] || DR[i + W + 1]) : 0;
      DL[i] = (x && y < H - 1) ? (alive[i + W - 1] || DL[i + W - 1]) : 0;
    }
    let closed = 0;
    for (let i = 0; i < N; i++) {
      if (alive[i]) continue;
      if (L[i] && R[i] && U[i] && D[i] && UL[i] && UR[i] && DL[i] && DR[i]) { alive[i] = 1; closed++; }
    }
    for (let i = 0; i < N; i++) d[i * 4 + 3] = alive[i] ? 255 : 0;

    // Soften the cut by one pixel. A hard binary edge on a 2048px plate reads
    // as a sticker once it is scaled down into a 160px cell.
    const a0 = new Uint8Array(N);
    for (let i = 0; i < N; i++) a0[i] = d[i * 4 + 3];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!a0[i]) continue;
      const s = a0[i - 1] + a0[i + 1] + a0[i - W] + a0[i + W];
      if (s < 1020) d[i * 4 + 3] = 140 + (s / 1020) * 115 | 0;
    }

    c.putImageData(img, 0, 0);
    let on = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < N; i++) if (d[i * 4 + 3] > 24) {
      on++; const x = i % W, y = (i / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { url: cv.toDataURL('image/png'), W, H, closed,
      coverage: +(on / N * 100).toFixed(1), bbox: [x0, y0, x1, y1] };
  }, { b64, step: +(stepArg || 20), chromaMax: +(chromaArg || 40) });

  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  delete res.url;
  console.log(out + '  ' + JSON.stringify(res));
  await browser.close();
})();
