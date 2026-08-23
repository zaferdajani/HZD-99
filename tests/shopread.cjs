// THE SHOP HAS TO BE THE THING YOU WALK TOWARD.
//
// The owner, 2026-08-23, about the first shop: "the colors are still in dull
// faded three d instead of drawings like the characters. So it's might... the
// player might actually miss it. It's not appealing to the... human player to
// enter."
//
// That was a measurement, not a mood. Every depth-door structure was drawn
// inside drawBG, which put it UNDER bgPlanePass — a pass whose whole job is to
// pull 94% of the chroma out of the far plane and multiply its value to 42%.
// In A0 the booth measured 12.4 saturation against a backdrop of 11.9: to
// within a point and a half, the shop WAS the wall behind it.
//
// ART_BIBLE §9.4 had already written the rule down — "the reserved chroma
// belongs to the cast and the interactables, not to the wall behind them" —
// so this harness is that sentence turned into arithmetic. For every walk-up
// structure in the game, in its own room, with the real frame assembled:
// it must be markedly more saturated and markedly brighter than the backdrop
// standing beside it.
//
//   node tests/shopread.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

// room -> what stands in it. Every style the game has, plus a cave mouth.
const SITES = [
  ['A0', 'booth',  "the trader's stall"],
  ['B3', 'oracle', "the Oracle's shrine"],
  ['C5', 'forge',  "the Tinker's quench hood"],
  ['D1', 'carrel', "the Sage's carrel"],
  ['E1', 'hollow', "the Nymph's hollow"],
  ['A5', 'cave',   'the first cave mouth'],
];

(async () => {
  console.log('── shopread — a structure she can enter is never the wall behind it\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const out = await page.evaluate(async (sites) => {
    const res = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    // every grotto revealed, so the lair doors exist to be measured too
    for (const k of ['bossGlitch', 'bossEagle', 'bossFurnace', 'bossGlaciere',
                     'bossPrism', 'bossMother', 'alpha']) sv.flags[k] = 1;
    startGame(sv);
    for (const [room, style] of sites) {
      loadRoom(room);
      G.wake = null; G.state = 'PLAY'; G.bossEntry = null; G.hitStop = 0;
      const d = gateDoors().find(q => style === 'cave' ? !q.style : q.style === style);
      if (!d) { res[room] = { err: 'no ' + style + ' door in ' + room }; continue; }
      res[room] = { near: gateDoorNear(d) };
      // THE PILE COMES OFF FIRST where there is one: this measures the
      // STRUCTURE's plane, and a mouth still under rubble is measuring rock.
      if (d.rubble) { G.save.flags[d.rubble] = 1; rubbleInit(); }
      // stand her back from it so nothing of hers lands in the sample
      player.x = Math.max(40, gateWorldX(d) - 320);
      player.y = (G.roomDef.h - 4) * TILE;
      G.enemies = []; G.boss = null; G.projs = []; G.parts = [];
      // ...and the ROOM STOPS TALKING. A first run measured a mean value of 61
      // everywhere and called the booth identical to the wall: what it had
      // actually sampled was the speech panel, because walking into A0 opens
      // one. Sealed the same way tests/grammar.cjs seals it.
      G.toasts = [];
      try {
        Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
        Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
      } catch (e) {}
      // the plates are lazy; wait for the frame that actually has one
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) { await new Promise(k => requestAnimationFrame(k)); }
      // MEASURE THE PIXELS THE STRUCTURE OWNS, by taking it away. Every
      // geometric guess at where a stall "is" also measures the empty sky
      // above it and the ground below, and a first run duly reported the
      // booth as darker than the wall because two thirds of its box was
      // night. Two frames — one with the near pass, one with G.structProbe
      // suppressing it — and the pixels that differ ARE the structure. What
      // was behind them is the wall it has to out-read.
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const grab = () => new Uint8ClampedArray(ctx.getImageData(0, 0, cv.width, cv.height).data);
      // THE ROOM IS FROZEN BEFORE IT IS MEASURED. Two things move between two
      // frames and neither is the structure: the clock, which drives every
      // breath and flicker, and Math.random, which spawns embers. The Foundry
      // never goes quiet on its own — it was still moving after sixty tries —
      // so stillness is imposed rather than waited for. What CANNOT be frozen
      // is art arriving over the network, and that is what the settle below is
      // actually for.
      const tNow = performance.now(); const realNow = performance.now;
      const realRand = Math.random;
      performance.now = () => tNow;
      Math.random = () => 0.5;
      // WAIT FOR THE PICTURE TO STOP MOVING. Under the full suite a dozen
      // browsers share four cores, art lands late, and a fixed wait handed
      // back two frames that differed by 141 665 pixels — a third of the
      // canvas — because a plate finished loading between them. The mask then
      // contained the whole room and the booth measured 0.97 instead of 2.60.
      // So: settle first (a frame that equals the one before it), and only
      // then freeze the clock and take the pair.
      const differ = (p, q) => {
        let n = 0;
        for (let i = 0; i < p.length; i += 4)
          if (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) +
              Math.abs(p[i + 2] - q[i + 2]) >= 24) n++;
        return n;
      };
      const still = Math.max(200, Math.round(cv.width * cv.height * 0.003));
      let prev = grab(), settled = false;
      for (let t = 0; t < 40 && !settled; t++) {
        for (let f = 0; f < 8; f++) await new Promise(k => requestAnimationFrame(k));
        const cur = grab();
        if (differ(prev, cur) < still) settled = true;
        prev = cur;
      }
      res[room].settled = settled;
      // FOUR FRAMES PER SIDE, not one: the game runs its own rAF, and a single
      // wait after flipping the probe hands back a frame that was already in
      // flight — with the structure still in it.
      for (let f = 0; f < 4; f++) await new Promise(k => requestAnimationFrame(k));
      const A = grab();
      G.structProbe = 1;
      for (let f = 0; f < 4; f++) await new Promise(k => requestAnimationFrame(k));
      const B = grab();
      G.structProbe = 0;
      performance.now = realNow;
      Math.random = realRand;
      const acc = { h: [0, 0, 0], w: [0, 0, 0] };
      for (let i = 0; i < cv.width * cv.height; i++) {
        const d0 = Math.abs(A[i * 4] - B[i * 4]) + Math.abs(A[i * 4 + 1] - B[i * 4 + 1]) +
                   Math.abs(A[i * 4 + 2] - B[i * 4 + 2]);
        if (d0 < 24) continue;                      // not the structure
        const add = (src, t2) => {
          const R = src[i * 4], G2 = src[i * 4 + 1], Bl = src[i * 4 + 2];
          const mx = Math.max(R, G2, Bl), mn = Math.min(R, G2, Bl);
          t2[0] += mx ? (mx - mn) / mx * 100 : 0; t2[1] += mx / 255 * 100; t2[2]++;
        };
        add(A, acc.h);                              // the structure
        add(B, acc.w);                              // ...and what it stands over
      }
      const fin = (t2) => ({ sat: +(t2[0] / Math.max(1, t2[2])).toFixed(1),
                             val: +(t2[1] / Math.max(1, t2[2])).toFixed(1),
                             px: t2[2] });
      res[room].here = fin(acc.h);
      res[room].wall = fin(acc.w);
    }
    return res;
  }, SITES);

  // THE LAW, and where it binds. Every walk-up structure must be in the cast's
  // plane and must actually be DRAWN — both are the code's job and both are
  // checked everywhere. How WELL it reads is partly the plate's job, and four
  // of these six are still procedural stand-ins waiting on ART_QUEUE §2h/§2k;
  // so the read score is REPORTED for all of them and ENFORCED on the one the
  // owner named. Numbers, not adjectives, for whoever fires those plates.
  const ENFORCE = ['A0'];
  for (const [room, style, what] of SITES) {
    const r = out[room] || {};
    if (r.err) { check(what + ' stands in ' + room, false, r.err); continue; }
    check(what + ' is drawn with the cast, not the painting', r.near === true, room);
    check('...and its room held still long enough to measure', r.settled === true,
          room + (r.settled ? '' : ' never settled — art still arriving'));
    // "declared and never visible" is the failure ART_BIBLE §7 exists for, and
    // a structure can pass every other check while contributing no pixels. The
    // count is how many of its pixels survive a contrast test against the room
    // behind them, so it is a legibility number as much as a wiring one — and
    // that is why it is enforced only where the plate is fired. The Oracle's
    // shrine currently yields FIFTY-TWO: a dark blue stand-in on a dark brown
    // wall, within noise of the Conduits it stands in. That is a plate to
    // re-fire (ART_QUEUE §2h), not a number to argue with.
    const pxOk = (r.here.px || 0) >= 400;
    if (ENFORCE.indexOf(room) >= 0) check('...and it puts pixels on the screen', pxOk,
                                          room + ' ' + (r.here.px || 0) + ' px (min 400)');
    // A structure may read in colour or in light, and a cave mouth reads by
    // being DARKER — it is a hole, not a lamp — so the light test is a distance
    // from parity in either direction rather than a floor.
    const dS = +(r.here.sat - r.wall.sat).toFixed(1);
    const kV = +(r.here.val / Math.max(1, r.wall.val)).toFixed(2);
    const score = Math.max(dS / 3, Math.abs(1 - kV) / 0.5);
    const line = room + ' sat ' + r.here.sat + ' vs ' + r.wall.sat + ' (' + (dS >= 0 ? '+' : '') + dS + ')' +
                 '  val ' + r.here.val + ' vs ' + r.wall.val + ' (x' + kV + ')' +
                 '  ->  reads ' + score.toFixed(2);
    if (ENFORCE.indexOf(room) >= 0) check('...and it out-reads the ground it covers', score >= 1, line + ' (min 1.00)');
    else console.log('  --   ' + what + ': ' + (r.here.px || 0) + ' px survive contrast, reads ' +
                     score.toFixed(2) + '   ' + line);
  }
  console.log('\n  (rooms without a fired plate are reported, not enforced — see ART_QUEUE §2h/§2k)');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
