// SHE CROSSES HER ARMS AND TAPS HER FOOT (owner, 2026-11-14).
//
// "Look for how Sonic used to stamp with his feet and cross his hand when he's
// idle and waiting, and give the character the same move when it says yalla."
//
// The move is its own strip (ART_QUEUE 1-imp, `heroImpatient`) and the art is the
// owner's to approve, so this harness has to be true on BOTH sides of that
// approval:
//   - with no sheet in the manifest the idle is exactly what it was — every bout
//     is the fidget, and nothing asks the network for a file that is not there;
//   - with a sheet, the bout "yalla" is said over is the crossed arms: it opens
//     on the settle cell as the word fires, taps at a foot's pace and not a
//     flicker, shows every cell, turns with her facing, and leaves the old
//     fidget its turn on the bouts between.
// When the real sheet lands it is the one measured; until then a stand-in strip
// is put in the rack by hand so the engine half cannot rot while it waits.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  const asked = []; p.on('request', r => { if (/impatient/i.test(r.url())) asked.push(r.url()); });
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(async () => {
    const out = {};
    const shipped = !!MEDIA_SRC.images.heroImpatient;
    out.shipped = shipped;
    const P = FIDGET_BOUT + IDLE_REST;
    const walk = () => { const seen = { imp: new Set(), fid: new Set() }; const bouts = [];
      for (let n = 0; n < 4; n++) { const q = heroIdleClip(FIDGET_AFTER + n * P + 0.2); bouts.push(q.imp ? 'imp' : q.fidget ? 'fid' : 'idle'); }
      for (let t = FIDGET_AFTER; t < FIDGET_AFTER + 4 * P; t += 0.01) { const q = heroIdleClip(t); if (q.imp) seen.imp.add(q.cell); else if (q.fidget) seen.fid.add(q.cell); }
      return { bouts, imp: [...seen.imp].sort(), fid: [...seen.fid].sort() }; };

    // ---- WITHOUT A SHEET ---------------------------------------------------
    if (!shipped) {
      out.bare = walk();
      // put a stand-in in the rack: eight square cells, a block on the RIGHT of each so facing can be read
      const cv = document.createElement('canvas'); cv.width = 8 * 64; cv.height = 64; const c = cv.getContext('2d');
      for (let i = 0; i < 8; i++) { c.fillStyle = '#fff'; c.fillRect(i * 64 + 22, 8, 20, 54); c.fillStyle = '#f0f'; c.fillRect(i * 64 + 42, 20, 12, 12); }
      const im = new Image(); im.src = cv.toDataURL(); await im.decode(); MEDIA_RAW.heroImpatient = im; MEDIA_LOW.heroImpatient = 3;
    } else {
      mediaFetch('heroImpatient', 1);
      for (let i = 0; i < 100 && !(MEDIA_RAW.heroImpatient && MEDIA_RAW.heroImpatient.naturalWidth); i++) await new Promise(q => setTimeout(q, 100));
      const im = MEDIA_RAW.heroImpatient;
      out.sheet = im ? { w: im.naturalWidth, h: im.naturalHeight } : null;
    }

    // ---- WITH ONE ----------------------------------------------------------
    out.ready = heroImpatientReady();
    out.withSheet = walk();
    out.boutLen = +beatsLength(HERO_IMPATIENT_BEATS).toFixed(3); out.fidgetBout = +FIDGET_BOUT.toFixed(3);
    out.opens = heroIdleClip(FIDGET_AFTER + 0.05);
    // the pace of the tap: how long is each toe cell held, and how many taps a second
    const taps = HERO_IMPATIENT_BEATS.filter(q => q[0] === 1 || q[0] === 3 || q[0] === 5);
    out.tapHold = Math.min(...HERO_IMPATIENT_BEATS.filter(q => q[0] >= 1 && q[0] <= 6).map(q => q[1]));
    out.taps = taps.length;
    // ...and the body only changes on a foot cell or a deliberate beat: no two
    // consecutive beats are the same cell (a held cell written twice is a stutter)
    out.repeats = HERO_IMPATIENT_BEATS.filter((q, i, a) => i && a[i - 1][0] === q[0]).length;

    // through the real update and the real draw
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; startGame(sv); loadRoom('A1');
    G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = []; G.projs = [];
    const said = []; const say0 = hzdSay; hzdSay = (k) => { said.push([k, +player.idleT.toFixed(2)]); return true; };
    player.x = 30 * TILE; player.vx = 0;
    for (let i = 0; i < 60; i++) { G.toasts = []; G.zoneToast = null; G.near = null; update(1 / 60); }
    player.idleT = 0; player.idleSpoke = false; said.length = 0;
    const cv2 = document.createElement('canvas'); cv2.width = 400; cv2.height = 400; const c2 = cv2.getContext('2d');
    const drawn = [];
    const shot = (face) => { player.face = player.faceVis = face; c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, 400, 400);
      c2.translate(200, 300); c2.scale(face, 1); G.heroMotion = null; player._motionPose = null;
      player.drawRoboPlate(c2, false);
      const d = c2.getImageData(0, 0, 400, 400).data; let sx = 0, n = 0;
      for (let y = 0; y < 400; y += 2) for (let x = 0; x < 400; x += 2) { const o = (y * 400 + x) * 4; if (d[o + 3] > 40) { sx += x; n++; } }
      // the magenta marker (stand-in only): which side of her is it on?
      let mx = 0, mn = 0; for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++) { const o = (y * 400 + x) * 4; if (d[o] > 200 && d[o + 1] < 80 && d[o + 2] > 200 && d[o + 3] > 200) { mx += x; mn++; } }
      return { key: G.heroMotion && G.heroMotion.key, frame: G.heroMotion && G.heroMotion.frame, flip: player._motionPose && player._motionPose.flip,
        cx: n ? sx / n : null, mark: mn ? mx / mn : null, px: n }; };
    let firstImp = null;
    for (let i = 0; i < (FIDGET_AFTER + P + 1) * 60; i++) {
      G.toasts = []; G.zoneToast = null; G.near = null; update(1 / 60);
      const q = heroIdleClip(player.idleT);
      if (q.imp && firstImp == null) firstImp = +player.idleT.toFixed(2);
    }
    out.said = said; out.firstImp = firstImp; out.state = [G.state, player.on];
    // photograph the same moment facing each way
    player.idleT = FIDGET_AFTER + 0.6;
    out.right = shot(1); out.left = shot(-1);
    // ...and the next bout is still the fidget
    player.idleT = FIDGET_AFTER + P + 0.2;
    out.next = shot(1);
    hzdSay = say0;
    return out;
  });

  if (!r.shipped) {
    check('with no sheet, every bout is the fidget it always was', r.bare.bouts.join() === 'fid,fid,fid,fid' && r.bare.imp.length === 0, JSON.stringify(r.bare.bouts));
    check('...and nothing went looking for a file that is not there', asked.length === 0, asked.join(' '));
  } else {
    check('the shipped sheet is eight square cells in a row', !!r.sheet && r.sheet.w === 8 * r.sheet.h, JSON.stringify(r.sheet));
  }
  check('with a sheet, the bout "yalla" is said over is the crossed arms — and the fidget keeps the bouts between',
    r.ready && r.withSheet.bouts.join() === 'imp,fid,imp,fid', JSON.stringify(r.withSheet.bouts));
  check('...it opens on the settle cell, the moment the word fires', r.opens.imp === true && r.opens.cell === 0
    && r.said.length === 1 && r.said[0][0] === 'yalla' && Math.abs(r.said[0][1] - r.firstImp) < 0.08, JSON.stringify({ opens: r.opens, said: r.said, firstImp: r.firstImp }));
  check('...every one of its eight cells is shown', r.withSheet.imp.join() === '0,1,2,3,4,5,6,7', r.withSheet.imp.join());
  check('...and the fidget lost none of its own', r.withSheet.fid.length >= 7, r.withSheet.fid.join());
  check('the tap is a foot, not a flicker: each toe cell held at least a tenth of a second, never the same cell twice running',
    r.tapHold >= 0.1 && r.tapHold <= 0.2 && r.taps >= 6 && r.repeats === 0, JSON.stringify({ hold: r.tapHold, taps: r.taps, repeats: r.repeats }));
  check('the bout is exactly as long as the fidget\'s, so the rest between bouts did not move', Math.abs(r.boutLen - r.fidgetBout) < 0.001, r.boutLen + ' vs ' + r.fidgetBout);
  check('the real draw puts that strip on her', r.right.key === 'heroImpatient' && r.right.px > 200, JSON.stringify(r.right));
  check('...and it turns with her: a three-quarter view is not a front view', r.right.flip === false && r.left.flip === false
    && (r.shipped || (r.right.mark != null && r.left.mark != null && r.right.mark > r.right.cx && r.left.mark < r.left.cx)),
    JSON.stringify({ right: [r.right.cx, r.right.mark], left: [r.left.cx, r.left.mark] }));
  check('the bout after it is drawn from the fidget strip', r.next.key === 'heroFidget', String(r.next.key));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — ' + (r.shipped ? 'she crosses her arms and taps her foot' : 'the move is wired and waiting for its sheet; until then she fidgets as before'));
})().catch(e => { console.error(e); process.exit(1); });
