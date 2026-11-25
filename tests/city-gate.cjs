// THE CITY GATE STANDS OUT (owner, 2026-11-20: "improve the city gate to give it
// more texture ... make it stand out, not fading into the background").
//
// The gate she walks through in W2 is the PAINTING (assets/backgrounds/gate_city.jpg,
// re-fired with Higgsfield: armour plate, rust, hinges, the city seen through the gap).
// Flat code-drawn leaves used to be laid over the painted doors, navy and ringed, and
// that is what faded. This holds:
//   - with the painting up, nothing is drawn over its doors: the door area reads as
//     the painting's warm metal, not the old navy panels;
//   - the door area has texture: real local contrast, not a flat fill;
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
    const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 }); startGame(sv); loadRoom('W2');
    G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.toasts = []; G.enemies = [];
    mediaFetch(ROOM_VISTA.W2, true);
    for (let i = 0; i < 120 && !(MEDIA_RAW[ROOM_VISTA.W2] && MEDIA_RAW[ROOM_VISTA.W2].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 600));
    const W = G.roomDef.w * TILE; player.x = W * GATE_ROOM.W2.at; player.y = 0; player.vy = 0;
    for (let k = 0; k < 90; k++) { update(1 / 60); G.dialog = null; G.state = 'PLAY'; G.toasts = []; }
    const hidden = { player: player.draw }; player.draw = () => {};
    draw(performance.now());
    player.draw = hidden.player;
    const cv = document.querySelector('canvas'), x = cv.getContext('2d');
    // the door leaves either side of her, above the grass
    const sx = cv.width / 960, sy = cv.height / 540;
    const reg = (x0, y0, w, h) => x.getImageData(Math.round(x0 * sx), Math.round(y0 * sy), Math.round(w * sx), Math.round(h * sy));
    let warm = 0, navy = 0, n = 0, lum = [];
    for (const d of [reg(180, 60, 220, 200), reg(560, 60, 220, 200)]) {
      for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], g = d.data[i + 1], bl = d.data[i + 2]; n++;
        if (r > bl + 12) warm++; if (bl > r + 12) navy++; lum.push(0.2126 * r + 0.7152 * g + 0.0722 * bl); }
    }
    // texture: mean absolute difference between neighbours 4 px apart (a flat fill is ~0)
    let tex = 0; for (let i = 4; i < lum.length; i++) tex += Math.abs(lum[i] - lum[i - 4]); tex /= lum.length;
    return { warm: warm / n, navy: navy / n, tex, vista: G._vistaRoom };
  });
  check('W2 wears the city gate painting', R.vista === 'W2', R.vista);
  check('the gate\'s doors read as its painted metal, not flat navy panels', R.warm > 0.5 && R.navy < 0.15, 'warm ' + (R.warm * 100).toFixed(0) + '%, navy ' + (R.navy * 100).toFixed(0) + '%');
  check('...and have texture you can see (local contrast)', R.tex > 4, R.tex.toFixed(1));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the city gate is the painted gate, and it stands out');
})().catch(e => { console.error(e); process.exit(1); });
