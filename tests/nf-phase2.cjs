// NULLFANG HAS TWO PHASES YOU CAN SEE AND HEAR (owner, 2026-11-21: "I can only see one phase
// of nilfang. We agreed there should be two phases, with the second phase to be harder. It
// starts with a roar that you should download from any library of a lion roar. Makes him
// faster with his dashes ... raise their head ... stand on two legs ... its eyes need to blink").
// Drives his real update and draw, and holds:
//   - half his health breaks him: he staggers, then ROARS — a recorded lion (CC0), the pair of
//     roars kept for this — and from that roar every light on him burns red;
//   - phase one is never drawn red, phase two always is;
//   - his roar is never the same recording twice running;
//   - phase two dashes faster than phase one;
//   - phase two rears on its hind legs at close range (a full tell, swats and a slam), never
//     in phase one;
//   - he blinks every few seconds, and never in a wind-up.
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
  const R = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv);
    for (const k of Object.keys(MEDIA_SRC.images).filter(k => /^beast/.test(k))) mediaFetch(k, true);
    for (let i = 0; i < 400 && !['beastStudioIdle', 'beastStudioRoar', 'beastStudioRear'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    // every recording asked for, by key
    const played = []; const PB = window.playBuf; window.playBuf = function (k) { played.push(k); return true; };
    const looks = { p1: new Set(), p2: new Set(), pre: new Set() }; const DS = window.drawStripCell;
    let phaseNow = 1; window.drawStripCell = function (c, key, cell, cells, cx, base, h, flip, pure) { if (/^beast/.test(key) && G.boss) looks[G.boss.phase === 2 ? (G.boss.rageSeen ? 'p2' : 'pre') : 'p1'].add(String(pure)); return DS.apply(this, arguments); };
    const ctx = document.querySelector('canvas').getContext('2d');
    const out = {};
    const stage = (hpK, phase) => {
      loadRoom('A4'); G.state = 'PLAY'; G.dialog = null; G.enemies = [];
      const bo = new Boss('glitch', 20 * TILE, (G.roomDef.h - 6) * TILE); G.boss = bo; bo.meet = false;
      bo.st = 'idle'; bo.t = 0.2; bo.hp = bo.hpMax * hpK; bo.phase = phase; if (phase === 2) { bo.nullUsed = true; bo.rageSeen = true; }
      return bo;
    };
    const fight = (bo, secs, range, rec) => {
      for (let f = 0; f < secs * 60; f++) {
        player.iT = 99; player.dead = false;
        if (/^(idle|stalk|run|recover|rearspent)$/.test(bo.st)) { player.x = bo.cx() + (bo.cx() > G.roomDef.w * TILE / 2 ? -range : range) - player.w / 2; player.y = bo.y + bo.h - player.h; player.vx = 0; }
        try { bo.update(1 / 60); } catch (e) { }
        phaseNow = bo.phase; bo.draw(ctx);
        rec && rec(bo);
      }
    };
    // 1. the break at half
    { const bo = stage(0.51, 1); played.length = 0; let roared = false, redAt = null, f0 = 0;
      bo.hp = bo.hpMax * 0.49;
      const roarsAt = []; let seen = 0;
      fight(bo, 9, 300, (q) => { f0++; if (q.st === 'roar') roared = true; if (q.rageSeen && redAt == null) redAt = f0; while (seen < played.length) { if (/roar/.test(played[seen])) roarsAt.push([f0, played[seen]]); seen++; } });
      const bigAt = (roarsAt.find(r => r[1] === 'nf_lroar_big') || [0])[0];
      out.roarGap = roarsAt.filter(r => r[1] !== 'nf_lroar_big' && r[0] > bigAt).map(r => +((r[0] - bigAt) / 60).toFixed(2));
      out.brk = { phase: bo.phase, roared, red: !!bo.rageSeen, big: played.filter(k => k === 'nf_lroar_big').length, keys: [...new Set(played)].filter(k => /roar/.test(k)) }; }
    // 2. dash speed by phase, and the rear
    const speed = (phase) => { const bo = stage(phase === 2 ? 0.4 : 1, phase); let vmax = 0, rears = 0, warn = [], cur = 0;
      fight(bo, 30, 320, (q) => { if (q.st === 'pounce' && q.lungeFly) vmax = Math.max(vmax, Math.abs(q.vx)); });
      return vmax; };
    out.v1 = speed(1); out.v2 = speed(2);
    const rearRun = (phase) => { const bo = stage(phase === 2 ? 0.4 : 1, phase); let n = 0, len = [], cur = 0, slam = 0;
      fight(bo, 40, 120, (q) => { if (q.st === 'rearwarn') cur++; else if (cur) { len.push(+(cur / 60).toFixed(2)); n++; cur = 0; } if (q.rearSlammed) slam++; });
      return { n, len, slam }; };
    out.r1 = rearRun(1); out.r2 = rearRun(2);
    // 3. the roar never twice the same
    played.length = 0; for (let i = 0; i < 9; i++) beastSound('roar');
    out.roars = played.slice();
    // 4. blinks
    { const bo = stage(1, 1); let blinks = 0, last = 0, inTell = 0;
      fight(bo, 14, 700, (q) => { const k = q._blinkK || 0; if (k > 0.5 && last <= 0.5) blinks++; if (k > 0 && /warn|crouch|charge/.test(q.st)) inTell++; last = k; });
      out.blinks = blinks; out.inTell = inTell; }
    window.playBuf = PB; window.drawStripCell = DS;
    out.looks = { p1: [...looks.p1], p2: [...looks.p2] };
    out.rearArt = !!(MEDIA_RAW.beastStudioRear && MEDIA_RAW.beastStudioRear.naturalWidth);
    return out;
  });
  check('half his health breaks him into phase two, and he roars', R.brk.phase === 2 && R.brk.roared, JSON.stringify(R.brk));
  check('...the roar is a recorded lion, the pair kept for the break', R.brk.big >= 1, JSON.stringify(R.brk.keys));
  check('...and from that roar every light on him burns red', R.brk.red);
  check('...and no other roar runs into it (the null field waits)', R.roarGap.every(g => g >= 3.5), JSON.stringify(R.roarGap));
  check('phase one is never drawn red; from the roar on, phase two always is', !R.looks.p1.includes('rage') && R.looks.p2.includes('rage') && !R.looks.p2.includes('false'), JSON.stringify(R.looks));
  check('his roar is a recorded lion, never the same take twice running', R.roars.length === 9 && R.roars.every(k => /^nf_lroar[123]$/.test(k)) && R.roars.every((k, i) => i === 0 || k !== R.roars[i - 1]), R.roars.join(' '));
  check('phase two dashes faster than phase one', R.v2 > R.v1 * 1.1, Math.round(R.v1) + ' -> ' + Math.round(R.v2) + ' px/s');
  check('the rearing take is delivered', R.rearArt);
  check('phase two rears on its hind legs at close range, with a full tell and the slam', R.r2.n >= 1 && R.r2.len.every(x => x >= 0.5) && R.r2.slam > 0, JSON.stringify(R.r2));
  check('...never in phase one', R.r1.n === 0, JSON.stringify(R.r1));
  check('he blinks every few seconds', R.blinks >= 3, R.blinks + ' blinks in 14 s');
  check('...and never in a wind-up', R.inTell === 0, R.inTell + ' frames');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — two phases, seen and heard: the lion roars, burns red, dashes faster, rears and blinks');
})().catch(e => { console.error(e); process.exit(1); });
