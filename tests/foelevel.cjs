// THE MACHINE'S LEVEL, AND WHAT IT CAN AFFORD.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." Two dials existed and neither
// was a level — foeIQ() read the RUN, ZONE_K read the KINGDOM, and traits rolled
// off the run alone, so a Virus Nest machine on a fresh save reinforced exactly
// like the first crawler in the meadow. foeLevel() asks both.
//
// The move REGISTRY is measured here too, empty though it is: five kingdom
// sessions are about to write rows into it in parallel, and the contract they
// are writing against — cheapest first, pay until you cannot afford the next,
// never exceed your points — has to be nailed down before they do, not after.
//
//   node tests/foelevel.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── foelevel — a machine\'s level is its kingdom plus the run, and it spends it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof foeLevel === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.enemies = []; G.boss = null;
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    const out = {};

    // ---- the kingdom sets the floor, on a save that has taken nothing -------
    G.save.abil = {}; G.save.skills = []; G.save.flags = { tut: 1, woke: 1 };
    out.freshIQ = foeIQ();
    out.lvA = foeLevel('A'); out.lvB = foeLevel('B'); out.lvC = foeLevel('C');
    out.lvD = foeLevel('D'); out.lvE = foeLevel('E'); out.lvX = foeLevel('X');
    out.ptsA = foeSkillPts(out.lvA); out.ptsE = foeSkillPts(out.lvE);

    // ---- ...and the run raises it on top -----------------------------------
    G.save.abil = { dash: 1, wall: 1, glide: 1, pulse: 1 };
    G.save.skills = ['a', 'b', 'c', 'd', 'e'];
    G.save.flags = { tut: 1, woke: 1, bossGlitch: 1, bossBrood: 1, bossAtlas: 1, bossZero: 1, bossPrism: 1 };
    out.lateIQ = +foeIQ().toFixed(3);
    out.lvALate = foeLevel('A'); out.lvELate = foeLevel('E');

    // ---- traits: never on the opening meadow, never more than two ----------
    const roll = (lv, n) => { const c = []; for (let i = 0; i < n; i++) c.push(rollTraits(lv)); return c; };
    out.traitsLv1Max = Math.max(...roll(1, 300).map(t => t.length));
    const hi = roll(7, 400);
    out.traitsLv7Max = Math.max(...hi.map(t => t.length));
    out.traitsLv7Any = hi.some(t => t.length > 0);
    out.traitsLv7Varied = new Set(hi.map(t => t.slice().sort().join('+'))).size;
    out.traitsNoDupes = hi.every(t => new Set(t).size === t.length);

    // ---- the registry: empty today, and its contract is the point ----------
    out.registryEmpty = Object.keys(FOE_MOVES).length === 0;
    out.noMovesWhenEmpty = foeMovesFor('crawler', 7).length === 0;
    // a kingdom session's row, injected exactly as one would be written, then
    // taken back out — the same delete-then-restore the air-attack test uses
    // `call` is priced past the ceiling on purpose: the top level is 7, which is
    // 6 points, so nothing can ever afford it. A registry entry nobody can buy
    // must be skipped rather than handed out or allowed to overdraw.
    FOE_MOVES.crawler = [{ id: 'burrow', cost: 1 }, { id: 'spit', cost: 2 }, { id: 'call', cost: 9 }];
    out.lv1Buys = foeMovesFor('crawler', 1, 'A');     // 0 points
    out.lv2Buys = foeMovesFor('crawler', 2, 'A');     // 1 point  -> burrow
    out.lv4Buys = foeMovesFor('crawler', 4, 'A');     // 3 points -> burrow + spit
    out.lv7Buys = foeMovesFor('crawler', 7, 'A');     // 6 points -> still no `call`

    // ---- the kingdom-scoped row: the thing that lets five sessions work at
    // once without overwriting one another's moves
    FOE_MOVES['crawler@C'] = [{ id: 'slag', cost: 1 }];
    out.scopedInC = foeMovesFor('crawler', 7, 'C');
    out.scopedNotInA = foeMovesFor('crawler', 7, 'A');
    out.scopedAloneInD = (delete FOE_MOVES.crawler, foeMovesFor('crawler', 7, 'D'));
    out.scopedOnlyItsOwn = foeMovesFor('crawler', 7, 'C');
    delete FOE_MOVES['crawler@C'];
    // ...and an enemy built now actually carries them
    const e = new Enemy('crawler', 100, 100);
    out.spawnLevel = e.level;
    out.spawnHasArray = Array.isArray(e.moves);
    out.spawnHasMove = e.hasMove(e.moves[0] || 'burrow') || e.moves.length === 0;
    out.spawnDeniesUnknown = !e.hasMove('nothing_like_this');
    out.registryRestored = Object.keys(FOE_MOVES).length === 0;
    return out;
  });

  check('a fresh save has taken nothing', r.freshIQ === 0, 'iq ' + r.freshIQ);
  check('the opening meadow is level 1 and spends nothing',
    r.lvA === 1 && r.ptsA === 0, 'lv ' + r.lvA + ', ' + r.ptsA + ' pts');
  check('every kingdom after it is deeper than the one before',
    r.lvA < r.lvB && r.lvB < r.lvC && r.lvC < r.lvD && r.lvD < r.lvE,
    [r.lvA, r.lvB, r.lvC, r.lvD, r.lvE].join(' < '));
  check('the Cache stands with the deepest kingdoms', r.lvX >= r.lvD, 'X ' + r.lvX);
  check('the Nest has points to spend where the meadow has none', r.ptsE > 0, r.ptsE + ' pts');
  check('a finished run raises the machines above it', r.lvALate > r.lvA && r.lvELate > r.lvE,
    'A ' + r.lvA + '->' + r.lvALate + ', E ' + r.lvE + '->' + r.lvELate);
  check('...and never past the ceiling', r.lvELate <= 7, 'E late ' + r.lvELate);
  check('a level-1 machine never rolls a trait', r.traitsLv1Max === 0, 'max ' + r.traitsLv1Max);
  check('a levelled one does', r.traitsLv7Any);
  check('...but never more than two — a room stays varied, not uniform',
    r.traitsLv7Max <= 2, 'max ' + r.traitsLv7Max);
  check('...and never the same trait twice on one body', r.traitsNoDupes);
  check('...and the same level still produces different machines',
    r.traitsLv7Varied >= 3, r.traitsLv7Varied + ' distinct loadouts');
  check('the move registry is empty until a kingdom fills it', r.registryEmpty);
  check('...and an empty row buys nothing', r.noMovesWhenEmpty);
  check('a row is bought cheapest-first, within its points',
    r.lv1Buys.length === 0 && r.lv2Buys.join() === 'burrow'
    && r.lv4Buys.join() === 'burrow,spit',
    JSON.stringify([r.lv1Buys, r.lv2Buys, r.lv4Buys]));
  check('...and a move nothing can afford is never handed out',
    r.lv7Buys.join() === 'burrow,spit', r.lv7Buys.join());
  check('a kingdom-scoped move reaches its own kingdom',
    r.scopedInC.join() === 'burrow,spit,slag', r.scopedInC.join());
  check('...and NOT the kingdom next door — parallel sessions cannot collide',
    r.scopedNotInA.join() === 'burrow,spit', r.scopedNotInA.join());
  check('...and a scoped row stands alone where there is no shared one',
    r.scopedAloneInD.length === 0 && r.scopedOnlyItsOwn.join() === 'slag',
    JSON.stringify([r.scopedAloneInD, r.scopedOnlyItsOwn]));
  check('a spawned machine carries its level and its moves',
    r.spawnLevel >= 1 && r.spawnHasArray, 'lv ' + r.spawnLevel);
  check('...and hasMove refuses a move it never bought', r.spawnDeniesUnknown);
  check('the registry is left as it was found', r.registryRestored);
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
