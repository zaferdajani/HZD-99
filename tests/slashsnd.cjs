// Render the real sfx() through an OfflineAudioContext and measure it. A combat
// sound has to (a) start on the frame it is asked for, (b) read as three
// distinct claw passes rather than one wash, (c) sit at a sane level next to
// the sounds around it, and (d) get heavier on the third hit of the string.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
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
    // spectral fingerprint over the whole render: centroid via zero-crossings
    // per window, and the RING — energy above ~1.8 kHz still present after the
    // cut (150-400 ms), which is the crystal's signature and the claw's absence
    const finger = async (fire) => {
      const off = new OfflineAudioContext(1, 44100, 44100);
      const save = AC; AC = off; MUTED = false;
      fire();
      const buf = await off.startRendering();
      AC = save;
      const d = buf.getChannelData(0);
      let zc = 0, n = 22050;
      for (let i = 1; i < n; i++) if ((d[i] < 0) !== (d[i - 1] < 0)) zc++;
      const centroid = zc / 2 / (n / 44100);
      // crude high-band ring: zero-cross rate AND amplitude inside 150-400ms
      let zr = 0, amp = 0;
      const a0 = Math.floor(0.15 * 44100), a1 = Math.floor(0.40 * 44100);
      for (let i = a0 + 1; i < a1; i++) {
        if ((d[i] < 0) !== (d[i - 1] < 0)) zr++;
        amp = Math.max(amp, Math.abs(d[i]));
      }
      const ringHz = zr / 2 / ((a1 - a0) / 44100);
      return { centroid: Math.round(centroid), ringHz: Math.round(ringHz), ringAmp: +amp.toFixed(3) };
    };
    const out = {};
    for (const beat of [0, 1, 2]) {
      player.combo = beat;
      out['slash beat ' + (beat + 1)] = await measure(() => sfx('atk'));
    }
    for (const k of ['hit', 'jump', 'dash']) out['(ref) ' + k] = await measure(() => sfx(k));
    // ---- THE THREE WEAPONS SOUND LIKE THREE WEAPONS -----------------------
    // wielded() reads the save flags, so the harness plays the player's whole
    // arsenal by setting them — the same route the real unlocks will take.
    //
    // HER VOICE IS SILENCED FOR THIS BLOCK, and that is the difference between
    // measuring a weapon and measuring a mix. sfx('atk') puts her bark on top
    // of whatever she is holding, the same bark for all three, and it is a
    // ~300 ms sample that lands squarely in the 150-400 ms window the ring is
    // read from. It swamped the crystal's actual signature — the claw scored a
    // 0.424 "ring" made entirely of her voice, against the crystal's real
    // 0.007 — and inverted the result while every number on screen looked
    // plausible. hzdSay() gates on HZDT, so parking that in the far future is
    // an off switch that needs no game-side flag. The voice itself is measured
    // in tests/hzdvox.cjs, which is where it belongs.
    //
    // It went unnoticed until the audio loader changed: nothing here ever
    // produced a user gesture, so her samples had simply never been decoded and
    // the harness had been measuring a voiceless claw by accident.
    HZDT = 1e18;
    player.combo = 0;
    G.save.flags.crystal = 0; G.save.flags.crystal2 = 0;
    out.wClaw = await finger(() => sfx('atk'));
    G.save.flags.crystal = 1;
    out.wCrystal = await finger(() => sfx('atk'));
    G.save.flags.crystal2 = 1;
    out.wDouble = await finger(() => sfx('atk'));
    G.save.flags.crystal = 0; G.save.flags.crystal2 = 0;
    out.join = await finger(() => sfx('crystalJoin'));
    return out;
  });
  for (const k in r) console.log(k.padEnd(14), JSON.stringify(r[k]));
  let bad = 0;
  const chk = (name, ok, det) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (det ? '  ' + det : '')); if (!ok) bad++; };
  // the crystal RINGS after the cut; the claw does not
  chk('single crystal sustains a glass ring the claw lacks',
    r.wCrystal.ringAmp > r.wClaw.ringAmp * 2 && r.wCrystal.ringHz > 1200,
    'claw ' + r.wClaw.ringAmp + ' vs crystal ' + r.wCrystal.ringAmp + ' @' + r.wCrystal.ringHz + 'Hz');
  // the double rings LOWER than the single — a bigger piece of crystal
  chk('the double\'s ring sits below the single\'s',
    r.wDouble.ringHz < r.wCrystal.ringHz * 0.85,
    r.wDouble.ringHz + ' vs ' + r.wCrystal.ringHz + ' Hz');
  // three distinct spectral centres — no two weapons share a voice
  const cs = [['claw', r.wClaw.centroid], ['crystal', r.wCrystal.centroid], ['double', r.wDouble.centroid]];
  let distinct = true;
  for (let i = 0; i < 3; i++) for (let k = i + 1; k < 3; k++) {
    const lo = Math.min(cs[i][1], cs[k][1]), hi = Math.max(cs[i][1], cs[k][1]);
    if (lo / hi > 0.88) distinct = false;
  }
  chk('no two weapons share a spectral centre (>=12% apart)',
    distinct, cs.map(c => c[0] + ' ' + c[1] + 'Hz').join(', '));
  chk('the join sting exists and rings', r.join.ringAmp > 0.01, 'ringAmp ' + r.join.ringAmp);
  console.log('pageerrors:', errs.length ? errs.slice(0, 2) : 'none');
  await b.close();
  if (bad || errs.length) { console.log('FAILED: ' + bad + ' check(s)'); process.exit(1); }
})();
