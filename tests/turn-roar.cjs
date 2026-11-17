// GRAVEHORN TURNS LIKE AN ANIMAL; NULLFANG'S FIRST ROAR STUNS HER.
// Owner, 2026-11-16: "now it's just rotating as a simple paper leaf instead of
// actually rotating like a normal animal"; "First time Nilfang shows... he
// should actually roar and stun me with it. Make it intimidating."
//   A  through a turn the rhino is drawn from his three-quarter and head-on
//      plates, in that order and back: profile, 3/4, front, 3/4, profile
//   B  he is never squashed edge-on: at the middle of the turn his picture is
//      still most of a body wide, and as tall as he stands
//   C  the turn plates stand the height the rig stands (he does not grow)
//   D  at the first meeting NULLFANG lands, ROARS, and the roar holds her
//      still for about a second before he moves on her
const { chromium } = require("playwright");
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (d != null ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); if (!ok) bad++; };
const open = async () => { const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" }); const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: "block" }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "domcontentloaded" }); await page.waitForFunction(() => typeof startGame === "function", { timeout: 20000 }); return { browser, page, errs }; };

(async () => { const { browser, page, errs } = await open();
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    let sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, rubbleA5: 1, rubbleCV1B: 1, beacon: 1, ghMet: 1 }); startGame(sv);
    loadRoom('CV3'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = null;
    const bo = G.boss; player.x = bo.cx() - 330; const g = groundColumnAt(player.x + 12); if (g) player.y = Math.min.apply(null, g) - player.h;
    for (let i = 0; i < 900 && (bo.st === 'dorm' || GH_CINE[bo.st]); i++) { if (G.dialog) { G.dialog = null; G.state = 'PLAY'; } player.iT = 9; update(1 / 60); }
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => k.startsWith('gh_'))) mediaFetch(k, 1);
    for (let n = 0; n < 40 && !(ghPlate('turn34') && ghPlate('turn_front') && ghPlate('head')); n++) await new Promise(r => setTimeout(r, 150));
    out.plates = !!(ghPlate('turn34') && ghPlate('turn_front'));
    const box = () => { const o = Object.assign(document.createElement('canvas'), { width: 700, height: 420 }); const x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 350 - bo.cx(), 350 - (bo.y + bo.h)); const pr = G.artProbe; G.artProbe = true; bo.draw(x); G.artProbe = pr;
      const d = x.getImageData(0, 0, 700, 420).data; let y0 = 420, y1 = 0, x0 = 700, x1 = 0; for (let yy = 0; yy < 420; yy++) for (let xx = 0; xx < 700; xx++) if (d[(yy * 700 + xx) * 4 + 3] > 120) { if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; }
      return { w: x1 - x0, h: y1 - y0, feet: y1 - 350 }; };
    bo.st = 'idle'; bo.t = 9; bo.face = -1; bo.faceVis = -1; bo.vx = 0; player.x = bo.cx() - 260; player.iT = 99;
    out.rest = box();
    bo.turnN = 0;   // the first turn of a fight comes round TOWARD the camera
    ghSet(bo, 'turn', GH.turnT); bo.face = 1; const seq = [], boxes = [];
    for (let i = 0; i < 30; i++) { bo.t = Math.max(bo.t, 0.05); player.iT = 99; update(1 / 60); G.dialog = null; G.state = 'PLAY';
      const v = ghTurnView(bo); const key = v ? v.key : 'profile'; if (seq[seq.length - 1] !== key) seq.push(key); boxes.push(Object.assign(box(), { key, fv: +bo.faceVis.toFixed(2) })); if (bo.faceVis >= 0.99) break; }
    out.seq = seq; out.narrow = boxes.slice().sort((a, b) => a.w - b.w)[0]; out.short = boxes.slice().sort((a, b) => a.h - b.h)[0]; out.tall = boxes.slice().sort((a, b) => b.h - a.h)[0];
    out.feet = Math.max.apply(null, boxes.map(q => Math.abs(q.feet - out.rest.feet))); out.end = +bo.faceVis.toFixed(2);
    // ...and the next one goes round AWAY from it: rear three-quarter, tail-on, rear three-quarter
    for (let n = 0; n < 40 && !(ghPlate('turn_rear') && ghPlate('turn_tail')); n++) await new Promise(r => setTimeout(r, 150));
    { ghSet(bo, 'turn', GH.turnT); bo.face = -1; const seq2 = [], bx2 = [];
      for (let i = 0; i < 30; i++) { bo.t = Math.max(bo.t, 0.05); player.iT = 99; update(1 / 60); G.dialog = null; G.state = 'PLAY';
        const v = ghTurnView(bo); const key = v ? v.key : 'profile'; if (seq2[seq2.length - 1] !== key) seq2.push(key); bx2.push(Object.assign(box(), { key })); if (bo.faceVis <= -0.99) break; }
      out.away = { seq: seq2, narrow: bx2.slice().sort((a, b) => a.w - b.w)[0], short: bx2.slice().sort((a, b) => a.h - b.h)[0], tall: bx2.slice().sort((a, b) => b.h - a.h)[0],
        feet: Math.max.apply(null, bx2.map(q => Math.abs(q.feet - out.rest.feet))), end: +bo.faceVis.toFixed(2) }; }
    // ---- the meeting ----
    sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1 }); startGame(sv);
    loadRoom('A2'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null; G.enemies = [];
    player.x = MEET_X + 10; const g2 = groundColumnAt(player.x + 12); if (g2) player.y = Math.min.apply(null, g2) - player.h - 1;
    const M = { ph: [], stun: 0, roarStun: 0, movedInRoar: 0 }; let last = '', rx = null;
    for (let i = 0; i < 800; i++) { for (const k in keys) keys[k] = 0; if (G.boss && G.boss.roared && G.meet && G.meet.ph === 'roar') keys.ArrowLeft = 1;   // she tries to run the moment it roars
      update(1 / 60); if (G.dialog) { let n = 0; while (G.dialog && n++ < 9) dialogClose(G.dialog); }
      const ph = G.meet ? G.meet.ph : '-'; if (ph !== last) { M.ph.push(ph); last = ph; if (ph === 'roar') rx = player.x; }
      if ((player.stunT || 0) > 0) M.stun++; if (ph === 'roar') { M.roarN = (M.roarN || 0) + 1; if (G.boss && G.boss.roared && (player.stunT || 0) > 0) { M.roarStun++; if (M.sx == null) M.sx = player.x; M.movedInRoar = Math.max(M.movedInRoar, Math.abs(player.x - M.sx)); } }
      if (!G.meet && i > 200) break; }
    out.M = M;
    // ---- the perch: no sitting up there while she cuts at his feet ----
    const perch = (mode) => { const s3 = newSave(1); s3.time = 99; s3.storyVersion = 2; Object.assign(s3.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(s3);
      loadRoom('A4'); G.state = 'PLAY'; G.dialog = G.wake = G.cut = G.bossEntry = null; const bo2 = G.boss;
      let pr = null; for (let ty = 3; ty < G.roomDef.h - 2 && !pr; ty++) { let run = 0; for (let tx = 1; tx < G.roomDef.w; tx++) { if (G.grid[ty][tx] === '=') run++; else { if (run >= 3) { pr = [(tx - run / 2) * TILE, ty * TILE]; break; } run = 0; } } }
      if (!pr) return null; bo2.perch = pr; bo2.x = pr[0] - bo2.w / 2; bo2.y = pr[1] - bo2.h; bo2.st = 'perch'; bo2.t = 1.4; bo2.perchTold = false; bo2.vx = bo2.vy = 0;
      let frames = 0, told = -1, left = -1, next = null;
      for (let i = 0; i < 200; i++) { player.x = mode === 'under' ? bo2.cx() - player.w / 2 + 20 : bo2.cx() - 420; const gg = groundColumnAt(player.x + 12); player.y = Math.min.apply(null, gg) - player.h; player.vx = player.vy = 0; player.iT = 9; player.on = true;
        if (mode === 'struck' && i === 6) bo2.hurtT = 0.2;
        if (G.dialog) dialogClose(G.dialog); G.state = 'PLAY'; update(1 / 60);
        if (bo2.st === 'perch') { frames++; if (told < 0 && bo2.perchTold) told = i; } else { left = i; next = bo2.st; break; } }
      return { frames, tell: left - told, next, target: Math.round(bo2.tx + bo2.w / 2 - (player.x + player.w / 2)) }; };
    out.perch = { away: perch('away'), under: perch('under'), struck: perch('struck') };
    // ---- three stages: the half answers with a roar, the quarter with the fury ----
    { const s4 = newSave(1); s4.time = 99; s4.storyVersion = 2; Object.assign(s4.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(s4);
      loadRoom('A4'); G.state = 'PLAY'; G.dialog = G.wake = G.cut = G.bossEntry = null; const bo3 = G.boss; bo3.st = 'idle'; bo3.t = 0.3;
      const seen = { toasts: [], log: [] }; const toast0 = G.toast; G.toast = function (m) { seen.toasts.push(m); return toast0.apply(this, arguments); };
      const hold = () => { player.x = bo3.cx() - 520; const gg = groundColumnAt(player.x + 12); if (gg) player.y = Math.min.apply(null, gg) - player.h; player.vx = player.vy = 0; player.iT = 9; player.on = true; player.stunT = 0; };
      const run = (frames, tag) => { let stag = 0, roar = -1, perched = 0, pace = 0, n = 0; for (let i = 0; i < frames; i++) { hold(); if (G.dialog) dialogClose(G.dialog); G.state = 'PLAY'; const x0 = bo3.x; update(1 / 60);
          if ((bo3.stagT || 0) > 0) stag++; if (roar < 0 && bo3.st === 'roar') roar = i; if (bo3.st === 'perch' || bo3.st === 'spring' || bo3.st === 'springwarn') perched++;
          if (bo3.st === 'stalk') { pace += Math.abs(bo3.x - x0) * 60; n++; } }
        return { tag, phase: bo3.phase, fury: !!bo3.fury, stag, roarAt: roar, perched, pace: n ? Math.round(pace / n) : 0 }; };
      const prowl = () => nfPace(bo3, false);
      const A = run(240, 'whole'); A.pace = prowl();
      bo3.hp = Math.floor(bo3.hpMax * 0.49); const B = run(420, 'half'); const B2 = run(600, 'second gear'); B2.pace = prowl();
      bo3.hp = Math.floor(bo3.hpMax * 0.24); const C = run(420, 'quarter'); const C2 = run(1500, 'fury'); C2.pace = prowl();
      G.toast = toast0; out.stages = { A, B, B2, C, C2, toasts: seen.toasts.filter(m => m === t('nf_break1') || m === t('nf_break2')).length, lines: [t('nf_break1'), t('nf_break2')] }; }
    return out; });
  console.log('── turn-roar  — the rhino turns through his own body; NULLFANG\'s first roar holds her still, and he does not sit on his ledge to be cut at');
  check('the turn plates are in the build and load', R.plates === true);
  check('A  profile, three-quarter, head-on, three-quarter, profile', JSON.stringify(R.seq) === JSON.stringify(['turn34', 'turn_front', 'turn34', 'profile']) || JSON.stringify(R.seq) === JSON.stringify(['profile', 'turn34', 'turn_front', 'turn34', 'profile']), R.seq);
  check('   ...and he ends facing the other way', R.end >= 0.99, R.end);
  // (head-on, a rhino IS narrow — about his own height across; a paper flip goes through nothing at all)
  check('B  never edge-on: head-on he is still as wide as most of his height', R.narrow.w >= R.rest.h * 0.6 && R.narrow.key === 'turn_front', { rest: R.rest, narrowest: R.narrow });
  check('C  he keeps his height through the turn', R.short.h >= R.rest.h * 0.85 && R.tall.h <= R.rest.h * 1.2, { rest: R.rest.h, shortest: R.short.h, tallest: R.tall.h });
  check('   ...and his feet stay on the floor', R.feet <= 8, R.feet + ' px');
  check('A2 the next turn goes round AWAY from the camera: rear three-quarter, tail-on, rear three-quarter', ['turn_rear,turn_tail,turn_rear,profile', 'profile,turn_rear,turn_tail,turn_rear,profile'].includes(R.away.seq.join(',')) && R.away.end <= -0.99, R.away.seq);
  check('   ...as wide, as tall and as planted as the turn toward it', R.away.narrow.w >= R.rest.h * 0.6 && R.away.short.h >= R.rest.h * 0.85 && R.away.tall.h <= R.rest.h * 1.2 && R.away.feet <= 8,
    { narrowest: R.away.narrow, shortest: R.away.short.h, tallest: R.away.tall.h, feet: R.away.feet });
  const ph = R.M.ph, ri = ph.indexOf('roar');
  check('D  he lands, then ROARS, then moves on her', ri > 0 && ph.indexOf('settle') >= 0 && ph.indexOf('settle') < ri && ri < ph.indexOf('wind'), ph);
  check('   ...the roar holds her for about a second, a stagger back and no more, with the stick held', R.M.roarStun >= 40 && R.M.movedInRoar < 90, { stunnedFrames: R.M.roarStun, roarFrames: R.M.roarN, moved: Math.round(R.M.movedInRoar) });
  // "The Guardian stood still for so long on top of the platform that made it so
  // much easier to just stand underneath it and hit it and kill it."
  const P = R.perch;
  check('E  left alone on his ledge he watches her for a second, then dives', P.away && P.away.frames >= 70 && P.away.next === 'dive', P.away);
  check('   ...with her under the ledge he does not wait: he is gone in half the time', P.under && P.under.frames <= P.away.frames * 0.5 && P.under.next === 'dive', P.under);
  check('   ...and a blow taken up there ends the wait too', P.struck && P.struck.frames <= P.away.frames * 0.6 && P.struck.next === 'dive', P.struck);
  check('   ...the dive\'s warning is never shortened (>= 450 ms each time)', [P.away, P.under, P.struck].every(q => q && q.tell >= 26), [P.away.tell, P.under.tell, P.struck.tell].map(f => Math.round(f / 60 * 1000) + ' ms').join(', '));
  check('   ...and it comes down where she is standing', Math.abs(P.under.target) < 40, P.under.target + ' px off her');
  // "This Guardian should have at least two and maybe three. With each phase, it gets harder."
  const S3 = R.stages;
  check('F  at half he breaks: staggered, then ROARS, and is in his second gear', S3.B.phase === 2 && !S3.B.fury && S3.B.stag > 30 && S3.B.roarAt >= 0, S3.B);
  check('   ...at a quarter he breaks again, roars again, and is in the fury', S3.C.fury === true && S3.C.stag > 30 && S3.C.roarAt >= 0, S3.C);
  check('   ...each break is SAID, once', S3.toasts === 2 && S3.lines[0] !== 'nf_break1' && S3.lines[1] !== 'nf_break2', { toasts: S3.toasts });
  check('   ...each gear is given a faster prowl than the one before', S3.A.pace > 0 && S3.B2.pace > S3.A.pace * 1.08 && S3.C2.pace > S3.B2.pace * 1.08, { p1: S3.A.pace, p2: S3.B2.pace, fury: S3.C2.pace });
  check('   ...and in the fury he never goes up to the ledge to rest', S3.C2.perched === 0, { perchFrames: S3.C2.perched });
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — he turns as an animal turns, and the lion\'s roar lands'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
