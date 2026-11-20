// NO RUNNING FROM A FIGHT, AND NO STEPS SHE DID NOT TAKE (owner, 2026-11-20).
//
//   "When I'm in the alpha chamber, the gate should deactivate once I'm inside
//    until I go outside so that I wouldn't run away from the alpha."
//   "when the cat comes out of the gate to face the alpha, it glitches into
//    multiple moves by its own."
//
// This holds:
//   - in every boss room that has a ring, the rings sleep while the boss is
//     fighting (met, awake, not beaten) and wake when it is purified; walking
//     into one does not take her, and before the fight opens it still does;
//   - the howl's shove is a skid — she is blown back, braced — and never a
//     walk or run cycle she did not ask for; and her body is drawn throughout.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const R = await p.evaluate(() => {
    const rooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'boss'));
    const out = { rooms: [], bad: [] };
    for (const id of rooms) {
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
      Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1 });
      startGame(sv); loadRoom(id); G.state = 'PLAY'; G.dialog = null;
      const doors = gateDoorsAll(id);
      if (!doors.length || !G.boss) continue;
      const B = G.boss;
      // before the fight: as the room has it (asleep or not, it is not sealed by the fight)
      B.meet = true;
      const before = doors.map(d => gateFightSealed(d));
      // the fight
      B.meet = false; B.dead = false; B.purified = false; if (B.st === 'dorm') B.st = 'idle';
      const during = doors.map(d => gateLocked(d));
      // stand her in a ring and ask it to take her
      const d0 = doors[0]; player.x = gateWorldX(d0) - player.w / 2; G.gateWalk = null;
      const took = gateEnter() && !!G.gateWalk; G.gateWalk = null;
      // purified
      B.dead = true; B.purified = true;
      const after = doors.map(d => gateFightSealed(d));
      out.rooms.push(id + ':' + doors.length);
      if (before.some(Boolean) || !during.every(Boolean) || took || after.some(Boolean))
        out.bad.push(id + ' before=' + before + ' during=' + during + ' took=' + took + ' after=' + after);
    }
    return out;
  });
  check('every boss room\'s rings sleep while the boss fights, and wake when it is purified', R.rooms.length >= 2 && R.bad.length === 0,
    R.bad.slice(0, 3).join(' | ') || R.rooms.join(' '));
  check('...including the Alpha\'s den', R.rooms.some(r => /^A10:/.test(r)), R.rooms.join(' '));

  // the howl's shove
  const H = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1 });
    startGame(sv); loadRoom('A10'); G.state = 'PLAY'; G.dialog = null;
    mediaFetch('transSkid', 1);
    for (let i = 0; i < 80 && !(MEDIA_IMG.transSkid && MEDIA_IMG.transSkid.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    const B = G.boss; B.meet = false; B.st = 'idle';
    player.x = B.cx() + 200; player.y = B.y + B.h - player.h; player.vx = 0; player.on = true;
    for (const k in keys) keys[k] = false;
    for (let i = 0; i < 20; i++) update(1 / 60);
    RIPPLES.length = 0; B.face = 1;
    alphaHowlFx(B);
    const seen = {}; let moved = 0, undrawn = 0;
    const x0 = player.x;
    for (let f = 0; f < 150; f++) {
      update(1 / 60); G.dialog = null; G.state = 'PLAY';
      draw(performance.now());
      const st = player.heroState(Math.abs(player.vx) > 200);
      if (Math.abs(player.vx) > 12 && player.on) { seen[st] = (seen[st] || 0) + 1; moved++; if (!G.heroDrawn || /^loading:/.test(G.heroDrawn)) undrawn++; }
    }
    return { seen, moved, undrawn, pushed: Math.round(player.x - x0) };
  });
  const walked = Object.keys(H.seen).filter(s => /^(walk|run)_/.test(s));
  check('the howl blows her back a step', Math.abs(H.pushed) > 20, H.pushed + ' px');
  check('...braced in a skid, never a walk or run she did not ask for', H.moved > 0 && walked.length === 0 && (H.seen.skid || 0) > 0, JSON.stringify(H.seen));
  check('...and her body is drawn the whole way', H.undrawn === 0, H.undrawn + ' frames undrawn');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — no door out of a fight, and no step she did not take');
})().catch(e => { console.error(e); process.exit(1); });
