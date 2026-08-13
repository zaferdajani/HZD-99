// Photograph a boss in the running game.
//
// A restyled atlas can look perfect as a contact sheet and still be wrong in
// play — the rig slices it, rotates the parts, tints them and lights them, and
// none of that is visible until it happens. So the check is a screenshot of the
// real build in a real browser with the real boss on screen.
//
//   node tools/bossshot.cjs <roomId> <out.png> [frames]
const { chromium } = require('playwright');

(async () => {
  const [room, out, framesArg] = process.argv.slice(2);
  const frames = parseInt(framesArg || '150', 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate((room) => {
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1;
    // every gate open: a boss room reached the long way is a slower test, not
    // a better one, and the thing under test is the art, not the progression
    sv.skills = ['dash', 'wall', 'glide', 'pulse'];
    startGame(sv);
    loadRoom(room);
  }, room);
  // LET THE FIGHT ACTUALLY START. Every boss room opens on a scripted
  // awakening — a dialog, then the guardian unfolding — and a screenshot taken
  // before that finishes photographs a folded-up silhouette, which says nothing
  // about the art. So the dialog is clicked through (keysP is the game's own
  // one-frame press latch) and the wait continues until a boss is on its feet.
  // AND WALK UP TO IT. The guardian sleeps until the player is close; left
  // where the room drops you, the screenshot is of a folded dormant shape on a
  // ledge across the map. The player is put beside it and the camera follows.
  await page.evaluate((n) => new Promise(r => {
    let i = 0;
    const tick = () => {
      if (G.state === 'DIALOG') keysP.Enter = 1;
      if (G.boss && G.boss.st === 'dorm') { player.x = G.boss.x; player.y = G.boss.y; }
      // and DO NOT DIE. Standing inside a guardian to wake it is a good way to
      // be killed by it, and a death screen is not a photograph of the art.
      if (player) { player.cores = 5; player.iT = 9; }
      if (++i >= n) return r();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), frames);
  await page.screenshot({ path: out });
  const info = await page.evaluate(() => ({
    room: G.roomId, state: G.state,
    boss: G.boss ? { kind: G.boss.kind, st: G.boss.st, hp: G.boss.hp } : null,
  }));
  console.log(JSON.stringify(info));
  if (errs.length) console.log('PAGE ERRORS: ' + errs.slice(0, 3).join(' | '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
