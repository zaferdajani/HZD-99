// THE FIRST FRAME OF A FILMED TURN: a guardian standing, facing left, on black,
// as large as a 1280x720 frame will hold it — drawn by the game itself, from
// the art it already wears, so the take that starts on this frame starts on
// the animal the player has been looking at (ART_BIBLE: a filmed strip that
// does not match its rig is a second animal). Also writes the mirrored frame
// (the take's last) and the numbers the cutter needs to put the strip back at
// the same size on the same spot: the zoom, and where the hurt box's middle
// and feet were in the frame.
//
//   node tools/bossframe.cjs <outdir> [kind ...]      # default: every guardian that turns side to side
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const out = process.argv[2] || 'assets/source/turns';
const want = process.argv.slice(3);
const ROOMS_OF = { alpha: 'A10', atlas: 'C3', horn: 'CV3', prism: 'X1', zero: 'D3', glitch: 'A4' };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    for (const kind of (want.length ? want : ['alpha', 'atlas', 'horn', 'prism', 'zero'])) {
      const R = await page.evaluate(async ([id]) => {
        window.requestAnimationFrame = () => 0;
        let seed = 0x0b0d1e5; Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        const realNow = performance.now.bind(performance); let fake = null; performance.now = () => fake == null ? realNow() : fake;
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1; sv.flags.ghMet = 1;
        startGame(sv); loadRoom(id);
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.ghHold = null;
        const b = G.boss; b.meet = null; b.st = 'idle'; b.t = 9; b.dark = 0; b.fade = 0; b.hideBar = false; b.face = b.faceVis = -1; b.vx = b.vy = 0; b.hurtT = 0; b.impactUntil = 0;
        if (b.kind === 'horn' && typeof ghInit === 'function' && !b.missiles) ghInit(b);
        // the dragon's roost is a structure in the room, not the dragon
        if (typeof drgNest === 'function') drgNest = () => {};
        const W = 1280, H = 720;
        const probe = document.createElement('canvas'); probe.width = 900; probe.height = 700; const px = probe.getContext('2d', { willReadFrequently: true });
        const shot = (x, Z, ox, oy) => { x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, x.canvas.width, x.canvas.height);
          x.setTransform(Z, 0, 0, Z, ox - Z * (b.x + b.w / 2), oy - Z * (b.y + b.h)); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
          const pr = G.artProbe; G.artProbe = 1; fake = 60000; b.anim = 0; try { b.draw(x); } catch (e) {} fake = null; G.artProbe = pr; };
        // its extent at 1:1, once the art is resident
        let last = -1, same = 0, box = null; const t0 = Date.now();
        while (Date.now() - t0 < 20000 && same < 8) {
          await new Promise(r => setTimeout(r, 150)); shot(px, 1, 450, 560);
          const d = px.getImageData(0, 0, 900, 700).data; let n = 0, l = 900, r = 0, t = 700, bt = 0;
          for (let y = 0; y < 700; y++) for (let x2 = 0; x2 < 900; x2++) { const i = (y * 900 + x2) * 4; if (d[i] + d[i + 1] + d[i + 2] > 36) { n++; if (x2 < l) l = x2; if (x2 > r) r = x2; if (y < t) t = y; if (y > bt) bt = y; } }
          same = n === last && n > 100 ? same + 1 : 0; last = n; box = { l: 450 - l, r: r - 450, top: 560 - t, below: bt - 560 };
        }
        const Z = Math.min(900 / (box.l + box.r), 540 / (box.top + Math.max(0, box.below)), 6);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
        // the BODY'S middle in the middle of the frame, so the mirrored frame is the same animal on the same spot
        const mid = (box.r - box.l) / 2, ox = W / 2 - Z * mid, oy = 640 - Z * Math.max(0, box.below);
        shot(x, Z, ox, oy);
        const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d'); mx.translate(W, 0); mx.scale(-1, 1); mx.drawImage(cv, 0, 0);
        return { png: cv.toDataURL('image/png'), mirror: m.toDataURL('image/png'), meta: { kind: b.kind, room: id, zoom: +Z.toFixed(4), cx: +ox.toFixed(1), feet: +oy.toFixed(1), hurt: [b.w, b.h], art: box, px: last } };
      }, [ROOMS_OF[kind]]);
      const dir = path.join(out, kind); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'start_left.png'), Buffer.from(R.png.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(dir, 'end_right.png'), Buffer.from(R.mirror.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(dir, 'frame.json'), JSON.stringify(R.meta, null, 2) + '\n');
      console.log(kind, JSON.stringify(R.meta));
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
