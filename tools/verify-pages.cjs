const fs=require('node:fs'),{createHash}=require('node:crypto'),assert=require('node:assert/strict');
const base=process.env.PAGE_URL||'https://zaferdajani.github.io/HZD-99/';
const expected=JSON.parse(fs.readFileSync('_site/release.json','utf8'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function get(file,attempt){const url=new URL(file,base);url.searchParams.set('verify',expected.commit+'-'+attempt);const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(file+': HTTP '+r.status);return Buffer.from(await r.arrayBuffer());}
(async()=>{
 let verified=false,last='';
 for(let attempt=1;attempt<=20;attempt++){
  try{
   const manifest=JSON.parse((await get('release.json',attempt)).toString());
   assert.equal(manifest.commit,expected.commit);assert.equal(manifest.build_id,expected.build_id);
   for(const [file,digest] of Object.entries(expected.files))assert.equal(sha(await get(file,attempt)),digest,'Live file differs: '+file);
   verified=true;break;
  }catch(e){last=e.message;console.log('Waiting for exact CDN release',attempt,last);if(attempt<20)await pause(15000);}
 }
 if(!verified)throw Error('Exact release is not live: '+last);
 const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(new URL('index.html?verify='+expected.commit,base).href);
  await page.waitForFunction(()=>typeof heroArtReady==='function'&&heroArtReady(),{timeout:45000});
  const actual=await page.evaluate(()=>({commit:window.DEPLOY_COMMIT,build:window.BUILD_ID,core:heroArtReady()}));
  assert.equal(actual.commit,expected.commit);assert.equal(actual.build,expected.build_id);assert.deepEqual(errors,[]);
  fs.mkdirSync('release-evidence',{recursive:true});
  fs.writeFileSync('release-evidence/live-verification.json',JSON.stringify({verified:true,...actual,files:expected.files,url:base,errors},null,2));
  console.log('LIVE VERIFIED',JSON.stringify(actual));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
