// WHAT SHE HAS, AND THE KEY THAT USES IT.
// Owner, 2026-11-16: "learn from Hollow Knight menu, where you can find all the
// skills and the things you got. Because when I beat the alpha, it says I got
// something freezing ability... I have no idea how to use them. There is no
// guidance, and there is no way to tell what I have and what I don't have. And
// there is no way to change between swords."
//   A  the Inventory no longer answers a cat carrying a sword with "nothing":
//      it points at GEAR, and the Gear key (or OK on an empty bag) goes there
//   B  GEAR lists her blades, and Enter on one she owns puts it in her paws
//   C  every suit a guardian left her is a row: Enter wears it, Enter again
//      takes it off
//   D  every part she HAS says the key that uses it, in her own bindings
//   E  a part she has not found says so, and offers no key
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, crystal: 1 }); sv.abil = { dash: 1, djump: 1 }; sv.arms = ['frost', 'shard']; startGame(sv); grantWeapon('single');
    loadRoom('A3'); G.state = 'PLAY'; G.dialog = G.wake = G.cut = null; for (let i = 0; i < 10; i++) { if (G.dialog) dialogClose(G.dialog); G.state = 'PLAY'; update(1 / 60); }
    const said = []; const realF = window.ftxt; window.ftxt = function (s) { said.push(String(s)); return realF.apply(this, arguments); };
    const press = (code) => { keys[code] = 1; keysP[code] = 1; update(1 / 60); delete keysP[code]; delete keys[code]; update(1 / 60); };
    // A
    G.state = 'BAG'; G.bagIdx = 0; said.length = 0; draw(performance.now());
    out.A = { bag: bagList().length, points: said.some(s => s === t('bag_gear').replace('%k', howToOpen('CREST', t('crest_title')))), line: t('bag_gear') };
    press('KeyI'); out.A.byKey = G.state; G.state = 'BAG'; press('Enter'); out.A.byOk = bagList().length ? 'n/a' : G.state;
    // B
    G.state = 'CREST'; const rows = () => gearRows(G.save); const at = (id) => rows().findIndex(r => r.id === id);
    equipWeapon('claws'); G.crestIdx = at('weapon:single'); press('Enter'); out.B = { mode: weaponMode(), installed: rows()[at('weapon:single')].installed };
    G.crestIdx = at('weapon:claws'); press('Enter'); out.B.back = weaponMode(); G.crestIdx = at('weapon:dual'); const m0 = weaponMode(); press('Enter'); out.B.unowned = weaponMode() === m0;
    equipWeapon('single');
    // C
    out.C = { rows: rows().filter(r => r.id.startsWith('arm:')).map(r => r.id) };
    G.state = 'CREST'; G.crestIdx = at('arm:frost'); press('Enter'); out.C.worn = activeArm() && activeArm().id; out.C.shown = rows()[at('arm:frost')].installed;
    G.state = 'CREST'; G.crestIdx = at('arm:frost'); press('Enter'); out.C.off = activeArm() === null;
    // D / E
    G.state = 'CREST'; out.D = {}; out.E = {};
    for (const r of rows()) { G.crestIdx = at(r.id); said.length = 0; draw(performance.now()); const how = gearHow(r); if (r.acquired) out.D[r.id] = { how, drawn: !how || said.includes(how) }; else out.E[r.id] = how; }
    out.keys = { jump: howToOpen('JUMP'), dash: howToOpen('DASH'), atk: howToOpen('ATK'), cast: howToOpen('CAST'), arm: howToOpen('ARM') };
    window.ftxt = realF; return out; });
  console.log('── gear-how  — what she has, and the key that uses it');
  check('A  the Inventory points at GEAR', R.A.points && R.A.line !== 'bag_gear', R.A);
  check('   ...and the Gear key, or OK on an empty bag, goes there', R.A.byKey === 'CREST' && (R.A.byOk === 'CREST' || R.A.byOk === 'n/a'), R.A);
  check('B  Enter on a blade she owns puts it in her paws, and back', R.B.mode === 'single' && R.B.installed && R.B.back === 'claws', R.B);
  check('   ...and a blade she has not found is not equipped', R.B.unowned === true);
  check('C  each suit she owns is a row', R.C.rows.length === 2 && R.C.rows.includes('arm:frost'), R.C.rows);
  check('   ...Enter wears it, Enter again takes it off', R.C.worn === 'frost' && R.C.shown === true && R.C.off === true, R.C);
  const D = R.D, k = R.keys;
  check('D  her boots, jets, blade and suits each say their key', D.boots && D.boots.how.includes(k.jump) && D.dash.how.includes(k.dash) && D['weapon:single'].how.includes(k.atk) && D['arm:frost'].how.includes(k.cast) && D['arm:frost'].how.includes(k.arm), { boots: D.boots && D.boots.how, dash: D.dash && D.dash.how, sword: D['weapon:single'] && D['weapon:single'].how, suit: D['arm:frost'] && D['arm:frost'].how });
  check('   ...and the line is on the screen when the part is selected', Object.keys(D).every(id => D[id].drawn), Object.keys(D).filter(id => !D[id].drawn));
  check('E  a part she has not found offers no key', Object.keys(R.E).length > 0 && Object.keys(R.E).every(id => R.E[id] === ''), R.E);
  check('no page errors', errs.length === 0, errs.slice(0, 2));
  await browser.close(); console.log(bad ? '\nFAILED: ' + bad : '\nOK — Gear says what she has and how to use it'); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
