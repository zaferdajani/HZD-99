// Diagnostic instrumentation of the ORIGINAL roster fixture/assertions.
// No game writes and no acceptance changes. Producer owns browser scheduling.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const http = require('node:http');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../../../..');
const sourcePath = path.join(root, 'tests/infection-roster.cjs');
const out = path.resolve(process.env.FLIER_ROSTER_OUT || path.join(__dirname, 'roster-flier'));
fs.mkdirSync(out, { recursive: true });
let src = fs.readFileSync(sourcePath, 'utf8');
const replaceOnce = (old, next) => {
  if (src.split(old).length !== 2) throw new Error('Expected exactly one diagnostic injection point: ' + old);
  src = src.replace(old, next);
};
replaceOnce('const out = [];', `const out = [];
    const flierRecords = [];
    const realStrip = drawStripCell;
    let flierLastStrip = null;
    drawStripCell = function(c, key, cell, cells, cx, base, h, flip, pure) {
      const result = realStrip.apply(this, arguments);
      if (/^talonMini/.test(key)) {
        const im=MEDIA_RAW[key], m=c.getTransform();
        flierLastStrip={key,cell,cells,cx,base,h,flip,pure,result,
          image:im?{width:im.naturalWidth,height:im.naturalHeight,tier:MEDIA_LOW[key]}:null,
          normalizedEyes:EYE_MAP[key]&&EYE_MAP[key].e[cell],
          contextTransform:[m.a,m.b,m.c,m.d,m.e,m.f],
          worldTransform:INF_S2W?[
            INF_S2W.a*m.a+INF_S2W.c*m.b,INF_S2W.b*m.a+INF_S2W.d*m.b,
            INF_S2W.a*m.c+INF_S2W.c*m.d,INF_S2W.b*m.c+INF_S2W.d*m.d,
            INF_S2W.a*m.e+INF_S2W.c*m.f+INF_S2W.e,INF_S2W.b*m.e+INF_S2W.d*m.f+INF_S2W.f]:null};
      }
      return result;
    };`);
replaceOnce('side[d] = body._eyeN ? [body._eyeW[0] - cx(), body._eyeW[1] - cy()] : null;',
`side[d] = body._eyeN ? [body._eyeW[0] - cx(), body._eyeW[1] - cy()] : null;
        if(c.k==='flier') {
          const canvas=document.querySelector('canvas');
          const shot=canvas.toDataURL('image/png');
          const strip=JSON.parse(JSON.stringify(flierLastStrip));
          const im=strip&&MEDIA_RAW[strip.key];
          let rawCell=null,rawOverlay=null,bodyOverlay=null,bodyMask=null;
          if(im) {
            const cw=im.naturalWidth/strip.cells,ch=im.naturalHeight;
            const cellCanvas=document.createElement('canvas');cellCanvas.width=cw;cellCanvas.height=ch;
            cellCanvas.getContext('2d').drawImage(im,strip.cell*cw,0,cw,ch,0,0,cw,ch);
            rawCell=cellCanvas.toDataURL('image/png');
            const cc=cellCanvas.getContext('2d');
            cc.strokeStyle='#00ffff';cc.lineWidth=1;
            const ep=strip.normalizedEyes||[];
            for(let i=0;i<ep.length;i+=2){const ex=ep[i]*cw,ey=ep[i+1]*ch;cc.strokeRect(ex-4,ey-4,8,8);}
            rawOverlay=cellCanvas.toDataURL('image/png');
            const oc=document.createElement('canvas');oc.width=512;oc.height=512;
            const ox=oc.getContext('2d');
            ox.translate(256-cx()*2,256-cy()*2);ox.scale(2,2);
            ox.save();ox.transform(...strip.worldTransform);ox.translate(strip.cx,strip.base);
            if(strip.flip)ox.scale(-1,1);
            const dw=strip.h*cw/ch;
            ox.drawImage(im,strip.cell*cw,0,cw,ch,-dw/2,-strip.h,dw,strip.h);ox.restore();
            bodyMask=oc.toDataURL('image/png');
            ox.strokeStyle='#00ffff';ox.lineWidth=.5;ox.strokeRect(body.x,body.y,body.w,body.h);
            ox.strokeStyle='#ffff00';ox.beginPath();ox.moveTo(cx()-60,cy()+body.h*.75);ox.lineTo(cx()+60,cy()+body.h*.75);ox.stroke();
            ox.strokeStyle='#ff66ff';
            for(let i=0;i<body._eyeN;i++){const ex=body._eyeW[i*2],ey=body._eyeW[i*2+1];ox.strokeRect(ex-2,ey-2,4,4);}
            bodyOverlay=oc.toDataURL('image/png');
          }
          flierRecords.push({facing:d,room:c.id,kind:c.k,
            actor:{x:body.x,y:body.y,w:body.w,h:body.h,anim:body.anim,vx:body.vx,vy:body.vy,
              dir:body.dir,faceVis:body.faceVis,perched:body.perched,holdT:body.holdT,packetT:body.packetT,riseT:body.riseT,spd:body.spd},
            eyeWorld:Array.from(body._eyeW).slice(0,body._eyeN*2),eyeOffset:side[d],strip,
            originalDownBound:body.h*.75,shot,rawCell,rawOverlay,bodyMask,bodyOverlay});
        }`);
replaceOnce('return { cast: out, wolf, ph, slow };', `drawStripCell=realStrip; return { cast: out, wolf, ph, slow, flierRecords };`);
replaceOnce('const sec = (n) =>', `for(const rec of R.flierRecords) {
    for(const key of ['shot','rawCell','rawOverlay','bodyMask','bodyOverlay']) if(rec[key]) {
      const filename='facing-'+rec.facing+'-'+key+'.png';
      require('node:fs').writeFileSync(${JSON.stringify(out)}+'/'+filename,Buffer.from(rec[key].split(',')[1],'base64'));
      rec[key]=filename;
    }
  }
  require('node:fs').writeFileSync(${JSON.stringify(out)}+'/result.json',JSON.stringify(R.flierRecords,null,2)+'\\n');
  const sec = (n) =>`);
// Serve inside this invocation: separate executor calls need not share ports.
// An ephemeral port prevents reuse of another author's :8220 server.
const types={'.html':'text/html','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
  try{
    let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(file!==root&&!file.startsWith(root+path.sep))throw Error('outside checkout');
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    const stat=fs.statSync(file);if(!stat.isFile())throw Error('not file');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    res.setHeader('X-Served-Root',root);res.setHeader('Accept-Ranges','bytes');
    let start=0,end=stat.size-1;
    if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)throw Error('bad range');start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(start>end){res.writeHead(416);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
    res.setHeader('Content-Length',Math.max(0,end-start+1));
    if(req.method==='HEAD'||stat.size===0)return res.end();
    fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }catch(_){res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(origin+'/index.html'),payload=Buffer.from(await response.arrayBuffer());
  const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
  if(response.headers.get('x-served-root')!==root||sha(payload)!==sha(fs.readFileSync(path.join(root,'index.html'))))throw Error('Served checkout mismatch');
  fs.writeFileSync(path.join(out,'served-identity.json'),JSON.stringify({sameCheckout:true,ownedEphemeralPort:true,indexSha256:sha(payload)},null,2)+'\n');
  replaceOnce("'http://127.0.0.1:8220/index.html'",JSON.stringify(origin+'/index.html'));
  replaceOnce('await browser.close();',"await browser.close(); process.emit('flier-diagnostic-finished');");
  process.once('flier-diagnostic-finished',()=>server.close());
  process.once('exit',()=>server.close());
  const m = new Module(sourcePath, module);
  m.filename = sourcePath;
  m.paths = Module._nodeModulePaths(path.dirname(sourcePath));
  m._compile(src, sourcePath);
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
