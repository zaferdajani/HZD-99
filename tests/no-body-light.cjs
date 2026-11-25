// NO LIGHT ROUND A BODY — the ledger's row, said four times ("Why still framed with light ?!!!",
// "remove the ring"), and found again 2026-11-24 by the player who fought NULLFANG: every boss's
// wind-up had an amber bloom drawn BEHIND the animal (a 104+ px radial round its middle), and every
// roar threw three stroked rings and a throat flash centred on the one roaring.
//
// Measured, not asserted: each boss after the rhino (and the rhino) is drawn at rest and in its
// wind-ups, twice — the whole drawing, and with G.artProbe on (the body alone: the probe turns off
// decoration). Light that appears in the whole drawing within a band round the body's own box, above
// its feet, and that was not there at rest, is light round the body. A wind-up may raise its own
// amber ON its body (ART_BIBLE §3.5) and light the floor under it; it may not wrap the body in light.
//   A  no wind-up adds a ring of light round the body (under 2% of the body's own area, net of rest)
//   B  a roar draws no ring: ROARFX stays empty and no ring is added round the boss
//   C  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const BOSSES = [
  { room: 'CV3', name: 'GRAVEHORN', tells: ['hornprep', 'chargewarn', 'tossprep', 'kickprep', 'buckprep'] },
  { room: 'A4', name: 'NULLFANG', tells: ['swipewarn', 'crouch', 'rakewarn', 'rearwarn', 'spitwarn', 'bitewarn'] },
  { room: 'A10', name: 'the Wolf King', tells: ['rendwarn', 'furywarn', 'skywarn', 'bitewarn', 'clawwarn'] },
  { room: 'A9', name: 'CHIME', tells: ['warn'] },
];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  console.log('── no-body-light — a wind-up and a roar put no light round the body');
  const errs = [];
  for (const B of BOSSES) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    page.on('pageerror', e => errs.push(B.room + ': ' + String(e)));
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
    const R = await page.evaluate(async ({ room, tells }) => {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.weaponMode = 'single';
      Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, bossGlitch: 1 }); startGame(sv); loadRoom(room); G.state = 'PLAY';
      G.wake = G.dialog = G.cut = null;
      const b = G.boss; if (!b) return { none: 1 };
      for (let i = 0; i < 60 && b.st === 'dorm'; i++) await new Promise(r => setTimeout(r, 50));
      await new Promise(r => setTimeout(r, 2500)); window.requestAnimationFrame = () => 0;
      const W = 900, H = 700, GY = 560, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      const shot = (st) => {
        b.st = st; b.t = 0.15; b.windT = 0.3; b._tellSt = st; b._tellDur = 0.4; b.dead = false; b.stagT = 0;
        b.x = W / 2 - b.w / 2; b.y = GY - b.h;
        const grab = (probe) => { G.artProbe = probe; c.clearRect(0, 0, W, H); c.save(); try { b.draw(c); } catch (e) {} c.restore(); G.artProbe = 0; return c.getImageData(0, 0, W, H).data; };
        const body = grab(1), all = grab(0);
        let x0 = W, y0 = H, x1 = -1, y1 = -1, n = 0;
        for (let i = 3, p = 0; i < body.length; i += 4, p++) if (body[i] > 40) { const x = p % W, y = (p / W) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        // the band round the body: up to 120 px out from its box, above its feet (the floor is the floor's)
        let ring = 0;
        for (let i = 3, p = 0; i < all.length; i += 4, p++) {
          if (all[i] < 40 || body[i] > 40) continue;
          const x = p % W, y = (p / W) | 0; if (y > y1 - 4) continue;
          const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0, dy = y < y0 ? y0 - y : 0;
          if (dx + dy > 0 && dx < 120 && dy < 120) ring++;
          else if (dx === 0 && dy === 0) { const lum = all[i - 3] + all[i - 2] + all[i - 1]; if (lum > 600) ring++; }
        }
        return { n, ring };
      };
      const rest = shot(b.kind === 'horn' ? 'idle' : b.kind === 'alpha' ? 'rest' : 'idle');
      const out = { rest, tells: {} };
      for (const st of tells) out.tells[st] = shot(st);
      // B: the roar
      const ringsBefore = (G.rings || []).length;
      if (typeof roarWave === 'function') roarWave(b.cx(), b.cy(), '#ffffff');
      out.roarfx = typeof ROARFX !== 'undefined' ? ROARFX.length : 0; out.rings = (G.rings || []).length - ringsBefore;
      return out;
    }, { room: B.room, tells: B.tells });
    if (R.none) { check(B.name + ': the boss is in ' + B.room, false); await page.close(); continue; }
    const worst = Object.entries(R.tells).map(([st, s]) => [st, s.ring - R.rest.ring, s.n]).sort((a, b) => b[1] - a[1])[0];
    check('A  ' + B.name + ': no wind-up adds light round the body', Object.values(R.tells).every(s => s.ring - R.rest.ring <= Math.max(200, R.rest.n * 0.02)),
      'worst ' + worst[0] + ': +' + worst[1] + ' px round a ' + R.rest.n + ' px body (rest ' + R.rest.ring + ')');
    check('B  ' + B.name + ': a roar draws no ring round the one roaring', R.roarfx === 0 && R.rings === 0, { ROARFX: R.roarfx, rings: R.rings });
    await page.close();
  }
  check('C  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — no light round a body');
})().catch(e => { console.error(e); process.exit(1); });
