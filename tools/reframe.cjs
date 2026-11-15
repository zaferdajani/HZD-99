// A REPAINTED PLATE → THE FRAME OF THE PLATE IT REPLACES.
//
// A restyle (art-prompts §1: shape from the reference, style from the words)
// comes back as the same figure on black at the generator's own size and
// placement. The game draws the OLD plate by its frame — drawSetPlate anchors on
// the alpha box, the strips are sliced by cell — so the repaint has to land in
// that frame to the pixel or the character jumps when the art is swapped.
//
//   node tools/reframe.cjs <repaint.png> <original.webp> <out.webp> [--grid=CxR] [--mask] [--white] [--q=0.92]
//
// (tools/replate.cjs is the sibling for ENVIRONMENT planes: it makes the restyle
// wear the old plate's silhouette outright, because a generator paints scenery
// into empty margins. A character is the opposite case — the repaint's own edge
// is the good one — so here the figure is keyed on its own and only its BOX is
// taken from the plate. A plate that fills its frame can still ask for the
// silhouette, with --mask.)
//
// Three things it does that tools/blackkey.cjs alone does not:
//
//   1. ENCLOSED POCKETS. blackkey floods the field in from the borders, which is
//      right for a prop and wrong for a figure with a hand on its hip: the black
//      between arm and body touches no border and stays in as a black patch.
//      A pocket of true black is cut here — but only if the ORIGINAL plate is
//      transparent in the same place. That test is what stops it eating a deep
//      shadow inside the subject, which is black for the opposite reason.
//   2. THE FRAME. The keyed figure's box is mapped onto the original's alpha box
//      inside a canvas of the original's size. A repaint that held its shape maps
//      at one scale in x and y; the two are printed, and a difference of more
//      than a few percent means the generator re-posed it — regenerate, do not
//      stretch.
//   3. STRIPS (--grid=CxR). A strip cannot be generated as a strip (no frame is
//      wide enough), so it is restacked C×R for the generator and comes back
//      that way. Each grid cell is keyed and mapped onto its own cell of the
//      original one-row strip, in reading order.
//
// --mask is for a plate that fills its frame (a portrait bust): there is no
// figure box to map, so the repaint is resized to the frame and wears the
// original's alpha.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const argv = process.argv.slice(2), pos = argv.filter(a => !a.startsWith('--'));
  const flag = k => argv.includes('--' + k), val = (k, d) => { const a = argv.find(q => q.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
  const [gen, orig, out] = pos;
  if (!gen || !orig || !out) { console.log('usage: reframe.cjs <repaint.png> <original.webp> <out.webp> [--grid=CxR] [--mask] [--white] [--q=0.92]'); process.exit(1); }
  const grid = (val('grid', '1x1')).split('x').map(Number);
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const mime = f => f.endsWith('.webp') ? 'webp' : f.endsWith('.jpg') ? 'jpeg' : 'png';
  const r = await p.evaluate(async ({ g, gm, o, om, cols, rows, mask, white, q }) => {
    const load = async (d, m) => { const i = new Image(); i.src = 'data:image/' + m + ';base64,' + d; await i.decode(); return i; };
    const G = await load(g, gm), O = await load(o, om);
    const OW = O.naturalWidth, OH = O.naturalHeight, n = cols * rows;
    const oc = document.createElement('canvas'); oc.width = OW; oc.height = OH;
    const ox = oc.getContext('2d', { willReadFrequently: true }); ox.drawImage(O, 0, 0);
    const oa = ox.getImageData(0, 0, OW, OH).data;
    const res = document.createElement('canvas'); res.width = OW; res.height = OH;
    const rx = res.getContext('2d'); rx.imageSmoothingQuality = 'high';
    const report = [];
    if (mask) {
      rx.drawImage(G, 0, 0, OW, OH);
      const im = rx.getImageData(0, 0, OW, OH);
      for (let i = 3; i < im.data.length; i += 4) im.data[i] = oa[i];
      rx.putImageData(im, 0, 0);
      return { report: ['mask: wears the original alpha'], url: res.toDataURL('image/webp', q) };
    }
    const GW = G.naturalWidth, GH = G.naturalHeight, gcw = GW / cols, gch = GH / rows, ocw = OW / n;
    const gc = document.createElement('canvas'); gc.width = GW; gc.height = GH;
    const gx = gc.getContext('2d', { willReadFrequently: true }); gx.drawImage(G, 0, 0);
    const gi = gx.getImageData(0, 0, GW, GH), d = gi.data;
    const isField = white ? (i => Math.min(d[i], d[i + 1], d[i + 2]) >= 225) : (i => Math.max(d[i], d[i + 1], d[i + 2]) <= 30);
    const isTrue = white ? (i => Math.min(d[i], d[i + 1], d[i + 2]) >= 249) : (i => Math.max(d[i], d[i + 1], d[i + 2]) <= 6);
    for (let c = 0; c < n; c++) {
      const X0 = Math.round((c % cols) * gcw), Y0 = Math.round(((c / cols) | 0) * gch), cw = Math.round(gcw), ch = Math.round(gch);
      const at = (x, y) => ((Y0 + y) * GW + X0 + x) * 4;
      // the original cell's alpha box
      let ax0 = 1e9, ay0 = 1e9, ax1 = -1, ay1 = -1; const OX0 = Math.round(c * ocw), ow = Math.round(ocw);
      for (let y = 0; y < OH; y++) for (let x = 0; x < ow; x++) if (oa[(y * OW + OX0 + x) * 4 + 3] >= 30) { if (x < ax0) ax0 = x; if (x > ax1) ax1 = x; if (y < ay0) ay0 = y; if (y > ay1) ay1 = y; }
      // 1. the field, flooded in from this cell's own border
      const bg = new Uint8Array(cw * ch), st = [];
      const push = (x, y) => { if (x < 0 || y < 0 || x >= cw || y >= ch) return; const k = y * cw + x; if (bg[k] || !isField(at(x, y))) return; bg[k] = 1; st.push(k); };
      for (let x = 0; x < cw; x++) { push(x, 0); push(x, ch - 1); } for (let y = 0; y < ch; y++) { push(0, y); push(cw - 1, y); }
      while (st.length) { const k = st.pop(), x = k % cw, y = (k / cw) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let k = 0; k < cw * ch; k++) if (!bg[k]) { const x = k % cw, y = (k / cw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, aw = ax1 - ax0 + 1, ah = ay1 - ay0 + 1;
      // 2. enclosed pockets of true field, confirmed against the original's alpha
      const seen = new Uint8Array(cw * ch); let pockets = 0, kept = 0; const minArea = Math.max(40, bw * bh * 0.0004);
      for (let s = 0; s < cw * ch; s++) {
        if (bg[s] || seen[s] || !isTrue(at(s % cw, (s / cw) | 0))) continue;
        const comp = [s]; seen[s] = 1;
        for (let k = 0; k < comp.length; k++) { const q2 = comp[k], x = q2 % cw, y = (q2 / cw) | 0;
          for (const [a, e] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (a < 0 || e < 0 || a >= cw || e >= ch) continue; const m = e * cw + a; if (!bg[m] && !seen[m] && isTrue(at(a, e))) { seen[m] = 1; comp.push(m); } } }
        if (comp.length < minArea) continue;
        let clear = 0, tot = 0;
        for (let k = 0; k < comp.length; k += 7) { const x = comp[k] % cw, y = (comp[k] / cw) | 0;
          const mx = Math.round(ax0 + (x - x0) / bw * aw), my = Math.round(ay0 + (y - y0) / bh * ah); tot++;
          if (mx < 0 || my < 0 || mx >= ow || my >= OH || oa[(my * OW + OX0 + mx) * 4 + 3] < 60) clear++; }
        if (clear / tot > 0.6) { pockets++; for (const k of comp) bg[k] = 1; } else kept++;
      }
      // 3. alpha, with a two-pixel shoulder
      for (let k = 0; k < cw * ch; k++) {
        const x = k % cw, y = (k / cw) | 0, i = at(x, y) + 3;
        if (bg[k]) { d[i] = 0; continue; }
        let nb = 0; for (let j = -2; j <= 2; j++) for (let e = -2; e <= 2; e++) { const a = x + e, f = y + j; if (a < 0 || f < 0 || a >= cw || f >= ch || bg[f * cw + a]) nb++; }
        d[i] = nb ? Math.max(0, 255 - nb * 20) : 255;
      }
      report.push({ cell: c, box: bw + 'x' + bh, into: aw + 'x' + ah, sx: +(aw / bw).toFixed(3), sy: +(ah / bh).toFixed(3), drift: +(Math.abs(aw / bw - ah / bh) / (ah / bh) * 100).toFixed(1), pockets, darkKept: kept,
        src: [X0 + x0, Y0 + y0, bw, bh], dst: [OX0 + ax0, ay0, aw, ah] });
    }
    gx.putImageData(gi, 0, 0);
    for (const q2 of report) rx.drawImage(gc, ...q2.src, ...q2.dst);
    return { report: report.map(({ src, dst, ...k }) => k), url: res.toDataURL('image/webp', q) };
  }, { g: fs.readFileSync(gen).toString('base64'), gm: mime(gen), o: fs.readFileSync(orig).toString('base64'), om: mime(orig),
       cols: grid[0], rows: grid[1], mask: flag('mask'), white: flag('white'), q: +val('q', '0.92') });
  fs.writeFileSync(out, Buffer.from(r.url.split(',')[1], 'base64'));
  const worst = Math.max(0, ...r.report.filter(q => q.drift != null).map(q => q.drift));
  console.log(out.split('/').pop() + '  ' + (fs.statSync(out).size / 1024 | 0) + ' KB  ' + r.report.map(q => typeof q === 'string' ? q : 'c' + q.cell + ' ' + q.box + '→' + q.into + ' drift ' + q.drift + '% pockets ' + q.pockets).join(' | '));
  if (worst > 6) console.log('  WARNING: aspect drift ' + worst + '% — the generator changed the shape; regenerate rather than stretch');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
