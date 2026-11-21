// SHE STEPS UP INTO A RAISED DOOR (owner, 2026-11-21: "when it faces the
// background, it raises a leg and it jumps, or it jumps inside of it... raises a
// leg and climbs like a ladder or an elevated object, or it hops inside of it").
//   - through a machine ring (its opening starts at a sill) she CLIMBS: the step
//     cells play in order, from her back, and she ends higher than she began;
//   - into the swamp's culvert (a pipe mouth) she HOPS;
//   - she carries what she carries: the strip is her weapon tier's own;
//   - Ratchet's den door keeps its fast run (the owner asked for it), and a step is
//     never slow: through any door in under 2.4 s.
//
//   node tests/gate-step.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function');
  console.log('── gate-step — she climbs over a ring\'s sill and hops into the culvert, from behind');
  const R = await p.evaluate(async () => {
    for (const k of Object.keys(MEDIA_SRC.images)) if (/^hero(Climb|Hop|Gate|Yaw|Back|Departure)/.test(k)) mediaFetch(k, 1);
    for (let i = 0; i < 300 && !Object.keys(MEDIA_SRC.images).filter(k => /^hero(Climb|Hop)/.test(k)).every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 25));
    const go = (flags, weapon, room, pick) => {
      const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 }, flags); if (weapon) sv.weaponMode = weapon;
      startGame(sv); loadRoom(room); G.state = 'PLAY'; G.dialog = null; G.bossEntry = null;
      const d = gateDoorsAll(room).find(pick); if (!d) return { none: room };
      player.x = gateWorldX(d) - player.w / 2; player.y = (G.roomDef.h - 2) * TILE - player.h; player.vx = 0;
      for (let i = 0; i < 10; i++) update(1 / 60);
      player.x = gateWorldX(d) - player.w / 2;
      keysP.ArrowUp = 1; keys.ArrowUp = 1; update(1 / 60); keys.ArrowUp = 0; keysP.ArrowUp = 0;
      if (!G.gateWalk) { if (typeof gateEnter === 'function') gateEnter(); }
      if (!G.gateWalk) return { notEntered: room + '>' + d.to };
      const stepKey = G.gateWalk.stepKey, keysSeen = {}, cells = []; let t = 0, prevSole = null;
      while (G.gateWalk && t < 6) {
        G.dialog = null; update(1 / 60); t += 1 / 60;
        if (G.gateWalk && G.gateWalk.align >= 1 && (G.gateWalk.turn || 0) >= 1) {
          G.gateStepCell = -1; drawGateWalk(); keysSeen[G.gateBackKey || 'side'] = 1;
          if (G.gateStepCell >= 0 && cells[cells.length - 1] !== G.gateStepCell) cells.push(G.gateStepCell);
        }
      }
      return { to: d.to, stepKey, keys: Object.keys(keysSeen), cells, secs: +t.toFixed(2), room: G.roomId };
    };
    const out = {};
    // a ring door: the first one in the world that is a machine ring (not the den)
    let ringRoom = null, ringTo = null;
    { const sv = newSave(1); sv.time = 99; Object.assign(sv.flags, { tut: 1, woke: 1 }); startGame(sv); }
    for (const id in GATE_ROOM) { if (ringRoom) break; try { loadRoom(id); } catch (e) { continue; }
      for (const d of gateDoorsAll(id).filter(q => !q.lock && !q.need && ringGateFor(q))) {
        const r = go({}, null, id, q => q.to === d.to);
        if (r && r.stepKey) { ringRoom = id; ringTo = d.to; break; }
      } }
    out.ringAt = ringRoom + '>' + ringTo;
    out.ringBare = go({}, null, ringRoom, q => q.to === ringTo);
    out.ringSingle = go({ crystal: 1 }, 'single', ringRoom, q => q.to === ringTo);
    out.culvert = go({ crystal: 1, bossGlitch: 1, ch2Climb: 1, bossCarrier: 1, k2Road: 1 }, 'single', 'B2', q => q.to === 'SW1');
    out.den = go({}, null, 'A0B', q => q.to === 'A0');
    return out;
  });
  const inOrder = c => c.length >= 5 && c.every((v, i) => i === 0 || v >= c[i - 1] || (c[i - 1] >= 6 && v >= 6));
  check('a machine ring: she CLIMBS over its sill, the step cells in order', /^heroClimb/.test(R.ringBare.stepKey || '') && R.ringBare.keys.includes(R.ringBare.stepKey) && inOrder(R.ringBare.cells), R.ringAt + ' ' + JSON.stringify(R.ringBare));
  check('...carrying what she carries: her sword tier climbs with its sword', R.ringSingle.stepKey === 'heroClimbSingle' && R.ringBare.stepKey === 'heroClimbBare', R.ringSingle.stepKey + ' / ' + R.ringBare.stepKey);
  check('the swamp\'s culvert: she HOPS into the pipe', R.culvert.stepKey === 'heroHopSingle' && R.culvert.keys.includes('heroHopSingle') && inOrder(R.culvert.cells) && R.culvert.room === 'SW1', JSON.stringify(R.culvert));
  check('Ratchet\'s den door (no ring) keeps its fast run, no step', !R.den.stepKey && (R.den.keys || []).includes('heroGateRun'), JSON.stringify(R.den));
  check('a step never wastes her time: through the door in under 2.4 s', [R.ringBare, R.ringSingle, R.culvert].every(r => r.secs < 2.4), [R.ringBare, R.ringSingle, R.culvert].map(r => r.secs).join(' / '));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — she climbs into a ring and hops into the pipe, from behind, carrying what she carries');
})().catch(e => { console.error(e); process.exit(1); });
