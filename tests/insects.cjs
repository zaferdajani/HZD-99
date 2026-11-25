// THE SMALL LIFE OF A PLACE — owner, 2026-11-25: "add insects proper to the place ... distributed
// in caves and the game all around, like butterflies, like um, dragonflies near swamps in the swamp
// area ... They are not NPCs, they're just flying away. We can't interact with them. And they're
// small."
//   A  the meadow has butterflies, the swamp dragonflies, a cave moths; a workshop indoors has none
//   B  they are small: none drawn taller than 14 px
//   C  they fly: each moves, stays in the open air, and keeps to its room
//   D  they fly away from her: one she walks up to is further from her a second later
//   E  nothing touches them: they are not enemies, not pickups, not statics, and hurt no one
//   F  the art is on disk, archived and credited; no page errors
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── insects — small, of their place, flying off from her, touching nothing');
  const credits = fs.readFileSync(path.join(ROOT, 'assets/CREDITS.md'), 'utf8');
  const art = ['butterfly', 'moth', 'dragonfly'].every(n => fs.existsSync(path.join(ROOT, 'assets/fx/insects', n + '.webp')));
  const masters = ['butterfly.jpg', 'moth.png', 'dragonfly.jpg'].every(n => fs.existsSync(path.join(ROOT, 'assets/source/insects', n)));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const R = await page.evaluate(async () => {
    window.requestAnimationFrame = () => 0;
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, ferryPaid: 1 }); startGame(sv);
    const go = (id) => { loadRoom(id); G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.tut = null; G.enemies = []; updateInsects(1 / 60); return INSECTS.list.map(q => q.k); };
    const out = { kinds: { A2: go('A2'), SW1: go('SW1'), CV2: go('CV2'), A0B: go('A0B') } };
    // B: drawn size
    for (const k of Object.keys(INSECT_KIND)) mediaFetch(INSECT_KIND[k].key, true);
    for (let i = 0; i < 60 && !Object.values(INSECT_KIND).every(K => MEDIA_IMG[K.key] && MEDIA_IMG[K.key].naturalWidth); i++) await new Promise(r => setTimeout(r, 100));
    out.maxH = Math.max(...Object.values(INSECT_KIND).map(K => K.h));
    // C: they fly, in the air, in the room
    go('A2'); player.x = -5000;
    const start = INSECTS.list.map(q => [q.x, q.y]);
    for (let i = 0; i < 180; i++) updateInsects(1 / 60);
    const W = G.roomDef.w * TILE, H = G.roomDef.h * TILE;
    out.moved = INSECTS.list.every((q, i) => Math.hypot(q.x - start[i][0], q.y - start[i][1]) > 4);
    out.inAir = INSECTS.list.every(q => insectAir(q.x, q.y));
    out.inRoom = INSECTS.list.every(q => q.x > -20 && q.x < W + 20 && q.y > -30 && q.y < H);
    // D: she walks up to one: a second later it is further away
    const q = INSECTS.list[0]; player.x = q.x - 40 - player.w / 2; player.y = q.y - player.h / 2;
    const d0 = Math.hypot(q.x - (player.x + player.w / 2), q.y - (player.y + player.h / 2));
    for (let i = 0; i < 60; i++) updateInsects(1 / 60);
    out.flee = { d0: Math.round(d0), d1: Math.round(Math.hypot(q.x - (player.x + player.w / 2), q.y - (player.y + player.h / 2))) };
    // E: nothing of theirs is in the world's lists
    out.apart = !G.enemies.some(e => INSECTS.list.includes(e)) && !G.pickups.some(p => INSECTS.list.includes(p)) && !(G.statics || []).some(s => INSECTS.list.includes(s));
    // and drawing them throws nothing
    const c = document.createElement('canvas').getContext('2d'); drawInsects(c);
    return out;
  });
  const K = R.kinds;
  check('A  of their place: butterflies in the meadow, dragonflies over the swamp, moths in the cave, none indoors',
    K.A2.includes('butterfly') && K.SW1.includes('dragonfly') && K.CV2.length && K.CV2.every(k => k === 'moth') && K.A0B.length === 0, K);
  check('B  small: none drawn taller than 14 px', R.maxH <= 14, { tallest: R.maxH });
  check('C  they fly, in the open air, in their room', R.moved && R.inAir && R.inRoom, { moved: R.moved, inAir: R.inAir, inRoom: R.inRoom });
  check('D  they fly away from her', R.flee.d1 > R.flee.d0 + 30, R.flee);
  check('E  nothing touches them: not enemies, pickups or statics', R.apart);
  check('F  the art is on disk, archived and credited; no page errors', art && masters && /fx\/insects/.test(credits) && errs.length === 0, { art, masters, errs: errs.slice(0, 2) });
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the small life of a place');
})().catch(e => { console.error(e); process.exit(1); });
