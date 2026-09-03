// THE CAVE IS DARK, AND LIGHT IS THE MAP.
//
// world.js has called the crystal cave "the long dark" since it was written,
// and said of its far end "the pillar SHINING at the end of the dark — the
// shine is the guide". Neither sentence was true on screen. The cave was lit
// end to end like a corridor with the lights on: the beacon terminal she is
// meant to walk sixty tiles toward was six pixels of amber in a fully lit
// magenta room, and the buried branch into the Seam was exactly as legible as
// the way on. Nothing could be a guide, because everything was equally
// visible.
//
// The owner asked for a tunnel "rich in experience". A tunnel is not rich
// because it holds more furniture; it is rich because it WITHHOLDS, and in a
// side-scroller lighting is the only thing that can withhold and still be
// fair. So this measures the four things that have to be simultaneously true
// for that trade to be worth making:
//
//   1. THE DARK EXISTS.     The cave is materially darker than the same room
//                           with G.darkProbe set. Otherwise nothing below
//                           means anything.
//   2. THE DARK IS FAIR.    The unlit rock is still a readable silhouette. A
//                           floor the player cannot see is not atmosphere, it
//                           is a bug they cannot report — so there is a FLOOR
//                           on the darkness as well as a ceiling.
//   3. SHE CARRIES A LIGHT. The frame around the body out-reads the frame far
//                           from any source, by a ratio, in a room where the
//                           only other light is across the map.
//   4. LIGHT IS A GUIDE.    In CV2 the beacon's corner of the room out-reads
//                           rock at the same height on the far side of it;
//                           in CV3 the pillar does the same, and does it
//                           HARDER, because it is the bigger errand.
//
// ...and one thing that must NOT be true: the dark stops at the cave mouth.
// A1 is a meadow at midday and has to be unchanged by any of this.
//
//   node tests/cavedark.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── cavedark — the cave is dark and light is the map\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
    startGame(sv);
    // THE HARNESS OWNS THE CLOCK.
    //
    // Every number in this file is read off the live backbuffer, and what is on
    // the backbuffer depends on two things a busy machine changes: how many
    // simulation steps mainLoop packed into the frames waited for, and where in
    // its cycle the lighting's own wall-clock animation happens to be. That is
    // the whole reason this file grew retry loops and two-reads-must-agree
    // rules — every one of them is a symptom, and the cause is that the
    // measurement was riding the browser's frame rate. So the game's loop is
    // unhooked, performance.now is stubbed, and a "frame" here is one call to
    // mainLoop with one synthetic 60 Hz tick. Same frame path, same drawing,
    // taken when this file says so. The retry loops stay: they also guard
    // against a state change that genuinely has not finished, which is a real
    // thing and not a timing artefact.
    //
    // Each driven frame still yields to the event loop, because room entry
    // starts real downloads and an image that never gets a turn to arrive is a
    // room drawn by the procedural fallback — a different measurement.
    // ...AND THE DICE TOO. The clock alone was not enough: motes, sparks and
    // flicker are rolled off Math.random, so "the ground across the room" came
    // back 18.15, then 36.95, then 19.84 on three runs of an unchanged build —
    // a factor of two, decided by dust. Seeded rather than frozen, so the
    // scene still has its life in it and has the SAME life every run.
    const realRand = Math.random;
    let sd = 0x9e3779b9;
    Math.random = () => {                            // mulberry32
      sd = (sd + 0x6d2b79f5) >>> 0;
      let x = sd;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    const realNow = performance.now, realRAF = window.requestAnimationFrame;
    let clk = realNow.call(performance);
    await new Promise(k => realRAF(k));
    window.requestAnimationFrame = () => 0;
    await new Promise(k => setTimeout(k, 40));      // let the armed callback land
    performance.now = () => clk;
    const STEP = 1000 / 60;
    const rest = async n => {
      for (let i = 0; i < n; i++) { clk += STEP; mainLoop(clk); await new Promise(k => setTimeout(k, 0)); }
    };
    // ...and art in flight is waited out on the REAL clock, so a room is
    // measured with its plates in rather than halfway through fetching them
    const artIn = async (ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < (ms || 8000)
             && Object.keys(MEDIA_PEND).some(k => MEDIA_LOW[k] !== 3))
        await new Promise(k => setTimeout(k, 50));
    };
    await artIn(15000);
    await rest(40);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const out = {};

    // Mean luminance of a screen-space box, sampled off the live backbuffer.
    // The backbuffer is resized by the quality dial, so every read scales its
    // own rect rather than trusting 960x540 (tests/shopread.cjs paid for that
    // lesson twice).
    const lum = (x, y, w, h) => {
      const s = cv.width / 960;
      const X = Math.max(0, Math.round(x * s)), Y = Math.max(0, Math.round(y * s));
      const W = Math.min(cv.width - X, Math.round(w * s)), H = Math.min(cv.height - Y, Math.round(h * s));
      if (W <= 0 || H <= 0) return 0;
      const d = ctx.getImageData(X, Y, W, H).data;
      let t = 0;
      for (let i = 0; i < d.length; i += 4) t += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      return +(t / (d.length / 4)).toFixed(2);
    };
    // The HUD is bright, opaque and screen-anchored, so every sample box below
    // stays out of the top 110 px and the bottom-right minimap.
    // PIN THE QUALITY DIAL. The additive glow rides richK, the same budget the
    // background depth plate rides, so on a machine that is struggling it fades
    // out and the lighting falls back to the shadow mask alone. That is the
    // intended behaviour — the mask is gameplay, the glow is a luxury — but it
    // made this harness report different numbers depending on how loaded the
    // machine was when it ran, which is the one thing a harness may not do. So
    // every reading below states which of the two paths it is measuring, and
    // the loop is prevented from changing its mind mid-measurement.
    const pin = async on => {
      richBG = !!on; richHold = 999; richK = on ? 1 : 0;
      await rest(6);
    };
    const enter = async (room, at) => {
      loadRoom(room);
      if (at != null) { player.x = at * TILE; player.y = (ROOMS[room].h - 3) * TILE; }
      G.dialog = null; G.trans = null; G.state = 'PLAY';   // NOT G.toast — it is a function
      await rest(2); await artIn();                        // kick the fetches, then let them land
      await rest(30);
    };

    // ---- 1 & 2: the dark exists, and it is fair -----------------------------
    // Measured on ROCK, not on the whole frame. A frame mean is dominated by
    // the HUD, the minimap and whatever is currently lit, and it moved 6% for
    // a pass that had halved the rock — which is how the first version of this
    // harness nearly certified a cave that was still fully lit. The patch is
    // high on the left wall of CV2, far above the floor lights and far from
    // wherever she is standing.
    // ...and measured with the glow OFF, which is the WORST case for both: the
    // deepest the dark ever gets and the least help the player ever has.
    await enter('CV2', 40);
    await pin(0);
    G.darkProbe = 1; await rest(8);
    out.rockLit = lum(30, 135, 220, 140);
    G.darkProbe = 0; await rest(8);
    out.unlit = lum(30, 135, 220, 140);

    // ---- 3: she carries one -------------------------------------------------
    // Park her in the middle of the long dark with the beacon behind her, and
    // compare the ground she is standing on against ground the same height
    // away across the room. Her own body is excluded from the box: she is
    // drawn post-grade and would measure her own paint, not her light.
    await enter('CV2', 40);
    await pin(1);
    const psx = player.x + player.w / 2 - camSX(), psy = player.y - camSY();
    out.nearHer = lum(psx + 70, psy - 10, 120, 110);
    out.farFromHer = lum(psx + 400 > 820 ? psx - 460 : psx + 400, psy - 10, 120, 110);

    // ---- 4: light is a guide ------------------------------------------------
    // TAKE IT AWAY, do not sample beside it. The first version compared the
    // terminal's corner against rock "400 px away" and 400 px away was where
    // the player was standing, so the beacon measured DIMMER than the room and
    // the harness was really reporting the position of her own lamp. The same
    // trick tests/shopread.cjs settled on: pull the fixture out of the room,
    // redraw, and the difference is exactly what it was contributing.
    // ...and she is PINNED while it happens. Her lamp cancels in a
    // take-it-away pair only if she has not moved between the halves, and she
    // does move: with the terrain step-up (entities.js, 2026-08-24) she walks
    // up rises that used to hold her, so a couple of seconds of settling
    // carried her toward the pillar and put her own light inside the sample.
    // The pillar's contribution then measured x1.28 instead of x4.35 — not
    // because the pillar dimmed, but because the box was already lit. Held
    // still, the pair differs by the fixture and by nothing else.
    const hold = async (n) => {
      const px0 = player.x, py0 = player.y;
      for (let i = 0; i < n; i++) {
        player.x = px0; player.y = py0; player.vx = 0; player.vy = 0;
        await rest(1);
      }
      player.x = px0; player.y = py0; player.vx = 0; player.vy = 0;
    };
    const away = async (find, box) => {
      const s2 = G.statics.find(find);
      if (!s2) return null;
      const b = box(s2);
      await hold(20);
      const on = lum(b[0], b[1], b[2], b[3]);
      const i = G.statics.indexOf(s2);
      G.statics.splice(i, 1); await hold(20);
      const off = lum(b[0], b[1], b[2], b[3]);
      G.statics.splice(i, 0, s2); await hold(8);
      return { on, off, at: [Math.round(b[0]), Math.round(b[1])] };
    };
    // THE BEACON. She stands thirteen tiles short of it — well outside her own
    // lamp's reach — so what is measured is the terminal's own glow across the
    // dark, which is the whole claim the room is making.
    await enter('CV2', 22);
    await pin(1);
    out.beaconM = await away(s2 => s2.type === 'term',
      t => [t.x + t.w / 2 - camSX() - 80, t.y - camSY() - 70, 160, 150]);
    // ...and the same fixture read from 300 px off, which is the REACH test.
    // Reach is the difference between a lamp and a landmark, and it is the one
    // claim that can be compared fairly between two fixtures in two rooms: the
    // same box size at the same distance, each measured against itself.
    //
    // The far box goes on the side AWAY FROM HER. It has to: her lamp appears
    // in both halves of a take-it-away pair and cancels exactly, but it also
    // raises both halves, and a ratio measured inside her own light is
    // compressed toward 1. The first attempt put both far boxes between her
    // and the fixture and reported that a 236 px beacon reached further than a
    // 372 px pillar, which is arithmetically impossible and was entirely an
    // artefact of where she was standing.
    const farBox = (o, w2) => {
      const cx2 = o.x + o.w / 2 - camSX(), py2 = o.y - camSY();
      const side = (player.x + player.w / 2 - camSX()) < cx2 ? 1 : -1;
      return [cx2 + side * 300 - w2 / 2, py2 - 60, w2, 120];
    };
    out.beaconFar = await away(s2 => s2.type === 'term', t => farBox(t, 120));
    // ...and once more with the glow given up, because that is the cave a
    // struggling phone actually gets and the beacon still has to be the reason
    // she walks that way. The mask alone carries a smaller number and it has to
    // carry a real one.
    await pin(0);
    out.beaconLean = await away(s2 => s2.type === 'term',
      t => [t.x + t.w / 2 - camSX() - 80, t.y - camSY() - 70, 160, 150]);
    await pin(1);
    // THE PILLAR, the same way, but the box is BESIDE it rather than on it.
    // The crystal is dormant until the supercharged claw wakes it, so its own
    // sprite is darker than the rock it stands in and a box centred on it
    // measured the light going DOWN when the pillar was present — which is
    // true of the crystal and false of the room. What the room is claiming is
    // that the rock around the pillar is lit by it, so that is what is read.
    // Her lamp falls inside the box either way and cancels: the take-it-away
    // pair differs by the pillar and by nothing else.
    await enter('CV3', 36);
    await pin(1);
    out.pillarM = await away(s2 => s2.type === 'pillar',
      pl => [pl.x - 190 - camSX(), pl.y - camSY() - 30, 130, 130]);
    // ...and for the pillar she stands on its FAR side, at the end of the
    // room, so the 300 px sample falls back down the tunnel she came up.
    await enter('CV3', 54);
    await pin(1);
    out.pillarFar = await away(s2 => s2.type === 'pillar', pl => farBox(pl, 120));

    // ---- the buried door leaks nothing ---------------------------------------
    // A5's mouth into the cave is buried under rubble, and the light through
    // it is the reward for breaking it. Measured in the room the rubble is in,
    // before and after: the same frame, one pile of rock apart.
    await enter('CV1', 20);
    await pin(1);
    const seam = gateDoorsAll('CV1').find(d => d.rubble === 'rubbleCV1B');
    if (seam) {
      const gx = gateWorldX(seam);
      player.x = gx - 300; await rest(24);
      const sx2 = gx - camSX(), sy2 = (G.roomDef.h - 4) * TILE - camSY();
      out.buried = lum(sx2 - 90, sy2 - 40, 180, 150);
      for (const rr of (G.rubbles || [])) if (rr.flag === seam.rubble) rr.hp = 0;
      await rest(24);
      out.opened = lum(sx2 - 90, sy2 - 40, 180, 150);
    }

    // ---- and the meadow is untouched ----------------------------------------
    // ...and the pair is only taken off a SETTLED frame. A1 is a big room with
    // weather, parallax and a camera that is still arriving for the first
    // second, and read too early it produced a 77-against-46 pair that looked
    // exactly like the cave pass leaking into the meadow and was nothing but a
    // frame caught mid-load. So: two reads of the same state must agree before
    // the comparison is allowed to mean anything.
    await enter('A1', 14);
    await pin(1);
    await rest(40);
    for (let attempt = 0; attempt < 5; attempt++) {
      const a1 = lum(0, 130, 960, 340);
      await rest(10);
      const a2 = lum(0, 130, 960, 340);
      if (Math.abs(a1 - a2) > 1.2) { await rest(30); continue; }
      // ...AND SO MUST THE PROBE READ. The stability rule above was written for
      // the first half of the pair and never applied to the second, so the
      // comparison could still be made against a frame caught mid-transition:
      // under a loaded machine this read 73.0 against a settled 77.2 and
      // reported the cave pass leaking into the meadow, while the same run
      // alone reads 76.28 against 76.20. Turning the probe on is a state
      // change like any other and gets the same two-reads-must-agree treatment.
      G.darkProbe = 1; await rest(10);
      const b1 = lum(0, 130, 960, 340);
      await rest(10);
      const b2 = lum(0, 130, 960, 340);
      G.darkProbe = 0;
      if (Math.abs(b1 - b2) > 1.2) { await rest(30); continue; }
      out.meadow = a2; out.meadowProbe = b2; out.meadowTries = attempt + 1;
      break;
    }
    // hand the clock back and RE-ARM the loop — restoring requestAnimationFrame
    // alone leaves mainLoop stopped with nothing left to call it
    performance.now = realNow; window.requestAnimationFrame = realRAF;
    Math.random = realRand;
    realRAF.call(window, mainLoop);
    return out;
  });

  // 1. the dark exists. Every number here is POST-LIFT — what the player
  //    actually sees through drawScreenLift's accessibility floor — because
  //    that is the frame the owner opens the game to, and a pass tuned against
  //    the raw one measured 57% and delivered 20%.
  const drop = r.rockLit ? +(1 - r.unlit / r.rockLit).toFixed(3) : 0;
  check('the cave is actually dark', drop >= 0.28,
        'the far rock lost ' + Math.round(drop * 100) + '% of its light (min 28%; ' +
        r.rockLit + ' -> ' + r.unlit + ')');
  // 2. ...and fair. 22 is the floor and it is a PLAYABILITY number, not a
  //    taste one: below it the terrain silhouette stops separating from the
  //    tint and she is jumping at rock she cannot see. It is checked at the
  //    DEFAULT brightness — a player who has turned the lift down has chosen
  //    a darker game, and a player who turns it up gets a brighter cave.
  check('...and the unlit rock is still a silhouette, not a void',
        r.unlit >= 22, 'the darkest rock reads ' + r.unlit + ' (min 22)');
  // 3. she carries one
  const lampRatio = r.farFromHer ? +(r.nearHer / r.farFromHer).toFixed(2) : 0;
  check('she carries a light', lampRatio >= 1.35,
        'ground beside her ' + r.nearHer + ' vs across the room ' + r.farFromHer +
        '  (x' + lampRatio + ', min x1.35)');
  // 4. light is a guide
  const gain = m => (m && m.off) ? +(m.on / m.off).toFixed(2) : 0;
  if (r.beaconM) {
    check('the beacon is visible from across the dark', gain(r.beaconM) >= 1.35,
          'its corner reads ' + r.beaconM.on + ' with it and ' + r.beaconM.off +
          ' without  (x' + gain(r.beaconM) + ', min x1.35)');
  } else check('the beacon could be measured', false, 'no terminal in CV2');
  if (r.beaconLean) {
    check('...and it is still a beacon with the glow given up', gain(r.beaconLean) >= 1.20,
          'on the lean path it reads ' + r.beaconLean.on + ' with it and ' + r.beaconLean.off +
          ' without  (x' + gain(r.beaconLean) + ', min x1.20)');
  } else check('the lean path could be measured', false, 'no terminal in CV2');
  if (r.pillarM) {
    check('...and the pillar lights the rock it stands in', gain(r.pillarM) >= 1.6,
          'the rock beside it reads ' + r.pillarM.on + ' with it and ' + r.pillarM.off +
          ' without  (x' + gain(r.pillarM) + ', min x1.60)');
  } else check('the pillar could be measured', false, 'no pillar in CV3');
  if (r.pillarFar && r.beaconFar) {
    check('...and it REACHES further than the beacon, because it is the bigger errand',
          gain(r.pillarFar) > gain(r.beaconFar) && gain(r.pillarFar) >= 1.15,
          'at 300 px the pillar still gains x' + gain(r.pillarFar) +
          ' where the beacon gains x' + gain(r.beaconFar));
  } else check('reach could be measured', false, 'a far sample was missing');
  // the rubble's reward, in light
  if (r.buried != null) {
    check('a buried mouth leaks nothing until it is broken open',
          r.opened > r.buried * 1.12,
          'buried ' + r.buried + ' -> opened ' + r.opened);
  } else check('the buried mouth could be measured', false, 'no rubble door in CV1');
  // ...and it stops at the cave mouth
  check('the dark stays in the cave',
        r.meadow != null && Math.abs(r.meadow - r.meadowProbe) < 1.5,
        r.meadow == null ? 'A1 never settled' :
        'A1 reads ' + r.meadow + ' with the pass and ' + r.meadowProbe + ' without it');

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
