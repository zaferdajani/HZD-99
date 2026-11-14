// NULLFANG IS SEEN BEFORE HE IS MET (owner's order, 2026-11-14, hook review
// item 3: "a shadow or roar in the first two minutes raises the question; the
// meeting on the crest then answers it").
//
// js/glimpse.js: on her first arrival past the city gates a dark shape stands
// in the road beyond the jammed winch — head and shoulders at the edge of the
// frame — roars once and bounds away east. Measured here:
//   - it happens once per save, on arrival, and never after the real meeting;
//   - it is a GLIMPSE: his head is inside the frame and his body is not;
//   - it takes nothing from her: no state change, no entity, no boss, no hit,
//     and her controls answer through all of it;
//   - it roars, and it leaves the way the road runs.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(async () => {
    const fresh = (flags) => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1 }, flags || {});
      startGame(sv); loadRoom('A0'); G.wake = G.cut = G.dialog = null; G.state = 'PLAY'; player.x = 40; };
    fresh();
    for (const k of GLIMPSE_KEYS) mediaFetch(k, 1);
    for (let i = 0; i < 600 && !glimpseReady(); i++) await new Promise(r2 => setTimeout(r2, 25));
    const out = { art: glimpseReady() };
    const sounds = []; const bs0 = beastSound; beastSound = (cue) => { sounds.push(cue); };
    fresh();
    const cores0 = player.cores, foes0 = G.enemies.length;
    const phases = [], frame = [];
    let moved = 0, states = new Set(), bossSeen = false, hurt = false, maxShake = 0, x0 = null, xEnd = null;
    for (let i = 0; i < 420; i++) {
      // she walks right through the middle of it: her controls are hers
      if (i === 60) { keys.ArrowRight = 1; }
      if (i === 100) { keys.ArrowRight = 0; }
      const px = player.x;
      update(1 / 60);
      if (i >= 60 && i < 100) moved += player.x - px;
      states.add(G.state); if (G.boss) bossSeen = true; if (player.cores < cores0) hurt = true; maxShake = Math.max(maxShake, cam.shake);
      if (GLIMPSE.on) {
        if (phases[phases.length - 1] !== GLIMPSE.ph) phases.push(GLIMPSE.ph);
        if (x0 == null) x0 = GLIMPSE.x; xEnd = GLIMPSE.x;
        if (GLIMPSE.ph === 'watch' && GLIMPSE.t > 0.5 && !frame.length) {
          updateCam(player.x + player.w / 2, player.y + player.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60);
          const z = cam.zoom || 1, right = cam.x + 480 + 480 / z, H = 256 * BEAST_STRIP_PX;
          frame.push({ head: Math.round(GLIMPSE.x - H * 0.54 - right), body: Math.round(GLIMPSE.x - right), winch: G.enemies.some(e => e.mechanism === 'winch' && e.x < GLIMPSE.x) });
        }
      }
    }
    out.first = { phases, flag: !!G.save.flags.nfGlimpse, over: !GLIMPSE.on, sounds: sounds.slice(), moved: Math.round(moved), states: [...states], bossSeen, hurt,
      foes: G.enemies.length === foes0, shake: +maxShake.toFixed(1), east: xEnd > x0 + 200, frame: frame[0] };
    // once: back through the room, nothing
    sounds.length = 0; loadRoom('A0'); G.wake = G.cut = G.dialog = null; G.state = 'PLAY'; player.x = 40;
    let again = false; for (let i = 0; i < 200; i++) { update(1 / 60); if (GLIMPSE.on) again = true; }
    out.again = again;
    // never after the real meeting, and not on a save already past the booth
    const never = (flags) => { fresh(flags); let on = false; for (let i = 0; i < 200; i++) { update(1 / 60); if (GLIMPSE.on) on = true; } return on; };
    out.afterMeet = never({ nfMeet: 1 });
    out.afterBooth = never({ ratchetRepaired: 1 });
    beastSound = bs0;
    return out;
  });

  check('his art is here by the time she is through the gates', r.art);
  check('he is there on her first arrival: he watches, roars, and leaves', r.first.phases.join('>') === 'watch>roar>leave' && r.first.over, r.first.phases.join('>'));
  check('...a glimpse: his head is inside the frame and the rest of him is not', r.first.frame && r.first.frame.head < -10 && r.first.frame.body > 0, JSON.stringify(r.first.frame));
  check('...beyond the jammed winch, where she cannot get to him', r.first.frame && r.first.frame.winch);
  check('...he roars once, and the ground answers', r.first.sounds.filter(q => q === 'roar').length === 1 && r.first.shake >= 4, r.first.sounds.join(',') + ' shake ' + r.first.shake);
  check('...and goes east, the way the road runs', r.first.east);
  check('it takes nothing from her: she plays through it, untouched, and nothing joins the room',
    r.first.states.join() === 'PLAY' && !r.first.bossSeen && !r.first.hurt && r.first.foes && r.first.moved > 40, JSON.stringify({ s: r.first.states, moved: r.first.moved }));
  check('once per save', r.first.flag && !r.again);
  check('never after the real meeting, and not on a save already past the booth', !r.afterMeet && !r.afterBooth);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — she has seen him, and has not met him');
})().catch(e => { console.error(e); process.exit(1); });
