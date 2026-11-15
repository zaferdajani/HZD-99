// HIS BATTERY IS IN THE TOOLBOX ON THE FLOOR (owner, 2026-11-15).
//
// "The hero is looking in the drawers for the battery when it's actually in the
// toolbox down. You need to change it." — the comic showed her at a waist-high
// drawer, and every line of the letter said "drawer", while the room has always
// kept the battery in a low box on the floor beside his chair.
//
// "Improve the art of the toolbox to make it show uniquely on the ground when I
// enter the room. Make it shiny ... to blend with the ground, but in a unique
// way to direct the player there." — the box was a brown procedural chest.
//
// "Differentiate between a toolbox and working station for the NPC. This is the
// working table station, not the toolbox." — two objects, never one.
//
// So this measures, off the real build:
//   - the words: all five languages say toolbox, and none of them says drawer;
//   - the picture: the sequence shows the toolbox panel, and the file is there;
//   - the box: the fired plate is what the room draws, on the floor line, on his
//     LEFT, a different thing in a different place from the work table;
//   - the light: cyan lies on the floor round it, the brass glints, and both
//     stop the moment the battery is out and the lid is up;
//   - and with the plate withheld the room still has a chest (nothing breaks
//     while a file is on its way).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };
  const open = async (block) => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    if (block) await p.route(/backgrounds\/toolbox(_open)?\.webp/, r => r.abort());
    await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
    await p.goto('http://127.0.0.1:8220/index.html');
    await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
    return { p, errs };
  };

  // ---- the words ------------------------------------------------------------
  const { p, errs } = await open(false);
  const words = await p.evaluate(() => {
    const WANT = { en: /toolbox/i, ar: /صندوق/, tr: /alet kutusu/i, zh: /工具箱/, ru: /ящик[а-я]* с инструментами/i };
    const NOT = { en: /drawer/i, ar: /دُّ?رج|درج/, tr: /çekmece/i, zh: /抽屉/, ru: /ящик(?![а-я]* с инструментами)/i };
    const keys = ['op_drawer', 'op_drawer_h', 'op_letter2', 'i_ratchetCelld', 'pc_l_cell', 'pc_letter'];
    const bad = [], seen = {}; const was = LANG;
    for (const L of Object.keys(WANT)) {
      LANG = L; seen[L] = t('op_drawer');
      for (const k of keys) { const s = t(k); if (!WANT[L].test(s) || NOT[L].test(s)) bad.push(L + ':' + k + ' = ' + s.slice(0, 60)); }
    }
    LANG = was;
    return { bad, seen };
  });
  check('the letter, the hint, the card and the captions say TOOLBOX in all five languages, and never drawer', words.bad.length === 0, words.bad.slice(0, 4).join(' | ') || JSON.stringify(words.seen));

  // ---- the picture ----------------------------------------------------------
  const pic = await p.evaluate(async () => {
    const s = panelsSeq('drawer'), src = s && s.panels.map(q => q.src);
    const letter = panelsSeq('letter'), lc = letter && letter.panels.find(q => /l_cell/.test(q.src));
    const size = async u => { const i = new Image(); i.src = u; try { await i.decode(); return [i.naturalWidth, i.naturalHeight]; } catch (e) { return null; } };
    const old = await fetch('assets/manhua/ch1/game/drawer.webp').then(r => r.status).catch(() => 0);
    return { src, size: src && await size(src[0]), lcell: lc && await size(lc.src), old };
  });
  check('the moment she takes it shows the toolbox panel', !!pic.src && pic.src.length === 1 && /game\/toolbox\.webp$/.test(pic.src[0]), JSON.stringify(pic.src));
  check('...the panel is there, at the game panels\' own size', !!pic.size && pic.size[0] === 1600 && pic.size[1] === 893, JSON.stringify(pic.size));
  check('...the letter\'s battery panel is there too', !!pic.lcell && pic.lcell[0] === 1600 && pic.lcell[1] === 893, JSON.stringify(pic.lcell));
  check('...and the drawer picture is gone from the game', pic.old === 404, String(pic.old));

  // ---- the box --------------------------------------------------------------
  const box = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.storyVersion = 2; Object.assign(sv.flags, { opNote: 1, woke: 1, gateOpened: 1 });
    startGame(sv); loadRoom('A0B'); G.dialog = G.wake = G.cut = G.tut = null; G.state = 'PLAY';
    const s = G.statics.find(q => q.type === 'chest' && q.extra === 'it:batt'), npc = G.statics.find(q => q.extra === 'ratchet');
    for (const k of ['denToolbox', 'denToolboxOpen', 'forgeTable']) mediaFetch(k, 1);
    for (let i = 0; i < 400 && !(MEDIA_RAW.denToolbox && MEDIA_RAW.denToolbox.naturalWidth && MEDIA_RAW.denToolboxOpen && MEDIA_RAW.denToolboxOpen.naturalWidth); i++) await new Promise(r => setTimeout(r, 25));
    player.x = s.x - 5 * TILE;
    // the real frame draws it
    for (let i = 0; i < 20; i++) { await new Promise(r => requestAnimationFrame(r)); G.dialog = null; G.toasts = []; }
    const drawn = G.denToolboxDrawn && Object.assign({}, G.denToolboxDrawn);
    // where a body stands at that spot: the den floor is a heightfield, and the
    // box must be on the same line her feet are, not on the square under it
    const px0 = player.x; player.x = s.x + s.w / 2 - player.w / 2; player.vx = 0;
    for (let i = 0; i < 40; i++) { update(1 / 60); G.dialog = null; if (G.state !== 'PLAY') G.state = 'PLAY'; }
    const feet = player.y + player.h, onFloor = player.on; player.x = px0;
    // ...and off the frame, on a canvas of its own, so the light can be measured
    const shot = (probe, glint) => {
      const cv = document.createElement('canvas'); cv.width = 260; cv.height = 160; const c = cv.getContext('2d', { willReadFrequently: true });
      c.fillStyle = '#20262c'; c.fillRect(0, 0, 260, 160);
      const cx = s.x + s.w / 2, base = denToolboxBase(s);
      c.translate(130 - cx, 110 - base);
      const st0 = G.state; G.state = 'CUT';                       // no motes into the measurement
      G.artProbe = probe ? 1 : 0;
      const now = performance.now() / 1000;
      s._gl0 = glint ? now - DEN_TOOLBOX_GLINT - 0.3 : now - DEN_TOOLBOX_GLINT - 2;   // mid-glint, or between glints
      const ok = drawDenToolbox(c, s);
      G.artProbe = 0; G.state = st0; s._gl0 = null;
      const d = c.getImageData(0, 0, 260, 160).data; let red = 0, cyanFloor = 0, bright = 0, lowest = -1;
      for (let y = 0; y < 160; y++) for (let x = 0; x < 260; x++) { const o = (y * 260 + x) * 4, r = d[o], g = d[o + 1], bl = d[o + 2];
        if (r > 90 && r > g * 1.6 && r > bl * 1.6) { red++; if (y > lowest) lowest = y; }
        if (y >= 112 && y < 124 && bl > 60 && g > 60 && bl - r > 18) cyanFloor++;
        if (r > 215 && g > 215 && bl > 190) bright++; }
      return { ok, red, cyanFloor, bright, lowest };
    };
    const lit = shot(false, false), dark = shot(true, false), glint = shot(false, true);
    // open it the way she does
    doInteract(s);
    const got = invCount('ratchetCell');
    G.item = null; G.dialog = null; G.state = 'PLAY';
    const opened = shot(false, true);
    const after = G.denToolboxDrawn && Object.assign({}, G.denToolboxDrawn);
    return { drawn, lit, dark, glint, opened, after, got, feet, onFloor, floor: s.y + s.h, cx: (s.x + s.w / 2) / TILE, npc: (npc.x + npc.w / 2) / TILE, table: 22.6,
      tableH: DEN_TABLE_H, hero: isHero(), plates: [MEDIA_RAW.denToolbox.naturalWidth, MEDIA_RAW.denToolbox.naturalHeight, MEDIA_RAW.denToolboxOpen.naturalWidth, MEDIA_RAW.denToolboxOpen.naturalHeight] };
  });
  check('the room draws the fired toolbox plate, shut and lit', !!box.drawn && box.drawn.key === 'denToolbox' && box.drawn.lit === true && box.lit.red > 400, JSON.stringify(box.drawn) + ' red px ' + box.lit.red);
  check('...standing on the floor she walks on', !!box.drawn && box.onFloor && Math.abs(box.drawn.base - box.feet) <= 4 && Math.abs(box.lit.lowest - 110) <= 5,
    'its base ' + (box.drawn && box.drawn.base.toFixed(1)) + ', her feet there ' + box.feet.toFixed(1) + ' (tile top ' + box.floor + '); lowest red row ' + box.lit.lowest + ' of 110');
  check('...big enough to be seen from the door, and smaller than the table', !!box.drawn && box.drawn.w >= 54 && box.drawn.h < box.tableH * 0.7, box.drawn && (box.drawn.w + 'x' + box.drawn.h.toFixed(0) + ' against a ' + box.tableH + 'px table'));
  check('the toolbox is on his LEFT and the work table on his right: two objects, tiles apart', box.cx < box.npc && box.table > box.npc && box.table - box.cx >= 6,
    'toolbox ' + box.cx.toFixed(1) + ' · Ratchet ' + box.npc.toFixed(1) + ' · table ' + box.table);
  check('the two plates are one box: one width, so the lid lifts and the body does not move', box.plates[0] === box.plates[2] && box.plates[3] > box.plates[1], box.plates.join(','));
  check('cyan light lies on the floor round it', box.lit.cyanFloor > 300 && box.dark.cyanFloor < box.lit.cyanFloor * 0.2, 'lit ' + box.lit.cyanFloor + ' px, probe ' + box.dark.cyanFloor);
  check('...and the brass glints', box.glint.bright >= box.lit.bright + 8, 'mid-glint ' + box.glint.bright + ' bright px, between glints ' + box.lit.bright);
  check('opening it hands her HIS battery', box.got === 1, String(box.got));
  check('...and the box stands open, empty and dark: no pool, no glint', !!box.after && box.after.key === 'denToolboxOpen' && box.after.lit === false
    && box.opened.cyanFloor < box.lit.cyanFloor * 0.2 && box.opened.bright <= box.lit.bright + 2 && box.opened.red > 300,
    JSON.stringify({ key: box.after && box.after.key, cyan: box.opened.cyanFloor, bright: box.opened.bright, red: box.opened.red }));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();

  // ---- with the plate withheld ----------------------------------------------
  const w = await open(true);
  const bare = await w.p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.storyVersion = 2; Object.assign(sv.flags, { opNote: 1, woke: 1, gateOpened: 1 });
    startGame(sv); loadRoom('A0B'); G.dialog = G.wake = G.cut = G.tut = null; G.state = 'PLAY';
    const s = G.statics.find(q => q.type === 'chest' && q.extra === 'it:batt'); player.x = s.x - 3 * TILE;
    for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); G.dialog = null; }
    const cv = document.createElement('canvas'); cv.width = 80; cv.height = 60; const c = cv.getContext('2d');
    c.translate(40 - (s.x + s.w / 2), 50 - (s.y + s.h));
    const plate = drawDenToolbox(c, s);
    doInteract(s);
    return { plate, drawn: !!G.denToolboxDrawn, got: invCount('ratchetCell') };
  });
  check('with the plate not arrived, the room keeps its stand-in chest and it still opens', bare.plate === false && !bare.drawn && bare.got === 1 && w.errs.length === 0, JSON.stringify(bare) + ' ' + w.errs.slice(0, 1).join(''));
  await w.p.close();

  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — his battery is in the toolbox on the floor, the room points at it, and the comic shows it');
})().catch(e => { console.error(e); process.exit(1); });
