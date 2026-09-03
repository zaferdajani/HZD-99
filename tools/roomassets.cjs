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
    // ...and the dice are seeded, for the other half of the same problem: a
    // room's art depends on what its enemies and its boss DO, and those pick
    // their next state off Math.random, so two walks of the same room asked
    // for different sheets. Seeded rather than frozen — a constant makes a
    // state machine that never advances, and a room that never wakes its boss
    // never asks for the boss.
    // AND THE PREFETCHER IS OFF WHILE THIS MEASURES.
    //
    // preloadRoom fetches the art of rooms she can REACH from the one she is
    // in, using the manifest this tool writes. Leaving it running while the
    // window is open to settle means the sheets it pulls for the NEIGHBOURS
    // land in MEDIA_PEND and are billed to the room being measured — the
    // manifest measuring its own output, and W1 came back owning 6.7 MB
    // including every plate of the Alpha and the city gate. PRE.on is the
    // switch preloadRoom already checks.
    if (typeof PRE === 'object' && PRE) PRE.on = 0;
    let sd = 0x9e3779b9;
    Math.random = () => {                            // mulberry32
      sd = (sd + 0x6d2b79f5) >>> 0;
      let x = sd;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
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
      // DRAW UNTIL IT STOPS ASKING, rather than for a fixed eight frames.
      //
      // Eight was a guess, and the guess is why this file was different every
      // time it was regenerated: 58 of its 94 keys landed in a different room
      // across three consecutive runs of an unchanged tree. Some art is only
      // requested once a boss wakes, a tile layer bakes or a ceiling picks its
      // weather tier, and when that takes longer than the window the request
      // goes out during the NEXT room's window and is billed to it — which is
      // how V1B, a one-room NPC shop, came to be charged for the Prism's parts
      // atlas.
      //
      // So the window closes when the room has gone quiet: no new key for
      // QUIET frames running, capped so a room that keeps asking forever
      // cannot hang the walk.
      const QUIET = 20, CAP = 200;
      let quiet = 0, mark = seen().length;
      for (let f = 0; f < CAP && quiet < QUIET; f++) {
        try { drawGame(); } catch (e) {}
        await frame();
        const n = seen().length;
        if (n !== mark) { mark = n; quiet = 0; } else quiet++;
      }
      const now = new Set(seen());
      perRoom[id] = { zone: ROOMS[id].zone, keys: [...now].filter(k => !before.has(k)) };
    }
    // ...and what the game grabs before any room at all: the boot set every
    // room inherits and none of them should be charged for
    //
    // TWO GROUPS THE WALK CANNOT OBSERVE RELIABLY, AND DOES NOT HAVE TO.
    //
    // A creature's state plates — snareRest / snareTell / snareLimp, and the
    // same shape for rime, kiln and the rest — are fetched by the draw that
    // first wants one, so whether a window catches the wind-up depends on
    // whether the thing happened to wind up. Three consecutive walks disagreed
    // on exactly those keys and nothing else. They do not have to be observed:
    // a room holding a snare WILL need every picture a snare has, and both the
    // enemy list and the key table are right here. So the groups are closed —
    // see one, take all — which is deterministic AND more correct than the
    // observation was, because a room whose snare never wound up during the
    // walk still needs the plate when it does.
    const kinds = Object.keys(typeof EKIND === 'object' ? EKIND : {});
    const group = {};
    for (const k of Object.keys(MEDIA_SRC.images)) {
      const kind = kinds.find(n => k.length > n.length && k.slice(0, n.length) === n
        && k[n.length] === k[n.length].toUpperCase());
      if (kind) (group[kind] = group[kind] || []).push(k);
    }
    // ...and the PROTAGONIST is in every room, so her plates are nobody's
    // room property. heroFidget landed in W2 on one walk and A0 on the next
    // for no reason but which screen she happened to idle on.
    const hers = Object.keys(MEDIA_SRC.images).filter(k => /^(hero|swing|trans)/.test(k));
    for (const id in perRoom) {
      const r = perRoom[id];
      if (!r || !r.keys) continue;
      const set = new Set(r.keys.filter(k => hers.indexOf(k) < 0));
      for (const kind in group) if (group[kind].some(k => set.has(k))) for (const k of group[kind]) set.add(k);
      r.keys = [...set].sort();
    }
    for (const k of hers) if (bootKeys.indexOf(k) < 0) bootKeys.push(k);
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
