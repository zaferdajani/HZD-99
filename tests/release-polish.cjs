// End-to-end assertions against the compiled production game, not excerpts.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const out='release-evidence';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GAME_URL||'http://127.0.0.1:8220/index.html';
const engine=process.env.QA_BROWSER==='webkit'?webkit:chromium;
(async()=>{
 const browser=await engine.launch(process.env.QA_BROWSER==='webkit'?{}:{executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 const errors=[],checks=[],record=(name,detail)=>{checks.push({name,detail});console.log('PASS '+name+' '+JSON.stringify(detail));};
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(String(e)));
 // A cold start cannot depend on external locomotion files arriving later.
 await page.route('**/assets/characters/hero/gait/*',r=>r.abort());
 await page.goto(origin);
 await page.waitForFunction(()=>typeof heroArtReady==='function'&&heroArtReady(),{timeout:30000});
 const core=await page.evaluate(()=>({build:window.BUILD_ID,core:HERO_CORE_KEYS.map(k=>({key:k,embedded:MEDIA_SRC.images[k].startsWith('data:image/webp'),width:MEDIA_RAW[k].width})),run:HERO_GAIT.run}));
 assert(core.core.every(a=>a.embedded&&a.width>0));assert.equal(core.run.from,0);assert.equal(core.run.to,8);record('cold-start canonical art without external gait downloads',core);
 const result=await page.evaluate(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const sv=newSave(1);sv.time=99;sv.flags.tut=1;sv.flags.woke=1;G.save=sv;startGame(sv);loadRoom('A1');
   G.wake=null;G.cut=null;G.bossEntry=null;G.dialog=null;G.state='PLAY';G.enemies=[];G.boss=null;
   await wait(1000);
   const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;await wait(60);
   const clear=()=>{for(const k in keys)keys[k]=0;for(const k in keysP)keysP[k]=0;};
   const tick=(n=1)=>{for(let i=0;i<n;i++){update(1/60);for(const k in keysP)keysP[k]=0;}};
   const stage=id=>{loadRoom(id);G.state='PLAY';G.dialog=null;G.cut=null;G.wake=null;G.bossEntry=null;G.gateWalk=null;G.trans=null;G.hitStop=0;G.enemies=[];G.boss=null;clear();};
   stage('A1');player.x=220;player.y=300;tick(40);player.iT=1;player.on=true;
   const originalUpdate=update;let pressed=0,held=0,steps=0;
   update=function(dt){steps++;if(keysP.ArrowRight)pressed++;if(keys.ArrowRight)held++;return originalUpdate(dt);};
   keys.ArrowRight=keysP.ArrowRight=1;lastT=performance.now();mainLoop(lastT+100);update=originalUpdate;clear();
   const edges={pressed,held,steps};
   G.hitStop=.1;keys.KeyX=keysP.KeyX=1;keys.Space=keysP.Space=1;update(1/60);clear();
   const buffered={attack:player.atkBuf,jump:player.jbuf};
   keys.Escape=keysP.Escape=1;update(1/60);clear();const paused=G.state==='PAUSE';G.state='PLAY';G.hitStop=0;
   stage('A0');G.save.flags.tut=0;G.tut={i:TUT_STEPS.findIndex(s=>s.id==='buy'),t:1,hold:0};
   player.x=300;player.y=330;player.vy=0;tick(30);const x0=player.x;
   G.walkthroughLock={x:player.x,active:true};G.tutHardLock={x:player.x,active:true};
   keys.ArrowRight=keysP.ArrowRight=1;tick(18);clear();
   const travel={dx:player.x-x0,prompt:tutPrompt(TUT_STEPS[G.tut.i]).action,lock:G.tutorialLock,legacy:G.walkthroughLock||G.tutHardLock};
   // Same input route used by touch buttons; release belongs to the finger.
   stage('A1');G.save.flags.tut=1;G.tut=null;player.x=220;player.y=300;tick(40);
   const tx=player.x;tHold('VR');tick(12);clearP();const touchHeld=!!keys.VR;tick(10);keys.VR=0;
   const touch={dx:player.x-tx,heldAfterFrame:touchHeld};
   // Render the actual body in isolation. This includes the production wrapper
   // stack, so a stale sprite-only scale would fail even if constants look right.
   const canvas=document.createElement('canvas');canvas.width=420;canvas.height=360;const ctx=canvas.getContext('2d');
   const stored={x:player.x,y:player.y,idleT:player.idleT,vx:player.vx,vy:player.vy};
   Object.assign(player,{x:200,y:260,idleT:0,vx:0,vy:0,face:1,faceVis:1,on:true,iT:0,chargeT:0,landT:0,skidT:0,dashT:0,hurtPoseT:0,swing:null,swingVis:null});
   player.draw(ctx);const data=ctx.getImageData(0,0,420,360).data;let top=360,bottom=0;
   for(let i=3;i<data.length;i+=4)if(data[i]>200){const y=Math.floor((i>>2)/420);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   const body={height:bottom-top+1,viewportRatio:(bottom-top+1)*PRESENTATION.explorationZoom/540,zoom:PRESENTATION.explorationZoom,renderer:G.heroDrawn};
   Object.assign(player,stored);
   // Across rooms, all world-space parts use one camera projection.
   const rooms=[];for(const id of ['W1','W2','A0','A0B','A1','CV1','A3']){
     stage(id);player.x=Math.min(300,G.roomDef.w*TILE/2);player.y=300;tick(70);
     updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);
     rooms.push({id,zoom:cam.zoom,x:worldScreenX(player.x+player.w/2),y:worldScreenY(player.y+player.h/2)});
   }
   // Actual charge/landing states retain locomotion at running velocity.
   player.on=true;player.vx=300;player.chargeT=.5;player.landT=.1;player.idleT=0;
   const movingCharge=player.heroState(true);player.chargeT=0;player.landT=0;
   const idleStart=player.idleT;keys.ArrowRight=1;tick(1);clear();const idleDuringInput=player.idleT;
   // Inject a missing run image: never draw the old two-pose run instead.
   player.on=true;player.vx=300;player.chargeT=0;player.landT=0;player.skidT=0;player.hurtPoseT=0;player.swingVis=null;const runImage=MEDIA_RAW.gaitRun,pend=MEDIA_PEND.gaitRun,low=MEDIA_LOW.gaitRun;
   delete MEDIA_RAW.gaitRun;MEDIA_PEND.gaitRun=1;delete SOFT_ART.gaitRun;
   ctx.clearRect(0,0,420,360);player.drawRoboPlate(ctx,true);const missingRenderer=G.heroDrawn;
   MEDIA_RAW.gaitRun=runImage;MEDIA_PEND.gaitRun=pend;MEDIA_LOW.gaitRun=low;
   // Save and new Player reconstruction retain the user's actual progress.
   G.save.scrap=137;G.save.flags.tutI=7;const saved=persist();const recovered=JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
   const save={saved,scrap:recovered.scrap,tutorial:recovered.flags.tutI};
   stage('A0');G.save.flags.tut=1;G.tut=null;player.x=380;player.y=330;tick(60);draw(performance.now());
   window.requestAnimationFrame=raf;raf.call(window,mainLoop);
   return {edges,buffered,paused,travel,touch,body,rooms,movingCharge,idleStart,idleDuringInput,missingRenderer,save};
 });
 assert.equal(result.edges.pressed,1);assert.equal(result.edges.held,result.edges.steps);assert(result.edges.steps>=3);record('pressed edges consumed once during multi-step frames',result.edges);
 assert(result.buffered.attack>0&&result.buffered.jump>0);assert(result.paused);record('buffered combat/jump inputs and immediate pause during hitstop',result.buffered);
 assert(result.travel.dx>30);assert.equal(result.travel.legacy,null);assert.equal(result.travel.lock,null);record('reported workshop approach moves with stale locks present',result.travel);
 assert(result.touch.dx>30&&result.touch.heldAfterFrame);record('touch movement remains held until finger release',result.touch);
 assert(result.body.viewportRatio>=.165&&result.body.viewportRatio<=.225,'protagonist fraction '+result.body.viewportRatio);record('actual rendered hero size',result.body);
 assert(result.rooms.every(r=>r.zoom===1.9&&r.x>40&&r.x<920&&r.y>80&&r.y<520));record('seven room camera/framing transitions',result.rooms);
 assert(/^(run|walk)_/.test(result.movingCharge));assert(result.idleDuringInput<1);assert.equal(result.missingRenderer,'loading:gait');record('charged locomotion, real idle and no legacy run fallback',{state:result.movingCharge,missing:result.missingRenderer});
 assert(result.save.saved&&result.save.scrap===137&&result.save.tutorial===7);record('save persistence',result.save);
 await page.screenshot({path:out+'/polished-A0-'+(process.env.QA_BROWSER||'chromium')+'.png'});
 // Decode every shipped intro clip, then replay the first. Playback is muted
 // here because autoplay gating is separate from whether the footage exists.
 if(!process.env.QA_SKIP_FILM){
 // Use the game's connected inline video and its actual codec ordering. The
 // previous probe forced WebM into a display:none element, unlike gameplay.
 await page.mouse.click(8,8);
 const clips=await page.evaluate(async()=>{
   const r=[];G.reel=null;G.reelEnd=null;G.cutEnd=null;
   for(let i=1;i<=8;i++){
     const key='intro'+i;G.state='PLAY';
     const started=startPurifyCut(key);const ct=G.cut;
     const stop=Date.now()+16000;
     while(ct && G.cut===ct && !(ct.ran && ct.v.currentTime>=.08) && Date.now()<stop)
       await new Promise(resolve=>setTimeout(resolve,30));
     const v=ct && ct.v;
     r.push({key,started,time:v?v.currentTime:0,width:v?v.videoWidth:0,ran:!!(ct&&ct.ran),
       src:v&&v.currentSrc,phase:ct&&ct.ph,error:v&&v.error?{code:v.error.code,message:v.error.message}:null});
     if(G.cut===ct)endPurifyCut();
   }return r;
 });
 fs.writeFileSync(out+'/clips-'+(process.env.QA_BROWSER||'chromium')+'.json',JSON.stringify(clips,null,2));
 console.log('Production clip playback',JSON.stringify(clips));
 assert(clips.every(c=>c.started&&c.ran&&c.width>0&&c.time>=.08&&!c.error),'Production movie playback: '+JSON.stringify(clips));
 record('all eight intro clips really decode and advance',clips);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/polish-'+(process.env.QA_BROWSER||'chromium')+'.json',JSON.stringify({checks,result,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;setTimeout(()=>process.exit(1),1000).unref();});
