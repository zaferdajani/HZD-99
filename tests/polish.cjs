// THE FIRST KINGDOM IS THE MOST POLISHED PART, MEASURED.
//
// Most people who ever open this game will see the Scrap Meadows and nothing
// else, so the owner's instruction is that kingdom A should be the richest part
// of the game rather than — as it is in almost every game ever made — the
// oldest and plainest part, built first and never revisited.
//
// "Most polished" is a feeling, and a feeling is not something a build can
// keep. So it is turned into a ranking here: every kingdom gets the same
// systems, A is tuned highest in all of them, and this harness fails if any
// other kingdom overtakes it. The ranking becomes a property of the build.
//
// It also guards the thing that makes a foreground layer a mistake instead of
// an upgrade: A LAYER IN FRONT OF THE PLAYER MUST NEVER COVER THE FIGHT. The
// near layer is pinned to the top and bottom edges of the view, and that claim
// is checked by rendering the frame twice and counting which pixels moved.
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── polish — the first kingdom leads, and the near layer stays out of the fight');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide']; startGame(sv);
  });
  await page.waitForTimeout(1200);

  // ---- 1. EVERY KINGDOM HAS THE SYSTEM, AND A LEADS IT --------------------
  const rank = await page.evaluate(() => {
    const zones = Object.keys(ROOMS).reduce((s, id) => (s[ROOMS[id].zone] = 1, s), {});
    const rows = [];
    for (const z of Object.keys(zones).sort()) {
      const F = FGZONE[z];
      rows.push({ z, has: !!F, near: F ? F.top + F.bot : 0, pollen: F ? (F.pollen || 0) : 0 });
    }
    return rows;
  });
  const A = rank.find(r => r.z === 'A') || { near: 0 };
  const others = rank.filter(r => r.z !== 'A' && r.z !== 'W');
  check('every kingdom has a near layer', rank.filter(r => r.z !== 'W').every(r => r.has),
        rank.map(r => r.z + (r.has ? '' : '!')).join(' '));
  check('...and the first kingdom has the most of it',
        others.every(r => r.near < A.near),
        rank.filter(r => r.z !== 'W').map(r => r.z + ':' + r.near).join('  '));
  check('...and the one element no other kingdom gets',
        A.pollen > 0 && others.every(r => r.pollen === 0),
        'near-pollen A:' + A.pollen + ', elsewhere ' + others.map(r => r.pollen).join('/'));

  // ---- 2. IT IS ACTUALLY ON SCREEN, IN EVERY ROOM -------------------------
  // Same lesson the frontier light taught, learned twice more here: drawn
  // correctly at a contrast nobody can see is not drawn. Both bands measured
  // ZERO on the first two tunings — dark silhouettes in front of dark surfaces
  // — and were only fixed by giving each one a LIT element (grass tips, lamps
  // on the cable ends) that reads against anything.
  //
  // And it is measured across EIGHT ROOMS, not one, because the first version
  // of this sampled only the wide hall A2 and passed at 9054 moved pixels
  // while the ordinary rooms next door were scoring 31. A layer that exists in
  // one room in four is not a layer.
  //
  // Sampling every pixel, not every second one: these are blades a few px
  // wide and a stride walks straight past most of them.
  const rooms = ['A2', 'A1', 'A0', 'A3', 'A6', 'A10', 'A5', 'A8'];
  const look = await page.evaluate((list) => {
    const out = {};
    for (const room of list) {
      loadRoom(room); G.state = 'PLAY'; G.toasts = []; G.card = null; G.zoneToast = null;
      // the arena lights-up hold leaves the frame black, and black minus black
      // is zero on every band — a measurement artefact, not a missing layer
      G.bossEntry = null;
      player.x = 14 * TILE; player.y = 14 * TILE; player.vx = 0; player.vy = 0;
      updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
      const x = cv.getContext('2d');
      const grab = () => { draw(performance.now()); return x.getImageData(0, 0, cv.width, cv.height).data; };
      const on = grab();
      const keep = FGZONE.A; delete FGZONE.A;
      const off = grab();
      FGZONE.A = keep;
      const W = cv.width, sy = cv.height / 540;
      const band = (y0, y1) => {
        let n = 0;
        for (let y = Math.round(y0 * sy); y < Math.round(y1 * sy); y++)
          for (let xx = 0; xx < W; xx++) {
            const i = (y * W + xx) * 4;
            if (Math.abs(on[i] - off[i]) + Math.abs(on[i + 1] - off[i + 1])
                + Math.abs(on[i + 2] - off[i + 2]) > 24) n++;
          }
        return n;
      };
      out[room] = { top: band(0, 250), bot: band(488, 542), mid: band(270, 470) };
    }
    return out;
  }, rooms);
  const tops = rooms.map(r => look[r].top), bots = rooms.map(r => look[r].bot);
  const mids = rooms.map(r => look[r].mid);
  const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  check('the near layer is visible in EVERY room, not a lucky one',
        Math.min(...tops) > 300,
        'worst room ' + Math.min(...tops) + ' px, best ' + Math.max(...tops));
  // The floor band's strength depends on where the camera is standing when the
  // frame is taken, so it is judged on the median rather than the worst — but
  // the median has to be a real number, not a rounding error.
  check('...and the floor band reads across the kingdom', med(bots) > 150,
        'median ' + med(bots) + ' px (' + Math.min(...bots) + '-' + Math.max(...bots) + ')');
  // THE RULE, and it is absolute. Pollen may cross the middle — it is a 2 px
  // additive speck and it is what makes the place feel alive — but nothing
  // SOLID may. A silhouette across the fight is the failure this layer could
  // so easily have been, so the play area gets a hard budget in every room.
  check('...but it never puts a silhouette across the fight',
        Math.max(...mids) < 80,
        'worst play area ' + Math.max(...mids) + ' px against ' + med(tops) + ' at the edge');

  // ---- 3. IT OBEYS THE GROUND-FX RULE -------------------------------------
  const probe = await page.evaluate(() => {
    const x = cv.getContext('2d');
    const grab = () => {
      draw(performance.now());
      return x.getImageData(0, 0, cv.width, cv.height).data;
    };
    const W = cv.width, sy = cv.height / 540;
    const floor = (a, b) => {
      let n = 0;
      for (let y = Math.round(500 * sy); y < Math.round(540 * sy); y++)
        for (let xx = 0; xx < W; xx += 2) {
          const i = (y * W + xx) * 4;
          if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++;
        }
      return n;
    };
    const normal = grab();
    G.artProbe = 1;
    const probed = grab();
    G.artProbe = 0;
    return floor(normal, probed);
  });
  check('the floor band obeys G.artProbe, like every ground FX', probe > 100,
        probe + ' pixels of grass removed when the art harness looks');

  // ---- 4. AND IT COSTS A ROOM NOTHING TO ENTER ----------------------------
  // The plan is cached per room and the loop must stay allocation-light, so
  // walking back and forth must not rebuild it.
  const cached = await page.evaluate(() => {
    FG_CACHE.A2 = undefined;
    const a = fgPlan('A2'), b = fgPlan('A2');
    loadRoom('A1'); loadRoom('A2');
    return { same: a === b && fgPlan('A2') === a, n: a.top.length + a.bot.length };
  });
  check('a room builds its near layer once and keeps it', cached.same,
        cached.n + ' elements, cached');

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — the Scrap Meadows lead, and nothing stands between the player and the fight');
})().catch(e => { console.error(e); process.exit(1); });
