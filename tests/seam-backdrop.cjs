// NOTHING HAPPENS ON THE FRAME SHE CROSSES A SHAFT'S LINE.
//
// The owner, 2026-11-15: "The screen still glitches when I transition from one
// room to another on a vertical mode. When the camera moves, it glitches a
// little bit." Filmed frame by frame through the meadow's hatch, it was three
// things, and none of them was her position (that was already continuous):
//
//   1  THE BACKDROP SWAPPED. The floor crossed the seam and the background did
//      not: the frame her centre crossed the line, the meadow's skyline was
//      replaced whole by the room below's wall, and where the camera looked
//      past that room's own edge it showed a pale block it had never painted.
//   2  A READBACK, 120 ms into every new room — while the camera was still
//      arriving (liftProbe: 17 ms on a desk, several times that on a phone).
//   3  THE OLD ROOM'S GRASS was painted, on a new room-sized canvas, on the
//      crossing frame itself (the room she leaves is drawn on as the neighbour).
//
//   A  across the handover the picture ABOVE the seam changes no more than it
//      does between two ordinary frames of the same fall — and with the
//      neighbour's backdrop switched off (the control) it changes several times
//      as much, so this measures the thing it says;
//   B  no canvas is read back for 0.6 s after the line is crossed;
//   C  the room she is in has its neighbour-fringe grown BEFORE she leaves it,
//      so the only grass painted on the crossing frame is the new room's own.
//
//   node tests/seam-backdrop.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── seam-backdrop — the frame she crosses a shaft\'s line is a frame like any other');
    const errors = [];
    const run = async (control) => {
      const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function');
      const r = await page.evaluate(async ({ control }) => {
        window.requestAnimationFrame = () => 0;
        const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, crystal: 1, pl_cshard: 1, beacon: 1, bossHorn: 1, ghMet: 1, gateOpened: 1 });
        sv.broken = { 'A2:12,15': 1, 'A2:13,15': 1, 'A2:14,15': 1, 'A2:12,16': 1, 'A2:13,16': 1, 'A2:14,16': 1 }; startGame(sv);
        loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = [];
        const cv = document.querySelector('canvas'), x = cv.getContext('2d');
        const quiet = () => { G.enemies = []; G.dialog = null; G.state = 'PLAY'; G.panels = null; G.toasts = []; G.zoneToast = null; };
        for (let i = 0; i < 90; i++) { update(1 / 60); quiet(); } draw(performance.now());
        await new Promise(r => setTimeout(r, 2500));
        // the loop's own idle work, as the real loop would have done it by now
        let painted = 0; const pf0 = paintFringe; paintFringe = function () { painted++; return pf0.apply(this, arguments); };
        for (let i = 0; i < 80; i++) { update(1 / 60); quiet(); draw(performance.now()); tilePickT = 0; if (tileSelfAt) tileSelfAt = 1; tilePrebakeTick(); if (tileJob) tileJobSlice(Infinity); await new Promise(r => setTimeout(r, 12)); }
        const e0 = tileStore.get('A2');
        const out = { selfFringe: !!(e0 && e0.fringe && e0.fringeSig === e0.sig), below: !!(tileStore.get('A5') && tileStore.get('A5').ready) };
        if (control) { drawVLinkBG = function () {}; vlinkFadeArm = function () {}; }
        player.x = 12.7 * TILE; player.y = 13 * TILE - player.h; player.vx = player.vy = 0;
        // A window of the picture above the seam, clear of the HUD, as luminance at
        // quarter size — and two frames are compared WORLD-LOCKED: the later one is
        // shifted back by however far the camera travelled between them, so what is
        // counted is the picture changing, not the picture moving.
        const X0 = Math.round(cv.width * 0.45), X1 = Math.round(cv.width * 0.82), Y0 = Math.round(cv.height * 0.04), Y1 = Math.round(cv.height * 0.46);
        const GW = Math.ceil((X1 - X0) / 4), GH = Math.ceil((Y1 - Y0) / 4);
        const grab = () => { const d = x.getImageData(X0, Y0, X1 - X0, Y1 - Y0).data, W = X1 - X0, o = new Float32Array(GW * GH); let k = 0;
          for (let yy = 0; yy < Y1 - Y0; yy += 4) for (let xx = 0; xx < W; xx += 4) { const i = (yy * W + xx) * 4; o[k++] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; } return o; };
        const diff = (A, B) => { const sy = Math.round((B.cy - A.cy) * (cam.zoom || 1) * cv.height / 540 / 4), sx = Math.round((B.cx - A.cx) * (cam.zoom || 1) * cv.width / 960 / 4); let n = 0, m = 0;
          for (let yy = 0; yy < GH; yy++) { const y2 = yy - sy; if (y2 < 0 || y2 >= GH) continue; for (let xx = 0; xx < GW; xx++) { const x2 = xx - sx; if (x2 < 0 || x2 >= GW) continue; m++; if (Math.abs(A.px[yy * GW + xx] - B.px[y2 * GW + x2]) > 16) n++; } }
          return m ? n / m * 100 : 0; };
        const frames = []; let crossAt = -1, looks0 = G.liftLooks | 0, looksAfter = null, tCross = 0, paintedAt = [], oyAcc = 0, oxAcc = 0;
        for (let i = 0; i < 240; i++) {
          const room = G.roomId, p0 = painted, L = G.vlink && G.vlink.B; update(1 / 60); quiet(); draw(performance.now());
          if (G.roomId !== room && crossAt < 0) { crossAt = frames.length; tCross = performance.now(); paintedAt = [painted - p0]; looks0 = G.liftLooks | 0; oyAcc = L ? L.oy : 0; oxAcc = L ? L.ox : 0; }
          frames.push({ px: grab(), cy: camSY() + oyAcc, cx: camSX() + oxAcc });
          if (crossAt >= 0) { await new Promise(r => setTimeout(r, 16)); if (performance.now() - tCross >= 600 && looksAfter == null) { looksAfter = (G.liftLooks | 0) - looks0; } if (frames.length - crossAt > 60) break; }
        }
        out.crossed = crossAt >= 0 && G.roomId === 'A5'; out.looksAfter = looksAfter; out.painted = paintedAt[0];
        if (crossAt >= 3) {
          out.before = [diff(frames[crossAt - 3], frames[crossAt - 2]), diff(frames[crossAt - 2], frames[crossAt - 1])].map(v => +v.toFixed(1));
          out.at = +diff(frames[crossAt - 1], frames[crossAt]).toFixed(1);
          out.after = +diff(frames[crossAt], frames[crossAt + 1]).toFixed(1);
          // the worst single step of the whole ease-out that follows
          let worst = 0; for (let k = crossAt; k < Math.min(frames.length - 1, crossAt + 30); k++) worst = Math.max(worst, diff(frames[k], frames[k + 1]));
          out.easeWorst = +worst.toFixed(1); out.fades = G.vlinkFades | 0;
        }
        out.bg = G.vlinkBG | 0;
        return out;
      }, { control });
      await page.close(); return r;
    };
    const R = await run(false), C = await run(true);
    check('she falls through the meadow\'s hatch into the room below, seamlessly', R.crossed && R.below, 'the room below was baked before she left: ' + R.below);
    const base = Math.max.apply(null, R.before);
    check('A  the picture above the seam changes no more on the crossing frame than on the frames before it', R.at <= base * 1.5 + 3, R.at + '% of it changed at the line (camera travel taken out); ' + R.before.join('% / ') + '% on the two frames before');
    check('A  ...and nothing after it is a jump either: the old room eases out', R.fades > 0 && R.easeWorst <= base * 1.5 + 6, 'worst single frame of the half second after: ' + R.easeWorst + '%, over ' + R.fades + ' frames of dissolve');
    check('A  ...and with the neighbour\'s backdrop and the ease switched off, it changes several times as much (the control)', C.at >= Math.max(12, R.at * 2.5), C.at + '% without them, ' + R.at + '% with');
    check('A  ...because beyond the seam the neighbour\'s own backdrop is what is drawn', R.bg > 0, R.bg + ' frames drew it');
    check('B  no canvas is read back in the 0.6 s after the line is crossed', R.looksAfter === 0, R.looksAfter + ' looks');
    check('C  the room she is in has grown its neighbour-fringe before she leaves it', R.selfFringe);
    check('C  ...so the only fringe painted on the crossing frame is the new room\'s own (never the one she left)', R.painted <= 1, R.painted + ' painted');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nseam-backdrop: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
