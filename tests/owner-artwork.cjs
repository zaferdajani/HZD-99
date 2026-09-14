'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const record=process.argv.includes('--record'),out='release-evidence/owner-artwork';
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const protectedGait={
 'assets/characters/hero/gait/walk.webp':'312d78c1e20f25232c8ef8b35a0b7aefbb3dd31110742b51968a0493fead5590',
 'assets/characters/hero/gait/run.webp':'6fbb5c1ef0c64a56a5ab67c36cf0b1253b8eedae36a784af71942b5bbb9307c2'};
for(const [p,h] of Object.entries(protectedGait))assert.equal(hash(fs.readFileSync(p)),h,'Protected gait asset '+p);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof heroMotionMissing==='function'&&heroMotionMissing().length===0,null,{timeout:45000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(80);
 const evidence=await page.evaluate(record=>{
   const r=n=>n==null?null:typeof n==='number'?Math.round(n*100000)/100000:n;
   const methods={update:Player.prototype.update.toString(),state:Player.prototype.heroState.toString(),collision:moveEnt.toString(),camera:updateCam.toString(),charge:Player.prototype.releaseCharged.toString()};
   const gait={config:JSON.stringify(HERO_GAIT),walkStep:HERO_STEP_WALK,runStep:HERO_STEP_RUN,threshold:HERO_RUN_VX};
   Math.random=()=>.5;
   function clear(){for(const k in keys)keys[k]=0;for(const k in keysP)keysP[k]=0;}
   function stage(){
     clear();const sv=newSave(1);sv.flags.tut=1;sv.flags.woke=1;sv.time=99;sv.abil={dash:1,djump:1};
     startGame(sv);loadRoom('A10');G.state='PLAY';G.wake=null;G.cut=null;G.dialog=null;G.meet=null;G.bossEntry=null;G.trans=null;G.gateWalk=null;G.enemies=[];G.boss=null;G.boomer=null;G.hitStop=0;G.artProbe=1;
     player.x=300;player.y=(G.roomDef.h-2)*TILE-player.h;player.on=true;player.vx=player.vy=0;player.volts=99;player.lastSafe={x:player.x,y:player.y};
     for(let i=0;i<20;i++){update(1/60);clearP();}
   }
   const cases=[{name:'keyboard run',right:'KeyD'}, {name:'controller walk',right:'GP_R'},
    {name:'controller run',right:'GP_R',run:'GP_RUN'}, {name:'touch run',right:'VR'},
    {name:'charge-run-jump',right:'KeyD',attack:'KeyX',jump:'KeyZ'},
    {name:'touch charge-jump',right:'VR',attack:'VATK',jump:'VJUMP'},
    {name:'controller charge-jump',right:'GP_R',run:'GP_RUN',attack:'GP_ATK',jump:'GP_JUMP'},
    {name:'dash-reverse',right:'KeyD',dash:'KeyC'}];
   const traces=[];
   for(const test of cases){
     stage();const samples=[];
     for(let i=0;i<120;i++){
       keys[test.right]=i<95?1:0;if(test.run)keys[test.run]=1;
       if(test.attack){keys[test.attack]=i<75?1:0;if(i===0)keysP[test.attack]=1;}
       if(test.jump){keys[test.jump]=i>=30&&i<55?1:0;if(i===30)keysP[test.jump]=1;}
       if(test.dash&&i===30){keys[test.dash]=1;keysP[test.dash]=1;}
       if(test.dash&&i===31)keys[test.dash]=0;
       if(test.dash&&i>=75){keys[test.right]=0;keys.KeyA=1;}
       update(1/60);player.draw(c);clearP();
       samples.push([G.state,player.x,player.y,player.vx,player.vy,player.w,player.h,player.on,
         player.stridePh,player.landT,player.dashT,player.chargeT,player.atkCD,player.combo,
         player.volts,player.swing&&player.swing.t,player.swingVis&&player.swingVis.t,player.swingVis&&player.swingVis.charged,
         /^gait/.test(G.heroDrawn||'')?G.heroDrawn:null].map(r));
     }
     traces.push({name:test.name,samples});clear();
   }
   stage();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');
   // Direct steady gait pixels must remain identical, not only the filenames.
   const gaitPixels=[];
   for(const speed of [185,340])for(let i=0;i<16;i++){
     Object.assign(player,{vx:speed,vy:0,on:true,chargeT:0,landT:0,skidT:0,hurtPoseT:0,healT:0,songT:0,swingVis:null,dashT:0,stridePh:i/4,_motionPose:null,_motionBlend:null});
     ctx.setTransform(1,0,0,1,128,220);ctx.clearRect(-128,-220,256,256);
     player.drawRoboTrans(ctx,player.heroState(true));gaitPixels.push(canvas.toDataURL());
   }
   const result={methods,gait,traces,gaitPixels,build:BUILD_ID};
   if(record)return result;
   const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
   check('owner atlas is embedded and decoded before gameplay',!!window.EMBEDDED_MEDIA.heroOwnerAtlas&&!!ownerHeroImage());
   check('atlas texture stays at or below 1024 square',ownerHeroImage().naturalWidth<=1024&&ownerHeroImage().naturalHeight<=1024,[ownerHeroImage().naturalWidth,ownerHeroImage().naturalHeight]);
   const reset=()=>Object.assign(player,{dead:false,on:true,vx:0,vy:0,face:1,faceVis:1,hurtPoseT:0,healT:0,songT:0,swingVis:null,swing:null,chargeT:0,dashT:0,skidT:0,landT:0,wallSlide:0,boostT:0,coyote:0,mood:null,moodT:0,idleT:0,cores:5,_motionPose:null,_motionBlend:null});
   const cases2=[['idle',{anim:.1},'owner:idle'],['rise',{on:false,vy:-500},'owner:jump'],['apex',{on:false,vy:0},'owner:jump'],['fall',{on:false,vy:600},'owner:jump'],
    ['land',{landT:.19,land0:.22},'owner:fall_land'],['dash',{dashT:.12,dash0:.16},'owner:dash'],['hurt',{hurtPoseT:.2},'owner:hurt'],['charge',{chargeT:.45},'owner:heavy'],
    ['charge-run-land',{chargeT:.8,vx:340,landT:.2,land0:.22},'gaitRun'],['charge-walk',{chargeT:.8,vx:185},'gaitWalk']];
   for(const [name,state,want] of cases2){reset();Object.assign(player,state);player.drawRoboPlate(ctx,true);check(name+' selects correct render family',(G.heroDrawn||'').startsWith(want),G.heroDrawn);}
   for(const face of [-1,1])for(const [name,sv,air] of [
    ['jab',{combo:0},false],['double',{combo:1},false],['upper',{combo:2},false],['charged',{combo:3,charged:true},false],
    ['air',{combo:0},true],['plunge',{combo:0,ang:Math.PI/2},true]]){
     reset();player.on=!air;player.face=player.faceVis=face;
     player.swingVis={t:.15,t0:.24,weaponMode:'claws',wield:0,ang:0,...sv};player.swing={ay:name==='plunge'?1:0};
     player.drawRoboPlate(ctx,true);check(name+' draws new artwork facing '+face,(G.heroDrawn||'').startsWith('owner:'),G.heroDrawn);
   }
   for(const mode of ['single','dual','joined']){reset();player.swingVis={t:.15,t0:.24,weaponMode:mode,wield:mode==='joined'?2:1,combo:0,ang:0};check(mode+' combat art is not substituted with claws',ownerHeroDrawSwing(player,ctx)===false);}
   for(const state of ['wall_cling','skid','heal','song']){reset();check(state+' retains its unavailable authored sequence',ownerHeroDrawMovement(player,ctx,state)===false);}
   reset();player.idleT=5.1;check('existing five-second Yalla/fidget is retained',ownerHeroDrawMovement(player,ctx,'idle')===false);
   for(const [clip,n] of [['heavy',13],['death',4],['death',5],['plunge',5]])check('FX-only '+clip+':'+n+' cannot replace body',ownerHeroFrame(player,ctx,clip,n)===false);
   reset();G.state='DEAD';G.deadT=1.2;player.dead=true;check('death uses existing timer and retains a body',ownerHeroDrawDeath(player,ctx)&&G.heroDrawn==='owner:death:3',G.heroDrawn);G.state='PLAY';player.dead=false;
   // Record the actual new idle silhouette, not the size of a transparent cell.
   reset();player.anim=0;ctx.setTransform(1,0,0,1,128,220);ctx.clearRect(-128,-220,256,256);player.drawRoboPlate(ctx,false);
   const px=ctx.getImageData(0,0,256,256).data;let top=256,bottom=0,n=0;for(let i=3;i<px.length;i+=4)if(px[i]>180){const y=Math.floor((i>>2)/256);top=Math.min(top,y);bottom=Math.max(bottom,y);n++;}
   check('new idle has an opaque, bounded silhouette',n>300&&bottom-top>=35&&bottom-top<=75,{height:bottom-top+1,pixels:n});
   result.checks=checks;return result;
 },record);
 evidence.errors=errors;evidence.gaitPixels=evidence.gaitPixels.map(hash);
 for(const [k,v] of Object.entries(evidence.methods))evidence.methods[k]=hash(v);
 if(record){fs.writeFileSync(out+'/baseline.json',JSON.stringify(evidence,null,2));console.log('Recorded original gait pixels and 960 input frames.');}
 else {
   const old=JSON.parse(fs.readFileSync(out+'/baseline.json','utf8'));
   assert.deepEqual(evidence.methods,old.methods,'Gameplay methods changed');
   assert.deepEqual(evidence.gait,old.gait,'Gait timing/config changed');
   assert.deepEqual(evidence.gaitPixels,old.gaitPixels,'Existing walk/run rendered pixels changed');
   assert.deepEqual(evidence.traces,old.traces,'Input/movement/combat trace changed');
   for(const c of evidence.checks)console.log((c.ok?'PASS ':'FAIL ')+c.name+' '+JSON.stringify(c.detail||''));
   evidence.protected={simulation_methods_identical:true,gait_configuration_identical:true,gait_pixel_samples:32,input_frames_identical:960,asset_sha256:protectedGait};
   fs.writeFileSync(out+'/verified.json',JSON.stringify(evidence,null,2));
   assert(evidence.checks.every(c=>c.ok),'Owner artwork render check failed');
   // Game-scale evidence is captured from the actual world renderer.
   for(const [name,state] of [['idle',{}],['charge',{chargeT:.5}],['jab',{swingVis:{t:.12,t0:.24,combo:0,wield:0,weaponMode:'claws',ang:0}}]]){
     await page.evaluate(state=>{G.state='PLAY';G.artProbe=0;G.wake=null;G.dialog=null;G.meet=null;G.trans=null;Object.assign(player,{dead:false,vx:0,vy:0,on:true,chargeT:0,landT:0,hurtPoseT:0,swingVis:null,swing:null,idleT:0,mood:null,moodT:0,face:1,faceVis:1,...state});updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);draw(5000);},state);
     await page.screenshot({path:out+'/'+name+'.png'});
   }
 }
 await browser.close();assert.equal(errors.length,0,JSON.stringify(errors));
})().catch(e=>{console.error(e);process.exit(1);});
