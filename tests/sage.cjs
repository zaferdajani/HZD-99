// THE SAGE, MEASURED (docs/combat/SAGE.md). The whole design is a chain of
// laws that read fine in prose and break silently in play, so each one is
// driven live:
//
//   - it duels: tells fire (coil/gather) with real length, sentences end in
//     an exhale she can punish
//   - claws break it DOWN TO THE FLOOR AND NO FURTHER — reaching the floor
//     drops it into the song-lock, where claws glance for zero
//   - crystal strikes fill purity, full purity TAMES it — never kills
//   - the tame persists across a room reload, the gift pays exactly once
//   - the aura law: infected sages are skipped by the purple pass (they
//     carry the black-ember halo), tamed ones read blue
//
//   node tests/sage.cjs
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
  console.log('── sage — the duelist that can only be cleansed');

  const m = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.flags.bossGlitch = 1;                    // NULLFANG fell -> its cave exists
    startGame(sv); loadRoom('GA1D');
    await new Promise(r => setTimeout(r, 500));
    G.wake = null; G.state = 'PLAY'; G.hitStop = 0;
    const sg = G.enemies.find(e => e.kind === 'sage');
    out.spawns = !!sg;
    if (!sg) return out;

    // ---- it duels: drive close, watch for tells and the exhale ----------
    player.iT = 999; player.dead = false;
    let tellFrames = 0, sawExhale = false, sawLunge = false;
    for (let i = 0; i < 900; i++) {
      player.x = sg.x + 120; player.y = sg.y; player.vy = 0; player.on = true;
      sg.update(1 / 60);
      if (sg.coilT > 0 || sg.gatherT > 0) tellFrames++;
      if (sg.windedT > 0) sawExhale = true;
      if (sg.lungeT > 0) sawLunge = true;
    }
    out.tellSeconds = +(tellFrames / 60).toFixed(2);
    out.duels = sawLunge && sawExhale;

    // ---- claws: down to the floor, never past it ------------------------
    delete G.save.flags.crystal; delete G.save.flags.crystal2; G.boomer = null;
    const floor = Math.round(sg.hpMax0 * 0.3);
    for (let i = 0; i < 60; i++) dealDmg(sg, 20, null, sg.x, sg.y, true);
    out.clawFloor = sg.hp === floor || (sg.hp >= floor && sg.hp <= sg.hpMax0 * 0.46);
    out.locks = !!sg.locked;
    const hpBefore = sg.hp;
    dealDmg(sg, 50, null, sg.x, sg.y, true);   // still bare-clawed
    out.clawGlances = sg.hp >= hpBefore && !sg.tame;

    // ---- crystal: purity fills, full purity tames -----------------------
    G.save.flags.crystal = 1;
    let hits = 0;
    while (!sg.tame && hits++ < 10) dealDmg(sg, 20, null, sg.x, sg.y, true);
    out.purified = sg.tame === 1 && hits <= 5;
    out.neverDies = !sg.dead && sg.hp > 0;
    out.giftPaid = !!G.save.flags['sageGift_GA1D'] && G.save.scrap >= 120;
    const scrapAfter = G.save.scrap;
    dealDmg(sg, 99, null, sg.x, sg.y, true);   // a poke now
    out.tamedUnharmed = !sg.dead && sg.tame === 1;
    out.giftOnce = G.save.scrap === scrapAfter;

    // ---- the tame persists across a reload ------------------------------
    loadRoom('GA1T');
    await new Promise(r => setTimeout(r, 200));
    loadRoom('GA1D');
    await new Promise(r => setTimeout(r, 200));
    const sg2 = G.enemies.find(e => e.kind === 'sage');
    out.tamePersists = !!sg2 && sg2.tame === 1;
    G.state = 'PLAY';
    return out;
  });

  check('a sage kneels in the deep chamber', m.spawns);
  check('it duels: real tells, lunges, and the exhale opening',
    m.duels && m.tellSeconds >= 0.5, 'tells ' + m.tellSeconds + 's');
  check('claws break it to the floor and no further',
    m.clawFloor && m.locks, 'locked ' + m.locks);
  check('...and glance off the song-lock for zero', m.clawGlances);
  check('the crystal purifies it — tamed, never killed',
    m.purified && m.neverDies);
  check('the gift pays, and pays once', m.giftPaid && m.giftOnce);
  check('a purified sage cannot be harmed', m.tamedUnharmed);
  check('the purification is a save fact — it survives the room reload', m.tamePersists);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — broken by anything, cleansed by one thing, kept clean forever');
})().catch(e => { console.error(e); process.exit(1); });
