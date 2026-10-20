// Run only after the frozen collector. Executes the actual current harness in
// memory with observation hooks; never edits production or test source files.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../../../..'),run=path.dirname(__dirname),mode=process.env.PURIFY_TOUCH_MODE||'original';
assert(['original','settled'].includes(mode),'PURIFY_TOUCH_MODE must be original or settled');
const full=JSON.parse(fs.readFileSync(path.join(run,'automated/results.json')));assert(full.finished_utc,'Do not launch an extra browser during the frozen collector');
const out=path.resolve(process.env.PURIFY_DIAG_OUT||path.join(__dirname,'purification-touch-'+mode));
assert(!fs.existsSync(out)||fs.readdirSync(out).length===0,'Preserve earlier evidence: choose a fresh PURIFY_DIAG_OUT');fs.mkdirSync(out,{recursive:true});
const test=path.join(root,'tests/purification-controls.cjs'),original=fs.readFileSync(test,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const result={mode,scope:mode==='original'?'Original current staged fixture/assertions with observation hooks; instrumentation can perturb timing.':'Separate hypothesis control: actual resize events/layout are allowed to settle, then draw; original touch/hold/safety assertions unchanged. Not a rerun of the original execution.',originalTestSha256:hash(original),diagnosticScriptSha256:hash(fs.readFileSync(__filename)),fullFinishedUtc:full.finished_utc,snapshots:[],errors:[]};
let server,doneResolve;const done=new Promise(r=>{doneResolve=r});
const hooks=global.__studioPurify={
 async attach(page){
  page.on('pageerror',e=>result.errors.push(e.message));
  await page.addInitScript(()=>{
   window.__purifyEvents=[];
   const state=()=>{try{return {phase:G.purification?.phase,armed:G.purification?.armed,hold:G.purification?.hold,pointer:purificationPointer,hidden:document.hidden,focus:document.hasFocus(),suspended:inputSuspended,portrait:purificationPortrait()};}catch(e){return {unavailable:e.message};}};
   for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture','touchstart','touchend','touchcancel']){
    for(const capture of [true,false])document.addEventListener(type,e=>{if(window.__purifyEvents.length>200)return;window.__purifyEvents.push({type,capture,target:e.target.id||e.target.tagName,x:e.clientX??e.changedTouches?.[0]?.clientX,y:e.clientY??e.changedTouches?.[0]?.clientY,pointerType:e.pointerType,defaultPrevented:e.defaultPrevented,time:performance.now(),state:state()});},capture);
   }
  });
 },
 async snap(page,label,pt,shot=false){
  const sample=await page.evaluate(({label,pt})=>{
   const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,hidden:el.hidden,display:s.display,visibility:s.visibility,zIndex:s.zIndex,pointerEvents:s.pointerEvents};};
   const button=document.querySelector('#purification-hold'),r=rect(button),point=pt||(r&&{x:r.x+r.width/2,y:r.y+r.height/2});
   const top=point&&document.elementFromPoint(point.x,point.y);
   return {label,build:window.BUILD_ID,time:performance.now(),state:G.state,phase:G.purification?.phase,armed:G.purification?.armed,hold:G.purification?.hold,pointer:purificationPointer,clock:G.purification?.clock,inputSuspended,hidden:document.hidden,focus:document.hasFocus(),portrait:purificationPortrait(),inner:[innerWidth,innerHeight],visual:visualViewport&&{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},touch:{enabled:TOUCH.enabled,pad:PAD.on,raw:[TOUCH.rawW,TOUCH.rawH],visible:[TOUCH.vw,TOUCH.vh],portrait:TOUCH.portrait,vis:TOUCH.vis},cv:rect(cv),tc:rect(tc),button:r,point,pointInside:!!point&&point.x>=0&&point.y>=0&&point.x<innerWidth&&point.y<innerHeight,pointTarget:top&&{id:top.id,tag:top.tagName},loader:rect(document.querySelector('#cbload')),heroReady:heroArtReady(),frame:lastT,events:window.__purifyEvents.slice()};
  },{label,pt});
  if(shot){sample.screenshot=label+'.png';await page.screenshot({path:path.join(out,sample.screenshot)});sample.screenshotSha256=hash(fs.readFileSync(path.join(out,sample.screenshot)));}
  result.snapshots.push(sample);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(label,JSON.stringify(sample));
 },
 async settle(page){
  // Only the separately labeled control waits for the actual resize callback.
  // No threshold/input/hold amount is altered and no pointer handler is called.
  if(mode!=='settled')return;
  await page.waitForFunction(()=>TOUCH.rawW===Math.round(visualViewport?visualViewport.width:innerWidth)&&TOUCH.rawH===Math.round(visualViewport?visualViewport.height:innerHeight),null,{timeout:5000});
  await page.evaluate(()=>{drawTouchUI();draw(performance.now());});
 },
 done(){doneResolve();}
};
function replaceOnce(source,needle,replacement){assert.equal(source.split(needle).length,2,'Instrumentation anchor must be unique: '+needle);return source.replace(needle,replacement);}
(async()=>{
 server=spawn(process.execPath,[path.join(root,'tests/serve.cjs')],{cwd:root,stdio:'ignore'});await new Promise(r=>setTimeout(r,300));
 const served=Buffer.from(await(await fetch('http://127.0.0.1:8220/index.html')).arrayBuffer());result.servedIndexSha256=hash(served);result.diskIndexSha256=hash(fs.readFileSync(path.join(root,'index.html')));assert.equal(result.servedIndexSha256,result.diskIndexSha256,'Served build identity');
 let source=original;
 const created="const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});";
 source=replaceOnce(source,created,created+'\n await global.__studioPurify.attach(page);');
 const rotate="await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{tick(1);draw(performance.now());});assert.equal(await page.locator('#purification-hold').isVisible(),false);await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{tick(1);draw(performance.now());});";
 const settle=mode==='settled'?'await global.__studioPurify.settle(page);':'';
 const observed="await global.__studioPurify.snap(page,'staged-initial');await page.setViewportSize({width:390,height:844});"+settle+"await page.evaluate(()=>{tick(1);draw(performance.now());});await global.__studioPurify.snap(page,'after-portrait');assert.equal(await page.locator('#purification-hold').isVisible(),false);await page.setViewportSize({width:844,height:390});"+settle+"await page.evaluate(()=>{tick(1);draw(performance.now());});await global.__studioPurify.snap(page,'after-landscape');";
 source=replaceOnce(source,rotate,observed);
 const touch="await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await page.evaluate(()=>tick(30));assert.ok(await page.evaluate(()=>G.purification.hold>.4));";
 source=replaceOnce(source,touch,"await global.__studioPurify.snap(page,'before-touch',pt,true);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await global.__studioPurify.snap(page,'after-touch',pt);await page.evaluate(()=>tick(30));await global.__studioPurify.snap(page,'after-30ticks',pt,true);assert.ok(await page.evaluate(()=>G.purification.hold>.4));");
 // Redirect only historical output filenames; no fixture behavior/assertion changes.
 source=replaceOnce(source,"'docs/combat/purification-2026-10-16/screens/mobile-button.png'",JSON.stringify(path.join(out,'mobile-button.png')));
 source=replaceOnce(source,"'docs/combat/purification-2026-10-16/controls.json'",JSON.stringify(path.join(out,'controls.json')));
 const ending="})().catch(e=>{console.error(e);process.exitCode=1});";
 source=replaceOnce(source,ending,"})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>global.__studioPurify.done());");
 result.instrumentedSourceSha256=hash(source);
 const mod=new Module(test,module);mod.filename=test;mod.paths=Module._nodeModulePaths(path.dirname(test));mod._compile(source,test);
 await done;result.exitCode=process.exitCode||0;
})().catch(e=>{result.error=e.stack;console.error(e);process.exitCode=1;}).finally(()=>{result.exitCode=process.exitCode||0;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');if(server)server.kill();delete global.__studioPurify;});
