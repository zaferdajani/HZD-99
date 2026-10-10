// THE INFECTION'S EYES, ACROSS THE WHOLE CAST — every hostile body the rooms
// place and every guardian, measured one by one (js/infection-eyes.js).
//
// tests/infection-eyes.cjs proves the system on a wolf and two guardians. This
// one proves the COVERAGE, because "check every enemy and boss renderer" is
// exactly the claim that rots: a new enemy lands with its own draw path, nobody
// hooks its eye, and it walks the meadow clean while its pack smokes. So:
//
//   1. every hostile body the rooms place reports an eye from its renderer
//   2. ...in the right colour: red for the rank and file, purple for guardians
//   3. ...ON its body (inside its drawn extent) and not at its centre
//   4. a body drawn in profile carries its eye to the side it FACES
//   5. moving, the newest smoke is born at the eye of the frame that made it,
//      in every frame, whatever the animation is doing
//   6. the wolf's eye follows the body through every state it has a picture
//      for — rest, prowl, gallop, coil, bite, crouch, leap, landing, recoil,
//      winded — and is not one fixed point pasted over all of them
//
//   node tests/infection-roster.cjs
const { chromium } = require('playwright');

(async () => {
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
  console.log('── infection-roster — every hostile body, every guardian: an eye, the right colour, on the head, facing, and the smoke born there');

  // ROSTER_TRACE=1 streams every phase as it happens, so a run that is killed
  // still says where it was; the phase summary below is printed every time.
  const T0 = Date.now();
  if (process.env.ROSTER_TRACE) page.on('console', m => {
    if (m.text().startsWith('[roster]')) console.log(((Date.now() - T0) / 1000).toFixed(1).padStart(7) + 's ' + m.text());
  });
  const R = await page.evaluate(async (trace) => {
    const tp = performance.now(), ph = {}, slow = [];
    const tick = (name, t, extra) => {
      const ms = performance.now() - t;
      ph[name] = (ph[name] || 0) + ms;
      if (trace) console.log('[roster] ' + name + ' ' + Math.round(ms) + 'ms' + (extra ? ' ' + extra : ''));
      return ms;
    };
    // WAITING FOR ART: WHICH ART, AND WHAT "LANDED" MEANS. MEDIA_PEND used to
    // keep every sheet ever REQUESTED — mediaFetch never removed a key that
    // loaded (js/media.js now does; a landed sheet is MEDIA_LOW[k] === 3, the
    // test artbible/kingdom/cavedark use). This harness waited for MEDIA_PEND
    // to empty, which it never did, so every body sat out its full 80-poll cap
    // and the wolf 15 s per state: 670 s measured, the 360 s audit kill. And the
    // background prefetcher, re-aimed at the whole game by every room the
    // sweep loads, was landing ~200 sheets through the main thread during the
    // measurement, stretching each 100 ms poll to 200–800 ms. So:
    //   - the prefetcher is parked (tests/preload.cjs owns it; here it only
    //     competes with the measurement and decides at random whether a body
    //     is drawn from its quarter-size stand-in or its real sheet)
    //   - the sheets a body needs are the ones its room and its draw ASK for:
    //     the lazy map's accessor calls mediaFetch(k, urgent) for what a draw
    //     reads, and renderers that read MEDIA_RAW directly ask first
    //     (drawAlpha fetches its strips; loadRoom fetches the guardian's art)
    //   - a body is measured once every one of them is here at FULL size
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
    // a quarter-size stand-in already in the store would be handed to a draw
    // without asking (the accessor only fetches what is missing), so the body
    // would be measured on it; forget those, and the draw asks for the real one
    for (let i = 0; i < 50 && Object.keys(MEDIA_LOW).some(k => MEDIA_LOW[k] === 1); i++) await new Promise(r => setTimeout(r, 100));
    for (const k of Object.keys(MEDIA_LOW)) {
      if (MEDIA_LOW[k] !== 2 || MEDIA_PEND[k]) continue;
      delete MEDIA_RAW[k]; MEDIA_LOW[k] = 0; mediaDirty(k);
    }
    const keyOf = (e) => (e instanceof Boss ? 'BOSS:' + (e.type || e.kind) : e.kind)
      + (isWolf(e) ? ':wolf' : (typeof isCheetah === 'function' && isCheetah(e)) ? ':cat' : '');
    const stage = (id) => {
      const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
      startGame(sv); loadRoom(id); G.state = 'PLAY';
      player.x = 40; player.y = 0; player.invT = 1e9; player.dead = false;
    };
    // the cast, as the rooms place it: one of each kind (a wolf and a cheetah
    // are the same kind in different kingdoms, so the zone's animal counts)
    // the phone tier: smaller frame, fewer effects — what is measured here is
    // where the eye is and where the smoke is born, not how pretty the room is
    if (typeof qualSet === 'function') qualSet('low');
    const cast = [], seen = {};
    let t = performance.now();
    for (const id of Object.keys(ROOMS)) {
      const ts = performance.now();
      try { stage(id); } catch (err) { continue; }
      if (trace) tick('sweep.room', ts, id);
      for (const e of G.enemies.concat(G.boss ? [G.boss] : [])) {
        const k = keyOf(e);
        if (!seen[k]) { seen[k] = 1; cast.push({ id, k }); }
      }
    }
    tick('sweep', t, Object.keys(ROOMS).length + ' rooms, ' + cast.length + ' kinds');
    const frame = (body, dx) => {
      // a guardian's room may open on its entry beat (G.bossEntry), which
      // holds the simulation; the eyes are what is measured, not the entrance
      G.bossEntry = null; if (G.state !== 'PLAY') G.state = 'PLAY';
      if (dx) { body.x += dx; body.vx = dx * 60; body.faceVis = body.dir = dx < 0 ? -1 : 1; } else body.vx = 0;
      body.anim = (body.anim || 0) + 1 / 60;
      update(1 / 60);
      draw(performance.now());
    };
    const out = [];
    // the body as the measurement wants it: alone, awake, on open floor
    const place = (c) => {
      stage(c.id);
      const body = G.enemies.concat(G.boss ? [G.boss] : []).find(e => keyOf(e) === c.k);
      if (!body) return null;
      body.update = function () {};
      if (body !== G.boss) { G.enemies = [body]; G.boss = null; } else G.enemies = [];
      // a guardian is measured AWAKE: rooms place them dormant (eyes shut is
      // a legitimate dormant picture) or staged for a story beat
      if (body instanceof Boss) { body.st = 'idle'; body.t = 99; body.meet = false; }
      // somewhere it can be seen and has floor under it
      body.x = Math.min((G.roomDef.w - 6) * TILE, Math.max(8 * TILE, body.x));
      return body;
    };
    t = performance.now();
    for (const c of cast) {
      let tb = performance.now();
      asked.clear();
      let body = place(c);
      tick('cast.stage', tb, c.k + ' in ' + c.id);
      if (!body) { out.push({ k: c.k, id: c.id, err: 'not placed' }); continue; }
      // REHEARSAL: walk the body through every picture the measurement will
      // draw — still both ways, then the 24-frame stroll — so its draw asks
      // for every sheet it uses, then wait for exactly those at full size
      tb = performance.now();
      for (const d of [-1, 1]) { body.dir = body.faceVis = d; frame(body, 0); }
      for (let i = 0; i < 24; i++) frame(body, i < 12 ? -3 : 3);
      let polls = 0;
      for (let i = 0; i < 80; i++) {
        body.dir = body.faceVis = -1; draw(performance.now()); polls++;
        if (body._eyeN > 0 && !waiting().length) break;
        await new Promise(r => setTimeout(r, 100));
      }
      const waited = tick('cast.artwait', tb, c.k + ' polls ' + polls + ' eye ' + (body._eyeN || 0) + ' asked [' + [...asked].join(',') + '] waiting [' + waiting().join(',') + ']');
      if (waited > 5000) slow.push(c.k + ' artwait ' + (waited / 1000).toFixed(1) + 's waiting [' + waiting().join(',') + ']');
      // ...and the measurement starts from a fresh placement, as it always
      // did: the rehearsal's steps and smoke do not carry into it
      body = place(c);
      for (let i = 0; i < 80; i++) {
        body.dir = body.faceVis = -1; draw(performance.now());
        if (body._eyeN > 0) break;
        await new Promise(r => setTimeout(r, 100));
      }
      tb = performance.now();
      const cx = () => body.x + body.w / 2, cy = () => body.y + body.h / 2;
      const r = { k: c.k, id: c.id, cls: infEyeClass(body), boss: body instanceof Boss || !!body.miniboss || body.kind === 'sage' };
      // facing: one still frame each way
      const side = {};
      for (const d of [-1, 1]) {
        body.dir = body.faceVis = d; frame(body, 0); frame(body, 0);
        side[d] = body._eyeN ? [body._eyeW[0] - cx(), body._eyeW[1] - cy()] : null;
      }
      r.side = side;
      r.size = [body.w, body.h];
      // moving: every frame, the newest wisp sits at THIS frame's eye
      let worst = 0, frames = 0, born = 0;
      for (let i = 0; i < 24; i++) {
        frame(body, i < 12 ? -3 : 3);
        if (!body._eyeN) continue;
        const ex = body._eyeW[0], ey = body._eyeW[1];
        // born in THIS frame's draw: the smoke is laid as the eye is drawn,
        // the newest at age zero (a frame-old wisp is the frame before's eye)
        const young = infEyeParticles(body).filter(p => p.age < 1e-6);
        if (!young.length) continue;
        frames++; born += young.length;
        worst = Math.max(worst, Math.min(...young.map(p => Math.hypot(p.x - ex, p.y - ey))));
      }
      r.trail = { frames, born, worst };
      out.push(r);
      tick('cast.frames', tb, c.k + ' (28 frames)');
    }
    tick('cast', t, cast.length + ' bodies');

    // ---- the wolf, state by state --------------------------------------------
    t = performance.now();
    stage('A1');
    const w = G.enemies.find(e => isWolf(e));
    w.update = function () {}; G.enemies = [w]; w.x = 20 * TILE; w.dir = w.faceVis = -1;
    const STATES = {
      rest: {}, prowl: { vx: -60, _ph: 0.4 }, gallop: { vx: -200, _ph: 0.6 },
      coil: { coilT: 0.05, _o0coilT: 0.45, _opcoilT: 0.05 }, bite: { lungeT: 0.1, _o0lungeT: 0.25, _oplungeT: 0.1 },
      leap: { on: false, airT: 0.3, vy: 300 }, landing: { landT: 0.12, land0: 0.32 },
      recoil: { kbT: 0.05, _o0kbT: 0.3, _opkbT: 0.05 }, winded: { windedT: 0.5 },
    };
    const wolf = {};
    for (const s in STATES) {
      const keep = { x: w.x, y: w.y };
      Object.assign(w, { vx: 0, on: true, airT: 0, vy: 0, coilT: 0, lungeT: 0, landT: 0, kbT: 0, windedT: 0, hurtT: 0, crouchT: 0 }, STATES[s]);
      const tw = performance.now();
      asked.clear();
      draw(performance.now()); const pend = await settle(); draw(performance.now());
      const ws = tick('wolf.settle', tw, s + ' waiting [' + pend.join(',') + ']');
      if (ws > 5000) slow.push('wolf ' + s + ' settle ' + (ws / 1000).toFixed(1) + 's waiting [' + pend.join(',') + ']');
      wolf[s] = w._eyeN ? [Math.round((w._eyeW[0] - w.x) * 10) / 10, Math.round((w._eyeW[1] - w.y) * 10) / 10] : null;
      Object.assign(w, keep);
    }
    tick('wolf', t, Object.keys(STATES).length + ' states');
    mediaFetch = realFetch;
    ph.total = performance.now() - tp;
    return { cast: out, wolf, ph, slow };
  }, !!process.env.ROSTER_TRACE);
  // where the time went, every run: the suite's timeout for this harness is
  // derived from these numbers, so they are printed rather than guessed
  const sec = (n) => ((R.ph[n] || 0) / 1000).toFixed(1) + 's';
  console.log('  time: sweep ' + sec('sweep') + ', cast ' + sec('cast') + ' (stage ' + sec('cast.stage') + ', art wait '
    + sec('cast.artwait') + ', frames ' + sec('cast.frames') + '), wolf ' + sec('wolf') + ' (settle ' + sec('wolf.settle')
    + '), in-page total ' + sec('total') + ', wall ' + ((Date.now() - T0) / 1000).toFixed(1) + 's');
  for (const s of R.slow) console.log('  slow: ' + s);

  console.log('');
  for (const r of R.cast) {
    if (r.err) { console.log('    ' + r.k.padEnd(18) + r.err); continue; }
    const s = r.side[-1] ? r.side[-1].map(Math.round).join(',') + ' | ' + (r.side[1] ? r.side[1].map(Math.round).join(',') : '—') : '—';
    console.log('    ' + r.k.padEnd(18) + (r.cls || 'none').padEnd(7) + ('eye L ' + s).padEnd(24) + ' trail '
      + r.trail.frames + 'f/' + r.trail.born + ' worst ' + r.trail.worst.toFixed(1) + 'px  (' + r.id + ')');
  }
  console.log('');
  const placed = R.cast.filter(r => !r.err);
  const noEye = placed.filter(r => !r.side[-1] || !r.side[1]);
  check('every hostile body the rooms place reports an eye (' + placed.length + ' kinds)', !noEye.length && placed.length >= 20,
    noEye.map(r => r.k).join(', ') || 'all');
  const wrong = placed.filter(r => r.cls !== (r.boss ? 'purple' : 'red'));
  check('...red for the rank and file, purple for every guardian', !wrong.length,
    wrong.map(r => r.k + '=' + r.cls).join(', ') || placed.filter(r => r.boss).length + ' guardians purple');
  const off = placed.filter(r => {
    const e = r.side[-1]; if (!e) return false;
    const M = Math.max(r.size[0], r.size[1]);
    return Math.abs(e[0]) > M * 2.6 || e[1] > r.size[1] * 0.75 || e[1] < -M * 2.6;
  });
  check('...on the body, not off in the room', !off.length, off.map(r => r.k + ' ' + r.side[-1].map(Math.round)).join(', '));
  const centred = placed.filter(r => r.side[-1] && Math.hypot(r.side[-1][0], r.side[-1][1]) < Math.min(r.size[0], r.size[1]) * 0.12
    // a body that IS its eye — a core, a lens, a turret's optic — is exempt
    && !/turret|BOSS:lens|BOSS:mother|BOSS:zero|BOSS:glitch|flier|bat|surge|kiln|rime|snare|BOSS:moth|BOSS:lattice|BOSS:carrier|BOSS:chime|BOSS:brood|BOSS:atlas|BOSS:prism/.test(r.k));
  check('...and not pasted at the centre of a creature that has a head', !centred.length, centred.map(r => r.k).join(', ') || 'none');
  // profile = the eye swings across the body when it turns round (a quarter
  // of its width or more); then it must swing to the FRONT. A body seen nearly
  // front-on moves its eye a pixel or two and is not held to this.
  const profile = placed.filter(r => r.side[-1] && r.side[1] && Math.abs(r.side[-1][0] - r.side[1][0]) > r.size[0] * 0.25);
  const backward = profile.filter(r => !(r.side[-1][0] < r.side[1][0]));
  check('a body drawn in profile carries its eye to the side it faces (' + profile.length + ' in profile)',
    profile.length >= 6 && !backward.length, backward.map(r => r.k).join(', ') || profile.map(r => r.k).join(' '));
  const trailless = placed.filter(r => r.trail.frames < 10);
  check('moving, every one of them smokes', !trailless.length, trailless.map(r => r.k + ' ' + r.trail.frames + 'f').join(', ') || 'all');
  const loose = placed.filter(r => r.trail.worst > 6);
  check('...and the newest wisp is born at THAT frame\'s eye, every frame (within 6 px)', !loose.length,
    loose.map(r => r.k + ' ' + r.trail.worst.toFixed(1)).join(', ') || 'worst ' + Math.max(...placed.map(r => r.trail.worst)).toFixed(1) + ' px');

  const W = R.wolf, states = Object.keys(W);
  console.log('');
  for (const s of states) console.log('    wolf ' + s.padEnd(8) + (W[s] ? W[s].join(', ') : '—'));
  console.log('');
  const blind = states.filter(s => !W[s]);
  check('the wolf reports its eye in every state it has a picture for', !blind.length, blind.join(', ') || states.length + ' states');
  const pts = states.filter(s => W[s]).map(s => W[s].join(','));
  check('...and the eye moves with the body: not one point pasted on all of them',
    new Set(pts).size >= Math.ceil(states.length * 0.7), new Set(pts).size + ' distinct points in ' + states.length + ' states');
  check('...the crouch drops it and the recoil throws it up',
    W.coil && W.rest && W.recoil && W.coil[1] > W.rest[1] + 2 && W.recoil[1] < W.rest[1] - 2,
    'rest y ' + (W.rest && W.rest[1]) + ', coil y ' + (W.coil && W.coil[1]) + ', recoil y ' + (W.recoil && W.recoil[1]));
  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));

  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — every hostile body looks out through its eyes, in its colour, and the smoke is born there');
})();
