// THE SILT MIRE'S FERRY (owner, 2026-11-21: "Maybe I will need a boat to reach it.
// This boat needs shards as transaction, higher amount of shards that needs to be
// collected, or a quest... The quest should be hard. The shards should be high...
// a wooden raft that is operated by an NPC"). And the ledger: nothing opens or buys
// by surprise; tell her where to go and why.
//   - the way in is a drain culvert off the long conduit (B2), not a cave mouth;
//   - talking to Bilge ASKS: a card, nothing paid for half a second or by a key
//     already down;
//   - the fare is high (600 scrap), and a player without it is told so;
//   - paid, the raft carries her across when she stands on it, and the far bank
//     lets her on into the reedbank;
//   - unpaid, the water stops her: under the surface she is pulled out, a core lighter;
//   - the errand: his pole lies in the spillway under the dock, past two runs of
//     teeth no plain jump crosses; bringing it back pays the crossing;
//   - the swamp is heard (frogs, and a recorded alligator in the wallow) and its
//     insects fly.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  console.log('── mire-ferry — the culvert, Bilge\'s question, the fare, the raft, the water, the errand');
  const R = await p.evaluate(async () => {
    const out = {};
    const FL = { tut: 1, woke: 1, crystal: 1, bossGlitch: 1, ch2Climb: 1, bossCarrier: 1, k2Road: 1 };
    const fresh = (room, extra, scrap) => { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FL, extra || {}); sv.scrap = scrap == null ? 700 : scrap; startGame(sv); loadRoom(room); G.state = 'PLAY'; G.dialog = null; G.toasts = []; G.bossEntry = null; };
    const step = (n, f) => { for (let i = 0; i < n; i++) { for (const k in keysP) keysP[k] = 0; if (f) f(i); update(1 / 60); if (G.dialog && !G.dialog.keep) G.dialog = null; } };
    // the door in
    fresh('B2');
    out.b2door = gateDoorsAll('B2').map(d => d.to + ':' + d.style);
    // Bilge asks
    fresh('SW1'); step(30);
    const bil = G.statics.find(s => s.type === 'ferry');
    out.bilge = !!bil;
    G.save.flags.bilgeMet = 1;
    player.x = bil.x - 10; player.y = bil.y; step(10);
    keys.KeyX = 1;   // a key ALREADY DOWN when the card opens
    doInteract(bil);
    out.state = G.state;
    const scrap0 = G.save.scrap;
    for (let i = 0; i < 20; i++) { keysP.Enter = 1; keys.Enter = 1; update(1 / 60); }
    out.surprise = G.save.scrap !== scrap0 || !!G.save.flags.ferryPaid;
    keys.Enter = 0; keys.KeyX = 0; for (let i = 0; i < 40; i++) { for (const k in keysP) keysP[k] = 0; update(1 / 60); }
    K2F.idx = 0; keysP.Enter = 1; update(1 / 60); keysP.Enter = 0;
    out.paid = { flag: !!G.save.flags.ferryPaid, scrap: scrap0 - G.save.scrap };
    G.state = 'PLAY'; G.dialog = null;
    // too poor: told so, nothing taken
    fresh('SW1', { bilgeMet: 1 }, 120); step(10);
    const bil2 = G.statics.find(s => s.type === 'ferry'); doInteract(bil2);
    for (let i = 0; i < 40; i++) update(1 / 60);
    K2F.idx = 0; keysP.Enter = 1; update(1 / 60); keysP.Enter = 0;
    out.poor = { flag: !!G.save.flags.ferryPaid, scrap: G.save.scrap, toast: (G.toasts || []).map(t => t.text).join('|') };
    G.state = 'PLAY';
    // paid: the raft carries her across
    fresh('SW1', { ferryPaid: 1, bilgeMet: 1 }); step(5);
    const raft = G.plats.find(q => q.k2raft);
    player.x = raft.x + raft.w / 2 - player.w / 2; player.y = raft.y - player.h - 2; player.vy = 0;
    let crossed = false, maxX = 0;
    for (let i = 0; i < 60 * 25 && !crossed; i++) { update(1 / 60); G.dialog = null; maxX = Math.max(maxX, raft.x); if (raft.st === 'moored' && Math.abs(raft.x - raft.xF) < 2) crossed = true; }
    out.ride = { crossed, onRaft: k2OnRaft(raft), hurt: player.cores < (player.coresMax || 5), far: !!G.save.flags.raftFar };
    // ...and off the far bank into the reedbank
    player.x = G.roomDef.w * TILE - player.w - 4; player.y = 15 * TILE - player.h; player.vx = 300;
    for (let i = 0; i < 60 && !G.trans; i++) { keys.ArrowRight = 1; update(1 / 60); }
    keys.ArrowRight = 0;
    out.reedbank = G.trans && G.trans.to;
    // unpaid: the water stops her
    fresh('SW1', { bilgeMet: 1 }); step(5);
    const c0 = player.cores;
    player.x = 30 * TILE; player.y = 15 * TILE; player.vy = 200;
    step(120);
    out.water = { lost: c0 - player.cores, x: Math.round(player.x / TILE) };
    // the errand: the spillway's runs are wider than a jump
    fresh('SW5', { bilgeMet: 1, ferryQuest: 1 }); step(5);
    const g = G.grid; const runs = []; let r = 0;
    for (let x = 1; x < g[0].length - 1; x++) { if (g[16][x] === '^') r++; else { if (r) runs.push(r); r = 0; } }
    out.runs = runs;
    out.pole = !!G.statics.find(s => s.type === 'k2pole');
    out.door = gateDoorsAll('SW5').map(d => d.to);
    const pole = G.statics.find(s => s.type === 'k2pole'); doInteract(pole);
    out.got = !!G.save.flags.k2pole;
    fresh('SW1', { bilgeMet: 1, ferryQuest: 1, k2pole: 1 }, 0); step(5);
    const bil3 = G.statics.find(s => s.type === 'ferry'); doInteract(bil3);
    for (let i = 0; i < 40; i++) update(1 / 60);
    K2F.idx = 1; keysP.Enter = 1; update(1 / 60); keysP.Enter = 0;
    out.errand = { paid: !!G.save.flags.ferryPaid, scrap: G.save.scrap };
    // the spillway is hard: a fall anywhere sends her back to where she dropped in
    fresh('SW5', { bilgeMet: 1, ferryQuest: 1 }); step(5);
    player.x = 30 * TILE; player.y = 14 * TILE; step(2);
    out.safe = Math.round(player.lastSafe.x / TILE);
    // ...and CROSSABLE: a run, a jump at the lip, the dash at the top of it
    const cross = (useDash) => {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, FL, { bilgeMet: 1, ferryQuest: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, gateOpened: 1, bossHorn: 1 }); sv.abil = { dash: 1 }; G.rescue = null; startGame(sv); loadRoom('SW5'); G.state = 'PLAY'; G.dialog = null; G.rescue = null;
      player.x = 3 * TILE; player.y = 15 * TILE - player.h; player.vy = 0; step(10);
      let jumped = false, dashed = false, landX = null; const t0x = player.x;
      for (let i = 0; i < 240; i++) {
        for (const k in keysP) keysP[k] = 0; keys.ArrowRight = 1; keys.Space = 0;
        const cx = player.x + player.w / 2;
        if (!jumped && player.on && cx > 9.55 * TILE) { keysP.Space = 1; keys.Space = 1; jumped = true; }
        else if (jumped && !player.on) keys.Space = 1;
        if (useDash && jumped && !dashed && !player.on && player.vy > -80) { keysP.KeyC = 1; keys.KeyC = 1; dashed = true; }
        if (G.dialog || G.state !== 'PLAY') { G.dialog = null; G.state = 'PLAY'; }
        update(1 / 60); keys.KeyC = 0;
        if (jumped && i > 10 && player.on) { landX = (player.x + player.w / 2) / TILE; break; }
        if (G.rescue) { landX = -1; break; }
      }
      keys.ArrowRight = 0; keys.Space = 0;
      return landX == null ? null : +landX.toFixed(1);
    };
    out.jumpOnly = cross(false); out.jumpDash = cross(true);
    // heard and alive
    const heard = []; const pb = window.playBuf; window.playBuf = (k) => { heard.push(k); return false; };
    // (the frogs are the room's air: a streamed bed, audio.js ambPlay)
    const ap = window.ambPlay; window.ambPlay = (k) => { heard.push(k); };
    K2.ambOn = false; fresh('SW2'); step(20);
    window.playBuf = pb; window.ambPlay = ap;
    out.heard = heard.filter(k => /^k2_|^mj_/.test(k));
    out.flies = K2.flies.length;
    out.music = MUS.name;
    return out;
  });
  check('the way in is a drain culvert off the long conduit', R.b2door.indexOf('SW1:culvert') >= 0, R.b2door.join(','));
  check('Bilge is at the dock', R.bilge);
  check('talking to him ASKS — a card, not a purchase', R.state === 'FERRY', R.state);
  check('...and nothing is paid by a key already down or in the first half second', !R.surprise);
  check('the fare is high: 600 scrap, and paying it opens the crossing', R.paid.flag && R.paid.scrap === 600, JSON.stringify(R.paid));
  check('...a player without it is told so, and nothing is taken', !R.poor.flag && R.poor.scrap === 120 && /scrap/i.test(R.poor.toast), JSON.stringify(R.poor));
  check('paid, the raft carries her across the water when she stands on it', R.ride.crossed && R.ride.far && !R.ride.hurt, JSON.stringify(R.ride));
  check('...and the far bank lets her on into the reedbank', R.reedbank === 'SW2', String(R.reedbank));
  check('unpaid, the water stops her: pulled out, a core lighter, back on the dock side', R.water.lost === 1 && R.water.x < 30, JSON.stringify(R.water));
  check('the errand is hard: two runs of teeth, each wider than any jump (13 tiles)', R.runs.length === 2 && R.runs.every(n => n >= 13), R.runs.join('/'));
  check('...a plain jump does not cross a run', R.jumpOnly == null || R.jumpOnly < 0 || R.jumpOnly < 22, 'landed at tile ' + R.jumpOnly);
  check('...a jump with the dash at its top does', R.jumpDash != null && R.jumpDash >= 23, 'landed at tile ' + R.jumpDash);
  check('...a fall anywhere in the spillway goes back to where she dropped in', R.safe <= 5, 'lastSafe tile ' + R.safe);
  check('...his pole lies at the far end, beside the culvert back to the dock', R.pole && R.door.indexOf('SW1') >= 0, R.door.join(','));
  check('...and bringing it back pays the crossing, no scrap needed', R.got && R.errand.paid && R.errand.scrap === 0, JSON.stringify(R.errand));
  check('the swamp is heard: frogs and crickets under its own music', R.heard.indexOf('k2_amb') >= 0 && R.music === 'swamp', R.heard.join(',') + ' / ' + R.music);
  check('...and its insects fly (graphics, never enemies)', R.flies >= 8, R.flies + ' flies');
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — a culvert in, a question at the dock, a high fare or a hard errand, and the water is water');
})().catch(e => { console.error(e); process.exit(1); });
