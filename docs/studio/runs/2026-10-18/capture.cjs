// Staged gameplay-size art/VFX evidence. No traversal certificate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../../..'),{chromium}=require(path.join(root,'node_modules/playwright'));
const out=path.join(__dirname,'graphics');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=spawn(process.execPath,['tests/serve.cjs'],{cwd:root,stdio:'ignore'});let browser;try{
 await new Promise(r=>setTimeout(r,500));browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof ghStep==='function');
 await p.evaluate(async()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,gateOpened:1,heal:1,ratchetRepaired:1,ratchetSpareGiven:1,nfMeet:1,nfBreak:1,bossChime:1,sageTame_GA1D:1});startGame(s);for(const k of Object.keys(MEDIA_SRC.images))mediaFetch(k,1);await new Promise(r=>setTimeout(r,6500));
  window.cleanFrame=()=>{G.state='PLAY';G.wake=G.tut=G.dialog=G.item=G.cut=G.meet=G.bossEntry=G.panel=null;G.panels=null;G.toasts=[];G.ghHold=G.ghCard=null;G.roomTitle=0;G.impact=null;G.flash=0;cam.shake=0;};});
 const data={scope:'STAGED 844x390; injected save/room/body movement. Not uninterrupted gameplay.',build:await p.evaluate(()=>BUILD_ID),errors,samples:[]};
 await p.evaluate(()=>{loadRoom('A2');cleanFrame();const e=G.enemies.find(e=>isWolf(e));if(!e)throw Error('Missing A2 wolf');window.subject=e;player.x=e.x-160;player.y=e.y+e.h-player.h;cam.x=e.x-430;cam.y=e.y-260;cam.zoom=worldZoom();draw(performance.now());});
 await p.screenshot({path:path.join(out,'wolf-live.png')});
 await p.evaluate(()=>{subject.disabled=true;subject.vx=subject.vy=0;draw(performance.now());});await p.screenshot({path:path.join(out,'wolf-bound.png')});
 await p.evaluate(()=>{loadRoom('CV3');cleanFrame();G.enemies=[];const b=G.boss;if(!b||b.kind!=='horn')throw Error('Missing GRAVEHORN');if(!b.missiles)ghInit(b);b.st='idle';b.t=99;b.dark=0;b.hideBar=false;b.fade=0;b.x=700-b.w/2;b.y=512-b.h;b.vx=b.vy=0;b.feet=null;b.phase=1;b.hp=b.hpMax;b.stagT=0;player.x=400;player.y=512-player.h;cam.x=120;cam.y=220;cam.zoom=worldZoom();});
 for(const face of [-1,1])for(const phase of [1,2]){
  const sample=await p.evaluate(({face,phase})=>{const b=G.boss;infEyeClearOwner(b);b.face=b.faceVis=face;b.phase=phase;b.hornBig=phase===1;b.hornSmall=phase===1;b.st='idle';b.vx=face*180;
   for(let i=0;i<35;i++){b.x+=face*2;b.anim=(b.anim||0)+1/60;infEyeUpdate(1/60);draw(performance.now());}
   const moving=infEyeStats(),anchor=b._eyeN?[b._eyeW[0],b._eyeW[1]]:null;
   return {face,phase,horns:b.hornBig,classification:infEyeClass(b),anchor,moving:{live:moving.live,red:moving.red,purple:moving.purple}};
  },{face,phase});
  await p.screenshot({path:path.join(out,`gravehorn-${face}-${phase}-moving.png`)});
  sample.still=await p.evaluate(()=>{const b=G.boss;b.vx=0;for(let i=0;i<150;i++){infEyeUpdate(1/60);draw(performance.now());}return {live:infEyeParticles(b).length,glow:b._eyeN>0};});
  assert.equal(sample.classification,'purple');assert.ok(sample.anchor);assert.ok(sample.moving.purple>0);assert.equal(sample.moving.red,0);assert.equal(sample.still.live,0);data.samples.push(sample);
 }
 await p.evaluate(()=>{G.save.flags.crystal=1;loadRoom('A4');cleanFrame();G.boss.meet=false;G.toasts=[];G.toast(t('daze_open'),'boss-opening');G.toast('earned reward');purificationBegin(G.boss);G.purification.armed=true;G.purification.hold=.8;draw(performance.now());});
 await p.screenshot({path:path.join(out,'purification-gather.png')});data.ritual=await p.evaluate(()=>({phase:G.purification.phase,toasts:G.toasts}));
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data));assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
