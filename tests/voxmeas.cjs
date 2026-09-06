// Render every character's real line through THE SHIPPED CHAIN (npcChainBuild,
// the same function the game calls) and measure it. Three things have to be
// true: it must not clip, the little speaker's band limit must actually be
// there, and the speech band must survive so the words are still words.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => {
    const tmp = new (window.AudioContext || window.webkitAudioContext)();
    const out = {};
    for (const id of Object.keys(NPC_CHASSIS)) {
      const raw = await (await fetch('assets/vox/' + id + '0.ogg')).arrayBuffer();
      const buf = await tmp.decodeAudioData(raw.slice(0));
      const SR = buf.sampleRate, N = buf.length;
      const render = async (withChain) => {
        const off = new OfflineAudioContext(1, N, SR);
        const src = off.createBufferSource(); src.buffer = buf;
        if (withChain) npcChainBuild(off, src, id).out.connect(off.destination);
        else src.connect(off.destination);
        src.start();
        return (await off.startRendering()).getChannelData(0);
      };
      const band = (d, f0, f1) => {
        let e = 0;
        for (let f = f0; f <= f1; f += Math.max(25, (f1 - f0) / 30)) {
          const w = 2 * Math.PI * f / SR; let re = 0, im = 0;
          for (let i = 0; i < Math.min(N, SR * 2); i += 3) { re += d[i] * Math.cos(w * i); im += d[i] * Math.sin(w * i); }
          e += Math.hypot(re, im);
        }
        return e;
      };
      const dB = (a, c) => +(20 * Math.log10((a || 1e-9) / (c || 1e-9))).toFixed(1);
      const A = await render(false), B = await render(true);
      let pa = 0, pb = 0;
      for (let i = 0; i < N; i++) { pa = Math.max(pa, Math.abs(A[i])); pb = Math.max(pb, Math.abs(B[i])); }
      const V = NPC_CHASSIS[id];
      out[id] = {
        peak: +pb.toFixed(2) + (pb > 0.99 ? ' CLIPPING' : ' ok') + ' (was ' + pa.toFixed(2) + ')',
        subCut: dB(band(B, 60, 150), band(A, 60, 150)),
        // how much of the sound sits ABOVE this speaker's band, relative to the
        // speech it is carrying — a ratio, so it means something even when the
        // recording had little up there to begin with
        tiltBefore: dB(band(A, V.hi + 800, V.hi + 3000), band(A, 300, 3400)),
        tiltAfter: dB(band(B, V.hi + 800, V.hi + 3000), band(B, 300, 3400)),
        speech: dB(band(B, 300, 3400), band(A, 300, 3400)),
        pitch: V.rate,
      };
    }
    return out;
  });
  console.log('character   peak                  <150Hz    out-of-band tilt      speech   pitch');
  for (const k in r) {
    const v = r[k];
    console.log(k.padEnd(11), String(v.peak).padEnd(21),
      String(v.subCut + ' dB').padStart(8),
      String(v.tiltBefore + ' -> ' + v.tiltAfter + ' dB').padStart(21),
      String(v.speech + ' dB').padStart(11), String('x' + v.pitch).padStart(7));
  }
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
})();
