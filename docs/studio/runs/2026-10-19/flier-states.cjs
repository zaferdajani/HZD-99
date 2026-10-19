// Staged body/transition/readability samples. Baseline serves the exact parent
// assembled page from git; candidate serves this checkout. Neither edits it.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),out=path.join(__dirname,'graphics'),parent='69640ed83d72d451cfb6f0b59fafb2c029cc5802';
const baseline=execFileSync('git',['show',parent+':index.html'],{cwd:root,maxBuffer:30*1024*1024});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const server=http.createServer((req,res)=>{try{
 let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname),old=url.startsWith('/before/');if(old)url=url.slice(7);
 let file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep))throw Error('outside root');
 if(old&&url==='/index.html'){res.setHeader('Content-Type','text/html');res.setHeader('X-Source-Ref',parent);return res.end(baseline);}
 if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const st=fs.statSync(file),types={'.html':'text/html','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.mp4':'video/mp4','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');let start=0,end=st.size-1;
 if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)throw Error('range');start=+m[1];end=m[2]?Math.min(+m[2],end):end;if(start>end){res.writeHead(416);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${st.size}`);}
 res.setHeader('Content-Length',Math.max(0,end-start+1));if(req.method==='HEAD'||!st.size)return res.end();fs.createReadStream(file,{start,end}).pipe(res);
}catch(e){res.writeHead(404);res.end();}});
(async()=>{fs.mkdirSync(out,{recursive:true});let browser;const result={scope:'STAGED placement/state/animation/facing and manual eye-travel; not natural AI, input traversal or motion-video certification.',parent,samples:[],errors:[],served:{before:hash(baseline),after:hash(fs.readFileSync(path.join(root,'index.html')))}};
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 for(const revision of ['before','after']){
  const page=await browser.newPage({viewport:{width:844,height:390}});page.on('pageerror',e=>result.errors.push(String(e)));
  await page.goto(origin+(revision==='before'?'/before':'')+'/index.html');await page.waitForFunction(()=>typeof startGame==='function');
  await page.evaluate(()=>{requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;Object.assign(s.flags,{tut:1,woke:1,heal:1});startGame(s);loadRoom('A1');requestHeroArt();for(const k of ['talonMiniCruise8','talonMiniChase6','talonMiniPerch','eagleParts'])mediaFetch(k,1);});
  await page.waitForFunction(()=>heroArtReady()&&['talonMiniCruise8','talonMiniChase6','talonMiniPerch','eagleParts'].every(k=>MEDIA_RAW[k]?.naturalWidth>0&&MEDIA_LOW[k]===3));
  for(const dir of revision==='before'?[1]:[-1,1])for(const state of ['cruise','chase','perch','hold','packet','rise']){
   const sample=await page.evaluate(({state,dir})=>{
    G.state='PLAY';G.wake=G.tut=G.dialog=G.item=G.cut=G.meet=G.bossEntry=G.panel=null;G.boss=null;G.toasts=[];G.impact=null;G.flash=0;infEyeClearAll();
    const floor=(G.roomDef.h-4)*TILE;Object.assign(player,{x:430,y:floor-player.h,on:true,vx:0,vy:0,anim:1.2,swing:null,swingVis:null,hurtT:0,dashT:0,guardT:0,idleT:0,_motionPose:null,_motionBlend:null});
    const e=new Enemy('flier',575,floor-player.h-35);Object.assign(e,{anim:1.2,t:1,hurtT:0,lockT:0,holdT:state==='hold'?.4:0,packetT:state==='packet'?.4:0,riseT:state==='rise'?.4:0,perched:state==='perch',hypnoT:0,tr:[],dir,face:dir,faceVis:dir,vx:state==='chase'?dir*e.spd*1.6:0,vy:state==='chase'?150:0});
    G.enemies=[e];cam.x=180;cam.y=floor-300;cam.shake=cam.shakeX=cam.shakeY=0;cam.zoom=PRESENTATION.explorationZoom;
    // The final world strip belongs to whichever actor drew last (usually
    // the hero). Probe this enemy separately; do not mislabel that global hook.
    G.lastStrip=null;e.draw(document.createElement('canvas').getContext('2d'));const actorStrip=G.lastStrip;
    draw(performance.now());window.__stateFlier=e;
    return {state,dir,build:BUILD_ID,actorStrip,lastGlobalStrip:G.lastStrip,hitbox:{w:e.w,h:e.h},eye:infEyeClass(e),anchor:e._eyeN?[e._eyeW[0],e._eyeW[1]]:null};
   },{state,dir});
   const file=`${revision}-${state}-${dir}.png`;await page.screenshot({path:path.join(out,file)});result.samples.push({...sample,file});
  }
  if(revision==='after')result.trail=await page.evaluate(()=>{const e=__stateFlier;e.holdT=e.packetT=e.riseT=0;e.perched=false;e.vy=0;e.vx=150;infEyeClearAll();for(let i=0;i<35;i++){e.x+=2;e.anim+=1/60;infEyeUpdate(1/60);draw(performance.now());}const m=infEyeStats();e.vx=0;for(let i=0;i<150;i++){infEyeUpdate(1/60);draw(performance.now());}return {classification:infEyeClass(e),moving:{red:m.red,purple:m.purple,live:m.live},stillLive:infEyeParticles(e).length,glow:e._eyeN>0};});
  await page.close();
 }
 result.completed=true;
}catch(e){result.failure=String(e.stack||e);process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(browser)await browser.close();await new Promise(r=>server.close(r));}})();
