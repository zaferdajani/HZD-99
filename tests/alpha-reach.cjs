// NO MOVE THE ALPHA CANNOT LAND — owner, 2026-11-27: "in the alpha fight, the wolf is doing shockwaves
// even when I'm away from it, which is irrelevant and does not serve a purpose. It does not even reach
// me." His far band roared (a 262 px stun) from 375 px, and a claw was thrown from wherever two beats
// of walking left him. Now each move is thrown only from where it reaches her (js/wolves.js
// ALPHA_REACH, alphaStep; the spring's counter and the fury's chained pounces the same, alphakit.js),
// and otherwise he walks in. His howl calls the pack and needs no reach.
// The Wolf King is stepped for a minute against her pacing near, standing far off and backing away,
// in his first phase and in his fury, and every wind-up is checked against the distance at which it
// was begun:
//   A  the roar's shockwave is begun only with her inside its reach (230 px of its 260 px stun)
//   B  the claw and the bite only within the claw's reach (200 px, the step into the swing included)
//   C  the leap (and the fury's chained pounces) within the leap's reach (300 px); the rend within
//      the rend's run along the floor
//   D  he still fights: every one of his moves is used (howl, roar, leap, claw, bite, rend), and
//      standing far off she is walked to, not left alone
//   E  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── alpha-reach — the Wolf King throws nothing that cannot reach her');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const out = { begun: [], seen: {}, farWalk: null, reach: null };
    const WARN = { roarwarn: 'roar', clawwarn: 'claw', bitewarn: 'claw', coil: 'leap', rendwarn: 'rend' };
    const run = (mode, fury) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('A10');
      const b = G.boss; const DT = 1 / 60, W = G.roomDef.w * TILE;
      out.reach = alphaReach(b);
      let last = b.st, h = 11; const r0 = Math.random; Math.random = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9 >>> 0) % 100000) / 100000;
      let near0 = null, nearMin = 1e9, farX = null;
      try {
        for (let f = 0; f < 60 * 60; f++) {
          b.hp = fury ? Math.min(b.hp, b.hpMax * 0.45) : b.hpMax;
          player.cores = 9; player.dead = false; player.iT = -1; player.stunT = 0;
          let x;
          if (mode === 'pace' || f < 240) x = W / 2 + Math.sin(f / 46) * 240;     // (near first: he wakes when she comes)
          else if (mode === 'far') x = farX == null ? (farX = b.cx() > W / 2 ? 4 * TILE : W - 4 * TILE) : farX;   // the far end from him, and she stays there
          else x = b.cx() + (b.cx() > W / 2 ? -1 : 1) * 330;                               // always just out of the leap's reach
          if (b.st !== 'clinch' && b.st !== 'shake') { player.x = clamp(x, 2 * TILE, W - 3 * TILE) - player.w / 2; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = Math.min.apply(null, g) - player.h; player.on = true; }
          b.update(DT);
          if (b.st === 'dorm') continue;
          out.seen[b.st] = (out.seen[b.st] || 0) + 1;
          const ad = Math.abs(player.x + player.w / 2 - b.cx());
          if (mode === 'far' && f >= 300) { if (near0 == null) near0 = ad; nearMin = Math.min(nearMin, ad); }
          if (b.st !== last && WARN[b.st]) out.begun.push({ mode, fury: !!b.fury, st: b.st, move: WARN[b.st], ad: Math.round(ad) });
          last = b.st;
        }
      } finally { Math.random = r0; }
      if (mode === 'far') out.farWalk = { start: Math.round(near0), closest: Math.round(nearMin) };
    };
    for (const mode of ['pace', 'far', 'shy']) { run(mode, false); run(mode, true); }
    return out;
  });
  const by = (move) => R.begun.filter(q => q.move === move);
  const over = (move, lim) => by(move).filter(q => q.ad > lim);
  check('A  the roar\'s shockwave is begun only with her inside its reach (' + R.reach.roar + ' px)', over('roar', R.reach.roar).length === 0 && by('roar').length > 0, { begun: by('roar').length, outOfReach: over('roar', R.reach.roar).slice(0, 5) });
  check('B  the claw and the bite only within the claw\'s reach (' + R.reach.claw + ' px)', over('claw', R.reach.claw).length === 0 && by('claw').length > 0, { begun: by('claw').length, outOfReach: over('claw', R.reach.claw).slice(0, 5) });
  check('C  the leap and the fury\'s pounces within the leap\'s reach (' + R.reach.leap + ' px), the rend within its run (' + Math.round(R.reach.rend) + ' px)', over('leap', R.reach.leap).length === 0 && over('rend', R.reach.rend).length === 0, { leaps: by('leap').length, rends: by('rend').length, out: over('leap', R.reach.leap).concat(over('rend', R.reach.rend)).slice(0, 5) });
  const used = ['howl', 'roar', 'leap', 'claw', 'bite', 'rend'].filter(s => R.seen[s] > 0);
  check('D  he still fights: every move of his is used', used.length === 6, used.join(','));
  check('   ...and standing far off she is walked to, not left alone', R.farWalk && R.farWalk.closest < R.reach.leap, R.farWalk);
  check('E  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — every move he throws can reach her');
})().catch(e => { console.error(e); process.exit(1); });
