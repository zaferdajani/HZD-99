// THE PURIFIER, MEASURED. The crystal arc is a chain of promises — the first
// NPC hands it over, the tree grows a branch, the up-slash launches, the
// joined blade flies and COMES BACK — and every link is the kind of thing
// that reads fine in code and fails on screen. So each one is driven live:
//
//   - the gift: the first NPC's gift closure grants the flag and the card
//   - the tree: nodes EXIST only when their weapon does (7 -> 10 -> 11)
//   - the reach: a crystal swing's hitbox is measurably longer than a claw's
//   - the grammar: the grounded finisher rises (diagonal), up/down aim works
//   - the launcher: risecut throws an enemy upward off an up-slash
//   - the throw: with both ends and the skill, the finisher releases the
//     blade, it goes OUT, turns, returns, and is CAUGHT — and while it is
//     out the audio router says 'claw', because her paw is empty
//
//   node tests/crystal.cjs
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
  console.log('── crystal — the purifier: gift, tree, reach, grammar, launcher, throw');

  const m = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A0');
    await new Promise(r => setTimeout(r, 600));
    G.wake = null; G.state = 'PLAY';

    // ---- the tree grows with the weapon --------------------------------
    out.pool0 = skillPool().length;
    // ---- the gift ------------------------------------------------------
    // the first NPC's gift closure, exactly as doInteract would fire it
    out.giftKeyExists = typeof NPC_GIFT === 'object' && !!NPC_GIFT['A0|ratchet'];
    NPC_GIFT['A0|ratchet']();
    out.crystalAfterGift = !!G.save.flags.crystal;
    out.cardShown = G.state === 'DIALOG' || !!(G.dialog);
    G.dialog = null; G.state = 'PLAY';
    out.pool1 = skillPool().length;
    G.save.flags.crystal2 = 1;
    out.pool2 = skillPool().length;
    G.save.flags.crystal2 = 0;

    // ---- reach: same swing, longer box ---------------------------------
    const box = (wield, combo) => {
      player.swing = { ax: 1, ay: 0, ang: 0, combo, set: new Set(), wield, t: 0.1 };
      const b = player.hitbox(); player.swing = null;
      return b.w;
    };
    out.clawW = box(0, 0); out.cry1W = box(1, 0); out.cry2W = box(2, 0);

    // ---- grammar: press the button, read the swing ---------------------
    const K = (typeof KEYB !== 'undefined' && KEYB) || null;
    const press = (code) => { keys[code] = true; keysP[code] = true; };
    const step = () => update(1 / 30);
    const swingOf = async (setup) => {
      player.swing = null; player.swingVis = null;
      player.atkCD = 0; player.atkBuf = 0; player.combo = 0; player.comboT = 0;
      player.on = true; player.vy = 0; player.face = 1;
      G.hitStop = 0;   // a hit two lines ago must not freeze THIS press's frame
      if (setup) setup();
      press('KeyJ');                       // ATK default binding
      step();
      const s = player.swing ? { ax: player.swing.ax, ay: player.swing.ay, combo: player.swing.combo, wield: player.swing.wield } : null;
      player.swing = null; player.swingVis = null;
      for (const k in keys) keys[k] = false;
      return s;
    };
    // claw: flat finisher stays flat
    G.save.flags.crystal = 0;
    let s1 = await swingOf(() => { player.combo = 1; player.comboT = 0.5; });
    out.clawFin = s1 && { ay: s1.ay, wield: s1.wield };
    // crystal: the grounded finisher RISES
    G.save.flags.crystal = 1;
    s1 = await swingOf(() => { player.combo = 1; player.comboT = 0.5; });
    out.cryFin = s1 && { ay: s1.ay, combo: s1.combo, wield: s1.wield };
    // up-aim still aims up, first hit unchanged and flat
    s1 = await swingOf(() => { keys.ArrowUp = true; });
    out.cryUp = s1 && { ay: s1.ay, combo: s1.combo };
    s1 = await swingOf(() => {});
    out.cryOpen = s1 && { ay: s1.ay, combo: s1.combo };

    // ---- risecut: the up-slash launches --------------------------------
    G.save.skills.push('risecut');
    const foe = G.enemies.length ? G.enemies[0] : null;
    let launch = null;
    // a synthetic target right on top of her, so the up box catches it
    const dummy = { x: player.x, y: player.y - 40, w: 24, h: 24, vx: 0, vy: 0,
      hp: 999, dead: false, kind: 'crawler', kbT: 0, hurtT: 0,
      update() {}, draw() {}, die() { this.dead = true; } };
    G.enemies.push(dummy);
    player.swing = null; player.atkCD = 0; player.combo = 0; player.comboT = 0;
    keys.ArrowUp = true; press('KeyJ'); step(); step();
    launch = dummy.vy;
    out.launchVy = launch;
    G.enemies.pop(); keys.ArrowUp = false; for (const k in keys) keys[k] = false;
    player.swing = null; player.swingVis = null;

    // ---- the throw, out and back --------------------------------------
    G.save.flags.crystal2 = 1;
    G.save.skills.push('boomer');
    G.boomer = null;
    player.x = 300; player.y = 300; player.combo = 1; player.comboT = 0.5;
    player.atkCD = 0; player.atkBuf = 0; player.on = true; player.vy = 0; player.face = 1;
    // the risecut hit above raised G.hitStop — the world is frozen for a few
    // frames, and a press stepped into a frozen frame reaches nobody. This is
    // the game working as designed; the harness clears it because it is
    // testing the throw, not the freeze.
    G.hitStop = 0;
    press('KeyJ'); step();
    out.threwOnFinisher = !!G.boomer;
    out.audioWhileOut = (typeof wielded === 'function') ? wielded() : null;
    let maxDx = 0, returned = false, frames = 0;
    while (G.boomer && frames < 90) {                 // 3 seconds of sim
      step(); frames++;
      if (G.boomer) maxDx = Math.max(maxDx, Math.abs(G.boomer.x - (player.x + player.w / 2)));
    }
    returned = !G.boomer;
    out.flightRange = Math.round(maxDx);
    out.caught = returned;
    out.audioAfterCatch = (typeof wielded === 'function') ? wielded() : null;
    // no throw off the first beat of a chain
    G.boomer = null; player.combo = 0; player.comboT = 0; player.atkCD = 0;
    press('KeyJ'); step();
    out.noThrowOnOpener = !G.boomer && !!player.swing;
    player.swing = null; player.swingVis = null;
    return out;
  });

  // the tree
  check('the bare tree has no crystal nodes', m.pool0 === 7, m.pool0 + ' nodes');
  check('the first NPC\'s gift is the crystal', m.giftKeyExists && m.crystalAfterGift && m.cardShown,
    'flag ' + m.crystalAfterGift + ', card ' + m.cardShown);
  check('the crystal grows the branch (+3)', m.pool1 === 10, m.pool1 + ' nodes');
  check('the joined blade opens the throw node (+1)', m.pool2 === 11, m.pool2 + ' nodes');
  // the reach
  check('the crystal out-reaches the claw, the joined blade more',
    m.cry1W > m.clawW && m.cry2W > m.cry1W,
    'claw ' + m.clawW + ' < crystal ' + m.cry1W + ' < joined ' + m.cry2W);
  // the grammar
  check('the claw finisher stays flat', m.clawFin && m.clawFin.ay === 0 && !m.clawFin.wield,
    JSON.stringify(m.clawFin));
  check('the crystal finisher RISES (diagonal cut)', m.cryFin && m.cryFin.combo === 2 && m.cryFin.ay < 0,
    JSON.stringify(m.cryFin));
  check('up-aim and the opener are untouched',
    m.cryUp && m.cryUp.ay === -1 && m.cryOpen && m.cryOpen.ay === 0 && m.cryOpen.combo === 0,
    'up ' + JSON.stringify(m.cryUp) + ', open ' + JSON.stringify(m.cryOpen));
  // the launcher
  check('risecut launches the target upward', m.launchVy < -300, 'vy ' + m.launchVy);
  // the throw
  check('the joined finisher releases the blade', m.threwOnFinisher);
  check('...and her paw sounds EMPTY while it flies', m.audioWhileOut === 'claw', m.audioWhileOut);
  check('it flies out a real distance', m.flightRange > 120, m.flightRange + 'px');
  check('and she catches it', m.caught && m.audioAfterCatch === 'crystal2',
    'caught ' + m.caught + ', audio ' + m.audioAfterCatch);
  check('the opener never throws', m.noThrowOnOpener);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — given, grown, longer, rising, launching, flying, and coming back');
})().catch(e => { console.error(e); process.exit(1); });
