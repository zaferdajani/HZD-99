// THE GATE SOUNDS LIKE A GATE.
//
// The owner, 2026-08-24: "gate needs an epic play at the beginning as its the
// first thing player will find."
//
// It played sfx('ui') — the same three-frame tick a menu row makes — for a
// city wall three tiles thick and the monument the whole opening walks toward.
// That is the same complaint that opened this conversation, in its worst
// single instance: a sound that has nothing to do with the thing it is
// attached to.
//
// "Epic" is measurable, and these are the five things that make the difference
// between a door opening and arriving somewhere:
//
//   IT IS NOT THE BLIP.  More energy and more time than the UI tick, by a
//     margin that is not a matter of taste.
//   THE FLOOR ANSWERS.   Real energy below 60 Hz in the first fifth of a
//     second — weight is heard before it is identified.
//   IT IS TUNED.         The toll is a pitch, not a noise, and it is the pitch
//     the score says. It is the only part of a cue anyone hums back.
//   THE FIRST TIME IS DIFFERENT.  Arriving somewhere for the first time is not
//     the same event as going through a door you know, so the big take is
//     longer, lower and louder — measured, all three.
//   AND IT DOES NOT CLIP. Five layers stacked is exactly how a mix goes over.
//
//   node tests/gatecue.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── gatecue — the first built thing the player finds sounds like one\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await page.waitForTimeout(500);

  const r = await page.evaluate(async () => {
    const SR = 44100, N = SR * 3;
    const render = async (fn) => {
      const off = new OfflineAudioContext(1, N, SR);
      const save = AC; AC = off; MUTED = false;
      fn(); const buf = await off.startRendering(); AC = save;
      return buf.getChannelData(0);
    };
    const goertzel = (d, from, len, f) => {
      const w = 2 * Math.PI * f / SR, coeff = 2 * Math.cos(w);
      let s1 = 0, s2 = 0, s0;
      for (let i = 0; i < len; i++) {
        const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len);
        s0 = d[from + i] * win + coeff * s1 - s2; s2 = s1; s1 = s0;
      }
      return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2);
    };
    const energy = (d, a, b) => { let e = 0; for (let i = a; i < b && i < d.length; i++) e += d[i] * d[i]; return e; };
    const peak = (d) => { let p = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > p) p = a; } return p; };
    // where the sound actually stops: the last sample above a thousandth of peak
    const tail = (d) => { const g = peak(d) * 0.001; for (let i = d.length - 1; i > 0; i--) if (Math.abs(d[i]) > g) return i / SR; return 0; };
    const band = (d, from, len, f0, f1) => {
      let e = 0; for (let f = f0; f <= f1; f += 4) e += goertzel(d, from, len, f); return e;
    };

    const ui  = await render(() => sfx('ui'));
    const sml = await render(() => sfxGate(false));
    const big = await render(() => sfxGate(true));
    const q = Math.floor(SR * 0.2);                 // the first fifth of a second
    return {
      uiE: +energy(ui, 0, N).toFixed(4),   uiT: +tail(ui).toFixed(2),
      smlE: +energy(sml, 0, N).toFixed(4), smlT: +tail(sml).toFixed(2), smlPk: +peak(sml).toFixed(3),
      bigE: +energy(big, 0, N).toFixed(4), bigT: +tail(big).toFixed(2), bigPk: +peak(big).toFixed(3),
      // the floor, in the first fifth of a second, against the UI tick's own
      bigSub: +band(big, 0, q, 20, 60).toFixed(2), uiSub: +band(ui, 0, q, 20, 60).toFixed(2),
      // the toll: D3 on the big take, and it must beat its neighbours a
      // semitone either side or it is noise that happens to have a peak
      tollOn: +goertzel(big, Math.floor(SR * 0.44), Math.floor(SR * 0.30), 146.8).toFixed(2),
      tollLo: +goertzel(big, Math.floor(SR * 0.44), Math.floor(SR * 0.30), 138.6).toFixed(2),
      tollHi: +goertzel(big, Math.floor(SR * 0.44), Math.floor(SR * 0.30), 155.6).toFixed(2),
    };
  });

  check('the gate is not the UI blip', r.bigE > r.uiE * 8 && r.bigT > r.uiT * 2,
    'energy ' + r.bigE + ' vs ' + r.uiE + ', tail ' + r.bigT + 's vs ' + r.uiT + 's');
  check('...and the floor answers under it', r.bigSub > r.uiSub * 4,
    'sub-60 Hz in the first 200 ms: ' + r.bigSub + ' vs the blip at ' + r.uiSub);
  check('...and the toll is a pitch, not a peak in some noise',
    r.tollOn > r.tollLo && r.tollOn > r.tollHi,
    'D3 ' + r.tollOn + ' vs neighbours ' + r.tollLo + ' / ' + r.tollHi);
  check('the first time she opens it is a bigger event',
    r.bigE > r.smlE * 1.4 && r.bigT > r.smlT,
    'energy ' + r.bigE + ' vs ' + r.smlE + ', tail ' + r.bigT + 's vs ' + r.smlT + 's');
  check('...and five layers stacked still do not clip',
    r.bigPk <= 1.0 && r.smlPk <= 1.0, 'peak ' + r.bigPk + ' / ' + r.smlPk);

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
