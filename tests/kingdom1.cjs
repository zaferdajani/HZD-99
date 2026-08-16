// KINGDOM 1, MEASURED — the kingdom protocol, driven live instead of trusted.
//
// The protocol (CLAUDE.md, KINGDOMS ARE THE UNIT) gives every kingdom a
// shape: an arc that ends at its sage, at least one NPC with an identity and
// a PLACE, at least one save point placed FOR the arc. Each of those is a
// thing that reads fine in the source and breaks silently in play — a bench
// that never catches a death, a terminal that still speaks the generic log,
// a standing line whose key never resolves — so this harness walks the
// meadow kingdom's own rules the way a player would meet them:
//
//   - the den (A0B) keeps a bench, resting there moves the save point, and a
//     death anywhere afterwards comes back under that roof (the fix for the
//     Alpha retry loop that used to respawn her five rooms back in W1)
//   - GA1's tunnel terminal reads the MEADOW page (t6) — the sage's story
//     told two rooms before she kneels in front of it — in both full
//     languages
//   - Servo's winding house is declared in A1 and his dialogue claims it
//   - Ratchet's standing line moves on the kingdom's own milestones: forged
//     points the blade underground, a tamed Meadow Sage is said out loud —
//     and both keys exist in ar and in the hero theme, so neither world ever
//     opens a dialog with a raw key on top
//
//   node tests/kingdom1.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── kingdom1 — the meadow kingdom holds its own rules');

  const m = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    startGame(sv);
    await new Promise(r => setTimeout(r, 400));
    G.wake = null; G.state = 'PLAY';

    // ---- 1. the den keeps a bench, and the bench catches the fall --------
    loadRoom('A0B');
    const bench = G.statics.find(s => s.type === 'bench');
    out.denBench = !!bench;
    if (bench) {
      doInteract(bench);                    // rest: the save point moves NOW
      out.benchRoom = G.save.bench.room;
      G.recharge = null; G.state = 'PLAY';
      loadRoom('A2');                       // die out in the meadow...
      respawn();                            // ...and the respawn must come home
      out.respawnRoom = G.roomId;
    }

    // ---- 2. the tunnel tells the sage's story, in both languages ---------
    loadRoom('GA1T');
    const term = G.statics.find(s => s.type === 'term');
    out.termPage = term && term.extra;
    out.t6en = !!(I18N.en.t6 && I18N.en.t6.length >= 3);
    out.t6ar = !!(I18N.ar.t6 && I18N.ar.t6.length >= 3);

    // ---- 3. Servo's place is declared and claimed ------------------------
    out.winch = !!(typeof ROOM_PROPS !== 'undefined' && ROOM_PROPS.A1
      && ROOM_PROPS.A1.some(p => p.kind === 'winch'));
    out.servoLine = I18N.en.d_servo.length >= 5 && /winding house/i.test(I18N.en.d_servo[4]);
    loadRoom('A1');                         // and its drawing survives real frames
    await new Promise(r => setTimeout(r, 300));

    // ---- 4. the trader's standing line moves on the kingdom's milestones -
    loadRoom('A3');
    const npc = G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
    out.trader = !!npc;
    if (npc) {
      G.save.flags['on_A3|ratchet'] = 1;    // lit, so he talks rather than asks for a cell
      G.save.flags.crystal = 1;             // the purifier is forged...
      G.state = 'PLAY'; doInteract(npc);
      out.forgedLine = !!(G.dialog && G.dialog.lines[0] === t('sl_ratchet_forged'));
      G.dialog = null; G.state = 'PLAY';
      G.save.flags['sageTame_GA1D'] = 1;    // ...and then the Meadow Sage stood up clean
      doInteract(npc);
      out.sageLine = !!(G.dialog && G.dialog.lines[0] === t('sl_ratchet_sage'));
      G.dialog = null; G.state = 'PLAY';
    }
    out.arKeys = !!(I18N.ar.sl_ratchet_forged && I18N.ar.sl_ratchet_sage && I18N.ar.t6);
    out.heroKeys = !!(THEMES.hero.i18n.en.sl_ratchet_forged && THEMES.hero.i18n.en.sl_ratchet_sage
      && THEMES.hero.i18n.ar.sl_ratchet_forged && THEMES.hero.i18n.ar.sl_ratchet_sage);
    return out;
  });

  check('the den keeps a bench', m.denBench);
  check('resting there moves the save point to the den', m.benchRoom === 'A0B', m.benchRoom);
  check('a death out in the meadow comes back under the roof', m.respawnRoom === 'A0B', m.respawnRoom);
  check('the tunnel terminal reads the meadow page, not the generic log', m.termPage === 6, 'page ' + m.termPage);
  check('…and the page exists in both full languages', m.t6en && m.t6ar);
  check("Servo's winding house is declared in A1", m.winch);
  check('…and his dialogue claims it', m.servoLine);
  check('the trader stands in his camp', m.trader);
  check('forged: his standing line points the blade underground', m.forgedLine);
  check('tamed: his standing line says the kingdom ended', m.sageLine);
  check('every new key resolves in ar and in the hero theme', m.arKeys && m.heroKeys);
  check('no page errors across den, tunnel, meadow and camp', errs.length === 0,
    errs.length ? errs[0].slice(0, 160) : '');

  await browser.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — kingdom 1 holds: a roof with a rest, a keeper with a place, an ending that is told');
})();
