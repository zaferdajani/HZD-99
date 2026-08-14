// HZD-99'S VOICE, MEASURED.
//
// This repo's rule is that sound is testable — tests/cuepitch.cjs checks the
// notes coming out are the notes written, tests/voxmeas.cjs caught an NPC chain
// clipping at 1.28 while claiming to filter. Her voice gets the same treatment,
// because every way a bark goes wrong is invisible in the code:
//
//   LEADING SILENCE. A generated take opens with room tone. Played on the frame
//     she swings, that silence is latency, and the shout lands after the claw —
//     which reads as a dropped input, not as a character.
//   CLIPPING. Normalised takes stacked under an impact sound is exactly how a
//     mix ends up over 1.0.
//   LENGTH. A combat bark longer than about a second is still playing when the
//     next one starts.
//   AND THE GATE. Two barks on one frame is a stutter; the whole set is useless
//     if the gate does not hold.
//
//   node tests/hzdvox.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── hzdvox — her voice: no dead air in front of it, no clipping, and it holds its gate');

  // decode every take in the browser and measure the waveform itself
  const m = await page.evaluate(async () => {
    const keys = Object.keys(MEDIA_SRC.audio).filter(k => k.indexOf('hzd_') === 0);
    const AC2 = new (window.AudioContext || window.webkitAudioContext)();
    const out = [];
    for (const k of keys) {
      const r = await fetch(MEDIA_SRC.audio[k]);
      if (!r.ok) { out.push({ k, err: 'HTTP ' + r.status }); continue; }
      const buf = await AC2.decodeAudioData(await r.arrayBuffer());
      const d = buf.getChannelData(0), n = buf.length, SR = buf.sampleRate;
      let pk = 0; for (let i = 0; i < n; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; }
      // ONSET: the first 5 ms window that reaches a tenth of the peak. That is
      // where the voice actually starts, and everything before it is latency.
      const W = Math.max(1, Math.round(SR * 0.005)), gate = pk * 0.1;
      let onset = n;
      for (let i = 0; i + W < n; i += W) {
        let mx = 0; for (let j = 0; j < W; j++) mx = Math.max(mx, Math.abs(d[i + j]));
        if (mx > gate) { onset = i; break; }
      }
      // and it must not be silence pretending to be a sound
      let rms = 0; for (let i = 0; i < n; i++) rms += d[i] * d[i];
      rms = Math.sqrt(rms / n);
      out.push({ k, sec: +(n / SR).toFixed(2), pk: +pk.toFixed(3),
                 onsetMs: +(onset / SR * 1000).toFixed(1), rms: +rms.toFixed(4),
                 ch: buf.numberOfChannels, sr: SR });
    }
    return out;
  });

  check('every take decodes', !m.some(o => o.err), m.filter(o => o.err).map(o => o.k + ' ' + o.err).join(', '));
  check('the set is complete (16 takes)', m.length === 16, m.length + ' found');

  console.log('\n  take            len    peak   onset    rms   ch  sr');
  for (const o of m) {
    if (o.err) continue;
    console.log('  ' + o.k.padEnd(15) + (o.sec + 's').padEnd(7) + String(o.pk).padEnd(7)
      + (o.onsetMs + 'ms').padEnd(9) + String(o.rms).padEnd(7) + String(o.ch).padEnd(4) + o.sr);
  }
  console.log('');

  const good = m.filter(o => !o.err);
  const late = good.filter(o => o.onsetMs > 60);
  check('no take opens with dead air (onset <= 60 ms)',
    !late.length, late.map(o => o.k + ' ' + o.onsetMs + 'ms').join(', '));
  const hot = good.filter(o => o.pk > 0.95);
  check('nothing is clipping (peak <= 0.95)',
    !hot.length, hot.map(o => o.k + ' ' + o.pk).join(', '));
  const dead = good.filter(o => o.rms < 0.01);
  check('nothing is silence pretending to be a sound',
    !dead.length, dead.map(o => o.k).join(', '));
  const combat = good.filter(o => /atk|dash|djump|hurt|land/.test(o.k));
  const longs = combat.filter(o => o.sec > 1.0);
  check('combat barks are short enough to not overlap (<= 1.0 s)',
    !longs.length, longs.map(o => o.k + ' ' + o.sec + 's').join(', '));
  // THE CHARGE IS THE ONE TAKE ALLOWED TO BE LONG, and it has to be: the burst
  // takes 0.6 s to build and the note has to still be going when it lands, or
  // the voice stops before the move does and the hold reads as having failed.
  const ch = good.find(o => o.k === 'hzd_charge');
  check('the charge note outlasts the charge itself (>= 0.6 s)',
    !!ch && ch.sec >= 0.6, ch ? ch.sec + 's vs 0.6 s of hold' : 'missing');
  const rel = good.find(o => o.k === 'hzd_release');
  check('...and there is a shout to spend it on', !!rel && rel.rms > 0.02,
    rel ? rel.sec + 's' : 'missing');
  const stereo = good.filter(o => o.ch !== 1);
  check('all mono — a positional bark in stereo fights the mix',
    !stereo.length, stereo.map(o => o.k).join(', '));

  // ---- THE GATE, and the routing ----------------------------------------
  const gate = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv);
    // The buffers are decoded by loadMedia(), which is gated on AC existing —
    // and AC only exists after a user gesture in a real session. A harness gets
    // neither for free, so it does both explicitly and then WAITS for the
    // decodes rather than sleeping a fixed time and hoping.
    if (typeof audioOn === 'function') audioOn();
    if (typeof loadMedia === 'function') loadMedia();
    const t0 = Date.now();
    while (Date.now() - t0 < 15000 && !(MBUF.hzd_atk1 && MBUF.hzd_atk2 && MBUF.hzd_atk3))
      await new Promise(r => setTimeout(r, 80));
    const played = [];
    const real = window.playBuf;
    window.playBuf = function (k, v, r2) { played.push(k); return real.apply(this, arguments); };
    // two attacks on the same frame must produce one bark
    HZDT = 0;
    sfx('atk'); const first = played.length;
    sfx('atk'); const second = played.length;
    // ...and one after the gap must produce another
    HZDT = 0;
    sfx('atk'); const third = played.length;
    const barks = played.filter(k => k.indexOf('hzd_') === 0);
    window.playBuf = real;
    return { first, second, third, barks, all: played };
  });
  check('a swing speaks', gate.barks.length >= 1, gate.barks.join(',') || 'silent');
  check('two swings on one frame do not stutter',
    gate.second - gate.first <= 1, 'delta ' + (gate.second - gate.first));

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she sounds on the frame she moves, and never twice at once');
})().catch(e => { console.error(e); process.exit(1); });
