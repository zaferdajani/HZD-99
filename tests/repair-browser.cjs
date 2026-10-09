// Real compiled game and real DOM controls. No copied puzzle implementation.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 try {
  const p=await browser.newPage({viewport:{width:960,height:640},serviceWorkers:'block'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const url=process.env.GAME_URL||'http://127.0.0.1:8220/index.html';
  async function boot(reload=false){
   await p.goto(url);await p.waitForFunction(()=>typeof startGame==='function');
   await p.evaluate(reload=>{
    window.requestAnimationFrame=()=>0;
    const sv=reload?JSON.parse(localStorage.getItem(saveKeyFor('robo'))):newSave(1);
    if(!sv)throw Error('Missing durable save');sv.time=99;sv.flags.woke=sv.flags.tut=1;
    startGame(sv);loadRoom('A0B');G.state='PLAY';G.wake=null;G.cut=null;G.dialog=null;G.trans=null;G.meet=null;G.gateWalk=null;
    PURIFY_VID.memory=null;PURIFY_VID.gift=null;
   },reload);
   await p.waitForTimeout(50);
  }
  const open=()=>p.evaluate(()=>{
   G.state='PLAY';doInteract(G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet'));
   let n=0;while(G.state==='DIALOG'&&n++<40){const cb=G.dialog.onEnd;G.dialog=null;G.state='PLAY';if(cb)cb();}
   if(n>=40)throw Error('Dialogue did not terminate');
  });
  const state=()=>p.evaluate(()=>({state:G.state,step:repairSession?.step??null,cell:invCount('ratchetCell'),spare:invCount('batt'),kit:invCount('kit'),live:npcLive(G.statics.find(s=>s.extra==='ratchet')),ghosts:document.querySelectorAll('.repair-ghost').length}));
  const connect=async(piece,target)=>{await p.locator('[data-piece="'+piece+'"]').click();await p.locator('[data-target="'+target+'"]').click();};
  await boot();await open();assert.equal((await state()).live,false);assert.equal(await p.locator('#ratchet-repair').count(),0);
  await p.evaluate(()=>{doInteract(G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt'));G.dialog=null;G.state='PLAY';});
  await open();assert.equal((await state()).step,0);
  await connect('cell','minus');assert.equal((await state()).step,0,'wrong terminal cannot advance');
  // Drag the actual battery and release it over the real socket.
  const a=await p.locator('[data-piece="cell"]').boundingBox(),b=await p.locator('[data-target="socket"]').boundingBox();
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:8});await p.mouse.up();
  assert.equal((await state()).step,1);assert.equal((await state()).ghosts,0);
  await connect('positive','plus');assert.equal((await state()).step,2);
  await p.keyboard.press('Escape');assert.equal((await state()).state,'PLAY');assert.equal((await state()).cell,1);
  await boot(true);await open();assert.equal((await state()).step,2,'page reload resumes durable placements');
  await connect('negative','minus');await connect('bridge','relay');
  await p.locator('.repair-power').click();await p.evaluate(()=>update(.5));await p.keyboard.press('Escape');
  assert.equal((await state()).live,false);assert.equal((await state()).cell,1);
  assert.equal((await state()).state,'PLAY','Escape cancels power-up and releases gameplay');
  await open();assert.equal((await state()).step,4);await p.locator('.repair-power').click();
  await p.evaluate(()=>{for(let i=0;i<90&&G.state==='REPAIR';i++)update(1/60);});
  let s=await state();assert.equal(s.live,true);assert.equal(s.cell,0);assert.equal(s.spare,1);assert.equal(s.kit,1);assert.equal(s.state,'DIALOG');
  await p.evaluate(()=>{let n=0;while(G.state==='DIALOG'&&n++<40){const cb=G.dialog.onEnd;G.dialog=null;G.state='PLAY';if(cb)cb();}if(qState('ratchet_forge')!=='active'||weaponOwned('single'))throw Error('Repair broke earned forge progression');});
  await boot(true);await open();s=await state();assert.equal(s.live,true);assert.equal(s.kit,1);assert.equal(s.spare,1);assert.equal(s.step,null);
  // A fresh interaction interrupted by a direct room transition must recover PLAY.
  await boot();await p.evaluate(()=>{doInteract(G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt'));G.dialog=null;G.state='PLAY';});await open();
  await p.evaluate(()=>loadRoom('A1'));assert.equal(await p.locator('#ratchet-repair').count(),0);assert.equal(await p.evaluate(()=>G.state),'PLAY');
  assert.deepEqual(errors,[]);
  console.log('PASS browser repair: actual drag/click controls, wrong target, Escape, page reload, interrupted boot, once-only rewards, forge continuation and room exit');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
