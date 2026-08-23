// THE BURIED MOUTH — the first tunnel is a wall she hears through.
//
// The owner, 2026-08-23: "the first cave or tunnel that I face needs to be
// covered with rubbles, and it should emit a sound from within that attracts
// me to go there... I have to go and hit the rubble to go inside."
//
// Three things have to be true and none of them can be read off the source:
//   1. IT REFUSES. UP at the mouth does not start the walk while rock stands.
//   2. IT HEARS. The voice behind it gets LOUDER as she closes — gain is
//      distance, which is the entire mechanism by which a sound is a lure and
//      not an ambience. Measured by intercepting npcVoxTick.
//   3. IT COMES DOWN, AND IT SHOWS IT. Every blow removes silhouette: the
//      ART_BIBLE §3.3 rule (states must DIFFER, IoU <= 0.86) applied to a
//      structure, because a pile that only fades is a switch with a texture.
// ...and it stands on the floor she stands on (§3.4, feet on the ground): the
// gate's own anchor is the tile row, and the heightfield lifts the walkable
// surface above it, which buried the pile's bottom third on the first pass.
//
//   node tests/rubble.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── rubble — the first tunnel is buried, it calls, and it takes the blade\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A5');
    out.exists = !!G.rubble;
    if (!G.rubble) return out;
    const gx = G.rubble.x;
    out.hp0 = G.rubble.hp;

    // ---- 1. it refuses ------------------------------------------------------
    player.x = gx - player.w / 2; player.y = (G.roomDef.h - 4) * TILE;
    for (let i = 0; i < 40; i++) await new Promise(k => requestAnimationFrame(k));
    out.stands = !!gateHere();
    out.refused = gateEnter() === false && !G.gateWalk;

    // ---- 2. it calls, and the call is distance ------------------------------
    const vox0 = window.npcVoxTick;
    const heard = [];
    window.npcVoxTick = (id, v) => { if (id === 'cave') heard.push(v); };
    const gains = [];
    for (const d of [860, 640, 420, 220, 60]) {
      player.x = gx - d; heard.length = 0;
      tickCaveLure();
      gains.push(heard.length ? heard[heard.length - 1] : -1);
    }
    out.gains = gains;
    out.rises = gains.every((g, i) => i === 0 || g > gains[i - 1] + 1e-4);

    // ---- 3. it comes down, and the silhouette says so -----------------------
    // photograph the pile alone on a flat field at every HP, exactly as the
    // renderer draws it, and compare the masks
    const CW = 260, CH = 240;
    const t = document.createElement('canvas'); t.width = CW; t.height = CH;
    const tc = t.getContext('2d');
    const c0 = c;
    const masks = [], areas = [];
    for (let hp = G.rubble.max; hp >= 1; hp--) {
      G.rubble.hp = hp; G.rubble.shake = 0; G.rubble.dust = 0;
      tc.clearRect(0, 0, CW, CH);
      c = tc;
      drawRubble(G.rubble, CW / 2, CH - 24, PAL[G.roomDef.zone]);
      c = c0;
      const d = tc.getImageData(0, 0, CW, CH).data;
      const m = new Uint8Array(CW * CH);
      let n = 0;
      for (let i = 0; i < CW * CH; i++) { if (d[i * 4 + 3] > 90) { m[i] = 1; n++; } }
      masks.push(m); areas.push(n);
    }
    out.areas = areas;
    let worstIoU = 0, worstPair = '';
    for (let i = 1; i < masks.length; i++) {
      let inter = 0, uni = 0;
      for (let k = 0; k < CW * CH; k++) {
        const a = masks[i - 1][k], b = masks[i][k];
        if (a && b) inter++;
        if (a || b) uni++;
      }
      const iou = uni ? inter / uni : 1;
      if (iou > worstIoU) { worstIoU = iou; worstPair = 'hp' + (G.rubble.max - i + 1) + '→hp' + (G.rubble.max - i); }
    }
    out.worstIoU = worstIoU; out.worstPair = worstPair;
    out.shrinks = areas.every((a, i) => i === 0 || a < areas[i - 1]);

    // ---- 4. it stands on the floor she stands on ---------------------------
    G.rubble.hp = G.rubble.max;
    player.x = gx - 60; player.y = (G.roomDef.h - 5) * TILE;
    for (let i = 0; i < 90; i++) await new Promise(k => requestAnimationFrame(k));
    out.footGap = Math.abs(rubbleFoot(G.rubble) - (player.y + player.h));

    // ---- 5. the blade opens it ---------------------------------------------
    const before = G.rubble.hp;
    const box = rubbleBox(G.rubble);
    let n = 0;
    while (G.rubble && G.rubble.hp > 0 && n < 20) { rubbleHit(box, false); n++; }
    out.blows = n;
    out.flagged = !!(G.save.flags.rubbleA5);
    out.opensAfter = gateEnter() === true && !!G.gateWalk;
    // ...and a blow that lands nowhere near it does nothing
    G.gateWalk = null;
    loadRoom('A5');
    out.reopened = !G.rubble;      // the flag persists: it does not grow back

    // ---- 6. LEVELS WITHIN LEVELS -------------------------------------------
    // A room may hold more than one depth door now, and the tunnel is the first
    // to use it: CV1 keeps its way back to the meadow AND a buried side passage
    // into the Seam. Nothing about this is visible by reading the table — the
    // row is an array, and every consumer had to learn that.
    out.cv1 = gateDoors('CV1').map(d => d.to);
    out.branch = out.cv1.length === 2 && out.cv1.indexOf('A5') >= 0 && out.cv1.indexOf('CV1B') >= 0;
    loadRoom('CV1');
    for (let i = 0; i < 30; i++) await new Promise(k => requestAnimationFrame(k));
    out.cv1Piles = (G.rubbles || []).map(q => q.flag);
    // she stands at the FAR door: gateHere must give her that one, not the
    // first in the table — picking the first is what makes a second door dead
    const seam = gateDoors('CV1').find(d => d.to === 'CV1B');
    player.x = gateWorldX(seam) - player.w / 2;
    out.nearestDoor = (gateHere() || {}).to;
    out.seamRefuses = gateEnter() === false;
    let nb2 = 0;
    while (G.rubble && G.rubble.hp > 0 && nb2++ < 30) rubbleHit(rubbleBox(G.rubble), false);
    out.seamOpens = gateEnter() === true;
    let n3 = 0;
    while (G.gateWalk && n3++ < 300) update(1 / 30);
    out.inSeam = G.roomId === 'CV1B';
    out.seamRests = !!(G.statics || []).find(q => q.type === 'bench');
    // ...and the way back out
    const back = gateDoors('CV1B')[0];
    player.x = gateWorldX(back) - player.w / 2; player.on = true; player.vy = 0;
    out.seamReturns = gateEnter() === true;
    n3 = 0;
    while (G.gateWalk && n3++ < 300) update(1 / 30);
    out.backInTunnel = G.roomId === 'CV1';


    // ---- 7. THE SOUND LEADS SOMEWHERE ---------------------------------------
    // The owner asked for a mouth that "emits a sound from within that attracts
    // me to go there". It did — and then the sound was scenery: anchored on the
    // door, so it got QUIETER the deeper she went, which is a lure pointing
    // backwards. It is scored against the walk to its source now.
    const heardAt = {};
    window.npcVoxTick = (id, v) => { if (id === 'cave') heardAt[G.roomId] = v; };
    for (const room of ['A5', 'CV1', 'CV2']) {
      loadRoom(room);
      G.save.flags.rubbleA5 = 1; G.save.flags.rubbleCV1B = 1; rubbleInit();
      delete G.save.flags.beacon;
      G.wake = null; G.state = 'PLAY';
      for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));
      // stood at the same place in each: the middle of the room
      player.x = G.roomDef.w * TILE * 0.5;
      tickCaveLure();
    }
    out.heard = heardAt;
    // ...and in the beacon's own room it is loudest AT the beacon
    loadRoom('CV2');
    for (let i = 0; i < 20; i++) await new Promise(k => requestAnimationFrame(k));
    const term = (G.statics || []).find(q => q.type === 'term');
    out.hasBeacon = !!term;
    if (term) {
      player.x = 4 * TILE; tickCaveLure();
      const far = heardAt.CV2;
      player.x = term.x + term.w / 2; tickCaveLure();
      out.nearBeacon = heardAt.CV2; out.farInRoom = far;
      // and reading it is what settles the call
      out.beaconBefore = !!G.save.flags.beacon;
      doInteract(term);
      out.beaconAfter = !!G.save.flags.beacon;
      out.beaconText = !!(G.dialog && G.dialog.lines && G.dialog.lines.length >= 3);
      G.dialog = null; G.state = 'PLAY';
    }

    window.npcVoxTick = vox0;
    return out;
  });

  check('the first tunnel is buried on a fresh save', r.exists, r.exists ? r.hp0 + ' hp' : 'no G.rubble in A5');
  check('the mouth is where she stands', r.stands);
  check('UP will not take her through rock', r.refused);
  check('the voice from inside gets louder as she closes', r.rises,
        (r.gains || []).map(g => g.toFixed(3)).join(' → '));
  check('every blow takes silhouette off the pile', r.shrinks, (r.areas || []).join(' → ') + ' px');
  check('...and no two states are the same picture', r.worstIoU <= 0.86,
        'worst ' + r.worstPair + ' IoU ' + (r.worstIoU || 0).toFixed(3) + ' (max 0.86)');
  check('the pile stands on the floor she stands on', r.footGap <= 10,
        (r.footGap || 0).toFixed(1) + ' px from her feet (max 10)');
  check('the blade opens it', r.flagged && r.blows === r.hp0, r.blows + ' blows for ' + r.hp0 + ' hp');
  check('...and then the mouth takes her', r.opensAfter);
  check('it does not grow back', r.reopened);

  // LEVELS WITHIN LEVELS — the owner: "the game itself should be built in a way
  // that enables me to add levels within levels."
  check('a room can hold more than one depth door', r.branch, (r.cv1 || []).join(' + '));
  check('...each with its own pile', (r.cv1Piles || []).join(',') === 'rubbleCV1B',
        (r.cv1Piles || []).join(',') || 'none');
  check('...and standing at one gives you THAT one', r.nearestDoor === 'CV1B', String(r.nearestDoor));
  check('the branch is buried too', r.seamRefuses);
  check('the blade opens the branch', r.seamOpens && r.inSeam, 'in ' + (r.inSeam ? 'CV1B' : 'nowhere'));
  check('the Seam is the tunnel\'s rest', r.seamRests);
  check('...and it walks back out', r.seamReturns && r.backInTunnel);

  // THE LURE LEADS TO SOMETHING — the other half of "a sound from within that
  // attracts me to go there".
  const h = r.heard || {};
  check('the sound gets LOUDER the deeper she goes',
        h.A5 != null && h.CV1 != null && h.CV2 != null && h.A5 < h.CV1 && h.CV1 < h.CV2,
        'A5 ' + (h.A5 || 0).toFixed(2) + ' -> CV1 ' + (h.CV1 || 0).toFixed(2) +
        ' -> CV2 ' + (h.CV2 || 0).toFixed(2));
  check('...and there is something down there making it', r.hasBeacon);
  check('...loudest standing at it', (r.nearBeacon || 0) > (r.farInRoom || 0) + 0.1,
        'at the beacon ' + (r.nearBeacon || 0).toFixed(2) + ' vs across the room ' +
        (r.farInRoom || 0).toFixed(2));
  check('...and it says something worth the walk', r.beaconText);
  check('...and reading it answers the call', !r.beaconBefore && r.beaconAfter);

  if (errs.length) check('no page errors', false, errs[0]);
  await browser.close();
  console.log(fails.length ? '\n' + fails.length + ' FAILED\n' : '\nall good\n');
  process.exit(fails.length ? 1 : 0);
})();
