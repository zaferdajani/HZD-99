// NPC dialogue busts, cut from the turnaround sheet rather than generated.
//
// drawDialog draws HZD-99's face whoever is speaking (owner report, 2026-08-16).
// Fixing that needs a bust per NPC, and the sheet already has one: column 2 of
// npc_6yaw.webp is the front-facing cell of each row. Cropping the head from it
// costs nothing and guarantees the bust is the same character the player is
// standing in front of — which is the whole point of the rule the dialogue
// code already follows for her.
const { chromium } = require('playwright');
const fs = require('fs');
const ROWS = ['servo', 'ratchet', 'mono', 'patch', 'sage', 'lumen'];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  // the sheet ships as webp (tools/yawsheet.cjs since the painted cast, 2026-09-03)
  const src = 'data:image/webp;base64,' + fs.readFileSync('/home/user/HZD-99/assets/characters/npc_6yaw.webp').toString('base64');
  const out = await p.evaluate(async ({ src, ROWS }) => {
    const im = new Image(); im.src = src; await im.decode();
    const COLS = 6, N = 7, cw = im.width / COLS, ch = im.height / N;
    const res = [];
    for (let r = 0; r < ROWS.length; r++) {
      const t = document.createElement('canvas');
      t.width = Math.round(cw); t.height = Math.round(ch);
      const tc = t.getContext('2d');
      tc.drawImage(im, Math.round(cw * 2), Math.round(ch * r), Math.round(cw), Math.round(ch), 0, 0, t.width, t.height);
      // find the subject, then take the top third of it — the head and shoulders
      const d = tc.getImageData(0, 0, t.width, t.height).data;
      let x0 = t.width, y0 = t.height, x1 = -1, y1 = -1;
      for (let y = 0; y < t.height; y++) for (let x = 0; x < t.width; x++)
        if (d[(y * t.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { res.push(null); continue; }
      const bh = y1 - y0 + 1, headH = Math.round(bh * 0.42), cx = (x0 + x1) / 2;
      const side = Math.max(headH, Math.round((x1 - x0 + 1) * 0.72));
      const S = 256;
      const o = document.createElement('canvas'); o.width = S; o.height = S;
      const oc = o.getContext('2d');
      oc.imageSmoothingQuality = 'high';
      oc.drawImage(t, Math.round(cx - side / 2), y0, side, side, 0, 0, S, S);
      res.push(o.toDataURL('image/png'));
    }
    return res;
  }, { src, ROWS });
  out.forEach((u, i) => {
    if (!u) { console.log('EMPTY', ROWS[i]); return; }
    fs.writeFileSync('busts/' + ROWS[i] + '.png', Buffer.from(u.split(',')[1], 'base64'));
    console.log('bust', ROWS[i]);
  });
  await b.close();
})();
