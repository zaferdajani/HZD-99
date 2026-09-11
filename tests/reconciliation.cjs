'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const expected={
 'assets/sfx/vox/hzd_atk2.wav':'be7ea38cb21c4ae85292f83a7d2307b3f93bc9dcfc4e8cf4f1bb76b8ec1358c3',
 'assets/sfx/vox/hzd_yalla.wav':'7eb1d2ba0ea67fa0548ee98677293390c1bd804d03ce332a7abedb0a174511ca'
};
for(const [f,h] of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'),h,'preserve reviewed sound cleanup: '+f);
assert(!read('js/mobility_fix.js').includes('Player.prototype.draw ='),'duplicate charge renderer retired');
assert(!/\b(draw|findNear|clearP|doInteract)\s*=\s*function/.test(read('js/data_conduits_npc_fix.js')),'Mono uses named integration hooks');
const order=JSON.parse(read('source-files.json'));assert.equal(new Set(order).size,order.length,'every runtime module is compiled once');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>typeof startGame==='function'&&typeof heroMotionMissing==='function'&&heroMotionMissing().length===0);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(80);
 const evidence=await p.evaluate(()=>{
   const checks=[],check=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
   const save=newSave(1);save.flags.tut=1;save.flags.woke=1;save.time=99;startGame(save);loadRoom('B3B');
   G.state='PLAY';G.dialog=null;G.wake=null;G.meet=null;G.cut=null;G.bossEntry=null;G.gateWalk=null;G.trans=null;G.enemies=[];
   const mono=G.statics.find(s=>s.type==='npc'&&s.extra==='mono');
   check('real Data Conduits NPC exists',!!mono);
   const statics=G.statics;G.statics=[mono];player.x=mono.x+mono.w/2+80-player.w/2;player.y=mono.y+mono.h/2-player.h/2;
   check('Mono resolves beyond generic 46-unit interaction range',findNear()===mono);
   player.x+=130;check('Mono does not activate from arbitrary distance',monoNearTarget()===null);player.x-=130;
   const savedDraw=drawMonoWorldAccent,savedPresent=presentWorld,savedClear=c.clearRect;let order=[],calls=0,projection=0;
   drawMonoWorldAccent=function(ctx,target){order.push('accent');calls++;return savedDraw(ctx,target);};
   presentWorld=function(){order.push('projection');projection++;return savedPresent();};
   c.clearRect=function(...args){order.push('clear');return savedClear.apply(this,args);};
   try {draw(5000);}finally{drawMonoWorldAccent=savedDraw;presentWorld=savedPresent;c.clearRect=savedClear;G.statics=statics;}
   check('Mono light is drawn after clear, before one world projection',calls===1&&projection===1&&order.indexOf('clear')<order.indexOf('accent')&&order.indexOf('accent')<order.indexOf('projection'),order);
   check('charge drawing no longer has a second runtime installer',!Player.prototype.__chargeEffectsInstalled);
   check('latest smaller sizing is preserved, not inferred from test constants',HERO_SCREEN_SCALE===1.335&&PRESENTATION.explorationZoom===1.9&&PRESENTATION.heroVisualScale===1.335,{actor:HERO_SCREEN_SCALE,zoom:PRESENTATION.explorationZoom});
   const cv2=document.createElement('canvas');cv2.width=300;cv2.height=300;const cx=cv2.getContext('2d');let scale;
   const di=cx.drawImage;cx.drawImage=function(...args){scale=this.getTransform().a;return di.apply(this,args);};cx.translate(150,230);
   Object.assign(player,{vx:340,vy:0,on:true,chargeT:1,landT:.2,skidT:0,hurtPoseT:0,healT:0,songT:0,swingVis:null,swirlT:0,dashT:0,wallSlide:0,flipT:0,boostT:0});
   player.drawRoboPlate(cx,true);
   check('one actor multiplier is actually applied',Math.abs(scale-1.335)<1e-5,scale);
   check('combined charge and landing renders the running strip',/^gaitRun:/.test(G.heroDrawn),G.heroDrawn);
   // The staging script proposed protecting a held jump. Verify that the
   // current single controller already preserves it, rather than applying an
   // obsolete patch against a second copy of the policy.
   loadRoom('W2');G.state='PLAY';G.dialog=null;G.wake=null;G.cut=null;G.gateWalk=null;G.save.flags.tut=0;
   G.tut={i:TUT_STEPS.findIndex(s=>s.id==='jump'),jumps:1,hold:.4,jumpShown:true};player.on=false;player.vy=-500;
   check('accepted jump keeps held input and horizontal air control',tutorialAllows('JUMP')&&tutorialAllows('RIGHT')&&!tutorialContext().ready);
   return {build:BUILD_ID,checks};
 });
 assert.equal(errors.length,0,JSON.stringify(errors));
 for(const c of evidence.checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+' '+JSON.stringify(c.detail||''));
 fs.mkdirSync(path.join(root,'release-evidence'),{recursive:true});fs.writeFileSync(path.join(root,'release-evidence/reconciliation.json'),JSON.stringify({...evidence,errors},null,2));
 await browser.close();assert(evidence.checks.every(c=>c.pass),'reconciliation checks failed');
})().catch(e=>{console.error(e);process.exitCode=1;});
