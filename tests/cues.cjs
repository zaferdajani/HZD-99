// Render every melodic cue through an OfflineAudioContext and read the notes
// back out of the waveform by autocorrelation. This checks the thing that
// actually matters: that what comes out is the phrase that was written, in the
// scale it was written in — not that the code looks right.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    const SR = 44100;
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const name = (m) => NAMES[((Math.round(m) % 12) + 12) % 12] + (Math.floor(Math.round(m) / 12) - 1);
    const pitchAt = (d, from, len) => {
      // autocorrelation over the window, 60 Hz .. 2.5 kHz
      let best = 0, bestLag = 0;
      const lo = Math.floor(SR / 2500), hi = Math.floor(SR / 60);
      for (let lag = lo; lag < hi; lag++) {
        let acc = 0;
        for (let i = 0; i + lag < len; i += 2) acc += d[from + i] * d[from + i + lag];
        if (acc > best) { best = acc; bestLag = lag; }
      }
      if (!bestLag) return null;
      const f = SR / bestLag;
      return 69 + 12 * Math.log2(f / 440);
    };
    const out = {};
    for (const cue of ['jump', 'djump', 'land', 'dash', 'pick', 'heal', 'chest', 'hurt', 'edie']) {
      const off = new OfflineAudioContext(1, SR, SR);
      const save = AC; AC = off; MUTED = false;
      sfx(cue);
      const buf = await off.startRendering();
      AC = save;
      const d = buf.getChannelData(0);
      const bins = [];
      for (let i = 0; i < 900; i++) {
        let m = 0;
        for (let k = i * 44; k < (i + 1) * 44; k++) m = Math.max(m, Math.abs(d[k]));
        bins.push(m);
      }
      const peak = Math.max(...bins);
      let tail = 0;
      for (let i = bins.length - 1; i >= 0; i--) if (bins[i] > peak * 0.02) { tail = i; break; }
      let onset = 0;
      for (let i = 0; i < bins.length; i++) if (bins[i] > peak * 0.15) { onset = i; break; }
      // note onsets: a rise of 60% over the previous 8 ms
      const starts = [];
      for (let i = 4; i < tail; i++)
        if (bins[i] > peak * 0.25 && bins[i] > bins[i - 4] * 1.6)
          if (!starts.length || i - starts[starts.length - 1] > 20) starts.push(i);
      const notes = starts.map(ms => {
        const m = pitchAt(d, ms * 44 + 400, 1800);
        return m == null ? '?' : name(m) + '(' + (m - Math.round(m)).toFixed(2).replace('-0.00', '0.00') + ')';
      });
      out[cue] = { peak: +peak.toFixed(3), onsetMs: onset, lenMs: tail, notes };
    }
    return out;
  });
  for (const k in r) console.log(k.padEnd(6), JSON.stringify(r[k]));
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
