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
  check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  if (fails.length) { console.log('\nFAILED: ' + fails.join(', ')); process.exit(1); }
  console.log('\nOK — the lights can be copied, and a miss asks again');
})().catch(e => { console.error(e); process.exit(1); });
