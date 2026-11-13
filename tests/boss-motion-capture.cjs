'use strict';
// Staged real-engine visual evidence. Not a claim of a manual campaign clear.
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const dir=process.env.EVIDENCE_DIR||'release-evidence/boss-motion/captures';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 try{
 const p=await b.newPage({viewport:{width:960,height:540},serviceWorkers:'block'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof startGame==='function'&&typeof bossMotionEnd==='function');
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(const k of [...Object.values(BOSS_ART),...ALPHA_STRIPS,...BEAST_STRIPS])mediaFetch(k,true);});
 await p.waitForFunction(()=>Object.values(BOSS_ART).every(k=>MEDIA_RAW[k]?.complete&&MEDIA_RAW[k].naturalWidth));
 await p.waitForTimeout(150);
 const snapshots=[];
 for(const [label,kind,room,state,t] of [
 ['prism-dash-tell','prism','X1','dashwarn',.35],
 ['prism-pounce-tell','prism','X1','pouncewarn',.5],
 ['prism-spread-tell','prism','X1','spreadwarn',.7],
 ['eagle-volley','brood','B4','volley',.9],
 ['glaciere-lance','zero','D3','lancewarn',.6],
 ['furnace-slam','atlas','C3','slamwarn',.55],
 ['mother-warning','mother','E3','ringcharge',.9]]){
  const result=await p.evaluate(({label,kind,room,state,t})=>{
   const sv=newSave(1);sv.flags.tut=sv.flags.woke=1;sv.time=99;startGame(sv);loadRoom(room);G.state='PLAY';G.dialog=G.wake=G.cut=G.trans=G.meet=G.bossEntry=G.gateWalk=null;
   G.enemies=[];G.projs=[];G.offer=null;G.forkBoss=null;G.finish=null;G.hitStop=0;G.flash=0;G.darkT=0;parts=[];
   const bo=new Boss(kind,650,(G.roomDef.h-2)*TILE);G.boss=bo;
   if(['brood','zero','mother'].includes(kind))bo.y=Math.max(120,(G.roomDef.h-2)*TILE-bo.h-110);
   // Keep the arena's actual floor spawn; an overhead platform is not its floor.
   bo.st=state;bo.t=t;bo.vx=bo.vy=0;bo.face=bo.faceVis=-1;bo.nestLanded=true;bo.nestX=null;
   player.x=440;const floor=groundColumnAt(player.x+player.w/2);player.y=(floor?floor[0]:(G.roomDef.h-2)*TILE)-player.h;player.on=true;player.dead=false;player.iT=99;player.vx=player.vy=0;
   for(let i=0;i<7;i++)bo.update(1/30);
   updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);cam.zoom=1.2;cam.shake=0;
   G.zoneToast=null;G.toasts=[];G.save.flags.mapSeen=1;G.saveBanner=0;draw(5000);return {label,kind,state:bo.st,remaining:bo.t,position:[bo.x,bo.y],build:BUILD_ID};
  },{label,kind,room,state,t});
  await p.waitForTimeout(1200);await p.evaluate(()=>draw(5000));
  await p.screenshot({path:path.join(dir,label+'.png')});snapshots.push(result);
 }
 // Unbroken engine-updated leap, shown at sampled flight/landing times.
 await p.evaluate(()=>{
  loadRoom('X1');G.state='PLAY';G.dialog=G.wake=G.cut=G.trans=G.meet=G.bossEntry=G.gateWalk=null;G.projs=[];G.enemies=[];parts=[];G.flash=0;
  G.boss=new Boss('prism',380,11*TILE);const bo=G.boss;bo.st='pouncewarn';bo.t=.5;bo.vx=bo.vy=0;bo.face=bo.faceVis=1;
  player.x=560;player.y=G.roomDef.h*TILE-64-player.h;player.on=true;player.iT=99;player.cores=999;player.dead=false;
  updateCam(520,player.y,G.roomDef.w*TILE,G.roomDef.h*TILE,1);cam.zoom=1.2;cam.shake=0;
 });
 const trace=[];
 for(let i=0;i<48;i++){
   const row=await p.evaluate(i=>{
    const bo=G.boss;for(let k=0;k<5;k++){bo.update(1/60);player.iT=99;updateParts(1/60);}
    cam.shake=0;draw(i*1000/12);return {frame:i,state:bo.st,x:bo.x,y:bo.y,vy:bo.vy,t:bo.t};
   },i);
   await p.screenshot({path:path.join(dir,'prism-sequence-'+String(i).padStart(3,'0')+'.png')});trace.push(row);
 }
 fs.writeFileSync(path.join(dir,'capture-receipt.json'),JSON.stringify({snapshots,trace,errors,scope:'Staged real-engine boss rendering and state-driven leap. Camera set to1.2 for comparison; no collision or damage edits.'},null,2));
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('Captured seven real boss frames and 48 consecutive 12-fps samples of a 4-second simulated fight.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
