// THE FIGHT SOUNDS LIKE WOLVES AND STEEL, NOT A TOY — owner, 2026-11-27: "alpha wolf is a mix of sounds
// between the actual howling and the old geeky useless sounds of hitting and jumping like Super Mario,
// which is not what I asked for. I asked for real sound effects for wolves and attacks and fights."
// Plays the Wolf King's fight (A10) with the boss ladder's skilled bot, and a pack fight on the Run
// (A10R) with a plain brawler that jumps, with every recording loaded, and listens to every sfx() it
// makes: which recordings played (playBuf) and whether any OSCILLATOR or synthesised NOISE was made
// (AudioContext.createOscillator, audio.js noiseBuf). A menu's click is not the fight (ui, ok, no).
//   A  the Alpha's fight: no sound made of oscillators or synth noise, and it was a real fight (his
//      howl, a leap, a blow of hers, her jump and her landing all sounded)
//   B  the pack's fight: the same, and the wolves were heard (a snarl, bark, bite or yelp) and struck
//   C  what plays is the recordings of tools/fight-audio.py: the Alpha's voice, her blade, her jump
//      and landing are the CC0 cuts (al_*, fl_*, hz_jump, hz_land), and nothing is silent for want of
//      a file (no missing take was asked for)
//   D  no page errors
const path = require('path');
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
const ALPHA_BOT = require(path.join(__dirname, 'gauntlet', 'bots', 'alpha_skilled.cjs')).bot;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
const BRAWL = `(bo, P, ctx) => { const pc = P.x + P.w / 2, d = bo.x + bo.w / 2 - pc; keys[d > 0 ? 'ArrowRight' : 'ArrowLeft'] = Math.abs(d) > 60 ? 1 : 0; if (Math.abs(d) < 90) keysP.KeyX = 1; if (ctx.frame % 50 === 0 && P.on) { keysP.Space = 1; keys.Space = 1; } }`;
(async () => {
  console.log('── fight-foley — the Alpha\'s fight and the pack\'s are recorded wolves, steel, cloth and feet');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async ({ ALPHA_BOT, BRAWL }) => {
    window.requestAnimationFrame = () => 0;
    const sv0 = newSave(1); sv0.time = 99; startGame(sv0); audioOn(); MUTED = false;
    for (const k in MEDIA_SRC.audio) mediaAudio(k);
    const want = Object.keys(MEDIA_SRC.audio).filter(k => /^(al_|fl_|ct_|hz_|hk_)/.test(k));
    for (let n = 0; n < 150 && want.some(k => !MBUF[k]); n++) await new Promise(r => setTimeout(r, 100));
    const unloaded = want.filter(k => !MBUF[k]);
    // the listener
    let cur = null; const log = {};
    const note = (what) => { if (cur) cur[what]++; };
    const osc0 = BaseAudioContext.prototype.createOscillator;
    BaseAudioContext.prototype.createOscillator = function () { note('osc'); return osc0.apply(this, arguments); };
    const nb0 = window.noiseBuf; window.noiseBuf = function () { note('noise'); return nb0.apply(this, arguments); };
    const pb0 = window.playBuf; window.playBuf = function (k) { const ok = pb0.apply(this, arguments); if (cur) { cur.rec[k] = 1; if (!ok) cur.miss[k] = 1; } return ok; };
    const sp0 = window.sfxPlain; window.sfxPlain = function (n) {
      if (cur) return sp0.apply(this, arguments);
      const e = log[n] || (log[n] = { n: 0, osc: 0, noise: 0, rec: {}, miss: {} }); e.n++;
      cur = e; try { return sp0.apply(this, arguments); } finally { cur = null; }
    };
    const fight = (room, botSrc, secs, foe) => {
      for (const k in log) delete log[k];
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.weaponMode = 'single';
      Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, crystal: 1, pl_cshard: 1, bossHorn: 1, ghWon: 1, gateOpened: 1 });
      startGame(sv); MUTED = false; loadRoom(room);
      const fn = new Function('bo', 'P', 'ctx', 'return (' + botSrc + ')(bo, P, ctx);');
      const ctx = { dt: 1 / 60, frame: 0 }, hist = [];
      let h = 7; const r0 = Math.random; Math.random = () => ((h = Math.imul(h ^ (h >>> 15), 2246822519) + 0x9e3779b9 >>> 0) % 100000) / 100000;
      try {
        for (let f = 0; f < 60 * secs; f++) {
          if (G.dialog || G.cut || G.meet || G.state !== 'PLAY') { G.dialog = G.cut = G.panels = G.meet = G.wake = null; G.state = 'PLAY'; }
          const bo = foe(); if (!bo) { update(1 / 60); continue; }
          if (!bo.cx) bo.cx = function () { return this.x + this.w / 2; };
          for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
          hist.push({ st: bo.st, t: bo.t, x: bo.x, y: bo.y, w: bo.w, h: bo.h, cx: bo.cx(), vx: bo.vx || 0, vy: bo.vy || 0, face: bo.face || 0, on: bo.on }); if (hist.length > 60) hist.shift();
          ctx.seen = hist[Math.max(0, hist.length - 16)]; ctx.frame = f;
          try { fn(bo, player, ctx); } catch (e) {}
          player.cores = Math.max(player.cores, 3); player.dead = false;
          update(1 / 60);
        }
      } finally { Math.random = r0; }
      const out = {}; for (const k in log) out[k] = { n: log[k].n, osc: log[k].osc, noise: log[k].noise, rec: Object.keys(log[k].rec), miss: Object.keys(log[k].miss) };
      return out;
    };
    const A = fight('A10', ALPHA_BOT, 70, () => G.boss);
    const B = fight('A10R', BRAWL, 45, () => G.enemies.find(e => !e.dead && typeof isWolf === 'function' && isWolf(e)) || null);
    return { A, B, unloaded };
  }, { ALPHA_BOT, BRAWL });
  const UI = { ui: 1, ok: 1, no: 1 };
  const synth = (L) => Object.keys(L).filter(n => !UI[n] && (L[n].osc > 0 || L[n].noise > 0)).map(n => n + ' (' + L[n].osc + ' osc, ' + L[n].noise + ' noise)');
  const heard = (L, re) => Object.keys(L).some(n => L[n].rec.some(k => re.test(k)));
  const recs = (L) => [...new Set(Object.keys(L).flatMap(n => L[n].rec))].sort();
  const misses = (L) => [...new Set(Object.keys(L).flatMap(n => L[n].miss))];
  console.log('info the Alpha\'s fight played: ' + recs(R.A).join(' '));
  console.log('info the pack\'s fight played:  ' + recs(R.B).join(' '));
  check('A  the Alpha\'s fight: nothing made of oscillators or synth noise', synth(R.A).length === 0, synth(R.A));
  check('   ...and it was a fight: his howl, a leap, her blade, her jump and her landing all sounded', heard(R.A, /^al_howl$/) && heard(R.A, /^al_leap$/) && heard(R.A, /^fl_swing/) && heard(R.A, /^hz_jump$/) && heard(R.A, /^hz_land$/), recs(R.A));
  check('B  the pack\'s fight: nothing made of oscillators or synth noise', synth(R.B).length === 0, synth(R.B));
  check('   ...and the wolves were heard (a snarl, a bark, a bite or a yelp, all recorded wolves) and her blade on them', heard(R.B, /^al_(growl|bite|snap|bark|yelp)$/) && heard(R.B, /^hk_plate_light_/), recs(R.B));
  check('C  every take was there: none asked for and missing', R.unloaded.length === 0 && misses(R.A).length === 0 && misses(R.B).length === 0, { unloaded: R.unloaded, missA: misses(R.A), missB: misses(R.B) });
  check('D  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the fights are recorded animals and material, no toy sounds');
})().catch(e => { console.error(e); process.exit(1); });
