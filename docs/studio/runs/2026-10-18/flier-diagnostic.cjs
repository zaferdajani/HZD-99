// Read-only runtime diagnostic; run ONLY after the producer's full audit stops.
// It serves this checkout on an owned ephemeral port, never :8220, and changes
// only staged browser state. No game source, assets, build or thresholds change.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const compactMetadata = require('./compact-metadata.cjs');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../..');
const { chromium } = require(path.join(root, 'node_modules/playwright'));
const out = path.join(__dirname, 'flier-diagnostic');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const types = { '.html':'text/html', '.js':'application/javascript', '.json':'application/json', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.wav':'audio/wav', '.mp4':'video/mp4', '.webm':'video/webm' };
const server = http.createServer((req, res) => {
  try {
    let f = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!f.startsWith(root + path.sep) && f !== root) throw Error('outside checkout');
    if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const s = fs.statSync(f); if (!s.isFile()) throw Error('not file');
    res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream');
    res.setHeader('X-Served-Root', root); res.setHeader('Accept-Ranges', 'bytes');
    let start=0, end=s.size-1;
    if (req.headers.range) {
      const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range); if (!m) throw Error('bad range');
      start=Number(m[1]); end=m[2]?Math.min(Number(m[2]),end):end;
      if(start>end) { res.writeHead(416); return res.end(); }
      res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${s.size}`);
    }
    res.setHeader('Content-Length',Math.max(0,end-start+1));
    if(req.method==='HEAD'||s.size===0)return res.end();
    fs.createReadStream(f,{start,end}).on('error',()=>res.destroy()).pipe(res);
  } catch (_) { res.writeHead(404);res.end(); }
});

(async () => {
  if (!process.env.CHROMIUM_PATH) throw Error('Set CHROMIUM_PATH to the verified browser');
  fs.mkdirSync(out,{recursive:true});
  const data={scope:'STAGED renderer/asset diagnostic; no real-input combat or traversal. Alpha>24 dimensions mirror foescale, not perceived body-mass certification.',errors:[],limitations:[
    'The initial first-read is called cold only if recorded assets are actually absent; no network blocking or fake unloaded state is used.',
    'The hero yardstick is fixed fully loaded idle. Flight changes vertical silhouette: a height-only one-pose ratio cannot alone settle size/art acceptance.',
    'Enemy.draw includes its normal body presentation; hurt, telegraph and legacy travel trails are suppressed as in foescale. No pixel mask claims anatomical mass.',
    'States, animation clocks, actor placement and velocities are injected. Wingbeat samples are analytic frame selections, not video or real AI movement.',
    'Cruise and chase are sampled independently at zero bank; banked chase is a separate variant. Perch/tell/recovery are optional extra source-supported states.',
    'No scale or assertion change is proposed merely because one frame fails the existing 0.5 height floor.'
  ]};
  let browser;
  try {
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    const origin=`http://127.0.0.1:${server.address().port}`;
    const response=await fetch(origin+'/index.html'),served=Buffer.from(await response.arrayBuffer()),local=fs.readFileSync(path.join(root,'index.html'));
    assert.equal(response.headers.get('x-served-root'),root);assert.equal(sha(served),sha(local));
    data.served={indexSha256:sha(served),sameCheckout:true,ownedEphemeralPort:true};
    browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
    const page=await browser.newPage({viewport:{width:844,height:390}});
    page.on('pageerror',e=>data.errors.push(String(e)));
    await page.addInitScript(()=>localStorage.setItem('cb_intro_seen','1'));
    await page.goto(origin+'/index.html');
    await page.waitForFunction(()=>typeof startGame==='function'&&typeof drawFlierMini==='function');
    const first=await page.evaluate(()=>{
      // Stop the ordinary loop before staging; a previously queued callback can
      // run once but all draws/metrics below are synchronous within evaluate.
      requestAnimationFrame=()=>0;
      const sv=newSave(1);sv.time=99;sv.flags.tut=1;sv.flags.woke=1;
      startGame(sv);loadRoom('A1');G.wake=null;G.state='PLAY';G.boss=null;
      cam.x=cam.y=cam.shakeX=cam.shakeY=0;
      const canvas=document.createElement('canvas');canvas.width=400;canvas.height=300;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const keys=['talonMiniCruise8','talonMiniChase6','talonMiniPerch','eagleParts','roster'];
      const asset=k=>{const im=MEDIA_RAW[k];return {key:k,registered:MEDIA_SRC.images[k]||null,src:im?(im.currentSrc||im.src||null):null,width:im?(im.naturalWidth||im.width||0):0,height:im?(im.naturalHeight||im.height||0):0,tier:MEDIA_LOW[k]||0,pending:!!MEDIA_PEND[k]};};
      const bounds=()=>{const d=ctx.getImageData(0,0,400,300).data;let x0=400,y0=300,x1=-1,y1=-1,n=0;
        for(let y=0;y<300;y++)for(let x=0;x<400;x++)if(d[(y*400+x)*4+3]>24){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;}
        return {height:y1<0?0:y1-y0+1,width:x1<0?0:x1-x0+1,opaquePixels:n,bbox:n?[x0,y0,x1,y1]:null,clipped:n&&(x0===0||y0===0||x1===399||y1===299)};
      };
      const pinHero=()=>{Object.assign(player,{x:180,y:180,on:true,vx:0,vy:0,anim:1.2,swing:null,swingVis:null,hurtT:0,dashT:0,guardT:0,idleT:0,_motionPose:null,_motionBlend:null});};
      const enemy=new Enemy('flier',180,180);
      const pinEnemy=(anim=1.2,mode='cruise')=>{Object.assign(enemy,{x:180,y:180,anim,t:1,hurtT:0,lockT:0,holdT:0,packetT:0,riseT:0,perched:false,hypnoT:0,disabled:false,dead:false,tr:[],vx:mode==='banked-chase'?enemy.spd*1.6:0,vy:mode==='chase'?150:0});};
      const measure=(anim,mode)=>{pinEnemy(anim,mode);ctx.clearRect(0,0,400,300);G.lastStrip=null;
        const trace=[],oldStrip=drawStripCell,oldEagle=drawEagleMini,oldAtlas=drawAtlas;
        drawStripCell=function(...a){const ok=oldStrip(...a);trace.push({renderer:'strip',key:a[1],cell:a[2],cells:a[3],ok});return ok;};
        drawEagleMini=function(...a){const ok=oldEagle(...a);trace.push({renderer:'eagleMiniFallback',ok});return ok;};
        drawAtlas=function(...a){const ok=oldAtlas(...a);trace.push({renderer:'atlasFallback',kind:a[1],ok});return ok;};
        try{enemy.draw(ctx);}finally{drawStripCell=oldStrip;drawEagleMini=oldEagle;drawAtlas=oldAtlas;}
        return {...bounds(),anim,mode,lastStrip:G.lastStrip,trace};
      };
      window.__flierDiag={canvas,ctx,keys,asset,bounds,pinHero,enemy,pinEnemy,measure};
      const before=keys.map(asset),m=measure(1.2,'cruise'),after=keys.map(asset);
      return {build:BUILD_ID,before,after,measurement:m,png:canvas.toDataURL('image/png'),wasCold:before.find(k=>k.key==='talonMiniCruise8').width===0};
    });
    const savePng=(name,url)=>fs.writeFileSync(path.join(out,name),Buffer.from(url.split(',')[1],'base64'));
    savePng('first-read.png',first.png);delete first.png;data.firstRead=first;data.build=first.build;
    // Make readiness a measured fact. No MEDIA_RAW cache entry is deleted or
    // swapped, so an observed fallback cannot be fabricated by the diagnostic.
    await page.evaluate(()=>{requestHeroArt();for(const k of __flierDiag.keys)mediaFetch(k,1);});
    await page.waitForFunction(()=>heroArtReady()&&__flierDiag.keys.every(k=>MEDIA_RAW[k]&&MEDIA_RAW[k].naturalWidth>0&&MEDIA_LOW[k]===3),null,{timeout:45000});
    data.loaded=await page.evaluate(()=>{
      const D=__flierDiag;D.pinHero();D.ctx.clearRect(0,0,400,300);player.draw(D.ctx);
      const hero={...D.bounds(),renderer:G.heroDrawn,assets:HERO_CORE_KEYS.map(D.asset),png:D.canvas.toDataURL('image/png')};
      const cycle=(mode)=>{const t=mode==='cruise'?TALON_MINI.cruise:TALON_MINI.chase,samples=[];
        for(let i=0;i<t.cells*4;i++)samples.push(D.measure((i+.5)/(t.cells*4)*t.beat,mode));
        const sorted=[...samples].sort((a,b)=>a.height-b.height),sum=samples.reduce((s,m)=>s+m.height,0);
        return {mode,strip:{...t},samples,min:sorted[0],max:sorted.at(-1),meanHeight:sum/samples.length,minRatio:sorted[0].height/hero.height,maxRatio:sorted.at(-1).height/hero.height};
      };
      const pinned=D.measure(1.2,'cruise');pinned.ratio=pinned.height/hero.height;pinned.png=D.canvas.toDataURL('image/png');
      return {hero,assets:D.keys.map(D.asset),edraw:EDRAW_ROBO.flier,hitbox:{w:D.enemy.w,h:D.enemy.h},foescalePinned:pinned,cycles:['cruise','chase','banked-chase'].map(cycle)};
    });
    savePng('hero-yardstick.png',data.loaded.hero.png);delete data.loaded.hero.png;
    savePng('loaded-pinned.png',data.loaded.foescalePinned.png);delete data.loaded.foescalePinned.png;
    data.firstRead.ratioAgainstLaterLoadedHero=data.firstRead.measurement.height/data.loaded.hero.height;
    // Actual game renderer at phone-landscape viewport size; actor scales and
    // world zoom are untouched. Camera/positions are staged, not navigated.
    for(const cycle of data.loaded.cycles)for(const edge of ['min','max']) {
      const sample=cycle[edge];
      await page.evaluate(({anim,mode})=>{
        const D=__flierDiag;G.state='PLAY';G.wake=G.tut=G.dialog=G.item=G.cut=G.meet=G.bossEntry=G.panel=null;G.boss=null;G.toasts=[];G.impact=null;G.flash=0;
        D.pinHero();const floor=(G.roomDef.h-4)*TILE;
        player.x=430;player.y=floor-player.h;player.face=player.faceVis=1;
        D.pinEnemy(anim,mode);D.enemy.x=575;D.enemy.y=floor-player.h-35;G.enemies=[D.enemy];
        cam.x=180;cam.y=floor-300;cam.shake=cam.shakeX=cam.shakeY=0;cam.zoom=PRESENTATION.explorationZoom;
        draw(performance.now());
      },sample);
      const file=`gameplay-${cycle.mode}-${edge}.png`;await page.screenshot({path:path.join(out,file)});sample.gameplaySnapshot=file;
    }
    assert.ok(data.loaded.hero.height>40,'hero yardstick missing');
    for(const cycle of data.loaded.cycles)for(const sample of cycle.samples){
      assert.ok(!sample.clipped,'measurement canvas clipped');
      assert.ok(sample.trace.some(t=>t.renderer==='strip'&&t.ok&&t.key===cycle.strip.img),'requested full flight strip did not draw');
    }
    assert.deepEqual(data.errors,[]);data.completed=true;
    console.log(JSON.stringify({build:data.build,cold:data.firstRead.wasCold,first:data.firstRead.measurement.height,hero:data.loaded.hero.height,pinned:data.loaded.foescalePinned.ratio,cycles:data.loaded.cycles.map(c=>({mode:c.mode,min:c.minRatio,max:c.maxRatio,meanHeight:c.meanHeight})),errors:data.errors}));
  } catch(e) {data.completed=false;data.failure=String(e.stack||e);process.exitCode=1;console.error(e);}
  finally {const saved=compactMetadata(data);saved.embeddedURLPolicy='Embedded base64 media replaced with MIME, byte count, content and URL SHA-256; original asset bytes untouched.';fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(saved,null,2));if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
