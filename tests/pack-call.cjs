// THE PACK ANSWERS HER (owner, 2026-11-20).
//
//   "since I became the leader of ... the pack, I should be able to summon for
//    a short period, like seconds, a wolf to help me ... as a special power"
//   "as the alpha, I should be able to summon him temporarily for 10 seconds"
//
// This holds:
//   - the Alpha's yield puts THE PACK on her suit wheel, with one card;
//   - cast, it calls one wolf: it comes in on its feet, hunts the nearest
//     machine and bites it (damage dealt), and never touches her;
//   - it moves like a wolf: its run, its coil and its lunge, drawn every frame;
//   - it stays ten seconds, then lopes off and is gone; one at a time, and a
//     call while it runs costs nothing.
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

  const R = await p.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1 });
    startGame(sv); loadRoom('A10'); G.state = 'PLAY'; G.dialog = null;
    out.before = (G.save.arms || []).includes('pack');
    const cards = []; const s0 = window.showItem; window.showItem = function (a, d) { cards.push([a, d]); return s0.apply(this, arguments); };
    G.onBossDead('alpha');
    window.showItem = s0;
    out.after = (G.save.arms || []).includes('pack'); out.cards = cards.length; out.worn = activeArm() && activeArm().id;
    // a room with something to hunt: the cheetahs of the caves
    loadRoom('CV2'); G.state = 'PLAY'; G.dialog = null; G.cut = null; G.toasts = [];
    for (const k of Object.keys(WOLF_ART)) mediaFetch(WOLF_ART[k].img, 1);
    for (let i = 0; i < 160 && !(MEDIA_IMG[WOLF_ART.walkStrip.img] && MEDIA_IMG[WOLF_ART.walkStrip.img].naturalWidth && MEDIA_IMG[WOLF_ART.rest.img] && MEDIA_IMG[WOLF_ART.rest.img].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const foes = G.enemies.filter(e => !e.dead && !e.disabled);
    out.foes = foes.length;
    const foe = foes[0];
    // she stands off from it, unhurt by anything
    player.x = foe.x + 320; player.y = foe.y + foe.h - player.h; player.vx = 0; player.face = -1; player.iT = 99;
    for (const e of G.enemies) if (e !== foe) { e.dead = true; }
    foe.hp = 999; const hp0 = foe.hp; foe.calm = false;
    player.volts = player.maxVolts ? player.maxVolts() : 100; const cores0 = player.cores;
    const v0 = player.volts;
    // the real key: CAST fires the worn arm (Player.update pays for it)
    player.armCD = 0;
    const press = (code) => { keys[code] = true; keysP[code] = true; update(1 / 60); keys[code] = false; keysP[code] = false; };
    press('KeyV');
    const ok = !!G.packWolf;
    out.paid = v0 - player.volts;
    const w = G.packWolf;
    out.second = (() => { player.armCD = 0; const v1 = player.volts; press('KeyV'); return player.volts === v1 && G.packWolf === w; })();
    const poses = {}; let drawn = 0, frames = 0, landedAt = -1, gone = -1, maxY = -1e9, minFoot = 1e9;
    const ctx = document.querySelector('canvas').getContext('2d');
    for (let f = 0; f < 60 * 15; f++) {
      player.iT = 99; foe.iT = 0;
      update(1 / 60); G.dialog = null; G.state = 'PLAY';
      const q = G.packWolf;
      if (!q) { if (gone < 0) gone = f; continue; }
      if (q.on && landedAt < 0) landedAt = f;
      frames++;
      const r = wolfPose(q, WOLF_ART, false); poses[r] = (poses[r] || 0) + 1;   // (the vocabulary it is drawn with: a hunter's)
      if (drawBeastPlate(ctx, q, WOLF_ART, true)) drawn++;
    }
    out.ok = ok; out.dealt = hp0 - foe.hp; out.foeDead = !!foe.dead; out.lost = cores0 - player.cores;
    out.poses = poses; out.drawn = drawn; out.frames = frames; out.landedAt = landedAt; out.gone = gone;
    return out;
  });
  check('the Alpha\'s yield puts THE PACK on her wheel, worn, with one card', !R.before && R.after && R.worn === 'pack' && R.cards === 1, JSON.stringify({ before: R.before, after: R.after, worn: R.worn, cards: R.cards }));
  check('cast, it calls a wolf, paid in volts', R.ok && R.paid >= 40, 'paid ' + R.paid);
  check('...one at a time: a call while it runs costs nothing', R.second);
  check('it comes in on its feet', R.landedAt >= 0 && R.landedAt < 60, 'landed at frame ' + R.landedAt);
  check('it hunts the machine and bites it', R.foes > 0 && R.dealt > 0, 'dealt ' + R.dealt + ' to one of ' + R.foes);
  check('...and never touches her', R.lost === 0, 'cores lost ' + R.lost);
  const run = Object.keys(R.poses).filter(k => /^(walk|run)/.test(k)).length, bit = (R.poses.lunge || 0) + (R.poses.coil || 0);
  check('it moves like a wolf: its run, its coil and its lunge — and it stands at bay, never sits, while it hunts', run > 0 && bit > 0 && !R.poses.sit, JSON.stringify(R.poses));
  check('...drawn every frame it is here', R.frames > 0 && R.drawn === R.frames, R.drawn + '/' + R.frames);
  check('it stays ten seconds, then lopes off and is gone', R.gone >= 60 * 10 && R.gone <= 60 * 13.5, 'gone at ' + (R.gone / 60).toFixed(1) + ' s');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the pack answers her: one wolf, ten seconds, on her side');
})().catch(e => { console.error(e); process.exit(1); });
