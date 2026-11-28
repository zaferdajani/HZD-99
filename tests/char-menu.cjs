// THE CHARACTER MENU — owner, 2026-11-28: "create graphically amazing interface for my equipments and
// skills instead of these silly tags on the top, which I can use by clicking on the controller's
// option or start ... I want something like [Silksong's], but for the game." (js/charmenu.js)
//   A  Options / Start (Esc) in play opens it on her EQUIPMENT page; closing and opening again lands
//      on the page she last had open
//   B  the bumpers turn its pages — LB / RB as a pad sends them (the ARM and DASH actions) and Q / E
//      on a keyboard — through every page in order and round; the map's page only once the map is hers
//   C  every page draws under its medallions, with art in every medallion and no page error
//   D  a tap on a medallion turns to that page; a tap on a socket round the crest selects a part seated in it
//   E  the crest holds the blade she holds: the weapon in the ring's heart is her weapon mode, and her
//      figure wears the single blade only when the single blade is hers (ledger: holds only what it has)
//   F  Options closes it from every page
//   G  its words are there in all five languages
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── char-menu — one menu on Options, its pages on the bumpers, the crest at its heart');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2;
    Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1, crystal2: 1 }); sv.weaponMode = 'single';
    sv.items = { kit: 1 }; sv.relics = ['bell'];
    startGame(sv); loadRoom('A2'); G.state = 'PLAY'; G.dialog = G.cut = G.meet = G.wake = G.tut = null; G.zoneToast = null;
    let T = performance.now();
    const tick = (n) => { for (let i = 0; i < (n || 1); i++) { T += 1000 / 60; mainLoop(T); } };
    const press = (code) => { keys[code] = 1; keysP[code] = 1; tick(1); delete keysP[code]; delete keys[code]; tick(1); };
    for (const k of ['ringConduit', 'heroYaw', 'heroYawBare', 'swordSingle', 'swordJoined', 'cmCard', 'cmCardDim', 'cmRow', 'cmRowOn', 'cmSlot', 'cmSlotOn', 'cmGrid', 'spareCell', 'rawMarble', 'scrapPile', 'wolfIdle6', 'ptSocket', 'ptFrame', 'ptCard', 'jetpack', 'bootsIdle']) mediaFetch(k, 1);
    for (let i = 0; i < 60 && !['ringConduit', 'heroYaw', 'swordSingle', 'cmCard', 'spareCell', 'rawMarble', 'wolfIdle6'].every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++) await new Promise(r => setTimeout(r, 100));
    tick(30);
    // A
    press('Escape'); out.opened = G.state;
    press('KeyE'); press('KeyE'); out.after2 = G.state;
    press('Escape'); out.closed = G.state;
    press('Escape'); out.reopened = G.state;
    // B: the pad's bumpers are the ARM and DASH actions; walk round both ways
    G.state = 'PLAY'; tick(2); press('Escape');
    const order = [G.state];
    for (let i = 0; i < 9; i++) { press(i % 2 ? 'KeyE' : 'KeyE'); order.push(G.state); }
    out.order = order;
    const back = [G.state]; for (let i = 0; i < 3; i++) { press('KeyQ'); back.push(G.state); } out.back = back;
    // (the pad: GP_ARM / GP_DASH are what LB / RB press)
    const s0 = G.state; keysP.GP_DASH = 1; keys.GP_DASH = 1; tick(1); delete keysP.GP_DASH; delete keys.GP_DASH; tick(1); out.padR = [s0, G.state];
    out.tabs = cmTabs().map(tb => tb.st); out.mapOn = mapUnlocked();
    // C: every page draws under its medallions, every medallion with art
    out.pages = {};
    for (const tb of cmTabs()) {
      cmEnter(tb.st); CM.tabT = 1; CM.openT = 1;
      let err = null; try { draw(performance.now()); } catch (e) { err = String(e); }
      out.pages[tb.st] = { state: G.state, err, on: cmOn() };
    }
    out.art = ['swordSingle', 'spareCell', 'rawMarble', 'wolfIdle6', 'ringConduit', 'heroYaw', 'cmCard'].filter(k => !(MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth));
    // D: taps
    cmEnter('CREST');
    const geo = cmTabGeom(), bagT = geo.find(q => q.tb.st === 'BAG');
    cmTap(bagT.x, bagT.y); out.tapTab = G.state;
    cmEnter('CREST');
    const rows = gearRows(G.save), boots = CM_SOCKETS.find(S => S.slot === 'gear_bootslot'), C = CM_CREST;
    G.crestIdx = rows.findIndex(r => r.id.startsWith('weapon:'));
    const a = boots.a * Math.PI / 180; gearTouch(C.x + Math.cos(a) * C.sock, C.y + Math.sin(a) * C.sock);
    out.tapSocket = cmSlotOf(gearRows(G.save)[G.crestIdx]);
    // E: the crest's heart and her figure
    const drawn = []; const W0 = window.cmWeaponArt, F0 = window.cmArt;
    window.cmWeaponArt = function (m) { drawn.push('weapon:' + m); return W0.apply(this, arguments); };
    window.cmArt = function (k) { if (/^heroYaw/.test(k)) drawn.push('figure:' + k); return F0.apply(this, arguments); };
    out.wear = {};
    for (const m of ['single', 'claws']) {
      drawn.length = 0; equipWeapon(m); cmEnter('CREST'); draw(performance.now());
      out.wear[m] = { heart: drawn.includes('weapon:' + m), figure: drawn.find(s => s.startsWith('figure:')) };
    }
    window.cmWeaponArt = W0; window.cmArt = F0; equipWeapon('single');
    // F: Options closes from every page
    out.closes = {};
    for (const tb of cmTabs()) { G.state = 'PLAY'; tick(2); cmEnter(tb.st); press('Escape'); out.closes[tb.st] = G.state; }
    // G
    out.words = {};
    for (const L of ['en', 'ar', 'tr', 'zh', 'ru']) { LANG = L; out.words[L] = ['cm_system', 'cm_tabs', 'cm_close', 'cm_install', 'cm_use', 'cm_armslot', 'cm_open_map'].filter(k => { const v = t(k); return !v || v === k || (L !== 'en' && (() => { const e0 = LANG; LANG = 'en'; const e = t(k); LANG = e0; return v === e; })()); }); }
    LANG = 'en';
    return out;
  });
  check('A  Options / Esc in play opens her equipment first', R.opened === 'CREST', R.opened);
  check('   ...closes it, and opening again lands on the page she last had', R.closed === 'PLAY' && R.reopened === R.after2, { after2: R.after2, closed: R.closed, reopened: R.reopened });
  const tabs = R.tabs, n = tabs.length;
  const walk = R.order.every((s, i) => i === 0 || tabs.indexOf(s) === (tabs.indexOf(R.order[i - 1]) + 1) % n);
  check('B  the right bumper turns every page in order and round (' + n + ' pages)', walk && n >= 6, R.order.join(' → '));
  const walkB = R.back.every((s, i) => i === 0 || tabs.indexOf(s) === (tabs.indexOf(R.back[i - 1]) + n - 1) % n);
  check('   ...the left one back', walkB, R.back.join(' → '));
  check('   ...and the pad\'s RB is the same turn', tabs.indexOf(R.padR[1]) === (tabs.indexOf(R.padR[0]) + 1) % n, R.padR);
  check('   ...the map\'s page only once the map is hers', tabs.includes('CMAP') === !!R.mapOn, { tabs, map: R.mapOn });
  check('C  every page draws under its medallions, without an error', Object.values(R.pages).every(p => p.on && !p.err), R.pages);
  check('   ...and every medallion\'s art is there', R.art.length === 0, R.art);
  check('D  a tap on a medallion turns to its page', R.tapTab === 'BAG', R.tapTab);
  check('   ...a tap on a socket round the crest selects a part seated in it', R.tapSocket === 'gear_bootslot', R.tapSocket);
  check('E  the crest\'s heart holds the blade she holds', R.wear.single.heart && R.wear.claws.heart, R.wear);
  check('   ...and her figure wears the single blade only when it is hers', R.wear.single.figure === 'figure:heroYaw' && R.wear.claws.figure === 'figure:heroYawBare', R.wear);
  check('F  Options closes it from every page', Object.values(R.closes).every(s => s === 'PLAY'), R.closes);
  check('G  its words are there in all five languages', Object.values(R.words).every(l => !l.length), R.words);
  check('   no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — one menu, its pages on the bumpers, the crest holding what she holds');
})().catch(e => { console.error(e); process.exit(1); });
