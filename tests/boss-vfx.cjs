// THE BOSSES' ATTACKS ARE GENERATED EFFECTS — owner, 2026-11-24: "Why is the boss attk graphics so
// basic? Why not apply vfx ... and create a well made fight? Instead of this bad one." The attacks
// after the rhino had been drawn in code out of circles and strokes. They are strips cut from
// generated clips now (js/bossvfx.js, tools/vfxstrip.py, assets/source/vfx/boss-2026-11-24/).
//   A  every strip in BOSS_VFX is on disk, archived with its master clip, and credited
//   B  every strip is USED: something outside js/bossvfx.js asks for it by name (declared and never
//      drawn is how art went missing for a year — ART_BIBLE §7)
//   C  in the running game each strip loads, and is the size its table says
//   D  the agent's attacks draw their strips: an ember bolt in flight, the pillar where the floor
//      erupts, the staff's cut, the fire crest of a ground wave
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  console.log('── boss-vfx — the bosses\' attacks are generated effects, every one used');
  const src = fs.readFileSync(path.join(ROOT, 'js/bossvfx.js'), 'utf8');
  const names = [...src.matchAll(/^  (\w+):\s+\{ cells:/gm)].map(m => m[1]);
  const credits = fs.readFileSync(path.join(ROOT, 'assets/CREDITS.md'), 'utf8');
  const missing = names.filter(n => !fs.existsSync(path.join(ROOT, 'assets/fx/boss', n + '.webp')) || !fs.existsSync(path.join(ROOT, 'assets/source/vfx/boss-2026-11-24', n + '.mp4')));
  check('A  every strip is on disk with its master clip, and credited', names.length >= 13 && !missing.length && credits.includes('fx/boss/'), { strips: names.length, missing });
  const js = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'bossvfx.js').map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n');
  const unused = names.filter(n => !js.includes("'" + n + "'"));
  check('B  every strip is asked for by an attack', !unused.length, unused.length ? { unused } : names.length + ' used');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, bossGlitch: 1 }); startGame(sv);
    loadRoom('GA1D'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = null;
    bossVfxPrefetch(Object.keys(BOSS_VFX));
    for (let i = 0; i < 80 && !Object.keys(BOSS_VFX).every(n => bossVfxReady(n)); i++) await new Promise(r => setTimeout(r, 100));
    window.requestAnimationFrame = () => 0;
    const sizes = {}; for (const n of Object.keys(BOSS_VFX)) { const im = bossVfxReady(n); sizes[n] = im ? [im.naturalWidth / BOSS_VFX[n].cells, im.naturalHeight] : null; }
    const e = G.enemies.find(q => q.kind === 'sage'); const c = document.createElement('canvas').getContext('2d');
    const asked = []; const was = drawBossVfxCell; drawBossVfxCell = function (cc, n, ...r) { asked.push(n); return was.call(this, cc, n, ...r); };
    const scene = (o) => { asked.length = 0; Object.assign(e, { tame: 0, locked: false, beads: [], marks: [], waves: [], rr: [], ringR: null }, o); drawSage(c, e); return asked.slice(); };
    const fy = e.y + e.h, out = {};
    out.bead = scene({ tSt: 'stand', beads: [{ x: e.x - 80, y: e.y, vx: -200, vy: 0, floor: fy }] });
    out.erupt = scene({ tSt: 'mark', marks: [{ x: e.x - 120, y: fy, t: -0.05, t0: 0.7 }] });
    out.sweep = scene({ tSt: 'sweep', tAge: 0.1 });
    out.wave = scene({ tSt: 'exhale', waves: [{ x: e.x - 100, y: fy, dir: -1, life: 0.5 }] });
    drawBossVfxCell = was; return { sizes, out };
  });
  const wrong = Object.entries(R.sizes).filter(([n, s]) => !s || !(s[0] > 8) || !(s[1] > 8));
  check('C  every strip loads in the game', !wrong.length, wrong.length ? wrong : Object.keys(R.sizes).length + ' strips');
  check('D  the agent\'s attacks draw their strips (bolt, pillar, staff cut, ground wave)', R.out.bead.includes('agent_bolt') && R.out.erupt.includes('agent_pillar') && R.out.sweep.includes('agent_slash') && R.out.wave.includes('agent_wave'), R.out);
  check('   no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the attacks are generated effects');
})().catch(e => { console.error(e); process.exit(1); });
