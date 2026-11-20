// THE ALPHA BOWS, AND ITS PACK BEHIND IT (owner, 2026-11-20).
//
//   "After finishing the alpha should step back, bow down to you as the new
//    alpha. You should create this scenery with the game, not as a video, but
//    as a gameplay ... some other small wolves will stand behind the alpha and
//    bow to you too."
//
// This holds (js/packcall.js):
//   - the yielded Alpha backs off from her — its prowl, walked backwards with
//     its face to her — then plays its filmed yield (the bow) and holds it;
//   - three of the pack come in behind it (further from her than it is), stop
//     in a row facing her, and go down low together;
//   - then they rise and are hers; and it happens once per save.
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
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1 });
    startGame(sv); loadRoom('A10'); G.state = 'PLAY'; G.dialog = null;
    for (const k of ALPHA_STRIPS) mediaFetch(k, 1); for (const k of Object.keys(WOLF_ART)) mediaFetch(WOLF_ART[k].img, 1);
    for (let i = 0; i < 160 && !(MEDIA_RAW.alYield && MEDIA_RAW.alYield.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const B = G.boss; B.meet = false; B.st = 'idle';
    player.x = B.cx() - 300; player.y = B.y + B.h - player.h;
    B.hp = 0; B.dead = true; B.deathAnimT = 1.6; B.rewardPend = true; B.face = -1;
    const pcx = () => player.x + player.w / 2;
    let x0 = null, maxBack = 0, backFacing = true, bowKeys = new Set(), allDown = false, rowOk = false, facingOk = false, begun = false, ended = false;
    const keyDrawn = []; const D = window.drawStripCell;
    window.drawStripCell = function (c, key) { keyDrawn.push(key); return D.apply(this, arguments); };
    for (let f = 0; f < 60 * 12; f++) {
      player.iT = 99; player.vx = 0; update(1 / 60); G.dialog = null; if (G.state !== 'PLAY') G.state = 'PLAY';
      if (B.bowT > 0) {
        begun = true;
        if (x0 == null) x0 = B.cx();
        const away = Math.sign(B.cx() - pcx());
        maxBack = Math.max(maxBack, (B.cx() - x0) * away);
        if (!B.bowing && B.vx && Math.sign(B.face) === away) backFacing = false;
        keyDrawn.length = 0; drawAlpha(document.querySelector('canvas').getContext('2d'), B, B.cx(), B.cy());
        if (B.bowing) for (const k of keyDrawn) bowKeys.add(k);
        const ws = G.enemies.filter(e => isWolf(e) && e.bowTo != null);
        if (ws.length === 3 && ws.every(e => e.bowing)) {
          allDown = true;
          rowOk = ws.every(e => Math.abs(e.x + e.w / 2 - pcx()) > Math.abs(B.cx() - pcx()));
          facingOk = ws.every(e => faceSide(e) === Math.sign(pcx() - (e.x + e.w / 2)));
        }
      } else if (begun) { ended = true; }
    }
    window.drawStripCell = D;
    const risen = G.enemies.filter(e => isWolf(e)).every(e => !e.bowing);
    // once per save: the room again
    loadRoom('A10'); for (let f = 0; f < 120; f++) { update(1 / 60); G.dialog = null; if (G.state !== 'PLAY') G.state = 'PLAY'; }
    const again = !!(G.boss && G.boss.bowT > 0);
    return { begun, maxBack: Math.round(maxBack), backFacing, bowKeys: [...bowKeys], allDown, rowOk, facingOk, ended, risen, again };
  });
  check('the yielded Alpha backs off from her, its face to her', R.begun && R.maxBack >= 40 && R.backFacing, JSON.stringify({ back: R.maxBack, facing: R.backFacing }));
  check('...then bows: its own filmed yield take, held', R.bowKeys.includes('alYield'), R.bowKeys.join(','));
  check('three of the pack come in behind it and go down together', R.allDown && R.rowOk, JSON.stringify({ down: R.allDown, behind: R.rowOk }));
  check('...facing her, the new leader', R.facingOk);
  check('then they rise, and are hers', R.ended && R.risen);
  check('once per save', !R.again);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the Alpha bows to her, and its pack behind it');
})().catch(e => { console.error(e); process.exit(1); });
