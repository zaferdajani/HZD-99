// THE RUN — the road to the Wolf King.
// Owner, 2026-11-16: "As for the alpha, I should be led to him with obstacles,
// with more wolves, with something challenging to reach him. So this level
// where the alpha is should be more fun... So I should find a lot of wolves on
// the way."
//   A  the den's mouth in the meadow opens onto the Run, the Run's far mouth
//      onto his floor, and both lead back the way she came
//   B  a lot of wolves: at least six on the road, between her and the inner
//      mouth, every one standing on ground
//   C  obstacles: at least three hulks two tiles or more, and a tooth-pit
//   D  she can cross all of it on her feet and a plain jump — no dash, no
//      second jump — and a wolf can cross a hulk after her (nobody is penned)
//   E  his arena is as it was: the fight's floor is still clear
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const fresh = () => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(sv); grantWeapon('single'); };
    const quiet = () => { if (G.dialog) { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); } if (G.state !== 'PLAY') G.state = 'PLAY'; };
    const enter = (id) => { loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.bossEntry = null; };
    const stand = (x) => { player.x = x - player.w / 2; const g = groundColumnAt(x); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; player.on = true; };
    const through = (to) => { const d = gateDoors().find(q => q.to === to); if (!d) return 'no door to ' + to; stand(gateWorldX(d)); for (let i = 0; i < 5; i++) { quiet(); player.iT = 99; update(1 / 60); } stand(gateWorldX(d)); if (!gateEnter()) return 'refused'; for (let i = 0; i < 500 && G.gateWalk; i++) updateGateWalk(1 / 60); return G.roomId; };
    fresh(); enter('A2'); G.enemies = []; out.A = [through('A10R')]; G.enemies = []; out.A.push(through('A10')); if (G.boss) G.boss.st = 'dorm'; out.A.push(through('A10R')); G.enemies = []; out.A.push(through('A2'));
    // B / C
    fresh(); enter('A10R'); const W = G.roomDef.w, Hh = G.grid.length;
    const inner = gateWorldX(gateDoors().find(q => q.to === 'A10')), outer = gateWorldX(gateDoors().find(q => q.to === 'A2'));
    const wolves = G.enemies.filter(e => !e.dead && isWolf(e));
    const between = wolves.filter(e => e.x > outer + 100 && e.x < inner - 100).length;     // where they are POSTED, before they have seen her
    for (let i = 0; i < 90; i++) { quiet(); player.iT = 99; player.x = 40; update(1 / 60); }
    out.B = { n: wolves.length, between,
      grounded: wolves.filter(e => { const g = groundColumnAt(e.x + e.w / 2); return g && g.some(y => Math.abs(y - (e.y + e.h)) < 6); }).length };
    const top = []; for (let x = 0; x < W; x++) { let y = 0; while (y < Hh && G.grid[y][x] !== '#') y++; top.push(Hh - 2 - y); }
    const hulks = []; for (let x = 1; x < W - 1; x++) if (top[x] > 0) { let x1 = x, hi = 0; while (x1 < W - 1 && top[x1] > 0) { hi = Math.max(hi, top[x1]); x1++; } hulks.push({ from: x, to: x1 - 1, high: hi }); x = x1; }
    let teeth = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (G.grid[y][x] === '^') teeth++;
    out.C = { hulks, teeth, steps: Math.max.apply(null, top.map((v, i) => (i > 1 && i < W - 1) ? Math.abs(v - top[i - 1]) : 0)) };   // (not the room's own walls)
    // D: her, on her feet and one jump
    fresh(); enter('A10R'); G.enemies = []; G.save.abil = {}; stand(outer + 60);
    let last = player.x, stuck = 0, rescued = 0, f = 0;
    for (; f < 3000 && player.x < inner - 20; f++) { quiet(); for (const k in keys) keys[k] = 0; keys.ArrowRight = 1;
      const tx = Math.floor((player.x + player.w + 26) / TILE), ty = Math.floor((player.y + player.h + 4) / TILE);
      const teethAhead = [0, 1].some(d => (G.grid[ty] && G.grid[ty][tx + d] === '^') || (G.grid[ty - 1] && G.grid[ty - 1][tx + d] === '^'));
      const jump = player.on && (stuck > 6 || teethAhead); keys.Space = jump ? 1 : (keys.Space && !player.on ? 1 : 0); if (jump) keysP.Space = 1; if (!player.on && player.vy < 0) keys.Space = 1;
      const hadRescue = !!G.rescue; update(1 / 60); delete keysP.Space; if (!hadRescue && G.rescue) rescued++;
      stuck = Math.abs(player.x - last) < 0.1 ? stuck + 1 : 0; last = player.x; }
    out.D = { reached: player.x >= inner - 20, frames: f, secs: +(f / 60).toFixed(1), rescued, djump: !!(G.save.abil && G.save.abil.djump), dash: !!(G.save.abil && G.save.abil.dash) };
    // ...and a wolf comes over a hulk after her
    fresh(); enter('A10R'); G.enemies = []; const hk = out.C.hulks.slice().sort((a, b) => b.high - a.high)[0];
    // (she stands a few tiles past the hulk; a wolf that can climb comes to within
    // its own biting distance of her — it hunts, it does not simply run at her)
    const wf = new Enemy('crawler', (hk.from - 3) * TILE, 15 * TILE - 40); G.enemies.push(wf); let over = -1, best = 1e9;
    for (let i = 0; i < 2400; i++) { quiet(); stand((hk.to + 4) * TILE); player.iT = 99; update(1 / 60); const dd = Math.abs((wf.x + wf.w / 2) - (player.x + player.w / 2)); best = Math.min(best, dd); if (wf.x + wf.w / 2 > (hk.to + 0.5) * TILE || dd < 120) { over = i; break; } }
    out.D.wolfOver = over; out.D.hulk = hk; out.D.wolfAt = Math.round(wf.x / TILE); out.D.nearest = Math.round(best);
    // E
    enter('A10'); const g10 = G.grid; let clear = true; for (let x = 17; x <= 37; x++) { if (g10[14][x] !== '.' || g10[15][x] !== '#') clear = false; } out.E = { clear, boss: G.boss && G.boss.kind, w: G.roomDef.w };
    out.map = { on: !!MAPPOS.A10R, pos: MAPPOS.A10R };
    { const bn = ROOMS.A10R.ents.find(e => e[0] === 'bench'), w10 = ROOMS.A10R.w; out.pod = bn ? { at: bn[1], fromInner: Math.round(0.93 * w10 - bn[1]), wolvesPast: ROOMS.A10R.ents.filter(e => (e[0] === 'crawler' || e[0] === 'hopper') && e[1] > bn[1]).length } : null; }
    return out; });
  console.log('── alpha-run  — the road to the Wolf King: wolves, hulks, a tooth-pit, and a way through on her feet');
  check('A  meadow -> the Run -> his floor, and back the way she came', JSON.stringify(R.A) === JSON.stringify(['A10R', 'A10', 'A10R', 'A2']), R.A);
  check('B  a lot of wolves on the road, all posted between the two mouths and off both doorsteps', R.B.n >= 6 && R.B.between === R.B.n, R.B);
  check('   ...every one standing on ground (none grown into a hulk)', R.B.grounded === R.B.n, R.B);
  const tall = R.C.hulks.filter(h => h.high >= 2);
  check('C  at least three hulks two tiles or more, and a tooth-pit', tall.length >= 3 && R.C.teeth >= 3, { hulks: R.C.hulks.map(h => h.from + '-' + h.to + ' x' + h.high).join(', '), teeth: R.C.teeth });
  check('   ...each a heap: the ground never steps more than a tile a column', R.C.steps <= 1, 'largest step ' + R.C.steps);
  check('D  she crosses all of it on her feet and a plain jump', R.D.reached && !R.D.djump && !R.D.dash, R.D);
  check('   ...and a wolf comes over the tallest hulk after her', R.D.wolfOver >= 0, { frames: R.D.wolfOver, hulk: R.D.hulk, wolfAtTile: R.D.wolfAt, nearestPx: R.D.nearest });
  check('E  his arena is as it was: the fighting floor is clear', R.E.clear && R.E.boss === 'alpha' && R.E.w === 46, R.E);
  check('a save point stands at the END of the road, by his door, with no wolf between it and him', R.pod && R.pod.fromInner >= 0 && R.pod.fromInner <= 6 && R.pod.wolvesPast === 0, R.pod);
  check('the Run is on the map', R.map.on, R.map.pos);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — he is reached, not walked in on'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
