// STAGED visual capture only: this injects save, room and sequence state.
// It is NOT uninterrupted normal-input campaign evidence.
// Start tests/serve.cjs from this checkout in the SAME executor first.
// Normal: CHROMIUM_PATH=/path/to/chromium node docs/studio/runs/2026-10-11/capture-panels.cjs
// Preview: CANDIDATE_PREVIEW=1 CHROMIUM_PATH=/path/to/chromium node docs/studio/runs/2026-10-11/capture-panels.cjs
// Preview additionally needs python3 + Pillow (or CAPTURE_PYTHON=/path/to/python).
// No build or runtime asset is modified. Screenshots overwrite this run's image evidence.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../../..');
const { chromium } = require(path.join(root, 'node_modules/playwright'));
const preview = process.env.CANDIDATE_PREVIEW === '1';
const output = path.join(__dirname, 'images');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  let temporary, replacement, browser;
  try {
    if (preview) {
      temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'clawbyte-panel-preview-'));
      const original = path.join(root, 'assets/source/manhua/ch1/candidates/2026-10-11/repair-identity.png');
      const normalized = path.join(temporary, 'repair-preview.png');
      execFileSync(process.env.CAPTURE_PYTHON || 'python3', ['-c',
        'from PIL import Image; import sys; im=Image.open(sys.argv[1]); im.resize((1344,752),Image.Resampling.LANCZOS).save(sys.argv[2])',
        original, normalized]);
      replacement = fs.readFileSync(normalized);
      console.log('PREVIEW ONLY: route substitution of candidate normalized to 1344x752; runtime files unchanged.');
    }
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
    for (const [width, height] of [[1280, 720], [844, 390]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      if (preview) await page.route('**/assets/manhua/ch1/game/repair.webp', route =>
        route.fulfill({ contentType: 'image/png', body: replacement }));
      await page.goto('http://127.0.0.1:8220/index.html');
      await page.waitForFunction(() => typeof panelsPlay === 'function' && typeof startGame === 'function', null, { timeout: 30000 });
      for (const [id, index] of (preview ? [['ratchet', 2]] : [['ratchet', 2], ['passage', 1], ['ch2', 0]])) {
        await page.evaluate(id => {
          const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
          startGame(sv); G.save.panels = { v: 1, seen: {}, past: {}, n: 0 };
          loadRoom('A0B'); G.wake = null; G.state = 'PLAY'; G.dialog = null;
          G.enemies = []; G.boss = null; G.projs = []; G.tut = null;
          G.tutorialLock = null; G.hitStop = 0; G.trans = null;
          player.on = true; player.vx = player.vy = 0; LANG = 'en'; panelsPlay(id);
        }, id);
        await page.waitForTimeout(1800);
        await page.evaluate(index => {
          const panel = G.panels; panel.i = index; panelsBegin(panel); panel.prev = null;
        }, index);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(output, `panel-${preview ? 'candidate-' : ''}${id}-${width}.png`) });
        console.log(JSON.stringify({ staged: true, candidatePreview: preview, id, index, width, height,
          state: await page.evaluate(() => G.state), errors }));
      }
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
