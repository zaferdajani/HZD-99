// A PURIFIED MACHINE GIVES SOMETHING BACK.
// Owner, 2026-11-16: "freeing the robots should grant me something in return...
// find one NPC that when I free will give me something that makes me want to
// free the others." And: "it should be purifying, not freeing."
//   A  the first machine she purifies gives a CORE she keeps, on a card that
//      says so
//   B  every purification after it says the count, and how many to the next
//      gift — the reason to do the next one is on the screen
//   C  the ladder pays again at 3 (scrap) and 6 (a second core)
//   D  nothing pays twice: a machine already purified cannot be purified again
//   E  the words are PURIFY, in every language the game speaks
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = { steps: [] };
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); startGame(sv); grantWeapon('single');
    loadRoom('A1'); G.state = 'PLAY'; G.dialog = G.wake = G.cut = null; G.enemies = [];
    const toasts = []; const t0 = G.toast; G.toast = function (m) { toasts.push(String(m)); return t0.apply(this, arguments); };
    const cards = []; const s0 = window.showItem; window.showItem = function (n, d) { cards.push([String(n), String(d)]); G.dialog = null; };
    const one = (i) => { const e = new Enemy('crawler', 300 + i * 20, 300); e.storyKey = 'T:' + i + ':crawler'; e.disabled = true; e.hp = 1; G.enemies.push(e);
      const before = { cores: G.save.coresMax, scrap: G.save.scrap, cards: cards.length, toasts: toasts.length };
      e.finishCleanse();
      const again = { cores: G.save.coresMax, scrap: G.save.scrap }; e.disabled = true; e.finishCleanse();
      return { n: i, dCores: again.cores - before.cores, dScrap: again.scrap - before.scrap, card: cards.length > before.cards ? cards[cards.length - 1] : null, toast: toasts.length > before.toasts ? toasts[toasts.length - 1] : null,
        twice: G.save.coresMax !== again.cores || G.save.scrap !== again.scrap, rescued: e.rescued === true }; };
    for (let i = 1; i <= 6; i++) out.steps.push(one(i));
    out.count = Object.keys(G.save.rescues).filter(k => G.save.rescues[k] === 'rescued').length;
    out.words = {}; const L0 = LANG;
    for (const L of ['en', 'ar', 'tr', 'zh', 'ru']) { LANG = L; out.words[L] = { first: t('pure_first'), next: t('pure_next'), freed: t('pg_freed'), goal: t('pg_goal_sage') }; }
    LANG = L0; G.toast = t0; window.showItem = s0; return out; });
  console.log('── pure-gift  — a purified machine gives something back, and says what the next one is worth');
  const S = R.steps, s = (n) => S[n - 1];
  // (LIVES ARE A SAGE'S, owner 2026-11-20: "Getting extra lives should be only
  // rewarded when you defeat a sage. Not everywhere." The ladder pays scrap)
  check('A  the first purification gives something back — scrap, never a life', s(1).dCores === 0 && s(1).dScrap > 0 && s(1).card && s(1).card[0].length > 3, s(1));
  check('B  the second says the count and how many to the next gift', s(2).dCores === 0 && !s(2).card && s(2).toast && /2/.test(s(2).toast) && /3/.test(s(2).toast), s(2).toast);
  check('   ...and every one still pays its scrap', S.every(q => q.dScrap >= 14), S.map(q => q.dScrap).join(','));
  check('C  at three the purified pool their scrap', s(3).card && s(3).dScrap >= 120 && s(3).dCores === 0, { dScrap: s(3).dScrap, card: s(3).card && s(3).card[0] });
  check('   ...and at six more, still no life', s(6).dCores === 0 && !!s(6).card, { dCores: s(6).dCores });
  check('   ...each card names the next rung', [1, 3].every(n => /\d/.test(s(n).card[1])), [s(1).card[1], s(3).card[1]]);
  check('D  nothing pays twice', S.every(q => !q.twice && q.rescued) && R.count === 6, { count: R.count });
  const W = R.words, langs = Object.keys(W);
  check('E  the lines exist in five languages', langs.length === 5 && langs.every(L => W[L].first !== 'pure_first' && W[L].next !== 'pure_next' && W[L].next.includes('%n')), langs.map(L => L + ': ' + W[L].first).join(' | '));
  check('   ...and the English says PURIFIED, never freed', /PURIFIED/.test(W.en.first) && W.en.freed === 'PURIFIED' && /Purify/.test(W.en.goal) && !/free/i.test(W.en.first + W.en.next + W.en.goal), W.en);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — purifying pays, and says so'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
