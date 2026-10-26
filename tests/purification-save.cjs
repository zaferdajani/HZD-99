// Staged regression: initial inventory/room are injected; reload uses the actual persisted save.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out=process.env.PURIFICATION_SAVE_OUT || 'tests/out/purification-save';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof purificationBegin==='function');
 const identity=await page.evaluate(()=>({build:BUILD_ID,url:location.href}));
 await page.evaluate(()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfBreak:1,nfMeet:1,sageTame_GA1D:1,bossChime:1});startGame(s);loadRoom('A4');G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.enemies=[];G.projs=[];G.tut=null;persist();});
 const before=await page.evaluate(()=>{const b=braid();return {led:b.led,forks:b.forks,boss:!!G.save.flags.bossGlitch};});
 async function ritual(){await page.evaluate(()=>{requestAnimationFrame=()=>0;G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.enemies=[];G.projs=[];G.tut=null;G.boss.meet=false;G.boss.st='idle';G.boss.hp=0;G.boss.die();window.tick=n=>{for(let i=0;i<n;i++){update(1/60);clearP();}};tick(1);});await page.keyboard.down('KeyE');await page.evaluate(()=>tick(100));await page.keyboard.up('KeyE');await page.evaluate(()=>tick(80));return page.evaluate(()=>{const disk=loadStored('robo');return {state:G.state,cutKind:G.cut?.kind,led:disk.braid.led,forks:disk.braid.forks,nodes:disk.braid.nodes,boss:!!disk.flags.bossGlitch,runtimeBoss:!!G.save.flags.bossGlitch};});}
 const first=await ritual();assert.equal(first.state,'CUT');assert.equal(first.boss,false);assert.equal(first.forks,before.forks,'no saved choice before cinematic completes');assert.equal(first.led,before.led);
 // Reload during CUT before completion; no save object is hand-edited here.
 await page.reload();await page.waitForFunction(()=>typeof purificationBegin==='function');
 const reloaded=await page.evaluate(()=>{requestAnimationFrame=()=>0;const s=loadStored('robo');startGame(s);loadRoom('A4');return {led:G.save.braid.led,forks:G.save.braid.forks,boss:!!G.save.flags.bossGlitch,spawned:!!G.boss,dead:!!G.boss?.dead};});
 const second=await ritual();assert.equal(second.state,'CUT');assert.equal(second.forks,first.forks,'retry before completion must not append a choice');assert.equal(second.boss,false);assert.equal(reloaded.spawned,true);assert.equal(reloaded.dead,false);
 const completed=await page.evaluate(()=>{G.cut.ran=true;endPurifyCut();const s=loadStored('robo');const a={led:s.braid.led,forks:s.braid.forks,boss:!!s.flags.bossGlitch,oath:!!s.flags.oath};endPurifyCut();return {...a,afterRepeat:G.save.braid.forks};});
 assert.equal(completed.forks,before.forks+1);assert.equal(completed.afterRepeat,completed.forks);assert.ok(completed.boss&&completed.oath);
 // A legacy save may already contain the interrupted choice. Keep it without duplicating it.
 const legacy=await page.evaluate(()=>{const s=loadStored('robo');s.flags.bossGlitch=0;startGame(s);loadRoom('A4');return {forks:G.save.braid.forks};});
 await ritual();const legacyDone=await page.evaluate(()=>{G.cut.ran=true;endPurifyCut();const s=loadStored('robo');return {forks:s.braid.forks,boss:!!s.flags.bossGlitch};});assert.equal(legacyDone.forks,legacy.forks);assert.ok(legacyDone.boss);
 const fallback=await page.evaluate(()=>{
  const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1});startGame(s);
  const room=Object.keys(ROOMS).find(id=>(ROOMS[id].ents||[]).some(e=>e[0]==='boss'&&e[3]==='brood'));
  loadRoom(room);G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.boss.meet=false;G.boss.hp=0;G.boss.die();tick(1);
  G.purification.phase='slash';G.purification.t=0;tick(80);
  const before={forks:braid().forks,flag:!!G.save.flags.bossBrood,phase:G.purification.phase};
  tick(600);const disk=loadStored('robo');const after={forks:disk.braid.forks,flag:!!disk.flags.bossBrood,pending:!!G.boss.purificationChoice};
  return {before,after};
 });
 assert.equal(fallback.before.phase,'film');assert.equal(fallback.before.forks,0);assert.equal(fallback.before.flag,false);
 assert.equal(fallback.after.forks,1);assert.equal(fallback.after.flag,true);assert.equal(fallback.after.pending,false);
 const result={fallback,completed,legacyDone,scope:'STAGED regression; initial save and room injected; subsequent save is actual persisted disk save, not an uninterrupted campaign.',identity,before,first,reloaded,second,errors,verdict:'PASS: interrupted/retried film records no early choice; completed rescue commits once; legacy guardian choice is preserved without duplication.'};
 fs.writeFileSync(path.join(out,'purification-save.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
