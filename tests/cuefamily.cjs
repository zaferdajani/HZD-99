// A CUE'S JOB IS TO SAY WHAT JUST HAPPENED.
//
// The owner, 2026-08-24: "the audio effect is not connected ideally with the
// moves it's doing. It needs better and more audios to make more sense."
//
// Measured, the game had four cues carrying seventy-three call sites. 'shoot'
// was ONE LINE — tone(980, 0.1, 'square') — and it played for a turret's aimed
// bolt, a cinder falling under gravity, a plucked note, a fan of quills, an
// ice shard, a violet orb, a five-shot lance, an eruption out of the floor,
// and twice for SPAWNING A FLIER, which is not a shot at all.
//
// One blip for nine events says only "something", which is the one thing the
// player already knew.
//
// Renaming is not fixing, so this measures whether the cues are actually
// DISTINGUISHABLE. Each is rendered offline and reduced to a fingerprint —
// where its energy sits in frequency, how long it lasts, how sharp its attack
// is — and every pair must differ on at least one axis by a real margin. A
// family of nine names that all sound the same would pass a grep and fail here.
//
//   node tests/cuefamily.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cuefamily — the things she is shot at with do not all sound alike\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await page.waitForTimeout(500);

  // TWO FAMILIES, MEASURED THE SAME WAY. Things that are FIRED, and things
  // that are GATHERED — 'cast' carried twenty-six sites on its own, and a
  // wind-up is the most information-dense sound in a fight: it is the only cue
  // that means "it is about to", and WHICH it is about to decides what the
  // player does. One hum for all of them says a boss is doing something, which
  // a boss is always doing.
  const FIRED = ['shoot', 'lob', 'cinder', 'quill', 'shard', 'orbshot', 'ringshot', 'lance', 'summon', 'erupt'];
  const GATHERED = ['castfire', 'castice', 'castnull', 'castarc', 'snarecast', 'plume',
                    'spikeup', 'icecolumn', 'lash', 'prison', 'msong', 'beamwarn'];
  // ...and things that LAND. 'boom' was hiss plus one falling sawtooth for
  // seventeen sites, and impacts are where a fight is legible or is not: the
  // player has to know from the sound alone whether that was their hit
  // landing, something dying, or a ton of machine arriving next to them.
  const LANDED = ['burstout', 'wreck', 'wreckbig', 'blast', 'shockring',
                  'slam', 'quake', 'crack', 'beamfire', 'launch'];
  // THE WARNINGS ARE THE EXCEPTION, and they are measured for the OPPOSITE
  // property. 'tell' is the only cue in the game that means "it is about to",
  // and its value is that it is LEARNED — hear it once, act on it forever.
  // Splitting it thirteen ways would destroy exactly what makes it worth
  // having. So the three sizes must share one gesture and differ only in
  // weight, and this harness has to hold BOTH halves of that or the family
  // drifts apart the first time someone tunes one of them.
  const WARN = ['tell', 'tellmid', 'tellbig'];
  const FAM = FIRED.concat(GATHERED).concat(LANDED);
  const r = await page.evaluate(async ({ FAM, WARN }) => {
    const SR = 44100, N = SR * 2;
    const out = {};
    for (const cue of FAM) {
      const off = new OfflineAudioContext(1, N, SR);
      const save = AC; AC = off; MUTED = false;
      sfx(cue);
      const d = (await off.startRendering()).getChannelData(0);
      AC = save;
      let pk = 0, tot = 0;
      for (let i = 0; i < N; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; tot += d[i] * d[i]; }
      // the tail: last sample above a thousandth of peak
      let dur = 0;
      for (let i = N - 1; i > 0; i--) if (Math.abs(d[i]) > pk * 0.001) { dur = i / SR; break; }
      // the attack: how long to first reach half of peak. A crack and a swell
      // are different events even at the same pitch.
      let atk = dur;
      for (let i = 0; i < N; i++) if (Math.abs(d[i]) >= pk * 0.5) { atk = i / SR; break; }
      // SPECTRAL CENTROID by zero-crossing rate, which needs no FFT and is
      // exactly the "is it bright or is it heavy" axis the ear uses first.
      let zc = 0;
      const lim = Math.max(1, Math.floor(dur * SR));
      for (let i = 1; i < lim; i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) zc++;
      out[cue] = { dur: +dur.toFixed(3), atk: +atk.toFixed(3), pk: +pk.toFixed(3),
                   energy: +tot.toFixed(3), bright: +(zc / Math.max(dur, 0.001)).toFixed(0) };
    }
    // ...and the warnings, measured for shape rather than for difference: does
    // the pitch RISE across the cue, and how much weight is under it.
    out.__warn = {};
    for (const cue of WARN) {
      const off = new OfflineAudioContext(1, N, SR);
      const save = AC; AC = off; MUTED = false;
      sfx(cue);
      const d = (await off.startRendering()).getChannelData(0);
      AC = save;
      let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(d[i]));
      let end = 0;
      for (let i = N - 1; i > 0; i--) if (Math.abs(d[i]) > pk * 0.001) { end = i; break; }
      // DOES THE STRONGEST PITCH GO UP? Asked directly, with a pitch tracker,
      // because the two cheap proxies both lied here and it is worth writing
      // down which and why.
      //
      // Zero-crossing rate over the first and last THIRD of elapsed time puts
      // the back window on a decayed tail with no signal left to count, and a
      // cue that plainly rises measured as flat. Moving the windows onto the
      // audible part fixed that and broke something else: the two tones of a
      // tell OVERLAP by design, so the second window holds their SUM, and the
      // zero-crossing rate of a sum is not the pitch of either.
      //
      // So: scan for the loudest frequency in each half and compare them. That
      // is the claim the cue is making, measured as the claim.
      const domIn = (a, b) => {
        const len = Math.max(64, b - a);
        let bestF = 0, bestE = 0;
        for (let f = 220; f <= 3000; f *= 1.06) {
          const w = 2 * Math.PI * f / SR, coeff = 2 * Math.cos(w);
          let s1 = 0, s2 = 0, s0;
          for (let i = 0; i < len && a + i < N; i++) {
            const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / len);
            s0 = d[a + i] * win + coeff * s1 - s2; s2 = s1; s1 = s0;
          }
          const e = Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2);
          if (e > bestE) { bestE = e; bestF = f; }
        }
        return bestF;
      };
      const loud = [];
      for (let i = 0; i < end; i++) if (Math.abs(d[i]) > pk * 0.05) loud.push(i);
      const lo0 = loud.length ? loud[0] : 0;
      const loMid = loud.length ? loud[Math.floor(loud.length / 2)] : Math.floor(end / 2);
      const loEnd = loud.length ? loud[loud.length - 1] : end;
      // low-end weight: mean absolute value of a heavily smoothed copy, which
      // is a cheap stand-in for "how much is happening below a few hundred Hz"
      let lp = 0, acc = 0, w = 0;
      for (let i = 0; i < end; i++) { lp += (d[i] - lp) * 0.004; acc += Math.abs(lp); w++; }
      out.__warn[cue] = { rise: +(domIn(loMid, loEnd) / Math.max(1, domIn(lo0, loMid))).toFixed(2),
                          weight: +(acc / Math.max(1, w) * 1000).toFixed(2),
                          dur: +(end / SR).toFixed(3) };
    }
    return out;
  }, { FAM, WARN });

  for (const c of FAM)
    console.log('    ' + c.padEnd(9) + ' ' + r[c].dur + 's  attack ' + r[c].atk +
                's  bright ' + String(r[c].bright).padStart(6) + '  peak ' + r[c].pk);
  console.log('');

  const missing = FAM.filter(c => !r[c] || r[c].dur === 0);
  check('every cue in the family makes a sound', missing.length === 0,
    missing.length ? 'silent: ' + missing.join(', ') : FAM.length + ' cues');

  // Two cues are DISTINCT if they differ enough on any one axis to be told
  // apart. The thresholds are deliberately coarse — this is not asking for
  // taste, it is asking whether renaming actually changed anything.
  const same = [];
  for (let i = 0; i < FAM.length; i++)
    for (let j = i + 1; j < FAM.length; j++) {
      const a = r[FAM[i]], b = r[FAM[j]];
      if (!a || !b) continue;
      const durR = Math.max(a.dur, b.dur) / Math.max(0.001, Math.min(a.dur, b.dur));
      const briR = Math.max(a.bright, b.bright) / Math.max(1, Math.min(a.bright, b.bright));
      const atkD = Math.abs(a.atk - b.atk);
      const enR = Math.max(a.energy, b.energy) / Math.max(0.0001, Math.min(a.energy, b.energy));
      if (durR < 1.25 && briR < 1.25 && atkD < 0.04 && enR < 1.8) same.push(FAM[i] + '/' + FAM[j]);
    }
  check('...and no two of them are the same sound wearing two names',
    same.length === 0, same.length ? same.join(', ') : 'all ' +
      (FAM.length * (FAM.length - 1) / 2) + ' pairs separate');

  // the two that must not be confusable at all: a thing arriving is not a shot
  const sm = r.summon, sh = r.shoot;
  // the four elemental gathers are the ones the player has to tell apart under
  // pressure, so they are checked against each other by name rather than only
  // in the all-pairs sweep
  const EL = ['castfire', 'castice', 'castnull', 'castarc'];
  const elSame = [];
  for (let i = 0; i < EL.length; i++)
    for (let j = i + 1; j < EL.length; j++) {
      const a = r[EL[i]], b = r[EL[j]];
      if (a && b && Math.max(a.bright, b.bright) / Math.max(1, Math.min(a.bright, b.bright)) < 1.4)
        elSame.push(EL[i] + '/' + EL[j]);
    }
  check('the four elements gather differently enough to act on',
    elSame.length === 0,
    elSame.length ? elSame.join(', ') : EL.map(e => e.replace('cast', '') + ' ' + r[e].bright).join(', '));
  // the one the player must never mistake: their own burst paying off, against
  // the same-sized thing happening TO them
  check('her burst does not sound like a thing dying',
    r.burstout && r.wreckbig &&
    Math.max(r.burstout.bright, r.wreckbig.bright) /
      Math.max(1, Math.min(r.burstout.bright, r.wreckbig.bright)) >= 1.4,
    r.burstout ? 'burst ' + r.burstout.bright + ' vs wreck ' + r.wreckbig.bright : '');
  check('a creature arriving does not sound like a rifle',
    sm && sh && sm.dur > sh.dur * 2.5,
    sm && sh ? 'summon ' + sm.dur + 's vs shoot ' + sh.dur + 's' : 'not measured');
  // and a heaved lob has no crack in it: its attack is slower than a bolt's
  check('...and a lob is heaved, not fired', r.lob && r.shoot && r.lob.atk > r.shoot.atk,
    r.lob ? 'lob reaches half-peak at ' + r.lob.atk + 's, the bolt at ' + r.shoot.atk + 's' : '');
  const clip = FAM.filter(c => r[c] && r[c].pk > 1.0);
  check('nothing in the family clips', clip.length === 0, clip.join(', ') || 'all under 1.0');

  const W = r.__warn || {};
  console.log('');
  for (const c of ['tell', 'tellmid', 'tellbig'])
    if (W[c]) console.log('    ' + c.padEnd(9) + ' ' + W[c].dur + 's  rise x' + W[c].rise + '  weight ' + W[c].weight);
  console.log('');
  const notRising = ['tell', 'tellmid', 'tellbig'].filter(c => !W[c] || W[c].rise < 1.15);
  check('every warning RISES, because that is what encodes time remaining',
    notRising.length === 0,
    notRising.length ? notRising.join(', ') : 'all three climb across the cue');
  check('...and they get heavier with the thing making them, not different',
    W.tell && W.tellmid && W.tellbig &&
    W.tellbig.weight > W.tellmid.weight && W.tellmid.weight > W.tell.weight,
    W.tell ? 'weight ' + W.tell.weight + ' -> ' + W.tellmid.weight + ' -> ' + W.tellbig.weight : '');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
