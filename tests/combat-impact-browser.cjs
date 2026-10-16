// Staged combat renderer checks, not an uninterrupted campaign playthrough.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
 const p=await b.newPage({viewport:{width:960,height:540}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8220/index.html');await p.waitForFunction(()=>typeof startGame==='function');
 const r=await p.evaluate(async()=>{
  const sv=newSave(1);sv.time=99;sv.flags.tut=sv.flags.woke=sv.flags.heal=1;startGame(sv);loadRoom('A1');
  window.requestAnimationFrame=()=>0;window.update=()=>{};G.state='PLAY';G.dialog=G.wake=G.cut=G.meet=G.bossEntry=null;G.enemies=[];G.boss=null;
  for(const k of Object.keys(MEDIA_SRC.images))mediaFetch(k,1);await new Promise(r=>setTimeout(r,4000));
  const e=new Enemy('crawler',400,300);e.on=true;e.dir=e.faceVis=1;e.hp=e.hpMax=1000;G.enemies=[e];
  const cv=document.createElement('canvas');cv.width=960;cv.height=540;const c=cv.getContext('2d');
  const render=()=>{c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,960,540);foeDraw(c,e);const d=c.getImageData(0,0,960,540).data;let white=0,opaque=0;for(let i=0;i<d.length;i+=4){if(d[i+3]>128){opaque++;if(d[i]>225&&d[i+1]>225&&d[i+2]>225)white++;}}return {white,opaque,image:cv.toDataURL('image/png')};};
  const before=render();parts.length=0;COMBAT_LOG=[];
  const normal=dealDmg(e,12,null,400,320,true,'slash'),during=render(),normalParts=parts.filter(x=>x.metal).length;
  await new Promise(r=>setTimeout(r,120));const after=render();
  player.burstImpactDone=false;G.hitStop=0;player.vx=0;
  const charged=dealDmg(e,38,null,400,320,true,'burst'),stop=G.hitStop,recoil=player.vx;
  const chargedParts=parts.filter(x=>x.metal).length-normalParts;
  for(let i=0;i<100;i++)metalBurst(400,320,14,true);const capped=parts.filter(x=>x.metal).length;
  updateParts(.7);const expired=parts.filter(x=>x.metal).length;
  const hp=e.hp;e.rescued=true;const protectedDamage=dealDmg(e,100,null,400,320,true,'burst');
  const modes={};G.save.flags.crystal=G.save.flags.crystal2=G.save.flags.connector=1;
  for(const mode of ['claws','single','dual','joined']){G.save.weaponMode=mode;modes[mode]=combatStats(player);}
  G.save.weaponMode='claws';G.state='CREST';
  return {build:BUILD_ID,before,during,after,normal,charged,normalParts,chargedParts,stop,recoil,capped,expired,protectedDamage,protectedHp:e.hp===hp,modes,log:combatLogData()};
 });
 assert.equal(r.normal,12);assert.equal(r.charged,38);assert.equal(r.normalParts,5);assert.equal(r.chargedParts,14);
 assert.ok(r.during.white>r.before.white+100,'white flash affects silhouette pixels');
 assert.ok(r.after.white<r.during.white/2,'white flash expires in real time');
 assert.ok(r.during.opaque<960*540/10,'flash never fills screen/rectangle');
 assert.equal(r.stop,.12);assert.equal(r.recoil,-90);assert.ok(r.capped<=80);assert.equal(r.expired,0);
 assert.equal(r.protectedDamage,0);assert.equal(r.protectedHp,true);assert.equal(r.log.events.length,2);
 assert.equal(r.modes.claws.specialPower,38);assert.equal(r.modes.single.specialPower,51);assert.equal(r.modes.dual.specialPower,18);assert.equal(r.modes.joined.specialPower,26);
 const downloadPromise=p.waitForEvent('download');await p.keyboard.press('KeyL');await p.evaluate(()=>updateGear(1/60));const download=await downloadPromise;
 const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk;const exported=JSON.parse(text);assert.equal(exported.events.length,2);assert.equal(exported.build,r.build);
 assert.deepEqual(errors,[]);
 const out=path.resolve('docs/combat/impact-2026-10-16/visual');fs.mkdirSync(out,{recursive:true});
 for(const k of ['before','during','after']){fs.writeFileSync(path.join(out,k+'.png'),Buffer.from(r[k].image.split(',')[1],'base64'));delete r[k].image;}
 await p.evaluate(()=>draw(performance.now()));await p.screenshot({path:path.join(out,'gear.png')});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(r,null,2)+'\n');
 console.log('PASS staged real renderer: white silhouette/expiry, metal count/lifetime/cap, charged recoil/stop, protected actors, all special values, downloadable ledger');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
