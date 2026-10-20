// Staged presentation regression. Ordinary capability detection and actual
// viewport rotations, not a physical phone or a continuous chapter certificate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const OUT=process.env.PORTRAIT_OUT||path.join(__dirname,'out','portrait-rotation');
const baseline=process.env.PORTRAIT_BASELINE==='1',result={baseline,scope:'staged mobile-viewport keyboard/browser diagnostic',samples:[],fails:[],errors:[]};
const check=(name,ok,detail)=>{console.log((ok?'ok ':'FAIL ')+name+' '+JSON.stringify(detail));if(!ok)result.fails.push(name);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
try{
 const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const p=await ctx.newPage();p.on('pageerror',e=>result.errors.push(e.message));
 await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof heroArtReady==='function'&&heroArtReady(),null,{timeout:30000});
 // A fading boot DOM layer still intercepts elementFromPoint for 500ms after
 // hero readiness. Test the reader after that real boot handoff, never hide or
 // remove the loader ourselves to manufacture top-layer acceptance.
 await p.waitForSelector('#cbload',{state:'detached',timeout:30000});
 await p.mouse.click(8,8);await p.evaluate(()=>startGame(newSave(1)));
 if(baseline){
  // Optional failed-before proof: only this original function is restored in
  // the diagnostic page. Disk/build sources are never rewound or edited.
  const source=require('node:child_process').execFileSync('git',['show','f19aee0bc93400944402aeee45db00068abd8ebd:js/touch.js'],{encoding:'utf8',cwd:path.join(__dirname,'..')});
  const fn=source.match(/function tcResize\(\) \{[\s\S]*?\n\}\n\/\/ ---/)[0].replace(/\n\/\/ ---$/,'');
  result.baselineFunctionSha256=hash(fn);await p.evaluate(fn=>window.eval(fn),fn);
 }
 check('touch detected without forcing enabled',await p.evaluate(()=>TOUCH.enabled&&!!tcx),true);
 await p.evaluate(()=>{window.__rotatePaints=[];const paint=tcx.fillText;tcx.fillText=function(text,x,y){if(text===t('rotate'))window.__rotatePaints.push({text,x,y,width:this.measureText(text).width,time:performance.now()});return paint.apply(this,arguments);};});
 async function record(name,portrait,repair){
  const s=await p.evaluate(()=>{
   const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const rr=document.querySelector('#ratchet-repair'),card=rr&&rr.querySelector('.repair-card'),px=Array.from(tcx.getImageData(Math.floor(tc.width*.1),Math.floor(tc.height*.1),1,1).data);
   const paint=window.__rotatePaints.filter(q=>q.time>performance.now()-600).pop()||null;
   return {build:window.BUILD_ID,state:G.state,inner:[innerWidth,innerHeight],raw:[TOUCH.rawW,TOUCH.rawH],visible:[TOUCH.vw,TOUCH.vh],portrait:TOUCH.portrait,pad:PAD.on,vis:TOUCH.vis,cv:rect(cv),tc:rect(tc),paint,bgAlpha:px[3],centerTop:document.elementFromPoint(innerWidth/2,innerHeight/2)?.id,repairCard:rect(card),repairStep:typeof repairSession!=='undefined'&&repairSession?.step};
  });
  s.name=name;const contained=r=>r&&r.x>=-1&&r.y>=-1&&r.right<=s.inner[0]+1&&r.bottom<=s.inner[1]+1;
  check(name+' expected live overlay',s.state===name.split('-')[0].toUpperCase(),s.state);
  check(name+' fresh viewport geometry',s.raw[0]===s.inner[0]&&s.raw[1]===s.inner[1]&&s.visible[0]===s.inner[0]&&s.visible[1]===s.inner[1]&&s.portrait===portrait,{raw:s.raw,visible:s.visible,portrait:s.portrait});
  check(name+' both canvases contained',contained(s.cv)&&contained(s.tc),{cv:s.cv,tc:s.tc});
  if(portrait&&!repair)check(name+' rotation instruction actually painted and visible',!!s.paint&&s.paint.x-s.paint.width/2>=0&&s.paint.x+s.paint.width/2<=s.inner[0]&&s.paint.y>0&&s.paint.y<s.inner[1]&&s.bgAlpha>=230&&s.centerTop==='tc',{paint:s.paint,alpha:s.bgAlpha,top:s.centerTop});
  if(repair)check(name+' repair owns readable contained card',contained(s.repairCard)&&s.repairStep===0,{card:s.repairCard,step:s.repairStep});
  s.screenshot=name+'.png';await p.screenshot({path:path.join(OUT,s.screenshot)});s.sha256=hash(fs.readFileSync(path.join(OUT,s.screenshot)));result.samples.push(s);
 }
 async function rotate(width,height){
  // Save the actual prior viewport intersection as if the observer retained
  // its unchanged-ratio entry. Real resize events, not manual rawW/H edits,
  // must retire this geometry. Each direction is a separate regression.
  await p.evaluate(()=>{const W=TOUCH.rawW,H=TOUCH.rawH;TOUCH.vis={left:0,top:0,right:W,bottom:H,width:W,height:H,x:0,y:0};});
  await p.setViewportSize({width,height});await p.waitForTimeout(300);
 }
 for(const state of ['CUT','PANELS','REPAIR']){
  await p.evaluate(state=>{
   if(typeof repairClose==='function')repairClose();G.cut=null;G.panels=null;G.state='PLAY';G.dialog=null;G.wake=null;G.trans=null;
   if(state==='CUT'){if(!startPurifyCut('glitch'))throw Error('Missing real CUT setup');}
   else if(state==='PANELS'){if(!panelsPlay('chime',{replay:true}))throw Error('Missing real panel setup');}
   else{const sv=newSave(1);sv.time=99;sv.flags.woke=sv.flags.tut=1;startGame(sv);loadRoom('A0B');G.state='PLAY';G.cut=null;G.panels=null;G.wake=null;G.dialog=null;G.trans=null;G.meet=null;G.gateWalk=null;doInteract(G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt'));G.dialog=null;G.state='PLAY';repairOpen(G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet'),()=>{});if(G.state!=='REPAIR')throw Error('Missing real repair setup');}
  },state);
  await rotate(390,844);await record(state.toLowerCase()+'-portrait',true,state==='REPAIR');
  await rotate(844,390);await record(state.toLowerCase()+'-landscape',false,state==='REPAIR');
 }
 result.sameViewportClip=await p.evaluate(()=>{TOUCH.vis={left:10,top:20,right:834,bottom:340,width:824,height:320};tcResize();return {visible:[TOUCH.vw,TOUCH.vh],offset:[TOUCH.ox,TOUCH.oy],retained:!!TOUCH.vis};});
 check('purposeful same-viewport host clip retained',JSON.stringify(result.sameViewportClip)===JSON.stringify({visible:[824,320],offset:[10,20],retained:true}),result.sameViewportClip);
 check('zero page errors',result.errors.length===0,result.errors);
}finally{await browser.close();}
})().catch(e=>{result.error=e.stack;console.error(e);process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(result,null,2)+'\n');if(result.fails.length)process.exitCode=1;});
