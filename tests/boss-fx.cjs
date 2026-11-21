// EVERY GUARDIAN'S BLOW HAS LIGHT ON IT (owner, 2026-11-15: "improve the
// fights for all the sages and the microbosses").
//
// js/boss-fx.js gives the five sages after NULLFANG and the micro-bosses the
// three effect beats the lion's fight has, from one rule: a wind-up gathers
// light for as long as it runs, the strike that follows fires one effect at
// the body, and a walker's hard landing runs a wave through the ground. This
// runs every one of those fights on seeded dice and measures that the rule
// reached it — and that it never does the two things it must not: light a
// wind-up that was broken off as if it struck, or draw further out than the
// body it is on.
//
//   node tests/boss-fx.cjs
const { chromium } = require('playwright');
const FIGHTS = [['B4', 'brood'], ['X1', 'prism'], ['C3', 'atlas'], ['D3', 'zero'], ['E3', 'mother'],
  ['CV3', 'horn'], ['A9', 'chime'], ['B8', 'carrier'], ['C7', 'moth'], ['D6', 'lattice'], ['E6', 'lens']];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── boss-fx — the wind-up gathers, the strike lights, the landing goes through the ground: eleven fights');
    let walkersLanded = 0, walkers = 0;
    for (const [id, kind] of FIGHTS) {
      const R = await page.evaluate(async ([id]) => {
        window.requestAnimationFrame = () => 0;
        let s = 0x51f0c0de; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1; sv.flags.ghMet = 1; if (id === 'B4') Object.assign(sv.flags, { crystal: 1, crystal2: 1, connector: 1 });   // (TALONHOST is home once the throw is hers)
        startGame(sv); loadRoom(id);
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.ghHold = null; G.toasts = [];
        const b = G.boss; b.meet = null; if (b.st === 'dorm' || b.st === 'intro') { b.st = 'idle'; b.t = 0.5; }
        if (b.kind === 'horn' && typeof ghInit === 'function' && !b.missiles) ghInit(b);
        b.dark = 0; b.fade = 0;
        const fired = []; const fxWas = fx; let frame = 0;
        fx = (k, x, y, o) => { const ref = fxWas(k, x, y, o); fired.push({ k, f: frame, rx: (o && o.rx) || 120, ry: (o && o.ry) || 120, ref, follow: !!(o && o.follow) }); return ref; };
        const out = { kind: b.kind, flies: bossFlies(b), size: Math.max(b.w, b.h), tells: 0, gathered: 0, gatherDur: 0, strikes: 0, lit: 0, unlit: [], broken: 0, brokenLit: 0,
          lands: 0, landFx: 0, tooWide: [], listMax: 0, states: {} };
        let prev = b.st, tellT0 = 0, tellRun = 0, tellQual = false, glow = null;
        for (frame = 0; frame < 60 * 45; frame++) {
          player.iT = 9; player.cores = 5; b.hp = Math.max(b.hp, b.hpMax * 0.7);
          let side = (Math.floor(frame / 300) % 2) ? 1 : -1;
          { const want = b.cx() + side * (b.w / 2 + 60); if (want < 24 || want > G.roomDef.w * TILE - 24) side = -side; }
          player.x = b.cx() + side * (b.w / 2 + 60) - player.w / 2; player.vx = 0;
          const vy0 = b.vy || 0, n0 = fired.length;
          update(1 / 60); G.hitStop = 0; cam.shake = 0;
          out.listMax = Math.max(out.listMax, FXGL.list.length);
          const now = b.st, here = fired.slice(n0);
          out.states[now] = 1;
          if (now !== prev) {
            const wasTell = TELL_ST.test(prev), isTell = TELL_ST.test(now);
            if (wasTell) {
              // a wind-up that ran its length is followed by the blow, whatever the next state is called
              const ran = tellQual ? tellRun / 60 / Math.max(0.01, tellT0) : 1;
              // the light it gathered lasted as long as the wind-up actually ran
              if (glow && glow.ref && Math.abs(glow.ref.dur - tellRun / 60) <= 0.09 && glow.alive) out.gatherDur++;
              glow = null;
              const hit = here.find(e => e.k === 'slash' || e.k === 'shock' || e.k === 'flash');
              if (ran > 0.9) { out.strikes++; if (hit) out.lit++; else if (out.unlit.length < 4) out.unlit.push(prev + '>' + now); }
              else if (ran < 0.7) { out.broken++; if (hit) out.brokenLit++; }
              if (hit && (hit.rx > 190.5 || hit.ry > 190.5)) out.tooWide.push(now + ' ' + hit.k + ' ' + hit.rx);
            }
            if (isTell) {
              tellT0 = b.t || 0; tellRun = 0; tellQual = tellT0 >= 0.4;
              if (tellQual) { out.tells++; out.ended = out.tells - 1; const g = here.find(e => e.k === 'gather'); if (g && g.follow) { out.gathered++; glow = g; } }
            }
            prev = now;
          }
          if (TELL_ST.test(now)) tellRun++;
          // ...and it is still in the effect list on every frame of the wind-up but the last
          if (glow && glow.ref) glow.alive = glow.alive !== false && (FXGL.list.indexOf(glow.ref) >= 0 || !TELL_ST.test(now));
          if (!out.flies && vy0 > 260 && Math.abs(b.vy || 0) < 24) { out.lands++; if (here.some(e => e.k === 'ground') && here.some(e => e.k === 'cracks')) out.landFx++; }
        }
        // the art probe: a landing staged by hand must lay nothing on the floor
        G.artProbe = 1; const n1 = fired.length;
        if (!out.flies) { b._poseStart = { x: b.x, y: b.y, st: b.st, vx: 0, vy: 400 }; b.vy = 0; bossFxStep(b, 1 / 60, b._poseStart); }
        out.probeGround = fired.slice(n1).filter(e => e.k === 'ground' || e.k === 'cracks').length;
        G.artProbe = 0;
        // ...and outside the probe the same staging does
        const n2 = fired.length;
        if (!out.flies) { b._poseStart = { x: b.x, y: b.y, st: b.st, vx: 0, vy: 400 }; b.vy = 0; bossFxStep(b, 1 / 60, b._poseStart); }
        out.stagedGround = fired.slice(n2).filter(e => e.k === 'ground' || e.k === 'cracks').length;
        fx = fxWas; out.max = FXGL.max; out.states = Object.keys(out.states).length;
        return out;
      }, [id]);
      console.log('  ── ' + kind + '  (' + R.states + ' states; ' + R.tells + ' wind-ups of 0.4 s or more, ' + R.strikes + ' strikes, ' + R.broken + ' broken off, ' + R.lands + ' hard landings)');
      check(kind + ': every wind-up gathers light, for exactly as long as it runs, riding the body', R.tells >= 4 && R.gathered === R.tells && R.gatherDur >= R.tells - 1, R.gathered + ' of ' + R.tells + ' (' + R.gatherDur + ' lasting the wind-up\'s own length)');
      check(kind + ': every strike that follows one fires an effect at the body', R.strikes >= 3 && R.lit === R.strikes, R.lit + ' of ' + R.strikes + (R.unlit.length ? '; dark: ' + R.unlit.join(', ') : ''));
      check(kind + ': a wind-up that was broken off lights no strike', R.brokenLit === 0, R.brokenLit + ' of ' + R.broken);
      check(kind + ': no effect is drawn further out than the body it is on', R.tooWide.length === 0, R.tooWide.join('; ') || 'body ' + R.size + ' px');
      if (!R.flies) {
        walkers++; walkersLanded += R.lands;
        check(kind + ': a hard landing goes through the ground — and never under the art probe', R.landFx === R.lands && R.stagedGround === 2 && R.probeGround === 0, R.landFx + ' of ' + R.lands + ' in the fight; staged ' + R.stagedGround + ', probed ' + R.probeGround);
      }
      check(kind + ': the effect list stays inside its ceiling', R.listMax <= R.max, R.listMax + ' of ' + R.max);
    }
    const own = await page.evaluate(() => ({ glitch: !!BOSS_FX_OWN.glitch, alpha: !!BOSS_FX_OWN.alpha }));
    check('NULLFANG and the Alpha keep their own hand-placed effects', own.glitch && own.alpha);
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nboss-fx: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
