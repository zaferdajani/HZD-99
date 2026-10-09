// THE LION'S DEN IS SHUT UNTIL THE CHAPTER HAS EARNED IT — walked, not read.
//
// The owner (2026-10-09): "Physically block access to the lion's den until the
// necessary milestones are complete. Test every entrance, alternate route,
// dash/jump bypass and save/load transition. A warning message alone is not
// sufficient." The required order is marble -> forge -> Sage -> CHIME ->
// NULLFANG, so two places are held: the lair (A4) until the blade, the Sage
// and the bell, and the bell (A9) until the Sage.
//
// Everything below drives the production code with her own inputs — held and
// tapped keys through keys/keysP, update() stepping the real loop — and asks
// one question of every frame: is she standing in a room she has not earned,
// and has the fight started? Then it opens the gate the honest way and walks
// through it, so a harness that only ever sees a shut door cannot pass by
// testing a door that never opens.
//
//   node tests/den-gate.cjs        (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};

(async () => {
  console.log('── den-gate — the lair and the bell, every way in, before and after\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof progressTick === 'function', { timeout: 30000 });

  const r = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;     // the harness steps the loop itself
    const out = {};
    const quiet = () => {
      G.wake = G.cut = G.dialog = G.meet = G.trans = G.gateWalk = G.bossEntry = G.item = null;
      G.tut = null; G.state = 'PLAY';
    };
    const fresh = (flags, abil, extra) => {
      const sv = newSave(1); sv.time = 99;
      Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, nfBreak: 1 }, flags || {});
      sv.abil = Object.assign({}, abil || {});
      Object.assign(sv, extra || {});
      startGame(sv); quiet();
      return sv;
    };
    const stand = (tx) => {
      player.x = tx * TILE - player.w / 2; player.vx = 0; player.vy = 0;
      player.y = pgFloorY(player.x + player.w / 2) - player.h - 2;
      player.lastSafe = { x: player.x, y: player.y };
    };
    // one frame of her own input: `hold` are action names held down, `tap` are
    // pressed this frame. The same arrays the keyboard, pad and touch write.
    const frame = (hold, tap) => {
      for (const k in keys) keys[k] = 0;
      for (const a of hold || []) keys[KEYB[a][0]] = 1;
      for (const a of tap || []) { keys[KEYB[a][0]] = 1; keysP[KEYB[a][0]] = 1; }
      if (G.dialog || G.state !== 'PLAY') quiet();
      update(1 / 60);
      clearP();
    };
    // run a movement script and watch every frame
    const watch = (frames, script) => {
      const seen = { rooms: new Set(), fight: false, maxX: -1e9, inA4: false, inA9: false };
      for (let f = 0; f < frames; f++) {
        const s = script(f) || {};
        frame(s.hold, s.tap);
        seen.rooms.add(G.roomId);
        if (G.roomId === 'A4') seen.inA4 = true;
        if (G.roomId === 'A9') seen.inA9 = true;
        if (G.roomId === 'A3') seen.maxX = Math.max(seen.maxX, player.x + player.w);
        if (G.boss && G.boss.kind === 'glitch' && !G.boss.meet && !G.boss.dead && G.boss.st !== 'dorm') seen.fight = true;
        if (player.dead) { player.dead = false; player.cores = player.maxCores(); }
      }
      return seen;
    };
    const STAGES = {
      none: {},
      marble: { pl_cshard: 1 },
      forged: { pl_cshard: 1, crystal: 1, ratchetCamp: 1 },
      sage: { pl_cshard: 1, crystal: 1, ratchetCamp: 1, sageTame_GA1D: 1, chimeRevealed: 1 },
    };
    const ways = {
      walk: () => ({ hold: ['RIGHT'] }),
      run_jump: (f) => ({ hold: f % 36 < 14 ? ['RIGHT', 'JUMP'] : ['RIGHT'], tap: f % 36 === 0 ? ['JUMP'] : [] }),
      dash: (f) => ({ hold: ['RIGHT'], tap: f % 30 === 0 ? ['DASH'] : (f % 30 === 12 ? ['JUMP'] : []) }),
      dash_air: (f) => ({ hold: f % 40 < 14 ? ['RIGHT', 'JUMP'] : ['RIGHT'], tap: f % 40 === 0 ? ['JUMP'] : (f % 40 === 9 ? ['DASH'] : []) }),
    };
    // ---- 1. A3's east seam, every stage before the lair opens, every move
    out.east = [];
    for (const st in STAGES) for (const w in ways) {
      fresh(Object.assign({ nfMeet: 1 }, STAGES[st]), { dash: 1 });
      loadRoom('A3'); quiet(); stand(34);
      const s = watch(420, ways[w]);
      out.east.push({ ward: PG_WARD_EAST, st, w, inA4: s.inA4, fight: s.fight, maxX: Math.round(s.maxX), W: G.roomDef ? ROOMS.A3.w * TILE : 0, room: G.roomId });
    }
    // ...and with the staged break on screen (Sage free, bell ringing): the
    // lion walking out of his enclosure is not a door held open
    {
      fresh(Object.assign({ nfMeet: 1, nfBreak: 0 }, STAGES.sage), { dash: 1 });
      delete G.save.flags.nfBreak;
      loadRoom('A3'); quiet(); stand(30);
      const s = watch(600, ways.dash);
      out.breakRun = { inA4: s.inA4, fight: s.fight, broke: !!G.save.flags.nfBreak };
    }
    // ---- 2. the grotto's back door (GA1 -> A4)
    {
      fresh(STAGES.sage); loadRoom('GA1'); quiet();
      const doors = gateDoors().map(d => d.to);
      const d = gateDoorsAll('GA1').find(x => x.to === 'A4');
      stand(ROOMS.GA1.w * (d ? d.at : 0.06));
      const s = watch(120, (f) => ({ tap: f % 10 === 0 ? ['UP'] : [] }));
      out.grotto = { doors, walked: !!G.gateWalk, inA4: s.inA4, room: G.roomId };
      // no chevron: drawGatePrompt draws exactly gateDoors(), so a door that is
      // not built cannot advertise itself
      out.grottoPrompt = gateDoors().some(x => x.to === 'A4');
    }
    // ---- 3. no vertical link anywhere leads into the lair
    out.vlinksIntoA4 = Object.keys(ROOMS).filter(id => {
      const v = vlinkFor(id); return (v.T && v.T.id === 'A4') || (v.B && v.B.id === 'A4');
    });
    out.a4Exits = Object.keys(ROOMS.A4.exits || {});
    // ---- 4. every way back in after a death or a load
    out.benches = [];
    const benchRooms = Object.keys(ROOMS).filter(id => (ROOMS[id].ents || []).some(e => e[0] === 'bench')
      && (ROOMS[id].zone === 'A' || /^(CV|GA)/.test(id)));
    for (const room of benchRooms.concat(['A4', 'A9'])) {
      const sv = fresh(STAGES.forged, {}, { bench: { room, x: 8 * TILE, y: 13 * TILE } });
      const cont = G.roomId;
      // respawn from the same saved bench
      G.save.bench = { room, x: 8 * TILE, y: 13 * TILE };
      respawn(); quiet();
      const resp = G.roomId;
      // and Continue, from storage, through the real loader and migration
      G.save.bench = { room, x: 8 * TILE, y: 13 * TILE };
      localStorage.setItem(saveKeyFor('robo'), JSON.stringify(G.save));
      startGame(loadStored('robo')); quiet();
      out.benches.push({ room, cont, resp, load: G.roomId });
    }
    // ...and a save parked in the lair once it IS open stays there
    fresh(STAGES.sage, {}, { bench: { room: 'A4', x: 8 * TILE, y: 13 * TILE } });
    G.save.flags.bossChime = 1;
    G.save.bench = { room: 'A4', x: 8 * TILE, y: 13 * TILE };
    respawn(); quiet();
    out.openBench = G.roomId;
    // ---- 5. the bell waits for the Sage (A8 -> A9)
    const climb = (flags) => {
      fresh(flags); loadRoom('A8'); quiet();
      // the top rung under the hole (A8: hline 9-16 at row 3)
      player.x = 12.5 * TILE - player.w / 2; player.y = 3 * TILE - player.h - 1; player.vx = player.vy = 0;
      player.lastSafe = { x: player.x, y: player.y };
      // a full jump is a HELD jump: pressed, then held through the rise
      return watch(360, (f) => ({ hold: (f % 30 < 14 ? ['JUMP'] : []).concat(f % 120 < 60 ? [] : ['RIGHT']),
                                  tap: f % 30 === 0 ? ['JUMP'] : [] }));
    };
    const shut = climb(STAGES.forged), open = climb(STAGES.sage);
    out.bell = { shutA9: shut.inA9, openA9: open.inA9 };
    // ---- 6. the staged lion takes no blow
    const staged = (flags, room, tx) => {
      fresh(flags); loadRoom(room); quiet(); G.enemies = [];
      stand(tx);
      let n = 0;
      while (!(G.boss && G.boss.meet) && n++ < 400) frame(room === 'A2' && !G.save.flags.nfMeet ? ['RIGHT'] : []);
      const b = G.boss;
      if (!b || !b.meet) return { staged: false };
      const hp0 = b.hp;
      const dealt = dealDmg(b, 9999, null, b.cx(), b.cy(), true);
      b.hp = 0; b.die();
      const dead = !!b.dead;
      b.hp = hp0;
      // ...and her own swings, standing at his flank with the blade
      player.x = b.x - player.w - 4; player.y = b.y + b.h - player.h; player.face = 1;
      for (let i = 0; i < 40 && G.boss === b; i++) frame([], i % 8 === 0 ? ['ATK'] : []);
      return { staged: true, dealt, dead, hp: b.hp === hp0, glitch: !!G.save.flags.bossGlitch };
    };
    out.meet = staged({ crystal: 1, pl_cshard: 1 }, 'A2', 58);
    out.brk = staged(Object.assign({ nfMeet: 1, nfBreak: 0 }, STAGES.sage), 'A2', 16);
    // ---- 7. AND IT OPENS: every milestone met, she walks in and he wakes
    {
      fresh(Object.assign({ nfMeet: 1, bossChime: 1 }, STAGES.sage), { dash: 1 });
      loadRoom('A3'); quiet(); stand(40);
      const s = watch(900, (f) => ({ hold: ['RIGHT'], tap: f % 50 === 0 ? ['JUMP'] : [] }));
      out.opened = { inA4: s.inA4, fight: s.fight, room: G.roomId, boss: G.boss && G.boss.kind };
      // and the grotto's door is built only once he is free
      G.save.flags.bossGlitch = 1;
      loadRoom('GA1');
      out.grottoAfter = gateDoors().some(x => x.to === 'A4');
    }
    return out;
  });

  // ---- report ----------------------------------------------------------------
  const leaks = r.east.filter(e => e.inA4 || e.fight);
  check('A3\'s east seam holds at every stage before the lair opens — walk, running jump, dash, air dash',
    !leaks.length, leaks.length ? leaks.map(e => e.st + '/' + e.w).join(' ') : r.east.length + ' runs, none in A4');
  const pushed = r.east.filter(e => e.maxX > e.W - e.ward * 32 + 2);
  check('...and she is stopped at the ward\'s face, short of the seam — not at an invisible edge',
    !pushed.length, 'furthest reach ' + Math.max(...r.east.map(e => e.maxX)) + ' of ' + (r.east[0] && r.east[0].W));
  check('...with the staged lion on screen (the break), the seam still holds', !r.breakRun.inA4 && !r.breakRun.fight,
    JSON.stringify(r.breakRun));
  check('the grotto (GA1) has no door into the lair before the lion is free — no prompt, no walk',
    r.grotto.doors.indexOf('A4') < 0 && !r.grottoPrompt && !r.grotto.walked && !r.grotto.inA4 && r.grotto.room === 'GA1',
    'doors: ' + r.grotto.doors.join(',') + ' / room ' + r.grotto.room);
  check('...and it is built once he is', r.grottoAfter);
  check('no vertical link anywhere leads into the lair, and the lair has one way in',
    !r.vlinksIntoA4.length && r.a4Exits.join(',') === 'L', 'vlinks ' + r.vlinksIntoA4.join(',') + ' exits ' + r.a4Exits.join(','));
  const badBench = r.benches.filter(b => [b.cont, b.resp, b.load].some(x => x === 'A4' || x === 'A9'));
  check('Continue, respawn and a stored save never start her inside the lair or the bell\'s chamber',
    !badBench.length, r.benches.map(b => b.room + '->' + b.cont + '/' + b.resp + '/' + b.load).join(' '));
  check('...a real bench keeps its own room (A3, CV1B, GA1 …)',
    r.benches.filter(b => b.room !== 'A4' && b.room !== 'A9').every(b => b.cont === b.room && b.resp === b.room && b.load === b.room));
  check('...and once the lair is open a save parked there is left alone', r.openBench === 'A4', r.openBench);
  check('the bell\'s climb (A8 -> A9) is shut until the Sage is free', !r.bell.shutA9);
  check('...and climbable once she is', r.bell.openA9);
  check('the corridor meeting\'s staged lion takes no blow and cannot be freed early',
    r.meet.staged && r.meet.dealt === 0 && !r.meet.dead && r.meet.hp && !r.meet.glitch, JSON.stringify(r.meet));
  check('...nor can the break\'s', r.brk.staged && r.brk.dealt === 0 && !r.brk.dead && r.brk.hp && !r.brk.glitch, JSON.stringify(r.brk));
  check('with the blade, the Sage and the bell, she walks east into the lair and NULLFANG wakes',
    r.opened.inA4 && r.opened.fight && r.opened.boss === 'glitch', JSON.stringify(r.opened));
  if (errs.length) check('no page errors', false, errs.slice(0, 3).join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.length + ' check(s)'); process.exit(1); }
  console.log('\nOK — the den opens to the chapter, and to nothing else');
})().catch(e => { console.error(e); process.exit(1); });
