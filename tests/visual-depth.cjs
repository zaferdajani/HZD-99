// Real Canvas pixels: scenery tint must preserve transparent holes, and the
// zone grade must remain present when the expensive-effects budget reaches 0.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const source = fs.readFileSync(path.join(__dirname, '../js/game.js'), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const production = [
  section('function vistaPlacement(', 'function drawZoneVista('),
  section('const SCENERY_TINT_CACHE', 'function drawLair('),
  section('const ZONE_GRADE_CACHE', 'function dimPanel('),
].join('\n');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  try {
    const page = await browser.newPage();
    await page.setContent('<canvas id="stage" width="960" height="540"></canvas>');
    await page.addScriptTag({ content: 'const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n' + production });
    const r = await page.evaluate(() => {
      const sprite = document.createElement('canvas'); sprite.width = sprite.height = 8;
      const sc = sprite.getContext('2d'); sc.fillStyle = '#ffffff'; sc.fillRect(2, 2, 4, 4);
      const tinted = sceneryTint(sprite, '#000000', 0.5);
      const alpha = Array.from(tinted.getContext('2d').getImageData(0, 0, 8, 8).data).filter((_, i) => i % 4 === 3);
      const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
      ctx.fillStyle = '#326496'; ctx.fillRect(0, 0, 960, 540); ctx.drawImage(tinted, 0, 0);
      const outside = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      const inside = Array.from(ctx.getImageData(3, 3, 1, 1).data);
      const L = { from: 0.5, wash: [120, 180, 200], k: 0.25 };
      window.c = ctx; window.G = { roomDef: { zone: 'A' } };
      window.ZONE_LIGHT = { A: L }; window.richK = 0;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 960, 540); lightPass();
      const low = Array.from(ctx.getImageData(400, 539, 1, 1).data);
      richK = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 960, 540); lightPass();
      const high = Array.from(ctx.getImageData(400, 539, 1, 1).data);
      return { outside, inside, alpha, low, high,
        tintCached: tinted === sceneryTint(sprite, '#000000', 0.5),
        tierInvalidated: tinted !== sceneryTint(document.createElement('canvas'), '#000000', 0.5),
        gradeCached: zoneLightGrade(L, 0) === zoneLightGrade(L, 0),
        a: vistaPlacement(1200, 800, 1, 0.2, 0.62, 10, 0.035, 0),
        b: vistaPlacement(1200, 800, 1, 0.8, 0.62, 10, 0.035, 0),
        held: vistaPlacement(1200, 800, 1, 0.2, 0.62, 10, 0.035, 0),
        composite: ctx.globalCompositeOperation };
    });
    assert.deepEqual(r.outside, [50, 100, 150, 255], 'transparent sprite margins leave background pixels unchanged');
    assert(r.inside[0] >= 126 && r.inside[0] <= 129, 'sprite itself receives tint');
    assert.equal(r.alpha.filter(a => a === 255).length, 16, 'tint preserves silhouette alpha');
    assert.equal(r.alpha.filter(a => a === 0).length, 48, 'tint preserves transparent holes');
    assert(r.tintCached && r.tierInvalidated && r.gradeCached, 'cached work is reused and new image tiers are distinct');
    assert(r.low[0] < 255 && r.low[0] > r.high[0], 'low quality retains a gentle grade; high quality is unchanged in strength');
    assert.equal(r.composite, 'source-over', 'grade restores canvas compositing state');
    assert.deepEqual(r.a, r.held, 'stationary vista geometry stays fixed');
    assert(r.b.x < r.a.x && r.b.w === r.a.w && r.b.h === r.a.h, 'walking pans solid architecture without scaling it');
    console.log('OK — transparent scenery, stable moving vista, cached zone lighting at low/high quality');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
