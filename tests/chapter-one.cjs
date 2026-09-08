// Connected quest integration with one save: no direct grants of quest items,
// weapons or sage flags. Rooms/positions are staged; traversal and combat AI
// have separate harnesses. This is not a claim of a human campaign playthrough.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8220/index.html');
    await page.waitForFunction(() => typeof startGame === 'function');
    const result = await page.evaluate(() => {
      const need = (ok, message) => { if (!ok) throw new Error(message); };
      const sv = newSave(1); sv.time = 99; sv.flags.woke = 1; sv.flags.tut = 1;
      // Exercise readable story fallback when optional films cannot play.
      PURIFY_VID.memory = null; PURIFY_VID.gift = null;
      startGame(sv);
      const clear = () => { for (const k in keys) delete keys[k]; for (const k in keysP) delete keysP[k]; };
      const tick = () => { update(1 / 60); for (const k in keysP) delete keysP[k]; };
      const dialog = () => {
        let count = 0;
        while (G.state === 'DIALOG' && count++ < 60) {
          keysP.KeyE = true; tick();
        }
        need(count < 60, 'dialogue chain terminates'); clear();
      };
      const stage = room => { clear(); loadRoom(room); G.wake = null; G.state = 'PLAY'; G.hitStop = 0; G.trans = null; };
      stage('A0B');
      const ratchet = () => G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
      need(!npcLive(ratchet()), 'Ratchet begins asleep');
      const batteries = invCount('batt'); doInteract(ratchet()); dialog();
      need(npcLive(ratchet()) && invCount('batt') === batteries - 1, 'rescue spends one battery');
      need(qState('ratchet_forge') === 'active' && !weaponOwned('single'), 'rescue activates stone quest without a sword');
      G.state = 'PLAY';
      doInteract(G.statics.find(s => s.type === 'bench'));
      for (let i = 0; i < 180; i++) tick();
      need(!G.recharge && player.volts >= BURST_VOLTS, 'real rest supplies the quarry burst');
      stage('CV3');
      const pillar = G.statics.find(s => s.type === 'pillar'); need(pillar, 'quarry pillar exists');
      player.x = pillar.x - 30; player.y = pillar.y + pillar.h - player.h;
      player.on = true; player.vx = player.vy = 0; player.face = 1;
      // Production held-input path, not a direct releaseCharged invocation.
      keys.KeyX = true; keysP.KeyX = true;
      for (let i = 0; i < 75; i++) { player.update(1 / 60); delete keysP.KeyX; }
      delete keys.KeyX; player.update(1 / 60); clear();
      need(G.save.bag.cshard && !weaponOwned('single'), 'held claws quarry stone without granting sword');
      const saved = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
      need(saved.bag.cshard && saved.flags.pl_cshard, 'quarried stone is durable');
      startGame(saved); stage('CV3');
      need(!G.statics.some(s => s.type === 'pillar'), 'pillar does not regrow after save reload');
      stage('A0B'); doInteract(ratchet()); dialog();
      need(weaponOwned('single') && qState('ratchet_forge') === 'done' && !G.save.bag.cshard,
        'return consumes the stone and forges the sword');
      const iq = G.save.iq; G.state = 'PLAY'; doInteract(ratchet()); dialog();
      need(G.save.iq === iq && !weaponOwned('dual'), 'returning again cannot duplicate the reward');
      stage('GA1T');
      player.x = G.roomDef.w * TILE + 3; player.y = 14 * TILE; checkTransitions();
      need(G.trans && G.trans.to === 'GA1D', 'earned sword opens first sage');
      stage('GA1D'); G.trans = null;
      const sage = G.enemies.find(e => e.kind === 'sage'); need(sage, 'first sage exists');
      const giftBefore = invCount('batt');
      // Damage routing is exercised through real player swing collisions.
      for (let i = 0; i < 3000 && !sage.tame; i++) {
        player.x = sage.x - player.w + 8; player.y = sage.y + sage.h - player.h;
        player.vx = player.vy = 0; player.face = 1; player.on = true;
        if (i % 40 === 0) { keys.KeyX = true; keysP.KeyX = true; }
        if (i % 40 === 1) delete keys.KeyX;
        player.update(1 / 60); delete keysP.KeyX;
      }
      clear();
      need(sage.tame && !sage.dead && invCount('batt') === giftBefore + 1, 'earned sword cleanses sage and pays one gift');
      dialog();
      const finalSave = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
      startGame(finalSave); stage('GA1D');
      need(G.enemies.find(e => e.kind === 'sage').tame && invCount('batt') === giftBefore + 1,
        'clean sage and once-only gift survive save reload');
      return { quest: qState('ratchet_forge'), sword: weaponMode(), sage: !!G.save.flags.sageTame_GA1D };
    });
    assert.deepEqual(errors, []); console.log('PASS connected first-chapter quest and reloads', result);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
