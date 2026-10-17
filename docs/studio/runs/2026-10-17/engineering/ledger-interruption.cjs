// Staged regression: initial inventory/room are injected; reload uses the actual persisted save.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../..');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/clawbyte-browser'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof purificationBegin==='function');
 const identity=await page.evaluate(()=>({build:BUILD_ID,url:location.href}));
 await page.evaluate(()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfBreak:1,nfMeet:1,sageTame_GA1D:1,bossChime:1});startGame(s);loadRoom('A4');G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.enemies=[];G.projs=[];G.tut=null;persist();});
 const before=await page.evaluate(()=>({led:G.save.braid.led,forks:G.save.braid.forks,boss:!!G.save.flags.bossGlitch}));
 async function ritual(){await page.evaluate(()=>{requestAnimationFrame=()=>0;G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.enemies=[];G.projs=[];G.tut=null;G.boss.meet=false;G.boss.st='idle';G.boss.hp=0;G.boss.die();window.tick=n=>{for(let i=0;i<n;i++){update(1/60);clearP();}};tick(1);});await page.keyboard.down('KeyE');await page.evaluate(()=>tick(100));await page.keyboard.up('KeyE');await page.evaluate(()=>tick(80));return page.evaluate(()=>{const disk=loadStored('robo');return {state:G.state,cutKind:G.cut?.kind,led:disk.braid.led,forks:disk.braid.forks,nodes:disk.braid.nodes,boss:!!disk.flags.bossGlitch,runtimeBoss:!!G.save.flags.bossGlitch};});}
 const first=await ritual();assert.equal(first.state,'CUT');assert.equal(first.boss,false);
 // Reload during CUT before completion; no save object is hand-edited here.
 await page.reload();await page.waitForFunction(()=>typeof purificationBegin==='function');
 const reloaded=await page.evaluate(()=>{requestAnimationFrame=()=>0;const s=loadStored('robo');startGame(s);loadRoom('A4');return {led:G.save.braid.led,forks:G.save.braid.forks,boss:!!G.save.flags.bossGlitch,spawned:!!G.boss,dead:!!G.boss?.dead};});
 const second=await ritual();assert.equal(second.state,'CUT');assert.equal(second.forks,first.forks+1);assert.equal(second.boss,false);assert.equal(reloaded.spawned,true);assert.equal(reloaded.dead,false);
 const result={scope:'STAGED regression; initial save and room injected; subsequent save is actual persisted disk save, not an uninterrupted campaign.',identity,before,first,reloaded,second,errors,verdict:'REPRODUCED: interrupted film permanently appends a guardian braid entry; retry appends another while guardian flag remains false.'};
 fs.writeFileSync(path.join(__dirname,'ledger-interruption.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
