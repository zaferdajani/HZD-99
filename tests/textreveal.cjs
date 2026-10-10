// WORDS ARRIVE AT A READING PACE, AND NOTHING THE STORY SAYS LEAVES UNREAD.
//
// The owner's order (2026-10-09): reveal dialogue and captions letter by
// letter at a configurable speed; the first confirm reveals the page, a
// SEPARATE later one advances it; never let one input do both; important text
// waits for the player and no unread paragraph disappears on a timer; long
// speeches become short pages; instant-text and reduced-motion options; Arabic
// shaped and right to left; combat paused during story dialogue; and dialogue,
// item cards, shop windows, offers and cinematics never on screen together.
//
// This drives the real build (js/reveal.js, js/overlay.js, the DIALOG/CINE/CUT
// paths in js/game.js) with the game's own input arrays and measures:
//
//   1. the page types out over time, and is not whole after a fraction of it
//   2. the first press shows the whole page and does NOT turn it; a second,
//      separate press turns it
//   3. ATTACK held, or mashed every frame / every 100 ms for seconds, never
//      turns a page — a mash cannot skip what was never read
//   4. a long speech is cut into pages of at most four lines, every line
//      inside the box
//   5. Chinese, which has no spaces, wraps inside the box
//   6. Arabic is drawn right-aligned at the column's right edge, and typed
//      WHOLE WORDS at a time, so a letter is never shown out of its joining
//   7. an item card raised during a conversation waits for it: both appear,
//      in order, never together; a card bought in the shop hands back to it
//   8. the Instant option and Reduced motion show the page at once
//   9. a story line is a card that stays until acknowledged (sixty seconds
//      of nothing does not close it); a locked-door instruction is a card the
//      first time and a reminder after; a staged scene's narration is a
//      caption that stays until read without taking the controls
//  10. a shop refusal is visible inside the shop
//  11. the world is frozen while any of it is open
//  12. the pause menu carries Text speed and Reduced motion, and they persist
//  13. the opening's held stills wait for the caption to be read
//
//   node tests/textreveal.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail == null ? '' : '  ' + detail));
  if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
};

(async () => {
  console.log('── textreveal — words at a reading pace, pages, one overlay at a time\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof revealStart === 'function', { timeout: 30000 });

  const r = await page.evaluate(() => {
    const out = {};
    const LONG = 'The guardians went last, you know. They were made to protect us, so the song had to shout them down, ' +
      'and it took every one of them before anyone stopped fighting it. The infected song turned our neighbours against ' +
      'each other. You were already asleep for recharging, and you missed that broadcast. You were not made immune to ' +
      'it; you were simply not listening when it came, and that is the only reason you are still yourself.';
    const fresh = (lang) => {
      LANG = lang || 'en';
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom('A0B');
      G.wake = null; G.cut = null; G.trans = null; G.state = 'PLAY'; G.dialog = null; G.toasts = [];
      overlayClear();
      for (const k in keys) keys[k] = 0; for (const k in keysP) keysP[k] = 0;
    };
    // one simulated frame, with an optional press of one key on it
    const step = (dt, key) => {
      if (key) { keys[key] = 1; keysP[key] = 1; }
      update(dt);
      if (key) { keys[key] = 0; keysP[key] = 0; }
    };
    const run = (secs, key, every) => {
      const n = Math.round(secs * 60);
      for (let i = 0; i < n; i++) step(1 / 60, key && (every ? i % every === 0 : true) ? key : null);
    };
    const open = (lines, extra) => {
      G.dialog = Object.assign({ name: 'Ratchet', npc: 'ratchet', i: 0, onEnd: null, lines }, extra || {});
      G.state = 'DIALOG';
    };
    const shown = () => revealText(G.dialog._rv).replace(/\n/g, ' ').length;

    // ---- 1. the page types out ---------------------------------------------
    fresh('en'); G.save.opts = { textSpeed: 'normal', reduceMotion: false };
    open([LONG]);
    run(0.2);
    const a1 = shown();
    run(0.3);
    const a2 = shown();
    const pg0 = (G.dialog._pages[0] || []).join(' ').length;
    out.type = { a1, a2, pg0, done: revealDone(G.dialog._rv) };

    // ---- 2. first press reveals, a second separate one turns ---------------
    step(1 / 60, 'Enter');
    out.press1 = { done: revealDone(G.dialog._rv), pg: G.dialog.pg, i: G.dialog.i, len: shown(), pg0 };
    run(0.35);
    step(1 / 60, 'Enter');
    out.press2 = { pg: G.dialog.pg, i: G.dialog.i, state: G.state };

    // ---- 3. mashing / holding attack never turns a page --------------------
    fresh('en'); G.save.opts = { textSpeed: 'normal', reduceMotion: false };
    open([LONG, 'second line']);
    run(3, 'KeyX', 1);                                    // every frame, three seconds
    out.mashFrame = { pg: G.dialog && G.dialog.pg, i: G.dialog && G.dialog.i, done: revealDone(G.dialog._rv) };
    run(3, 'KeyX', 6);                                    // every 100 ms, three seconds
    out.mash100 = { pg: G.dialog && G.dialog.pg, i: G.dialog && G.dialog.i };
    // held: down the whole time, pressed once (the keyboard filters repeats)
    keys.KeyX = 1; keysP.KeyX = 1; update(1 / 60); keysP.KeyX = 0;
    for (let i = 0; i < 180; i++) update(1 / 60);
    keys.KeyX = 0;
    out.held = { pg: G.dialog && G.dialog.pg, i: G.dialog && G.dialog.i };
    // ...and a deliberate press after a pause does turn it
    run(0.5);
    step(1 / 60, 'KeyX');
    out.deliberate = { pg: G.dialog && G.dialog.pg, i: G.dialog && G.dialog.i };
    // a dialogue opened in the middle of a swing: the grace eats the swing
    fresh('en'); G.save.opts = { textSpeed: 'instant' };
    open(['one', 'two']);
    step(1 / 60, 'KeyX');
    out.grace = { i: G.dialog && G.dialog.i };

    // ---- 4. pagination ------------------------------------------------------
    fresh('en'); G.save.opts = { textSpeed: 'normal' };
    open([LONG]); step(1 / 60);
    c.font = dlgFont(G.dialog);
    const pages = G.dialog._pages;
    let widest = 0;
    for (const pgs of pages) for (const l of pgs) widest = Math.max(widest, c.measureText(l).width);
    out.pages = { n: pages.length, maxLines: Math.max.apply(null, pages.map(p => p.length)), minLines: Math.min.apply(null, pages.map(p => p.length)), widest, box: DLG_W,
      whole: pages.map(p => p.join(' ')).join(' ').replace(/\s+/g, ' ') === LONG.replace(/\s+/g, ' ') };
    // page through to the end with reader-paced presses
    let turns = 0;
    for (let k = 0; k < 40 && G.state === 'DIALOG'; k++) { run(0.4); step(1 / 60, 'Enter'); turns++; }
    out.pages.closed = G.state === 'PLAY'; out.pages.turns = turns;

    // A long name/URL following a normal word must wrap too, without loss.
    const longToken = 'https://example.invalid/' + 'abcdef'.repeat(60);
    const narrow = 180, text = 'See ' + longToken + ' now';
    const wrapped = wrapLines(c, text, narrow);
    out.longToken = { bounded: wrapped.every(l => c.measureText(l).width <= narrow),
      preserved: wrapped.join('').replace(/\s/g, '') === text.replace(/\s/g, '') };

    // ---- 5. Chinese wraps inside the box -----------------------------------
    fresh('zh');
    const ZH = '守护者们是最后倒下的。它们生来就是为了保护我们，所以那首歌得拼命压过它们——直到它们一个不剩，才再没有谁抵抗。被感染的歌让我们的邻居彼此为敌。那时你正在休眠充电，错过了那次广播。';
    open([ZH]); step(1 / 60);
    c.font = dlgFont(G.dialog);
    const zl = [].concat.apply([], G.dialog._pages);
    out.zh = { lines: zl.length, widest: Math.max.apply(null, zl.map(l => c.measureText(l).width)), box: DLG_W,
      noLeadPunct: zl.every((l, i) => i === 0 || '，。、；：！？）」'.indexOf(l[0]) < 0) };

    // ---- 6. Arabic: right edge, whole words --------------------------------
    fresh('ar'); G.save.opts = { textSpeed: 'slow' };
    const AR = 'الحرّاس سقطوا آخرًا. صُنعوا ليحمونا، فكان على الأغنية أن تصرخ فوقهم — واحتاجت إليهم جميعًا قبل أن يكفّ أحد عن المقاومة.';
    open([AR]);
    const words = new Set(AR.split(/\s+/));
    let partialOk = true, sawPartial = false;
    for (let k = 0; k < 40; k++) {
      update(1 / 20);
      const vis = revealLines(G.dialog._rv);
      G.dialog._rv.lines.forEach((full, li) => {
        const v = vis[li];
        if (!v || v === full) return;
        sawPartial = true;
        if (!full.startsWith(v)) partialOk = false;
        const last = v.split(/\s+/).pop();
        if (!words.has(last)) partialOk = false;       // a word cut in half
      });
    }
    const calls = [];
    const real = window.ftxt;
    window.ftxt = function (str, x, y, size, color, align) { calls.push({ str: String(str), x, align, dir: typeof isRTL === 'function' && isRTL() }); return real.apply(this, arguments); };
    revealSkip(G.dialog._rv);
    try { draw(performance.now()); } finally { window.ftxt = real; }
    const body = calls.filter(q => AR.indexOf(q.str) >= 0 && q.str.length > 8);
    out.ar = { partialOk, sawPartial, n: body.length, aligns: [...new Set(body.map(q => q.align))], xs: [...new Set(body.map(q => Math.round(q.x)))], rtl: body.every(q => q.dir) };
    LANG = 'en';

    // ---- 7. a card raised during a conversation waits ----------------------
    fresh('en'); G.save.opts = { textSpeed: 'instant' };
    open(['first conversation line', 'second conversation line']);
    const conv = G.dialog;
    const card = showItem('Volt Cell', 'a test card');
    const seen = [];
    let together = false;
    out.queue = { stillConv: G.dialog === conv, queued: OVERLAY_Q.length, cardReturned: !!card && card !== conv };
    for (let k = 0; k < 40 && (G.state === 'DIALOG' || OVERLAY_Q.length); k++) {
      if (G.dialog && seen[seen.length - 1] !== G.dialog) seen.push(G.dialog);
      if (G.dialog === conv && G.dialog === card) together = true;
      run(0.4); step(1 / 60, 'Enter');
    }
    out.queue.order = seen.map(d => d === conv ? 'conv' : d === card ? 'card' : '?').join(',');
    out.queue.together = together;
    out.queue.end = G.state;
    // direct assignment over an open conversation waits too
    open(['A']); const da = G.dialog; G.dialog = { name: 'B', lines: ['B'], i: 0 }; G.state = 'DIALOG';
    out.queue.assignKept = G.dialog === da && OVERLAY_Q.length === 1;
    overlayClear(); G.dialog = null; G.state = 'PLAY';
    // a card from the shop hands back to the shop
    G.state = 'SHOP'; const sc = showItem('Core', 'test');
    out.queue.shopCard = { state: G.state, ret: sc.ret };
    for (let k = 0; k < 10 && G.state === 'DIALOG'; k++) { run(0.4); step(1 / 60, 'Enter'); }
    out.queue.shopBack = G.state;
    G.state = 'PLAY';

    // ---- 8. instant and reduced motion -------------------------------------
    fresh('en'); G.save.opts = { textSpeed: 'instant', reduceMotion: false };
    open([LONG]); step(1 / 60);
    out.instant = revealDone(G.dialog._rv);
    G.dialog = null; G.state = 'PLAY';
    G.save.opts = { textSpeed: 'slow', reduceMotion: true };
    open([LONG]); step(1 / 60);
    out.reduced = revealDone(G.dialog._rv) && reduceMotion() && textCps() === Infinity;
    G.dialog = null; G.state = 'PLAY';
    G.save.opts = { textSpeed: 'slow' };
    open([LONG]); step(1 / 60);
    out.slowNotInstant = !revealDone(G.dialog._rv);
    G.dialog = null; G.state = 'PLAY';

    // ---- 9. story lines stay until acknowledged ----------------------------
    fresh('en'); G.save.opts = { textSpeed: 'normal' };
    G.toast(t('npc_woke').replace('%s', t('n_ratchet')));
    out.note = { state: G.state, note: !!(G.dialog && G.dialog.note), toasts: G.toasts.length };
    run(60);
    out.note.after60 = G.state === 'DIALOG' && !!G.dialog && G.dialog.note;
    for (let k = 0; k < 10 && G.state === 'DIALOG'; k++) { run(0.4); step(1 / 60, 'Enter'); }
    out.note.closed = G.state;
    G.toast(t('gh_marble'));
    out.gate1 = { state: G.state, note: !!(G.dialog && G.dialog.note) };
    for (let k = 0; k < 10 && G.state === 'DIALOG'; k++) { run(0.4); step(1 / 60, 'Enter'); }
    G.toast(t('gh_marble'));
    out.gate2 = { state: G.state, toast: G.toasts.some(q => q.text === t('gh_marble')), acked: !!(G.save.ackd && G.save.ackd.gh_marble) };
    // a long ordinary toast lives long enough to be read
    G.toasts = []; G.toast(LONG);
    out.toastLife = G.toasts[0] && G.toasts[0].t;
    // a staged scene that never takes her controls narrates in a caption that
    // stays until read, and the scene waits on it (the guardian's break)
    G.toasts = []; G.dialog = null; G.state = 'PLAY';
    G.toast(t('nf_break1'));
    out.scene = { state: G.state, cap: (G.sceneCaps || []).length === 1, toasts: G.toasts.length };
    run(1);
    out.scene.typing = !sceneCaptionShown();
    run(3);
    out.scene.at4 = (G.sceneCaps || []).length === 1 && sceneCaptionShown() && !sceneCaptionRead();
    G.toast(t('nf_break2'));                     // a second line stacks, the first is not replaced
    out.scene.stacked = (G.sceneCaps || []).length === 2;
    run(30);
    out.scene.gone = !(G.sceneCaps || []).length && sceneCaptionRead();

    // ---- 10. a refusal inside the shop is visible --------------------------
    fresh('en');
    G.state = 'SHOP'; G.shopIdx = SHOP.findIndex(s => s.type === 'cell'); G.save.scrap = 0;
    keysP.Enter = 1; keys.Enter = 1; updateShop(); keysP.Enter = 0; keys.Enter = 0;
    const said = [];
    const real2 = window.ftxt;
    window.ftxt = function (str) { said.push(String(str)); return real2.apply(this, arguments); };
    try { draw(performance.now()); } finally { window.ftxt = real2; }
    out.shopNo = { msg: G.menuMsg && G.menuMsg.text, drawn: said.some(s => G.menuMsg && G.menuMsg.text.indexOf(s) === 0 && s.length > 3) };
    G.state = 'PLAY';

    // ---- 11. the world is frozen while it is open --------------------------
    fresh('en'); loadRoom('A0');
    G.wake = null; G.state = 'PLAY';
    const foe = G.enemies.find(e => e && !e.dead);
    const px = player.x, ex = foe ? foe.x + ',' + foe.y : '';
    const tm = G.save.time;
    G.toast(t('story_need_blade'));
    player.vx = 300;
    run(2);
    out.frozen = { state: G.state, player: player.x === px, foe: !foe || (foe.x + ',' + foe.y) === ex, time: G.save.time === tm };
    G.dialog = null; G.state = 'PLAY';

    // ---- 12. the options ----------------------------------------------------
    fresh('en'); G.save.opts = {};
    G.state = 'PAUSE';
    const ids = pauseLayout().items.map(x => x.id);   // navigation order
    out.opts = { tspd: ids.indexOf('tspd') >= 0, rmot: ids.indexOf('rmot') >= 0 };
    // with every row a phone adds, the rows keep a readable pitch (two columns)
    { const te = TOUCH.enabled; TOUCH.enabled = true; const PL = pauseLayout(); TOUCH.enabled = te;
      out.opts.pitch = PL.step; out.opts.rows = PL.items.length; }
    G.pauseIdx = ids.indexOf('tspd');
    keysP.ArrowRight = 1; updatePause(); keysP.ArrowRight = 0;
    out.opts.afterRight = G.save.opts.textSpeed;
    keysP.Enter = 1; updatePause(); keysP.Enter = 0;
    out.opts.afterOk = G.save.opts.textSpeed;
    out.opts.stillPause = G.state === 'PAUSE';
    G.pauseIdx = ids.indexOf('rmot');
    const before = reduceMotion();
    keysP.ArrowLeft = 1; updatePause(); keysP.ArrowLeft = 0;
    out.opts.rmToggled = reduceMotion() === !before;
    const stored = JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)) || '{}');
    out.opts.persisted = !!(stored.opts && stored.opts.textSpeed === G.save.opts.textSpeed && stored.opts.reduceMotion === G.save.opts.reduceMotion);
    G.state = 'PLAY';

    // ---- 13. the held stills wait for the caption --------------------------
    fresh('en'); G.save.opts = { textSpeed: 'normal' };
    G.cine = { i: 0, t: 0 }; G.state = 'CINE';
    run(20);
    out.cine = { i: G.cine && G.cine.i, state: G.state, done: G.cine && G.cine.cr && revealDone(G.cine.cr.R) };
    G.cine.cr.R.shown = 0; G.cine.cr.R.doneAt = -1;   // as if just arrived
    step(1 / 60, 'Enter');
    out.cine.firstPress = { i: G.cine.i, done: revealDone(G.cine.cr.R) };
    run(0.4); step(1 / 60, 'Enter');
    out.cine.secondPress = G.cine && G.cine.i;
    G.cine = null; G.state = 'PLAY';
    return out;
  });

  check('1. the page types out over time', r.type.a1 > 0 && r.type.a2 > r.type.a1 && r.type.a1 < r.type.pg0 && !r.type.done,
    `${r.type.a1} -> ${r.type.a2} of ${r.type.pg0}`);
  check('2. the first press reveals the whole page...', r.press1.done && r.press1.len === r.press1.pg0, JSON.stringify(r.press1));
  check('...and does not turn it', r.press1.pg === 0 && r.press1.i === 0);
  check('...a second, separate press turns it', r.press2.pg === 1 || r.press2.i === 1, JSON.stringify(r.press2));
  check('3. attack mashed every frame for 3 s turns nothing', r.mashFrame.pg === 0 && r.mashFrame.i === 0, JSON.stringify(r.mashFrame));
  check('...mashed every 100 ms for 3 s turns nothing', r.mash100.pg === 0 && r.mash100.i === 0, JSON.stringify(r.mash100));
  check('...held for 3 s turns nothing', r.held.pg === 0 && r.held.i === 0, JSON.stringify(r.held));
  check('...a deliberate press after a pause does', r.deliberate.pg === 1 || r.deliberate.i === 1, JSON.stringify(r.deliberate));
  check('...a swing landing as the box opens is eaten by the grace', r.grace.i === 0, JSON.stringify(r.grace));
  check('4. a long speech is cut into pages', r.pages.n >= 2, r.pages.n + ' pages');
  check('...of at most four lines, none a lone stray line', r.pages.maxLines <= 4 && r.pages.minLines >= 2, r.pages.minLines + '..' + r.pages.maxLines);
  check('...every line inside the box', r.pages.widest <= r.pages.box, Math.round(r.pages.widest) + ' <= ' + r.pages.box);
  check('...with nothing lost between pages', r.pages.whole);
  check('...and read through to the end it closes', r.pages.closed, r.pages.turns + ' presses');
  check('long tokens after ordinary text fit and retain every character', r.longToken.bounded && r.longToken.preserved);
  check('5. Chinese wraps inside the box', r.zh.lines >= 2 && r.zh.widest <= r.zh.box, r.zh.lines + ' lines, widest ' + Math.round(r.zh.widest));
  check('...and no line starts with closing punctuation', r.zh.noLeadPunct);
  check('6. Arabic is typed whole words at a time', r.ar.sawPartial && r.ar.partialOk);
  check('...drawn right-aligned at the column\'s right edge, right to left', r.ar.n > 0 && r.ar.aligns.join() === 'right' && r.ar.xs.length === 1 && r.ar.rtl,
    JSON.stringify({ n: r.ar.n, aligns: r.ar.aligns, xs: r.ar.xs }));
  check('7. a card raised mid-conversation waits: the conversation stays', r.queue.stillConv && r.queue.queued === 1 && r.queue.cardReturned, JSON.stringify(r.queue));
  check('...both appear, in order', r.queue.order === 'conv,card', r.queue.order);
  check('...never together', !r.queue.together && r.queue.end === 'PLAY');
  check('...a dialogue assigned over an open one waits its turn', r.queue.assignKept);
  check('...a card bought in the shop hands back to the shop', r.queue.shopCard.state === 'DIALOG' && r.queue.shopCard.ret === 'SHOP' && r.queue.shopBack === 'SHOP',
    JSON.stringify(r.queue.shopCard) + ' -> ' + r.queue.shopBack);
  check('8. Instant shows the page at once', r.instant);
  check('...Reduced motion does too, whatever the speed', r.reduced);
  check('...and Slow does not', r.slowNotInstant);
  check('9. a story line is a card, not a toast', r.note.state === 'DIALOG' && r.note.note && r.note.toasts === 0, JSON.stringify(r.note));
  check('...still there after sixty seconds untouched', r.note.after60);
  check('...and closes when read', r.note.closed === 'PLAY');
  check('...a locked door\'s instruction is a card the first time', r.gate1.state === 'DIALOG' && r.gate1.note);
  check('...and a reminder after it was acknowledged', r.gate2.state === 'PLAY' && r.gate2.toast && r.gate2.acked, JSON.stringify(r.gate2));
  check('...a long toast lives long enough to read', r.toastLife > 15, r.toastLife && r.toastLife.toFixed(1) + ' s');
  check('...a scene\'s narration is a caption that leaves her the controls', r.scene.state === 'PLAY' && r.scene.cap && r.scene.toasts === 0, JSON.stringify(r.scene));
  check('...typed out first (the scene waits on that)', r.scene.typing);
  check('...then held on screen until read', r.scene.at4);
  check('...a second line stacks under it rather than replacing it', r.scene.stacked);
  check('...then it goes', r.scene.gone);
  check('10. a shop refusal is said inside the shop', !!r.shopNo.msg && r.shopNo.drawn, JSON.stringify(r.shopNo));
  check('11. the world is frozen under a story card', r.frozen.state === 'DIALOG' && r.frozen.player && r.frozen.foe && r.frozen.time, JSON.stringify(r.frozen));
  check('12. pause carries Text speed and Reduced motion', r.opts.tspd && r.opts.rmot);
  check('...and with a phone\'s rows the menu keeps a readable pitch', r.opts.pitch >= 26, r.opts.rows + ' rows at ' + r.opts.pitch + ' px');
  check('...RIGHT and OK cycle the speed and the row stays open', r.opts.afterRight === 'fast' && r.opts.afterOk === 'instant' && r.opts.stillPause, JSON.stringify(r.opts));
  check('...Reduced motion toggles', r.opts.rmToggled);
  check('...and both persist in the save', r.opts.persisted);
  check('13. the held still waits twenty seconds for its reader', r.cine.i === 0 && r.cine.state === 'CINE' && r.cine.done, JSON.stringify(r.cine));
  check('...the first press finishes the caption without turning the shot', r.cine.firstPress.i === 0 && r.cine.firstPress.done, JSON.stringify(r.cine.firstPress));
  check('...the next press turns it', r.cine.secondPress === 1, String(r.cine.secondPress));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every page is typed, read and turned on purpose, and nothing takes the screen over anything else'));
  process.exit(fails.length ? 1 : 0);
})();
