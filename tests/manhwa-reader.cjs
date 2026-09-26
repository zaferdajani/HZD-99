const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try{
 const root=new URL('manhua/',process.env.SITE_URL||process.env.GAME_URL||'http://127.0.0.1:8220/').href;
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const r=await p.goto(root);assert.equal(r.status(),200);
 const manifest=await (await p.request.get(new URL('edition.json',root).href)).json();assert.equal(manifest.pages.length,32);
 // Decode every source in isolation; keeping all full-size pages decoded at
 // once makes the acceptance check needlessly exhaust a low-memory laptop.
 for(const row of manifest.pages){const size=await p.evaluate(async url=>{
   const im=new Image();im.src=url;await im.decode();const size=[im.naturalWidth,im.naturalHeight];im.src='';return size;
 },new URL(row.file,root).href);assert.deepEqual(size,[row.width,row.height]);}
 assert.equal(await p.locator('figure').count(),32);assert(await p.locator('.edition').textContent().then(s=>s.includes('still in progress')));
 for(const row of manifest.pages){const r=await p.request.get(new URL(row.file,root).href);assert.equal(r.status(),200);const bytes=await r.body();assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);await r.dispose();}
 fs.mkdirSync('release-evidence',{recursive:true});await p.screenshot({path:'release-evidence/manhwa-desktop.png'});
 await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:'release-evidence/manhwa-phone.png'});
 await p.goto(new URL('story.html',root).href);assert(await p.locator('main').textContent().then(s=>s.includes('END OF THE OPENING ARC')&&s.includes('spare cell Ratchet')&&!s.includes('good paw and her teeth')));
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS manhwa: 32 decoded and hash-verified pages, full revised story, desktop/390px layout, honest incomplete status, no browser errors');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
