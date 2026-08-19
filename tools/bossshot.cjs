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
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
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
    const q = cell.getContext('2d');
    for (let i = 0; i < states.length; i++) {
      b.st = states[i]; b.t = 0.4; b.dead = false; b.hp = b.hpMax;
      b.hurtT = 0; b.stagT = 0; b.anim = 1.7; b.face = -1; b.faceVis = -1; b.phase = 1;
      b.x = CW / 2 - b.w / 2; b.y = GY - b.h;
      q.clearRect(0, 0, CW, CH);
      q.fillStyle = '#171b24'; q.fillRect(0, 0, CW, CH);
      q.fillStyle = '#0d1017'; q.fillRect(0, GY, CW, CH - GY);
      q.save(); try { b.draw(q); } catch (e) {} q.restore();
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
