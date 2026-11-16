// A BLOW SOUNDS LIKE WHAT IT LANDED ON.
// Owner, 2026-11-16: "You need to create different sounds for hitting different
// enemies. It shouldn't be the same for everyone... I do not like it that all
// of them have the same metallic hitting sound."
//   A  the families answer with different voices: a wolf, a cat, a bat, a
//      robed agent, a turret and a blob do not share one sound
//   B  every voice is a real sound: it renders, starts on the frame it is
//      asked for, and sits at a level beside the old clank (not louder than
//      a guardian's clang)
//   C  they are DIFFERENT TO THE EAR, measured: no two of them share both
//      their pitch band and their length
//   D  a guardian keeps its own clang; a plain steel drone keeps the ring
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    // (a wolf and a cat are the same frames in different country: ask in the room it stands in)
    const voiceIn = (rooms, pred) => { for (const r of rooms) { loadRoom(r); const e = G.enemies.find(pred); if (e) return foeHitSound(e, false); } return null; };
    out.voice = { wolf: voiceIn(['A9', 'A8', 'A10', 'A6'], e => isWolf(e)), cat: voiceIn(['CV1', 'CV2', 'CV1B'], e => isCheetah(e)) };
    out.found = { wolf: !!out.voice.wolf, cat: !!out.voice.cat };
    const who = { bat: { kind: 'bat' }, robe: { kind: 'sage' }, turret: { kind: 'turret' }, blob: { kind: 'blob' }, rime: { kind: 'rime' }, surge: { kind: 'surge' }, drone: { kind: 'guard' } };
    for (const k in who) out.voice[k] = foeHitSound(who[k], false);
    out.boss = foeHitSound({ kind: 'crawler' }, true);
    const measure = async (name) => { const off = new OfflineAudioContext(1, 44100, 44100); const save = AC; AC = off; MUTED = false; const known = sfx(name); const buf = await off.startRendering(); AC = save;
      const d = buf.getChannelData(0); let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
      let onset = -1, tail = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > peak * 0.15) { onset = i; break; } for (let i = d.length - 1; i >= 0; i--) if (Math.abs(d[i]) > peak * 0.05) { tail = i; break; }
      let zc = 0; const n = Math.max(2, tail); for (let i = 1; i < n; i++) if ((d[i] < 0) !== (d[i - 1] < 0)) zc++;
      return { known, peak: +peak.toFixed(3), onsetMs: +(onset / 44.1).toFixed(1), lenMs: Math.round(tail / 44.1), kHz: +(zc / 2 / (n / 44100) / 1000).toFixed(2) }; };
    // E: the den calls. (sfx is watched, not silenced.)
    const heard = []; const real = window.sfx; window.sfx = function (n) { heard.push(n); return real.apply(this, arguments); };
    const quiet = () => { if (G.dialog) { let k = 0; while (G.dialog && k++ < 9) dialogClose(G.dialog); } if (G.state !== 'PLAY') G.state = 'PLAY'; };
    const fresh = (fl) => { const s2 = newSave(1); s2.time = 99; Object.assign(s2.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1 }, fl || {}); startGame(s2); };
    window.requestAnimationFrame = () => 0;
    fresh(); loadRoom('A10'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; heard.length = 0;
    let at = -1; for (let i = 0; i < 90; i++) { quiet(); update(1 / 60); if (at < 0 && heard.includes('alpha_howl')) at = i; }
    out.E = { denAt: at };
    fresh(); loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = []; if (G.boss) G.boss = null;
    const dd = gateDoors().find(q => q.to === 'A10'); out.E.door = !!dd;
    if (dd) { player.x = gateWorldX(dd) - 200; const gc = groundColumnAt(player.x + 12); if (gc) player.y = Math.min.apply(null, gc) - player.h - 1; player.iT = 99; heard.length = 0;
      let far = -1; for (let i = 0; i < 200; i++) { quiet(); player.iT = 99; update(1 / 60); if (far < 0 && heard.includes('alpha_howl_far')) far = i; } out.E.mouthAt = far; }
    fresh({ alpha: 1 }); loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; G.enemies = []; if (dd) { player.x = gateWorldX(dd) - 200; heard.length = 0; for (let i = 0; i < 200; i++) { quiet(); player.iT = 99; update(1 / 60); } }
    out.E.afterYield = heard.filter(n => n.indexOf('alpha_howl') === 0).length; window.sfx = real;
    out.m = {}; for (const n of ['alpha_howl', 'alpha_howl_far', 'hit', 'bosshit', 'hit_wolf', 'hit_cat', 'hit_wing', 'hit_robe', 'hit_housing', 'hit_soft', 'hit_ice', 'hit_spark']) out.m[n] = await measure(n);
    return out; });
  console.log('── hit-voices  — a blow sounds like the body it landed on; the Wolf King is heard before he is seen');
  const v = R.voice, fam = ['wolf', 'cat', 'bat', 'robe', 'turret', 'blob'];
  check('the pack and the cats are in the rooms the test looks in', R.found.wolf && R.found.cat, R.found);
  check('A  six families, six voices', new Set(fam.map(k => v[k])).size === 6 && fam.every(k => v[k] && v[k] !== 'hit'), v);
  const names = Object.keys(R.m).filter(n => n.startsWith('hit_'));
  check('B  every voice renders and starts when asked', names.every(n => R.m[n].peak > 0.02 && R.m[n].onsetMs >= 0 && R.m[n].onsetMs < 12), names.map(n => n + ' ' + R.m[n].peak + '@' + R.m[n].onsetMs + 'ms').join(', '));
  check('   ...none louder than a guardian\'s clang', names.every(n => R.m[n].peak <= R.m.bosshit.peak * 1.25), { clang: R.m.bosshit.peak, loudest: Math.max.apply(null, names.map(n => R.m[n].peak)) });
  let twins = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) { const a = R.m[names[i]], b = R.m[names[j]]; const pr = Math.max(a.kHz, b.kHz) / Math.max(0.05, Math.min(a.kHz, b.kHz)), lr = Math.max(a.lenMs, b.lenMs) / Math.max(1, Math.min(a.lenMs, b.lenMs)); if (pr < 1.18 && lr < 1.25) twins.push(names[i] + '~' + names[j]); }
  check('C  no two voices share both their pitch band and their length', twins.length === 0, twins.length ? twins : names.map(n => n.slice(4) + ' ' + R.m[n].kHz + 'kHz/' + R.m[n].lenMs + 'ms').join(', '));
  check('D  a guardian keeps its clang, a steel drone keeps the ring', R.boss === 'bosshit' && v.drone === 'hit', { boss: R.boss, drone: v.drone });
  // "I should hear his howl. There is no sound for the howling. And the howling
  // should start the moment I go inside this portal to the alpha area"
  check('E  the howl is a voice: as loud as a clang, and long', R.m.alpha_howl.peak >= R.m.bosshit.peak * 0.8 && R.m.alpha_howl.peak >= 0.15 && R.m.alpha_howl.lenMs >= 700, { howl: R.m.alpha_howl, clang: R.m.bosshit.peak });
  check('   ...he howls within a second of her coming through into the den', R.E.denAt >= 0 && R.E.denAt <= 60, R.E);
  check('   ...at the den\'s mouth in the meadow she hears him through the rock, quieter', R.E.door && R.E.mouthAt >= 0 && R.m.alpha_howl_far.peak > 0.01 && R.m.alpha_howl_far.peak < R.m.alpha_howl.peak * 0.6, { at: R.E.mouthAt, far: R.m.alpha_howl_far.peak, near: R.m.alpha_howl.peak });
  check('   ...and a pack that has yielded does not call', R.E.afterYield === 0, R.E.afterYield);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — each body has its own voice under her blade'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
