// AN AGENT POSED FROM PARTS (js/agentrig.js) — the proof, measured.
// Owner, 2026-11-17: "Do you have the ability to animate those agents between those
// moves?... instead of generating the artwork for every single move. And this way we
// can make everything smoother."
//   A  it is OFF unless asked for: the shipped drawing is still the fired plates
//   B  asked for, every move draws a whole body the size the plates draw it, with its
//      feet on the floor in every move that stands on one
//   C  the moves are different BODIES, not one body relabelled: the hips drop in the
//      crouch, leave the floor in the leap, and the kneel is lower than the stand
//   D  it MOVES between them: driven stand -> wind-up -> lunge -> spent -> stand at 60 fps
//      no frame jumps (the plates change the whole picture in one frame), and it has
//      arrived a little over half a second after each change
//   E  a wind-up is said in light: the tell raises the amber over the body at rest
//   F  purified, it is the same parts gone blue; NOSTOS has no rig
const { chromium } = require('playwright');
const PORT = process.env.TEST_PORT || 8220;
let bad = 0; const check = (n, ok, d) => { console.log((ok ? 'ok   ' : 'FAIL ') + n + (d != null ? '  ' + (typeof d === 'string' ? d : JSON.stringify(d)) : '')); if (!ok) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, serviceWorkers: 'block' }); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const R = await page.evaluate(async () => { window.requestAnimationFrame = () => 0; const out = {};
    const sv = newSave(1); sv.time = 99; sv.storyVersion = 2; Object.assign(sv.flags, { tut: 1, woke: 1, heal: 1, nfMeet: 1, bossGlitch: 1 }); startGame(sv);
    loadRoom('GA1D'); G.state = 'PLAY'; G.wake = G.dialog = G.cut = null; const e = G.enemies.find(q => q.kind === 'sage');
    const keys = Object.keys(MEDIA_SRC.images).filter(k => k.startsWith('agRig_tally_') || k.startsWith('agTally')); for (const k of keys) mediaFetch(k, true);
    for (let n = 0; n < 80 && !keys.every(k => MEDIA_IMG[k] && MEDIA_IMG[k].naturalWidth && MEDIA_RAW[k] && MEDIA_RAW[k].naturalWidth); n++) await new Promise(r => setTimeout(r, 120));
    out.parts = keys.filter(k => k.startsWith('agRig_')).length; out.rigs = Object.keys(window.AGENT_RIGS || {});
    const ST = { stand: {}, walk: { vx: -60 }, coil: { coilT: 0.2 }, lunge: { lungeT: 0.1, vx: -300 }, gather: { gatherT: 0.3 }, spent: { windedT: 0.5 }, lock: { locked: true }, pure: { tame: 1, calm: true } };
    const set = (n) => { e.sageDuel = null; Object.assign(e, { vx: 0, coilT: 0, lungeT: 0, gatherT: 0, windedT: 0, locked: false, tame: 0, calm: false, kbT: 0, stagT: 0 }, ST[n]); };
    player.x = e.x - 200;
    const shot = () => { const o = Object.assign(document.createElement('canvas'), { width: 520, height: 380 }), x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 260 - (e.x + e.w / 2), 320 - (e.y + e.h)); G.artProbe = 1; G.rigDrawn = null; try { e.draw(x); } finally { G.artProbe = 0; }
      const d = x.getImageData(0, 0, 520, 380).data; let y0 = 380, y1 = -1, n = 0, amber = 0, blue = 0; for (let yy = 0; yy < 380; yy++) for (let xx = 0; xx < 520; xx++) { const j = (yy * 520 + xx) * 4; if (d[j + 3] > 200) { if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; n++; if (d[j] > 200 && d[j + 1] > 110 && d[j + 2] < 120) amber++; if (d[j + 2] > d[j] * 1.4 && d[j + 2] > 70) blue++; } }
      return { top: 320 - y0, feet: y1 - 320, n, amber, blue, rig: G.rigDrawn }; };
    const settle = (n) => { set(n); e._rig = null; e.walkD = 30; e.anim = 10; const sc = document.createElement('canvas').getContext('2d'); for (let k = 0; k < 120; k++) { e.anim += 1 / 60; e.draw(sc); } };
    // A: off
    G.agentRig = 0; set('stand'); const off = shot(); out.off = { drew: !!off.rig, plateTop: off.top, n: off.n };
    // B, C, E, F: each move, settled
    G.agentRig = 1; out.moves = {};
    for (const n of Object.keys(ST)) { settle(n); const s = shot(); out.moves[n] = { top: s.top, feet: s.feet, n: s.n, amber: s.amber, blue: s.blue, move: s.rig && s.rig.move, pelvis: s.rig && s.rig.pelvis, head: s.rig && s.rig.top, hp: s.rig && s.rig.hp }; }
    // D: the motion
    // (a step is judged as its SHARE of the whole change that move asks for: a plate carries all of it in one frame)
    settle('stand'); const sc = document.createElement('canvas').getContext('2d'); let worst = 0, worstAt = ''; const arrive = {};
    const KEYS = ['hp', 'sp', 'aF', 'stA'], TOL = { hp: 0.02, sp: 0.06, aF: 0.12, stA: 0.12 };
    for (const [n, frames] of [['coil', 40], ['lunge', 16], ['spent', 45], ['stand', 45]]) { set(n); const T = Object.assign({}, AGENT_POSE_BASE, AGENT_POSE[agentRigMove(e)]); let at = -1; const from = Object.assign({}, e._rig.P);
      for (let k = 0; k < frames; k++) { const before = Object.assign({}, e._rig.P); e.anim += 1 / 60; e.draw(sc);
        for (const key of KEYS) { const span = Math.abs(T[key] - from[key]); if (span < TOL[key] * 2) continue; const d = Math.abs(e._rig.P[key] - before[key]) / span; if (d > worst) { worst = d; worstAt = n + ':' + key + ' frame ' + k; } }
        if (at < 0 && KEYS.every(key => Math.abs(e._rig.P[key] - T[key]) < TOL[key])) at = k; }
      arrive[n] = at; }
    out.motion = { worst: +worst.toFixed(3), worstAt, arrive };
    G.agentRig = 0; return out; });
  console.log('── agent-rig  — one sheet of parts, posed by code: every move, and the motion between them');
  check('the parts are cut, anchored and in the build', R.parts === 7 && R.rigs.includes('tally'), { parts: R.parts, rigs: R.rigs });
  check('A  off unless asked for: the plates are still the shipped drawing', R.off.drew === false && R.off.n > 1500, R.off);
  const M = R.moves, names = Object.keys(M);
  check('B  asked for, every move draws a whole body', names.every(n => M[n].n > 1500 && M[n].move), names.map(n => n + ':' + M[n].n).join(' '));
  check('   ...its head as high as the plate stands (within 12%)', Math.abs(M.stand.head * 1.22 - 139) <= 139 * 0.12, { rigHead: Math.round(M.stand.head * 1.22), plateBody: 139 });
  check('   ...and its feet on the floor wherever it stands on one', ['stand', 'walk', 'coil', 'gather', 'spent', 'lock', 'pure'].every(n => Math.abs(M[n].feet) <= 8), names.map(n => n + ':' + M[n].feet).join(' '));
  check('C  the crouch drops the hips, the leap leaves the floor, the kneel is lower than the stand', M.coil.hp < M.stand.hp * 0.7 && M.lunge.feet < -6 && M.lock.head < M.stand.head * 0.8 && M.pure.head < M.stand.head * 0.8,
    { standHp: M.stand.hp, coilHp: M.coil.hp, lungeFeet: M.lunge.feet, standHead: M.stand.head, lockHead: M.lock.head, pureHead: M.pure.head });
  check('D  it MOVES between them: no frame carries more than a quarter of a move (a plate carries all of it)', R.motion.worst > 0.01 && R.motion.worst < 0.25, R.motion);
  check('   ...and it has arrived within about half a second of each change, never in one frame', Object.values(R.motion.arrive).every(k => k >= 3 && k <= 36), R.motion.arrive);
  check('E  a wind-up is said in light: more amber than the body at rest', M.coil.amber > M.stand.amber * 1.5 + 20 && M.gather.amber > M.stand.amber * 1.5 + 20, { rest: M.stand.amber, coil: M.coil.amber, gather: M.gather.amber });
  check('F  purified, the same parts go blue', M.pure.blue > M.pure.n * 0.3 && M.stand.blue < M.stand.n * 0.1, { pureBlue: M.pure.blue, of: M.pure.n, standBlue: M.stand.blue });
  await page.goto('http://127.0.0.1:' + PORT + '/odyssey.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  const N = await page.evaluate(() => { G.agentRig = 1; G.roomId = 'GA1D'; return agentRigName(); });
  check('   ...and NOSTOS has no rig', N === null, N);
  check('no page errors', errs.length === 0, errs.slice(0, 3));
  await browser.close();
  if (bad) { console.log('\nFAILED: ' + bad); process.exit(1); }
  console.log('\nOK — the rig stands, moves and settles, and it is off until it is asked for');
})().catch(e => { console.error(e); process.exit(1); });
