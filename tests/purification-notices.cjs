// Staged regression: inspect the assembled game, not a copy of its toast logic.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const out=process.env.PURIFICATION_NOTICES_OUT||'tests/out/purification-notices';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof purificationBegin==='function');
 const result=await page.evaluate(()=>{
  requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfMeet:1,nfBreak:1,bossChime:1});startGame(s);loadRoom('A4');
  G.state='PLAY';G.dialog=G.meet=G.cut=G.wake=G.bossEntry=null;G.boss.meet=false;G.toasts=[];
  // A translated combat notice and two unrelated notices, including identical
  // words: removal must use provenance, never English/localized text matching.
  const hint=t('daze_open');G.toast(hint,'boss-opening');G.toast('earned reward');G.toast(hint);
  const before=G.toasts.map(x=>({...x}));const entered=purificationBegin(G.boss);
  const after=G.toasts.map(x=>({...x}));purificationCancel();G.state='PLAY';purificationBegin(G.boss);
  const retry=G.toasts.map(x=>({...x}));
  return {build:BUILD_ID,scope:'STAGED save/arena; not a campaign',entered,hint,before,after,retry};
 });
 result.errors=errors;fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 assert.ok(result.entered);assert.equal(result.before.length,3);assert.equal(result.before[0].scope,'boss-opening','combat hints carry provenance');
 assert.equal(result.after.length,2,'only the stale combat hint is retired');assert.ok(result.after.some(x=>x.text==='earned reward'));
 assert.ok(result.after.some(x=>x.text===result.hint&&!x.scope),'unscoped same text is preserved');assert.deepEqual(result.retry,result.after);assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
