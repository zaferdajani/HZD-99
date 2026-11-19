// A MIND NODE NEVER THROWS HER OUT FOR COPYING THE LIGHTS (owner, 2026-10-30).
//
// "If I press on any of the sequence that I see, it automatically crashes and
// stops the game and go out of it." Pressing along with the demonstration left
// the press on the last light in an early-answer buffer, which was taken as the
// FIRST answer the moment input opened — nearly always wrong — and a wrong
// answer ended the node. Both halves are measured here, on the waking floor's
// own node (the one the way out is gated on), driven through the real update.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); loadRoom('A0'); });
  await p.waitForTimeout(500);
  const fails = [];
  const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fails.push(name); };

  const r = await p.evaluate(() => {
    const K = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    const press = i => { keys[K[i]] = 1; keysP[K[i]] = 1; update(1 / 60); keys[K[i]] = 0; keysP[K[i]] = 0; };
    const step = (n) => { for (let k = 0; k < n; k++) update(1 / 60); };
    const node = G.statics.find(s => s.type === 'riddle' && (s.extra | 0) === 8);
    doInteract(node);
    const out = {};
    // through the 'pre' beat, then copy every light as it is shown
    let guard = 0;
    while (TRI.st !== 'play' && guard++ < 400) step(1);
    let last = -1, copied = [];
    while (G.state === 'TRIAL' && TRI.memPhase === 'show' && guard++ < 2000) {
      if (TRI.memShow >= 0 && TRI.memShow !== last) { last = TRI.memShow; step(3); press(TRI.memSeq[last]); copied.push(TRI.memSeq[last]); }
      else step(1);
    }
    step(20);
    out.afterCopy = { state: G.state, phase: TRI.memPhase, memIn: TRI.memIn, copied: copied.length, len: TRI.memSeq.length };
    // a wrong first answer: the node stays, says so, and plays a fresh sequence
    const seq1 = TRI.memSeq.slice();
    press((seq1[0] + 1) % 4);
    out.afterWrong = { state: G.state, st: TRI.st, retry: !!TRI.retry, node: !!TRI.node, flag: !!G.save.flags.rd_n8 };
    while (G.state === 'TRIAL' && !(TRI.st === 'play' && TRI.memPhase === 'input') && guard++ < 4000) step(1);
    out.replayed = { state: G.state, phase: TRI.memPhase, len: TRI.memSeq.length };
    for (const s of TRI.memSeq.slice()) { press(s); step(2); }
    out.solved = { state: G.state, flag: !!G.save.flags.rd_n8 };
    return out;
  });
  check('copying the lights as they play never answers', r.afterCopy.state === 'TRIAL' && r.afterCopy.phase === 'input' && r.afterCopy.memIn === 0,
    JSON.stringify(r.afterCopy));
  check('...and every light was pressed along with', r.afterCopy.copied === r.afterCopy.len, JSON.stringify(r.afterCopy));
  check('a wrong answer keeps her in the node and says so', r.afterWrong.state === 'TRIAL' && r.afterWrong.retry && r.afterWrong.node && !r.afterWrong.flag,
    JSON.stringify(r.afterWrong));
  check('...then a fresh sequence plays and opens for input', r.replayed.state === 'TRIAL' && r.replayed.phase === 'input', JSON.stringify(r.replayed));
  check('the right sequence after a miss solves the node and hands the room back', r.solved.state === 'PLAY' && r.solved.flag, JSON.stringify(r.solved));
  // EVERY MONUMENT, NOT ONLY THE FIRST (owner, 2026-11-14: "make the other
  // monuments retry on a miss too"). All nine Mind Nodes — lights, cubes and
  // balances — are answered wrong once and must stay open with a fresh question
  // at the same level, then pay on the right answer.
  const all = await p.evaluate(() => {
    const K = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    const press = i => { keys[K[i]] = 1; keysP[K[i]] = 1; update(1 / 60); keys[K[i]] = 0; keysP[K[i]] = 0; };
    const step = n => { for (let k = 0; k < n; k++) update(1 / 60); };
    const toInput = () => { let g = 0; while (G.state === 'TRIAL' && !(TRI.st === 'play' && (TRI.game !== 'mem' || TRI.memPhase === 'input')) && g++ < 4000) step(1); };
    const right = () => TRI.game === 'mem' ? TRI.memSeq[TRI.memIn] : TRI.game === 'log' ? TRI.q.ans : TRI.q.choices.correct;
    const rows = [];
    for (let i = 0; i < NODES.length; i++) {
      // every flag cleared each time, so solving one never completes the set
      // (the ninth would raise the relic card and leave the state on it)
      G.state = 'PLAY'; G.dialog = null;
      for (let j = 0; j < NODES.length; j++) G.save.flags['rd_n' + j] = 0;
      triStartNode(i, { x: 100, y: 100 });
      toInput();
      const level0 = TRI.level, game = TRI.game;
      const ans = right(), kk = TRI.game === 'log' ? TRI.q.k : TRI.game === 'mem' ? 4 : 3;
      press((ans + 1) % kk);
      const miss = { state: G.state, retry: !!TRI.retry, node: !!TRI.node, level: TRI.level, flag: !!G.save.flags['rd_n' + i] };
      toInput();
      let g = 0;
      while (G.state === 'TRIAL' && g++ < 20) { press(right()); step(2); }
      rows.push({ i, game, miss, level0, solved: G.state === 'PLAY' && !!G.save.flags['rd_n' + i] });
    }
    return rows;
  });
  for (const r2 of all)
    check('monument ' + r2.i + ' (' + r2.game + ') stays open after a miss, same level, then pays',
      r2.miss.state === 'TRIAL' && r2.miss.retry && r2.miss.node && !r2.miss.flag && r2.miss.level === r2.level0 && r2.solved,
      JSON.stringify(r2));
  // ONLY THE ACTUAL LIGHTS (owner, 2026-11-19: "it starts with one virtual
  // click on the top one, which is wrong because it confuses the player to think
  // there are 4 clicks. It only should show the actual clicks"). Read off the
  // SCREEN, in real time: every light that comes on during a demonstration must
  // be the next note of the sequence, and nothing else — not the press that
  // answered the last question wrongly, not a press copying the lights, and a
  // note played twice running must come on twice.
  const lights = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    G.state = 'PLAY'; G.dialog = null;
    for (let j = 0; j < NODES.length; j++) G.save.flags['rd_n' + j] = 0;
    const cvs = document.querySelector('canvas'), pads = [[330, 250], [480, 180], [630, 250], [480, 320]];
    let rec = null;
    const tick = () => {
      if (rec && G.state === 'TRIAL' && TRI.st === 'play' && TRI.memPhase === 'show') {
        const cx = cvs.getContext('2d'), k = cvs.width / 960, ky = cvs.height / 540;
        rec.push(pads.map(([x, y]) => { const d = cx.getImageData(Math.round(x * k), Math.round((y - 20) * ky), 1, 1).data; return d[0] > 110 && d[2] > 170 ? 1 : 0; }));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const flashes = fr => { const out = []; let prev = [0, 0, 0, 0]; for (const f of fr) { for (let i = 0; i < 4; i++) if (f[i] && !prev[i]) out.push(i); prev = f; } return out.join(''); };
    const K = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
    const tap = i => { keys[K[i]] = 1; keysP[K[i]] = 1; setTimeout(() => { keys[K[i]] = 0; }, 60); };
    const toInput = async () => { let g = 0; while (G.state === 'TRIAL' && !(TRI.st === 'play' && TRI.memPhase === 'input') && g++ < 600) await wait(16); };
    const out = {};
    // 1. a repeated note, with every light copied as it plays
    triStartNode(8, { x: 100, y: 100 });
    TRI.memSeq = [0, 3, 3];
    rec = []; let last = -1, g = 0;
    while (G.state === 'TRIAL' && !(TRI.st === 'play' && TRI.memPhase === 'input') && g++ < 600) {
      if (TRI.st === 'play' && TRI.memShow >= 0 && TRI.memShow !== last) { last = TRI.memShow; await wait(40); tap(TRI.memSeq[last]); }
      await wait(16);
    }
    out.copied = { seq: TRI.memSeq.join(''), seen: flashes(rec) };
    // 2. the top node pressed as a WRONG answer, then the retry's demonstration
    await wait(250);
    const first = TRI.memSeq[0];
    tap(first === 1 ? 2 : 1);
    rec = [];
    await wait(80);
    out.retried = !!TRI.retry;
    await toInput();
    out.retry = { seq: TRI.memSeq.join(''), seen: flashes(rec) };
    rec = null; G.state = 'PLAY'; TRI.node = null; TRI.mode = 'full';
    return out;
  });
  check('a note played twice running lights twice, and copying the lights adds none',
    lights.copied.seen === lights.copied.seq, JSON.stringify(lights.copied));
  check('after a wrong press the next demonstration shows only its own notes — no light left over from the press',
    lights.retried && lights.retry.seen === lights.retry.seq, JSON.stringify(lights));
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the lights can be copied, and a miss asks again');
})().catch(e => { console.error(e); process.exit(1); });
