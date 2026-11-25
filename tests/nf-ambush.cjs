// NULLFANG'S AMBUSH FROM THE LEAVES (owner, 2026-11-25: "zoom out in the fight to give it more
// room and space and create structures like ... banana leaves ... converted into metallic ... a
// place where the lion goes inside and hide and then comes attacking ... the indication of the
// place it comes from is by watching the leaves moves in the place that is coming from to
// attack. Usually that happens wherever I'm standing. So it gives me a split of second to move
// away from its attack"). js/nullfang-duel.js NF_AMB, js/nfcover.js. Drives the real build:
//   - the fight frames wider than any other (the camera eases out, never cuts, and back after);
//   - the arena has metal leaf cover standing ON the ground, drawn at full strength, and more
//     of it behind the level;
//   - he goes into a clump and is then not drawn, not a target, has no body to walk into, and
//     takes no damage — and only for a bounded time;
//   - the clump that shakes is the one nearest her, it shakes >= 0.40 s before he strikes, and
//     the strike leaves from that clump;
//   - standing still at it is punished; a player who reads it (a human's 250 ms, then running
//     from the clump) is not hit, from every clump;
//   - the burst hurts with the body that is drawn (re-measured off the art);
//   - THE BURST IS DRAWN AS ONE (owner, 2026-11-25: "use whatever art we have to create whatever
//     missing from Nilfang. Burst art"): the clump opens round his forequarters as he breaks out,
//     the leaf tips he goes through are torn off and thrown the way he went (on the scenery's own
//     dice), they come down and are gone in seconds; and going in, he goes DOWN into the leaves —
//     never a fade;
//   - an opening follows it; the move comes in a real fight, and so does the perch dive;
//   - no page errors.
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info != null ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) fails.push(name); };
  const p = await br.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:' + PORT + '/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await p.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, nfMeet: 1, woke: 1 }); startGame(sv);
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^beastStudio|^cover/.test(k))) mediaFetch(k, true);
    for (let i = 0; i < 300 && !['beastStudioLeap', 'coverClumpA', 'coverClumpB', 'coverLeaf0', 'coverLeaf3'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    let T = performance.now();
    const loop = (n, each) => { for (let i = 0; i < n; i++) { T += 1000 / 60; mainLoop(T); each && each(i); } };
    // ---- 1. THE CAMERA: the real loop, from exploration into his fight and out of it
    loadRoom('A4'); G.state = 'PLAY'; G.dialog = null;
    const bo = G.boss; bo.meet = false;
    player.x = 14 * TILE; player.y = 14 * TILE - player.h;
    bo.st = 'dorm';
    const hold = () => { player.iT = 99; player.hp = 999; player.dead = false; };
    loop(60, hold);
    out.zExplore = +cam.zoom.toFixed(3);
    bo.st = 'idle'; bo.t = 0.3;
    let zMin = 9, zMax = 0, dzMax = 0, zPrev = cam.zoom;
    loop(240, () => { hold(); zMin = Math.min(zMin, cam.zoom); zMax = Math.max(zMax, cam.zoom); dzMax = Math.max(dzMax, Math.abs(cam.zoom - zPrev)); zPrev = cam.zoom; });
    out.zFight = { min: +zMin.toFixed(3), now: +cam.zoom.toFixed(3), dzMax: +dzMax.toFixed(4) };
    // the encounter camera every other guardian gets, for the same two bodies
    { const keepOn = window.nfCamZoom; window.nfCamZoom = () => 0; let zz = 0; loop(120, () => { hold(); zz = cam.zoom; }); out.zOther = +zz.toFixed(3); window.nfCamZoom = keepOn; loop(60, hold); }
    // ---- 2. THE COVER
    const L = nfCoverList();
    out.cover = L.map(cl => {
      let lo = 1e9, hi = -1e9;
      for (let x = cl.x - cl.w * 0.3; x <= cl.x + cl.w * 0.3; x += 8) { const g = nfCoverGround(x); lo = Math.min(lo, g); hi = Math.max(hi, g); }
      return { x: Math.round(cl.x), gy: Math.round(cl.gy), lo: Math.round(lo), hi: Math.round(hi), w: Math.round(cl.w), h: Math.round(cl.h), leaves: cl.leaves.length };
    });
    out.back = NFC.back.length;
    // drawn at full strength: every draw of the front pass at alpha 1, no filter, art present
    { const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 700; const q = cv.getContext('2d');
      const D = q.drawImage.bind(q); let n = 0, faded = 0, filt = 0;
      q.drawImage = function () { n++; if (q.globalAlpha < 0.999) faded++; if (q.filter && q.filter !== 'none') filt++; return D.apply(q, arguments); };
      nfCoverDrawFront(q); out.front = { draws: n, faded, filt }; }
    // ---- 3. THE AMBUSH, forced, from each clump: her standing still at it, and her reading it
    const hurts = []; const PH = player.hurt.bind(player);
    player.hurt = function (d, x, src) { hurts.push(String(src || '')); return PH.apply(this, arguments); };
    const run = (k, react) => {
      const cl = L[k]; G.enemies = []; G.projs = [];
      // she stands beside clump k, a body-length off its middle, on the open side
      const side = cl.x < G.roomDef.w * TILE / 2 ? 1 : -1;
      const hx = cl.x + side * 70;
      player.x = hx - player.w / 2; player.y = nfCoverGround(hx) - player.h - 1; player.vx = 0; player.vy = 0; player.dead = false; player.hp = player.hpMax || 99;
      // he starts a stride from the clump nearest... himself, which need not be hers
      const from = L[(k + 1) % L.length];
      bo.x = from.x + 160 * (from.x < cl.x ? 1 : -1) - bo.w / 2; bo.y = nfCoverGround(bo.cx()) - bo.h; bo.vx = bo.vy = 0;
      bo.st = 'stalk'; bo.t = 0.4; bo.coverCD = 0; bo.ambushCD = 99; bo.hp = bo.hpMax; bo.stagT = 0; bo.faceVis = bo.face;
      const r = { k, seq: [], hidden: 0, hiddenMax: 0, run: 0, targeted: 0, bodyHurt: 0, dmg: 0, tell: 0, tellAt: null, from: null, at: null, hurtBy: [], landOpen: 0, frames: 0 };
      hurts.length = 0;
      let st0 = '', runT = 0, hidT = 0;
      for (let f = 0; f < 60 * 8; f++) {
        // she reacts 250 ms after the leaves start to shake: away from that clump, the length of the room
        if (react && bo.st === 'lurkwarn' && bo.coverAt != null) {
          runT += 1 / 60;
          if (runT > 0.25) { const c2 = L[bo.coverAt]; const away = (player.x + player.w / 2) >= c2.x ? 1 : -1; keys[away > 0 ? 'ArrowRight' : 'ArrowLeft'] = 1; keys[away > 0 ? 'ArrowLeft' : 'ArrowRight'] = 0; }
        } else if (react && /lurkpounce/.test(bo.st)) { /* keep running */ }
        else { keys.ArrowLeft = keys.ArrowRight = 0; }
        if (!react) { player.vx = 0; }
        // open to the first blow of the ambush, and only that one: what hits her first is the answer
        player.iT = /lurk|cover/.test(bo.st) && !hurts.length ? 0 : 99; player.hp = 999; player.dead = false;
        T += 1000 / 60; mainLoop(T);
        const st = bo.st;
        if (st !== st0) { r.seq.push(st); st0 = st;
          if (st === 'lurkwarn') { r.at = bo.coverAt; r.nearest = L.reduce((a, c, i) => Math.abs(c.x - (player.x + player.w / 2)) < Math.abs(L[a].x - (player.x + player.w / 2)) ? i : a, 0); }
          if (st === 'lurkpounce') r.from = Math.round(Math.abs(bo.cx() - L[bo.coverAt].x)); }
        if (nfHidden(bo)) {
          hidT += 1 / 60; r.hidden++; r.hiddenMax = Math.max(r.hiddenMax, hidT);
          // not a target, takes nothing, has no body: a cut into him from point blank lands on nothing
          const hp0 = bo.hp; const d = dealDmg(bo, 40, null, bo.cx(), bo.cy(), true, 'test'); if (d > 0 || bo.hp < hp0) r.dmg++; bo.hp = hp0;
          if (typeof solidResolve === 'function' && bodySolid(bo)) r.targeted++;
        } else hidT = 0;
        if (st === 'lurkwarn') r.tell += 1 / 60;
        if (st === 'lurkland') { r.landOpen += 1 / 60; if (bo.hideK !== 1) r.landOpen = -99; }
        if (r.seq.length > 1 && !/cover|lurk/.test(st)) { r.frames = f; break; }
      }
      keys.ArrowLeft = keys.ArrowRight = 0;
      r.hurtBy = hurts.slice();
      r.tell = +r.tell.toFixed(2); r.hiddenMax = +r.hiddenMax.toFixed(2); r.landOpen = +r.landOpen.toFixed(2);
      return r;
    };
    // (the room's doors shut while this runs: a burst that throws her off the west seam would
    // carry the test into the next room)
    const exits0 = G.roomDef.exits; G.roomDef.exits = {};
    out.still = L.map((_, k) => run(k, false));
    // a hidden body she walks into: none of it hurts
    { const cl = L[1]; bo.x = cl.x - bo.w / 2; bo.y = cl.gy - bo.h; nfEnter(bo, 'lurk', 5); bo.coverAt = 1; bo.coverFade = 0;
      player.x = bo.x + 10; player.y = bo.y + bo.h - player.h; hurts.length = 0;
      for (let f = 0; f < 20; f++) { player.iT = 0; player.x = bo.x + 10; bo.update(1 / 60); if (!nfHidden(bo)) break; }
      out.walkIn = hurts.slice(); }
    out.read = L.map((_, k) => run(k, true));
    G.roomDef.exits = exits0;
    player.hurt = PH;
    // ---- 4. THE BURST'S BOX IS ITS DRAWN BODY
    nfMeasureLeapBox(); await new Promise(r => setTimeout(r, 1500));   // a loaded sheet is not a decoded one (js/media.js)
    out.leapNow = nfMeasureLeapBox(); out.leapTable = NF_LEAP_BOX;
    // ---- 4b. THE BURST, DRAWN: the clump opens round him, torn leaves fly his way; going in is not a fade
    { const cl = L[1]; G.enemies = []; NFC.torn.length = 0;
      const side = cl.x < G.roomDef.w * TILE / 2 ? 1 : -1, hx = cl.x + side * 120;
      player.x = hx - player.w / 2; player.y = nfCoverGround(hx) - player.h - 1;
      bo.x = cl.x - bo.w / 2; bo.y = cl.gy - bo.h; bo.coverAt = 1; bo.coverFade = 0; nfEnter(bo, 'lurkwarn', 0.02);
      const R0 = Math.random; let rnd = 0; Math.random = function () { rnd++; return R0(); };
      const OD = window.nfCoverDrawOpen; let opened = 0; window.nfCoverDrawOpen = function () { opened++; return OD.apply(this, arguments); };
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const q = cv.getContext('2d');
      let torn = 0, dirOk = 0, f0 = 0;
      for (let f = 0; f < 60 * 4; f++) {
        hold(); T += 1000 / 60; mainLoop(T);
        if (bo.st === 'lurkpounce' && !f0) { f0 = f; rnd = 0; }
        q.setTransform(1, 0, 0, 1, 0, 0); q.translate(-camSX(), -camSY());
        const n0 = NFC.torn.length; nfCoverDrawFront(q);
        if (f0 && f === f0 + 1) { torn = NFC.torn.length; const face = bo.face || 1; dirOk = NFC.torn.filter(t => Math.sign(t.vx) === face).length; }
      }
      window.nfCoverDrawOpen = OD;
      const rndInTear = (() => { let k = 0; Math.random = function () { k++; return R0(); }; nfCoverTear(cl, 1); Math.random = R0; return k; })();
      Math.random = R0; NFC.torn.length = 0;
      out.burstArt = { opened, torn, dirOk, left: NFC.torn.length, rndInTear };
      // going in: the body at the start of its drop is drawn at full strength, and lower than it stands
      const draws = (fade) => { bo.st = 'lurk'; bo.coverAt = 1; bo.x = cl.x - bo.w / 2; bo.y = cl.gy - bo.h; bo.coverFade = fade;
        const D = q.drawImage.bind(q); let big = null;
        q.drawImage = function () { const n = arguments.length, w = arguments[n - 2], h = arguments[n - 1]; if (!big || w * h > big.a) big = { a: w * h, alpha: q.globalAlpha, y: q.getTransform().f + (n >= 9 ? arguments[6] : arguments[2]) * q.getTransform().d }; return D.apply(q, arguments); };
        q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, 960, 540); q.translate(480 - bo.cx(), 400 - (bo.y + bo.h)); bo.draw(q); q.drawImage = D; return big; };
      const a = draws(NF_AMB.fade * 0.99), b = draws(NF_AMB.fade * 0.2);
      out.goIn = { start: a && +a.alpha.toFixed(2), late: b && +b.alpha.toFixed(2), drop: a && b ? Math.round(b.y - a.y) : null };
      nfEnter(bo, 'idle', 0.3); bo.coverAt = null; bo.coverFade = 0; }
    // ---- 5. IN A REAL FIGHT: she holds 250 px off him for 100 s; the leaves and the perch both come
    { bo.st = 'idle'; bo.t = 0.3; bo.ambushCD = null; bo.coverCD = null; bo.hp = bo.hpMax; const seen = {};
      for (let f = 0; f < 60 * 100; f++) { hold(); const d = player.x + player.w / 2 - bo.cx(); if (Math.abs(d) < 220 || Math.abs(d) > 300) { const want = bo.cx() + (d >= 0 ? 260 : -260); player.x = clamp(want, 40, G.roomDef.w * TILE - 60) - player.w / 2; }
        bo.update(1 / 60); seen[bo.st] = (seen[bo.st] || 0) + 1; }
      out.natural = { lurkwarn: !!seen.lurkwarn, springwarn: !!seen.springwarn, lurkpounce: !!seen.lurkpounce }; }
    return out;
  });
  check('the fight frames wider than the exploration camera', R.zFight.now <= 1.001 && R.zFight.now < R.zExplore - 0.3, { explore: R.zExplore, fight: R.zFight });
  check('...and wider than the camera every other guardian gets', R.zFight.now < R.zOther - 0.03, { nullfang: R.zFight.now, other: R.zOther });
  check('...never so far out she is lost on a phone (>= 0.85)', R.zFight.min >= 0.85, R.zFight);
  check('...and it eases there, it never cuts (under 0.05 a frame: the camera\'s own ease)', R.zFight.dzMax < 0.05, R.zFight);
  check('the arena has three clumps of metal leaves, each with its leaves', R.cover.length >= 3 && R.cover.every(c => c.leaves >= 3), R.cover);
  check('...each stands ON the ground: its foot on the ground under it, never floating, never sunk', R.cover.every(c => c.gy >= c.hi - 1 && c.gy - c.lo <= 26), R.cover.map(c => [c.x, c.gy, c.lo, c.hi]));
  check('...drawn at full strength (no fade, no filter), the art present', R.front.draws > 40 && R.front.faded === 0 && R.front.filt === 0, R.front);
  check('...and more of them in the meadow behind the level', R.back >= 2, R.back);
  for (const [name, list] of [['standing still', R.still], ['reading it', R.read]]) for (const r of list) {
    const tag = '[' + name + ', clump ' + r.k + '] ';
    check(tag + 'he goes in, hides, shakes the leaves, bursts out, lands', ['coverwarn', 'coverin', 'lurk', 'lurkwarn', 'lurkpounce', 'lurkland'].every(s => r.seq.includes(s)), r.seq);
    check(tag + 'the clump that shakes is the one nearest her', r.at === r.nearest && r.at === r.k, { shook: r.at, nearest: r.nearest, hers: r.k });
    check(tag + 'it shakes >= 0.40 s before he strikes', r.tell >= 0.40, r.tell);
    check(tag + 'the strike leaves from that clump', r.from != null && r.from <= 30, r.from);
    check(tag + 'hidden, he is not a target and takes nothing', r.hidden > 0 && r.dmg === 0 && r.targeted === 0, { frames: r.hidden, dmg: r.dmg, solid: r.targeted });
    check(tag + 'hidden for a bounded time (<= 1.6 s)', r.hiddenMax > 0.3 && r.hiddenMax <= 1.6, r.hiddenMax);
    check(tag + 'the landing is an opening (whole hide, >= 0.25 s)', r.landOpen >= 0.25, r.landOpen);
  }
  check('standing still at the shaking clump is punished, from every clump', R.still.every(r => r.hurtBy.some(s => /ambush/.test(s))), R.still.map(r => r.hurtBy));
  check('a player who reads it (250 ms, then runs from the clump) is not hit, from every clump', R.read.every(r => !r.hurtBy.some(s => /ambush|body/.test(s))), R.read.map(r => r.hurtBy));
  check('walking into the clump he hides in hurts no one (no body there)', R.walkIn.length === 0, R.walkIn);
  const leapOk = R.leapNow && R.leapNow.length === R.leapTable.length && R.leapNow.every((q, i) => q && q.every((v, j) => Math.abs(v - R.leapTable[i][j]) <= 6));
  check('the burst hurts with the body that is drawn (NF_LEAP_BOX re-measured off the art)', leapOk, leapOk ? null : { now: R.leapNow, table: R.leapTable });
  const BA = R.burstArt;
  check('the burst is drawn as one: the clump opens round him as he breaks out', BA.opened >= 5, BA);
  check('...the leaf tips he goes through are torn off and thrown the way he went', BA.torn >= 6 && BA.dirOk >= BA.torn * 0.8, BA);
  check('...they come down and are gone within seconds, and they draw on their own dice', BA.left === 0 && BA.rndInTear === 0, BA);
  check('going in, he goes DOWN into the leaves at full strength, never a fade', R.goIn.start === 1 && R.goIn.late === 1 && R.goIn.drop >= 20, R.goIn);
  check('in a real fight the ambush comes, and the perch dive still does', R.natural.lurkwarn && R.natural.lurkpounce && R.natural.springwarn, R.natural);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await br.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.length); process.exit(1); }
  console.log('\nall passed');
})();
