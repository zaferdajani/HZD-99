// THE SHIPPED ART TIER, IN WEBP INSTEAD OF PNG.
//
// The owner's question was "why is my artwork so heavy on my mobile", and the
// package answers it: 168 PNG files carrying 79.5 MB against 39 JPEGs carrying
// 7.1 MB, and not one WebP in the shipped art. The low tier has been WebP all
// along (tools/lowres.cjs) — the pipeline always knew how — but the full tier
// that a phone actually ends up holding was lossless PNG, because every one of
// these plates is a cutout and needs alpha.
//
// WEBP CARRIES ALPHA, and libwebp compresses the alpha channel LOSSLESSLY even
// when the colour is lossy. Measured across the heaviest sheets the saving is
// 3.3x to 7.1x at q90, for a mean colour difference of 2 to 5 out of 255.
//
// NOTHING HERE IS TRUSTED, because two rules in this repo would die silently if
// it were:
//
//   THE PARTS ATLASES ARE ADDRESSED BY ABSOLUTE PIXEL RECT (beast, eagle,
//   glaciere, furnace, prism, mother). A re-encode that changed a sheet's
//   dimensions by one pixel assembles a guardian out of the wrong part of
//   itself. So every conversion is checked for identical width and height and
//   refused otherwise.
//
//   THE CUTOUTS ARE THE SILHOUETTE. tools/replate.cjs exists because a plate
//   whose outline moved stops fitting the room it was measured into. So every
//   conversion is checked for an identical count of opaque pixels, and for a
//   mean alpha difference of zero, and refused otherwise.
//
// A file that fails either check keeps its PNG. A file WebP does not actually
// shrink keeps its PNG too — there is no point paying a decode cost for
// nothing.
//
//   node tools/webptier.cjs [--apply] [quality=90]
//
// Without --apply it measures and reports and writes nothing, which is the
// mode to run before believing any of the above.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['assets/characters', 'assets/backgrounds', 'assets/tiles', 'assets/fx'];

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.png')) out.push(p);
  }
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const APPLY = args.includes('--apply');
  const Q = parseInt(args.find(a => /^\d+$/.test(a)) || '90', 10);
  const ffmpeg = require('ffmpeg-static');

  const files = DIRS.flatMap(d => {
    const abs = path.join(ROOT, d);
    return fs.existsSync(abs) ? walk(abs) : [];
  });

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));

  let pngBytes = 0, webpBytes = 0, converted = 0, refused = 0, skipped = 0;
  const refusals = [];

  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const tmp = path.join('/tmp', 'wt_' + path.basename(f, '.png') + '.webp');
    try {
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', f,
        '-c:v', 'libwebp', '-quality', String(Q), '-compression_level', '6', tmp]);
    } catch (e) { refusals.push(rel + ' — encoder failed'); refused++; continue; }

    const a = fs.statSync(f).size, b = fs.statSync(tmp).size;
    if (b >= a) { skipped++; pngBytes += a; webpBytes += a; fs.unlinkSync(tmp); continue; }

    const v = await page.evaluate(async ({ a, b }) => {
      const load = async (f, m) => {
        const im = new Image();
        im.src = 'data:' + m + ';base64,' + await window.bytes(f);
        await im.decode();
        const cv = document.createElement('canvas');
        cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        cv.getContext('2d', { willReadFrequently: true }).drawImage(im, 0, 0);
        return { d: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, w: cv.width, h: cv.height };
      };
      const A = await load(a, 'image/png'), B = await load(b, 'image/webp');
      if (A.w !== B.w || A.h !== B.h) return { bad: 'size ' + A.w + 'x' + A.h + ' -> ' + B.w + 'x' + B.h };
      let opA = 0, opB = 0, ad = 0;
      for (let p = 0; p < A.w * A.h; p++) {
        const j = p << 2;
        if (A.d[j + 3] > 60) opA++;
        if (B.d[j + 3] > 60) opB++;
        ad += Math.abs(A.d[j + 3] - B.d[j + 3]);
      }
      return { opA, opB, meanAlpha: ad / (A.w * A.h) };
    }, { a: f, b: tmp });

    if (v.bad) { refusals.push(rel + ' — ' + v.bad); refused++; fs.unlinkSync(tmp); continue; }
    if (v.opA !== v.opB || v.meanAlpha > 0.01) {
      refusals.push(rel + ' — alpha moved: ' + v.opA + ' -> ' + v.opB
        + ' opaque, mean diff ' + v.meanAlpha.toFixed(3));
      refused++; fs.unlinkSync(tmp); continue;
    }

    pngBytes += a; webpBytes += b; converted++;
    if (APPLY) {
      fs.copyFileSync(tmp, f.replace(/\.png$/, '.webp'));
      fs.unlinkSync(f);
    }
    fs.unlinkSync(tmp);
  }
  await browser.close();

  console.log('── webptier — the shipped art tier at q' + Q + (APPLY ? '  (APPLIED)' : '  (dry run)') + '\n');
  console.log('  ' + files.length + ' PNG files examined');
  console.log('  converted ' + converted + '   kept as PNG (webp no smaller) ' + skipped
    + '   REFUSED ' + refused);
  console.log('  ' + (pngBytes / 1048576).toFixed(1) + ' MB -> ' + (webpBytes / 1048576).toFixed(1)
    + ' MB   (' + (pngBytes / webpBytes).toFixed(1) + 'x, saving '
    + ((pngBytes - webpBytes) / 1048576).toFixed(1) + ' MB)');
  if (refusals.length) {
    console.log('\n  refused, and kept as PNG:');
    for (const r of refusals.slice(0, 20)) console.log('    ' + r);
  }
})();
