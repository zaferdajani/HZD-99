// THE WOLF'S MIND (owner, 2026-11-26: "the small ones this world just roam
// around without feeling like they have any self-awareness which is wrong.
// They are creatures that should act like wolves ... how it senses a predator
// coming, how it shows a defense dance and starts attacking ... this is how
// it's going to start when I summon my small wolf").
//
// js/wolfmind.js gives the wild pack a mind and js/packcall.js gives her
// small wolf the same one. This drives the real build and fails if they go
// back to roaming:
//   A  UNAWARE   a pack with her nowhere near rests together — sits, sniffs,
//                stands, prowls a little — and stays on its own ground
//   B  ALERT     she comes into sight: the first wolf stops and looks inside
//                a beat, barks, and every wolf of its pack stops and looks too
//   C  DISPLAY   before the pack's first bite: the snarl, a stand at bay, and
//                a feint that stops short of her (no core lost to a feint)
//   D  SPREAD    they do not stack on one spot: held at different distances,
//                or worked round to both sides of her
//   E  TURNS     no two wolves' tells start within 0.4 s of each other
//   F  DANGER    once committed the bite is the full tell and it LANDS on a
//                girl who stands still
//   G  HURT      a blow sends it back a few steps facing her; badly hurt it pants
//   H  LAST ONE  the last of a pack bays
//   I  STRIPS    every state draws its own filmed strip
//   J  HER WOLF  it looks at its quarry, dances and feints before it bites,
//                bites, never touches her, and bites less often than before
//   K  NOT IDLE  over 20 seeded runs (a guarding cat, a blob) it bites every
//                time, the first bite within 4 s of getting near its quarry
//
//   node tests/wolf-mind.cjs     (the repo served on :8220, or TEST_PORT)
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof wolfMind === 'function', { timeout: 30000 });
    console.log('── wolf-mind — the pack rests, notices, looks, calls, dances, takes turns; her small wolf does the same');

    // THE STAGE: a pack of three on the meadow floor of A1, her placed by the test
    const stage = `
      window.requestAnimationFrame = () => 0;
      let s = SEED; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; startGame(sv); loadRoom('A1');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = null; G.toasts = [];
      const w0 = G.enemies.find(e => e.kind === 'crawler' && isWolf(e));
      const floorY = w0.y + w0.h, X0 = w0.x;
      const heard = []; sfx = (n) => { heard.push([n, G.save.time]); };
      const mk = (dx) => { const w = new Enemy('crawler', X0 + dx, floorY - 20); w.dir = -1; w.faceVis = -1; return w; };
      G.enemies = [mk(0), mk(70), mk(150)];
      const W = G.enemies;
      for (const w of W) { w.y = floorY - w.h; w.sx = w.x; }
      const put = (x) => { player.x = x - player.w / 2; player.y = floorY - player.h; player.vx = player.vy = 0; };
      const away = () => { player.x = X0; player.y = floorY - 900; player.vx = player.vy = 0; player.iT = 9; };
      const pz = (w) => wolfPose(w, WOLF_ART, false).replace(/[AB]$/, '');
      const cx = (w) => w.x + w.w / 2, pcx = () => player.x + player.w / 2;
    `;
    const run = (body, seed) => page.evaluate(new Function(`return (async () => { const SEED = ${seed || 0x51ed270b}; ${stage} ${body} })()`));

    // ---- A. UNAWARE ---------------------------------------------------------
    const A = await run(`
      const poses = {}, hunt = [0, 0, 0], maxOff = [0, 0, 0], moving = [0, 0, 0], chores = [new Set(), new Set(), new Set()];
      const home = W.map(cx);
      const N = 60 * 20;
      for (let i = 0; i < N; i++) {
        away(); update(1 / 60);
        W.forEach((w, k) => { const p = pz(w); poses[p] = (poses[p] || 0) + 1; chores[k].add(p);
          if (w.hunt || (w.mind && w.mind !== 'calm')) hunt[k]++;
          maxOff[k] = Math.max(maxOff[k], Math.abs(cx(w) - home[k])); if (Math.abs(w.vx) > 4) moving[k]++; });
      }
      return { poses, hunt, maxOff: maxOff.map(Math.round), moving: moving.map(m => +(m / N).toFixed(2)), chores: chores.map(c => [...c].sort().join(',')) };
    `);
    check('A. out of sight the pack never hunts', A.hunt.every(h => h === 0), A.hunt.join(','));
    check('   ...it RESTS: sitting, nose down, standing — and only a little walking', A.poses.sitWild > 0 && A.poses.sniff > 0 && A.poses.rest > 0 && A.moving.every(m => m < 0.4),
      JSON.stringify(A.poses) + ' moving ' + A.moving.join(','));
    check('   ...each wolf does more than one thing (no wolf walks a beat forever)', A.chores.every(c => c.split(',').length >= 3), A.chores.join(' | '));
    check('   ...and the pack stays on its own ground', A.maxOff.every(m => m <= 200), 'furthest from home ' + A.maxOff.join(',') + ' px');

    // ---- B-F. she comes into sight and stands still ---------------------------
    const B = await run(`
      for (let i = 0; i < 60 * 4; i++) { away(); update(1 / 60); }
      // she steps into sight: 270 px to the west of the nearest wolf
      const near = W.slice().sort((a, b) => a.x - b.x)[0];
      put(cx(near) - 270); player.face = 1; heard.length = 0;
      const t0 = G.save.time;
      const R = { lookAt: null, faceAt: null, othersLook: [], frozeWhileLook: true, bark: null, firstBite: null, firstCoil: null,
        before: { snarl: 0, bay: 0, feints: 0, feintMinGap: 1e9 }, feintHit: 0, coils: [], sides: 0, spread: 0, spreadN: 0,
        tellFast: [], bites: 0, poses: {} };
      const coilWas = W.map(() => 0); const coilRun = W.map(() => 0);
      const looked = W.map(() => false);
      let cores = player.cores;
      for (let i = 0; i < 60 * 16; i++) {
        player.vx = 0; player.iT = Math.min(player.iT, 0.6);
        const c0 = player.cores;
        update(1 / 60); G.hitStop = 0;
        const t = G.save.time - t0;
        W.forEach((w, k) => {
          if (w.dead) return;
          const p = pz(w); R.poses[p] = (R.poses[p] || 0) + 1;
          if (w.mind === 'look' && !looked[k]) { looked[k] = true; R.othersLook.push(+t.toFixed(2)); }
          if (w.mind === 'look' && Math.abs(w.vx) > 8) R.frozeWhileLook = false;
          if (R.lookAt == null && w === near && w.mind === 'look') R.lookAt = t;
          if (R.faceAt == null && w === near && w.mind === 'look' && faceSide(w) === Math.sign(pcx() - cx(w))) R.faceAt = t;
          if (R.firstCoil == null) { if (w.snarlT > 0) R.before.snarl++; if (p === 'bay') R.before.bay++; }
          if (w.feint && w.feint.ph !== 'back') R.before.feintMinGap = Math.min(R.before.feintMinGap, Math.abs(pcx() - cx(w)));
          if (w.feint && player.cores < c0) R.feintHit++;
          if (w.coilT > 0 && !coilWas[k]) { R.coils.push({ k, t: +t.toFixed(3) }); if (R.firstCoil == null) R.firstCoil = t; }
          if (w.coilT > 0) coilRun[k]++; else if (coilRun[k]) { R.tellFast.push(coilRun[k]); coilRun[k] = 0; }
          coilWas[k] = w.coilT > 0 ? 1 : 0;
        });
        if (R.firstCoil == null) R.before.feints = W.reduce((n, w) => n + (w.feintN | 0), 0);
        if (player.cores < c0) { R.bites++; if (R.firstBite == null) R.firstBite = t; }
        // the spread: while two or more stand off her, how far apart they hold
        const off = W.filter(w => !w.dead && w.mind === 'display' && !w.feint);
        if (off.length >= 2) {
          const sides = new Set(off.map(w => Math.sign(cx(w) - pcx())));
          if (sides.size > 1) R.sides++;
          const d = off.map(w => Math.abs(cx(w) - pcx())).sort((a, b) => a - b);
          let minSep = 1e9; for (let j = 1; j < d.length; j++) minSep = Math.min(minSep, d[j] - d[j - 1]);
          R.spreadN++; if (sides.size > 1 || minSep >= 40) R.spread++;
        }
        if (!heard.length) {} else if (R.bark == null) { const b = heard.find(h => h[0] === 'wolf_bark'); if (b) R.bark = +(b[1] - t0).toFixed(2); }
        if (player.cores < 3) player.cores = 5;
      }
      R.TELL_FAST = TELL_FAST;
      return R;
    `);
    check('B. she comes into sight: the nearest wolf stops and LOOKS inside half a second', B.lookAt != null && B.lookAt <= 0.5 && B.frozeWhileLook, 'looked at ' + B.lookAt + ' s, faced her at ' + B.faceAt);
    check('   ...barks for the others, and every wolf of the pack stops and looks', B.bark != null && B.bark <= 1.2 && B.othersLook.length === 3 && Math.max.apply(null, B.othersLook) <= 1.6,
      'bark at ' + B.bark + ' s; looks at ' + B.othersLook.join(', '));
    check('C. before the first bite: the snarl, a stand at bay, and a feint', B.firstCoil != null && B.before.snarl >= 25 && B.before.bay >= 30 && B.before.feints >= 1,
      'first coil at ' + (B.firstCoil == null ? '-' : B.firstCoil.toFixed(2)) + ' s; snarl ' + B.before.snarl + ' frames, at bay ' + B.before.bay + ', feints ' + B.before.feints);
    check('   ...a feint stops SHORT of her and costs her nothing', B.before.feintMinGap >= 60 && B.feintHit === 0, 'nearest a feint came ' + Math.round(B.before.feintMinGap) + ' px (centre to centre); cores lost to a feint ' + B.feintHit);
    check('D. the pack spreads: held at different distances or on both sides of her', B.spreadN > 60 && B.spread / B.spreadN >= 0.7, B.spread + '/' + B.spreadN + ' frames spread, ' + B.sides + ' with wolves on both sides');
    const gaps = []; const cs = B.coils.slice().sort((a, b) => a.t - b.t); for (let i = 1; i < cs.length; i++) gaps.push(+(cs[i].t - cs[i - 1].t).toFixed(2));
    check('E. one at a time: no two tells start within 0.4 s', cs.length >= 2 && gaps.every(g => g >= 0.4), cs.length + ' tells; gaps ' + gaps.join(', '));
    check('   ...and more than one wolf takes a turn', new Set(cs.map(c => c.k)).size >= 2, 'tells by wolves ' + [...new Set(cs.map(c => c.k))].join(','));
    check('F. still dangerous: the tell is the full one, and bites LAND on a girl who stands still', B.tellFast.length && B.tellFast.every(f => Math.abs(f / 60 - B.TELL_FAST) <= 0.035) && B.bites >= 2,
      'tells ' + B.tellFast.map(f => (f / 60).toFixed(2)).join(',') + ' s; ' + B.bites + ' bites landed in 16 s');

    // ---- G. HURT -------------------------------------------------------------------
    const G2 = await run(`
      for (let i = 0; i < 60; i++) { away(); update(1 / 60); }
      G.enemies = [W[0]]; const w = W[0];
      put(cx(w) - 250); player.face = 1; player.iT = 9;
      let n = 0; while (!(w.mind === 'display' && w.holding && !w.feint) && n++ < 600) { player.iT = 9; update(1 / 60); }
      const d0 = Math.abs(cx(w) - pcx()), side = Math.sign(pcx() - cx(w));
      w.hp = Math.max(1, Math.floor(w.hpMax0 * 0.3)); w.hurtT = 0.2;      // a blow that leaves it badly hurt
      let back = 0, faced = 0, pant = 0, phStart = w._ph || 0, phMin = phStart, turnedBack = 0;
      for (let i = 0; i < 60 * 2.2; i++) {
        player.iT = 9; player.vx = 0; update(1 / 60);
        const d = Math.abs(cx(w) - pcx());
        if (i < 40) { back = Math.max(back, d - d0); if (faceSide(w) === side) faced++; if (Math.abs(w.vx) > 5 && Math.sign(w.vx) === -side && faceSide(w) !== side) turnedBack++; phMin = Math.min(phMin, w._ph || 0); }
        if (pz(w) === 'pant') pant++;
        if (pz(w) === 'pant') { const c = document.createElement('canvas').getContext('2d'); drawBeastPlate(c, w, WOLF_ART, false); w._pantImg = w._shownImg; }
      }
      return { at: Math.round(d0), back: Math.round(back), faced, pant, turnedBack, strideBack: +(phStart - phMin).toFixed(2), pantImg: w._pantImg };
    `);
    check('G. a blow sends it BACK, facing her the whole way (never its back to her)', G2.back >= 15 && G2.faced >= 38 && G2.turnedBack === 0,
      'held at ' + G2.at + ' px, gave ' + G2.back + ' px; faced her ' + G2.faced + '/40 frames');
    check('   ...its stride runs backwards as it backs (it walks back, it does not slide)', G2.strideBack > 0.3, 'stride phase went back ' + G2.strideBack + ' half-steps');
    check('   ...and badly hurt it pants, on the pant strip', G2.pant >= 30 && G2.pantImg === 'wolfPant6', G2.pant + ' frames, drawn from ' + G2.pantImg);

    // ---- H. THE LAST ONE ----------------------------------------------------------------
    const H = await run(`
      for (let i = 0; i < 30; i++) { away(); update(1 / 60); }
      put(cx(W[0]) - 260); player.face = 1; player.iT = 9;
      for (let i = 0; i < 60 * 2.5; i++) { player.iT = 9; update(1 / 60); }
      W[1].dead = true; W[2].dead = true; heard.length = 0;
      let bay = 0;
      const last = W[0];
      for (let i = 0; i < 60 * 1.5; i++) { player.iT = 9; update(1 / 60); if ((last.bayT || 0) > 0 && pz(last) === 'bay') bay++; }
      return { bay, bark: heard.some(h => h[0] === 'wolf_bark') };
    `);
    check('H. the last of a pack bays for the others', H.bay >= 30 && H.bark, H.bay + ' frames baying, bark heard ' + H.bark);

    // ---- I. EVERY STATE ITS OWN STRIP -----------------------------------------------------
    const I = await run(`
      const art = WOLF_ART; for (const k of Object.keys(art)) mediaFetch(art[k].img, 1);
      for (let i = 0; i < 200 && !Object.values(art).every(a => MEDIA_IMG[a.img] && MEDIA_IMG[a.img].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
      const c = document.createElement('canvas').getContext('2d');
      const w = W[0]; G.enemies = [w]; away();
      const shown = (setup) => { const keep = {}; for (const k of ['mind','mindPose','vx','snarlT','snapT','coilT','lungeT','hunt','on','vy','airT','landT','land0','windedT','thrashT']) keep[k] = w[k];
        setup(); drawBeastPlate(c, w, WOLF_ART, false); const r = w._shownImg + '#' + w._shownCell; Object.assign(w, keep); return r; };
      const base = () => { w.mind = 'display'; w.mindPose = null; w.vx = 0; w.snarlT = 0; w.snapT = 0; w.coilT = 0; w.lungeT = 0; w.hunt = 1; w.on = true; w.vy = 0; w.airT = 0; w.landT = 0; w.windedT = 0; w.thrashT = 0; };
      const out = {
        sit: shown(() => { base(); w.mind = 'calm'; w.hunt = 0; w.mindPose = 'sitWild'; }),
        sniff: shown(() => { base(); w.mind = 'calm'; w.hunt = 0; w.mindPose = 'sniff'; }),
        prowl: shown(() => { base(); w.mind = 'calm'; w.hunt = 0; w.vx = 34; }),
        look: shown(() => { base(); w.mind = 'look'; w.mindPose = 'look'; }),
        bark: shown(() => { base(); w.mind = 'call'; w.mindPose = 'bay'; }),
        snarl: shown(() => { base(); w.snarlT = 0.3; }),
        bay: shown(() => { base(); }),
        snap: shown(() => { base(); w.snapT = 0.3; }),
        stalk: shown(() => { base(); w.vx = 80; }),
        charge: shown(() => { base(); w.vx = 160; }),
        coil: shown(() => { base(); w.coilT = 0.2; }),
        lunge: shown(() => { base(); w.lungeT = 0.1; }),
        leap: shown(() => { base(); w.on = false; w.airT = 0.3; w.vy = -300; }),
        land: shown(() => { base(); w.landT = 0.2; w.land0 = 0.32; }),
        pant: shown(() => { base(); w.mindPose = 'pant'; }),
      };
      // the look is HELD: the same cell at any time
      const l1 = shown(() => { base(); w.mindPose = 'look'; w.anim = 0.3; }), l2 = shown(() => { base(); w.mindPose = 'look'; w.anim = 1.7; });
      out.lookHeld = l1 === l2;
      // and the wild sit is drawn red, not the tame cyan
      const im = MEDIA_IMG.wolfSit6, wild = wildArt('wolfSit6', (typeof popArt === 'function' && popArt('wolfSit6')) || im);
      const cv = document.createElement('canvas'); cv.width = wild.width || wild.naturalWidth; cv.height = wild.height || wild.naturalHeight;
      const x = cv.getContext('2d'); x.drawImage(wild, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data;
      let cyan = 0, red = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { if (d[i + 2] > 120 && d[i + 2] > d[i] * 1.6) cyan++; if (d[i] > 120 && d[i] > d[i + 2] * 1.6 && d[i] > d[i + 1] * 1.6) red++; }
      out.sitColour = { cyan, red };
      return out;
    `);
    const want = { sit: 'wolfSit6', sniff: 'wolfPant6', prowl: 'wolfProwl8', look: 'wolfIdle6', bark: 'wolfBay6', snarl: 'wolfSnarl8', bay: 'wolfBay6', snap: 'wolfBite6',
      stalk: 'wolfStalk10', charge: 'wolfCharge8', coil: 'wolfCoil6', lunge: 'wolfLunge6', leap: 'wolfLeap6', land: 'wolfLanding4', pant: 'wolfPant6' };
    const wrong = Object.keys(want).filter(k => !String(I[k]).startsWith(want[k] + '#'));
    check('I. every state draws its own filmed strip', wrong.length === 0, wrong.length ? wrong.map(k => k + '=' + I[k] + ' (want ' + want[k] + ')').join('; ') : Object.keys(want).map(k => k + ':' + want[k]).join(' '));
    check('   ...the look is a held frame, head up — not the breathing idle', I.lookHeld);
    check('   ...and a wild wolf sitting wears the pack\'s red, not the tamed cyan', I.sitColour.red > 200 && I.sitColour.cyan < I.sitColour.red / 10, JSON.stringify(I.sitColour));

    // ---- J. HER SMALL WOLF ------------------------------------------------------------------
    const J = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      let s = 0x77aa5511; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, alpha: 1 });
      sv.arms = ['pack']; startGame(sv);
      // a machine on the level floor of a cat kingdom, charmed still by the Song so it is a fixed quarry
      const fy = (x) => { const g = groundColumnAt(x); return g ? Math.min.apply(null, g) : null; };
      let qx = null, room = null;
      for (const id of ['A1', 'C1', 'C2', 'D1', 'A0', 'A2']) {
        if (!ROOMS[id]) continue;
        loadRoom(id); G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.trans = G.meet = null; G.toasts = [];
        const W = G.roomDef.w * TILE;
        for (let x = 200; x < W - 600 && qx == null; x += 32) { const a = fy(x); if (a == null) continue; let flat = true;
          for (let k = 0; k <= 400; k += 16) { const y = fy(x + k); if (y == null || Math.abs(y - a) > 22) { flat = false; break; } }
          if (flat) qx = x; }
        if (qx != null) { room = id; break; }
      }
      if (qx == null) return { err: 'no near-level floor 400 px long in any room tried' };
      const foe = new Enemy('blob', qx, fy(qx) - 30); foe.y = fy(qx) - foe.h; foe.hp = 999; foe.hypnoT = 1e9;
      G.enemies = [foe];
      player.x = qx + 380 - player.w / 2; player.y = fy(qx + 380) - player.h; player.vx = 0; player.face = -1; player.iT = 99;
      player.volts = 200; player.armCD = 0; const cores0 = player.cores; const hp0 = foe.hp;
      if (!packCall(player)) return { err: 'no call' };
      const w = G.packWolf; const seq = []; let was = '', bites = 0, minGapFeint = 1e9, lookBeforeCoil = false, feintBeforeCoil = false, bayBeforeCoil = 0, firstCoil = null;
      let hpWas = foe.hp;
      for (let f = 0; f < 60 * 12; f++) {
        player.iT = 99; foe.hypnoT = 1e9; update(1 / 60); G.state = 'PLAY'; G.dialog = null;
        const q = G.packWolf; if (!q) break;
        const p = wolfPose(q, WOLF_ART, false).replace(/[AB]$/, '');
        if (p !== was) { seq.push(p); was = p; }
        const hb = hurtBoxOf(foe), gap = Math.abs(hb.x + hb.w / 2 - q.x - q.w / 2) - hb.w / 2;
        if (firstCoil == null) {
          if (p === 'look') lookBeforeCoil = true;
          if (q.feint) { feintBeforeCoil = true; minGapFeint = Math.min(minGapFeint, gap); }
          if (p === 'bay') bayBeforeCoil++;
          if (q.coilT > 0) firstCoil = f / 60;
        }
        if (foe.hp < hpWas) { bites++; }
        hpWas = foe.hp;
      }
      return { room, seq: seq.join('>'), bites, dealt: hp0 - foe.hp, lost: cores0 - player.cores, lookBeforeCoil, feintBeforeCoil, minGapFeint: Math.round(minGapFeint), bayBeforeCoil, firstCoil, reach: PACK_CALL.reach };
    });
    if (J.err) check('J. her small wolf', false, J.err);
    else {
      check('J. her small wolf LOOKS at its quarry, stands at bay and feints before it bites', J.lookBeforeCoil && J.feintBeforeCoil && J.bayBeforeCoil >= 10 && J.firstCoil != null,
        J.room + ': first coil at ' + J.firstCoil + ' s; at bay ' + J.bayBeforeCoil + ' frames before it; ' + J.seq.slice(0, 160));
      check('   ...its feint stops short of the quarry', J.minGapFeint >= J.reach - 10, 'nearest ' + J.minGapFeint + ' px (edge), its bite gathers from ' + J.reach);
      check('   ...it bites — a little: a few bites in its ten seconds, not a flurry', J.bites >= 2 && J.bites <= 5, J.bites + ' bites, ' + J.dealt + ' dealt');
      check('   ...and never touches her', J.lost === 0, 'cores lost ' + J.lost);
    }
    // ---- K. HER WOLF NEVER JUST DANCES ------------------------------------------------
    // (coordinator, 2026-11-26: in a batch run her small wolf danced its whole
    // ten seconds round a cat in CV2 and never bit.) Weak, never idle: over many
    // dice, against a cat that holds its own guard and against a slow blob, it
    // bites at least once every time, and the first bite comes inside 4 s of
    // it getting near its quarry — the dance and the feint stay before it.
    const K = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      const fy = (x) => { const g = groundColumnAt(x); return g ? Math.min.apply(null, g) : null; };
      const runs = [];
      const one = (scene, seed) => {
        let s = seed >>> 0; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, alpha: 1 });
        sv.arms = ['pack']; startGame(sv);
        G.packWolf = null;
        let foe;
        if (scene === 'cat') {
          // the pack-call scene: the first machine of the cave, the rest put away, her 320 px off
          loadRoom('CV2'); G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.trans = G.meet = null; G.toasts = [];
          const foes = G.enemies.filter(e => !e.dead && !e.disabled); foe = foes[0];
          for (const e of G.enemies) if (e !== foe) e.dead = true;
          player.x = foe.x + 320; player.y = foe.y + foe.h - player.h; player.face = -1;
        } else {
          loadRoom('A1'); G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.trans = G.meet = null; G.toasts = [];
          const x0 = 26 * TILE; foe = new Enemy('blob', x0, 0); foe.y = fy(x0 + foe.w / 2) - foe.h; G.enemies = [foe];
          player.x = x0 + 300; player.y = fy(x0 + 300) - player.h; player.face = -1;
        }
        foe.hp = 999; foe.calm = false; const hp0 = foe.hp;
        player.vx = 0; player.iT = 99; const cores0 = player.cores;
        if (!packCall(player)) return { scene, err: 'no call' };
        let near = null, bite = null, coil = false, feintFirst = null;
        for (let f = 0; f < 60 * 11; f++) {
          player.iT = 99; player.vx = 0; foe.iT = 0; update(1 / 60); G.state = 'PLAY'; G.dialog = null;
          const w = G.packWolf; if (!w) break;
          const hb = hurtBoxOf(foe), gap = Math.abs(hb.x + hb.w / 2 - w.x - w.w / 2) - hb.w / 2;
          const t = f / 60;
          if (near == null && gap < 200) near = t;
          if (w.feint && feintFirst == null) feintFirst = t;
          if (w.coilT > 0) coil = true;
          if (bite == null && foe.hp < hp0) bite = t;
          if (foe.dead) break;
        }
        return { scene, near, bite, wait: bite != null && near != null ? +(bite - near).toFixed(2) : null, feintFirst, lost: cores0 - player.cores };
      };
      for (let i = 0; i < 10; i++) runs.push(one('cat', 0x9e3779b1 * (i + 1)), one('blob', 0x85ebca6b * (i + 3)));
      return runs;
    });
    const noBite = K.filter(r => r.err || r.bite == null);
    const slow = K.filter(r => r.bite != null && !(r.wait != null && r.wait <= 4));
    check('K. over 20 dice (10 against a guarding cat, 10 against a blob) her wolf bites in EVERY run', noBite.length === 0,
      noBite.length ? noBite.map(r => r.scene + (r.err ? ' ' + r.err : ' never bit (near at ' + r.near + ' s)')).join('; ') : K.length + ' runs, every one bit');
    check('   ...the first bite inside 4 s of getting near its quarry', slow.length === 0,
      'waits ' + K.map(r => r.scene[0] + r.wait).join(' ') + (slow.length ? '  SLOW: ' + slow.map(r => r.scene + ' ' + r.wait).join(', ') : ''));
    // (on level ground the dance and its feint come first; a cat up or down a
    // bank is gone at directly — there is no ground between them to dance on)
    const blobs = K.filter(r => r.scene === 'blob');
    const feintedB = blobs.filter(r => r.feintFirst != null && r.bite != null && r.feintFirst < r.bite).length;
    check('   ...on level ground the feint still comes before the first bite, and it never touches her', feintedB === blobs.length && K.every(r => !r.lost),
      feintedB + '/' + blobs.length + ' level runs feinted first (' + K.filter(r => r.feintFirst != null && r.bite != null && r.feintFirst < r.bite).length + '/20 overall); cores lost ' + K.reduce((n, r) => n + (r.lost || 0), 0));
    check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nwolf-mind: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
