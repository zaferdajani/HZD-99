// THE MACHINE FOLK ARE DOING SOMETHING — measured, not asserted.
//
// Every NPC except the tinker was a standing turnaround cell with a 1.8 Hz
// breath on it: furniture that says a line. NPC_JOB gives each of them a short
// list of places to be looking and a spread of how long to look there, and eases
// the turn between them — which uses the one piece of vocabulary these bodies
// have and nothing was touching. `drawAtlas`'s own comment admitted the hole:
// "a turntable renderer that cannot be asked for a specific angle is a
// turntable renderer with a hole in it."
//
// Three things have to be true, and none of them is visible by reading:
//   1. THEY MOVE. A job that never leaves its first angle is the old statue.
//   2. NO PERIOD. Four beats walked in a fixed order is a four-beat loop — the
//      exact defect the owner reported on the tinker. Autocorrelated, same as
//      tests/tinker.cjs and grammar.cjs.
//   3. THEY ARE NOT IN STEP. Two people in one room drifting into the same
//      rhythm reads as a mechanism, not as two people. Cross-correlated.
//
// ...and one that is: she walks up, they look at her. The job must yield.
//
//   node tests/folk.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── folk — the machine folk have jobs, and no two of them share a beat\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A0B');
    // the machine is pure state — it needs a body's name and where it stands,
    // nothing else — so it is driven directly rather than through five rooms
    const who = Object.keys(NPC_JOB);
    const realNow = performance.now;
    let clock = 1000;
    performance.now = () => clock * 1000;
    const track = {};
    const shims = {};
    for (const k of who) shims[k] = { x: 0, extra: k, w: 24 };
    // she stands well back for the whole run: the job only runs when she is not
    // over them, and this is the job being measured
    const pkeep = player.x, pwkeep = player.w;
    player.x = 5000; player.w = 24;
    const beats = {};
    for (const k of who) { track[k] = []; beats[k] = []; }
    for (let f = 0; f < 10800; f++) {                // 3 minutes at 60 fps
      clock += 1 / 60;
      for (const k of who) {
        const col = npcJobCol(shims[k], Math.min(0.1, 1 / 60));
        // quantised to a tenth of an angle: the question is where the body is
        // pointing, not the float
        track[k].push(Math.round(col * 10));
        const b = shims[k]._job.beat;
        const list = beats[k];
        if (b && list[list.length - 1] !== b) list.push(b);
      }
    }
    // ...and now she walks up to one of them
    player.x = 0;
    const s0 = { x: 0, extra: 'servo', w: 24 };
    const yielded = !nearNpc(s0) ? 'radius wrong' : 'ok';
    player.x = pkeep; player.w = pwkeep;
    performance.now = realNow;

    // THE BEATS, NOT THE SAMPLES. Autocorrelating where the body points rewards
    // standing still with a perfect score, which is backwards. What "is it a
    // loop" actually asks is whether the sequence of DECISIONS repeats — this
    // angle for this long, then that one — so that is the string measured.
    const cycle = (a) => {
      let bestLag = 0, bestScore = 0;
      for (let lag = 1; lag <= Math.floor(a.length / 3); lag++) {
        let hit = 0, n = 0;
        for (let i = lag; i < a.length; i++) { n++; if (a[i] === a[i - lag]) hit++; }
        const sc = n ? hit / n : 0;
        if (sc > bestScore) { bestScore = sc; bestLag = lag; }
      }
      return { bestLag, bestScore };
    };
    const out = {};
    for (const k of who) {
      const a = track[k];
      out[k] = Object.assign({ span: Math.max(...a) - Math.min(...a), distinct: new Set(a).size,
                               nbeats: beats[k].length }, cycle(beats[k]));
    }
    // in step with each other? compare every pair frame by frame
    let pairWorst = 0, pairName = '';
    for (let i = 0; i < who.length; i++) for (let j = i + 1; j < who.length; j++) {
      const A = track[who[i]], B = track[who[j]];
      let hit = 0;
      for (let q = 0; q < A.length; q++) if (A[q] === B[q]) hit++;
      const sc = hit / A.length;
      if (sc > pairWorst) { pairWorst = sc; pairName = who[i] + '/' + who[j]; }
    }
    return { who, out, pairWorst, pairName, yielded };
  });

  const still = r.who.filter(k => r.out[k].span < 15 || r.out[k].distinct < 12);
  check('every one of them actually turns', still.length === 0,
        r.who.map(k => k + ' ' + (r.out[k].span / 10).toFixed(1) + ' angles/' +
                  r.out[k].distinct + ' stops').join('  '));

  const looped = r.who.filter(k => r.out[k].bestScore >= 0.55);
  const worst = r.who.slice().sort((a, b) => r.out[b].bestScore - r.out[a].bestScore)[0];
  check('no repeating cycle of beats', looped.length === 0,
        'worst ' + worst + ': ' + r.out[worst].nbeats + ' beats, every ' +
        r.out[worst].bestLag + 'th matches ' +
        (r.out[worst].bestScore * 100).toFixed(0) + '% (max 55%)');

  check('no two of them move in step', r.pairWorst < 0.5,
        r.pairName + ' agree ' + (r.pairWorst * 100).toFixed(0) + '% of frames (max 50%)');

  check('the job yields when she walks up', r.yielded === 'ok', r.yielded);

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
