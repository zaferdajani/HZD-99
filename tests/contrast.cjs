// EVERY MACHINE STANDS OFF ITS OWN BACKGROUND.
//
// Owner, 2026-10-12: "check all the other enemies and bosses. You should
// always keep a contrast between the background and the enemy." A body that
// melts into the room it was placed in is a body the player meets with her
// face — and it is the kind of defect nobody sees at a desk, because the
// person reviewing the art already knows where the machine is.
//
// So this measures it where it happens: for every room that places a hostile
// body or a guardian, the REAL frame (drawWorldFrame — backdrop, ceiling,
// terrain, the far-plane pass, bloom, the zone's grade) with the art warm, the
// camera on the body, and the body standing where the room authored it.
//
// THE MASK. The body is drawn a second time — through foeDraw, exactly as the
// frame draws it, so whatever the game lays round it counts — alone, onto a
// transparent canvas under the exact transform the frame drew it with
// (captured from inside the frame's own call) and through the same zoom blit
// (presentWorld), so its silhouette is its own pixels and not a guess. The
// clock and Math.random are frozen across both draws (tests/drawclock.cjs is
// why that is enough), so the two drawings are the same drawing.
//
// THE MEASUREMENT IS ACROSS THE SILHOUETTE EDGE, in the finished frame. For
// every boundary pixel of the mask, the outermost solid pixel of the figure
// (1 px inside its antialiased edge) is paired with the room 3 px OUTSIDE it
// along the same axis — the two things the eye compares to find an outline.
// Each pair gets a WCAG luminance contrast ratio and a CIE76 ΔE (Lab). The
// medians and the ring averages (mean inside vs mean outside) are printed
// beside the verdict.
//
// THE PASS RULE, and why it is these numbers:
//   - a PAIR is "separated" if its contrast ratio is >= 1.6 OR its ΔE >= 25.
//     Either channel alone is enough, because a silhouette can be found by
//     value (a dark machine on a lit wall) or by hue (a crimson machine on a
//     teal wall at the same lightness). 1.6:1 is a little over half of WCAG's
//     3:1 for non-text UI — a game body is large and moving, which is far
//     easier to find than a 1 px control border — and well clear of the
//     ~1.1:1 step a textured backdrop makes against itself. ΔE 25 is ten
//     just-noticeable differences (JND ≈ 2.3): not "a trained eye can tell",
//     but "two different colours".
//   - a BODY passes if at least HALF of its silhouette edge is separated. The
//     visual system closes a contour from fragments (good continuation), so a
//     figure with half its outline clear reads as a figure; one whose edge is
//     mostly lost reads as a stain on the wall. Asking for all of it would
//     punish every body for the one patch of bright terrain behind its foot.
//
// THE FIX IS IN THE GAME, NOT HERE: js/foeread.js lays a thin pale rim
// behind every body, outside its silhouette, in a tint chosen per kingdom
// (FOE_RIM). Measured with it switched off (CONTRAST_RIM=0) on 2026-10-12, 55
// of 106 pairs failed; with it, none. The tints are held here too: never a
// reserved hue of docs/combat/GLOBAL_REGISTRY.md §2 (ΔE > 30, as
// tests/loadout.cjs holds the UI hues), never the kingdom's own glow or edge
// (ΔE > 30). G.artProbe switches the rim off so tests/artbible.cjs still
// measures anatomy, and it never blurs (tests/glowcost.cjs).
//
//   node tests/contrast.cjs            (needs the repo served on :8220)
//   CONTRAST_ONLY=A1,B3 node tests/contrast.cjs     just those rooms
//   CONTRAST_RIM=0 ...                 measure with the rim switched off (the 'before')
//   CONTRAST_DUMP=A1:guard CONTRAST_OUT=<dir>   write that frame and its mask as PNGs
const { chromium } = require('playwright');

const PAIR_CR = 1.6, PAIR_DE = 25, SHARE = 0.5;

const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function labOfHex(h) {
  let [r, g, b] = hexRGB(h);
  const f = v => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
  r = f(r); g = f(g); b = f(b);
  const q = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const x = q((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = q(r * 0.2126 + g * 0.7152 + b * 0.0722), z = q((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const dEhex = (a, b) => { const A = labOfHex(a), B = labOfHex(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof drawWorldFrame === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── contrast — every hostile body and every guardian reads off the room it stands in\n');

  // ---- the rim's tints: read from the source, measured against the registry
  {
    const reg = fs.readFileSync(path.join(ROOT, 'docs/combat/GLOBAL_REGISTRY.md'), 'utf8');
    const s2 = reg.slice(reg.indexOf('## 2.'), reg.indexOf('### UI loadout'));
    const reserved = {};
    for (const m of s2.matchAll(/^\|\s*([^|]+?)\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|/gm)) reserved[m[1]] = m[2].toLowerCase();
    const fsrc = fs.readFileSync(path.join(ROOT, 'js/foeread.js'), 'utf8');
    const rims = {};
    const blk = fsrc.slice(fsrc.indexOf('const FOE_RIM ='), fsrc.indexOf('});', fsrc.indexOf('const FOE_RIM =')));
    for (const m of blk.matchAll(/^\s*([A-Z]):\s*'(#[0-9a-fA-F]{6})'/gm)) rims[m[1]] = m[2].toLowerCase();
    const wsrc = fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8');
    const palSrc = wsrc.slice(wsrc.indexOf('const PAL_ROBO'), wsrc.indexOf('};', wsrc.indexOf('const PAL_ROBO')));
    const pal = {};
    for (const m of palSrc.matchAll(/^\s*([A-Z]):\s*\{([^}]*)\}/gm))
      pal[m[1]] = ['glow', 'edge'].map(k => (m[2].match(new RegExp(k + ":\\s*'(#[0-9a-fA-F]{6})'")) || [])[1]).filter(Boolean);
    check('every kingdom has a rim tint (' + Object.keys(rims).join('') + ')', Object.keys(pal).length >= 6 && Object.keys(pal).every(z => rims[z]));
    for (const [z, h] of Object.entries(rims)) {
      let wr = null; for (const [n, x] of Object.entries(reserved)) { const d = dEhex(h, x); if (!wr || d < wr.d) wr = { n, d }; }
      const own = Math.min(...(pal[z] || []).map(x => dEhex(h, x)));
      check('rim ' + z + ' ' + h + ' is no reserved hue (ΔE > 30) and not its kingdom\'s own light (ΔE > 30)',
        wr && wr.d > 30 && own > 30, 'nearest reserved ' + (wr && wr.n) + ' ΔE ' + (wr ? wr.d.toFixed(0) : '?') + ', own glow/edge ΔE ' + own.toFixed(0));
    }
  }

  const R = await page.evaluate(async ({ dump, only, rim, PAIR_CR, PAIR_DE }) => {
    // ---- art: the sheets each body and room ASK for, at full size ---------
    // (the same discipline as tests/infection-roster.cjs, for the same reason:
    // a body measured on its quarter-size stand-in is a different drawing)
    const asked = new Set();
    const realFetch = mediaFetch;
    mediaFetch = function (k) { asked.add(k); return realFetch.apply(this, arguments); };
    const landed = (k) => MEDIA_LOW[k] === 3 || !MEDIA_PEND[k] || (!!MEDIA_RAW[k] && MEDIA_LOW[k] !== 2);
    const waiting = () => [...asked].filter(k => !landed(k));
    const settle = async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 15000 && waiting().length) await new Promise(r => setTimeout(r, 60));
      return waiting();
    };
    if (typeof PRE !== 'undefined') { PRE.on = false; PRE.q.length = 0; }
    for (let i = 0; i < 50 && Object.keys(MEDIA_LOW).some(k => MEDIA_LOW[k] === 1); i++) await new Promise(r => setTimeout(r, 100));
    for (const k of Object.keys(MEDIA_LOW)) {
      if (MEDIA_LOW[k] !== 2 || MEDIA_PEND[k]) continue;
      delete MEDIA_RAW[k]; MEDIA_LOW[k] = 0; mediaDirty(k);
    }
    if (typeof qualSet === 'function') qualSet('high');
    if (rim === '0' && typeof FOE_READ !== 'undefined') FOE_READ.on = false;

    const keyOf = (e) => (e instanceof Boss ? 'BOSS:' + (e.type || e.kind) : e.kind)
      + (isWolf(e) ? ':wolf' : (typeof isCheetah === 'function' && isCheetah(e)) ? ':cat' : '');
    const stage = (id) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(id); G.state = 'PLAY';
      G.wake = null; G.dialog = null; G.tut = null; G.meet = null; G.gateWalk = null; G.bossEntry = null;
      if (G.toasts) G.toasts.length = 0;
      player.x = 40; player.y = 0; player.invT = 1e9; player.dead = false;
    };
    // the cast, room by room: one of each kind per room — a kind meets
    // different backgrounds in different rooms, and that is the point
    const cast = [];
    for (const id of Object.keys(ROOMS)) {
      if (only && !only.includes(id)) continue;
      try { stage(id); } catch (err) { continue; }
      const seen = {};
      for (const e of G.enemies.concat(G.boss ? [G.boss] : [])) {
        const k = keyOf(e);
        if (!seen[k]) { seen[k] = 1; cast.push({ id, k, zone: G.roomDef.zone }); }
      }
    }
    const place = (c) => {
      stage(c.id);
      const body = G.enemies.concat(G.boss ? [G.boss] : []).find(e => keyOf(e) === c.k);
      if (!body) return null;
      body.update = function () {};
      // alone: the ring round it is the ROOM, not a neighbour
      if (body !== G.boss) { G.enemies = [body]; G.boss = null; } else G.enemies = [];
      if (body instanceof Boss) { body.st = 'idle'; body.t = 99; body.meet = false; }
      body.hurtT = 0; body.lockT = 0;
      return body;
    };
    const aim = (body) => {
      const dead = player.dead; player.dead = true;
      cam.shake = 0;
      updateCam(body.x + body.w / 2, body.y + body.h / 2, G.roomDef.w * TILE, G.roomDef.h * TILE, 1);
      cam.shakeX = 0; cam.shakeY = 0;
      player.dead = dead;
    };

    // ---- one frame, measured -----------------------------------------------
    const cvs = document.getElementById('cv');
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });
    const zc = document.createElement('canvas');
    const zctx = zc.getContext('2d', { willReadFrequently: true });
    const lin = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const v = i / 255; lin[i] = v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; }
    const q = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const labOf = (r, g, b) => {
      r = lin[r]; g = lin[g]; b = lin[b];
      const x = q((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047), y = q(r * 0.2126 + g * 0.7152 + b * 0.0722),
        z = q((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
      return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const lum = (r, g, b) => lin[r] * 0.2126 + lin[g] * 0.7152 + lin[b] * 0.0722;
    const median = a => { if (!a.length) return 0; const s = Float32Array.from(a).sort(); return s[s.length >> 1]; };

    const measure = (body) => {
      const realNow = performance.now, realRand = Math.random;
      const T0 = realNow.call(performance);
      let seed = 1;
      const reseed = () => { seed = 1; };
      performance.now = () => T0;
      Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const fd = foeDraw, pd = player.draw;
      let tf = null;
      try {
        parts.length = 0; if (G.projs) G.projs.length = 0;
        aim(body);
        player.draw = function () {};
        // THE BODY AS THE GAME DRAWS IT: through foeDraw, rim and all
        foeDraw = function (c2, e) { if (e === body) { tf = c2.getTransform(); reseed(); } return fd(c2, e); };
        qFrame(c); c.clearRect(0, 0, 960, 540);
        drawWorldFrame();
        const W = cvs.width, H = cvs.height;
        const F = ctx.getImageData(0, 0, W, H).data;
        if (!tf) return { err: 'not drawn' };
        // the same body, the same pose, the same clock: alone
        if (off.width !== W || off.height !== H) { off.width = W; off.height = H; }
        octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
        octx.setTransform(tf); reseed(); parts.length = 0;
        fd(octx, body);
        // ...and through the same lens: presentWorld (js/presentation.js)
        // scales the finished world about the screen centre by the camera's
        // zoom, so the mask is scaled by the same blit
        const z = typeof worldZoom === 'function' ? worldZoom() : 1;
        let src = octx;
        if (z > 1.001) {
          if (zc.width !== W || zc.height !== H) { zc.width = W; zc.height = H; }
          zctx.setTransform(1, 0, 0, 1, 0, 0); zctx.clearRect(0, 0, W, H); zctx.imageSmoothingEnabled = true;
          zctx.drawImage(off, (W - W / z) / 2, (H - H / z) / 2, W / z, H / z, 0, 0, W, H);
          src = zctx;
        }
        const A = src.getImageData(0, 0, W, H).data;
        const M = new Uint8Array(W * H);
        let n = 0, x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let i = 0, p = 0; p < W * H; p++, i += 4) if (A[i + 3] >= 128) {
          M[p] = 1; n++;
          const x = p % W, y = (p / W) | 0;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (n < 30) return { err: 'mask ' + n + 'px' };
        const k = W / 960, IN = Math.max(1, Math.round(k)), OUT = Math.max(2, Math.round(3 * k));
        const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        let pairs = 0, sep = 0;
        const crs = [], des = [];
        const sumI = [0, 0, 0], sumO = [0, 0, 0]; let li = 0, lo = 0;
        for (let y = Math.max(1, y0); y <= Math.min(H - 2, y1); y++) for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) {
          const p = y * W + x; if (!M[p]) continue;
          for (const [dx, dy] of D) {
            if (M[p + dy * W + dx]) continue;           // not an edge on this axis
            const ix = x - dx * IN, iy = y - dy * IN, ox = x + dx * OUT, oy = y + dy * OUT;
            if (ox < 0 || oy < 0 || ox >= W || oy >= H || ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
            const pi = iy * W + ix, po = oy * W + ox;
            if (!M[pi] || M[po]) continue;
            const a = pi * 4, b = po * 4;
            const La = lum(F[a], F[a + 1], F[a + 2]), Lb = lum(F[b], F[b + 1], F[b + 2]);
            const cr = (Math.max(La, Lb) + 0.05) / (Math.min(La, Lb) + 0.05);
            const A1 = labOf(F[a], F[a + 1], F[a + 2]), B1 = labOf(F[b], F[b + 1], F[b + 2]);
            const de = Math.hypot(A1[0] - B1[0], A1[1] - B1[1], A1[2] - B1[2]);
            pairs++; if (cr >= PAIR_CR || de >= PAIR_DE) sep++;
            crs.push(cr); des.push(de);
            sumI[0] += A1[0]; sumI[1] += A1[1]; sumI[2] += A1[2]; li += La;
            sumO[0] += B1[0]; sumO[1] += B1[1]; sumO[2] += B1[2]; lo += Lb;
          }
        }
        if (!pairs) return { err: 'no edge' };
        if (dump && dump === G.roomId + ':' + keyOf(body)) dumped.push(cvs.toDataURL(), src.canvas.toDataURL());
        const mi = sumI.map(v => v / pairs), mo = sumO.map(v => v / pairs);
        const Li = li / pairs, Lo = lo / pairs;
        return {
          px: n, pairs, share: sep / pairs, crMed: median(crs), deMed: median(des),
          ringCr: (Math.max(Li, Lo) + 0.05) / (Math.min(Li, Lo) + 0.05),
          ringDe: Math.hypot(mi[0] - mo[0], mi[1] - mo[1], mi[2] - mo[2]),
          bodyL: mi[0], ringL: mo[0], box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1],
        };
      } finally {
        foeDraw = fd; player.draw = pd;
        performance.now = realNow; Math.random = realRand;
      }
    };

    const out = [], dumped = [];
    for (const cc of cast) {
      asked.clear();
      let body = place(cc);
      if (!body) { out.push(Object.assign({ err: 'not placed' }, cc)); continue; }
      // rehearsal: draw it where it will be measured, so its draw and the
      // room's backdrop ask for every sheet they use; then wait for them
      for (let i = 0; i < 3; i++) { aim(body); qFrame(c); c.clearRect(0, 0, 960, 540); drawWorldFrame(); }
      await settle();
      for (let i = 0; i < 3; i++) { aim(body); qFrame(c); c.clearRect(0, 0, 960, 540); drawWorldFrame(); await new Promise(r => setTimeout(r, 30)); }
      await settle();
      body = place(cc);
      out.push(Object.assign(measure(body), cc, { waiting: waiting().length }));
    }
    mediaFetch = realFetch;
    return { out, dumped };
  }, { dump: process.env.CONTRAST_DUMP || null, only: process.env.CONTRAST_ONLY ? process.env.CONTRAST_ONLY.split(',') : null, rim: process.env.CONTRAST_RIM || '1', PAIR_CR, PAIR_DE });

  const rows = R.out;
  // CONTRAST_DUMP=<room>:<key> writes the frame and the mask beside the test
  R.dumped.forEach((u, i) => require('fs').writeFileSync(require('path').join(process.env.CONTRAST_OUT || require('os').tmpdir(), 'contrast-' + (i ? 'mask' : 'frame') + '.png'), Buffer.from(u.split(',')[1], 'base64')));
  console.log('    room   zone  creature              share   CR(med)  ΔE(med)   ring CR  ring ΔE   body L / ring L');
  for (const r of rows) {
    if (r.err) { console.log('    ' + r.id.padEnd(7) + (r.zone || '?').padEnd(6) + r.k.padEnd(22) + r.err); continue; }
    const pass = r.share >= SHARE;
    console.log('    ' + r.id.padEnd(7) + (r.zone || '?').padEnd(6) + r.k.padEnd(22)
      + (Math.round(r.share * 100) + '%').padStart(5) + '   ' + r.crMed.toFixed(2).padStart(6) + '   ' + r.deMed.toFixed(1).padStart(6)
      + '    ' + r.ringCr.toFixed(2).padStart(6) + '   ' + r.ringDe.toFixed(1).padStart(6)
      + '   ' + r.bodyL.toFixed(0).padStart(4) + ' / ' + r.ringL.toFixed(0).padEnd(4)
      + (pass ? '' : '   << LOW') + (r.waiting ? '  (art pending ' + r.waiting + ')' : ''));
  }
  console.log('');
  const measured = rows.filter(r => !r.err);
  const broken = rows.filter(r => r.err);
  check('every placed body was measured (' + measured.length + ' room × creature pairs)',
    !broken.length && measured.length >= (process.env.CONTRAST_ONLY ? 1 : 40),
    broken.map(r => r.id + ':' + r.k + ' ' + r.err).join(', ') || null);
  check('...with its art landed, not its stand-in', !measured.some(r => r.waiting),
    measured.filter(r => r.waiting).map(r => r.id + ':' + r.k).join(', ') || null);
  const low = measured.filter(r => r.share < SHARE);
  check('every body reads off its room: >= ' + SHARE * 100 + '% of its silhouette edge at CR >= ' + PAIR_CR + ' or ΔE >= ' + PAIR_DE,
    !low.length, low.map(r => r.id + ':' + r.k + ' ' + Math.round(r.share * 100) + '%').join(', ') || 'worst '
      + (measured.length ? Math.round(Math.min(...measured.map(r => r.share)) * 100) + '%' : '—'));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | ') || null);
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — every machine and every guardian stands off the room it is in');
})().catch(e => { console.error(e); process.exit(1); });
