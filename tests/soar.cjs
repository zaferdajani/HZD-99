// VOLT SOAR (js/soar.js, handoff Part 2 B2) — the late vertical launch,
// against the real build: keydown events and the game's own clock.
//
// It promises five things: it waits for its late key (the EMP module), it
// rises about six tiles in open air, it stops at the first ceiling, it cuts
// what it passes for a fixed blow, once each, and off the ground the same
// input is still the claw.
//
//   node tests/soar.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── soar — UP + claw on the ground launches her six tiles, to the first ceiling, cutting what she passes\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof soarStep === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const frames = async n => { for (let i = 0; i < n; i++) await new Promise(k => requestAnimationFrame(k)); };
    const hold = code => dispatchEvent(new KeyboardEvent('keydown', { code }));
    const release = code => dispatchEvent(new KeyboardEvent('keyup', { code }));
    const out = {};
    const boot = async (abil) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      Object.assign(sv.abil, abil);
      startGame(sv); loadRoom('A1');
      G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null; G.bossEntry = null; G.meet = null; G.gateWalk = null;
      await frames(40);
    };
    // a floor cell with `clear` free tiles above her and then (if `roof`)
    // solid rock: the open column and the low-ceiling column
    const colClear = (tx, ty, n) => { for (let k = 1; k <= n; k++) if (solidAt(tx, ty - k) || solidAt(tx + 1, ty - k)) return false; return true; };
    const spotIn = (want) => {
      for (let ty = 3; ty < G.roomDef.h - 1; ty++) for (let tx = 2; tx < G.roomDef.w - 3; tx++) {
        if (!solidAt(tx, ty) || !solidAt(tx + 1, ty) || tileAt(tx, ty - 1) === '^') continue;
        if (want === 'open' && colClear(tx, ty, 10)) return { tx, ty };
        // (the low ceiling is built by the harness: see section 3)
      }
      return null;
    };
    const find = (want) => {
      const ids = ['A1'].concat(Object.keys(ROOMS).filter(k => k !== 'A1'));
      for (const id of ids) {
        try { loadRoom(id); } catch (e) { continue; }
        G.enemies = []; G.boss = null; G.bossEntry = null;
        const s = spotIn(want);
        if (s) { s.room = id; return s; }
      }
      return null;
    };
    const place = async (s) => {
      if (G.roomId !== s.room) loadRoom(s.room);
      G.enemies = []; G.boss = null; G.bossEntry = null; G.meet = null; G.gateWalk = null; G.wake = null;
      player.x = s.tx * TILE + 4; player.y = s.ty * TILE - player.h - 0.01; player.vx = player.vy = 0;
      player.grap = null; player.soar = null; G.soarLast = null; player.grapCD = 0; player.grapAir = 0; player.iT = 0;
      await frames(8);
    };
    // UP held, the claw pressed: the game's own input path
    const launch = async (n = 40) => {
      const y0 = player.y; let top = y0, soared = false, clawUp = false;
      hold('ArrowUp'); await frames(1); hold('KeyU'); await frames(1); release('KeyU');
      for (let i = 0; i < n; i++) {
        await frames(1);
        if (player.soar) soared = true;
        if (player.grap && player.grap.dy < -0.5) clawUp = true;
        top = Math.min(top, player.y);
      }
      release('ArrowUp');
      // a soar that met rock on its first frame is over before a frame is sampled;
      // G.soarLast is its record either way
      return { soared: soared || !!G.soarLast, clawUp, rose: Math.round(y0 - top), last: G.soarLast || null };
    };

    // ---- 1. the claw alone: UP + claw is still the upward throw
    await boot({ dash: 1 });
    out.unlockedBare = soarUnlocked();
    out.open = find('open');
    if (!out.open) return out;
    await place(out.open);
    out.bare = await launch(12);

    // ---- 2. with the EMP module: the launch, announced once
    await boot({ dash: 1, emp: 1 });
    out.unlocked = soarUnlocked();
    await frames(2);
    out.told = !!G.save.flags.soarSeen;
    out.toast = G.toasts.some(q => q.text === t('soar_on'));
    await place(out.open); G.soarLast = null;
    out.openRun = await launch();
    await frames(20);
    out.fellAfter = player.vy >= 0 || player.on;

    // ---- 3. under a low ceiling it stops at the rock
    // a roof laid into the open column itself, two rows of rock four tiles up
    // and wider than her, so the only thing measured is the soar meeting it
    {
      const o = out.open; loadRoom(o.room);
      // on a private copy of the grid: loadRoom hands out the room's own rows,
      // and a roof written into those would outlive the reload below
      G.grid = G.grid.map(row => row.slice());
      const set = (x, y) => { const row = G.grid[y]; if (typeof row === 'string') G.grid[y] = row.slice(0, x) + '#' + row.slice(x + 1); else row[x] = '#'; };
      for (let d = -2; d <= 3; d++) { set(o.tx + d, o.ty - 4); set(o.tx + d, o.ty - 5); }
      out.roof = { room: o.room, tx: o.tx, ty: o.ty, gap: 3, built: solidAt(o.tx, o.ty - 4) && solidAt(o.tx + 1, o.ty - 5) };
      await place(out.roof); G.soarLast = null;
      out.roof.still = solidAt(o.tx, o.ty - 4); out.roof.at = [Math.round(player.x), Math.round(player.y)];
      out.roofRun = await launch();
    }

    // ---- 4. a flier in the column, three tiles up: cut once, for the fixed blow
    // (the room reloaded first: the roof laid in section 3 must not stay)
    loadRoom(out.open.room);
    await place(out.open);
    const e = new Enemy('flier', player.x + player.w / 2 - EKIND.flier.w / 2, player.y - 3 * TILE);
    e.iq = 0; e.iqT = 99; e.hp = 500; e.maxHp = 500;
    G.enemies = [e];
    const hp0 = e.hp;
    // keep it parked in the column for the instant she passes
    const ex = e.x, ey = e.y;
    const pin = setInterval(() => { e.x = ex; e.y = ey; e.vx = 0; e.vy = 0; }, 0);
    // her i-frames up, so its touch cannot knock her out of the soar (a hit
    // ends one, by design) and this measures the cut alone
    G.soarLast = null; player.iT = 5;
    out.cutRun = await launch(30);
    clearInterval(pin);
    out.cut = { hpLost: hp0 - e.hp, fixed: 48, hits: G.soarLast ? G.soarLast.hit : null };

    // ---- 5. in the air the same input is the claw
    await place(out.open);
    player.y -= 2 * TILE; player.on = false; player.vy = 0;
    out.airRun = await launch(6);
    return out;
  });

  check('a room has an open column ten tiles tall', !!r.open, JSON.stringify(r.open));
  if (r.open) {
    check('locked with the claw alone: UP + claw is still the upward throw', r.unlockedBare === false && !r.bare.soared && r.bare.clawUp, JSON.stringify(r.bare));
    check('the EMP module unlocks it, announced once', r.unlocked && r.told && r.toast, JSON.stringify({ unlocked: r.unlocked, told: r.told, toast: r.toast }));
    check('open air: she rises about six tiles (170-240 px) and the soar ends on height',
      r.openRun.soared && r.openRun.rose >= 170 && r.openRun.rose <= 240 && r.openRun.last && r.openRun.last.end === 'height', JSON.stringify(r.openRun));
    check('...then the arc rounds off and she comes back down', r.fellAfter);
    check('a roof can be laid three tiles over the column', !!(r.roof && r.roof.built), JSON.stringify(r.roof));
    if (r.roofRun) check('under rock it stops at the first ceiling, well short of six tiles',
      r.roofRun.soared && r.roofRun.last && r.roofRun.last.end === 'ceiling' && r.roofRun.rose < 3 * 32 + 8, JSON.stringify(r.roofRun));
    check('it cuts what it passes: one hit, for the fixed blow (not her scaled slash)',
      r.cut.hits === 1 && r.cut.hpLost === r.cut.fixed, JSON.stringify(r.cut) + ' ' + JSON.stringify(r.cutRun));
    check('off the ground UP + claw stays the claw', !r.airRun.soared && r.airRun.clawUp, JSON.stringify(r.airRun));
  }
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
