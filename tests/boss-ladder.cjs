// THE BOSS LADDER — the rhino is the floor; every fight after it is harder, climbing in the kingdom's order.
//
// Owner, 2026-11-24: "Rhino is the hardest boss, even though it's the first mini boss, which means
// all the next ones need to be harder, especially the agent... Lion also needs to be flashier and
// harder... decrease the openings for hitting those bosses. And Lion needs to be even harder than
// Rhino. Start with the Rhino as the reference. All the others should be harder in relation to
// Rhino until we reach the first sage, the lion, Nilfang."
//
// Five player agents played every chapter-one boss with one recorder (tests/gauntlet/lib.cjs: the
// same metrics for every boss, and a human's 250 ms reaction — a bot decides on the boss as it was
// 15 frames ago). Their bots are kept in tests/gauntlet/bots/. Before the change a walk-in-and-press-
// attack bot killed NULLFANG in 4.4 s and broke the agent in 15 s untouched, and died to the rhino.
// She meets the rhino before the forge (claws); every fight after it with the Purifier, as the real
// game has her.
//   A  THE FLOOR: the rhino's skilled player wins, and the masher dies
//   B  nothing after it falls to the masher, or to bouncing on its back
//   C  every fight after it costs the skilled player more than the rhino did: a lower win rate or
//      more cores lost — and its openings are shorter (openShare below the rhino's)
//   D  THE ORDER she plays: rhino -> the agent -> CHIME -> NULLFANG climbs for the skilled player, and
//      NULLFANG, the first sage, is open the least of all of them
//   E  healing between trades does not carry anyone through a fight after the rhino
//   F  no page errors, no bot errors
const path = require('path');
const { chromium } = require('playwright');
const { fight } = require('./gauntlet/lib.cjs');
const BOT = n => require(path.join(__dirname, 'gauntlet', 'bots', n + '.cjs')).bot;
const SINGLE = (src) => `(() => { const inner = ${src}; return (bo, P, ctx) => { if (!ctx.__w) { ctx.__w = 1; if (G.save) G.save.weaponMode = 'single'; } return inner(bo, P, ctx); }; })()`;
const SEEDS = (process.env.LADDER_SEEDS || '1,2,3').split(',').map(Number);
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const run = async (boss, bot, seeds) => { const src = boss === 'horn' ? BOT(bot) : SINGLE(BOT(bot)); const rs = [];
    for (const seed of seeds) rs.push(await fight({ boss, seed, bot: src, secs: 150, browser })); return rs; };
  const sum = rs => ({ won: rs.filter(r => r.won).length, n: rs.length, cores: +(rs.reduce((s, r) => s + r.coresLost, 0) / rs.length).toFixed(1),
    open: +(rs.reduce((s, r) => s + r.openShare, 0) / rs.length).toFixed(2), secs: rs.filter(r => r.won).map(r => r.secs), left: rs.map(r => r.bossHp.split(' ')[0]),
    errs: [...new Set(rs.flatMap(r => r.pageErrors.concat(r.botError ? [r.botError] : [])))] });
  console.log('── boss-ladder — the rhino is the floor, every fight after it is harder, climbing in the kingdom\'s order');
  const R = {};
  R.horn = { skilled: sum(await run('horn', 'horn_skilled', SEEDS)), mash: sum(await run('horn', 'horn_mash', SEEDS.slice(0, 2))) };
  const LATER = { tally: ['tally_skilled', 'tally_aggressive', 'tally_mash'], chime: ['chime_skilled', null, 'chime_mash'],
    alpha: ['alpha_skilled', null, 'alpha_mash'], glitch: ['glitch_skilled', 'glitch_poke', 'glitch_mash'] };
  for (const b in LATER) { const [sk, alt, mash] = LATER[b];
    R[b] = { skilled: sum(await run(b, sk, SEEDS)), mash: sum(await run(b, mash, SEEDS.slice(0, 2))), pogo: sum(await run(b, 'any_pogo', SEEDS.slice(0, 2))),
      heal: sum(await run(b, 'any_healtrade', SEEDS.slice(0, 2))) };
    if (alt) R[b].alt = sum(await run(b, alt, SEEDS)); }
  if (process.env.LADDER_PRINT) console.log(JSON.stringify(R, null, 1));
  const H = R.horn.skilled;
  check('A  the floor: the rhino\'s skilled player wins', H.won >= Math.ceil(H.n * 2 / 3), H);
  check('   ...and the masher dies to him', R.horn.mash.won === 0, R.horn.mash);
  const NAME = { tally: 'the agent', chime: 'CHIME', alpha: 'the Wolf King', glitch: 'NULLFANG' };
  for (const b in LATER) { const X = R[b], N = NAME[b];
    check('B  ' + N + ': the masher never wins', X.mash.won === 0, X.mash);
    check('   ' + N + ': bouncing on its back never wins', X.pogo.won === 0, X.pogo);
    const best = [X.skilled].concat(X.alt ? [X.alt] : []);
    const harder = best.every(s => s.won / s.n < H.won / H.n || s.cores >= H.cores + 2);
    check('C  ' + N + ': harder than the rhino for a skilled player (fewer wins, or two more cores lost)', harder, best.map(s => s.won + '/' + s.n + ' won, ' + s.cores + ' cores').join(' | ') + '  (rhino ' + H.won + '/' + H.n + ', ' + H.cores + ')');
    check('   ' + N + ': open less than the rhino', X.skilled.open < H.open - 0.15, { open: X.skilled.open, rhino: H.open });
    check('E  ' + N + ': healing between trades does not carry a player through it', X.heal.won <= 1, X.heal); }
  // THE ORDER SHE PLAYS THEM IN (tests/campaign-ch1.cjs's missions): GRAVEHORN -> the agent (GA1D,
  // straight after the forge) -> CHIME -> NULLFANG, "until we reach the first sage, the lion" (the
  // owner, 2026-11-24). It climbs: no fight is easier for the skilled player than the one before it —
  // a win rate never rises, and at the same rate the cores lost never fall. (The Wolf King is off this
  // road; B, C and E hold him.)
  // docs/STORY_CANON.md orders the kingdom rhino -> NULLFANG -> the Wolf King -> "that agent"; the game
  // does not yet. This checked the canon order until 2026-11-25, and passing it made the agent, the
  // SECOND fight she meets, the hardest of all: the chapter bot died forty times to it. Which order is
  // the owner's to say; until he does, the order she plays is the one that is measured, and the
  // canon order is printed beside it.
  const ORDER = [['the rhino', R.horn.skilled], ['the agent', R.tally.skilled], ['CHIME', R.chime.skilled], ['NULLFANG', R.glitch.skilled]];
  const CANON = [['the rhino', R.horn.skilled], ['NULLFANG', R.glitch.skilled], ['the Wolf King', R.alpha.skilled], ['the agent', R.tally.skilled]];
  console.log('info the canon order, for the owner: ' + CANON.map(q => q[0] + ' ' + q[1].won + '/' + q[1].n + ' ' + q[1].cores).join('  ->  '));
  const climbs = ORDER.every((q, i) => i === 0 || (q[1].won / q[1].n < ORDER[i - 1][1].won / ORDER[i - 1][1].n - 1e-9)
    || (Math.abs(q[1].won / q[1].n - ORDER[i - 1][1].won / ORDER[i - 1][1].n) < 1e-9 && q[1].cores >= ORDER[i - 1][1].cores));
  check('D  the ladder climbs in the order she plays it: no fight easier for a skilled player than the one before it', climbs, ORDER.map(q => q[0] + ' ' + q[1].won + '/' + q[1].n + ' ' + q[1].cores).join('  ->  '));
  const G2 = R.glitch.skilled;
  check('   ...and NULLFANG, the first sage, is open the least of them all', ['tally', 'chime', 'alpha'].every(b => G2.open <= R[b].skilled.open + 0.03), { nullfang: G2.open, others: ['tally', 'chime', 'alpha'].map(b => R[b].skilled.open) });
  const errs = Object.values(R).flatMap(x => Object.values(x).flatMap(s => s.errs));
  check('F  no page errors and no bot errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the rhino is the floor and the ladder climbs');
})().catch(e => { console.error(e); process.exit(1); });
