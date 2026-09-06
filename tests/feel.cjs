// FEEL, AS NUMBERS. Reviewers call a platformer "tight" and cannot say why;
// the why is countable, and this counts it on the real build:
//   input latency   frames from a key press to the first pose change
//   hit-stop        frames the world freezes on a claw hit
//   camera lead     frames the camera takes to answer a reversal
// Hollow Knight sits at 1-2 / 4-6 / under 10. Bars below are the floor this
// game holds, not the aspiration; tightening them is a design decision.
const { chromium } = require('playwright');
let bad = 0;
const check = (name, ok, note) => { console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : '')); if (!ok) bad++; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const r = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.abil = { dash: 1 }; G.save = sv; startGame(sv); loadRoom('A1');
    await new Promise(r => setTimeout(r, 1500));
    G.dialog = null; G.state = 'PLAY'; G.toasts = []; G.enemies = [];
    const DT = 1 / 60;
    const clear = () => { for (const k of ['ArrowLeft','ArrowRight','Space','KeyX','ShiftLeft']) { keys[k] = 0; keysP[k] = 0; } };
    const settle = (n) => { clear(); for (let i = 0; i < n; i++) { update(DT); G.dialog = null; G.state = 'PLAY'; } };
    const out = {};
    // ---- input latency: run ----------------------------------------------
    settle(90);
    let st0 = player.heroState(false), f = 0;
    keys.ArrowRight = 1; keysP.ArrowRight = 1;
    while (f < 30) { update(DT); f++; if (player.heroState(Math.abs(player.vx) > 150) !== st0 && Math.abs(player.vx) > 30) break; }
    out.runLatency = f;
    // ---- input latency: jump ---------------------------------------------
    settle(90);
    f = 0; keys.Space = 1; keysP.Space = 1;
    while (f < 30) { update(DT); f++; if (!player.on) break; }
    out.jumpLatency = f;
    // ---- hit-stop on a claw hit -------------------------------------------
    settle(90);
    const e = new Enemy('crawler', player.x + player.w + 20, player.y);
    G.enemies.push(e);
    player.face = 1; player.faceVis = 1;
    let hs = 0; f = 0;
    keys.KeyX = 1; keysP.KeyX = 1;
    while (f < 40) { update(DT); f++; keysP.KeyX = 0; hs = Math.max(hs, G.hitStop || 0); if (hs > 0) break; }
    out.hitStopFrames = Math.round(hs * 60);
    G.enemies = [];
    // ---- camera lead on a reversal ---------------------------------------
    settle(30);
    keys.ArrowRight = 1; for (let i = 0; i < 60; i++) update(DT);
    const cx0 = cam.x; let prev = cam.x;
    clear(); keys.ArrowLeft = 1; keysP.ArrowLeft = 1;
    f = 0;
    while (f < 60) { update(DT); f++; if (cam.x < prev - 0.05) break; prev = cam.x; }
    out.camLeadFrames = f;
    out.camMoved = +(cam.x - cx0).toFixed(1);
    return out;
  });
  console.log('  run latency ' + r.runLatency + 'f   jump latency ' + r.jumpLatency + 'f   hit-stop ' + r.hitStopFrames + 'f   camera answers a reversal in ' + r.camLeadFrames + 'f');
  check('a run starts within 2 frames of the key', r.runLatency <= 2, r.runLatency + ' frames');
  check('a jump leaves the ground within 2 frames of the key', r.jumpLatency <= 2, r.jumpLatency + ' frames');
  check('a claw hit freezes the world for at least 3 frames', r.hitStopFrames >= 3, r.hitStopFrames + ' frames');
  check('the camera answers a reversal within 9 frames (150 ms)', r.camLeadFrames <= 9, r.camLeadFrames + ' frames');
  check('no page errors', !errs.length, errs[0] || '');
  await b.close();
  if (bad) { console.log('\n' + bad + ' feel check(s) failed'); process.exit(1); }
  console.log('\nOK — the body answers the hand, and the world answers the body');
})();
