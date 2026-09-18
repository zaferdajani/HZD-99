// Find HER EYES in every cell of the state sheet, so the game can repaint them.
//
// Her eye-lights are the only part of her that acts. Baked into the plates they
// are frozen: the same two shapes whatever is happening to her, which is the
// one thing a face must not be. So the game draws them live, over the plate —
// and to do that it has to know where the visor is in each pose, which changes
// as her head turns, tips back to sing, or hangs when she is nearly dead.
//
// Hand-tuning 22 anchors is 22 chances to be a pixel out, and being a pixel out
// on an eye is the difference between a character and a mask. So they are
// MEASURED: the eye-lights are the most saturated cyan on her body, so this
// finds cyan pixels, clusters them, and keeps the best PAIR.
//
// The traps, all of which this hits without the pair test:
//   - the mint-green ear insides are also cyan-ish, and there are two of them,
//     sitting in a horizontal pair, higher up
//   - the small cyan status lamp on her chest is a single blob below the face
//   - the charge and burst plates flood half the body with cyan light
// So a pair is scored on being similar in size, level with each other, close
// together, and high on the body — and the best-scoring pair wins.
//
// And it does not ask to be trusted: --mark writes the sheet back out with a
// ring drawn on every anchor it found, because a table of numbers cannot be
// checked by reading it and a picture of two rings on two eyes can.
//
//   node tools/heroeyes.cjs <sheet.png> [cells] [--mark <out.png>]
const { chromium } = require('playwright');
const fs = require('fs');

const STATES = ['idle', 'walk_a', 'walk_b', 'run_a', 'run_b', 'rise', 'apex', 'fall',
  'land', 'dash', 'skid', 'wall_cling', 'djump_jet', 'claw_1', 'claw_2', 'finisher',
  'charge', 'burst', 'hurt', 'heal', 'song', 'slump',
  // the opposite-beat cells, appended 2026-08-21 (never inserted — the index
  // IS the wire format between this tool, the sheet and HERO_CELL)
  'walk_c', 'run_c'];

// Visually checked exception: the wall pose raises a cyan paw beside the visor.
// Re-measure after changing the state manifest; --no-hand exposes detector output.
const HAND = {
  wall_cling: { lx: 0.577, ly: 0.363, rx: 0.632, ry: 0.380, ew: 0.027, eh: 0.044 },
};

const PAGE = `
window.eyes = async (dataUrl, N) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, CW = W / N;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const out = [];
  for (let i = 0; i < N; i++) {
    const d = x.getImageData(i * CW, 0, CW, H), p = d.data;
    // cyan mask: green and blue both well above red, and bright with it
    const w = Math.round(CW), lab = new Int32Array(w * H).fill(-1);
    const px = [];
    let figureTop = H, figureBottom = 0;
    for (let q = 0; q < w * H; q++) {
      const r = p[q*4], g = p[q*4+1], b = p[q*4+2], a = p[q*4+3];
      if (a < 120) continue;
      figureTop = Math.min(figureTop, Math.floor(q / w));
      figureBottom = Math.max(figureBottom, Math.floor(q / w));
      const cyan = (g + b) / 2 - r;
      if (cyan > 45 && g > 120 && b > 110) px.push(q);
    }
    // Restrict lights to the solid dark visor. Cyan fingertips and wrist lamps
    // can form a more symmetric pair than the foreshortened eyes.
    const darkMask = new Uint8Array(w * H), darkSeen = new Uint8Array(w * H);
    for (let q = 0; q < w * H; q++) {
      if (p[q*4+3] >= 120 && p[q*4]*.3+p[q*4+1]*.59+p[q*4+2]*.11 < 45
          && Math.floor(q / w) <= figureTop + (figureBottom-figureTop)*.66) darkMask[q]=1;
    }
    let visor=null;
    for (let q=0;q<w*H;q++) {
      if (!darkMask[q] || darkSeen[q]) continue;
      const stack=[q]; darkSeen[q]=1;let n=0,x0=w,x1=0,y0=H,y1=0;
      while(stack.length){const k=stack.pop(),xx=k%w,yy=Math.floor(k/w);n++;
        x0=Math.min(x0,xx);x1=Math.max(x1,xx);y0=Math.min(y0,yy);y1=Math.max(y1,yy);
        for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=xx+dx,ny=yy+dy,nk=ny*w+nx;
          if(nx>=0&&ny>=0&&nx<w&&ny<H&&darkMask[nk]&&!darkSeen[nk]){darkSeen[nk]=1;stack.push(nk);}}
      }
      const score=n*n/((x1-x0+1)*(y1-y0+1));
      if(n>=16&&(!visor||score>visor.score))visor={x0,x1,y0,y1,score};
    }
    // flood-fill clusters
    const blobs = [];
    const seen = new Uint8Array(w * H);
    const isC = new Uint8Array(w * H);
    for (const q of px) isC[q] = 1;
    for (const q of px) {
      if (seen[q]) continue;
      const st = [q]; seen[q] = 1;
      let n = 0, sx = 0, sy = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      while (st.length) {
        const k = st.pop(), kx = k % w, ky = (k / w) | 0;
        n++; sx += kx; sy += ky;
        if (kx < x0) x0 = kx; if (kx > x1) x1 = kx;
        if (ky < y0) y0 = ky; if (ky > y1) y1 = ky;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = kx + dx, ny = ky + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= H) continue;
          const nk = ny * w + nx;
          if (isC[nk] && !seen[nk]) { seen[nk] = 1; st.push(nk); }
        }
      }
      if (n < 12 || sy / n > figureTop + (figureBottom - figureTop) * 0.66) continue;
      if (!visor || sx/n < visor.x0-2 || sx/n > visor.x1+2 || sy/n < visor.y0-2 || sy/n > visor.y1+2) continue;
      // THE THING THAT ACTUALLY TELLS AN EYE FROM AN EAR: what surrounds it.
      // Her eye-lights sit INSIDE the dark charcoal visor band; her mint ear
      // insides sit on a white ceramic skull, and the Song's light beam sits in
      // its own glare. Sample a ring just outside the blob and measure how dark
      // it is. This one term does more work than every geometric heuristic
      // below it put together — without it the detector confidently rings both
      // ears on the healing plate, which is how this comment came to exist.
      let surN = 0, surL = 0;
      const pad = Math.max(2, Math.round((x1 - x0 + 1) * 0.6));
      for (let ry = y0 - pad; ry <= y1 + pad; ry++) {
        for (let rx = x0 - pad; rx <= x1 + pad; rx++) {
          if (rx < 0 || ry < 0 || rx >= w || ry >= H) continue;
          if (rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1) continue;   // inside
          const k = ry * w + rx;
          if (isC[k]) continue;                                          // other cyan
          if (p[k*4+3] < 120) continue;                                  // off-body
          surL += (p[k*4] * 0.3 + p[k*4+1] * 0.59 + p[k*4+2] * 0.11); surN++;
        }
      }
      const dark = surN ? 1 - Math.min(1, (surL / surN) / 150) : 0;     // 1 = pitch surround
      blobs.push({ n, cx: sx / n, cy: sy / n, w: x1 - x0 + 1, h: y1 - y0 + 1, dark });
    }
    // score every pair; the eyes are two similar blobs, level, close, high up
    let best = null;
    for (let a = 0; a < blobs.length; a++) for (let b2 = a + 1; b2 < blobs.length; b2++) {
      const A = blobs[a], B = blobs[b2];
      const sizeR = Math.min(A.n, B.n) / Math.max(A.n, B.n);       // 1 = identical
      const dy = Math.abs(A.cy - B.cy), dx = Math.abs(A.cx - B.cx);
      if (dx < 2) continue;                                        // same column: not a pair
      // an eye is SMALL. The Song's beam is a third of the cell and was winning
      // on every other term, so anything that big is simply not a candidate.
      const big = Math.max(A.w, B.w) / w;
      if (big > 0.14) continue;
      const level = 1 - Math.min(1, dy / (H * 0.06));
      const near  = 1 - Math.min(1, dx / (w * 0.55));
      const dark  = (A.dark + B.dark) / 2;
      const score = sizeR * 2.2 + level * 1.8 + near * 1.0 + dark * 3.0;
      if (!best || score > best.score) best = { score, A, B };
    }
    if (!best) { out.push(null); continue; }
    const L = best.A.cx < best.B.cx ? best.A : best.B;
    const R = best.A.cx < best.B.cx ? best.B : best.A;
    out.push({
      lx: L.cx / w, ly: L.cy / H, rx: R.cx / w, ry: R.cy / H,
      ew: (L.w + R.w) / 2 / w, eh: (L.h + R.h) / 2 / H, score: best.score,
    });
  }
  return out;
};
`;

const MARK = `
window.mark = async (dataUrl, N, eyes) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, CW = W / N;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  x.lineWidth = 2;
  for (let i = 0; i < N; i++) {
    const e = eyes[i]; if (!e) continue;
    x.strokeStyle = '#ff2fd0';
    for (const [ex, ey] of [[e.lx, e.ly], [e.rx, e.ry]]) {
      x.beginPath();
      x.ellipse(i * CW + ex * CW, ey * H, Math.max(3, e.ew * CW * 0.9),
                Math.max(3, e.eh * H * 0.9), 0, 0, 7);
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,47,208,0.45)';
    x.beginPath(); x.moveTo(i * CW + e.lx * CW, e.ly * H);
    x.lineTo(i * CW + e.rx * CW, e.ry * H); x.stroke();
  }
  return c.toDataURL('image/png');
};
`;

(async () => {
  const argv = process.argv.slice(2);
  const mi = argv.indexOf('--mark');
  const markOut = mi >= 0 ? argv[mi + 1] : null;
  const rest = mi >= 0 ? argv.slice(0, mi) : argv;
  const [sheet, nArg] = rest;
  const N = parseInt(nArg || String(STATES.length), 10);
  const b64 = fs.readFileSync(sheet).toString('base64');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ content: PAGE });
  const res = await page.evaluate(({ b64, N }) => window.eyes('data:image/png;base64,' + b64, N),
                                  { b64, N });
  // hand table wins where it exists, and the measurement is still reported so
  // the override can be checked against what the detector thought
  res.forEach((r, i) => {
    const h = argv.includes('--no-hand') ? null : HAND[STATES[i]];
    if (h) { res[i] = Object.assign({}, h, { score: (r && r.score) || 0, hand: true }); }
  });
  console.log('// generated by tools/heroeyes.cjs from ' + sheet.split('/').pop());
  console.log('const HERO_EYE = {');
  res.forEach((r, i) => {
    const nm = STATES[i] || ('cell' + i);
    if (!r) { console.log('  ' + nm + ': null,   // NO PAIR FOUND'); return; }
    const f = v => v.toFixed(3);
    console.log('  ' + (nm + ':').padEnd(13) + '{ lx: ' + f(r.lx) + ', ly: ' + f(r.ly) +
                ', rx: ' + f(r.rx) + ', ry: ' + f(r.ry) +
                ', ew: ' + f(r.ew) + ', eh: ' + f(r.eh) + ' },' +
                (r.hand ? '   // BY HAND (detector scored ' + r.score.toFixed(2) + ')'
                        : r.score < 4.2 ? '   // LOW CONFIDENCE ' + r.score.toFixed(2) : ''));
  });
  console.log('};');
  const bad = res.filter(r => r && !r.hand && r.score < 4.2).length;
  const hand = res.filter(r => r && r.hand).length;
  console.error((bad ? bad + ' cell(s) need a look, ' : 'every measured cell is confident, ') +
                hand + ' set by hand');
  if (markOut) {
    await page.addScriptTag({ content: MARK });
    const url = await page.evaluate(({ b64, N, res }) => window.mark('data:image/png;base64,' + b64, N, res),
                                    { b64, N, res });
    fs.writeFileSync(markOut, Buffer.from(url.split(',')[1], 'base64'));
    console.error('marked -> ' + markOut);
  }
  await browser.close();
})();
