// THE ART FOR THE NEXT ROOM IS ALREADY HERE.
//
// js/preload.js walks the room graph and fetches the art for rooms she can
// reach before she reaches them. The claim is only worth anything if it is
// measured on the real build, because the failure mode is silent: the lazy map
// still works, the sheet still arrives, it just arrives LATE — and late is
// invisible on a desk and ugly on a phone.
//
// So this walks her from a room to a neighbour and asks the only question that
// matters: when the neighbour loaded, was its art already resident?
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── preload — the next room\'s art arrives before the next room does');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  // ---- 1. THE MANIFEST IS COMPILED IN AND COVERS THE GAME ------------------
  const man = await page.evaluate(() => {
    const M = window.ROOM_ASSETS;
    if (!M) return { missing: true };
    const ids = Object.keys(ROOMS);
    const uncovered = ids.filter(id => !M.rooms[id]);
    // every key the manifest names must be a real slot in the media map, or the
    // prefetcher would spend requests on nothing
    const bad = [];
    for (const id in M.rooms) for (const k of M.rooms[id].keys)
      if (!MEDIA_SRC.images[k]) bad.push(id + '/' + k);
    let bytes = 0;
    for (const id in M.rooms) for (const k of M.rooms[id].keys) bytes += (M.bytes[k] || 0);
    return { missing: false, rooms: Object.keys(M.rooms).length, ids: ids.length, uncovered, bad, bytes };
  });
  if (man.missing) {
    check('the room→art manifest is compiled into the page', false,
          'window.ROOM_ASSETS is null — run tools/roomassets.cjs and rebuild');
  } else {
    check('the room→art manifest is compiled into the page', true,
          man.rooms + ' rooms, ' + (man.bytes / 1048576).toFixed(1) + ' MB of room art');
    check('...and every room in ROOMS is in it', !man.uncovered.length, man.uncovered.join(', '));
    check('...and every key it names exists in the media map', !man.bad.length, man.bad.slice(0, 4).join(', '));
  }

  await page.evaluate(() => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    sv.skills = ['dash', 'wall', 'glide', 'pulse']; startGame(sv);
  });

  // ---- 2. THE POLICY BENDS TO THE CONNECTION -------------------------------
  const pol = await page.evaluate(() => {
    const out = {};
    const set = (v) => Object.defineProperty(navigator, 'connection',
      { value: v, configurable: true });
    set({ effectiveType: '4g' });      out.fast = preloadPolicy();
    set({ effectiveType: '3g' });      out.mid  = preloadPolicy();
    set({ effectiveType: '2g' });      out.slow = preloadPolicy();
    set({ saveData: true, effectiveType: '4g' }); out.save = preloadPolicy();
    set(undefined);
    return out;
  });
  check('a fast connection reaches deep and fetches the far set',
    pol.fast.depth >= 3 && pol.fast.far === true, 'depth ' + pol.fast.depth);
  check('3g narrows the horizon and drops the far set',
    pol.mid.depth === 2 && pol.mid.far === false, 'depth ' + pol.mid.depth);
  check('2g fetches only the next door', pol.slow.depth === 1 && pol.slow.far === false);
  check('Save-Data is obeyed, not negotiated with',
    pol.save.depth === 1 && pol.save.far === false && pol.save.max === 1);

  // ---- 3. THE ACTUAL CLAIM -------------------------------------------------
  // Stand in a room, let the game breathe, then ask whether the art belonging
  // to its NEIGHBOURS is resident. That is the whole feature in one number.
  const near = await page.evaluate(async () => {
    const M = window.ROOM_ASSETS;
    const frame = () => new Promise(r => requestAnimationFrame(r));
    // a room with neighbours that actually carry art
    let from = null, want = null;
    for (const id of Object.keys(ROOMS)) {
      const ex = ROOMS[id].exits || {};
      const ks = Object.values(ex).flatMap(n => (M.rooms[n] && M.rooms[n].keys) || []);
      if (ks.length >= 2) { from = id; want = [...new Set(ks)]; break; }
    }
    if (!from) return { skip: true };
    loadRoom(from); G.dialog = null; G.state = 'PLAY';
    // strip them out so the measurement cannot be satisfied by art that merely
    // happened to already be here
    for (const k of want) { delete MEDIA_RAW[k]; delete MEDIA_PEND[k]; }
    PRE.q = []; PRE.seen = {}; PRE.inflight = 0;
    preloadRoom(from);
    for (let f = 0; f < 240; f++) { try { drawGame(); } catch (e) {} preloadTick(); await frame(); }
    const have = want.filter(k => MEDIA_RAW[k] || MEDIA_PEND[k]);
    return { skip: false, from, want: want.length, have: have.length,
             missing: want.filter(k => !MEDIA_RAW[k] && !MEDIA_PEND[k]) };
  });
  if (near.skip) check('a neighbour with art was found to test against', false);
  else check('the neighbouring rooms\' art is fetched while she stands still',
    near.have === near.want,
    near.have + '/' + near.want + ' from ' + near.from +
    (near.missing.length ? ' — missing ' + near.missing.slice(0, 4).join(', ') : ''));

  // ---- 4. AND IT GETS OUT OF THE WAY ---------------------------------------
  // A prefetcher that runs during a boss fight or a room transition is a
  // downgrade: it spends the bandwidth and the main thread at the two moments
  // the player can feel it.
  //
  // THIS BLOCK USED TO ASSERT THE OPPOSITE ABOUT MENUS and it was wrong. The
  // rule was `G.state === 'PLAY'`, so a shop, the map, a dialogue and the title
  // screen all fetched nothing — the moments when NOTHING is moving were the
  // only ones the prefetcher sat out, which is exactly backwards. The rule is
  // inverted now: everywhere except where the network genuinely belongs to
  // something else, and the something-elses are named here one by one.
  const yields = await page.evaluate(() => {
    const out = {};
    const st = G.state, tr = G.trans, cu = G.cut;
    G.state = 'PLAY'; G.trans = null; G.cut = null; out.play = preloadIdle();
    G.trans = { t: 1 };                out.trans = preloadIdle();
    G.trans = null; G.state = 'PAUSE'; out.menu = preloadIdle();
    G.state = 'MENU';                  out.title = preloadIdle();
    // a film that is running cleanly is a two-minute idle window and is used;
    // the same film the instant its frame clock hesitates is not
    G.state = 'CUT';
    G.cut = { ph: 'play', ran: true, stall: 0 };  out.filmOk = preloadIdle();
    G.cut = { ph: 'play', ran: true, stall: 0.4 }; out.filmStalling = preloadIdle();
    G.cut = { ph: 'hold', ran: false, stall: 0 };  out.filmWaiting = preloadIdle();
    G.state = st; G.trans = tr; G.cut = cu;
    return out;
  });
  check('it runs while she is playing', yields.play === true);
  check('...and stands down during a room transition', yields.trans === false);
  check('...and USES a menu rather than sitting it out', yields.menu === true);
  check('...and the title screen too', yields.title === true);
  check('...and a film that is playing cleanly', yields.filmOk === true);
  check('...but backs off the moment that film hesitates', yields.filmStalling === false);
  check('...and never competes with one still trying to start', yields.filmWaiting === false);

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — she arrives to a room that is already painted');
})().catch(e => { console.error(e); process.exit(1); });
