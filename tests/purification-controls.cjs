const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof purificationBegin==='function');
 await page.evaluate(async()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfBreak:1,bossChime:1});startGame(s);loadRoom('A4');G.state='PLAY';G.dialog=G.meet=G.cut=null;G.boss.meet=false;G.boss.hp=0;G.boss.die();window.tick=n=>{for(let i=0;i<n;i++){update(1/60);clearP();}};tick(1);draw(performance.now());});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{tick(1);draw(performance.now());});assert.equal(await page.locator('#purification-hold').isVisible(),false);await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{tick(1);draw(performance.now());});
 const btn=page.locator('#purification-hold'),box=await btn.boundingBox();assert.ok(box&&box.height>=48);
 const cdp=await page.context().newCDPSession(page),pt={x:box.x+box.width/2,y:box.y+box.height/2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await page.evaluate(()=>tick(30));assert.ok(await page.evaluate(()=>G.purification.hold>.4));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.evaluate(()=>tick(1));assert.equal(await page.evaluate(()=>G.purification.hold),0);
 await page.keyboard.down('KeyE');await page.evaluate(()=>{tick(30);window.dispatchEvent(new Event('blur'));tick(100);});assert.equal(await page.evaluate(()=>G.purification.phase),'hold');assert.equal(await page.evaluate(()=>G.purification.hold),0);await page.keyboard.up('KeyE');await page.evaluate(()=>{tick(1);draw(performance.now());});
 const hiddenClock=await page.evaluate(()=>{const before=G.purification.clock;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});tick(120);const same=G.purification.clock===before;delete document.hidden;tick(1);return same;});assert.ok(hiddenClock,'hidden tabs cannot advance cinematic time');
 await page.screenshot({path:'docs/combat/purification-2026-10-16/screens/mobile-button.png'});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});await page.evaluate(()=>tick(100));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>G.purification.phase),'slash');
 const saved=await page.evaluate(()=>{purificationCancel();G.save.flags.bossGlitch=1;loadRoom('A4');return {pure:G.boss.purified,dead:G.boss.dead,pending:G.boss.rewardPend,kind:G.boss.kind};});assert.ok(saved.pure&&saved.dead&&!saved.pending);
 fs.writeFileSync('docs/combat/purification-2026-10-16/controls.json',JSON.stringify({portraitBlocked:true,hiddenClock,touchHold:true,touchCancel:true,blurCancels:true,mobileButton:box,saved},null,2));console.log('PASS mobile touch hold/cancel, focus loss, accessible target size, saved restored guardian');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
