const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
 const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof YardWinch==='function');
 const result=await p.evaluate(async()=>{
   window.requestAnimationFrame=()=>0;
   const checks=[],check=(name,v)=>{if(!v)throw Error(name);checks.push(name);};
   const sv=newSave(1);sv.time=99;sv.flags.woke=sv.flags.tut=sv.flags.sawScrap=1;startGame(sv);
   const stage=()=>{loadRoom('A0');G.state='PLAY';G.wake=G.cut=G.trans=G.dialog=null;};stage();
   let e=G.enemies.find(e=>e.mechanism==='winch');check('actual opening room spawns modular winch',e instanceof YardWinch);
   await Promise.all(['yardWinchBase','yardWinchArm'].map(async k=>{mediaFetch(k);for(let i=0;i<200;i++){const im=MEDIA_IMG[k];if(im&&im.complete&&im.naturalWidth)return;await new Promise(r=>setTimeout(r,20));}throw Error('missing '+k)}));
   e.calm=false;for(let i=0;i<60;i++)e.update(1/60);
   player.x=e.x-85;player.y=e.y+e.h-player.h;player.cores=player.maxCores();player.iT=0;
   e.phase='tell';e.phaseT=0;const hp=player.cores;
   for(let i=0;i<35;i++)e.update(1/60);
   check('warning is harmless and lasts at least half a second',player.cores===hp&&e.phase==='tell');
   e.phase='sweep';e.phaseT=0.28;e.armAngle=-0.55+1.2*(0.28/0.32);e.sweepHit=false;
   const tip=e.armPoint();player.x=tip.x-player.w/2;player.y=tip.y-player.h/2;e.update(1/60);
   check('damaging sweep reaches the rendered arm tip',player.cores===hp-1);
   e.phase='recover';e.phaseT=0;player.iT=0;const recoverHP=player.cores;for(let i=0;i<50;i++)e.update(1/60);
   check('recovery cannot deal contact damage',player.cores===recoverHP);
   e.phase='idle';e.phaseT=0;player.x=e.x-player.w+6;player.y=e.y+e.h-player.h;player.face=1;player.on=true;
   const before=G.save.scrap;
   for(let i=0;i<280&&!e.disabled;i++){
     player.x=e.x-player.w+6;player.y=e.y+e.h-player.h;player.vx=player.vy=0;player.on=true;
     if(i%40===0){keys.KeyX=true;keysP.KeyX=true;}if(i%40===1)delete keys.KeyX;
     player.update(1/60);delete keysP.KeyX;
   }
   for(const k in keys)delete keys[k];
   check('real claw inputs isolate motor and retain the machine',e.disabled&&!e.dead&&!e.motorEnabled);
   check('first disable pays the tutorial salvage once',G.save.scrap===before+12);
   const angle=e.armAngle;e.update(0.2);e.die();check('disabled mechanism stays still without repeat rewards',e.armAngle===angle&&G.save.scrap===before+12);
   function colors(){const cv=document.createElement('canvas');cv.width=1000;cv.height=650;const c=cv.getContext('2d');c.translate(450-e.x,-100);e.draw(c);const d=c.getImageData(0,0,1000,650).data;let red=0,cyan=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<180)continue;if(d[i]>180&&d[i+1]<110&&d[i+2]<100)red++;if(d[i]<130&&d[i+1]>170&&d[i+2]>180)cyan++;}return{red,cyan};}
   const disabledColor=colors();check('disabled control remains visibly red',disabledColor.red>15);
   persist();startGame(JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))));stage();e=G.enemies.find(e=>e.mechanism==='winch');e.update(1/60);
   check('disabled state and pivot survive reload',e.disabled&&e.armAngle===angle);
   player.x=e.x+e.w/2-player.w/2;player.y=e.y+e.h-player.h;doInteract(findNear());check('cleansing requires the earned blade',!e.cleanseT);
   // the refusal is a card she reads (js/overlay.js storyNote, 2026-10-09); she closes it before trying again
   if(G.dialog&&G.dialog.note){G.dialog=null;G.state='PLAY';}
   G.save.flags.crystal=1;doInteract(findNear());check('blade enables the actual interaction',e.cleanseT===0.65);
   player.x+=200;e.update(0.1);check('walking away cancels cleansing',e.cleanseT===0&&e.disabled);
   player.x=e.x+e.w/2-player.w/2;doInteract(findNear());for(let i=0;i<45;i++)e.update(1/60);
   check('completed interaction changes persistent control state',e.rescued&&!e.disabled&&G.save.rescues[e.storyKey]==='rescued');
   const cleanColor=colors();check('cleansed receiver is cyan',cleanColor.cyan>15&&cleanColor.red<disabledColor.red/2);
   const safeHP=player.cores;for(let i=0;i<120;i++)e.update(1/60);check('clean mechanism cannot hurt hero',player.cores===safeHP);
   persist();startGame(JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme))));stage();e=G.enemies.find(e=>e.mechanism==='winch');check('cleansed machine stays present after reload',e.rescued&&!e.dead);
   player.x=e.x-80;player.y=e.y+e.h-player.h;
   cam.x=e.x+e.w/2-480;cam.y=e.y+e.h-270-150/worldZoom();
   G.state='PLAY';G.roomTitle=null;draw();
   return{checks,disabledColor,cleanColor,build:window.BUILD_ID};
 });
 fs.mkdirSync('release-evidence',{recursive:true});await p.screenshot({path:'release-evidence/winch-cleansed.png'});
 assert.deepEqual(errors,[]);console.log('PASS winch integration',JSON.stringify(result,null,2));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
