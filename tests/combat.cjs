// COMBAT FAIRNESS, MEASURED. Three questions the redesign has to answer with
// numbers: does every enemy now have a wind-up long enough for a child to react
// to, does each one do something DIFFERENT, and did the unreadable boss moves
// get their warnings.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
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
    for (const kind of ['crawler', 'flier', 'turret', 'hopper', 'blob', 'bat', 'surge', 'kiln', 'rime', 'snare']) {
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
        if ((e.waves || []).length) seen.add('wave');
        if ((e.plumeT || 0) > 0) seen.add('plume');
        if ((e.ringR || 0) > 0) seen.add('ring');
        if ((e.reelT || 0) > 0) seen.add('reel');
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

  // 4. KNOCKBACK PER ATTACK (handoff A2). Not the velocity a blow writes —
  // tests/attacks.cjs reads that — but what the player SEES: how far a live
  // crawler, running its own physics, is carried by each move before its
  // brain takes over again. A finisher has to throw farther than a jab, the
  // thrown blade is a spear, and a multi-hit pins rather than scatters.
  const kb = await p.evaluate(() => {
    loadRoom('A0');
    G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.save.flags.woke = 1; G.save.flags.heal = 1;
    const DT = 1 / 60, FLOOR = 15 * TILE;
    const clear = () => { for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyX']) { keys[k] = 0; keysP[k] = 0; } };
    const stage = (mode) => {
      clear();
      const f = G.save.flags;
      f.crystal = mode !== 'claws' ? 1 : 0; f.crystal2 = (mode === 'dual' || mode === 'joined') ? 1 : 0; f.connector = mode === 'joined' ? 1 : 0;
      G.save.weaponMode = mode; G.save.skills = []; G.boomer = null; G.projs.length = 0;
      Object.assign(player, { x: 170, y: FLOOR - player.h, vx: 0, vy: 0, on: true, face: 1, faceVis: 1, swing: null, swingVis: null,
        atkCD: 0, atkBuf: 0, combo: 0, comboT: 0, chargeT: 0, swirlT: 0, swirlTick: 0, clawT: 0, volts: 99, iT: 999, dashT: 0, grap: null });
      G.enemies.length = 0; G.hitStop = 0;
      const e = new Enemy('crawler', 0, 0);
      e.x = player.x + player.w + 14; e.y = FLOOR - e.h; e.hp = e.hpMax = 99999;
      G.enemies.push(e);
      return e;
    };
    // a frame trace of the body after contact: x every 4 frames while thrown
    const carried = (e, x0) => {
      const trace = [];
      for (let i = 0; i < 60 && e.kbT > 0; i++) { e.update(DT); if (i % 4 === 0) trace.push(Math.round(e.x - x0)); }
      return { dist: Math.round(e.x - x0), trace };
    };
    const melee = (combo) => {
      const e = stage('claws');
      if (combo) { player.combo = combo - 1; player.comboT = 0.5; }
      const x0 = e.x, hp0 = e.hp;
      keys.KeyX = 1; keysP.KeyX = 1;
      for (let i = 0; i < 6 && e.hp === hp0; i++) { player.update(DT); keysP.KeyX = 0; keys.KeyX = 0; player.iT = 999; }
      clear();
      return Object.assign({ hit: e.hp < hp0 }, carried(e, x0));
    };
    const out = { jab: melee(0), finisher: melee(2) };
    // the thrown blade, out along its flight
    {
      const e = stage('joined'); e.x += 60; const x0 = e.x, hp0 = e.hp;
      player.chargeT = 1; player.releaseCharged();
      for (let i = 0; i < 40 && e.hp === hp0; i++) { player.update(DT); player.iT = 999; }
      out.throw = Object.assign({ hit: e.hp < hp0 }, carried(e, x0));
      G.boomer = null;
    }
    // the swirl: the crawler WALKS (its own brain, every frame) inside the
    // ring for the whole move; how far does it get?
    {
      const e = stage('dual'); e.x = player.x + 20; const x0 = e.x, hp0 = e.hp;
      player.chargeT = 1; player.releaseCharged();
      const trace = []; let maxDrift = 0, inRing = 0, passes = 0;
      for (let i = 0; i < 42; i++) {
        const h = e.hp;
        player.update(DT); e.update(DT); player.iT = 999;
        if (e.hp < h) { passes++; const d = Math.abs((e.x + e.w / 2) - (player.x + player.w / 2)); if (d <= SWIRL_R + Math.max(e.w, e.h) / 2) inRing++; }
        maxDrift = Math.max(maxDrift, Math.abs(e.x - x0));
        if (i % 6 === 0) trace.push(Math.round(e.x - x0));
      }
      out.swirl = { hit: e.hp < hp0, passes, inRing, maxDrift: Math.round(maxDrift), trace };
    }
    clear(); G.enemies.length = 0;
    return out;
  });
  const kfails = [];
  const kcheck = (name, ok, note) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : '')); if (!ok) kfails.push(name); };

  console.log('REACTION BUDGET (seconds of warning)');
  for (const k in r.budget) console.log('  ' + k.padEnd(6), 'boss swipe', r.budget[k].swipe, ' minion', r.budget[k].minion);
  console.log('\nEVERY ENEMY, AND WHAT IT DOES');
  for (const k in r.enemies) console.log('  ' + k.padEnd(9), JSON.stringify(r.enemies[k]));
  console.log('\nTHE SAME CRAWLER, ZONE BY ZONE');
  for (const k in r.zone) console.log('  zone ' + k, JSON.stringify(r.zone[k]));
  console.log('\nKNOCKBACK PER ATTACK (px a live crawler is carried; x every 4 frames while thrown)');
  for (const k of ['jab', 'finisher', 'throw']) console.log('  ' + k.padEnd(9), (kb[k].dist + ' px').padStart(7), '  trace', kb[k].trace.join(' '));
  console.log('  swirl    ', ('drifts ' + kb.swirl.maxDrift + ' px').padStart(7), '  ' + kb.swirl.passes + ' passes, ' + kb.swirl.inRing + ' in the ring   trace', kb.swirl.trace.join(' '));
  kcheck('every move connects', kb.jab.hit && kb.finisher.hit && kb.throw.hit && kb.swirl.hit);
  kcheck('a finisher throws farther than a jab', kb.finisher.dist > kb.jab.dist * 1.3, kb.jab.dist + ' px -> ' + kb.finisher.dist + ' px');
  kcheck('the thrown blade carries farther than a jab (a spear)', kb.throw.dist > kb.jab.dist * 1.2, kb.throw.dist + ' px vs ' + kb.jab.dist + ' px');
  kcheck('a multi-hit PINS: the swirl holds a walking crawler in its ring for every pass', kb.swirl.passes === 4 && kb.swirl.inRing === 4 && kb.swirl.maxDrift < 24,
    kb.swirl.passes + ' passes, ' + kb.swirl.inRing + ' in the ring, drift ' + kb.swirl.maxDrift + ' px');
  kcheck('no page errors', !errs.length);
  console.log('\npageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
  if (kfails.length) { console.log('\n' + kfails.length + ' combat check(s) failed'); process.exit(1); }
})();
