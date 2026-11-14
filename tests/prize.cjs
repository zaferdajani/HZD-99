// THE PROMISE: A PRIZE SHE CAN SEE AND CANNOT REACH YET (owner, 2026-11-14).
//
// "Plant a visible, unreachable prize in the first rooms. One ledge with
// something on it that needs a later ability." A deck over the road in A0, the
// first room past the gates, with a lit chest (a core) on it.
//
// Both halves are played with her real body through the real update:
//   WITHOUT the double jump — every running and standing jump from the road
//     under it, both ways, and from the yard gantry toward it. None may land.
//   WITH it — one run, one jump, one more, and she is standing on the deck.
// And it has to be SEEN: standing on the road beneath, the chest is inside the
// frame the camera actually shows.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const fresh = (abil) => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2;
      Object.assign(sv.flags, { ratchetRepaired: 1, 'on_A0B|ratchet': 1, heal: 1, burstDone: 1, opPod: 1, opTold: 1 }); sv.abil = abil || {};
      startGame(sv); loadRoom('A0'); G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = []; G.projs = []; };
    const K = { L: 'ArrowLeft', R: 'ArrowRight', J: 'Space' };
    const clear = () => { for (const k of Object.values(K)) { keys[k] = 0; keysP[k] = 0; } };
    const step = () => { update(1 / 60); keysP[K.J] = 0; };
    const chest = () => G.statics.find(s => s.type === 'chest' && s.extra === 'core');
    const deck = (() => { fresh(); const c = chest(); const ty = Math.round((c.y + c.h) / TILE), tx = Math.floor((c.x + c.w / 2) / TILE);
      let x0 = tx, x1 = tx; while (tileAt(x0 - 1, ty) === '=') x0--; while (tileAt(x1 + 1, ty) === '=') x1++;
      return { ty, x0, x1, top: ty * TILE, cx: (c.x + c.w / 2) }; })();
    const onDeck = () => player.on && Math.abs(player.y + player.h - deck.top) < 6
      && player.x + player.w / 2 > deck.x0 * TILE - 4 && player.x + player.w / 2 < (deck.x1 + 1) * TILE + 4;
    // one attempt: start at tile `from` (standing on whatever is under it at row `row`), run `dir` for `run` frames, jump (held), optionally jump again at `again`
    const attempt = (abil, from, row, dir, run, again) => {
      fresh(abil); clear();
      player.x = from * TILE; player.y = row * TILE - player.h - 2; player.vx = 0; player.vy = 0;
      for (let i = 0; i < 30; i++) step();
      if (!player.on) return { landed: false, skip: true };
      const k = dir > 0 ? K.R : dir < 0 ? K.L : null;
      if (k) keys[k] = 1;
      for (let i = 0; i < run; i++) step();
      keys[K.J] = 1; keysP[K.J] = 1; step();
      let best = 1e9, landed = false;
      for (let i = 0; i < 150; i++) {
        if (again != null && i === again) { keys[K.J] = 0; step(); keys[K.J] = 1; keysP[K.J] = 1; }
        step();
        // how near she came, measured only while she is actually OVER the deck
        const pcx = player.x + player.w / 2;
        if (pcx > deck.x0 * TILE && pcx < (deck.x1 + 1) * TILE) best = Math.min(best, player.y + player.h);
        if (onDeck()) { landed = true; break; }
        if (player.on && i > 8) break;
      }
      clear();
      return { landed, best: Math.round(best) };
    };
    const out = { deck, tries: 0, reached: [], closest: 1e9 };
    // WITHOUT: from the road under and around it, and from the gantry
    const starts = [];
    for (let x = deck.x0 - 12; x <= deck.x1 + 12; x += 1) starts.push([x, 15]);
    for (const x of [36, 37, 38, 39]) starts.push([x, 9]);
    for (const x of [40, 41, 42, 43]) starts.push([x, 10]);
    for (const [x, row] of starts) for (const dir of [-1, 0, 1]) for (const run of [0, 6, 14, 26, 40]) {
      if (dir === 0 && run) continue;
      const a = attempt({}, x, row, dir, run, null);
      if (a.skip) continue;
      out.tries++; out.closest = Math.min(out.closest, a.best - deck.top);
      if (a.landed) out.reached.push(x + ',' + row + ' dir ' + dir + ' run ' + run);
    }
    // WITH the double jump
    out.withJets = [];
    // straight up from the road beneath it: the deck is a walkway, risen through from below
    for (const x of [deck.x0, deck.x0 + 1, deck.x1]) for (const again of [14, 18, 22, 26, 30]) {
      const a = attempt({ djump: 1 }, x, 15, 0, 0, again);
      if (a.landed) out.withJets.push(x + '@' + again);
    }
    // SEEN: on the road beneath it, is the chest in the frame?
    fresh(); player.x = deck.cx - 60; for (let i = 0; i < 120; i++) step();
    const c = chest(), z = cam.zoom || 1;
    const sx = (c.x + c.w / 2 - cam.x - 480) * z + 480, sy = (c.y + c.h / 2 - cam.y - 270) * z + 270;
    out.seen = { sx: Math.round(sx), sy: Math.round(sy), opened: !!c.opened };
    // and taking it pays the core
    fresh({ djump: 1 }); const c2 = chest(); const cores0 = player.maxCores();
    player.x = c2.x; player.y = c2.y + c2.h - player.h; player.vy = 0; for (let i = 0; i < 20; i++) step();
    doInteract(c2); for (let i = 0; i < 10; i++) step();
    out.pay = { before: cores0, after: player.maxCores(), opened: !!c2.opened };
    return out;
  });

  check('the deck stands over the road in the first room past the gates', r.deck.ty === 7 && r.deck.x1 - r.deck.x0 === 2, JSON.stringify(r.deck));
  check('without the double jump NOTHING lands on it (' + r.tries + ' real jumps from the road and the gantry)', r.tries > 150 && r.reached.length === 0, r.reached.slice(0, 4).join(' | '));
  check('...and not by a hair: the best of them is a clear miss', r.closest >= 24 && r.closest < 200, 'closest feet came within ' + r.closest + 'px of the deck top');
  check('with the double jump she is standing on it', r.withJets.length > 0, r.withJets.join(' '));
  check('from the road beneath, the chest is in the frame', r.seen.sx > 60 && r.seen.sx < 900 && r.seen.sy >= 24 && r.seen.sy < 500 && !r.seen.opened, JSON.stringify(r.seen));
  check('...and it is worth coming back for: a whole core', r.pay.opened && r.pay.after === r.pay.before + 1, JSON.stringify(r.pay));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — she can see it, she cannot have it, and later she can');
})().catch(e => { console.error(e); process.exit(1); });
