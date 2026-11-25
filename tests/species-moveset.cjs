// A NEW SPECIES GETS ITS WHOLE MOVE SET (owner, 2026-11-22: "when you create a
// new species enemy, it all needs to have complete artwork concept... a template
// for each function: dying, hitting, defending, jumping, crouching, etc... see all
// the movements possible and create artwork for it. It's a rule").
// docs/SPECIES_MOVESET.md is the template; assets/movesets.json the record.
// For every species under the rule:
//   - every function of the template has art;
//   - each function its OWN strip (only `dead` may be a frame of `die`);
//   - every strip is a real file, named in js/media.js, from a recorded Higgsfield job;
//   - every strip is actually DRAWN by the game in some state of the fight.
//
//   node tests/species-moveset.cjs      (needs the repo served on :8220)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/movesets.json'), 'utf8'));
const fails = [];
const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
console.log('── species-moveset — every new species has art for every move it makes');
const T = M._template;
check('the template names every function the owner listed (dying, hitting, defending, jumping, crouching)', ['die', 'attack', 'defend', 'jump', 'crouch'].every(f => T.includes(f)) && T.length >= 12, T.join(' '));
const ruled = Object.keys(M).filter(k => !k.startsWith('_') && M[k].rule);
check('at least one species is held to the rule', ruled.length >= 1, ruled.join(', '));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function');
  for (const sp of ruled) {
    const S = M[sp], mv = S.moves;
    const missing = T.filter(f => !mv[f]);
    check(sp + ': every function of the template has art', missing.length === 0, missing.length ? 'missing ' + missing.join(', ') : Object.keys(mv).length + ' functions');
    const keys = {}; const shared = [];
    for (const [f, m] of Object.entries(mv)) {
      if (m.from) { if (!(f === 'dead' && /^die:/.test(m.from))) shared.push(f + ' from ' + m.from); continue; }
      for (const k of [].concat(m.key)) { if (keys[k]) shared.push(f + ' and ' + keys[k] + ' share ' + k); keys[k] = f; }
    }
    check(sp + ': each function its own strip (only dead may be the end of die)', shared.length === 0, shared.join('; ') || Object.keys(keys).length + ' strips');
    const noJob = Object.entries(mv).filter(([f, m]) => !m.from && !m.job).map(([f]) => f);
    check(sp + ': every strip came from a recorded Higgsfield job', noJob.length === 0, noJob.join(', '));
    const R = await p.evaluate(async ({ keys, S }) => {
      const out = { unnamed: [], absent: [], undrawn: [] };
      for (const k of keys) if (!MEDIA_SRC.images[k]) out.unnamed.push(k);
      for (const k of keys) if (MEDIA_SRC.images[k]) mediaFetch(k, 1);
      for (let i = 0; i < 300 && !keys.every(k => !MEDIA_SRC.images[k] || (MEDIA_IMG[k] && (MEDIA_IMG[k].naturalWidth || MEDIA_IMG[k].complete))); i++) await new Promise(r => setTimeout(r, 25));
      for (const k of keys) if (MEDIA_SRC.images[k] && !(MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth)) out.absent.push(k);
      // play the fight's states and record which strips are drawn
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, S.flags || {}); startGame(sv); loadRoom(S.room); G.state = 'PLAY'; G.dialog = null; G.bossEntry = null;
      const B = G.boss; if (!B) { out.noBoss = true; return out; }
      const seen = new Set(), byImg = new Map(); for (const k of keys) if (MEDIA_IMG[k]) byImg.set(MEDIA_IMG[k], k);
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const c = cv.getContext('2d');
      const d0 = c.drawImage.bind(c); c.drawImage = function (im, ...a) { const k = byImg.get(im); if (k) seen.add(k); return d0(im, ...a); };
      // how each species is put into a state for the camera (no fight is played here:
      // tests/<species>.cjs plays the fights)
      const PROBES = {
        mirejaw: (B, st, k, x) => {
          mjInit(B); const M = B.mj;
          B.st = st; M.t0 = 1; B.t = 1 - k; B.dead = false; B.phase = 1;
          M.hurtT = x.hurt ? MJ.hurtShow * 0.5 : 0;
          M.wx = x.land ? 5 * TILE : mjNearestWater(18 * TILE); M.face = -1; M.turnFrom = -1;
          M.spd = x.still ? 0 : 200; M.trav = k * 500; M.drawY = null;
          M.from = { x: M.wx, feet: mjSurfY() }; M.tgt = { x: M.wx - 200, feet: mjSurfY() };
          M.snapped = !!x.snap; M.snapK = x.snap ? Math.max(0, k - 0.05) : null;
        },
      };
      const probe = PROBES[S.probe];
      for (const st of S.states) for (const k of [0.02, 0.3, 0.6, 0.95]) for (const extra of [{}, ...(S.extras || [])]) {
        probe(B, st, k, extra); try { window[S.draw](c, B); } catch (e) { out.err = String(e); }
      }
      out.undrawn = keys.filter(k => !seen.has(k));
      return out;
    }, { keys: Object.keys(keys), S });
    check(sp + ': every strip is named in js/media.js and on disk', R.unnamed.length === 0 && R.absent.length === 0, JSON.stringify({ unnamed: R.unnamed, absent: R.absent }));
    check(sp + ': every strip is drawn by some state of the fight', !R.noBoss && R.undrawn.length === 0 && !R.err, R.noBoss ? 'no boss in ' + S.room : (R.err || R.undrawn.join(', ') || 'all drawn'));
  }
  // the audit of the older species is on record (not held to the rule)
  const legacy = Object.keys(M).filter(k => !k.startsWith('_') && !M[k].rule);
  console.log('  ...older species on record: ' + legacy.map(k => k + (M[k].missing && M[k].missing.length ? ' (lacks ' + M[k].missing.join(', ') + ')' : '')).join('; '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — every species under the rule has art for every move it makes, and the game draws all of it');
})().catch(e => { console.error(e); process.exit(1); });
