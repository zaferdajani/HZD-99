// Staged production-path regression, not an ordinary-input chapter run.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const out=process.env.MARBLE_NOTICES_OUT||'tests/out/marble-notices';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof startGame==='function');
 const results=await page.evaluate(()=>{
  requestAnimationFrame=()=>0;const rows=[];
  for(const lang of ['en','ar']){
   LANG=lang;const sv=newSave(1);sv.time=99;Object.assign(sv.flags,{woke:1,tut:1,heal:1,ratchetRepaired:1});startGame(sv);loadRoom('CV3');
   G.wake=G.tut=G.dialog=G.meet=G.cut=G.bossEntry=null;G.state='PLAY';G.boss=null;G.enemies=[];G.projs=[];G.toasts=[];G.hitStop=0;G._pillarToldT=0;
   const pil=G.statics.find(s=>s.type==='pillar');if(!pil)throw Error('Missing raw marble fixture');
   player.x=pil.x-30;player.y=pil.y+pil.h-player.h;player.on=true;player.vx=player.vy=0;player.face=player.faceVis=1;player.swing=null;player.atkCD=0;player.combo=player.comboT=0;
   for(const k in keys)keys[k]=false;for(const k in keysP)keysP[k]=false;
   keys.KeyJ=keysP.KeyJ=true;for(let i=0;i<3;i++)update(1/30);for(const k in keys)keys[k]=false;for(const k in keysP)keysP[k]=false;
   const hint=t('pl_hint'),produced=G.toasts.map(x=>({...x})),survivesClaw=G.statics.includes(pil);
   G.toast('earned reward');G.toast(hint);G.toast('guardian unrelated','boss-opening');
   player.swing=player.swingVis=null;G.hitStop=0;const px=player.x;player.x=pil.x-1000;player.releaseCharged();
   const afterMiss=G.toasts.map(x=>({...x})),survivesMiss=G.statics.includes(pil);
   player.x=px;G.hitStop=0;player.volts=99;player.chargeOk=true;player.releaseCharged();
   const after=G.toasts.map(x=>({...x})),acquired=!!G.save.bag?.cshard,flag=!!G.save.flags.pl_cshard,removed=!G.statics.includes(pil);
   player.releaseCharged();const retry=G.toasts.map(x=>({...x}));
   rows.push({lang,build:BUILD_ID,hint,produced,survivesClaw,survivesMiss,afterMiss,after,retry,acquired,flag,removed});
  }LANG='en';return rows;
 });
 const result={scope:'STAGED save/placement and production update/releaseCharged; not a chapter playthrough.',results,errors};fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 for(const r of results){assert.ok(r.survivesClaw&&r.survivesMiss);assert.ok(r.produced.some(x=>x.text===r.hint&&x.scope==='marble-extraction'),'rejected claws produce scoped hint');assert.ok(r.afterMiss.some(x=>x.scope==='marble-extraction'),'a missed burst must retain useful guidance');assert.ok(r.acquired&&r.flag&&r.removed);assert.ok(!r.after.some(x=>x.scope==='marble-extraction'),'successful extraction retires only the superseded hint');assert.ok(r.after.some(x=>x.text===r.hint&&!x.scope),'same-worded unrelated notice survives');assert.ok(r.after.some(x=>x.text==='earned reward'));assert.ok(r.after.some(x=>x.scope==='boss-opening'));assert.deepEqual(r.retry,r.after,'retry cannot delete rewards or duplicate notice');}
 assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
