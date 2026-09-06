// PHOTOGRAPH THE TINKER'S SEVEN POSES, drawn by the game's own renderer.
//
// The rule this exists to satisfy is ART_BIBLE §5: look at it LARGE before
// believing it. A plate set is exactly the class of art that looks right on
// the contact sheet and wrong once the code picks the anchor — a foot that
// floats, a body that jumps sideways when the arm goes out, a hunched frame
// scaled up to standing height. None of that is visible at game scale in a
// dark room, so each pose is forced and drawn zoomed onto a bare field.
//
//   node tools/tinkershot.cjs <out.png>
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'tinker.png';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const url = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A0B');
    const s = G.statics.find(q => q.type === 'npc' && q.extra === 'ratchet');
    if (!s) return null;
    G.save.flags['on_' + npcKey(s)] = 1;                 // charged: he is awake
    ['ratchetWork1', 'ratchetWork2', 'ratchetTic', 'ratchetNotice',
     'ratchetTalk1', 'ratchetTalk2', 'ratchetVent'].forEach(mediaFetch);
    // the plates are ~840 KB each and this is the whole point of the photo, so
    // wait for them rather than photographing the atlas fallback
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      await new Promise(r => requestAnimationFrame(r));
      if (mediaHas('ratchetWork1') && mediaHas('ratchetWork2') && mediaHas('ratchetTic') &&
          mediaHas('ratchetNotice') && mediaHas('ratchetTalk1') && mediaHas('ratchetTalk2') &&
          mediaHas('ratchetVent')) break;
    }
    const poses = ['work1', 'work2', 'tic', 'notice', 'talk1', 'talk2', 'vent'];
    const CW = 360, CH = 420, PAD = 10, HEAD = 40, FOOT = 26;
    const cv = document.createElement('canvas');
    cv.width = PAD + poses.length * (CW + PAD);
    cv.height = HEAD + CH + FOOT;
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e14'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 24px system-ui, sans-serif';
    c.fillText('RATCHET — the plate set, drawn by drawTinker', PAD, 29);

    const cell = document.createElement('canvas');
    cell.width = CW; cell.height = CH;
    const q = cell.getContext('2d');
    // one zoom for the whole sheet, and a drawn FLOOR LINE: the anchor bug this
    // is looking for is a pose whose feet leave it, and a floor you cannot see
    // is a floor you cannot check against.
    const GY = CH - 44, Z = 2.2;
    for (let i = 0; i < poses.length; i++) {
      q.clearRect(0, 0, CW, CH);
      q.fillStyle = '#171c26'; q.fillRect(0, 0, CW, CH);
      q.strokeStyle = '#3d4657'; q.lineWidth = 1;
      q.beginPath(); q.moveTo(0, GY + 0.5); q.lineTo(CW, GY + 0.5); q.stroke();
      q.beginPath(); q.moveTo(CW / 2 + 0.5, 0); q.lineTo(CW / 2 + 0.5, CH); q.stroke();
      const shim = { x: 0, y: 0, w: s.w, h: s.h, extra: 'ratchet', room: 'A0B', t: 0, _tk: null };
      q.save();
      q.translate(CW / 2, GY); q.scale(Z, Z);
      q.translate(-(shim.w / 2), -shim.h);
      // build the state without drawing — two drawTinker calls would leave two
      // bodies overlaid, which is a lie in a photograph and a bug in a measurement
      tinkerRig(shim);
      shim._tk.pose = poses[i]; shim._tk.t = 9;
      drawTinker(q, shim, poses[i] === 'talk1' || poses[i] === 'talk2');
      q.restore();
      const x = PAD + i * (CW + PAD);
      c.drawImage(cell, x, HEAD);
      c.fillStyle = '#9fb0c8'; c.font = '15px system-ui, sans-serif';
      c.fillText(poses[i], x + 6, HEAD + CH + 18);
    }
    return cv.toDataURL('image/png');
  });
  if (!url) { console.error('no ratchet in A0B'); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  if (errs.length) console.error('page errors:\n  ' + errs.join('\n  '));
  console.log(out + '  ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  await browser.close();
})();
