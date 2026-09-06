// THE FORGE: the owner's editor exists only on its own pages, opens only to
// the passphrase, and every verb of it — including the prompt console's op
// contract — actually changes the world it stands on.
//
//   1. The game pages carry none of it.
//   2. The gate: wrong word refused, right word opens, the game starts.
//   3. Ops: new room, tiles, heap, entities, exits — applied and live.
//   4. A custom NPC gets a name, a conversation and a borrowed body.
//   5. A MAIN room edits the same way (snapshot -> pack override).
//   6. The Forge plays on its own save key.
//   7. A synthetic click paints the tile it points at.
//   8. Local JSON operations apply without credential storage or API calls.
const { chromium } = require('playwright');
const PASS = 'claw-forge-9921';
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const fails = [];
  const ok = (cond, what) => { console.log((cond ? '  ok  ' : '  FAIL ') + what); if (!cond) fails.push(what); };

  // — 1: the game pages are clean —
  let p = await br.newPage({ viewport: { width: 960, height: 540 } });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(2500);
  ok(await p.evaluate(() => typeof window.FORGE === 'undefined' && !window.EDITOR), 'index.html carries no editor');
  await p.close();

  // — 2..8: the forge —
  p = await br.newPage({ viewport: { width: 960, height: 540 } });
  await p.addInitScript(() => localStorage.setItem('cb_forge_key', 'test-placeholder'));
  const externalAI = []; p.on('request', r => { if (r.url().includes('api.anthropic.com')) externalAI.push(r.url()); });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  p.on('dialog', (d) => d.dismiss());
  await p.goto('http://127.0.0.1:8220/forge.html');
  await p.waitForTimeout(3500);
  ok(await p.evaluate(() => window.EDITOR === 1 && typeof FORGE === 'object'), 'forge.html is the editor page');

  const gateInp = p.locator('input[type=password]');
  await gateInp.fill('not-the-word');
  await gateInp.press('Enter');
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => G.state !== 'PLAY'), 'wrong passphrase does not open');
  await gateInp.fill(PASS);
  await gateInp.press('Enter');
  await p.waitForFunction(() => G.state === 'PLAY', { timeout: 8000 });
  ok(true, 'the word opens the Forge and the world starts');
  ok(await p.evaluate(() => saveKeyFor('robo').includes('_forge')), 'the Forge plays on its own save');

  const st = await p.evaluate(() => {
    const out = {};
    FORGE.apply([
      { op: 'new_room', id: 'F1', zone: 'A', w: 40, h: 17 },
      { op: 'goto', id: 'F1' },
      { op: 'heap', x: 14, top: 3 },
      { op: 'add_ent', ent: ['bench', 6, 15] },
      { op: 'add_ent', ent: ['crawler', 28, 15] },
      { op: 'npc', id: 'keeper', name: 'THE KEEPER', body: 'servo', x: 20, y: 15, lines: ['The flood took the towers.', 'The light stayed.'] },
      { op: 'set_start', room: 'F1' },
    ]);
    out.room = G.roomId;
    out.crest = G.grid[12][17];
    out.floor = G.grid[15][3];
    out.entN = ROOMS.F1.ents.length;
    out.npcName = t('n_keeper');
    out.npcLine = t('d_keeper')[0];
    out.npcBody = typeof ATLAS2 !== 'undefined' && !!ATLAS2.sub.keeper;
    // — 5: a MAIN room edits the same way —
    FORGE.apply([{ op: 'goto', id: 'W1' }, { op: 'set_tiles', tiles: [[10, 10, '#']] }]);
    out.mainOverride = ROOMS.W1.pack === 'forge';
    out.mainTile = G.grid[10][10];
    out.export = FORGE.exportJSON();
    return out;
  });
  ok(st.room === 'F1', 'new room created and entered');
  ok(st.crest === '#' && st.floor === '#', 'heap and frame are material');
  ok(st.entN === 3, 'bench, crawler and keeper placed (' + st.entN + ')');
  ok(st.npcName === 'THE KEEPER' && st.npcLine.includes('flood'), 'the keeper has a name and a conversation');
  ok(st.npcBody, 'the keeper wears the borrowed body');
  ok(st.mainOverride && st.mainTile === '#', 'a main-game room edits like a DLC room');
  const exp = JSON.parse(st.export);
  ok(exp.rooms.F1 && exp.rooms.W1 && exp.i18n.d_keeper && exp.npcBody.keeper === 'servo' && exp.start.room === 'F1',
    'the export carries rooms, dialogue, bodies and start');

  // — 7: a click paints the tile it points at —
  const pt = await p.evaluate(() => {
    FORGE.apply([{ op: 'goto', id: 'F1' }]);
    FORGE.mode = 'paint'; FORGE.brush = '='; FORGE.freeze = true;
    const cv = document.getElementById('cv'), r = cv.getBoundingClientRect();
    // a tile well left of the panel overlay — a click under the panel is the
    // panel's, which is correct chrome behavior and not what this measures
    const tx = 8, ty = 8;
    return {
      x: r.left + ((tx * 32 + 16) - cam.x) / 960 * r.width,
      y: r.top + ((ty * 32 + 16) - cam.y) / 540 * r.height,
      tx, ty,
    };
  });
  await p.mouse.click(pt.x, pt.y);
  await p.waitForTimeout(300);
  ok(await p.evaluate((q) => FORGE.pack.rooms.F1.grid[q.ty][q.tx] === '=', pt), 'a click paints the pointed tile');

  // — 8: reviewed local operations, no API credential path —
  ok(await p.evaluate(() => localStorage.getItem('cb_forge_key') === null), 'legacy key removed without transmission');
  await p.locator('textarea').fill('add a bench');
  await p.getByRole('button', { name: 'APPLY OPS', exact: true }).click();
  ok(await p.evaluate(() => !document.querySelector('textarea').value.includes('[')), 'invalid JSON stays available for correction');
  await p.locator('textarea').fill(JSON.stringify([{ op: 'set_title', title: 'LOCAL OPS TEST' }]));
  await p.getByRole('button', { name: 'APPLY OPS', exact: true }).click();
  ok(await p.evaluate(() => FORGE.pack.title === 'LOCAL OPS TEST'), 'JSON console applies reviewed operations');
  ok(externalAI.length === 0, 'editor never calls the external AI API');
  ok(await p.getByRole('button', { name: 'KEY', exact: true }).count() === 0, 'no API key input');
  const download = p.waitForEvent('download');
  await p.getByRole('button', { name: 'EXPORT BRIEF', exact: true }).click();
  ok((await download).suggestedFilename() === 'forge-room-brief.txt', 'room brief exports for use in an assistant');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
  await p.close(); await br.close();
  if (fails.length) { console.log('FAILED: ' + fails.join(' | ')); process.exit(1); }
  console.log('forge: the owner describes, the world changes, and only the owner');
})();
