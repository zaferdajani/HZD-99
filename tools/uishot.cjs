// Photograph a menu screen of the running game.
//
//   node tools/uishot.cjs <STATE> <out.png> [lang]
//
// Layout bugs are invisible in source — the controls list ran off the bottom of
// its own panel for five lines and nothing in the code said so. This opens the
// screen for real and takes its picture, in whichever language you ask for,
// because a panel that fits in English is not a panel that fits in German.
const { chromium } = require('playwright');

(async () => {
  const [state, out, lang] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  await page.evaluate(({ state, lang }) => {
    if (lang) { LANG = lang; if (typeof persist === 'function') { } }
    const sv = newSave(1);
    sv.time = 99; sv.flags.tut = 1; sv.iq = 10;
    startGame(sv);
    G.state = state;
  }, { state, lang });
  await page.evaluate(() => new Promise(r => {
    let i = 0;
    const tick = () => { if (++i >= 30) return r(); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
  await page.screenshot({ path: out });
  console.log(await page.evaluate(() => G.state));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
