// THE CONTROLLER, AS HE HELD IT (owner, 2026-11-14) — four reports, one harness.
//
//   "In the controller I don't know how to run. It's only walking."
//   "In the mind node, it is hard to play it with the controller. It slips."
//   "Instead of saying the name of the shape like triangle or circle, show me the
//    actual circle and triangle."
//   "The character shouldn't be saying yalla when the player is reading or
//    interacting with the NPC... being idle is just standing still without doing
//    anything, not interacting with anything."
//
// A fake pad is put in the rack (navigator.getGamepads) so pollGamepad reads it
// exactly as it reads a real one: axes and buttons in, actions out.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => {
    localStorage.setItem('cb_intro_seen', '1');
    window.requestAnimationFrame = () => 0;
    window.FAKE_PAD = null;
    navigator.getGamepads = () => [window.FAKE_PAD];
  });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const out = {};
    const pad = (ax, ay, btns) => {
      const buttons = []; for (let i = 0; i < 17; i++) buttons.push({ pressed: !!(btns && btns.includes(i)), value: btns && btns.includes(i) ? 1 : 0 });
      window.FAKE_PAD = { id: 'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)', index: 0, connected: true,
        timestamp: performance.now(), mapping: 'standard', axes: [ax, ay, 0, 0], buttons };
    };
    const poll = () => { clearP(); pollGamepad(); pollInput(); };
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1; startGame(sv); loadRoom('A1');
    G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = [];

    // ---- RUN ---------------------------------------------------------------
    pad(0, 0); poll();
    pad(0.55, 0); poll(); out.gentle = { run: PI.run, moving: !!keys.GP_R };
    pad(1, 0); poll();    out.full = { run: PI.run };
    pad(0.55, 0); poll(); out.eased = { run: PI.run };
    pad(0.55, 0, [10]); poll(); pad(0.55, 0); poll(); out.clicked = { run: PI.run };
    pad(0, 0); poll(); pad(0, 0, [15]); poll(); out.dpad = { run: PI.run, moving: !!keys.GP_R };
    pad(0, 0); poll();
    // ...and it is a speed, not a flag: where does she top out?
    const top = (ax) => { player.x = 30 * TILE; player.vx = 0; let m = 0;
      for (let i = 0; i < 90; i++) { pad(ax, 0); poll(); update(1 / 60); m = Math.max(m, Math.abs(player.vx)); } pad(0, 0); poll(); return Math.round(m); };
    out.vWalk = top(0.55); out.vRun = top(1);

    // ---- THE SHAPES --------------------------------------------------------
    out.kind = PAD.kind;
    out.labels = [0, 1, 2, 3].map(padLabel);
    out.jumpPrompt = ctlName('JUMP'); out.intPrompt = ctlName('INT'); out.movePrompt = ctlName('MOVE');
    out.filled = ctlFill('{INT} — Talk');
    PAD.kind = 'xbox'; out.xbox = [0, 1, 2, 3].map(padLabel); PAD.kind = out.kind;

    // ---- THE STICK IN A MIND NODE -----------------------------------------
    // a latched four-way read: far push, one clear axis, centre before the next
    const s4 = (x, y) => padStick4(x, y);
    s4(0, 0);
    out.s4 = {
      near: s4(0.5, 0),                 // not far enough: nothing
      right: s4(0.9, 0.1),              // chosen
      rolled: s4(0.1, 0.95),            // rolled round the rim without centring: STILL right
      held: s4(0.9, 0),
      centre: s4(0.1, 0.05),            // let go
      diag: s4(0.7, 0.7),               // a diagonal is not a choice
      afterDiag: s4(0, -0.95),          // ...and does not latch: up is free to be chosen
    };
    s4(0, 0);
    // ...through the real poll, into a real answer
    const node = (() => { loadRoom('A0'); G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY';
      return G.statics.find(s => s.type === 'riddle'); })();
    doInteract(node);
    let guard = 0;
    const tick = () => { poll(); update(1 / 60); };
    pad(0, 0); while ((TRI.st !== 'play' || (TRI.game === 'mem' && TRI.memPhase !== 'input')) && guard++ < 3000) tick();
    out.node = { state: G.state, game: TRI.game, phase: TRI.memPhase };
    const answers = [];
    if (G.state === 'TRIAL' && TRI.game === 'mem') {
      // answer the whole sequence on the STICK, rolling through the rim between
      // directions the way a thumb does — never passing through centre cleanly
      const V = [[-1, 0], [0, -1], [1, 0], [0, 1]];
      const seq = TRI.memSeq.slice();
      for (let k = 0; k < seq.length && G.state === 'TRIAL' && TRI.memPhase === 'input'; k++) {
        const [vx, vy] = V[seq[k]];
        pad(vx * 0.35, vy * 0.35); tick();            // creeping out
        pad(vx * 0.95, vy * 0.95 + (vy ? 0 : 0.2)); tick(); tick(); tick();   // the push, a little off-axis
        answers.push(TRI.memIn);
        pad(vx * 0.5, vy * 0.5 + 0.25); tick();       // a sloppy release...
        pad(0.05, 0.1); tick(); tick();                // ...to centre
      }
      for (let i = 0; i < 120 && G.state === 'TRIAL'; i++) tick();
    }
    out.solved = { state: G.state, answers, len: (TRI.memSeq || []).length, retry: !!TRI.retry };

    // ---- IDLE IS NOT "STANDING STILL" --------------------------------------
    const said = []; const say0 = window.hzdSay;
    hzdSay = (k) => { said.push(k); return true; };
    const idleFor = (secs, busy) => {
      loadRoom('A1'); G.wake = G.cut = G.dialog = G.tut = null; G.state = 'PLAY'; G.enemies = []; G.toasts = []; G.zoneToast = null;
      player.x = 30 * TILE; player.vx = 0; pad(0, 0); poll();
      for (let i = 0; i < 40; i++) { G.toasts = []; G.zoneToast = null; update(1 / 60); }
      said.length = 0; player.idleT = 0; player.idleSpoke = false;
      let maxIdle = 0;
      for (let i = 0; i < secs * 60; i++) { if (busy) busy(); else { G.toasts = []; G.zoneToast = null; G.near = null; }
        update(1 / 60); if (busy) busy(); maxIdle = Math.max(maxIdle, player.idleT); }
      return { said: said.slice(), maxIdle: +maxIdle.toFixed(2), on: player.on, state: G.state };
    };
    out.idleAlone = idleFor(7, null);
    out.idleReading = idleFor(7, () => { G.toasts = [{ text: 'a line she is reading', t: 3 }]; });
    out.idleWithNpc = idleFor(7, () => { G.near = G.statics.find(s => s.type === 'npc') || { type: 'npc' }; });
    hzdSay = say0;
    return out;
  });

  check('a gentle push walks', r.gentle.moving && r.gentle.run === false, JSON.stringify(r.gentle));
  check('the stick pushed all the way RUNS — no click needed', r.full.run === true);
  check('...and eases back to a walk when the push does', r.eased.run === false);
  check('the stick click still runs, as before', r.clicked.run === true);
  check('the d-pad runs, like a key', r.dpad.moving && r.dpad.run === true, JSON.stringify(r.dpad));
  check('walk and run are two real speeds', r.vWalk > 60 && r.vRun > r.vWalk * 1.5, r.vWalk + ' vs ' + r.vRun + ' px/s');

  check('a PlayStation pad shows the shapes, not their names', r.kind !== 'xbox' && r.labels.join('') === '✕○□△', r.labels.join(' '));
  check('...in the prompts the game actually draws', r.jumpPrompt === '✕' && r.intPrompt === '○' && r.filled.indexOf('○') === 0 && !/Circle|Triangle|Cross|Square/.test(r.filled + r.movePrompt),
    [r.jumpPrompt, r.intPrompt, r.movePrompt, r.filled].join(' | '));
  check('an Xbox pad keeps the letters printed on it', r.xbox.join('') === 'ABXY', r.xbox.join(' '));

  check('the stick chooses only when pushed far, on one clear axis', r.s4.near === -1 && r.s4.right === 2 && r.s4.diag === -1, JSON.stringify(r.s4));
  check('...holds its choice while it rolls round the rim', r.s4.rolled === 2 && r.s4.held === 2);
  check('...and must come back to centre before it chooses again', r.s4.centre === -1 && r.s4.afterDiag === 1);
  check('a Mind Node opened on the pad', r.node.state === 'TRIAL', JSON.stringify(r.node));
  if (r.node.game === 'mem')
    check('the whole sequence answered on the STICK, sloppy releases and all: one push, one answer',
      r.solved.state === 'PLAY' && !r.solved.retry && r.solved.answers.join(',') === r.solved.answers.map((_, i) => i + 1).join(','),
      JSON.stringify(r.solved));

  check('left alone for seven seconds, she says it', r.idleAlone.said.includes('yalla') && r.idleAlone.maxIdle >= 5, JSON.stringify(r.idleAlone));
  check('reading a line on screen, she does not', !r.idleReading.said.includes('yalla') && r.idleReading.maxIdle < 1, JSON.stringify(r.idleReading));
  check('standing with someone, she does not', !r.idleWithNpc.said.includes('yalla') && r.idleWithNpc.maxIdle < 1, JSON.stringify(r.idleWithNpc));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — it runs, it does not slip, it shows the shapes, and she waits her turn');
})().catch(e => { console.error(e); process.exit(1); });
