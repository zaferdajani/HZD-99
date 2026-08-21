// THE BATTERY ARC, END TO END.
//
// The story: every machine person in the Depths was POWERED DOWN when the Song
// went out. That is why they were never infected, and it is why they have been
// standing in the dark ever since. She starts with one Power Cell. NULLFANG
// carries one. Each of the Eye's constructs is sitting on another. The supply
// is exactly the demand.
//
// Which means the whole arc rests on arithmetic that is invisible from the
// code: is there a cell for every dark unit, does the shop actually stay shut
// until the lion pays for it, can a cell be spent twice, does the hero world
// get gated by mistake. All of that is checked here, against the real build.
//
//   node tests/battery.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };

  console.log('── battery — the cells, the dark units, and the shop that waits for the lion');

  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  // ---- 1. SUPPLY EQUALS DEMAND -------------------------------------------
  // Counted from the world itself, not from a list somebody has to remember to
  // update: every ['npc',…] placement in ROOMS needs one cell, and the cells
  // come from the start, the guardians, and the Eye's constructs.
  const econ = await page.evaluate(() => {
    let npcs = 0, minis = 0, bosses = 0;
    for (const id in ROOMS) for (const e of (ROOMS[id].ents || [])) {
      if (e[0] === 'npc') npcs++;
      if (e[0] === 'boss' && MINIS[e[3]]) minis++;
      if (e[0] === 'boss' && !MINIS[e[3]]) bosses++;
    }
    const sv = newSave(1);
    return { npcs, minis, bosses, start: (sv.items && sv.items.batt) || 0 };
  });
  const supply = econ.start + econ.minis + 1;      // +1: NULLFANG's own cell
  check('a cell exists for every dark unit (' + econ.npcs + ' units)',
    supply >= econ.npcs,
    econ.start + ' start + ' + econ.minis + ' constructs + 1 lion = ' + supply);
  check('and no more than two spare, or the choice is not one',
    supply - econ.npcs <= 2, 'surplus ' + (supply - econ.npcs));

  // ---- 2. A DARK UNIT IS INERT, AND ONE CELL WAKES ONE UNIT --------------
  const hand = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv); loadRoom('A0B');   // the trader lives in his booth den now
    await new Promise(r => requestAnimationFrame(r));
    const sp = G.statics.find(s => s.type === 'npc');
    const key = npcKey(sp);
    const before = { live: npcLive(sp), batt: invCount('batt') };
    // the shop must NOT open from a dark trader — that is the whole gate
    doInteract(sp);
    const askedState = G.state;
    const linesWhileDark = (G.dialog && G.dialog.lines.length) || 0;
    // walking the dialog to its end is the player's implicit yes
    const end = G.dialog && G.dialog.onEnd;
    if (end) end();
    const after = { live: npcLive(sp), batt: invCount('batt'), kit: invCount('kit') };
    G.dialog = null; G.state = 'PLAY';
    // ...and a second hand-off must not be possible: it is live now
    doInteract(sp);
    const second = G.state;
    G.dialog = null; G.state = 'PLAY';
    return { key, before, after, askedState, linesWhileDark, second, shopOpened: askedState === 'SHOP' };
  });
  check('an NPC starts dark', hand.before.live === false, hand.key);
  check('a dark trader does NOT open the shop', !hand.shopOpened, 'state ' + hand.askedState);
  check('the hand-off spends exactly one cell',
    hand.before.batt === 1 && hand.after.batt === 0, hand.before.batt + ' -> ' + hand.after.batt);
  check('and it wakes', hand.after.live === true);
  check('the first unit repays with a repair kit', hand.after.kit === 1, 'kit ×' + hand.after.kit);

  // ---- A DARK MACHINE IS STILL A MACHINE YOU CAN SEE --------------------
  //
  // Reported twice, as the same word — "a ghost" — for two different reasons.
  // First it was ALPHA: the body drew at a third opacity and the room showed
  // through it. That was fixed, and the fix (grayscale(1) brightness(0.5))
  // earned the same word again, because it is a LUMINANCE ghost: halving the
  // light on art whose white point is 180 and then removing all of its colour
  // leaves about forty levels of flat grey over a room whose backdrop is 17.
  // Nothing left to read a form by.
  //
  // THIS MEASURES THE FILTER, NOT A FRAME, and that is deliberate. The first
  // version of this check tried to photograph the NPC in A1 and mask him by
  // subtraction; draw() clamps the camera, so the screen position computed from
  // the camera value that was ASSIGNED pointed at empty backdrop, and it was
  // measuring the room. The defect is a filter string, the regression would be
  // a filter string, so the filter is what gets measured: real sheet, real
  // pixels, no camera and no room to get in the way.
  const filt = await page.evaluate(async () => {
    mediaFetch('npcs', 1);
    for (let i = 0; i < 200; i++) await new Promise(r => requestAnimationFrame(r));
    const im = MEDIA_IMG.npcs;
    if (!im || !im.naturalWidth) return { err: 'npcs sheet did not load' };
    // one NPC cell, through the same grade atlas.js gives the sheet
    const cw = im.naturalWidth / 6, ch = im.naturalHeight / 7;
    const cell = document.createElement('canvas'); cell.width = cw; cell.height = ch;
    cell.getContext('2d').drawImage(im, 0, ch, cw, ch, 0, 0, cw, ch);
    // atlas.js's grade, run here rather than called: popArt takes an <img> and
    // caches by key, and handing it a canvas quietly returned the cell
    // ungraded — the charged reference then measured the RAW sheet and the
    // comparison meant nothing.
    const graded = (() => {
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const x = t.getContext('2d'); x.drawImage(cell, 0, 0);
      x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.32; x.drawImage(cell, 0, 0);
      x.globalCompositeOperation = 'screen';  x.globalAlpha = 0.14; x.drawImage(cell, 0, 0);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      // the gamma here MUST track atlas.js's npcs lift or the charged
      // reference is a fiction
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) lut[i] = 255 * Math.pow(i / 255, 0.45);
      const id = x.getImageData(0, 0, cw, ch), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
      }
      x.putImageData(id, 0, 0);
      return t;
    })();
    const stat = (src) => {
      const t = document.createElement('canvas'); t.width = cw; t.height = ch;
      const x = t.getContext('2d');
      if (src.filter) x.filter = src.filter;
      x.drawImage(graded, 0, 0);
      const D = x.getImageData(0, 0, cw, ch).data;
      const L = [], S = [];
      for (let i = 0; i < D.length; i += 4) {
        if (D[i + 3] < 200) continue;
        const r = D[i], g = D[i + 1], b2 = D[i + 2];
        L.push(0.2126 * r + 0.7152 * g + 0.0722 * b2);
        const mx = Math.max(r, g, b2), mn = Math.min(r, g, b2);
        S.push(mx ? (mx - mn) / mx : 0);
      }
      L.sort((a, z) => a - z); S.sort((a, z) => a - z);
      const q = (a, f) => a.length ? +a[Math.floor(f * (a.length - 1))].toFixed(2) : 0;
      return { mid: q(L, 0.5), white: q(L, 0.95),
               range: +(q(L, 0.95) - q(L, 0.05)).toFixed(1), sat: q(S, 0.5) };
    };
    // the string the game itself uses, by NAME. Scraping the page for
    // /c\.filter = '(grayscale...)'/ found a different dimming filter
    // elsewhere in the build and measured that instead.
    const src = typeof NPC_DARK_FILTER === 'string' ? NPC_DARK_FILTER : '';
    return { charged: stat({}), dark: stat({ filter: src }), src };
  });
  if (filt.err) check('the NPC sheet can be measured', false, filt.err);
  else {
    check('the powered-down filter was found in the build', !!filt.src, filt.src || '(none)');
    // RELATIVE, NOT ABSOLUTE. The first version of this asserted range >= 90,
    // a number calibrated before the NPC grade was lifted; raising the lift
    // compresses the 5-95 span of the WHOLE sheet, charged included, and the
    // check went red while the picture got better. The rule that actually
    // matters is that the powered-down filter must not throw away form the
    // charged unit has — so it is measured against the charged unit.
    check('an uncharged NPC is not a smudge — it keeps the form the lit one has',
      filt.dark.range >= filt.charged.range * 0.85,
      'range ' + filt.dark.range + ' vs charged ' + filt.charged.range);
    check('...and it carries a real highlight, not flat middle grey',
      filt.dark.white >= 140, 'white ' + filt.dark.white + ' (charged ' + filt.charged.white + ')');
    check('...and it still reads as powered DOWN — drained of colour, not of form',
      filt.dark.sat <= 0.18 && filt.dark.mid < filt.charged.mid,
      'sat ' + filt.dark.sat + ' vs ' + filt.charged.sat
      + ', mid ' + filt.dark.mid + ' vs ' + filt.charged.mid);
  }
  check('a woken unit talks instead of asking again', hand.second === 'DIALOG');

  // ---- 3. NO CELL, NO WAKE ------------------------------------------------
  const broke = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.items = {};                                  // spent it elsewhere
    startGame(sv); loadRoom('A0B');   // the trader lives in his booth den now
    await new Promise(r => requestAnimationFrame(r));
    const sp = G.statics.find(s => s.type === 'npc');
    doInteract(sp);
    const had = !!(G.dialog && G.dialog.onEnd);
    const live = npcLive(sp);
    G.dialog = null; G.state = 'PLAY';
    return { had, live };
  });
  check('with no cell there is nothing to press', broke.had === false);
  check('and it stays dark', broke.live === false);

  // ---- 4. THE LION PAYS FOR THE SHOP -------------------------------------
  const lion = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.items = {};
    startGame(sv);
    const before = invCount('batt');
    G.onBossDead('glitch');
    const after = invCount('batt');
    G.item = null; G.state = 'PLAY';
    return { before, after };
  });
  check('NULLFANG leaves a cell behind',
    lion.after === lion.before + 1, lion.before + ' -> ' + lion.after);

  // ---- 5. AND THE CONSTRUCTS ARE NEVER SPARED ----------------------------
  const eye = await page.evaluate(() => {
    const out = [];
    for (const k in MINIS) {
      const b = new Boss(k, 300, 480);
      b.hp = 0;
      out.push({ k, forked: bossFork(b) });
    }
    return out;
  });
  check('the Eye\'s constructs are never offered the fork',
    eye.every(o => o.forked === false), eye.filter(o => o.forked).map(o => o.k).join(',') || 'none');

  // ---- 6. THE HERO WORLD IS NOT GATED ------------------------------------
  // NOSTOS's people are people. Gating a Greek elder behind a robot battery is
  // exactly the theme bleed this codebase has had to fix twice already.
  const hero = await page.goto('http://127.0.0.1:8220/odyssey.html')
    .then(() => page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 }))
    .then(() => page.evaluate(async () => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
      startGame(sv); loadRoom('A0B');   // the trader lives in his booth den now
      await new Promise(r => requestAnimationFrame(r));
      const sp = G.statics.find(s => s.type === 'npc');
      return sp ? npcLive(sp) : null;
    }));
  check('NOSTOS\'s people are never dark', hero === true, 'live=' + hero);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — one cell, one machine, and the shop waits for the lion');
})().catch(e => { console.error(e); process.exit(1); });
