// Render the real sfx() through an OfflineAudioContext and measure it. A combat
// sound has to (a) start on the frame it is asked for, (b) read as three
// distinct claw passes rather than one wash, (c) sit at a sane level next to
// the sounds around it, and (d) get heavier on the third hit of the string.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(700);
  console.log('player exists:', await p.evaluate(() => !!player));
  const r = await p.evaluate(async () => {
    const measure = async (fire) => {
      const off = new OfflineAudioContext(1, 44100, 44100);
      const save = AC; AC = off; MUTED = false;
      fire();
      const buf = await off.startRendering();
      AC = save;
      const d = buf.getChannelData(0);
      const bins = [];
      for (let i = 0; i < 500; i++) {
        let m = 0;
        for (let k = i * 44; k < (i + 1) * 44; k++) m = Math.max(m, Math.abs(d[k]));
        bins.push(m);
      }
      const peak = Math.max(...bins);
      let onset = -1, tail = 0;
      for (let i = 0; i < bins.length; i++) if (bins[i] > peak * 0.15) { onset = i; break; }
      for (let i = bins.length - 1; i >= 0; i--) if (bins[i] > peak * 0.02) { tail = i; break; }
      const hits = [];
      for (let i = 2; i < bins.length - 2; i++)
        if (bins[i] > peak * 0.3 && bins[i] >= bins[i - 1] && bins[i] > bins[i + 1])
          if (!hits.length || i - hits[hits.length - 1] > 5) hits.push(i);
      let zc = 0, n = Math.min(d.length, 6000);
      for (let i = 1; i < n; i++) if ((d[i] < 0) !== (d[i - 1] < 0)) zc++;
      return { peak: +peak.toFixed(3), onsetMs: onset, lenMs: tail, passes: hits.length,
               at: hits.slice(0, 6), edgeKHz: +(zc / 2 / (n / 44100) / 1000).toFixed(1) };
    };
    const out = {};
    for (const beat of [0, 1, 2]) {
      player.combo = beat;
      out['slash beat ' + (beat + 1)] = await measure(() => sfx('atk'));
    }
    for (const k of ['hit', 'jump', 'dash']) out['(ref) ' + k] = await measure(() => sfx(k));
    return out;
  });
  for (const k in r) console.log(k.padEnd(14), JSON.stringify(r[k]));
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
