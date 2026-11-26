// CALL THE ALPHA (owner, 2026-11-26: "summon the beaten Alpha ... so that I can use its power, or
// at least starting with one of its powers, alongside my hitting and hold-and-hit power ... When I
// summon the Alpha it fights alongside me"). js/packtree.js alcCall / alcStep / alcDraw.
//   A  below the rung the call brings a small wolf; from CALL THE ALPHA on it brings the Alpha
//   B  he comes at HIS OWN size: the boss's box, and drawn the size the Alpha boss is drawn
//   C  he fights with his power: the filmed claw (wind-up, then the rake), and what is in front of him is hurt
//   D  he never hurts her: standing in him and through his rakes she loses nothing, and nothing of his reads her
//   E  she keeps her own attacks while he is out: her blow lands, and a held attack still charges
//   F  he has a stay and the call a cooldown: calling again while he is out does nothing; his time
//      up, he lopes off and is gone
//   G  with THE ALPHA'S HOWL he also howls: the machines near him stagger
//   H  no page errors
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── alpha-call — the Alpha himself comes, at his own size, and fights beside her');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 0;
    Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, pack: 1 }); sv.arms = ['pack']; sv.packLv = 2; startGame(sv);
    for (const k of ALPHA_STRIPS.concat(['wolfIdle6', 'wolfGallop6', 'wolfProwl8'])) mediaFetch(k, 1);
    await new Promise(r => setTimeout(r, 3000));
    let T = performance.now();
    const step = (n, each) => { for (let i = 0; i < n; i++) { each && each(i); T += 1000 / 60; mainLoop(T); } };
    const setRoom = (id, tx) => { loadRoom(id); G.state = 'PLAY'; G.dialog = G.cut = G.wake = null; G.enemies = []; G.boss = null; G.packWolf = null; G.mount = null; player.x = tx * TILE; player.face = 1; const g = groundColumnAt(player.x + player.w / 2); if (g) player.y = Math.min.apply(null, g) - player.h - 1; player.vx = player.vy = 0; player.dead = false; player.armCD = 0; step(20, () => { player.iT = 1; }); };
    // ---- A
    setRoom('A1', 20);
    packCall(player); out.A = { small: !!(G.packWolf && !G.packWolf.alpha) }; G.packWolf = null;
    G.save.packLv = 3; player.armCD = 0;
    out.A.called = packCall(player); out.A.alpha = !!(G.packWolf && G.packWolf.alpha);
    // ---- B: his size
    const W = G.packWolf;
    out.B = { box: [W.w, W.h], boss: [BSTAT.alpha.w, BSTAT.alpha.h] };
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const q = cv.getContext('2d');
    const bbox = (fn) => { q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, 960, 540); q.translate(480, 400); fn(q); const d = q.getImageData(0, 0, 960, 540).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < 540; y++) for (let x = 0; x < 960; x++) if (d[(y * 960 + x) * 4 + 3] > 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { w: x1 - x0, h: y1 - y0, y1 }; };
    const comp = { x: -W.w / 2, y: -W.h, w: W.w, h: W.h, face: -1, st: 'run', anim: 0, on: true, vx: 0, dist: 0, airT: 0 };
    const boss = new Boss('alpha', 0, 0); boss.x = -boss.w / 2; boss.y = -boss.h; boss.st = 'rest'; boss.face = -1; boss.purified = true;
    bbox(c2 => alcDraw(c2, comp)); bbox(c2 => drawAlpha(c2, boss, 0, -boss.h / 2));
    out.B.drawn = bbox(c2 => alcDraw(c2, comp)); out.B.bossDrawn = bbox(c2 => drawAlpha(c2, boss, 0, -boss.h / 2));
    const small = { x: -20, y: -28, w: 40, h: 28, faceVis: -1, dir: -1, anim: 0, on: true, vx: 0, kind: 'crawler', pack: 1 };
    out.B.smallDrawn = bbox(c2 => drawBeastPlate(c2, small, WOLF_ART, true));
    // ---- C/D: he fights; he never touches her
    step(40, () => { player.iT = 1; });
    const foe = new Enemy('turret', 0, 0); foe.x = W.x + W.w / 2 + (W.face > 0 ? 70 : -70) - foe.w / 2; foe.y = W.y + W.h - foe.h; foe.hp = foe.maxHp = 600; foe.update = function () {}; G.enemies.push(foe);
    // she stands right in him the whole time
    const keepHurt = player.hurt; const hurts = []; player.hurt = function (d, fx, src) { hurts.push(src); return keepHurt.apply(this, arguments); };
    const cores0 = player.cores, h0 = foe.hp, states = {}, keys0 = {};
    W.t = 30;
    step(180, () => { player.iT = 0; if (G.packWolf) { player.x = G.packWolf.x + G.packWolf.w / 2 - player.w / 2; states[G.packWolf.st] = 1; if (G.packWolf._drewKey) keys0[G.packWolf._drewKey] = 1; } });
    player.hurt = keepHurt;
    out.C = { states: Object.keys(states), strips: Object.keys(keys0), foeLost: h0 - foe.hp };
    out.D = { cores: cores0 - player.cores, hurts };
    // ---- E: her own blows while he is out
    G.enemies = [];
    const mine = new Enemy('turret', 0, 0); mine.x = player.x + player.w + 12; mine.y = player.y + player.h - mine.h; mine.hp = mine.maxHp = 600; mine.update = function () {}; G.enemies.push(mine);
    G.packWolf.x = player.x - 400; G.packWolf.t = 30;
    player.face = 1; player.atkCD = 0;
    const m0 = mine.hp;
    step(24, (i) => { player.iT = 1; if (i < 2) keysP.KeyX = 1; G.packWolf.x = player.x - 400; });
    out.E = { herBlow: m0 - mine.hp, wolfOut: !!G.packWolf };
    // a held attack still charges
    let charged = 0;
    step(60, () => { player.iT = 1; keys.KeyX = 1; G.packWolf.x = player.x - 400; charged = Math.max(charged, player.chargeT || player.charge || player.holdT || 0); });
    keys.KeyX = 0; step(4, () => { player.iT = 1; });
    out.E.charge = +charged.toFixed(2);
    // ---- F: stay and cooldown
    G.enemies = [];
    out.F = { againWhileOut: packCall(player), cd: +(player.armCD || 0).toFixed(1) };
    G.packWolf.t = 0.2; let gone = -1;
    step(400, (i) => { player.iT = 1; if (gone < 0 && !G.packWolf) gone = i; });
    out.F.goneAfter = gone; out.F.stay = ALPHA_SIDE.stay; out.F.cdK = ALPHA_SIDE.cd;
    // ---- G: the howl rung
    G.save.packLv = 4; player.armCD = 0; packCall(player); const W2 = G.packWolf; W2.howlCD = 0; W2.t = 30;
    step(30, () => { player.iT = 1; });
    const n1 = new Enemy('hopper', 0, 0); n1.x = W2.x + W2.w / 2 + 160; n1.y = W2.y + W2.h - n1.h; n1.update = function () {}; n1.hp = n1.maxHp = 600; G.enemies.push(n1);
    W2.howlCD = 0; W2.clawCD = 5; const heard = []; const sk = window.sfx; window.sfx = function (nm) { heard.push(nm); return sk.apply(this, arguments); };
    let stun = 0; step(70, () => { player.iT = 1; stun = Math.max(stun, n1.howlT || 0); });
    window.sfx = sk;
    out.G = { howled: heard.includes('alpha_howl'), stun: +stun.toFixed(2) };
    return out;
  });
  const A = R.A, B = R.B;
  check('A  below the rung the call brings a small wolf; from CALL THE ALPHA it brings the Alpha', A.small && A.called && A.alpha, A);
  const near = (a, b) => Math.abs(a - b) / b < 0.04;
  check('B  he comes at his own size: the boss\'s box, and drawn as tall and as long as the Alpha boss (far bigger than a small wolf)',
    B.box[0] === B.boss[0] && B.box[1] === B.boss[1] && near(B.drawn.h, B.bossDrawn.h) && near(B.drawn.w, B.bossDrawn.w) && B.drawn.h > B.smallDrawn.h * 1.3, B);
  check('C  he fights with his own claw (the filmed wind-up, then the rake) and what is in front of him is hurt',
    R.C.states.includes('clawwarn') && R.C.states.includes('claw') && R.C.strips.includes('alClaw') && R.C.foeLost > 0, R.C);
  check('D  he never hurts her: standing in him through his rakes she loses nothing', R.D.cores === 0 && R.D.hurts.length === 0, R.D);
  check('E  she keeps her own attacks while he is out: her blow lands and a held attack still charges', R.E.wolfOut && R.E.herBlow > 0 && R.E.charge > 0, R.E);
  check('F  he has a stay and the call a cooldown longer than it: calling again while he is out does nothing; his time up, he lopes off and is gone',
    R.F.againWhileOut === false && R.F.cd >= R.F.stay && R.F.cdK > R.F.stay && R.F.goneAfter > 0, R.F);
  check('G  with THE ALPHA\'S HOWL he howls (recorded) and the machine near him staggers', R.G.howled && R.G.stun >= 0.8, R.G);
  check('H  no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the Alpha fights beside her');
})().catch(e => { console.error(e); process.exit(1); });
