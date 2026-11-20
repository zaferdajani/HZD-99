// THE WOLF KING'S OWN MOVES (owner, 2026-11-15: "as for the Wolf King, the
// Alpha, you need to add special effects, special moves, special attacks.
// With sound effects and visual effects to improve it.")
//
// js/alphakit.js gave the Alpha a REND (claw-waves along the ground), a FURY
// at half health, a QUAKE under every fury leap that lands, and an effect and
// a sound on every move it already had. This stages each one in the real
// build and measures what it claims — and that the things a new move is never
// allowed to buy are still there: the length of its warning, a way out of it,
// and the rest after it.
//
//   node tests/alpha-kit.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── alpha-kit — the rend, the fury, the quake, and what every old move wears now');
    const stage = `
      window.requestAnimationFrame = () => 0;
      let s = 0x0a1fa000; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv); loadRoom('A10');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.toasts = [];
      const b = G.boss; b.meet = null; b.st = 'rest'; b.t = 0.4; b.dark = 0; b.fade = 0; G.enemies = G.enemies.filter(e => e === b);
      // (the fight OPENS on the howl now, and it springs clear of a mash and snaps at the air above it —
      // tests/boss-skill.cjs holds those. Here each move is asked for by name, so the opening call is
      // marked as made and the crowd-answers are kept quiet.)
      b.called = 1;
      const heard = [], fxs = [], rips = []; const sfxWas = sfx, fxWas = fx, srWas = shockRipple;
      sfx = (n) => { heard.push(n); }; fx = (k, x, y, o) => { fxs.push(k); return fxWas(k, x, y, o); };
      shockRipple = (x, y, o) => { rips.push(Object.assign({}, o)); return srWas(x, y, o); };
      // settle it on its floor, with her far away and untouchable
      for (let i = 0; i < 30; i++) { player.iT = 9; b.st = 'rest'; b.t = 0.4; update(1 / 60); }
      const floorY = b.y + b.h;
      // stand her dx px in front of it (it faces her), on the floor
      const put = (dx) => { const side = (b.cx() > G.roomDef.w * TILE / 2) ? -1 : 1; player.x = b.cx() + side * dx - player.w / 2; player.y = floorY - player.h; player.vx = player.vy = 0; return side; };
      const run = (n, each) => { for (let i = 0; i < n; i++) { if (each && each(i) === false) return i; update(1 / 60); G.hitStop = 0; } return n; };
      // ask for the next move from a band: the selection itself is left to choose
      const ask = (band, mid) => { b.st = 'rest'; b.t = 0; b.band = (band + 2) % 3; b.reposN = 0; b.denied = 0; b.midAlt = mid; b.vx = 0; b.struckN = 0; b.plungedT = 0; b.overT = 0; b.chainN = 9; };
    `;

    // ---- A. THE REND -----------------------------------------------------------
    const A = await page.evaluate(new Function(`return (async () => { ${stage}
      const out = { order: [] };
      // the middle distance takes turns: leap, rend, leap, rend
      for (let k = 0; k < 4; k++) { put(220); player.iT = 9; ask(1, b.midAlt);
        let st = null; run(8, () => { player.iT = 9; if (b.st !== 'rest') { st = b.st; return false; } }); out.order.push(st);
        run(200, () => { player.iT = 9; put(220); if (b.st === 'rest' && b.t > 0.05 && k < 3) return false; }); }
      // one rend, measured: she stands still on the floor in front of it
      const side = put(220); ask(1, true);
      let warn = 0, wave0 = null, waveFar = 0, lit = 0;
      const c0 = player.cores; player.iT = 0;
      const log0 = (G.dmgLog && G.dmgLog['alpha.rend']) || 0;
      let restT = null, waves = 0, rendDir = 0;
      run(240, () => {
        if (b.st === 'rendwarn') { warn++; rendDir = b.rendDir; }
        if (b.rends && b.rends.length) { waves = Math.max(waves, b.rends.length); const w = b.rends[0]; if (wave0 == null) wave0 = w.x; waveFar = Math.max(waveFar, Math.abs(w.x - wave0)); }
        if (b.st === 'rest' && restT == null && warn) { restT = b.t; }
        if (restT != null && !(b.rends && b.rends.length)) return false;
      });
      out.warn = warn / 60; out.TELL_SWIPE = TELL_SWIPE; out.cores = c0 - player.cores; out.logged = ((G.dmgLog && G.dmgLog['alpha.rend']) || 0) - log0;
      out.toward = rendDir === side; out.restT = restT; out.waves = waves; out.heard = ['alpha_rendwarn', 'alpha_rend'].filter(n => heard.includes(n)); out.fx = fxs.includes('slash');
      // ...and the same blow against a girl who is in the air when it arrives, and one who is out of its reach
      const air = async (dx, up) => { put(dx); ask(1, true); player.iT = 0; const c1 = player.cores; let far = 0, x0 = null;
        run(240, () => { if (up && b.rends && b.rends.length) { player.y = floorY - player.h - 90; player.vy = 0; } else put(dx);
          if (b.rends && b.rends.length) { if (x0 == null) x0 = b.rends[0].x; far = Math.max(far, Math.abs(b.rends[0].x - x0)); }
          if (b.st === 'rest' && b.t > 0.05 && x0 != null && !(b.rends && b.rends.length)) return false; });
        return { lost: c1 - player.cores, far }; };
      out.jumped = await air(220, true);
      out.beyond = await air(420, false);
      sfx = sfxWas; fx = fxWas; return out;
    })()`));
    check('A. the middle distance takes turns: the leap, then the rend', A.order.join(',') === 'coil,rendwarn,coil,rendwarn', A.order.join(' > '));
    check('   the rend is warned for TELL_SWIPE, aimed at her, in its own voice', Math.abs(A.warn - A.TELL_SWIPE) <= 0.04 && A.toward && A.heard.length === 2, A.warn.toFixed(3) + ' s (' + A.TELL_SWIPE + '); heard ' + A.heard.join(','));
    check('   it tears along the ground and takes ONE core from a girl who stands in it', A.waves >= 1 && A.cores === 1 && A.logged === 1 && A.fx, A.waves + ' wave, ' + A.cores + ' core, logged ' + A.logged);
    check('   a girl in the air when it arrives is not touched — and it runs its whole reach under her', A.jumped.lost === 0 && A.jumped.far >= 250, 'cores lost ' + A.jumped.lost + ', ran ' + A.jumped.far.toFixed(0) + ' px');
    check('   ...and it has an END: past its reach she is safe on the floor', A.beyond.lost === 0 && A.beyond.far <= 330, 'cores lost ' + A.beyond.lost + ', ran ' + A.beyond.far.toFixed(0) + ' px');
    check('   it ends in a rest, like every blow beside it', A.restT != null && A.restT >= 0.3, 'rest ' + (A.restT == null ? '-' : A.restT.toFixed(2)) + ' s');

    // ---- B. THE FURY -------------------------------------------------------------
    const B = await page.evaluate(new Function(`return (async () => { ${stage}
      const out = {};
      // above half it never happens
      put(150); b.hp = b.hpMax * 0.55; let early = 0;
      run(120, () => { player.iT = 9; put(150); if (/fury/.test(b.st)) early++; });
      // a blow in progress is not cut short: at half health mid-roar, the roar finishes first
      put(380); ask(2, false); b.alphaAlt = true; run(90, () => { player.iT = 9; put(380); if (b.st === 'roarwarn') return false; }); const during = b.st;
      b.hp = b.hpMax * 0.45; let cut = false, sawRoar = false, stag = 0;
      run(400, () => { player.iT = 9; put(380); if (b.stagT > 0) stag++; if (b.st === 'roar' || b.st === 'howl') sawRoar = true; if (b.st === 'furywarn') { if (!sawRoar) cut = true; return false; } });
      out.during = during; out.cut = cut; out.sawRoar = sawRoar; out.st = b.st; out.stag = stag / 60;
      // the wind-up, and then the roar itself against a girl standing next to it
      const side = put(150); player.iT = 0; const c0 = player.cores; const x0 = player.x;
      let warn = 0, fired = -1, far = 0, n = 0;
      run(300, (i) => { if (b.st === 'furywarn') { warn++; put(150); } if (b.fury && fired < 0) fired = i;
        if (fired >= 0) { far = Math.max(far, (player.x - x0) * side); if (++n > 50) return false; } });
      out.warn = warn / 60; out.TELL_HEAVY = TELL_HEAVY; out.thrown = far; out.cores = c0 - player.cores; out.fury = !!b.fury;
      out.heard = ['alpha_furywarn', 'alpha_fury'].filter(n => heard.includes(n)); out.fx = ['pillar', 'gather'].filter(k => fxs.includes(k));
      out.waves = rips.length; out.rings = ROARFX.length;
      // it rests after it, and it never happens twice
      let rest = 0, again = 0; run(400, () => { player.iT = 9; if (b.st === 'rest') rest = Math.max(rest, b.t); if (b.st === 'furywarn') again++; });
      out.rest = rest; out.again = again;
      // and from then on it burns: embers, and ghosts when it moves fast
      const p0 = parts.length; b.st = 'leap'; b.vx = 400; b.vy = -300; b.t = 1; run(12, () => { player.iT = 9; });
      out.ghosts = (b.ghosts || []).length;
      sfx = sfxWas; fx = fxWas; return out;
    })()`));
    check('B. above half health there is no fury', B.fury && B.warn > 0 && B.during === 'roarwarn', 'state while above half: ' + B.during);
    check('   at half the midpoint stagger is still hers, and the blow in progress is finished first', !B.cut && B.sawRoar && B.stag >= 1.3, 'staggered ' + B.stag.toFixed(2) + ' s, then ' + (B.sawRoar ? 'the roar, then ' : '') + B.st);
    check('   it is warned for TELL_HEAVY, in its own voice', Math.abs(B.warn - B.TELL_HEAVY) <= 0.05 && B.heard.length === 2, B.warn.toFixed(3) + ' s (' + B.TELL_HEAVY + '); heard ' + B.heard.join(','));
    check('   the roar THROWS her and does not hurt her', B.thrown >= 60 && B.cores === 0, 'thrown ' + B.thrown.toFixed(0) + ' px, cores lost ' + B.cores);
    check('   ...with the light of it, and a wave through the room instead of drawn rings', B.fx.length === 2 && B.waves >= 2 && B.rings === 0, B.fx.join(',') + '; ' + B.waves + ' waves, ' + B.rings + ' stroked rings');
    check('   it rests afterwards, and it happens once', B.rest >= 0.5 && B.again === 0, 'rest ' + B.rest.toFixed(2) + ' s, again ' + B.again);
    check('   from then on it leaves its ghosts behind it when it moves fast', B.ghosts >= 2, B.ghosts + ' ghosts in a leap');

    // ---- C. THE QUAKE --------------------------------------------------------------
    const C = await page.evaluate(new Function(`return (async () => { ${stage}
      const leap = (fury, place) => { b.fury = fury ? 1 : 0; const side = put(220); ask(1, false); player.iT = 9;
        let mark = null, landed = null, st0 = null; const c0 = player.cores; const q0 = (G.dmgLog && G.dmgLog['alpha.quake']) || 0;
        run(8, () => { player.iT = 9; if (b.st !== 'rest') { st0 = b.st; return false; } });
        mark = b.quakeX;
        run(260, () => {
          if (b.st === 'coil') { player.iT = 9; put(220); }
          else if (b.st === 'leap') { player.iT = 0; place(mark == null ? alphaLeapMark(b) : mark, side); }
          else if (b.st === 'turn' || b.st === 'recoil') { if (landed == null) landed = b.cx(); return false; } });
        const out = { st0, mark, landed, end: b.st, lost: c0 - player.cores, quake: ((G.dmgLog && G.dmgLog['alpha.quake']) || 0) - q0 };
        run(60, () => { player.iT = 9; }); return out; };
      const stand = (off) => (x, side) => { player.x = x + side * off - player.w / 2; player.y = floorY - player.h; player.vx = player.vy = 0; player.on = true; };
      const hang = (off) => (x, side) => { player.x = x + side * off - player.w / 2; player.y = floorY - player.h - 110; player.vx = player.vy = 0; };
      const out = {};
      out.plain = leap(false, stand(95));      // no fury: a landing is a landing
      out.near = leap(true, stand(95));        // fury, standing 95 px past where it lands
      out.air = leap(true, hang(95));          // fury, the same place, in the air
      out.far = leap(true, stand(175));        // fury, past the quake's reach
      out.heard = heard.includes('alpha_quake'); out.fx = ['ground', 'cracks'].filter(k => fxs.includes(k)); out.reach = ALPHA_FX.quake;
      sfx = sfxWas; fx = fxWas; return out;
    })()`));
    check('C. without the fury a landed leap shakes nothing', C.plain.end === 'turn' && C.plain.lost === 0 && C.plain.mark == null, 'ended ' + C.plain.end + ', cores lost ' + C.plain.lost);
    check('   a fury leap that lands takes a core from a girl standing inside ' + C.reach + ' px of it', C.near.end === 'turn' && C.near.lost === 1 && C.near.quake === 1 && C.heard && C.fx.length === 2, 'ended ' + C.near.end + ', cores ' + C.near.lost + ', quake logged ' + C.near.quake);
    check('   ...the spot was painted from the coil, and it landed there', C.near.mark != null && C.near.landed != null && Math.abs(C.near.mark - C.near.landed) <= 40, 'painted ' + (C.near.mark == null ? '-' : C.near.mark.toFixed(0)) + ', landed ' + (C.near.landed == null ? '-' : C.near.landed.toFixed(0)));
    check('   in the air over the same spot she is not touched', C.air.end === 'turn' && C.air.lost === 0, 'ended ' + C.air.end + ', cores lost ' + C.air.lost);
    check('   and past its reach she is safe on the floor', C.far.end === 'turn' && C.far.lost === 0, 'ended ' + C.far.end + ', cores lost ' + C.far.lost);

    // ---- D. what the old moves wear ---------------------------------------------------
    const D = await page.evaluate(new Function(`return (async () => { ${stage}
      const move = (band, alt, dx, done) => { fxs.length = 0; heard.length = 0; put(dx); b.alphaAlt = alt; ask(band, false);
        let st = []; run(260, () => { player.iT = 9; put(dx); if (st[st.length - 1] !== b.st) st.push(b.st); if (st.length > 2 && b.st === 'rest') return false; });
        return { st: st.join('>'), fx: fxs.filter((k, i) => fxs.indexOf(k) === i).sort().join(','), heard: heard.filter((k, i) => heard.indexOf(k) === i).join(','),
          waves: rips.splice(0).map(r => ({ R: r.R, push: r.push || 0 })), rings: ROARFX.length }; };
      const out = {};
      out.claw = move(0, false, 60);     // alphaAlt flips to true: the claw
      out.bite = move(0, true, 60);      // ...to false: the bite
      out.roar = move(2, true, 380);     // far, alt -> false: the roar
      G.enemies = G.enemies.filter(e => e === b);
      out.howl = move(2, false, 380);    // far, alt -> true with room in the pack: the howl
      out.pack = G.enemies.filter(e => e !== b).map(e => ({ hunt: e.hunt, snarl: e.snarlT > 0 }));
      sfx = sfxWas; fx = fxWas; return out;
    })()`));
    check('D. the claw draws its arc and has its own sound', /claw/.test(D.claw.st) && /slash/.test(D.claw.fx) && /alpha_claw/.test(D.claw.heard), D.claw.st + ' | fx ' + D.claw.fx + ' | ' + D.claw.heard);
    check('   the bite flashes at the jaw and snaps', /bite/.test(D.bite.st) && /flash/.test(D.bite.fx) && /alpha_snap/.test(D.bite.heard), D.bite.st + ' | fx ' + D.bite.fx + ' | ' + D.bite.heard);
    check('   the roar cracks the ground it stands on, with no ring laid on the floor (owner 2026-11-20: "the yellow circle ... underneath it ... so bad"), and its wave ends where its stun does', /roar/.test(D.roar.st) && /cracks/.test(D.roar.fx) && !/ground/.test(D.roar.fx) && /alpha_bark/.test(D.roar.heard)
      && D.roar.waves.length >= 1 && D.roar.waves.every(w => w.R <= 262) && D.roar.rings === 0, D.roar.st + ' | fx ' + D.roar.fx + ' | waves ' + D.roar.waves.map(w => w.R).join(','));
    check('   the howl raises its pillar, and the pack it calls arrives hunting', /howl/.test(D.howl.st) && /pillar/.test(D.howl.fx) && D.pack.length >= 1 && D.pack.every(p => p.hunt), D.howl.st + ' | fx ' + D.howl.fx + ' | ' + D.pack.length + ' wolves');
    check('   ...and the howl is a wave through the room, not rings drawn on it', D.howl.waves.length >= 2 && D.howl.waves.some(w => w.push > 0) && D.howl.rings === 0, D.howl.waves.length + ' waves, ' + D.howl.rings + ' stroked rings');

    // ---- E. THE HOWL'S WAVE -------------------------------------------------------
    // (owner, 2026-11-15: "the circles coming from it when it howls ... looking like
    // lines instead of aura ... should vibrate the screen a little bit, nudge it.
    // Maybe push me backward one step ... blended with the screen in a wave-like
    // shock effect")
    const E = await page.evaluate(new Function(`return (async () => { ${stage}
      G.enemies = G.enemies.filter(e => e === b);
      const howl = (opts) => { RIPPLES.length = 0; RIPPLE.nudgeT = 0; const side = put(200); player.iT = 0; b.face = side; b.vx = 0;
        b.st = 'broodcall'; b.t = TELL_HEAVY; b.windT = TELL_HEAVY; b.fired = false; G.save.opts = G.save.opts || {}; G.save.opts.reduceMotion = !!opts.calm; G.artProbe = opts.probe ? 1 : 0;
        const c0 = player.cores, x0 = player.x; let fired = -1, bent = 0, bentMax = 0, nudged = 0, shook = 0, far = 0, live = 0, aura = 0;
        for (let i = 0; i < 200; i++) { update(1 / 60); G.hitStop = 0; G.enemies = G.enemies.filter(e => e === b);
          if (b.st === 'howl' && fired < 0) fired = i;
          if (fired >= 0) { if (b.st !== 'howl' && b.st !== 'rest') { b.st = 'rest'; b.t = 2; }
            draw(performance.now()); if (RIPPLE.bent > 0) bent++; bentMax = Math.max(bentMax, RIPPLE.bent); if (RIPPLE.nudgeT > 0) nudged++; if (RIPPLES.length) live++;
            if (cam.shake >= 2) shook++; far = Math.max(far, (player.x - x0) * side); }
        }
        G.artProbe = 0; G.save.opts.reduceMotion = false;
        return { fired, bent, bentMax, nudged, shook, live, pushed: far, lost: c0 - player.cores, left: RIPPLES.length }; };
      const out = { plain: howl({}), calm: howl({ calm: 1 }), probe: howl({ probe: 1 }) };
      sfx = sfxWas; fx = fxWas; shockRipple = srWas; return out;
    })()`));
    check('E. the howl bends the picture as it passes, for most of a second and a half', E.plain.fired >= 0 && E.plain.bent >= 60 && E.plain.bentMax >= 16, E.plain.bent + ' frames bent, up to ' + E.plain.bentMax + ' sub-rings in one frame');
    check('   it pushes her back one step and costs her nothing', E.plain.pushed >= 12 && E.plain.pushed <= 60 && E.plain.lost === 0, 'pushed ' + E.plain.pushed.toFixed(0) + ' px, cores lost ' + E.plain.lost);
    check('   the frame is nudged when it reaches her, and the screen trembles under the note', E.plain.nudged >= 6 && E.plain.shook >= 20, E.plain.nudged + ' frames nudged, ' + E.plain.shook + ' frames trembling');
    check('   ...and it ends: nothing is left bending the room afterwards', E.plain.left === 0, E.plain.left + ' waves left after 3 s');
    check('   reduced motion keeps the wave and the step back, and drops the bend and the nudge', E.calm.live >= 60 && E.calm.bent === 0 && E.calm.nudged === 0 && E.calm.pushed >= 12, E.calm.live + ' frames alive, ' + E.calm.bent + ' bent, ' + E.calm.nudged + ' nudged, pushed ' + E.calm.pushed.toFixed(0));
    check('   and the art probe sees none of it', E.probe.bent === 0, E.probe.bent + ' frames bent');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nalpha-kit: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
