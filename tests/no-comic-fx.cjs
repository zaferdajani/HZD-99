// A HIT IS A GAME EFFECT, NOT A COMIC PANEL — owner, 2026-11-25, of the impact frame: "As a gamer, do
// you think this is a proper effect? It looks more like a comic effect than an actual game effect.
// These straight lines looks like coming from a comic." The screen washed white and black action lines
// burst from the hit; her dash drew anime speed lines across the whole view.
//   A  when she is hit, the middle of the screen (where the fight is) is not washed out or striped:
//      it changes by under 4% in brightness, and nothing is drawn there that was not there before
//   B  ...the edges darken toward the blow instead (the impact is still felt)
//   C  her dash draws nothing across the screen away from her body
//   D  no ring is thrown round her when she is hit
//   E  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── no-comic-fx — a hit and a dash look like a game, not a comic panel');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1 });
    startGame(sv); loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.tut = null; G.enemies = []; player.x = 1600;
    await new Promise(r => setTimeout(r, 2500));
  });
  // a frame with the world held still: the measurement is of the overlay, not of motion
  const grab = (setup) => page.evaluate(async (setup) => {
    window.__hold = window.__hold || window.requestAnimationFrame;
    G.hitStop = 0; cam.shake = 0; G.flash = 0; G.impact = null; player.dashT = 0; player.iT = 1;
    eval(setup);
    await new Promise(r => setTimeout(r, 60));
    const cv = document.querySelector('canvas'), x = cv.getContext('2d');
    const d = x.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height;
    const lum = (x0, y0, x1, y1) => { let s = 0, n = 0; for (let y = Math.floor(y0 * H); y < y1 * H; y += 3) for (let xx = Math.floor(x0 * W); xx < x1 * W; xx += 3) { const i = (y * W + xx) * 4; s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 765; };
    return { mid: lum(0.3, 0.3, 0.7, 0.7), edge: (lum(0, 0, 0.12, 1) + lum(0.88, 0, 1, 1)) / 2, top: lum(0.15, 0.05, 0.85, 0.2) };
  }, setup);
  // freeze the simulation so both frames show the same world
  await page.evaluate(() => { G.paused = true; });
  const rest = await grab('');
  const hit = await grab('G.impact = { t: 0.12, t0: 0.12, x: player.x + player.w / 2, y: player.y + player.h / 2, hurt: 1 }; G.impact.t = 0.11; window.__keepImpact = setInterval(() => { if (G.impact) G.impact.t = 0.11; else G.impact = { t: 0.11, t0: 0.12, x: player.x + player.w / 2, y: player.y + player.h / 2, hurt: 1 }; }, 5);');
  await page.evaluate(() => clearInterval(window.__keepImpact));
  const dash = await grab('window.__keepDash = setInterval(() => { player.dashT = 0.1; player.dashVX = 900; player.dashVY = 0; }, 5);');
  await page.evaluate(() => clearInterval(window.__keepDash));
  const rings = await page.evaluate(() => { G.paused = false; const n0 = (G.rings || []).length; player.iT = 0; player.dead = false; const c0 = player.cores; player.hurt(1, player.x + 40, 'test'); const n1 = (G.rings || []).length; player.cores = c0; return n1 - n0; });
  check('A  a hit does not wash out or stripe the middle of the screen', Math.abs(hit.mid - rest.mid) < 0.04, { rest: +rest.mid.toFixed(3), hit: +hit.mid.toFixed(3) });
  check('B  ...the edges darken toward the blow instead', hit.edge < rest.edge - 0.01, { rest: +rest.edge.toFixed(3), hit: +hit.edge.toFixed(3) });
  check('C  her dash draws nothing across the screen away from her', Math.abs(dash.top - rest.top) < 0.01, { rest: +rest.top.toFixed(3), dash: +dash.top.toFixed(3) });
  check('D  no ring is thrown round her when she is hit', rings === 0, { rings });
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — a hit and a dash look like a game');
})().catch(e => { console.error(e); process.exit(1); });
