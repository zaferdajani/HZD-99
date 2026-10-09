// THE FILMED MOVES ACTUALLY DRAW (ART_QUEUE §2ax).
//
// The failure this exists for is not a crash. Art can be keyed in media.js and
// reached by NOTHING — it went unnoticed for days once, because a guardian
// with no take looks exactly like a guardian whose take has not loaded yet: it
// draws its parts rig, and the rig is correct-looking. So the question has to
// be "did the TAKE put pixels on this canvas in this state", and that is not
// answerable by reading the source.
//
// It also guards the retirement of §3m: ten still "motion plates" were fired
// for the guardians, six of them a different creature from the guardian that
// shipped, and none was ever drawn. They were deleted (2026-10-09) along with
// the table that could have wired them in front of a rig; the first check
// below goes red if that table comes back.
//
//   node tests/motion.cjs      (needs the repo served on :8220)
const { chromium } = require('playwright');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};

(async () => {
  console.log('── motion — the filmed guardian takes are on screen, not in the manifest\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const r = await page.evaluate(async () => {
    const out = { plateTable: typeof BOSS_MOTION !== 'undefined' };
    // ---- THE FILMED MOVES (§2ax): every strip state draws the STRIP --------
    // Same diff, same law, a different body: BEAST_STRIP maps Nullfang's
    // states onto ten filmed takes. G.beastRig forces the rig for the
    // comparison frame. Each state is put in the middle of its own clock so
    // a cell with the animal in it is what gets sampled.
    out.strips = {}; out.stripFaced = {}; out.stripFooted = {};
    {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom('A4');
      await new Promise(r2 => requestAnimationFrame(r2));
      const bo = G.boss;
      if (bo && typeof BEAST_STRIP !== 'undefined') {
        for (const k of BEAST_STRIPS) mediaFetch(k, 1);
        for (let i = 0; i < 300 && !BEAST_STRIPS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++)
          await new Promise(r2 => requestAnimationFrame(r2));
        const POSE = {
          stalk: { t: 0.5 }, idle: { t: 0.5 }, roar: { t: 0.6 }, intro: { t: 0.5 },
          swipewarn: { t: 0.25 }, swipe: { t: 0.1 }, crouch: { t: 0.5 }, springwarn: { t: 0.2 },
          pounce: { vy: -300 }, recover: { t: 0.15 }, spring: { u: 0.5 }, dive: { u: 0.5 },
          perch: { t: 0.8 }, daze: { t: 1 }, nullcharge: { t: 0.5 }, nullhop: { t: 0.1 }, nullend: { t: 0.5 },
          dead: { dead: true, deathAnimT: 0.8 },
        };
        const W = 420, H = 420;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const x = cv.getContext('2d', { willReadFrequently: true });
        G.artProbe = 1;
        const snap2 = (st, strip, fv) => {
          G.beastRig = !strip;
          x.clearRect(0, 0, W, H);
          bo.dead = false; bo.hurtT = 0; bo.stagT = 0; bo.purified = false; bo.vy = 0; bo.u = 0; bo.nullSeq = 0;
          bo.anim = 1.2; bo.t = 0.5; bo.phase = 1; bo._sst = null;
          bo.st = st; Object.assign(bo, POSE[st] || {});
          bo.face = bo.faceVis = fv;
          x.save();
          x.translate(W / 2 - (bo.x + bo.w / 2), H - 60 - (bo.y + bo.h));
          try { bo.draw(x); } catch (e) {}
          x.restore();
          return x.getImageData(0, 0, W, H);
        };
        const shape2 = (img) => {
          let bot = -1, n = 0;
          for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
            if (img.data[(yy * W + xx) * 4 + 3] < 60) continue;
            if (yy > bot) bot = yy; n++;
          }
          return n ? { bot, n } : null;
        };
        for (const st of Object.keys(BEAST_STRIP)) {
          const rig = snap2(st, false, -1), sp = snap2(st, true, -1), fl = snap2(st, true, 1);
          let diff = 0;
          for (let i = 0; i < rig.data.length; i += 4)
            if (Math.abs(rig.data[i] - sp.data[i]) + Math.abs(rig.data[i + 1] - sp.data[i + 1])
              + Math.abs(rig.data[i + 2] - sp.data[i + 2]) > 30) diff++;
          out.strips[st] = diff;
          let mirror = 0, opaque = 0;
          for (let yy = 0; yy < H; yy += 2) for (let xx = 0; xx < W; xx += 2) {
            const a = sp.data[(yy * W + xx) * 4 + 3], bq = fl.data[(yy * W + (W - 1 - xx)) * 4 + 3];
            if (a > 60 || bq > 60) { opaque++; if ((a > 60) === (bq > 60)) mirror++; }
          }
          out.stripFaced[st] = opaque ? +(mirror / opaque).toFixed(2) : -1;
          const s1 = shape2(rig), s2 = shape2(sp);
          out.stripFooted[st] = s1 && s2 ? s2.bot - s1.bot : 999;
        }
        G.artProbe = 0; G.beastRig = false; bo.dead = false;
      }
    }
    // ---- THE ALPHA AND CHIME (§2ax, Kingdom 1): the same three laws ----------
    // The strip draws (differs from the plate), mirrors with the facing, and
    // — for the grounded Alpha — stands where the plate stands. Chime hovers
    // about its centre, so its footing is not a law.
    out.k1 = {};
    const K1 = [
      { kind: 'alpha', room: 'A10', flag: 'alphaRig', table: 'ALPHA_STRIP', strips: 'ALPHA_STRIPS',
        pose: { rest: { t: 0.5, vx: 0 }, prowl: { st: 'rest', t: 0.5, vx: 120 }, roarwarn: { t: 0.35 }, roar: { t: 0.2 },
                broodcall: { t: 0.35 }, howl: { t: 0.2 }, coil: { t: 0.25 }, leap: { t: 0.5 }, recoil: { t: 0.3 }, turn: { t: 0.2 },
                clawwarn: { t: 0.15 }, claw: { t: 0.1 }, bitewarn: { t: 0.15 }, bite: { t: 0.1 }, clinch: { t: 0.1 }, shake: { t: 0.3 },
                free: { tamed: true } }, grounded: 1 },
      { kind: 'chime', room: 'A9', flag: 'miniRig', table: null, strips: null,
        pose: { rest: { t: 0.5 }, ringwarn: { t: 0.15 }, ring: { t: 0.25 }, notewarn: { t: 0.15 }, note: { t: 0.25 },
                dead: { dead: true, deathAnimT: 0.8 } }, grounded: 0 },
    ];
    for (const Q of K1) {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(Q.room);
      await new Promise(r2 => requestAnimationFrame(r2));
      const bo = G.boss && G.boss.kind === Q.kind ? G.boss : (G.enemies || []).find(e => e && e.kind === Q.kind);
      if (!bo) { out.k1[Q.kind + ':missing'] = { drew: 0 }; continue; }
      const keys = Q.kind === 'alpha' ? ALPHA_STRIPS : Object.values(MINI_STRIP.chime).map(s => s.key);
      for (const k of keys) mediaFetch(k, 1);
      if (Q.kind !== 'alpha') for (const k of [MINI_ART.chime.rest, MINI_ART.chime.warn]) mediaFetch(k, 1);
      for (let i = 0; i < 400 && !keys.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); i++)
        await new Promise(r2 => requestAnimationFrame(r2));
      const W = 480, H = 480;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const x = cv.getContext('2d', { willReadFrequently: true });
      G.artProbe = 1;
      const snap3 = (st, strip, fv) => {
        G[Q.flag] = !strip;
        x.clearRect(0, 0, W, H);
        bo.dead = false; bo.hurtT = 0; bo.stagT = 0; bo.purified = false; bo.tamed = false; bo.vx = 0; bo.vy = 0;
        bo.anim = 1.2; bo.t = 0.5; bo._onceSt = null; bo._px = null; bo._pd = 0;
        bo.st = st; Object.assign(bo, Q.pose[st] || {});
        bo.face = bo.faceVis = fv;
        // a moving body leans INTO its motion, so the mirror of a right-facing
        // prowl is a left-facing prowl moving left — the velocity flips with
        // the facing or the lean breaks the mirror on its own
        if (bo.vx) bo.vx = Math.abs(bo.vx) * fv;
        x.save();
        x.translate(W / 2 - (bo.x + bo.w / 2), H - 80 - (bo.y + bo.h));
        try { bo.draw(x); } catch (e) {}
        x.restore();
        return x.getImageData(0, 0, W, H);
      };
      const bottom = (img) => { let bot = -1; for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (img.data[(yy * W + xx) * 4 + 3] >= 60) { if (yy > bot) bot = yy; } return bot; };
      for (const st of Object.keys(Q.pose)) {
        const rig = snap3(st, false, -1), sp = snap3(st, true, -1), fl = snap3(st, true, 1);
        let diff = 0;
        for (let i = 0; i < rig.data.length; i += 4)
          if (Math.abs(rig.data[i] - sp.data[i]) + Math.abs(rig.data[i + 1] - sp.data[i + 1])
            + Math.abs(rig.data[i + 2] - sp.data[i + 2]) > 30) diff++;
        let mirror = 0, opaque = 0;
        for (let yy = 0; yy < H; yy += 2) for (let xx = 0; xx < W; xx += 2) {
          const a = sp.data[(yy * W + xx) * 4 + 3], bq = fl.data[(yy * W + (W - 1 - xx)) * 4 + 3];
          if (a > 60 || bq > 60) { opaque++; if ((a > 60) === (bq > 60)) mirror++; }
        }
        // the Alpha has no plate under its takes any more (the "rig" frame is
        // the dark hold silhouette), so its feet answer to the hitbox floor
        // itself, which snap3 puts at H - 80
        out.k1[Q.kind + ':' + st] = { drew: diff, faced: opaque ? +(mirror / opaque).toFixed(2) : -1,
                                      footed: Q.grounded ? bottom(sp) - (H - 80) : 0 };
      }
      G.artProbe = 0; G[Q.flag] = false; bo.dead = false; bo.tamed = false;
    }
    return out;
  });

  const K1_AIR = ['alpha:leap', 'alpha:recoil', 'alpha:turn', 'alpha:coil', 'alpha:free', 'alpha:clinch', 'alpha:shake'];
  for (const k of Object.keys(r.k1 || {})) {
    const v = r.k1[k];
    check('the filmed take is what draws ' + k + ', not the stand-in', v.drew > 2000, v.drew + ' px differ');
    if (v.drew > 2000) check('...and it turns with the body in ' + k, v.faced >= 0.9, 'mirror agreement ' + v.faced);
    if (v.drew > 2000 && k.startsWith('alpha:') && !K1_AIR.includes(k))
      check('...and its feet are on the floor in ' + k, Math.abs(v.footed) <= 14, v.footed + ' px off the hitbox floor');
  }

  check('the retired §3m still-plate table is gone (no plate can draw in front of a guardian\'s rig or take)',
    !r.plateTable);
  // the ground-standing states, where the strip's feet must meet the rig's;
  // airborne states (pounce, spring, dive, the null float) legitimately lift
  const GROUNDED = ['stalk', 'idle', 'roar', 'swipewarn', 'swipe', 'crouch', 'springwarn', 'recover', 'perch', 'daze', 'nullcharge', 'nullend'];   // not the death: the rig's collapse sinks 44 px through its own sole line on purpose
  for (const st of Object.keys(r.strips || {})) {
    check('the filmed take is what draws NULLFANG\'s ' + st + ', not the rig', r.strips[st] > 2000,
      r.strips[st] + ' px differ');
    check('...and it turns with him in ' + st, r.stripFaced[st] >= 0.9, 'mirror agreement ' + r.stripFaced[st]);
    if (GROUNDED.includes(st))
      check('...and its feet are where the rig\'s are in ' + st, Math.abs(r.stripFooted[st]) <= 12,
        r.stripFooted[st] + ' px off the rig\'s sole line');
  }
  check('no page errors while drawing them', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('');
  if (fails.length) { console.log('FAILED:\n' + fails.map(f => '  ' + f).join('\n')); process.exit(1); }
  console.log('OK — the filmed takes are on screen, facing the right way, standing on the floor');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
