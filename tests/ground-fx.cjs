// WHAT RUNS ALONG THE GROUND RUNS ON IT — owner, 2026-11-27: "The agent's fire after effect that you
// created should walk on the terrain, not to the sides horizontally. It should follow the natural
// terrain." · "when the wolf jumps, it creates a straight red line underneath it instead of a red
// effect underneath it that goes with the terrain curves."
// tests/solid-bodies.cjs holds the shader layer's cracks and wave to the surface; this holds every
// boss and agent effect that TRAVELS along the floor, and every generated floor strip, on the rolling
// meadow of the Wolf King's den (A10):
//   A  the agent's ground waves and its ember ring's two crests ride the surface under them, frame by
//      frame (within 3 px of fxSurfaceY), over ground that rises and falls — and end where it ends
//   B  the Wolf King's rend waves and NULLFANG's floor shocks the same
//   C  a generated strip that runs along the floor (the Wolf King's landing, the agent's fire wave,
//      NULLFANG's floor shock; a pillar stands at its one point) is drawn lying along the curve: column by column the foot of its light keeps one height over
//      the surface (spread < 6 px) where the surface itself rises and falls by more than that
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── ground-fx — every ground effect travels on the ground and lies along it');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const DUMP = process.env.DUMP_STRIP || null;
  const R = await page.evaluate(async (DUMP) => {
    window.requestAnimationFrame = () => 0;
    window.__DUMP = DUMP;
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, crystal: 1 }); startGame(sv);
    loadRoom('A10'); G.state = 'PLAY'; G.dialog = G.cut = G.wake = null;
    const W = G.roomDef.w * TILE;
    // the stretch of floor that rolls the most over 300 px
    const surf = (x) => { const g = groundColumnAt(x); return g ? Math.min.apply(null, g) : NaN; };
    let best = null;
    for (let x = 6 * TILE; x < W - 16 * TILE; x += 16) { const ys = []; for (let k = 0; k <= 300; k += 20) { const y = surf(x + k); if (!isNaN(y)) ys.push(y); }
      if (ys.length < 14) continue; const sp = Math.max(...ys) - Math.min(...ys); if (!best || sp > best.sp) best = { x, sp, y: surf(x) }; }
    out.stretch = best && { x: best.x, rolls: Math.round(best.sp) };
    const track = (list, step, frames, yOf, xOf) => { let n = 0, worst = 0, ys = [], ended = 0;
      for (let f = 0; f < frames; f++) { step(); for (const w of list()) { const x = xOf(w), y = yOf(w); if (isNaN(y)) continue; const s = fxSurfaceY(x, y, 40); n++; if (isNaN(s)) { worst = 999; continue; } worst = Math.max(worst, Math.abs(s - y)); ys.push(y); } }
      return { samples: n, worst: +worst.toFixed(1), travel: ys.length ? Math.round(Math.max(...ys) - Math.min(...ys)) : 0 }; };
    // ---- A: the agent's waves and ring, stepped by its own duel tick ----
    const ag = new Enemy('sage', best.x, best.y - 60); ag.hpMax0 = ag.hp = 500; ag.calm = false; ag.tame = false;
    ag.sageDuel = { home: 'GA1D', phase: 'idle', elapsed: 0, duration: 0, face: 1, ringOrigin: null, chain: 0 };
    ag.tSt = 'stand'; ag.tT = 9; ag.x = best.x - ag.w / 2; ag.y = best.y - ag.h;
    player.x = W - 3 * TILE; player.y = surf(player.x) - player.h; player.iT = 99;
    ag.waves = [{ x: best.x, y: best.y, dir: 1, life: 1.2 }];
    out.agentWave = track(() => ag.waves, () => { player.iT = 99; ag.tSt = 'stand'; ag.tT = 9; sageDuelTick(ag, 1 / 60); }, 70, w => w.y, w => w.x);
    ag.rr = [{ r: 20, x: best.x + 150, y: surf(best.x + 150) }]; ag.waves = [];
    out.agentRing = track(() => ag.rr.flatMap(r => [{ x: r.x - r.r, y: r.ys ? r.ys[0] : r.y }, { x: r.x + r.r, y: r.ys ? r.ys[1] : r.y }]),
      () => { player.iT = 99; ag.tSt = 'stand'; ag.tT = 9; sageDuelTick(ag, 1 / 60); }, 70, w => w.y, w => w.x);
    // ---- B: the Wolf King's rends; NULLFANG's shocks ----
    const b = G.boss; b.x = best.x - b.w / 2; b.y = best.y - b.h; b.face = 1; b.rendDir = 1; b.rends = [];
    alphaRendThrow(b);
    out.rend = track(() => b.rends || [], () => alphaRendStep(b, 1 / 60), 50, w => w.y, w => w.x);
    const fake = { cx() { return best.x; }, x: best.x - 40, w: 80, y: best.y - 80, h: 80, on: true, face: 1, nfShocks: [] };
    nfShock(fake, [420, 0.8]);
    out.nfShock = track(() => fake.nfShocks, () => { player.iT = 99; nfStepHazards(fake, 1 / 60); }, 48, s => s.y, s => s.x);
    // ---- C: the strips, drawn ----
    const names = ['alpha_land', 'agent_wave', 'nf_shock'];
    for (const n of names) bossVfxReady(n);
    for (let i = 0; i < 60 && names.some(n => !bossVfxReady(n)); i++) await new Promise(r => setTimeout(r, 100));
    const cvs = document.createElement('canvas'); cvs.width = 900; cvs.height = 500; const x2 = cvs.getContext('2d');
    const ox = best.x - 300, oy = best.y - 330;
    const strip = (name, h, cell, wk) => {
      x2.setTransform(1, 0, 0, 1, 0, 0); x2.fillStyle = '#000'; x2.fillRect(0, 0, 900, 500);
      x2.setTransform(1, 0, 0, 1, -ox, -oy);
      const sx = best.x + 150, sy = surf(sx);
      drawBossVfxCell(x2, name, cell, sx, sy, h, false, 0, 1, wk || 1);
      if (window.__DUMP === name) { x2.setTransform(1, 0, 0, 1, -ox, -oy); x2.strokeStyle = '#0f0'; x2.beginPath(); for (let k = 0; k < 900; k += 6) { const q = surf(k + ox); if (!isNaN(q)) x2.lineTo(k + ox, q); } x2.stroke(); window.__PNG = cvs.toDataURL(); }
      const d = x2.getImageData(0, 0, 900, 500).data, diffs = [], surfs = [];
      for (let col = 0; col < 900; col += 6) {
        // the strip's foot in this column: the lowest row whose light is a fifth of the column's brightest
        let mx = 0; for (let y = 0; y < 500; y++) { const i = (y * 900 + col) * 4; mx = Math.max(mx, d[i] + d[i + 1] + d[i + 2]); }
        if (mx < 150) continue;
        let foot = -1; for (let y = 499; y >= 0; y--) { const i = (y * 900 + col) * 4; if (d[i] + d[i + 1] + d[i + 2] >= mx * 0.2) { foot = y; break; } }
        const s = surf(col + ox); if (isNaN(s) || foot < 0) continue;
        diffs.push(foot + oy - s); surfs.push(s);
      }
      const sd = (a) => { if (!a.length) return 0; const m = a.reduce((p, q) => p + q, 0) / a.length; return Math.sqrt(a.reduce((p, q) => p + (q - m) * (q - m), 0) / a.length); };
      return { cols: diffs.length, lightOverGround: +sd(diffs).toFixed(1), ground: +sd(surfs).toFixed(1) };
    };
    out.strips = { alpha_land: strip('alpha_land', 160, 4), agent_wave: strip('agent_wave', 90, 3), nf_shock: strip('nf_shock', 60, 3) };
    out.png = window.__PNG || null;
    return out;
  }, DUMP);
  if (R.png && process.env.DUMP_PNG) require('fs').writeFileSync(process.env.DUMP_PNG, Buffer.from(R.png.split(',')[1], 'base64'));
  check('   (the stretch of floor: it rolls by ' + (R.stretch && R.stretch.rolls) + ' px over 300 px)', R.stretch && R.stretch.rolls >= 12, R.stretch);
  const on = (r) => r.samples > 20 && r.worst <= 3;
  check('A  the agent\'s ground wave rides the surface, over ground that rises and falls', on(R.agentWave) && R.agentWave.travel >= 6, R.agentWave);
  check('   ...and so do its ember ring\'s two crests', on(R.agentRing) && R.agentRing.travel >= 6, R.agentRing);
  check('B  the Wolf King\'s rend waves ride it', on(R.rend), R.rend);
  check('   ...and NULLFANG\'s floor shocks', on(R.nfShock), R.nfShock);
  const S = R.strips;
  check('C  every generated floor strip lies along the curve, its light one height over the ground where the ground does not keep one', Object.keys(S).every(n => S[n].cols >= 8 && (S[n].ground < 6 || S[n].lightOverGround < Math.max(6, S[n].ground * 0.5))), S);
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — what runs on the ground follows it');
})().catch(e => { console.error(e); process.exit(1); });
