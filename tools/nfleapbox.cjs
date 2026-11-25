// WHERE NULLFANG'S BODY IS DRAWN IN EACH CELL OF HIS LEAP — measured, so the ambush's
// burst hurts with the shape that is drawn (ledger: "what looks sharp cuts").
//
// The filmed leap (beastStudioLeap) carries the animal about inside its cell as it flies, so
// the body drawn is not centred on the physics box. This draws his real body (Boss.draw,
// the shipped build) for each flight cell onto a clean canvas with his foot centre at a known
// point, reads the opaque pixels back, and prints the bounding box of each cell relative to
// (his centre x, his feet y), facing +x. js/nullfang-duel.js NF_LEAP_BOX holds the output;
// tests/nf-ambush.cjs re-measures it against the build.
//
//   (serve the repo)  node tools/nfleapbox.cjs [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || process.env.TEST_PORT || 8220;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  await p.addInitScript(() => { localStorage.setItem('cb_intro_seen', '1'); window.requestAnimationFrame = () => 0; });
  await p.goto('http://127.0.0.1:' + port + '/index.html');
  await p.waitForFunction(() => typeof startGame === 'function', { timeout: 30000 });
  const out = await p.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.nfMeet = 1; startGame(sv); loadRoom('A4');
    mediaFetch('beastStudioLeap', true);
    for (let i = 0; i < 200 && !(MEDIA_RAW.beastStudioLeap && MEDIA_RAW.beastStudioLeap.naturalWidth); i++) await new Promise(r => setTimeout(r, 50));
    // a loaded sheet is not a decoded one (js/media.js): draw once, let it decode, then measure
    if (typeof nfMeasureLeapBox !== 'function') return null;
    nfMeasureLeapBox(); await new Promise(r => setTimeout(r, 1500));
    return nfMeasureLeapBox();
  });
  console.log(JSON.stringify(out));
  await b.close();
})();
