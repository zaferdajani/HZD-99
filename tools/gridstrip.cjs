// A 4×2 GENERATED SHEET → ONE EIGHT-CELL ROW IN THE HERO'S FRAME.
//
// The drawn hero strips are one row of square 320-px cells with her soles at
// y=312 (assets/characters/hero/fidget.webp is the pattern, and
// drawStripCell/HERO_FLOOR assume it). A generator cannot be asked for an 8:1
// image — 21:9 is the widest frame there is — so an eight-cell animation comes
// back as a 16:9 sheet of four columns by two rows, and three things about it
// are wrong for the engine:
//
//   - a soft glow behind every figure. It is alpha 20–150 and the body is ~250,
//     so it is cut by level, not by colour (a colour key eats her own shadows);
//   - marks that are not her — a "!!" beside an ear, a dust tick at a toe. Only
//     the LARGEST connected body in each cell is kept, plus the soft edge
//     pixels touching it;
//   - cells that are not where the grid says. Some sheets sit on a regular grid
//     (anchor once, nothing jitters); some drift tens of pixels along a row and
//     must be anchored cell by cell (--per). Read the printed left edges and
//     choose: a spread of a pixel or two is a regular grid.
//
// One scale and one sole line for the whole strip, taken from the tallest cell,
// so nothing pumps between cells that the drawing itself did not pump.
//
//   node tools/gridstrip.cjs <sheet.png> <out.png> [--per] [--h=203] [--cell=320] [--floor=312]
//
// --h is the figure's height in the cell, ear-tips to soles. 203 is the fidget's
// (a FRONT view). A three-quarter head is narrower than a front one, so matching
// height alone lands her a size small: raise --h until her head matches the idle.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const argv = process.argv.slice(2), pos = argv.filter(a => !a.startsWith('--'));
  const opt = (k, d) => { const a = argv.find(q => q.startsWith('--' + k + '=')); return a ? +a.split('=')[1] : d; };
  const [inp, out] = pos;
  if (!inp || !out) { console.log('usage: gridstrip.cjs <sheet.png> <out.png> [--per] [--h=203] [--cell=320] [--floor=312]'); process.exit(1); }
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const r = await p.evaluate(async ({ d, per, HT, CELL, FLOOR }) => {
    const i = new Image(); i.src = 'data:image/png;base64,' + d; await i.decode();
    const W = i.naturalWidth, H = i.naturalHeight, cw = Math.floor(W / 4), ch = Math.floor(H / 2);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0);
    const img = x.getImageData(0, 0, W, H), px = img.data;
    // the glow goes by level
    for (let k = 3; k < px.length; k += 4) { const a = px[k]; px[k] = a < 150 ? 0 : a >= 225 ? 255 : Math.round((a - 150) / 75 * 255); }
    let dropped = 0; const boxes = [];
    for (let n = 0; n < 8; n++) {
      const C0 = (n % 4) * cw, R0 = ((n / 4) | 0) * ch, A = (X, Y) => ((R0 + Y) * W + C0 + X) * 4 + 3;
      const lab = new Int32Array(cw * ch); let best = 0, bestN = 0, id = 0;
      for (let s = 0; s < cw * ch; s++) {
        if (lab[s] || px[A(s % cw, (s / cw) | 0)] < 128) continue;
        id++; let cnt = 0; const st = [s]; lab[s] = id;
        while (st.length) { const q = st.pop(); cnt++; const qx = q % cw, qy = (q / cw) | 0;
          for (const [a, e] of [[qx + 1, qy], [qx - 1, qy], [qx, qy + 1], [qx, qy - 1]]) {
            if (a < 0 || e < 0 || a >= cw || e >= ch) continue; const m = e * cw + a;
            if (lab[m] || px[A(a, e)] < 128) continue; lab[m] = id; st.push(m); } }
        if (cnt > bestN) { bestN = cnt; best = id; }
      }
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let s = 0; s < cw * ch; s++) {
        const X = s % cw, Y = (s / cw) | 0, o = A(X, Y);
        if (lab[s] === best) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; continue; }
        if (!px[o]) continue;
        if (lab[s]) { px[o] = 0; dropped++; continue; }          // another body: not her
        let near = false;                                        // a soft pixel: kept only on her own edge
        for (let j = -2; j <= 2 && !near; j++) for (let k = -2; k <= 2; k++) {
          const a = X + k, e = Y + j; if (a >= 0 && e >= 0 && a < cw && e < ch && lab[e * cw + a] === best) { near = true; break; } }
        if (!near) px[o] = 0;
      }
      boxes.push([x0, y0, x1 + 1, y1 + 1]);
    }
    x.putImageData(img, 0, 0);
    const hMax = Math.max(...boxes.map(q => q[3] - q[1])), k = HT / hMax;
    const rx0 = Math.min(...boxes.map(q => q[0])), wMax = Math.max(...boxes.map(q => q[2])) - rx0;
    const wPer = Math.max(...boxes.map(q => q[2] - q[0]));
    const o = document.createElement('canvas'); o.width = 8 * CELL; o.height = CELL;
    const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
    boxes.forEach((q, n) => {
      const C0 = (n % 4) * cw, R0 = ((n / 4) | 0) * ch, w = per ? wPer : wMax, dw = w * k;
      oc.drawImage(c, C0 + (per ? q[0] : rx0) - 2, R0 + q[3] - hMax - 2, w + 4, hMax + 4,
        n * CELL + (CELL - dw) / 2 - 2 * k, FLOOR - HT - 2 * k, dw + 4 * k, HT + 4 * k);
    });
    return { sheet: W + 'x' + H, cell: cw + 'x' + ch, left: boxes.map(q => q[0]), width: boxes.map(q => q[2] - q[0]), height: boxes.map(q => q[3] - q[1]),
      scale: +k.toFixed(3), dropped, url: o.toDataURL('image/png') };
  }, { d: fs.readFileSync(inp).toString('base64'), per: argv.includes('--per'), HT: opt('h', 203), CELL: opt('cell', 320), FLOOR: opt('floor', 312) });
  fs.writeFileSync(out, Buffer.from(r.url.split(',')[1], 'base64')); delete r.url;
  const spread = Math.max(...r.left) - Math.min(...r.left);
  console.log(JSON.stringify(r));
  console.log('left-edge spread ' + spread + ' px — ' + (spread <= 4 ? 'a regular grid: one anchor is right' : 'the cells drift: use --per') +
    (r.dropped ? '; ' + r.dropped + ' px of detached marks dropped' : ''));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
