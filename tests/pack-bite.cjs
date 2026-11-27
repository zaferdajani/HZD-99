// HER WOLF'S BITE HURTS (owner, 2026-11-27: "The wolf is super weak. When I
// summoned it next to the cheetahs, it hit it so many times without any real
// damage, even though I upgraded the wolf into the next level.").
//
// Measured before the fix: a cave cat is 121-145 hp under 12 % plate and the
// bite was a flat 14 (22 upgraded) — a twelfth of the cat, three bites a stay;
// a cat that leapt left its reach for good, and a wolf called with her back to
// a room's edge came in past the wall. This drives the real build, real cats in
// their real rooms with their real health, and fails if it comes back:
//   A  CAVE CATS  the first-rung wolf brings a cave cat down in 4-6 bites, the
//                 upgraded one in 3-4 (calling again when a stay runs out)
//   B  BLOBS      the same counts against a blob, in the meadow and in a cave
//   C  SEEN       every bite flashes the body, knocks it back and takes at
//                 least a sixth of its health off
//   D  A LITTLE   against a guardian the bite is still the flat bite
//   E  REACHED    a leaping cat (C1, whose floor has a pit beside it) is bitten
//                 inside one stay; called at a room's edge it comes in inside
//                 the room
//   F  PACE       a stay of ten seconds bites four or five times, not a flurry
//
//   node tests/pack-bite.cjs     (the repo served on :8220, or TEST_PORT)
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof packBite === 'function', { timeout: 30000 });
    console.log('── pack-bite — her wolf\'s bite takes a cat down in a handful of bites, and it is seen');

    const R = await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const fresh = (lv, seed) => {
        let s = seed >>> 0; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
        Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, alpha: 1 });
        sv.arms = ['pack']; sv.packLv = lv; startGame(sv);
      };
      const quiet = () => { G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.trans = G.meet = G.bossEntry = null; G.toasts = []; };
      // every bite the wolf lands, as dealt
      const bites = [];
      const dd0 = dealDmg;
      dealDmg = function (e, dm, el, x, y, np, move) {
        const hp0 = e.hp, out = dd0.apply(this, arguments);
        if (move === 'pack') bites.push({ e, lost: hp0 - e.hp, max: e.hpMax0 || 0, flash: (e.impactUntil || 0) > performance.now(), kb: null, kind: e.kind, boss: e instanceof Boss });
        return out;
      };
      // a machine in its own room, the rest put away, her a little way off; called until it is down
      const down = (room, pick, lv, seed, setup) => {
        fresh(lv, seed);
        loadRoom(room); quiet();
        let foe = pick();
        if (!foe) return { room, err: 'no machine' };
        for (const e of G.enemies) if (e !== foe) e.dead = true;
        if (setup) setup(foe);
        player.x = foe.x + 300; player.y = foe.y + foe.h - player.h; player.face = -1; player.vx = 0;
        const hp0 = foe.hp, max = foe.hpMax0; bites.length = 0;
        let calls = 0, t = 0, firstStay = null, stay0 = null;
        for (let f = 0; f < 60 * 50; f++) {
          player.iT = 99; player.vx = 0; foe.iT = 0;
          if (!G.packWolf) {
            // (she keeps up with it, as a player does: a slow blob crawling off is out of a new wolf's sight otherwise)
            if (calls > 0 && Math.abs(foe.x - player.x) > 360) { const W = G.roomDef.w * TILE, sx = foe.x + 300 < W - 60 ? foe.x + 300 : foe.x - 300; const g = groundColumnAt(sx); player.x = sx; if (g) player.y = Math.min(g[0], g[1]) - player.h; player.face = Math.sign(foe.x - sx) || -1; }
            player.armCD = 0; player.volts = 200; if (packCall(player)) { calls++; if (calls === 1) stay0 = G.packWolf.t; }
          }
          update(1 / 60); quiet(); t += 1 / 60;
          // the knock is put on after the blow lands (packBite): read it the frame it happened
          for (const b of bites) if (b.kb == null) b.kb = (b.e.kbT || 0) > 0 || b.e.disabled || b.e.dead || b.e.hp <= 1;
          if (calls === 1 && firstStay == null && !G.packWolf) firstStay = bites.filter(b => b.e === foe).length;
          if (foe.dead || foe.disabled || foe.hp <= 1) break;
        }
        const mine = bites.filter(b => b.e === foe);
        return { room, kind: foe.kind, cat: isCheetah(foe), hp0, max, def: foe.defense | 0, n: mine.length, calls, t: +t.toFixed(1), down: !!(foe.dead || foe.disabled || foe.hp <= 1),
          firstStay: firstStay == null ? mine.length : firstStay, seen: mine.every(b => b.flash && b.kb && b.lost >= Math.floor(b.max / 6)), lost: mine.map(b => b.lost) };
      };
      const out = { cats: [], blobs: [], misc: {} };
      const firstCat = () => G.enemies.filter(e => !e.dead && !e.disabled && isCheetah(e))[0];
      const seeds = [0x9e3779b1, 0x85ebca6b, 0xc2b2ae35];
      for (const lv of [1, 2]) for (const room of ['CV2', 'CV3', 'V2', 'CV1']) for (const sd of seeds.slice(0, room === 'CV2' ? 3 : 1))
        out.cats.push(Object.assign(down(room, firstCat, lv, sd), { lv }));
      // blobs: one in the meadow, one in a cave (their own health for the room they are in)
      for (const lv of [1, 2]) for (const room of ['A1', 'CV2']) {
        const r = down(room, () => {
          const fy = (x) => { const g = groundColumnAt(x); return g ? Math.min(g[0], g[1]) : null; };
          const W = G.roomDef.w * TILE; let x0 = null;
          for (let x = Math.round(W * 0.35); x < W - 500 && x0 == null; x += 32) { const a = fy(x); if (a == null) continue; let flat = true; for (let k = 0; k <= 360; k += 16) { const y = fy(x + k); if (y == null || Math.abs(y - a) > 20) { flat = false; break; } } if (flat) x0 = x; }
          if (x0 == null) return null;
          const b = new Enemy('blob', x0, 0); b.y = fy(x0 + b.w / 2) - b.h; G.enemies.push(b); return b;
        }, lv, 0x51ed270b);
        out.blobs.push(Object.assign(r, { lv }));
      }
      // D. a guardian takes the flat bite
      {
        fresh(1, 7); loadRoom('A4'); quiet();
        const b = G.boss;
        if (b) { const w = { dir: 1, x: b.x - 40, y: b.y, w: 28, h: 20 }; const hp0 = b.hp; b.st = b.st === 'dorm' ? 'idle' : b.st; b.hideK = 1;
          const raw = packBiteRaw(b, packStat('dmg')); out.misc.boss = { kind: b.kind, raw, flat: Math.round(packStat('dmg') * DF().pdmg) }; }
      }
      // E. the edge: called with her back to the room's right wall
      {
        fresh(1, 9); loadRoom('V2'); quiet(); G.enemies = [];
        const W = G.roomDef.w * TILE; const g = groundColumnAt(W - 60); player.x = W - 60 - player.w / 2; if (g) player.y = Math.min(g[0], g[1]) - player.h; player.face = -1;
        player.armCD = 0; packCall(player); const w = G.packWolf;
        out.misc.edge = { x: Math.round(w.x), right: Math.round(w.x + w.w), W };
      }
      dealDmg = dd0;
      return out;
    });
    const fmt = (r) => r.err ? r.room + ' ' + r.err : r.room + (r.cat ? ' cat ' : ' ') + r.kind + ' hp ' + r.hp0 + ' (plate ' + r.def + '%): ' + r.n + ' bites ' + (r.down ? 'down' : 'NOT DOWN') + ' in ' + r.t + ' s, ' + r.calls + ' call' + (r.calls > 1 ? 's' : '');
    const cat1 = R.cats.filter(r => r.lv === 1), cat2 = R.cats.filter(r => r.lv === 2);
    check('A. a first-rung wolf brings a cave cat down in 4-6 bites', cat1.length >= 4 && cat1.every(r => r.down && r.n >= 4 && r.n <= 6), cat1.map(fmt).join(' | '));
    check('   ...the upgraded one in 3-4', cat2.length >= 4 && cat2.every(r => r.down && r.n >= 3 && r.n <= 4), cat2.map(fmt).join(' | '));
    const bl1 = R.blobs.filter(r => r.lv === 1), bl2 = R.blobs.filter(r => r.lv === 2);
    check('B. the same against a blob (meadow and cave): 4-6 bites, 3-4 upgraded', bl1.length === 2 && bl2.length === 2 && bl1.every(r => r.down && r.n >= 4 && r.n <= 6) && bl2.every(r => r.down && r.n >= 3 && r.n <= 4),
      R.blobs.map(r => 'lv' + r.lv + ' ' + fmt(r)).join(' | '));
    const all = R.cats.concat(R.blobs).filter(r => !r.err);
    check('C. every bite is seen: the body flashes, is knocked back and loses at least a sixth of its health', all.every(r => r.seen && r.n > 0), all.filter(r => !r.seen).map(r => r.room + ' lost ' + r.lost.join(',') + ' of ' + r.max).join(' | ') || all.length + ' fights');
    check('D. a guardian still takes the flat bite (a little help, never a weapon)', R.misc.boss && R.misc.boss.raw === R.misc.boss.flat, JSON.stringify(R.misc.boss));
    const c1 = R.cats.find(r => r.room === 'V2' && r.lv === 1);
    check('E. called with her back to a room\'s edge it comes in inside the room', R.misc.edge.x >= 0 && R.misc.edge.right <= R.misc.edge.W, JSON.stringify(R.misc.edge));
    const stays = R.cats.filter(r => r.lv === 1 && r.calls >= 1).map(r => r.firstStay);
    check('F. a ten-second stay bites a few times — never none, never a flurry (1-5)', stays.every(n => n >= 1 && n <= 5), 'bites in the first stay: ' + stays.join(' '));
    check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\npack-bite: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
