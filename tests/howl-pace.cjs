// THE HOWL IS RARE, AND WHEN HE HOWLS IT IS HEARD — owner, 2026-11-27: "the alpha is howling too much
// before I reach it. It should be every once in a while... it's losing the significance of the
// howling. Also, when it actually howls when I'm fighting it, it does not produce any sound. The
// howling is so random."
// The road's call (js/wolves.js alphaCall) went every 6.5-10 s from the den's mouth to his floor. It
// calls once as she comes into each room of the road and then every 22-40 s, never within 14 s of
// another howl. In the fight, every move he performs with his head thrown back (the howl's take:
// the pack's call and the fury) plays the RECORDED howl — never an oscillator, never nothing.
//   A  at the den's mouth (A2) for two minutes: a first call within 3 s, then at most one in 20 s
//   B  on the Run (A10R) for two minutes: the same
//   C  walked through quickly — A2's mouth, the Run, his den, a few seconds each — no two howls
//      within 14 s of each other, however the rooms come
//   D  in the fight: the pack's call and the fury each play the recorded howl (al_howl), and no
//      oscillator plays with them
//   E  ...measured: the howl is the loudest thing in the room on a phone — its loudest tenth of a
//      second at least four and a half times her hit (0.082), most of it above 400 Hz, unclipped, and
//      the score steps back under it
//   F  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── howl-pace — the road calls now and then; in the fight his howl is always heard');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    window.requestAnimationFrame = () => 0;
    const out = {};
    const heard = []; let clock = 0;
    const sfx0 = window.sfx; window.sfx = function (n) { if (/^alpha_howl/.test(n)) heard.push([+clock.toFixed(2), n, G.roomId]); return sfx0.apply(this, arguments); };
    const fresh = () => { const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(sv); G.alphaHowlAgo = null; };   // (a fresh run: no howl heard yet)
    const stand = (x) => { player.x = x - player.w / 2; const g = groundColumnAt(x); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; };
    const run = (secs) => { for (let i = 0; i < secs * 60; i++) { for (const k in keys) keys[k] = 0; player.iT = 9; player.cores = player.maxCores(); G.dialog = G.cut = G.wake = null; G.state = 'PLAY'; G.enemies = G.enemies.filter(e => !(typeof isWolf === 'function' && isWolf(e))); update(1 / 60); clock += 1 / 60; } };
    const mouth = () => { loadRoom('A2'); G.state = 'PLAY'; const d = gateDoors().find(q => q.to === 'A10R'); stand(gateWorldX(d) + 60); };
    // A
    fresh(); heard.length = 0; clock = 0; mouth(); run(120); out.A = heard.slice();
    // B
    fresh(); heard.length = 0; clock = 0; loadRoom('A10R'); G.state = 'PLAY'; stand(6 * TILE); run(120); out.B = heard.slice();
    // C: through quickly, twice
    fresh(); heard.length = 0; clock = 0;
    for (let lap = 0; lap < 2; lap++) {
      mouth(); run(4); loadRoom('A10R'); G.state = 'PLAY'; stand(6 * TILE); run(5);
      loadRoom('A10'); G.state = 'PLAY'; stand(3 * TILE); if (G.boss) { G.boss.st = 'dorm'; } run(4);
    }
    out.C = heard.slice();
    // D: the fight's howls
    audioOn(); MUTED = false;
    for (const k of ['al_howl', 'al_howl_far', 'al_growl', 'al_fury']) mediaAudio(k);
    for (let n = 0; n < 60 && !(MBUF.al_howl && MBUF.al_growl); n++) await new Promise(r => setTimeout(r, 100));
    out.loaded = !!MBUF.al_howl;
    const rec = [], osc = [];
    const pb0 = window.playBuf; window.playBuf = function (k) { const ok = pb0.apply(this, arguments); rec.push(k + (ok ? '' : ':missing')); return ok; };
    const tone0 = window.tone, growl0 = window.growl; window.tone = function () { osc.push('tone'); return tone0.apply(this, arguments); }; window.growl = function () { osc.push('growl'); return growl0.apply(this, arguments); };
    fresh(); loadRoom('A10'); G.state = 'PLAY'; G.dialog = G.cut = G.wake = null; const b = G.boss;
    stand(b.cx() - 380); b.st = 'broodcall'; b.t = 0.05; b.called = 1;
    rec.length = osc.length = 0; for (let i = 0; i < 40; i++) { player.iT = 9; G.state = 'PLAY'; G.dialog = null; update(1 / 60); }
    out.D1 = { rec: rec.slice(), osc: osc.slice(), st: b.st };
    rec.length = osc.length = 0;
    if (typeof alphaFuryBegin === 'function') { b.st = 'rest'; b.hp = b.hpMax * 0.4; b.furying = 0; b.fury = 0; alphaFuryBegin(b); }
    out.D2 = { rec: rec.slice(), osc: osc.slice(), st: b.st };
    window.playBuf = pb0; window.tone = tone0; window.growl = growl0;
    // E: the level, rendered through the real sfx()
    const real = AC; const off = new OfflineAudioContext(1, 44100 * 3, 44100); AC = off; MUS_DIP_UNTIL = 0;
    sfx0('alpha_howl'); const dip = musDipK();
    const d = (await off.startRendering()).getChannelData(0); AC = real;
    const a = Math.exp(-2 * Math.PI * 400 / 44100), Wn = 4410; let pk = 0, bw = 0, bh = 0, lp = 0;
    for (let s = 0; s + Wn <= d.length; s += Wn) { let x = 0, y = 0; for (let i = s; i < s + Wn; i++) { const v = d[i]; lp = a * lp + (1 - a) * v; const h = v - lp; x += v * v; y += h * h; if (Math.abs(v) > pk) pk = Math.abs(v); } bw = Math.max(bw, Math.sqrt(x / Wn)); bh = Math.max(bh, Math.sqrt(y / Wn)); }
    out.E = { loud: +bw.toFixed(3), hi: +bh.toFixed(3), peak: +pk.toFixed(3), dip: +dip.toFixed(2) };
    window.sfx = sfx0;
    return out;
  });
  const gaps = (L) => L.slice(1).map((h, i) => +(h[0] - L[i][0]).toFixed(1));
  const paced = (L) => L.length >= 1 && L[0][0] <= 3 && gaps(L).every(g => g >= 20) && L.length <= 1 + Math.ceil(117 / 20);
  check('A  at the den\'s mouth: a first call within 3 s, then none closer than 20 s apart', paced(R.A), { at: R.A.map(h => h[0]), gaps: gaps(R.A) });
  check('B  on the Run: the same', paced(R.B), { at: R.B.map(h => h[0]), gaps: gaps(R.B) });
  check('C  walked through quickly: no two howls within 14 s', gaps(R.C).every(g => g >= 14), { heard: R.C.map(h => h[0] + ' ' + h[2]), gaps: gaps(R.C) });
  check('D  the pack\'s call in the fight plays the recorded howl, and no oscillator with it', R.loaded && R.D1.rec.includes('al_howl') && R.D1.osc.length === 0, R.D1);
  check('   ...and so does the fury, his head thrown back', R.D2.rec.includes('al_howl') && R.D2.osc.length === 0, R.D2);
  check('E  the howl is the loudest thing in the room on a phone: 4.5x her hit, most of it above 400 Hz, unclipped, the score stepping back', R.E.loud >= 0.082 * 4.5 && R.E.hi >= 0.12 && R.E.hi >= R.E.loud * 0.5 && R.E.peak < 0.98 && R.E.dip <= 0.4, R.E);
  check('F  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the howl is rare on the road and always heard in the fight');
})().catch(e => { console.error(e); process.exit(1); });
