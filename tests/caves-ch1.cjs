// WHAT EVERY CHAPTER-ONE CAVE PAYS — and what a rescue looks like.
//
// The owner (2026-10-09): "MAKE CAVES WORTH ENTERING. Inspect every chapter-one
// cave in actual gameplay and document what the player discovers. The marble
// quarry must deliver the sword material. The Sage route must deliver a
// rescue, a revelation and a visible change in the local enemies. Optional
// caves need distinct benefits ... Avoid repeating enemies plus scrap as the
// primary payoff everywhere. Reward early exploration ... Make the required
// return to the quarry after forging feel different and purposeful."
//
// docs/CAVES_CH1.md is the ledger; this walks it in the real build. Every row
// is loaded as a player would find it, its payoff is TAKEN through the same
// interaction the player uses (doInteract, a swing, a rest), and the change it
// promises is read back from the save. The census at the top is printed so
// the ledger can be checked against the build by eye as well.
//
//   node tests/caves-ch1.cjs       (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name);
};

(async () => {
  console.log('── caves-ch1 — every chapter-one cave pays something of its own\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof progressTick === 'function', { timeout: 30000 });

  const r = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;
    const out = {};
    const quiet = () => { G.wake = G.cut = G.dialog = G.meet = G.trans = G.gateWalk = G.bossEntry = G.item = null; G.tut = null; G.state = 'PLAY'; };
    const fresh = (flags) => {
      const sv = newSave(1); sv.time = 99;
      Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, nfBreak: 1 }, flags || {});
      startGame(sv); quiet(); return sv;
    };
    const drain = () => { let n = 0; while (G.dialog && n++ < 30) { const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (cb) cb(); } if (G.cut) { try { G.cut.v.pause(); } catch (e) {} G.cut = null; } quiet(); };
    const toasts = () => (G.toasts || []).map(x => x.text);
    // ---- the census: what stands in each cave, as loaded ---------------
    const CAVES = ['A5', 'A7', 'CV1', 'CV1B', 'CV2', 'CV3', 'GA1T', 'GA1', 'GA1D', 'A11', 'A12', 'A13', 'GA2', 'GA2T', 'GA2D'];
    out.census = {};
    for (const id of CAVES) {
      fresh({ crystal: 1, pl_cshard: 1, rubbleA5: 1, rubbleCV1B: 1, alpha: 1 });
      loadRoom(id); quiet();
      const st = {};
      for (const s of G.statics) st[s.type + (s.type === 'term' || s.type === 'chest' || s.type === 'secret' ? ':' + s.extra : '')] = 1;
      const doors = gateDoors().map(d => d.to);
      // a Sage is a person, not a static: each one is somebody (its identity
      // card) and what it gives is its own
      const sg = G.enemies.find(e => e.kind === 'sage');
      if (sg) st['sage:' + t('sg_t_' + id)] = 1;
      out.census[id] = {
        statics: Object.keys(st).sort(), doors,
        enemies: G.enemies.filter(e => e.kind !== 'sage').length,
        scrap: G.pickups.reduce((a, p) => a + (p.amount || p.val || 0), 0),
      };
    }
    // ---- A5: the puzzle, the upgrade, the log, the buried mouth --------
    fresh({}); G.save.broken['A2:12,15'] = 1; loadRoom('A5'); quiet();
    out.a5 = { riddle: G.statics.some(s => s.type === 'riddle'), rubble: (G.rubbles || []).length > 0,
               marks: pgTrailMarks('A5', pgTrailPhase()).length };
    const ch = G.statics.find(s => s.type === 'chest');
    doInteract(ch); drain();
    out.a5.crest = (G.save.crests || []).indexOf('magnet') >= 0;
    // ---- A7: the survey, and Ratchet remembers she was there -----------
    fresh({ crystal: 1, ratchetCamp: 1 }); G.save.quests.ratchet_forge = 'done';
    loadRoom('A7'); quiet();
    const t20 = G.statics.find(s => s.type === 'term' && s.extra === 20);
    out.a7 = { term: !!t20 };
    if (t20) { doInteract(t20); out.a7.lines = (G.dialog && G.dialog.lines || []).length; drain(); }
    // she has stood at the bottom of the shaft BEFORE Ratchet asks
    loadRoom('A3'); quiet(); G.save.flags.said = { sl_ratchet_forged: 1 }; G.save.flags.alphaLead = 1;
    const rat = G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
    const coins0 = (G.save.relics || []).length;
    doInteract(rat);
    out.a7.ask = (G.dialog && G.dialog.lines || []).join(' ');
    drain();
    out.a7.paid = G.save.quests.ratchet_deep === 'done' && (G.save.relics || []).length > coins0;
    // ...and the reach that was NOT made early still asks her to go
    fresh({ crystal: 1, ratchetCamp: 1 }); G.save.quests.ratchet_forge = 'done'; G.save.flags.alphaLead = 1;
    delete G.save.visited.A7; G.save.flags.said = { sl_ratchet_forged: 1 };
    loadRoom('A3'); quiet();
    doInteract(G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet'));
    out.a7.normalAsk = (G.dialog && G.dialog.lines || []).join(' ');
    drain();
    out.a7.normalActive = G.save.quests.ratchet_deep === 'active';
    // ---- CV1: the pocket pays in health --------------------------------
    fresh({ rubbleA5: 1 }); loadRoom('CV1'); quiet();
    const core = G.statics.find(s => s.type === 'chest' && s.extra === 'core');
    const c0 = G.save.coresMax || 4;
    if (core) { doInteract(core); drain(); }
    out.cv1 = { chest: !!core, cores: (G.save.coresMax || 4) - c0, full: player.cores === player.maxCores() };
    // ---- CV1B: the survey pod charts the quarry ------------------------
    fresh({ rubbleA5: 1, rubbleCV1B: 1 }); loadRoom('CV1B'); quiet();
    const bench = G.statics.find(s => s.type === 'bench');
    doInteract(bench); drain(); G.recharge = null;
    progressTick(1 / 60);
    out.cv1b = { charted: Object.keys(G.save.charted || {}).sort().join(','), said: toasts().indexOf(t('pg_survey')) >= 0 };
    try { G.state = 'MAP'; drawMap(); out.cv1b.map = true; } catch (e) { out.cv1b.map = String(e); }
    G.state = 'PLAY';
    // ---- CV2: the beacon's log ------------------------------------------
    fresh({ rubbleA5: 1 }); loadRoom('CV2'); quiet();
    const t5 = G.statics.find(s => s.type === 'term');
    doInteract(t5); drain();
    out.cv2 = { beacon: !!G.save.flags.beacon };
    // ---- CV3: the material, and the return ------------------------------
    fresh({ rubbleA5: 1 }); loadRoom('CV3'); quiet();
    out.cv3 = { pillar: G.statics.some(s => s.type === 'pillar'), doorBefore: gateDoors().map(d => d.to).join(',') };
    fresh({ rubbleA5: 1, pl_cshard: 1, crystal: 1 }); loadRoom('CV3'); quiet();
    G.toasts = []; progressTick(1 / 60);
    out.cv3.after = { pillar: G.statics.some(s => s.type === 'pillar'), door: gateDoors().map(d => d.to).join(','),
                      said: toasts().indexOf(t('pg_cv3_back')) >= 0, phase: pgTrailPhase(), marks: pgTrailMarks('CV3', pgTrailPhase()).join(',') };
    G.toasts = []; loadRoom('CV3'); progressTick(1 / 60);
    out.cv3.after.once = toasts().indexOf(t('pg_cv3_back')) < 0;
    // the stump is drawn where the pillar stood (draw it, and do not throw)
    try { draw(); out.cv3.after.drawn = true; } catch (e) { out.cv3.after.drawn = String(e); }
    // ---- the bound ones wait on the road back ---------------------------
    fresh({ rubbleA5: 1, pl_cshard: 1, crystal: 1 }); loadRoom('CV2'); quiet();
    const cr = G.enemies.find(e => e.actorRole === 'infected-person');
    cr.hp = 0; cr.die(1, 0);                       // stopped on the way in
    G.save.flags.pgBound = {}; G.toasts = []; progressTick(1 / 60);
    out.bound = { said: toasts().indexOf(t('pg_bound_wait')) >= 0, disabled: !!cr.disabled };
    G.cleanses = [];
    cr.cleanseT = 0.0001; cr.finishCleanse();
    out.bound.freed = !!cr.rescued && (G.cleanses || []).some(q => q.label === 'pg_freed');
    // ---- GA1T / GA1 / A13: the logs are different logs -----------------
    out.logs = { t6: JSON.stringify(t('t6')), t20: JSON.stringify(t('t20')), t21: JSON.stringify(t('t21')), t22: JSON.stringify(t('t22')), t5: JSON.stringify(t('t5')) };
    out.logLangs = [];
    for (const l of LANGS.map(x => x.id)) { LANG = l; for (const k of ['t20', 't21', 't22']) { const v = t(k); if (!Array.isArray(v) || v.length !== 3) out.logLangs.push(l + ':' + k); } }
    LANG = 'en';
    // ---- GA1D: rescue, revelation, the network stands down --------------
    fresh({ rubbleA5: 1, pl_cshard: 1, crystal: 1 });
    equipWeapon('single');
    loadRoom('GA1D'); quiet();
    const sage = G.enemies.find(e => e.kind === 'sage');
    const bat = G.enemies.find(e => e.kind !== 'sage');
    sage.locked = true; G.cleanses = []; G.toasts = []; G.wrecks = [];
    const before = { wrecks: G.wrecks.length };
    for (let i = 0; i < 4 && !sage.tame; i++) sageStruck(sage, 10, sage.x, sage.y);
    out.sage = {
      tame: !!sage.tame, flag: !!G.save.flags.sageTame_GA1D,
      rescuedWord: (G.cleanses || []).some(q => q.label === 'pg_rescued'),
      said: toasts().indexOf(t('pg_sage_free')) >= 0,
      noWreck: G.wrecks.length === before.wrecks && !sage.dead,
      reveal: !!G.save.flags.chimeRevealed,
      revealLines: [],
      batFreed: bat ? !!(bat.calm && bat.rescued) : null,
      bellWard: !pgBellOpen(G.save.flags, {}) ? 'shut' : 'open',
    };
    // the revelation is the dialogue that follows the card
    let n = 0;
    while (G.dialog && n++ < 10) { out.sage.revealLines = out.sage.revealLines.concat(G.dialog.lines || []); const cb = G.dialog.onEnd; G.dialog = null; G.state = 'PLAY'; if (cb) cb(); }
    out.sage.namesChime = out.sage.revealLines.join(' ').indexOf('CHIME') >= 0;
    // ...and the network wakes freed on a fresh load
    loadRoom('GA1T'); quiet();
    out.sage.tunnel = G.enemies.filter(e => e.actorRole === 'infected-person').map(e => !!(e.calm && e.rescued));
    // ---- a freed guardian is not a destroyed one ------------------------
    const guardian = (forceKill) => {
      fresh({ crystal: 1, pl_cshard: 1, sageTame_GA1D: 1, bossChime: 1, nfMeet: 1 }); equipWeapon('single');
      loadRoom('A10'); quiet();
      const b = G.boss; b.st = 'rest'; b.t = 1;
      G.cleanses = []; G.wrecks = [];
      if (forceKill) { b.forceKill = true; b.hp = 0; b.die(); }
      else { b.hp = 1; dealDmg(b, 999, null, b.cx(), b.cy(), true); }
      for (let i = 0; i < 30; i++) b.update(1 / 60);
      return { tamed: !!b.tamed, purified: !!b.purified, deathFx: b.deathAnimT > 0 || (b.deathFxT || 0) > 0,
               cleanse: (G.cleanses || []).some(q => q.label === 'pg_freed') };
    };
    out.freed = guardian(false); out.felled = guardian(true);
    // ---- every cave pays something that is not enemies-and-scrap --------
    return out;
  });

  // ---- report ---------------------------------------------------------------
  console.log('    census (as loaded with the blade forged):');
  for (const id in r.census) {
    const c = r.census[id];
    console.log('      ' + id.padEnd(5) + ' ' + (c.statics.join(' ') || '—').padEnd(44) + ' doors ' + (c.doors.join(',') || '—').padEnd(12) + ' foes ' + c.enemies);
  }
  console.log('');
  const payoffKinds = (id) => r.census[id].statics.filter(s => !/^scrap/.test(s)).concat(r.census[id].doors.map(d => 'door>' + d));
  const thin = Object.keys(r.census).filter(id => !payoffKinds(id).length);
  check('every chapter-one cave holds a payoff that is not enemies and scrap', !thin.length, thin.join(',') || Object.keys(r.census).length + ' caves');
  const sigs = Object.keys(r.census).map(id => payoffKinds(id).sort().join('+'));
  const dup = sigs.filter((s, i) => sigs.indexOf(s) !== i);
  check('...and no two caves pay the same thing', !dup.length, dup.join(' | '));
  check('A5: a Mind Node, the magnet crest, the buried mouth and the first quarry marks',
    r.a5.riddle && r.a5.crest && r.a5.rubble && r.a5.marks >= 2, JSON.stringify(r.a5));
  check('A7: the quarry survey (terminal 20) is down the shaft', r.a7.term && r.a7.lines >= 3, JSON.stringify({ term: r.a7.term, lines: r.a7.lines }));
  check('...and Ratchet remembers she was already there: he says so and pays on the ask',
    r.a7.ask.indexOf('already stood at the bottom') >= 0 && r.a7.paid, r.a7.ask.slice(0, 90));
  check('...while a player who has NOT been there is still sent', r.a7.normalActive && r.a7.normalAsk.indexOf('already') < 0);
  check('CV1: the pocket chest is a spare core, not scrap', r.cv1.chest && r.cv1.cores === 1 && r.cv1.full, JSON.stringify(r.cv1));
  check('CV1B: resting at the survey pod charts the quarry onto the map',
    r.cv1b.charted === 'CV1,CV1B,CV2,CV3' && r.cv1b.said && r.cv1b.map === true, JSON.stringify(r.cv1b));
  check('CV2: the beacon\'s log answers the call', r.cv2.beacon);
  check('CV3: the marble is there to quarry, and the passage is not yet built', r.cv3.pillar && r.cv3.doorBefore.indexOf('GA1T') < 0, JSON.stringify(r.cv3));
  check('...after the forge the pillar is a cut stump, the passage is open, the marks lead to it, and she is told — once',
    !r.cv3.after.pillar && r.cv3.after.door.indexOf('GA1T') >= 0 && r.cv3.after.said && r.cv3.after.once
    && r.cv3.after.phase === 'sage' && r.cv3.after.marks && r.cv3.after.drawn === true, JSON.stringify(r.cv3.after));
  check('the machines stopped before the forge wait, bound, and say so on the road back', r.bound.said && r.bound.disabled, JSON.stringify(r.bound));
  check('...and cleansing one frees it with the rescue\'s own light and word', r.bound.freed);
  check('the logs are distinct: the survey (t20), the gantry watch (t21), the wardens (t22), the refuge (t6), the founding log (t5)',
    new Set([r.logs.t5, r.logs.t6, r.logs.t20, r.logs.t21, r.logs.t22]).size === 5);
  check('...and the new logs exist in all five languages', !r.logLangs.length, r.logLangs.join(','));
  check('GA1D: the Sage is RESCUED — the word over the body, the line that says so, no wreck',
    r.sage.tame && r.sage.flag && r.sage.rescuedWord && r.sage.said && r.sage.noWreck, JSON.stringify(r.sage).slice(0, 200));
  check('...the revelation names CHIME', r.sage.reveal && r.sage.namesChime);
  check('...the chamber\'s machines are freed with it, and the tunnel wakes freed on a fresh load',
    r.sage.batFreed !== false && r.sage.tunnel.length > 0 && r.sage.tunnel.every(Boolean), JSON.stringify(r.sage.tunnel));
  check('...and the bell\'s ward opens with the Sage', r.sage.bellWard === 'open');
  check('a freed guardian is cleansed, not detonated (no death scene, the rescue\'s light)',
    r.freed.tamed && r.freed.purified && !r.freed.deathFx && r.freed.cleanse, JSON.stringify(r.freed));
  check('...while one that is ended still dies the way a kill does', r.felled.deathFx && !r.felled.cleanse, JSON.stringify(r.felled));
  if (errs.length) check('no page errors', false, errs.slice(0, 3).join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.length + ' check(s)'); process.exit(1); }
  console.log('\nOK — every cave pays its own way, and a rescue never looks like a kill');
})().catch(e => { console.error(e); process.exit(1); });
