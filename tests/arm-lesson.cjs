// A NEW ARM TEACHES ITSELF (owner, 2026-11-27: "There isn't a direct way that
// tells me how to switch between these skills I have. There's no walkthrough"
// · "I don't know how to throw my ninja stars using controller." · "Whenever I
// get a new skill from killing a boss or freeing a boss, there should be a
// teaching on how to actually using the new skill.").
//
// Drives the real build and fails if it comes back:
//   A  KEYBOARD  the Alpha's yield gives the pack, worn; once the card is
//                closed a lesson chip names the cast key (V), waits for the
//                wolf, ticks, then the switch key (G), waits for it, ticks, and
//                is done for good (les_arm_pack); it never opens over the card
//   B  PAD       the same lesson on a DualSense names R2 then L1, and the pad's
//                own presses (through pollGamepad) satisfy it
//   C  PHONE     names the wheel seats (✦ ▸ ◎, ✦ ▸ ⬡), rings the wheel
//                button and the seat, and a tap on each satisfies it; with the
//                pack and no EMP the wheel HAS a cast seat
//   D  EVERY ARM the horn-star (GRAVEHORN) and every guardian's suit opens its
//                own lesson; the first cast is paid for (volts topped up)
//   E  ON A PAD  every arm can be selected with the pad's switch and fired
//                with its cast button; both have a real button by default and
//                the controls screen lists them
//   F  HUD       beside the worn arm, the control that fires it and the one
//                that changes it, in the scheme in use
//   G  CARD      the card's line names her controls, never "V or K" on a pad
//   H  WORDS     each chip is the control and at most a few words, in five
//                languages (the pop-up budget of tests/text-budget.cjs)
//   I  OWED      a lesson not finished is still owed after a reload; owed
//                while another arm is worn it asks to WEAR it first (G, then V)
//   J  STARS     the first time she plays on a pad the ninja stars are taught
//                on the pad's own button (R3), and the HUD names it there
//
//   node tests/arm-lesson.cjs     (the repo served on :8220, or TEST_PORT)
//   SHOTS=<dir> also saves the chip on keyboard, pad and phone
const { chromium } = require('playwright');
const path = require('path');
const PORT = process.env.TEST_PORT || 8220;
const SHOTS = process.env.SHOTS || '';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, info) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (info == null ? '' : '  ' + info)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.addInitScript(() => {
      localStorage.setItem('cb_intro_seen', '1');
      window.FAKE_PAD = null; navigator.getGamepads = () => [window.FAKE_PAD];
    });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function' && typeof updateArmLesson === 'function', { timeout: 30000 });
    console.log('── arm-lesson — every new arm shows the one control that wears it and the one that uses it, in her own scheme');
    // the harness's tools, in the page
    await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
      const W = window.AL = {};
      W.pad = (btns) => {
        const buttons = []; for (let i = 0; i < 17; i++) buttons.push({ pressed: !!(btns && btns.includes(i)), value: btns && btns.includes(i) ? 1 : 0 });
        window.FAKE_PAD = { id: 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)', index: 0, connected: true, timestamp: performance.now(), mapping: 'standard', axes: [0, 0, 0, 0], buttons };
      };
      W.scheme = (s) => {
        TOUCH.enabled = s === 'touch';
        if (s === 'pad') { W.pad([]); clearP(); pollGamepad(); pollInput(); }
        else { window.FAKE_PAD = null; clearP(); pollGamepad(); pollInput(); if (PAD.on) padConnected(false, null); }
      };
      W.fresh = (scheme, arms) => {
        let s = 0x1234abcd; Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
        Object.assign(sv.flags, { woke: 1, tut: 1, gateOpened: 1, heal: 1, crystal: 1, opNote: 1, ratchetRepaired: 1 });
        sv.arms = arms || []; sv.armIdx = 0;
        startGame(sv); loadRoom('A1');
        G.state = 'PLAY'; G.dialog = G.cut = G.wake = G.meet = G.tut = null; G.toasts = []; G.enemies = []; G.boss = null;
        const g = groundColumnAt(20 * TILE); player.x = 20 * TILE; if (g) player.y = Math.min(g[0], g[1]) - player.h; player.on = true;
        player.volts = 0; player.iT = 99;
        W.scheme(scheme);
      };
      // one frame, the way the loop runs it
      W.frame = () => { if (window.FAKE_PAD) { window.FAKE_PAD.timestamp = performance.now(); } pollGamepad(); pollInput(); player.iT = 99; G.enemies = G.enemies.filter(e => e.calm || e.tame); update(1 / 60); clearP(); };
      W.frames = (n) => { for (let i = 0; i < n; i++) W.frame(); };
      // close whatever card is up, the way a player does (and let the queue open the next)
      W.cards = () => { let n = 0; for (let i = 0; i < 30; i++) { if (G.dialog) { G.dialog = null; G.state = 'PLAY'; n++; } W.frame(); } return n; };
      // a lesson owed opens on a clear screen: let the pop-ups and the room's name pass
      W.settle = () => { for (let i = 0; i < 900 && !G.armLesson && (G.save.armLes || []).length; i++) { if (G.dialog) { G.dialog = null; G.state = 'PLAY'; } W.frame(); } };
      // press one action in the scheme in use
      W.press = (act, scheme) => {
        if (scheme === 'pad') { W.pad([PAD.map[act]]); W.frame(); W.pad([]); W.frame(); return; }
        if (scheme === 'touch') { const code = { ARM: 'VARM', CAST: 'VCAST', INT: 'VINT' }[act]; tPress(code); W.frame(); keys[code] = 0; W.frame(); return; }
        const code = KEYB[act][0]; keys[code] = 1; keysP[code] = 1; update(1 / 60); keys[code] = 0; keysP[code] = 0; W.frames(1);
      };
      // after a press: until the lesson moves on (its tick held, then the next step), at most 5 s
      W.next = () => { const L0 = G.armLesson, i0 = L0 && L0.i; for (let i = 0; i < 300; i++) { W.frame(); if (G.armLesson !== L0 || (G.armLesson && G.armLesson.i !== i0)) return; } };
      W.chip = () => { G.armLessonChip = null; drawArmLesson(); const c0 = G.armLessonChip; return c0 ? { key: c0.key, label: c0.label, act: c0.act, step: c0.step, id: c0.id } : null; };
      // a lesson run to its end, by the controls the chip names
      W.run = (scheme) => {
        const seen = [];
        for (let k = 0; k < 6 && G.armLesson; k++) {
          W.frames(2);
          const ch = W.chip(); if (!ch) { W.frames(10); continue; }
          seen.push({ ...ch, hi: TOUCH.hi || null, seat: TOUCH.hiSeat || null });
          W.press(ch.act, scheme);
          W.next();                           // the tick, then the next step
        }
        return seen;
      };
    });

    // ---- A/B/C. THE PACK, THE ALPHA'S YIELD, IN EACH SCHEME ---------------------------------
    const pack = {};
    for (const scheme of ['keys', 'pad', 'touch']) {
      pack[scheme] = await page.evaluate((scheme) => {
        const W = window.AL; W.fresh(scheme);
        G.onBossDead('alpha');
        const r = { cardUp: !!G.dialog || (typeof overlayPending === 'function' && overlayPending()) };
        W.frames(2);
        r.overCard = !!(G.dialog && G.armLessonChip && W.chip());
        r.cards = W.cards();
        r.owed = (G.save.armLes || []).slice();
        W.frames(3);
        r.waitedForToasts = !G.armLesson && !!((G.toasts && G.toasts.length) || G.zoneToast);
        W.settle();
        r.begun = !!G.armLesson;
        r.seats = typeof wheelItems === 'function' ? wheelItems().map(w => w.code) : [];
        r.steps = W.run(scheme);
        r.done = !!G.save.flags.les_arm_pack; r.wolf = !!G.packWolf; r.left = !!G.armLesson;
        r.worn = activeArm() && activeArm().id;
        return r;
      }, scheme);
      if (SHOTS) {
        // the chip on screen, for the owner: the first step of the pack's lesson
        await page.evaluate((scheme) => {
          const W = window.AL; W.fresh(scheme); G.onBossDead('alpha'); W.cards(); W.frames(4);
          W.settle();
          const g = groundColumnAt(20 * TILE); player.x = 20 * TILE; if (g) player.y = Math.min(g[0], g[1]) - player.h;
          draw(performance.now());
          if (typeof drawTouchUI === 'function' && TOUCH.enabled) drawTouchUI();
        }, scheme);
        await page.screenshot({ path: path.join(SHOTS, 'arm-lesson-' + scheme + '.png') });
      }
    }
    const K = pack.keys, P = pack.pad, T = pack.touch;
    // (on a pad the stars' own lesson follows the pack's — J below)
    for (const r of [K, P, T]) r.steps = r.steps.filter(s => s.id === 'pack');
    const keysOf = (r) => r.steps.map(s => s.key + ' ' + s.label).join(' / ');
    check('A. keyboard: the Alpha\'s pack opens a lesson once the card is closed, never over it', K.cardUp && !K.overCard && K.begun && K.owed.includes('pack'), JSON.stringify({ cardUp: K.cardUp, over: K.overCard, owed: K.owed }));
    check('   ...it names the cast key, then the switch key (V, then G)', K.steps.length === 2 && K.steps[0].key === 'V' && K.steps[0].act === 'CAST' && K.steps[1].key === 'G' && K.steps[1].act === 'ARM', keysOf(K));
    check('   ...the keys she presses satisfy it: the wolf comes, the wheel turns, the lesson is done for good', K.done && K.wolf && !K.left && K.worn !== 'pack', JSON.stringify({ done: K.done, wolf: K.wolf, worn: K.worn }));
    check('B. pad: the same lesson names R2 then L1, and the pad\'s own buttons satisfy it', P.steps.length === 2 && P.steps[0].key === 'R2' && P.steps[1].key === 'L1' && P.done && P.wolf, keysOf(P) + ' done ' + P.done + ' wolf ' + P.wolf);
    check('C. phone: the wheel seats (✦ ▸ ◎, ✦ ▸ ⬡), the wheel button and the seat rung, and the taps satisfy it',
      T.steps.length === 2 && T.steps[0].key === '✦ ▸ ◎' && T.steps[1].key === '✦ ▸ ⬡' && T.steps.every(s => s.hi === 'VWHEEL') && T.steps[0].seat === 'VCAST' && T.steps[1].seat === 'VARM' && T.done && T.wolf,
      keysOf(T) + ' hi ' + T.steps.map(s => s.hi + '/' + s.seat).join(',') + ' done ' + T.done);
    check('   ...with the pack and no EMP the phone\'s wheel has a seat that casts it', T.seats.includes('VCAST') && T.seats.includes('VARM'), T.seats.join(','));

    // ---- D. EVERY ARM ---------------------------------------------------------------------------
    const D = await page.evaluate(() => {
      const W = window.AL, out = [];
      // the horn-star: GRAVEHORN driven off (gravehorn.js ghGone)
      W.fresh('keys'); loadRoom('A1'); G.state = 'PLAY';
      const stub = { kind: 'horn', missiles: [], rocks: [], shocks: [], x: 600, y: 300, w: 120, h: 90, cx() { return 660; } };
      try { ghGone(stub); } catch (e) { out.push({ id: 'shard', err: String(e) }); }
      W.cards(); W.frames(3); W.settle();
      const sh = { id: 'shard', owed: (G.save.armLes || []).slice(), begun: !!G.armLesson };
      sh.steps = W.run('keys'); sh.done = !!G.save.flags.les_arm_shard; sh.cast = (G.armCast && G.armCast.shard) | 0;
      out.push(sh);
      // each guardian's suit, in this world (onBossDead's own grant)
      for (const kind of ['prism', 'atlas', 'brood', 'zero']) {
        const arm = ARM_BY_BOSS[kind];
        W.fresh('keys', ['pack']); G.save.flags.les_arm_pack = 1;
        player.volts = 0;
        G.onBossDead(kind); W.cards();
        // (a guardian that also hands over a module teaches that first — js/game.js MOD_LESSON —
        // and the arm's lesson waits behind it; the module's own lesson is not the question here)
        const mod = G.lesson && G.lesson.id; if (G.lesson) { G.save.flags['les_' + G.lesson.id] = 1; G.lesson = null; }
        W.frames(3); W.settle();
        const r = { id: arm, mod, kind, owed: (G.save.armLes || []).slice(), begun: !!G.armLesson, voltsAtCast: null };
        // run, noting her volts at the cast step (the first cast is paid for)
        r.steps = [];
        for (let k = 0; k < 6 && G.armLesson; k++) {
          W.frames(2); const ch = W.chip(); if (!ch) { W.frames(10); continue; }
          r.steps.push(ch);
          if (ch.act === 'CAST') r.voltsAtCast = player.volts;
          W.press(ch.act, 'keys'); W.next();
        }
        r.done = !!G.save.flags['les_arm_' + arm]; r.cost = armDef(arm).cost; r.cast = (G.armCast && G.armCast[arm]) | 0;
        out.push(r);
      }
      return out;
    });
    const dOK = (r) => !r.err && r.begun && r.done && r.cast > 0 && r.steps.length === 2 && r.steps[0].key === 'V' && r.steps[1].key === 'G';
    check('D. the horn-star and every guardian\'s suit open their own lesson, and each ends in a real cast', D.length === 5 && D.every(dOK),
      D.map(r => r.id + (r.err ? ' ERR ' + r.err : ': ' + (r.steps || []).map(s => s.key).join('>') + (r.done ? ' done' : ' NOT DONE') + ' cast ' + r.cast)).join(' | '));
    const paid = D.filter(r => r.voltsAtCast != null);
    check('   ...the first cast is paid for: her volts are topped up to its price', paid.length === 4 && paid.every(r => r.voltsAtCast >= r.cost), paid.map(r => r.id + ' ' + Math.round(r.voltsAtCast) + '/' + r.cost).join(' '));

    // ---- E. EVERY ARM ON A PAD (and on a phone) -------------------------------------------------
    const E = await page.evaluate(() => {
      const W = window.AL;
      const all = ARMS.map(a => a.id);
      const r = { def: { ARM: PAD_DEFAULT.ARM, CAST: PAD_DEFAULT.CAST }, listed: PAD_ACTIONS.includes('ARM') && PAD_ACTIONS.includes('CAST'), pad: {}, touch: {} };
      for (const scheme of ['pad', 'touch']) {
        W.fresh(scheme, all.slice());
        for (const a of all) G.save.flags['les_arm_' + a] = 1;
        for (const id of all) {
          let tries = 0;
          while (!(activeArm() && activeArm().id === id) && tries++ < 12) W.press('ARM', scheme);
          player.volts = 999; player.armCD = 0; G.packWolf = null;
          const n0 = (G.armCast && G.armCast[id]) | 0;
          W.press('CAST', scheme);
          r[scheme][id] = { worn: !!(activeArm() && activeArm().id === id), presses: tries, cast: ((G.armCast && G.armCast[id]) | 0) > n0 };
        }
      }
      return r;
    });
    const padRows = Object.entries(E.pad), touchRows = Object.entries(E.touch);
    check('E. every arm can be selected with the pad\'s switch (L1) and fired with its cast (R2)', padRows.length === 6 && padRows.every(([, v]) => v.worn && v.cast),
      padRows.map(([k, v]) => k + (v.worn ? '' : ' NOT WORN') + (v.cast ? ' fired' : ' NOT FIRED')).join(', '));
    check('   ...both have a real button by default, listed on the controls screen', E.def.ARM >= 0 && E.def.CAST >= 0 && E.def.ARM !== E.def.CAST && E.listed, JSON.stringify(E.def));
    check('   ...and every arm on the phone, from the wheel\'s two seats', touchRows.length === 6 && touchRows.every(([, v]) => v.worn && v.cast),
      touchRows.map(([k, v]) => k + (v.worn ? '' : ' NOT WORN') + (v.cast ? ' fired' : ' NOT FIRED')).join(', '));

    // ---- F. THE HUD, G. THE CARD, H. THE WORDS, I. OWED ------------------------------------------
    const F = await page.evaluate(() => {
      const W = window.AL, out = { hud: {}, card: {} };
      for (const scheme of ['keys', 'pad', 'touch']) {
        W.fresh(scheme, ['pack']); G.save.armIdx = 1; G.save.flags.les_arm_pack = 1;
        G.hudArmCtl = null; drawHUD();
        out.hud[scheme] = { got: G.hudArmCtl, want: { fire: ctlName('CAST'), swap: ctlName('ARM') } };
        W.fresh(scheme); G.onBossDead('alpha');
        const d = G.dialog || null; out.card[scheme] = d ? d.lines.join(' ') : null;
        if (!d) { W.frames(2); out.card[scheme] = G.dialog ? G.dialog.lines.join(' ') : null; }
      }
      const langs = ['en', 'ar', 'tr', 'zh', 'ru'], keys = ['al_pick', 'al_cast', 'al_call', 'al_ride'];
      const words = s => (String(s).match(/[\p{L}\p{N}’'%+-]+/gu) || []).length;
      const L0 = LANG; out.words = [];
      for (const g of langs) { LANG = g; for (const k of keys) { const s = t(k); out.words.push({ g, k, s, n: words(s), len: s.length, en: (LANG = 'en', t(k)).length }); LANG = g; } }
      LANG = L0;
      // owed through a reload
      W.fresh('keys'); G.onBossDead('alpha'); persist();
      const saved = JSON.parse(JSON.stringify(G.save));
      W.fresh('keys'); startGame(saved); loadRoom('A1'); G.state = 'PLAY'; G.dialog = null; G.tut = null; W.frames(4); W.settle();
      out.owed = { list: (G.save.armLes || []).slice(), begun: !!G.armLesson };
      // owed while another arm is worn: WEAR IT first
      W.fresh('keys', ['shard']); G.save.flags.les_arm_shard = 1; G.save.armIdx = 1; G.save.arms.push('pack'); armLessonStart('pack'); W.frames(3); W.settle();
      out.other = W.run('keys').map(s => s.key + ' ' + s.act); out.otherDone = !!G.save.flags.les_arm_pack; out.otherWorn = activeArm() && activeArm().id;
      // the stars on a pad
      W.fresh('pad'); W.frames(3); out.star0 = !!G.armLesson;        // nothing to throw at: not yet
      const foe = new Enemy('blob', player.x + 260, player.y); foe.y = player.y + player.h - foe.h; foe.hypnoT = 1e9; G.enemies = [foe];
      const f0 = W.frame;
      W.frame = () => { if (window.FAKE_PAD) window.FAKE_PAD.timestamp = performance.now(); pollGamepad(); pollInput(); player.iT = 99; G.enemies = [foe]; foe.hypnoT = 1e9; foe.hp = 999; update(1 / 60); clearP(); };
      W.frames(3); for (let i = 0; i < 900 && !G.armLesson; i++) W.frame();
      const c0 = W.chip(); out.star = { chip: c0 && c0.key, act: c0 && c0.act, label: c0 && c0.label };
      G.hudArmCtl = null; drawHUD(); out.star.hudSays = ctlName('STAR');
      W.run('pad'); out.star.done = !!G.save.flags.les_arm_star; out.star.thrown = G.starN | 0;
      W.frame = f0;
      W.fresh('keys'); W.frames(3); out.star.keys = !!G.armLesson;
      return out;
    });
    const hudOK = Object.values(F.hud).every(h => h.got && h.got.fire === h.want.fire && h.got.swap === h.want.swap);
    check('F. beside the worn arm the HUD shows the control that fires it and the one that changes it, in the scheme in use', hudOK,
      Object.entries(F.hud).map(([k, h]) => k + ' ' + (h.got ? '◎' + h.got.fire + ' ⬡' + h.got.swap : 'none')).join(' | '));
    check('G. the card names her controls (never "V or K" on a pad or a phone)', /R2/.test(F.card.pad || '') && /L1/.test(F.card.pad || '') && !/V or K/.test(F.card.pad || '') && /✦/.test(F.card.touch || '') && /\bV\b/.test(F.card.keys || ''),
      JSON.stringify(F.card).slice(0, 300));
    const long = F.words.filter(w => w.n > 3 || (w.g !== 'en' && w.len > w.en * 2.2 + 8) || !w.s || w.s === w.k);
    check('H. each chip\'s words: at most three after the arm\'s name, in five languages', long.length === 0, long.map(w => w.g + ':' + w.k + '=' + w.s).join(' ') || F.words.filter(w => w.g === 'en').map(w => w.s).join(' / '));
    check('I. a lesson not finished is still owed after a reload', F.owed.list.includes('pack') && F.owed.begun, JSON.stringify(F.owed));
    check('   ...owed while another arm is worn, it asks to wear it first: G, then V', F.other.join(',') === 'G ARM,V CAST' && F.otherDone && F.otherWorn === 'pack', F.other.join(' > ') + ' worn ' + F.otherWorn);
    check('J. on a pad the ninja stars are taught on its own button (R3), the press throws one, and the keyboard is not asked', F.star.chip === 'R3' && F.star.act === 'STAR' && F.star.hudSays === 'R3' && F.star.done && F.star.thrown > 0 && !F.star.keys && !F.star0, JSON.stringify(F.star) + ' before a target: ' + F.star0);
    check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\narm-lesson: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
