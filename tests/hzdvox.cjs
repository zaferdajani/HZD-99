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
  const r = await page.evaluate(async () => {
    const keys = Object.keys(MEDIA_SRC.audio).filter(k => k.indexOf('hzd_') === 0);
    // WHAT HER VOICE CAN ASK FOR, taken from the table that does the asking.
    // This used to be the number 16, which meant every legitimate addition to
    // her voice read as a missing take — "yalla" landed and the harness called
    // the set incomplete while measuring it as fine on every other law. The
    // pairing is the real rule and it cannot go stale: every take HZDVOX names
    // is on disk, and every hzd_ file shipped is one HZDVOX can reach.
    const wanted = new Set();
    for (const v of Object.values(HZDVOX)) for (const t of v) wanted.add(t[0]);
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
    return { takes: out, wanted: [...wanted].sort(), shipped: keys.slice().sort() };
  });

  const pairing = { missing: r.wanted.filter(k => !r.shipped.includes(k)),
                    orphan: r.shipped.filter(k => !r.wanted.includes(k)) };
  const m = r.takes;
  check('every take decodes', !m.some(o => o.err), m.filter(o => o.err).map(o => o.k + ' ' + o.err).join(', '));
  check('every voice the code can ask for has a take on disk',
    pairing.missing.length === 0, pairing.missing.join(', ') || r.wanted.length + ' named, all present');
  check('and no take ships that her voice can never reach',
    pairing.orphan.length === 0, pairing.orphan.join(', ') || r.shipped.length + ' shipped, all reachable');

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

  // ---- THE HELD NOTE, WHICH IS A STATE AND NOT AN EVENT --------------------
  //
  // The owner, 2026-08-24: "the long ya is appearing all the time even though
  // without charging, which was created for the charged hit."
  //
  // hzd_charge is 1.60 seconds — the longest take she has, twice an ordinary
  // attack bark — and it fired at 0.14 s of hold, which is earlier than the
  // charge's own visible tell (the tick ladder and particles both start at
  // 0.25) and shorter than an ordinary tap. So a normal attack started a note
  // that outlived its own swing by more than a second and bled over the next
  // two hits of the string. Twice over: it also never stopped when the button
  // did, because playBuf fires and forgets.
  //
  // This drives the real charge and counts the DECISION rather than listening
  // to the output, so it means the same thing on a machine with no audio
  // device: the harness owns hzdHold/hzdRelease for the length of the test.
  const hold = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv); loadRoom('A1');
    G.dialog = null; G.trans = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    let holds = 0, rels = 0;
    const rH = window.hzdHold, rR = window.hzdRelease;
    window.hzdHold = function () { holds++; return true; };
    window.hzdRelease = function () { rels++; };
    // Hold the claw until chargeT passes `upto`, then let go. Driving off
    // chargeT rather than off wall-clock frames is what makes this stable on a
    // slow machine: it is the same quantity the code under test branches on.
    const press = async (upto, volts) => {
      holds = 0; rels = 0;
      player.volts = volts; player.chargeT = 0; player.chargeVoxed = false;
      for (const k in keys) keys[k] = 0;
      keys.KeyX = 1; keysP.KeyX = 1;   // ATK, which is what chargeT reads
      for (let f = 0; f < 240; f++) {
        await new Promise(k => requestAnimationFrame(k));
        if (player.chargeT >= upto) break;
      }
      const reached = player.chargeT;
      keys.KeyX = 0; keysP.KeyX = 0;
      for (let f = 0; f < 8; f++) await new Promise(k => requestAnimationFrame(k));
      return { holds, rels, reached: +reached.toFixed(2) };
    };
    const out = {};
    out.tap = await press(0.20, 60);        // an ordinary attack, button held 200 ms
    out.charging = await press(0.45, 60);   // past the tell, short of the burst
    out.full = await press(0.70, 60);       // all the way through
    out.broke = await press(0.45, 5);       // ...and with nothing to spend
    window.hzdHold = rH; window.hzdRelease = rR;
    return out;
  });

  check('an ordinary tap never starts the held note',
    hold.tap.holds === 0, 'held ' + hold.tap.reached + 's, note started ' + hold.tap.holds + ' time(s)');
  check('...and a real charge does', hold.charging.holds === 1,
    'held ' + hold.charging.reached + 's, note started ' + hold.charging.holds + ' time(s)');
  check('...and letting go ends it', hold.charging.rels >= 1,
    hold.charging.rels + ' release(s)');
  check('...and so does firing it', hold.full.holds === 1 && hold.full.rels >= 1,
    'held ' + hold.full.reached + 's, ' + hold.full.holds + ' start / ' + hold.full.rels + ' release');
  // the refusal path stays dull on purpose: a hero straining for a move she
  // cannot afford is the promise-that-isn't the charge was rewritten to stop
  check('a charge she cannot pay for stays silent', hold.broke.holds === 0,
    hold.broke.holds + ' note(s) on ' + hold.broke.reached + 's with 5 volts');

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  // ---- SHE IS A KITTEN, AND HER WORDS HAVE TO SOUND LIKE ONE ---------------
  //
  // The owner on the idle line: "the sound itself, it's grown up more than
  // childish now, which is not derived from the audio I gave you." He is right
  // and it is measurable off her own voice — no reference needed, because the
  // rest of the set IS the reference.
  //
  // Her SPOKEN takes cluster in a bright young register: atk1 364 Hz, atk3 386,
  // release 434, jump 460, hurtbad 517, evo 581, die 653, win 653, heal 875,
  // hurt 928, djump 984, dash 1172 — measured as the strongest partial below
  // 1200 Hz. Two words sit far under that cluster and read as somebody older:
  // yalla at 216 Hz and atk2 at 95, the middle hit of a three-hit string whose
  // first and third are 364 and 386. That is a different character speaking in
  // the middle of her own combo.
  //
  // BODY SOUNDS ARE EXEMPT and named, not guessed at: a purr, a landing grunt
  // and a held charge note are not words and have no register to keep.
  const SPOKEN_FLOOR = 300;                 // her lowest passing word is 364
  const BODY = ['hzd_purr', 'hzd_land', 'hzd_charge'];
  const reg = await page.evaluate(async (BODY) => {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const out = {};
    for (const k of Object.keys(MEDIA_SRC.audio)) {
      if (k.indexOf('hzd_') !== 0 || BODY.indexOf(k) >= 0) continue;
      try {
        const bb = await ac.decodeAudioData((await (await fetch(MEDIA_SRC.audio[k])).arrayBuffer()).slice(0));
        const d = bb.getChannelData(0), sr = bb.sampleRate;
        const N = Math.min(d.length, Math.round(1.2 * sr));
        let bestF = 0, bestM = 0;
        for (let f = 80; f <= 1200; f = Math.round(f * 1.06)) {
          let re = 0, im = 0;
          for (let i = 0; i < N; i++) { const a = 2 * Math.PI * f * i / sr; re += d[i] * Math.cos(a); im += d[i] * Math.sin(a); }
          const m = Math.hypot(re, im) / N;
          if (m > bestM) { bestM = m; bestF = f; }
        }
        out[k] = bestF;
      } catch (e) { out[k] = -1; }
    }
    return out;
  }, BODY);
  const low = [];
  for (const k of Object.keys(reg).sort((a, b) => reg[a] - reg[b])) {
    const f = reg[k];
    const bad = f >= 0 && f < SPOKEN_FLOOR;
    console.log('      ' + k.padEnd(14) + String(f).padStart(5) + ' Hz'
      + (bad ? '   <-- BELOW HER REGISTER (floor ' + SPOKEN_FLOOR + ')' : ''));
    if (bad) low.push(k + ' ' + f + 'Hz');
  }
  check('every word she says is in her own register', !low.length, low.join(', '));

  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she sounds on the frame she moves, and never twice at once');
})().catch(e => { console.error(e); process.exit(1); });
