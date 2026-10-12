// GRAVEHORN, MEASURED (owner's order, 2026-10-11: the Eye's rhino on the raw
// marble — missiles from his horns, a charge you jump, a toss you can parry,
// a second phase with twin horns and a rear kick).
//
// The fight is driven in the real build, in real time, and the parts a player
// does are done with the KEYBOARD: the jump over the charge, the strike that
// parries the toss, the strike on the hornless head, the walk to the stone.
// What is staged is only where everyone stands when a section begins, and
// which move he is asked to start — the move itself runs on his own machine.
//
//   1. the entrance: he steps out of the dark, names himself in five languages,
//      the room locks, she is held until he has bellowed
//   2. every move goes TELL -> ACTIVE -> RECOVERY, every tell is a TELL_ST
//      name (the audio channel), no active or recovery state is, and every
//      recovery is an opening of at least 250 ms
//   3. the charge is jumpable: a keyboard jump at the right moment takes no
//      core; standing still takes one
//   4. the toss throws her far and leaves her dizzy (and dizzy blocks the jump
//      and the strike, slows the walk, never stacks)
//   5. the parry: a strike in the window clashes (no core, he staggers); a
//      strike well before it does not, and the toss lands
//   6. the missile: the horn leaves the socket, homes until its lock, flies
//      straight after it, the head is hornless (and bites deeper) meanwhile,
//      and the horn flies home harmless
//   7. phase two at 0 HP: knees, the held beat, armour off, HP refilled; twin
//      missiles; the kick fires only from behind
//   8. the end: he backs into the rock, the flag is set, the room unlocks, the
//      stone is walked to and freed; a death mid-fight brings him back whole
//   9. the gait: planted hooves on the drawn floor during the walk
//
//   node tests/gravehorn.cjs
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null || detail === '' ? '' : '  ' + detail));
  if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof ghStep === 'function', { timeout: 30000 });
  console.log('── gravehorn — the Eye\'s rhino, measured in the real build');

  await page.evaluate(() => {
    window.T = {
      base: { woke: 1, tut: 1, gateOpened: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, ratchetSpareGiven: 1 },
      stage(flags) {
        const sv = newSave(1); sv.time = 99; sv.comics = {};
        for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
        Object.assign(sv.flags, T.base, flags || {});
        startGame(sv); loadRoom('CV3');
        G.state = 'PLAY'; G.bossEntry = null; G.wake = null; G.tut = null; G.dialog = null;
        T.clear();
        return !!(G.boss && G.boss.kind === 'horn');
      },
      clear() { for (const k in keys) delete keys[k]; for (const k in keysP) delete keysP[k]; },
      floor: 512,
      // skip the entrance and stand them where a section needs them
      arena(bx, px, o) {
        o = o || {};
        const b = G.boss;
        if (!b.missiles) ghInit(b);
        b.st = 'idle'; b.t = 99; b.dark = 0; b.hideBar = false; b.fade = 0;
        G.ghHold = null; G.ghCard = null; G.dialog = null; G.state = 'PLAY';
        b.x = bx - b.w / 2; b.y = T.floor - b.h; b.vx = 0; b.vy = 0;
        b.face = o.face || (Math.sign(px - bx) || -1); b.faceVis = b.face; b.feet = null;
        b.hornBig = true; b.hornSmall = true; b.missiles.length = 0; b.rocks.length = 0;
        b.phase = o.phase || 1; b.hp = b.hpMax; b.denied = 0; b.lastMove = null; b.chainLeg = 0;
        b.dazeCD = 99; b.stagT = 0;
        player.x = px - player.w / 2; player.y = T.floor - player.h - 2; player.vx = 0; player.vy = 0;
        player.iT = 0; player.dizzyT = 0; player.flungT = 0; player.dead = false; player.swing = null;
        player.cores = player.maxCores(); player.face = o.pface || (Math.sign(bx - px) || 1); player.faceVis = player.face;
        player.volts = 33; player.atkCD = 0;
        T.clear();
      },
      go(st, t) { ghSet(G.boss, st, t); },
      // the state log is HIS: ghStep stamps every state change on his own sim
      // clock (b.ghLog), so a wind-up is measured to the step, not to the
      // browser's frame (this box draws at ~10 fps headless)
      rec() { T.recOn = true; if (G.boss) G.boss.ghLog = []; },
      stop() { T.recOn = false; return (G.boss && G.boss.ghLog || []).slice(); },
      s() {
        const b = G.boss;
        return { st: b && b.st, t: b && b.t, el: b && b._el, phase: b && b.phase, hp: b && b.hp, hpMax: b && b.hpMax,
          bx: b && b.cx(), face: b && b.face, vx: b && b.vx, dead: b && b.dead,
          hornBig: b && b.hornBig, hornSmall: b && b.hornSmall, nm: b && b.missiles ? b.missiles.length : 0,
          px: player.x + player.w / 2, py: player.y + player.h, pvx: player.vx, pvy: player.vy, on: player.on,
          cores: player.cores, iT: player.iT, dz: player.dizzyT || 0, swing: !!player.swing, state: G.state,
          hold: !!G.ghHold, sim: G.simClock || 0, parries: b && b.parries || 0 };
      },
    };
  });
  const S = () => page.evaluate(() => T.s());
  const waitFor = async (pred, ms, every = 8) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { const s = await S(); if (pred(s)) return s; await sleep(every); }
    return null;
  };

  // ======================================================================
  // 1. THE ENTRANCE
  // ======================================================================
  {
    const there = await page.evaluate(() => T.stage({}));
    check('he is posted in CV3 while the marble is still in the rock', there);
    await page.evaluate(() => { player.x = 160; player.y = T.floor - player.h - 2; });
    await sleep(600);
    let s = await S();
    check('...asleep in the dark until she comes in', s.st === 'dorm', s.st);
    await page.evaluate(() => { player.x = 470; });
    const wake = await waitFor(s => s.st === 'ghwake', 3000);
    check('he steps out of the dark when she walks in', !!wake);
    check('...and she is held while he does (the staging is not walk-out-able)', wake && wake.hold);
    // her controls really are held: a held RIGHT does not move her
    const x0 = (await S()).px;
    await page.keyboard.down('ArrowRight'); await sleep(350); await page.keyboard.up('ArrowRight');
    check('...a held direction does not move her through it', Math.abs((await S()).px - x0) < 3, Math.round((await S()).px - x0) + ' px');
    const talk = await waitFor(s => s.state === 'DIALOG', 4000);
    const dlg = await page.evaluate(() => G.dialog && { name: G.dialog.name, n: G.dialog.lines.length, l0: G.dialog.lines[0], gh: !!G.dialog.gh });
    check('he speaks: a dialogue box under his own name', !!talk && dlg && dlg.name === 'GRAVEHORN' && dlg.gh, JSON.stringify(dlg));
    check('...three lines the first time (who he is, whom he serves, the threat)', dlg && dlg.n === 3, dlg && dlg.l0);
    const locked = await page.evaluate(() => {
      const keep = player.x; player.x = -40; checkTransitions();
      const ok = !G.trans && player.x >= 0; player.x = keep; return { ok, bossActive: bossActive() };
    });
    check('the room locks while he stands: the way out does not cross', locked.ok && locked.bossActive, JSON.stringify(locked));
    // read it like a player: a press, a beat, a press
    for (let i = 0; i < 14 && (await S()).state === 'DIALOG'; i++) { await page.keyboard.press('Enter'); await sleep(380); }
    s = await S();
    check('the conversation closes on ordinary presses', s.state === 'PLAY', s.state);
    const bel = await waitFor(s => s.st === 'ghbellow', 2000);
    const card = await page.evaluate(() => !!G.ghCard);
    check('...then he bellows, and his name card goes up', !!bel && card);
    const idle = await waitFor(s => s.st !== 'ghbellow' && s.st !== 'ghspeak', 3000);
    s = await S();
    check('...and the fight begins, her controls hers again', !!idle && !s.hold, s.st + ' hold=' + s.hold);
    const flags = await page.evaluate(() => ({ met: !!G.save.flags.ghMet, bar: !G.boss.hideBar }));
    check('the meeting is remembered (a retry gets the short version)', flags.met && flags.bar);
    // five languages, all real
    const langs = await page.evaluate(() => {
      const out = {};
      for (const l of ['en', 'ar', 'tr', 'zh', 'ru']) {
        LANG = l;
        out[l] = { intro: t('grv_intro'), again: t('grv_again'), p2: t('grv_phase2'), down: t('grv_down'), name: t('grv_name'),
                   hint: t('grv_parry_hint'), bar: t('b_horn'), goal: t('op_o_gravehorn') };
      }
      LANG = 'en'; return out;
    });
    const bad = [];
    for (const l in langs) {
      const L = langs[l];
      if (!Array.isArray(L.intro) || L.intro.length !== 4) bad.push(l + ':intro');   // four: the Eye named as the thief (owner, 2026-10-12)
      if (!Array.isArray(L.down) || L.down.length !== 2) bad.push(l + ':down');
      for (const k of ['name', 'hint', 'bar', 'goal']) if (typeof L[k] !== 'string' || /^grv_|^b_|^op_/.test(L[k])) bad.push(l + ':' + k);
      if (l !== 'en' && JSON.stringify(L.intro) === JSON.stringify(langs.en.intro)) bad.push(l + ':untranslated');
    }
    check('every line of his exists in all five languages, translated', !bad.length, bad.join(',') || 'en ar tr zh ru');
    check('...Arabic is set right to left', await page.evaluate(() => { LANG = 'ar'; const r = isRTL(); LANG = 'en'; return r; }));
  }

  // ======================================================================
  // 2. TELL -> ACTIVE -> RECOVERY, for every move
  // ======================================================================
  const tellRe = new RegExp(await page.evaluate(() => TELL_ST.source), 'i');
  // the recorder is running BEFORE the move is asked for, so the tell's first
  // frame is on the log (asking first lost a frame or two of every wind-up)
  const runMove = async (setup, endStates, ms) => {
    await page.evaluate(() => { G.boss && (G.boss.t = 99); T.rec(); });
    await sleep(120);
    await page.evaluate(setup);
    const s = await waitFor(s => endStates.includes(s.st), ms || 6000);
    await sleep(60);
    const seq = await page.evaluate(() => T.stop());
    return { seq, s };
  };
  const durs = seq => seq.map((e, i) => [e[0], i + 1 < seq.length ? +(seq[i + 1][1] - e[1]).toFixed(3) : null]);
  const moves = {};
  {
    await page.evaluate(() => T.stage({ ghMet: 1 }));
    // the missile, from range
    moves.missile = await runMove(() => { T.arena(1000, 520); player.iT = 99; T.go('hornprep', GH.hornPrep); }, ['idle'], 7000);
    // the charge into the shelf's face: she stands with the wall at her back
    moves.charge = await runMove(() => { T.arena(560, 1080); player.iT = 99; player.y -= 160; G.boss.chainLeg = 0; T.go('chargewarn', GH.chargeTell); }, ['idle'], 7000);
    // the charge that misses and runs out: she is past him, nothing ahead but floor
    moves.chargeSkid = await runMove(() => { T.arena(1100, 880); player.iT = 99; player.y -= 170; G.boss.chainLeg = 0; G.boss.face = -1; G.boss.faceVis = -1; T.go('chargewarn', GH.chargeTell); }, ['idle'], 7000);
    moves.toss = await runMove(() => { T.arena(700, 700 - 150 - 30); player.iT = 99; T.go('tossprep', GH.tossTell); }, ['idle'], 4000);
    moves.kick = await runMove(() => { T.arena(700, 700 + 150, { face: -1, phase: 2 }); player.iT = 99; T.go('kickprep', GH.kickTell); }, ['idle'], 4000);
    await page.evaluate(() => { player.iT = 0; });
    const SEQ = {
      missile: [['hornprep'], ['hornfire'], ['hornless', 'hornseat']],
      charge: [['chargewarn'], ['rush'], ['wallslam', 'stunned', 'recover']],
      chargeSkid: [['chargewarn'], ['rush'], ['skid', 'recover']],
      toss: [['tossprep'], ['toss'], ['tossrecover']],
      kick: [['kickprep'], ['kick'], ['kickrecover']],
    };
    for (const k in SEQ) {
      const names = moves[k].seq.map(e => e[0]);
      const flat = SEQ[k].flat();
      const ok = flat.every(n => names.includes(n)) && names.indexOf(flat[0]) < names.indexOf(SEQ[k][1][0])
        && names.indexOf(SEQ[k][1][0]) < names.indexOf(SEQ[k][2][0]);
      check(k + ': tell -> active -> recovery', ok, durs(moves[k].seq).map(d => d[0] + (d[1] != null ? '(' + Math.round(d[1] * 1000) + ')' : '')).join(' > '));
      const tell = SEQ[k][0][0], act = SEQ[k][1][0];
      check(k + ': the tell is a TELL_ST name (its sound fires), the active and recovery are not',
        tellRe.test(tell) && !tellRe.test(act) && SEQ[k][2].every(n => !tellRe.test(n)), tell + ' / ' + act + ' / ' + SEQ[k][2].join(','));
    }
    const D = (k, st) => { const d = durs(moves[k].seq).find(e => e[0] === st); return d ? d[1] : null; };
    const tells = { hornprep: D('missile', 'hornprep'), chargewarn: D('charge', 'chargewarn'), tossprep: D('toss', 'tossprep'), kickprep: D('kick', 'kickprep') };
    check('every tell is at least 350 ms (the zone-A floor is 400 for all but the close kick)',
      tells.hornprep >= 0.66 && tells.chargewarn >= 0.76 && tells.tossprep >= 0.42 && tells.kickprep >= 0.33,
      Object.entries(tells).map(([a, v]) => a + ' ' + Math.round(v * 1000)).join(', ') + ' ms');
    const openings = {
      'missile (hornless)': D('missile', 'hornless'),
      'charge->wall (stunned)': (D('charge', 'stunned') || 0) + (D('charge', 'recover') || 0),
      'charge->skid (skid+recover)': (D('chargeSkid', 'skid') || 0) + (D('chargeSkid', 'recover') || 0),
      'toss (tossrecover)': D('toss', 'tossrecover'),
      'kick (kickrecover)': D('kick', 'kickrecover'),
    };
    const thin = Object.entries(openings).filter(([a, v]) => !(v - 0.033 >= 0.25));
    check('every recovery is an opening of >= 250 ms (opening = recovery - 33 ms)', !thin.length,
      Object.entries(openings).map(([a, v]) => a + ' ' + Math.round((v - 0.033) * 1000)).join(', '));
    moves.openings = openings; moves.tells = tells;
  }

  // ======================================================================
  // 3. THE CHARGE IS JUMPABLE — with the keyboard
  // ======================================================================
  const chargeAt = async (jumpLead) => {
    await page.evaluate(() => { T.stage({ ghMet: 1 }); T.arena(1100, 520); G.boss.chainLeg = 0; T.go('chargewarn', GH.chargeTell); });
    const c0 = (await S()).cores;
    let jumped = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 4000) {
      const s = await S();
      if (s.st === 'rush' && jumpLead != null && !jumped) {
        const snout = s.bx + s.face * 150;
        const ttc = (Math.abs(snout - s.px) - 12) / Math.max(60, Math.abs(s.vx));
        if (ttc <= jumpLead) { jumped = { ttc: +ttc.toFixed(3), vx: Math.round(s.vx) }; await page.keyboard.down('Space'); }
      }
      if (['skid', 'recover', 'stunned', 'wallslam', 'idle'].includes(s.st) && Date.now() - t0 > 900) break;
      await sleep(4);
    }
    await page.keyboard.up('Space');
    await sleep(300);
    const s = await S();
    return { lost: c0 - s.cores, jumped, behind: (s.px - s.bx) * s.face < 0 };
  };
  {
    const still = await chargeAt(null);
    check('standing in the charge costs a core (the control)', still.lost >= 1, 'lost ' + still.lost);
    const jump = await chargeAt(0.25);
    check('a keyboard jump at the right moment clears him: no core lost', jump.lost === 0 && !!jump.jumped,
      'jumped at time-to-contact ' + (jump.jumped && jump.jumped.ttc) + ' s, charge ' + (jump.jumped && jump.jumped.vx) + ' px/s');
    check('...and she lands behind him', jump.behind);
    // the window: which take-off times clear him
    const win = [];
    for (const lead of [0.1, 0.16, 0.2, 0.3, 0.36, 0.44, 0.52]) { const r = await chargeAt(lead); win.push(lead + ':' + (r.lost ? 'hit' : 'clear')); }
    moves.jumpWindow = win.join(' ');
    console.log('       jump take-off (time to contact, s) -> ' + moves.jumpWindow);
  }

  // ======================================================================
  // 4. THE TOSS: THROWN FAR, AND DIZZY
  // ======================================================================
  {
    await page.evaluate(() => { T.stage({ ghMet: 1, ghParryTold: 1 }); T.arena(700, 700 - 150 - 40); T.go('tossprep', GH.tossTell);
      window._tr = []; const f = () => { window._tr.push([player.x + player.w / 2, player.y + player.h, player.cores, player.dizzyT || 0, player.iT]); if (window._tr.length < 40) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await waitFor(s => s.st === 'tossrecover', 3000);
    await sleep(900);
    const tr = await page.evaluate(() => window._tr);
    const x0 = tr[0][0], y0 = tr[0][1], c0 = tr[0][2];
    const at = tr.findIndex(r => r[2] < c0);
    const after = at >= 0 ? tr.slice(at) : [];
    const rose = after.length ? y0 - Math.min(...after.map(r => r[1])) : 0;
    const carried = after.length ? Math.max(...after.map(r => Math.abs(r[0] - x0))) : 0;
    check('the toss lands: a core', at >= 0, at >= 0 ? (c0 - tr[at][2]) + ' lost' : 'none');
    check('...she is thrown FAR: up and away', rose >= 60 && carried >= 150, 'rose ' + Math.round(rose) + ' px, carried ' + Math.round(carried) + ' px');
    check('...and DIZZY (stars, 1.4 s)', at >= 0 && tr[at][3] >= 1.25, at >= 0 ? tr[at][3].toFixed(2) + ' s' : '');
    check('...with i-frames on the knockback (longer than she is dizzy, almost)', at >= 0 && tr[at][4] >= 1.2, at >= 0 ? tr[at][4].toFixed(2) + ' s' : '');
    // he does not start a blow into a body that cannot answer: nothing lands
    // on her while she is dizzy, standing right in front of him
    const fair = await page.evaluate(async () => {
      const b = G.boss; T.arena(700, 700 - 150 - 40); playerDizzy(GH.dizzy); player.iT = 0;
      const c0 = player.cores, t0 = performance.now(); let worst = 'idle';
      while (performance.now() - t0 < 1400 && player.dizzyT > 0) {
        await new Promise(r => requestAnimationFrame(r));
        if (b.st !== 'idle') worst = b.st;
      }
      return { lost: c0 - player.cores, st: worst };
    });
    check('...and he does not start a move on a dizzy body (no blow lands until it passes)', fair.lost === 0, JSON.stringify(fair));
    // THE RULE, through the keyboard: walk only
    await page.evaluate(() => { T.arena(1100, 400); playerDizzy(GH.dizzy); });
    await sleep(120);
    const y0b = (await S()).py;
    await page.keyboard.press('Space'); await sleep(150);
    const sj = await S();
    await page.keyboard.press('KeyX'); await sleep(30);
    const sx = await S();
    await page.keyboard.down('ArrowLeft'); await sleep(260);
    const sv = await S();
    await page.keyboard.up('ArrowLeft');
    const stack = await page.evaluate(() => { const a = player.dizzyT; const r = playerDizzy(5); return { a, r, grew: player.dizzyT > a + 0.01 }; });
    check('dizzy: the jump does nothing', sj.dz > 0 && Math.abs(sj.py - y0b) < 4, Math.round(y0b - sj.py) + ' px');
    check('dizzy: the strike does nothing', sx.dz > 0 && !sx.swing);
    check('dizzy: she can walk, at under half speed', sv.dz > 0 && Math.abs(sv.pvx) > 20 && Math.abs(sv.pvx) <= 340 * 0.45 + 1, Math.round(Math.abs(sv.pvx)) + ' px/s');
    check('dizzy never stacks', !stack.r && !stack.grew, JSON.stringify(stack));
    const gone = await waitFor(s => s.dz <= 0, 3000);
    await sleep(60);
    await page.keyboard.press('Space'); await sleep(140);
    const back = await S();
    check('...and when it passes she jumps again', !!gone && !back.on);
  }

  // ======================================================================
  // 5. THE PARRY
  // ======================================================================
  const tossWith = async (pressAt) => {
    await page.evaluate(() => { T.stage({ ghMet: 1, ghParryTold: 1 }); T.arena(700, 700 - 150 - 40); G.boss.parries = 0; T.go('tossprep', GH.tossTell); });
    const c0 = (await S()).cores;
    let pressed = null;
    const t0 = Date.now();
    while (Date.now() - t0 < 2500) {
      const s = await S();
      if (!pressed && s.st === 'tossprep' && s.t <= pressAt) { pressed = +s.t.toFixed(3); await page.keyboard.press('KeyX'); }
      if (['stagger', 'tossrecover'].includes(s.st)) break;
      await sleep(3);
    }
    await sleep(150);
    const s = await S();
    return { lost: c0 - s.cores, st: s.st, parries: s.parries, pressed };
  };
  {
    const good = await tossWith(0.11);
    check('a strike in the last 150 ms of the wind-up CLASHES: he staggers, she takes nothing',
      good.parries === 1 && good.st === 'stagger' && good.lost === 0, 'pressed at t=' + good.pressed + ' s; ' + good.st + ', lost ' + good.lost);
    const early = await tossWith(0.42);
    check('a strike well before the window does not: the toss lands', early.parries === 0 && early.lost >= 1,
      'pressed at t=' + early.pressed + ' s; parries ' + early.parries + ', lost ' + early.lost);
    // THE PERFECT GUARD turns the same toss (js/parry.js): the brace raised in
    // the instant it lands, not held through the wind-up
    const guardWith = async (raiseAt) => {
      await page.evaluate(() => { T.stage({ ghMet: 1, ghParryTold: 1 }); T.arena(700, 700 - 150 - 40); G.boss.parries = 0; player.parryLockT = 0; T.go('tossprep', GH.tossTell); });
      const c0 = (await S()).cores;
      let raised = null, upAtToss = null;
      const t0 = Date.now();
      while (Date.now() - t0 < 2500) {
        const s = await S();
        if (!raised && s.st === 'tossprep' && s.t <= raiseAt) { raised = +s.t.toFixed(3); await page.keyboard.down('KeyL'); }
        if (upAtToss == null && s.st === 'toss') upAtToss = await page.evaluate(() => player.guardT > 0);
        if (['stagger', 'tossrecover'].includes(s.st)) break;
        await sleep(3);
      }
      await sleep(150);
      await page.keyboard.up('KeyL');
      const s = await S();
      const glint = await page.evaluate(() => !!(player.counterT > 0 || player.counterAct));
      return { lost: c0 - s.cores, st: s.st, parries: s.parries, raised, counter: glint, upAtToss: upAtToss !== false };
    };
    // A loaded machine can deliver the toss's first frames before the keydown
    // is seen; that run never raised the brace in time and did not test the
    // parry at all, so it is run again (at most four times) rather than counted.
    let pg;
    for (let a = 0; a < 4; a++) { pg = await guardWith(0.05); pg.tries = a + 1; if (pg.upAtToss) break; }
    check('a brace raised as the toss lands turns it too: he staggers, she takes nothing, the counter opens',
      pg.parries === 1 && pg.st === 'stagger' && pg.lost === 0 && pg.counter, JSON.stringify(pg));
    const hg = await guardWith(0.6);
    check('...a brace held through the wind-up only blocks: no clash', hg.parries === 0, JSON.stringify(hg));
    // the stagger is an opening
    const st = await page.evaluate(() => GH.stagger);
    check('the clash buys an opening of ' + Math.round((st - 0.033) * 1000) + ' ms', st - 0.033 >= 0.25);
    // the hint, once
    const hint = await page.evaluate(() => { T.stage({ ghMet: 1 }); T.arena(700, 700 - 150 - 40); G.toasts = []; G.boss.t = 0; G.boss.lastMove = 'missile';
      ghStep(G.boss, 1 / 60); const a = G.toasts.map(q => q.text); return { st: G.boss.st, said: a.indexOf(t('grv_parry_hint')) >= 0, told: !!G.save.flags.ghParryTold }; });
    check('the first toss teaches the parry, once (a hint line, in her language)', hint.st === 'tossprep' && hint.said && hint.told, JSON.stringify(hint));
  }

  // ======================================================================
  // 6. THE HORN MISSILE
  // ======================================================================
  {
    await page.evaluate(() => { T.stage({ ghMet: 1 }); T.arena(1000, 470); player.iT = 0; T.go('hornprep', GH.hornPrep); window._mt = [];
      const f = () => { const b = G.boss; const m = b && b.missiles && b.missiles[0]; if (m) window._mt.push([+(G.simClock).toFixed(3), m.ph, m.locked, Math.atan2(m.vy, m.vx), m.x, m.y]); if (window._mt.length < 900 && G.boss && G.boss.missiles) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const fired = await waitFor(s => s.st === 'hornless', 3000);
    const away = await page.evaluate(() => { const B = ghBoxes(G.boss); return { big: G.boss.hornBig, horn: B.horn, m: G.boss.missiles.length }; });
    check('the big horn LEAVES the head (a missile in the air, the socket empty)', fired && away.big === false && away.m === 1 && away.horn === null);
    // run out from under it: the homing ends at the lock, and then it flies straight
    await page.keyboard.down('ArrowRight'); await sleep(500); await page.keyboard.up('ArrowRight');
    await sleep(900);
    const mt = await page.evaluate(() => window._mt);
    const fly = mt.filter(r => r[1] === 'fly');
    const lockAt = fly.find(r => r[2]);
    const after = fly.filter(r => r[2]);
    const turnAfter = after.length > 2 ? Math.max(...after.map(r => Math.abs(r[3] - after[0][3]))) : 0;
    check('it homes, then LOCKS ~0.35 s after launch (the cyan flash)', !!lockAt && lockAt[0] - fly[0][0] >= 0.3 && lockAt[0] - fly[0][0] <= 0.45,
      lockAt ? Math.round((lockAt[0] - fly[0][0]) * 1000) + ' ms' : 'never');
    check('...and after the lock it flies STRAIGHT (dodging works)', after.length > 2 && turnAfter < 0.02, 'heading drift ' + turnAfter.toFixed(4) + ' rad');
    // the head, hornless, bites deeper: a keyboard strike on it against one on his flank
    const head = await page.evaluate(async () => {
      const b = G.boss;
      const P = ghBoxes(b);
      return { headX: P.head.x + P.head.w / 2, hy: P.head.y + P.head.h };
    });
    void head;
    const strike = async (onHead) => {
      await page.evaluate((onHead) => {
        T.arena(1000, 600, { face: -1 });
        const b = G.boss;
        if (onHead) { b.hornBig = false; b.st = 'hornless'; b.t = 9; }
        b.hp = b.hpMax; b._hpPrev = b.hp; b.dazeCD = 99;
        const B = ghBoxes(b);
        // in front of his face, facing it — or behind his rump, facing that
        const tx = onHead ? B.head.x - 36 : B.rear.x + B.rear.w + 36;
        player.x = tx - player.w / 2; player.y = T.floor - player.h - 2; player.vx = 0; player.iT = 99; player.atkCD = 0; player.comboT = 0;
        player.face = onHead ? 1 : -1; player.faceVis = player.face;
      }, onHead);
      await sleep(60);
      const h0 = (await S()).hp;
      await page.keyboard.press('KeyX');
      await sleep(120);
      return h0 - (await S()).hp;
    };
    await page.evaluate(() => { G.boss.missiles.length = 0; G.boss.hornBig = true; });
    const flank = await strike(false);
    const onHead = await strike(true);
    check('hornless, a strike on the HEAD deals more than one on his flank', onHead > flank && flank > 0, 'head ' + onHead + ' vs flank ' + flank);
    // the return: put her in the horn's way home — it does not hurt her
    await page.evaluate(() => { T.arena(1000, 760); player.iT = 0; T.go('hornprep', GH.hornPrep); });
    await waitFor(s => s.st === 'hornless', 3000);
    const boom = await waitFor(s => s.nm && true, 100);
    void boom;
    // stand clear of the shot, then walk into the path of the horn coming home
    await page.evaluate(() => { player.x = 300; player.iT = 0; });
    const ret = await waitFor(() => false, 1) || null; void ret;
    let hurtOnReturn = false, retSeen = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 4500) {
      const r = await page.evaluate(() => {
        const b = G.boss, m = b.missiles[0];
        if (m && m.ph === 'ret') { player.x = m.x - player.w / 2; player.y = Math.min(T.floor - player.h - 2, m.y - player.h / 2); player.vy = 0; }
        return { ret: !!(m && m.ph === 'ret'), cores: player.cores, max: player.maxCores(), st: b.st, big: b.hornBig };
      });
      if (r.ret) retSeen = true;
      if (r.cores < r.max) hurtOnReturn = true;
      if (r.big && r.st !== 'hornless') break;
      await sleep(10);
    }
    const sb = await S();
    check('the horn flies home and SEATS (harmless on its way back)', retSeen && !hurtOnReturn && sb.hornBig, 'returned ' + retSeen + ', hurt ' + hurtOnReturn);
    const hl = moves.openings['missile (hornless)'];
    check('the hornless opening lasts ~2.5 s', hl >= 2.2 && hl <= 3.0, Math.round(hl * 1000) + ' ms');
  }

  // ======================================================================
  // 7. PHASE TWO
  // ======================================================================
  {
    await page.evaluate(() => { T.stage({ ghMet: 1, ghParryTold: 1 }); T.arena(900, 700); G.boss.hp = 3; G.boss._hpPrev = 3; G.boss.dazeCD = 99; player.face = 1; player.faceVis = 1; player.iT = 99; });
    // the last strike of phase one, from the keyboard
    await page.evaluate(() => { const b = G.boss; const B = ghBoxes(b); player.x = B.head.x - 40; player.y = T.floor - player.h - 2; player.face = 1; });
    await page.keyboard.press('KeyX');
    const kn = await waitFor(s => s.st === 'kneel', 1500);
    check('at 0 HP in phase one he crashes to his knees (not dead, not a fork)', !!kn && !kn.dead && kn.hp >= 1, kn && kn.st + ' hp ' + kn.hp);
    check('...and she is held for the beat', kn && kn.hold);
    // nothing lands in the beat
    const inv = await page.evaluate(() => { const b = G.boss; const h0 = b.hp; dealDmg(b, 50, null, b.cx(), b.cy(), true); ghStep(b, 1 / 60); return { h0, h1: b.hp, st: b.st }; });
    check('...the beat cannot be cheesed: a hit in it changes nothing', inv.h1 >= inv.h0 && (inv.st === 'kneel' || inv.st === 'rage'), JSON.stringify(inv));
    const rage = await waitFor(s => s.state === 'DIALOG', 3000);
    const line = await page.evaluate(() => G.dialog && G.dialog.lines[0]);
    check('he speaks into the change (the phase-two line)', !!rage && /war/i.test(line || ''), line);
    for (let i = 0; i < 6 && (await S()).state === 'DIALOG'; i++) { await page.keyboard.press('Enter'); await sleep(380); }
    const p2 = await waitFor(s => s.phase === 2 && s.st === 'idle', 4000);
    check('...the armour goes, the second horn lights: PHASE TWO, HP refilled, her controls back', !!p2 && p2.hp === p2.hpMax && !p2.hold,
      p2 ? 'hp ' + p2.hp + '/' + p2.hpMax : 'not reached');
    // twin missiles
    await page.evaluate(() => { T.arena(1000, 470, { phase: 2 }); player.iT = 99; T.rec(); T.go('hornprep', GH.hornPrep2);
      window._lt = []; const f = () => { const b = G.boss; if (!b) return; for (const m of b.missiles) if (!m._seen) { m._seen = 1; window._lt.push([m.which, +(G.simClock).toFixed(3)]); } if (window._lt.length < 2) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const both = await waitFor(s => s.st === 'hornless', 3000);
    const lt = await page.evaluate(() => window._lt);
    const hs = await S();
    check('phase two fires BOTH horns', !!both && lt.length === 2 && hs.hornBig === false && hs.hornSmall === false, JSON.stringify(lt));
    check('...staggered: the gap between them is the dodge (~0.45 s)', lt.length === 2 && lt[1][1] - lt[0][1] >= 0.38 && lt[1][1] - lt[0][1] <= 0.55,
      lt.length === 2 ? Math.round((lt[1][1] - lt[0][1]) * 1000) + ' ms, ' + lt[0][0] + ' then ' + lt[1][0] : '');
    await waitFor(s => s.st === 'idle', 6000);
    const seq2 = await page.evaluate(() => T.stop());
    const d2 = durs(seq2).find(e => e[0] === 'hornless');
    check('...and the hornless opening is LONGER with both away', d2 && d2[1] > moves.openings['missile (hornless)'] + 0.3, d2 && Math.round(d2[1] * 1000) + ' ms');
    // the kick: only from behind
    const deck = await page.evaluate(() => {
      const b = G.boss, out = { behind: {}, front: {}, p1behind: {} };
      const run = (key, phase, side) => {
        for (let i = 0; i < 150; i++) {
          T.arena(800, 800 + side * (80 + (i % 5) * 22), { face: -1, phase });
          b.face = -1; b.faceVis = -1; b.lastMove = i % 2 ? 'missile' : null; b.t = 0; b.denied = 0;
          ghStep(b, 1 / 60);
          out[key][b.st] = (out[key][b.st] || 0) + 1;
        }
      };
      run('behind', 2, 1); run('front', 2, -1); run('p1behind', 1, 1);
      return out;
    });
    check('phase two: standing behind him draws the REAR KICK', (deck.behind.kickprep || 0) > 100, JSON.stringify(deck.behind));
    check('...never from in front', !deck.front.kickprep, JSON.stringify(deck.front));
    check('...and never in phase one (he turns instead — that turn is the opening)', !deck.p1behind.kickprep && (deck.p1behind.turn || 0) > 100, JSON.stringify(deck.p1behind));
    // the kick lands behind him, and only there
    await page.evaluate(() => { T.arena(800, 800 + 150, { face: -1, phase: 2 }); T.go('kickprep', GH.kickTell); });
    const c0 = (await S()).cores;
    await waitFor(s => s.st === 'kickrecover', 2000);
    const kb = await S();
    check('the kick connects behind: a core, and she is driven away', kb.cores === c0 - 1 && kb.px > 950, 'lost ' + (c0 - kb.cores) + ', at ' + Math.round(kb.px));
    // the phase-two charge is faster and chained, and only the last leg opens
    await page.evaluate(() => { T.arena(900, 520, { phase: 2 }); player.iT = 99; player.y -= 170; G.boss.chainLeg = 1; T.rec(); T.go('chargewarn', GH.chargeTell); window._vmax = 0;
      const f = () => { const b = G.boss; if (!b) return; if (b.st === 'rush') window._vmax = Math.max(window._vmax, Math.abs(b.vx)); if (T.recOn) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await waitFor(s => s.st === 'idle', 9000);
    const cseq = await page.evaluate(() => ({ seq: T.stop(), v: window._vmax }));
    const names = cseq.seq.map(e => e[0]);
    const tells2 = durs(cseq.seq).filter(e => e[0] === 'chargewarn').map(e => e[1]);
    check('phase two charges ~1.3x faster', cseq.v >= 640 * 1.25, Math.round(cseq.v) + ' px/s (phase one 640)');
    check('...chained: the wall turns him and he charges back once', names.filter(n => n === 'rush').length === 2 && names.includes('wallturn'), names.join(' > '));
    check('...the second wind-up visibly differs (longer, a third scrape)', tells2.length === 2 && tells2[1] > tells2[0] + 0.15, tells2.map(v => Math.round(v * 1000)).join(' then ') + ' ms');
    check('...and only the last leg ends in the opening', names.indexOf('wallturn') < names.lastIndexOf('rush') && ['stunned', 'recover'].some(n => names.lastIndexOf(n) > names.lastIndexOf('rush')));
  }

  // ======================================================================
  // 8. THE END, AND A DEATH BEFORE IT
  // ======================================================================
  {
    // a death mid-fight: the standard reset — he is back, whole, at the start
    await page.evaluate(() => { T.stage({ ghMet: 1 }); T.arena(900, 700, { phase: 2 }); G.boss.hp = 40; player.cores = 1; player.iT = 0; player.hurt(1, 900); });
    const dead = await waitFor(s => s.state === 'DEAD', 2000);
    check('a death mid-fight is a death (no special case)', !!dead);
    await waitFor(s => s.state === 'PLAY', 6000);
    const back = await page.evaluate(() => { const r = G.roomId; loadRoom('CV3'); G.bossEntry = null; const b = G.boss;
      return { from: r, kind: b && b.kind, st: b && b.st, phase: b && b.phase, full: b && b.hp === b.hpMax, flag: !!G.save.flags.bossHorn }; });
    check('...and walking back in, he is there again, full, phase one, asleep', back.kind === 'horn' && back.st === 'dorm' && back.phase === 1 && back.full && !back.flag, JSON.stringify(back));
    const again = await page.evaluate(async () => { player.x = 470; player.y = T.floor - player.h - 2;
      for (let i = 0; i < 400 && G.state !== 'DIALOG'; i++) await new Promise(r => setTimeout(r, 10));
      return G.dialog && G.dialog.lines.length; });
    check('...and the second meeting is the short one (one line)', again === 1, again);
    await page.evaluate(() => { while (G.dialog) dialogClose(G.dialog); });
    // the defeat
    await page.evaluate(() => { T.arena(900, 700, { phase: 2 }); G.boss.hp = 3; G.boss._hpPrev = 3; G.boss.dazeCD = 99; player.iT = 99;
      const B = ghBoxes(G.boss); player.x = B.head.x - 40; player.face = 1; player.faceVis = 1; });
    await page.keyboard.press('KeyX');
    const down = await waitFor(s => s.st === 'beaten', 1500);
    check('at 0 HP in phase two he is beaten, not destroyed', !!down && !down.dead);
    const say = await waitFor(s => s.state === 'DIALOG', 3000);
    const lines = await page.evaluate(() => G.dialog && G.dialog.lines.slice());
    check('...he speaks: "This isn\'t over. The Eye sees you."', !!say && lines && lines.length === 2 && /isn't over/.test(lines[0]) && /Eye sees you/.test(lines[1]), JSON.stringify(lines));
    for (let i = 0; i < 8 && (await S()).state === 'DIALOG'; i++) { await page.keyboard.press('Enter'); await sleep(380); }
    const ret = await waitFor(s => s.st === 'retreat', 2000);
    const bx0 = ret && ret.bx;
    const gone = await waitFor(s => s.dead, 5000);
    check('...he backs into the rock and is gone', !!ret && !!gone && Math.abs(gone.bx - bx0) > 60, ret ? 'backed ' + Math.round(Math.abs(gone.bx - bx0)) + ' px' : '');
    const after = await page.evaluate(() => ({ flag: !!G.save.flags.bossHorn, active: bossActive(), hold: !!G.ghHold,
      saved: !!JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))).flags.bossHorn }));
    check('the flag is set and saved (bossHorn)', after.flag && after.saved);
    check('the room unlocks and her controls are hers', !after.active && !after.hold);
    const exitOk = await page.evaluate(() => { player.x = -30; player.y = T.floor - player.h - 2; checkTransitions(); const ok = !!(G.trans && G.trans.to === 'CV2'); G.trans = null; return ok; });
    check('...the way out crosses again', exitOk);
    // re-entry: no soldier; the cave's own machines are back
    const re = await page.evaluate(() => { loadRoom('CV3'); player.x = 900; player.y = T.floor - player.h - 2; return { boss: !!(G.boss && !G.boss.dead), crawlers: G.enemies.filter(e => e.kind === 'crawler').length, pillar: !!G.statics.find(s => s.type === 'pillar') }; });
    check('re-entering CV3 after the flag: no boss, the crawlers back, the stone still there', !re.boss && re.crawlers === 2 && re.pillar, JSON.stringify(re));
    // the stone is reachable on foot from the arena, and the burst frees it as before
    const pil = await page.evaluate(() => {
      if (G.roomId !== 'CV3') loadRoom('CV3');
      G.bossEntry = null; G.trans = null; G.enemies.length = 0; player.x = 900; player.y = T.floor - player.h - 2; player.vx = 0; player.dead = false; player.iT = 0; T.clear();
      const p = G.statics.find(s => s.type === 'pillar'); return p ? { x: p.x, w: p.w, room: G.roomId } : { x: 1e9, room: G.roomId, st: G.statics.map(q => q.type).join(',') }; });
    if (pil.x > 1e8) console.log('       (no pillar in ' + pil.room + ': ' + pil.st + ')');
    await page.keyboard.down('ArrowRight');
    let reached = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 9000) {
      const s = await S();
      if (s.px > pil.x - 40 && s.on) { reached = true; break; }
      if (s.on) { await page.keyboard.down('Space'); await sleep(240); await page.keyboard.up('Space'); }
      await sleep(30);
    }
    await page.keyboard.up('ArrowRight');
    check('the raw marble is reachable on foot from the arena (walked with the keyboard)', reached);
    const freed = await page.evaluate(() => {
      const p = G.statics.find(s => s.type === 'pillar');
      player.x = p.x - 30; player.y = p.y + p.h - player.h; player.on = true; player.vx = player.vy = 0; player.face = 1; player.volts = 60;
      G.state = 'PAUSE';                         // step it by hand, the chapter-one way
      keys.KeyX = true; keysP.KeyX = true;
      for (let i = 0; i < 75; i++) { player.update(1 / 60); delete keysP.KeyX; }
      delete keys.KeyX; player.update(1 / 60); T.clear(); G.state = 'PLAY';
      return { bag: !!(G.save.bag && G.save.bag.cshard), flag: !!G.save.flags.pl_cshard };
    });
    check('...and the Volt Burst frees it, exactly as before', freed.bag && freed.flag, JSON.stringify(freed));
    const goal = await page.evaluate(() => { T.stage({ ghMet: 1 }); const a = opGoalKey(); G.save.flags.bossHorn = 1; const b2 = opGoalKey(); return [a, b2]; });
    check('the objective names him while he stands, and the marble after', goal[0] === 'op_o_gravehorn' && goal[1] === 'op_o_marble', goal.join(' -> '));
  }

  // ======================================================================
  // 9. THE GAIT: PLANTED HOOVES
  // ======================================================================
  {
    const g = await page.evaluate(async () => {
      T.stage({ ghMet: 1 }); T.arena(1100, 200);
      const b = G.boss; b.st = 'walk'; b.t = 99; b.walkGoal = -1; player.iT = 99;
      const seg = [{}, {}, {}, {}];
      let maxSlide = 0, maxGap = 0, n = 0, plants = 0, worst = '';
      const t0 = performance.now();
      while (performance.now() - t0 < 2200) {
        await new Promise(r => requestAnimationFrame(r));
        if (b.st !== 'walk') { b.st = 'walk'; b.t = 99; }
        const H = ghHoofWorld(b);
        for (let i = 0; i < 4; i++) {
          const h = H[i];
          if (h.stance) {
            if (seg[i].x == null) { seg[i].x = h.x; plants++; }
            maxSlide = Math.max(maxSlide, Math.abs(h.x - seg[i].x));
            const gy = ghGround(b, h.x);
            const gap = Math.abs(h.y - gy);
            if (gap > maxGap) { maxGap = gap; worst = i + '@' + Math.round(h.x); }
            n++;
          } else seg[i].x = null;
        }
      }
      return { maxSlide, maxGap, n, plants, worst, moved: Math.round(1100 - b.cx()) };
    });
    check('he walks (a real gait, not a slide)', g.moved > 100 && g.plants >= 6, 'moved ' + g.moved + ' px, ' + g.plants + ' plants');
    check('a planted hoof does not slide (max drift during stance <= 1 px)', g.maxSlide <= 1, g.maxSlide.toFixed(2) + ' px');
    check('...and it stands ON the drawn floor (|hoof - heightfield| <= 3 px)', g.maxGap <= 3, g.maxGap.toFixed(2) + ' px (worst ' + g.worst + '), ' + g.n + ' samples');
  }

  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await browser.close();
  console.log('\n  move timings (game clock):');
  for (const k of ['missile', 'charge', 'chargeSkid', 'toss', 'kick'])
    if (moves[k]) console.log('    ' + k.padEnd(11) + durs(moves[k].seq).map(d => d[0] + (d[1] != null ? ' ' + Math.round(d[1] * 1000) : '')).join(' > '));
  if (fails.length) { console.log('\n' + fails.length + ' FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — GRAVEHORN tells, hits, opens, turns, and leaves, as written');
})().catch(e => { console.error(e); process.exit(1); });
