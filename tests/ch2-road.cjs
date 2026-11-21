// CHAPTER TWO HAS A ROAD (owner, 2026-11-20: "There is no game in the second
// kingdom. We created caves, we created mini bosses for the first game, but
// the second one is super fast with nothing to play").
//
// TALONHOST's hall (B4) was three rooms from the kingdom's way in, and nothing
// named the CARRIER up the relay climb or the agent UNDERTOW. This holds the
// order the kingdom is now played in, and that every step is pointed at:
//   - first the CARRIER (B8): the goal says so and the arrow climbs B2 -> B7;
//   - its fall wakes the ring on the relay gallery's floor (B6), down to
//     UNDERTOW's tunnel — dark before, and the way back out after;
//   - then the swamp (owner, 2026-11-21): the culvert, Bilge's raft, MIREJAW;
//   - the hall past B3 stays shut (with a line saying why) until UNDERTOW is
//     purified, then the vault, the Prowler, the Foundry — and TALONHOST's hall
//     stands EMPTY until the throw is hers; a save already past the eagle
//     keeps its road;
//   - once the eagle falls the gallery ring is withdrawn: it would lead
//     nowhere new;
//   - and a ring whose picture has not arrived stands in as a rock mouth with
//     no line stroked round it (the ledger: no outline round anything).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(() => {
    const base = { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, nfGlimpse: 1, nfMeet: 1, sageTame_GA1D: 1, bossChime: 1, bossGlitch: 1, ch2Climb: 1, bossHorn: 1, mapSeen: 1 };
    const stage = (extra, room) => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, base, extra); startGame(sv); loadRoom(room); G.state = 'PLAY'; G.dialog = null;
      const g = progressGoal(G.save.flags), step = g ? pgRouteStep(pgGoalRoom(g, G.save.flags)) : null;
      return { goal: g, words: g ? t(g) : '', step: step && (step.to || step), doors: gateDoors(room).map(d => d.to + (gateLocked(d) ? '!' : '')), hall: exitOpen(ROOMS.B3.exits.R), why: t(ROOMS.B3.exits.R.why) }; };
    const o = {};
    const C = { bossCarrier: 1 }, M = { bossCarrier: 1, bossMirejaw: 1 }, U = Object.assign({ sageTame_GB1D: 1 }, M);
    o.b1 = stage({}, 'B1'); o.b2 = stage({}, 'B2'); o.b6 = stage({}, 'B6');
    o.b1c = stage(C, 'B1'); o.b2c = stage(C, 'B2');
    o.sw1 = stage(Object.assign({ ferryPaid: 1 }, C), 'SW1');
    o.b1m = stage(M, 'B1'); o.b6c = stage(M, 'B6'); o.tun = stage(M, 'GB1T');
    o.done = stage(U, 'B3');
    o.vault = stage(Object.assign({ vaultOpen: 1 }, U), 'B5');
    o.prow = stage(Object.assign({ vaultOpen: 1, bossPrism: 1 }, U), 'B3');
    o.empty = stage(Object.assign({ vaultOpen: 1, bossPrism: 1 }, U), 'B4');
    o.empty.boss = !!G.boss;
    o.old = stage({ bossBrood: 1 }, 'B3');
    o.after = stage(Object.assign({ vaultOpen: 1, bossPrism: 1, bossAtlas: 1, connector: 1, crystal2: 1, bossBrood: 1 }, U), 'B6');
    // a ring without its picture: no strokes
    const st = stage({ bossCarrier: 1 }, 'B6');
    const d = gateDoors('B6')[0]; player.x = gateWorldX(d) - 60;
    const keys = Object.keys(RING_GATE); const saved = {}; for (const k of keys) { saved[k] = MEDIA_IMG[k]; delete MEDIA_IMG[k]; }
    const mf = window.mediaFetch; window.mediaFetch = () => {};
    const P = CanvasRenderingContext2D.prototype, so = P.stroke; let strokes = 0;
    P.stroke = function () { const e = new Error().stack; if (/drawGateDoor|drawCaveMouth|drawRingGate/.test(e)) strokes++; return so.apply(this, arguments); };
    draw(performance.now());
    P.stroke = so; window.mediaFetch = mf; for (const k of keys) if (saved[k]) MEDIA_IMG[k] = saved[k];
    o.strokes = strokes;
    return o;
  });
  check('first the CARRIER: the goal names it and the arrow climbs to it', R.b1.goal === 'pg_goal_carrier' && R.b1.step === 'B2' && R.b2.step === 'B7', JSON.stringify([R.b1.words, R.b1.step, R.b2.step]));
  check('...the hall is shut, and says why', !R.b1.hall && R.b1.why && !/^gate_/.test(R.b1.why), R.b1.why);
  check('...and the gallery ring stands dark', R.b6.doors.join() === 'GB1T!', R.b6.doors.join());
  check('then the swamp: the arrow goes to the culvert in the long conduit', R.b1c.goal === 'pg_goal_ferry' && R.b2c.doors.indexOf('SW1') >= 0 && R.b2c.step === 'SW1', JSON.stringify([R.b1c.goal, R.b2c.doors, R.b2c.step]));
  check('...and once the fare is paid, across the water to the crocodile', R.sw1.goal === 'pg_goal_mire' && R.sw1.step === 'SW2', JSON.stringify([R.sw1.goal, R.sw1.step]));
  check('then the ring wakes the way to UNDERTOW', R.b1m.goal === 'pg_goal_undertow' && R.b1m.step === 'B6' && R.b6c.doors.join() === 'GB1T' && R.b6c.step === 'GB1T' && R.tun.step === 'GB1D', JSON.stringify([R.b1m.step, R.b6c.doors, R.b6c.step, R.tun.step]));
  check('...and the tunnel has its way back out', R.tun.doors.indexOf('B6') >= 0, R.tun.doors.join());
  check('three seals: the hall opens and the arrow goes on to the vault', R.done.goal === 'pg_goal_vault' && R.done.hall && R.done.step === 'B4', JSON.stringify([R.done.goal, R.done.hall, R.done.step]));
  check('...the vault opens the climb to the Prowler', R.vault.goal === 'pg_goal_prowler' && R.vault.step === 'X1', JSON.stringify([R.vault.goal, R.vault.step]));
  check('the Prowler purified: on to the Foundry', R.prow.goal === 'pg_goal_furnace', R.prow.goal);
  check('TALONHOST\'s hall is empty until she can throw', !R.empty.boss);
  check('a save already past the eagle keeps its road', R.old.hall);
  check('after the eagle the gallery ring is gone (it would lead nowhere new)', R.after.doors.length === 0 && R.after.goal == null, JSON.stringify(R.after));
  check('the goal lines are short', [R.b1, R.b1c, R.sw1, R.done, R.vault, R.prow].every(q => q.words.split(/\s+/).length <= 5), [R.b1.words, R.b1c.words, R.sw1.words, R.done.words, R.vault.words, R.prow.words].join(' | '));
  check('a ring whose picture has not arrived stands in with no line stroked round it', R.strokes === 0, R.strokes + ' strokes');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the second kingdom is played, in order, and pointed at');
})().catch(e => { console.error(e); process.exit(1); });
