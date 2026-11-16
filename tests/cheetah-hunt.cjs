// THE CHEETAHS HUNT LIKE CHEETAHS.
//
// The owner, 2026-11-15: "Inside the caves, those cheetahs are actually not
// moving in a good manner... look for how cheetahs move and then convert it
// into real movement."
//
// Filmed before: seven seconds of one in the long dark stood for 1.7 s, hopped
// 70 px, and stood for 2.7 s more — it owned a filmed walk and gallop and used
// neither. js/cheetahhunt.js is the animal: the creep that freezes under her
// eye, the sprint, the skid when it overshoots, the pant when it is spent, and
// a leaping cat that paces instead of standing.
//
//   A  WATCHED, it does not come: she faces it from stalking distance and it
//      holds where it is;
//   B  UNWATCHED, it creeps in — at a walk, not a run;
//   C  ...and its patience runs out: watched for long enough, it comes anyway;
//   D  inside sprinting distance it runs, more than twice its patrol speed;
//   E  flat out with her suddenly behind it, it SKIDS, back to her, before it
//      can turn;
//   F  nothing here shortens a warning: the coil is the crawler's own length,
//      and the winded window after the lunge is still at least half a second;
//   G  the leaping cat between leaps is moving more than it is standing, its
//      leap still starts from a crouch of the full length, and it never walks
//      off its floor;
//   H  none of it touches the wolves;
//   I  over a whole hunt it bites, backs up FACING HER, and comes again: on
//      its feet it never has its back to her (owner, 2026-11-16: "the predator
//      will be actually on guard, not turning its back to the prey"), and a
//      back-step runs its stride backwards;
//   J  the leaping cat keeps the same guard between leaps.
//
//   node tests/cheetah-hunt.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    console.log('── cheetah-hunt — the creep, the sprint, the skid, the pacing');
    const page = await (await browser.newContext({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1 }); startGame(sv);
      const stage = (kind) => { loadRoom('CV2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; const e = G.enemies.find(q => q.kind === kind); G.enemies = [e]; return e; };
      const put = (e, dx, face) => { player.x = e.x + dx; const g = groundColumnAt(player.x + 12); if (g) player.y = Math.min.apply(null, g) - player.h; player.vx = player.vy = 0; player.face = face; };
      // (the stride's phase is advanced by the pose pick, which the frame
      // makes when it draws: stepped without drawing, it is made here)
      const step = (each) => { if (each) each(); player.iT = 9; update(1 / 60); G.dialog = null; G.state = 'PLAY'; G.panels = null; G.toasts = [];
        for (const q of G.enemies) if (isCheetah(q)) wolfPose(q, CHEETAH_ART, false); };
      const out = {};
      // ---- A, C: watched ----
      let e = stage('crawler'); put(e, -420, 1);
      for (let i = 0; i < 12; i++) step(() => { player.face = 1; });
      let x0 = e.x; for (let i = 0; i < 72; i++) step(() => { player.face = 1; });
      out.watched = { moved: +Math.abs(e.x - x0).toFixed(1), hunt: !!e.hunt, patrol: e.spd };
      let came = -1; for (let i = 0; i < 200 && came < 0; i++) { step(() => { player.face = 1; }); if (Math.abs(e.x - x0) > 30) came = i + 84; }
      out.patience = { cameAt: came < 0 ? null : +(came / 60).toFixed(2), speed: Math.round(Math.abs(e.vx)) };
      // ---- B: unwatched ----
      e = stage('crawler'); put(e, -445, -1);
      for (let i = 0; i < 20; i++) step(() => { player.face = -1; });
      x0 = e.x; let vmax = 0; for (let i = 0; i < 80; i++) { step(() => { player.face = -1; }); vmax = Math.max(vmax, Math.abs(e.vx)); }
      out.creep = { closed: +Math.abs(e.x - x0).toFixed(1), top: Math.round(vmax), gap: Math.round(Math.abs(e.x - player.x)) };
      // ---- D: the sprint ----
      e = stage('crawler'); put(e, -235, -1); vmax = 0;
      for (let i = 0; i < 300; i++) { step(() => { player.face = -1; }); vmax = Math.max(vmax, Math.abs(e.vx)); if (e.coilT > 0) break; }
      out.sprint = { top: Math.round(vmax), patrol: e.spd };
      // ---- F: the tell and the opening, on that same run ----
      let coil = 0, winded = 0, lunged = false;
      for (let i = 0; i < 400 && !(lunged && winded > 0 && !(e.windedT > 0)); i++) { step(() => { player.face = -1; }); if (e.coilT > 0) coil++; if (e.lungeT > 0) lunged = true; if (e.windedT > 0) winded++; }
      out.tell = { coil: +(coil / 60).toFixed(2), want: TELL_FAST, winded: +(winded / 60).toFixed(2), lunged };
      // ---- E: the skid ----
      e = stage('crawler'); put(e, -235, -1); let moved = false, skid = 0, backTo = 0, after = null, dirAtSkid = 0;
      for (let i = 0; i < 320; i++) { step(() => { player.face = -1; if (!moved && Math.abs(e.vx) > 165) { moved = true; player.x = e.x + 130; } });
        if (e.skidT > 0) { skid++; if (!dirAtSkid) dirAtSkid = e.dir; if (Math.sign(player.x - e.x) !== e.dir) backTo++; }
        else if (skid && after == null) after = Math.sign(player.x - e.x) === e.dir; }
      out.skid = { moved, secs: +(skid / 60).toFixed(2), backTo: +(backTo / 60).toFixed(2), facesHerAfter: after };
      // ---- I: a whole hunt, twelve seconds, her back to it ----
      e = stage('crawler'); put(e, -380, -1);
      { let free = 0, stood = 0, lunges = 0, wasL = false, backs = 0, longest = 0, run = 0, turned = 0, slid = 0, ph = e._ph || 0, lx = e.x;
        for (let i = 0; i < 720; i++) { step(() => { player.face = -1; });
          const busy = e.coilT > 0 || e.lungeT > 0 || e.windedT > 0 || (e.skidT || 0) > 0;
          const toHer = Math.sign(player.x + player.w / 2 - e.x - e.w / 2) || 1, side = faceSide(e);
          if (e.lungeT > 0 && !wasL) lunges++; wasL = e.lungeT > 0;
          if (!busy) { free++;
            if (Math.abs(e.vx) < 6) { stood++; run++; longest = Math.max(longest, run); }
            else { run = 0;
              if (side !== toHer) turned++;                       // on its feet, moving, and its back to her
              if (Math.sign(e.vx) !== toHer) backs++;
              // (on the ground: a body dropping off a step as it backs away has no feet down to slide —
              // the stride holds in the air by the engine's own rule, and J below already sets the air aside.
              // The cat half as big again backs far enough to come off the shelf behind it.)
              if (e.on !== false && Math.sign(e.vx) !== side && Math.abs(e.x - lx) > 0.2 && !((e._ph || 0) < ph)) slid++; } }
          else run = 0;
          ph = e._ph || 0; lx = e.x; }
        out.whole = { lunges, standing: Math.round(stood / Math.max(1, free) * 100), longest: +(longest / 60).toFixed(2), gaveGround: +(backs / 60).toFixed(2), turned, slid }; }
      // ---- J: the leaping cat's guard ----
      e = stage('hopper'); put(e, -300, 1);
      { let moving = 0, away = 0, slid = 0, ph = e._ph || 0, lx = e.x;
        for (let i = 0; i < 600; i++) { step();
          const air = e.on === false || Math.abs(e.vy) > 60, toHer = Math.sign(player.x + player.w / 2 - e.x - e.w / 2) || 1;
          if (!air && !(e.crouchT > 0) && Math.abs(e.vx) > 6) { moving++; if (faceSide(e) !== toHer) away++; if (Math.sign(e.vx) !== faceSide(e) && Math.abs(e.x - lx) > 0.2 && !((e._ph || 0) < ph)) slid++; }
          ph = e._ph || 0; lx = e.x; }
        out.guard = { moving, away, slid }; }
      // ---- G: the leaping cat ----
      e = stage('hopper'); put(e, -300, 1);
      let ground = 0, still = 0, crouch = 0, leaps = 0, wasAir = false, minCrouch = 9, cr = 0, fell = false;
      for (let i = 0; i < 600; i++) { step();
        if (e.y > G.roomDef.h * TILE) fell = true;
        const air = e.on === false || Math.abs(e.vy) > 60;
        if (e.crouchT > 0) { cr++; } else if (cr) { minCrouch = Math.min(minCrouch, cr / 60); cr = 0; }
        if (air && !wasAir) leaps++; wasAir = air;
        if (!air && !(e.crouchT > 0) && !((e.landT || 0) > 0)) { ground++; if (Math.abs(e.vx) < 6) still++; } }
      out.hopper = { leaps, standing: Math.round(still / Math.max(1, ground) * 100), minCrouch: +minCrouch.toFixed(2), fell };
      // ---- H: a wolf is not a cat ----
      loadRoom('A2'); const w = G.enemies.find(q => q.kind === 'crawler');
      out.wolf = w ? { cat: catHunter(w), wolf: wolfHunter(w) } : null;
      // ---- K: the cats are half as big again (owner, 2026-11-16) — body, wall and picture
      { const kc = EKIND.crawler, sz = (q) => q ? [q.w, q.h] : null;
        const cat = (G.roomDef.zone, loadRoom('CV2'), new Enemy('crawler', 600, 300)), catH = new Enemy('hopper', 600, 300);
        const sb = solidBox(cat), wallCat = Math.round(sb.x1 - sb.x0);
        // a bound cat lies low: the picture of it is drawn from its own landing strip, not the warning plate
        out.size = { cat: sz(cat), hop: sz(catH), kind: [kc.w, kc.h], hopKind: [EKIND.hopper.w, EKIND.hopper.h], k: cat.sizeK, wolf: w ? [w.w, w.h, w.sizeK || 1] : null,
          wallCat, downArt: CHEETAH_ART.down && CHEETAH_ART.down.img, warnArt: CHEETAH_ART.coil.img }; }
      out.T = CAT_HUNT;
      return out;
    });
    const T = R.T;
    check('A  watched from stalking distance, it holds where it is', R.watched.hunt && R.watched.moved <= 6, 'moved ' + R.watched.moved + ' px in 1.2 s under her eye');
    check('C  ...and its patience runs out: it comes anyway', R.patience.cameAt != null && R.patience.cameAt >= T.patience - 0.3 && R.patience.cameAt <= T.patience + 2.2, 'came after ' + R.patience.cameAt + ' s (patience ' + T.patience + ' s)');
    check('B  unwatched, it creeps in — a walk, not a run', R.creep.closed >= 40 && R.creep.top <= 95, 'closed ' + R.creep.closed + ' px in 1.3 s, never faster than ' + R.creep.top + ' px/s');
    check('D  inside sprinting distance it runs, more than twice its patrol speed', R.sprint.top >= R.sprint.patrol * 2, R.sprint.top + ' px/s against a patrol of ' + Math.round(R.sprint.patrol));
    check('E  flat out with her suddenly behind it, it skids before it can turn', R.skid.moved && R.skid.secs >= T.skid - 0.06, R.skid.secs + ' s');
    check('E  ...with its back to her the whole time, and comes round after', R.skid.backTo >= R.skid.secs - 0.05 && R.skid.facesHerAfter === true, 'back to her for ' + R.skid.backTo + ' s');
    check('F  the coil is the crawler\'s own length — no warning is shortened', R.tell.lunged && R.tell.coil >= R.tell.want - 0.04, R.tell.coil + ' s (TELL_FAST ' + R.tell.want + ')');
    check('F  ...and the winded window after the lunge is still at least half a second', R.tell.winded >= 0.48, R.tell.winded + ' s');
    check('I  over a whole hunt it bites again and again, and backs up between bites', R.whole.lunges >= 2 && R.whole.gaveGround >= 0.5, R.whole.lunges + ' lunges in 12 s, ' + R.whole.gaveGround + ' s spent backing up');
    check('I  ...ON GUARD: on its feet and moving, it never has its back to her', R.whole.turned === 0, R.whole.turned + ' frames walking with its back to her');
    check('I  ...and a back-step is a back-step: its stride runs backwards, never a slide', R.whole.slid <= 2, R.whole.slid + ' sliding frames (a frame at a turn is not a slide)');
    check('I  ...and it is not a statue: free, it is moving more than it stands', R.whole.standing <= 55 && R.whole.longest <= 1.7, 'standing ' + R.whole.standing + '% of its free time, never longer than ' + R.whole.longest + ' s at a stretch');
    check('J  the leaping cat is on guard too: moving between leaps, face to her, no slide', R.guard.moving >= 30 && R.guard.away === 0 && R.guard.slid <= 2, R.guard.moving + ' moving frames, ' + R.guard.away + ' with its back to her, ' + R.guard.slid + ' sliding');
    check('G  the leaping cat paces between leaps (it stood for all of it before)', R.hopper.leaps >= 2 && R.hopper.standing <= 70, 'standing still ' + R.hopper.standing + '% of its time on the ground, ' + R.hopper.leaps + ' leaps in 10 s');
    check('G  ...its leap still starts from the full crouch, and it never leaves its floor', R.hopper.minCrouch >= R.tell.want - 0.04 && !R.hopper.fell, 'shortest crouch ' + R.hopper.minCrouch + ' s');
    check('H  none of it touches the wolves', !!R.wolf && !R.wolf.cat && R.wolf.wolf, JSON.stringify(R.wolf));
    { const S2 = R.size || {};
      check('K  a cave cat is half as big again as the kind it is built on — and a wolf is not', !!S2.cat && S2.k === 1.5
        && S2.cat[0] === Math.round(S2.kind[0] * 1.5) && S2.cat[1] === Math.round(S2.kind[1] * 1.5) && S2.hop[1] === Math.round(S2.hopKind[1] * 1.5)
        && S2.wolf && S2.wolf[0] === S2.kind[0] && S2.wolf[2] === 1, JSON.stringify(S2));
      check('K  ...the wall round it grew with it (wider than its own hurt box)', S2.wallCat > S2.cat[0] + 20, S2.wallCat + ' px against a ' + (S2.cat || [])[0] + ' px box');
      check('K  ...and bound, it lies low on its own landing, not standing on the warning plate', !!S2.downArt && S2.downArt !== S2.warnArt, S2.downArt + ' / ' + S2.warnArt); }
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\ncheetah-hunt: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
