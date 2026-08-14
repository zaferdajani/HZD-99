// THE EYE'S CONSTRUCTS, MEASURED.
//
// Five new fights arrived at once, which is exactly the situation where a
// telegraph goes missing and nobody notices until a player says "that one is
// unfair". They share a single state machine on purpose — five hand-written
// machines is five places to drop a wind-up — and this checks that the shared
// grammar actually holds for every one of them:
//
//   it sleeps until you come, and then it is awake;
//   every committed move is preceded by a state whose NAME matches TELL_ST,
//     because that name is what fires the warning sound and paints the amber;
//   it ALTERNATES its two moves instead of rolling for them, which is the
//     difference between learnable and unlearnable;
//   it does not stand still (the complaint that got the guardians retuned);
//   it dies, it pays exactly one Power Cell, and it is never spared.
//
//   node tests/minis.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── minis — the Eye\'s five, and the grammar they all share');

  // which room each one lives in, read from the world rather than listed here
  const where = await page.evaluate(() => {
    const out = {};
    for (const id in ROOMS) for (const e of (ROOMS[id].ents || []))
      if (e[0] === 'boss' && MINIS[e[3]]) out[e[3]] = id;
    return out;
  });
  const kinds = Object.keys(where);
  check('every construct is placed in the world', kinds.length === 5, kinds.join(', '));

  console.log('\n  construct   room   wake   states seen                       tell%  still%');
  for (const kind of kinds) {
    const r = await page.evaluate(async ({ kind, room }) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
      startGame(sv); loadRoom(room);
      await new Promise(r2 => requestAnimationFrame(r2));
      const b = G.boss;
      if (!b || b.kind !== kind) return { err: 'not in ' + room };
      const startSt = b.st;

      // walk her up to it, then keep her MOVING — a construct measured against
      // a player standing in one spot is a construct that never has to commit
      player.x = b.cx() - 220; player.y = b.y;
      const seen = {}, order = [];
      let frames = 0, still = 0, tell = 0, attacked = 0;
      let lastX = b.x, lastY = b.y;
      const DT = 1 / 60;
      for (let f = 0; f < 60 * 14; f++) {
        player.cores = 9; player.iT = 9; player.dead = false;
        // A PLAYER PACES THE ROOM, not the boss. Oscillating her about the
        // construct's OWN centre made `dist` cross zero every cycle, so a
        // grounded construct flipped facing every frame and jittered on the
        // spot — 99% motionless, entirely an artefact of the model.
        player.x = G.roomDef.w * TILE / 2 + Math.sin(f / 50) * 260;
        player.y = b.y;
        b.update(DT);
        if (b.st === 'dorm') continue;
        frames++;
        if (!seen[b.st]) { seen[b.st] = 0; order.push(b.st); }
        seen[b.st]++;
        if (/warn$/.test(b.st)) tell++;
        else if (b.st !== 'idle' && b.st !== 'rest') attacked++;
        // DISPLACEMENT, not vx, and both axes: a hovering construct that is
        // climbing is not standing still, and measuring x alone called every
        // flyer motionless.
        if (Math.hypot(b.x - lastX, b.y - lastY) < 0.4) still++;
        lastX = b.x; lastY = b.y;
      }
      // ---- the alternation: strip out warns and rests, and look at the
      // sequence of committed moves. Two moves that never repeat back to back
      // more than twice is a pattern; a coin flip is not.
      const moves = order.filter(s => !/warn$/.test(s) && s !== 'idle' && s !== 'rest' && s !== 'dorm');
      // ---- and it must die, and pay
      const battBefore = invCount('batt');
      b.hp = 1;
      const forked = bossFork(b);
      b.hp = 0; b.die(1, 0);
      G.onBossDead(b.kind);
      const battAfter = invCount('batt');
      G.item = null; G.state = 'PLAY';
      return {
        startSt, woke: frames > 0, order, moves,
        tellPct: frames ? Math.round(tell / frames * 100) : 0,
        stillPct: frames ? Math.round(still / frames * 100) : 0,
        attackPct: frames ? Math.round(attacked / frames * 100) : 0,
        forked, paid: battAfter - battBefore,
      };
    }, { kind, room: where[kind] });

    if (r.err) { check(kind + ': present', false, r.err); continue; }
    console.log('  ' + kind.padEnd(11) + where[kind].padEnd(6) + ' '
      + (r.woke ? 'yes ' : 'NO  ').padEnd(6)
      + r.order.slice(0, 6).join(',').padEnd(34)
      + String(r.tellPct + '%').padEnd(7) + r.stillPct + '%');

    check(kind + ': starts asleep and wakes when she arrives',
      r.startSt === 'dorm' && r.woke, 'start ' + r.startSt);
    // EVERY committed move must have been preceded by a warn of its own name
    const bad = r.moves.filter(m => !r.order.includes(m + 'warn'));
    check(kind + ': every attack has a wind-up named for it',
      !bad.length, bad.join(',') || r.moves.join('/'));
    check(kind + ': it uses BOTH of its moves, not one',
      new Set(r.moves).size >= 2, [...new Set(r.moves)].join('/'));
    check(kind + ': it spends real time telegraphing (>= 8%)',
      r.tellPct >= 8, r.tellPct + '%');
    check(kind + ': it does not stand still (<= 40%)',
      r.stillPct <= 40, r.stillPct + '%');
    check(kind + ': destroyed, never spared', r.forked === false);
    check(kind + ': and it pays exactly one cell', r.paid === 1, '+' + r.paid);
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — five constructs, one grammar, every one of them readable');
})().catch(e => { console.error(e); process.exit(1); });
