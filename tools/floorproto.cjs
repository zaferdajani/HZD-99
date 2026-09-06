// HOW THE FLOOR SHOULD BE GENERATED — a working prototype, not a mockup.
//
// The staircase is not a decoration problem. It survives every pass laid on top
// of it because the visual surface is still derived PER CELL: each tile is
// drawn inside its own 32px box, so the composite is a staircase of boxes no
// matter how the boxes are lit, eroded or inset. Bounding an erase to the tile
// rect — which is what the shipped pass does, for safety — mathematically caps
// the deviation at a few px on a 32px cell. It cannot ever stop being a box.
//
// This replaces the unit. The surface becomes ONE CONTINUOUS POLYLINE across
// the whole room, sampled below tile resolution, free to travel well above and
// below the grid line. Terrain is filled TO THAT CURVE. Tiles stop being
// drawing units and go back to being only what they always were: collision.
//
//   node tools/floorproto.cjs /tmp/a0grid.json out.png
const { chromium } = require('playwright');
const fs = require('fs');

const TILE = 32, STEP = 4;          // STEP: horizontal sampling, well under a tile

(async () => {
  const [inp, out] = process.argv.slice(2);
  const room = JSON.parse(fs.readFileSync(inp, 'utf8'));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const url = await page.evaluate(({ room, TILE, STEP }) => {
    const grid = room.grid, Wt = room.w, Ht = room.h;
    const sol = (tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= Wt || ty >= Ht) return false;
      const ch = grid[ty][tx];
      return ch === '#' || ch === 'B' || ch === '=';
    };
    const W = Wt * TILE, H = Ht * TILE;

    // deterministic value noise, smooth between integer lattice points
    const h1 = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
    const vnoise = (x) => {
      const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
      return h1(i) * (1 - u) + h1(i + 1) * u;
    };
    const fbm = (x) => vnoise(x) * 0.55 + vnoise(x * 2.3 + 11) * 0.28 + vnoise(x * 4.7 + 31) * 0.17;

    // ---- 1. the RAW grid surface: topmost solid row per column -------------
    const N = Math.ceil(W / STEP);
    const raw = new Float32Array(N).fill(NaN);
    // SKIP THE CEILING. "Topmost solid" is the roof — row 0 is solid clear
    // across the room — so a naive scan returns the ceiling as the walking
    // surface and the fill swallows the whole picture. Walk past the solid
    // block that starts at the top, THEN take the next solid row: that is the
    // first thing she could stand on in this column.
    for (let i = 0; i < N; i++) {
      const tx = Math.floor((i * STEP) / TILE);
      let ty = 0;
      while (ty < Ht && sol(tx, ty)) ty++;        // past the ceiling
      while (ty < Ht && !sol(tx, ty)) ty++;       // down through the air
      if (ty < Ht) raw[i] = ty * TILE;
    }

    // ---- 2. SMOOTH the steps into ramps ------------------------------------
    // A one-tile step in the grid is a 32px vertical jump. Smoothing spreads it
    // over ~1.5 tiles so the surface RAMPS instead of stepping — this is the
    // single operation that kills the staircase, and it is why the curve has to
    // be computed across the whole span rather than per tile.
    const smooth = new Float32Array(N);
    const RAD = Math.round((TILE * 1.5) / STEP);
    for (let i = 0; i < N; i++) {
      let acc = 0, wsum = 0;
      for (let k = -RAD; k <= RAD; k++) {
        const j = i + k; if (j < 0 || j >= N || isNaN(raw[j])) continue;
        const w = 1 - Math.abs(k) / (RAD + 1);
        acc += raw[j] * w; wsum += w;
      }
      smooth[i] = wsum ? acc / wsum : NaN;
    }

    // ---- 3. the ROLL: continuous noise, free to go ABOVE the grid line ------
    // Amplitude is deliberately larger than a tile is tall. A surface that may
    // only move a few px inside its own cell is still a cell.
    const AMP = 22;
    const surf = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      if (isNaN(smooth[i])) { surf[i] = NaN; continue; }
      const x = (i * STEP) / TILE;
      surf[i] = smooth[i] + (fbm(x * 0.55) - 0.5) * 2 * AMP + (fbm(x * 1.9 + 7) - 0.5) * 6;
    }

    // ---- render three panels ----------------------------------------------
    const PW = W, PH = 300, PAD = 16, HEAD = 92;
    const cv = document.createElement('canvas');
    cv.width = PW + PAD * 2; cv.height = HEAD + (PH + PAD) * 3;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e13'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 30px system-ui, sans-serif';
    c.fillText('HOW THE FLOOR GETS GENERATED', PAD, 42);
    c.fillStyle = '#7f8ba3'; c.font = '18px system-ui, sans-serif';
    c.fillText('real A0 grid — the collider never changes, only what is drawn', PAD, 70);

    const VIEW_TOP = 9 * TILE;    // crop to the interesting rows
    const label = (y, t, sub) => {
      c.fillStyle = '#ffd479'; c.font = '600 19px system-ui, sans-serif';
      c.fillText(t, PAD + 10, y + 26);
      c.fillStyle = '#7f8ba3'; c.font = '15px system-ui, sans-serif';
      c.fillText(sub, PAD + 10, y + 47);
    };

    // panel 1 — TODAY: cells
    let y0 = HEAD;
    c.save(); c.beginPath(); c.rect(PAD, y0, PW, PH); c.clip();
    c.translate(PAD, y0 - VIEW_TOP);
    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
      if (!sol(tx, ty)) continue;
      c.fillStyle = '#2b4f47';
      c.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      if (!sol(tx, ty - 1)) { c.fillStyle = '#7fdcc0'; c.fillRect(tx * TILE, ty * TILE, TILE, 3); }
    }
    c.restore();
    label(y0, 'TODAY — one drawing per CELL', 'every surface is a 32px box lit on top. inset a box and it is still a box.');

    // panel 2 — the curve over the grid
    y0 = HEAD + PH + PAD;
    c.save(); c.beginPath(); c.rect(PAD, y0, PW, PH); c.clip();
    c.translate(PAD, y0 - VIEW_TOP);
    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
      if (!sol(tx, ty)) continue;
      c.strokeStyle = 'rgba(140,170,200,0.34)'; c.lineWidth = 1;
      c.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
    }
    const plot = (arr, col, wdt) => {
      c.strokeStyle = col; c.lineWidth = wdt; c.beginPath();
      let started = false;
      for (let i = 0; i < N; i++) {
        if (isNaN(arr[i])) { started = false; continue; }
        const X = i * STEP;
        if (!started) { c.moveTo(X, arr[i]); started = true; } else c.lineTo(X, arr[i]);
      }
      c.stroke();
    };
    plot(raw, 'rgba(255,120,120,0.55)', 2);
    plot(surf, '#ffd479', 3);
    c.restore();
    label(y0, 'THE SURFACE CURVE — one polyline for the whole room',
          'red: the raw grid steps. amber: steps ramped over 1.5 tiles, then rolled ±22px. it crosses cell lines freely.');

    // panel 3 — filled to the curve
    y0 = HEAD + (PH + PAD) * 2;
    c.save(); c.beginPath(); c.rect(PAD, y0, PW, PH); c.clip();
    c.translate(PAD, y0 - VIEW_TOP);
    // body: fill from the curve down to the bottom of the solid mass
    c.beginPath();
    let open = false;
    for (let i = 0; i < N; i++) {
      if (isNaN(surf[i])) { if (open) { c.lineTo((i - 1) * STEP, H); open = false; } continue; }
      const X = i * STEP;
      if (!open) { c.moveTo(X, H); c.lineTo(X, surf[i]); open = true; } else c.lineTo(X, surf[i]);
    }
    if (open) c.lineTo((N - 1) * STEP, H);
    c.closePath();
    const g2 = c.createLinearGradient(0, 10 * TILE, 0, H);
    g2.addColorStop(0, '#37655a'); g2.addColorStop(1, '#12251f');
    c.fillStyle = g2; c.fill();
    // lit lip along the curve
    c.strokeStyle = '#9ff0d2'; c.lineWidth = 3; c.beginPath();
    let st = false;
    for (let i = 0; i < N; i++) {
      if (isNaN(surf[i])) { st = false; continue; }
      const X = i * STEP;
      if (!st) { c.moveTo(X, surf[i]); st = true; } else c.lineTo(X, surf[i]);
    }
    c.stroke();
    // the collider, drawn faintly ON TOP as proof it did not move
    for (let ty = 0; ty < Ht; ty++) for (let tx = 0; tx < Wt; tx++) {
      if (!sol(tx, ty)) continue;
      c.strokeStyle = 'rgba(255,120,120,0.30)'; c.lineWidth = 1;
      c.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
    }
    c.restore();
    label(y0, 'FILLED TO THE CURVE — what ships',
          'terrain drawn to the polyline. red boxes are the UNCHANGED collider: she still walks the grid, the eye never sees it.');

    return cv.toDataURL('image/png');
  }, { room, TILE, STEP });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out);
  await browser.close();
})();
