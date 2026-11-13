'use strict';
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const dir=process.env.EVIDENCE_DIR||'release-evidence/sage-motion/captures';fs.mkdirSync(dir,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});try{
const p=await b.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
await p.waitForFunction(()=>typeof sageDuelStep==='function');await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(const k of ['sageStand','sageCoil','sageLunge','sageGather','sageExhale','sageWalk8','sageLock','sagePure'])mediaFetch(k,true)});await p.waitForFunction(()=>MEDIA_RAW.sageCoil?.complete&&MEDIA_RAW.sageWalk8?.complete&&heroMotionMissing().length===0);
await p.waitForTimeout(100);await p.evaluate(()=>{const sv=newSave(1);sv.time=99;sv.flags.tut=sv.flags.woke=1;grantWeapon('single',sv);startGame(sv);loadRoom('GA1D');G.state='PLAY';G.wake=G.dialog=G.cut=G.trans=G.meet=G.gateWalk=G.bossEntry=null;G.zoneToast=null;G.toasts=[];G.saveBanner=0;G.projs=[];G.boss=null;parts=[];window.__sage=G.enemies.find(e=>e.kind==='sage');G.enemies=[__sage];Object.assign(__sage,{on:true,coilT:0,lungeT:0,gatherT:0,windedT:0,stepT:99,kbT:0,stagT:0,hypnoT:0,calm:false,tame:0,locked:false,vx:0,vy:0});player.x=__sage.x-90;player.y=__sage.y+__sage.h-player.h;player.iT=999;player.on=true;player.vx=player.vy=0;player.swingVis=null;updateCam((player.x+__sage.x)/2,__sage.y,G.roomDef.w*TILE,G.roomDef.h*TILE,1);draw(5000);});await p.waitForTimeout(1400);
const frames=[];
for(let frame=0;frame<132;frame++){
 const record=await p.evaluate(frame=>{
  const e=__sage;
  if(frame===0){e.coilT=.5;sageDuelEnter(e,'coil',.5,-1);}
  if(frame===26){player.x=e.x+90;player.y=e.y+e.h-player.h;} // crossing cannot turn the active lunge
  if(frame===66){e.coilT=e.lungeT=e.windedT=e.sageReplantT=0;e.vx=0;e.gatherT=.7;sageDuelEnter(e,'gather',.7,e.sageDuel.face);}
  e.update(1/30);player.iT=999;player.anim+=1/30;cam.shake=0;G.flash=0;draw(frame*1000/30);
  return {frame,phase:e.sageDuel.phase,pose:G.sageMotion?.pose,face:e.sageDuel.face,x:e.x,vx:e.vx,ring:e.ringR,ringOrigin:e.sageDuel.ringOrigin,winded:e.windedT};
 },frame);
 await p.screenshot({path:path.join(dir,String(frame).padStart(3,'0')+'.png')});frames.push(record);
}
fs.writeFileSync(path.join(dir,'receipt.json'),JSON.stringify({build:await p.evaluate(()=>BUILD_ID),frames,errors,scope:'Staged actual GA1D renderer at30fps simulation samples; camera is normal. No new art pixels or new hero gait.'},null,2));if(errors.length)throw Error(errors.join('\n'));console.log('Captured 132 actual game frames with a committed double-lunge and ring release.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
