// Staged saved-restoration setup, then ordinary keyboard movement and live rendering.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'../../../../..'),{chromium}=require(path.join(root,'node_modules/playwright'));
(async()=>{const server=spawn(process.execPath,['tests/serve.cjs'],{cwd:root,stdio:'ignore'});let browser;try{
await new Promise(r=>setTimeout(r,500));browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/clawbyte-browser'});
const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:8220/index.html');await page.waitForFunction(()=>typeof startGame==='function');
await page.evaluate(async()=>{const s=newSave(1);s.time=99;Object.assign(s.flags,{woke:1,tut:1,heal:1,crystal:1,nfMeet:1,nfBreak:1,bossChime:1,bossGlitch:1,sageTame_GA1D:1});startGame(s);loadRoom('A4');G.state='PLAY';G.dialog=G.wake=G.cut=G.meet=G.bossEntry=G.tut=G.item=null;G.panels=null;G.enemies=[];G.toasts=[];G.roomTitle=0;for(const k of Object.keys(MEDIA_SRC.images))mediaFetch(k,1);await new Promise(r=>setTimeout(r,5000));G.boss.x=500;G.boss.y=480-G.boss.h;G.boss.pureT=5;player.x=850;player.y=480-player.h;window.motionCells=[];const drawCell=drawStripCell;drawStripCell=function(...a){if(a[1]==='beastStudioStalk')motionCells.push(a[2]);return drawCell.apply(this,a);};});
// The saved guardian can open its restoration dialogue during preload. Dismiss it with ordinary input before sampling motion.
for(let i=0;i<30 && await page.evaluate(()=>G.state!=='PLAY');i++){await page.keyboard.press('Enter');await page.waitForTimeout(120);}
await page.evaluate(()=>{G.boss.x=500;player.x=850;motionCells.length=0;});
const samples=[];await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
for(let i=0;i<8;i++){await page.waitForTimeout(350);samples.push(await page.evaluate(()=>({x:G.boss.x,y:G.boss.y,st:G.boss.st,walking:G.boss.petWalk,gait:G.boss._gaitPh,purified:G.boss.purified,eyeClass:infEyeClass(G.boss),state:G.state,build:BUILD_ID})));if([0,3,7].includes(i))await page.screenshot({path:path.join(__dirname,'walk-'+i+'.png')});}
const cells=await page.evaluate(()=>[...new Set(motionCells)]);const result={scope:'Staged saved guardian, then real keyboard and elapsed-time frames; not a full campaign or all-direction gait certification.',samples,cells,errors};fs.writeFileSync(path.join(__dirname,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(errors.length||cells.length<3||samples.at(-1).x<=samples[0].x||samples.some(s=>s.eyeClass!==null))throw Error('Restored walk evidence failed');
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
