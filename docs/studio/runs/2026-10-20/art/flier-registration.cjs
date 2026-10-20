// Deterministic staged registration probe. All flight cells, both facings/banks.
// No game/test/build writes; existing 16.5px body-bound is retained, not widened.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../..');
const {chromium}=require(path.join(root,'node_modules/playwright'));
const out=path.resolve(process.env.FLIER_REGISTRATION_OUT||path.join(__dirname,'registration'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 try{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(f!==root&&!f.startsWith(root+path.sep))throw Error('outside checkout');if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');
  const s=fs.statSync(f);if(!s.isFile())throw Error('not file');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.setHeader('X-Served-Root',root);res.setHeader('Accept-Ranges','bytes');
  let a=0,b=s.size-1;if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)throw Error('bad range');a=+m[1];b=m[2]?Math.min(+m[2],b):b;if(a>b){res.writeHead(416);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${a}-${b}/${s.size}`);}
  res.setHeader('Content-Length',Math.max(0,b-a+1));if(req.method==='HEAD'||s.size===0)return res.end();fs.createReadStream(f,{start:a,end:b}).on('error',()=>res.destroy()).pipe(res);
 }catch(_){res.writeHead(404);res.end();}
});
(async()=>{
 fs.mkdirSync(out,{recursive:true});let browser;const data={scope:'Deterministic staged all-flight-cell registration; not natural AI or input route',errors:[],samples:[]};
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  const r=await fetch(origin+'/index.html'),bytes=Buffer.from(await r.arrayBuffer());if(r.headers.get('x-served-root')!==root||sha(bytes)!==sha(fs.readFileSync(path.join(root,'index.html'))))throw Error('Wrong served checkout');
  data.served={ownedEphemeralPort:true,indexSha256:sha(bytes),sameCheckout:true};
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});const page=await browser.newPage({viewport:{width:844,height:390}});
  page.on('pageerror',e=>data.errors.push(String(e)));await page.addInitScript(()=>localStorage.setItem('cb_intro_seen','1'));await page.goto(origin+'/index.html');
  await page.waitForFunction(()=>typeof startGame==='function'&&typeof infEyeWorldBegin==='function');
  await page.evaluate(()=>{
    requestAnimationFrame=()=>0;const s=newSave(1);s.time=99;s.flags.tut=s.flags.woke=1;startGame(s);loadRoom('A6');G.state='PLAY';
    if(typeof PRE!=='undefined'){PRE.on=false;PRE.q.length=0;}for(const k of ['talonMiniCruise8','talonMiniChase6'])mediaFetch(k,1);
  });
  await page.waitForFunction(()=>['talonMiniCruise8','talonMiniChase6'].every(k=>MEDIA_RAW[k]&&MEDIA_LOW[k]===3),null,{timeout:45000});
  const result=await page.evaluate(()=>{
   const e=new Enemy('flier',137,139),canvas=document.createElement('canvas');canvas.width=canvas.height=300;const c=canvas.getContext('2d',{willReadFrequently:true});
   const oldStrip=drawStripCell;let trace=null;
   drawStripCell=function(c,key,cell,cells,x,base,h,flip,pure){const ok=oldStrip.apply(this,arguments);if(/^talonMini/.test(key)){const m=c.getTransform();trace={key,cell,cells,x,base,h,flip,ok,transform:[m.a,m.b,m.c,m.d,m.e,m.f],eyeMap:EYE_MAP[key].e[cell],tier:MEDIA_LOW[key]};}return ok;};
   const samples=[];
   try{
    for(const mode of ['cruise','chase'])for(const facing of [-1,1])for(const bank of [0,-1,1]){
     const T=TALON_MINI[mode];for(let cell=0;cell<T.cells;cell++){
      Object.assign(e,{x:137,y:139,anim:(cell+.5)/T.cells*T.beat,vx:bank*e.spd,vy:mode==='chase'?150:0,dir:facing,faceVis:facing,perched:false,holdT:0,packetT:0,riseT:0,hurtT:0,hypnoT:0,dead:false,disabled:false,tr:[]});
      // Bank speed is below the fast threshold for cruise; chase uses vy150.
      c.resetTransform();c.clearRect(0,0,300,300);infEyeWorldBegin(c);trace=null;e.draw(c);
      const mask=canvas.toDataURL('image/png'),pixels=c.getImageData(0,0,300,300).data;
      let x0=300,y0=300,x1=-1,y1=-1,n=0;for(let y=0;y<300;y++)for(let x=0;x<300;x++)if(pixels[(y*300+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;}
      const eye=Array.from(e._eyeW).slice(0,e._eyeN*2),offset=eye.length?[eye[0]-150,eye[1]-150]:null;
      c.strokeStyle='#00ffff';c.lineWidth=.5;c.strokeRect(e.x,e.y,e.w,e.h);c.strokeStyle='#ffff00';c.beginPath();c.moveTo(90,166.5);c.lineTo(210,166.5);c.stroke();c.strokeStyle='#ff66ff';for(let i=0;i<eye.length;i+=2)c.strokeRect(eye[i]-2,eye[i+1]-2,4,4);
      const overlay=canvas.toDataURL('image/png');
      const im=MEDIA_RAW[T.img],cw=im.naturalWidth/T.cells,ch=im.naturalHeight,raw=document.createElement('canvas');raw.width=cw;raw.height=ch;const rc=raw.getContext('2d');rc.drawImage(im,cell*cw,0,cw,ch,0,0,cw,ch);
      const rawCell=raw.toDataURL('image/png');rc.strokeStyle='#00ffff';rc.lineWidth=1;const p=EYE_MAP[T.img].e[cell];for(let i=0;i<p.length;i+=2)rc.strokeRect(p[i]*cw-4,p[i+1]*ch-4,8,8);
      samples.push({mode,facing,bank,cell,anim:e.anim,velocity:[e.vx,e.vy],size:[e.w,e.h],trace,eyeWorld:eye,eyeOffset:offset,originalDownBound:16.5,
       originalBoundPass:!!offset&&Math.abs(offset[0])<=26*2.6&&offset[1]<=16.5&&offset[1]>=-26*2.6,
       bbox:n?[x0,y0,x1,y1]:null,height:n?y1-y0+1:0,width:n?x1-x0+1:0,opaquePixels:n,clipped:x0===0||y0===0||x1===299||y1===299,
       rawCell,rawOverlay:raw.toDataURL('image/png'),mask,overlay});
     }
    }
   }finally{drawStripCell=oldStrip;}
   return {build:BUILD_ID,edraw:EDRAW_ROBO.flier,flight:TALON_MINI,samples};
  });
  data.build=result.build;data.edraw=result.edraw;data.flight=result.flight;data.samples=result.samples;
  for(const s of data.samples){const stem=`${s.mode}-f${s.facing}-bank${s.bank}-cell${s.cell}`;for(const k of ['rawCell','rawOverlay','mask','overlay']){const f=stem+'-'+k+'.png';fs.writeFileSync(path.join(out,f),Buffer.from(s[k].split(',')[1],'base64'));s[k]=f;}}
  data.boundFailures=data.samples.filter(s=>!s.originalBoundPass).map(s=>({mode:s.mode,facing:s.facing,bank:s.bank,cell:s.cell,eyeOffset:s.eyeOffset}));
  data.rendererFailures=data.samples.filter(s=>!s.trace||!s.trace.ok||s.trace.key!==data.flight[s.mode].img||s.trace.cell!==s.cell||s.trace.tier!==3).length;
  data.clipped=data.samples.filter(s=>s.clipped).length;
  data.completed=true;data.passed=data.boundFailures.length===0&&data.rendererFailures===0&&data.clipped===0&&data.errors.length===0;
  console.log(JSON.stringify({build:data.build,samples:data.samples.length,boundFailures:data.boundFailures,rendererFailures:data.rendererFailures,clipped:data.clipped,errors:data.errors}));
  if(!data.passed)process.exitCode=1;
 }catch(e){data.completed=false;data.failure=String(e.stack||e);process.exitCode=1;console.error(e);}
 finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(data,null,2)+'\n');if(browser)await browser.close();await new Promise(r=>server.close(r));}
})();
