// Read-only staged rendering review. Does not certify traversal or fight outcome.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../../../../..');
const {chromium}=require(path.join(root,'node_modules/playwright'));
(async()=>{const server=spawn(process.execPath,['tests/serve.cjs'],{cwd:root,stdio:'ignore'});let browser;try{
 await new Promise(r=>setTimeout(r,500));browser=await chromium.launch({executablePath:'/tmp/clawbyte-browser'});
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof ghStep==='function');
 await p.evaluate(async()=>{window.requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,gateOpened:1,heal:1,ratchetRepaired:1,ratchetSpareGiven:1,nfMeet:1});startGame(s);for(const k of Object.keys(MEDIA_SRC.images))mediaFetch(k,1);await new Promise(r=>setTimeout(r,6000));});
 const data={scope:'Staged 844x390 gameplay rendering; injected save/positions/states, not real-input traversal',errors};
 data.a2=await p.evaluate(()=>{loadRoom('A2');G.state='PLAY';G.wake=G.tut=G.dialog=G.item=G.cut=G.meet=G.bossEntry=G.panel=null;G.panels=null;G.toasts=[];G.roomTitle=0;G.impact=null;G.flash=0;cam.shake=0;const e=G.enemies.find(e=>isWolf(e));if(!e)throw Error('No authored A2 wolf');player.x=e.x-160;player.y=e.y+e.h-player.h;player.on=true;cam.x=e.x-430;cam.y=e.y-260;cam.zoom=worldZoom();draw(performance.now());window.artWolf=e;return {wolf:{x:e.x,y:e.y,kind:e.kind,w:e.w,h:e.h},enemies:G.enemies.map(e=>({kind:e.kind,x:e.x,y:e.y})),build:typeof BUILD_ID!=='undefined'?BUILD_ID:null};});
 await p.screenshot({path:path.join(__dirname,'a2-live.png')});
 data.bound=await p.evaluate(()=>{artWolf.disabled=true;artWolf.vx=0;artWolf.vy=0;draw(performance.now());return {pose:wolfPose(artWolf,WOLF_ART,false),class:infEyeClass(artWolf),rim:foeReadOn(artWolf)};});
 await p.screenshot({path:path.join(__dirname,'a2-bound.png')});
 data.gh=await p.evaluate(()=>{loadRoom('CV3');G.state='PLAY';G.wake=G.tut=G.dialog=G.item=G.cut=G.meet=G.bossEntry=G.panel=null;G.panels=null;G.ghHold=G.ghCard=null;G.toasts=[];G.impact=null;G.flash=0;cam.shake=0;const b=G.boss;if(!b||b.kind!=='horn')throw Error('No gravehorn');if(!b.missiles)ghInit(b);b.st='idle';b.t=99;b.dark=0;b.hideBar=false;b.fade=0;b.x=700-b.w/2;b.y=512-b.h;b.vx=b.vy=0;b.face=b.faceVis=-1;b.feet=null;b.hornBig=b.hornSmall=true;b.phase=1;b.hp=b.hpMax;b.stagT=0;player.x=430;player.y=512-player.h;player.on=true;cam.x=120;cam.y=220;cam.zoom=worldZoom();draw(performance.now());return {class:infEyeClass(b),eye:b._eyeW,eyeN:b._eyeN,eyeDraw:b._eyeDraw,rendererSource:drawGravehorn.toString().includes("'#ff3b2a'")};});
 await p.screenshot({path:path.join(__dirname,'gravehorn-idle.png')});
 data.gh2=await p.evaluate(()=>{G.boss.phase=2;ghSet(G.boss,'kickprep',.5);G.boss._el=.2;G.boss.t=.3;draw(performance.now());return {class:infEyeClass(G.boss),eye:G.boss._eyeW,eyeN:G.boss._eyeN};});
 await p.screenshot({path:path.join(__dirname,'gravehorn-phase2-tell.png')});
 fs.writeFileSync(path.join(__dirname,'capture.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data));
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
