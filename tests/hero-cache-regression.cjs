const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
  const page=await browser.newPage(),requests=[];
  // Model a returning player's old cache: the unversioned URL carries a
  // different frame layout. The new page must never consume that response.
  await page.route('**/assets/characters/hero/swing/uppercut.webp*',r=>{
   requests.push(r.request().url());
   return new URL(r.request().url()).searchParams.has('v')?r.continue():r.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(__dirname,'../assets/characters/hero/idle.webp'))});
  });
  await page.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
  await page.waitForFunction(()=>typeof Player==='function');
  const result=await page.evaluate(async()=>{
   const wanted=['heroStates','hzdIdle','swingUppercut','swingClawJab','swingClaw1','swingSingleFx'];wanted.forEach(k=>mediaFetch(k,1));
   for(let n=0;n<100&&!wanted.every(k=>MEDIA_RAW[k]?.naturalWidth);n++)await new Promise(r=>setTimeout(r,100));
   if(!wanted.every(k=>MEDIA_RAW[k]?.naturalWidth))throw Error('Missing hero assets');
   const s=newSave(1);s.flags.tut=s.flags.woke=1;startGame(s);G.wake=null;G.bossEntry=null;G.enemies=[];tutAllows=()=>true;
   player=new Player(300,444);player.on=true;G.artProbe=true;
   const cv=document.createElement('canvas');cv.width=cv.height=400;const c=cv.getContext('2d');
   const third=[];
   for(let f=0;f<54;f++){
    const atk=[0,17,33].includes(f);keys[KEYB.ATK[0]]=keysP[KEYB.ATK[0]]=atk;
    player.update(1/60);c.clearRect(0,0,400,400);c.save();c.translate(100-player.x,230-player.y);player.draw(c);c.restore();
    if(player.swingVis?.combo===2)third.push(G.heroDrawn);
   }
   const idle=[];
   player.swingVis=null;player.scratchWake=null;player.vx=player.vy=0;player.on=true;player.landT=player.skidT=player.dashT=player.hurtPoseT=player.chargeT=0;
   for(const mood of ['calm','happy','determined','angry'])for(const face of [-1,1]){
    player.mood=mood;player.moodT=1;player.face=player.faceVis=face;
    for(let frame=0;frame<8;frame++){
     player.idleT=(frame+.1)/HERO_IDLE.fps;player.drawRoboPlate(c,false);idle.push({mood,face,frame,draw:G.heroDrawn});
    }
   }
   const real=MEDIA_RAW.swingUppercut;MEDIA_RAW.swingUppercut=MEDIA_RAW.hzdIdle;
   const rejected=!drawStripCell(c,'swingUppercut',2,6,0,0,60,false);MEDIA_RAW.swingUppercut=real;
   return{build:BUILD_ID,third,idle,rejected,size:[real.naturalWidth,real.naturalHeight],yalla:MEDIA_SRC.audio.hzd_yalla};
  });
  assert.equal(result.size[0]/result.size[1],6);
  assert.deepEqual([...new Set(result.third)],Array.from({length:6},(_,i)=>'swingUppercut:'+i));
  for(const x of result.idle)assert.equal(x.draw,'hzdIdle:'+x.frame,JSON.stringify(x));
  assert(result.rejected,'incompatible sheet must not be sliced');
  assert(requests.length&&requests.every(u=>new URL(u).searchParams.get('v')===result.build));
  assert(new URL(result.yalla,'http://localhost').searchParams.get('v')===result.build);
  console.log('PASS third-hit gameplay renders six complete cells; incompatible cached sheet rejected; all 64 idle frame/mood/facing cases keep supplied art; voice and art URLs match build');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
