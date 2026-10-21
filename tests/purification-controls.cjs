const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof purificationBegin==='function');
 await page.evaluate(async()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfBreak:1,bossChime:1});startGame(s);loadRoom('A4');G.state='PLAY';G.dialog=G.meet=G.cut=null;G.boss.meet=false;G.boss.hp=0;G.boss.die();window.tick=n=>{for(let i=0;i<n;i++){update(1/60);clearP();}};tick(1);draw(performance.now());});
 // Chromium resolves setViewportSize before every resize/visualViewport
 // listener has necessarily redrawn the fixed canvas. Wait for the production
 // touch geometry to converge, then draw the button from that exact layout.
 // This keeps the real touch event and hold threshold; it only prevents a
 // stale portrait button from being sampled below the landscape viewport.
 const settleLayout=async()=>{
  await page.waitForFunction(()=>TOUCH.rawW===Math.round(visualViewport?visualViewport.width:innerWidth)&&TOUCH.rawH===Math.round(visualViewport?visualViewport.height:innerHeight));
  await page.evaluate(()=>{drawTouchUI();tick(1);draw(performance.now());});
 };
 await page.setViewportSize({width:390,height:844});await settleLayout();assert.equal(await page.locator('#purification-hold').isVisible(),false);await page.setViewportSize({width:844,height:390});await settleLayout();
 const guidance=await page.evaluate(()=>{
  const saved={touch:TOUCH.enabled,on:PAD.on,kind:PAD.kind,bind:PAD.map.INT,keys:KEYB.INT,lang:LANG};
  const out={};
  try {
   LANG='en';TOUCH.enabled=false;PAD.on=false;KEYB.INT=['KeyF'];out.keyboard=purificationText(1);
   PAD.on=true;PAD.kind='xbox';PAD.map.INT=3;out.xbox=purificationText(1);out.xboxButton=padLabel(3);
   PAD.kind='generic';PAD.map.INT=2;out.pad=purificationText(1);out.padButton=padLabel(2);
   PAD.map.INT=-1;out.unbound=purificationText(1);
   PAD.on=false;TOUCH.enabled=true;out.touch=purificationText(1);
   out.localized=['en','ar','tr','zh','ru'].map(lang=>{LANG=lang;return purificationText(1);});
  } finally {TOUCH.enabled=saved.touch;PAD.on=saved.on;PAD.kind=saved.kind;PAD.map.INT=saved.bind;KEYB.INT=saved.keys;LANG=saved.lang;}
  return out;
 });
 assert.ok(guidance.keyboard.includes('hold F /'));
 assert.ok(guidance.xbox.includes(guidance.xboxButton+' /'));
 assert.ok(guidance.pad.includes(guidance.padButton+' /'));
 assert.equal(guidance.unbound,guidance.touch);
 assert.ok(guidance.localized.every(x=>x&&!x.includes('{INT}')&&!/\bE\b/.test(x)));
 const btn=page.locator('#purification-hold'),box=await btn.boundingBox();assert.ok(box&&box.height>=48&&box.x>=0&&box.y>=0&&box.x+box.width<=844&&box.y+box.height<=390);
 const cdp=await page.context().newCDPSession(page),pt={x:box.x+box.width/2,y:box.y+box.height/2};
 assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:pt.x,y:pt.y}),'purification-hold');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await page.evaluate(()=>tick(30));assert.ok(await page.evaluate(()=>G.purification.hold>.4));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.evaluate(()=>tick(1));assert.equal(await page.evaluate(()=>G.purification.hold),0);
 await page.keyboard.down('KeyE');await page.evaluate(()=>{tick(30);window.dispatchEvent(new Event('blur'));tick(100);});assert.equal(await page.evaluate(()=>G.purification.phase),'hold');assert.equal(await page.evaluate(()=>G.purification.hold),0);await page.keyboard.up('KeyE');await page.evaluate(()=>{tick(1);draw(performance.now());});
 const hiddenClock=await page.evaluate(()=>{const before=G.purification.clock;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});tick(120);const same=G.purification.clock===before;delete document.hidden;tick(1);return same;});assert.ok(hiddenClock,'hidden tabs cannot advance cinematic time');
 await page.screenshot({path:'docs/combat/purification-2026-10-16/screens/mobile-button.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await page.evaluate(()=>tick(100));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>G.purification.phase),'slash');
 const saved=await page.evaluate(()=>{purificationCancel();G.save.flags.bossGlitch=1;loadRoom('A4');return {pure:G.boss.purified,dead:G.boss.dead,pending:G.boss.rewardPend,kind:G.boss.kind};});assert.ok(saved.pure&&saved.dead&&!saved.pending);
 fs.writeFileSync('docs/combat/purification-2026-10-16/controls.json',JSON.stringify({guidance,portraitBlocked:true,hiddenClock,touchHold:true,touchCancel:true,blurCancels:true,mobileButton:box,saved},null,2));console.log('PASS mobile touch hold/cancel, focus loss, accessible target size, saved restored guardian');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
