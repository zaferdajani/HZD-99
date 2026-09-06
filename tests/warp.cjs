// THE WARP IS A DOOR FOR ONE PERSON, AND IT HAS TO STAY THAT WAY.
//
// `?room=<id>` drops the owner into any room in the game with everything
// unlocked, so he can look at a new character without playing an hour down to
// it (js/warp.js). Every property that makes that safe is invisible from the
// source and would rot silently:
//
//   with no query string the file does NOTHING — the base game must not know;
//   a browser without the Forge key does not warp, and SAYS so rather than
//     booting normally and leaving him wondering;
//   a misspelt room id does not warp, and says which id it could not find;
//   an unlocked browser lands IN the room, on the floor, able to move;
//   and the warp writes to its own save slot, so an endgame poke-around can
//     never come back as his real run.
//
// The last one is the one that would hurt. The others are annoyances.
//
//   node tests/warp.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

// the Forge's own passphrase hash (js/editor.js). The word is the owner's and
// is not in this repo; the STAMP it leaves in localStorage is what the lock
// actually reads, so that is what a test can legitimately plant.
const HASH = 'b094c73df45f79dd62879ff8c7a4816be4c785a842e784caa37c8fa3dfc875c4';

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── warp — one person\'s door into any room, and it stays one person\'s\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });

  // a fresh context per case: localStorage is the lock, so it cannot be shared
  const run = async (query, { unlock } = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    const warns = [];
    page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });
    if (unlock) {
      await page.goto('http://127.0.0.1:8220/index.html');
      await page.evaluate((h) => localStorage.setItem('cb_forge_ok', h), HASH);
    }
    await page.goto('http://127.0.0.1:8220/index.html' + query);
    await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
    // POLL, DO NOT SLEEP. The warp waits on crypto.subtle and on a frame, so
    // something has to wait for it — but a toast lives three seconds and a
    // fixed sleep long enough for the slow half outlives the thing it came to
    // read. (It did: the banner passed while the warp was landing inside the
    // evolution card, because a dialog holds the clock, and failed the moment
    // the card stopped firing and the game actually ran.) So the toasts are
    // accumulated across the wait instead of sampled at the end of it.
    const said = new Set();
    for (let i = 0; i < 60; i++) {
      const now = await page.evaluate(() => ({ room: G.roomId, state: G.state, toasts: (G.toasts || []).map((t) => t.text) }));
      for (const t of now.toasts) said.add(t);
      if (now.state === 'PLAY' || said.size) break;
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(400);
    const out = await page.evaluate(() => ({
      room: G.roomId,
      state: G.state,
      live: (G.toasts || []).map((t) => t.text),
      // the slot this session would write to, against the one an ordinary
      // session writes to — read through the live function, not guessed
      key: saveKeyFor('robo'),
      onFloor: !!(player && player.y > 0 && !solidAt(Math.floor((player.x + player.w / 2) / TILE),
                                                     Math.floor((player.y + player.h / 2) / TILE))),
      npc: (G.statics || []).filter((s) => s.type === 'npc').map((s) => s.extra),
      abil: player ? Object.keys(G.save.abil || {}).length : 0,
    }));
    await ctx.close();
    for (const t of out.live) said.add(t);
    return { ...out, toasts: [...said], errs, warns };
  };

  // ---- 1. WITH NO QUERY STRING THE FILE DOES NOTHING ----------------------
  const plain = await run('');
  check('no query string: the game boots to its own menu', plain.state === 'MENU', plain.state);
  check('no query string: the save slot is the ordinary one',
        plain.key === 'clawbyte_save_robo' || !/_warp$/.test(plain.key), plain.key);
  check('no query string: nothing is said', plain.toasts.length === 0, plain.toasts.join(' | '));

  // ---- 2. LOCKED OUT, AND TOLD SO -----------------------------------------
  const shut = await run('?room=V1B');
  check('a browser with no Forge key does not warp', shut.room !== 'V1B', shut.room || '(menu)');
  check('...and it says why, out loud',
        shut.toasts.concat(shut.warns).some((s) => /Forge key/.test(s)),
        shut.toasts.concat(shut.warns).join(' | ') || 'silence');
  check('...and it leaves his real save slot alone', !/_warp$/.test(shut.key), shut.key);

  // ---- 3. A MISSPELT ROOM IS NAMED, NOT SWALLOWED -------------------------
  const typo = await run('?room=V1Bx', { unlock: 1 });
  check('an id that is not a room does not warp', typo.state === 'MENU', typo.state);
  check('...and the id it could not find is in the message',
        typo.toasts.concat(typo.warns).some((s) => /V1Bx/.test(s)),
        typo.toasts.concat(typo.warns).join(' | ') || 'silence');

  // ---- 4. UNLOCKED: IT LANDS, AND IT LANDS SOMEWHERE SHE CAN STAND --------
  const warped = await run('?room=V1B', { unlock: 1 });
  check('an unlocked browser lands in the room', warped.room === 'V1B', warped.room);
  check('...playing, not at a menu or in a film', warped.state === 'PLAY', warped.state);
  check('...standing in open air over the floor, not inside the rock', warped.onFloor);
  check('...with every power, so the room can be walked', warped.abil >= 5, warped.abil + ' abilities');
  check('...and the Cutter is standing there', warped.npc.includes('kerf'), warped.npc.join(',') || 'nobody');
  check('...and it says where it put him', warped.toasts.some((s) => /WARP/.test(s)), warped.toasts.join(' | '));

  // ---- 5. THE ONE THAT WOULD HURT ----------------------------------------
  check('a warp session writes to its OWN slot, never his run', /_warp$/.test(warped.key), warped.key);

  // ---- 6. and it reaches the far room of the game too ---------------------
  const deep = await run('?room=X1', { unlock: 1 });
  check('any room in the game is reachable (the Cache proper)', deep.room === 'X1', deep.room);

  const allErrs = [].concat(plain.errs, shut.errs, typo.errs, warped.errs, deep.errs);
  check('no page errors in any of it', allErrs.length === 0, allErrs.slice(0, 2).join(' | '));

  await browser.close();
  if (fails.length) { console.log('\n' + fails.length + ' FAILED:\n' + fails.map((f) => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — the door opens for the key, refuses everyone else out loud, and never touches his save');
})();
