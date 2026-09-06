// Stronger check than autocorrelation, which octave-slips on overlapping notes:
// for every note in every written phrase, measure the energy AT that pitch in
// the window where it should sound, and compare it with the two semitones
// either side. If the written note is not the loudest of the three, what came
// out is not what was written.
const { chromium } = require('playwright');
const SCORE = {
  jump:  [[79, 0, 90], [84, 48, 130]],
  djump: [[84, 0, 80], [88, 42, 80], [91, 84, 150]],
  land:  [[76, 0, 80], [72, 55, 150]],
  dash:  [[74, 0, 70], [76, 30, 70], [79, 60, 70], [81, 90, 130]],
  pick:  [[81, 0, 90], [88, 55, 200]],
  heal:  [[72, 0, 140], [76, 70, 140], [79, 140, 140], [84, 210, 320]],
  chest: [[72, 0, 120], [76, 70, 120], [79, 140, 120], [81, 210, 120], [84, 280, 380], [91, 320, 300]],
  hurt:  [[76, 0, 90], [72, 60, 90], [69, 120, 200]],
  edie:  [[81, 0, 70], [79, 34, 70], [76, 68, 70], [72, 102, 170]],
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(async (SCORE) => {
    const SR = 44100;
    const goertzel = (d, from, len, f) => {          // energy at one frequency
      const w = 2 * Math.PI * f / SR, cw = Math.cos(w), coeff = 2 * cw;
      let s0 = 0, s1 = 0, s2 = 0;
      for (let i = 0; i < len; i++) {
        const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len);
        s0 = d[from + i] * win + coeff * s1 - s2; s2 = s1; s1 = s0;
      }
      return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2);
    };
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const out = {};
    for (const cue in SCORE) {
      const off = new OfflineAudioContext(1, SR, SR);
      const save = AC; AC = off; MUTED = false;
      sfx(cue); const buf = await off.startRendering(); AC = save;
      const d = buf.getChannelData(0);
      const res = [];
      const phrase = SCORE[cue];
      for (let z = 0; z < phrase.length; z++) {
        const [midi, atMs, lenMs] = phrase[z];
        // only the part of the note that is NOT overlapped by the next one --
        // measuring across a neighbour is a flaw in the test, not in the cue
        const nextAt = phrase[z + 1] ? phrase[z + 1][1] : atMs + lenMs;
        const winMs = Math.min(lenMs, nextAt - atMs) - 10;
        const from = Math.floor((atMs + 6) * SR / 1000);
        const len = Math.min(Math.floor(Math.max(winMs, 0) * SR / 1000), d.length - from - 1);
        if (len < 500) { res.push('?'); continue; }
        const on = goertzel(d, from, len, hz(midi));
        const lo = goertzel(d, from, len, hz(midi - 1));
        const hi = goertzel(d, from, len, hz(midi + 1));
        res.push(on > lo && on > hi ? 'ok' : 'MISS(' + midi + ')');
      }
      out[cue] = res.join(' ');
    }
    return out;
  }, SCORE);
  let bad = 0;
  for (const k in r) { if (/MISS|\?/.test(r[k])) bad++; console.log(k.padEnd(6), r[k]); }
  console.log(bad ? '\n' + bad + ' CUE(S) DO NOT MATCH THE SCORE' : '\nevery written note is the strongest pitch in its own window');
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
