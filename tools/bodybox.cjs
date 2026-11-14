// WHERE A BODY IS, AS DRAWN.
//
// The engine's boxes (x, y, w, h) are HURT boxes: where a claw has to land.
// They are deliberately smaller than the animal — NULLFANG's is 84 px of a lion
// drawn 208 px long — and that is right for combat and wrong for "can I walk
// through it" (owner, 2026-11-14: "I shouldn't be able to walk through
// enemies"). A wall the size of the hurt box lets her wade 60 px into a mane
// before anything stops her.
//
// This measures each hostile kind's standing silhouette in the running game
// (anatomy only: G.artProbe) and writes its extent relative to its own hurt
// box: how far the drawing reaches left and right of the box's middle, and how
// far above its feet. js/solid.js turns that into the SOLID box — the hurt box
// widened three quarters of the way out to the drawing, never by more than her
// shortest strike can still reach across. tests/solid-enemies.cjs re-measures
// and fails if a body's art has moved away from its row.
//
//   node tools/bodybox.cjs            # writes assets/bodybox.json
//   node tools/bodybox.cjs --print    # measure and print, write nothing
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const PRINT = process.argv.includes('--print');
async function measure(url) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    return await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1;
      startGame(sv);
      const W = 640, H = 520, cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
      const x = cvs.getContext('2d', { willReadFrequently: true });
      const seen = {}, want = [];
      for (const id of Object.keys(ROOMS)) {
        try { loadRoom(id); } catch (e) { continue; }
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null;
        for (const e of [...G.enemies, G.boss].filter(Boolean)) {
          const key = (e === G.boss ? 'boss:' : '') + e.kind;
          if (seen[key]) continue; seen[key] = 1; want.push({ key, id, boss: e === G.boss });
        }
      }
      const out = {};
      for (const w of want) {
        loadRoom(w.id);
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null;
        const e = w.boss ? G.boss : G.enemies.find(q => q.kind === w.key);
        if (!e) continue;
        // at rest, awake, facing left, and with its art resident
        if (w.boss) { e.st = 'idle'; e.t = 9; e.meet = null; e.face = e.faceVis = -1; }
        const shot = () => {
          x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
          x.setTransform(1, 0, 0, 1, W / 2 - (e.x + e.w / 2), H - 120 - (e.y + e.h));
          const pr = G.artProbe; G.artProbe = 1; try { e.draw(x); } catch (er) {} G.artProbe = pr;
          return x.getImageData(0, 0, W, H).data;
        };
        let d = shot(), last = -1, same = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 12000 && same < 6) {             // until the picture stops changing (art arriving)
          await new Promise(r => setTimeout(r, 120)); d = shot();
          let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) n++;
          same = n === last && n > 40 ? same + 1 : 0; last = n;
        }
        let al = W, ar = -1, at = H, n = 0;
        for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (d[(py * W + px) * 4 + 3] > 128) { n++; if (px < al) al = px; if (px > ar) ar = px; if (py < at) at = py; }
        if (n < 40) { out[w.key] = null; continue; }
        const cx = W / 2, floor = H - 120;
        out[w.key] = { hurt: [e.w, e.h], l: Math.round(cx - al), r: Math.round(ar - cx), top: Math.round(floor - at), px: n, room: w.id };
      }
      return out;
    });
  } finally { await browser.close(); }
}
module.exports = { measure };
if (require.main === module) (async () => {
  const R = await measure(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html');
  const table = {};
  for (const k of Object.keys(R).sort()) {
    const m = R[k]; if (!m) { console.log(k.padEnd(14), 'no art measured'); continue; }
    console.log(k.padEnd(14), 'hurt', m.hurt.join('x').padEnd(8), 'art reaches', String(m.l).padStart(4), 'left', String(m.r).padStart(4), 'right', String(m.top).padStart(4), 'up   (' + m.px + ' px, ' + m.room + ')');
    table[k] = { l: m.l, r: m.r, top: m.top, w: m.hurt[0], h: m.hurt[1] };
  }
  if (!PRINT) { fs.writeFileSync(path.join(__dirname, '..', 'assets', 'bodybox.json'), JSON.stringify(table) + '\n'); console.log('wrote assets/bodybox.json (' + Object.keys(table).length + ' bodies)'); }
})().catch(e => { console.error(e); process.exit(1); });
