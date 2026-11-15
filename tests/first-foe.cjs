// HER FIRST FIGHT CAN BE WON (owner, 2026-11-15, playing the phone app:
// "attacking the first enemy is not actually doing any damage. It's passing
// through the enemy. And the enemy is set up on the top of a hill, which is a
// very bad location to start with.")
//
// Both were true, and neither was about the phone:
//   - the opening's first machine goes easy on a player who is down to two
//     cores ("nobody dies in the first minute"). It did that by turning CALM —
//     and calm is the cured state, which cannot be hurt and cannot be touched.
//     So the moment she had been stung twice her claw went through it, with
//     the lesson still asking her to strike it;
//   - it spawned on the far slope of the mound the jump lesson climbs.
//
// It now stands on the flat past the mound and keeps to it, and at two cores
// it loses its sting and nothing else. This measures all of it in the real
// opening, on the desktop page and at a phone's size.
//
//   node tests/first-foe.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── first-foe — level ground, a body that can be hit at any health, and a sting that stops at two cores');
    for (const [mode, vp] of [['desktop', { width: 960, height: 540 }], ['phone', { width: 844, height: 390 }]]) {
      const ctx = await browser.newContext({ viewport: vp, hasTouch: mode === 'phone', isMobile: mode === 'phone', serviceWorkers: 'block' });
      const page = await ctx.newPage();
      const errors = []; page.on('pageerror', e => errors.push(String(e)));
      await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof startGame === 'function');
      const R = await page.evaluate(async () => {
        window.requestAnimationFrame = () => 0;
        const stage = () => { const sv = newSave(1); startGame(sv); loadRoom('W2');
          G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null;
          for (let i = 0; i < 90; i++) { player.iT = 9; update(1 / 60); }
          return G.enemies.find(e => e.firstFoe); };
        const out = {};
        // ---- where it stands ----
        let m = stage();
        if (!m) return { none: true };
        const feet = m.y + m.h, cx = m.x + m.w / 2;
        // under it and a body's length either side: flat. Out to 60 px each way: no ramp.
        const at = (d) => { const g = groundColumnAt(cx + d); return g ? g[0] : NaN; };
        const near = [-24, -12, 0, 12, 24].map(at), wide = [-60, -48, -36, -24, -12, 0, 12, 24, 36, 48, 60].map(at);
        out.feet = Math.round(feet); out.ground = wide.map(Math.round);
        out.flat = Math.max(...near) - Math.min(...near); out.off = Math.max(...wide.map(g => Math.abs(g - feet)));
        // she waits on the mound behind it for six seconds: it comes for her and stays on its flat
        let lo = feet, hi = feet, x0 = m.x, xmin = m.x, xmax = m.x;
        for (let i = 0; i < 360; i++) { player.x = x0 - 150; const g = groundColumnAt(player.x + 12); if (g) player.y = g[0] - player.h; player.vx = player.vy = 0; player.iT = 9;
          update(1 / 60); const f = m.y + m.h; lo = Math.min(lo, f); hi = Math.max(hi, f); xmin = Math.min(xmin, m.x); xmax = Math.max(xmax, m.x); }
        out.climb = Math.round(feet - lo); out.sank = Math.round(hi - feet); out.roam = [Math.round(xmin - x0), Math.round(xmax - x0)];
        // ---- the fight, at full health and at two cores, from each side ----
        out.fights = [];
        for (const cores of [5, 2]) for (const side of [-1, 1]) {
          m = stage(); player.cores = cores;
          // standing in it first: does it sting?
          const c0 = player.cores; player.iT = 0;
          for (let i = 0; i < 150; i++) { player.x = m.x + m.w / 2 - player.w / 2; player.y = m.y + m.h - player.h; player.vx = player.vy = 0; update(1 / 60); G.hitStop = 0; if (player.cores < c0) break; }
          const stung = c0 - player.cores; player.cores = cores; player.iT = 9; player.knockT = 0;
          for (let i = 0; i < 40; i++) { player.iT = 9; update(1 / 60); }
          // then two swipes with real input, standing beside it and facing it
          const mx = m.x, my = m.y;
          player.x = side > 0 ? m.x + m.w + 26 - 12 : m.x - 26 - 12; const g = groundColumnAt(player.x + 12); if (g) player.y = g[0] - player.h; player.vx = player.vy = 0;
          const K = side > 0 ? 'ArrowLeft' : 'ArrowRight';
          for (let i = 0; i < 12; i++) { m.x = mx; m.y = my; m.vx = 0; player.iT = 9; keys[K] = i < 2 ? 1 : 0; update(1 / 60); }
          const hp0 = m.hp; let swipes = 0;
          for (let k = 0; k < 2 && !m.dead; k++) { keysP.KeyX = 1; keys.KeyX = 1; swipes++;
            for (let i = 0; i < 26; i++) { if (!m.dead) { m.x = mx; m.y = my; } player.iT = 9; update(1 / 60); keysP.KeyX = 0; if (i > 2) keys.KeyX = 0; } }
          out.fights.push({ cores, side, stung, hp0, hp: m.hp, dead: !!m.dead, swipes, calm: !!m.calm, meek: !!m.meek, solid: typeof bodySolid === 'function' ? null : null, kill: !!G.save.flags.firstKill });
        }
        return out;
      });
      if (R.none) { check(mode + ': the opening has its first machine', false); await ctx.close(); continue; }
      // where it used to stand the floor 40 px away was 35 px off its feet
      check(mode + ': it stands on level ground, with no ramp either side of it', R.flat <= 4 && R.off <= 8, 'the floor under it varies by ' + R.flat.toFixed(0) + ' px; within 60 px it is at most ' + R.off.toFixed(0) + ' px off its feet (feet ' + R.feet + '; ground ' + R.ground.join(',') + ')');
      check(mode + ': ...and keeps to it while she waits up the slope', R.climb <= 4 && R.sank <= 4 && R.roam[0] >= -16 && R.roam[1] <= 16, 'climbed ' + R.climb + ' px, sank ' + R.sank + ' px, roamed ' + R.roam.join('..') + ' px');
      const full = R.fights.filter(f => f.cores === 5), low = R.fights.filter(f => f.cores === 2);
      check(mode + ': at full health it is a real fight: it stings', full.every(f => f.stung === 1), full.map(f => f.stung).join(','));
      check(mode + ': ...and two swipes break it, from either side', full.every(f => f.dead && f.swipes <= 2 && f.kill), full.map(f => 'side ' + f.side + ': hp ' + f.hp0 + '>' + f.hp).join('; '));
      check(mode + ': at two cores it has lost its sting', low.every(f => f.stung === 0 && f.meek && !f.calm), low.map(f => 'stung ' + f.stung + (f.calm ? ' CALM' : '')).join(', '));
      check(mode + ': ...and it can STILL be hit and broken, from either side', low.every(f => f.dead && f.swipes <= 2 && f.kill), low.map(f => 'side ' + f.side + ': hp ' + f.hp0 + '>' + f.hp).join('; '));
      check(mode + ': no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nfirst-foe: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
