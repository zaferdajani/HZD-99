// LESS TO READ (owner, 2026-11-19).
//
//   "How can we minimize the amount of text that needs to be read in order to
//    play the game? If a player is younger age, they wouldn't be able to
//    understand or read all the text, and they wouldn't want to... guide them
//    without actually having to read so much text."
//   "If there's a way to create small images, shots to explain what is
//    happening with Ratchet, I would go there instead of typing it."
//
// js/text-lite.js is the short telling of chapter one. This holds it:
//   - every short line exists in all five languages, and none is long: a goal
//     line at most 5 words, a pop-up 8, a spoken line 12, a card 10, a comic
//     caption 10 (CJK by characters, measured against its English);
//   - it is what the robot world actually says, and NOSTOS is left alone;
//   - the verb is PURIFY: no goal line, pop-up or caption says free/freed;
//   - a narration shortened to nothing is no pop-up and no blank page;
//   - the lesson chip is the key and its name, with no sentence under it, and a
//     held button wears a filling ring;
//   - Ratchet's lines are said over pictures: the pod, the Volt Pack in motion.
// The whole of chapter one is counted by campaign-ch1 (its word budget).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const open = async (page) => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
    await p.goto('http://127.0.0.1:8220/' + page);
    await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
    return { p, errs };
  };
  const { p, errs } = await open('index.html');

  const R = await p.evaluate(() => {
    const L = TEXT_LITE, langs = ['en', 'ar', 'tr', 'zh', 'ru'];
    const words = s => ([].concat(s).join(' ').match(/[\p{L}\p{N}’'%+-]+/gu) || []).length;
    const kind = k => /^op_o_/.test(k) ? 'goal' : /^(pc_|pt_)/.test(k) ? 'caption'
      : /d$|_desc$|^op_spared$|^sg_t_GA1Dd$/.test(k) && !/^(op_r|op_p|op_sv|sl_|sg_rev)/.test(k) ? 'card'
      : /^(op_r|op_p|op_sv|op_seat|sl_|sg_rev|grv_intro|grv_phase2|grv_down|q_ask|q_thanks|pc_forge)/.test(k) ? 'say' : 'popup';
    const CAP = { goal: 5, popup: 8, say: 12, card: 10, caption: 10 };
    const missing = [], long = [], free = [];
    for (const k of Object.keys(L.en)) {
      for (const g of langs) if (L[g] == null || L[g][k] == null) missing.push(g + ':' + k);
      const en = L.en[k], kd = kind(k);
      // a spoken line is measured line by line (a conversation may have two)
      const lines = [].concat(en);
      for (const s of lines) if (words(s) > CAP[kd]) long.push(kd + ' ' + k + ' (' + words(s) + 'w): ' + s);
      // the other languages: no longer than 2.2x the English in characters (CJK packs a word into two or three)
      for (const g of langs.slice(1)) {
        const a = [].concat(L[g][k] || '').join(' '), e = [].concat(en).join(' ');
        if (a.length > e.length * 2.2 + 8) long.push(g + ' ' + k + ' (' + a.length + ' vs ' + e.length + ' chars)');
      }
      if ((kd === 'goal' || kd === 'popup' || kd === 'caption') && /\bfree(d|s)?\b/i.test([].concat(en).join(' '))) free.push(k + ': ' + en);
    }
    // it is what the game says
    LANG = 'en';
    const said = ['op_o_cross', 'op_r_pod', 'pure_beast', 'pc_r_marble'].map(k => [k, t(k) === L.en[k]]);
    // a narration that became nothing: no toast
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.storyVersion = 2; startGame(sv); loadRoom('A0');
    G.toasts = []; G.toast(t('rub_hit')); G.toast(t('pg_marks')); G.toast(t('rd_reward') + '  +10 IQ');
    const toasts = G.toasts.map(q => q.text);
    // a line that became nothing: no page
    G.dialog = { name: 'x', lines: [t('sg_rev1'), t('sg_rev2'), t('sg_rev3')], i: 0 }; G.state = 'DIALOG';
    dialogUpdate(1 / 60);
    const pages = G.dialog ? G.dialog.lines.length : -1; G.dialog = null; G.state = 'PLAY';
    return { n: Object.keys(L.en).length, missing, long, free, said, toasts, pages };
  });
  check('the short telling exists in all five languages', R.missing.length === 0, R.missing.slice(0, 6).join(', ') || R.n + ' lines');
  check('no line is long: goal 5 words, pop-up 8, spoken 12, card 10, caption 10 (and the translations keep to it)', R.long.length === 0, R.long.slice(0, 5).join(' | '));
  check('the verb is purify: no goal, pop-up or caption says free', R.free.length === 0, R.free.join(' | '));
  check('it is what the robot world says', R.said.every(q => q[1]), JSON.stringify(R.said));
  check('a narration cut to nothing is no pop-up, and a reward keeps only its number', R.toasts.length === 1 && /^\S.*\+10 IQ$/.test(R.toasts[0]), JSON.stringify(R.toasts));
  check('...and a line cut to nothing is no blank page', R.pages === 2, String(R.pages));

  // the chip, the hold ring and the shots, drawn
  const D = await p.evaluate(async () => {
    const stage = (step, room, flags) => { const sv = newSave(1); sv.storyVersion = 2; Object.assign(sv.flags, flags);
      startGame(sv); loadRoom(room); G.dialog = G.wake = G.cut = null; G.state = 'PLAY'; G.toasts = []; G.enemies = [];
      const idx = TUT_STEPS.findIndex(s => s.id === step); G.tut = { i: idx, t: 0, hold: 0, doneT: 0 }; delete G.save.flags.tut; };
    const den = { woke: 1, gateOpened: 1, opNote: 1 };
    const out = {};
    stage('drawer', 'A0B', den); G.tutChip = null; draw(performance.now()); out.chip = G.tutChip && G.tutChip.h;
    // the heal step, standing in the road with a core missing: the chip asks for the held button
    stage('heal', 'A0', Object.assign({ ratchetRepaired: 1, 'on_A0B|ratchet': 1, opTold: 1, opPod: 1, winchBit: 1 }, den));
    player.cores = Math.max(1, player.maxCores() - 1); G.tutChipHold = false;
    for (let i = 0; i < 3; i++) draw(performance.now());
    out.hold = { ring: !!G.tutChipHold, label: t(tutPrompt(TUT_STEPS[G.tut.i]).label), action: tutPrompt(TUT_STEPS[G.tut.i]).action };
    // Ratchet over pictures
    stage('pod', 'A0B', Object.assign({ ratchetRepaired: 1, 'on_A0B|ratchet': 1, opTold: 1 }, den));
    mediaFetch('podOn', 1);
    for (let i = 0; i < 80 && !(MEDIA_IMG.podOn && MEDIA_IMG.podOn.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    opSay(t('n_ratchet'), ['op_r_pod'], 'ratchet'); G.dlgShot = null; draw(performance.now()); out.pod = G.dlgShot && G.dlgShot.key;
    G.dialog = null; G.state = 'PLAY';
    opSay(t('n_ratchet'), ['op_p1', 'op_p2'], 'ratchet'); G.dlgShot = null; draw(performance.now()); out.pack = G.dlgShot && G.dlgShot.key;
    G.dialog.i = 1; G.dlgShot = null; draw(performance.now()); out.packAfter = G.dlgShot && G.dlgShot.key;
    G.dialog = null; G.state = 'PLAY';
    // "bring me marble": a DRAWN COMIC panel (owner: "When I say pics I meant
    // generated comics"), on that line and not on his name
    const comic = n => 'assets/manhua/ch1/game/' + n + '.webp';
    for (const n of ['r_marble', 'f_forge']) panelsImg(comic(n));
    for (let i = 0; i < 160 && !['r_marble', 'f_forge'].every(n => panelsImg(comic(n)).ok); i++) await new Promise(r => setTimeout(r, 50));
    opSay(t('n_ratchet'), ['op_r1', 'op_r2'], 'ratchet'); G.dlgShot = null; draw(performance.now()); out.marble0 = G.dlgShot && G.dlgShot.key;
    G.dialog.i = 1; G.dlgShot = null; draw(performance.now()); out.marble1 = G.dlgShot && G.dlgShot.key; out.marbleComic = !!(G.dlgShot && G.dlgShot.comic && G.dlgShot.w >= 380);
    G.dialog = null; G.state = 'PLAY';
    // a line opened without opSay: the forge's thanks has a film, so no panel
    G.dialog = { name: t('n_ratchet'), lines: [t('q_thanks_ratchet_forge')], i: 0, npc: 'ratchet' }; G.state = 'DIALOG';
    G.dlgShot = null; draw(performance.now()); out.forge = G.dlgShot && G.dlgShot.key;
    G.dialog = null; G.state = 'PLAY';
    out.nShots = Object.keys(OP_SHOT); out.lineShots = Object.keys(LINE_SHOT);
    return out;
  });
  check('the lesson chip is the key and its name, with no sentence under it', D.chip === 58, 'chip height ' + D.chip + ' (one line 58, two lines 70)');
  check('...and a held button wears a ring that fills', D.hold.ring === true, JSON.stringify(D.hold));
  // KEY MOMENTS ONLY (owner, 2026-11-20: "It's not about oversaturating the
  // game with images and videos"): two pictures in all of chapter one's
  // dialogue, the goal and the first power; the pod line is just said
  check('pictures only at key moments: two in all of chapter one\'s talk (the goal, the first power)',
    D.nShots.length === 2 && D.nShots.indexOf('op_r2') >= 0 && D.nShots.indexOf('op_p1') >= 0 && D.lineShots.join() === 'op_r2', JSON.stringify([D.nShots, D.lineShots]));
  check('...and the pod line is just said', D.pod == null, String(D.pod));
  check('...and the Volt Pack over the pack at work, and only on the line about it', D.pack === 'demo:pack' && D.packAfter == null, JSON.stringify([D.pack, D.packAfter]));
  check('...and "bring me marble" over the drawn comic of it, framed as a comic and bigger', D.marble0 == null && /r_marble\.webp$/.test(D.marble1 || '') && D.marbleComic, JSON.stringify([D.marble0, D.marble1, D.marbleComic]));
  check('...but the forge\'s thanks, whose film shows the forging, is said over no comic ("When there is a video no need for comic")', D.forge == null, String(D.forge));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();

  // NOSTOS keeps its own words
  const h = await open('odyssey.html');
  const H = await h.p.evaluate(() => { LANG = 'en'; return { hero: isHero(), cross: t('op_o_cross'), lite: TEXT_LITE.en.op_o_cross }; });
  check('NOSTOS is not given the robot world\'s short lines', H.hero && H.cross !== H.lite, JSON.stringify(H));
  await h.p.close();

  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — chapter one says less, and shows more');
})().catch(e => { console.error(e); process.exit(1); });
