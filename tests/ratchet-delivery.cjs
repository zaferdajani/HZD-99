'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const protectedFiles={
 'assets/characters/hero/gait/walk.webp':'4d71edab37a592ea3a8e50324d54babaed6bc0bbc4ad15ccdc360d31b961cb5d',
 'assets/characters/hero/gait/run.webp':'374a82f47d48a2fc7c895193a1140a28aea5516a270b0b270b098ac75386ff63',
 'assets/characters/npc/ratchet/work_loop.webp':'dec89eb49ff47706437e1fb0479c0efc07f2e152375bce56dec1a195746e85bb',
 'assets/sfx/vox/hzd_yalla.wav':'eec30e2cf0d307c6d56846bdd4c41a4a57d7ba3f42bb2cd17b1f431404c54630',
 'js/entities.js':'3bf80c03c58a93bf130ee05e4b8f4e9953eb6015e50f64ed4d1ee483af8e20e8',
 'js/audio.js':'d075ae0159eb7fb2f0b47630d011c409abd3f7f09e014f1ee0e47de35a155d82',
 'js/wolves.js':'dce07843434990ef78c08efa913738e4472755e8317ee386c1a6cf822b6bc47b',
 'js/world.js':'03fcb403f707193b149c90485eaa1cb18f66bb4c50bc94d77059ae3f24ffb2bc',
 'js/engine.js':'9421f86b41645836a5e24805ec90fc77214326327c0a81e29c1a77f74ac89438',
 'js/gear.js':'6720741d0df52a018aa0bf1a6aa0a2f6d943c12697dfb747bf01772a6dbe3623',
 'js/weapons.js':'ba1b05fde4c5adb8358ff5abf7de4dd7358f301cb051fe12d09fc2371fc0ecae'
};
for(const [file,hash] of Object.entries(protectedFiles))assert.equal(sha(fs.readFileSync(file)),hash,'Unintended change: '+file);
assert.equal(sha(fs.readFileSync('assets/characters/npc/ratchet/work_loop_six.webp')),'ea82e6334a2e4882f11fc868495684e1511d213bb5426cdbe9d6091930a021ea');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GAME_URL||'http://127.0.0.1:8220/index.html';
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof startGame==='function');
 await page.evaluate(()=>{const sv=newSave(1);sv.flags.tut=1;sv.flags.woke=1;sv.time=99;startGame(sv);loadRoom('A0B');G.state='PLAY';G.wake=null;G.dialog=null;G.cut=null;G.meet=null;G.trans=null;G.gateWalk=null;G.enemies=[];const s=G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet');G.save.flags['on_'+npcKey(s)]=1;player.x=80;mediaFetch('ratchetLoop',true);Object.values(TINKER_PLATE).forEach(k=>mediaFetch(k,true));});
 await page.waitForFunction(()=>MEDIA_RAW.ratchetLoop&&MEDIA_LOW.ratchetLoop===3&&Object.values(TINKER_PLATE).every(k=>MEDIA_RAW[k]));
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(60);
 const high=await page.evaluate(()=>{
  const s=G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet'),ctx=document.createElement('canvas').getContext('2d');ctx.canvas.width=500;ctx.canvas.height=500;
  player.x=s.x-200;const r=tinkerRig(s),seen=[];
  for(let i=0;i<6;i++){
   Object.assign(r,{pose:'work1',job:'shape',ph:i+.1,t:9,tic:99,vent:99,jt:99,hold:99,last:performance.now()/1000});
   ctx.setTransform(1,0,0,1,250-s.x-s.w/2,450-s.y-s.h);ctx.clearRect(-1000,-1000,2000,2000);G.tinkerFrame=null;
   const drawn=drawTinker(ctx,s,false),bytes=ctx.getImageData(0,0,500,500).data;let pixels=0;for(let j=3;j<bytes.length;j+=4)if(bytes[j]>180)pixels++;
   seen.push({frame:i,drawn,selected:G.tinkerFrame,pixels});
  }
  Object.assign(r,{pose:'work1',job:'shape',ph:-.9,t:9,tic:99,vent:99,jt:99,hold:99,last:performance.now()/1000});drawTinker(ctx,s,false);const reverse=G.tinkerFrame;
  updateCam(player.x+player.w/2,player.y+player.h/2,G.roomDef.w*TILE,G.roomDef.h*TILE,1);draw(5000);
  return {build:BUILD_ID,source:MEDIA_SRC.images.ratchetLoop,dimensions:[MEDIA_RAW.ratchetLoop.naturalWidth,MEDIA_RAW.ratchetLoop.naturalHeight],seen,reverse};
 });
 assert.equal(high.source,'assets/characters/npc/ratchet/work_loop_six.webp');assert.deepEqual(high.dimensions,[2160,360]);
 assert(high.seen.every(s=>s.drawn&&s.selected==='shape:'+s.frame&&s.pixels>500),'Actual draw did not use every supplied frame');assert.equal(high.reverse,'shape:5');
 fs.mkdirSync('release-evidence/ratchet',{recursive:true});await page.screenshot({path:'release-evidence/ratchet/actual-room.png'});
 // Deliberately block full-quality download; a first-load stand-in must have
 // the same six-cell layout, not the old thirteen-cell sheet.
 await page.route('**/work_loop_six.webp*',r=>r.abort());
 await page.evaluate(()=>{delete MEDIA_RAW.ratchetLoop;delete MEDIA_IMG.ratchetLoop;delete MEDIA_LOW.ratchetLoop;delete MEDIA_PEND.ratchetLoop;mediaFetch('ratchetLoop',true);});
 await page.waitForFunction(()=>MEDIA_RAW.ratchetLoop&&MEDIA_LOW.ratchetLoop===2);
 const low=await page.evaluate(()=>{
  const s=G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet'),r=tinkerRig(s),seen=[];
  for(let i=0;i<6;i++){Object.assign(r,{pose:'work1',job:'shape',ph:i+.1,t:9,tic:99,vent:99,jt:99,hold:99,last:performance.now()/1000});G.tinkerFrame=null;drawTinker(c,s,false);seen.push(G.tinkerFrame);}
  return {dimensions:[MEDIA_RAW.ratchetLoop.naturalWidth,MEDIA_RAW.ratchetLoop.naturalHeight],seen};
 });
 assert.equal(low.dimensions[0]/low.dimensions[1],6);assert.deepEqual(low.seen,['shape:0','shape:1','shape:2','shape:3','shape:4','shape:5']);
 assert.equal(errors.length,0,JSON.stringify(errors));
 const evidence={url,high,low,protectedFiles,errors};fs.writeFileSync('release-evidence/ratchet/verified.json',JSON.stringify(evidence,null,2));
 console.log('PASS supplied bytes, actual six-frame draw, negative phase wrap, six-frame slow-load fallback and unchanged gameplay/hero/audio');
 console.log(JSON.stringify({build:high.build,source:high.source,high:high.dimensions,low:low.dimensions,protectedFiles:Object.keys(protectedFiles).length}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
