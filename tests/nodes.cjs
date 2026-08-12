// Every Mind Node must open an interactive puzzle, accept exactly one answer,
// pay out on a right one, and hand the room back either way.
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, 'out/');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(3500);
  await p.evaluate(() => { const sv = newSave(1); sv.time = 99; startGame(sv); });
  await p.waitForTimeout(700);
  console.log('word riddles left in the build:', await p.evaluate(() => typeof RIDDLES));
  for (let i = 0; i < 8; i++) {
    const open = await p.evaluate((i) => {
      G.save.iq = 0; G.save.flags = {};
      triStartNode(i, { x: 100, y: 100 });
      return { state: G.state, game: TRI.game, level: TRI.level, mode: TRI.mode, iq: TRI.node.iq };
    }, i);
    await p.waitForTimeout(1400);                       // through the 'pre' beat
    if (i < 3) await p.screenshot({ path: OUT + 'node' + i + '.png' });
    const done = await p.evaluate((i) => {
      // answer it the way a player would: for memory, press the real sequence
      if (TRI.game === 'mem') {
        TRI.memPhase = 'input'; TRI.memIn = 0;
        const KEY = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
        for (const step of TRI.memSeq.slice()) {
          keysP['__'] = 0;
          const code = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', DOWN: 'ArrowDown' }[KEY[step]];
          keys[code] = 1; keysP[code] = 1;
          updateTrial(1 / 60);
          keys[code] = 0; keysP[code] = 0;
          if (G.state !== 'TRIAL') break;
        }
      } else if (TRI.game === 'log') {
        const code = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'][TRI.q.ans];
        keys[code] = 1; keysP[code] = 1; updateTrial(1 / 60); keys[code] = 0; keysP[code] = 0;
      } else {
        const code = ['ArrowLeft', 'ArrowUp', 'ArrowRight'][TRI.q.choices.correct];
        keys[code] = 1; keysP[code] = 1; updateTrial(1 / 60); keys[code] = 0; keysP[code] = 0;
      }
      return { state: G.state, iq: G.save.iq, flag: !!G.save.flags['rd_n' + i] };
    }, i);
    console.log('node ' + i, JSON.stringify(open), '->', JSON.stringify(done));
  }
  console.log('pageerrors:', errs.length ? errs.slice(0, 3) : 'none');
  await b.close();
})();
