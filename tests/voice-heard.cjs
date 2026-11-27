// A GUARDIAN IS HEARD, AND THE SCORE DOES NOT DIE.
// Owner, 2026-11-16: "I should hear his howl. There is no sound for the howling."
// Owner, 2026-11-17: "alfa still has no sound" · "why music stopped?"
// The first answer turned one number up. Measured, the Alpha's own moves were a quarter
// of the level of her hit and almost all below 400 Hz, which a phone speaker cannot say.
// Each sound is rendered offline through the real sfx() and measured: its loudest tenth
// of a second, whole and above 400 Hz.
//   A  the howl is the loudest thing in the room, and most of it is where a phone can speak
//   B  every move the Alpha makes is at least as loud as her own hit on him
//   C  the same floor for every guardian's wind-up cue and roar (the sweep)
//   D  nothing clips
//   E  the score steps back under a howl or a roar, and comes back
//   F  a stream that dies is rebuilt where it was; one that keeps dying hands over to the
//      next candidate; a suspended audio context is woken; an empty slot is asked again
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const MOVES = ['alpha_bark', 'alpha_claw', 'alpha_leap', 'alpha_rend', 'alpha_rendwarn', 'alpha_snap', 'alpha_furywarn', 'alpha_fury', 'alpha_quake'];
const TELLS = ['tell_alpha', 'tell_glitch', 'tell_brood', 'tell_atlas', 'tell_zero', 'tell_prism', 'tell_mother'];
const ROARS = ['roar', 'roar_eagle', 'roar_glc', 'roar_drg', 'roar_prism'];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async (NAMES) => { window.requestAnimationFrame = () => 0; const out = { lv: {} };
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1 }); startGame(sv); loadRoom('A10'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = null;
    audioOn(); const real = AC; MUTED = false; MUSIC_ON = true;
    // THE RECORDINGS FIRST (2026-11-27): the Alpha's voice, the pack's and the impacts are recordings
    // now and never an oscillator — before the file arrives a cue is silent, not synthesised — so what
    // is measured is what a player hears once the fight's sounds are in (they load in the first seconds)
    for (const k in MEDIA_SRC.audio) if (/^(al_|hk_|fz_)/.test(k)) mediaAudio(k);
    for (let n = 0; n < 150 && Object.keys(MEDIA_SRC.audio).some(k => /^(al_|hk_)/.test(k) && !MBUF[k]); n++) await new Promise(r => setTimeout(r, 100));
    for (const n of NAMES) { const off = new OfflineAudioContext(1, 44100 * 3, 44100); AC = off; MUS_DIP_UNTIL = 0; sfx(n);
      const d = (await off.startRendering()).getChannelData(0), a = Math.exp(-2 * Math.PI * 400 / 44100), W = 4410; let pk = 0, bw = 0, bh = 0, lp = 0;
      for (let s = 0; s + W <= d.length; s += W) { let x = 0, y = 0; for (let i = s; i < s + W; i++) { const v = d[i]; lp = a * lp + (1 - a) * v; const h = v - lp; x += v * v; y += h * h; if (Math.abs(v) > pk) pk = Math.abs(v); } bw = Math.max(bw, Math.sqrt(x / W)); bh = Math.max(bh, Math.sqrt(y / W)); }
      out.lv[n] = { peak: +pk.toFixed(3), loud: +bw.toFixed(3), hi: +bh.toFixed(3), dip: +musDipK().toFixed(2) }; }
    AC = real; MUS_DIP_UNTIL = 0;
    // E: the element itself
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    MUS.name = null; setMusic('boss_alpha'); await wait(1600); const el = RECNODE && RECNODE.el; const v0 = el ? el.volume : -1;
    sfx('alpha_howl'); await wait(700); const v1 = el ? el.volume : -1; await wait(3200); const v2 = el ? el.volume : -1;
    out.dip = { key: RECNODE && RECNODE.key, before: +v0.toFixed(2), under: +v1.toFixed(2), after: +v2.toFixed(2) };
    // F: a dead stream
    const el0 = RECNODE.el; const key0 = RECNODE.key; el0.src = 'data:audio/mp4;base64,AAAA'; await wait(500);
    const errored = !!el0.error; musKick(); await wait(900);
    out.rebuilt = { errored, sameKey: RECNODE && RECNODE.key === key0, newEl: RECNODE && RECNODE.el !== el0, playing: RECNODE && !RECNODE.el.paused && !RECNODE.el.error };
    for (let i = 0; i < 4; i++) { if (!RECNODE) break; const e2 = RECNODE.el; e2.src = 'data:audio/mp4;base64,AAAA'; await wait(400); musKick(); await wait(300); }
    out.handover = { dead: !!MUS_DEAD[key0], now: RECNODE ? RECNODE.key : (MUS.cur ? 'synth' : null), name: MUS.name };
    await AC.suspend(); const st0 = AC.state; musKick(); await wait(400); out.ctx = { suspended: st0, after: AC.state };
    stopRecorded(); MUS.cur = null; MUS.name = 'A'; musKick(); await wait(600); out.asked = { rec: RECNODE && RECNODE.key, name: MUS.name };
    return out; }, ['alpha_howl', 'alpha_howl_far', 'clash', 'bosshit'].concat(MOVES, TELLS, ROARS));
  console.log('── voice-heard — a guardian is heard over the score, on a phone, and the score does not die');
  // her own hit on him, as recorded, measures 0.082 at its loudest (the synth fallback that plays
  // before the take has loaded is a third of that): the floor is the recorded one, written down, so
  // this does not depend on which of the two a run happens to load
  const L = R.lv, hit = 0.082;
  check('A  the howl is the loudest thing in the room (four and a half times her hit)', L.alpha_howl.loud >= hit * 4.5, { howl: L.alpha_howl, herHit: hit });
  check('   ...most of it where a phone speaker can speak (above 400 Hz)', L.alpha_howl.hi >= 0.12 && L.alpha_howl.hi >= L.alpha_howl.loud * 0.5, L.alpha_howl);
  check('   ...and the far call reaches her through the rock', L.alpha_howl_far.loud >= 0.07 && L.alpha_howl_far.hi >= 0.05, L.alpha_howl_far);
  check('B  every move the Alpha makes is at least as loud as her own hit on him', MOVES.every(n => L[n].loud >= hit * 0.95), MOVES.map(n => n.replace('alpha_', '') + ' ' + L[n].loud).join('  ') + '  (her hit ' + hit + ')');
  check('   ...and is not all bass: each has something above 400 Hz', MOVES.every(n => L[n].hi >= 0.02), MOVES.map(n => n.replace('alpha_', '') + ' ' + L[n].hi).join('  '));
  check('C  the sweep: every guardian\'s wind-up cue is heard', TELLS.every(n => L[n].loud >= 0.06 && L[n].hi >= 0.05), TELLS.map(n => n.replace('tell_', '') + ' ' + L[n].loud + '/' + L[n].hi).join('  '));
  check('   ...and every roar is a roar', ROARS.every(n => L[n].loud >= 0.15 && L[n].hi >= 0.08), ROARS.map(n => n + ' ' + L[n].loud + '/' + L[n].hi).join('  '));
  check('D  nothing clips', Object.keys(L).every(n => L[n].peak < 0.98), Object.keys(L).filter(n => L[n].peak >= 0.9).map(n => n + ' ' + L[n].peak).join(' ') || 'peaks under 0.9');
  check('E  the score steps back under the howl and every roar', L.alpha_howl.dip <= 0.4 && ROARS.every(n => L[n].dip <= 0.55) && L.alpha_claw.dip === 1, { howl: L.alpha_howl.dip, roar: L.roar.dip, claw: L.alpha_claw.dip });
  check('   ...in the real stream: down under it, back after it', R.dip.key === 'mus_alpha' && R.dip.under <= R.dip.before * 0.65 && R.dip.after >= R.dip.before - 0.03, R.dip);
  check('F  a stream that dies is rebuilt: same track, a new element, playing', R.rebuilt.errored && R.rebuilt.sameKey && R.rebuilt.newEl && R.rebuilt.playing, R.rebuilt);
  check('   ...one that keeps dying hands over to the next candidate instead of silence', R.handover.dead && R.handover.now && R.handover.now !== 'mus_alpha' && R.handover.name === 'boss_alpha', R.handover);
  check('   ...a suspended audio context is woken', R.ctx.suspended === 'suspended' && R.ctx.after === 'running', R.ctx);
  check('   ...and a slot left with nothing playing is asked again', R.asked.rec === 'mus_meadows', R.asked);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — he is heard, and the music comes back');
})().catch(e => { console.error(e); process.exit(1); });
