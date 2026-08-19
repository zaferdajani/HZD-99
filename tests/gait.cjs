// DOES SHE ACTUALLY RUN, OR DOES SHE SKIP?
//
// The owner's report was "the cat movement is horrible", and reading the
// animation code did not explain it — the plates are fine and the state machine
// is sensible. Driving her and MEASURING did: running across level ground she
// was airborne 8 frames in 24, her feet juddering 20 px, vy spiking to 153.
//
// She was not running. She was bouncing. The surface heightfield caught her
// going UP a mound and had no answer going DOWN one, so every descending column
// left her unsupported for a frame; and the pose read `on` directly, so each of
// those frames swapped her to an airborne plate — which is drawn CENTRED rather
// than from the foot, so she popped and changed size as well.
//
// Both halves are cheap to measure and neither is visible in a still frame,
// which is exactly why this file exists.
//
//   node tests/gait.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── gait — she runs on the ground, and the drawing agrees\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    sv.roomId = 'A1';
    G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r2 => setTimeout(r2, 1200));
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    // the room's own furniture is not what is being measured
    Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
    G.toasts = [];
    const frame = () => new Promise(r2 => requestAnimationFrame(r2));
    keys.ArrowRight = 1;
    for (let i = 0; i < 40; i++) await frame();      // up to full speed first
    // RUNNING OFF A LEDGE IS NOT THE FAULT. She is only expected to stay on the
    // ground where there IS ground: a step down of a tile or more is level
    // design and she is supposed to fall off it. So every sample records
    // whether solid tile sits directly under her feet, and the frames where it
    // does not are not counted against her.
    const solidUnder = () => {
      const tx = Math.floor((player.x + player.w / 2) / TILE);
      const ty = Math.floor((player.y + player.h + 2) / TILE);
      for (let k = 0; k <= 1; k++) {
        const ch = tileAt(tx, ty + k);
        if (ch === '#' || ch === 'B' || ch === '=') return true;
      }
      return false;
    };
    const air = [], feet = [], states = [], vys = [], over = [];
    for (let i = 0; i < 48; i++) {
      await frame();
      // she is not the subject of the room's hazards here
      player.iT = Math.max(player.iT, 1); player.cores = 5;
      G.enemies = [];
      air.push(player.on ? 0 : 1);
      over.push(solidUnder() ? 1 : 0);
      feet.push(player.y + player.h);
      vys.push(Math.abs(player.vy));
      states.push(player.heroState(Math.abs(player.vx) > 140));
    }
    keys.ArrowRight = 0;
    return { air, feet, states, vys, over, vx: Math.round(player.vx) };
  });

  // only the frames with ground under her
  const onFloor = r.air.map((a, i) => (r.over[i] ? a : 0));
  const floorFrames = r.over.reduce((a, b) => a + b, 0);
  const airFrames = onFloor.reduce((a, b) => a + b, 0);
  // AIRBORNE ON LEVEL GROUND. A1's floor rolls — that is the point of the
  // terrain work — but rolling ground is ground. A run that leaves it is a skip.
  check('she stays on the ground while running across it',
    airFrames <= floorFrames * 0.08,
    airFrames + ' airborne of ' + floorFrames + ' frames over solid floor (vx ' + r.vx + ')');

  // THE POSE DOES NOT FLICKER. An airborne plate appearing mid-stride is the
  // visible half of the same fault, and it survives even a single lost frame
  // because those cells are drawn from a different anchor.
  const airPose = r.states.filter((s, i) => r.over[i] &&
    (s === 'fall' || s === 'apex' || s === 'rise')).length;
  check('the drawing never calls a stride a fall',
    airPose === 0,
    airPose + ' airborne pose(s) mid-run: ' + [...new Set(r.states)].join(' '));

  // AND SHE DOES NOT JUDDER. Following the ground is right; jumping up and down
  // on the spot is not. Measured as the biggest step between adjacent frames.
  let worst = 0;
  for (let i = 1; i < r.feet.length; i++)
    if (r.over[i] && r.over[i - 1]) worst = Math.max(worst, Math.abs(r.feet[i] - r.feet[i - 1]));
  // The ceiling here is set by the MECHANISM, not by taste: the ground snap
  // reaches 14 px below her feet and the uphill catch can lift her onto a mound,
  // so ~16 px is the largest step the design can produce in a frame and 18 is
  // that with room. It is not comfortable — a 16 px jump at 30 fps is visible,
  // and the honest next move is to smooth the DRAWN height toward the ground
  // rather than teleport it, which is a change to how she is drawn and wants
  // its own measurement. What this line guards is the regression: a number
  // above 18 means something is throwing her, not that the floor rolls.
  check('her feet follow the ground rather than bouncing on it',
    worst <= 18, 'worst single-frame step ' + worst.toFixed(1) + ' px');

  // AND IT IS THE COUNT OF EPISODES THAT TELLS A BOUNCE FROM A DROP, not the
  // speed reached. A peak |vy| means nothing on its own: falling off one real
  // step reaches the same number as ten little hops, and the first is level
  // design. What a bounce looks like is MANY SEPARATE short departures from
  // ground that is still there — before the ground snap landed, running across
  // A1 produced one every two or three frames.
  let episodes = 0;
  for (let i = 0; i < onFloor.length; i++) if (onFloor[i] && !onFloor[i - 1]) episodes++;
  check('she leaves the ground once and deliberately, not over and over',
    episodes <= 2, episodes + ' separate departure(s) from solid floor');

  check('no page errors while running', !errs.length, errs[0] || '');

  console.log('');
  if (fails.length) { console.log('FAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('OK — she runs on the ground, and the drawing agrees');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
