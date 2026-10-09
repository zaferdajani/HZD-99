// RETIRED ART STAYS RETIRED (owner, 2026-10-09).
//
// "Why does the system still have old artwork for old characters? These
// fallbacks should have been deleted to prevent wasting tokens on creating
// artwork for something that we already removed."
//
// The cleanup deleted ~100 files and the code that could still reach them:
// the first-take Nullfang strips, the ten §3m guardian "motion plates", the
// driller, the industrial parallax, the edge_ depth planes, the slash sheets,
// the Alpha's nine still plates, the pack's two-frame walk/run pairs, the
// roster's crawler/hopper turntable rows, the whelp rig and the procedural
// hauler/leak-seeker. A fallback is the easiest thing in a game to bring back
// by accident — one `|| drawSomethingElse(c, this)` and the wrong creature is
// on screen for a frame — so this measures the rule rather than trusting it:
//
//   1. none of the retired keys is in the manifest, none of their files is on
//      disk, and the low tier carries no copy the index does not name;
//   2. the code that drew them is gone (no BOSS_MOTION, ALPHA_ART, drawDriller,
//      drawBeastMini, ALPHA_STRIP_STUDIO; no roster row for crawler/hopper/hzd);
//   3. a crawler or hopper whose plates have NOT arrived draws nothing at all,
//      in every CLAWBYTE kingdom and in NOSTOS — never another creature — and
//      draws its own animal once they have;
//   4. the Alpha with its takes withheld is the dark hold silhouette, not a
//      still plate, and with them it is the take.
//
//   node tests/retired.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
const ROOT = path.join(__dirname, '..');

const RETIRED_KEYS = ['bgMid', 'indFar', 'indMid', 'indFg', 'driller', 'edgeA', 'edgeC', 'strataIceA',
  'beastStalk', 'beastRoar', 'beastSwipe', 'beastLeap', 'beastSpringup', 'beastDive', 'beastPerch', 'beastDaze', 'beastNullcharge',
  'nullfangWalk', 'nullfangCoil', 'glaciereTravel', 'glaciereCoil', 'choirDrift', 'choirClench',
  'talonhostGlide', 'talonhostStrike', 'prismStalk', 'prismCoil',
  'slashH', 'slashD', 'slashU', 'slashDn', 'jetpackFire', 'winchHouse', 'swordGround',
  'swingClaw2', 'swingFinisher', 'swingBurst', 'swingJab', 'swingHook',
  'wolfWalkA', 'wolfWalkB', 'wolfRunA', 'wolfRunB', 'cheetahWalkA', 'cheetahWalkB', 'cheetahRunA', 'cheetahRunB',
  'alphaRest', 'alphaRoar', 'alphaHowl', 'alphaLeap', 'alphaCoil', 'alphaClaw', 'alphaBite', 'alphaClinch',
  'alphaRecoil', 'alphaTurn', 'alphaFree'];
const RETIRED_FILES = ['characters/driller_12x6.webp', 'characters/guardians', 'characters/beast/stalk.webp',
  'characters/beast/roar.webp', 'characters/beast/nullcharge.webp', 'characters/beasts/alpha.webp',
  'characters/beasts/wolf_walka.webp', 'characters/beasts/cheetah_runa.webp', 'backgrounds/ind_far.webp',
  'backgrounds/edge_a.webp', 'backgrounds/fore_b.webp', 'backgrounds/winch_house.webp', 'fx/slash_h.webp',
  'characters/hero/sword_ground.webp', 'characters/hero/swing/finisher.webp', 'characters/npc/ratchet/work_loop.webp',
  'sfx/kenney', 'sfx/vox/atk1.ogg'];

(async () => {
  console.log('── retired — the deleted art stays deleted, and nothing stands in for it');

  // ---- 1. disk -----------------------------------------------------------
  const onDisk = RETIRED_FILES.filter(f => fs.existsSync(path.join(ROOT, 'assets', f)));
  check('no retired file is on disk', !onDisk.length, onDisk.join(', '));
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/lowres/index.json'), 'utf8'));
  const named = new Set(Object.values(idx).map(p => path.basename(p)));
  const stale = fs.readdirSync(path.join(ROOT, 'assets/lowres')).filter(f => f !== 'index.json' && !named.has(f));
  check('the low tier holds only the copies its index names', !stale.length, stale.slice(0, 8).join(', '));
  const lowRetired = RETIRED_KEYS.filter(k => idx[k]);
  check('...and none of them is a retired sheet', !lowRetired.length, lowRetired.join(', '));
  const eyes = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/eyes.json'), 'utf8'));
  const eyeRetired = RETIRED_KEYS.filter(k => eyes[k]);
  check('the eye map measures no retired sheet', !eyeRetired.length, eyeRetired.join(', '));

  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  for (const pageName of ['index.html', 'odyssey.html']) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errs = []; page.on('pageerror', e => errs.push(String(e)));
    // the pack's and the Odyssey creatures' art is held back until released,
    // so "before it arrives" is a state this harness can stand in on purpose
    let hold = true;
    const HELD = /assets\/(characters\/beasts\/|characters\/alpha\/|lowres\/(wolf|cheetah|al[A-Z])|characters\/(hell-hound|fire-skull))/;
    await page.route('**/*', r => (hold && HELD.test(r.request().url())) ? r.abort() : r.continue());
    await page.goto('http://127.0.0.1:8220/' + pageName);
    await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

    if (pageName === 'index.html') {
      const code = await page.evaluate((RETIRED_KEYS) => ({
        keys: RETIRED_KEYS.filter(k => MEDIA_SRC.images[k]),
        tables: ['BOSS_MOTION', 'ALPHA_ART', 'ALPHA_STRIP_STUDIO', 'drawDriller', 'drawBeastMini', 'DRILLER']
          .filter(n => { try { return typeof eval(n) !== 'undefined'; } catch (e) { return false; } }),
        rows: ['hzd', 'crawler', 'hopper'].filter(s => ATLAS.sub[s]),
      }), RETIRED_KEYS);
      check('no retired key is in the manifest', !code.keys.length, code.keys.join(', '));
      check('the code that drew them is gone', !code.tables.length, code.tables.join(', '));
      check('the roster declares no row for her, the crawler or the hopper', !code.rows.length, code.rows.join(', '));
    }

    // ---- 3. the ground machines: nothing, then their own animal ------------
    const ROOMS_BY = pageName === 'index.html'
      ? { A: 'A1', B: 'B1', C: 'C2', D: 'D1', E: 'E1', X: 'X1' } : { A: 'A1', C: 'C2' };
    const drawn = async () => page.evaluate(async (ROOMS_BY) => {
      const out = {};
      for (const z in ROOMS_BY) {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
        startGame(sv); loadRoom(ROOMS_BY[z]);
        if (G.roomDef.zone !== z) { out[z] = { err: ROOMS_BY[z] + ' is zone ' + G.roomDef.zone }; continue; }
        G.save.flags.alpha = 0;
        for (const kind of ['crawler', 'hopper']) {
          const e = new Enemy(kind, 200, 200);
          e.anim = 1.2; e.faceVis = -1; e.dir = -1; e.on = true;
          const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300;
          const c = cv.getContext('2d', { willReadFrequently: true });
          let px = 0;
          for (let f = 0; f < 3; f++) {
            c.clearRect(0, 0, 400, 300);
            G.artProbe = 1; try { e.draw(c); } catch (er) { out.err = String(er); } G.artProbe = 0;
            await new Promise(r => requestAnimationFrame(r));
          }
          const d = c.getImageData(0, 0, 400, 300).data;
          for (let i = 3; i < d.length; i += 4) if (d[i] > 40) px++;
          out[z + ':' + kind] = px;
        }
      }
      return out;
    }, ROOMS_BY);
    const before = await drawn();
    // ...release the art and wait for every plate of every set to land
    hold = false;
    await page.evaluate(async () => {
      const keys = isHero() ? ['houndRun', 'houndIdle', 'skull']
        : [...new Set([...Object.values(WOLF_ART), ...Object.values(CHEETAH_ART)].map(a => a.img))];
      for (const k of keys) { delete MEDIA_PEND[k]; delete MEDIA_LOW[k]; mediaFetch(k, false); }
      for (let i = 0; i < 600 && !keys.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++)
        await new Promise(r => setTimeout(r, 50));
    });
    const after = await drawn();
    const tag = pageName === 'index.html' ? 'CLAWBYTE' : 'NOSTOS';
    for (const k of Object.keys(before)) {
      if (before[k] && before[k].err) { check(tag + ' ' + k, false, before[k].err); continue; }
      check(tag + ' ' + k + ': with its art still in flight it draws NOTHING, not another creature',
        before[k] === 0, before[k] + ' px');
      check(tag + ' ' + k + ': ...and its own animal once the art is here', after[k] > 250, after[k] + ' px');
    }

    // ---- 4. the Alpha: the hold, then the take ------------------------------
    if (pageName === 'index.html') {
      hold = true;
      const al = await page.evaluate(async () => {
        const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
        startGame(sv); loadRoom('A10');
        const b = G.boss; if (!b || b.kind !== 'alpha') return { err: 'no Alpha in A10' };
        const shot = () => {
          const cv = document.createElement('canvas'); cv.width = 480; cv.height = 360;
          const c = cv.getContext('2d', { willReadFrequently: true });
          b.st = 'rest'; b.t = 0.5; b.dead = false; b.hurtT = 0; b.anim = 1.2; b.face = b.faceVis = -1; b.vx = 0;
          G.artProbe = 1; c.save(); c.translate(240 - (b.x + b.w / 2), 300 - (b.y + b.h));
          G.lastStrip = null; try { b.draw(c); } catch (e) {} c.restore(); G.artProbe = 0;
          // the hold is an ellipse the size of the hitbox; any plate or take
          // stands two hitboxes tall — so the drawn height says which it is
          const d = c.getImageData(0, 0, 480, 360).data; let px = 0, y0 = 1e9, y1 = -1;
          for (let i = 0, q = 0; i < d.length; i += 4, q++) if (d[i + 3] > 40) {
            px++; const y = (q / 480) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
          return { px, tall: +((y1 - y0 + 1) / b.h).toFixed(2), strip: G.lastStrip };
        };
        for (const k of ALPHA_STRIPS) { delete MEDIA_RAW[k]; delete MEDIA_PEND[k]; delete MEDIA_LOW[k]; }
        const held = shot();
        return { held };
      });
      hold = false;
      const al2 = await page.evaluate(async () => {
        const b = G.boss;
        for (const k of ALPHA_STRIPS) { delete MEDIA_PEND[k]; mediaFetch(k, false); }
        for (let i = 0; i < 600 && !ALPHA_STRIPS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++)
          await new Promise(r => setTimeout(r, 50));
        const cv = document.createElement('canvas'); cv.width = 480; cv.height = 360;
        const c = cv.getContext('2d', { willReadFrequently: true });
        b.st = 'rest'; b.t = 0.5; b.dead = false; b.hurtT = 0; b.anim = 1.2; b.face = b.faceVis = -1; b.vx = 0;
        G.artProbe = 1; c.translate(240 - (b.x + b.w / 2), 300 - (b.y + b.h));
        G.lastStrip = null; try { b.draw(c); } catch (e) {} G.artProbe = 0;
        return { strip: G.lastStrip };
      });
      if (al.err) check('the Alpha', false, al.err);
      else {
        check('the Alpha with its takes withheld is the dark hold, not a still plate',
          al.held.px > 0 && al.held.tall <= 1.25 && !al.held.strip, JSON.stringify(al.held));
        check('...and with them it is the filmed take', /^alRest:/.test(al2.strip || ''), String(al2.strip));
      }
    }
    check(pageName + ': no page errors', !errs.length, errs.slice(0, 2).join(' | '));
    await page.close();
  }
  await browser.close();
  console.log('');
  if (fails.length) { console.log('FAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('OK — the retired art is gone, and nothing wears another creature\'s body while it loads');
})().catch(e => { console.error(e); process.exit(1); });
