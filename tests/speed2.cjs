// Timing contract through the actual production mainLoop, not a copied loop.
// Flat collision fixture isolates time integration; terrainrun covers real rooms.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 const errors=[];
 try {
  const page=await browser.newPage({viewport:{width:960,height:540}});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(()=>typeof heroArtReady==='function'&&heroArtReady());
  const rows=await page.evaluate(async()=>{
   const sv=newSave(1);sv.flags.woke=1;sv.flags.tut=1;sv.time=99;startGame(sv);loadRoom('A1');
   window.requestAnimationFrame=()=>0;await new Promise(r=>setTimeout(r,80));
   // Visual rendering and hardware polling do not belong in a timing probe.
   // The actual production clock, update(), input and collision still run.
   draw=()=>{};drawTouchUI=()=>{};pollGamepad=()=>{};preloadTick=()=>{};
   G.roomDef={...G.roomDef,w:80,h:17,exits:{}};
   G.grid=Array.from({length:17},(_,y)=>Array.from({length:80},()=>y>=15?'#':'.'));
   G.enemies=[];G.boss=null;G.statics=[];G.pickups=[];G.plats=[];G.saws=[];G.pools=[];
   G.wake=G.cut=G.gateWalk=G.trans=G.dialog=G.bossEntry=G.tut=G.lesson=null;
   G.hitStop=0;G.state='PLAY';inputSuspended=false;PAD.on=false;
   const results=[];
   for(const fps of [144,120,60,30,20,12]){
    player=new Player(300,15*TILE-36-.01);player.on=true;player.noHeightfield=true;
    player.vx=player.speed();player.vy=0;player.iT=10;
    for(const k in keys)keys[k]=0;for(const k in keysP)keysP[k]=0;
    keys.ArrowRight=1;G.hitStop=0;G.simClock=0;G.state='PLAY';
    let now=1000;lastT=now;const start=player.x,frames=Math.round(fps*.5),seconds=frames/fps;
    const speed=player.speed(),pace=paceK();
    for(let f=0;f<frames;f++){now+=1000/fps;mainLoop(now);}
    results.push({fps,seconds,simulated:G.simClock,travel:player.x-start,
      expected:speed*seconds*pace,velocity:player.vx,state:G.state});
   }
   return results;
  });
  for(const r of rows){
   console.log(JSON.stringify(r));
   assert(r.travel>100,'timing test must measure actual movement');
   assert(Math.abs(r.travel-r.expected)<.1,'speed changes with frame rate: '+JSON.stringify(r));
   assert.equal(r.state,'PLAY');
  }
  assert.deepEqual(errors,[]);
  fs.mkdirSync('release-evidence',{recursive:true});
  fs.writeFileSync('release-evidence/timing.json',JSON.stringify({rows,errors},null,2));
  console.log('PASS actual mainLoop preserves travel speed at 12, 20, 30, 60, 120 and 144 fps');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
