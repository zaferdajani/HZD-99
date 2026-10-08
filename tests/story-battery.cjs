// Real assembled game: quest cell is found, reserved, consumed once and saved.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});
 try {
  const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
  await p.waitForFunction(()=>typeof startGame==='function');
  const result=await p.evaluate(()=>{
   const checks=[],check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
   window.requestAnimationFrame=()=>0;
   const save=newSave(1);save.time=99;save.flags.woke=save.flags.tut=1;
   startGame(save);PURIFY_VID.memory=null;PURIFY_VID.gift=null;
   const stage=r=>{loadRoom(r);G.state='PLAY';G.wake=null;G.cut=null;G.dialog=null;G.trans=null;};
   const finish=()=>{let n=0;while(G.state==='DIALOG'&&G.dialog&&n++<40){const d=G.dialog;G.dialog=null;G.state='PLAY';if(d.onEnd)d.onEnd();}check('dialogue terminates',n<40);};
   stage('A0B');let ratchet=G.statics.find(s=>s.extra==='ratchet');
   check('fresh cat carries no cell',invCount('batt')===0&&invCount('ratchetCell')===0);
   doInteract(ratchet);finish();check('cannot wake before finding battery',!npcLive(ratchet));
   const drawer=G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt');
   doInteract(drawer);finish();check('drawer grants unique battery',invCount('ratchetCell')===1&&invCount('batt')===0);
   doInteract(drawer);check('repeated interaction cannot duplicate',invCount('ratchetCell')===1);
   persist();const saved=JSON.parse(localStorage.getItem(saveKeyFor(G.save.theme)));startGame(saved);stage('A0B');
   check('found battery persists',invCount('ratchetCell')===1);
   check('drawer stays open after reload',G.statics.find(s=>s.type==='chest'&&s.extra==='it:batt').opened);
   stage('A1');const servo=G.statics.find(s=>s.extra==='servo');doInteract(servo);finish();
   check('Ratchet battery cannot be spent on Servo',!npcLive(servo)&&invCount('ratchetCell')===1);
   stage('A0B');ratchet=G.statics.find(s=>s.extra==='ratchet');doInteract(ratchet);finish();

      // Complete the actual repair controls; dialogue alone must not wake him.
      if (G.state !== 'REPAIR') throw new Error('Ratchet repair did not open');
      for (const [piece,target] of [['cell','socket'],['positive','plus'],['negative','minus'],['bridge','relay']]) {
        document.querySelector('[data-piece="'+piece+'"]').click();
        document.querySelector('[data-target="'+target+'"]').click();
      }
      document.querySelector('.repair-power').click();
      for (let i=0;i<90 && G.state==='REPAIR';i++) update(1/60);
   finish();
   check('Ratchet cell installed, distinct spare granted',npcLive(ratchet)&&invCount('ratchetCell')===0&&invCount('batt')===1);
   G.state='PLAY';doInteract(ratchet);finish();check('spare not duplicated',invCount('batt')===1);
   stage('A1');doInteract(G.statics.find(s=>s.extra==='servo'));finish();
   check('separate spare wakes Servo',npcLive(G.statics.find(s=>s.extra==='servo'))&&invCount('batt')===0);
   const legacy=newSave(1);delete legacy.storyVersion;legacy.items={batt:1};legacy.flags.tut=legacy.flags.woke=1;
   startGame(legacy);stage('A0B');doInteract(G.statics.find(s=>s.extra==='ratchet'));finish();
   check('old save retains its original rescue path',npcLive(G.statics.find(s=>s.extra==='ratchet'))&&invCount('batt')===0);
   return checks;
  });
  assert.deepEqual(errors,[]);console.log('PASS',result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

