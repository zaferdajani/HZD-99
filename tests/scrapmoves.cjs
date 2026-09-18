// KINGDOM A — THE MEADOW ARMS ITS OWN MACHINES, AND NOT ON THE FIRST WALK.
//
// Owner, 2026-09-18: "improve enemy level and skills point with more moves that
// need to be created for them with every kingdom." The framework is measured by
// tests/foelevel.cjs; this measures kingdom A's CONTENT — scrapdrag on the
// crawler, scrapkick on the hopper, rustbloom on the blob — and the one
// constraint no other kingdom has.
//
// THE CONSTRAINT IS THE POINT OF THIS FILE. foeLevel('A') is 1 on a fresh save,
// which is zero points, which buys nothing at all: the tutorial, the waking
// floor and the first hour must be exactly the game they have always been, and
// the moves may only appear on the walk BACK through the meadow once the run
// itself has raised it. So every check below is run twice — once on a save that
// has taken nothing, where the answer must be "no change whatsoever", and once
// on a save that has been somewhere.
//
// And the law that binds all three: an enemy is never harder because it warned
// you less. Each move is paid for with a LONGER tell, so the harness measures
// the warning in both states and fails if the armed machine's is shorter.
//
//   node tests/scrapmoves.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── scrapmoves — kingdom A picks the floor up, and never on a fresh save\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof foeMovesFor === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv); loadRoom('A1');
    G.wake = null; G.state = 'PLAY'; G.boss = null;
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));

    // the two saves this whole file is about: nothing taken, and a run that has
    // been somewhere. Everything below is measured under both.
    const FRESH = () => { G.save.abil = {}; G.save.skills = []; G.save.flags = { tut: 1, woke: 1 }; };
    const BACK = () => {                       // enough to raise the meadow, not a finished run
      G.save.abil = { dash: 1, wall: 1, glide: 1 }; G.save.skills = [];
      G.save.flags = { tut: 1, woke: 1 };
    };

    // Drive ONE machine beside a standing player and watch what it does. The
    // game loop is not ticking during this, so pools are drained by hand each
    // frame — otherwise the 14-pool cap swallows the thing being measured.
    const drive = (kind, frames) => {
      G.enemies.length = 0; G.pools = [];
      const floorY = 15 * TILE - 4;
      const e = new Enemy(kind, 260, floorY - EKIND[kind].h);
      G.enemies.push(e);
      const o = {
        level: e.level, moves: e.moves.slice(),
        tell: 0,                                 // longest wind-up seen, in seconds
        bloomTell: 0, plate: 0, wash: 0, washR: 0, bloom: 0,
        pools: [], lunges: 0,
      };
      let coilRun = 0, bloomRun = 0;
      for (let i = 0; i < frames; i++) {
        // stand in front of it, close enough to be noticed, every frame
        player.x = clamp(e.x + (e.dir || 1) * 80, 40, 700);
        player.y = floorY - player.h; player.vy = 0; player.on = true;
        player.iT = 999; player.dead = false;
        e.update(1 / 60);
        const w = Math.max(e.coilT || 0, e.crouchT || 0);
        if (w > 0) { coilRun++; } else { o.tell = Math.max(o.tell, coilRun / 60); coilRun = 0; }
        if (e.bloom && (e.drip0 || 0) > 0) { bloomRun++; }
        else { o.bloomTell = Math.max(o.bloomTell, bloomRun / 60); bloomRun = 0; }
        if (e.plate) o.plate++;
        if (e.bloom) o.bloom++;
        if ((e.washT || 0) > 0) { o.wash++; o.washR = Math.max(o.washR, e.washR || 0); }
        if ((e.lungeT || 0) > 0) o.lunges++;
        if (G.pools.length) {                    // {n, dx} per release, then drained
          o.pools.push({ n: G.pools.length, dx: G.pools.map(q => Math.round(q.x - (e.x + e.w / 2))) });
          G.pools.length = 0;
        }
      }
      o.tell = Math.max(o.tell, coilRun / 60);
      o.bloomTell = Math.max(o.bloomTell, bloomRun / 60);
      return o;
    };

    const out = { TELL_FAST, TELL_SWIPE, BLOB_TELL, BLOB_BLOOM, BLOOM_THROW, KICK_REACH };

    // ---- 1. THE OPENING IS UNTOUCHED ---------------------------------------
    FRESH();
    out.freshLvA = foeLevel('A');
    out.freshBuys = {
      crawler: foeMovesFor('crawler', foeLevel('A'), 'A'),
      hopper: foeMovesFor('hopper', foeLevel('A'), 'A'),
      blob: foeMovesFor('blob', foeLevel('A'), 'A'),
    };
    out.fresh = { crawler: drive('crawler', 620), hopper: drive('hopper', 620), blob: drive('blob', 900) };

    // ---- 2. ...AND THE WALK BACK IS NOT ------------------------------------
    BACK();
    out.backLvA = foeLevel('A');
    out.backPts = foeSkillPts(out.backLvA);
    out.back = { crawler: drive('crawler', 620), hopper: drive('hopper', 620), blob: drive('blob', 900) };

    // ---- 3. the rows stay inside their own kingdom -------------------------
    const mine = ['scrapdrag', 'scrapkick', 'rustbloom'];
    out.leaks = [];
    for (const z of ['B', 'C', 'D', 'E', 'X'])
      for (const k of ['crawler', 'hopper', 'blob', 'guard', 'flier', 'turret', 'bat'])
        for (const id of foeMovesFor(k, 7, z))
          if (mine.indexOf(id) >= 0) out.leaks.push(k + '@' + z + ':' + id);
    // the guard shares the crawler's case label and must never carry the plate
    out.guardBuys = foeMovesFor('guard', 7, 'A');
    // and the unscoped rows are the integrator's: this kingdom wrote none
    out.unscopedTouched = ['crawler', 'hopper', 'blob'].filter(k => FOE_MOVES[k] !== undefined);
    return out;
  });

  const F = r.fresh, B = r.back;

  // ---- the opening, on a save that has taken nothing ------------------------
  check('a fresh save leaves the meadow at level 1', r.freshLvA === 1, 'lv ' + r.freshLvA);
  check('...and level 1 buys none of kingdom A\'s moves',
    !r.freshBuys.crawler.length && !r.freshBuys.hopper.length && !r.freshBuys.blob.length,
    JSON.stringify(r.freshBuys));
  check('...so a spawned opening machine carries nothing',
    !F.crawler.moves.length && !F.hopper.moves.length && !F.blob.moves.length,
    JSON.stringify([F.crawler.moves, F.hopper.moves, F.blob.moves]));
  check('...the opening crawler never drags a plate', F.crawler.plate === 0, F.crawler.plate + ' frames');
  check('...the opening hopper never kicks scrap', F.hopper.wash === 0, F.hopper.wash + ' frames');
  check('...the opening blob never blooms', F.blob.bloom === 0, F.blob.bloom + ' frames');
  check('...and every drop it leaves is still under its own belly',
    F.blob.pools.length > 0 && F.blob.pools.every(p => p.n === 1 && Math.abs(p.dx[0]) <= 6),
    JSON.stringify(F.blob.pools.slice(0, 3)));
  check('...the opening wind-ups are the ones the tutorial taught',
    Math.abs(F.crawler.tell - r.TELL_FAST) < 0.05 && Math.abs(F.hopper.tell - r.TELL_FAST) < 0.05,
    'crawler ' + F.crawler.tell + 's, hopper ' + F.hopper.tell + 's vs TELL_FAST ' + r.TELL_FAST);

  // ---- the walk back --------------------------------------------------------
  check('a run that has been somewhere raises the meadow', r.backLvA >= 2, 'lv ' + r.backLvA);
  check('...and one point is enough to arm every one of them',
    r.backPts >= 1 && B.crawler.moves.join() === 'scrapdrag'
    && B.hopper.moves.join() === 'scrapkick' && B.blob.moves.join() === 'rustbloom',
    r.backPts + ' pts: ' + JSON.stringify([B.crawler.moves, B.hopper.moves, B.blob.moves]));

  // ---- the moves actually FIRE ---------------------------------------------
  check('SCRAPDRAG: the crawler hooks a plate and shoves it', B.crawler.plate > 0,
    B.crawler.plate + ' frames with the plate out, over ' + B.crawler.lunges + ' lunge frames');
  check('...and it lets go of it — no plate outlives its lunge',
    B.crawler.plate < B.crawler.lunges + 4,
    'plate ' + B.crawler.plate + ' vs lunge ' + B.crawler.lunges);
  check('SCRAPKICK: the hopper rakes a heap and the landing throws it',
    B.hopper.wash > 0 && B.hopper.washR > 60,
    B.hopper.wash + ' frames, reach ' + Math.round(B.hopper.washR) + 'px of ' + r.KICK_REACH);
  check('RUSTBLOOM: the blob throws sideways instead of dripping', B.blob.bloom > 0,
    B.blob.bloom + ' frames blooming');
  const flank = B.blob.pools.filter(p => p.n === 2);
  check('...and the bloom takes the two tiles BESIDE it, not the one under it',
    flank.length > 0 && flank.every(p => p.dx.every(d => Math.abs(Math.abs(d) - r.BLOOM_THROW) <= 4)),
    JSON.stringify(flank.slice(0, 2)));
  check('...while a plain drip still lands underneath',
    B.blob.pools.some(p => p.n === 1 && Math.abs(p.dx[0]) <= 6),
    JSON.stringify(B.blob.pools.filter(p => p.n === 1).slice(0, 2)));

  // ---- THE LAW: reach is bought with warning, never stolen from it ---------
  check('the armed crawler warns LONGER, not shorter',
    B.crawler.tell > F.crawler.tell && B.crawler.tell >= r.TELL_SWIPE - 0.05,
    F.crawler.tell + 's -> ' + B.crawler.tell + 's (TELL_SWIPE ' + r.TELL_SWIPE + ')');
  check('the armed hopper warns LONGER, not shorter',
    B.hopper.tell > F.hopper.tell && B.hopper.tell >= r.TELL_SWIPE - 0.05,
    F.hopper.tell + 's -> ' + B.hopper.tell + 's (TELL_SWIPE ' + r.TELL_SWIPE + ')');
  check('the bloom sags for nearly twice the plain drip before it throws',
    B.blob.bloomTell >= r.BLOB_BLOOM - 0.06 && B.blob.bloomTell > r.BLOB_TELL,
    B.blob.bloomTell + 's vs drip ' + r.BLOB_TELL + 's');

  // ---- five sessions, one registry -----------------------------------------
  check('kingdom A\'s moves never reach another kingdom', r.leaks.length === 0, r.leaks.join(', '));
  check('...and the guard keeps its own question — no plate on the shield',
    r.guardBuys.indexOf('scrapdrag') < 0, r.guardBuys.join() || 'nothing');
  check('...and no unscoped row was written: that layer is the integrator\'s',
    r.unscopedTouched.length === 0, r.unscopedTouched.join());
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log(fails.length ? '\nFAILED: ' + fails.join('; ') : '\nall good');
  process.exit(fails.length ? 1 : 0);
})();
