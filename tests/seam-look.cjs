// A SURFACE HAS ONE FACE, WHICHEVER SIDE OF THE SEAM SHE SEES IT FROM.
//
// The owner, on the phone (2026-10-11): "the platform, when I jumped in the
// next screen ... I saw the platform I'm going to stand on. When I see it from
// underneath, it shows normal. When I go on it, it shows the second floor
// layer, which is black, which does not make sense because it can't just
// appear because I jumped on the top."
//
// A2 -> A8. From A2 the floor above is A8's baked tile layer, drawn where it
// really is (drawVLinkArt): grass and stone. Standing on it in A8, the near
// depth plate (fore_a.webp, laid whole) put the solid body of a black city
// skyline exactly over the floor rows. Every outdoor room of the kingdom had
// it; only a seam made it visible as a lie, because only a seam lets her see
// the same floor from a room whose plate is somewhere else.
//
// This drives the real build through every vertical seam of chapter one, both
// ways — up through the hole and down through it — and for each crossing
// photographs the floor she ends up standing on TWICE: once from the room she
// left (the approach: the neighbour's art seen across the seam) and once from
// the room she arrived in, standing on it. Then it measures:
//
//   1. THE SAME FLOOR. Over the floor's own solid pixels (masked by its baked
//      tile layer, so the backdrop behind a plank is never compared), the strip
//      under her feet must have the same brightness from both sides (within
//      15% darker / 30% brighter: the rooms' own lights differ a little), and
//      neither side may carry a black fill the other does not.
//   2. NOTHING PAINTS OVER IT. The arrival frame is drawn again with the depth
//      planes removed; the floor strip must not change. A foreground that
//      reaches below the walk line is a second floor by definition.
//   3. THE SAME VERGE. The grass on the floor's edge is a per-room layer, not
//      part of the baked floor, so a neighbour seen across the seam showed its
//      floor bare and then grassed the moment she stood on it — while the room
//      below grew a band of grass along its own top row, INSIDE the slab under
//      the room above. Both sides must show the floor's blades, and no blade
//      may grow on the seam line itself.
//   4. THE PLATE STILL DOES ITS JOB, in every chapter-one room that has one:
//      its crest crosses her ankles (at least 15 px above the walk line, the
//      rule tests/gait.cjs holds) and it ends at the walk line.
//
//   node tests/seam-look.cjs        (needs the repo served on :8220)
//   SEAM_LOOK_SHOTS=<dir> [SEAM_LOOK_TAG=before] also saves 844x390 frames
const { chromium } = require('playwright');
const path = require('path');

const fails = [];
const check = (name, ok, detail) => {
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? '  ' + detail : ''));
  if (!ok) fails.push(name + (detail ? ' — ' + detail : ''));
};
const SHOTS = process.env.SEAM_LOOK_SHOTS || '';
const TAG = process.env.SEAM_LOOK_TAG || '';

(async () => {
  console.log('── seam-look — a floor looks the same from below and from on top of it\n');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  // the owner's phone, in landscape
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });

  const pairs = await page.evaluate(() => {
    window.requestAnimationFrame = () => 0;      // the harness steps the loop itself
    const sv = newSave(1); sv.time = 99;
    Object.assign(sv.flags, { woke: 1, tut: 1, heal: 1, 'on_A0B|ratchet': 1, ratchetRepaired: 1, nfBreak: 1, crystal: 1 });
    // every guardian of the chapter down, so each shaft is the seamless one
    for (const b of ['Glitch', 'Alpha', 'Chime']) sv.flags['boss' + b] = 1;
    sv.comics = {};
    for (const ch of ((window.COMIC_MANIFEST || {}).chapters || [])) sv.comics[ch.id] = { offered: true, revision: ch.revision };
    startGame(sv);
    // every hatch in chapter one cut: the state the shafts are walked in
    for (const id of Object.keys(ROOMS)) {
      if (ROOMS[id].zone !== 'A') continue;
      const U = buildRoom(id);
      for (let ty = 0; ty < U.length; ty++) for (let tx = 0; tx < U[0].length; tx++)
        if ((ty < 2 || ty >= U.length - 3) && (U[ty][tx] === 'B' || U[ty][tx] === 'v')) G.save.broken[id + ':' + tx + ',' + ty] = 1;
    }
    // chapter one's vertical seams: every T exit between two kingdom-1 rooms
    const out = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      let up = (def.exits || {}).T;
      if (up && typeof up === 'object') up = up.to;
      if (!up || !ROOMS[up] || def.zone !== 'A' || ROOMS[up].zone !== 'A') continue;
      out.push([id, up]);
    }
    // the in-page instruments
    window.__sl = {
      quiet() {
        G.wake = G.cut = G.dialog = G.meet = G.trans = G.gateWalk = G.bossEntry = G.item = null;
        G.tut = null; G.impact = null; G.lesson = null; G.state = 'PLAY';
      },
      step(n, fn) {
        for (let i = 0; i < n; i++) {
          this.quiet(); G.enemies = []; G.projs = []; G.boss = null; player.iT = 99; player.dead = false;
          update(1 / 60);
          if (fn && fn(i)) return i;
        }
        return -1;
      },
      // a neighbour's floor baked the way the game bakes it ahead of her
      bake(id) {
        if (tileFresh(id)) return;
        if (tileJob) tileJobDrop();
        const def = ROOMS[id], ent = tileEntry(id, def.w * TILE, def.h * TILE);
        ent.ready = false;
        tileJob = { id, cv: ent.cv, ctx: ent.cv.getContext('2d'), grid: buildRoom(id), curve: null,
          sig: tileSig(id), it: tileBakeSteps(PAL[def.zone]), born: 0 };
        tileJobSlice(Infinity);
      },
      enter(id) {
        loadRoom(id); this.quiet(); G.enemies = []; G.boss = null; G.projs = [];
        if (tileDirty) renderTileLayer(PAL[G.roomDef.zone]);
      },
      cols(id) {
        const g = buildRoom(id), cols = [];
        if (g.tGap) for (let x = g.tGap[0]; x <= g.tGap[1]; x++) cols.push(x);
        else for (let x = 1; x < g[0].length - 1; x++) if (g[0][x] === '.') cols.push(x);
        return cols;
      },
      // frame the camera on a WORLD point of the current room, the same place
      // on screen in every view, and draw one frame with her off it
      frame(wx, wy) {
        const keep = { x: player.x, y: player.y };
        cam.zoom = 1; cam.shakeX = 0; cam.shakeY = 0;
        cam.x = wx - 480; cam.y = wy - 300;
        player.x = wx + 2000; player.y = wy - 2000;   // the floor, not her
        draw(1000);
        player.x = keep.x; player.y = keep.y;
      },
      // ONE VIEW, MEASURED THREE WAYS, in one synchronous turn — art that
      // finishes streaming in between two evaluate calls would otherwise read
      // as a difference. (1) without the fringe, to find which pixels the grass
      // owns; (2) without the depth-plane pass, to find which pixels anything
      // in front owns (the whole pass, not just today's near plate: whatever
      // draws in front of the floor, this sees it); (3) the frame as the game
      // draws it — last, so it is the one left on the canvas to photograph.
      // `p` is the floor point in the floor room's coordinates, (ox, oy) where
      // that room sits in this one, `seamY` the seam line in this room.
      view(floorId, p, ox, oy, seamY) {
        const wx = p.fx + ox, wy = p.feet + oy;
        const grassRect = () => this.rect(wx - 48, wy - 14, 96, 16);
        const seamOn = seamY != null && seamY - 14 - (wy - 300) >= 0 && seamY + 2 - (wy - 300) <= 540;
        const seamRect = () => (seamOn ? this.rect(wx - 48, seamY - 14, 96, 16) : []);
        G.fringeProbe = 1;
        let g0, s0;
        try { this.frame(wx, wy); g0 = grassRect(); s0 = seamRect(); }
        finally { G.fringeProbe = 0; }
        const keep = window.drawDepthPlane;
        window.drawDepthPlane = () => {};
        let bare;
        try { this.frame(wx, wy); bare = this.strip(floorId, p.fx, p.feet, ox, oy); }
        finally { window.drawDepthPlane = keep; }
        this.frame(wx, wy);
        const out = this.strip(floorId, p.fx, p.feet, ox, oy);
        out.bare = bare;
        out.grass = this.changed(grassRect(), g0);
        out.seam = seamOn ? this.changed(seamRect(), s0) : null;
        return out;
      },
      // a rectangle of the finished frame, in this room's world coordinates
      rect(wx, wy, W, Hh) {
        const sx = cv.width / 960, sy = cv.height / 540;
        const X0 = Math.round((wx - camSX()) * sx), Y0 = Math.round((wy - camSY()) * sy);
        const d = c.getImageData(X0, Y0, Math.round(W * sx), Math.round(Hh * sy)).data;
        const px = [];
        for (let k = 0; k < d.length; k += 4) px.push(d[k], d[k + 1], d[k + 2]);
        return px;
      },
      changed(a, b) {
        if (!a.length || a.length !== b.length) return 0;
        let n = 0;
        for (let i = 0; i < a.length; i += 3)
          if (Math.abs(a[i] - b[i]) > 14 || Math.abs(a[i + 1] - b[i + 1]) > 14 || Math.abs(a[i + 2] - b[i + 2]) > 14) n++;
        return n / (a.length / 3);
      },
      // the strip under her feet, in the FLOOR ROOM's coordinates (fx, feet),
      // seen from the current room where that room sits at (ox, oy). Only the
      // floor's own solid pixels count: the mask is its baked tile layer.
      strip(floorId, fx, feet, ox, oy) {
        const e = tileStore.get(floorId);
        if (!e || !e.ready) return { err: 'floor ' + floorId + ' not baked' };
        // the screen lift (drawScreenLift) maps black to ~46, so "black" on the
        // finished frame is anything at the bottom of that range
        const DARK = 52;
        const W = 96, Hs = 24, x0 = Math.round(fx - W / 2), y0 = Math.round(feet + 3);
        const m = e.cv.getContext('2d').getImageData(x0, y0, W, Hs).data;
        const sx = cv.width / 960, sy = cv.height / 540;
        const scx = x0 + ox - camSX(), scy = y0 + oy - camSY();
        const X0 = Math.round(scx * sx), Y0 = Math.round(scy * sy);
        const ww = Math.round(W * sx), hh = Math.round(Hs * sy);
        const d = c.getImageData(X0, Y0, ww, hh).data;
        let n = 0, L = 0, dark = 0;
        const px = [];
        for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
          const mi = (Math.min(Hs - 1, Math.floor(j / sy)) * W + Math.min(W - 1, Math.floor(i / sx))) * 4;
          if (m[mi + 3] < 200) continue;
          const k = (j * ww + i) * 4;
          const l = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2];
          L += l; n++; if (l < DARK) dark++;
          px.push(d[k], d[k + 1], d[k + 2]);
        }
        return { n, cover: n / (ww * hh), lum: n ? L / n : 0, dark: n ? dark / n : 0, px };
      },
    };
    return out;
  });
  check('chapter one has vertical seams to walk', pairs.length >= 6, pairs.map(p => p[0] + '/' + p[1]).join(' '));

  // wait for the floors to have their art: a bake made before the rock slab
  // arrives is the procedural stand-in, on both sides alike, and proves nothing
  await page.waitForFunction(() => typeof rockBakeReady === 'function' && rockBakeReady('A'), { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const shot = async (name) => {
    if (!SHOTS) return;
    await page.screenshot({ path: path.join(SHOTS, 'seam-' + name + (TAG ? '-' + TAG : '') + '.png') });
  };
  const diffFrac = (a, b) => {
    if (!a.length || a.length !== b.length) return 1;
    let n = 0;
    for (let i = 0; i < a.length; i += 3)
      if (Math.abs(a[i] - b[i]) > 14 || Math.abs(a[i + 1] - b[i + 1]) > 14 || Math.abs(a[i + 2] - b[i + 2]) > 14) n++;
    return n / (a.length / 3);
  };
  const judge = (tag, app, arr) => {
    if (app.err || arr.err) { check(tag + ': both views measurable', false, app.err || arr.err); return; }
    const ok1 = app.cover > 0.2 && arr.cover > 0.2;
    const ratio = arr.lum / Math.max(1, app.lum);
    const same = ok1 && ratio > 0.85 && ratio < 1.3 && arr.dark <= app.dark + 0.15 && app.dark <= arr.dark + 0.15;
    check(tag + ': the floor under her feet is the floor she saw', same,
      'luminance ' + app.lum.toFixed(1) + ' seen across the seam, ' + arr.lum.toFixed(1) + ' standing on it' +
      ' (x' + ratio.toFixed(2) + '); near-black ' + (app.dark * 100).toFixed(0) + '% -> ' + (arr.dark * 100).toFixed(0) + '%' +
      '; floor pixels ' + (app.cover * 100).toFixed(0) + '% / ' + (arr.cover * 100).toFixed(0) + '% of the strip');
    const over = diffFrac(arr.px, arr.bare.px);
    check(tag + ': nothing in front paints over the floor she stands on', over <= 0.03,
      (over * 100).toFixed(1) + '% of the floor strip changes when the depth planes are taken away');
    // the blades on its edge: the same verge from both sides, give or take
    // the lighting — and the floor HAS one, or there is nothing to compare
    const ga = app.grass, gr = arr.grass;
    check(tag + ': the grass on its edge is there from both sides', gr >= 0.03 && ga >= gr * 0.4 && gr >= ga * 0.4,
      'blades own ' + (ga * 100).toFixed(0) + '% of the verge seen across the seam, ' + (gr * 100).toFixed(0) + '% standing on it');
    const sg = Math.max(app.seam || 0, arr.seam || 0);
    check(tag + ': nothing grows inside the slab between the two rooms', sg <= 0.02,
      'blades on the seam line: ' + (app.seam == null ? 'off screen' : (app.seam * 100).toFixed(0) + '%') + ' from the room left, ' +
      (arr.seam == null ? 'off screen' : (arr.seam * 100).toFixed(0) + '%') + ' from the room arrived in');
  };

  for (const [lo, up] of pairs) {
    // ---- UP: from under the hole in `lo`, jump; land in `up` -------------------
    const u = await page.evaluate(([lo, up]) => {
      const S = __sl;
      S.bake(up); S.enter(lo);
      const cols = S.cols(lo).filter(cx => vlinkOpenAt('T', cx * TILE + TILE / 2, -8));
      if (!cols.length) return { err: 'no open column under ' + up };
      const cx = cols[Math.floor(cols.length / 2)];
      for (const k in keys) keys[k] = 0;
      player.x = cx * TILE + (TILE - player.w) / 2; player.y = TILE + 2; player.vx = 0; player.vy = -760;
      player.on = false; keys[KEYB.JUMP[0]] = 1;
      S.step(200, () => G.roomId === up && !G.climb && player.on);
      for (const k in keys) keys[k] = 0;
      S.step(20);
      if (G.roomId !== up || !player.on) return { err: 'did not land in ' + up + ' (in ' + G.roomId + ')' };
      return { fx: player.x + player.w / 2, feet: player.y + player.h };
    }, [lo, up]);
    if (u.err) { check('up ' + lo + ' -> ' + up, false, u.err); }
    else {
      // the arrival, standing on it; the seam she rose through is this room's
      // bottom edge
      const arr = await page.evaluate(([up, u]) => __sl.view(up, u, 0, 0, G.roomDef.h * TILE), [up, u]);
      await shot(lo + '-' + up + '-up-arrived');
      // the approach: the same floor, from the room below, across the seam —
      // which is that room's top edge
      const app = await page.evaluate(([lo, up, u]) => {
        const S = __sl; S.bake(up); S.enter(lo);
        const L = G.vlink.T;
        return S.view(up, u, L.ox, L.oy, 0);
      }, [lo, up, u]);
      await shot(lo + '-' + up + '-up-approach');
      judge('up ' + lo + ' -> ' + up, app, arr);
    }

    // ---- DOWN: over the hole in `up`, fall; land in `lo` -----------------------
    const d = await page.evaluate(([lo, up]) => {
      const S = __sl;
      S.bake(lo); S.enter(up);
      const L = G.vlink.B, H = G.roomDef.h * TILE;
      if (!L || L.id !== lo) return { err: up + "'s way down is not " + lo };
      // lo's ceiling opening, kept to the columns this room's floor is open
      // over (a cut hatch counts as open) — the hole the way up came through
      const g = G.grid, fy = g.length - 1;
      const open = (tx) => g[fy][tx] !== '#' && (g[fy][tx] !== 'B' || G.save.broken[up + ':' + tx + ',' + fy]);
      const cols = S.cols(lo).filter(c0 => open(c0 + L.otx) && open(c0 + 1 + L.otx));
      if (!cols.length) return { err: 'no open floor over ' + lo };
      const cx = cols[Math.floor((cols.length - 1) / 2)];
      for (const k in keys) keys[k] = 0;
      player.x = cx * TILE + (TILE - player.w) / 2 + L.ox; player.y = H - 3 * TILE; player.vx = 0; player.vy = 300;
      player.on = false;
      S.step(300, () => G.roomId === lo && player.on);
      S.step(20);
      if (G.roomId !== lo || !player.on) return { err: 'did not land in ' + lo + ' (in ' + G.roomId + ')' };
      return { fx: player.x + player.w / 2, feet: player.y + player.h };
    }, [lo, up]);
    if (d.err) { check('down ' + up + ' -> ' + lo, false, d.err); continue; }
    const arr = await page.evaluate(([lo, d]) => __sl.view(lo, d, 0, 0, 0), [lo, d]);
    await shot(up + '-' + lo + '-down-arrived');
    const app = await page.evaluate(([lo, up, d]) => {
      const S = __sl; S.bake(lo); S.enter(up);
      const L = G.vlink.B;
      return S.view(lo, d, L.ox, L.oy, G.roomDef.h * TILE);
    }, [lo, up, d]);
    await shot(up + '-' + lo + '-down-approach');
    judge('down ' + up + ' -> ' + lo, app, arr);
  }

  // ---- 3. the plate itself, in every chapter-one room that draws one ---------
  const spans = await page.evaluate(() => {
    const out = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      if (def.zone !== 'A' || def.indoor) continue;
      __sl.enter(id);
      const s = typeof nearPlateSpan === 'function' ? nearPlateSpan() : null;
      out.push({ id, s });
    }
    return out;
  });
  const drawn = spans.filter(r => r.s);
  check('the near plate is measurable in the kingdom', drawn.length > 0,
    drawn.length + ' of ' + spans.length + ' outdoor rooms draw one');
  for (const r of drawn) {
    const above = r.s.anchor - r.s.top, below = r.s.bottom - r.s.anchor;
    check(r.id + ': the near plate crosses her ankles and stops at the walk line', above >= 15 && below <= 3,
      'crest ' + above.toFixed(0) + ' px above the floor, ends ' + below.toFixed(1) + ' px below it');
  }
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILED\n  ' + fails.join('\n  ')
    : 'OK — every chapter-one floor wears one face, from below and from on top'));
  process.exit(fails.length ? 1 : 0);
})();
