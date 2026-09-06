// FIVE PLAYERS, FIVE AGES — the owner's validation: simulated players with
// age-realistic input behavior play the first arc (wake -> walk -> gates ->
// tutorial -> booth -> shop -> node -> skill -> out) and every stumble is
// recorded. Each persona differs in reaction time, press cadence, jump hold,
// reading dwell, error rate, and wandering.
const { chromium } = require('playwright');

const PERSONAS = [
  { name: 'Lina, 6',    react: 24, jumpHold: 4,  dwell: 12,  err: 0.30, wander: 0.20, mashes: true },
  { name: 'Sam, 10',    react: 10, jumpHold: 9,  dwell: 30,  err: 0.12, wander: 0.10, mashes: false },
  { name: 'Kai, 16',    react: 4,  jumpHold: 10, dwell: 8,   err: 0.03, wander: 0.02, mashes: false },
  { name: 'Maryam, 35', react: 8,  jumpHold: 10, dwell: 110, err: 0.05, wander: 0.03, mashes: false },
  { name: 'George, 65', react: 22, jumpHold: 16, dwell: 150, err: 0.18, wander: 0.05, mashes: false },
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const results = [];
  for (const P of PERSONAS) {
    const r = await page.evaluate(async (PP) => {
      // fresh life
      const sv = newSave(1);
      startGame(sv); G.tut = null; loadRoom('W1');
      await new Promise(res => setTimeout(res, 600));
      G.wake = null;
      const LOG = { steps: {}, locked: 0, deaths: 0, jumps: 0, dialogPages: 0, wrongTrial: 0, done: false, at: '' };
      const K = (c2, on) => { if (on && !keys[c2]) keysP[c2] = 1; keys[c2] = on ? 1 : 0; };
      const clearAll = () => { for (const c2 of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'KeyZ', 'KeyX', 'KeyE', 'KeyF', 'KeyT', 'Enter']) K(c2, 0); };
      let rng = 12345 + PP.react * 77;
      const rnd3 = () => ((rng = Math.imul(rng ^ (rng >>> 15), 2246822519) >>> 0) % 1000) / 1000;
      let frame = 0, jumpT = 0, reactT = 0, dwellT = 0, lastStep = '', stepT0 = 0, trialWait = 0;
      const stepId = () => (G.tut && TUT_STEPS[G.tut.i] ? TUT_STEPS[G.tut.i].id : (G.save.flags.tut ? 'free' : '?'));
      const MAX = 60 * 420;                      // seven sim-minutes, then DNF
      for (frame = 0; frame < MAX; frame++) {
        const st = stepId();
        if (st !== lastStep) { if (lastStep) LOG.steps[lastStep] = +( (frame - stepT0) / 60).toFixed(1); lastStep = st; stepT0 = frame; }
        if (player.dead) LOG.deaths++;
        // done: the tutorial is behind them and they stand in A1
        if (G.save.flags.tut && G.roomId === 'A1') { LOG.done = true; break; }
        clearAll();
        if (reactT > 0) { reactT--; update(1 / 60); if (typeof clearP === 'function') clearP(); continue; }
        const cx = player.x + player.w / 2;
        const goTo = (tx) => {
          const off = (rnd3() < PP.wander ? (rnd3() - 0.5) * 120 : 0);
          if (cx < tx + off - 10) K('ArrowRight', 1);
          else if (cx > tx + off + 10) K('ArrowLeft', 1);
          else return true;
          return false;
        };
        const jumpNow = () => { if (jumpT <= 0) { jumpT = PP.jumpHold; LOG.jumps++; } };
        const unstick = () => { if (player.on && Math.abs(player.vx) < 12 && (keys.ArrowRight || keys.ArrowLeft)) jumpNow(); };
        if (jumpT > 0) { K('KeyZ', 1); jumpT--; }
        if (PP.mashes && rnd3() < 0.10) {          // a six-year-old presses THINGS
          const b = ['KeyX', 'KeyE', 'KeyF', 'KeyT'][(rnd3() * 4) | 0];
          K(b, 1); LOG.locked += (typeof tutAllows === 'function' && !tutAllows({ KeyX: 'ATK', KeyE: 'INT', KeyF: 'HEAL', KeyT: 'SKILL' }[b])) ? 1 : 0;
        }
        if (G.state === 'DIALOG') {
          if (dwellT < PP.dwell) { dwellT++; update(1 / 60); if (typeof clearP === 'function') clearP(); continue; }
          dwellT = 0; K('Enter', 1); LOG.dialogPages++;
          reactT = PP.react;
        } else if (G.state === 'SHOP') {
          if (dwellT < PP.dwell) { dwellT++; update(1 / 60); if (typeof clearP === 'function') clearP(); continue; }
          dwellT = 0; G.shopIdx = 0; K('Enter', 1); reactT = PP.react + 8;
          if (G.save.flags.tutBuy) { G.state = 'PLAY'; }
        } else if (G.state === 'SKILLS') {
          if (dwellT < PP.dwell) { dwellT++; update(1 / 60); if (typeof clearP === 'function') clearP(); continue; }
          dwellT = 0; K('Enter', 1);
          if (G.save.skills.length) { G.state = 'PLAY'; }
          reactT = PP.react;
        } else if (G.state === 'TRIAL') {
          // the memory circles: watch, then answer — with this age's errors
          if (TRI.game === 'mem' && TRI.memPhase === 'input') {
            if (trialWait < PP.react + 6) { trialWait++; update(1 / 60); if (typeof clearP === 'function') clearP(); continue; }
            trialWait = 0;
            let pick = TRI.memSeq[TRI.memIn];
            if (rnd3() < PP.err) { pick = (pick + 1) % 4; LOG.wrongTrial++; }
            const code = ['VL', 'VU', 'VR', 'VD'][pick];
            keys[code] = 1; keysP[code] = 1;
            update(1 / 60);
            keys[code] = 0; keysP[code] = 0;
            continue;
          } else if (TRI.mode === 'node' && TRI.results && G.save.iq >= 10) {
            TRI.node = null; TRI.mode = 'full'; G.state = 'PLAY';
          }
          update(1 / 60); continue;
        } else if (G.state === 'PLAY') {
          if (st === 'move') { K('ArrowRight', 1); if (rnd3() < PP.wander) { K('ArrowRight', 0); K('ArrowLeft', 1); } }
          else if (st === 'out' || st === 'gate' || st === 'go') {
            const gr = (typeof gateDoors === 'function' ? gateDoors() : [])[0];
            if (st === 'gate' && gr) { if (goTo(gateWorldX(gr))) { K('ArrowUp', 1); if (!G.gateWalk && player.on) gateEnter(); } }
            else K('ArrowRight', 1);
            // the step and the shelf on the way: jump when a wall is ahead
            if (player.on && Math.abs(player.vx) < 12 && keys.ArrowRight) jumpNow();
          }
          else if (st === 'jump') { K('ArrowRight', 1); if (player.on && Math.abs(player.vx) < 12) jumpNow(); if (player.on && rnd3() < 0.05) jumpNow(); }
          else if (st === 'atk' || st === 'kill') {
            const e = G.enemies.find(x => x && !x.dead);
            if (e) { const side = player.x < e.x ? -34 : 34; if (goTo(e.x + e.w / 2 + side)) { K('KeyX', 1); reactT = Math.max(3, PP.react >> 1); } }
          }
          else if (st === 'coin') {
            const w = G.wrecks && G.wrecks.find(x => x && !x.dead);
            if (w) { if (goTo(w.x + w.w / 2)) { K('KeyX', 1); reactT = PP.react; } }
            else { const q = G.pickups.find(x => x && !x.dead); if (q) goTo(q.x); else K('ArrowRight', 1); }
          }
          else if (st === 'buy') {
            const npc = G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
            if (npc) { if (goTo(npc.x + npc.w / 2)) { K('KeyE', 1); reactT = PP.react; } }
            else {
              const gr = gateDoors()[0];
              if (gr && gr.style === 'booth') { if (goTo(gateWorldX(gr))) { K('ArrowUp', 1); if (!G.gateWalk && player.on) gateEnter(); } }
            }
          }
          else if (st === 'heal') { K('KeyF', 1); }
          else if (st === 'node') {
            const rd = G.statics.find(s => s.type === 'riddle');
            if (rd) { if (goTo(rd.x + rd.w / 2)) { K('KeyE', 1); reactT = PP.react + PP.dwell / 4; } }
            else {
              const gr = gateDoors()[0];   // still in the booth: walk out
              if (gr) { if (goTo(gateWorldX(gr))) { K('ArrowUp', 1); if (!G.gateWalk && player.on) gateEnter(); } }
            }
          }
          else if (st === 'skill') { K('KeyT', 1); reactT = 6; }
          else if (st === 'free') { K('ArrowRight', 1); if (player.on && Math.abs(player.vx) < 12) jumpNow(); }
          // any walking step inside a room with no right exit: leave by the door
          if ((st === 'go' || st === 'free') && G.roomDef && !G.roomDef.exits.R) {
            const gr2 = gateDoors()[0];
            if (gr2) { clearAll(); if (jumpT > 0) K('KeyZ', 1); if (goTo(gateWorldX(gr2))) { K('ArrowUp', 1); if (!G.gateWalk && player.on) gateEnter(); } }
          }
        } else { K('Enter', 1); }
        if (G.state === 'PLAY') unstick();
        update(1 / 60);
        if (typeof clearP === 'function') clearP();   // the real frame does this
      }
      if (lastStep) LOG.steps[lastStep] = +(((frame - stepT0) / 60)).toFixed(1);
      LOG.at = stepId() + '@' + G.roomId + ' x=' + Math.round(player.x) + (player.on ? ' grounded' : ' airborne');
      LOG.total = +(frame / 60).toFixed(1);
      clearAll();
      return LOG;
    }, P);
    results.push({ name: P.name, ...r });
    console.log(P.name.padEnd(12), r.done ? 'FINISHED' : 'DNF at ' + r.at,
      'in', r.total + 's', '| deaths', r.deaths, '| jumps', r.jumps,
      '| locked presses', r.locked, '| trial errors', r.wrongTrial);
    console.log('   steps:', JSON.stringify(r.steps));
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
