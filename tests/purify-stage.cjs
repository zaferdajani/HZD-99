// THE PURIFY SCENE, CLEAN (owner, 2026-11-21, of a frame from it: "This scene has so many
// errors. The lion is giving me its back, the sword looks like a cross, and the screen
// is glitched"). Drives js/purification.js from the worst case — NULLFANG beaten by the
// room's wall, facing away, with her behind him — and holds:
//   - he turns to her (his filmed turn) before the hold opens, and faces her through it;
//   - the frame stays inside the room the whole scene (no wall's end, no outside);
//   - no ring of light is made round anyone, and no neon seal is painted on the edge;
//   - nothing draws a blade over her: no vertical stroke with a bar across it (the cross);
//     her sword is her own charge art, drawn even if she fought with her claws;
//   - she stands a blade's length from his DRAWN head, not in it, and not still reeling;
//   - the words say PURIFY, never free, in every language.
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
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
    Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, nfMeet: 1, nfGlimpse: 1, sageTame_GA1D: 1, bossChime: 1, nfBreak: 1 });
    sv.weaponMode = 'claws';                                   // she fought with her claws
    startGame(sv); loadRoom('A4'); G.state = 'PLAY'; G.dialog = null; G.enemies = [];
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^(beast|hzd|swing)/i.test(k))) mediaFetch(k, true);
    for (let i = 0; i < 300 && !['beastStudioTurn', 'swingSingleCharge'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const bo = new Boss('glitch', 3 * TILE, (G.roomDef.h - 6) * TILE); G.boss = bo; bo.meet = false; bo.st = 'idle';
    for (let i = 0; i < 20; i++) { player.iT = 99; player.x = bo.x + 600; update(1 / 60); G.dialog = null; }
    bo.face = -1; bo.faceVis = -1; bo.st = 'idle';
    // her last moment: just struck, still reeling
    player.x = bo.x + bo.w + 40; player.y = bo.y + bo.h - player.h; player.hurtPoseT = 0.3; player.iT = 1.2;
    bo.hp = 0; purificationBegin(bo);
    const out = { reel: [player.hurtPoseT, player.iT], camOut: 0, frames: 0, rings: 0, seal: 0, cross: 0, sword: 0 };
    const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
    // spies: a stroke that rises straight up from her (the drawn blade), a seal strip on the room's edge, her charge art
    const ctx = document.querySelector('canvas').getContext('2d');
    const L = CanvasRenderingContext2D.prototype.lineTo, M = CanvasRenderingContext2D.prototype.moveTo, F = CanvasRenderingContext2D.prototype.fillRect;
    let last = null;
    CanvasRenderingContext2D.prototype.moveTo = function (x, y) { last = [x, y]; return M.apply(this, arguments); };
    CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
      if (last && G.state === 'PURIFY' && Math.abs(x - last[0]) < 0.5 && last[1] - y > 25 && Math.abs(x - (player.x + player.w / 2)) < 30) out.cross++;
      return L.apply(this, arguments); };
    CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) { if (G.state === 'PURIFY' && w === 10 && h === H) out.seal++; return F.apply(this, arguments); };
    const D = window.drawStripCell; window.drawStripCell = function (c2, key) { if (G.state === 'PURIFY' && /Charge$/.test(key)) out.sword++; return D.apply(this, arguments); };
    let held = false;
    for (let f = 0; f < 60 * 4 && G.purification && ['stage', 'hold'].includes(G.purification.phase); f++) {
      if (G.purification.phase === 'hold') {
        if (!held) { held = true; out.atHold = { face: bo.face, vis: bo.faceVis, toward: Math.sign(player.x + player.w / 2 - bo.cx()), gap: Math.abs(player.x + player.w / 2 - bo.cx()) }; }
        G.purification.armed = true; purificationPointer = true;
      }
      update(1 / 60);
      if (!G.purification) break;
      const z = cam.zoom || 1, ox = 480 * (1 - 1 / z), oy = 270 * (1 - 1 / z);
      if (cam.x < -ox - 1 || cam.x > W - 960 + ox + 1 || cam.y < -oy - 1 || cam.y > H - 540 + oy + 1) out.camOut++;
      draw(performance.now()); out.frames++;
      out.rings = Math.max(out.rings, G.rings.length);
      if (G.purification && G.purification.phase === 'hold' && G.purification.hold > 0.5) break;
    }
    CanvasRenderingContext2D.prototype.lineTo = L; CanvasRenderingContext2D.prototype.moveTo = M; CanvasRenderingContext2D.prototype.fillRect = F; window.drawStripCell = D;
    G.addRing(100, 100); out.ringMade = G.rings.length;
    out.words = Object.values(PURIFICATION_WORDS).map(a => [a[0], a[4]].join(' | '));
    out.free = Object.values(PURIFICATION_WORDS).flat().filter(s => /\bfree\b|حرّر|تحرّر|kurtar|özgür|Освобод|свобод|自由/i.test(s));
    return out;
  });
  check('she is not still reeling from the last blow', R.reel[0] === 0 && R.reel[1] === 0, JSON.stringify(R.reel));
  check('he turns to her before the hold, and faces her', R.atHold && R.atHold.face === R.atHold.toward && Math.abs(R.atHold.vis - R.atHold.toward) < 0.03, JSON.stringify(R.atHold));
  check('she stands a blade\'s length from his drawn head, not in it', R.atHold && R.atHold.gap >= 140, R.atHold && Math.round(R.atHold.gap) + ' px');
  check('the frame stays inside the room the whole scene', R.frames > 20 && R.camOut === 0, R.camOut + ' of ' + R.frames + ' frames outside');
  check('no ring of light round anyone, and none can be made', R.rings === 0 && R.ringMade === 0);
  check('no neon seal painted on the room\'s edge', R.seal === 0, R.seal + ' strips');
  check('nothing draws a blade over her (the cross)', R.cross === 0, R.cross + ' strokes');
  check('her sword is her own charge art, though she fought with her claws', R.sword > 0, R.sword + ' frames');
  check('the words say purify, never free, in every language', R.free.length === 0, JSON.stringify(R.free.length ? R.free : R.words));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the purify scene: he faces her, she holds her own sword, the frame is clean');
})().catch(e => { console.error(e); process.exit(1); });
