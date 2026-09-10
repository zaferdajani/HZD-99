// THE STUDIO NAME IS ON THE THING, MEASURED.
//
// The owner named his company (VibeSolutions, 2026-09-10) and asked for it as
// a footer on everything released from here. A footer is exactly the kind of
// thing that survives one commit and quietly disappears in the next refactor —
// nobody looks at the bottom-left of a title screen twice — so it is checked
// the way every other invisible-until-broken rule in this repo is checked: by
// drawing the real screens in a real browser and reading the pixels' source,
// and by parsing the shipped pages rather than trusting the generator.
const fs = require('fs');
const { chromium } = require('playwright');

const STUDIO = 'VibeSolutions';
const ok = [], bad = [];
const chk = (c, name, detail) => (c ? ok : bad).push(name + (detail ? '  ' + detail : ''));

(async () => {
  // ---- the built pages carry it in their own identity ----------------------
  for (const page of ['index.html', 'odyssey.html']) {
    const html = fs.readFileSync(page, 'utf8');
    chk(html.includes('<meta name="author" content="' + STUDIO + '">'),
        page + ': author meta names the studio');
    chk(html.includes('"publisher"') && html.includes('"' + STUDIO + '"'),
        page + ': structured data publishes as the studio');
    chk((html.match(/const STUDIO = '([^']+)'/) || [])[1] === STUDIO,
        page + ': the game constant is the same name');
  }

  // ---- and the screens a player can stop and read --------------------------
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const seen = await p.evaluate(() => {
    // Record what ftxt is asked to draw rather than OCR the canvas: the string
    // is the claim, and a colour or a font change must not fail this harness.
    const drawn = { MENU: [], PAUSE: [] };
    const real = window.ftxt;
    let bucket = null;
    window.ftxt = function (str, ...rest) { if (bucket) drawn[bucket].push(String(str)); return real.call(this, str, ...rest); };

    G.state = 'MENU'; G.menuIdx = 0;
    bucket = 'MENU'; draw(performance.now()); bucket = null;

    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1;
    startGame(sv);
    G.state = 'PAUSE'; G.pauseIdx = 0;
    bucket = 'PAUSE'; draw(performance.now()); bucket = null;

    window.ftxt = real;
    return drawn;
  });
  await browser.close();

  chk(seen.MENU.includes(STUDIO), 'title screen draws the studio footer',
      seen.MENU.length + ' strings drawn');
  chk(seen.PAUSE.includes(STUDIO), 'pause card draws the studio footer',
      seen.PAUSE.length + ' strings drawn');
  chk(seen.MENU.some(s => /v\d/.test(s)), 'the build stamp still travels with it');
  chk(errs.length === 0, 'no page errors while drawing them', errs[0] || '');

  for (const l of ok) console.log('  ok   ' + l);
  for (const l of bad) console.log('  FAIL ' + l);
  if (bad.length) { console.log('\nFAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
  console.log('\nOK — every release surface carries the studio name');
})();
