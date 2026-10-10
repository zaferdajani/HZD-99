// OLD SERVO IS SOMEBODY YOU STAND BESIDE, NOT INSIDE.
//
// The studio audit's fresh phone capture (2026-10-10, docs/studio/runs/
// 2026-10-10/images/servo-phone.jpg) showed the cat and Old Servo drawn on top
// of each other at the moment the talk prompt came up, and through the whole
// conversation: the interact reach was 46 px from his 40-px feet box, while he
// is drawn at his atlas scale, 75 px across, so the prompt arrived only once
// her body was already inside his. His art is detailed and stays; what is
// measured here is the PRESENTATION (js/game.js npcStandOff / npcTalkSpot):
//
//   1. walking in, the prompt comes up while her drawn body is still clear of
//      his — before she touches him, not after
//   2. if she walks into him anyway and talks, the talk steps her out to his
//      side, facing him, on the floor, before the first page is read
//   3. he is grounded: his feet are on the meadow floor
//   4. the whole arc, with real input (keyboard on desktop, the on-screen E
//      button and taps on a phone): dark with a cue -> the spare cell seats ->
//      his own intro (who he is, the way to the marble, the coil errand with
//      its 60 scrap and 10 IQ) -> a second talk says something else -> the
//      coil home is thanked and paid, the drum turns true, and the talk after
//      that is different again
//   5. at every conversation she is beside him, never over him
//
// Desktop 1280x720 and a phone held landscape at 844x390 (touch, DPR 2).
// Shots: tests/out/servo-presence/.
//
//   node tests/servo-presence.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out', 'servo-presence');
fs.mkdirSync(OUT, { recursive: true });

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail == null ? '' : '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))));
  if (!ok) fails.push(name);
};

async function run(browser, mode) {
  const phone = mode === 'phone';
  const ctx = await browser.newContext(phone
    ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof heroArtReady === 'function' && heroArtReady(), null, { timeout: 30000 });
  await page.mouse.click(8, 8);
  // the meadow, as the opening leaves it: Ratchet woken, the pack bought, the
  // walk over, the spare cell in her bag — and the harness steps the loop
  await page.evaluate((isPhone) => {
    const sv = newSave(1); sv.time = 99;
    Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1,
      ratchetSpareGiven: 1, opPod: 1, opTold: 1, opNote: 1, opScrap: 1, sawScrap: 1 });
    sv.items = Object.assign({}, sv.items, { batt: 1 });
    sv.bench = { room: 'A1', x: 1.5 * TILE, y: 13 * TILE };
    startGame(sv);
    if (isPhone && typeof TOUCH !== 'undefined') TOUCH.enabled = true;
    G.wake = null; G.zoneToast = null; G.toasts = [];
    window.requestAnimationFrame = () => 0;
    window.__sv = () => G.statics.find(q => q.type === 'npc' && q.extra === 'servo');
    // one loop frame, exactly as mainLoop runs it
    window.__frame = (hold, tap) => {
      for (const a of hold || []) keys[KEYB[a][0]] = 1;
      for (const a of tap || []) { keys[KEYB[a][0]] = 1; keysP[KEYB[a][0]] = 1; }
      update(1 / 60);
      for (const k in keysP) keysP[k] = 0;
      // the picture every few frames (and before every shot): the harness is
      // measuring the simulation, and a full draw per step is most of its time
      if ((window.__fn = (window.__fn | 0) + 1) % 6 === 0) { draw(performance.now()); drawTouchUI(); }
      clearP();
      for (const a of tap || []) keys[KEYB[a][0]] = 0;
    };
    window.__release = () => { for (const k in keys) keys[k] = 0; };
    window.__geo = () => {
      const s = __sv(), A = atlasOf('servo'), S = A.sub.servo;
      const im = MEDIA_IMG[A.key];
      const asp = im && im.naturalWidth ? (im.naturalWidth / A.cols) / (im.naturalHeight / A.rows) : 0.77;
      const half = s.h * S.k * asp / 2, scx = s.x + s.w / 2, hcx = player.x + player.w / 2;
      return { scx, hcx, dx: hcx - scx, half, gap: Math.abs(hcx - scx) - half - TALK_HERO_HALF,
        face: player.face, toward: Math.sign(scx - hcx) === player.face, on: !!player.on,
        near: G.near === s, state: G.state, live: npcLive(s),
        feet: s.y + s.h, floor: pgFloorY(scx), standOff: npcStandOff(s) };
    };
    for (let i = 0; i < 40; i++) __frame();
  }, phone);
  const R = { mode };
  const shot = async (name) => {
    await page.evaluate(() => { draw(performance.now()); drawTouchUI(); });
    return page.screenshot({ path: path.join(OUT, mode + '-' + name + '.png') });
  };
  const frames = (n, hold, tap) => page.evaluate(([n, hold, tap]) => { for (let i = 0; i < n; i++) __frame(hold, i === 0 ? tap : null); }, [n, hold || null, tap || null]);
  // a press of the interact control, through the platform's own input: the
  // E key on a keyboard, the on-screen E button on a phone
  const talkPress = async () => {
    if (!phone) { await frames(1, null, ['INT']); return; }
    const b = await page.evaluate(() => { const L = tLayout(); const q = L.btns.concat(L.corners).find(x => x.code === 'VINT');
      return q && q.show() ? { x: TOUCH.ox + q.x, y: TOUCH.oy + q.y } : null; });
    if (!b) { R.noTouchE = true; await frames(1, null, ['INT']); return; }
    await page.touchscreen.tap(b.x, b.y);
    await frames(1);
  };
  // turn a page: a key press, or a tap anywhere on a phone; a reader's pace
  const pagePress = async () => {
    if (phone) { await page.touchscreen.tap(422, 140); await frames(1); }
    else await frames(1, null, ['OK']);
    await frames(24);
  };
  const readAll = async (max) => {
    const lines = [];
    for (let k = 0; k < (max || 40); k++) {
      const d = await page.evaluate(() => G.state === 'DIALOG' && G.dialog ? { line: String([].concat(G.dialog.lines[G.dialog.i]).join(' ')), npc: G.dialog.npc || null, i: G.dialog.i } : null);
      if (!d) break;
      if (lines[lines.length - 1] !== d.line) lines.push(d.line);
      await pagePress();
    }
    return lines;
  };

  // ---- 1. walking in: when does the prompt come up? ------------------------
  R.approach = await page.evaluate(() => {
    for (let i = 0; i < 240; i++) {
      __frame(['RIGHT']);
      if (G.near === __sv()) { const g = __geo(); __release(); return g; }
    }
    __release(); return null;
  });
  await frames(2);
  await shot('1-prompt');
  R.label = await page.evaluate(() => { const said = []; const real = window.ftxt;
    window.ftxt = function (s) { said.push(String(s)); return real.apply(this, arguments); };
    try { draw(performance.now()); } finally { window.ftxt = real; }
    return said.find(s => /Servo/.test(s) && /E|wake/.test(s)) || null; });
  // ---- 2. she walks right into him anyway, and talks -----------------------
  R.inside = await page.evaluate(() => {
    for (let i = 0; i < 60 && Math.abs(__geo().dx) > 4; i++) __frame([__geo().dx < 0 ? 'RIGHT' : 'LEFT']);
    __release(); for (let i = 0; i < 20; i++) __frame();
    return __geo();
  });
  await shot('2-walked-into-him');
  await talkPress();
  await frames(18);
  R.talkDark = await page.evaluate(() => Object.assign(__geo(), { line: G.dialog && String(G.dialog.lines[G.dialog.i]) }));
  await shot('3-talk-dark');
  R.grounded = await page.evaluate(() => { const g = __geo(); return { feet: g.feet, floor: g.floor, tile: Math.round(g.feet / TILE) * TILE }; });
  // ---- 3. the dark line and the seat; while he wakes she walks into him ----
  R.darkLines = await readAll(10);
  R.waking = await page.evaluate(() => {
    const out = { live: npcLive(__sv()), cells: invCount('batt'), wake: OP.servoWake };
    // the waking beat is in PLAY: she walks straight into him while it plays
    for (let i = 0; i < 90 && G.state === 'PLAY'; i++) __frame([__geo().dx < 0 ? 'RIGHT' : 'LEFT']);
    __release();
    for (let i = 0; i < 120 && G.state === 'PLAY'; i++) __frame();
    for (let i = 0; i < 18; i++) __frame();
    return Object.assign(out, { introOpen: G.state === 'DIALOG' && G.dialog && G.dialog.npc === 'servo', geo: __geo() });
  });
  await shot('4-intro');
  R.intro = await readAll(30);
  R.quest = await page.evaluate(() => qState('servo_coil'));
  // ---- 4. a second talk ------------------------------------------------------
  await page.evaluate(() => { for (let i = 0; i < 30; i++) __frame(); });
  await talkPress(); await frames(18);
  R.repeatGeo = await page.evaluate(() => __geo());
  await shot('5-second-talk');
  R.repeat = await readAll(20);
  // ---- 5. the coil comes home (fetching it is the gantry climb, a route of
  // its own: the harness puts it in her bag; the hand-in is played) ----------
  const before = await page.evaluate(() => { G.save.bag = G.save.bag || {}; G.save.bag.coil = 1;
    for (let i = 0; i < 30; i++) __frame(); return { scrap: G.save.scrap, iq: G.save.iq | 0 }; });
  await talkPress(); await frames(18);
  R.thanksGeo = await page.evaluate(() => __geo());
  await shot('6-coil-thanks');
  R.thanks = await readAll(20);
  // cards the hand-in raises (the reward) are read too
  for (let k = 0; k < 6; k++) { const more = await readAll(20); if (!more.length) break; R.thanks.push(...more); }
  R.paid = await page.evaluate((b) => { for (let i = 0; i < 60; i++) __frame();
    return { q: qState('servo_coil'), scrap: G.save.scrap - b.scrap, iq: (G.save.iq | 0) - b.iq,
      spin: opDrumSpin(1000) !== opDrumSpin(2000), joy: !!G.save.flags.opCoilJoy }; }, before);
  await shot('7-drum-true');
  await talkPress(); await frames(18);
  R.afterGeo = await page.evaluate(() => __geo());
  R.after = await readAll(20);
  R.errors = errs;
  await ctx.close();
  return R;
}

(async () => {
  console.log('── servo-presence — Old Servo, stood beside: prompt, stand-off, grounding, the whole arc\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  for (const mode of ['desktop', 'phone']) {
    const R = await run(browser, mode);
    const m = mode + ': ';
    const a = R.approach;
    check(m + 'the prompt comes up while she is still clear of his drawn body', !!a && a.gap >= 0 && a.dx < 0,
      a && { dx: Math.round(a.dx), gap: Math.round(a.gap), half: Math.round(a.half) });
    check(m + '...and it says what the press will do (wake Old Servo)', !!R.label, R.label);
    check(m + 'walked into him on purpose, she is inside his body', !!R.inside && Math.abs(R.inside.dx) < R.inside.half - 10,
      R.inside && { dx: Math.round(R.inside.dx), half: Math.round(R.inside.half) });
    const td = R.talkDark;
    check(m + 'the talk steps her out to his side, clear of his body', td && td.state === 'DIALOG' && td.gap >= -1,
      td && { dx: Math.round(td.dx), gap: Math.round(td.gap), standOff: Math.round(td.standOff) });
    check(m + '...facing him, on the floor', td && td.toward && td.on, td && { face: td.face, on: td.on });
    check(m + 'he stands on the meadow floor (feet on the ground)', Math.abs(R.grounded.feet - R.grounded.floor) <= 2,
      R.grounded);
    if (mode === 'phone') check(m + 'the on-screen E button was there to press', !R.noTouchE);
    check(m + 'dark, he cannot speak: the line is hers, and the spare cell is seated',
      R.darkLines.length >= 1 && R.waking.live && R.waking.cells === 0, { lines: R.darkLines, live: R.waking.live });
    check(m + 'his first say opens by itself after the waking', R.waking.introOpen);
    check(m + '...and she is beside him for it, though she walked into him while he woke',
      R.waking.geo.gap >= -1 && R.waking.geo.toward, { dx: Math.round(R.waking.geo.dx), gap: Math.round(R.waking.geo.gap) });
    const il = R.intro.join(' ');
    check(m + 'he says who he is, the way to the marble, the coil, and the reward (60 scrap, 10 IQ)',
      mode !== 'desktop' || (/Old Servo/.test(il) && /loose floor/.test(il) && /coil/.test(il) && /60 scrap/.test(il) && /10 IQ/.test(il)),
      mode === 'desktop' ? R.intro : R.intro.length + ' pages');
    check(m + 'the coil errand is taken', R.quest === 'active', R.quest);
    check(m + 'a second talk says something else', R.repeat.length > 0 && !R.repeat.some(l => R.intro.indexOf(l) >= 0), R.repeat);
    check(m + '...beside him', R.repeatGeo.gap >= -1 && R.repeatGeo.toward, Math.round(R.repeatGeo.gap));
    check(m + 'the coil home is answered', R.thanks.length > 0 && !R.thanks.some(l => R.repeat.indexOf(l) >= 0), R.thanks);
    check(m + '...beside him', R.thanksGeo.gap >= -1 && R.thanksGeo.toward, Math.round(R.thanksGeo.gap));
    check(m + '...and paid as promised, and his drum turns true', R.paid.q === 'done' && R.paid.scrap === 60 && R.paid.iq === 10 && R.paid.spin && R.paid.joy, R.paid);
    check(m + 'after the coil, he says something new again', R.after.length > 0 && !R.after.some(l => R.repeat.indexOf(l) >= 0 || R.intro.indexOf(l) >= 0), R.after);
    check(m + '...beside him', R.afterGeo.gap >= -1 && R.afterGeo.toward, Math.round(R.afterGeo.gap));
    check(m + 'no page errors', !R.errors.length, R.errors.slice(0, 3));
  }
  await browser.close();
  console.log('  shots in tests/out/servo-presence/');
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she stands beside Old Servo, and he has something new to say each time');
})().catch(e => { console.error(e); process.exit(1); });
