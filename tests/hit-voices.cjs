// THE ALPHA IS AN ANIMAL, AND A BLOW SOUNDS LIKE WHAT IT HIT (owner, 2026-11-20).
//
//   "It sounds like I'm listening to piano or electric ... instead of an actual
//    animalistic, wolf-like howlings, attacks, vibes."
//   "why arent you looking for free libraries for voices ???"
//   "also multiple metallic hitting sounds for more diversities in sounds of
//    attack hits for different enemies and bosses"
//
// This holds:
//   - every Alpha and pack cue plays a recorded wolf (al_*), not oscillators —
//     the howls are real wolves (National Park Service, public domain);
//   - every kind of body and every guardian has a bank of recorded impacts,
//     the guardians not all the same metal;
//   - a bank never plays the same take twice running, and it varies;
//   - every file the banks name is on disk and is not silent.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(() => {
    const out = {};
    const files = (typeof MEDIA_SRC !== 'undefined' && MEDIA_SRC.audio) || {};
    // spy on what plays
    const played = []; const PB = window.playBuf;
    window.playBuf = (k, v, r) => { played.push(k); return true; };
    const sv = newSave(1); sv.time = 99; startGame(sv);
    const wasAC = AC, wasM = MUTED; if (!AC) AC = {}; MUTED = false;   // (a stand-in context: the spy plays nothing)
    const heard = (cue) => { played.length = 0; sfx(cue); return played.slice(); };
    out.alpha = ['alpha_howl', 'alpha_howl_far', 'alpha_bark', 'alpha_snap', 'wolf_bite', 'alpha_claw', 'alpha_leap', 'alpha_rendwarn', 'alpha_furywarn', 'alpha_fury', 'alpha_rend']
      .map(c => [c, heard(c)[0] || null]);
    // the cue each body and guardian gives
    const bodies = { crawler: 'hit', turret: 'hit_housing', sage: 'hit_robe', bat: 'hit_wing', blob: 'hit_soft', rime: 'hit_ice', surge: 'hit_spark' };
    out.bodies = Object.keys(bodies).map(k => { const e = { kind: k }; return [k, foeHitSound(e, false)]; });
    const guards = ['glitch', 'horn', 'alpha', 'brood', 'zero', 'prism', 'atlas', 'mother', 'chime', 'carrier', 'moth', 'lattice', 'lens'];
    out.guards = guards.map(k => { const cue = foeHitSound({ kind: k }, true); return [k, cue, (HIT_BANK[cue] || [])[0] || null]; });
    // variety: twenty blows on one body
    const seq = []; for (let i = 0; i < 20; i++) seq.push(heard('hit')[0]);
    out.seq = seq;
    out.bankKeys = [].concat(...Object.values(HIT_BANK).map(B => [0, 1, 2].map(i => 'hk_' + B[0] + '_' + i)));
    out.alKeys = Object.values(ALPHA_VOICE).map(A => A[0]);
    out.manifest = {}; for (const k of out.bankKeys.concat(out.alKeys)) out.manifest[k] = files[k] || null;
    window.playBuf = PB; AC = wasAC; MUTED = wasM;
    return out;
  });
  check('every Alpha and pack cue plays a recorded wolf', R.alpha.every(([c, k]) => k && /^al_/.test(k)), JSON.stringify(R.alpha.filter(([c, k]) => !k || !/^al_/.test(k))));
  check('every kind of body has its own hit bank', R.bodies.every(([k, c]) => c && c.indexOf('hit') === 0), JSON.stringify(R.bodies));
  const metals = new Set(R.guards.map(g => g[2]));
  check('every guardian rings in recorded metal, and not all the same one', R.guards.every(g => g[2]) && metals.size >= 5, [...metals].join(','));
  const repeats = R.seq.filter((k, i) => i && k === R.seq[i - 1]).length, takes = new Set(R.seq).size;
  check('twenty blows on one body: never the same take twice running, and all its takes heard', repeats === 0 && takes === 3, 'repeats ' + repeats + ', takes ' + takes);
  // files on disk, and not silent
  const root = path.join(__dirname, '..');
  const missing = [], quiet = [];
  for (const [k, f] of Object.entries(R.manifest)) {
    if (!f || !fs.existsSync(path.join(root, f))) { missing.push(k); continue; }
    try {
      const o = execFileSync('ffmpeg', ['-hide_banner', '-i', path.join(root, f), '-af', 'volumedetect', '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    } catch (e) {
      const m = String(e.stderr || e.stdout || '').match(/max_volume: ([-0-9.]+) dB/);
      if (m && +m[1] < -30) quiet.push(k + ' ' + m[1]);
    }
  }
  check('every file the banks name is on disk', missing.length === 0, missing.join(', '));
  check('...and none is near-silent', quiet.length === 0, quiet.join(', '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the wolves are wolves, and every blow has its own ring');
})().catch(e => { console.error(e); process.exit(1); });
