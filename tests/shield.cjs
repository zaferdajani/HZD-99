// THE THREE ANSWERS THE OWNER ASKED FOR (2026-09-19): "blocking is not
// actually blocking", "the small one with the shield is practically
// invincible", "when [the dragon] roars it's nearly impossible to escape".
// Each is a rule the game now keeps, measured on the real build:
//   1. a brace she is FACING INTO stops the blow — no core; from behind it is
//      cut; the third held blow inside two seconds breaks it
//   2. the shielded machine's plate is on ONE side: front denied, behind and
//      above land whole; its winded window never drops under half a second
//   3. the Furnace Choir's hymn takes only a grounded body — jump it — and a
//      facing brace holds against it
const { chromium } = require('playwright');
const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
(async () => {
  console.log('── shield — the brace holds, the plate has a side, the hymn can be jumped\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const r = await page.evaluate(() => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; sv.flags.heal = 1;
    startGame(sv); loadRoom('A1'); G.wake = null; G.state = 'PLAY'; G.dialog = null; G.enemies = []; G.boss = null;
    const floor = () => { player.y = (G.roomDef.h - 2) * TILE - player.h; player.vy = 0; player.on = true; };
    const settle = () => { player.iT = 0; player.vx = 0; player.hurtPoseT = 0; player.guardHeat = 0; player.guardBreakT = 0; floor(); };
    // ---- 1. the brace ----
    player.x = 400; floor(); player.face = player.faceVis = 1; player.cores = 5;
    keys.KeyL = 1; for (let i = 0; i < 6; i++) player.update(1 / 60);
    out.guardUp = player.guardT;
    settle(); player.hurt(1, player.x + 60, 'probe');            // from the FRONT
    out.frontCores = player.cores; out.frontKb = Math.abs(player.vx);
    settle(); player.hurt(1, player.x - 60, 'probe');            // from BEHIND
    out.behindCores = player.cores;
    // three held blows inside two seconds break it
    player.cores = 5; settle(); for (let i = 0; i < 6; i++) player.update(1 / 60);
    for (let k = 0; k < 3; k++) { player.iT = 0; player.vx = 0; player.hurt(1, player.x + 60, 'probe'); }
    out.afterThree = player.cores; out.broken = player.guardBreakT;
    for (let i = 0; i < 6; i++) player.update(1 / 60);
    out.guardWhileBroken = player.guardT;
    for (let i = 0; i < 60; i++) player.update(1 / 60);          // a second on
    out.guardAfter = player.guardT;
    keys.KeyL = 0; for (let i = 0; i < 3; i++) player.update(1 / 60);
    // ---- 2. the shielded machine ----
    const e = new Enemy('guard', 600, (G.roomDef.h - 2) * TILE - 22); G.enemies.push(e);
    e.dir = -1; e.guard = true; e.hp = 100; e.hpMax = 100;
    const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
    let hp = e.hp; dealDmg(e, 20, null, ecx - 20, ecy, true); out.frontDenied = hp - e.hp;
    hp = e.hp; dealDmg(e, 20, null, ecx + 20, ecy, true); out.behindLanded = hp - e.hp;
    hp = e.hp; dealDmg(e, 20, null, ecx - 4, e.y - 6, true); out.aboveLanded = hp - e.hp;
    // the window after its lunge, at full cunning
    e.iq = 1; e.lungeT = 0.01; e.windedT = 0; e.coilT = 0; e.hp = 100;
    player.x = ecx - 300; floor();
    e.update(0.02);
    out.winded = +e.windedT.toFixed(2);
    G.enemies = [];
    // ---- 3. the hymn ----
    loadRoom('C3'); G.state = 'PLAY'; G.dialog = null; G.wake = null; G.bossEntry = null;
    const b = G.boss; out.bossKind = b && b.kind;
    if (b) {
      b.st = 'idle'; b.t = 9; b.hymn = null;
      player.cores = 5; player.x = b.cx() + 120; floor(); player.face = player.faceVis = -1;
      // the ring passes at exactly her distance: airborne, it must miss
      const d = Math.hypot(player.x + player.w / 2 - b.cx(), player.y + player.h / 2 - b.cy());
      b.hymn = { r: d, t: 0, n: 1 }; player.on = false; player.vy = -200; player.iT = 0;
      b.update(0.001); out.airCores = player.cores;
      // grounded and open, it lands
      b.hymn = { r: d, t: 0, n: 1 }; floor(); player.iT = 0; keys.KeyL = 0; player.guardT = 0;
      b.update(0.001); out.groundCores = player.cores;
      // grounded and braced facing the bell, it holds
      b.hymn = { r: d, t: 0, n: 1 }; floor(); player.iT = 0; player.cores = 5; player.guardHeat = 0; player.guardBreakT = 0; player.guardT = 1;
      b.update(0.001); out.bracedCores = player.cores; player.guardT = 0;
      // the cadence: a cast arms the cooldown
      b.hymn = null; b.st = 'idle'; b.t = 0; b.cycle = 2; b.hymnCD = 0; b.fbCD = 99; b.slamCD = 99; b.meltUsed = true; player.x = b.cx() + 400;
      b.update(0.001); out.firstSt = b.st; out.cd = +(b.hymnCD || 0).toFixed(1);
      b.st = 'idle'; b.t = 0; b.cycle = 2; b.update(0.001); out.secondSt = b.st;
    }
    return out;
  });
  console.log(JSON.stringify(r));
  check('holding GUARD raises the brace', r.guardUp > 0);
  check('a blow she faces is STOPPED — no core lost', r.frontCores === 5, 'cores ' + r.frontCores);
  check('...and it barely shoves her', r.frontKb < 80, 'vx ' + Math.round(r.frontKb));
  check('a blow from behind the brace is cut, not stopped', r.behindCores === 4, 'cores ' + r.behindCores);
  check('the third held blow inside two seconds breaks the brace and lands', r.afterThree === 4 && r.broken > 0, 'cores ' + r.afterThree + ' breakT ' + r.broken);
  check('...and the brace cannot be raised while broken', r.guardWhileBroken === 0, 'guardT ' + r.guardWhileBroken);
  check('...but comes back a second on', r.guardAfter > 0, 'guardT ' + r.guardAfter);
  check("the machine's plate denies a blow from the front", r.frontDenied <= 3, 'took ' + r.frontDenied);
  check('...a blow from BEHIND lands whole', r.behindLanded === 20, 'took ' + r.behindLanded);
  check('...a blow from ABOVE lands whole', r.aboveLanded === 20, 'took ' + r.aboveLanded);
  check('its winded window is at least half a second at full cunning', r.winded >= 0.5, r.winded + ' s');
  check('the Furnace Choir stands in C3', r.bossKind === 'atlas', String(r.bossKind));
  check('the hymn misses an airborne body', r.airCores === 5, 'cores ' + r.airCores);
  check('...and takes a grounded, open one', r.groundCores === 4, 'cores ' + r.groundCores);
  check('...and a grounded brace facing the bell holds', r.bracedCores === 5, 'cores ' + r.bracedCores);
  check('a cast arms the hymn cooldown', r.firstSt === 'hymn' && r.cd >= 6, r.firstSt + ' cd ' + r.cd);
  check('...and the next turn of the cycle lobs instead', r.secondSt === 'lobwarn', String(r.secondSt));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
