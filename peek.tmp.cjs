const { chromium } = require('playwright');
(async () => {
  const S='/tmp/claude-0/-home-user-HZD-99/87bd6b90-baa7-53ea-b36e-f67dae4d4adc/scratchpad';
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport:{width:1280,height:720} });
  p.on('pageerror', e=>console.log('ERR', String(e).slice(0,160)));
  await p.goto('http://127.0.0.1:8220/index.html');
  await p.waitForFunction(()=>typeof startGame==='function',{timeout:20000});
  for (const room of ['A0','D3']) {
    const info = await p.evaluate((room)=>{
      const sv=newSave(1); sv.time=99; sv.flags.tut=1; sv.skills=['dash','wall','glide','pulse']; sv.roomId=room;
      G.save=sv; startGame(sv); loadRoom(room);
      Object.defineProperty(G,'dialog',{get:()=>null,set:()=>{},configurable:true});
      Object.defineProperty(G,'state',{get:()=>'PLAY',set:()=>{},configurable:true});
      G.toasts=[];
      return { hasFn: typeof edgeGrammarPass, tile: typeof TILE!=='undefined'?TILE:'?', w:G.roomDef.w, h:G.roomDef.h };
    }, room);
    console.log(room, JSON.stringify(info));
    await p.waitForTimeout(900);
    const cv = await p.$('canvas'); await cv.screenshot({ path:S+'/tf_'+room+'.png' });
  }
  await b.close();
})();
