'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const baseline=process.argv.includes('--baseline'),out=process.env.EVIDENCE_DIR||'release-evidence/sage-motion';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
try{const p=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GAME_URL||'http://127.0.0.1:8220/index.html';
 if(baseline)await p.route(url,r=>r.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.BASELINE_HTML||'/home/user/clawbyte-sage-pass/base/index.html','utf8')}));
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof startGame==='function');
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(const k of ['sageStand','sageCoil','sageLunge','sageGather','sageExhale','sageWalk8','sageLock','sagePure'])mediaFetch(k,true)});
 await p.waitForFunction(()=>['sageStand','sageCoil','sageLunge','sageGather','sageExhale','sageWalk8','sageLock','sagePure'].every(k=>MEDIA_RAW[k]?.complete&&MEDIA_RAW[k].naturalWidth),null,{timeout:45000});await p.waitForTimeout(80);
 const result=await p.evaluate(()=>{
 const checks=[],check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
 const cv2=document.createElement('canvas');cv2.width=400;cv2.height=240;const ctx=cv2.getContext('2d');
 const hashMethods={heroUpdate:Player.prototype.update.toString(),heroState:Player.prototype.heroState.toString(),collision:moveEnt.toString(),bossUpdate:Boss.prototype.update.toString()};
 function stage(room='GA1D'){
  const save=newSave(1);save.time=99;save.flags.tut=save.flags.woke=1;startGame(save);loadRoom(room);
  G.state='PLAY';G.wake=G.dialog=G.cut=G.trans=G.meet=G.gateWalk=G.bossEntry=null;G.boss=null;G.projs=[];G.hitStop=G.flash=0;parts=[];
  const e=G.enemies.find(e=>e.kind==='sage');G.enemies=[e];
  Object.assign(e,{x:420,y:(G.roomDef.h-2)*TILE-e.h,vx:0,vy:0,dir:1,faceVis:1,anim:0,coilT:0,gatherT:0,lungeT:0,windedT:0,ringR:null,kbT:0,stagT:0,hypnoT:0,locked:false,tame:0,calm:false,stepT:99,denied:0,hurtT:0,dead:false});
  Object.assign(player,{x:e.x+100,y:e.y+e.h-player.h,vx:0,vy:0,on:true,iT:0,guardT:0,dashT:0,dead:false,cores:5});
  if(e.sageDuel){e.sageDuel.face=1;e.sageDuel.phase='idle';e.sageDuel.elapsed=0;}return e;
 }
 function overlap(e){player.x=e.x+2;player.y=e.y+e.h-player.h;player.on=true;player.iT=0;player.guardT=0;player.cores=5;}
 function body(e){ctx.setTransform(1,0,0,1,200-e.x-e.w/2,200-e.y-e.h);ctx.clearRect(-2000,-2000,4000,4000);
  if(typeof drawSageDuelBody==='function'&&drawSageDuelBody(ctx,e)){}else drawSage(ctx,e);
  const a=ctx.getImageData(0,0,400,240).data;let min=240,max=0,n=0;for(let i=3;i<a.length;i+=4)if(a[i]>220){const y=Math.floor((i>>2)/400);min=Math.min(min,y);max=Math.max(max,y);n++;}return {height:max-min+1,bottom:max,n};}
 let e=stage();e.windedT=.6;overlap(e);e.update(1/60);check('the advertised exhale is a real contact-safe punish window',player.cores===5,{cores:player.cores,winded:e.windedT});
 e=stage();e.coilT=.3;overlap(e);e.update(1/60);check('the wind-up cannot damage before its strike',player.cores===5,{cores:player.cores});
 e=stage();e.lungeT=.2;e.vx=e.spd*2.2;overlap(e);e.update(1/60);check('the actual lunge still damages on contact',player.cores<5,{cores:player.cores});
 e=stage();e.coilT=.5;e.dir=1;if(e.sageDuel){sageDuelEnter(e,'coil',.5,1);}player.x=e.x-100;player.iT=999;
 for(let n=0;n<32&&e.coilT>0;n++)e.update(1/60);
 check('the announced lunge commits its original direction',e.lungeT>0&&e.vx>0,{vx:e.vx,lunge:e.lungeT});
 // Observe renderer-facing, not only a state variable unused by drawing.
 let faces=[];const dp=drawPlateAnchored;
 drawPlateAnchored=function(c,k,x,y,h,f,...rest){if(k==='sageLunge')faces.push(f);return dp(c,k,x,y,h,f,...rest)};
 try{player.x=e.x-100;drawSage(ctx,e);player.x=e.x+100;drawSage(ctx,e);}finally{drawPlateAnchored=dp;}
 check('crossing the Sage does not flip its active-strike artwork',faces.length===2&&faces[0]===faces[1],faces);
 e=stage();e.lungeT=.01;e.lunges=1;e.vx=e.spd*2.2;player.x=e.x-100;player.iT=999;
 e.update(1/30);let replant=e.sageReplantT||0;
 check('double lunge includes a stationary readable replant',replant>=.17&&e.vx===0&&e.lungeT===0,{replant,vx:e.vx,lunge:e.lungeT});
 if(replant){const x=e.x;overlap(e);e.update(1/60);check('replant neither slides nor causes an invisible hit',e.x===x&&player.cores===5,{dx:e.x-x,cores:player.cores});}
 else check('replant neither slides nor causes an invisible hit',false,'No replant exists in baseline');
 e=stage();e.lungeT=.01;e.lunges=0;e.vx=e.spd*2.2;player.iT=999;e.update(1/30);
 check('second strike stops before displaying recovery',e.windedT>=.69&&e.vx===0&&e.lungeT===0,{winded:e.windedT,vx:e.vx});
 e=stage();e.gatherT=.01;player.iT=999;e.update(1/30);
 check('ring release has an explicit non-attacking recovery',e.ringR!=null&&e.windedT>=.54&&e.vx===0,{radius:e.ringR,recovery:e.windedT});
 const origin={x:e.x+e.w/2,y:e.y+e.h};e.x+=100;e.ringR=80;player.x=origin.x+80-player.w/2;player.y=origin.y-player.h;player.on=true;player.iT=0;player.cores=5;e.windedT=.4;
 let centers=[];const el=ctx.ellipse;ctx.ellipse=function(x,y,rx,...args){if(Math.abs(rx-e.ringR)<.01)centers.push({x,y});return el.call(this,x,y,rx,...args)};
 try{drawSage(ctx,e);}finally{ctx.ellipse=el;}
 check('the ring drawing stays at its release location',centers.length&&Math.abs(centers[0].x-origin.x)<.1&&Math.abs(centers[0].y-origin.y)<.1,{origin,centers});
 e.update(1/60);check('ring collision agrees with that release location',player.cores<5,{cores:player.cores});
 e=stage();e.gatherT=.01;player.iT=999;e.update(1/30);const o={x:e.x+e.w/2,y:e.y+e.h};e.ringR=80;player.x=o.x+80-player.w/2;player.y=o.y-player.h-60;player.on=true;player.iT=0;player.cores=5;e.update(1/60);
 check('a separate elevated platform is not the ring floor lane',player.cores===5,{cores:player.cores});
 e=stage();e.gatherT=.01;player.iT=999;e.update(1/30);e.ringR=80;player.x=e.x+e.w/2+80-player.w/2;player.y=e.y+e.h-player.h;player.on=false;player.iT=0;player.cores=5;e.update(1/60);check('jump remains a valid answer to the ember ring',player.cores===5);
 e=stage();e.vx=100;e.walkD=14;let feet=[];for(const t of [0,.4,.8,1.2,1.6]){e.anim=t;feet.push(body(e).bottom);}check('walking feet are planted without a second floating bob',Math.max(...feet)-Math.min(...feet)<=1,feet);
 e=stage();const stand=body(e);e.lungeT=.15;e.vx=e.spd*2.2;const strike=body(e);check('lunge does not shrink to half the standing body',strike.height/stand.height>=.8,{stand,strike,ratio:strike.height/stand.height});
 e=stage();e.tame=1;e.calm=true;e.vx=45;e.walkD=22;G.lastStrip='';drawSage(ctx,e);check('the freed moving Sage uses its walking strip, not sliding kneeling artwork',(G.lastStrip||'').startsWith('sageWalk8:'),G.lastStrip);
 // Review-derived gate: the moving rescued actor must retain its blue state,
 // not revert to the red/purple infected robe between idle and walk.
 e=stage();e.tame=1;e.calm=true;e.vx=45;e.walkD=14;body(e);
 const purePixels=ctx.getImageData(0,0,400,240).data;let reds=0,blues=0,opaque=0;
 for(let i=0;i<purePixels.length;i+=4)if(purePixels[i+3]>180){reds+=purePixels[i];blues+=purePixels[i+2];opaque++;}
 check('rescued walking preserves the purified blue identity',opaque>200&&blues>reds*1.3,{opaque,blueRedRatio:blues/Math.max(1,reds)});
 e=stage();let before=JSON.stringify(e.sageDuel);const sounds=[],oldSfx=sfx;sfx=(...v)=>sounds.push(v);
 try{for(let n=0;n<5;n++)drawSage(ctx,e);}finally{sfx=oldSfx;}
 check('drawing does not advance the fight clock or emit cues',before===JSON.stringify(e.sageDuel)&&sounds.length===0);
 e=stage();e.lungeT=.2;e.lunges=1;e.kbT=.1;e.vx=-40;e.update(1/60);
 check('an interrupted strike cannot resume as an untold lunge',e.lungeT===0&&e.lunges===0&&e.windedT>=.34,{lunge:e.lungeT,recovery:e.windedT});
 e=stage();e.gatherT=.01;player.iT=999;e.update(1/30);const radius=e.ringR;e.kbT=.2;e.update(1/60);
 check('an already released ring advances independently of caster knockback',e.ringR>radius,{before:radius,after:e.ringR});
 e=stage('GA2D');check('the Pack Sage is not silently assigned the Meadow profile',!e.sageDuel);
 e=stage();if(e.sageDuel)e.sageReplantT=.1;e.lungeT=.1;e.hp=e.hpMax0*.3+1;e.ringR=50;delete G.save.flags.crystal;delete G.save.flags.crystal2;sageStruck(e,50,e.x,e.y);
 check('song-lock cancels the pending chain and ring',e.locked&&e.ringR==null&&!(e.sageReplantT>0),{locked:e.locked,replant:e.sageReplantT});
 const floor=e.hp;sageStruck(e,50,e.x,e.y);check('claws still cannot cleanse the Sage',e.hp>=floor&&!e.tame);
 grantWeapon('single',G.save);let count=0;const cell=invCount('batt');while(!e.tame&&count<6){sageStruck(e,20,e.x,e.y);count++;}
 check('four Purifier hits still rescue rather than kill',e.tame===1&&!e.dead&&count===4,{count,tame:e.tame,dead:e.dead});
 const after=invCount('batt');sageStruck(e,50,e.x,e.y);check('the Power Cell reward remains once-only',after===cell+1&&invCount('batt')===after);
 const record={build:BUILD_ID,revision:typeof SAGE_DUEL_REVISION==='undefined'?null:SAGE_DUEL_REVISION,checks,methods:hashMethods};return record;
 });
 for(const [k,v] of Object.entries(result.methods))result.methods[k]=crypto.createHash('sha256').update(v).digest('hex');
 result.errors=errors;result.checks.push({name:'no browser errors',pass:errors.length===0,detail:errors});
 if(!baseline&&fs.existsSync(path.join(out,'baseline.json'))){const b=JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8'));result.checks.push({name:'hero movement, collision and boss simulation unchanged',pass:JSON.stringify(b.methods)===JSON.stringify(result.methods),detail:result.methods});}
 fs.writeFileSync(path.join(out,baseline?'baseline.json':'verified.json'),JSON.stringify(result,null,2));for(const c of result.checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+' '+JSON.stringify(c.detail??''));
 console.log(JSON.stringify({baseline,build:result.build,passed:result.checks.filter(c=>c.pass).length,total:result.checks.length}));
 if(!baseline)assert(result.checks.every(c=>c.pass),'Sage choreography checks failed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
