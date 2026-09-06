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
              'hz_evosting', 'hz_winsting',
              'hz_stepgrass1', 'hz_stepgrass2', 'hz_steprock1', 'hz_steprock2',
              'hz_stepice1', 'hz_stepice2', 'hz_steporg1', 'hz_steporg2',
              'fz_tell', 'fz_tellmid', 'fz_tellbig', 'fz_slam', 'fz_phase',
              'fz_wave', 'fz_spikeup', 'fz_summon', 'fz_wreck', 'fz_break',
              'fz_roar', 'fz_castarc', 'fz_castice', 'fz_castnull',
              'fz_roar_glitch', 'fz_roar_brood', 'fz_roar_atlas',
              'fz_roar_zero', 'fz_roar_prism', 'fz_roar_mother',
              'hum_servo', 'hum_ratchet', 'hum_mono', 'hum_sage',
              'hum_patch', 'hum_lumen'];

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
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
    // NOTHING LONG IS DECODED. loadMedia holds every key in MEDIA_SRC.audio as
    // raw PCM for the whole session, so a long clip in that map is the mistake
    // the spoken lines were moved out of streaming to avoid — and it arrives
    // looking exactly like a sound effect. Measured here, not trusted: the two
    // ten-second motif stings live in MEDIA_SRC.sting and are streamed.
    out.long = [];
    for (const k in MEDIA_SRC.audio) {
      try {
        const b = await (await fetch('/' + MEDIA_SRC.audio[k])).arrayBuffer();
        const ab = await ac.decodeAudioData(b.slice(0));
        if (ab.duration > 5) out.long.push(k + ' ' + ab.duration.toFixed(1) + 's');
      } catch (e) {}
    }
    out.streamed = Object.keys((MEDIA_SRC.sting) || {});

    // ...AND WHAT SHE HEARS IS THE SOUND, NOT ITS RUN-UP.
    //
    // Decoding proves the file is playable. It does not prove the player ever
    // hears it, and for half of these she did not. The takes are generated at
    // about a second and several bloom rather than crack — hz_swing1 does not
    // peak until 393 ms, hz_dash until 260, hz_stepice1 until 301 — while the
    // gesture they belong to is 0.17 s. TAKE_GATE closes the window at the
    // gesture's length (a one-second swing out-ringing everything is its own
    // bug, and slashsnd holds that line), so before playBuf learned to seek,
    // the gate was fading the take out DURING its own rise: hz_swing1 reached
    // the player 9.5 dB under its peak carrying 1% of its energy, hz_dash
    // 18.6 dB under carrying 8%, hz_steporg1 20.1 dB under carrying 4%.
    //
    // So the envelope playBuf actually schedules is rebuilt here and measured
    // against the file: the loudest moment of a take must survive to the
    // player, and enough of the take must come with it to be a sound rather
    // than a tick. This is the check that a new take, or a changed gate, is
    // ANSWERING THE GESTURE — no ear required.
    out.heard = {};
    for (const key in TAKE_GATE) {
      const src = MEDIA_SRC.audio && MEDIA_SRC.audio[key];
      if (!src) continue;
      let d, SR;
      try {
        const ab = await (await fetch('/' + src)).arrayBuffer();
        const buf = await ac.decodeAudioData(ab.slice(0));
        d = buf.getChannelData(0); SR = buf.sampleRate;
        // the game's own seek is asked, not reimplemented — bufOnset reads
        // MBUF, which in a harness that fetched the file itself is empty
        MBUF[key] = buf;
      } catch (e) { out.heard[key] = { err: String(e).slice(0, 40) }; continue; }
      let raw = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > raw) raw = a; }
      if (raw < 1e-6) { out.heard[key] = { err: 'silent' }; continue; }
      const on = bufOnset(key), gate = TAKE_GATE[key], hold = gate * 0.55;
      const from = Math.round(on * SR);
      let heard = 0, heardAt = 0, kept = 0, all = 0;
      for (let i = from; i < d.length; i++) {
        const t = (i - from) / SR, a = Math.abs(d[i]);
        let g = 1;
        if (t >= gate) g = 0; else if (t > hold) g = Math.pow(0.001, (t - hold) / (gate - hold));
        const h = a * g;
        if (h > heard) { heard = h; heardAt = t; }
        kept += d[i] * d[i] * g * g; all += d[i] * d[i];
      }
      out.heard[key] = {
        lossDb: +(20 * Math.log10(Math.max(heard, 1e-9) / raw)).toFixed(1),
        atMs: Math.round(heardAt * 1000),
        keptPct: Math.round(kept / (all || 1e-9) * 100) };
    }
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
  const okLong = r.long.length === 0;
  console.log('  ' + (okLong ? 'ok  ' : 'FAIL') + ' nothing over 5s is decoded'
    + (okLong ? ' (' + r.streamed.length + ' streamed instead)' : ': ' + r.long.join(', ')));
  if (!okLong) bad++;
  // the delivery law: her gesture reaches the player at full strength, on time
  for (const key in r.heard) {
    const h = r.heard[key];
    // 2 dB is a hair off the peak — a take may lose a fraction to the 5 ms
    // ease-in without anyone being able to hear that it did. 15% of the take's
    // energy is the difference between a sound and a tick, and the ceiling on
    // the heard peak is one tenth of a second: past that the hand has stopped
    // associating the sound with the button.
    const ok = !h.err && h.lossDb >= -2 && h.keptPct >= 15 && h.atMs <= 100;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + key.padEnd(14) + 'reaches her at '
      + (h.err || (h.lossDb + ' dB of its peak, ' + h.atMs + ' ms in, ' + h.keptPct + '% of it')));
    if (!ok) bad++;
  }
  if (errs.length) { console.log('  FAIL page errors: ' + errs[0]); bad++; }
  await b.close();
  if (bad) { console.log('\n' + bad + ' foley take(s) unplayable or not reaching her'); process.exit(1); }
  console.log('\nOK — every authored take decodes, and reaches her at full strength on time');
})();
