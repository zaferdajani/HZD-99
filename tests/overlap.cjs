// Sample continuously: how many music elements are audible at once, through a
// boot, the opening, the menu, and a zone change. More than one for longer than
// a cross-fade is the bug the player heard.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.addInitScript(() => {
    window.__els = [];
    const OA = window.Audio;
    window.Audio = function (...a) { const el = new OA(...a); window.__els.push(el); return el; };
    window.Audio.prototype = OA.prototype;
    window.__peak = 0; window.__over = 0; window.__samples = 0;
    setInterval(() => {
      const live = window.__els.filter(e => !e.paused && e.src && e.volume > 0.01);
      window.__samples++;
      if (live.length > window.__peak) window.__peak = live.length;
      if (live.length > 1) window.__over++;
    }, 50);
  });
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForTimeout(4000);
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);   // sound tap
  // SKIPPING IS A HOLD (js/game.js CUT_SKIP_HOLD). A second press used to end
  // the film; it costs 0.8 s of deliberate contact now, so that the story
  // cannot be spent by a stray touch on a phone.
  await p.keyboard.down('Enter'); await p.waitForTimeout(1000); await p.keyboard.up('Enter');
  await p.waitForTimeout(2500);                                    // skip out
  await p.evaluate(() => { setMusic('A'); });  await p.waitForTimeout(1800);
  await p.evaluate(() => { setMusic('boss_glitch'); }); await p.waitForTimeout(1800);
  await p.evaluate(() => { setMusic('title'); }); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => ({ peak: window.__peak, over: window.__over, n: window.__samples,
                                      made: window.__els.length, live: window.__els.filter(e => !e.paused).map(e => e.src.split('/').pop()) }));
  console.log('elements created        :', r.made);
  console.log('most audible at once    :', r.peak, '(1 = never overlaid; 2 only inside a cross-fade)');
  console.log('samples with >1 audible :', r.over, '/', r.n);
  console.log('still playing at the end:', r.live);
  console.log('pageerrors              :', errs.length ? errs.slice(0,2) : 'none');
  await b.close();
})();
