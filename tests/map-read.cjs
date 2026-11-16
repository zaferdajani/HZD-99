// THE MAP IS THE GROUND'S SHAPE, AND SHE CAN FIND HERSELF ON IT.
// Owner, 2026-11-16: "this map is straight lines instead of following the
// natural curves of the terrain... it should connect better way, just like
// Hollow Knight"; "find a better indicator on the map to show where I am. I'm
// confused... these shapes in the map, they're pixelated instead of smooth".
//   A  a room's chart is drawn finer than a tile and has a SOFT edge
//   B  it is the cavity, not a box: rock is left empty, and the room's own
//      outline is not a ruled rectangle
//   C  YOU ARE HERE is large: it marks a good patch of the screen, at any zoom
//   D  the room the errand leads to wears a gold mark
const { chromium } = require("playwright");
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (d != null ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); if (!ok) bad++; };
const open = async () => { const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" }); const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: "block" }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "domcontentloaded" }); await page.waitForFunction(() => typeof startGame === "function", { timeout: 20000 }); return { browser, page, errs }; };

(async () => { const { browser, page, errs } = await open();
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, beacon: 1, ghMet: 1 });
    sv.visited = {}; for (const id of ['W1', 'W2', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'CV1', 'CV1B', 'CV2', 'CV3']) sv.visited[id] = 1; startGame(sv);
    loadRoom('A5'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; for (let i = 0; i < 20; i++) update(1 / 60);
    const A = {}; for (const id of ['A5', 'CV1', 'A2']) { const mc = roomMini(id), d = mc.getContext('2d').getImageData(0, 0, mc.width, mc.height).data; const def = ROOMS[id], g = buildRoom(id);
      let soft = 0, clear = 0, full = 0, n = mc.width * mc.height; for (let k = 3; k < d.length; k += 4) { if (d[k] === 0) clear++; else if (d[k] > 4 && d[k] < 150) soft++; else full++; }
      // the left edge of what is drawn, row by row: a ruled wall has one value
      const lefts = []; for (let y = 8; y < mc.height - 8; y += 2) { let x = 0; while (x < mc.width && d[(y * mc.width + x) * 4 + 3] < 60) x++; if (x < mc.width) lefts.push(x); }
      const tops = []; for (let x = 8; x < mc.width - 8; x += 2) { let y = 0; while (y < mc.height && d[(y * mc.width + x) * 4 + 3] < 60) y++; if (y < mc.height) tops.push(y); }
      const distinct = (a) => new Set(a).size;
      A[id] = { perTile: mc.width / def.w, soft: +(soft / n).toFixed(3), clear: +(clear / n).toFixed(3), lefts: distinct(lefts), tops: distinct(tops) }; }
    out.A = A;
    const cv = document.querySelector('canvas'), cx = cv.getContext('2d');
    const shot = () => cx.getImageData(0, 0, cv.width, cv.height).data;
    const marks = (z) => { G.state = 'MAP'; mapView.ready = false; draw(1000); if (z) { mapView.z = z; mapCenterOnRoom(G.roomId); } draw(1000);
      const a = shot(); let cyan = 0, gold = 0; for (let k = 0; k < a.length; k += 4) { const r = a[k], g = a[k + 1], b = a[k + 2]; if (r > 225 && g > 235 && b > 240) cyan++; if (r > 235 && g > 190 && g < 235 && b > 80 && b < 150) gold++; }
      return { z: +mapView.z.toFixed(2), white: cyan, gold, scale: cv.width / 960 }; };
    const now0 = performance.now; performance.now = () => 5000;      // (the marks pulse: hold the clock so two frames can be compared)
    out.fit = marks(0); out.near = marks(2.4); out.far = marks(0.8);
    // the errand's mark, measured as what the frame loses when there is no errand
    G.state = 'MAP'; mapView.ready = false; draw(1000); draw(1000); const withGoal = shot(); const realGoal = window.pgGoalRoom; window.pgGoalRoom = () => null; draw(1000); const noGoal = shot(); window.pgGoalRoom = realGoal;
    let diff = 0; for (let k = 0; k < withGoal.length; k += 4) if (Math.abs(withGoal[k] - noGoal[k]) + Math.abs(withGoal[k + 1] - noGoal[k + 1]) + Math.abs(withGoal[k + 2] - noGoal[k + 2]) > 40) diff++;
    out.goalPx = diff / ((cv.width / 960) * (cv.width / 960)); performance.now = now0;
    const gk = progressGoal(G.save.flags); out.goal = { key: gk, room: gk ? pgGoalRoom(gk, G.save.flags) : null, text: t('map_goal'), here: t('map_here') };
    return out; });
  console.log('── map-read  — the map is the cavity, softly drawn, with a you-are-here she cannot miss and the errand marked');
  const ids = Object.keys(R.A);
  check('A  rooms are charted finer than a tile, with a soft edge', ids.every(id => R.A[id].perTile >= 5 && R.A[id].soft > 0.008), R.A);
  check('B  the rock is left empty: a chart is a cavity, not a filled box', ids.every(id => R.A[id].clear > 0.08));
  check('   ...and its outline is not ruled: walls and roofs wander', ids.every(id => R.A[id].lefts >= 3 && R.A[id].tops >= 4), ids.map(id => id + ' ' + R.A[id].lefts + '/' + R.A[id].tops).join(', '));
  const px = (m) => m.white / (m.scale * m.scale);
  check('C  YOU ARE HERE covers a real patch of the screen', px(R.fit) > 260, Math.round(px(R.fit)) + ' px of marker at the fitted view (the old dot was ~38)');
  check('   ...the same at any zoom', px(R.near) > 260 && px(R.far) > 260, { near: Math.round(px(R.near)), far: Math.round(px(R.far)) });
  check('D  the errand has a room, and the map carries a gold mark for it', !!R.goal.room && R.goalPx > 150, { goal: R.goal, markPx: Math.round(R.goalPx) });
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — the map reads as ground, and she is on it'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
