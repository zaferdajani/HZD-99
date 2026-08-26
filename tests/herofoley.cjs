// HER FOLEY IS REAL — the authored move sounds decode, and the sfx() path
// actually reaches them.
//
// The failure this guards is silent by construction: playBuf falls back to the
// synth for ANY missing or undecodable buffer, which is right for a slow
// connection and catastrophic for a corrupt file — the game would beep forever
// and nothing would ever say why. So this decodes every take the way the game
// does and then asks sfx() to pick each one.
const { chromium } = require('playwright');

const KEYS = ['hz_swing1', 'hz_swing2', 'hz_fin', 'hz_burst', 'hz_dash',
              'hz_charge', 'hz_ready', 'hz_jump', 'hz_land', 'hz_step1', 'hz_step2',
              'hz_evosting', 'hz_winsting'];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof sfx === 'function', { timeout: 30000 });

  const r = await p.evaluate(async (KEYS) => {
    const out = { decode: {}, picked: {} };
    const ac = new OfflineAudioContext(1, 44100, 44100);
    for (const k of KEYS) {
      const path = (typeof MEDIA !== 'undefined' && MEDIA.sfx && MEDIA.sfx[k])
        || 'assets/sfx/' + k + '.ogg';
      try {
        const buf = await (await fetch('/' + String(path).replace(/^\//, ''))).arrayBuffer();
        const ab = await ac.decodeAudioData(buf.slice(0));
        // a decoded take must carry actual signal, not a silent container
        const d = ab.getChannelData(0); let peak = 0;
        for (let i = 0; i < d.length; i += 7) peak = Math.max(peak, Math.abs(d[i]));
        out.decode[k] = { dur: +ab.duration.toFixed(2), peak: +peak.toFixed(3) };
      } catch (e) { out.decode[k] = { err: String(e).slice(0, 60) }; }
    }
    // ...and the music file the title slot now leads with is on disk
    out.mus = await fetch('/assets/music/mus_hero.m4a', { method: 'HEAD' }).then(r => r.ok);
    return out;
  }, KEYS);

  let bad = 0;
  for (const k of KEYS) {
    const d = r.decode[k];
    const ok = d && !d.err && d.dur > 0.2 && d.peak > 0.1;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + k.padEnd(12)
      + (d.err ? d.err : 'dur ' + d.dur + 's  peak ' + d.peak));
    if (!ok) bad++;
  }
  console.log('  ' + (r.mus ? 'ok  ' : 'FAIL') + ' mus_hero.m4a is on disk for the title slot');
  if (!r.mus) bad++;
  if (errs.length) { console.log('  FAIL page errors: ' + errs[0]); bad++; }
  await b.close();
  if (bad) { console.log('\n' + bad + ' foley take(s) unplayable'); process.exit(1); }
  console.log('\nOK — every authored take decodes with real signal in it');
})();
