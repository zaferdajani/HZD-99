// THE MAP IS A BOARD, AND TWO ROOMS CANNOT STAND ON THE SAME SQUARE.
//
// MAPPOS gives every room a rectangle of cells — [gridX, gridY, wCells, hCells]
// — and nothing has ever checked that those rectangles are disjoint. It did not
// matter while every room in a kingdom was about one screen and took one cell:
// the layout was a hand-drawn picture of a hand-drawn thing, and a collision
// would have been obvious in the drawing.
//
// It matters now. Kingdom 1's rooms run from 40 tiles to 88, so its cells are
// SCREENS rather than rooms, and the spine needs fifteen of them across a board
// whose next kingdom starts at column 6. That is exactly the kind of arithmetic
// that is right when it is written and wrong three edits later, and the failure
// is silent: two rooms draw over each other on the map screen and the player
// reads it as a rendering bug rather than as data.
//
// So the board is measured. Every room's rectangle against every other's, and
// every room the exit graph can reach must be ON the board at all.
//
// A NOTE ON WHAT IS NOT AN ERROR: rooms in different kingdoms may sit adjacent,
// and a kingdom may be laid out with gaps. Only overlap is a defect.
//
//   node tests/mapgrid.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

const K1 = ['W1', 'W2', 'A0', 'A0B', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
  'A8', 'A9', 'A10', 'CV1', 'CV1B', 'CV2', 'CV3'];

(async () => {
  console.log('── mapgrid — two rooms cannot stand on the same square\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof MAPPOS === 'object', { timeout: 20000 });

  const r = await page.evaluate(() => {
    const hits = [], missing = [], sized = [];
    const ids = Object.keys(MAPPOS);
    const rectOf = (id) => {
      const m = MAPPOS[id];
      return { x0: m[0], y0: m[1], x1: m[0] + (m[2] || 1) - 1, y1: m[1] + (m[3] || 1) - 1 };
    };
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = rectOf(ids[i]), b = rectOf(ids[j]);
        if (a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1)
          hits.push(ids[i] + '/' + ids[j]);
      }
    }
    // every room the graph can reach has to be on the board
    const seen = new Set(['W1']), q = ['W1'];
    while (q.length) {
      const id = q.pop();
      const ex = (ROOMS[id] && ROOMS[id].exits) || {};
      const outs = Object.values(ex).map(v => (v && v.to) ? v.to : v);
      const gates = GATE_ROOM[id];
      for (const g of (Array.isArray(gates) ? gates : gates ? [gates] : [])) outs.push(g.to);
      for (const o of outs) if (o && ROOMS[o] && !seen.has(o)) { seen.add(o); q.push(o); }
    }
    for (const id of seen) if (!MAPPOS[id]) missing.push(id);

    // and for zone A, a cell is a SCREEN: report the ratio so a room that grew
    // without its cells growing is visible here rather than only on the map
    for (const id of ids) {
      const R = ROOMS[id]; if (!R || R.zone !== 'A') continue;
      sized.push({ id, w: R.w, h: R.h, cells: MAPPOS[id][2] || 1, rows: MAPPOS[id][3] || 1,
        screensW: +(R.w / 30).toFixed(2), screensH: +(R.h / 16.9).toFixed(2) });
    }
    return { hits, missing, sized, total: ids.length };
  });

  // THE ASSERTION IS SCOPED, AND THE REST IS REPORTED RATHER THAN HIDDEN.
  //
  // Kingdom 1's board is this session's work and it must be clean — that is the
  // regression this harness exists to catch, because widening a meadow room and
  // forgetting its cells is how the spine would walk into the Foundry's column.
  //
  // The sweep also finds collisions that were on the board before any of this
  // and belong to other kingdoms' sessions: they are printed every run so they
  // cannot be forgotten, but they are not this harness's failure to own. Making
  // them fail here would either block kingdom 1's work on someone else's data or
  // tempt a fix that reaches into three kingdoms nobody asked this session to
  // touch. When those sessions come, delete the scope and this goes red for them.
  const mine = r.hits.filter(h => h.split('/').some(id => K1.includes(id)));
  check('no kingdom 1 room overlaps anything on the map board', mine.length === 0,
    mine.length ? mine.join('  ') : `${K1.length} meadow rooms among ${r.total} placed`);
  const theirs = r.hits.filter(h => !h.split('/').some(id => K1.includes(id)));
  console.log('  --   pre-existing collisions elsewhere on the board, for the kingdoms that own them: '
    + (theirs.length ? theirs.join('  ') : 'none'));
  check('every room the graph can reach is on the board', r.missing.length === 0,
    r.missing.join(' ') || 'none missing');

  // zone A's cells are screens — within one cell of the room's real size
  const off = r.sized.filter(s => Math.abs(s.cells - Math.max(1, Math.round(s.screensW))) > 0);
  check("the meadow's cells match its rooms' widths", off.length === 0,
    off.length ? off.map(s => `${s.id} ${s.w}t=${s.screensW}scr but ${s.cells} cell(s)`).join('  ')
      : r.sized.filter(s => K1.includes(s.id)).map(s => `${s.id}:${s.cells}`).join(' '));
  const offH = r.sized.filter(s => Math.abs(s.rows - Math.max(1, Math.round(s.screensH))) > 0);
  check('...and its heights', offH.length === 0,
    offH.length ? offH.map(s => `${s.id} h${s.h}=${s.screensH}scr but ${s.rows} row(s)`).join('  ') : 'rows agree');

  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — one square, one room, and the meadow draws the size it is'));
  process.exit(fails.length ? 1 : 0);
})();
