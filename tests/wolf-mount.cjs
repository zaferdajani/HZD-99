// THE WOLF MOUNT — owner, 2026-11-25: "Improving this skill by spending shards at certain NPCs
// should allow me to later on mount the wolf ... use the wolf when it's summoned as mounted and
// fight with it. Hits will reduce the wolf's hit until it's tired and depleted. That's when the
// wolf will run back away ... an NPC that tells me about the secret of mounting wolves through a
// certain task ... [in Kingdom 3]" · "use dash as a skill ... scratch, jumping, howling. Maybe
// that will stun the enemy a little bit." (js/wolfmount.js, js/packcall.js, js/quests.js)
//   A  Ratchet's THE PACK, LONGER: locked until she has the pack; bought only on his shelf, never
//      by the question that opens it; then the wolf stays longer and bites harder
//   B  the mount is not hers before the Tinker's harness: beside her called wolf, no ride
//   C  the Tinker (Kingdom 3) asks it only once she has the pack and his own errand is done; her
//      CALLED wolf bringing down three machines finishes it; paid, she can ride
//   D  beside the wolf the interact key puts her on; the wolf is big enough to carry her, she is
//      drawn ON its back (her feet above its feet, her body over its back), on the ground under it
//   E  riding she runs faster and leaps higher than on foot
//   F  the scratch hits with the claws' reach in front of it (one in reach is hit, one behind is not)
//   G  the dash is a lunge with its weight: what it runs through is hurt
//   H  the howl (a recorded wolf) staggers the machines near her for a short time, not forever,
//      and a guardian only flinches; no ring of light is thrown
//   I  a blow while riding costs the wolf's stamina, not her cores; spent, it sets her down on her
//      feet and lopes off; DOWN + JUMP gets her off at will
//   J  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── wolf-mount — the pack she calls can carry her, once the Tinker fits a harness');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 3000;
    Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, pack: 1 }); sv.arms = []; startGame(sv);
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^wolf|^trans|^hzd/i.test(k))) mediaFetch(k, true);
    await new Promise(r => setTimeout(r, 2500));
    let T = performance.now();
    const step = (n, each) => { for (let i = 0; i < n; i++) { each && each(i); T += 1000 / 60; mainLoop(T); } };
    const press = (code) => { keysP[code] = 1; };
    const shopRow = SHOP.findIndex(q => q.id === 'packup');
    const buyAt = () => { G.state = 'SHOP'; G.shopAsk = false; G.shopGuard = 0; G.shopArmed = true; G.shopIdx = shopRow; keysP.Enter = 1; updateShop(); keysP.Enter = 0; G.state = 'PLAY'; G.dialog = null; };
    // ---- A: the shelf
    const lv0 = G.save.packLv | 0, sc0 = G.save.scrap;
    buyAt(); out.A = { row: shopRow, lockedBuy: (G.save.packLv | 0) !== lv0 || G.save.scrap !== sc0 };
    G.save.arms = ['pack'];
    // the question that opens the shelf buys nothing
    shopOpen(true); G.shopGuard = 0; G.shopArmed = true; keysP.Enter = 1; updateShop(); keysP.Enter = 0;
    out.A.askBuys = (G.save.packLv | 0) !== lv0 || G.save.scrap !== sc0;
    G.state = 'PLAY';
    out.A.before = { stay: packStat('stay'), dmg: packStat('dmg') };
    buyAt(); out.A.after = { stay: packStat('stay'), dmg: packStat('dmg'), lv: G.save.packLv, paid: sc0 - G.save.scrap };
    G.save.packLv = 0;
    // ---- B: before the harness
    const setRoom = (id, tx) => { loadRoom(id); G.state = 'PLAY'; G.dialog = G.cut = G.wake = null; G.enemies = []; G.boss = null; player.x = tx * TILE; player.face = -1; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; player.dead = false; step(20, () => { player.iT = 1; }); };
    setRoom('A2', 30);
    packCall(player); step(90, () => { player.iT = 1; });
    out.B = { near: !!(G.packWolf && Math.abs(G.packWolf.x + G.packWolf.w / 2 - (player.x + player.w / 2)) < 140) };
    press('KeyE'); step(2, () => { player.iT = 1; }); out.B.riding = wmRiding();
    G.packWolf = null;
    // ---- C: the Tinker's harness
    const asked0 = questFor('patch');
    qSet('patch_quiet', 'done'); G.save.arms = [];
    const noPack = questFor('patch');
    G.save.arms = ['pack'];
    const q = questFor('patch');
    out.C = { firstIsHisOwn: asked0 && asked0.id, noPack: noPack && noPack.id, withPack: q && q.id, zone: q && q.zone, ask: [].concat(t('q_ask_patch_harness')), goal: qText(q) };
    qSet('patch_harness', 'active');
    // a machine SHE breaks does not count; three her wolf brings down do
    questKill('turret');
    out.C.afterHers = qProgress(q);
    for (let i = 0; i < 3; i++) { const e = new Enemy('hopper', 0, 0); questPackKill(e); }
    out.C.done = qDone(q);
    questPay(q); out.C.learned = !!G.save.flags.wolfMount;
    G.state = 'PLAY'; G.dialog = null; if (typeof overlayClear === 'function') overlayClear();
    // ---- D: on
    setRoom('A2', 30);
    packCall(player); step(90, () => { player.iT = 1; });
    press('KeyE'); step(3, () => { player.iT = 1; G.state = 'PLAY'; });
    out.D = { riding: wmRiding() };
    const W = G.packWolf;
    if (W) {
      // the drawn picture: her feet are above its feet, her body is over its back, the wolf is not small
      const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const qx = cv.getContext('2d');
      const box = (fn) => { qx.setTransform(1, 0, 0, 1, 0, 0); qx.clearRect(0, 0, 960, 540); qx.translate(480 - (W.x + W.w / 2), 380 - (W.y + W.h)); fn(qx); const d = qx.getImageData(0, 0, 960, 540).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < 540; y += 2) for (let x = 0; x < 960; x += 2) if (d[(y * 960 + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, x1, y0, y1 }; };
      for (let i = 0; i < 3; i++) { box(c2 => drawBeastPlate(c2, W, WOLF_ART, true)); box(c2 => player.draw(c2)); }
      const wb = box(c2 => drawBeastPlate(c2, W, WOLF_ART, true)), hb = box(c2 => player.draw(c2));
      out.D.wolf = wb; out.D.her = hb;
      out.D.onBack = hb.y1 < wb.y1 - 20 && hb.y1 > wb.y0 && (hb.x0 + hb.x1) / 2 > wb.x0 && (hb.x0 + hb.x1) / 2 < wb.x1;
      out.D.bigEnough = (wb.y1 - wb.y0) >= (hb.y1 - hb.y0) * 0.9 && (wb.x1 - wb.x0) >= (hb.x1 - hb.x0) * 1.6;
      const g = groundColumnAt(W.x + W.w / 2); out.D.grounded = !!g && Math.abs(Math.min.apply(null, g) - (W.y + W.h)) <= 6;
    }
    // ---- E: faster, higher
    const runFor = (mounted) => { const x0 = player.x; step(40, () => { keys.ArrowRight = 1; player.iT = 1; }); keys.ArrowRight = 0; return Math.round(player.x - x0); };
    const jumpH = () => { step(10, () => { player.iT = 1; }); const y0 = player.y; let top = y0; press('Space'); step(60, (i) => { keys.Space = i < 40 ? 1 : 0; player.iT = 1; top = Math.min(top, player.y); }); keys.Space = 0; step(40, () => { player.iT = 1; }); return Math.round(y0 - top); };
    setRoom('A1', 20); G.mount = null; G.packWolf = null;
    const footRun = runFor(false), footJump = jumpH();
    setRoom('A1', 20); packCall(player); step(90, () => { player.iT = 1; }); press('KeyE'); step(3, () => { player.iT = 1; });
    const rideRun = runFor(true), rideJump = jumpH();
    out.E = { footRun, rideRun, footJump, rideJump, riding: wmRiding() };
    // ---- F: the scratch
    setRoom('A2', 30); player.face = 1; if (!wmRiding()) { packCall(player); step(90, () => { player.iT = 1; }); press('KeyE'); step(3, () => { player.iT = 1; }); }
    player.face = 1; step(2, () => { player.iT = 1; });
    const mk = (dx) => { const e = new Enemy('hopper', 0, 0); const W2 = G.mount.w; e.x = W2.x + W2.w / 2 + dx - e.w / 2; e.y = W2.y + W2.h - e.h; e.vx = 0; e.hp = e.maxHp = 400; G.enemies.push(e); return e; };
    G.enemies = []; const front = mk(70), behind = mk(-110);
    const h0f = front.hp, h0b = behind.hp;
    press('KeyX'); step(16, () => { player.iT = 1; player.face = 1; front.x = G.mount.w.x + G.mount.w.w / 2 + 70 - front.w / 2; front.vx = 0; behind.x = G.mount.w.x + G.mount.w.w / 2 - 110 - behind.w / 2; behind.vx = 0; });
    out.F = { front: h0f - front.hp, behind: h0b - behind.hp };
    // ---- G: the lunge
    G.enemies = []; const ahead = mk(140); const hg0 = ahead.hp; G.save.abil = G.save.abil || {}; G.save.abil.dash = 1; player.dashCD = 0;
    const lit = { echoes: 0, wake: 0, ripples: 0 }; const rip0 = RIPPLES.length;
    press('KeyC'); step(30, () => { player.iT = 1; keys.ArrowRight = 1; ahead.vx = 0; lit.echoes = Math.max(lit.echoes, player.trail.length); if (player.dashFx) lit.wake++; lit.ripples = Math.max(lit.ripples, RIPPLES.filter(w => w.col === '#8ff6ff').length); }); keys.ArrowRight = 0;
    out.G = Object.assign({ hit: hg0 - ahead.hp }, lit);
    // ---- H: the howl
    G.enemies = []; const n1 = mk(120), far = mk(700);
    const rings0 = (G.rings || []).length; const sndKeep = window.sfx; const heard = []; window.sfx = function (n) { heard.push(n); return sndKeep.apply(this, arguments); };
    G.mount.howlCD = 0; press('KeyV'); step(2, () => { player.iT = 1; });
    window.sfx = sndKeep;
    out.H = { nearStun: +(n1.kbT || 0).toFixed(2), farStun: +(far.kbT || 0).toFixed(2), howled: heard.includes('alpha_howl'), rings: (G.rings || []).length - rings0 };
    step(100, () => { player.iT = 1; });
    out.H.after = +(n1.kbT || 0).toFixed(2);
    const voice = typeof ALPHA_VOICE !== 'undefined' && ALPHA_VOICE.alpha_howl;
    out.H.recorded = !!voice;
    // a guardian only flinches
    { const bo = { stagT: 0, dead: false, purified: false, x: player.x + 60, y: player.y, w: 60, h: 60 }; Object.setPrototypeOf(bo, Boss.prototype); G.boss = bo; const keepBA = window.bossActive; window.bossActive = () => true; wmHowl(player); out.H.boss = +(bo.stagT || 0).toFixed(2); window.bossActive = keepBA; G.boss = null; }
    // ---- I: the wolf takes the blows
    G.enemies = []; const cores0 = player.cores, st0 = G.mount.stam;
    player.iT = 0; player.hurt(1, player.x + 50, 'test'); out.I = { stam: Math.round(st0 - G.mount.stam), cores: cores0 - player.cores };
    // spent: set down on her feet, the wolf lopes off
    G.mount.stam = 1; player.iT = 0; player.hurt(1, player.x + 50, 'test');
    out.I.thrown = !wmRiding(); out.I.callWaits = +(player.armCD || 0).toFixed(1);
    step(70, () => { player.iT = 1; });
    const g2 = groundColumnAt(player.x + player.w / 2);
    out.I.onFeet = player.on && !!g2 && Math.abs(Math.min.apply(null, g2) - (player.y + player.h)) <= 6;
    out.I.leaves = !G.packWolf || G.packWolf.leaveT > 0;
    // off at will
    G.packWolf = null; player.armCD = 0; packCall(player); step(90, () => { player.iT = 1; }); press('KeyE'); step(3, () => { player.iT = 1; });
    const was = wmRiding(); keys.ArrowDown = 1; press('Space'); step(2, () => { player.iT = 1; }); keys.ArrowDown = 0;
    out.I.offAtWill = was && !wmRiding();
    return out;
  });
  const A = R.A;
  check('A  THE PACK, LONGER: locked without the pack, never bought by the question, then a longer stay and a harder bite', A.row >= 0 && !A.lockedBuy && !A.askBuys && A.after.lv === 2 && A.after.stay > A.before.stay && A.after.dmg > A.before.dmg && A.after.paid > 0, A);
  check('B  no ride before the harness', R.B.near && !R.B.riding, R.B);
  const C = R.C;
  check('C  the Tinker asks it in Kingdom 3, only with the pack and after his own errand; her wolf\'s three machines finish it; then she can ride', C.firstIsHisOwn === 'patch_quiet' && C.noPack !== 'patch_harness' && C.withPack === 'patch_harness' && C.zone === 'C' && C.afterHers === 0 && C.done && C.learned, C);
  check('D  beside it, the interact key puts her on; she sits ON its back, it is big enough to carry her, it stands on the ground', R.D.riding && R.D.onBack && R.D.bigEnough && R.D.grounded, R.D);
  check('E  riding she runs faster and leaps higher', R.E.rideRun > R.E.footRun * 1.25 && R.E.rideJump > R.E.footJump * 1.15, R.E);
  check('F  the scratch hits what is in the claws\' reach, not what is behind', R.F.front > 0 && R.F.behind === 0, R.F);
  check('G  the dash is a lunge: what it runs through is hurt, and it leaves no light (no echoes of her, no wake, no ring)', R.G.hit > 0 && R.G.echoes === 0 && R.G.wake === 0 && R.G.ripples === 0, R.G);
  check('H  the howl (a recorded wolf) staggers the near machines, briefly, not the far; a guardian only flinches; no ring', R.H.howled && R.H.recorded && R.H.nearStun >= 0.8 && R.H.farStun === 0 && R.H.after <= 0 && R.H.boss > 0 && R.H.boss < 1 && R.H.rings <= 0, R.H);
  check('I  a blow costs the wolf\'s stamina, not her cores; spent, she is set down on her feet, it lopes off and the call waits; DOWN + JUMP gets her off', R.I.stam > 0 && R.I.cores === 0 && R.I.thrown && R.I.callWaits >= 15 && R.I.onFeet && R.I.leaves && R.I.offAtWill, R.I);
  check('J  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the pack she calls can carry her');
})().catch(e => { console.error(e); process.exit(1); });
