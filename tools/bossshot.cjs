// Draw a guardian, assembled by its own rig, in the states worth judging.
//
// A parts atlas can be perfect on the sheet and wrong once assembled: a head
// that no longer meets its neck, a leg whose new outline reads as a gap. Only
// the rig can show that, so this boots the shipped build, loads the boss and
// calls its own draw() — the same route the game takes.
//
// It draws to a bare canvas rather than photographing the room, for the reason
// tests/grammar.cjs learned the hard way: a screenshot of the room is mostly
// HUD, tutorial panels and weather, and the thing being judged ends up behind
// a speech bubble.
//
//   node tools/bossshot.cjs <roomId> <out.png> <state,state,...> ["Title"]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [room, out, statesArg, title] = process.argv.slice(2);
  const states = (statesArg || 'stalk,walk,coil').split(',');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const url = await page.evaluate(async ({ room, states, title }) => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv); loadRoom(room);
    const b = G.boss;
    if (!b) return null;

    // give the art time to arrive; a guardian drawn before its atlas lands
    // falls back to the procedural renderer and the whole photo is a lie
    const t0 = Date.now();
    while (Date.now() - t0 < 12000) {
      await new Promise(r => requestAnimationFrame(r));
      if (Date.now() - t0 > 2500) break;
    }

    const CW = 560, CH = 480, GY = 410, PAD = 12, HEAD = 46;
    const cv = document.createElement('canvas');
    cv.width = PAD + states.length * (CW + PAD);
    cv.height = HEAD + CH + PAD + 24;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e14'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 26px system-ui, sans-serif';
    c.fillText(title || 'assembled by the rig', PAD, 32);

    const cell = document.createElement('canvas');
    cell.width = CW; cell.height = CH;
    const q = cell.getContext('2d', { willReadFrequently: true });

    // A guardian is 46-120 px tall in a 560 px cell, so photographing it at
    // game scale produces a contact sheet of specks — which is what the first
    // one did. The fix is a ZOOM APPLIED BEFORE draw(), not after: scaling the
    // context means the atlas is sampled at the larger size and the plate is
    // actually sharper, where scaling the finished bitmap would only blur it.
    //
    // The zoom is measured, and it is ONE zoom for the whole sheet. Fitting
    // each state to its own cell would silently equalise a crouch and a reared
    // roar, and the difference in size between those poses is the thing the
    // sheet exists to show — so every state is measured first, the widest and
    // tallest of them sets the scale, and all of them are drawn at it.
    const pose = (st) => {
      b.st = st; b.t = 0.4; b.dead = false; b.hp = b.hpMax;
      b.hurtT = 0; b.stagT = 0; b.anim = 1.7; b.face = -1; b.faceVis = -1; b.phase = 1;
      b.x = CW / 2 - b.w / 2; b.y = GY - b.h;
      // Guardians keep DRAW-SIDE MEMORY of the state they were last in, so a
      // roar can hold its pose for half a second after the state has moved on.
      // Photographing states back to back leaves that memory primed, and the
      // measure pass primed it for the render pass: every cell of THE CHOIR
      // came out as the same reared figure. Each cell starts from no memory.
      b.fc = null;
    };
    const M = 26;                                   // breathing room in the cell
    let U = null;
    for (const st of states) {
      pose(st);
      q.clearRect(0, 0, CW, CH);
      q.save(); try { b.draw(q); } catch (e) {} q.restore();
      const d = q.getImageData(0, 0, CW, CH).data;
      // Rows and columns are counted before the box is taken, and a line of
      // one or two pixels does not get a vote. TALONHOST hangs from a cable
      // that runs off the top of the cell: measured naively, that hairline set
      // the zoom and photographed the eagle as a speck under a long thread.
      // The zoom is set by the MASS, not by whatever reaches furthest.
      const rows = new Uint16Array(CH), cols = new Uint16Array(CW);
      for (let i = 3, p = 0; i < d.length; i += 4, p++) {
        if (d[i] < 10) continue;
        cols[p % CW]++; rows[(p / CW) | 0]++;
      }
      const MIN = 6;
      for (let x = 0; x < CW; x++) if (cols[x] >= MIN) {
        if (!U) U = { x0: x, y0: 0, x1: x, y1: 0 };
        if (x < U.x0) U.x0 = x; if (x > U.x1) U.x1 = x;
      }
      for (let y = 0; y < CH; y++) if (rows[y] >= MIN) {
        if (!U) U = { x0: 0, y0: y, x1: 0, y1: y };
        if (!U.hasY) { U.y0 = y; U.y1 = y; U.hasY = 1; }
        if (y < U.y0) U.y0 = y; if (y > U.y1) U.y1 = y;
      }
    }
    const fx = CW / 2, fy = GY;                     // the anchor draw() works from
    let Z = 1;
    if (U) Z = Math.max(1, Math.min((CW - M * 2) / (U.x1 - U.x0 + 1),
                                    (GY - M) / Math.max(1, fy - U.y0)));
    const cx2 = U ? fx + ((U.x0 + U.x1) / 2 - fx) * Z : fx;
    const dx = U ? CW / 2 - cx2 : 0;

    for (let i = 0; i < states.length; i++) {
      pose(states[i]);
      q.clearRect(0, 0, CW, CH);
      q.fillStyle = '#171b24'; q.fillRect(0, 0, CW, CH);
      q.fillStyle = '#0d1017'; q.fillRect(0, GY, CW, CH - GY);
      q.save();
      q.translate(dx, 0);
      q.translate(fx, fy); q.scale(Z, Z); q.translate(-fx, -fy);
      try { b.draw(q); } catch (e) {}
      q.restore();
      const x = PAD + i * (CW + PAD);
      c.drawImage(cell, x, HEAD);
      c.fillStyle = '#93a0b8'; c.font = '17px system-ui, sans-serif';
      c.fillText(states[i], x + 2, HEAD + CH + 19);
    }
    return cv.toDataURL('image/png');
  }, { room, states, title });

  if (!url) { console.log('no boss in ' + room); await browser.close(); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(out + '  ' + states.length + ' states' + (errs.length ? '  (' + errs.length + ' page errors)' : ''));
  await browser.close();
})();
