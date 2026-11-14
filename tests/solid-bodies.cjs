// A MACHINE IS SOLID, AND WHAT HAPPENS TO THE GROUND HAPPENS IN THE GROUND.
//
// Two things the owner said on 2026-11-14, looking at NULLFANG in the meadow:
//
//   "why isn't it opaque enough? feels like Nullfang is translucent"
//   "cracking floor looks fake and not blended with terrain"
//
// Neither was a matter of taste, and both are measured here.
//
// TRANSLUCENT had two causes. (1) Every hostile body was drawn into the world
// and the world was then finished on top of it — additive light pools, a bloom
// that adds a blurred copy of every bright thing over itself, the zone's colour
// wash — so the lion's shadows sat at twice their authored luminance and its
// ivory came out grey-green: lit through, like a ghost. The hero never had
// this; she is drawn after the grade. Bodies now keep their pigment
// (js/foeread.js FOE_PIG), and section A holds that: the room's light no longer
// moves the body's own pixels. (2) The swipe's cut-out had the room showing
// through the animal's chest, because the keyer called the dark shoulder socket
// "background" (tools/lion-studio.py). Section B: raising a paw never removes
// body.
//
// FAKE was an ellipse. The landing's wave and cracks, and every guardian's
// wind-up floor light, were drawn on a floor plane this side-view game does not
// have: one flat oval at one height, floating over the meadow's dips and cut by
// its mounds. They follow the terrain's own surface now (js/fxgl.js fxProfile,
// fxglStrip, tellFloorLight). Section C: the profile is the ground, the cracks'
// light is IN the ground and the wave's light is ON it.
//
//   node tests/solid-bodies.cjs
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const fails = [];
  const check = (name, ok, detail) => { console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail)); if (!ok) fails.push(name); };
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' });
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof startGame === 'function');
    console.log('── solid-bodies — a machine keeps its pigment, its cut-out has no window in it, and ground effects lie on the ground');
    const R = await page.evaluate(async () => {
      window.requestAnimationFrame = () => 0;
      window.FXGL_FORCE = 1; if (typeof FXGL !== 'undefined') FXGL.ok = null;     // this machine has no graphics card
      for (const k of [...BEAST_STRIPS, 'beastStudioIdle']) { try { mediaFetch(k, true); } catch (e) {} } beastImg();
      const t0 = performance.now();
      // the lion's own art, all of it, before anything is measured: without the
      // parts atlas drawBeast stands down and the loading silhouette is drawn,
      // and a harness that measured THAT would be measuring a teal placeholder
      const ready = () => BEAST_STRIPS.every(k => MEDIA_RAW[k] && MEDIA_RAW[k].complete && MEDIA_RAW[k].naturalWidth) && MEDIA_RAW.beastStudioIdle && MEDIA_RAW.beastStudioIdle.naturalWidth && beastImg() && beastImg().naturalWidth;
      while (performance.now() - t0 < 60000 && !ready()) await new Promise(r => setTimeout(r, 50));
      const out = { ready: !!ready() };
      const sv = newSave(1); sv.time = 99; sv.flags.tut = sv.flags.woke = 1; sv.flags.nfMeet = 1;
      startGame(sv); loadRoom('A4');
      G.state = 'PLAY'; G.wake = G.dialog = G.cut = G.trans = G.meet = G.gateWalk = G.bossEntry = null; G.zoneToast = null; G.toasts = [];
      const b = G.boss; G.enemies = G.enemies.filter(e => e === b);
      const hold = () => { b.st = 'idle'; b.t = 9; b.meet = null; b.face = b.faceVis = -1; b.roarCD = b.ambushCD = 99; b.impactUntil = 0; };
      hold();
      player.x = b.cx() - 200; player.y = b.y + b.h - player.h; player.on = true; player.iT = 0;
      for (let i = 0; i < 60; i++) { hold(); update(1 / 60); updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60); }
      cam.shake = 0; G.flash = 0; G.hitStop = 0;
      const main = cv;
      let M = null; const fd = foeDraw; foeDraw = function (cc, e) { if (e === b) M = cc.getTransform(); return fd(cc, e); };
      const grab = () => main.getContext('2d').getImageData(0, 0, main.width, main.height).data;
      const frame = () => { hold(); draw(5000); return grab(); };

      // ---- A. the body keeps its pigment -----------------------------------------
      { const first = frame();
        const off = document.createElement('canvas'); off.width = main.width; off.height = main.height;
        const ox = off.getContext('2d'); ox.setTransform(M); const pr = G.artProbe; G.artProbe = 1; b.draw(ox); G.artProbe = pr;
        const body = ox.getImageData(0, 0, off.width, off.height).data;
        const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        const stat = (d) => { const L = []; let r = 0, g = 0, bl = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) if (body[i + 3] >= 252) { L.push(lum(d, i)); r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
          L.sort((x, y) => x - y);
          return { n, mean: L.reduce((x, y) => x + y, 0) / n, p05: L[Math.floor(0.05 * (n - 1))], rgb: [r / n, g / n, bl / n] }; };
        const art = stat(body), kept = stat(first);
        const without = (name) => { const k = window[name]; let r; try { eval(name + ' = () => {}'); r = stat(frame()); } finally { eval(name + ' = k'); } return r; };
        const noLights = without('drawLights'), noBloom = without('applyBloom');
        FOE_PIG.on = false; const washed = stat(frame()); FOE_PIG.on = true;
        const again = stat(frame());
        out.pig = { n: art.n, art: art.rgb.map(Math.round), kept: kept.rgb.map(Math.round), washed: washed.rgb.map(Math.round),
          keptMean: +kept.mean.toFixed(1), washedMean: +washed.mean.toFixed(1), keptP05: +kept.p05.toFixed(1), washedP05: +washed.p05.toFixed(1),
          lights: +Math.abs(kept.mean - noLights.mean).toFixed(2), bloom: +Math.abs(kept.mean - noBloom.mean).toFixed(2), stable: Math.abs(again.mean - kept.mean) < 0.5,
          washedLights: null };
        FOE_PIG.on = false; const wl = without('drawLights'); FOE_PIG.on = true;
        out.pig.washedLights = +Math.abs(washed.mean - wl.mean).toFixed(2);
        // the effects layer is not cut out by the body: a flash drawn over it still lights it
        fx('flash', b.cx(), b.cy(), { rx: 120, ry: 120, dur: 0.6, col: '#c69bff', hot: '#ffffff', power: 1.2 });
        FXGL.list[FXGL.list.length - 1].t = 0.07;
        const lit = stat(frame()); FXGL.list.length = 0;
        out.pig.fxOver = +(lit.mean - kept.mean).toFixed(1);
      }

      // ---- B. raising the paw never removes body ---------------------------------
      { const im = MEDIA_RAW.beastStudioSwipe, n = 24, cw = im.naturalWidth / n, ch = im.naturalHeight;
        const c2 = document.createElement('canvas'); c2.width = im.naturalWidth; c2.height = ch;
        const x2 = c2.getContext('2d'); x2.drawImage(im, 0, 0);
        const d = x2.getImageData(0, 0, c2.width, ch).data, area = [];
        for (let i = 0; i < n; i++) { let a = 0; for (let y = 0; y < ch; y++) for (let x = i * cw; x < (i + 1) * cw; x++) if (d[(y * c2.width + x) * 4 + 3] > 128) a++; area.push(a); }
        out.swipe = { stand: area[0], ratios: area.slice(4, 12).map(a => +(a / area[0]).toFixed(3)), min: +Math.min(...area.slice(4, 12).map(a => a / area[0])).toFixed(3), full: im.naturalWidth >= 448 * 24 };
      }

      // ---- C. ground effects lie on the ground -----------------------------------
      { // a stretch of meadow that is not flat: the dip the lion was once stuck in
        let best = null;
        for (let x = 260; x < G.roomDef.w * TILE - 260; x += 20) {
          const gc = groundColumnAt(x); if (!gc) continue;
          const ys = []; for (let i = -10; i <= 10; i++) { const y = fxSurfaceY(x + i * 20, gc[0]); if (!isNaN(y)) ys.push(y); }
          const span = Math.max(...ys) - Math.min(...ys);
          if (ys.length >= 19 && (!best || span > best.span)) best = { x, y: gc[0], span };
        }
        out.site = best;
        FXGL.list.length = 0;
        const e = fx('cracks', best.x, best.y + 3, { rx: 210, ry: 30, dur: 1.7, col: '#8a3df0', hot: '#f1dcff', power: 1.3 });
        const w = fx('ground', best.x, best.y, { rx: 300, ry: 46, dur: 0.65, col: '#b06aff', hot: '#f1dcff', power: 1.35 });
        const prof = Array.from(e.prof);
        const finite = prof.filter(v => !isNaN(v));
        let worst = 0;
        for (let i = 0; i <= FX_SEG; i++) { if (isNaN(prof[i])) continue; const gc = groundColumnAt(e.x - e.rx + 2 * e.rx * i / FX_SEG); if (gc && Math.abs(gc[0] - prof[i]) <= 20) worst = Math.max(worst, Math.abs(gc[0] - prof[i])); }
        out.prof = { n: prof.length, finite: finite.length, span: +(Math.max(...finite) - Math.min(...finite)).toFixed(1), worst: +worst.toFixed(2), wave: !!w.prof, other: !fx('flash', 0, 0, {}).prof };
        // where the light of each lands, against the surface under its own column
        player.x = best.x - 60; player.y = best.y - player.h;
        b.x = best.x + 900; hold();
        for (let i = 0; i < 80; i++) updateCam(player.x, player.y, G.roomDef.w * TILE, G.roomDef.h * TILE, 1 / 60);
        const measure = (rec, tt) => {
          FXGL.list.length = 0; FXGL.list.push(rec); rec.t = tt; rec.delay = 0;
          let T = null; const fg = fxglDraw; fxglDraw = function (cc) { T = cc.getTransform(); return fg(cc); };
          hold(); b.x = best.x + 900; draw(5000); fxglDraw = fg;
          const W = FXGL.cv.width, H = FXGL.cv.height;
          const c3 = document.createElement('canvas'); c3.width = W; c3.height = H; const x3 = c3.getContext('2d'); x3.drawImage(FXGL.cv, 0, 0);
          const d = x3.getImageData(0, 0, W, H).data;
          let above = 0, below = 0, far = 0, tot = 0;
          for (let px = 0; px < W; px += 2) {
            const wx = (px - T.e) / T.a, sy = fxSurfaceY(wx, rec.y, 90); if (isNaN(sy)) continue;
            const sp = T.d * sy + T.f;
            for (let py = 0; py < H; py++) { const i = (py * W + px) * 4, v = d[i] + d[i + 1] + d[i + 2] + d[i + 3]; if (!v) continue;
              tot += v; if (py < sp - 6) above += v; else if (py > sp + 6) below += v;
              if (Math.abs(py - sp) > Math.abs(T.d) * 80) far += v; }
          }
          return { drawn: FXGL.drawn, tot, above: tot ? +(above / tot).toFixed(3) : null, below: tot ? +(below / tot).toFixed(3) : null, far: tot ? +(far / tot).toFixed(3) : null };
        };
        out.cracksLight = measure(e, 0.45);
        out.waveLight = measure(w, 0.2);
        FXGL.list.length = 0;
        // the wind-up's floor light: the same ground, on a recording context
        const pts = []; const rec = { createLinearGradient: () => ({ addColorStop() {} }), beginPath() {}, stroke() {}, moveTo(x, y) { pts.push([x, y]); }, lineTo(x, y) { pts.push([x, y]); }, set strokeStyle(v) {}, set lineCap(v) {}, set lineJoin(v) {}, set lineWidth(v) {}, set globalAlpha(v) {} };
        tellFloorLight(rec, best.x, best.y - 2, 150, 0.8);
        const crisp = pts.slice(pts.length / 2);
        let off = 0; for (const [x, y] of crisp) off = Math.max(off, Math.abs(y - fxSurfaceY(x, best.y)));
        const ys = crisp.map(p => p[1]);
        out.tell = { points: crisp.length, off: +off.toFixed(2), span: +(Math.max(...ys) - Math.min(...ys)).toFixed(1) };
        // ...and under a body in the air it lands on the floor below, or nowhere
        // (whatever floor that is — the meadow, or a ledge that happens to be under it)
        const top = best.y - 150; pts.length = 0;
        tellFloorLight(rec, best.x, top, 150, 0.8);
        const air = pts.slice(pts.length / 2);
        out.tellAir = { points: air.length, below: air.every(p => p[1] > top), onFloor: air.every(p => Math.abs(p[1] - fxSurfaceY(p[0], p[1])) < 0.01) };
        // ...and over a pit there is no floor to light, so nothing is drawn
        pts.length = 0; tellFloorLight(rec, best.x, -4000, 150, 0.8);
        out.tellAir.nowhere = pts.length;
      }
      return out;
    });
    const P = R.pig;
    check('the lion\'s art is resident before it is measured', R.ready === true);
    check('the lion on screen is measured over a real body', P.n > 3000, P.n + ' px');
    check('the room\'s light pools do not move the body\'s pixels', P.lights <= 3, 'Δ' + P.lights + ' luminance with them off (Δ' + P.washedLights + ' before the fix)');
    check('...nor does the bloom', P.bloom <= 3, 'Δ' + P.bloom);
    check('its shadows stay shadows', P.washedP05 - P.keptP05 >= 8, 'darkest twentieth ' + P.keptP05 + ' kept, ' + P.washedP05 + ' lit through');
    check('its ivory stays ivory, not the meadow\'s green', P.kept[0] >= P.kept[1] && P.washed[1] > P.washed[0], 'rgb ' + P.kept.join(',') + ' kept, ' + P.washed.join(',') + ' lit through, ' + P.art.join(',') + ' authored');
    check('keeping it is stable from frame to frame', P.stable === true);
    check('an effect drawn over the body still lights it', P.fxOver >= 6, '+' + P.fxOver + ' luminance under a flash');
    check('the swipe strip is the full take', R.swipe.full === true);
    check('raising the paw never removes body (no window through the chest)', R.swipe.min >= 0.96, 'wind-up cells ' + R.swipe.ratios.join(' ') + ' of the standing ' + R.swipe.stand + ' px');
    check('the meadow has a slope to test on', R.site && R.site.span >= 12, JSON.stringify(R.site));
    check('a ground effect is born with the ground under it', R.prof.n === 65 && R.prof.finite >= 60 && R.prof.wave === true, JSON.stringify(R.prof));
    check('...the surface a body stands on, not a flat line', R.prof.span >= 10 && R.prof.worst <= 1, 'span ' + R.prof.span + ' px, worst ' + R.prof.worst + ' px off the heightfield');
    check('...and only ground effects are', R.prof.other === true);
    check('the cracks are drawn', R.cracksLight.drawn >= 1 && R.cracksLight.tot > 0, JSON.stringify(R.cracksLight));
    check('...IN the ground: almost none of their light is in the air', R.cracksLight.above != null && R.cracksLight.above <= 0.08 && R.cracksLight.below >= 0.25, (R.cracksLight.above * 100).toFixed(1) + '% more than 6 px above the surface, ' + (R.cracksLight.below * 100).toFixed(1) + '% more than 6 px into it');
    check('the wave is drawn', R.waveLight.drawn >= 1 && R.waveLight.tot > 0, JSON.stringify(R.waveLight));
    check('...ON the ground: almost none of it is under the surface', R.waveLight.below != null && R.waveLight.below <= 0.08, (R.waveLight.below * 100).toFixed(1) + '% more than 6 px under the surface, ' + (R.waveLight.above * 100).toFixed(1) + '% more than 6 px above it');
    check('neither floats away from the terrain', R.cracksLight.far <= 0.01 && R.waveLight.far <= 0.01, 'cracks ' + R.cracksLight.far + ', wave ' + R.waveLight.far + ' further than 80 px from the surface');
    check('a wind-up lights the floor along the terrain', R.tell.points >= 12 && R.tell.off <= 0.01 && R.tell.span >= 6, JSON.stringify(R.tell));
    check('...and from the air it lands on the floor below, or nowhere', R.tellAir.points >= 12 && R.tellAir.below === true && R.tellAir.onFloor === true && R.tellAir.nowhere === 0, JSON.stringify(R.tellAir));
    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally { await browser.close(); }
  console.log(fails.length ? '\nFAILED ' + fails.length + ': ' + fails.join('; ') : '\nsolid-bodies: all checks passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
