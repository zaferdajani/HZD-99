// Reproduce rendered mobility defects, then assert against real runtime state.
const {chromium}=require('playwright');
const fs=require('fs');
const base=process.env.TEST_URL || 'http://127.0.0.1:8220/index.html';
const output=process.env.EVIDENCE_DIR || 'build/hero-evidence';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof startGame==='function');
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
 await page.waitForTimeout(100);
 await page.waitForFunction(()=>typeof heroMotionMissing==='function' && heroMotionMissing().length===0,{timeout:30000});
 const result=await page.evaluate(()=>{
   const checks=[], record=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
   const sv=newSave(1);sv.flags.tut=1;sv.flags.woke=1;sv.time=99;
   startGame(sv);loadRoom('A10');G.state='PLAY';G.dialog=null;G.cut=null;G.wake=null;G.meet=null;G.bossEntry=null;G.trans=null;G.gateWalk=null;G.boss=null;G.enemies=[];
   G.artProbe=1;player.x=320;player.y=(G.roomDef.h-2)*TILE-player.h;player.on=true;player.vy=0;
   const reset=()=>Object.assign(player,{vx:0,vy:0,on:true,chargeT:0,landT:0,land0:0,skidT:0,hurtPoseT:0,healT:0,songT:0,swing:null,swingVis:null,swirlT:0,dashT:0,wallSlide:0,flipT:0,boostT:0,takeoffT:0,coyote:0,face:1,faceVis:1});
   const poses=[];
   for(const q of [
     {name:'walk',vx:100,on:true}, {name:'run',vx:340,on:true},
     {name:'charge-run',vx:340,on:true,chargeT:1},
     {name:'charge-landing-run',vx:340,on:true,chargeT:1,landT:.2,land0:.22},
     {name:'landing-run',vx:340,on:true,landT:.2,land0:.22},
     {name:'coyote-run',vx:340,vy:10,on:false,coyote:.08},
     {name:'charge-rise',vx:300,vy:-500,on:false,chargeT:1},
     {name:'charge-apex',vx:300,vy:0,on:false,chargeT:1},
     {name:'charge-fall',vx:300,vy:600,on:false,chargeT:1}
   ]) {reset();Object.assign(player,q);player.anim+=.2;draw(player.anim*1000); const st=player.heroState(Math.abs(player.vx)>40);poses.push({name:q.name,st,drawn:G.heroDrawn});record(q.name+' uses authored locomotion',/^(gaitWalk|gaitRun|transAir):/.test(G.heroDrawn),G.heroDrawn);}
   // Observe the production draw method at fractional gait phases.
   reset();player.vx=340;player.stridePh=.125;player.anim+=1;draw(player.anim*1000);
   record('fractional gait frame is sampled',G.heroMotion && G.heroMotion.frame%1!==0,G.heroMotion);
   // Scale is measured on the body renderer's actual transform, not a label.
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
   const ctx=canvas.getContext('2d');let effective=null;const drawImage=ctx.drawImage.bind(ctx);
   ctx.drawImage=function(...args){effective=this.getTransform().a;return drawImage(...args);};
   ctx.translate(160,240);player._motionBlend=null;player.drawRoboPlate(ctx,true);
   // Canvas matrix components round to float32. Checked against the live
   // constant, not a hardcoded value — it was 1.78, corrected to 1.335 when
   // it read oversized against NPCs and enemies (owner, 2026-09-11).
   record('HERO_SCREEN_SCALE reaches rendered body',Math.abs(effective-HERO_SCREEN_SCALE)<1e-6,{effective,expected:HERO_SCREEN_SCALE});
   // Drive actual input and physics through a jump while holding charge.
   reset();player.x=320;player.y=(G.roomDef.h-2)*TILE-player.h;player.volts=99;player.chargeT=0;
   let landingFrames=0, bad=0, moving=0;const begin=player.x, trace=[];
   for(let i=0;i<150;i++) {
     keys.KeyD=1;keys.KeyX=1;
     if(i===0)keysP.KeyX=1;
     if(i===35){keys.KeyZ=1;keysP.KeyZ=1;}
     if(i===58)keys.KeyZ=0;
     update(1/60);draw(i*1000/60);clearP();
     if(player.on&&Math.abs(player.vx)>40&&!player.swingVis){moving++;if(player.landT>0)landingFrames++;if(!/^gaitRun:/.test(G.heroDrawn))bad++;}
     if(i%10===0)trace.push({i,x:+player.x.toFixed(2),vy:+player.vy.toFixed(2),landT:player.landT,charge:player.chargeT,drawn:G.heroDrawn});
   }
   for(const k in keys)keys[k]=0;clearP();
   record('real held-charge movement makes progress',player.x-begin>200,player.x-begin);
   record('real jump reaches landing',landingFrames>0,landingFrames);
   record('no planted-pose sliding during actual input',moving>0&&bad===0,{moving,bad});
   // The production input aliases used by controller and touch, not a claim
   // of physical-device certification. Each drives Player.update and rendering.
   for (const input of [{name:'controller aliases',right:'GP_R',attack:'GP_ATK',jump:'GP_JUMP',run:'GP_RUN'},
                        {name:'touch aliases',right:'VR',attack:'VATK',jump:'VJUMP'}]) {
     reset(); player.x=320;player.y=(G.roomDef.h-2)*TILE-player.h;player.volts=99;
     player.chargeOk=true;player.atkCD=0;player.atkBuf=0;player.comboT=0;
     const beginX=player.x;let travelled=0, air=0, invalid=0;
     for(let i=0;i<135;i++) {
       keys[input.right]=1;keys[input.attack]=1;if(input.run)keys[input.run]=1;
       if(i===0)keysP[input.attack]=1;
       if(i===35){keys[input.jump]=1;keysP[input.jump]=1;}
       if(i===60)keys[input.jump]=0;
       update(1/60);draw((300+i)*1000/60);clearP();
       if(!player.swingVis && player.chargeT>.2){
         if(!player.on)air++;
         if(player.on&&Math.abs(player.vx)>40){travelled++;if(!/^(gaitWalk|gaitRun):/.test(G.heroDrawn))invalid++;}
       }
     }
     record(input.name+' can charge, jump, land and keep moving',travelled>0&&air>0&&invalid===0&&player.x-beginX>100,{travelled,air,invalid,distance:player.x-beginX});
     for(const k in keys)keys[k]=0;clearP();
   }
   // Camera: retain world view, smooth facing reversal, bounded across a tall room.
   reset();G.roomId='camera-test';cam.x=500;cam.y=500;player.x=1000;player.y=900;player.vx=340;
   updateCam(1011,918,4000,2400,1);const first={x:cam.x,y:cam.y};player.vx=-340;player.face=-1;
   updateCam(1011,918,4000,2400,1/60);const shift=Math.abs(cam.x-first.x);
   record('camera reversal is smooth',shift<10,{first,next:cam.x,shift});
   const bounds=[];
   for(let i=0;i<120;i++){player.y=900-i*5;player.vy=-300;player.on=false;updateCam(1011,player.y+18,4000,2400,1/60);bounds.push(cam.x>=0&&cam.y>=0&&cam.x<=3040&&cam.y<=1860);}
   record('camera remains within room bounds',bounds.every(Boolean));
   record('logical viewport remains 960 by 540',cv.width/cv.height===960/540,{canvas:[cv.width,cv.height],worldView:[960,540]});
   G.artProbe=0;
   return {revision:HERO_MOTION_REVISION,build:BUILD_ID,scale:HERO_SCREEN_SCALE,checks,poses,trace};
 });
 // Simulated failed/delayed critical download: no legacy body and no trap.
 await page.route('**/hero/gait/run.webp',route=>route.abort());
 const blocked=await page.evaluate(()=>{
   loadRoom('A0B');G.state='PLAY';G.dialog=null;G.trans=null;G.gateWalk=null;G.wake=null;
   delete MEDIA_RAW.gaitRun;delete MEDIA_PEND.gaitRun;MEDIA_LOW.gaitRun=0;
   const x=player.x;keys.KeyD=1;update(1/60);draw(4000);
   const stopped=player.x===x&&heroMotionLoad.active;
   keysP.Escape=1;update(1/60);const escapable=G.state==='PAUSE';keys.KeyD=0;
   return {stopped,escapable,state:G.state};
 });
 result.checks.push({name:'slow/missing art visibly waits instead of legacy fallback',ok:blocked.stopped,detail:blocked});
 result.checks.push({name:'asset wait remains escapable',ok:blocked.escapable});
 await page.unroute('**/hero/gait/run.webp');
 await page.evaluate(()=>{delete MEDIA_PEND.gaitRun;heroMotionWarm();});
 await page.waitForFunction(()=>heroMotionMissing().length===0);
 // Capture actual rooms at the requested visual scale.
 const rooms=['W2','A0','A0B','A10','D3'];result.rooms=[];
 for(const room of rooms){
   const info=await page.evaluate(room=>{
     loadRoom(room);G.state='PLAY';G.dialog=null;G.wake=null;G.cut=null;G.trans=null;G.meet=null;G.bossEntry=null;G.gateWalk=null;G.boss=null;G.enemies=[];
     player.x=G.roomDef.w*TILE*.45;player.y=(G.roomDef.h-2)*TILE-player.h;player.on=true;player.vy=0;player.vx=0;player.chargeT=0;player.landT=0;player.swingVis=null;player.hurtPoseT=0;
     updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);
     draw(5000);return {room,hero:[player.x,player.y,player.w,player.h],camera:[cam.x,cam.y],npcCount:G.statics.filter(s=>s.type==='npc').length};
   },room);
   await page.waitForTimeout(700);await page.evaluate(()=>draw(5000));
   await page.screenshot({path:output+'/'+room+'.png'});result.rooms.push(info);
 }
 result.errors=errors;result.checks.push({name:'no browser runtime errors',ok:errors.length===0,detail:errors});
 fs.writeFileSync(output+'/results.json',JSON.stringify(result,null,2));
 for(const c of result.checks)console.log((c.ok?'PASS ':'FAIL ')+c.name+' '+JSON.stringify(c.detail??''));
 await browser.close();if(result.checks.some(c=>!c.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
