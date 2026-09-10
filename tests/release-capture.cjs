const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  fs.mkdirSync('release-evidence', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function');
  const shots = [];
  for (const room of ['W1', 'W2', 'A0', 'A0B', 'A1', 'CV1', 'A3']) {
    await page.evaluate(id => {
      const s = newSave(1); s.flags.tut = 1; s.flags.woke = 1; s.time = 99;
      G.save = s; startGame(s); loadRoom(id); G.state = 'PLAY'; G.dialog = null;
      G.wake = null; G.cut = null; G.bossEntry = null; G.enemies = [];
      player.x = Math.min(380, G.roomDef.w * TILE / 2); player.iT = 0;
    }, room);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: 'release-evidence/' + room + '.png' });
    shots.push(await page.evaluate(() => ({room:G.roomId, x:player.x,y:player.y,w:player.w,h:player.h,
      camera:{...cam}, body:G.heroDrawn, build:window.BUILD_ID,
      viewport:cv.getBoundingClientRect().toJSON(), media:['heroStates','gaitRun','gaitWalk','hzdIdle'].map(k=>[k,!!MEDIA_IMG[k]])})));
  }
  fs.writeFileSync('release-evidence/captures.json', JSON.stringify({shots,errors},null,2));
  console.log(JSON.stringify({shots,errors},null,2));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
