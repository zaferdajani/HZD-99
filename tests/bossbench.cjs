// A SAVE POINT BEFORE EVERY BOSS (owner's order, 2026-11-14).
//
// From the review of what keeps a player in a game of this kind: the walk back
// after a death is where the controller goes down (it was the loudest complaint
// about Silksong's checkpoints). Ten rooms here led into a guardian or a
// sub-boss with the nearest rest two to four rooms behind.
//
// The rule, measured off the world list and then in the live room:
//   - every room that holds a boss has a pod in a room that leads INTO it — one
//     door away — not counting a guardian's own lair, which only opens after
//     the fight it belongs to is over;
//   - and every pod in the game stands on something, clear of a hazard rail.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const ids = Object.keys(ROOMS);
    const lair = id => /^G[A-EX]\d/.test(id);
    const nb = id => { const out = new Set(), ex = ROOMS[id].exits || {};
      for (const k in ex) { const v = ex[k], to = typeof v === 'object' ? v.to : v; if (to && ROOMS[to]) out.add(to); }
      const gr = typeof GATE_ROOM !== 'undefined' && GATE_ROOM[id];
      for (const d of [].concat(gr || [])) if (d && d.to && ROOMS[d.to]) out.add(d.to);
      return [...out]; };
    const into = {}; for (const id of ids) for (const n of nb(id)) (into[n] = into[n] || new Set()).add(id);
    const hasBench = id => (ROOMS[id].ents || []).some(e => e[0] === 'bench');
    const bosses = [], far = [];
    for (const id of ids) for (const e of ROOMS[id].ents || []) {
      if (e[0] !== 'boss') continue;
      const ways = [...new Set([...(into[id] || []), ...nb(id)])].filter(q => !lair(q));
      const rest = hasBench(id) ? [id] : ways.filter(hasBench);
      bosses.push(id + ':' + e[3]);
      if (!rest.length) far.push(id + ' (' + e[3] + ') — approached from ' + ways.join(', ') + ', none with a pod');
    }
    // every pod, in its live room
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2; startGame(sv);
    const sol = ch => ch === '#' || ch === '=' || ch === 'B';
    const pods = [], bad = [];
    for (const id of ids) {
      if (!hasBench(id)) continue;
      try { loadRoom(id); } catch (e) { bad.push(id + ' failed to load'); continue; }
      for (const s of G.statics) { if (s.type !== 'bench') continue;
        pods.push(id);
        const cx = s.x + s.w / 2, fy = s.y + s.h, tx = Math.floor(cx / TILE), row = Math.round(fy / TILE);
        // ground within a tile under its feet (a cave's floor curve sits a little
        // below the row the pod is written on, and the plate carries its own base)
        const under = sol(tileAt(tx, row)) || sol(tileAt(tx, row + 1));
        let rail = false; for (let dx = -2; dx <= 2; dx++) for (let dy = -1; dy <= 1; dy++) if (tileAt(tx + dx, row + dy) === '^') rail = true;
        // the pod is a dome four tiles wide and nearly five tall: it needs the room
        let roof = false; for (let dy = 1; dy <= 4; dy++) if (sol(tileAt(tx, row - dy))) roof = true;
        // (the den's pod is built INTO its corner on purpose — world.js A0B)
        const W = G.grid[0].length, edge = id !== 'A0B' && (tx < 3 || tx > W - 4);
        const wall = tileAt(tx - 2, row - 1) === '#' || tileAt(tx + 2, row - 1) === '#';
        const why = (under ? '' : ' floats') + (rail ? ' beside a rail' : '') + (roof ? ' under a roof it does not fit' : '') + (edge ? ' cut by the room edge' : '') + (wall ? ' into a wall' : '');
        if (why) bad.push(id + ' pod at ' + tx + ',' + row + why);
      }
    }
    return { bosses, far, pods: pods.length, bad };
  });
  check('every boss room has a save point one door away (' + r.bosses.length + ' bosses)', r.bosses.length >= 12 && r.far.length === 0, r.far.join(' | '));
  check('every pod stands on something, clear of a hazard (' + r.pods + ' pods)', r.pods >= 15 && r.bad.length === 0, r.bad.join(' | '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — a death before a guardian is a short walk back');
})().catch(e => { console.error(e); process.exit(1); });
