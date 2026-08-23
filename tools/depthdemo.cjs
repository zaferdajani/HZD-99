// Show the two terrain depths doing their job, with the real hero standing
// BETWEEN them — which is the only way to see whether a foreground layer is
// working. A fore plate looks like a dark smear on its own; it only becomes a
// foreground when something is behind it.
//
// The layers are keyed off pure black rather than matted through a service:
// these plates were generated on a black field on purpose, and a luminance key
// is exact for that case and instant.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const S = process.argv[2], out = process.argv[3];
  const b64 = f => fs.readFileSync(f).toString('base64');
  const imgs = {
    midA: b64(path.join(S, 't_mid_A.png')),  foreA: b64(path.join(S, 't_fore_A.png')),
    midC: b64(path.join(S, 't_mid_C.png')),  foreC: b64(path.join(S, 't_fore_C.png')),
    hero: b64(path.join(__dirname, '..', 'assets/characters/hero/states.webp')),
  };
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(async (imgs) => {
    const load = async (b) => { const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode(); return im; };
    // AUTO-KEY. The brief asked for a black field and two of the four plates
    // came back on WHITE — so a black key left those two showing a white sheet
    // and the whole demo read as broken art. Sample the corners, decide which
    // way the field goes, and key that. A soft ramp keeps the cut from being a
    // hard sticker rim.
    const keyed = async (b) => {
      const im = await load(b);
      const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
      const L = (i) => (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 2.55;
      const corner = (cx, cy) => L(((cy * cv.width + cx) << 2));
      const probes = [corner(2, 2), corner(cv.width - 3, 2), corner(2, 8), corner(cv.width - 3, 8)];
      const mean = probes.reduce((a, v) => a + v, 0) / probes.length;
      const white = mean > 55;
      for (let i = 0; i < p.length; i += 4) {
        const l = L(i);
        const dist = white ? (mean - l) : (l - mean);   // how far from the field
        p[i + 3] = dist <= 2 ? 0 : dist >= 12 ? 255 : Math.round(((dist - 2) / 10) * 255);
      }
      x.putImageData(d, 0, 0);
      // trim to what actually survived, so placement is about the ART and not
      // about how much empty field the generator happened to leave
      let top = cv.height, bot = 0;
      const q = x.getImageData(0, 0, cv.width, cv.height).data;
      for (let yy = 0; yy < cv.height; yy++) {
        for (let xx = 0; xx < cv.width; xx += 4) {
          if (q[((yy * cv.width + xx) << 2) + 3] > 60) { if (yy < top) top = yy; if (yy > bot) bot = yy; break; }
        }
      }
      if (bot <= top) return cv;
      const out = document.createElement('canvas');
      out.width = cv.width; out.height = bot - top + 1;
      out.getContext('2d').drawImage(cv, 0, -top);
      return out;
    };
    const midA = await keyed(imgs.midA), foreA = await keyed(imgs.foreA);
    const midC = await keyed(imgs.midC), foreC = await keyed(imgs.foreC);
    const hero = await load(imgs.hero);
    const HC = hero.naturalWidth / 22;

    const W = 1280, RH = 380, PAD = 18, HEAD = 96;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = HEAD + RH * 2 + PAD * 3;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e13'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 30px system-ui, sans-serif';
    c.fillText('TWO DEPTHS OF TERRAIN — authored plates', PAD, 42);
    c.fillStyle = '#7f8ba3'; c.font = '18px system-ui, sans-serif';
    c.fillText('she stands BETWEEN them: the mid plane is under her feet, the fore plane crosses in front of her', PAD, 70);

    const rows = [
      { name: 'SCRAP MEADOWS', mid: midA, fore: foreA, sky: ['#12212a', '#0b141a'] },
      { name: 'THE FOUNDRY',   mid: midC, fore: foreC, sky: ['#1e1410', '#120a07'] },
    ];
    for (let r = 0; r < rows.length; r++) {
      const R = rows[r], y = HEAD + r * (RH + PAD);
      c.save();
      c.beginPath(); c.rect(PAD, y, W - PAD * 2, RH); c.clip();
      // the far plane: a graded sky, deliberately dark and flat so the mid
      // plane has something to stand clear of
      const g = c.createLinearGradient(0, y, 0, y + RH);
      g.addColorStop(0, R.sky[0]); g.addColorStop(1, R.sky[1]);
      c.fillStyle = g; c.fillRect(PAD, y, W - PAD * 2, RH);

      // NO TILING HERE. These plates are already a screen wide; scaling one to
      // a short strip and repeating it squashed the art and printed three
      // visible seams across the demo. Tiling is a job for the engine, at the
      // plate's own scale — a preview only has to show the layers.
      const IW = W - PAD * 2;
      const put = (src, bottomY, widthScale) => {
        const w = IW * widthScale, sc = w / src.width, h = src.height * sc;
        c.drawImage(src, PAD - (w - IW) / 2, bottomY - h, w, h);
      };
      // MID PLANE: her ground. Its crest lands on the walk line.
      // Anchor the mid plane to the BOTTOM of the row and derive the walk line
      // from where its own top lands. Deriving it the other way round put the
      // Foundry plate — which is much taller — half a row too low, and left a
      // hard straight edge across the middle of the panel where its top sat.
      const midH = R.mid.height * (IW / R.mid.width);
      const midTop = y + RH * 1.02 - midH;
      put(R.mid, y + RH * 1.02, 1.0);
      const walkY = Math.max(y + RH * 0.30, midTop + 10);
      const HH = 104, hw = HC * (HH / hero.naturalHeight);
      c.drawImage(hero, 0, 0, HC, hero.naturalHeight, PAD + 380, walkY - HH + 12, hw, HH);
      // FORE PLANE: nearer, so bigger, and it runs off the bottom of the frame.
      // A foreground that fits inside the frame is a midground.
      put(R.fore, y + RH + 10, 1.18);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(PAD, y, 250, 34);
      c.fillStyle = '#ffd479'; c.font = '600 19px system-ui, sans-serif';
      c.fillText(R.name, PAD + 12, y + 24);
      c.restore();
    }
    return cv.toDataURL('image/png');
  }, imgs);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out);
  await browser.close();
})();
