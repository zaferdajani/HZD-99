const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
 const p=await browser.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
 await p.waitForFunction(()=>typeof startGame==='function');
 const checks=await p.evaluate(()=>{
 window.requestAnimationFrame=()=>0;
 const checks=[],check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
 const sv=newSave(1);sv.time=99;sv.flags.woke=sv.flags.tut=sv.flags.sawScrap=1;
 startGame(sv);
 const stage=r=>{loadRoom(r);G.state='PLAY';G.wake=G.cut=G.dialog=G.trans=null;};
 stage('A0');check('opening target is a construct',G.enemies[0].kind==='turret'&&G.enemies[0].actorRole==='empty-construct');
 stage('A1');let e=G.enemies.find(e=>e.kind==='crawler');check('person has stable identity',!!e.storyKey&&e.actorRole==='infected-person');
 const key=e.storyKey,wr=G.wrecks.length; e.hp=0;e.die(1,0);
 check('defeat preserves person and does not create a wreck',e.disabled&&!e.dead&&G.wrecks.length===wr);
 player.x=e.x;player.y=e.y;doInteract(findNear());check('claws cannot cleanse',!e.cleanseT);
 const hp=e.hp;check('disabled person cannot take more damage',dealDmg(e,999,'zizt',e.x,e.y)===0&&e.hp===hp);
 persist();let saved=JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));startGame(saved);stage('A1');e=G.enemies.find(e=>e.storyKey===key);
 check('disabled state survives reload',e.disabled&&!e.dead);
 G.save.flags.crystal=1;player.x=e.x;player.y=e.y;doInteract(findNear());check('forged sword starts short interaction',e.cleanseT===0.65);
 player.x+=200;e.update(0.1);check('moving away interrupts without harming person',e.cleanseT===0&&e.disabled);
 player.x=e.x;player.y=e.y;doInteract(findNear());player.cores-=1;e.update(0.1);check('damage interrupts',e.cleanseT===0&&e.disabled);
 player.x=e.x;player.y=e.y;doInteract(findNear());const scrap=G.save.scrap;for(let i=0;i<45;i++)e.update(1/60);
 check('cleanse changes body behaviour and save state',e.rescued&&e.calm&&!e.disabled&&!e.dead&&G.save.rescues[key]==='rescued');
 check('cure pays once',G.save.scrap===scrap+8);e.finishCleanse();e.die(1,0);check('repeated actions cannot duplicate reward or destroy friend',G.save.scrap===scrap+8&&!e.dead);
 persist();saved=JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));startGame(saved);stage('A1');e=G.enemies.find(e=>e.storyKey===key);
 check('rescued person persists in room after reload',e&&e.rescued&&e.calm&&!e.dead);
 const before=player.cores;player.x=e.x;player.y=e.y;e.update(0.016);check('rescued contact is safe',player.cores===before);
 const legacy=newSave(1);delete legacy.storyVersion;legacy.time=99;legacy.flags.woke=legacy.flags.tut=1;startGame(legacy);stage('A1');e=G.enemies.find(e=>e.kind==='crawler');e.die(1,0);check('legacy encounters preserved',e.dead&&!e.storyKey);
 return checks;
 });assert.deepEqual(errors,[]);console.log('PASS',checks);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

