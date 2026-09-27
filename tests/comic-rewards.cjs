const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {chromium}=require('playwright');
const shippingManifest=require('../tools/validate-comics.cjs')();
// Exercise publication with an explicit test edition, without falsely
// publishing unfinished production art merely to make playback testable.
const manifest=structuredClone(shippingManifest);
for(const ch of manifest.chapters)ch.status='published';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('js/comics.js','utf8')+'\nthis.api=ComicRewards;',context);
const save={theme:'robo',flags:{},items:{},bag:{}};
assert.equal(context.api.available(save,manifest).length,0);
save.flags.woke=1;assert.equal(context.api.available(save,manifest).length,1);
save.flags['on_A0B|ratchet']=1;assert.equal(context.api.available(save,manifest).length,2);
save.flags.heal=1;assert.equal(context.api.available(save,manifest).length,3);
const drafts=structuredClone(manifest);for(const ch of drafts.chapters)ch.status='draft';
assert.equal(context.api.available(save,drafts).length,0,'draft chapters never unlock');
assert.equal(context.api.available({...save,theme:'hero'},manifest).length,0);
for(const bad of ['https://evil.example/page.png','../secret.png','assets/manhua/../../secret.png','assets/manhua/x.svg']) {
 const copy=structuredClone(manifest);copy.chapters[0].slides[0].src=bad;assert.throws(()=>context.api.validate(copy));
}
const unknown=structuredClone(manifest);unknown.chapters[0].unlock=['not-a-milestone'];assert.throws(()=>context.api.validate(unknown));
const duplicate=structuredClone(manifest);duplicate.chapters.push(duplicate.chapters[0]);assert.throws(()=>context.api.validate(duplicate));
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try {
  const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/assets/manhua/chapters.json',r=>r.fulfill({json:manifest}));
  await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
  await p.waitForFunction(()=>typeof ComicRewards!=='undefined'&&typeof startGame==='function');
  await p.evaluate(async()=>{
   const realRAF=window.requestAnimationFrame.bind(window);
   window.requestAnimationFrame=callback=>callback===mainLoop?0:realRAF(callback);
   const s=newSave(1);s.time=99;s.flags.woke=s.flags.tut=1;startGame(s);
   loadRoom('A0B');G.wake=G.tut=G.trans=G.cut=G.lesson=G.recharge=G.meet=null;
   G.state='PLAY';G.boss=null;G.enemies=[];G.projs=[];G.hitStop=0;G.bossEntry=null;G.offer=G.finisher=null;G.winT=0;
   player.on=true;player.vx=player.vy=0;
   await ComicRewards.refresh(true);player.on=true;player.vx=player.vy=0;ComicRewards.tick(.01);
   keys.ArrowRight=1;ComicRewards.tick(.01);delete keys.ArrowRight;
   // No interruption while a nearby machine is dangerous.
   G.enemies=[{x:player.x,dead:false}];for(let i=0;i<400;i++)ComicRewards.tick(1/60);
   if(ComicRewards.active)throw Error('comic interrupted combat');
   G.enemies=[];for(let i=0;i<100;i++)ComicRewards.tick(1/60);
   if(!ComicRewards.active||G.state!=='COMICS')throw Error('earned reward did not open at rest '+JSON.stringify({state:G.state,flags:G.save.flags,theme:G.save.theme,on:player.on,dead:player.dead,vx:player.vx,vy:player.vy,gate:G.gateWalk,available:ComicRewards.available(G.save,ComicRewards.manifest).length,comics:G.save.comics}));
  });
  await p.waitForFunction(()=>document.querySelector('#comic-rewards img')?.naturalWidth>0&&!document.querySelector('.comic-status').textContent.includes('Loading'));
  const clock=await p.evaluate(()=>G.save.time);await p.evaluate(()=>update(1));
  assert.equal(await p.evaluate(()=>G.save.time),clock,'world stays frozen while reading');
  fs.mkdirSync('release-evidence',{recursive:true});
  await p.screenshot({path:'release-evidence/comic-reward-desktop.png'});
  await p.getByRole('button',{name:'Pause slideshow',exact:true}).click();
  await p.getByRole('button',{name:'Next',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('#comic-rewards img')?.naturalWidth>0);
  await p.getByRole('button',{name:'Return to game',exact:true}).click();
  assert.equal(await p.evaluate(()=>G.state),'PLAY');
  await p.evaluate(()=>{
   for(let i=0;i<500;i++)ComicRewards.tick(1/60);
   if(ComicRewards.active)throw Error('offered chapter auto-repeated');
   const stored=JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));
   if(stored.comics['chapter-one-morning'].slide!==1)throw Error('reading position not saved');
   startGame(stored);G.state='PAUSE';ComicRewards.library();
  });
  assert.equal(await p.getByRole('button',{name:'Read chapter',exact:true}).count(),1);
  await p.getByRole('button',{name:'Read chapter',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('#comic-rewards img')?.naturalWidth>0);
  assert.match(await p.locator('.comic-status').textContent(),/Page 2 of/);
  await p.setViewportSize({width:390,height:844});await p.emulateMedia({reducedMotion:'reduce'});
  await p.getByRole('button',{name:'Read full-size',exact:true}).click();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await p.locator('.comic-stage').evaluate(e=>e.scrollWidth>e.clientWidth),true,'large image scrolls inside reader');
  await p.screenshot({path:'release-evidence/comic-reward-phone.png'});
  await p.getByRole('button',{name:'All memories',exact:true}).click();
  // New content arrives for a milestone already earned, without new engine code.
  const changed=structuredClone(manifest);
  changed.chapters.push({...structuredClone(changed.chapters[0]),id:'chapter-two-test',title:'New chapter from content',slides:[changed.chapters[0].slides[0]]});
  await p.route('**/assets/manhua/chapters.json',r=>r.fulfill({json:changed}));
  await p.evaluate(()=>ComicRewards.library());
  await p.getByRole('heading',{name:'New chapter from content',exact:true}).waitFor();
  assert.equal(await p.getByRole('button',{name:'Read chapter',exact:true}).count(),2);
  await p.getByRole('button',{name:'Read chapter',exact:true}).last().click();
  await p.waitForFunction(()=>document.querySelector('#comic-rewards img')?.naturalWidth>0);
  assert.equal(await p.locator('#comic-rewards img').evaluate(e=>getComputedStyle(e).animationName),'none');
  await p.getByRole('button',{name:'Finish chapter',exact:true}).click();
  assert.equal(await p.evaluate(()=>G.save.comics['chapter-two-test'].finished),true);
  // Missing art remains retryable, never consumes or blocks the game reward.
  changed.chapters.at(-1).revision=2;changed.chapters.at(-1).slides=[{...changed.chapters.at(-1).slides[0],src:'assets/manhua/missing-page.png'}];
  await p.route('**/assets/manhua/chapters.json',r=>r.fulfill({json:changed}));
  await p.evaluate(async()=>{await ComicRewards.refresh(true);await ComicRewards.refresh(true);});
  await p.evaluate(()=>ComicRewards.open(ComicRewards.manifest.chapters.find(c=>c.id==='chapter-two-test')));
  await p.getByRole('button',{name:'Retry page',exact:true}).waitFor();
  assert.equal(await p.getByRole('button',{name:'Finish chapter',exact:true}).isDisabled(),true);
  await p.getByRole('button',{name:'Return to game',exact:true}).click();
  assert.equal(await p.evaluate(()=>G.state),'PAUSE');
  // An unavailable update preserves the last validated in-session edition.
  await p.route('**/assets/manhua/chapters.json',r=>r.abort());
  await p.evaluate(async()=>{await ComicRewards.refresh(true);if(!ComicRewards.manifest.chapters.length)throw Error('lost offline edition');});
  // A fresh session with no successful manifest request uses the actual
  // embedded shipping edition, including its draft publication boundaries.
  const cold=await b.newPage();
  await cold.route('**/assets/manhua/chapters.json',r=>r.abort());
  await cold.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
  await cold.waitForFunction(()=>typeof ComicRewards!=='undefined');
  const fallback=await cold.evaluate(async()=>{await ComicRewards.refresh(true);return ComicRewards.manifest;});
  assert.deepEqual(fallback,shippingManifest,'fresh offline startup uses bundled publication status');
  await cold.close();
  assert.deepEqual(errors,[]);
  console.log('PASS comics: milestone locks, safe auto reward, frozen game, once-only offer, saved resume, live content update, phone zoom, reduced motion, missing-art retry and offline manifest fallback');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
