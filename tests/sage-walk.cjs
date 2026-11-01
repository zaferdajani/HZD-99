// THE RESCUED SAGE WALKS — it must not slide across the floor in its sleeping
// plate after purification. This stages only the saved story fact, then drives
// the production Enemy.update and production drawSage paths.
//
//   node tests/sage-walk.cjs
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('cb_intro_seen', '1'));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });

  const fails = [];
  const check = (name, ok, detail) => {
    console.log('  ' + (ok ? 'ok   ' : 'FAIL ') + name + (detail == null ? '' : '  ' + detail));
    if (!ok) fails.push(name + (detail == null ? '' : ' — ' + detail));
  };
  console.log('── sage-walk — the rescued Sage has feet, a gait and a clean body');

  const m = await page.evaluate(async () => {
    const sv = newSave(1); sv.time = 99; sv.flags.tut = 1; sv.flags.woke = 1;
    sv.flags.sageTame_GA1D = 1;
    startGame(sv); loadRoom('GA1D');
    await new Promise(r => setTimeout(r, 300));
    G.wake = null; G.cut = null; G.state = 'PLAY'; G.hitStop = 0;
    const sg = G.enemies.find(e => e.kind === 'sage');
    const out = { spawned: !!sg };
    if (!sg) return out;
    out.tame = sg.tame === 1 && !!sg.calm;
    player.x = -5000; player.y = -5000; player.dead = false; player.iT = 999;
    sg.x = 18 * TILE; sg.y = 15 * TILE - sg.h; sg.dir = 1; sg.faceVis = 1; sg.vx = 0;
    sg.t = 9; sg.calmT = 9; sg.walkD = 0;
    const x0 = sg.x, d0 = sg.walkD || 0;
    const speeds = [];
    for (let i = 0; i < 90; i++) {
      sg.update(1 / 60);
      speeds.push(Math.abs(sg.vx || 0));
    }
    out.dx = +(sg.x - x0).toFixed(2);
    out.dd = +((sg.walkD || 0) - d0).toFixed(2);
    out.firstV = +(speeds[0] || 0).toFixed(2);
    out.cruiseV = +Math.max(...speeds).toFixed(2);

    const strip0 = window.drawStripCell, plate0 = window.drawPlateAnchored;
    const moving = [], idle = [];
    window.drawStripCell = (...a) => { moving.push({ key: a[1], cell: a[2], cells: a[3], pure: a[8] }); return true; };
    window.drawPlateAnchored = (...a) => { moving.push({ plate: a[1] }); return true; };
    sg.vx = 60; drawSage(c, sg);
    window.drawStripCell = (...a) => { idle.push({ key: a[1], pure: a[8] }); return true; };
    window.drawPlateAnchored = (...a) => { idle.push({ plate: a[1] }); return true; };
    sg.vx = 0; drawSage(c, sg);
    window.drawStripCell = strip0; window.drawPlateAnchored = plate0;
    out.moving = moving; out.idle = idle;

    loadRoom('GA1T'); await new Promise(r => setTimeout(r, 80));
    loadRoom('GA1D'); await new Promise(r => setTimeout(r, 80));
    const sg2 = G.enemies.find(e => e.kind === 'sage');
    out.persists = !!sg2 && sg2.tame === 1 && !!sg2.calm;
    return out;
  });

  check('the saved Sage returns tame and calm', m.spawned && m.tame);
  check('its real update moves the body and the distance gait', Math.abs(m.dx) > 20 && m.dd > 20,
    'moved ' + m.dx + ' px body / ' + m.dd + ' gait');
  check('it accelerates into the walk instead of snapping', m.firstV > 0 && m.cruiseV > m.firstV,
    'firstV ' + m.firstV + ' -> ' + m.cruiseV + ' px/s');
  const walk = (m.moving || []).find(x => x.key === 'sageWalk8');
  check('moving draw selects the authored eight-cell Sage walk', !!walk, JSON.stringify(m.moving));
  check('the moving authored gait is rendered with purified material', !!walk && walk.pure === true);
  check('standing still returns to the authored rescued kneel', (m.idle || []).some(x => x.plate === 'sagePure'), JSON.stringify(m.idle));
  check('the rescue remains a save fact after leaving and returning', m.persists);

  if (process.env.SAGE_WALK_SHOT) {
    await page.evaluate(() => {
      G.state = 'PLAY'; G.wake = G.cut = G.dialog = G.panels = null;
      player.x = 16 * TILE; player.y = 15 * TILE - player.h;
      const sg = G.enemies.find(e => e.kind === 'sage');
      if (sg) { sg.x = 20 * TILE; sg.y = 15 * TILE - sg.h; sg.vx = 55; sg.walkD = 28; }
      draw();
    });
    await page.screenshot({ path: process.env.SAGE_WALK_SHOT });
  }

  if (errs.length) { console.log('  PAGE ERRORS: ' + errs.slice(0, 3).join(' | ')); fails.push('page errors'); }
  await browser.close();
  if (fails.length) { console.log('\nFAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
  console.log('\nOK — rescued Sage walks in authored purified motion and rests in its rescued pose');
})().catch(e => { console.error(e); process.exit(1); });

