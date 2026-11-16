// RINGS STAND ON LEVEL GROUND, ONE AT A TIME — and the ground under a deck.
// Owner, 2026-11-16: "now I have two doors next to each other, superimposing
// on each other... Looks like a glitch"; "the gates are inserted into the
// ground as an image, but not blending perfectly. If the ground is elevated,
// it shows out of space"; "you kept some of the platforms that I have to jump
// to, which resulted in... a platform just on top of me"; "When I dropped
// down, I actually went up"; "this one is trapped now because of the terrain".
//   A  every ring's foot stands on ground that is level across the ring
//   B  no two rings in one room stand within a ring's width of each other
//   C  no deck hangs one tile over the ground, or two where the floor rose
//      under part of it; the first-jump step and Ratchet's table are kept
//   D  the teeth do not teleport her: the screen closes, she is set down where
//      she last stood, and she never comes back in from the top of the room
//   E  the Alpha and the robed keepers can climb what their arenas ask of them
const { chromium } = require("playwright");
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (d != null ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); if (!ok) bad++; };
const open = async () => { const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" }); const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: "block" }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "domcontentloaded" }); await page.waitForFunction(() => typeof startGame === "function", { timeout: 20000 }); return { browser, page, errs }; };
const BASE = "{ tut: 1, woke: 1, \x27on_A0B|ratchet\x27: 1, ratchetRepaired: 1, heal: 1 }";

(async () => { const { browser, page, errs } = await open();
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, crystal: 1, alpha: 1, bossGlitch: 1, bossHorn: 1, ghWon: 1 }); startGame(sv);
    await new Promise(r => setTimeout(r, 800));
    const rings = [];
    for (const id of Object.keys(ROOMS)) { let doors; try { loadRoom(id); doors = gateDoors(id); } catch (e) { continue; } if (!doors.length) continue; G.state = 'PLAY';
      const xs = [];
      for (const d of doors) { if (!ringGateFor(d)) continue; const wx = gateWorldX(d); xs.push(wx);
        const ys = [], RW = G.roomDef.w * TILE; for (let i = -3; i <= 3; i++) { const px = wx + i * 26; if (px < TILE || px > RW - TILE) continue;   // (a ring set against a wall has no ground beyond the wall)
          const g = groundColumnAt(px); ys.push(g && g.length ? Math.min.apply(null, g) : null); }
        const v = ys.filter(y => y != null); rings.push({ id, to: d.to, span: Math.round(Math.max.apply(null, v) - Math.min.apply(null, v)), holes: ys.length - v.length }); }
      xs.sort((a, b) => a - b); for (let i = 1; i < xs.length; i++) rings.push({ id, pair: Math.round(xs[i] - xs[i - 1]) }); }
    out.rings = rings; out.ringW = typeof RING_H === 'number' ? RING_H : 236;
    // C: the decks
    const decks = [];
    for (const id of Object.keys(ROOMS)) { let g; try { g = buildRoom(id); } catch (e) { continue; } if (ROOMS[id].decks) continue;
      const solid = ch => ch === '#' || ch === 'B' || ch === '=';
      for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[y].length - 1; x++) { if (g[y][x] !== '=') continue; let x1 = x; while (g[y][x1 + 1] === '=') x1++;
        const airs = []; for (let i = x; i <= x1; i++) { let a = 0; while (y + 1 + a < g.length && !solid(g[y + 1 + a][i])) a++; airs.push(g[y - 1][i] === '^' ? 9 : a); }
        const lo = Math.min.apply(null, airs), hi = Math.max.apply(null, airs);
        if (lo === 1 || (lo === 2 && hi >= 3 && hi < 9)) decks.push(id + ':' + x + '-' + x1 + '@' + y + ' air ' + lo + '..' + hi);
        x = x1; } }
    out.decks = decks;
    const has = (id, x, y) => buildRoom(id)[y][x] === '=';
    out.step = has('W1', 20, 12); out.table = has('A0B', 22, 13);
    // D: the teeth
    loadRoom('A7'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; G.enemies = [];
    const quiet = () => { if (G.dialog) { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); } if (G.state !== 'PLAY') G.state = 'PLAY'; };
    for (let i = 0; i < 260; i++) { quiet(); update(1 / 60); } quiet();
    const safe = { x: player.lastSafe.x, y: player.lastSafe.y }, room0 = G.roomId, hp0 = player.hp;
    let sp = null; for (let y = 0; y < G.grid.length && !sp; y++) for (let x = 0; x < G.grid[y].length; x++) if (G.grid[y][x] === '^') { sp = { x, y }; break; }
    out.spike = sp; const D = { frames: [], top: false, room: [] };
    if (sp) { player.x = sp.x * TILE + 4; player.y = sp.y * TILE - player.h + 10; player.vy = 200; player.iT = 0; player.on = false;
      for (let i = 0; i < 90; i++) { quiet(); update(1 / 60); D.frames.push({ r: !!G.rescue, x: Math.round(player.x), y: Math.round(player.y) }); if (G.rescue && G.rescue.done && !D.set) D.set = { x: Math.round(player.x), y: Math.round(player.y) }; if (player.y < 40) D.top = true; D.room.push(G.roomId); }
      D.caught = D.frames.findIndex(f => f.r); D.held = D.frames.filter(f => f.r).length; D.jumpAt = D.frames.findIndex((f, i) => i > 0 && Math.hypot(f.x - D.frames[i - 1].x, f.y - D.frames[i - 1].y) > 60);
      D.end = { set: D.set, safe: { x: Math.round(safe.x), y: Math.round(safe.y) }, dSafe: D.set ? Math.round(Math.hypot(D.set.x - safe.x, D.set.y - safe.y)) : 999, onGround: player.on }; D.sameRoom = D.room.every(r => r === room0); D.hurt = player.hp < hp0 || true; delete D.frames; delete D.room; }
    out.D = D;
    // E: who can climb
    loadRoom('A10'); G.state = 'PLAY'; const al = G.boss || G.enemies.find(e => e.kind === 'alpha'); out.alphaStep = al ? al.stepUp : null; out.enemyStep = ENEMY_STEP_UP;
    return out; });
  const ringRows = R.rings.filter(r => r.span != null), pairs = R.rings.filter(r => r.pair != null);
  console.log('── ring-pads  — rings on level ground and apart; no deck the ground rose under; the teeth set her down, they do not loop her');
  const worst = ringRows.slice().sort((a, b) => b.span - a.span)[0];
  check('A  every ring stands on level ground', ringRows.length > 6 && ringRows.every(r => r.span <= 26 && !r.holes), ringRows.length + ' rings, worst ' + JSON.stringify(worst) + ' off: ' + JSON.stringify(ringRows.filter(r => !(r.span <= 26) || r.holes).slice(0, 4)));
  const near = pairs.slice().sort((a, b) => a.pair - b.pair)[0];
  check('B  no two rings in a room stand within a ring of each other', pairs.every(r => r.pair >= R.ringW + 40), 'nearest ' + JSON.stringify(near) + ', ring ' + R.ringW + ' px');
  check('C  no deck hangs over ground that rose under it', R.decks.length === 0, R.decks.slice(0, 6));
  check('   ...the first-jump step stays', R.step === true);
  check("   ...and so does the top of Ratchet's table", R.table === true);
  check('D  the teeth catch her and hold the picture before she moves', R.spike && R.D.caught >= 0 && R.D.jumpAt > R.D.caught + 6, R.D);
  check('   ...she is set down where she last stood, in the same room', R.D.sameRoom && R.D.end.dSafe < 40, R.D.end);
  check('   ...and never comes back in from the top', R.D.top === false);
  check('E  the Alpha climbs a step in its own arena', R.alphaStep === R.enemyStep && R.enemyStep > 24, { alpha: R.alphaStep, step: R.enemyStep });
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — rings are seated and apart, decks make sense, and falling is not a loop'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
