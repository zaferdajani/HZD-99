// COMBAT FAIRNESS, MEASURED. Three questions the redesign has to answer with
// numbers: does every enemy now have a wind-up long enough for a child to react
// to, does each one do something DIFFERENT, and did the unreadable boss moves
// get their warnings.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); });
  await p.waitForTimeout(600);

  const r = await p.evaluate(() => {
    const out = { budget: {}, enemies: {}, zone: {}, boss: {} };
    // 1. the reaction budget, as shipped, at each pace setting
    for (let i = 0; i < PACE_STEPS.length; i++)
      out.budget[Math.round(PACE_STEPS[i] * 100) + '%'] =
        { swipe: +(TELL_SWIPE / PACE_STEPS[i]).toFixed(2), minion: +(TELL_FAST / PACE_STEPS[i]).toFixed(2) };

    // 2. each enemy: drive it next to the player and watch what it does
    loadRoom('A0');
    for (const kind of ['crawler', 'flier', 'turret', 'hopper', 'blob', 'bat']) {
      G.enemies.length = 0; G.pools = [];
      // the airborne kinds start in the air — the bat hangs where a ceiling
      // would be, and its trigger is "she is BENEATH it"
      const e = new Enemy(kind, 260, (kind === 'flier' || kind === 'bat') ? 15 * TILE - 210 : 15 * TILE - 4);
      G.enemies.push(e);
      player.x = 170; player.y = 15 * TILE - 40; player.vx = 0; player.vy = 0; player.iT = 999;
      const seen = new Set(); let tellFrames = 0, telegraphed = false, poolsMade = 0;
      for (let i = 0; i < 600; i++) {
        // hold her beside it every frame — the game loop is still running and
        // would otherwise let her drift out of the enemy's notice
        // stand in front of it, where an enemy is supposed to notice you
        // a flier hunts a standing target; everything else has to be faced
        player.x = kind === 'flier' ? 300 : clamp(e.x + (e.dir || 1) * 90, 40, 700);
        player.y = 15 * TILE - player.h; player.vy = 0; player.on = true; player.iT = 999; player.dead = false;
        e.update(1 / 60);
        const w = Math.max(e.coilT || 0, e.holdT || 0, e.crouchT || 0, e.lockT || 0);
        if (w > 0) { tellFrames++; telegraphed = true; }
        if (e.lungeT > 0) seen.add('lunge');
        if (e.windedT > 0) seen.add('recovery');
        if (e.diveT > 0) seen.add('dive');
        if (e.riseT > 0) seen.add('withdraw');
        if ((G.pools || []).length > poolsMade) { poolsMade = G.pools.length; seen.add('pool'); }
        if (e.burst) seen.add('burst');
        if (e.wasAir) seen.add('leap');
      }
      out.enemies[kind] = { telegraphed, tellSeconds: +(tellFrames / 60).toFixed(2), does: [...seen].join('+') || 'walks' };
    }

    // 3. zone scaling: same frame, different depth
    for (const z of ['A', 'B', 'C', 'D', 'E']) {
      G.roomDef = { zone: z, w: 60, h: 17 };
      const e = new Enemy('crawler', 0, 0);
      out.zone[z] = { hp: e.hp, spd: Math.round(e.spd) };
    }
    return out;
  });

  console.log('REACTION BUDGET (seconds of warning)');
  for (const k in r.budget) console.log('  ' + k.padEnd(6), 'boss swipe', r.budget[k].swipe, ' minion', r.budget[k].minion);
  console.log('\nEVERY ENEMY, AND WHAT IT DOES');
  for (const k in r.enemies) console.log('  ' + k.padEnd(9), JSON.stringify(r.enemies[k]));
  console.log('\nTHE SAME CRAWLER, ZONE BY ZONE');
  for (const k in r.zone) console.log('  zone ' + k, JSON.stringify(r.zone[k]));
  console.log('\npageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
