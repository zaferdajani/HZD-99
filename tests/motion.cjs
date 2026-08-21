// §3m — THE BOSS MOTION PLATES ACTUALLY DRAW (task #93).
//
// The failure this exists for is not a crash. Ten plates were fired for the
// guardians, keyed in media.js, and reached by NOTHING — the whole "wiring" was
// the key. It went unnoticed for days because a guardian with no plate looks
// exactly like a guardian whose plate has not loaded yet: it draws its parts
// rig, and the rig is correct-looking. So the question has to be "did the PLATE
// put pixels on this canvas in this state", and that is not answerable by
// reading the source — which is the standing reason files in here exist.
//
// It guards the other direction too. Six of the ten plates are a DIFFERENT
// CREATURE from the guardian that shipped (the comparisons and the verdicts are
// in docs/ART_QUEUE.md §3m). If one of those is wired later without a re-fire,
// the first check below goes red rather than the wrong animal quietly appearing
// in somebody's boss fight.
//
//   node tests/motion.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── motion — the fired guardian plates are on screen, not in the manifest\n');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = { wired: [], drew: {}, faced: {}, footed: {} };
    for (const k of Object.keys(BOSS_MOTION))
      for (const st of Object.keys(BOSS_MOTION[k].states)) out.wired.push(k + ':' + st);

    const ROOM = { glitch: 'A4', zero: 'D3', atlas: 'C3', brood: 'B4', prism: 'X1' };
    for (const kind of Object.keys(BOSS_MOTION)) {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(ROOM[kind]);
      await new Promise(r2 => requestAnimationFrame(r2));
      const bo = G.boss; if (!bo) continue;
      for (const st of Object.keys(BOSS_MOTION[kind].states))
        mediaFetch(BOSS_MOTION[kind].states[st].k, 1);
      for (let i = 0; i < 240; i++) await new Promise(r2 => requestAnimationFrame(r2));

      for (const st of Object.keys(BOSS_MOTION[kind].states)) {
        const W = 420, H = 420;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const x = cv.getContext('2d');
        // the body alone, drawn twice — rig, then plate — and DIFFED. A plate
        // that is never reached produces two identical frames, which is exactly
        // the state this whole file was written to catch.
        // `fv` is a PARAMETER. It was hardcoded to -1 inside here, which
        // quietly overrode the facing the caller had just set — so the mirror
        // check below was comparing a shape against its own mirror and
        // reporting the 53% self-overlap of an asymmetric animal as a failure.
        // A harness must not measure its own sampler; this is the fourth time
        // that sentence has had to be written in this repo.
        const snap = (plate, fv) => {
          G.bossRig = !plate;
          x.clearRect(0, 0, W, H);
          bo.st = st; bo.t = 0.2; bo.dead = false; bo.hurtT = 0; bo.stagT = 0;
          bo.purified = false; bo.anim = 1.2; bo.face = bo.faceVis = fv == null ? -1 : fv;
          x.save();
          x.translate(W / 2 - (bo.x + bo.w / 2), H - 60 - (bo.y + bo.h));
          try { bo.draw(x); } catch (e) {}
          x.restore();
          return x.getImageData(0, 0, W, H);
        };
        const rig = snap(false, -1), pl = snap(true, -1);
        G.bossRig = false;
        let diff = 0;
        for (let i = 0; i < rig.data.length; i += 4)
          if (Math.abs(rig.data[i] - pl.data[i])
            + Math.abs(rig.data[i + 1] - pl.data[i + 1])
            + Math.abs(rig.data[i + 2] - pl.data[i + 2]) > 30) diff++;
        out.drew[kind + ':' + st] = diff;

        // EVERYTHING BELOW IS MEASURED AGAINST THE RIG, NOT AGAINST ABSOLUTES.
        // The rig is the body that shipped and that the owner approved; if the
        // plate agrees with it on which way the animal points and where its
        // feet are, the swap is invisible. Absolute tests do not work here: the
        // first cut looked for "the head is the topmost pixel" and found the
        // coil's raised TAIL SPIKES, which are taller than its head.
        const shape = (img) => {
          let x0 = 1e9, x1 = -1, bot = -1, sx = 0, n = 0;
          for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
            if (img.data[(yy * W + xx) * 4 + 3] < 60) continue;
            if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
            if (yy > bot) bot = yy;
            sx += xx; n++;
          }
          return n ? { x0, x1, bot, cx: sx / n } : null;
        };
        const sr = shape(rig), sp = shape(pl);
        // WHICH WAY IT POINTS. Not measurable from the silhouette, and the two
        // attempts that tried are worth recording so nobody writes a third:
        // "the head is the topmost pixel" finds the coil's raised TAIL SPIKES,
        // and "the mass sits forward of centre" gives 0.44 for the rig against
        // 0.54 for the plate — a tenth apart, which is pose bulk, not facing.
        // Whether this plate points the way the guardian does was settled by
        // LOOKING at the two bodies side by side, and the verdict is written up
        // in docs/ART_QUEUE.md §3m.
        //
        // What IS measurable, and what actually regresses, is whether the flip
        // still happens: the fired set is not self-consistent about which way
        // it faces (nullfang_walk faces left, nullfang_coil right), so the
        // table carries a per-PLATE flag, and a flag that gets dropped or a
        // flip that breaks turns the guardian round without changing anything
        // else. So: draw it facing each way and require the two to be mirrors.
        const flipped = snap(true, 1);
        G.bossRig = false;
        let mirror = 0, opaque = 0;
        for (let yy = 0; yy < H; yy += 2) for (let xx = 0; xx < W; xx += 2) {
          const a = pl.data[(yy * W + xx) * 4 + 3];
          const bq = flipped.data[(yy * W + (W - 1 - xx)) * 4 + 3];
          if (a > 60 || bq > 60) { opaque++; if ((a > 60) === (bq > 60)) mirror++; }
        }
        out.faced[kind + ':' + st] = opaque ? +(mirror / opaque).toFixed(2) : -1;
        // WHERE IT STANDS: the plate's lowest opaque pixel against the rig's.
        // These mattes bake their own contact shadow, so the bottom edge is a
        // little below the soles in both — comparing like with like is the
        // only way that number means anything.
        out.footed[kind + ':' + st] = sr && sp ? sp.bot - sr.bot : 999;
      }
    }
    return out;
  });

  check('only the plates that survived the identity audit are wired',
    r.wired.length === 2 && r.wired.every(w => w.startsWith('glitch:')),
    r.wired.join(' '));
  for (const k of Object.keys(r.drew))
    check('the plate is what draws in ' + k + ', not the rig', r.drew[k] > 2000,
      r.drew[k] + ' px differ between the two frames');
  for (const k of Object.keys(r.faced))
    check('...and it turns with the guardian in ' + k + ' (the two facings are mirrors)',
      r.faced[k] > 0.9, (r.faced[k] * 100).toFixed(0) + '% of the silhouette mirrors');
  for (const k of Object.keys(r.footed))
    check('...and it stands where the rig stands in ' + k,
      Math.abs(r.footed[k]) <= 14, r.footed[k] + ' px below the rig\'s lowest pixel');
  check('no page errors while drawing them', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('');
  if (fails.length) { console.log('FAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('OK — the fired coil is on screen, facing the right way, standing on the floor');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
