// Photograph rooms of the real game, on one labelled sheet.
//
// The world cannot be judged plate by plate. A backdrop, the band she stands
// on, the deck under her feet and the thing crossing in front of her are four
// separate files that only ever meet in the assembled frame, and "does the
// world look drawn" is a question about that frame — so this shoots it.
//
// Three things are pinned, and tests/grammar.cjs learned all three the hard
// way: entering a room opens a dialog and a toast (so the shot is a speech
// panel), G.state is set separately from G.dialog (so sealing one is not
// enough), and the room's art is LAZY (so shooting early photographs the
// procedural fallback and calls it the art).
//
//   node tools/roomshot.cjs <out.png> <roomA,roomB,...> ["Title"] [cols]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const NAMES = {
  A0: 'SCRAP MEADOWS', A1: 'SCRAP MEADOWS · deeper', A4: 'NULLFANG’S DEN',
  A5: 'THE CAVE MOUTH', A9: 'THE EYE', B4: 'DATA CONDUITS',
  C3: 'THE FOUNDRY', D3: 'FROZEN ARCHIVES', E3: 'THE NULL CORE',
  X1: 'CRYSTAL CACHE',
};

(async () => {
  const [out, roomsArg, title, colsArg] = process.argv.slice(2);
  if (!out || !roomsArg) { console.error('usage: roomshot.cjs <out.png> <rooms> [title] [cols]'); process.exit(2); }
  const rooms = roomsArg.split(',').map(s => s.trim()).filter(Boolean);
  const cols = Math.max(1, parseInt(colsArg || '2', 10));

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const shots = [];
  for (const room of rooms) {
    const url = await page.evaluate(async (room) => {
      const sv = newSave(1);
      sv.time = 99; sv.flags.tut = 1;
      sv.abil = { dash: 1, djump: 1, wall: 1, emp: 1, key: 1 };
      sv.skills = ['dash', 'wall', 'glide', 'pulse'];
      sv.roomId = room;
      G.save = sv;
      startGame(sv);
      loadRoom(room);
      // the panel and the toast, sealed shut — see the header
      Object.defineProperty(G, 'dialog', { get: () => null, set: () => {}, configurable: true });
      Object.defineProperty(G, 'state', { get: () => 'PLAY', set: () => {}, configurable: true });
      G.toasts = [];

      // ART ON DEMAND MEANS WAIT FOR IT. assets/roomassets.json is measured by
      // tools/roomassets.cjs actually playing each room, so it is the room's
      // own answer to "what do I need" rather than a guess from the source.
      let want = [];
      try {
        const ra = (typeof ROOM_ASSETS !== 'undefined' && ROOM_ASSETS) || null;
        if (ra && ra[room]) want = ra[room].slice();
      } catch (e) {}
      for (const k of want) { try { mediaFetch(k); } catch (e) {} }
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        await new Promise(r => setTimeout(r, 120));
        if (!want.length) break;
        if (want.every(k => { try { return mediaHas(k); } catch (e) { return true; } })) break;
      }
      // ...and a few frames after it lands, so anything cached off the sheet
      // (dark copies, cut decks, scratch canvases) is built before the shutter
      for (let i = 0; i < 12; i++) await new Promise(r => requestAnimationFrame(r));
      const cv = document.querySelector('canvas');
      return cv.toDataURL('image/png');
    }, room);
    shots.push({ room, name: NAMES[room] || room, b64: url.split(',')[1] });
    console.log('  ' + room + (NAMES[room] ? '  ' + NAMES[room] : ''));
  }

  const sheet = await page.evaluate(async ({ shots, title, cols }) => {
    const CW = 700, CH = 394, PAD = 14, HEAD = 74;
    const rows = Math.ceil(shots.length / cols);
    const cv = document.createElement('canvas');
    cv.width = PAD + cols * (CW + PAD);
    cv.height = HEAD + rows * (CH + PAD);
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0e13'; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#e8edf6'; c.font = '600 28px system-ui, sans-serif';
    c.fillText(title || 'THE WORLD', PAD, 40);
    for (let i = 0; i < shots.length; i++) {
      const x = PAD + (i % cols) * (CW + PAD), y = HEAD + ((i / cols) | 0) * (CH + PAD);
      const im = new Image(); im.src = 'data:image/png;base64,' + shots[i].b64; await im.decode();
      c.drawImage(im, x, y, CW, CH);
      c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(x, y, 300, 28);
      c.fillStyle = '#ffd479'; c.font = '600 16px system-ui, sans-serif';
      c.fillText(shots[i].room + '  ·  ' + shots[i].name, x + 9, y + 19);
    }
    return cv.toDataURL('image/png');
  }, { shots, title, cols });

  fs.writeFileSync(out, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(out + '  ' + shots.length + ' rooms' + (errs.length ? '  (' + errs.length + ' page errors)' : ''));
  await browser.close();
})();
