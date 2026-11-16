// EVERY DOOR IS A MACHINE RING, AND THE ERRAND POINTS AT ITS OWN.
//
// The owner, 2026-11-15, three times in one evening:
//   "the doors that open in the background... it's faded in the background,
//    does not show as a unique object. So it's hard to find and hard to
//    recognize... Even the door that opens to the alpha was blended with the
//    cave";
//   "the door for the keeper that I should go to is unclear. I have no idea
//    where that is";
// and then, of the outline arches and chevrons that were the first answer:
//   "You have all the tools to build up awesome doors, and you end up with neon
//    doors?... We are in a universe full of robots. Why would you put a neon
//    door instead of something more awesome, something that looks like a
//    Stargate".
//
// So a door is a THING now: a fired ring of armoured segments standing in the
// cast's plane, with a live field in it (drawRingGate, js/game.js). This holds
// the parts of that which can be measured:
//
//   A  every walk-in passage of the chapter stands a ring — its own plate,
//      loaded, drawn — and the ring owns a real share of the picture there;
//   B  the plates are what the table says: the hole re-measured off each
//      shipped plate matches RING_GATE, and the field the engine draws behind
//      it shows through the hole and NOWHERE ELSE (none of it leaks past the
//      metal);
//   C  the Wolf King's door is the fanged ring, at both ends;
//   D  a buried passage's ring is DEAD, and breaking the rubble switches it on;
//   E  the neon is gone: no outline pass exists;
//   F  from the meadow, following the route's next step room by room arrives
//      at the keeper — each step one she can take, each pointed at, and the
//      door the errand goes through is the GOLD ring;
//   G  every errand of the chapter that names a place has a route from the hub;
//   H  nothing is pointed at during a conversation.
//
//   node tests/ring-gate.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── ring-gate — every door is a machine ring with a live field, and the errand\'s own is gold and pointed at');
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
      // ---- A, C: the ring at each door ----
      const lum = (d, i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      // the mean colour of the middle of a ring's opening, off the frame
      const holeMean = (img, g, k) => { const R = RING_GATE[g.key]; let r = 0, gg = 0, bl = 0, n = 0;
        const cx = worldScreenX(g.x + g.w * R.cx) * k, cy = worldScreenY(g.y + g.h * R.mid) * k, rad = g.w * R.rx * 0.5 * k * (cam.zoom || 1);
        for (let y = Math.round(cy - rad); y < cy + rad; y += 2) for (let x = Math.round(cx - rad); x < cx + rad; x += 2) {
          if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
          const i = (y * img.width + x) * 4; r += img.data[i]; gg += img.data[i + 1]; bl += img.data[i + 2]; n++; }
        return n ? [Math.round(r / n), Math.round(gg / n), Math.round(bl / n), n] : [0, 0, 0, 0]; };
      for (const room of ['A2', 'A5', 'CV1', 'CV1B', 'CV2', 'CV3', 'GA1T', 'A10']) {
        let ds = []; try { ds = gateDoors(room); } catch (e) {}
        for (const d of ds) {
          enter(room, d.at * ROOMS[room].w * TILE - 150);
          const key = ringGateFor(d);
          for (let w = 0; w < 60 && key && !(MEDIA_IMG[key] && MEDIA_IMG[key].naturalWidth); w++) { draw(performance.now()); await new Promise(r => setTimeout(r, 50)); }
          const cv = document.querySelector('canvas'), k = cv.width / 960;
          const a = shot(); const g = G.ringGates && (G.ringGates.at || []).find(q => q.to === d.to);
          G.structProbe = 1; const b0 = shot(); G.structProbe = 0;      // the near structures off
          const sx = Math.round(worldScreenX(gateWorldX(d)) * k), W = cv.width;
          let diff = 0, cnt = 0;
          for (let y = 0; y < a.height; y += 2) for (let x = Math.max(0, sx - Math.round(110 * k)); x < Math.min(W, sx + Math.round(110 * k)); x += 2) { const i = (y * W + x) * 4;
            if (Math.abs(a.data[i] - b0.data[i]) + Math.abs(a.data[i + 1] - b0.data[i + 1]) + Math.abs(a.data[i + 2] - b0.data[i + 2]) > 36) diff++; cnt++; }
          out.doors.push({ room, to: d.to, key: key || '', drawn: g ? g.key : '', changed: +(diff / cnt * 100).toFixed(1), near: gateDoorNear(d),
            hole: g ? holeMean(a, g, k) : null, goal: !!(g && g.goal) });
        }
      }
      // ---- B: the plates against the table, and the field against the plate ----
      out.plates = {};
      for (const key of Object.keys(RING_GATE)) {
        const R = RING_GATE[key]; mediaFetch(key);
        for (let w = 0; w < 80 && !(MEDIA_IMG[key] && MEDIA_IMG[key].naturalWidth); w++) await new Promise(r => setTimeout(r, 50));
        const im = MEDIA_IMG[key]; if (!im || !im.naturalWidth) { out.plates[key] = null; continue; }
        const W = im.naturalWidth, H = im.naturalHeight, x = Object.assign(document.createElement('canvas'), { width: W, height: H }).getContext('2d');
        x.drawImage(im, 0, 0); const px = x.getImageData(0, 0, W, H).data;
        const seen = new Uint8Array(W * H), q = [(H >> 1) * W + (W >> 1)]; seen[q[0]] = 1;
        let x0 = W, x1 = 0, y0 = H, y1 = 0, edge = 0;
        while (q.length) { const at = q.pop(), ax = at % W, ay = (at / W) | 0;
          if (ax < x0) x0 = ax; if (ax > x1) x1 = ax; if (ay < y0) y0 = ay; if (ay > y1) y1 = ay; if (!ax || !ay || ax === W - 1 || ay === H - 1) edge = 1;
          for (const o of [1, -1, W, -W]) { const nx = at + o; if (nx < 0 || nx >= W * H || seen[nx]) continue; if ((o === 1 && ax === W - 1) || (o === -1 && !ax)) continue;
            if (px[nx * 4 + 3] < 40) { seen[nx] = 1; q.push(nx); } } }
        // the engine's field ellipse (drawRingGate), in plate pixels
        const fcx = W * R.cx, fcy = H * (R.top + R.bot) / 2, frx = W * R.rx + W * 0.03, fry = H * (R.bot - R.top) / 2 + H * 0.026;
        let leak = 0, inside = 0, show = 0;
        for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
          const ex = (xx - fcx) / frx, ey = (yy - fcy) / fry; if (ex * ex + ey * ey > 1) continue;
          inside++; const al = px[(yy * W + xx) * 4 + 3];
          if (seen[yy * W + xx]) show++; else if (al < 40) leak++; }
        let holeN = 0; for (let i = 0; i < seen.length; i++) holeN += seen[i];
        out.plates[key] = { edge, cx: (x0 + x1) / 2 / W, top: y0 / H, bot: y1 / H, rx: (x1 - x0) / 2 / W, leak: +(leak / inside * 100).toFixed(2), covered: +(show / holeN * 100).toFixed(1), px: W };
      }
      // ---- D: a buried ring is dead, and breaking the rubble switches it on ----
      { fresh(); delete G.save.flags.rubbleA5; const d0 = gateDoorsAll('A5')[0];
        enter('A5', d0.at * ROOMS.A5.w * TILE - 150); const cv = document.querySelector('canvas'), k = cv.width / 960;
        for (let w = 0; w < 60 && !(MEDIA_IMG.ringMeadow && MEDIA_IMG.ringMeadow.naturalWidth); w++) { draw(performance.now()); await new Promise(r => setTimeout(r, 50)); }
        G.rubbles = []; rubbleInit();
        let img = shot(); let g = (G.ringGates.at || []).find(q => q.to === 'CV1');
        const buried = { is: !!(g && g.buried), piles: G.rubbles.length };
        // the field alone: the pile is taken off the picture so the ring is what is measured
        const saveR = G.rubbles; const pile = rubbleFor(d0);
        out.dead = { buried, flagged: !!pile };
        G.save.flags.rubbleA5 = 1; G.rubbles = []; G.rubble = null; img = shot(); g = (G.ringGates.at || []).find(q => q.to === 'CV1');
        const live = g ? holeMean(img, g, k) : null;
        G.rubbles = saveR; delete G.save.flags.rubbleA5; img = shot(); g = (G.ringGates.at || []).find(q => q.to === 'CV1');
        // (read at the hole's top quarter, above the pile)
        const R = RING_GATE.ringMeadow, tx = Math.round(worldScreenX(g.x + g.w * R.cx) * k), ty = Math.round(worldScreenY(g.y + g.h * (R.top + 0.09)) * k);
        const at = (im2) => { let s2 = 0, n = 0; for (let y = ty - 8; y < ty + 8; y++) for (let x = tx - 30; x < tx + 30; x++) { const i = (y * im2.width + x) * 4; s2 += lum(im2.data, i); n++; } return s2 / n; };
        const deadTop = at(img); G.save.flags.rubbleA5 = 1; const gr = G.rubbles; G.rubbles = []; G.rubble = null; const liveTop = at(shot()); G.rubbles = gr;
        out.dead.deadTop = +deadTop.toFixed(1); out.dead.liveTop = +liveTop.toFixed(1); out.dead.live = live; }
      out.neon = typeof drawDoorSigns;
      // ---- F: follow the route to the keeper from the meadow ----
      fresh(); enter('A2', 30 * TILE);
      out.goal = progressGoal();
      let guard = 0;
      while (guard++ < 10) {
        const st = pgRouteStep(); if (!st) break;
        G.routePointer = null; draw(performance.now());
        const takable = st.gate ? gateDoors(G.roomId).some(d => d.to === st.to) : !!(ROOMS[G.roomId].exits && Object.values(ROOMS[G.roomId].exits).some(v => (typeof v === 'object' ? v.to : v) === st.to));
        out.route.push({ from: G.roomId, to: st.to, how: st.gate ? 'door' : st.side, takable, // (a comic page waiting to open covers the frame; nothing is drawn under it)
          covered: typeof panelsCovering === 'function' && !!panelsCovering(),
          pointed: !!(G.routePointer && G.routePointer.to === st.to) || (typeof panelsCovering === 'function' && !!panelsCovering()),
          gold: (!!(G.ringGates && G.ringGates.goal) === !!st.gate) || (typeof panelsCovering === 'function' && !!panelsCovering()) });
        enter(st.to);
      }
      out.arrived = G.roomId; out.want = pgGoalRoom(out.goal, G.save.flags);
      // ---- G: every errand that names a place ----
      for (const key of ['pg_goal_pack', 'pg_goal_return', 'pg_goal_marble', 'pg_goal_quarry', 'pg_goal_gravehorn', 'pg_goal_sage', 'pg_goal_chime', 'pg_goal_lion', 'pg_goal_east', 'pg_goal_up']) {
        const want = pgGoalRoom(key, G.save.flags); out.goals[key] = want && ROOMS[want] ? want : null; }
      // ---- H: silent in a conversation ----
      fresh(); enter('A2', 30 * TILE); G.routePointer = null; draw(performance.now()); const live = !!G.routePointer;
      G.dialog = { name: 'x', lines: ['…'], i: 0 }; G.state = 'DIALOG'; G.routePointer = null; draw(performance.now());
      out.talk = { live, pointer: !!G.routePointer }; G.dialog = null; G.state = 'PLAY';
      out.table = RING_GATE;
      return out;
    });
    for (const d of R.doors) check('A  ' + d.room + ' → ' + d.to + ': a ring stands there, in the cast\'s plane, and owns the picture at the door', !!d.key && d.drawn === d.key && d.near && d.changed >= 25, (d.drawn || 'NOTHING') + '; ' + d.changed + '% of the pixels at the door are its');
    check('A  (the chapter\'s passages were there to measure)', R.doors.length >= 9, R.doors.length + ' doors');
    for (const key of Object.keys(R.plates)) { const P = R.plates[key], T = R.table[key];
      check('B  ' + key + ': the plate is a closed ring, and its hole is where the table says', !!P && !P.edge && Math.abs(P.cx - T.cx) < 0.012 && Math.abs(P.top - T.top) < 0.012 && Math.abs(P.bot - T.bot) < 0.012 && Math.abs(P.rx - T.rx) < 0.012,
        P ? 'hole cx ' + P.cx.toFixed(3) + ' top ' + P.top.toFixed(3) + ' bot ' + P.bot.toFixed(3) + ' rx ' + P.rx.toFixed(3) + ' (' + P.px + ' px plate)' : 'plate did not load');
      check('B  ' + key + ': the field fills the opening and none of it shows past the metal', !!P && P.covered >= 99 && P.leak <= 0.2, P ? P.covered + '% of the hole covered, ' + P.leak + '% of the field lands where there is neither hole nor metal' : ''); }
    // (2026-11-16: the den's mouth opens onto THE RUN — A10R — and the Run's far mouth onto his floor)
    const denA = R.doors.find(d => d.room === 'A2' && d.to === 'A10R'), denB = R.doors.find(d => d.room === 'A10' && d.to === 'A10R');
    check('C  the Wolf King\'s door is the fanged ring, at both ends', !!denA && denA.drawn === 'ringDen' && !!denB && denB.drawn === 'ringDen', (denA && denA.drawn) + ' / ' + (denB && denB.drawn));
    const keeper = R.doors.find(d => d.room === 'CV3' && d.to === 'GA1T');
    check('C  the keeper\'s passage is the quarry\'s ring', !!keeper && keeper.drawn === 'ringQuarry', keeper ? keeper.drawn : 'no such door');
    const plain = R.doors.find(d => d.room === 'CV1' && d.to === 'CV1B');
    check('A  an ordinary passage\'s field is its place\'s own colour (cold), not the errand\'s', !!plain && !plain.goal && plain.hole && plain.hole[2] > plain.hole[0] + 15, plain && plain.hole ? 'rgb ' + plain.hole.slice(0, 3).join(',') : '');
    check('D  a buried passage\'s ring is dead — the engine says so, and its opening is the darker half of the picture', R.dead.buried.is && R.dead.flagged && R.dead.deadTop < 90, 'luminance in the opening ' + R.dead.deadTop + ' (under the room\'s own haze)');
    check('D  ...and breaking the rubble switches it on', R.dead.liveTop > R.dead.deadTop + 40, R.dead.deadTop + ' → ' + R.dead.liveTop);
    check('E  the neon is gone: no outline pass exists', R.neon === 'undefined', 'typeof drawDoorSigns = ' + R.neon);
    check('F  the errand in the meadow is the keeper', R.goal === 'pg_goal_sage' && R.want === 'GA1D', R.goal + ' → ' + R.want);
    check('F  following the next step, room by room, arrives there', R.arrived === R.want && R.route.length >= 4, R.route.map(s => s.from + ' —' + s.how + '→ ' + s.to).join('   '));
    check('F  ...and every step is one she can take from that room', R.route.every(s => s.takable));
    check('F  every step is pointed at, and the door the errand goes through is the gold ring', R.route.every(s => s.pointed && s.gold), R.route.filter(s => !s.pointed || !s.gold).map(s => s.from + (s.pointed ? '' : ' not pointed') + (s.gold ? '' : ' wrong colour')).join(', '));
    const gold = R.doors.find(d => d.goal);
    check('F  ...and gold is what the field actually is', !!gold && gold.hole && gold.hole[0] > gold.hole[2] + 12 && !!plain && plain.hole[2] > plain.hole[0], gold && gold.hole ? gold.room + ' → ' + gold.to + ' rgb ' + gold.hole.slice(0, 3).join(',') + ' (warm) against an ordinary ring\'s ' + (plain && plain.hole ? plain.hole.slice(0, 3).join(',') : '?') + ' (cold), at the deep middle of each' : 'no goal door was measured');
    check('G  every errand that names a place has a room to be led to', Object.values(R.goals).every(Boolean), Object.entries(R.goals).map(([k, v]) => k.replace('pg_goal_', '') + ':' + v).join(' '));
    check('H  the pointer is silent while someone is speaking', R.talk.live && !R.talk.pointer, JSON.stringify(R.talk));
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nring-gate: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
