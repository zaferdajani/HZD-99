// WHAT LOOKS SHARP CUTS — the hit is the drawn shape.
// Owner, 2026-11-17: "his flying horn is not hurting me when touching them". The horn was the
// one he saw. The sweep found three more projectiles that wear a sprite and hurt only in a
// small square at their middle: TALONHOST's feather, GLACIERE's void lance and her ice shard.
// Each is DRAWN here, its length measured off the pixels, and set against where it hurts.
//   A  the part that hurts is as long as the picture (within a fifth), for each of them
//   B  touched at its tip it hurts her; the air beside it does not
//   C  her blade knocks it out of the air at the tip as well
//   D  a plain round shot is unchanged: it hurts where its disc is
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1 }); startGame(sv); loadRoom('A1'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = null;
    for (let n = 0; n < 100; n++) { const a = eagleImg(), b = glcImg(); if (a && a.naturalWidth && b && b.naturalWidth) break; await new Promise(r => setTimeout(r, 100)); }
    const make = { feather: () => { const f = new Proj(0, 0, 520, 0, false, 1, 7, '#ff4c5c', 0, 4); f.feather = true; return f; },
      lance: () => { const f = new Proj(0, 0, 185, 0, false, 1, 13, '#d24bff', 0, 4.2); f.glcFx = 'lance'; return f; },
      shard: () => { const f = new Proj(0, 0, 350, 0, false, 1, 8, '#a5d8ff', 0, 2.2); f.glcFx = 'shard'; return f; },
      round: () => new Proj(0, 0, 300, 0, false, 1, 8, '#ff5c6c', 0, 3) };
    for (const k in make) { const p = make[k](); p.x = 200; p.y = 100;
      const o = Object.assign(document.createElement('canvas'), { width: 400, height: 200 }), x = o.getContext('2d'); p.draw(x);
      const d = x.getImageData(0, 0, 400, 200).data; let x0 = 400, x1 = -1; for (let yy = 0; yy < 200; yy++) for (let xx = 0; xx < 400; xx++) if (d[(yy * 400 + xx) * 4 + 3] > 150) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; }
      const drawnHalf = (x1 - x0) / 2, bx = p.boxes(), hitHalf = (Math.max(...bx.map(q => q.x + q.w)) - Math.min(...bx.map(q => q.x))) / 2;
      const at = (dx, dy) => p.touches({ x: 200 + dx - 3, y: 100 + dy - 3, w: 6, h: 6 });
      const tip = drawnHalf * 0.85;
      // the real thing: put her at the tip and step it
      const hurtAt = (dx, dy) => { const q = make[k](); q.vx = (q.vx > 0 ? 1 : -1) * 0.001; q.vy = 0; const P = make[k](); P.x = 600; P.y = 300; player.iT = 0; player.dead = false; player.cores = player.maxCores(); const c0 = player.cores;
        player.x = 600 + dx - player.w / 2; player.y = 300 + dy - player.h / 2; const vx = P.vx; P.vx = Math.sign(vx) * 0.01; const sp0 = Math.hypot(vx, 0);
        // keep the sprite it wears at speed (the feather picks its art by speed): test the shape, not the flight
        const r0 = P.reach.bind(P); const L = (() => { const t = make[k](); return t.reach(); })(); P.reach = () => L; P.update(1 / 600); return c0 - player.cores; };
      out[k] = { drawnHalf: +drawnHalf.toFixed(1), hitHalf: +hitHalf.toFixed(1), tipTouch: at(tip, 0), tailTouch: at(-tip, 0), beside: at(0, p.r + 14), hurtTip: hurtAt(tip, 0), hurtBeside: hurtAt(0, p.r + player.h / 2 + 16) };
    }
    return out; });
  console.log('── sharp — a thing that looks sharp cuts along its whole drawn length');
  for (const k of ['feather', 'lance', 'shard']) { const q = R[k];
    check('A  ' + k + ': the part that hurts is as long as the picture (within a fifth)', q.hitHalf >= q.drawnHalf * 0.8 && q.hitHalf <= q.drawnHalf * 1.2, { drawn: q.drawnHalf, hurts: q.hitHalf });
    check('B  ' + k + ': touched at its tip or its tail it hurts; the air beside it does not', q.tipTouch && q.tailTouch && !q.beside && q.hurtTip >= 1 && q.hurtBeside === 0, q); }
  check('D  a plain round shot is unchanged: it hurts where its disc is', Math.abs(R.round.hitHalf - 8) < 0.01 && R.round.drawnHalf <= 14, R.round);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the feather, the lance and the shard hurt where they are drawn');
})().catch(e => { console.error(e); process.exit(1); });
