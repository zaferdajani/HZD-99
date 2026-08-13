// Restyle a boss WITHOUT moving a single pixel of its rig.
//
// The guardians are cut-out rigs: one atlas per boss, and a table of absolute
// pixel rects (BEAST_P, EAGLE_P, DRG_P, GLC_P, …) that the renderer slices for
// the head, each leg segment, each tail joint. Those numbers are also used as
// PIVOTS — `BEAST_P.head[2] / 2` is where the neck joins — so the atlas cannot
// be rescaled, re-laid-out, or regenerated freely. Hand a generative model the
// whole sheet and ask for "the same but smoother" and it will return something
// beautiful with every part in a slightly different place, which reads in game
// as a boss whose head has come off.
//
// So the geometry is never handed over. Each part is cut out HERE, restyled on
// its own, and pasted back into the same rect HERE. The model only ever sees one
// limb at a time and never gets a vote on where it goes.
//
//   node tools/bossparts.cjs extract <boss> <outdir>
//   node tools/bossparts.cjs rebuild <boss> <indir> <out.png>
//
// A part with no restyled counterpart in <indir> is copied through untouched,
// so a partial pass is safe and re-runnable.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// The rect tables, mirrored from the js/ files. Kept here deliberately rather
// than parsed: if these ever drift from the source the rebuild would silently
// composite a boss out of the wrong slices, so `verify` checks them.
const BOSSES = {
  beast: {
    atlas: 'assets/characters/beast_parts.png', table: 'BEAST_P', src: 'js/beast.js',
    parts: {
      head: [6, 6, 154, 158], neck: [166, 6, 69, 88], body: [241, 6, 204, 144],
      fleg0: [451, 6, 68, 82], fleg1: [525, 6, 70, 109],
      bleg0: [601, 6, 70, 79], bleg1: [677, 6, 72, 114],
      tail0: [755, 6, 54, 45], tail1: [815, 6, 43, 39], tail2: [864, 6, 50, 32], tail3: [920, 6, 45, 28],
      full: [971, 6, 517, 270],
      aIdle: [6, 282, 197, 149], aWalk: [209, 282, 207, 139],
      aRoar: [422, 282, 237, 159], aAtk: [665, 282, 207, 106],
    },
  },
};

async function main() {
  const [mode, boss, dir, out] = process.argv.slice(2);
  const B = BOSSES[boss];
  if (!mode || !B) {
    console.log('usage: bossparts.cjs extract|rebuild|verify <boss> <dir> [out.png]');
    console.log('known bosses: ' + Object.keys(BOSSES).join(', '));
    process.exit(1);
  }

  // VERIFY FIRST, ALWAYS. The rects above are a copy; if the source moved on,
  // every slice is wrong and the damage is invisible until a boss animates.
  const src = fs.readFileSync(B.src, 'utf8');
  const bad = [];
  for (const [k, r] of Object.entries(B.parts)) {
    const re = new RegExp(k + ':\\s*\\[\\s*' + r.join('\\s*,\\s*') + '\\s*\\]');
    if (!re.test(src)) bad.push(k);
  }
  if (bad.length) {
    console.log('FAIL — these rects no longer match ' + B.src + ': ' + bad.join(', '));
    console.log('The table in this tool is a mirror of the one in the game. Re-sync it before running.');
    process.exit(1);
  }
  console.log('verified ' + Object.keys(B.parts).length + ' rects against ' + B.src);
  if (mode === 'verify') return;

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const atlasUrl = 'data:image/png;base64,' + fs.readFileSync(B.atlas).toString('base64');

  if (mode === 'extract') {
    fs.mkdirSync(dir, { recursive: true });
    for (const [k, r] of Object.entries(B.parts)) {
      const url = await page.evaluate(async ({ atlasUrl, r }) => {
        const img = new Image(); img.src = atlasUrl; await img.decode();
        const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3];
        c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        return c.toDataURL('image/png');
      }, { atlasUrl, r });
      fs.writeFileSync(path.join(dir, k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log('  ' + k.padEnd(8) + ' ' + r[2] + 'x' + r[3]);
    }
  } else if (mode === 'rebuild') {
    const restyled = {};
    for (const k of Object.keys(B.parts)) {
      const f = path.join(dir, k + '.png');
      if (fs.existsSync(f)) restyled[k] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    }
    const url = await page.evaluate(async ({ atlasUrl, parts, restyled }) => {
      const img = new Image(); img.src = atlasUrl; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);                       // everything not restyled survives
      // WHERE A PART SITS INSIDE ITS RECT IS THE RIG. The renderer pivots on
      // fractions of the rect — `BEAST_P.head[2] / 2` is where the neck joins —
      // so a restyled head that is merely centred differently inside the same
      // rectangle is a head mounted in the wrong place. Fitting frame-to-frame
      // would do exactly that, because the model reframes whatever it likes.
      //
      // So the fit is bounding box to bounding box: find the ink in the ORIGINAL
      // part, find the ink in the RESTYLED part, and map the second onto the
      // first. The joint stays where the rig expects it no matter how the model
      // chose to compose the picture.
      const inkBox = (ctx, w, h, alphaKeyed) => {
        const d = ctx.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
          const i = (y * w + xx) * 4;
          // an extracted part has real alpha; a generated one comes back on
          // black, so luminance stands in for it
          const on = alphaKeyed ? d[i + 3] > 24
            : (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) > 26;
          if (!on) continue;
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      };
      for (const [k, r] of Object.entries(parts)) {
        if (!restyled[k]) continue;
        const p = new Image(); p.src = restyled[k]; await p.decode();
        // where the ink was, in the original
        const oc = document.createElement('canvas'); oc.width = r[2]; oc.height = r[3];
        const ox = oc.getContext('2d', { willReadFrequently: true });
        ox.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        const ob = inkBox(ox, r[2], r[3], true) || { x: 0, y: 0, w: r[2], h: r[3] };
        // where the ink is, in the restyle — and key the black backdrop off
        const nc = document.createElement('canvas'); nc.width = p.naturalWidth; nc.height = p.naturalHeight;
        const nx = nc.getContext('2d', { willReadFrequently: true });
        nx.drawImage(p, 0, 0);
        // KEYING BY BRIGHTNESS DOES NOT WORK ON A DARK SUBJECT, which is most
        // of them: NULLFANG is gunmetal on black, and its darkest plates sit in
        // the same luminance range as the backdrop. A global threshold turned
        // the lion into a ghost — every mid-tone panel half-dissolved, the
        // bright rim light left floating.
        //
        // The backdrop is not "the dark pixels", it is "the dark pixels
        // CONNECTED TO THE EDGE". So it is flood-filled inward from the border
        // and only what the fill reaches is removed; a dark panel enclosed by
        // the silhouette is never reached and survives at full opacity.
        const nd = nx.getImageData(0, 0, nc.width, nc.height);
        const q = nd.data, NW = nc.width, NH = nc.height;
        const lumAt = i => q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11;
        const bg = new Uint8Array(NW * NH);
        const stack = [];
        const BG_LUM = 40;                       // generous: the backdrop has bloom on it
        for (let xx = 0; xx < NW; xx++) { stack.push(xx); stack.push(xx + (NH - 1) * NW); }
        for (let yy = 0; yy < NH; yy++) { stack.push(yy * NW); stack.push(NW - 1 + yy * NW); }
        while (stack.length) {
          const n = stack.pop();
          if (bg[n]) continue;
          if (lumAt(n * 4) > BG_LUM) continue;
          bg[n] = 1;
          const xx = n % NW, yy = (n - xx) / NW;
          if (xx > 0) stack.push(n - 1);
          if (xx < NW - 1) stack.push(n + 1);
          if (yy > 0) stack.push(n - NW);
          if (yy < NH - 1) stack.push(n + NW);
        }
        for (let n = 0; n < NW * NH; n++) {
          if (!bg[n]) { q[n * 4 + 3] = 255; continue; }
          // a soft rim rather than a cut edge: background pixels that are
          // nearly bright enough to be subject keep a little alpha
          const l = lumAt(n * 4);
          q[n * 4 + 3] = l > BG_LUM * 0.55 ? Math.round((l - BG_LUM * 0.55) / (BG_LUM * 0.45) * 200) : 0;
        }
        nx.putImageData(nd, 0, 0);
        const nb = inkBox(nx, nc.width, nc.height, true) || { x: 0, y: 0, w: nc.width, h: nc.height };
        // preserve the restyle's own aspect: fit its box inside the original's
        const k2 = Math.min(ob.w / nb.w, ob.h / nb.h);
        const dw = nb.w * k2, dh = nb.h * k2;
        x.clearRect(r[0], r[1], r[2], r[3]);
        x.imageSmoothingQuality = 'high';
        x.drawImage(nc, nb.x, nb.y, nb.w, nb.h,
          r[0] + ob.x + (ob.w - dw) / 2, r[1] + ob.y + (ob.h - dh) / 2, dw, dh);
      }
      return c.toDataURL('image/png');
    }, { atlasUrl, parts: B.parts, restyled });
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log('rebuilt ' + Object.keys(restyled).length + '/' + Object.keys(B.parts).length +
      ' parts -> ' + out + ' ' + (fs.statSync(out).size / 1024 | 0) + 'K');
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
