const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  for (const file of ['index.html', 'odyssey.html']) {
    const p = await br.newPage({ viewport: { width: 960, height: 540 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
    await p.goto('http://127.0.0.1:8220/' + file);
    await p.waitForTimeout(7000);
    // A FILM IS SKIPPED BY HOLDING NOW, NOT BY TAPPING. This used to mash Enter
    // through the menus and the opening alike, because one press was one skipped
    // film. It is a deliberate 0.8 s hold since (js/game.js CUT_SKIP_HOLD — a
    // stray touch must not be able to spend the story), so mashing leaves the
    // game parked in CUT forever: no save is ever started, and the first
    // loadRoom of a boss room dies on G.save.flags.
    //
    // So: press to answer a menu, HOLD to leave a film.
    const step = async () => {
      if (await p.evaluate(() => !!G.cut)) {
        await p.keyboard.down('Enter');
        await p.waitForTimeout(1000);          // longer than CUT_SKIP_HOLD
        await p.keyboard.up('Enter');
        await p.waitForTimeout(260);
      } else {
        await p.keyboard.press('Enter');
        await p.waitForTimeout(320);
      }
    };
    for (let i = 0; i < 3; i++) { await step(); await p.waitForTimeout(1100); }
    await p.waitForTimeout(2500);
    for (let i = 0; i < 14; i++) await step();
    const st = await p.evaluate(() => { try { G.save.evo = 99; G.dialog = null; G.state = 'PLAY'; return G.state; } catch (e) { return 'ERR ' + e; } });
    // walk every room, letting each one draw
    const rooms = await p.evaluate(() => Object.keys(ROOMS || {}));
    let bad = [];
    for (const r of rooms) {
      const ok = await p.evaluate((rr) => {
        try { loadRoom(rr); G.dialog = null; G.state = 'PLAY'; return true; } catch (e) { return 'ERR ' + e.message; }
      }, r);
      if (ok !== true) bad.push(r + ':' + ok);
      await p.waitForTimeout(140);
    }
    // exercise the prism boss through every state, drawing each
    await p.evaluate(() => { loadRoom('X1'); G.dialog = null; G.state = 'PLAY'; });
    await p.waitForTimeout(500);
    const stress = await p.evaluate(() => {
      const b = G.boss; if (!b) return 'no boss';
      const sts = ['dorm', 'intro', 'idle', 'dashslash', 'pounce', 'rest', 'lsvanish', 'arcspin', 'beam'];
      try {
        for (const s of sts) for (let f = 0; f < 12; f++) {
          b.st = s; b.anim = f * 0.37; b.hurtT = f % 3 ? 0 : 0.2; b.dead = false; b.purified = false;
          b.draw(c);
        }
        b.dead = true; b.purified = true;
        for (let f = 0; f < 40; f++) { b.pureT = f * 0.4; b.anim = f * 0.5; b.draw(c); }
        b.purified = false;
        for (let f = 0; f < 10; f++) { b.anim = f; b.draw(c); }
        return 'ok';
      } catch (e) { return 'THREW ' + e.message; }
    });
    console.log(file, '| boot', st, '| rooms', rooms.length, '| roomErrs', bad.length ? bad : 'none',
      '| prismStress', stress, '| pageerrors', errs.length ? errs.slice(0, 3) : 'none');
    await p.close();
  }
  await br.close();
})();
