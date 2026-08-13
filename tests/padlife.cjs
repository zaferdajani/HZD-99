// A CONTROLLER THAT IS GONE MUST NOT KEEP THE GAME IN CONTROLLER MODE.
//
// The failure this exists for: unplug a pad and plug it back in, and the game
// stayed in pad mode against a dead object the browser had left in the rack —
// touch controls hidden (they hide BECAUSE a pad is attached), no pad input
// arriving, and the Mind Nodes reading pad-only codes that could never fire.
// Three symptoms, one cause, and no way out of any of them from inside the
// game. Reading the code did not find it; the acceptance test looked reasonable
// ("a pad that reports buttons is a pad") and was wrong about corpses.
//
// navigator.getGamepads is stubbed, so this drives the real pollGamepad through
// the real states: live pad -> yanked -> corpse left in the rack -> reconnected
// at a different index.
const { chromium } = require('playwright');

const PAD = (over) => Object.assign({
  index: 0, id: 'Test Pad (STANDARD GAMEPAD)', connected: true, timestamp: 1000,
  axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
}, over || {});

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    // the rack is ours now; the poll reads whatever the last set_rack put here
    window.__rack = [];
    navigator.getGamepads = () => window.__rack;
  });

  const step = (rack, polls) => page.evaluate(async ({ rack, polls }) => {
    window.__rack = rack;
    for (let i = 0; i < (polls || 3); i++) {
      pollGamepad();
      await new Promise(r => requestAnimationFrame(r));
    }
    return {
      padOn: !!PAD.on,
      touchShown: !(typeof tc !== 'undefined' && tc && tc.style.display === 'none'),
      // what a Mind Node would actually read for a tap on the left node
      trialSeesTouch: (() => {
        keysP.VL = 1; keys.VL = 1;
        const seen = typeof triDir === 'function' ? triDir(4) === 0 : null;
        keysP.VL = 0; keys.VL = 0;
        return seen;
      })(),
    };
  }, { rack, polls });

  const fails = [];
  const check = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log((ok ? '  ok   ' : '  FAIL ') + name + '  ' + JSON.stringify(got));
    if (!ok) fails.push(name + ' expected ' + JSON.stringify(want));
  };

  console.log('── padlife  — a yanked controller must not lock the game in pad mode');

  // 1. a live pad: pad mode on, touch gutters gone. Working as intended.
  check('live pad -> pad mode', (await step([PAD({ timestamp: 1100 })])).padOn, true);

  // 2. yanked. Chromium empties the slot -> back to touch.
  let s = await step([null]);
  check('yanked -> pad mode off', s.padOn, false);
  check('yanked -> touch controls back', s.touchShown, true);

  // 3. THE BUG. The slot is not emptied: a disconnected object is left in it,
  //    with a full button array and a frozen timestamp. It must be ignored.
  s = await step([PAD({ connected: false, timestamp: 1100 })]);
  check('corpse in rack -> pad mode off', s.padOn, false);
  check('corpse in rack -> touch controls back', s.touchShown, true);
  check('corpse in rack -> trials read touch', s.trialSeesTouch, true);

  // 4. a pad whose driver flapped `connected` while it is plainly being used
  //    still counts — that is why the corpse test could not simply be `connected`
  const held = PAD({ connected: false, timestamp: 1200 });
  held.buttons = held.buttons.map((b, i) => (i === 0 ? { pressed: true, value: 1 } : b));
  check('flapped flag but a button down -> still a pad', (await step([held])).padOn, true);

  // 5. reconnected at a different index, live again
  s = await step([null, PAD({ index: 1, timestamp: 2000 })]);
  check('reconnected on another slot -> pad mode', s.padOn, true);

  // 6. and yanked again from THAT slot, to prove step 3 was not a one-off
  s = await step([null, PAD({ index: 1, connected: false, timestamp: 2000 })]);
  check('corpse on another slot -> pad mode off', s.padOn, false);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — a dead pad releases the game, a live one keeps it');
})().catch(e => { console.error(e); process.exit(1); });
