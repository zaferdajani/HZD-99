// WHICH ART EACH ROOM ACTUALLY NEEDS — measured by playing it, not by reading.
//
// The lazy media map (js/media.js) fetches a sheet the first time something
// ASKS for it, which means the request goes out on the frame the player walks
// into the room and the art arrives some time after that. On a desk that is
// invisible. On a phone on mobile data it is the guardian appearing a second
// after the fight starts.
//
// Fixing that needs a prefetcher, and a prefetcher needs to know what a room
// will want BEFORE the room is entered. That cannot be read off the source:
// which sheets get touched depends on the zone, the enemies in the list, the
// boss, the NPCs, the ceiling, the lair, the weather tier and half a dozen
// runtime branches. So this measures it — it boots the real game, walks every
// room in ROOMS, and records every key the lazy map fetched while it was there.
//
// The output is a MANIFEST that build.cjs compiles into the page, which is what
// makes the prefetch cheap at runtime: no discovery, just a lookup.
//
//   node tools/roomassets.cjs [out.json]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

(async () => {
  const out = process.argv[2] || 'assets/roomassets.json';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    // every skill, so gates open and nothing is skipped for being locked
    sv.skills = ['dash', 'wall', 'glide', 'pulse', 'song', 'claw']; startGame(sv);
  });

  const res = await page.evaluate(async () => {
    const ids = Object.keys(ROOMS);
    const perRoom = {};
    // the lazy map records what it has ALREADY fetched, so the difference
    // before and after a room is exactly what that room asked for
    const seen = () => Object.keys(MEDIA_RAW).concat(Object.keys(MEDIA_PEND));
    const frame = () => new Promise(r => requestAnimationFrame(r));
    // THE BOOT SET is whatever is already resident before the walk starts: the
    // eager four in media.js plus whatever the title and the first room pulled.
    // It has to be captured HERE. Taking it from the first room measured instead
    // charges that room's own art to everybody and reports an empty boot set,
    // which is what the first version of this did.
    const bootKeys = seen();
    for (const id of ids) {
      const before = new Set(seen());
      try { loadRoom(id); G.dialog = null; G.state = 'PLAY'; } catch (e) { perRoom[id] = { err: String(e) }; continue; }
      // draw it a few times: one frame is not enough, because some art is only
      // asked for once a boss wakes, a tile layer bakes, or the ceiling picks
      // its weather tier
      for (let f = 0; f < 8; f++) { try { drawGame(); } catch (e) {} await frame(); }
      const now = new Set(seen());
      perRoom[id] = { zone: ROOMS[id].zone, keys: [...now].filter(k => !before.has(k)) };
    }
    // ...and what the game grabs before any room at all: the boot set every
    // room inherits and none of them should be charged for
    return { perRoom, ids, boot: bootKeys, src: MEDIA_SRC.images };
  });

  // attach real byte sizes, so the runtime budget is spending measured bytes
  // rather than counting files as if a 2 KB icon and a 2 MB atlas were equal
  const sizeOf = (rel) => {
    for (const base of ['www', '.']) {
      const p = path.join(base, rel);
      if (fs.existsSync(p)) return fs.statSync(p).size;
    }
    return 0;
  };
  const bytes = {};
  for (const k of Object.keys(res.src)) bytes[k] = sizeOf(res.src[k]);

  const rooms = {};
  for (const id of res.ids) {
    const r = res.perRoom[id];
    if (!r || r.err) { console.log('  ! ' + id + ' ' + (r && r.err)); continue; }
    rooms[id] = { zone: r.zone, keys: r.keys };
  }
  const man = { boot: res.boot, rooms, bytes };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(man));
  const tot = Object.keys(rooms).reduce((s, id) => s + rooms[id].keys.reduce((a, k) => a + (bytes[k] || 0), 0), 0);
  const worst = Object.keys(rooms).map(id => [id, rooms[id].keys.reduce((a, k) => a + (bytes[k] || 0), 0)])
                                  .sort((a, b) => b[1] - a[1])[0];
  console.log(out + ' — ' + Object.keys(rooms).length + ' rooms, boot set ' + man.boot.length + ' keys');
  console.log('  room art totals ' + (tot / 1048576).toFixed(1) + ' MB, heaviest room ' +
              worst[0] + ' at ' + (worst[1] / 1048576).toFixed(2) + ' MB');
  if (errs.length) console.log('  PAGE ERRORS: ' + errs.slice(0, 2).join(' | '));
  await browser.close();
})();
