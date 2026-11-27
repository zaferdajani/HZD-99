// EVERY FIGHT SAYS HOW FAR IT HAS TO GO — owner, 2026-11-27: "the Eye agent does not show any life or
// health indicator, so I don't know how much more I need to hit it."
// An agent is a robed body in G.enemies, not G.boss, so the guardians' bar never showed for it. It
// does now (js/game.js drawHUD, hudAgent): named, measured down to the 30% floor where its fight is won
// (sageStruck), then filled with the purification. For every boss arena and every agent's chamber:
//   A  in the fight, the bar is drawn with its foe's name (a real name, never a raw key)
//   B  the bar is on the canvas: its lit length is its share of the bar (within 4%)
//   C  a blow that lands shortens it
//   D  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── foe-bar — every boss and every agent wears a health bar with its name');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(() => {
    const out = {};
    const bosses = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'boss'));
    const agents = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'sage'));
    const lit = () => {           // the bar's lit length, read off the canvas, as a share of its 472 px
      const kx = cv.width / 960, ky = cv.height / 540, y = Math.round(502 * ky), d = c.getImageData(0, y, cv.width, 1).data;
      let n = 0; for (let x = Math.round(244 * kx); x < Math.round(716 * kx); x++) { const i = x * 4; if (d[i] + d[i + 1] + d[i + 2] > 300) n++; }
      return n / (472 * kx);
    };
    const one = (id, agent) => {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, nfMeet: 1, crystal: 1, crystal2: 1, bossChime: 0 });
      if (id === 'CV3') sv.flags.crystal = 0;
      if (id === 'B4') sv.flags.connector = 1;
      startGame(sv);
      try { loadRoom(id); } catch (e) { return { err: String(e).slice(0, 80) }; }
      const foe = () => agent ? G.enemies.find(e => e.kind === 'sage') : G.boss;
      const f = foe(); if (!f) return { err: 'no foe' };
      if (!agent) { f.st = 'idle'; f.t = 99; f.meet = false; f.hideBar = false; }
      for (let i = 0; i < 90; i++) { player.iT = 99; player.cores = player.maxCores(); G.dialog = G.cut = G.meet = G.wake = G.tut = null; G.state = 'PLAY'; if (!agent && (f.st === 'dorm' || f.st === 'intro')) f.st = 'idle'; f.hideBar = false; update(1 / 60); }
      G.dialog = G.cut = G.meet = null; G.state = 'PLAY';
      draw(); const b0 = G.hudBar ? Object.assign({}, G.hudBar) : null, l0 = lit();
      // a blow, the way hers land
      const max = agent ? f.hpMax0 : f.hpMax;
      f.iT = 0; f.hurtT = 0; if ('hideK' in f) f.hideK = 1; f.evadeT = 0;
      dealDmg(f, Math.round(max * 0.2), 'phys', f.x + f.w / 2, f.y + f.h / 2, true, 'slash');
      if (f.hp > max * 0.95) f.hp = Math.round(max * 0.75);     // (a guardian that turned the blow: its health is what the bar reads)
      draw(); const b1 = G.hudBar ? Object.assign({}, G.hudBar) : null, l1 = lit();
      return { name: b0 && b0.name, k0: b0 && +b0.k.toFixed(3), lit0: +l0.toFixed(3), k1: b1 && +b1.k.toFixed(3), lit1: +l1.toFixed(3) };
    };
    for (const id of bosses) out[id] = one(id, false);
    for (const id of agents) out[id] = one(id, true);
    return out;
  });
  const ids = Object.keys(R), ok = r => r && !r.err;
  const by = f => Object.fromEntries(ids.map(id => [id, ok(R[id]) ? f(R[id]) : R[id]]));
  check('A  every boss (' + ids.filter(i => !/^G/.test(i)).length + ') and every agent (' + ids.filter(i => /^G/.test(i)).length + ') fight draws a bar with its name', ids.length >= 20 && ids.every(id => ok(R[id]) && R[id].name && !/^(b_|mini_|sg_t_)/.test(R[id].name)), by(r => r.name));
  check('B  the bar is on the canvas, as long as its share (within 4%)', ids.every(id => ok(R[id]) && Math.abs(R[id].lit0 - R[id].k0) <= 0.04 && Math.abs(R[id].lit1 - R[id].k1) <= 0.04), by(r => [r.k0, r.lit0, r.k1, r.lit1]));
  check('C  a blow that lands shortens it', ids.every(id => ok(R[id]) && R[id].k1 < R[id].k0 - 0.02), by(r => r.k0 + ' -> ' + r.k1));
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every fight shows how far it has to go');
})().catch(e => { console.error(e); process.exit(1); });
