// GRAVEHORN'S GROUND, AND THE STONE HE HOLDS.
//
// The owner, 2026-11-16, three reports from one fight:
//   "since there's a hill in front of him, he cannot reach beyond it. So I can
//    just simply hide where the crystal is, which I shouldn't be able to reach
//    it until I defeat Rhino."
//   "I was defeated at the last moment in phase 2. But nonetheless, when I
//    returned, it showed me as if I defeated the Rhino, got the marble, and I
//    have it now without actually having it."
//
// Measured before: a rock shelf three tiles high stood between his floor and
// the stone's hollow (a wall to a body that cannot climb) with a bowl behind it
// narrower than he is; and a charged burst thrown beside the stone mid-fight
// cracked it, put the marble in her bag, and the load-time migration then read
// that save as "the quarry he had already left" and wrote him out.
//
//   A  his floor runs level from the mouth to the back wall, and the stone
//      stands at the end of it with no room behind it and no ledge over it;
//   B  standing at the stone is not a place to sit the fight out: he comes all
//      the way, and she is hit;
//   C  ...nor is anywhere else on the floor (five spots, each held still);
//   D  while he lives the stone does not break — a charged burst beside it
//      rings, says why, and leaves no marble in the bag;
//   E  once he is DRIVEN OFF it breaks as it always did, and the win is
//      recorded (ghWon);
//   F  the save it already happened to is put right: the marble goes back into
//      its rock and he goes back onto it;
//   G  ...and the saves it did not happen to are left alone (a real win with
//      the stone still standing; a real win carrying the marble home; a save
//      from before he existed).
//
//   node tests/gravehorn-ground.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── gravehorn-ground — no ground he cannot stand on, and a stone that holds while he does');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const out = {};
      const fresh = (flags, bag) => { const sv = newSave(1); sv.time = 99;
        Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, beacon: 1 }, flags || {});
        if (bag) sv.bag = Object.assign({}, bag); startGame(sv);
        loadRoom('CV3'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.bossEntry = null; return G.boss; };
      const quiet = () => { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); if (G.state === 'DIALOG') G.state = 'PLAY'; G.bossEntry = null; };
      const floorAt = (x) => { const g = groundColumnAt(x); return g && g.length ? Math.min.apply(null, g) : null; };
      const stone = () => G.statics.find(q => q.type === 'pillar');
      const wake = (b) => { player.x = b.x - 300; player.y = floorAt(player.x + 14) - player.h - 1;
        for (let i = 0; i < 900 && (b.st === 'dorm' || b.st === 'ghwake' || b.st === 'ghspeak' || b.st === 'ghbellow' || G.dialog); i++) { player.iT = 9; update(1 / 60); quiet(); } };
      // ---- A: the ground ----
      let b = fresh({ ghMet: 1 });
      { const ys = []; for (let tx = 2; tx <= 52; tx++) ys.push(floorAt(tx * TILE + 16));
        const st = stone(), wallX = (() => { for (let tx = Math.floor((st.x + st.w / 2) / TILE); tx < G.roomDef.w; tx++) if (solidAt(tx, Math.floor((st.y + st.h - 8) / TILE))) return tx * TILE; return null; })();
        let ledge = 0; for (let tx = Math.floor(st.x / TILE) - 1; tx < G.roomDef.w; tx++) for (let ty = 5; ty <= 14; ty++) if (!solidAt(tx, ty) && solidAt(tx, ty + 1) && tx * TILE >= wallX) ledge++;
        out.ground = { min: Math.min.apply(null, ys), max: Math.max.apply(null, ys), holes: ys.filter(y => y == null).length, behind: wallX == null ? null : Math.round(wallX - (st.x + st.w)), her: player.w, ledge, bossW: b.w }; }
      // ---- B, C: nowhere to sit it out ----
      const sit = (xOf, secs) => { b = fresh({ ghMet: 1 }); wake(b); const st = stone(); const x = xOf(st);
        player.cores = 99; let hits = 0, last = player.cores, nearest = 1e9, right = 0;
        for (let i = 0; i < secs * 60; i++) {
          player.x = x; player.y = floorAt(x + player.w / 2) - player.h - 0.5; player.vx = 0; player.vy = 0; player.on = true;
          if (player.iT > 0.4) player.iT = 0.4;
          update(1 / 60); quiet();
          if (player.dead) { player.dead = false; G.state = 'PLAY'; }
          if (player.cores < last) hits += last - player.cores; last = player.cores; if (player.cores < 50) { player.cores = 99; last = 99; }
          nearest = Math.min(nearest, Math.abs(b.cx() - (x + player.w / 2))); right = Math.max(right, b.x + b.w); }
        return { x: Math.round(x), hits, nearest: Math.round(nearest), reached: Math.round(right) }; };
      out.atStone = sit(st => st.x + st.w / 2 - 14, 30);
      out.behind = sit(() => { for (let tx = 40; tx < G.roomDef.w; tx++) if (solidAt(tx, 14)) return tx * TILE - player.w - 1; return 1600; }, 30);
      out.spots = [300, 700, 1100, 1400].map(x => sit(() => x, 22));
      // ---- D: the stone holds while he does ----
      b = fresh({ ghMet: 1 }); wake(b);
      { const st = stone(); player.x = st.x - 36; player.y = floorAt(player.x + 14) - player.h - 1; player.volts = 100; player.chargeT = 1; player.iT = 9;
        G.toasts = []; player.releaseCharged();
        out.held = { stands: !!stone(), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard), holds: ghHoldsStone(), told: (G.toasts || []).map(q => q.text || q.t || q).join('|').indexOf(t('grv_stone_held')) >= 0 }; }
      // ---- E: driven off, it breaks ----
      { ghGone(b); out.gone = { won: !!G.save.flags.ghWon, horn: !!G.save.flags.bossHorn, holds: ghHoldsStone() };
        const st = stone(); player.x = st.x - 36; player.y = floorAt(player.x + 14) - player.h - 1; player.volts = 100; player.chargeT = 1;
        // the release is the claws' burst here (no blade yet)
        player.releaseCharged();
        out.broke = { stands: !!stone(), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard) };
        loadRoom('CV3'); out.afterReload = { boss: !!(G.boss && !G.boss.dead), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard), horn: !!G.save.flags.bossHorn }; }
      // ---- F: the save it happened to ----
      b = fresh({ ghMet: 1, pl_cshard: 1, bossHorn: 1 }, { cshard: 1 });
      out.repaired = { boss: !!(b && b.kind === 'horn' && !b.dead), stone: !!stone(), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard), horn: !!G.save.flags.bossHorn, goal: progressGoal(G.save.flags) };
      // ---- G: the saves it did not happen to ----
      b = fresh({ ghMet: 1, bossHorn: 1 });                     // a real win, stone still standing
      out.oldWin = { boss: !!(G.boss && !G.boss.dead), stone: !!stone(), won: !!G.save.flags.ghWon, horn: !!G.save.flags.bossHorn };
      G.save.flags.pl_cshard = 1; G.save.bag = { cshard: 1 }; loadRoom('CV3');   // ...and she cracks it and comes back
      out.oldWinThen = { boss: !!(G.boss && !G.boss.dead), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard) };
      b = fresh({ ghMet: 1, ghWon: 1, bossHorn: 1, pl_cshard: 1 }, { cshard: 1 });   // a recorded win, carrying it home
      out.newWin = { boss: !!(G.boss && !G.boss.dead), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard) };
      b = fresh({ pl_cshard: 1 }, { cshard: 1 });               // from before he existed: never met
      out.preRhino = { boss: !!(G.boss && !G.boss.dead), flag: !!G.save.flags.pl_cshard, bag: !!(G.save.bag && G.save.bag.cshard), horn: !!G.save.flags.bossHorn };
      b = fresh({ ghMet: 1, crystal: 1, pl_cshard: 1, bossHorn: 1 });   // already forged: nothing to take back
      out.forged = { boss: !!(G.boss && !G.boss.dead), flag: !!G.save.flags.pl_cshard, crystal: !!G.save.flags.crystal };
      return out;
    });
    const g = R.ground;
    check('A  his floor runs level from the mouth to the back wall', g.holes === 0 && g.max - g.min <= 34, 'surface between y ' + g.min + ' and ' + g.max + ' over tiles 2-52');
    check('A  ...the stone stands at the end of it, set into the wall, with no room behind it', g.behind != null && g.behind < g.her, g.behind + ' px between the stone and the wall (she is ' + g.her + ' wide)');
    check('A  ...and no ledge over the wall behind it', g.ledge === 0, g.ledge + ' standable tiles beyond the wall line');
    check('B  standing at the stone is not a place to sit the fight out: he comes all the way', R.atStone.nearest < 150, 'his centre came within ' + R.atStone.nearest + ' px of her; his body reached x ' + R.atStone.reached);
    check('B  ...and she is hit there', R.atStone.hits >= 2, R.atStone.hits + ' cores lost in 30 s standing still');
    check('B  ...and pressed against the wall behind it', R.behind.hits >= 2, R.behind.hits + ' cores lost in 30 s');
    check('C  nowhere else on the floor either', R.spots.every(s => s.hits >= 2), R.spots.map(s => 'x' + s.x + ': ' + s.hits).join(', '));
    check('D  while he lives the stone does not break: no marble in the bag', R.held.holds && R.held.stands && !R.held.flag && !R.held.bag, JSON.stringify(R.held));
    check('D  ...and it says why', R.held.told);
    check('E  driven off, the win is recorded', R.gone.won && R.gone.horn && !R.gone.holds, JSON.stringify(R.gone));
    check('E  ...and the stone breaks as it always did, and stays broken', !R.broke.stands && R.broke.flag && R.broke.bag && !R.afterReload.boss && R.afterReload.flag && R.afterReload.bag, JSON.stringify(R.broke) + ' ' + JSON.stringify(R.afterReload));
    check('F  the save it happened to is put right: the marble back in its rock, him back on it', R.repaired.boss && R.repaired.stone && !R.repaired.flag && !R.repaired.bag && !R.repaired.horn && R.repaired.goal === 'pg_goal_gravehorn', JSON.stringify(R.repaired));
    check('G  a real win with the stone still standing is a win (and is recorded as one)', !R.oldWin.boss && R.oldWin.stone && R.oldWin.won && !R.oldWinThen.boss && R.oldWinThen.flag && R.oldWinThen.bag, JSON.stringify(R.oldWin) + ' ' + JSON.stringify(R.oldWinThen));
    check('G  ...a recorded win carrying the marble home keeps it', !R.newWin.boss && R.newWin.flag && R.newWin.bag, JSON.stringify(R.newWin));
    check('G  ...a save from before he existed never meets him', !R.preRhino.boss && R.preRhino.flag && R.preRhino.bag && R.preRhino.horn, JSON.stringify(R.preRhino));
    check('G  ...and a forged blade is never taken back', !R.forged.boss && R.forged.flag && R.forged.crystal, JSON.stringify(R.forged));
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\ngravehorn-ground: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
