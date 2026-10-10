// THE OPENING, PLAYED IN ORDER (owner's order, 2026-10-09).
//
// "Wake → movement and jump → city gate → Ratchet's booth → letter and repair
// → explanation → save/recharge pod → Volt Pack explanation and acquisition →
// healing/charged-attack lesson → nearby puzzle monument → onward into the
// meadow. Teach only one action at a time."
//
// This plays it from a clean save with REAL INPUT ONLY — the keyboard, the
// repair board's own buttons, the counter's own keys, the puzzle's own keys.
// No flag is set, nothing is teleported, no scrap is handed in by the harness.
// It follows what the chip on screen says, the way a player does, and checks
// on the way:
//
//   the steps arrive in the owner's order, each prompt asks for ONE control;
//   the letter is read before the battery, the battery before the repair;
//   the pod saves (the save point moves to the den, a confirmation is shown)
//     before the Volt Pack is introduced;
//   the pack is explained (what, why, cost) before the counter opens, the
//     counter marks it as the permanent pack, and it is bought with ZERO scrap
//     gathered from the floor — Ratchet's payment covers it exactly;
//   the monument stands east of the booth door, within one screen of it,
//     before the way out — no retracing;
//   no two overlays are ever up at once (dialogue, item card, counter, repair
//     board, puzzle, film, lesson chip), and the goal line never sits on the
//     chip;
//   in the meadow Old Servo reads as switched off with a cue, wakes on the
//     spare cell, says who he is, where the marble is, and what he wants for
//     what reward — and answers when the coil comes home.
//
// Every step is photographed at 1280x720 (keyboard) and on a 390x844 phone
// with touch controls, turned to landscape as the game asks (844x390):
// tests/out/opening-order/.
//
//   node tests/opening-order.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out', 'opening-order');
fs.mkdirSync(OUT, { recursive: true });

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail))));
  if (!ok) fails.push(name);
};
const WANT = ['move', 'out', 'jump', 'gate', 'booth', 'note', 'drawer', 'repair', 'pod', 'pack', 'heal', 'atk', 'burst', 'node', 'go'];

async function play(browser, mode) {
  const phone = mode === 'phone';
  const ctx = await browser.newContext(phone
    // the 390x844 phone, held the way the game asks to be held: in portrait
    // it shows "rotate your phone" (photographed once, below), so the walk is
    // played on the same phone turned to 844x390
    ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof heroArtReady === 'function' && heroArtReady(), null, { timeout: 30000 });
  await page.mouse.click(8, 8);
  await page.evaluate(() => { startGame(newSave(1)); });
  if (phone) {
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'phone-portrait-390x844.png') });
    await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  }
  const R = { mode, steps: [], shots: [], dialogs: [], overlap: [], goalOnChip: [], scrapAtShop: null,
    shopRow: null, packTalk: null, podSaved: null, podBanner: false, stepLog: [], monument: null, pickups: 0,
    multiAction: [], unfilled: [], servo: {} };
  let held = null;
  const steer = async k => { if (held === k) return; if (held) await page.keyboard.up(held); held = k; if (k) await page.keyboard.down(k); };
  const shot = async (name) => {
    const f = path.join(OUT, mode + '-' + String(R.shots.length).padStart(2, '0') + '-' + name + '.png');
    await page.screenshot({ path: f });
    R.shots.push(path.basename(f));
  };
  const deadline = Date.now() + 240000;
  let lastStep = null, lastDialog = '';
  const shotSeen = new Set();
  while (Date.now() < deadline) {
    const s = await page.evaluate(() => {
      const st = G.tut && !G.save.flags.tut && TUT_STEPS[G.tut.i];
      const p = st && G.state === 'PLAY' && !G.dialog ? tutPrompt(st) : null;
      const chipNow = G.tutChip && G.tutChip.at === (G.simClock || 0);
      const goal = typeof opGoalKey === 'function' && opGoalKey();
      const overlays = [G.dialog && 'dialog', G.state === 'SHOP' && 'shop', document.getElementById('ratchet-repair') && 'repair',
        G.state === 'TRIAL' && 'trial', (G.cut || G.state === 'CUT') && 'film',
        (G.offer || G.state === 'OFFER') && 'offer', G.state === 'COMICS' && 'comic',
        chipNow && G.state === 'PLAY' && !G.dialog && 'chip'].filter(Boolean);
      const gr = goal && G.state === 'PLAY' && typeof opGoalRect === 'function' ? (() => {
        c.save(); c.font = '600 13px "Segoe UI", Tahoma, sans-serif';
        const w = Math.min(420, c.measureText(ctlFill(t(goal))).width + 40); c.restore();
        return opGoalRect(w); })() : null;
      const chip = chipNow ? G.tutChip : null;
      const hint = p ? ctlFill(t(p.hint)) : '';
      return {
        room: G.roomId, state: G.state, step: st ? st.id : null, i: G.tut ? G.tut.i : -1,
        action: p && p.action, target: p && p.target && p.target.x, hint, label: p && t(p.label),
        key: p && tutHand(p), hold: G.tut ? G.tut.hold : 0,
        x: player.x + player.w / 2, on: player.on, cores: player.cores, max: player.maxCores(),
        volts: player.volts, scrap: G.save.scrap, iq: G.save.iq | 0,
        dialog: G.dialog ? { name: G.dialog.name, line: G.dialog.lines[G.dialog.i], i: G.dialog.i, n: G.dialog.lines.length, art: G.dialog.art, demo: G.dialog.demo } : null,
        shopIdx: G.shopIdx, rech: !!G.recharge, wake: !!G.wake, cut: !!G.cut, gate: !!G.gateWalk, trans: !!G.trans,
        overlays, goal, goalRect: gr, chip,
        bench: G.save.bench && G.save.bench.room, podBanner: typeof OP !== 'undefined' && OP.podBanner > 0,
        flagsTut: !!G.save.flags.tut, mem: typeof TRI !== 'undefined' && G.state === 'TRIAL' ? { phase: TRI.memPhase, seq: TRI.memSeq && TRI.memSeq.slice(), st: TRI.st, game: TRI.game } : null,
        pickups: Object.keys(G.save.flags).filter(k => /^sc_/.test(k)).length,
      };
    });
    if (s.overlays.length > 1) R.overlap.push(s.overlays.join('+') + '@' + s.step);
    if (s.goalRect && s.chip) {
      const a = s.goalRect, b = s.chip;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) R.goalOnChip.push(s.step);
    }
    if (s.podBanner) R.podBanner = true;
    R.pickups = s.pickups;
    if (s.step && s.step !== lastStep) {
      R.steps.push(s.step); lastStep = s.step;
      R.stepLog.push({ step: s.step, room: s.room, scrap: s.scrap, bench: s.bench });
    }
    // a prompt is ONE control, and the hint has no unfilled control name
    if (s.action && s.key && /\s\/\s|\+/.test(s.key)) R.multiAction.push(s.step + ':' + s.key);
    if (s.hint && /\{[A-Z]+\}/.test(s.hint)) R.unfilled.push(s.step + ':' + s.hint);
    // ---- photograph each new step, once it is the thing on screen ----
    const shotKey = s.room + ':' + s.step + ':' + (s.action || '');
    if (s.state === 'PLAY' && s.step && !(s.hold > 0) && !s.rech && !shotSeen.has(shotKey) && !s.trans && !s.gate && !s.wake) {
      shotSeen.add(shotKey); await page.waitForTimeout(120); await shot(s.step + '-' + (s.action || 'x').toLowerCase());
    }
    // ---- dialogue, item cards ----
    if (s.state === 'DIALOG' && s.dialog) {
      const dk = s.dialog.name + '|' + s.dialog.i + '|' + s.dialog.line;
      if (dk !== lastDialog) {
        lastDialog = dk;
        R.dialogs.push({ step: s.step, room: s.room, name: s.dialog.name, line: s.dialog.line, art: s.dialog.art, demo: s.dialog.demo });
        if (s.dialog.i === 0) await shot('dialog-' + (s.step || s.room));
      }
      // a reader's pace (js/overlay.js): a press inside 0.22 s of the last is a
      // mash and turns no page
      await steer(null); await page.keyboard.press('KeyE'); await page.waitForTimeout(320); continue;
    }
    // ---- the manhwa at its story moment (js/panels.js), read like a player ----
    if (s.state === 'PANELS') {
      if (!R.panels) R.panels = [];
      if (R.panels[R.panels.length - 1] !== s.room) R.panels.push(s.room);
      await steer(null); await page.keyboard.press('Enter'); await page.waitForTimeout(350); continue;
    }
    // ---- the repair board, by its own buttons ----
    if (s.state === 'REPAIR') {
      await steer(null);
      await shot('repair-board');
      const pairs = [['cell', 'socket'], ['positive', 'plus'], ['negative', 'minus'], ['bridge', 'relay']];
      for (const [a, b] of pairs) {
        await page.click('#ratchet-repair [data-piece="' + a + '"]');
        await page.click('#ratchet-repair [data-target="' + b + '"]');
      }
      await page.click('#ratchet-repair .repair-power');
      await page.waitForFunction(() => G.state !== 'REPAIR', null, { timeout: 8000 });
      continue;
    }
    // ---- the counter: the marked row is the pack, and it is affordable ----
    if (s.state === 'SHOP') {
      await steer(null);
      if (!R.shopRow) {
        R.scrapAtShop = s.scrap;
        R.shopRow = await page.evaluate(() => {
          const it = SHOP[G.shopIdx];
          const row = opShopRow(it, 130 + G.shopIdx * 46, true);
          return { type: it.type, name: row && row.name, desc: row && row.desc, cost: it.cost,
            others: SHOP.filter(q => q !== it).map(q => { const r = opShopRow(q, 0, false); return r && r.locked; }) };
        });
        await page.waitForTimeout(400);
        await shot('counter');
      }
      await page.keyboard.press('Enter'); await page.waitForTimeout(160); continue;
    }
    // ---- the puzzle, answered from what it showed ----
    if (s.state === 'TRIAL') {
      await steer(null);
      if (s.mem && s.mem.game === 'mem' && s.mem.phase === 'input' && s.mem.st !== 'pre') {
        await shot('monument-puzzle');
        const KEY = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
        for (const k of s.mem.seq) { await page.keyboard.press(KEY[k], { delay: 40 }); await page.waitForTimeout(90); }
        await page.waitForTimeout(300);
      } else await page.waitForTimeout(120);
      continue;
    }
    if (s.state === 'COMICS') { R.comics = (R.comics || 0) + 1; await steer(null); await page.keyboard.press('Escape'); await page.waitForTimeout(200); continue; }
    if (s.state !== 'PLAY' || s.wake || s.cut || s.gate || s.trans) { await steer(null); await page.waitForTimeout(90); continue; }
    if (s.flagsTut || !s.step) { if (s.room === 'A1') break; }
    if (s.hold > 0 || s.rech) { await steer(null); await page.waitForTimeout(90); continue; }
    if (s.step === 'node' && !R.monument) {
      R.monument = await page.evaluate(() => {
        const node = G.statics.find(q => q.type === 'riddle');
        const door = gateDoorsAll('A0').find(d => d.style === 'booth');
        return { node: node.x + node.w / 2, door: gateWorldX(door), exit: (G.roomDef.w - 1) * TILE,
          screen: 960 / worldZoom(), winch: (G.enemies.find(e => e.mechanism === 'winch') || {}).x };
      });
    }
    // ---- follow the chip ----
    if (s.action === 'MOVE' || !s.action) {
      const right = ['out', 'go', 'move'].includes(s.step) || s.target == null || s.target > s.x + 6;
      // close to the thing: a short step, the way a player lines up on it
      if (s.target != null && Math.abs(s.target - s.x) < 70 && !['out', 'go', 'move'].includes(s.step)) {
        await steer(null); const k = right ? 'ArrowRight' : 'ArrowLeft';
        await page.keyboard.down(k); await page.waitForTimeout(45); await page.keyboard.up(k); await page.waitForTimeout(160);
      } else { await steer(right ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(80); }
    } else if (s.action === 'JUMP') {
      await steer('ArrowRight'); await page.keyboard.press('Space', { delay: 220 }); await page.waitForTimeout(80);
    } else if (s.action === 'UP') {
      await steer(null); await page.keyboard.press('ArrowUp', { delay: 80 }); await page.waitForTimeout(200);
    } else if (s.action === 'INT') {
      await steer(null); await page.keyboard.press('KeyE', { delay: 60 }); await page.waitForTimeout(200);
    } else if (s.action === 'ATK' && s.step === 'burst') {
      await steer(null); await page.keyboard.down('KeyX'); await page.waitForTimeout(900);
      await shot('burst-charging');
      await page.keyboard.up('KeyX'); await page.waitForTimeout(400);
    } else if (s.action === 'ATK') {
      await steer(null); await page.keyboard.press('KeyX', { delay: 50 }); await page.waitForTimeout(250);
    } else if (s.action === 'HEAL') {
      await steer(null); await page.keyboard.down('KeyF'); await page.waitForTimeout(1600); await page.keyboard.up('KeyF');
      await page.waitForTimeout(200);
    } else { await steer(null); await page.waitForTimeout(90); }
  }
  await steer(null);
  // ---- the meadow: Old Servo ----
  const inMeadow = await page.evaluate(() => G.roomId);
  R.end = inMeadow;
  if (inMeadow === 'A1') {
    await page.waitForTimeout(600);
    await shot('meadow-arrival');
    // walk to him (he stands at the west end, the first person in the meadow)
    for (let k = 0; k < 60; k++) {
      const d = await page.evaluate(() => { const sv = G.statics.find(q => q.extra === 'servo'); return { near: G.near === sv, dx: sv.x + sv.w / 2 - player.x - player.w / 2, live: npcLive(sv) }; });
      if (d.near) break;
      await steer(d.dx > 0 ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(70);
    }
    await steer(null);
    R.servo.before = await page.evaluate(() => {
      const sv = G.statics.find(q => q.extra === 'servo');
      const A = atlasOf('servo');
      return { live: npcLive(sv), cells: invCount('batt'), k: A.sub.servo.k, drawnH: sv.h * A.sub.servo.k,
        // the floor is the ground she walks on — the heightfield where the
        // meadow has one (pgFloorY), not the tile line under it
        heroH: player.h, onFloor: Math.abs((sv.y + sv.h) - pgFloorY(sv.x + sv.w / 2)) < 2 };
    });
    // the cue is drawn while she approaches; photograph it a step back
    await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(260); await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(200);
    await shot('servo-dark-cue');
    for (let k = 0; k < 30; k++) {
      const n = await page.evaluate(() => G.near && G.near.extra === 'servo');
      if (n) break;
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(40); await page.keyboard.up('ArrowRight');
    }
    // talk: seat the cell, watch him wake, hear him out
    const seen = [];
    await page.keyboard.press('KeyE');
    // a reader's pace throughout (js/overlay.js: a press inside 0.22 s of the
    // last is a mash and turns no page)
    for (let k = 0; k < 160; k++) {
      const d = await page.evaluate(() => ({ state: G.state, d: G.dialog && { name: G.dialog.name, line: G.dialog.lines[G.dialog.i], i: G.dialog.i }, live: npcLive(G.statics.find(q => q.extra === 'servo')), q: qState('servo_coil'), wake: OP.servoWake }));
      if (d.d) {
        const key = d.d.line;
        if (seen[seen.length - 1] !== key) { seen.push(key); if (seen.length === 2) await shot('servo-intro'); }
        await page.keyboard.press('KeyE'); await page.waitForTimeout(320); continue;
      }
      if (d.wake > 0.8 && !R.servo.wakeShot) { R.servo.wakeShot = 1; await shot('servo-waking'); }
      if (d.live && d.q === 'active' && !d.d && seen.length >= 4) break;
      await page.waitForTimeout(120);
    }
    R.servo.lines = seen;
    R.servo.after = await page.evaluate(() => ({ live: npcLive(G.statics.find(q => q.extra === 'servo')), q: qState('servo_coil'), cells: invCount('batt') }));
    await page.waitForTimeout(500);
    await shot('servo-awake');
    // a repeat visit says something else, and does not repeat the intro
    await page.keyboard.press('KeyE'); await page.waitForTimeout(350);
    R.servo.repeat = await page.evaluate(() => G.dialog && G.dialog.lines.slice());
    for (let k = 0; k < 40 && await page.evaluate(() => !!G.dialog); k++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(320); }
    // THE COIL COMES HOME. Fetching it is the climb into the gantries — a
    // route, not the opening — so the harness puts it in her bag, and the
    // hand-in itself is played: talk to him, read the thanks, see the drum.
    await page.evaluate(() => { G.save.bag = G.save.bag || {}; G.save.bag.coil = 1; });
    const scrap0 = await page.evaluate(() => G.save.scrap);
    await page.keyboard.press('KeyE'); await page.waitForTimeout(350);
    R.servo.thanks = await page.evaluate(() => G.dialog && G.dialog.lines.slice());
    for (let k = 0; k < 40 && await page.evaluate(() => !!G.dialog); k++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(320); }
    await page.waitForTimeout(400);
    R.servo.paid = await page.evaluate((s0) => ({ q: qState('servo_coil'), scrap: G.save.scrap - s0, joy: OP.coilJoy, spin: opDrumSpin(1000) !== opDrumSpin(2000) }), scrap0);
    await shot('servo-coil-home');
  }
  R.errors = errors;
  await ctx.close();
  return R;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  console.log('── opening-order — the opening, played in the owner\'s order with real input');
  for (const mode of ['desktop', 'phone']) {
    const R = await play(browser, mode);
    console.log('\n  [' + mode + '] steps: ' + R.steps.join(' -> ') + '   end: ' + R.end);
    check(mode + ': the opening reaches the meadow', R.end === 'A1', R.end);
    check(mode + ': every step, in the owner\'s order', JSON.stringify(R.steps) === JSON.stringify(WANT), R.steps.join(','));
    check(mode + ': every prompt names one control', !R.multiAction.length, R.multiAction.slice(0, 4));
    check(mode + ': every hint names her real controls (nothing left unfilled)', !R.unfilled.length, R.unfilled.slice(0, 3));
    const lines = R.dialogs.map(d => d.line || '');
    const iLetter = lines.findIndex(l => /letter/i.test(l) && /socket/i.test(l));
    const iBatt = R.dialogs.findIndex(d => d.art === 'repairBattery');
    const iWake = R.dialogs.findIndex(d => /Ratchet/.test(d.line || '') && /I.m Ratchet/.test(d.line || ''));
    if (mode === 'desktop') {
      check('the letter is read before the battery is found', iLetter >= 0 && iBatt > iLetter, iLetter + ' < ' + iBatt);
      check('...his battery has its own card, with its art', iBatt >= 0, R.dialogs[iBatt] && R.dialogs[iBatt].line);
      check('...and he wakes after the repair, and says who he is', iWake > iBatt, iWake);
      const expl = lines.slice(iWake, iWake + 6).join(' ');
      check('the explanation: the song infected, the marble slowed it, the battery pulled, she was asleep, raw marble below, a white sword',
        /infected/.test(expl) && /marble/.test(expl) && /battery out/.test(expl) && /asleep/.test(expl) && /raw marble/.test(expl) && /white sword/.test(expl));
      const iSpare = R.dialogs.findIndex(d => /Spare Power Cell/.test(d.line || ''));
      check('the spare Power Cell is handed over with a card that names Servo', iSpare > iWake && /Servo/.test(lines[iSpare]), lines[iSpare]);
      const iPod = lines.findIndex(l => l === 'This pod saves your progress and recharges you. Use it before you leave.');
      check('Ratchet sends her to the pod in the owner\'s words', iPod > iSpare, iPod);
      const iPack = lines.findIndex(l => /Volt Pack fixes that/.test(l));
      const podStep = R.stepLog.find(q => q.step === 'pack');
      check('the pod saves first: the save point is in the den before the pack is introduced', podStep && podStep.bench === 'A0B', podStep);
      check('...and the save is confirmed on screen', R.podBanner);
      check('the pack is explained — what, why, the cost — before the counter opens',
        iPack > iPod && /12 scrap/.test(lines.slice(iPack, iPack + 3).join(' ')) && /marble/.test(lines.slice(iPack, iPack + 3).join(' ')));
      const iScrap = R.dialogs.findIndex(d => /^12 Scrap/.test(d.line || ''));
      check('...he pays her the 12 scrap with a card that says what scrap is', iScrap > iPack && /money/.test(lines[iScrap]), lines[iScrap]);
      check('the counter opens on the Volt Pack, marked permanent, the rest locked until it is bought',
        R.shopRow && R.shopRow.type === 'cell' && /permanent/.test(R.shopRow.name) && R.shopRow.others.every(Boolean), R.shopRow);
      const iCard = R.dialogs.findIndex(d => d.demo === 'pack');
      check('...and the purchase card shows the two verbs with her controls', iCard > iScrap && /hold F/i.test(lines[iCard]) && /hold X/i.test(lines[iCard]), lines[iCard]);
    }
    check(mode + ': the Volt Pack is bought with zero scrap gathered from the floor', R.scrapAtShop === 12 && R.pickups === 0, { scrapAtShop: R.scrapAtShop, pickups: R.pickups });
    if (R.monument) {
      const m = R.monument;
      check(mode + ': the monument is east of the booth door, within one screen, before the way out',
        m.node > m.door && m.node - m.door < m.screen && m.node < m.exit, m);
      check(mode + ': ...and the winch stands between them, on the road', m.winch > m.door && m.winch < m.node, m);
    } else check(mode + ': the monument was reached', false);
    check(mode + ': no two overlays at once', !R.overlap.length, R.overlap.slice(0, 5));
    check(mode + ': the goal line never sits on the lesson chip', !R.goalOnChip.length, R.goalOnChip.slice(0, 5));
    const S = R.servo;
    check(mode + ': Servo is switched off on arrival, drawn bigger than her, and standing on the floor',
      S.before && !S.before.live && S.before.cells === 1 && S.before.drawnH > S.before.heroH * 1.4 && S.before.onFloor, S.before);
    check(mode + ': the spare cell wakes him', S.after && S.after.live && S.after.cells === 0, S.after);
    const sl = (S.lines || []).join(' ');
    if (mode === 'desktop') {
      check('Servo introduces himself, explains the way to the marble, and names the coil task and its reward',
        /Old Servo/.test(sl) && /loose floor/.test(sl) && /coil/.test(sl) && /60 scrap/.test(sl) && /10 IQ/.test(sl), S.lines);
      check('...a repeat visit is not the intro again', S.repeat && !S.repeat.some(l => /keeper of this winding house/.test(l)), S.repeat);
      check('...and the coil coming home is answered and paid', S.paid && S.paid.q === 'done' && S.paid.scrap === 60 && S.paid.spin, S.paid);
    }
    check(mode + ': the coil errand is taken', S.after && S.after.q === 'active');
    check(mode + ': no page errors', !R.errors.length, R.errors.slice(0, 3));
    console.log('  shots: ' + R.shots.length + ' in tests/out/opening-order/');
  }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one step at a time, in order, forward, to the meadow and Old Servo');
})().catch(e => { console.error(e); process.exit(1); });
