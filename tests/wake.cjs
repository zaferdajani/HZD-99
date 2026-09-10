// Real keyboard play from a fresh save. No teleporting, direct state completion,
// enemy deletion or granted items. Follow the actual contextual instruction.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const OUT = require('node:path').join(__dirname, 'out/');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [], trace = [], learned = new Set();
  let direction = null, last = '', succeeded = false;
  try {
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(process.env.GAME_URL || 'http://127.0.0.1:8220/index.html');
    await page.waitForFunction(() => typeof heroArtReady === 'function' && heroArtReady());
    await page.mouse.click(8,8);
    await page.evaluate(() => startGame(newSave(1)));
    const steer = async next => {
      if (direction === next) return;
      if (direction) await page.keyboard.up(direction);
      direction = next;
      if (direction) await page.keyboard.down(direction);
    };
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      const s = await page.evaluate(() => {
        const step=G.tut && TUT_STEPS[G.tut.i], p=step && tutPrompt(step);
        return {room:G.roomId,state:G.state,wake:!!G.wake,cut:!!G.cut,gate:!!G.gateWalk,
          step:step && step.id,action:p && p.action,control:p && p.control,
          target:p && p.target && p.target.x,x:player.x+player.w/2,on:player.on,
          hold:G.tut && G.tut.hold,shown:!!(G.tut && G.tut.jumpShown),
          enemy:G.enemies.filter(e=>e&&!e.dead).length,cores:player.cores,scrap:G.save.scrap,
          lock:G.tutorialLock && G.tutorialLock.action, vx:player.vx, y:player.y, input:!!keys.ArrowRight, suspended:inputSuspended};
      });
      const key=[s.room,s.state,s.step,s.action,s.lock,Math.floor(s.x/80)].join(':');
      if (key!==last) {trace.push(s);if(trace.length<=80 || trace.length%100===0)console.log(JSON.stringify(s));last=key;}
      if (s.step) learned.add(s.step);
      if (s.state==='DIALOG') {await steer(null);await page.keyboard.press('KeyE');await page.waitForTimeout(90);continue;}
      if (s.wake || s.cut || s.gate || s.state!=='PLAY') {await page.waitForTimeout(80);continue;}
      if (s.step==='buy' && s.room==='A0B') {succeeded=true;break;}
      if (s.hold>0) {await steer('ArrowRight');await page.waitForTimeout(80);continue;}
      if (s.action==='MOVE') {
        // An exit marker points THROUGH the seam, not to a spot to turn around at.
        await steer(['out','go'].includes(s.step) ? 'ArrowRight' : s.target!=null && s.target < s.x-8 ? 'ArrowLeft':'ArrowRight');
      } else if (s.action==='JUMP' && s.on) {
        // Wait for the obstacle's JUMP card, not merely the saved step named
        // jump. Pressing early completes neither the lesson nor the crossing.
        await steer('ArrowRight');await page.keyboard.press('Space',{delay:220});
      } else if (s.action==='UP') {
        await steer(null);await page.keyboard.press('ArrowUp',{delay:80});
      } else if (s.action==='ATK') {
        await steer(null);await page.keyboard.press('KeyX',{delay:45});await page.waitForTimeout(220);
      } else {
        await steer(null);
      }
      await page.waitForTimeout(70);
    }
    await steer(null);
    await page.screenshot({path:OUT+'wake-verified.png'});
    assert(succeeded,'fresh tutorial did not reach the workshop; last state: '+JSON.stringify(trace.at(-1)));
    for (const id of ['move','out','jump','gate','atk','kill','coin','buy']) assert(learned.has(id),'missed taught verb: '+id);
    assert.deepEqual(errors,[]);
    console.log('PASS fresh keyboard opening: wake, walk, obstacle jump, enter city, attack, collect scrap, walk to and enter workshop');
  } finally {
    fs.writeFileSync(OUT+'wake-trace.json',JSON.stringify({trace,errors,succeeded},null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
