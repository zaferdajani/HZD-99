// THE LIT FLOOR IS THE FLOOR THAT BREAKS (owner, 2026-11-14).
//
// "The first place where I should be digging down where there's a bright light
// shining on it. I should be hitting the floor and going down, but the floor is
// not actually being destroyed properly... hitting the floor did not actually
// break it in the first area where I have to go down, where it says pale marble
// dust seeps up through the cracked floor. The seam runs below. So I can't go
// down here. It's a glitch."
//
// The hatch under the light was sealed until the NULLFANG meeting, forty-six
// tiles east, while the light, the caption, the goal line and the strike prompt
// all said to dig. This plays it the way he did: a save straight out of
// Ratchet's den, real keys, jump — hold down — strike, standing in the light.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await p.mouse.click(480, 270);
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const setup = await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2;
    // out of the den, pack bought, and NOT yet across the meadow: no nfMeet
    Object.assign(sv.flags, { ratchetRepaired: 1, ratchetReleased: 1, 'on_A0B|ratchet': 1, opNote: 1, heal: 1 });
    startGame(sv); loadRoom('A2');
    G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = [];
    const cx = (PG_HUB.tx0 + PG_HUB.tx1 + 1) / 2 * TILE;
    player.x = cx - player.w / 2; player.vx = 0;
    const lit = [];
    for (let x = PG_HUB.tx0; x <= PG_HUB.tx1; x++) lit.push(tileAt(x, PG_HUB.ty));
    return { lit: lit.join(''), goal: progressGoal(sv.flags), phase: pgTrailPhase(sv.flags), met: !!sv.flags.nfMeet, room: PG_HUB.room };
  });
  check('the light stands on brittle floor, column for column', setup.lit === 'BBB' && setup.room === 'A2', setup.lit);
  check('...at the moment the goal says to dig there, before the lion is met',
    setup.goal === 'pg_goal_marble' && setup.phase === 'marble' && !setup.met, JSON.stringify(setup));

  await p.waitForTimeout(900);
  let end = null;
  for (let n = 0; n < 4; n++) {
    await p.keyboard.down('Space'); await p.waitForTimeout(120); await p.keyboard.up('Space');
    await p.waitForTimeout(160);
    await p.keyboard.down('ArrowDown'); await p.waitForTimeout(30);
    for (let i = 0; i < 4; i++) { await p.keyboard.down('KeyX'); await p.waitForTimeout(40); await p.keyboard.up('KeyX'); await p.waitForTimeout(70); }
    await p.keyboard.up('ArrowDown'); await p.waitForTimeout(900);
    end = await p.evaluate(() => ({ room: G.roomId, broken: Object.keys(G.save.broken || {}).filter(k => k.indexOf('A2:') === 0).length,
      taught: !!G.save.flags.taughtFloor, dead: !!player.dead }));
    if (end.room !== 'A2') break;
  }
  check('one jump, hold DOWN and strike in the light opens it', end.broken > 0, JSON.stringify(end));
  check('...and she goes down into the first cave', end.room === 'A5' && !end.dead, end.room);
  check('...having learned the floor lesson by doing it', end.taught);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — where the light says dig, the floor gives');
})().catch(e => { console.error(e); process.exit(1); });
