// Re-encode and downscale art, using the browser we already have.
//
// The repo has no ImageMagick, no ffmpeg and no sharp, and the game ships
// nothing from npm — but the test harness already installs Chromium, and
// Chromium is a perfectly good image pipeline. This loads a file, draws it to
// a canvas at the requested width, and writes JPEG or PNG back out.
//
// It exists because generated art arrives as multi-megabyte PNG and the game
// is now expected to run on a phone: a 1.3 MB ceiling plate that is only ever
// sampled into a 512 px texture is 1.2 MB of download bought for nothing.
//
//   node tools/img-crush.cjs <in> <out> [width] [quality]
//   node tools/img-crush.cjs --batch a.png:a.jpg:1024:0.82  b.png:b.jpg
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

async function main() {
  const args = process.argv.slice(2);
  let jobs = [];
  if (args[0] === '--batch') {
    for (const spec of args.slice(1)) {
      const [inp, out, w, q] = spec.split(':');
      jobs.push({ inp, out, w: +w || 0, q: +q || 0.82 });
    }
  } else {
    jobs = [{ inp: args[0], out: args[1], w: +args[2] || 0, q: +args[3] || 0.82 }];
  }
  if (!jobs.length || !jobs[0].inp) { console.log('usage: img-crush.cjs <in> <out> [width] [quality]'); process.exit(1); }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  for (const j of jobs) {
    const buf = fs.readFileSync(j.inp);
    const mime = /\.png$/i.test(j.inp) ? 'image/png' : 'image/jpeg';
    const dataUrl = 'data:' + mime + ';base64,' + buf.toString('base64');
    const outPng = /\.png$/i.test(j.out);
    const res = await page.evaluate(async ({ dataUrl, w, q, outPng }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const W = w ? Math.min(w, img.naturalWidth) : img.naturalWidth;
      const H = Math.round(img.naturalHeight * (W / img.naturalWidth));
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, W, H);
      return { url: c.toDataURL(outPng ? 'image/png' : 'image/jpeg', q), W, H };
    }, { dataUrl: dataUrl, w: j.w, q: j.q, outPng: outPng });
    const out = Buffer.from(res.url.split(',')[1], 'base64');
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    fs.writeFileSync(j.out, out);
    console.log(path.basename(j.inp) + ' ' + (buf.length / 1024 | 0) + 'K  ->  ' +
      path.basename(j.out) + ' ' + res.W + 'x' + res.H + ' ' + (out.length / 1024 | 0) + 'K');
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
