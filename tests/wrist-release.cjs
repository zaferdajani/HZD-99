'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root='release-evidence/finish';fs.mkdirSync(root,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
 await page.waitForFunction(()=>typeof startGame==='function'&&typeof ratchetReleaseStart==='function');
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;mediaFetch('ratchetWristRelease',true);mediaFetch('swingUppercut',true)});
 await page.waitForFunction(()=>ratchetReleaseImage()&&MEDIA_RAW.swingUppercut&&MEDIA_RAW.swingUppercut.complete&&heroMotionMissing().length===0);
 await page.waitForTimeout(80);
 async function stage(){return page.evaluate(()=>{
   if(ratchetReleaseSession)ratchetReleaseFinish(false);
   const sv=newSave(1);sv.time=99;sv.flags.woke=sv.flags.tut=1;
   startGame(sv);loadRoom('A0B');G.state='PLAY';G.wake=G.cut=G.dialog=G.meet=G.trans=G.gateWalk=G.bossEntry=null;G.enemies=[];G.boss=null;
   const npc=G.statics.find(n=>n.type==='npc'&&n.extra==='ratchet');
   player.x=npc.x-42;player.y=npc.y+npc.h-player.h;player.on=true;player.vx=player.vy=0;
   PURIFY_VID.revive=null;G.save.flags['on_'+npcKey(npc)]=1;G.save.flags.ratchetRepaired=1;
   window.__rrDone=0;window.__rrNpc=npc;return {x:npc.x,y:npc.y,w:npc.w,h:npc.h};
 });}
 const checks=[];const ok=(name,value,detail)=>{checks.push({name,pass:!!value,detail});assert(value,name+' '+JSON.stringify(detail||''));};
 const npc=await stage();
 let a=await page.evaluate(()=>{
   const before={cores:player.cores,scrap:G.save.scrap,cell:invCount('ratchetCell'),spare:invCount('batt'),x:player.x};
   const started=ratchetReleaseStart(__rrNpc,()=>{__rrDone++});const seen=[],pixels=[],bounds=[];
   const cv2=document.createElement('canvas');cv2.width=300;cv2.height=220;const cx=cv2.getContext('2d');
   for(let n=0;n<90&&ratchetReleaseSession;n++){
    update(1/60);clearP();if(!ratchetReleaseSession)break;
    const frame=ratchetReleaseSession.frame;
    if(!seen.includes(frame)){
     seen.push(frame);cx.setTransform(1,0,0,1,150-__rrNpc.x-__rrNpc.w/2,190-__rrNpc.y-__rrNpc.h);cx.clearRect(-1000,-1000,2000,2000);
     drawTinker(cx,__rrNpc,false);if(frame===1)draw(5000);const data=cx.getImageData(0,0,300,220).data;let count=0,top=220,bottom=0;
     for(let i=3;i<data.length;i+=4)if(data[i]>160){count++;const y=Math.floor((i>>2)/300);top=Math.min(top,y);bottom=Math.max(bottom,y)}
     pixels.push(count);bounds.push({top,bottom,renderer:G.tinkerFrame});
    }
   }
   return {started,seen,pixels,bounds,before,after:{cores:player.cores,scrap:G.save.scrap,cell:invCount('ratchetCell'),spare:invCount('batt')},done:__rrDone,state:G.state,flag:G.save.flags.ratchetReleased,pending:G.save.flags.ratchetReleasePending||0,controls:!!document.querySelector('#ratchet-release-controls'),contact:G.ratchetWristContact};
 });
 ok('all four supplied poses are drawn by the actual NPC renderer',a.started&&a.seen.join(',')==='0,1,2,3'&&a.pixels.every(v=>v>150),a);
 ok('scene ends once, clears controls, and records completion',a.done===1&&a.state==='PLAY'&&a.flag===1&&!a.pending&&!a.controls,a);
 ok('reaction is not a damage or reward event',Object.keys(a.after).every(k=>a.after[k]===a.before[k]),a.after);
 ok('contact uses the rendered hand anchor',a.contact&&a.contact.error<4,a.contact);
 ok('authored feet stay on one floor across all four poses',Math.max(...a.bounds.map(b=>b.bottom))-Math.min(...a.bounds.map(b=>b.bottom))<=2,a.bounds);
 ok('completed save cannot replay the first awakening reaction',await page.evaluate(()=>ratchetReleaseStart(__rrNpc,()=>{})===false));
 for(const key of ['Escape','GP_BACK','VBACK']){
  await stage();await page.evaluate(()=>ratchetReleaseStart(__rrNpc,()=>__rrDone++));
  if(key==='Escape'){await page.keyboard.press('Escape');}else await page.evaluate(key=>{keysP[key]=1;update(1/60);clearP();},key);
  ok(key+' exits in one action, with no menu/resume loop',await page.evaluate(()=>!ratchetReleaseSession&&G.state==='PLAY'&&__rrDone===1));
 }
 await stage();await page.evaluate(()=>ratchetReleaseStart(__rrNpc,()=>__rrDone++));
 await page.locator('#ratchet-release-controls button').click();
 ok('touch/click Continue cannot leak into the next conversation',await page.evaluate(()=>__rrDone===1&&!ratchetReleaseSession&&Object.values(keysP).every(v=>!v)));
 await stage();await page.evaluate(()=>{ratchetReleaseStart(__rrNpc,()=>__rrDone++);update(.05);loadRoom('A1');});
 ok('room changes remove controls and leave no stale callback',await page.evaluate(()=>G.state==='PLAY'&&!ratchetReleaseSession&&__rrDone===0&&!document.querySelector('#ratchet-release-controls')));
 await stage();await page.evaluate(()=>{ratchetReleaseStart(__rrNpc,()=>__rrDone++);update(.05);G.state='PAUSE';update(.05);G.state='PLAY';update(.05);});
 ok('pause/resume retains this scene rather than orphaning its controls',await page.evaluate(()=>G.state==='RATCHET_RELEASE'&&!!ratchetReleaseSession));
 await page.evaluate(()=>ratchetReleaseFinish(false));
 // A real repair completion must still consume one battery and give the same
 // story explanation/spare once; the scene is neither a new puzzle nor a gift.
 await stage();a=await page.evaluate(()=>{
  delete G.save.flags['on_'+npcKey(__rrNpc)];delete G.save.flags.ratchetRepaired;invAdd('ratchetCell');
  opRatchetRestored(__rrNpc);const began=G.state;for(let n=0;n<120&&G.state==='RATCHET_RELEASE';n++){update(1/60);clearP();}
  const told=G.state;let n=0;while(G.state==='DIALOG'&&n++<25){const f=G.dialog.onEnd;G.dialog=null;G.state='PLAY';if(f)f();}
  return {began,told,spare:invCount('batt'),cell:invCount('ratchetCell'),quest:qState('ratchet_forge'),sword:weaponOwned('single'),released:G.save.flags.ratchetReleased};
 });
 ok('earned repair runs wrist release before the existing explanation',a.began==='RATCHET_RELEASE'&&a.told==='DIALOG',a);
 ok('the original quest, battery and spare handoff are unchanged',a.cell===0&&a.spare===1&&a.quest==='active'&&!a.sword&&a.released===1,a);
 await stage();await page.route('**/*wrist*',r=>r.abort());
 a=await page.evaluate(()=>{
  const keep=MEDIA_RAW.ratchetWristRelease,low=window.LOWRES.ratchetWristRelease;
  delete MEDIA_RAW.ratchetWristRelease;delete window.LOWRES.ratchetWristRelease;MEDIA_PEND.ratchetWristRelease=1;
  ratchetReleaseStart(__rrNpc,()=>__rrDone++);for(let i=0;i<110&&ratchetReleaseSession;i++){update(1/60);clearP();}
  const result={done:__rrDone,state:G.state,controls:!!document.querySelector('#ratchet-release-controls')};
  MEDIA_RAW.ratchetWristRelease=keep;window.LOWRES.ratchetWristRelease=low;delete MEDIA_PEND.ratchetWristRelease;return result;
 });
 ok('failed artwork loading cannot trap the player',a.done===1&&a.state==='PLAY'&&!a.controls,a);await page.unroute('**/*wrist*');
 // A canceled DOM node cannot complete a later visit. Durable pending state
 // survives a restart, but its old callbacks and controls never survive it.
 await stage();a=await page.evaluate(()=>{
  ratchetReleaseStart(__rrNpc,()=>__rrDone++);const old=document.querySelector('#ratchet-release-controls button');
  ratchetReleaseFinish(false);ratchetReleaseStart(__rrNpc,()=>__rrDone++);old.click();
  return {active:!!ratchetReleaseSession,done:__rrDone};
 });ok('stale controls cannot complete a newer scene',a.active&&a.done===0,a);
 await stage();a=await page.evaluate(()=>{
  ratchetReleaseStart(__rrNpc,()=>__rrDone++);update(.05);persist();
  const saved=JSON.parse(localStorage.getItem(saveKeyFor('robo')));
  startGame(saved);loadRoom('A0B');G.state='PLAY';G.wake=G.cut=G.dialog=G.trans=G.gateWalk=null;
  const s=G.statics.find(n=>n.extra==='ratchet');player.x=s.x-42;player.y=s.y+s.h-player.h;player.on=true;
  const noOrphan=!ratchetReleaseSession&&!document.querySelector('#ratchet-release-controls');
  const resumed=opRatchet(s);const state=G.state;
  ratchetReleaseFinish(true);
  return {noOrphan,resumed,state,flag:G.save.flags.ratchetReleased,pending:G.save.flags.ratchetReleasePending||0,explain:G.state};
 });ok('saved interruption resumes at the NPC without duplicating completion',a.noOrphan&&a.resumed&&a.state==='RATCHET_RELEASE'&&a.flag===1&&!a.pending&&a.explain==='DIALOG',a);
 for(const side of [-1,1]){
  await stage();a=await page.evaluate(side=>{
   player.x=__rrNpc.x+__rrNpc.w/2+side*55-player.w/2;
   ratchetReleaseStart(__rrNpc,()=>{});for(let i=0;i<24;i++){update(1/60);clearP();}draw(8000);
   return {side,contact:G.ratchetWristContact,frame:G.tinkerFrame,hero:G.heroDrawn};
  },side);ok('contact remains aligned when approached from '+side,a.contact.error<4&&a.frame==='wrist-release:1'&&a.hero==='ratchet-reaction:3',a);
 }
 await stage();a=await page.evaluate(()=>{
  G.save.flags.tut=0;G.tut={i:TUT_STEPS.findIndex(s=>s.id==='repair'),hold:0};
  ratchetReleaseStart(__rrNpc,()=>__rrDone++);keysP.GP_BACK=1;update(1/60);clearP();
  return {done:__rrDone,state:G.state};
 });ok('active tutorial never intercepts the scene exit',a.done===1&&a.state==='PLAY',a);
 await stage();a=await page.evaluate(()=>{
  ratchetReleaseStart(__rrNpc,()=>{});update(.05);const elapsed=ratchetReleaseSession.t;
  suspendInput();for(let i=0;i<60;i++)update(1/60);const frozen=ratchetReleaseSession.t;resumeInput();update(.05);
  return {elapsed,frozen,resumed:ratchetReleaseSession.t};
 });ok('backgrounding freezes the reaction and resuming continues it',a.elapsed===a.frozen&&a.resumed>a.frozen,a);
 for(let k=0;k<4;k++){
  await stage();await page.evaluate(k=>{ratchetReleaseStart(__rrNpc,()=>{});const until=[.11,.40,.76,1.12][k];for(let n=0;n<Math.ceil(until*60);n++){update(1/60);clearP();}updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);draw(7000);},k);
  await page.screenshot({path:root+'/ratchet-wrist-'+k+'.png'});
 }
 ok('no browser errors',errors.length===0,errors);
 const result={build:await page.evaluate(()=>BUILD_ID),npc,checks,errors,notes:['Controller and touch aliases tested; not a physical-device certification.','Alpha/winch/story progression use the newer main implementation, not rejected September candidates.']};
 fs.writeFileSync(root+'/wrist-release.json',JSON.stringify(result,null,2));
 for(const c of checks)console.log('PASS '+c.name);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
