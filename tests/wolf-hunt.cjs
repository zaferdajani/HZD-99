// THE PACK HUNTS (owner, 2026-11-15: "the micro enemies need to attack in a
// better way, move in a better way, especially the wolves ... find wolves, see
// how they move, how they attack, how they roll ... concentrate on the
// aggressive attacking moods of the wolf").
//
// js/wolfhunt.js gave a pack wolf a hunt: it notices her, shows its teeth,
// charges, stalks in to the distance its lunge really covers, bites from
// there, holds and thrashes a bite that lands, and goes over its back when
// her heavy blow throws it. This drives ONE wolf through all of it in the
// real build and measures each claim — and the things that must NOT have
// changed: the length of the tell, the length of the opening, and every
// machine that is not a wolf.
//
//   node tests/wolf-hunt.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── wolf-hunt — the notice, the charge, the stalk, the bite, the thrash, the roll');

    // ---- 0. THE ART -------------------------------------------------------
    const art = await page.evaluate(async () => {
      const keys = ['wolfSnarl8', 'wolfLunge6', 'wolfThrash8', 'wolfBay6', 'wolfRoll12', 'wolfStalk10', 'wolfCharge8'];
      const out = [];
      for (const k of keys) {
        const src = MEDIA_SRC.images[k]; if (!src) { out.push({ k, err: 'not in the manifest' }); continue; }
        const im = new Image();
        const ok = await new Promise(r => { im.onload = () => r(1); im.onerror = () => r(0); im.src = src; });
        // the standing wolf's body height in a cell, from the alpha channel
        const cells = +k.match(/\d+$/)[0], cw = im.naturalWidth / cells;
        const cv = document.createElement('canvas'); cv.width = im.naturalWidth; cv.height = im.naturalHeight;
        const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
        const d = x.getImageData(0, 0, cv.width, cv.height).data;
        let empty = 0; const hs = [];
        for (let c = 0; c < cells; c++) {
          let y0 = 1e9, y1 = -1, n = 0;
          for (let yy = 0; yy < cv.height; yy++) for (let xx = Math.floor(c * cw); xx < Math.floor((c + 1) * cw); xx++)
            if (d[(yy * cv.width + xx) * 4 + 3] > 128) { n++; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
          if (n < 400) empty++; hs.push(y1 - y0 + 1);
        }
        out.push({ k, ok: !!ok, cells, cw: Math.round(cw), ch: im.naturalHeight, empty, hs, wholeCells: Math.abs(cw - Math.round(cw)) < 1e-6,
          art: Object.values(WOLF_ART).find(a => a.img === k) || null, eyes: (window.EYES || window.EYE_MAP || {})[k] ? 1 : 0 });
      }
      return out;
    });
    const bad = art.filter(a => a.err || !a.ok || a.empty || !a.wholeCells);
    check('the seven new strips are declared, decode, and every cell holds a wolf', bad.length === 0, bad.map(a => a.k + (a.err ? ' ' + a.err : a.empty ? ' ' + a.empty + ' empty cells' : ' bad')).join('; ') || art.map(a => a.k + ' ' + a.cells + '×' + a.cw + '×' + a.ch).join(', '));
    const tabled = art.filter(a => !a.art || a.art.cells !== a.cells || Math.abs(a.art.k - a.ch * 0.0195) > 1e-6);
    check('...and each is drawn by WOLF_ART at the cell count and height it was cut at', tabled.length === 0, tabled.map(a => a.k).join(', ') || 'k = ch × 0.0195 for all seven');
    // one scale: the standing wolf of the snarl's first cell is the standing wolf of the first set (124 px ± 6)
    const stand = art.find(a => a.k === 'wolfSnarl8');
    check('the new set is the same SIZE of wolf as the first one', stand && Math.abs(stand.hs[0] - 121) <= 8, stand ? 'standing body ' + stand.hs[0] + ' px in the cell (the first set stands 121-125)' : '');

    // ---- the stage ---------------------------------------------------------
    const stage = `
      window.requestAnimationFrame = () => 0;
      let s = 0x1234abcd; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv); loadRoom('A1');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = null; G.toasts = [];
      const e = G.enemies.find(e => e.kind === 'crawler' && isWolf(e)); G.enemies = [e];
      const floorY = e.y + e.h;
      const heard = []; const sfxWas = sfx; sfx = (n) => { heard.push(n); };
      const put = (dx) => { player.x = e.x + e.w / 2 + dx - player.w / 2; player.y = floorY - player.h; player.vx = player.vy = 0; };
      const gap = () => Math.abs(player.x + player.w / 2 - e.x - e.w / 2);
      const pose = () => wolfPose(e, WOLF_ART, false);
    `;

    // ---- A-D. one whole hunt against a girl who stands still ------------------
    const H = await page.evaluate(new Function(`return (async () => { ${stage}
      // far away first: it walks its beat and does not know she is there
      put(-520); e.atkCD = 0; let beat = 0, beatHunt = 0;
      for (let i = 0; i < 60; i++) { update(1 / 60); beat++; if (e.hunt) beatHunt++; }
      put(-250); player.iT = 0;
      const T = { snarl: 0, snarlPose: 0, coilInSnarl: 0, run: 0, walk: 0, runMax: 0, stalkMax: 0, coilAt: null, coilLen: 0, lunge: 0, bit: false, thrash: 0, thrashPose: 0,
        winded: 0, bay: 0, snaps: 0, poses: {}, order: [] };
      let was = '', cores0 = player.cores, coilRun = 0, xHit = null, sideHit = 0, stopped = null, far = 0;
      for (let i = 0; i < 60 * 7; i++) {
        const c0 = player.cores;
        update(1 / 60); G.hitStop = 0;
        const p = pose().replace(/[AB]$/, ''); T.poses[p] = (T.poses[p] || 0) + 1;
        if (p !== was) { T.order.push(p); was = p; }
        if (e.snarlT > 0) { T.snarl++; if (p === 'snarl') T.snarlPose++; if (e.coilT > 0) T.coilInSnarl++; }
        if (p === 'run') { T.run++; T.runMax = Math.max(T.runMax, Math.abs(e.vx)); }
        if (p === 'walk') { T.walk++; T.stalkMax = Math.max(T.stalkMax, Math.abs(e.vx)); }
        if (e.coilT > 0) { if (T.coilAt == null) T.coilAt = gap(); coilRun++; } else if (coilRun) { T.coilLen = Math.max(T.coilLen, coilRun); coilRun = 0; }
        if (e.lungeT > 0) T.lunge++;
        if (player.cores < c0 && !T.bit) { T.bit = true; xHit = player.x; sideHit = Math.sign(player.x + player.w / 2 - e.x - e.w / 2); stopped = { lungeT: e.lungeT, vx: e.vx, windedT: e.windedT }; }
        if (xHit != null) far = Math.max(far, (player.x - xHit) * sideHit);
        if (e.thrashT > 0) { T.thrash++; if (p === 'thrash') T.thrashPose++; }
        if (e.windedT > 0) T.winded++;
        if (p === 'bay' || p === 'snap') T.bay++;
        if (T.bit && e.windedT <= 0 && T.bay > 90) break;
      }
      sfx = sfxWas;
      return { T, heard: heard.filter((n, i) => heard.indexOf(n) === i), reach: wolfReach(e), spd: e.spd, beatHunt, cored: cores0 - player.cores,
        thrown: xHit == null ? null : far, sideNow: Math.sign(player.x + player.w / 2 - e.x - e.w / 2), sideHit, stopped, facing: faceSide(e),
        TELL_FAST, snapN: heard.filter(n => n === 'wolf_snap').length };
    })()`));
    const T = H.T;
    check('out of sight it walks its beat', H.beatHunt === 0);
    check('A. it NOTICES her: half a second of threat display, with its voice', T.snarl >= 27 && T.snarl <= 33 && T.snarlPose >= T.snarl - 2 && H.heard.includes('wolf_snarl'), T.snarl + ' frames, ' + T.snarlPose + ' in the snarl pose; heard ' + H.heard.join(','));
    check('   ...and nothing arms through the display', T.coilInSnarl === 0);
    check('B. it CHARGES from far off, at a run', T.run >= 12 && T.runMax > 95 && T.runMax <= H.spd * 2.7 + 1, T.run + ' frames, top ' + T.runMax.toFixed(0) + ' px/s (patrol ' + H.spd.toFixed(0) + ')');
    check('   ...and STALKS the last of it, slower than the charge', T.walk >= 6 && T.stalkMax < T.runMax, T.walk + ' frames at up to ' + T.stalkMax.toFixed(0) + ' px/s');
    check('C. it coils from the distance its lunge covers, not from 160 px', T.coilAt != null && T.coilAt <= H.reach + 1 && T.coilAt >= H.reach - 34, 'coiled at ' + (T.coilAt == null ? 'never' : T.coilAt.toFixed(0)) + ' px; reach ' + H.reach.toFixed(0));
    check('   ...the tell is exactly as long as it always was', Math.abs(T.coilLen / 60 - H.TELL_FAST) <= 0.035, (T.coilLen / 60).toFixed(3) + ' s (TELL_FAST ' + H.TELL_FAST + ')');
    check('   ...and the bite LANDS on a girl who stands still', T.bit && H.cored === 1, H.cored + ' core');
    check('D. a bite that lands stops it there', !!H.stopped && H.stopped.lungeT <= 0 && Math.abs(H.stopped.vx) < 1 && H.stopped.windedT >= 0.5, JSON.stringify(H.stopped));
    check('   ...is held and thrashed, with the sound of it', T.thrash >= 20 && T.thrash <= 28 && T.thrashPose >= T.thrash - 2 && H.heard.includes('wolf_bite'), T.thrash + ' frames (' + T.thrashPose + ' in the pose)');
    check('   ...she is thrown clear IN FRONT of it, and it is still facing her', H.thrown >= 30 && H.sideNow === H.sideHit && H.facing === H.sideNow, 'thrown ' + (H.thrown == null ? '-' : H.thrown.toFixed(0)) + ' px; she is on side ' + H.sideNow + ', it faces ' + H.facing);
    check('   ...and the opening is the one the lunge always paid', T.winded >= 30 && T.winded <= 47, (T.winded / 60).toFixed(2) + ' s winded (0.5-0.75)');
    check('E. between bites it holds her AT BAY, and snaps at the air', T.bay >= 60 && H.snapN >= 1, T.bay + ' frames at bay, ' + H.snapN + ' snaps; states: ' + T.order.join(' > '));

    // ---- F. she leaves: it gives the hunt up -----------------------------------
    const L = await page.evaluate(new Function(`return (async () => { ${stage}
      put(-200); player.iT = 9; e.atkCD = 9;
      for (let i = 0; i < 50; i++) { player.iT = 9; update(1 / 60); }
      const hunting = e.hunt;
      // she is gone: held far above its sight
      let gave = -1;
      for (let i = 0; i < 60 * 5; i++) { player.x = e.x; player.y = floorY - 400; player.vx = player.vy = 0; player.iT = 9; update(1 / 60); if (!e.hunt && gave < 0) gave = i; }
      sfx = sfxWas;
      return { hunting, gave: gave / 60, loseT: WOLF_HUNT.loseT };
    })()`));
    check('F. when she is gone it gives the hunt up, after a beat', L.hunting === 1 && L.gave >= L.loseT - 0.1 && L.gave <= L.loseT + 0.6, 'hunting ' + L.hunting + ', gave up after ' + L.gave.toFixed(2) + ' s (' + L.loseT + ')');

    // ---- G. it will not walk off its floor after her -----------------------------
    const E = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv);
      const sfxWas = sfx; sfx = () => {};
      // a pack wolf standing on a floor that ENDS: walk its own probe along the floor of every room it lives in
      let found = null;
      for (const id of Object.keys(ROOMS)) { if (!/^[AB]\d/.test(id) || found) continue; loadRoom(id);
        // let them settle onto their floors first, with her nowhere near
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = null;
        for (let i = 0; i < 40; i++) { player.iT = 9; player.y = -400; player.vy = 0; update(1 / 60); }
        for (const e of G.enemies.filter(e => e.kind === 'crawler' && isWolf(e) && e.on !== false && !e.dead)) {
          const probe = { x: e.x, y: e.y, w: e.w, h: e.h };
          for (const dir of [-1, 1]) { probe.x = e.x;
            for (let i = 0; i < 300 && !found; i++) {
              if (probe.x < 40 || probe.x > G.roomDef.w * TILE - 40 - e.w) break;
              const c = moveEnt({ x: probe.x, y: probe.y, w: probe.w, h: probe.h, vx: dir * 240, vy: 0 }, 1 / 60); if (c && (c.l || c.r)) break;
              if (!groundAhead(probe, dir)) { found = { id, e, x: probe.x, dir }; break; }
              probe.x += dir * 4; }
            if (found) break; }
          if (found) break; } }
      if (!found) { sfx = sfxWas; return { edge: null }; }
      const e = found.e, edge = { x: found.x, dir: found.dir, id: found.id }; G.enemies = [e];
      const floorY = e.y + e.h, pose = () => wolfPose(e, WOLF_ART, false);
      e.x = edge.x - edge.dir * 30; e.vx = 0; e.atkCD = 9; e.dir = edge.dir;
      let off = 0, bay = 0, spun = 0, lastDir = e.dir;
      for (let i = 0; i < 60 * 4; i++) {
        // she hangs in the air past the edge, level with it
        player.x = edge.x + edge.dir * 120; player.y = floorY - player.h; player.vx = player.vy = 0; player.iT = 9;
        update(1 / 60);
        if (e.y + e.h > floorY + 6) off++;
        if (i > 60 && /bay|snap/.test(pose())) bay++;
        if (e.dir !== lastDir) { spun++; lastDir = e.dir; }
      }
      sfx = sfxWas;
      return { edge, off, bay, spun, hold: !!e.huntHold, dx: (e.x - edge.x) * edge.dir };
    });
    if (!E.edge) check('G. (no pack wolf stands on a floor that ends: nothing to test the edge at)', true, 'skipped');
    else check('G. at the edge of its floor it stops and holds her at bay — it does not walk off, or spin', E.off === 0 && E.hold && E.bay >= 120 && E.spun <= 1 && E.dx <= 2, E.edge.id + ': frames off the floor ' + E.off + ', at bay ' + E.bay + ', turned ' + E.spun + '×, ' + E.dx.toFixed(0) + ' px past the edge');

    // ---- H. the roll -------------------------------------------------------------
    const R = await page.evaluate(new Function(`return (async () => { ${stage}
      const out = {};
      put(-60); player.iT = 9; e.atkCD = 9;
      for (let i = 0; i < 40; i++) { player.iT = 9; update(1 / 60); }
      // a light blow does not roll it
      attackKnock(e, 'slash', 1, 0); update(1 / 60);
      out.light = e.rollT > 0; out.lightV = Math.abs(e.vx);
      for (let i = 0; i < 50; i++) { player.iT = 9; update(1 / 60); }
      // her finisher, while it is winding up: it goes over, and the wind-up is gone
      e.coilT = 0.3; e.vx = 0; const x0 = e.x;
      attackKnock(e, 'finisher', 1, 0);
      let rollF = 0, poseF = 0, faced = 0, coiled = 0, acted = 0;
      for (let i = 0; i < 80; i++) { player.iT = 9; update(1 / 60);
        if (e.rollT > 0) { rollF++; if (pose() === 'roll') poseF++; if (faceSide(e) === -1) faced++; if (e.coilT > 0 || e.lungeT > 0) coiled++; } }
      out.rollF = rollF; out.poseF = poseF; out.faced = faced; out.coiled = coiled; out.moved = e.x - x0; out.heard = heard.includes('wolf_yelp');
      out.after = pose(); out.faceAfter = faceSide(e);
      // ...but not through its own winded window: that picture is the opening
      e.windedT = 0.6; e.vx = 0; e.rollT = 0; e.kbT = 0; e._kbWas = 0;
      attackKnock(e, 'finisher', 1, 0); update(1 / 60);
      out.windedRoll = e.rollT > 0;
      sfx = sfxWas; return out;
    })()`));
    check('H. a light blow does not roll it', !R.light, 'thrown at ' + R.lightV.toFixed(0) + ' px/s');
    check('   her finisher takes it off its feet: over its back, in the roll pose, for ~0.66 s', R.rollF >= 36 && R.rollF <= 42 && R.poseF >= R.rollF - 1 && R.heard, R.rollF + ' frames, ' + R.poseF + ' in the pose');
    check('   ...thrown AWAY from the blow, and nose-on to it the whole way', R.moved >= 40 && R.faced >= R.rollF - 1 && R.faceAfter === -1, 'moved ' + R.moved.toFixed(0) + ' px; faced the blow ' + R.faced + '/' + R.rollF);
    check('   ...and the wind-up it was in is gone: her finisher is an interrupt', R.coiled === 0);
    check('   ...but never through its winded window, which is the opening\'s own picture', !R.windedRoll);

    // ---- I. what is NOT a hunting wolf ----------------------------------------------
    const N = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv);
      const out = {};
      // a tamed pack: the same wolf, the flag set
      loadRoom('A1'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null;
      const e = G.enemies.find(e => e.kind === 'crawler' && isWolf(e)); G.enemies = [e];
      G.save.flags.alpha = 1;
      out.tamed = packTamed();
      player.x = e.x - 150; player.y = e.y + e.h - player.h; let hunted = 0, hurt = 0; const c0 = player.cores;
      for (let i = 0; i < 240; i++) { player.vx = 0; update(1 / 60); if (e.hunt || e.snarlT > 0 || e.coilT > 0) hunted++; }
      out.tameHunt = hunted; out.tameHurt = c0 - player.cores;
      G.save.flags.alpha = 0;
      // a crawler that is not a wolf: the cheetah's kingdoms
      let other = null;
      for (const id of Object.keys(ROOMS)) { if (!/^[CDEX]\d/.test(id)) continue; loadRoom(id);
        const c = G.enemies.find(e => e.kind === 'crawler'); if (c) { other = { id, c }; break; } }
      if (other) {
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null; const c = other.c; G.enemies = [c];
        out.other = other.id; out.isWolf = isWolf(c); out.hunter = wolfHunter(c);
        player.x = c.x - 250; player.y = c.y + c.h - player.h; let h2 = 0;
        for (let i = 0; i < 120; i++) { player.vx = 0; player.iT = 9; update(1 / 60); if (c.snarlT > 0 || c.thrashT > 0 || (c.rollT || 0) > 0) h2++; }
        out.otherHunt = h2;
      }
      return out;
    });
    check('I. a tamed pack does not hunt, and does not hurt her', N.tamed && N.tameHunt === 0 && N.tameHurt === 0, 'frames hunting ' + N.tameHunt + ', cores lost ' + N.tameHurt);
    check('   ...and a crawler that is not a wolf wears none of the pack\'s hunt (the cats have their own: cheetah-hunt)', !N.other || (!N.hunter && N.otherHunt === 0), N.other ? N.other + ': pack hunter ' + N.hunter + ', frames in a pack display ' + N.otherHunt : 'no crawler outside the pack\'s kingdoms');
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nwolf-hunt: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
