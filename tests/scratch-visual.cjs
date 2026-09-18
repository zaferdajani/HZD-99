const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium'});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>window.requestAnimationFrame=()=>0);await page.goto(process.env.GAME_URL||'http://127.0.0.1:8220/index.html');
 const result=await page.evaluate(async()=>{
  mediaFetch('swingSingleFx',1);for(let i=0;i<100&&!MEDIA_RAW.swingSingleFx?.naturalWidth;i++)await new Promise(r=>setTimeout(r,100));
  if(!MEDIA_RAW.swingSingleFx?.naturalWidth)throw Error('Missing scratch FX');
  const save=newSave(1);save.flags.tut=1;save.flags.woke=1;startGame(save);G.wake=null;
  const rows=[];
  for(const face of [-1,1])for(const combo of [0,1,2,3])for(const tail of [false,true]){
   const p=new Player(0,0);p.on=true;p.face=p.faceVis=face;const charged=combo===3,dur=charged?.32:.24;
   p.startScratchWake({t0:dur,combo,charged,weaponMode:'claws',wield:0,ang:face<0?Math.PI:0});
   const w=p.scratchWake;w.x=320;w.y=240;const age=tail?dur+.10:dur*.75;w.t=w.t0-age;
   const cv=document.createElement('canvas');cv.width=640;cv.height=480;const c=cv.getContext('2d');p.drawScratchWake(c);
   const data=c.getImageData(0,0,640,480).data;let far=0,energy=0,count=0,back=0;
   for(let y=0;y<480;y++)for(let x=0;x<640;x++){const i=(y*640+x)*4;if(data[i+3]>25&&data[i+2]>80){const dx=(x+.5-320)*face;far=Math.max(far,dx);back=Math.min(back,dx);energy+=data[i+3];count++;}}
   rows.push({face,combo,tail,reach:w.reach,far,back,energy,count});
  }return{rows,build:BUILD_ID};
 });
 for(const row of result.rows){assert.ok(row.count>100,JSON.stringify(row));assert.ok(row.far>=row.reach*.82&&row.far<=row.reach+1,'visible cyan tip must match contact reach '+JSON.stringify(row));assert.ok(row.back>=-1,'scratch must face target');}
 for(const row of result.rows.filter(r=>!r.tail)){const mirror=result.rows.find(r=>r.face===-row.face&&r.combo===row.combo&&!r.tail),tail=result.rows.find(r=>r.face===row.face&&r.combo===row.combo&&r.tail);assert.ok(Math.abs(row.far-mirror.far)<=1);assert.ok(tail.energy>0&&tail.energy<row.energy*.75,'recovery light fades');}
 assert.deepEqual(errors,[]);fs.mkdirSync('release-evidence',{recursive:true});fs.writeFileSync('release-evidence/scratch-visual.json',JSON.stringify(result,null,2));console.log('PASS 16 pixel-measured scratch/fade samples, facing symmetry, visual/contact reach; build '+result.build);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
