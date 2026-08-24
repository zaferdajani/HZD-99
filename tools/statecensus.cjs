// WHICH TRANSITIONS THE PLAYER ACTUALLY SEES, COUNTED.
//
// The body's motion is about to stop being a set of poses and become a set of
// TRANSITIONS between them (js/entities.js STATE_TRANS), and every transition
// costs a fired six-frame strip. There are far more possible transitions than
// are worth firing — heroState() can reach twenty-odd cells, which is four
// hundred ordered pairs — so the order they are fired in has to come from how
// often each one happens in play, not from which ones are easy to imagine.
//
// So the game is PLAYED, headlessly, by a policy that behaves roughly like a
// person: hold a direction, jump over things, turn around, dash sometimes,
// swing sometimes, and fall off the occasional ledge. The policy is seeded, so
// two runs of this tool over the same build agree.
//
// It reports transitions per minute of play, which is the number that decides
// what to fire. A landing happens hundreds of times an hour; the Song happens
// twice a game, and a strip spent on the Song is a strip not spent on landing.
//
//   node tools/statecensus.cjs [seconds=180] [seed=7]   (needs the repo on :8220)
const { chromium } = require('playwright');

(async () => {
  const SECS = parseFloat(process.argv[2] || '180');
  const SEED = parseInt(process.argv[3] || '7', 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const res = await page.evaluate(async ({ SECS, SEED }) => {
    // a seeded generator, because a census that disagrees with itself between
    // runs cannot be used to decide where credits go
    let s = SEED >>> 0;
    const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.abil = { dash: 1, key: 1, wall: 1, glide: 1 };
    G.save = sv; startGame(sv);

    // rooms from every zone, so the census is not one room's terrain
    const all = Object.keys(ROOMS || {});
    const pick = (z) => all.filter(r => r[0] === z).slice(0, 3);
    const rooms = ['A', 'B', 'C', 'D', 'E'].flatMap(pick).filter(Boolean);

    const DT = 1 / 60;
    const counts = {}, stateTime = {};
    let prev = null, steps = 0;

    const press = (k, on) => { keys[k] = on ? 1 : 0; if (on) keysP[k] = 1; };
    const clearKeys = () => { for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'KeyZ', 'KeyX', 'KeyC', 'ShiftLeft', 'Space']) { keys[k] = 0; keysP[k] = 0; } };

    const perRoom = Math.max(1, Math.round(SECS / rooms.length / DT));
    for (const r of rooms) {
      loadRoom(r);
      G.dialog = null; G.state = 'PLAY'; G.toasts = [];
      // THE CAST IS LEFT IN. Enemies are what make a player stop, turn and
      // swing, and those are the transitions being counted — clearing them
      // would census a stroll, not a game.
      let dir = rand() < 0.5 ? -1 : 1, hold = 0;
      for (let i = 0; i < perRoom; i++) {
        // --- the policy -----------------------------------------------------
        if (hold <= 0) { hold = 0.3 + rand() * 1.1; if (rand() < 0.35) dir = -dir; }
        hold -= DT;
        clearKeys();
        press(dir < 0 ? 'ArrowLeft' : 'ArrowRight', true);
        if (rand() < 0.030) press('Space', true);            // jump
        if (rand() < 0.012) press('ShiftLeft', true);        // dash
        if (rand() < 0.045) press('KeyX', true);             // swing
        if (rand() < 0.004) press('KeyC', true);             // charge/heal
        try { update(DT); } catch (e) { /* one bad step must not end the census */ }
        steps++;
        // SHE DOES NOT GET HURT, and that is a correction rather than a
        // convenience: the first run of this spent 90 of 120 seconds in the
        // hurt pose, because a policy that holds a direction walks into every
        // enemy it meets and a person does not. Damage left in, the census
        // measures a punching bag; damage out, the enemies still make her
        // stop, turn and swing, which is what is being counted.
        if (player) { player.hurtPoseT = 0; player.dead = false; }
        if (G.save) G.save.cores = Math.max(G.save.cores || 0, 3);

        // --- what the renderer would have drawn ------------------------------
        const p = player;
        if (!p) continue;
        const run = p.on && Math.abs(p.vx) > 40 && p.dashT <= 0;
        let st;
        try { st = p.heroState(run); } catch (e) { continue; }
        stateTime[st] = (stateTime[st] || 0) + DT;
        if (prev !== null && st !== prev) {
          const key = prev + '>' + st;
          counts[key] = (counts[key] || 0) + 1;
        }
        prev = st;
      }
    }
    clearKeys();
    return { counts, stateTime, steps, rooms, secs: steps * DT };
  }, { SECS, SEED });

  const perMin = (n) => (n / res.secs * 60);
  const rows = Object.entries(res.counts).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((a, r) => a + r[1], 0);

  console.log('── statecensus — what the body actually does, over '
    + res.secs.toFixed(0) + 's of play in ' + res.rooms.length + ' rooms\n');
  console.log('  ' + total + ' transitions, ' + perMin(total).toFixed(0) + ' a minute\n');
  console.log('  transition                 count   per min   share   cumulative');
  let cum = 0;
  for (const [k, n] of rows.slice(0, 30)) {
    cum += n / total * 100;
    console.log('  ' + k.padEnd(26) + String(n).padStart(5)
      + perMin(n).toFixed(1).padStart(10) + (n / total * 100).toFixed(1).padStart(8) + '%'
      + cum.toFixed(1).padStart(11) + '%');
  }
  console.log('\n  time spent per pose (seconds):');
  for (const [k, t] of Object.entries(res.stateTime).sort((a, b) => b[1] - a[1]))
    console.log('    ' + k.padEnd(14) + t.toFixed(1).padStart(7));
  if (errs.length) console.log('\n  page errors: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
})();
