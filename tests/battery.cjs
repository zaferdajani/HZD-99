// THE BATTERY ARC, END TO END.
//
// The story: every machine person in the Depths was POWERED DOWN when the Song
// went out. That is why they were never infected, and it is why they have been
// standing in the dark ever since. She starts with one Power Cell. NULLFANG
// carries one. Each of the Eye's constructs is sitting on another. The supply
// is exactly the demand.
//
// Which means the whole arc rests on arithmetic that is invisible from the
// code: is there a cell for every dark unit, does the shop actually stay shut
// until the lion pays for it, can a cell be spent twice, does the hero world
// get gated by mistake. All of that is checked here, against the real build.
//
//   node tests/battery.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };

  console.log('── battery — the cells, the dark units, and the shop that waits for the lion');

  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  // ---- 1. SUPPLY EQUALS DEMAND -------------------------------------------
  // Counted from the world itself, not from a list somebody has to remember to
  // update: every ['npc',…] placement in ROOMS needs one cell, and the cells
  // come from the start, the guardians, and the Eye's constructs.
  const econ = await page.evaluate(() => {
    let npcs = 0, minis = 0, bosses = 0;
    for (const id in ROOMS) for (const e of (ROOMS[id].ents || [])) {
      if (e[0] === 'npc') npcs++;
      if (e[0] === 'boss' && MINIS[e[3]]) minis++;
      if (e[0] === 'boss' && !MINIS[e[3]]) bosses++;
    }
    const sv = newSave(1);
    return { npcs, minis, bosses, start: (sv.items && sv.items.batt) || 0 };
  });
  const supply = econ.start + econ.minis + 1;      // +1: NULLFANG's own cell
  check('a cell exists for every dark unit (' + econ.npcs + ' units)',
    supply >= econ.npcs,
    econ.start + ' start + ' + econ.minis + ' constructs + 1 lion = ' + supply);
  check('and no more than two spare, or the choice is not one',
    supply - econ.npcs <= 2, 'surplus ' + (supply - econ.npcs));

  // ---- 2. A DARK UNIT IS INERT, AND ONE CELL WAKES ONE UNIT --------------
  const hand = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => requestAnimationFrame(r));
    const sp = G.statics.find(s => s.type === 'npc');
    const key = npcKey(sp);
    const before = { live: npcLive(sp), batt: invCount('batt') };
    // the shop must NOT open from a dark trader — that is the whole gate
    doInteract(sp);
    const askedState = G.state;
    const linesWhileDark = (G.dialog && G.dialog.lines.length) || 0;
    // walking the dialog to its end is the player's implicit yes
    const end = G.dialog && G.dialog.onEnd;
    if (end) end();
    const after = { live: npcLive(sp), batt: invCount('batt'), kit: invCount('kit') };
    G.dialog = null; G.state = 'PLAY';
    // ...and a second hand-off must not be possible: it is live now
    doInteract(sp);
    const second = G.state;
    G.dialog = null; G.state = 'PLAY';
    return { key, before, after, askedState, linesWhileDark, second, shopOpened: askedState === 'SHOP' };
  });
  check('an NPC starts dark', hand.before.live === false, hand.key);
  check('a dark trader does NOT open the shop', !hand.shopOpened, 'state ' + hand.askedState);
  check('the hand-off spends exactly one cell',
    hand.before.batt === 1 && hand.after.batt === 0, hand.before.batt + ' -> ' + hand.after.batt);
  check('and it wakes', hand.after.live === true);
  check('the first unit repays with a repair kit', hand.after.kit === 1, 'kit ×' + hand.after.kit);
  check('a woken unit talks instead of asking again', hand.second === 'DIALOG');

  // ---- 3. NO CELL, NO WAKE ------------------------------------------------
  const broke = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.items = {};                                  // spent it elsewhere
    startGame(sv); loadRoom('A0');
    await new Promise(r => requestAnimationFrame(r));
    const sp = G.statics.find(s => s.type === 'npc');
    doInteract(sp);
    const had = !!(G.dialog && G.dialog.onEnd);
    const live = npcLive(sp);
    G.dialog = null; G.state = 'PLAY';
    return { had, live };
  });
  check('with no cell there is nothing to press', broke.had === false);
  check('and it stays dark', broke.live === false);

  // ---- 4. THE LION PAYS FOR THE SHOP -------------------------------------
  const lion = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.items = {};
    startGame(sv);
    const before = invCount('batt');
    G.onBossDead('glitch');
    const after = invCount('batt');
    G.item = null; G.state = 'PLAY';
    return { before, after };
  });
  check('NULLFANG leaves a cell behind',
    lion.after === lion.before + 1, lion.before + ' -> ' + lion.after);

  // ---- 5. AND THE CONSTRUCTS ARE NEVER SPARED ----------------------------
  const eye = await page.evaluate(() => {
    const out = [];
    for (const k in MINIS) {
      const b = new Boss(k, 300, 480);
      b.hp = 0;
      out.push({ k, forked: bossFork(b) });
    }
    return out;
  });
  check('the Eye\'s constructs are never offered the fork',
    eye.every(o => o.forked === false), eye.filter(o => o.forked).map(o => o.k).join(',') || 'none');

  // ---- 6. THE HERO WORLD IS NOT GATED ------------------------------------
  // NOSTOS's people are people. Gating a Greek elder behind a robot battery is
  // exactly the theme bleed this codebase has had to fix twice already.
  const hero = await page.goto('http://127.0.0.1:8220/odyssey.html')
    .then(() => page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 }))
    .then(() => page.evaluate(async () => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom('A0');
      await new Promise(r => requestAnimationFrame(r));
      const sp = G.statics.find(s => s.type === 'npc');
      return sp ? npcLive(sp) : null;
    }));
  check('NOSTOS\'s people are never dark', hero === true, 'live=' + hero);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one cell, one machine, and the shop waits for the lion');
})().catch(e => { console.error(e); process.exit(1); });
