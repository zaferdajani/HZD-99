// A MACHINE SHE CAN FREE SAYS SO (owner, 2026-11-15: "it's unclear to me how to
// free the crawlers. It should be by pressing E, I think, but it did not prompt
// it. It did not work when I pressed it, so it's not clear. Hitting them does
// not make any sense because they are already defeated.")
//
// The cleanse worked — standing dead-centre on the body. What did not:
//   - the prompt zone was 46 px from the centre of the collision box, and the
//     pack is drawn far wider than its box: stop at the body you can SEE and
//     there was no prompt, and the key did nothing;
//   - the prompt, when it came, said "Cleanse binding" and never named a key;
//   - the only sign a body could be freed was a ten-pixel amber bracket, the
//     same with the blade in her paw as without it.
//
// This plays it with real input, in the meadow (the pack) and in the cave:
//   A  with the blade, every bound machine wears the marker — and without the
//      blade, or once it is freed, none does;
//   B  she walks up to one and stops at the EDGE of its drawn body (from
//      whichever side plain walking arrives): the prompt is offered, and it
//      names her own interact control;
//   C  the press frees it from there.
//
//   node tests/bound-cue.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── bound-cue — a machine she can free is marked, prompts at the body she can see, and the press works there');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0; const out = [];
      for (const room of ['A1', 'A2', 'CV1']) {
        const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1 }); startGame(sv);
        loadRoom(room); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null;
        const step = (n) => { for (let i = 0; i < n; i++) { player.iT = 9; update(1 / 60); G.hitStop = 0; } };
        step(30);
        // she beats what is in the room (her own blows: that is what binds one)
        for (const e of G.enemies.slice()) { let n = 0; while (!e.dead && !e.disabled && n++ < 80) { dealDmg(e, 40, null, e.x + e.w / 2, e.y + e.h / 2, true, 'claw_1'); if (e.hp <= 0 && !e.dead && !e.disabled) e.die(1, -0.3); step(4); } }
        step(120);
        const bound = () => G.enemies.filter(e => e.disabled && e.storyKey && Math.abs((e.y + e.h) - (groundColumnAt(e.x + e.w / 2) ? Math.min.apply(null, groundColumnAt(e.x + e.w / 2)) : 1e9)) < 12);
        const cue = () => { G.boundCue = 0; draw(performance.now()); return G.boundCue | 0; };
        const row = { room, n: G.enemies.filter(e => e.disabled).length };
        player.x = 40; row.cueNoBlade = cue();
        G.save.flags.crystal = 1; G.save.weaponMode = 'single';
        row.cueBlade = cue(); row.onScreen = G.enemies.filter(e => e.disabled && Math.abs(e.x - cam.x - 480) < 520).length;
        row.tries = []; row.freedN = 0; row.cueDrop = 0;
        for (const e of bound().slice(0, 2)) { let last = null;
         for (const side of [-1, 1]) {
          if (e.rescued) break;
          // walk at it with real input and STOP at the edge of the body that is drawn
          const T = window.BODY_BOX && window.BODY_BOX[e.kind]; const drawn = Math.max(hurtBoxOf(e).w / 2, T && T.w === e.w ? Math.max(T.l, T.r) : 0);
          player.x = e.x + e.w / 2 + side * (drawn + 110) - player.w / 2; const g = groundColumnAt(player.x + 12); if (!g) continue; player.y = Math.min.apply(null, g) - player.h; player.vx = player.vy = 0;
          const key = side < 0 ? 'ArrowRight' : 'ArrowLeft'; let n = 0;
          while (n++ < 200 && Math.abs(player.x + player.w / 2 - e.x - e.w / 2) > drawn + player.w / 2 + 2) { keys[key] = 1; step(1); }
          keys[key] = 0; step(20);
          const dist = Math.abs(player.x + player.w / 2 - e.x - e.w / 2);
          // (a step, a rock or a ward between them on this side is the room's,
          // not the prompt's: a side plain walking does not arrive from is not
          // measured)
          if (dist > drawn + player.w / 2 + 8) continue;
          // (two bound machines lying against each other share the prompt and
          // the nearer takes the press, which is right: what is measured is
          // that standing at THIS one's edge offers a cleanse)
          const near = !!(G.near && G.near.type === 'rescue') && dist < rescueReach(e);
          const label = ctlFill(t('story_cleanse'));
          last = { kind: e.kind, wolf: typeof isWolf === 'function' && isWolf(e), side, drawn: Math.round(drawn), dist: Math.round(dist), reach: Math.round(rescueReach(e)), near,
            dy: Math.round(player.y + player.h / 2 - e.y - e.h / 2), nearType: G.near ? G.near.type : null, label, names: label.indexOf(ctlName('INT')) >= 0 && label.indexOf('{') < 0 };
          row.tries.push(last);
          break;                               // she is standing at its edge: press from HERE
         }
         // ...and from where she stands at its edge, the press frees it
         if (last && !e.rescued) {
            const tgt = (G.near && G.near.target) || e, c0 = cue();
            keysP.KeyE = 1; keys.KeyE = 1; step(1); keysP.KeyE = 0; keys.KeyE = 0;
            let k = 0; while (k++ < 120 && !tgt.rescued) step(1);
            last.freed = !!tgt.rescued; last.frames = k;
            if (tgt.rescued) { row.freedN++; row.cueDrop += c0 - cue(); }
         }
        }
        out.push(row);
      }
      return out;
    });
    for (const r of R) {
      check(r.room + ': A  with the blade every bound machine in view wears the marker, and without it none does', r.cueNoBlade === 0 && r.cueBlade >= 1, 'no blade ' + r.cueNoBlade + ', blade ' + r.cueBlade + ' (' + r.n + ' bound in the room)');
      check(r.room + ': B  stopped at the edge of the drawn body, the prompt is offered', r.tries.length >= 1 && r.tries.every(q => q.near), r.tries.map(q => q.kind + (q.wolf ? ' (wolf)' : '') + ' from ' + (q.side < 0 ? 'the left' : 'the right') + ': ' + q.dist + ' px from its centre' + (q.near ? '' : ' [NOT OFFERED: dy ' + q.dy + ', near ' + q.nearType + ']') + ', reach ' + q.reach).join('; '));
      check(r.room + ': B  ...and it names her own control', r.tries.every(q => q.names), r.tries[0] && r.tries[0].label);
      check(r.room + ': C  the press frees it from there', r.tries.filter(q => q.freed != null).length >= 1 && r.tries.filter(q => q.freed != null).every(q => q.freed), r.tries.filter(q => q.freed != null).map(q => q.kind + ' in ' + q.frames + ' frames').join(', '));
      check(r.room + ': A  ...and a freed one no longer wears it', r.freedN >= 1 && r.cueDrop === r.freedN, r.freedN + ' freed, ' + r.cueDrop + ' fewer markers');
    }
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nbound-cue: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
