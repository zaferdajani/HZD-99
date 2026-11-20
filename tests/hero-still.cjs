// SHE STANDS STILL WITHOUT TWITCHING (owner, 2026-11-20: "hero keeps glitching
// when standing into just like twitching in certain areas").
//
// Two ways the old pose-sheet still — a different drawing of her — flashed in
// for a few frames while she stood, and both are held here:
//   - the frame or two she is off a lip or a bump (the coyote frames): heroState
//     keeps her 'idle', and the idle that draws must be her filmed idle;
//   - a fidget that begins before its filmed take has arrived: she keeps
//     breathing on her idle until it is here, never the sheet.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, opNote: 1, nfGlimpse: 1, nfMeet: 1 });
    startGame(sv); loadRoom('A2'); G.state = 'PLAY'; G.dialog = null; G.wake = G.cut = G.meet = null; G.enemies = [];
    if (typeof requestHeroArt === 'function') requestHeroArt();
    mediaFetch(HERO_IDLE.key, 1);
    for (let i = 0; i < 200 && !(MEDIA_RAW[HERO_IDLE.key] && MEDIA_RAW[HERO_IDLE.key].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    player.x = 30 * TILE; player.y = 2 * TILE;
    for (let f = 0; f < 120; f++) { update(1 / 60); G.dialog = null; }
    const ctx = document.querySelector('canvas').getContext('2d');
    const drawn = () => { G.heroDrawn = null; draw(performance.now()); return String(G.heroDrawn); };
    const out = {};
    // a coyote frame: off the ground a hair, falling slowly, still standing
    const y0 = player.y, on0 = player.on;
    player.on = false; player.coyote = 0.08; player.vy = 60; player.idleT = 0.5;
    out.coyoteState = player.heroState(false); out.coyote = drawn();
    player.on = on0; player.coyote = 0; player.vy = 0; player.y = y0;
    // a fidget bout with its take not here
    const saved = MEDIA_RAW[HERO_FIDGET.key]; delete MEDIA_RAW[HERO_FIDGET.key];
    const mf = window.mediaFetch; window.mediaFetch = (k, u) => k === HERO_FIDGET.key ? undefined : mf(k, u);
    player.idleT = FIDGET_AFTER + FIDGET_BOUT + IDLE_REST + 0.3;   // the second bout: the fidget (the first is the impatient take)
    out.fidgetClip = heroIdleClip(player.idleT); out.fidget = drawn();
    window.mediaFetch = mf; if (saved) MEDIA_RAW[HERO_FIDGET.key] = saved;
    out.idleKey = HERO_IDLE.key;
    return out;
  });
  check('off a lip for a frame she is still standing, and drawn on her own idle — not the old still', R.coyoteState === 'idle' && R.coyote.startsWith(R.idleKey), JSON.stringify([R.coyoteState, R.coyote]));
  check('a fidget whose take is not here keeps her on her idle — not the old still', R.fidgetClip.fidget && !R.fidgetClip.imp && R.fidget.startsWith(R.idleKey), JSON.stringify([R.fidgetClip, R.fidget]));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — standing still, she is one drawing');
})().catch(e => { console.error(e); process.exit(1); });
