// THE HUB'S HATCH: NOTHING IS SHOWN UNTIL IT CAN BE OPENED, AND THEN IT OPENS
// (owner, 2026-11-14).
//
// "The first place where I should be digging down where there's a bright light
// shining on it. I should be hitting the floor and going down, but the floor is
// not actually being destroyed properly... where it says pale marble dust seeps
// up through the cracked floor. The seam runs below. So I can't go down here.
// It's a glitch." — and, when told the floor was sealed until NULLFANG:
// "if it's supposed to go inside and dig after Nullfang, then why are you
// showing it before?"
//
// So two halves, played with real keys on a save straight out of Ratchet's den:
//   BEFORE the meeting: those three columns are floor. No fracture, no light, no
//     caption, no prompt, and the goal lines send her east. Striking it does
//     nothing AND SAYS NOTHING — there is nothing there to be wrong about.
//   AFTER the meeting: the light stands on brittle floor, the goal names the
//     spot, and one jump, hold-down and strike puts her in the first cave.
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

  const setup = (met) => p.evaluate((met) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2;
    Object.assign(sv.flags, { ratchetRepaired: 1, ratchetReleased: 1, 'on_A0B|ratchet': 1, opNote: 1, heal: 1, opPod: 1 });
    if (met) sv.flags.nfMeet = 1;
    startGame(sv); loadRoom('A2');
    G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = []; G.toasts = [];
    const cx = (PG_HUB.tx0 + PG_HUB.tx1 + 1) / 2 * TILE;
    player.x = cx - player.w / 2; player.vx = 0;
    const tiles = []; for (let x = PG_HUB.tx0; x <= PG_HUB.tx1; x++) tiles.push(tileAt(x, PG_HUB.ty) + tileAt(x, PG_HUB.ty + 1));
    return { tiles: tiles.join(' '), sealed: pgHubSealed(), lit: pgHubLit(sv.flags), goal: progressGoal(sv.flags), hud: opGoalKey(),
      goalText: t(progressGoal(sv.flags)), hudText: t(opGoalKey()) };
  }, met);
  const strike = async () => {
    let end = null;
    for (let n = 0; n < 3; n++) {
      await p.keyboard.down('Space'); await p.waitForTimeout(120); await p.keyboard.up('Space');
      await p.waitForTimeout(160);
      await p.keyboard.down('ArrowDown'); await p.waitForTimeout(30);
      for (let i = 0; i < 4; i++) { await p.keyboard.down('KeyX'); await p.waitForTimeout(40); await p.keyboard.up('KeyX'); await p.waitForTimeout(70); }
      await p.keyboard.up('ArrowDown'); await p.waitForTimeout(900);
      end = await p.evaluate(() => ({ room: G.roomId, broken: Object.keys(G.save.broken || {}).filter(k => k.indexOf('A2:') === 0).length,
        taught: !!G.save.flags.taughtFloor, heard: !!G.save.flags.heardHollowFloor, dead: !!player.dead,
        knocks: Object.keys((G.knocks && G.knocks.A2) || {}).length }));
      if (end.room !== 'A2') break;
    }
    return end;
  };
  // is the prompt in the air? the hint draws from tileAt, so ask the same question it asks
  const prompted = () => p.evaluate(() => {
    const pcx = player.x + player.w / 2, t0 = Math.floor(pcx / TILE);
    for (let ty = PG_HUB.ty - 1; ty <= PG_HUB.ty + 1; ty++) for (let tx = t0 - 4; tx <= t0 + 4; tx++) if (tileAt(tx, ty) === 'B') return true;
    return false;
  });

  // ---- BEFORE THE MEETING ---------------------------------------------------
  const pre = await setup(false);
  check('before the lion, the hub floor is floor — not a fracture', pre.sealed && pre.tiles === '## ## ##', pre.tiles);
  check('...with no light and no caption on it', pre.lit === false);
  check('...and no loose-rock prompt over it', !(await prompted()));
  check('...and the goal sends her east, not down', pre.goal === 'pg_goal_cross' && pre.hud === 'op_o_cross'
    && !/cracked|hub/i.test(pre.goalText) && /east/i.test(pre.goalText) && /east/i.test(pre.hudText), pre.hudText + ' / ' + pre.goalText);
  await p.waitForTimeout(700);
  const preEnd = await strike();
  check('striking it does nothing, and says nothing', preEnd.room === 'A2' && preEnd.broken === 0 && preEnd.knocks === 0 && !preEnd.heard, JSON.stringify(preEnd));

  // ---- THE MEETING ITSELF TURNS IT ON ---------------------------------------
  const flip = await p.evaluate(() => {
    G.toasts = [];
    player.x = MEET_X + 8; meetCheck();
    const began = !!G.meet && !!G.save.flags.nfMeet;
    const tiles = []; for (let x = PG_HUB.tx0; x <= PG_HUB.tx1; x++) tiles.push(tileAt(x, PG_HUB.ty));
    let n = 0; while (G.meet && n++ < 2400) update(1 / 60);
    return { began, tiles: tiles.join(''), lit: pgHubLit(G.save.flags), over: !G.meet,
      told: (G.toasts || []).some(q => q.text === t('pg_hub_wakes')) || (G.card && G.card.text === t('pg_hub_wakes')) || false,
      goal: progressGoal(G.save.flags), dirty: true };
  });
  check('the meeting begins on the crest and the floor becomes a hatch that moment', flip.began && flip.tiles === 'BBB' && flip.lit, JSON.stringify(flip));
  check('...the goal now names the spot', flip.over && flip.goal === 'pg_goal_marble', flip.goal);
  check('...and she is told where the dust is rising, once the lion has gone', flip.told);

  // ---- AFTER THE MEETING ----------------------------------------------------
  const post = await setup(true);
  check('after the lion, the light stands on brittle floor, column for column', !post.sealed && post.lit && post.tiles === 'BB BB BB', post.tiles);
  check('...the prompt is there, and the goal says dig', (await prompted()) && post.goal === 'pg_goal_marble' && post.hud === 'op_o_marble', post.goal + ' / ' + post.hud);
  await p.waitForTimeout(700);
  const end = await strike();
  check('one jump, hold DOWN and strike in the light opens it', end.broken > 0, JSON.stringify(end));
  check('...and she goes down into the first cave', end.room === 'A5' && !end.dead, end.room);
  check('...having learned the floor lesson by doing it', end.taught);

  // ---- A SAVE THAT ALREADY CUT IT KEEPS ITS HOLE ----------------------------
  const old = await p.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.storyVersion = 2;
    Object.assign(sv.flags, { ratchetRepaired: 1, 'on_A0B|ratchet': 1, heal: 1 });
    sv.broken['A2:13,15'] = 1; sv.broken['A2:13,16'] = 1;
    startGame(sv); loadRoom('A2');
    return { sealed: pgHubSealed(), hole: tileAt(13, 15) + tileAt(13, 16), beside: tileAt(12, 15) };
  });
  check('a save that cut the hatch before the seal keeps its way down', !old.sealed && old.hole === '..' && old.beside === 'B', JSON.stringify(old));

  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — nothing is shown until it can be opened, and then it opens');
})().catch(e => { console.error(e); process.exit(1); });
