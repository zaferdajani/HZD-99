// A GUARDIAN IS A TEST OF SKILL, MEASURED BY THREE PLAYERS WHO ARE NOT PEOPLE.
//
// The owner, 2026-11-15, having beaten the Wolf King: "defeating them while the
// alpha was super easy. There was no challenge. You did not create any kind of
// attacks, super attacks, special attacks, movements, jumping around, howling...
// The attack was so easy, the fight was so easy. There was no challenge, there
// was no skill testing at all." And of the rhino: "hitting the rhino downward
// with a hit constantly is an easy hack to beat it, which should not happen."
//
// Both were true and neither could be seen by reading the code, because the
// code HAD the moves. What it did not have was a reason to face them. So three
// bots fight each guardian here, on the real build, with her real inputs:
//
//   MASH   walks up and presses ATTACK twelve times a second. Never dodges.
//          Before: the Alpha dead in 8.5 s for three cores, having thrown one
//          claw, one leap and its fury — the rend, howl and roar never seen.
//   POGO   jumps on its back and strikes DOWN, over and over.
//          Before: the Alpha dead in 20 s, and she was never touched.
//   SKILL  reads the wind-up, gets out of the blow, strikes in the opening.
//
// The law: the two that do not read the fight LOSE it, the one that does WINS
// it, and winning it means having been shown the whole kit.
//
//   node tests/boss-skill.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  const errors = [];
  const fight = async (room, mode, bot, r) => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    p.on('pageerror', e => errors.push(String(e)));
    await p.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => typeof startGame === 'function');
    const res = await p.evaluate(({ room, mode, bot, seed }) => { window.requestAnimationFrame = () => 0;
      let h = seed * 2654435761 >>> 0; Math.random = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9 >>> 0) % 100000) / 100000;
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, crystal: 1, pl_cshard: 1, beacon: 1, bossHorn: 1, ghMet: 1, gateOpened: 1 });
      if (room === 'CV3') { delete sv.flags.bossHorn; delete sv.flags.crystal; delete sv.flags.pl_cshard; }
      sv.weaponMode = mode; startGame(sv); loadRoom(room); const srcs = []; const h0 = player.hurt.bind(player); player.hurt = function (d, fx2, src, foe) { const c0 = player.cores; const r = h0(d, fx2, src, foe); if (player.cores < c0) srcs.push(src || '?'); return r; };
      const clear = () => { if (G.dialog || G.cut || G.panels || G.meet || G.state !== 'PLAY') { G.dialog = G.cut = G.panels = G.meet = G.wake = null; G.state = 'PLAY'; } };
      const st = {}, hits = {}; let chains = 0, last = '', frames = 0, hp0 = player.cores, dmg = 0, lastHp = player.cores, bl = -1, bhits = [], hurtAt = [], deaths = 0, dealt = 0, bhp = 0, t0 = -1;
      const B = () => G.boss || G.enemies.find(e => e.kind === 'alpha' || e.boss);
      for (; frames < 60 * 150; frames++) {
        clear(); const bo = B(); if (!bo) { update(1 / 60); continue; }
        if (t0 < 0 && !{ dorm: 1, intro: 1, ghwake: 1, ghspeak: 1, ghbellow: 1 }[bo.st]) { t0 = frames; bhp = bo.hpMax; }
        if (bo.st !== last) { st[bo.st] = (st[bo.st] || 0) + 1; if (bo.st === 'coil' && last === 'leap') chains++; last = bo.st; }
        if (bo.dead || bo.purified || bo.tamed || bo.hp <= 0) break;
        for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
        const dx = bo.cx() - (player.x + player.w / 2), adx = Math.abs(dx), REACH = bo.w / 2 + player.w / 2 + 22;
        if (bot === 'mash') {
          if (adx > REACH) keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; else if (Math.sign(dx) !== player.face) keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1;
          if (frames % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; }
        } else if (bot === 'skill') {
          const s2 = bo.st, away = dx > 0 ? 'ArrowLeft' : 'ArrowRight', toward = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
          const W = G.roomDef.w * TILE, pc = player.x + player.w / 2;
          const wallBehind = dx > 0 ? pc < 150 : pc > W - 150;
          const open = s2 === 'rest' || s2 === 'idle' || s2 === 'turn' || s2 === 'recoil';
          let jump = false;
          const inFront = (Math.sign(pc - bo.cx()) || 1) === (bo.rendDir || bo.face);
          for (const w of (bo.rends || [])) { const d = (pc - w.x) * w.dir; if (d > -20 && d < 130) jump = true; }
          if (s2 === 'clawwarn' || s2 === 'claw') { if (adx < 135) { if (wallBehind) { keys[toward] = 1; jump = true; } else keys[away] = 1; } }
          else if (s2 === 'bitewarn' || s2 === 'bite') { if (adx < 100) { if (wallBehind) { keys[toward] = 1; jump = true; } else keys[away] = 1; } }
          else if (s2 === 'coil' || s2 === 'leap' || s2 === 'spring') {
            if (s2 === 'spring') { /* it is leaving: hold ground */ }
            else if (wallBehind) { keys[toward] = 1; if (s2 !== 'coil' || bo.t < 0.12) jump = true; } else keys[away] = 1;
            if (bo.fury && s2 === 'leap' && bo.vy > -60 && Math.abs((bo.quakeX == null ? bo.cx() : bo.quakeX) - pc) < 170) jump = true;
          }
          else if (s2 === 'rendwarn' || s2 === 'rend') {
            // the wave runs the floor in front of it: be in the air as it is thrown
            if (inFront && adx < 340 && (s2 === 'rend' || bo.t < 0.09)) jump = true;
            if (adx < 56) keys[away] = 1; else if (adx > 80 && s2 === 'rendwarn') keys[toward] = 1;
            if (adx < 90 && player.on && frames % 5 === 0 && s2 === 'rendwarn' && bo.t > 0.15) { keysP.KeyX = 1; keys.KeyX = 1; }
          }
          else if (s2 === 'roarwarn' || s2 === 'roar' || s2 === 'furywarn' || s2 === 'fury') { if (adx < 290 && !wallBehind) keys[away] = 1; }
          else if (s2 === 'skywarn' || s2 === 'sky') { if (adx < 90) keys[away] = 1; }
          else {
            // an opening (or the howl's wind-up): close and strike
            if (adx > REACH) keys[toward] = 1; else if (Math.sign(dx) !== player.face) keys[toward] = 1;
            if (adx < REACH + 14 && frames % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; }
          }
          // a beta inside her reach is dealt with first, unless the king's own blow is the nearer danger
          { let w = null, wd = 120; for (const e of G.enemies) { if (e.dead || e.disabled || e.rescued) continue; const d = Math.abs(e.x + e.w / 2 - pc); if (d < wd && Math.abs(e.y - player.y) < 70) { wd = d; w = e; } }
            const kingBusy = (s2 === 'clawwarn' || s2 === 'claw' || s2 === 'bitewarn' || s2 === 'bite') && adx < 140 || s2 === 'coil' || s2 === 'leap' || ((s2 === 'rendwarn' || s2 === 'rend') && inFront);
            if (w && !kingBusy) { const wdx = w.x + w.w / 2 - pc; keys.ArrowLeft = keys.ArrowRight = 0;
              if (Math.abs(wdx) > 46) keys[wdx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; else if (Math.sign(wdx) !== player.face) keys[wdx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1;
              if (frames % 5 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } } }
          if (jump && player.on) { keysP.Space = 1; } if (jump || !player.on) keys.Space = 1;
        } else {
          if (adx > 26) keys[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1;
          if (player.on && adx < 120 && frames % 3 === 0) { keysP.Space = 1; } keys.Space = 1;
          if (!player.on && player.y + player.h < bo.y + 10) { keys.ArrowDown = 1; if (frames % 4 === 0) { keysP.KeyX = 1; keys.KeyX = 1; } }
        }
        const pre = bo.hp; update(1 / 60); if (bo.hp < pre) bhits.push(Math.round(pre - bo.hp));
        if (player.cores < lastHp) { dmg += lastHp - player.cores; hurtAt.push(bo.st); } lastHp = player.cores;
        if (player.dead) { deaths++; break; }
      }
      const bo = B();
      return { bot, secs: +((frames - Math.max(0, t0)) / 60).toFixed(1), won: !!(bo && (bo.dead || bo.purified || bo.tamed || bo.hp <= 0)), died: deaths, dmg, hp0, bossHp: bo ? Math.round(bo.hp) + '/' + bo.hpMax : '?', fury: !!(bo && bo.fury), states: st, hits: bhits.length, hitSizes: [...new Set(bhits)].sort((a, b) => a - b).join('/'), hurtAt, srcs, chains, wolves: G.enemies.filter(e => !e.dead).length };
    }, { room, mode, bot, seed: r + 1 });

    await p.close(); return res;
  };
  const sum = (o, ks) => ks.reduce((n, k) => n + (o[k] || 0), 0);
  try {
    console.log('── boss-skill — mashing loses, bouncing on its back loses, reading it wins');
    // ---- THE WOLF KING ----
    const A = { mash: [], pogo: [], skill: [] };
    for (const bot of ['mash', 'pogo', 'skill']) for (let r = 0; r < 3; r++) A[bot].push(await fight('A10', 'single', bot, r));
    const line = d => d.secs + ' s, ' + (d.won ? 'won' : d.died ? 'DIED' : 'timed out') + ', ' + d.dmg + ' cores lost, king at ' + d.bossHp;
    check('ALPHA  mash: a player who only presses ATTACK never beats it', A.mash.every(d => !d.won), A.mash.map(line).join(' | '));
    check('ALPHA  ...and is not close: the king still has a third of its health when she falls', A.mash.every(d => d.died && parseInt(d.bossHp, 10) >= 658 * 0.33), A.mash.map(d => d.bossHp).join(' | '));
    check('ALPHA  ...because a blow thrown into its attack turns on its hide (two fifths)', A.mash.every(d => /(^|\/)(7|8|10)(\/|$)/.test(d.hitSizes) && /(^|\/)18(\/|$)/.test(d.hitSizes)), 'blows landed for ' + A.mash[0].hitSizes);
    check('ALPHA  ...and it will not be stood next to: it springs clear of a mash', A.mash.every(d => (d.states.spring || 0) >= 2), A.mash.map(d => (d.states.spring || 0) + ' springs').join(' | '));
    check('ALPHA  pogo: bouncing on its back never beats it', A.pogo.every(d => !d.won), A.pogo.map(line).join(' | '));
    check('ALPHA  ...it answers the air above it: the skybite is what stops her', A.pogo.every(d => d.srcs.filter(s2 => s2 === 'alpha.sky').length >= 2), A.pogo.map(d => d.srcs.join(',')).join(' | '));
    check('ALPHA  ...and each bounce without touching the floor is worth less', A.pogo.every(d => { const z = d.hitSizes.split('/').map(Number); return Math.min.apply(null, z) <= Math.max.apply(null, z) * 0.4; }), 'blows landed for ' + A.pogo[0].hitSizes);
    const wins = A.skill.filter(d => d.won);
    check('ALPHA  skill: a player who reads it wins', wins.length >= 2, A.skill.map(line).join(' | '));
    check('ALPHA  ...in a fight, not a formality and not a siege (25–100 s)', wins.length > 0 && wins.every(d => d.secs >= 25 && d.secs <= 100), wins.map(d => d.secs + ' s').join(' | '));
    check('ALPHA  ...with something left (at most four of five cores lost)', wins.length > 0 && wins.every(d => d.dmg <= 4), wins.map(d => d.dmg).join(' | '));
    const kit = d => ({ howl: d.states.howl || 0, rend: d.states.rend || 0, leap: d.states.leap || 0, roar: d.states.roar || 0, close: sum(d.states, ['claw', 'bite']), spring: d.states.spring || 0, fury: d.states.fury || 0 });
    check('ALPHA  ...and winning it means having been shown the kit: the howl, the rend, the leap, the roar, claw and bite, the spring, the fury',
      wins.length > 0 && wins.every(d => { const k = kit(d); return k.howl >= 1 && k.rend >= 2 && k.leap >= 3 && k.roar >= 1 && k.close >= 2 && k.spring >= 1 && k.fury === 1; }),
      wins.map(d => JSON.stringify(kit(d))).join(' | '));
    check('ALPHA  ...including the fury\'s chain: after half health it pounces more than once without resting', wins.length > 0 && wins.some(d => (d.chains || 0) >= 1), wins.map(d => (d.chains || 0) + ' chained pounces').join(' | '));
    // ---- GRAVEHORN ----
    // (his own harness, tests/gravehorn.cjs, carries the player who reads him: its autopilot jumps the
    // charge, turns the toss and takes the hornless window, and must win. Here: the two who do not.)
    const H = { mash: [], pogo: [] };
    for (const bot of ['mash', 'pogo']) for (let r = 0; r < 3; r++) H[bot].push(await fight('CV3', 'single', bot, r));
    check('GRAVEHORN  mash: a player who only presses ATTACK never beats him', H.mash.every(d => !d.won), H.mash.map(line).join(' | '));
    check('GRAVEHORN  ...the toss is not turned by a mash: a parry is one clean strike', H.mash.every(d => !(d.states.stagger > 0) && d.srcs.indexOf('horn.toss') >= 0), H.mash.map(d => (d.states.stagger || 0) + ' parries, hurt by ' + d.srcs.join(',')).join(' | '));
    check('GRAVEHORN  pogo: bouncing on his back never beats him', H.pogo.every(d => !d.won), H.pogo.map(line).join(' | '));
    check('GRAVEHORN  ...and it does not get her there: he has more than half of the phase\'s health when she falls', H.pogo.every(d => d.died && parseInt(d.bossHp, 10) >= 329 * 0.5), H.pogo.map(d => d.bossHp).join(' | '));
    check('GRAVEHORN  ...struck from above, he bucks', H.pogo.some(d => d.srcs.indexOf('horn.buck') >= 0 || (d.states.buck || 0) > 0), H.pogo.map(d => (d.states.buck || 0) + ' bucks').join(' | '));
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await b.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nboss-skill: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
