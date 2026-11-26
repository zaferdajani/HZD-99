// THE SHOP ASKS FIRST, CANNOT BE BOUGHT FROM BY ACCIDENT, AND SAYS WHAT TO BUY.
// Owner, 2026-11-16: "when you open the Ratchet's Emporium... I have no idea
// what to get... You should mark the thing they want me to buy"; "it happened
// again... suddenly the window opened... I did not know what to do and what to
// purchase, so I purchased everything. And also, most of the things he has is
// affordable"; "bosses... I should get a scrap after I defeat them".
//   A  a conversation that ends with the key down opens a QUESTION, not a shelf
//   B  mashing that key on the question buys nothing
//   C  on the shelf one row is marked as Ratchet's pick, with a reason
//   D  she cannot afford the whole shelf with what a first visit carries
//   E  a guardian that goes — purified or not — pays scrap
//   F  every line the shelf draws clears the key hint and every other row (2026-11-26)
const { chromium } = require("playwright");
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? "ok   " : "FAIL ") + n + (d != null ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); if (!ok) bad++; };
const open = async () => { const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" }); const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: "block" }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.goto("http://127.0.0.1:" + PORT + "/index.html", { waitUntil: "domcontentloaded" }); await page.waitForFunction(() => typeof startGame === "function", { timeout: 20000 }); return { browser, page, errs }; };

(async () => { const { browser, page, errs } = await open();
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; sv.scrap = 632; Object.assign(sv.flags, { tut: 1, woke: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(sv);
    loadRoom('A0B'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = null;
    const own = () => JSON.stringify([G.save.scrap, G.save.crests.length, Object.keys(G.save.abil).length, (G.save.skills || []).length]);
    keys.Enter = 1; keysP.Enter = 1; shopOpen(true); const o0 = own();
    out.A = { state: G.state, ask: !!G.shopAsk };
    for (let i = 0; i < 120; i++) { if (i % 5 === 0) keysP.Enter = 1; update(1 / 60); keysP.Enter = 0; }
    out.B = { same: own() === o0, state: G.state, ask: !!G.shopAsk };
    keys.Enter = 0; keysP.Enter = 0; for (let i = 0; i < 12; i++) update(1 / 60);
    keysP.Enter = 1; keys.Enter = 1; update(1 / 60); keysP.Enter = 0; keys.Enter = 0; for (let i = 0; i < 40; i++) update(1 / 60);
    const pk = shopPick(); out.C = { ask: !!G.shopAsk, state: G.state, pick: pk ? pk.it.id : null, why: pk ? shopWhyLine(pk) : null, idx: G.shopIdx, same: own() === o0 };
    // the picture: the pick's row is not drawn like the others
    const cv = document.querySelector('canvas'); for (let i = 0; i < 3; i++) draw(performance.now());
    const items = SHOP;
    const costs = items.map(it => shopCost(it)); const up = costs.filter(v => v >= 100);   // (the upgrades; a cell or a patch is pocket change by design)
    out.D = { n: costs.length, upgrades: up.length, total: costs.reduce((a, b) => a + b, 0), min: Math.min.apply(null, up), max: Math.max.apply(null, costs), purse: 632 };
    out.E = { alpha: bossScrap({ kind: 'alpha' }), horn: bossScrap({ kind: 'horn' }), lion: bossScrap({ kind: 'glitch' }) };
    // touch: the question's two buttons exist and LATER closes it
    shopOpen(true); const bs = shopAskButtons(); const later = bs.find(b => b.key === 'shop_later'); shopAskTap(later.x + 5, later.y + 5); out.T = { n: bs.length, state: G.state, ask: !!G.shopAsk };
    // F: EVERY LINE THE SHELF DRAWS CLEARS THE OTHERS (reviewed 2026-11-26: the last rows sat on the
    // key hint). Each drawn line's box, measured off the canvas font as drawn, in every language,
    // on Ratchet's shelf at three rungs of the pack and on the Tinker's: no row's line touches the
    // hint, no line of one row touches a line of another, and all of it is inside 960x540 (the
    // phone draws the same 960x540 frame, scaled).
    out.F = { overlaps: [], outside: [], rows: 0 };
    const keepF = window.ftxt, boxes = [];
    window.ftxt = function (str, x, y, size, color, align) {
      c.font = '700 ' + size + 'px "Segoe UI", Tahoma, sans-serif';
      const w = c.measureText(String(str)).width, a = align || 'center';
      boxes.push({ s: String(str), x: a === 'left' ? x : a === 'right' ? x - w : x - w / 2, y: y - size / 2, w, h: size });
      return keepF.apply(this, arguments);
    };
    const keepL = LANG;
    try {
      for (const L of ['en', 'ar', 'tr', 'zh', 'ru']) for (const st of [['ratchet', 0], ['ratchet', 1], ['ratchet', 3], ['patch', 3]]) {
        LANG = L; G.save.arms = st[1] ? ['pack'] : []; G.save.packLv = st[1]; G.save.flags.wolfMount = st[0] === 'patch' ? 1 : 0;
        shopOpen(false, st[0]); G.shopAsk = false; boxes.length = 0; drawShop();
        const hint = boxes.find(b => b.s === t('shop_hint'));
        const rowOf = (b) => Math.round((b.y + b.h / 2 - SHOP_ROW.y0) / SHOP_ROW.step);
        const lines = boxes.filter(b => b !== hint && b.y + b.h / 2 > SHOP_ROW.y0 - SHOP_ROW.step / 2);
        out.F.rows = Math.max(out.F.rows, shopList().length);
        const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (const b of boxes) if (b.x < 0 || b.y < 0 || b.x + b.w > 960 || b.y + b.h > 540) out.F.outside.push(L + ' ' + st + ' ' + b.s);
        for (const b of lines) if (hint && hit(b, hint)) out.F.overlaps.push(L + ' ' + st + ' "' + b.s + '" x hint');
        for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++)
          if (rowOf(lines[i]) !== rowOf(lines[j]) && hit(lines[i], lines[j])) out.F.overlaps.push(L + ' ' + st + ' "' + lines[i].s + '" x "' + lines[j].s + '"');
      }
    } finally { window.ftxt = keepF; LANG = keepL; G.state = 'PLAY'; }
    return out; });
  console.log('── shop-ask  — the shop asks before it opens, a held key buys nothing, and Ratchet marks what to buy');
  check('A  the shop opens as a question', R.A.state === 'SHOP' && R.A.ask === true, R.A);
  check('B  two seconds of the mashed key on the question buys nothing', R.B.same === true, R.B);
  check('C  the shelf marks one row as his pick, and says why', R.C.ask === false && !!R.C.pick && !!R.C.why && R.C.why.length > 8 && R.C.same, R.C);
  check('D  a first purse does not buy the shelf', R.D.upgrades >= 5 && R.D.total > R.D.purse * 3 && R.D.min >= 250, R.D);
  check('E  a guardian that goes pays scrap', R.E.alpha >= 60 && R.E.horn >= 60 && R.E.lion > R.E.alpha, R.E);
  check('F  every line on the shelf clears the key hint and the other rows, inside 960x540, in every language, on both shelves', R.F.rows >= 10 && R.F.overlaps.length === 0 && R.F.outside.length === 0, { rows: R.F.rows, overlaps: R.F.overlaps.slice(0, 6), outside: R.F.outside.slice(0, 4) });
  check('   touch: the question has two buttons and LATER closes it', R.T.n === 2 && R.T.state === 'PLAY' && !R.T.ask, R.T);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — the shop asks, guards and guides'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
