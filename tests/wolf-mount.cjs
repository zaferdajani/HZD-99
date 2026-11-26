// THE WOLF MOUNT — she rides the Alpha she calls (owner, 2026-11-25; REBUILT 2026-11-26: "the wolf
// I'm riding on should be at the same size as the wolf I am summoning — you're summoning a small one
// and then riding a big one. You probably should summon the beaten Alpha and ride it").
// The checks that held the 1.9x-scaled small wolf with her crouch drawn on its back are gone with
// that design (the owner reversed it); these hold the Alpha ride (js/wolfmount.js, js/packtree.js).
//   A  Ratchet's ladder row: locked without the pack; never bought by the question that opens the
//      shelf; then one rung at a time — A STRONGER WOLF (a longer stay, a harder bite), CALL THE
//      ALPHA, THE ALPHA'S HOWL — each at its price, and sold out after the last
//   B  no ride before the ride is hers: beside the called Alpha, the interact key does nothing
//   C  the Tinker (Kingdom 3) asks the harness only after his own errand and once she can CALL THE
//      ALPHA; a small wolf's kill does not count, three the called Alpha makes do; paid, the ride is
//      on HIS shelf (asked first, never bought by the question) and buying it makes it hers
//   D  beside the called Alpha the interact key puts her on; the picture is ONE filmed ride image
//      (a RIDE_ART strip), her own body is not drawn and neither is his; the ridden Alpha is the
//      size of the called Alpha (his box, and the wolf drawn as long); he stands on the ground
//   E  riding she runs faster and leaps higher than on foot; the leap keeps the whole drawn ride
//      (wolf and rider) inside the frame, apex included
//   F  the scratch hits what is in the paw's reach in front, not what is behind
//   G  the dash is a lunge: what it runs through is hurt, and it leaves no light
//   H  the howl (a recorded wolf) staggers the near machines briefly, not the far; a guardian only
//      flinches; no ring
//   I  a blow while riding costs his stamina, not her cores; spent, he sets her on her feet and
//      lopes off and the call waits; DOWN + JUMP gets her off
//   J  without the ride strips in the manifest the ride cannot be bought or mounted (no composite)
//   K  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── wolf-mount — she rides the Alpha she calls, once the Tinker fits his harness');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 5000;
    Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, pack: 1 }); sv.arms = []; startGame(sv);
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^wolf|^al[A-Z]|^trans|^hzd/i.test(k))) mediaFetch(k, true);
    await new Promise(r => setTimeout(r, 3000));
    let T = performance.now();
    const step = (n, each) => { for (let i = 0; i < n; i++) { each && each(i); T += 1000 / 60; mainLoop(T); } };
    const press = (code) => { keysP[code] = 1; };
    const buyAt = (who) => { G.state = 'SHOP'; G.shopWho = who || 'ratchet'; G.shopAsk = false; G.shopGuard = 0; G.shopArmed = true; G.shopIdx = shopList().findIndex(q => q.type === (who === 'patch' ? 'alride' : 'packup')); keysP.Enter = 1; updateShop(); keysP.Enter = 0; G.state = 'PLAY'; G.dialog = null; if (typeof overlayClear === 'function') overlayClear(); };
    // ---- A: Ratchet's ladder row
    const lv0 = G.save.packLv | 0, sc0 = G.save.scrap;
    buyAt(); out.A = { lockedBuy: (G.save.packLv | 0) !== lv0 || G.save.scrap !== sc0 };
    G.save.arms = ['pack'];
    shopOpen(true); G.shopGuard = 0; G.shopArmed = true; keysP.Enter = 1; updateShop(); keysP.Enter = 0;
    out.A.askBuys = (G.save.packLv | 0) !== lv0 || G.save.scrap !== sc0;
    G.state = 'PLAY';
    out.A.before = { stay: packStat('stay'), dmg: packStat('dmg') };
    const rungs = [];
    for (let i = 0; i < 4; i++) { const n = ptNextRatchet(); const s0 = G.save.scrap; buyAt(); rungs.push({ id: n && n.id, lv: G.save.packLv | 0, paid: s0 - G.save.scrap }); if (i === 0) out.A.after = { stay: packStat('stay'), dmg: packStat('dmg') }; }
    out.A.rungs = rungs; out.A.soldOut = shopSold(SHOP.find(q => q.type === 'packup'));
    // ---- B: the Alpha comes; no ride before it is hers
    const setRoom = (id, tx) => { loadRoom(id); G.state = 'PLAY'; G.dialog = G.cut = G.wake = null; G.enemies = []; G.boss = null; G.packWolf = null; G.mount = null; player.x = tx * TILE; player.face = -1; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; player.dead = false; player.armCD = 0; step(20, () => { player.iT = 1; }); };
    const callNear = () => { player.armCD = 0; packCall(player); step(90, () => { player.iT = 1; }); };
    setRoom('A2', 30);
    callNear();
    out.B = { alpha: !!(G.packWolf && G.packWolf.alpha), near: !!(G.packWolf && Math.abs(G.packWolf.x + G.packWolf.w / 2 - (player.x + player.w / 2)) < WOLF_MOUNT.reach) };
    press('KeyE'); step(2, () => { player.iT = 1; }); out.B.riding = wmRiding();
    G.packWolf = null;
    // ---- C: the Tinker's harness, then his shelf
    const asked0 = questFor('patch');
    qSet('patch_quiet', 'done');
    const keepLv = G.save.packLv; G.save.packLv = 2;
    const atTwo = questFor('patch');
    G.save.packLv = keepLv;
    const q = questFor('patch');
    out.C = { firstIsHisOwn: asked0 && asked0.id, atTwo: atTwo && atTwo.id, atThree: q && q.id, zone: q && q.zone };
    qSet('patch_harness', 'active'); if (typeof questSnap === 'function') questSnap('patch_harness');
    // a small wolf's kill does not count
    G.packWolf = { pack: 1, x: 0, y: 0, w: 40, h: 28 };
    questPackKill(new Enemy('hopper', 0, 0));
    out.C.smallCounts = qProgress(q);
    G.packWolf = { alpha: 1, pack: 1, x: 0, y: 0, w: 104, h: 58 };
    for (let i = 0; i < 3; i++) questPackKill(new Enemy('hopper', 0, 0));
    G.packWolf = null;
    out.C.done = qDone(q);
    questPay(q); out.C.harness = !!G.save.flags.wolfMount; out.C.rideYet = ptHas('alride');
    G.state = 'PLAY'; G.dialog = null; if (typeof overlayClear === 'function') overlayClear();
    out.C.sells = ptTinkerSells();
    const sc1 = G.save.scrap;
    shopOpen(true, 'patch'); G.shopGuard = 0; G.shopArmed = true; keysP.Enter = 1; updateShop(); keysP.Enter = 0;
    out.C.askBuys = ptHas('alride') || G.save.scrap !== sc1;
    G.state = 'PLAY';
    buyAt('patch'); out.C.bought = ptHas('alride'); out.C.paid = sc1 - G.save.scrap; out.C.sellsAfter = ptTinkerSells();
    // ---- D: on
    setRoom('A2', 30);
    callNear();
    press('KeyE'); step(3, () => { player.iT = 1; G.state = 'PLAY'; });
    out.D = { riding: wmRiding() };
    const W = G.packWolf;
    if (W && wmRiding()) {
      const box = alcBox(); out.D.box = [W.w, W.h, box.w, box.h];
      // what one frame of her draw puts on the canvas: only ride strips
      const keep = drawStripCell, drawn = [];
      window.drawStripCell = function (cc, key) { drawn.push(key); return keep.apply(this, arguments); };
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const qx = cv.getContext('2d');
      const bbox = (fn) => { qx.setTransform(1, 0, 0, 1, 0, 0); qx.clearRect(0, 0, 960, 540); qx.translate(480 - (W.x + W.w / 2), 400 - (W.y + W.h)); fn(qx); const d = qx.getImageData(0, 0, 960, 540).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < 540; y++) for (let x = 0; x < 960; x++) if (d[(y * 960 + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, x1, y0, y1 }; };
      for (let i = 0; i < 3; i++) bbox(c2 => player.draw(c2));
      drawn.length = 0;
      const rb = bbox(c2 => player.draw(c2));
      const rideKeys = Object.values(RIDE_ART).map(s => s.key);
      out.D.drawn = [...new Set(drawn)];
      out.D.onlyRide = drawn.length > 0 && drawn.every(k => rideKeys.includes(k));
      // drawPackWolf draws nothing while he is ridden (no second body)
      drawn.length = 0; bbox(c2 => drawPackWolf(c2)); out.D.wolfDrawnToo = drawn.length;
      window.drawStripCell = keep;
      // the ridden Alpha's length against the called Alpha's (his prowl), drawn on the same box
      const pw = { x: W.x, y: W.y, w: W.w, h: W.h, face: -1, st: 'run', anim: 0, on: true, vx: 200, dist: 0, airT: 0 };
      const pb = bbox(c2 => alcDraw(c2, pw));
      out.D.rideW = rb.x1 - rb.x0; out.D.prowlW = pb.x1 - pb.x0;
      out.D.sameSize = Math.abs(out.D.rideW - out.D.prowlW) / out.D.prowlW < 0.12;
      out.D.feet = [rb.y1, pb.y1];
      const g = groundColumnAt(W.x + W.w / 2); out.D.grounded = !!g && Math.abs(Math.min.apply(null, g) - (W.y + W.h)) <= 6 && Math.abs(rb.y1 - 400) <= 6;
    }
    // ---- E: faster, higher
    const runFor = () => { const x0 = player.x; step(40, () => { keys.ArrowRight = 1; player.iT = 1; }); keys.ArrowRight = 0; return Math.round(player.x - x0); };
    const jumpH = () => { step(10, () => { player.iT = 1; }); const y0 = player.y; let top = y0; press('Space'); step(60, (i) => { keys.Space = i < 40 ? 1 : 0; player.iT = 1; top = Math.min(top, player.y); }); keys.Space = 0; step(40, () => { player.iT = 1; }); return Math.round(y0 - top); };
    setRoom('A1', 20);
    const footRun = runFor(), footJump = jumpH();
    setRoom('A1', 20); callNear(); press('KeyE'); step(3, () => { player.iT = 1; });
    const rideRun = runFor(), rideJump = jumpH();
    out.E = { footRun, rideRun, footJump, rideJump, riding: wmRiding() };
    // THE LEAP STAYS IN THE FRAME: the drawn ride (wolf and rider) is inside the canvas at every
    // frame of a full leap — the apex above all — in the meadow (A1) and on the hub's hill (A2)
    const inFrame = (room, tx) => {
      setRoom(room, tx); callNear(); press('KeyE'); step(3, () => { player.iT = 1; });
      if (!wmRiding()) return { riding: false };
      step(20, () => { player.iT = 1; });
      let worst = 1e9, apex = null, top = 1e9;
      press('Space');
      step(70, (i) => {
        keys.Space = i < 45 ? 1 : 0; player.iT = 1;
        const W = G.mount.w, H = G.mount._drewH || 0; if (!H) return;
        const dw = H * 372 / 282;
        const y0 = worldScreenY(wmDrawTop(player)), y1 = worldScreenY(W.y + W.h), x0 = worldScreenX(W.x + W.w / 2 - dw / 2), x1 = worldScreenX(W.x + W.w / 2 + dw / 2);
        const m = Math.min(y0, 540 - y1, x0 + dw * 0.3, 960 - x1 + dw * 0.3);
        if (m < worst) worst = m;
        if (player.y < top) { top = player.y; apex = { y0: Math.round(y0), y1: Math.round(y1) }; }
      });
      keys.Space = 0; step(40, () => { player.iT = 1; });
      return { riding: true, worst: Math.round(worst), apex };
    };
    out.E.frameA1 = inFrame('A1', 20); out.E.frameA2 = inFrame('A2', 30);
    // ---- F: the scratch
    setRoom('A2', 30); player.face = 1; callNear(); press('KeyE'); step(3, () => { player.iT = 1; });
    player.face = 1; step(2, () => { player.iT = 1; });
    const mk = (dx) => { const e = new Enemy('hopper', 0, 0); const W2 = G.mount.w; e.x = W2.x + W2.w / 2 + dx - e.w / 2; e.y = W2.y + W2.h - e.h; e.vx = 0; e.hp = e.maxHp = 400; e.update = function () {}; G.enemies.push(e); return e; };
    G.enemies = []; const front = mk(90), behind = mk(-130);
    const h0f = front.hp, h0b = behind.hp;
    step(30, (i) => { if (i < 2) keysP.KeyX = 1; player.iT = 1; player.face = 1; });
    out.F = { riding: wmRiding(), front: h0f - front.hp, behind: h0b - behind.hp };
    // ---- G: the lunge
    G.enemies = []; const ahead = mk(150); const hg0 = ahead.hp; G.save.abil = G.save.abil || {}; G.save.abil.dash = 1; player.dashCD = 0;
    const lit = { echoes: 0, wake: 0, ripples: 0 };
    step(30, (i) => { if (i < 2) keysP.KeyC = 1; player.iT = 1; keys.ArrowRight = 1; lit.echoes = Math.max(lit.echoes, player.trail.length); if (player.dashFx) lit.wake++; lit.ripples = Math.max(lit.ripples, RIPPLES.filter(w => w.col === '#8ff6ff').length); }); keys.ArrowRight = 0;
    out.G = Object.assign({ hit: hg0 - ahead.hp }, lit);
    // ---- H: the howl
    G.enemies = []; const n1 = mk(120), far = mk(700);
    const rings0 = (G.rings || []).length; const sndKeep = window.sfx; const heard = []; window.sfx = function (n) { heard.push(n); return sndKeep.apply(this, arguments); };
    G.mount.howlCD = 0; G.mount.scrT = 0; press('KeyV'); step(2, () => { player.iT = 1; });
    window.sfx = sndKeep;
    out.H = { nearStun: +(n1.kbT || 0).toFixed(2), farStun: +(far.kbT || 0).toFixed(2), howled: heard.includes('alpha_howl'), rings: (G.rings || []).length - rings0, drew: G.mount && G.mount.howlT > 0 };
    n1.update = Enemy.prototype.update; far.update = Enemy.prototype.update;
    step(100, () => { player.iT = 1; });
    out.H.after = +(n1.kbT || 0).toFixed(2);
    out.H.recorded = typeof ALPHA_VOICE !== 'undefined' && !!ALPHA_VOICE.alpha_howl;
    { const bo = { stagT: 0, dead: false, purified: false, x: player.x + 60, y: player.y, w: 60, h: 60 }; Object.setPrototypeOf(bo, Boss.prototype); G.boss = bo; const keepBA = window.bossActive; window.bossActive = () => true; G.enemies = []; wmHowl(player); out.H.boss = +(bo.stagT || 0).toFixed(2); window.bossActive = keepBA; G.boss = null; }
    // ---- I: he takes the blows
    G.enemies = []; const cores0 = player.cores, st0 = G.mount.stam;
    player.iT = 0; player.hurt(1, player.x + 50, 'test'); out.I = { stam: Math.round(st0 - G.mount.stam), cores: cores0 - player.cores };
    G.mount.stam = 1; player.iT = 0; player.hurt(1, player.x + 50, 'test');
    out.I.thrown = !wmRiding(); out.I.callWaits = +(player.armCD || 0).toFixed(1);
    step(70, () => { player.iT = 1; });
    const g2 = groundColumnAt(player.x + player.w / 2);
    out.I.onFeet = player.on && !!g2 && Math.abs(Math.min.apply(null, g2) - (player.y + player.h)) <= 6;
    out.I.leaves = !G.packWolf || G.packWolf.leaveT > 0;
    G.packWolf = null; callNear(); press('KeyE'); step(3, () => { player.iT = 1; });
    const was = wmRiding(); keys.ArrowDown = 1; press('Space'); step(2, () => { player.iT = 1; }); keys.ArrowDown = 0;
    out.I.offAtWill = was && !wmRiding();
    // ---- J: no ride strips, no ride
    const keepImg = MEDIA_SRC.images.alRideRear; delete MEDIA_SRC.images.alRideRear;
    G.mount = null; G.packWolf = null; callNear();
    out.J = { open: ptRideOpen(), learned: wmLearned() };
    press('KeyE'); step(3, () => { player.iT = 1; }); out.J.riding = wmRiding();
    out.J.state = ptState(ptNode('alride')).k;
    MEDIA_SRC.images.alRideRear = keepImg;
    return out;
  });
  const A = R.A;
  const pr = (id) => ({ packup: 700, alcall: 1150, alhowl: 400 })[id];
  check('A  Ratchet\'s ladder row: locked without the pack, never bought by the question, then one rung at a time at its price, a longer stay and a harder bite, and sold out after the howl',
    !A.lockedBuy && !A.askBuys && A.rungs.length === 4 && A.rungs[0].id === 'packup' && A.rungs[0].lv === 2 && A.rungs[1].id === 'alcall' && A.rungs[1].lv === 3 && A.rungs[2].id === 'alhowl' && A.rungs[2].lv === 4
    && A.rungs.slice(0, 3).every(r => r.paid === pr(r.id)) && A.rungs[3].paid === 0 && A.soldOut && A.after.stay > A.before.stay && A.after.dmg > A.before.dmg, A);
  check('B  the call brings the Alpha; no ride before the ride is hers', R.B.alpha && R.B.near && !R.B.riding, R.B);
  const C = R.C;
  check('C  the Tinker asks the harness in Kingdom 3 only after his errand and once she can call the Alpha; a small wolf\'s kill does not count, the Alpha\'s three do; then his shelf asks first and sells the ride',
    C.firstIsHisOwn === 'patch_quiet' && C.atTwo !== 'patch_harness' && C.atThree === 'patch_harness' && C.zone === 'C' && C.smallCounts === 0 && C.done && C.harness && !C.rideYet && C.sells && !C.askBuys && C.bought && C.paid === 800 && !C.sellsAfter, C);
  const D = R.D;
  check('D  beside him the interact key puts her on; ONE filmed ride image is drawn (not her body, not his), the ridden Alpha is the called Alpha\'s size, on the ground',
    D.riding && D.onlyRide && D.wolfDrawnToo === 0 && D.box && D.box[0] === D.box[2] && D.box[1] === D.box[3] && D.sameSize && D.grounded, D);
  check('E  riding she runs faster and leaps higher', R.E.riding && R.E.rideRun > R.E.footRun * 1.25 && R.E.rideJump > R.E.footJump * 1.15, R.E);
  check('E2 the leap stays in the frame: the drawn ride (his back, her head) is inside the canvas through the whole leap, apex included',
    R.E.frameA1.riding && R.E.frameA2.riding && R.E.frameA1.worst >= 0 && R.E.frameA2.worst >= 0, { A1: R.E.frameA1, A2: R.E.frameA2 });
  check('F  the scratch hits what is in the paw\'s reach in front, not what is behind', R.F.riding && R.F.front > 0 && R.F.behind === 0, R.F);
  check('G  the dash is a lunge: what it runs through is hurt, and it leaves no light (no echoes of her, no wake, no ring)', R.G.hit > 0 && R.G.echoes === 0 && R.G.wake === 0 && R.G.ripples === 0, R.G);
  check('H  the howl (a recorded wolf) staggers the near machines, briefly, not the far; a guardian only flinches; no ring', R.H.howled && R.H.recorded && R.H.nearStun >= 0.8 && R.H.farStun === 0 && R.H.after <= 0 && R.H.boss > 0 && R.H.boss < 1 && R.H.rings <= 0, R.H);
  check('I  a blow costs his stamina, not her cores; spent, she is set down on her feet, he lopes off and the call waits; DOWN + JUMP gets her off', R.I.stam > 0 && R.I.cores === 0 && R.I.thrown && R.I.callWaits >= 15 && R.I.onFeet && R.I.leaves && R.I.offAtWill, R.I);
  check('J  without the ride strips the ride cannot be bought or mounted (no composite stands in)', !R.J.open && !R.J.learned && !R.J.riding, R.J);
  check('K  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — she rides the Alpha she calls');
})().catch(e => { console.error(e); process.exit(1); });
