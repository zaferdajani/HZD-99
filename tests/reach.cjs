// SHE HITS WHAT SHE IS STANDING NEXT TO, AND SHE TURNS TO IT.
//
// The owner, 2026-08-24, on the first fight in the game: "facing my first
// enemy was not accurate and my claw didn't appear from a safe distance from
// the enemy but from behind it."
//
// Two defects, and the second one was worse than it sounded.
//
//   THE FACING was the HELD direction and nothing else. The commonest way to
//     meet the first wolf is to run at it, let go, and swing — and that kept
//     whatever facing the run left behind, so a wolf that had run past her got
//     clawed at empty air while it bit her back.
//   THE HITBOX was centred R px in FRONT of her centre. For a claw R is 44 and
//     half is 30, so the box covered 14 to 74 px out and anything that had
//     closed inside 14 px was BEHIND the claws and could not be hit at all.
//     A wolf that runs into her is the commonest fight in the game, and it was
//     the one the box could not answer.
//
// So: park a foe at a spread of distances either side, swing with no direction
// held, and require that she turns to it and that it takes damage. The near
// distances are the point — 0 is dead centre on top of her.
//
//   node tests/reach.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── reach — she hits what she is standing next to, and she turns to it\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv); loadRoom('A1');
    G.dialog = null; G.trans = null; G.state = 'PLAY';
    const rest = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    await rest(30);

    // One swing at a foe parked `dx` px from her centre, with NOTHING held.
    // The foe is frozen where it is put: this is a question about the hitbox
    // and the facing, not about whether a wolf can be caught.
    const trial = async (dx, startFace) => {
      G.enemies.length = 0; G.boss = null; G.projs.length = 0;
      player.x = 20 * TILE; player.y = (ROOMS.A1.h - 4) * TILE;
      player.vx = 0; player.vy = 0; player.face = startFace;
      player.combo = 0; player.comboT = 0; player.atkCD = 0; player.atkBuf = 0;
      player.swing = null; player.swingVis = null;
      await rest(6);
      const e = new Enemy('crawler', 0, 0);
      e.x = player.x + player.w / 2 + dx - e.w / 2;
      e.y = player.y + player.h - e.h;
      e.hp = 999; e.iT = 0;
      G.enemies.push(e);
      for (const k in keys) keys[k] = 0;
      for (const k in keysP) keysP[k] = 0;
      // SHE CANNOT BE HURT DURING THE MEASUREMENT. A foe parked on top of her
      // deals contact damage, and being hurt knocks her back and can flip her
      // facing — which is a real thing that happens in a fight and has nothing
      // to do with the question being asked here. Isolating it is what makes
      // the reading about the hitbox.
      player.iT = 999;
      const hp0 = e.hp;
      // one press, no direction, and the foe is pinned so the test is about her
      keysP.KeyX = 1; keys.KeyX = 1;
      const faceAt = [];
      for (let f = 0; f < 26; f++) {
        player.iT = 999;
        e.x = player.x + player.w / 2 + dx - e.w / 2;
        e.y = player.y + player.h - e.h;
        e.vx = 0; e.vy = 0;
        await new Promise(k => requestAnimationFrame(k));
        if (f === 0) { keysP.KeyX = 0; keys.KeyX = 0; }
        faceAt.push(player.face);
      }
      return { dx, hit: e.hp < hp0, face: faceAt[3] || player.face, startFace };
    };

    const out = { toRight: [], toLeft: [] };
    for (const dx of [0, 8, 16, 24, 36, 52, 68]) out.toRight.push(await trial(dx, -1));
    for (const dx of [-8, -24, -52]) out.toLeft.push(await trial(dx, 1));
    return out;
  });

  const missed = r.toRight.filter(t => !t.hit).map(t => t.dx + 'px');
  check('a foe at any distance inside her reach takes the hit',
    missed.length === 0,
    missed.length ? 'missed at ' + missed.join(', ') : 'hit at ' +
      r.toRight.map(t => t.dx).join(', ') + ' px');
  // 0 px is the one that decides it: something standing inside her used to sit
  // in a dead ring the claws could not reach.
  const zero = r.toRight.find(t => t.dx === 0);
  check('...including one standing on top of her', !!(zero && zero.hit),
    zero ? (zero.hit ? 'hit at 0 px' : 'MISSED at 0 px') : 'not measured');
  // dx exactly 0 is excluded on purpose: a foe dead centre on her has no side,
  // so there is no turn to make and keeping her facing is the honest answer.
  const wrongFace = r.toRight.filter(t => t.dx !== 0 && t.face !== 1).map(t => t.dx + 'px')
    .concat(r.toLeft.filter(t => t.face !== -1).map(t => t.dx + 'px'));
  check('she turns to the foe when no direction is held', wrongFace.length === 0,
    wrongFace.length ? 'still facing away at ' + wrongFace.join(', ')
                     : 'turned at all ' + (r.toRight.length + r.toLeft.length) + ' distances, both sides');
  const leftMissed = r.toLeft.filter(t => !t.hit).map(t => t.dx + 'px');
  check('...and the swing lands on the side she turned to', leftMissed.length === 0,
    leftMissed.length ? 'missed at ' + leftMissed.join(', ') : 'hit on the left at ' +
      r.toLeft.map(t => t.dx).join(', ') + ' px');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
