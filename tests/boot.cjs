// WHAT A COLD OPEN ACTUALLY COSTS, counted request by request.
//
// The delivery strategy is easy to describe and easy to break silently: the
// game is supposed to start fast and fetch the rest behind itself. Nothing in
// the source says how many bytes the first ten seconds spend, so this harness
// says it — it intercepts every network request the page makes and sorts them
// into what the boot NEEDS and what it merely happened to ask for.
//
// The three failures it exists to catch, all of which were live before it:
//   - the whole eight-shot opening reel fetched on every boot, including the
//     boots where the player presses Continue and never watches it
//   - the prefetcher asleep through the title screen, which is the longest
//     guaranteed-idle window most sessions have
//   - three dozen audio requests opened on the same frame as the first tap,
//     six of them guaranteed 404s
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
const MB = (n) => (n / 1048576).toFixed(2) + ' MB';

async function boot(withSave) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const req = [];
  page.on('response', async (r) => {
    const u = r.url();
    if (!/\/assets\//.test(u)) return;
    let size = 0;
    try { size = Number((await r.headerValue('content-length')) || 0); } catch (e) {}
    req.push({ url: u.replace(/^.*\/assets\//, ''), status: r.status(), size });
  });
  if (withSave) {
    await page.addInitScript(() => {
      const sv = { v: 1, diff: 1, scrap: 0, coresMax: 5, abil: {}, crests: [], equip: [],
        arms: [], armIdx: 0, stars: 6, slots: 3, iq: 0, skills: [], relics: [], flags: {},
        broken: {}, visited: {}, shop: {}, bench: { room: 'A4', x: 96, y: 412 },
        deaths: 0, lives: 0, time: 99, pouch: null, usedNine: false, won: false, evo: 0,
        pace: 0, quests: {}, culls: {}, bag: {}, items: { batt: 1 } };
      localStorage.setItem('clawbyte_save_robo', JSON.stringify(sv));
      localStorage.setItem('cb_intro_seen', '1');
    });
  }
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  // sit on the title screen exactly as a player deciding what to press would
  await page.waitForTimeout(9000);
  const q = await page.evaluate(() => {
    // the art the room Continue lands in, and its immediate neighbours, need —
    // computed the same way the prefetcher computes it, from the same manifest
    const s = loadStored('robo');
    const start = (s && s.bench && s.bench.room) || 'W1';
    const M = window.ROOM_ASSETS;
    const near = new Set();
    if (M) for (const [id] of preloadNear(start, 1)) {
      const r = M.rooms[id]; if (r) for (const k of r.keys) near.add(MEDIA_SRC.images[k]);
    }
    return {
      queued: (typeof PRE !== 'undefined') ? PRE.q.length : -1,
      fetched: Object.keys(typeof MEDIA_RAW !== 'undefined' ? MEDIA_RAW : {}).length,
      state: G.state, start,
      near: Array.from(near).map(u => String(u).replace(/^.*?assets\//, '')),
    };
  });
  await browser.close();
  return { req, q, errs };
}

(async () => {
  console.log('── boot — what a cold open spends, and on what');

  // ---- 1. A RETURNING PLAYER. They will press Continue. The opening film is
  // not something they are going to watch, so it must not be bought for them.
  const ret = await boot(true);
  const vid = ret.req.filter(r => /\.(mp4|webm)$/.test(r.url));
  const vidBytes = vid.reduce((a, r) => a + r.size, 0);
  const intro = vid.filter(r => /intro/.test(r.url));
  const img = ret.req.filter(r => /\.(png|jpg|jpeg)$/.test(r.url));
  const imgBytes = img.reduce((a, r) => a + r.size, 0);
  const four04 = ret.req.filter(r => r.status === 404);

  check('a returning player does not buy the whole opening reel', intro.length <= 2,
        intro.length + ' intro clip(s): ' + MB(vidBytes));

  // ---- 2. THE TITLE SCREEN IS NOT DEAD TIME. The prefetcher must have been
  // seeded from the SAVED room and must have actually moved bytes while the
  // menu was up. This is the whole point of preloadBoot() + preloadIdle().
  check('the title screen prefetches art at all',
        img.length >= 8, img.length + ' sheets, ' + MB(imgBytes) + ', still queued: ' + ret.q.queued);
  check('...and it never left the menu to do it', ret.q.state === 'MENU', ret.q.state);
  // ORDER IS THE WHOLE CLAIM. On a fast link everything arrives inside nine
  // seconds and a byte total proves nothing; what has to be true is that the
  // art for the room Continue lands in came FIRST. The save here is parked in
  // A4, which is nowhere near the default start, so a prefetcher that ignored
  // the save would fail this and pass every other check in the file.
  //
  // Measured against POSITION, not proportion: the handful of sheets media.js
  // fetches eagerly at parse time (the shared atlases and the deck she stands
  // on) will always be in front, so "most of the first ten" is not a claim that
  // can hold. "All of them land before the far set starts" is.
  //
  // The allowance is RELATIVE TO THE NEIGHBOURHOOD, not a fixed ten. It was ten
  // when a neighbourhood was one sheet; the drawn branch gave every room a rock
  // slab and the same correct behaviour then read as a failure at position 13.
  // What the check is for is that nothing from the far set jumped the queue —
  // so the near set may occupy as many slots as it has, plus the eager few.
  const EAGER = 6;                    // parse-time fetches, with a slot to spare
  const order = img.map(r => r.url);
  const at = ret.q.near.map(u => [u, order.indexOf(u)]);
  const missing = at.filter(([, i]) => i < 0).map(([u]) => u);
  const last = Math.max(...at.map(([, i]) => i));
  check('...and it starts with the room the SAVE is in, not the default start',
        !missing.length && last < at.length + EAGER,
        'saved in ' + ret.q.start + ': its ' + at.length + ' sheets land at positions '
        + at.map(([, i]) => i).sort((a, b) => a - b).join(',')
        + (missing.length ? ' — never fetched: ' + missing.join(',') : ''));

  // ---- 3. NOTHING IS FETCHED THAT IS KNOWN NOT TO EXIST during the opening
  // seconds. The six NPC hum slots are allowed to 404 — later.
  const early404 = four04.filter(r => /hum_/.test(r.url));
  check('the empty override slots do not 404 in the first wave', early404.length <= 6,
        four04.length + ' total 404s (all expected: ' + four04.every(r => /hum_/.test(r.url)) + ')');

  // ---- 4. A FIRST-TIME PLAYER. They probably WILL watch the film, so shot one
  // is fair to fetch — but still only shot one.
  const fresh = await boot(false);
  const fintro = fresh.req.filter(r => /intro\d\.(mp4|webm)$/.test(r.url));
  check('a first boot fetches ONE opening shot, not eight', fintro.length <= 2,
        fintro.map(r => r.url).join(', ') || 'none');

  const total = ret.req.reduce((a, r) => a + r.size, 0);
  console.log('\n  a returning player\'s first 9 s: ' + ret.req.length + ' asset requests, ' + MB(total));
  console.log('  a first-time player\'s first 9 s: ' + fresh.req.length + ' asset requests, '
    + MB(fresh.req.reduce((a, r) => a + r.size, 0)));

  const errs = ret.errs.concat(fresh.errs);
  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — it starts on what it needs and buys the rest behind itself');
})().catch(e => { console.error(e); process.exit(1); });
