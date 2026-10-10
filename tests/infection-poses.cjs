// THE INFECTION'S EYES, POSE BY POSE — every guardian, every state it has a
// picture for, both facings (js/infection-eyes.js).
//
// tests/infection-roster.cjs proves every placed body reports an eye at rest
// and walking. That is exactly the frame an eye anchor is most likely to be
// right in and the least likely to matter: the owner's brief is the eye in
// EVERY frame — the wind-up, the strike, the leap, the landing, the stagger —
// and an anchor measured on the idle strip says nothing about a leap strip
// whose head is somewhere else. So, for each guardian with authored state art,
// each state its renderer draws differently is staged through the game's own
// fields (st, t, u, vy, the strip clocks), sampled early / mid / late in the
// state, facing left and right, and for every one of those frames:
//
//   1. an eye is reported (unless the pose is a deliberate gap, said below)
//   2. it lies ON the drawn body: the body alone is rendered to a scratch
//      canvas through its own draw, every piece of ART it blits is mirrored
//      into a mask at full opacity, and the eye must sit on (or within EYE_TOL
//      px of) an opaque pixel of that art — not on an aura, a telegraph glow
//      or the air in front of the face. Full opacity because a hit flash, a
//      ghosted spin or a fading wind-up still draws the same figure
//   (what this cannot tell is a forehead from an eye — both are body. The
//    --sheet is for that, and it is how the re-placed anchors were found)
//   3. moving in that pose, the newest wisp is born at an eye of THAT frame
//
//   node tests/infection-poses.cjs            the check
//   node tests/infection-poses.cjs --sheet o.jpg   also a contact sheet: every
//                                 pose, facing left, mid-state, eye ringed
const { chromium } = require('playwright');
const fs = require('fs');

// how near an opaque pixel of the body's art the eye must be (world px), and
// the art alpha that counts as opaque
const EYE_TOL = 3, SOLID_A = 128;

// The poses. `st` is the state the renderer branches on; anything else is
// assigned to the body as given. `t0` is the state's own duration where the
// renderer's clock is not 1 s. `gap` marks a pose with no eye BY DESIGN.
const AIR = { on: false };
const GUARDIANS = [
  // the Alpha (re-filmed 2026-10-10): coil is alLeap 0-4, the leap is the
  // alAir float strip, recoil and turn are alLeap 5-8 (ALPHA_STRIP)
  { room: 'A10', kind: 'alpha', poses: [
    { st: 'rest' }, { st: 'prowl', vx: -120 }, { st: 'roarwarn' }, { st: 'roar' }, { st: 'broodcall' }, { st: 'howl' },
    { st: 'coil' }, { st: 'leap', ...AIR }, { st: 'recoil' }, { st: 'turn' }, { st: 'clawwarn' }, { st: 'claw' },
    { st: 'bitewarn' }, { st: 'bite' }, { st: 'clinch' }, { st: 'shake' }, { st: 'rest', hurtT: 0.2, name: 'hurt' }] },
  { room: 'A4', kind: 'glitch', poses: [
    { st: 'idle' }, { st: 'stalk' }, { st: 'run' }, { st: 'swipewarn' }, { st: 'swipe' },
    { st: 'swipewarn', swiped2: true, name: 'rearwarn' }, { st: 'swipe', swiped2: true, name: 'rearswipe' },
    { st: 'crouch' }, { st: 'springwarn' }, { st: 'spring', ...AIR }, { st: 'dive', ...AIR }, { st: 'pounce', ...AIR },
    { st: 'perch' }, { st: 'nullhop', ...AIR }, { st: 'nullcharge' }, { st: 'nullend' }, { st: 'roar' }, { st: 'recover', name: 'land' },
    { st: 'idle', _recoilT: 0.15, name: 'recoil' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 }] },
  { kind: 'brood', poses: [
    { st: 'idle' }, { st: 'volley' }, { st: 'broodcall' }, { st: 'swoopwarn' }, { st: 'swoop', ...AIR }, { st: 'rise', ...AIR },
    { st: 'restlow' }, { st: 'cffloor' }, { st: 'cfcrash' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 }] },
  { kind: 'zero', poses: [
    { st: 'idle' }, { st: 'novawarn' }, { st: 'shardwarn' }, { st: 'orbs' }, { st: 'lancewarn' }, { st: 'dashwarn' },
    { st: 'dash' }, { st: 'azhush' }, { st: 'recover' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 }] },
  { kind: 'atlas', poses: [
    { st: 'idle' }, { st: 'idle', vx: -110, name: 'walk' }, { st: 'slamwarn' }, { st: 'forgebell' }, { st: 'meltwarn' },
    { st: 'hymn' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 }] },
  { kind: 'prism', poses: [
    { st: 'idle' }, { st: 'aim' }, { st: 'beam' }, { st: 'pounce', ...AIR }, { st: 'dashslash' }, { st: 'arcstorm' },
    { st: 'rest' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 },
    // the spin is the vortex frame and the light-step (vanish and arrival) is
    // the burst frame: there is no face in either (tools/eyespecs.cjs, PRISM)
    { st: 'arcspin', gap: 1 }, { st: 'lsvanish', gap: 1 }, { st: 'lsarrive', gap: 1 }] },
  { room: 'E3', kind: 'mother', poses: [
    { st: 'idle' }, { st: 'nwcharge' }, { st: 'msong' }, { st: 'grabwarn' }, { st: 'grab' },
    { st: 'beamwarn', beam: { warn: true, t: 1, x: 0, y: 0, w: 4, h: 4 } }, { st: 'recover' },
    { st: 'idle', mPhase: 1, name: 'phase1' }, { st: 'idle', mPhase: 2, name: 'phase2' },
    { st: 'idle', mPhase: 3, stagT: 1, name: 'phase3' }, { st: 'idle', hurtT: 0.2, name: 'hurt' }, { st: 'daze', stagT: 1 }] },
  { kind: 'chime', poses: [
    { st: 'rest' }, { st: 'ringwarn', t0: 0.35 }, { st: 'ring', t0: 0.5 }, { st: 'notewarn', t0: 0.35 }, { st: 'note', t0: 0.5 },
    { st: 'rest', hurtT: 0.2, name: 'hurt' }] },
];
const SAMPLES = [0.1, 0.5, 0.9];

(async () => {
  const sheetOut = process.argv.indexOf('--sheet') > 0 ? process.argv[process.argv.indexOf('--sheet') + 1] : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof infEyeStats === 'function', { timeout: 20000 });
  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── infection-poses — every guardian, every drawn state, both facings: an eye, on the body, the smoke born there');
  const T0 = Date.now();

  // INFPOSE_ONLY=<regex> stages only the matching kinds (a look, not the check)
  const ONLY = process.env.INFPOSE_ONLY ? new RegExp(process.env.INFPOSE_ONLY) : null;
  const out = [];
  for (const g of GUARDIANS) {
    if (ONLY && !ONLY.test(g.kind)) continue;
    const r = await page.evaluate(async ({ g, SAMPLES, EYE_TOL, SOLID_A, wantSheet }) => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      // the room the rooms place this guardian in
      let room = g.room;
      if (!room) for (const id of Object.keys(ROOMS)) {
        const ents = ROOMS[id].ents || [];
        if (ents.some(e => e[0] === 'boss' && e[3] === g.kind)) { room = id; break; }
      }
      if (!room) return { kind: g.kind, err: 'no room places it' };
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(room); G.state = 'PLAY'; G.bossEntry = null;
      const body = G.boss;
      if (!body) return { kind: g.kind, room, err: 'no boss in ' + room };
      body.update = function () {};               // the harness owns its state
      G.enemies = [];
      player.x = 40; player.y = 0; player.invT = 1e9; player.dead = false;
      const home = { x: Math.min((G.roomDef.w - 8) * TILE, Math.max(8 * TILE, body.x)), y: body.y };
      // WAIT FOR THIS GUARDIAN'S ART, not for every fetch in flight: the room's
      // own measured art list (assets/roomassets.json), full size — the low
      // tier stands in proportionally, but a parts atlas has no low tier
      const keys = ((window.ROOM_ASSETS && ROOM_ASSETS.rooms && ROOM_ASSETS.rooms[room]) || {}).keys || [];
      for (const k of keys) mediaFetch(k);
      const ready = (ks) => ks.every(k => !MEDIA_SRC.images[k] || (MEDIA_RAW[k] && MEDIA_LOW[k] !== 2));
      for (let t0 = Date.now(); Date.now() - t0 < 30000 && !ready(keys);) await sleep(80);
      const missingArt = keys.filter(k => !ready([k]));

      const set = (p, k, d) => {
        const T = p.t0 || 1;
        Object.assign(body, {
          x: home.x, y: home.y, vx: 0, vy: 0, on: true, hurtT: 0, stagT: 0, _recoilT: 0, swiped2: false,
          beam: null, mPhase: 0, windT: 0, leapT0: null,
        });
        for (const f in p) if (f !== 'st' && f !== 'name' && f !== 't0' && f !== 'gap') body[f] = p[f];
        body.st = p.st;
        // the state's clock, k of the way through, on every clock a renderer reads
        body.t = body.nwT = (1 - k) * T; body.u = k; body._st0 = T;
        body._motionState = p.st; body._motionDuration = T;
        body._alphaState = p.st; body._alphaElapsed = k * T; body._alphaDuration = T;
        body._gaitPh = k; body._alphaDistance = k * 100;
        if (p.on === false) body.vy = -400 + 800 * k;
        body.dir = body.face = body.faceVis = d;
        body.anim = 3 + k;
      };
      // THE BODY ALONE, through its own draw, into a scratch canvas whose
      // transform is world -> scratch pixels: the reported eye comes back in
      // world coordinates and the pixels under it are the body's own
      const S = 2;
      // what the body's draw ASKS FOR: its own strips, fetched on demand. Only
      // those are waited on — never the whole pending map, which also holds
      // the room's music and backdrops
      const asked = new Set(), real = window.mediaFetch;
      const solo = (ring) => {
        const R = Math.max(body.w, body.h) * 3 + 120;
        const N = Math.ceil(R * S);
        const cv = document.createElement('canvas'); cv.width = cv.height = N;
        const x = cv.getContext('2d');
        const mk = document.createElement('canvas'); mk.width = mk.height = N;
        const m = mk.getContext('2d', { willReadFrequently: true });
        // every blit of art lands in the mask too, through the same transform,
        // at full opacity: the mask is the figure, whatever alpha it is shown at
        const blit = x.drawImage;
        x.drawImage = function () {
          blit.apply(x, arguments);
          m.setTransform(x.getTransform()); m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
          try { blit.apply(m, arguments); } catch (e) {}
        };
        const ox = body.x + body.w / 2 - R / 2, oy = body.y + body.h / 2 - R / 2;
        x.setTransform(S, 0, 0, S, -ox * S, -oy * S);
        infEyeWorldBegin(x);
        G.artProbe = true;
        // the loading silhouette must never be painted over a body that drew
        let held = 0;
        const realHold = window.drawBossHold;
        window.drawBossHold = function () { held++; return realHold.apply(this, arguments); };
        window.mediaFetch = function (k) { asked.add(k); return real.apply(this, arguments); };
        try { body.draw(x); } finally { G.artProbe = false; window.mediaFetch = real; window.drawBossHold = realHold; }
        x.setTransform(1, 0, 0, 1, 0, 0);
        const eyes = [];
        for (let i = 0; i < (body._eyeN || 0); i++) eyes.push([body._eyeW[i * 2], body._eyeW[i * 2 + 1]]);
        // the distance from each eye to the nearest opaque pixel of art, world px
        const d = m.getImageData(0, 0, N, N).data;
        const solidA = SOLID_A;
        let bx0 = N, by0 = N, bx1 = 0, by1 = 0;
        for (let q = 0, i = 3; i < d.length; i += 4, q++) if (d[i] >= solidA) {
          const xx = q % N, yy = (q / N) | 0;
          if (xx < bx0) bx0 = xx; if (xx > bx1) bx1 = xx; if (yy < by0) by0 = yy; if (yy > by1) by1 = yy;
        }
        const dist = eyes.map(([wx, wy]) => {
          const px = (wx - ox) * S, py = (wy - oy) * S, rr = Math.ceil(12 * S);
          let best = 99;
          for (let yy = Math.max(0, Math.floor(py - rr)); yy <= Math.min(N - 1, py + rr); yy++)
            for (let xx = Math.max(0, Math.floor(px - rr)); xx <= Math.min(N - 1, px + rr); xx++) {
              if (d[(yy * N + xx) * 4 + 3] < solidA) continue;
              const q = Math.hypot(xx - px, yy - py) / S;
              if (q < best) best = q;
            }
          return best;
        });
        let url = null;
        if (ring) {
          x.strokeStyle = '#00ffd0'; x.lineWidth = 2;
          for (const [wx, wy] of eyes) { x.beginPath(); x.arc((wx - ox) * S, (wy - oy) * S, 7, 0, 7); x.stroke(); }
          // cropped to the solid body, so the head is big enough to judge
          const m = 10, w0 = Math.max(1, bx1 - bx0 + m * 2), h0 = Math.max(1, by1 - by0 + m * 2), T = 200;
          const sc = T / Math.max(w0, h0), cv2 = document.createElement('canvas'); cv2.width = cv2.height = T;
          const y = cv2.getContext('2d'); y.fillStyle = '#2b333c'; y.fillRect(0, 0, T, T);
          y.drawImage(cv, bx0 - m, by0 - m, w0, h0, (T - w0 * sc) / 2, (T - h0 * sc) / 2, w0 * sc, h0 * sc);
          url = cv2.toDataURL('image/png');
        }
        // the same eye reported twice (a cell drawn twice — a flash pass, an
        // echo) doubles its glow and its smoke: the nearest pair, world px
        let pair = 1e9;
        for (let i = 0; i < eyes.length; i++) for (let j = i + 1; j < eyes.length; j++)
          pair = Math.min(pair, Math.hypot(eyes[i][0] - eyes[j][0], eyes[i][1] - eyes[j][1]));
        return { eyes, dist, url, held, pair };
      };
      const res = { kind: g.kind, room, missingArt, poses: [] };
      for (const p of g.poses) {
        const name = p.name || p.st;
        const pr = { name, gap: !!p.gap, frames: [], trail: { frames: 0, worst: 0, born: 0 } };
        for (const d of [-1, 1]) for (const k of SAMPLES) {
          set(p, k, d);
          // a state's own strip may not be in the room's list (drawn on demand):
          // draw once, and wait for anything that draw asked for
          asked.clear();
          let sv0 = solo(false);
          const want = [...asked].filter(q => MEDIA_SRC.images[q] && !ready([q]));
          if (want.length) {
            for (const q of want) real(q);
            for (let t0 = Date.now(); Date.now() - t0 < 8000 && !ready(want);) await sleep(60);
            set(p, k, d); sv0 = solo(false);
          }
          const f = { d, k, n: sv0.eyes.length, worst: sv0.dist.length ? Math.max(...sv0.dist) : null, held: sv0.held, pair: sv0.pair };
          if (wantSheet && d === -1 && k === 0.5) f.url = solo(true).url;
          pr.frames.push(f);
        }
        // MOVING in this pose, through the real update() and draw(): the newest
        // wisp of every frame must sit at an eye of that frame
        for (const d of [-1, 1]) {
          set(p, 0.5, d);
          for (let i = 0; i < 10; i++) {
            G.bossEntry = null; if (G.state !== 'PLAY') G.state = 'PLAY';
            body.st = p.st;
            body.x += 3 * d; body.vx = 180 * d; body.dir = body.face = body.faceVis = d;
            body.anim += 1 / 60;
            update(1 / 60);
            draw(performance.now());
            if (!body._eyeN) continue;
            const young = infEyeParticles(body).filter(q => q.age < 1e-6);
            if (!young.length) continue;
            const eyes = [];
            for (let e = 0; e < body._eyeN; e++) eyes.push([body._eyeW[e * 2], body._eyeW[e * 2 + 1]]);
            pr.trail.frames++; pr.trail.born += young.length;
            for (const q of young) pr.trail.worst = Math.max(pr.trail.worst, Math.min(...eyes.map(e => Math.hypot(q.x - e[0], q.y - e[1]))));
          }
          infEyeClearAll();
        }
        res.poses.push(pr);
      }
      res.cls = infEyeClass(body);
      return res;
    }, { g, SAMPLES, EYE_TOL, SOLID_A, wantSheet: !!sheetOut });
    out.push(r);
    console.log('    ' + g.kind + ' staged (' + ((Date.now() - T0) / 1000).toFixed(0) + ' s)');
  }

  console.log('');
  for (const r of out) {
    if (r.err) { console.log('    ' + r.kind.padEnd(8) + r.err); continue; }
    console.log('    ' + (r.kind + ' (' + r.room + ')').padEnd(16) + (r.cls || 'none') + (r.missingArt.length ? '  ART NOT LOADED: ' + r.missingArt.join(',') : ''));
    for (const p of r.poses) {
      const ns = p.frames.map(f => f.n).join('');
      const w = p.frames.filter(f => f.worst != null).map(f => f.worst);
      console.log('      ' + p.name.padEnd(11) + (p.gap ? 'gap ' : '    ') + 'eyes ' + ns.padEnd(7)
        + ' off-body ' + (w.length ? Math.max(...w).toFixed(1) : '—').padStart(4) + 'px'
        + '   trail ' + p.trail.frames + 'f/' + p.trail.born + ' worst ' + p.trail.worst.toFixed(1) + 'px'
        + (p.frames.some(f => f.worst > EYE_TOL) ? '   [' + p.frames.filter(f => f.worst > EYE_TOL).map(f => (f.d < 0 ? 'L' : 'R') + f.k + ':' + f.worst.toFixed(1)).join(' ') + ']' : ''));
    }
  }
  console.log('');

  const ok = out.filter(r => !r.err);
  check('every guardian is staged in its room (' + ok.length + ' of ' + GUARDIANS.length + ')', ok.length === (ONLY ? out.length : GUARDIANS.length),
    out.filter(r => r.err).map(r => r.kind + ': ' + r.err).join(', ') || null);
  const unloaded = ok.filter(r => r.missingArt.length);
  check('...with its art loaded at full size', !unloaded.length, unloaded.map(r => r.kind + ' ' + r.missingArt.join(',')).join('; ') || null);
  const all = ok.flatMap(r => r.poses.map(p => Object.assign({ kind: r.kind }, p)));
  const live = all.filter(p => !p.gap);
  const nFrames = live.reduce((a, p) => a + p.frames.length, 0);
  const blind = live.filter(p => p.frames.some(f => !f.n));
  check('an eye is reported in every pose, early/mid/late, both facings (' + live.length + ' poses, ' + nFrames + ' frames)', !blind.length,
    blind.map(p => p.kind + ':' + p.name + ' [' + p.frames.map(f => f.n).join('') + ']').join(', ') || null);
  const off = live.filter(p => p.frames.some(f => f.worst != null && f.worst > EYE_TOL));
  check('...and every eye sits on the drawn body (within ' + EYE_TOL + ' px of a solid pixel)', !off.length,
    off.map(p => p.kind + ':' + p.name + ' ' + Math.max(...p.frames.filter(f => f.worst != null).map(f => f.worst)).toFixed(1) + 'px').join(', ')
    || 'worst ' + Math.max(...live.flatMap(p => p.frames.filter(f => f.worst != null).map(f => f.worst))).toFixed(1) + ' px');
  const twice = all.filter(p => p.frames.some(f => f.pair < 1));
  check('no eye is reported twice in one frame', !twice.length, twice.map(p => p.kind + ':' + p.name).join(', ') || null);
  const heldOver = all.filter(p => p.frames.some(f => f.held));
  check('no guardian with its art loaded is drawn under the loading silhouette', !heldOver.length,
    heldOver.map(p => p.kind + ':' + p.name).join(', ') || null);
  const dry = live.filter(p => p.trail.frames < 8);
  check('moving in every pose, the eyes smoke', !dry.length, dry.map(p => p.kind + ':' + p.name + ' ' + p.trail.frames + 'f').join(', ') || null);
  const loose = live.filter(p => p.trail.worst > 1);
  check('...and every newest wisp is born at an eye of THAT frame (within 1 px)', !loose.length,
    loose.map(p => p.kind + ':' + p.name + ' ' + p.trail.worst.toFixed(1)).join(', ')
    || 'worst ' + Math.max(...live.map(p => p.trail.worst)).toFixed(2) + ' px');
  const gaps = all.filter(p => p.gap);
  const gapLit = gaps.filter(p => p.frames.some(f => f.n));
  check('the deliberate gaps report no eye (' + gaps.map(p => p.kind + ':' + p.name).join(' ') + ')', !gapLit.length,
    gapLit.map(p => p.kind + ':' + p.name).join(', ') || null);
  const wrong = ok.filter(r => r.cls !== 'purple');
  check('every guardian burns purple', !wrong.length, wrong.map(r => r.kind + '=' + r.cls).join(', ') || null);
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  console.log('  (' + ((Date.now() - T0) / 1000).toFixed(0) + ' s)');

  if (sheetOut) {
    const tiles = all.map(p => ({ label: p.kind + ':' + p.name, url: (p.frames.find(f => f.url) || {}).url })).filter(t => t.url);
    const url = await page.evaluate(async (tiles) => {
      const per = 8, W = 200, H = 214;
      const c = document.createElement('canvas'); c.width = per * W; c.height = Math.ceil(tiles.length / per) * H;
      const x = c.getContext('2d'); x.fillStyle = '#1b2026'; x.fillRect(0, 0, c.width, c.height);
      x.font = '11px sans-serif'; x.fillStyle = '#fff';
      for (let i = 0; i < tiles.length; i++) {
        const im = new Image(); im.src = tiles[i].url; await im.decode();
        const ox = (i % per) * W, oy = Math.floor(i / per) * H;
        x.drawImage(im, ox, oy + 14); x.fillText(tiles[i].label, ox + 3, oy + 11);
      }
      return c.toDataURL('image/jpeg', 0.8);
    }, tiles);
    fs.writeFileSync(sheetOut, Buffer.from(url.split(',')[1], 'base64'));
    console.log('  sheet -> ' + sheetOut);
  }

  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — every guardian looks out through its eyes in every pose it is drawn in, and the smoke is born there');
})();
