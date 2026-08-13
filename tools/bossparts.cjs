// Restyle a boss WITHOUT moving a single pixel of its rig.
//
// The guardians are cut-out rigs: one atlas per boss, and a table of absolute
// pixel rects (BEAST_P, EAGLE_P, DRG_P, GLC_P, …) that the renderer slices for
// the head, each leg segment, each tail joint. Those numbers are also used as
// PIVOTS — `BEAST_P.head[2] / 2` is where the neck joins — so the atlas cannot
// be rescaled, re-laid-out, or regenerated freely. Hand a generative model the
// whole sheet and ask for "the same but smoother" and it will return something
// beautiful with every part in a slightly different place, which reads in game
// as a boss whose head has come off.
//
// So the geometry is never handed over. Each part is cut out HERE, restyled on
// its own, and pasted back into the same rect HERE. The model only ever sees one
// limb at a time and never gets a vote on where it goes.
//
//   node tools/bossparts.cjs extract <boss> <outdir>
//   node tools/bossparts.cjs rebuild <boss> <indir> <out.png>
//
// A part with no restyled counterpart in <indir> is copied through untouched,
// so a partial pass is safe and re-runnable.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

// The rect tables, mirrored from the js/ files. Kept here deliberately rather
// than parsed: if these ever drift from the source the rebuild would silently
// composite a boss out of the wrong slices, so `verify` checks them.
const BOSSES = {
  beast: {
    atlas: 'assets/characters/beast_parts.png', table: 'BEAST_P', src: 'js/beast.js',
    parts: {
      head: [6, 6, 154, 158], neck: [166, 6, 69, 88], body: [241, 6, 204, 144],
      fleg0: [451, 6, 68, 82], fleg1: [525, 6, 70, 109],
      bleg0: [601, 6, 70, 79], bleg1: [677, 6, 72, 114],
      tail0: [755, 6, 54, 45], tail1: [815, 6, 43, 39], tail2: [864, 6, 50, 32], tail3: [920, 6, 45, 28],
      full: [971, 6, 517, 270],
      aIdle: [6, 282, 197, 149], aWalk: [209, 282, 207, 139],
      aRoar: [422, 282, 237, 159], aAtk: [665, 282, 207, 106],
    },
  },
  eagle: {
    atlas: 'assets/characters/eagle_parts.png', table: 'EAGLE_P', src: 'js/eagle.js',
    parts: {
      eHead: [6, 6, 85, 107], eBody: [97, 6, 105, 134],
      eWingU: [208, 6, 181, 107], eWingL: [395, 6, 147, 90], eWingT: [548, 6, 73, 70],
      eTail: [627, 6, 98, 129], eMount: [731, 6, 109, 98], eTalon: [846, 6, 97, 90],
      eFull: [949, 6, 532, 313],
      pIdle: [6, 325, 173, 155], pDown: [185, 325, 188, 204],
      pUp: [379, 325, 182, 195], pShoot: [567, 325, 252, 157],
      kCharge: [825, 325, 228, 128], kFire: [1059, 325, 210, 116], kRecover: [1275, 325, 204, 119],
      fea0: [6, 535, 62, 30], fea1: [74, 535, 125, 34], fea2: [205, 535, 136, 33],
      pRest: [6, 371, 173, 109],
    },
    // pRest is the LOWER PART OF pIdle's rect, not its own drawing. Restyling
    // it separately would paste a second bird over the first; it inherits
    // pIdle's restyle for free, because the rebuild composites in atlas space.
    derived: ['pRest'],
    // the thrown feathers are free-flying projectiles at 2:1, 3.7:1 and 4.1:1
    fill: { fea0: 1, fea1: 1, fea2: 1 },
  },
  furnace: {
    atlas: 'assets/characters/dragon_parts.png', table: 'DRG_P', src: 'js/furnace.js',
    parts: {
      hero: [6, 6, 608, 541], ring: [620, 6, 512, 96],
      idle: [1138, 6, 170, 165], walk: [6, 553, 196, 168], fly: [208, 553, 230, 168],
      head: [444, 553, 140, 84], neck: [590, 553, 132, 107], body: [728, 553, 261, 125],
      flegR: [995, 553, 85, 118], flegL: [1086, 553, 79, 117],
      hlegR: [1171, 553, 86, 113], hlegL: [1263, 553, 70, 116],
      tail: [6, 727, 299, 75],
      wingR: [311, 727, 298, 239], wingL: [615, 727, 292, 238],
      core: [913, 727, 48, 60],
    },
    // the lava ring is a ground DECAL and the core is a 48px glow blob — both
    // are effects, not anatomy, and a model asked to "make it 3D" returns a
    // beautifully lit object where a flat additive smear is what the compositor
    // wants. Left alone deliberately.
    derived: ['ring', 'core'],
    // 299x75 — a 4:1 sliver no generator frame can match
    stretchMax: { tail: 1.35 },
  },
  glaciere: {
    atlas: 'assets/characters/glaciere_parts.png', table: 'GLC_P', src: 'js/glaciere.js',
    parts: {
      hero: [6, 6, 610, 413],
      head: [622, 6, 114, 129], neck: [742, 6, 63, 130], body: [811, 6, 192, 123],
      legF: [1009, 6, 68, 130], legH: [1083, 6, 71, 135], tail: [1160, 6, 136, 84],
      asm: [6, 425, 445, 294],
      lance: [457, 425, 128, 43], shard1: [610, 427, 77, 36],
      novaCr: [693, 425, 85, 95], orb: [784, 425, 20, 25],
      mane: [100, 10, 168, 162], tailW: [430, 230, 186, 155],
    },
    // mane and tailW are SUB-RECTS OF hero — the same pixels, read a second
    // time for the additive flow ghosts. They must never be restyled on their
    // own: that would paste a mane on top of the mane. They follow hero.
    // orb is 20x25; there is nothing there to make three-dimensional.
    derived: ['mane', 'tailW', 'orb'],
    // lance, shard and nova crystal are thrown/placed effects, joined to nothing
    fill: { lance: 1, shard1: 1, novaCr: 1 },
  },
  mother: {
    atlas: 'assets/characters/mother_parts.png', table: 'MVA', src: 'js/mother.js',
    parts: {
      plate: [427, 2, 175, 238], plateB: [604, 2, 175, 228],
      crack: [326, 360, 177, 216], crack2: [505, 360, 181, 216],
      collar: [2, 360, 322, 220],
      haloCR: [2, 582, 526, 196], haloR: [2, 780, 522, 184],
      coreS: [2, 966, 125, 118], coreB: [688, 360, 238, 215], coreD: [526, 780, 145, 148],
      tend1: [2, 2, 133, 356], tend2: [287, 2, 138, 340], tend3: [137, 2, 148, 356],
      stub: [129, 966, 155, 108],
      shard1: [673, 780, 108, 143], shard2: [783, 780, 100, 136], shard3: [491, 966, 101, 75],
      shard4: [885, 780, 116, 120], shard5: [286, 966, 115, 96], shard6: [403, 966, 86, 88],
    },
    // she is RADIAL: one plate drawn eight times IS the shell. That is the
    // whole reason the ring stays symmetrical, and it is also why `plate` is
    // the single highest-value part on any of these sheets — restyling it
    // restyles eight-sixteenths of the boss at once.
    //
    // Her two haloes and her two lit core states are pure additive GLOW —
    // painted light, not painted objects — and the compositor blends them as
    // light. Handed to a model they come back as beautifully lit solid rings,
    // which is the wrong thing rendered well. Only coreD, the dead unlit core,
    // is an object. Same call as the dragon's lava ring.
    derived: ['haloCR', 'haloR', 'coreS', 'coreB'],
    // the tendrils are 1:2.5 whips — narrower than any frame on offer
    stretchMax: { tend1: 1.6, tend2: 1.6, tend3: 1.6 },
    // the debris shards are thrown on death and land wherever they land
    fill: { shard1: 1, shard2: 1, shard3: 1, shard4: 1, shard5: 1, shard6: 1 },
  },
};

async function main() {
  const [mode, boss, dir, out] = process.argv.slice(2);
  const B = BOSSES[boss];
  if (!mode || !B) {
    console.log('usage: bossparts.cjs extract|rebuild|verify <boss> <dir> [out.png]');
    console.log('known bosses: ' + Object.keys(BOSSES).join(', '));
    process.exit(1);
  }

  // VERIFY FIRST, ALWAYS. The rects above are a copy; if the source moved on,
  // every slice is wrong and the damage is invisible until a boss animates.
  const src = fs.readFileSync(B.src, 'utf8');
  const bad = [];
  for (const [k, r] of Object.entries(B.parts)) {
    const re = new RegExp(k + ':\\s*\\[\\s*' + r.join('\\s*,\\s*') + '\\s*\\]');
    if (!re.test(src)) bad.push(k);
  }
  if (bad.length) {
    console.log('FAIL — these rects no longer match ' + B.src + ': ' + bad.join(', '));
    console.log('The table in this tool is a mirror of the one in the game. Re-sync it before running.');
    process.exit(1);
  }
  console.log('verified ' + Object.keys(B.parts).length + ' rects against ' + B.src);
  if (mode === 'verify') return;

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const atlasUrl = 'data:image/png;base64,' + fs.readFileSync(B.atlas).toString('base64');

  // SUB-RECTS AND EFFECTS ARE NOT PARTS. Some entries in these tables read the
  // same pixels a second time (glaciere's mane is a window into hero; eagle's
  // pRest is the bottom of pIdle), and some are additive effects rather than
  // anatomy. Both must be verified — they are still rig numbers — and neither
  // may be restyled independently, so they are excluded from extract and
  // ignored on rebuild even if a file for them is sitting in the directory.
  const DERIVED = new Set(B.derived || []);
  if (mode === 'extract') {
    fs.mkdirSync(dir, { recursive: true });
    for (const [k, r] of Object.entries(B.parts)) {
      if (DERIVED.has(k)) { console.log('  ' + k.padEnd(8) + ' skipped (derived from another rect)'); continue; }
      const url = await page.evaluate(async ({ atlasUrl, r }) => {
        const img = new Image(); img.src = atlasUrl; await img.decode();
        const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3];
        c.getContext('2d').drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        return c.toDataURL('image/png');
      }, { atlasUrl, r });
      fs.writeFileSync(path.join(dir, k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log('  ' + k.padEnd(8) + ' ' + r[2] + 'x' + r[3]);
    }
  } else if (mode === 'rebuild') {
    const restyled = {};
    for (const k of Object.keys(B.parts)) {
      if (DERIVED.has(k)) continue;
      const f = path.join(dir, k + '.png');
      if (fs.existsSync(f)) restyled[k] = 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
    }
    const res = await page.evaluate(async ({ atlasUrl, parts, restyled, stretchMax, fill }) => {
      const warn = [];
      const img = new Image(); img.src = atlasUrl; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);                       // everything not restyled survives
      // WHERE A PART SITS INSIDE ITS RECT IS THE RIG. The renderer pivots on
      // fractions of the rect — `BEAST_P.head[2] / 2` is where the neck joins —
      // so a restyled head that is merely centred differently inside the same
      // rectangle is a head mounted in the wrong place. Fitting frame-to-frame
      // would do exactly that, because the model reframes whatever it likes.
      //
      // So the fit is bounding box to bounding box: find the ink in the ORIGINAL
      // part, find the ink in the RESTYLED part, and map the second onto the
      // first. The joint stays where the rig expects it no matter how the model
      // chose to compose the picture.
      const inkBox = (ctx, w, h, alphaKeyed) => {
        const d = ctx.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
          const i = (y * w + xx) * 4;
          // an extracted part has real alpha; a generated one comes back on
          // black, so luminance stands in for it
          const on = alphaKeyed ? d[i + 3] > 24
            : (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) > 26;
          if (!on) continue;
          if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      };
      for (const [k, r] of Object.entries(parts)) {
        if (!restyled[k]) continue;
        const p = new Image(); p.src = restyled[k]; await p.decode();
        // where the ink was, in the original
        const oc = document.createElement('canvas'); oc.width = r[2]; oc.height = r[3];
        const ox = oc.getContext('2d', { willReadFrequently: true });
        ox.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
        const ob = inkBox(ox, r[2], r[3], true) || { x: 0, y: 0, w: r[2], h: r[3] };
        // where the ink is, in the restyle — and key the black backdrop off
        const nc = document.createElement('canvas'); nc.width = p.naturalWidth; nc.height = p.naturalHeight;
        const nx = nc.getContext('2d', { willReadFrequently: true });
        nx.drawImage(p, 0, 0);
        // KEYING BY BRIGHTNESS DOES NOT WORK ON A DARK SUBJECT, which is most
        // of them: NULLFANG is gunmetal on black, and its darkest plates sit in
        // the same luminance range as the backdrop. A global threshold turned
        // the lion into a ghost — every mid-tone panel half-dissolved, the
        // bright rim light left floating.
        //
        // The backdrop is not "the dark pixels", it is "the dark pixels
        // CONNECTED TO THE EDGE". So it is flood-filled inward from the border
        // and only what the fill reaches is removed; a dark panel enclosed by
        // the silhouette is never reached and survives at full opacity.
        const nd = nx.getImageData(0, 0, nc.width, nc.height);
        const q = nd.data, NW = nc.width, NH = nc.height;
        const lumAt = i => q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11;
        // ASK FOR BLACK AND YOU WILL EVENTUALLY GET WHITE. One forelimb in the
        // FURNACE pass came back on a white field despite the prompt, and a
        // keyer that only knows how to remove darkness turns that into a solid
        // white rectangle pasted over the hip. So the backdrop's polarity is
        // read from the picture rather than assumed: sample the corners, and
        // if they are bright, flood-fill brightness instead of darkness.
        const corner = [0, (NW - 1) * 4, (NH - 1) * NW * 4, (NW * NH - 1) * 4].map(lumAt);
        corner.sort((a, b) => a - b);
        const light = (corner[1] + corner[2]) / 2 > 128;
        const isBg = i => light ? lumAt(i) > 215 : lumAt(i) < 40;
        const bg = new Uint8Array(NW * NH);
        const stack = [];
        const BG_LUM = 40;                       // generous: the backdrop has bloom on it
        for (let xx = 0; xx < NW; xx++) { stack.push(xx); stack.push(xx + (NH - 1) * NW); }
        for (let yy = 0; yy < NH; yy++) { stack.push(yy * NW); stack.push(NW - 1 + yy * NW); }
        while (stack.length) {
          const n = stack.pop();
          if (bg[n]) continue;
          if (!isBg(n * 4)) continue;
          bg[n] = 1;
          const xx = n % NW, yy = (n - xx) / NW;
          if (xx > 0) stack.push(n - 1);
          if (xx < NW - 1) stack.push(n + 1);
          if (yy > 0) stack.push(n - NW);
          if (yy < NH - 1) stack.push(n + NW);
        }
        for (let n = 0; n < NW * NH; n++) {
          if (!bg[n]) { q[n * 4 + 3] = 255; continue; }
          // a soft rim rather than a cut edge: background pixels that are
          // nearly close enough to being subject keep a little alpha
          const l = lumAt(n * 4);
          if (light) {
            q[n * 4 + 3] = l < 245 ? Math.round((245 - l) / 30 * 200) : 0;
          } else {
            q[n * 4 + 3] = l > BG_LUM * 0.55 ? Math.round((l - BG_LUM * 0.55) / (BG_LUM * 0.45) * 200) : 0;
          }
        }
        nx.putImageData(nd, 0, 0);
        const nb = inkBox(nx, nc.width, nc.height, true) || { x: 0, y: 0, w: nc.width, h: nc.height };
        // ON A RIG, ALIGNMENT BEATS FIDELITY. Letterboxing the restyle inside
        // the original box preserves its aspect and is the honest thing to do
        // for a standalone picture — but here a leg that lands 6% short leaves
        // a 6% gap at the hip, and the boss walks with a hole in it. These
        // parts are meant to be the SAME shape, so any aspect difference is
        // the model drifting, not intent: it is stretched out, and the joint
        // lands exactly where the rig expects it.
        //
        // Past a threshold that stops being a correction and starts being a
        // distortion, so the drift is reported and the part is letterboxed
        // instead — a warning to regenerate rather than a silently squashed limb.
        const ar = (nb.w / nb.h) / (ob.w / ob.h);
        const drift = Math.abs(Math.log(ar));
        // 18% by default. A few parts are shaped so extremely that NO aspect
        // ratio the image model offers comes close — the dragon's tail is 4:1
        // and 21:9 is the widest frame that can be asked for — so their drift
        // is the generator's constraint rather than the model's invention, and
        // stretching a chain of tail segments 25% longer is invisible where a
        // 25% gap at the hip is not. Overrides are per-part and deliberate.
        // A FREE-FLOATING PROP HAS NO JOINT TO MISALIGN. A thrown feather, an
        // ice shard, a lance: nothing connects to them, so the whole reason for
        // the tolerance — keep the hip where the hip was — does not apply. They
        // simply want to fill their rect, and a lance that comes back stubbier
        // than it was drawn is a stubbier lance, not a broken one. Chasing the
        // exact aspect out of a generator that has no frame that shape is a
        // regeneration treadmill; this is the honest end of it.
        const lim = fill && fill[k] ? Infinity : ((stretchMax && stretchMax[k]) || 1.18);
        let sx0, sy0, dw, dh;
        if (drift <= Math.log(lim)) {                     // close enough — stretch
          dw = ob.w; dh = ob.h; sx0 = ob.x; sy0 = ob.y;
        } else {
          const k2 = Math.min(ob.w / nb.w, ob.h / nb.h);
          dw = nb.w * k2; dh = nb.h * k2;
          sx0 = ob.x + (ob.w - dw) / 2; sy0 = ob.y + (ob.h - dh) / 2;
          warn.push(k + ' aspect drift ' + ((ar - 1) * 100).toFixed(0) + '% — letterboxed, not stretched');
        }
        x.clearRect(r[0], r[1], r[2], r[3]);
        x.imageSmoothingQuality = 'high';
        x.drawImage(nc, nb.x, nb.y, nb.w, nb.h, r[0] + sx0, r[1] + sy0, dw, dh);
      }
      return { url: c.toDataURL('image/png'), warn };
    }, { atlasUrl, parts: B.parts, restyled, stretchMax: B.stretchMax || {}, fill: B.fill || {} });
    fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
    for (const w of res.warn) console.log('  WARN ' + w);
    console.log('rebuilt ' + Object.keys(restyled).length + '/' +
      (Object.keys(B.parts).length - DERIVED.size) +
      ' restylable parts -> ' + out + ' ' + (fs.statSync(out).size / 1024 | 0) + 'K');
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
