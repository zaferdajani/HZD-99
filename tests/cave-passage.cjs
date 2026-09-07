const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'});
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8220/index.html');
    const results = await page.evaluate(() => {
      const s = newSave(1); s.time = 99; s.flags.woke = 1; s.flags.tut = 1;
      startGame(s);
      const clearKeys = () => { for(const k in keys) delete keys[k]; for(const k in keysP) delete keysP[k]; };
      const enter = id => { loadRoom(id); G.state='PLAY'; G.dialog=null; G.trans=null;
        G.enemies=[]; G.boss=null; G.projs=[]; clearKeys(); };
      const out = {passes:[],doors:[]};
      // No dash, double jump or broken hatch is needed to pass UNDER a pocket.
      for (const [id,centre] of [['CV1',14],['CV1B',9],['CV2',22],['CV2',48]]) {
        for (const dir of [-1,1]) {
          enter(id); const start=(centre-dir*5)*TILE, end=(centre+dir*5)*TILE;
          player.x=start; const ground=groundColumnAt(start+player.w/2);
          player.y=Math.min(ground[0],ground[1])-player.h;
          player.vx=player.vy=0; player.on=true;
          keys[dir>0?'ArrowRight':'ArrowLeft']=true;
          let last=player.x, stuck=0;
          for(let i=0;i<1200 && dir*(player.x-end)<0;i++) {
            keys.Space=!!(stuck>8 && player.on); keysP.Space=keys.Space;
            player.update(1/60); delete keysP.Space;
            stuck=Math.abs(player.x-last)<0.1?stuck+1:0; last=player.x;
          }
          out.passes.push({id,centre,dir,x:player.x,end,ok:dir*(player.x-end)>=0});
        }
      }
      for(const [from,to] of [['CV1B','CV2'],['CV2','CV1B']]) {
        enter(from); const door=gateDoors().find(d=>d.to===to);
        player.x=gateWorldX(door)-player.w/2;player.y=15*TILE-player.h;player.on=true;
        const accepted=gateEnter();
        for(let i=0;i<400 && G.gateWalk;i++) updateGateWalk(1/60);
        out.doors.push({from,to,accepted,arrived:G.roomId,x:player.x});
      }
      return out;
    });
    console.log(JSON.stringify(results));
    assert(results.passes.every(p=>p.ok),'every overhead pocket passable in both directions with basic jump');
    assert(results.doors.every(d=>d.accepted && d.arrived===d.to),'both depth doors complete actual room transitions');
    assert.deepEqual(errors,[]);
    console.log('PASS: real player crosses cave pockets both ways and completes onward/return gate walks');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
