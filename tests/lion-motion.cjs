// NULLFANG'S MOTION, MEASURED IN THE REAL LOOP — the defects filmed on build
// 3960cef191f9 (tools/lionfilm.cjs), each one reproduced here so it cannot
// come back:
//
//   1. the turn swapped the filmed lion for a different drawing (the old parts
//      atlas mirror-composited into a front view) at every change of facing;
//   2. a leap could leave the ground mid-turn and mirror in the air (the spring
//      to a ledge behind it; the pounce after she crossed under the coil);
//   3. the standing animal sat at a different x in every take's cells, so the
//      body stepped up to 17 px sideways at a cut between states;
//   4. every take had its own exposure, so the lion changed colour at a cut;
//   5. one frame of mid-stride `stalk` flashed between the idle and every swipe;
//   6. the idle was one still held under a scale wobble.
//
// And the behaviour that replaces them: the committed pivot, the replant, the
// roar that answers being danced around, the pounce that lands and goes again,
// and the shader effects layer (js/fxgl.js) with its Canvas fallback.
//
//   node tests/lion-motion.cjs [--html <an older index.html, to watch it fail>]
const fs = require('fs');
const { chromium } = require('playwright');
const args = process.argv.slice(2), htmlAt = args.indexOf('--html'), html = htmlAt >= 0 ? args[htmlAt + 1] : null;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    const url = process.env.GAME_URL || 'http://127.0.0.1:8220/index.html';
    if (html) await page.route(url, r => r.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync(html, 'utf8') }));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── lion-motion — NULLFANG turns, commits, stands on one spot and wears one colour');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const KEYS = [...BEAST_STRIPS, 'beastStudioIdle', 'beastStudioTurn'];
      for (const k of KEYS) { try { mediaFetch(k, true); } catch (e) {} } beastImg();
      const t0 = performance.now();
      while (performance.now() - t0 < 30000 && !['beastStudioStalk', 'beastStudioLeap', 'beastStudioSwipe', 'beastStudioRoar', 'beastGallop', 'beastHurt', 'beastRearSwipe'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth)) await new Promise(r => setTimeout(r, 50));
      await new Promise(r => setTimeout(r, 600));      // the two new takes, where the build knows them
      const out = { has: { turn: !!(MEDIA_RAW.beastStudioTurn && MEDIA_RAW.beastStudioTurn.naturalWidth), idle: !!(MEDIA_RAW.beastStudioIdle && MEDIA_RAW.beastStudioIdle.naturalWidth) } };
      const fresh = (seed, phase) => {
        let s = seed >>> 0; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1;
        startGame(sv); loadRoom('A4');
        G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.zoneToast = null; G.toasts = [];
        const b = G.boss; G.enemies = G.enemies.filter(e => e === b);
        b.st = 'idle'; b.t = 0.4; b.meet = null; b.face = b.faceVis = -1; b.roarCD = 99; b.ambushCD = 99;
        if (phase === 2) { b.phase = 2; b.hp = b.hpMax * 0.45; b.nullUsed = true; }
        player.y = b.y + b.h - player.h; player.vx = player.vy = 0; player.on = true;
        return b;
      };
      const place = (b, side, d) => { player.x = b.cx() + side * d - player.w / 2; player.y = b.y + b.h - player.h; player.vx = player.vy = 0; };
      const step = (b) => { player.iT = 9; player.cores = 5; b.hp = Math.max(b.hp, b.hpMax * (b.phase === 2 ? 0.2 : 0.6)); update(1 / 60); for (const k in keysP) keysP[k] = 0; cam.shake = 0; };
      const scratch = document.createElement('canvas'); scratch.width = 420; scratch.height = 260;
      const sx = scratch.getContext('2d', { willReadFrequently: true });
      // where the PICTURE of the lion is, relative to the body the simulation moves
      const picture = (b) => {
        sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, 420, 260);
        sx.setTransform(1, 0, 0, 1, 210 - b.x - b.w / 2, 230 - b.y - b.h);
        const probe = G.artProbe; G.artProbe = 1; drawBeast(sx, b); G.artProbe = probe;
        const d = sx.getImageData(0, 0, 420, 222).data;      // above the ground shadow
        let n = 0, sum = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 200) { n++; sum += (i >> 2) % 420; }
        return n ? { cx: sum / n - 210, n, key: (b._stripPose || {}).key || null, cell: (b._stripPose || {}).cell } : { cx: 0, n: 0, key: null };
      };
      const turning = (b) => Math.abs((b.faceVis == null ? b.face : b.faceVis) - b.face) > 0.02;

      // ---- A. the turn itself ------------------------------------------------
      { const b = fresh(11, 1); place(b, -1, 300); b.t = 9;
        for (let i = 0; i < 10; i++) step(b);
        place(b, 1, 300); const seen = [];
        for (let i = 0; i < 60; i++) { b.t = 9; step(b); place(b, 1, 300); const p = picture(b); if (turning(b)) seen.push({ key: p.key, cell: p.cell, n: p.n, fv: b.faceVis }); }
        out.turn = { frames: seen.length, keys: [...new Set(seen.map(s => s.key))], cells: seen.map(s => s.cell),
          minArea: Math.min(...seen.map(s => s.n)), endFace: b.face, endVis: b.faceVis };
        // drawing does not move the turn
        const fv = b.faceVis; for (let i = 0; i < 20; i++) picture(b); out.turn.drawStable = fv === b.faceVis;
      }
      // ---- B. a seeded fight with a player who keeps crossing it ----------------
      const fight = (seed, phase, secs) => {
        const b = fresh(seed, phase); let side = -1, dist = 110; place(b, side, dist);
        const log = { launches: [], starts: [], pops: [], runs: [], keys: [] };
        let prevSt = b.st, runLen = 0, prevPic = null, prevX = b.cx(), prevTurning = false;
        for (let f = 0; f < secs * 60; f++) {
          const t = f / 60;
          if (t > 14) { if (b.roarCD > 50) b.roarCD = 1; if (b.ambushCD > 50) b.ambushCD = 2; }
          dist = Math.floor(t / 7) % 2 ? 320 : 110;
          if (f % 170 === 169) side = -side;                       // she crosses under it
          const want = b.cx() + side * dist, px = player.x + player.w / 2, W = G.roomDef.w * TILE;
          keys.ArrowLeft = keys.ArrowRight = 0;
          if (Math.abs(want - px) > 14) keys[want > px ? 'ArrowRight' : 'ArrowLeft'] = 1;
          if (want < 70 || want > W - 70) side = -side;
          const wasTurning = turning(b);
          step(b);
          const pic = picture(b);
          if (b.st !== prevSt) {
            log.runs.push([prevSt, runLen]);
            const grounded = /^(idle|stalk|swipewarn|swipe|recover|crouch|roar)$/;
            if (prevPic && grounded.test(prevSt) && grounded.test(b.st) && !wasTurning && !turning(b))
              log.pops.push({ from: prevSt, to: b.st, px: +(pic.cx - prevPic.cx - 0).toFixed(1), moved: +(b.cx() - prevX).toFixed(1) });
            if (/^(pounce|spring|dive)$/.test(b.st)) log.launches.push({ st: b.st, face: b.face, vis: +b.faceVis.toFixed(3), vx: +(b.vx || 0).toFixed(0), from: prevSt });
            if (/^(swipewarn|crouch|roar|springwarn)$/.test(b.st) && prevSt !== 'swipe') log.starts.push({ st: b.st, turning: turning(b) && b.st !== 'springwarn', from: prevSt });
            prevSt = b.st; runLen = 0;
          }
          runLen++; prevPic = pic; prevX = b.cx(); log.keys.push(pic.key);
        }
        // a FLASH is a single frame of one take between two frames of others. One
        // frame of the standing idle (or the first cell of the turn, the same
        // pose) between two moves is the lion standing, not a flash.
        log.flashes = log.keys.map((k, i) => i > 0 && i < log.keys.length - 1 && k && k !== log.keys[i - 1] && k !== log.keys[i + 1] && log.keys[i - 1] && !/Idle|Turn/.test(k) ? [log.keys[i - 1], k, log.keys[i + 1]].join('>') : null).filter(Boolean);
        delete log.keys;
        return log;
      };
      out.fight1 = fight(0x51f0c0de, 1, 70);
      out.fight2 = fight(0x0badcafe, 2, 60);
      // ---- C. the replant ------------------------------------------------------
      { const b = fresh(23, 1); place(b, -1, 300); b.st = 'crouch'; b.t = 1.0; b.coilTick = 0; b.coilFlashed = false; b.replanted = false; b.lastMove = 'pounce';
        let launchAt = null, f = 0, crossedAt = null;
        for (; f < 240; f++) { if (f === 40) { place(b, 1, 260); crossedAt = f; } else place(b, f < 40 ? -1 : 1, f < 40 ? 300 : 260);
          const before = b.st; step(b);
          if (before === 'crouch' && b.st === 'pounce') { launchAt = f; break; } }
        out.replant = { launchAt, face: b.face, vis: +(b.faceVis || 0).toFixed(3), vx: +(b.vx || 0).toFixed(0), st: b.st, tellMs: launchAt == null ? null : Math.round((launchAt + 1) * 1000 / 60) };
      }
      // ---- D. danced around: two crossings with no attack between them -----------
      { const b = fresh(31, 1); b.swipeCD = 9; place(b, -1, 260); b.t = 9; b.st = 'idle';
        for (let i = 0; i < 6; i++) step(b);
        let side = -1, roarAt = null, crossings = 0;
        for (let f = 0; f < 300 && roarAt == null; f++) {
          b.swipeCD = 9; if (b.st === 'idle') b.t = Math.max(b.t, 0.2);
          if (!turning(b) && b.face === side && crossings < 3) { side = -side; crossings++; }
          place(b, side, 520);
          step(b); if (b.st === 'roar') roarAt = f;
        }
        out.dance = { roarAt, crossings };
      }
      // ---- E. the pounce that lands beside her goes again -------------------------
      { const b = fresh(41, 1); place(b, -1, 60); b.st = 'recover'; b.t = 0.36; b.swipeCD = 0; b.face = b.faceVis = -1; b.lastMove = 'pounce';
        const seq = []; let prev = b.st, n = 0;
        for (let f = 0; f < 120; f++) { place(b, -1, 60); step(b); n++; if (b.st !== prev) { seq.push([prev, Math.round(n * 1000 / 60)]); prev = b.st; n = 0; } if (seq.length >= 3) break; }
        out.chain = seq;
      }
      // ---- F. one spot, one colour: the table against the takes ---------------------
      out.strips = {};
      const table = typeof BEAST_STRIP !== 'undefined' ? BEAST_STRIP : {};
      const entries = { stalk: 'studio-stalk', run: 'studio-gallop', idle: 'studio-idle', swipe: 'studio-swipe', crouch: 'studio-pounce', daze: 'studio-hurt' };
      for (const st in entries) {
        const S = table[st]; if (!S) continue;
        const im = MEDIA_RAW[S.key]; let meta = null;
        try { meta = await (await fetch('assets/characters/beast/' + entries[st] + '.motion.json')).json(); } catch (e) {}
        let mean = null;
        if (im && im.naturalWidth) {
          // the plating of the WHOLE take: every cell, so a take that drifts is caught
          const cv2 = document.createElement('canvas'); cv2.width = im.naturalWidth; cv2.height = im.naturalHeight;
          const x2 = cv2.getContext('2d', { willReadFrequently: true }); x2.drawImage(im, 0, 0);
          const cw = im.naturalWidth / S.cells; const cells = [];
          for (let ci = 0; ci < S.cells; ci++) {
            const d = x2.getImageData(Math.round(ci * cw), 0, Math.round(cw), im.naturalHeight).data; let r = 0, g = 0, bl = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 44) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
            cells.push([r / n, g / n, bl / n]);
          }
          mean = [0, 1, 2].map(ch => cells.reduce((s2, c2) => s2 + c2[ch], 0) / cells.length);
          var lum = cells.map(c2 => 0.2126 * c2[0] + 0.7152 * c2[1] + 0.0722 * c2[2]);
        }
        out.strips[st] = { key: S.key, ax: S.ax == null ? null : S.ax, anchor: meta && meta.anchor, mean, swing: mean ? (Math.max(...lum) - Math.min(...lum)) / (mean[0] * 0.2126 + mean[1] * 0.7152 + mean[2] * 0.0722) : null };
      }
      // ---- G. the effects layer -----------------------------------------------------
      // The test browser has no graphics card, which the game treats as "no
      // shader layer" (see fxglInit). Record that verdict, then lift it: the
      // layer itself is what is under test here.
      out.fxNoGpu = typeof fxglInit === 'function' ? fxglInit() : null;
      window.FXGL_FORCE = 1; if (typeof FXGL !== 'undefined') FXGL.ok = null;
      { const b = fresh(53, 1); const fxOk = typeof fxglInit === 'function' && fxglInit();
        out.fx = { present: typeof fx === 'function', ok: !!fxOk, err: typeof FXGL !== 'undefined' ? FXGL.err || null : 'absent' };
        if (typeof fx === 'function') {
          place(b, -1, 60); b.st = 'swipewarn'; b.t = 0.02; b.swipeCD = 9; b.face = b.faceVis = -1;
          const names = new Set();
          for (let f = 0; f < 30; f++) { place(b, -1, 60); step(b); for (const e of FXGL.list) names.add(e.name); }
          out.fx.swipe = [...names];
          b.st = 'pounce'; b.vx = -200; b.vy = 300; b.y -= 60; b.face = b.faceVis = -1; b.leapT0 = b.anim; b.leapDuration = 0.5; names.clear();
          for (let f = 0; f < 40; f++) { step(b); for (const e of FXGL.list) names.add(e.name); }
          out.fx.landing = [...names];
          G.addRing(b.cx(), b.cy()); fx('ground', b.cx(), b.y + b.h, { dur: 2 });
          const snap = () => JSON.stringify([FXGL.list.map(e => e.t), G.rings.map(r => [r.r, r.a])]);
          const before = snap(); for (let i = 0; i < 12; i++) draw(i * 16); out.fx.drawPure = before === snap(); out.fx.drawn = FXGL.drawn;
          G.artProbe = 1; FXGL.drawn = 0; draw(0); out.fx.probeDrawn = FXGL.drawn; G.artProbe = 0;
          G.fxLegacy = 1; let legacyErr = null; try { draw(0); } catch (e) { legacyErr = String(e); } out.fx.legacy = { on: fxglOn(), err: legacyErr }; G.fxLegacy = 0;
          out.fx.rings = G.rings.length;
        }
      }
      return out;
    });
    const T = R.turn;
    check('the filmed turn is delivered and decodes', R.has.turn && R.has.idle, JSON.stringify(R.has));
    check('a change of facing plays the filmed pivot, and only it', T.frames >= 18 && T.keys.length === 1 && T.keys[0] === 'beastStudioTurn', T.frames + ' frames of ' + JSON.stringify(T.keys));
    check('...start to finish, in order, to the far side', T.cells.every((c, i) => i === 0 || c >= T.cells[i - 1]) && T.cells[0] <= 1 && T.cells[T.cells.length - 1] >= 16 && T.endFace === 1 && T.endVis === 1, 'cells ' + T.cells[0] + '→' + T.cells[T.cells.length - 1]);
    check('...as a body the whole way round, never a sliver', T.minArea > 2600, 'smallest frame ' + T.minArea + ' px');
    check('drawing the turn does not advance it', T.drawStable === true);
    for (const [name, L] of [['phase one', R.fight1], ['phase two', R.fight2]]) {
      const bad = L.launches.filter(l => Math.abs(l.vis - l.face) > 0.02 || (l.vx && Math.sign(l.vx) !== l.face));
      check(name + ': no leap leaves the ground mid-turn or backwards', L.launches.length >= 6 && bad.length === 0, L.launches.length + ' launches' + (bad.length ? ', bad ' + JSON.stringify(bad.slice(0, 3)) : ''));
      const early = L.starts.filter(s => s.turning);
      check(name + ': no wind-up begins while the body is still turning', L.starts.length >= 10 && early.length === 0, L.starts.length + ' wind-ups' + (early.length ? ', early ' + JSON.stringify(early.slice(0, 3)) : ''));
      const worst = L.pops.reduce((m, p) => Math.abs(p.px - p.moved) > Math.abs(m.px - m.moved) ? p : m, { px: 0, moved: 0 });
      check(name + ': the body does not step sideways at a cut between states', L.pops.length >= 20 && Math.abs(worst.px - worst.moved) <= 11, L.pops.length + ' cuts, worst ' + (worst.px - worst.moved).toFixed(1) + ' px (' + worst.from + '→' + worst.to + ')');
      check(name + ': no single frame of one take flashes between two others', L.flashes.length === 0, L.flashes.length + ' flashes ' + JSON.stringify(L.flashes.slice(0, 3)));
    }
    check('crossing under the coil makes it re-plant, then leap at her — on the ground, facing her', R.replant.st === 'pounce' && R.replant.face === 1 && Math.abs(R.replant.vis - 1) <= 0.02 && R.replant.vx > 0, JSON.stringify(R.replant));
    check('...and that buys her warning, not a free miss', R.replant.tellMs >= 1350 && R.replant.tellMs <= 1600, R.replant.tellMs + ' ms of coil');
    check('danced around twice, it answers with the roar', R.dance.roarAt != null, JSON.stringify(R.dance));
    const ch = R.chain;
    check('a pounce that lands beside her goes straight into the paw', ch.length >= 2 && ch[0][0] === 'recover' && ch[1][0] === 'swipewarn', JSON.stringify(ch));
    check('...after an opening she can use, and with the whole tell', ch.length >= 2 && ch[0][1] >= 283 && ch[1][1] >= 480, ch[0] && ch[0][1] + ' ms open, ' + (ch[1] && ch[1][1]) + ' ms tell');
    const ref = R.strips.stalk && R.strips.stalk.mean;
    for (const st in R.strips) {
      const S = R.strips[st];
      check(st + ': the table stands the lion where its take does', S.ax != null && S.anchor != null && Math.abs(S.ax - S.anchor) <= 1.5, 'ax ' + S.ax + ' vs anchor ' + S.anchor);
      const dc = S.mean && ref ? Math.max(...S.mean.map((v, i) => Math.abs(v - ref[i]))) : 99;
      check(st + ': one exposure from its first cell to its last', S.swing != null && S.swing <= 0.16, S.swing == null ? 'no image' : (S.swing * 100).toFixed(0) + '% swing');
      check(st + ': the same plating colour as the stalk', dc <= 5, S.mean ? S.mean.map(v => v.toFixed(0)).join(',') + ' (Δ' + dc.toFixed(1) + ')' : 'no image');
    }
    check('the shader effects layer comes up', R.fx.present && R.fx.ok, JSON.stringify({ ok: R.fx.ok, err: R.fx.err }));
    check('...and stands down by itself on a software GPU (this browser has no graphics card)', R.fxNoGpu === false, String(R.fxNoGpu));
    if (R.fx.present) {
      check('the swipe throws its claws', (R.fx.swipe || []).includes('slash'), JSON.stringify(R.fx.swipe));
      check('the landing cracks the ground and sends a wave along it', ['ground', 'cracks', 'flash'].every(n => (R.fx.landing || []).includes(n)), JSON.stringify(R.fx.landing));
      check('drawing never advances an effect or a ring', R.fx.drawPure === true && R.fx.drawn >= 2, R.fx.drawn + ' quads');
      check('the art probe hides the layer', R.fx.probeDrawn === 0);
      check('with no GPU layer the Canvas rings still draw', R.fx.legacy && R.fx.legacy.on === false && !R.fx.legacy.err && R.fx.rings >= 1, JSON.stringify(R.fx.legacy));
    }
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nlion-motion: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
