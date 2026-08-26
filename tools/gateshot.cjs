// PHOTOGRAPH THE WALK THROUGH A DOOR, frame by frame.
//
// The owner watched this shot twice and reported the same class of defect both
// times — "it turns towards the background" (fixed), then "it's just taking one
// step backward and then goes inside the room... as if actually the character
// is walking instead of just fading". Neither is visible in a still, and both
// are about the frames BETWEEN standing at a door and being gone.
//
// So the shot is stepped by hand, like tools/swingshot.cjs steps a swing: the
// loop is frozen and the walk's own clock is advanced, which is the only way to
// catch a 3.4-second move that a screenshot round-trip cannot keep up with.
//
//   node tools/gateshot.cjs <out.png> [frames=10] [room=W2] [offset=-70]
//     offset: where she stands relative to the gap when UP is pressed, in
//     world pixels — the align beat is exactly what that distance buys.
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [out, nArg, roomArg, offArg] = process.argv.slice(2);
  const N = parseInt(nArg || '10', 10);
  const ROOM = roomArg || 'W2';
  const OFF = parseFloat(offArg === undefined ? '-70' : offArg);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const info = await page.evaluate(async ({ ROOM, OFF }) => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.roomId = ROOM;
    sv.skills = ['dash']; G.save = sv; startGame(sv); loadRoom(ROOM);
    await new Promise(r => setTimeout(r, 2000));
    G.toasts = []; G.enemies = []; G.boss = null; G.impact = null;
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
    // stand her off to one side of the gap, which is what the trigger allows
    const d = (typeof gateDoors === 'function' && gateDoors()[0]) || null;
    if (!d) return { err: 'no gate in ' + ROOM };
    const gx = gateWorldX(d);
    player.x = gx - player.w / 2 + OFF;
    player.y = (G.roomDef.h - 2) * TILE - player.h;
    player.vx = 0; player.vy = 0; player.on = true;
    // wait for her back plates so the shot is not measuring a loading hold
    for (const k of ['heroBackA', 'heroBackB', 'heroBareBackA', 'heroBareBackB']) mediaFetch(k, 1);
    await new Promise(r => setTimeout(r, 1200));
    if (!gateEnter()) return { err: 'gate refused' };
    window.update = () => {};                      // freeze; the tool drives it
    return { gx, px: player.x, dur: GATE_WALK + (typeof GATE_TURN === 'number' ? GATE_TURN : 0),
             alignDur: G.gateWalk.alignDur };
  }, { ROOM, OFF });
  if (info.err) { console.error('  ' + info.err); process.exit(1); }

  const shots = [];
  const total = info.alignDur + info.dur;
  for (let i = 0; i < N; i++) {
    const r = await page.evaluate(({ want }) => {
      // step the walk's own clocks to `want` seconds, in small increments so
      // the stride phase and the easing land where they would in play
      const g = G.gateWalk;
      if (!g) return { gone: true, png: document.querySelector('canvas').toDataURL('image/png') };
      const now = (g.align >= 1 ? g.alignDur + (g.turnT || 0) + g.t : g.alignT);
      let left = Math.max(0, want - now);
      while (left > 0 && G.gateWalk) { const d = Math.min(1 / 60, left); updateGateWalk(d); left -= d; }
      G.impact = null;
      draw();
      const cv = document.querySelector('canvas');
      return { align: G.gateWalk ? G.gateWalk.align : 1, face: player.face,
               x: Math.round(player.x), png: cv.toDataURL('image/png') };
    }, { want: total * (i + 0.5) / N });
    shots.push(r);
  }
  const sheet = await page.evaluate(async ({ b64, names }) => {
    const W = 320, H = 180, cols = 2;
    const cv = document.createElement('canvas');
    cv.width = W * cols; cv.height = (H + 18) * Math.ceil(b64.length / cols);
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#111'; c2.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < b64.length; i++) {
      const im = new Image(); im.src = 'data:image/png;base64,' + b64[i]; await im.decode();
      const cx = (i % cols) * W, cy = Math.floor(i / cols) * (H + 18);
      c2.drawImage(im, cx, cy + 18, W, H);
      c2.fillStyle = '#eee'; c2.font = '600 12px system-ui';
      c2.fillText(names[i], cx + 6, cy + 13);
    }
    return cv.toDataURL('image/png');
  }, { b64: shots.map(s => s.png.split(',')[1]),
       names: shots.map((s, i) => i + (s.gone ? '  (gone)' : '  ' + (s.align >= 1 ? 'recede' : 'WALK') + '  x' + s.x + ' face' + s.face)) });
  fs.writeFileSync(out, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log('  ' + out + '   align beat ' + info.alignDur.toFixed(2) + 's, recede ' + info.dur + 's');
  if (errs.length) console.log('  page errors: ' + errs.slice(0, 2).join(' | '));
  await browser.close();
})();
