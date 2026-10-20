// Staged browser presentation diagnostic; never a fresh chapter certificate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..'),{chromium}=require(path.join(root,'node_modules/playwright'));
const out=path.join(__dirname,'portrait');fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const result={scope:'Exact opening capture followed by explicitly staged CUT/PANELS/REPAIR rotation snapshots; hasTouch emulation, not physical touch or uninterrupted play.',samples:[],errors:[]};
const server=require('node:child_process').spawn(process.execPath,[path.join(root,'tests/serve.cjs')],{cwd:root,stdio:'ignore'});
(async()=>{
 await new Promise(r=>setTimeout(r,300));
 const url='http://127.0.0.1:8220/index.html',bytes=Buffer.from(await(await fetch(url)).arrayBuffer());
 result.servedSha256=hash(bytes);result.diskSha256=hash(fs.readFileSync(path.join(root,'index.html')));
 if(result.servedSha256!==result.diskSha256)throw Error('Wrong served build');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 try{
  const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await ctx.newPage();page.on('pageerror',e=>result.errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>typeof heroArtReady==='function'&&heroArtReady(),null,{timeout:30000});
  await page.mouse.click(8,8);await page.evaluate(()=>startGame(newSave(1)));
  async function snap(name){
   const s=await page.evaluate(()=>{
    const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect(),css=getComputedStyle(el);return {x:r.x,y:r.y,width:r.width,height:r.height,display:css.display,visibility:css.visibility,zIndex:css.zIndex,backing:[el.width,el.height],inline:el.getAttribute('style')};};
    const canv=document.querySelector('#tc'),rr=canv?.getBoundingClientRect();
    let centerPixel=null;try{centerPixel=Array.from(canv.getContext('2d').getImageData(Math.floor(canv.width/2),Math.floor(canv.height/2),1,1).data);}catch(e){}
    return {build:window.BUILD_ID,state:G.state,cut:G.cut&&{kind:G.cut.kind,phase:G.cut.ph,time:G.cut.t,videoTime:G.cut.v.currentTime},panels:G.panels&&{id:G.panels.seq.id,phase:G.panels.ph},touch:{enabled:TOUCH.enabled,portrait:TOUCH.portrait,rawW:TOUCH.rawW,rawH:TOUCH.rawH,vw:TOUCH.vw,vh:TOUCH.vh,ox:TOUCH.ox,oy:TOUCH.oy,vis:TOUCH.vis},pad:PAD.on,inner:[innerWidth,innerHeight],visual:visualViewport&&{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale},cv:rect(cv),tc:rect(canv),centerPixel,centerTop:document.elementFromPoint(innerWidth/2,innerHeight/2)?.id,rotateText:t('rotate'),frame:lastT,repair:document.querySelector('#ratchet-repair')&&rect(document.querySelector('#ratchet-repair'))};
   });
   s.name=name;s.screenshot=name+'.png';await page.screenshot({path:path.join(out,s.screenshot)});s.screenshotSha256=hash(fs.readFileSync(path.join(out,s.screenshot)));result.samples.push(s);console.log(name,JSON.stringify(s));
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await snap('exact-opening-portrait-500ms');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await snap('exact-opening-back-landscape');
  await page.evaluate(()=>{G.cut=null;G.state='PLAY';G.wake=null;G.dialog=null;G.trans=null;G.save.panels={v:1,seen:{},past:{},n:0};panelsPlay('chime',{replay:true});});
  await page.waitForTimeout(650);await snap('panels-landscape');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await snap('panels-portrait');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await snap('panels-back-landscape');
  await page.evaluate(()=>{panelsEnd();const sv=newSave(1);sv.time=99;sv.flags.woke=sv.flags.tut=1;startGame(sv);loadRoom('A0B');G.state='PLAY';G.wake=null;G.cut=null;G.dialog=null;G.trans=null;G.meet=null;G.gateWalk=null;PURIFY_VID.revive=null;PURIFY_VID.gift=null;doInteract(G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt'));G.dialog=null;G.state='PLAY';repairOpen(G.statics.find(s=>s.type==='npc'&&s.extra==='ratchet'),()=>{});});
  await page.waitForTimeout(650);await snap('repair-landscape');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await snap('repair-portrait');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await snap('repair-back-landscape');
  await ctx.close();
  // Exact unchanged Chinese fixture, same canvas font and box, plus matching DOM trace.
  const cjk=await browser.newPage({viewport:{width:960,height:540}});cjk.on('pageerror',e=>result.errors.push(e.message));await cjk.goto(url);
  await cjk.waitForFunction(()=>typeof dlgFont==='function'&&typeof wrapLines==='function');
  const fixture=fs.readFileSync(path.join(root,'tests/textreveal.cjs'),'utf8').match(/const ZH = '([^']+)'/)[1];
  result.cjk=await cjk.evaluate(text=>{const font=dlgFont({rs:false}),ctx=document.createElement('canvas').getContext('2d');ctx.font=font;const lines=wrapLines(ctx,text,DLG_W),el=document.createElement('div');el.id='studio-cjk-fixture';el.textContent=text;Object.assign(el.style,{position:'fixed',left:'100px',top:'100px',width:DLG_W+'px',font,color:'white',background:'black',zIndex:2147483647});document.body.appendChild(el);return {font,box:DLG_W,fullWidth:ctx.measureText(text).width,lines:lines.length,widest:Math.max(...lines.map(l=>ctx.measureText(l).width)),textPreserved:lines.join('')===text,build:window.BUILD_ID};},fixture);
  await cjk.evaluate(()=>document.fonts.ready);const cdp=await cjk.context().newCDPSession(cjk);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const doc=await cdp.send('DOM.getDocument'),node=await cdp.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#studio-cjk-fixture'});result.cjk.domPlatformFonts=(await cdp.send('CSS.getPlatformFontsForNode',{nodeId:node.nodeId})).fonts;
  result.cjk.fixtureSha256=hash(fixture);await cjk.screenshot({path:path.join(out,'cjk-fixture.png')});result.cjk.screenshotSha256=hash(fs.readFileSync(path.join(out,'cjk-fixture.png')));console.log('CJK',JSON.stringify(result.cjk));
 }finally{await browser.close();}
})().catch(e=>{result.error=e.stack;console.error(e);process.exitCode=1;}).finally(()=>{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');server.kill();});
