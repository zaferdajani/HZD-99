// THE SWIRL, and the two-blade window it opens.
//
// With both halves in her paws the charged blow stops being a shove and becomes
// a dance: she turns on one toe and the two crystals cut a ring around her, four
// passes over 640 ms. Then the blade stays SPLIT for six seconds and her combo
// swings both.
//
// Every one of those sentences is a number, so every one of them is checked
// here. The failure this exists to catch is the one that makes a "new move" not
// a move at all: a burst with different particles, one hit, same reach, no cost.
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── twin — the swirl, and the two blades it leaves her holding');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse']; startGame(sv);
  });

  const m = await page.evaluate(async () => {
    const out = {};
    const step = (n) => { for (let i = 0; i < n; i++) player.update(1 / 30); };
    const arm = (both) => {
      G.save.flags.crystal = 1;
      G.save.flags.crystal2 = both ? 1 : 0;
      G.boomer = null;
    };
    // a punchbag that cannot fight back and cannot die, so the passes can be
    // counted without the target vanishing halfway through
    const bag = () => {
      G.enemies.length = 0;
      const e = new Enemy('crawler', player.x + 30, player.y);
      e.hp = 99999; e.maxhp = 99999; G.enemies.push(e);
      return e;
    };

    // ---- 1. WITH ONE HALF it is still the old burst ------------------------
    arm(false);
    player.volts = 99; player.chargeT = 1; player.swirlT = 0;
    player.releaseCharged();
    out.singleIsBurst = player.swirlT === 0 && !!player.swingVis && !player.swingVis.swirl;

    // ---- 2. WITH BOTH it is the swirl -------------------------------------
    arm(true);
    player.volts = 99; player.chargeT = 1; player.swirlT = 0; player.twinT = 0;
    player.releaseCharged();
    out.bothIsSwirl = player.swirlT > 0 && !!player.swingVis && player.swingVis.swirl === true;
    out.swirlT = +player.swirlT.toFixed(3);
    out.twinT = +player.twinT.toFixed(3);
    out.rose = player.vy <= -100;           // she leaves the floor for it

    // ---- 3. IT LANDS ITS PASSES -------------------------------------------
    const e = bag();
    const hp0 = e.hp;
    player.x = e.x - 20; player.y = e.y;    // inside the ring
    player.volts = 99; player.chargeT = 1; player.swirlT = 0; player.swirlHits = 0;
    player.releaseCharged();
    // atkCD is a DECAYING timer, so it has to be sampled on the frame the move
    // ends rather than at leisure afterwards — the first version of this stepped
    // a full second and then read -0.03, which measured the decay, not the cost
    let peak = 0;
    for (let i = 0; i < 30; i++) { player.update(1 / 30); peak = Math.max(peak, player.atkCD); }
    out.passes = player.swirlHits;
    out.dealt = hp0 - e.hp;
    out.recovery = +peak.toFixed(3);

    // ---- 4. IT IS A RING, NOT A PUNCH -------------------------------------
    // something BEHIND her must be hit too, which is the whole difference from
    // the single-crystal burst and the reason it is worth a different button
    G.enemies.length = 0;
    const back = new Enemy('crawler', player.x - 40, player.y);
    back.hp = 9999; back.maxhp = 9999; G.enemies.push(back);
    player.face = 1;                        // facing away from it
    const bhp = back.hp;
    player.volts = 99; player.chargeT = 1; player.swirlT = 0; player.swirlHits = 0;
    player.releaseCharged();
    step(30);
    out.hitBehind = bhp - back.hp;

    // ---- 5. THE WINDOW WIDENS HER SWING -----------------------------------
    const box = (twin) => {
      player.twinT = twin ? 5 : 0;
      player.swing = { t: 0.15, ax: 1, ay: 0, ang: 0, combo: 0, set: new Set(),
                       wield: 2, pure: true, twin: twin };
      const b = player.hitbox();
      // ax0 is the swing's ANCHOR, not the box's centre. The twin's law is
      // "half grows, R does not", and centre-of-box only witnessed that while
      // nothing else touched the box — the near edge now reaches back to her
      // body, which moves the centre of the narrower box and left this
      // measuring the wrong quantity. The anchor says it directly.
      return { w: Math.round(b.w), cx: Math.round(b.ax0),
               near: Math.round(b.x), far: Math.round(b.x + b.w) };
    };
    const plain = box(false), twinB = box(true);
    out.plainW = plain.w; out.twinW = twinB.w;
    out.sameReach = plain.cx === twinB.cx;   // wider, not longer: R did not move
    // ...and the twin box is SYMMETRIC about that anchor: it spreads equally
    // both ways rather than only forwards. (The plain box cannot be checked
    // this way — it is the narrow one, so the near-edge floor binds on it and
    // deliberately pushes its near side back to her body.)
    out.twinSym = Math.abs((twinB.cx - twinB.near) - (twinB.far - twinB.cx)) <= 1;
    out.twinSpread = (twinB.cx - twinB.near) + ':' + (twinB.far - twinB.cx);
    player.twinT = 0; player.swing = null;
    return out;
  });

  // THE CUE, MEASURED. The claim in crystalSwirl() is that the sound runs on
  // the MOVE's clock — four rising notes at SWIRL_STEP, so the ear can count
  // the passes and know a fourth is still coming. That is only true if each
  // written note is the loudest of the four in its own 160 ms window, which is
  // the same test cuepitch.cjs applies to the melodies. Noise (the four
  // whooshes) is broadband and does not favour any one bin, so a narrow DFT at
  // the four frequencies reads through it.
  const snd = await page.evaluate(async () => {
    // AN OFFLINE RENDER SHOULD BE REPRODUCIBLE, AND THIS ONE WAS NOT.
    //
    // It came back `2 1 2 3` on one suite run and `0 1 2 3` on every run
    // beside it, with nothing changed. There is no wall clock in an
    // OfflineAudioContext, so the variation had only one place to come from:
    // the cue's four whooshes are noise, filled from Math.random, and a narrow
    // DFT reading a tone through broadband noise can lose to a lucky
    // realisation of it. Seeding the stream makes the render the same render
    // every time — which is what "the written note is the loudest in its own
    // window" was always meant to be asserting about the CUE rather than about
    // the dice that happened to fill its hiss.
    const realRand = Math.random;
    let sd = 0x9e3779b9;
    Math.random = () => {                            // mulberry32
      sd = (sd + 0x6d2b79f5) >>> 0;
      let x = sd;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    try {
    const SR = 44100, NOTE = [784, 988, 1175, 1568];
    const off = new OfflineAudioContext(1, SR, SR);
    const save = AC; AC = off; MUTED = false;
    sfx('crystalSwirl');
    const buf = await off.startRendering();
    AC = save;
    const d = buf.getChannelData(0);
    const mag = (f, from, len) => {
      let re = 0, im = 0;
      for (let i = 0; i < len; i++) {
        const a = 2 * Math.PI * f * i / SR;
        re += d[from + i] * Math.cos(a); im += d[from + i] * Math.sin(a);
      }
      return Math.hypot(re, im) / len;
    };
    const loudest = [];
    for (let i = 0; i < 4; i++) {
      const from = Math.round((i * 0.16 + 0.012) * SR), len = Math.round(0.13 * SR);
      const m = NOTE.map(f => mag(f, from, len));
      loudest.push(m.indexOf(Math.max(...m)));
    }
    // ...and it must not merely BE the burst's cue. chargedHit is a thud — a
    // 70 Hz sawtooth falling to 30 under a hiss. Rendering both and comparing
    // their low:high energy is the honest version of "it sounds different":
    // an absolute threshold would only encode whatever this build happens to do.
    const ratio = async (cue) => {
      const o = new OfflineAudioContext(1, SR, SR);
      const s2 = AC; AC = o; MUTED = false;
      sfx(cue);
      const bb = await o.startRendering();
      AC = s2;
      const dd = bb.getChannelData(0);
      const mg = (f) => {
        let re = 0, im = 0, len = Math.round(0.2 * SR);
        for (let i = 0; i < len; i++) {
          const a = 2 * Math.PI * f * i / SR;
          re += dd[i] * Math.cos(a); im += dd[i] * Math.sin(a);
        }
        return Math.hypot(re, im) / len;
      };
      let lo = 0, hi = 0;
      for (let f = 40; f <= 200; f += 20) lo += mg(f);
      for (let f = 700; f <= 1600; f += 100) hi += mg(f);
      return lo / (hi || 1e-9);
    };
    return { loudest, swirlRatio: await ratio('crystalSwirl'), burstRatio: await ratio('chargedHit') };
    } finally { Math.random = realRand; }
  });

  check('the swirl has its OWN cue, on the pass clock', snd.loudest.join('') === '0123',
        'loudest note per 160ms window: ' + snd.loudest.join(' '));
  check('...and it is bright where the burst is a thud', snd.swirlRatio < snd.burstRatio / 3,
        'low:high  swirl ' + snd.swirlRatio.toFixed(2) + '  vs burst ' + snd.burstRatio.toFixed(2));

  check('one half: the charged blow is still the burst', m.singleIsBurst);
  check('both halves: the charged blow is the SWIRL', m.bothIsSwirl,
        'swirlT ' + m.swirlT + 's');
  check('...and she leaves the floor to do it', m.rose);
  check('it lands four passes, not one', m.passes === 4, m.passes + ' passes, ' + m.dealt + ' damage');
  check('it costs her real recovery afterwards', m.recovery >= 0.30, m.recovery + 's');
  check('it is a RING — it hits what is behind her too', m.hitBehind > 0, m.hitBehind + ' damage behind');
  check('the twin window opens after it', m.twinT >= 5, m.twinT + 's');
  check('...and the twin swing is WIDER', m.twinW > m.plainW, m.plainW + ' -> ' + m.twinW + ' px');
  check('...but reaches no further', m.sameReach, 'anchor unchanged');
  // the widening is SYMMETRIC about that anchor: whatever the far edge gained,
  // the near edge gained the same going the other way. Without this, "the
  // anchor did not move" would still pass a box that only grew forwards.
  check('...and it grows both ways, not forwards', m.twinSym, 'behind:ahead ' + m.twinSpread);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she dances, it hurts, and she holds two blades for a while afterwards');
})().catch(e => { console.error(e); process.exit(1); });
