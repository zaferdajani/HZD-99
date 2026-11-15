// A DOOR SAYS IT IS A DOOR, AND THE ERRAND POINTS AT ITS OWN (owner,
// 2026-11-15: "the doors that open in the background... it's faded in the
// background, does not show as a unique object. So it's hard to find and hard
// to recognize... Even the door that opens to the alpha was blended with the
// cave"; and "the door for the keeper that I should go to is unclear. I have no
// idea where that is.")
//
// Measured before: the Wolf King's door was two faint rings on a wall — the
// meadow has no gate plate, so it fell through to the city monument drawn at a
// third strength in the far plane. The keeper's passage was a soft blue haze.
// And the goal line named "the door beside the marble quarry" to a player three
// rooms and a hatch away from it.
//
//   A  every depth door that exists wears the sign (outline, floor light,
//      chevrons), and the sign changes the picture at the door by a real
//      amount — in the meadow, the room below it, the caves and the quarry;
//   B  the Wolf King's door is a den mouth standing in the cast's plane;
//   C  from the meadow, following the route's next step room by room arrives
//      at the keeper — and each step is one she can take;
//   D  the door the errand goes through is the gold one, and it is pointed at;
//   E  every errand of the chapter that names a place has a route from the hub;
//   F  nothing is pointed at during a conversation.
//
//   node tests/door-signs.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── door-signs — every door is marked as one, and the errand\'s own door is gold and pointed at');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const FL = { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, crystal: 1, pl_cshard: 1, beacon: 1, bossHorn: 1, ghMet: 1, gateOpened: 1 };
      const fresh = (extra) => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FL, extra || {}); sv.weaponMode = 'single'; sv.broken = { 'A2:12,15': 1, 'A2:13,15': 1, 'A2:14,15': 1, 'A2:12,16': 1, 'A2:13,16': 1, 'A2:14,16': 1 }; startGame(sv); };
      const enter = (room, x) => { loadRoom(room); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = []; G.toasts = [];
        if (x != null) { player.x = x; const g = groundColumnAt(x + 12); if (g) player.y = Math.min.apply(null, g) - player.h; }
        for (let i = 0; i < 90; i++) { player.iT = 9; player.vx = 0; update(1 / 60); }
        // (a room's comic pages play once on entering; they are let play and put
        // away — nothing is pointed at over a page, which is right)
        for (let k = 0; k < 8 && (G.state !== 'PLAY' || G.panels); k++) { G.panels = null; G.state = 'PLAY'; for (let i = 0; i < 240; i++) { player.iT = 9; player.vx = 0; update(1 / 60); } } };
      const shot = () => { draw(performance.now()); const cv = document.querySelector('canvas'); return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height); };
      const out = { doors: [], route: [], goals: {} };
      fresh();
      // ---- A, B: the sign at each door ----
      for (const room of ['A0', 'A2', 'A5', 'CV1', 'CV2', 'CV3', 'A10']) {
        let ds = []; try { ds = gateDoors(room); } catch (e) {}
        for (const d of ds) {
          enter(room, d.at * ROOMS[room].w * TILE - 150);
          const cv = document.querySelector('canvas'), k = cv.width / 960;
          G.doorSigns = null; const a = shot(); const n = G.doorSigns ? G.doorSigns.n : 0;
          G.structProbe = 1; const b0 = shot(); G.structProbe = 0;      // the near structures AND their signs off
          const sx = Math.round(worldScreenX(gateWorldX(d)) * k), W = cv.width;
          let diff = 0, cnt = 0;
          for (let y = 0; y < a.height; y += 2) for (let x = Math.max(0, sx - Math.round(70 * k)); x < Math.min(W, sx + Math.round(70 * k)); x += 2) { const i = (y * W + x) * 4;
            if (Math.abs(a.data[i] - b0.data[i]) + Math.abs(a.data[i + 1] - b0.data[i + 1]) + Math.abs(a.data[i + 2] - b0.data[i + 2]) > 36) diff++; cnt++; }
          out.doors.push({ room, to: d.to, n, changed: +(diff / cnt * 100).toFixed(1), style: d.style || '', near: gateDoorNear(d) });
        }
      }
      // ---- C, D: follow the route to the keeper from the meadow ----
      fresh(); enter('A2', 30 * TILE);
      out.goal = progressGoal();
      let guard = 0;
      while (guard++ < 10) {
        const st = pgRouteStep(); if (!st) break;
        G.routePointer = null; G.doorSigns = null; draw(performance.now());
        const takable = st.gate ? gateDoors(G.roomId).some(d => d.to === st.to) : !!(ROOMS[G.roomId].exits && Object.values(ROOMS[G.roomId].exits).some(v => (typeof v === 'object' ? v.to : v) === st.to));
        out.route.push({ from: G.roomId, to: st.to, how: st.gate ? 'door' : st.side, takable, // (a comic page waiting to open covers the frame; nothing is drawn under it)
          covered: typeof panelsCovering === 'function' && !!panelsCovering(),
          pointed: !!(G.routePointer && G.routePointer.to === st.to) || (typeof panelsCovering === 'function' && !!panelsCovering()),
          gold: (!!(G.doorSigns && G.doorSigns.goal) === !!st.gate) || (typeof panelsCovering === 'function' && !!panelsCovering()) });
        enter(st.to);
      }
      out.arrived = G.roomId; out.want = pgGoalRoom(out.goal, G.save.flags);
      // ---- E: every errand that names a place ----
      for (const key of ['pg_goal_pack', 'pg_goal_return', 'pg_goal_marble', 'pg_goal_quarry', 'pg_goal_gravehorn', 'pg_goal_sage', 'pg_goal_chime', 'pg_goal_lion', 'pg_goal_east', 'pg_goal_up']) {
        const want = pgGoalRoom(key, G.save.flags); out.goals[key] = want && ROOMS[want] ? want : null; }
      // ---- F: silent in a conversation ----
      fresh(); enter('A2', 30 * TILE); G.routePointer = null; draw(performance.now()); const live = !!G.routePointer;
      G.dialog = { name: 'x', lines: ['…'], i: 0 }; G.state = 'DIALOG'; G.routePointer = null; G.doorSigns = null; draw(performance.now());
      out.talk = { live, pointer: !!G.routePointer, signs: !!G.doorSigns }; G.dialog = null; G.state = 'PLAY';
      return out;
    });
    for (const d of R.doors) check('A  ' + d.room + ' → ' + d.to + ': the door wears the sign, and it changes the picture there', d.n >= 1 && d.changed >= 4, d.n + ' sign(s) drawn; ' + d.changed + '% of the pixels at the door differ from the bare wall');
    check('A  (the chapter\'s doors were there to measure)', R.doors.length >= 8, R.doors.length + ' doors');
    const den = R.doors.find(d => d.room === 'A2' && d.to === 'A10');
    check('B  the Wolf King\'s door is a den mouth standing in the cast\'s plane', !!den && den.style === 'den' && den.near && den.changed >= 12, den ? den.changed + '% of the pixels at it (it was two faint rings)' : 'no such door');
    check('C  the errand in the meadow is the keeper', R.goal === 'pg_goal_sage' && R.want === 'GA1D', R.goal + ' → ' + R.want);
    check('C  following the next step, room by room, arrives there', R.arrived === R.want && R.route.length >= 4, R.route.map(s => s.from + ' —' + s.how + '→ ' + s.to).join('   '));
    check('C  ...and every step is one she can take from that room', R.route.every(s => s.takable));
    check('D  every step is pointed at, and the door the errand goes through is the gold one', R.route.every(s => s.pointed && s.gold), R.route.filter(s => !s.pointed || !s.gold).map(s => s.from + (s.pointed ? '' : ' not pointed') + (s.gold ? '' : ' wrong colour')).join(', '));
    check('E  every errand that names a place has a room to be led to', Object.values(R.goals).every(Boolean), Object.entries(R.goals).map(([k, v]) => k.replace('pg_goal_', '') + ':' + v).join(' '));
    check('F  the pointer and the signs are silent while someone is speaking', R.talk.live && !R.talk.pointer && !R.talk.signs, JSON.stringify(R.talk));
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\ndoor-signs: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
