// THE UNDERDOG ARC, MEASURED (.claude/skills/underdog-arc).
//
// Four things make growth felt, and three of them are authored rather than
// mechanical — which is exactly the kind of thing that reads fine in the
// source and silently stops happening: a key that falls back to English, a
// tier that rises three rooms after the fight, a line said to nobody. So:
//
//   the world says what it makes of her, in every language, at every tier;
//   her silhouette changes ON the victory frame, and the card waits for the cut;
//   a death is a beat — a line under the toll, and the trader noticing;
//   the Braid is on the pause screen, not only behind its own button.
//
//   node tests/arc.cjs
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
  console.log('── arc — the world notices, she changes on the victory, a death is a beat');

  const r = await page.evaluate(() => {
    const out = {};
    // ---- 1. eighteen standing lines, the death beat and the rematch, in every language
    const npcs = ['servo', 'ratchet', 'mono', 'lumen', 'patch', 'sage', 'kerf'];
    const keys = [];
    for (const n of npcs) for (let i = 0; i < 3; i++) keys.push('sl_' + n + '_' + i);
    keys.push('death_1', 'death_2', 'death_3', 'sl_back', 'pm_world', 'sl_ratchet_rematch');
    out.langs = LANGS.map(l => l.id);
    out.missing = [];
    for (const l of out.langs) for (const k of keys)
      if (!(I18N[l] && I18N[l][k])) out.missing.push(l + ':' + k);
    // ...and no language quietly says the English one
    out.sameAsEn = [];
    for (const l of out.langs) if (l !== 'en') for (const k of keys)
      if (I18N[l] && I18N[l][k] && I18N[l][k] === I18N.en[k]) out.sameAsEn.push(l + ':' + k);

    // ---- 2. the tier is the war: 0 / 1 / 3 / 5 guardians
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; startGame(sv); loadRoom('A3');
    G.dialog = null; G.state = 'PLAY';
    G.save.evo = 0;
    out.tier0 = evoTier();
    G.save.flags.bossGlitch = 1; out.tier1 = evoTier();
    G.save.flags.bossBrood = 1; G.save.flags.bossAtlas = 1; out.tier3 = evoTier();
    G.save.flags.bossZero = 1; G.save.flags.bossPrism = 1; out.tier5 = evoTier();
    delete G.save.flags.bossGlitch; delete G.save.flags.bossBrood; delete G.save.flags.bossAtlas;
    delete G.save.flags.bossZero; delete G.save.flags.bossPrism;
    G.save.evo = 0;
    // the victory frame: the guardian is falling NOW, its flag has not landed
    let stung = 0; const sfx0 = window.sfx;
    window.sfx = (k) => { if (k === 'evoSting') stung++; return sfx0(k); };
    checkEvo(1, true);
    window.sfx = sfx0;
    out.evoOnFrame = G.save.evo === 1 && stung === 1;
    out.cardHeld = G.save.evoCard === 1 && G.state === 'PLAY';
    // ...and the card comes when the flag lands, and only once
    G.save.flags.bossGlitch = 1; checkEvo();
    out.cardShown = G.state === 'DIALOG' && !!G.dialog && G.dialog.lines.some(l => l.indexOf(t('evo1')) >= 0);
    G.dialog = null; G.state = 'PLAY';
    checkEvo(); out.cardOnce = G.state === 'PLAY' && !G.save.evoCard;
    out.tierHeld = evoTier() === 1;

    // ---- 3. a death is a beat
    const d0 = G.save.deaths || 0;
    G.onPlayerDeath();
    out.deathLine = typeof G.deathLine === 'string' && G.deathLine.length > 8 && G.deathLine.indexOf('death_') !== 0;
    out.deathCounted = G.save.deaths === d0 + 1;
    out.braidFell = !!(braid().fell >= 1 && braid().worst);
    G.state = 'PLAY';
    // the pause and the death screens draw without throwing
    let drew = true;
    try { G.state = 'DEAD'; G.deadT = 0.5; draw(); G.state = 'PAUSE'; draw(); } catch (e) { drew = String(e); }
    G.state = 'PLAY';
    out.drew = drew;
    // ...and the trader notices, once per death
    const npc = G.statics.find(s => s.type === 'npc' && s.extra === 'ratchet');
    out.trader = !!npc;
    if (npc) {
      G.save.flags['on_A3|ratchet'] = 1;
      delete G.save.flags.crystal; delete G.save.flags['sageTame_GA1D'];
      doInteract(npc);
      out.backLine = !!(G.dialog && G.dialog.lines[0] === t('sl_back'));
      G.dialog = null; G.state = 'PLAY';
      doInteract(npc);
      out.backOnce = !!(G.dialog && G.dialog.lines[0] !== t('sl_back'));
      G.dialog = null; G.state = 'PLAY';
      // the corridor's dent: after the meeting, before the rematch
      G.save.flags.nfMeet = 1; delete G.save.flags.bossGlitch;
      delete G.save.flags.said['sl_ratchet_rematch'];
      doInteract(npc);
      out.rematchLine = !!(G.dialog && G.dialog.lines[0] === t('sl_ratchet_rematch'));
      G.dialog = null; G.state = 'PLAY';
    }

    // ---- 4. the Braid on the pause screen
    const line = pauseWorldLine();
    const u = universe();
    out.worldLine = line;
    out.worldId = line.indexOf(u.id) >= 0;
    out.worldLaws = (u.anom || []).every(a => line.indexOf(BR_ANOM[a].n) >= 0);
    return out;
  });

  check('every language carries the eighteen standing lines, the death beat and the rematch',
    r.missing.length === 0, r.missing.slice(0, 6).join(',') || r.langs.join('/'));
  check('...and none of them is the English line wearing a flag', r.sameAsEn.length === 0, r.sameAsEn.slice(0, 6).join(','));
  check('the tier is the war: 0 / 1 / 3 / 5 guardians -> 0 / 1 / 2 / 3',
    r.tier0 === 0 && r.tier1 === 1 && r.tier3 === 2 && r.tier5 === 3, [r.tier0, r.tier1, r.tier3, r.tier5].join('/'));
  check('she grows ON the victory frame, before the flag lands', r.evoOnFrame);
  check('...and the card is held for the cut', r.cardHeld);
  check('...then shown once the guardian is recorded', r.cardShown);
  check('...and only once', r.cardOnce);
  check('...and the tier does not fall back while the flag is pending', r.tierHeld);
  check('a death writes its line under the toll', r.deathLine);
  check('...and is counted', r.deathCounted);
  check('...and the Braid keeps where she fell', r.braidFell);
  check('the death and pause screens draw', r.drew === true, r.drew === true ? '' : r.drew);
  check('the trader is in A3', r.trader);
  check('he says she came back', r.backLine);
  check('...once per fall', r.backOnce);
  check('...and names the dent in the corridor until the rematch', r.rematchLine);
  check('the pause screen carries the world code', r.worldId, r.worldLine);
  check('...and its laws', r.worldLaws);
  check('no page errors', errs.length === 0, errs.join(' | '));
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('\nOK — the world notices, she changes when it counts, and a fall is a sentence');
})();
