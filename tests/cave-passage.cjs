const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'});
  try {
    const page = await browser.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:'+(process.env.TEST_PORT||8220)+'/index.html');
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
      // THE HAUL RING (2026-11-16): the Seam's far ring runs to the quarry's
      // loading floor and back, and stands dark while the rhino holds the
      // quarry. Dark, it refuses her and she stays; lit, it is a real crossing.
      const stand = (door) => { const wx=gateWorldX(door); player.x=wx-player.w/2;
        const col=groundColumnAt(wx); player.y=Math.min(col[0],col[1])-player.h; player.vx=player.vy=0; player.on=true; };
      out.dark=[];
      for(const [from,to] of [['CV1B','CV3'],['CV3','CV1B']]) {
        delete G.save.flags.bossHorn; enter(from); const door=gateDoors().find(d=>d.to===to);
        if(!door){ out.dark.push({from,to,missing:true}); continue; }
        stand(door); const accepted=gateEnter();
        for(let i=0;i<200 && G.gateWalk;i++) updateGateWalk(1/60);
        out.dark.push({from,to,accepted:!!accepted,room:G.roomId,locked:gateLocked(door)}); G.dialog=null;
      }
      for(const [from,to] of [['CV1B','CV3'],['CV3','CV1B']]) {
        G.save.flags.bossHorn=1; G.save.flags.ghWon=1; enter(from); const door=gateDoors().find(d=>d.to===to);
        stand(door);
        // (a ring whose lock has just opened is WOKEN in front of her first)
        let woke=0; for(;woke<420 && typeof ringAsleep==='function' && (ringAsleep(door) || G.ringWake);woke++){ if(typeof ringWakeStep==='function') ringWakeStep(1/60); }
        stand(door); player.stunT=0; const accepted=gateEnter();
        for(let i=0;i<400 && G.gateWalk;i++) updateGateWalk(1/60);
        out.doors.push({from,to,accepted,arrived:G.roomId,x:player.x,woke});
      }
      enter('CV2'); out.cv2=gateDoors().filter(d=>d.to==='CV1B').length;
      return out;
    });
    console.log(JSON.stringify(results));
    assert(results.passes.every(p=>p.ok),'every overhead pocket passable in both directions with basic jump');
    assert(results.dark.every(d=>!d.missing && d.locked && !d.accepted && d.room===d.from),'the haul ring stands dark, and refuses her, while the rhino holds the quarry');
    assert(results.doors.every(d=>d.accepted && d.arrived===d.to),'with the quarry freed the haul ring is a real crossing, both ways');
    assert.equal(results.cv2,0,'the beacon hall has no ring to the Seam: the bypass is gone');
    assert.deepEqual(errors,[]);
    console.log('PASS: real player crosses cave pockets both ways; the haul ring is dark until the quarry is freed, then carries her both ways');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
