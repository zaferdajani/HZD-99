// Exercise production motion clocks, collision-resolved gait and cue routing.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'});
  try {
    const page = await browser.newPage({viewport:{width:960,height:540}});
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:8220/index.html');
    await page.waitForFunction(() => typeof startGame === 'function');
    const result = await page.evaluate(async () => {
      window.update = () => {};
      const sv = newSave(1); sv.time=99; sv.flags.tut=sv.flags.woke=1;
      startGame(sv); loadRoom('A4');
      G.state='PLAY'; G.dialog=G.cut=G.wake=G.bossEntry=null;
      G.enemies=[]; G.projs=[]; player.iT=100;
      for (const k of BEAST_STRIPS) mediaFetch(k,1);
      const deadline=performance.now()+20000;
      while (!BEAST_STRIPS.every(k=>MEDIA_RAW[k]?.naturalWidth) && performance.now()<deadline)
        await new Promise(r=>setTimeout(r,50));
      const missing=BEAST_STRIPS.filter(k=>!MEDIA_RAW[k]?.naturalWidth);
      // Decode every delivered frame, including contact flashes. A valid
      // image URL is insufficient: an over-aggressive matte can erase a body.
      const assets=[];
      for (const k of BEAST_STRIPS.filter(k=>/^(beastStudio|beastGallop|beastRearSwipe|beastHurt)/.test(k))) {
        const im=MEDIA_RAW[k], n=k==='beastHurt'?12:/Swipe$/.test(k)&&k!=='beastRearSwipe'||k==='beastStudioStalk'||k==='beastGallop'?24:30;
        const mask=document.createElement('canvas');mask.width=im.width;mask.height=im.height;
        const q=mask.getContext('2d',{willReadFrequently:true});q.drawImage(im,0,0);
        const cw=im.width/n, counts=[];
        for(let f=0;f<n;f++){
          const d=q.getImageData(f*cw,0,cw,im.height).data;let count=0;
          for(let i=3;i<d.length;i+=4)if(d[i]>32)count++;
          counts.push(count);
        }
        assets.push({key:k,ratio:Math.min(...counts)/Math.max(...counts),frames:n});
      }
      const audio=[]; const decoder=new OfflineAudioContext(1,32000,32000);
      for(const cue of ['step','breath','coil','leap','swipe','land','hurt','roar','arrive','awake']) {
        const response=await fetch(MEDIA_SRC.audio['nf_'+cue]);
        const buffer=await decoder.decodeAudioData(await response.arrayBuffer());
        const samples=buffer.getChannelData(0);let peak=0,energy=0,tail=0;
        for(let i=0;i<samples.length;i++) {
          const v=Math.abs(samples[i]);peak=Math.max(peak,v);energy+=v*v;
          if(i>samples.length-160)tail=Math.max(tail,v);
        }
        audio.push({cue,duration:buffer.duration,peak,rms:Math.sqrt(energy/samples.length),tail});
      }
      const b=G.boss, cv=document.createElement('canvas');cv.width=cv.height=600;
      const c=cv.getContext('2d'); const out={missing,assets,audio};
      const state=(st,t)=>{ b.st=st;b.t=t;b.stagT=b.hurtT=0;b.dead=false;b.phase=1;
        b._recoilT=0;b.hp=b.hpMax;b.face=b.faceVis=-1;b.nullSeq=0;beastMotionBegin(b); };
      state('crouch',1);
      b.t=.4;
      beastStrip(c,b);const before=G.lastStrip;
      for(let i=0;i<20;i++)beastStrip(c,b);
      out.repeatDraw=before===G.lastStrip && b._motionDuration===1;
      out.coil=G.lastStrip;
      state('stalk',.6); b._gaitPh=.2; b.vx=280;
      beastMotionBegin(b);beastMotionEnd(b,1/30);
      out.wall=b._gaitPh;
      beastMotionBegin(b);b.x+=BEAST_STRIDE/4;beastMotionEnd(b,1/30);
      out.travel=b._gaitPh;
      const airborne=[];
      state('pounce',1);b.leapT0=10;b.leapDuration=.8;
      for(let i=0;i<24;i++){b.anim=10+i/30;b.vy=-800+i/24*1600;beastStrip(c,b);airborne.push(G.lastStrip);}
      out.airFrames=new Set(airborne).size;
      const sounds=[];const originalSfx=sfx,originalPlay=playBuf;
      sfx=k=>sounds.push(k);playBuf=k=>{sounds.push(k);return true;};
      for (const phase of [1,2]) {
        state('swipewarn',TELL_SWIPE);b.phase=phase;b.swiped2=false;
        b._motionState=null;b.vx=b.vy=0;
        const phases=[];
        for(let i=0;i<90;i++){
          const prev=b.st;b.update(1/30);
          if(prev!==b.st)phases.push({st:b.st,t:b.t});
          if(b.st==='idle')break;
        }
        out['phase'+phase]=phases;
      }
      out.sounds=sounds;sfx=originalSfx;playBuf=originalPlay;
      const run=[];state('run',1); b.x=80;b.y=15*TILE-b.h;
      b.roarCD=b.ambushCD=100;b.vx=0;player.x=850;
      for(let i=0;i<5;i++){b.update(1/30);run.push(b.vx);}
      out.acceleration=run;
      return out;
    });
    assert.deepEqual(result.missing,[],'every integrated motion asset loads');
    for(const a of result.assets)assert(a.ratio>.5,a.key+' loses its body during keying');
    for(const a of result.audio) {
      assert(a.duration>.1 && a.duration<1.5,a.cue+' event length');
      assert(a.peak<1 && a.rms>.001,a.cue+' silent or clipping');
      assert(a.tail<.04,a.cue+' hard cut at tail');
    }
    assert(result.repeatDraw,'draw calls cannot rebase the wind-up clock');
    assert.equal(result.wall,.2,'blocked feet do not run in place');
    assert(Math.abs(result.travel-.45)<1e-6,'stride follows actual resolved travel');
    assert(result.airFrames>=10,'pounce has a continuous pose sequence, not three holds');
    assert.equal(result.phase1.filter(x=>x.st==='swipe').length,1);
    assert.equal(result.phase2.filter(x=>x.st==='swipe').length,2);
    assert(result.phase2.filter(x=>x.st==='swipewarn').every(x=>x.t>=.5),'second rake keeps a readable tell');
    assert.equal(result.sounds.filter(x=>x==='nf_swipe').length,3,'one cue per committed swipe');
    assert(!result.sounds.some(x=>['atk','dash','land','hzd_atk1'].includes(x)),'boss cannot voice the hero');
    assert(result.acceleration.every((x,i,a)=>!i||Math.abs(x-a[i-1])<=35.01),'run accelerates at a bounded rate');
    assert.deepEqual(errors,[]);
    console.log('PASS: loaded strips, render-independent clocks, planted gait, '+result.airFrames+' airborne poses, fair phase-two chain, distinct sound and acceleration');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
