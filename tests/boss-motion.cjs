'use strict';
// The real compiled game: render frequency may not advance a boss's pose,
// consume a recoil, duplicate particles, or decide where a pounce has landed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const baseline=process.argv.includes('--baseline');
const out=process.env.EVIDENCE_DIR||'release-evidence/boss-motion';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const url=process.env.GAME_URL||'http://127.0.0.1:8220/index.html';
  if(baseline){const html=fs.readFileSync(process.env.BASELINE_HTML||'/home/user/clawbyte-boss-pass/base/index.html','utf8');await p.route(url,r=>r.fulfill({status:200,contentType:'text/html',body:html}));}
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof startGame==='function');
  await p.evaluate(()=>{
    window.requestAnimationFrame=()=>0;
    window.__bossTestArtKeys=[...new Set([
      ...Object.values(BOSS_ART),...ALPHA_STRIPS,...BEAST_STRIPS,
      ...Object.values(MINI_ART).flatMap(a=>[a.rest,a.warn]),
      ...Object.values(MINI_STRIP).flatMap(a=>Object.values(a).map(s=>s.key))
    ])];
    for(const key of __bossTestArtKeys)mediaFetch(key,true);
  });
  await p.waitForFunction(()=>__bossTestArtKeys.every(k=>MEDIA_RAW[k]?.complete&&MEDIA_RAW[k].naturalWidth),null,{timeout:60000});
  await p.waitForTimeout(80);
  const result=await p.evaluate(()=>{
   const checks=[],check=(name,ok,detail)=>checks.push({name,pass:!!ok,detail});
   const save=newSave(1);save.time=99;save.flags.tut=save.flags.woke=1;startGame(save);
   const rooms={glitch:'A4',alpha:'A10',brood:'B4',atlas:'C3',zero:'D3',prism:'X1',mother:'E3',horn:'CV3',chime:'A9',carrier:'B8',moth:'C7',lattice:'D6',lens:'E6'};
   const realRandom=Math.random;Math.random=()=>.5;
   const realSfx=sfx;const sounds=[];sfx=(key,...args)=>{sounds.push(key);};
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const ctx=canvas.getContext('2d');
   const round=v=>typeof v==='number'?Math.round(v*1e7)/1e7:v;
   function stage(kind){
    loadRoom(rooms[kind]);G.state='PLAY';G.wake=G.dialog=G.cut=G.trans=G.meet=G.bossEntry=G.gateWalk=null;G.enemies=[];G.projs=[];G.parts=[];parts=[];G.hitStop=0;G.flash=0;G.darkT=0;G.forkBoss=null;G.finish=null;G.offer=null;
    const b=new Boss(kind,420,(G.roomDef.h-2)*TILE);G.boss=b;b.st='idle';b.t=5;b.hp=b.hpMax;b.phase=1;
    player.x=80;player.y=(G.roomDef.h-2)*TILE-player.h;player.dead=false;player.cores=999;player.iT=999;player.on=true;player.vx=player.vy=0;
    cam.shake=0;G.artProbe=false;FOE_READ.sil=false;return b;
   }
   function snap(b){const o={st:b.st,t:round(b.t),x:round(b.x),y:round(b.y),hp:round(b.hp),cabA:b.cabA,cabV:b.cabV,stT:b._stT,tell:b._tellDur,glcGait:b.glcGait,glcRecoil:b.glcRecoil,glcStamp:b.glcStamp,glcSettle:b.glcSettle,glcDeathT:b.glcDeathT,glcShatter:b.glcShatter,fc:b.fc,mv:b._mv,stride:b.przStride};return JSON.parse(JSON.stringify(o,(k,v)=>round(v)));}
   const cadence={};
   try{
    for(const kind of ['brood','zero','atlas','mother']){
     const samples=[];
     for(const every of [1,6,0]){
      const b=stage(kind);
      for(let i=0;i<150;i++){
       // Authored mid-action states rather than an inaccessible/dead fixture.
       if(i===50){if(kind==='zero'){b.st='lancewarn';b.t=.3;}else if(kind==='atlas'){b.st='slamwarn';b.t=.3;}}
       b.update(1/60);
       if(every&&i%every===0){ctx.clearRect(0,0,960,540);b.draw(ctx);}
      }
      samples.push({drawEvery:every,snapshot:snap(b)});
     }
     cadence[kind]=samples;
     check(kind+': secondary motion is identical with full, sparse or no rendering',JSON.stringify(samples[0].snapshot)===JSON.stringify(samples[1].snapshot)&&JSON.stringify(samples[0].snapshot)===JSON.stringify(samples[2].snapshot),samples);
     const b=stage(kind);for(let i=0;i<20;i++)b.update(1/60);
     const before=snap(b),particles=parts.length,shake=cam.shake,count=sounds.length;
     for(let i=0;i<5;i++)foeDraw(ctx,b);
     check(kind+': outline and repeated body draws cannot advance motion',JSON.stringify(before)===JSON.stringify(snap(b)),{before,after:snap(b)});
     check(kind+': rendering cannot emit particles, sounds or camera shake',parts.length===particles&&cam.shake===shake&&sounds.length===count,{particlesBefore:particles,particlesAfter:parts.length,shakeBefore:shake,shakeAfter:cam.shake});
    }
    // A confirmed strike must not turn armour into a translucent ghost.
    // Compare common, opaque anatomy pixels of a fixed pose, not glow edges.
    for(const kind of ['glitch','alpha','brood','atlas','zero','prism','mother','chime','carrier','moth','lattice','lens']){
      const b=stage(kind);b.st='idle';b.t=3;b.anim=1;b.hurtT=0;b._lean=0;b._squashT=0;
      b.x=440-b.w/2;b.y=360-b.h;G.artProbe=true;
      ctx.clearRect(0,0,960,540);b.draw(ctx);const normal=ctx.getImageData(0,0,960,540).data;
      b.hurtT=.12;ctx.clearRect(0,0,960,540);b.draw(ctx);const hit=ctx.getImageData(0,0,960,540).data;
      const samples=[];for(let i=3;i<normal.length;i+=4)if(normal[i]>=250&&hit[i]>15)samples.push(hit[i]/normal[i]);
      samples.sort((a,z)=>a-z);const median=samples[Math.floor(samples.length/2)]||0;
      check(kind+': struck armour remains solid',samples.length>100&&median>=.95,{samples:samples.length,medianOpacity:median});G.artProbe=false;
    }
    // Real release states, not hand-setting an FX clock to make a picture.
    for(const move of ['lancewarn','novawarn']){
      const b=stage('zero');b.st=move;b.t=.01;b.azCD=b.dcCD=99;b.phase=1;
      b.update(1/30);
      const pulse=move==='lancewarn'?b.glcRecoil:b.glcStamp;
      check('GLACIERE '+move+' triggers follow-through in actual recovery',b.st==='recover'&&pulse>.9,{state:b.st,pulse,projectiles:G.projs.length,nova:!!b.nova});
    }
    const b=stage('prism');b.x=22*TILE-b.w/2;b.y=8*TILE-b.h-3;b.vx=0;b.vy=160;b.st='pounce';b.t=1;
    b.update(1/30);
    check('PRISM lands and recovers on the actual elevated X1 platform',b.st==='rest'&&Math.abs(b.y+b.h-8*TILE)<.1,{state:b.st,feet:b.y+b.h,expected:8*TILE});
    const air=stage('prism');air.x=29*TILE-air.w/2;air.y=14*TILE+2-air.h;air.vx=0;air.vy=160;air.st='pounce';air.t=1;
    air.update(1/60);
    check('PRISM does not enter recovery in mid-air at the old row-14 threshold',air.st==='pounce'&&air.vy>0,{state:air.st,feet:air.y+air.h,vy:air.vy});
    const clipBoss=stage('prism');clipBoss.vx=clipBoss.vy=0;clipBoss.anim=1;
    const tells={};for(const st of ['dashwarn','pouncewarn','spreadwarn']){clipBoss.st=st;tells[st]=JSON.stringify(przClip(clipBoss));}
    check('PRISM tells select three different authored silhouettes',new Set(Object.values(tells)).size===3,tells);
    clipBoss.st='pounce';clipBoss.vy=-300;clipBoss.vx=380;const flight=[];
    for(const t of [.1,.22,.37,.55]){clipBoss.anim=t;flight.push(JSON.stringify(przClip(clipBoss)));}
    check('airborne pounce holds its flight pose instead of cycling grounded running legs',new Set(flight).size===1,flight);
    // A fixed attack drawing makes foot registration measurable without mixing
    // the natural shape changes of different cells into the same statistic.
    const foot=[];clipBoss.st='dashslash';clipBoss.x=440;clipBoss.y=350;clipBoss.vx=340;clipBoss.vy=0;clipBoss.face=clipBoss.faceVis=1;clipBoss.hurtT=0;clipBoss._lean=0;clipBoss._squashT=0;
    for(const t of [0,.3,.6,.9,1.2,1.5,1.8]){
      clipBoss.anim=t;ctx.clearRect(0,0,960,540);drawPrismSheet(ctx,clipBoss);
      const data=ctx.getImageData(0,0,960,540).data;let bottom=0;
      for(let i=3;i<data.length;i+=4)if(data[i]>170)bottom=Math.max(bottom,Math.floor((i>>2)/960));foot.push(bottom);
    }
    check('PRISM breathing remains planted rather than translating the entire sprite',Math.max(...foot)-Math.min(...foot)<=1,foot);
    // Test transition entry, not merely that a regex names a cue.
    const warn=stage('prism');warn.t=0;player.x=warn.cx()+100;sounds.length=0;
    warn.update(1/30);const cue=warn.tellCue(),first=sounds.filter(x=>x===cue).length,entered=warn.st;
    const stored=warn._tellDur;sounds.length=0;warn.update(1/30);for(let i=0;i<3;i++)warn.draw(ctx);
    check('warning sound starts in the same simulation step as the tell',TELL_ST.test(entered)&&first===1,{entered,cue,count:first});
    check('the next update and extra draws do not repeat the entry cue',sounds.filter(x=>x===cue).length===0,sounds);
    check('warning duration is captured on entry rather than by first render',stored>0&&stored===warn._tellDur,{stored,current:warn._tellDur});
    // Ambient and recoil state must work when the relevant art is not decoded.
    const saved=MEDIA_RAW.glaciereParts;delete MEDIA_RAW.glaciereParts;
    const unseen=stage('zero');for(let i=0;i<30;i++)unseen.update(1/60);MEDIA_RAW.glaciereParts=saved;
    check('visual simulation continues without a decoded sprite',unseen.glcGait>0,{gait:unseen.glcGait});
    // The inherited hero and damage methods are included in the report so
    // the before/after report can prove this is not a disguised physics retune.
    return {build:BUILD_ID,revision:typeof BOSS_MOTION_REVISION==='undefined'?null:BOSS_MOTION_REVISION,checks,cadence,prismTells:tells,hero:{update:Player.prototype.update.toString(),state:Player.prototype.heroState.toString(),collision:moveEnt.toString()},roomRoster:rooms};
   }finally{Math.random=realRandom;sfx=realSfx;}
  });
  result.errors=errors;
  for(const [k,v] of Object.entries(result.hero))result.hero[k]=crypto.createHash('sha256').update(v).digest('hex');
  result.checks.push({name:'no runtime errors in the real browser',pass:errors.length===0,detail:errors});
  const prior=path.join(out,'baseline.json');
  if(!baseline&&fs.existsSync(prior)){
    const before=JSON.parse(fs.readFileSync(prior,'utf8'));
    result.checks.push({name:'hero movement, state selection and collision methods are unchanged',pass:JSON.stringify(before.hero)===JSON.stringify(result.hero),detail:{before:before.hero,after:result.hero}});
  }
  const file=path.join(out,baseline?'baseline.json':'verified.json');fs.writeFileSync(file,JSON.stringify(result,null,2));
  for(const c of result.checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);
  console.log(JSON.stringify({build:result.build,passed:result.checks.filter(c=>c.pass).length,total:result.checks.length,baseline}));
  if(!baseline)assert(result.checks.every(c=>c.pass),'Boss motion acceptance failed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
