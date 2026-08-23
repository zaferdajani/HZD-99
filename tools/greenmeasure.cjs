const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', e=>console.error('ERR',e.message));
  await page.goto('http://127.0.0.1:8220/index.html');
  await page.waitForFunction(() => typeof startGame === 'function', { timeout: 20000 });
  console.log(await page.evaluate(async () => {
    const sv=newSave(1); sv.time=99; sv.flags.tut=1; sv.flags.woke=1;
    startGame(sv); loadRoom('A1'); G.wake=null; G.state='PLAY';
    for (let i=0;i<200;i++) await new Promise(k=>requestAnimationFrame(k));
    const ctx = cv.getContext('2d',{willReadFrequently:true});
    const stat = (label, d, n) => {
      let s=0,v=0,h=0,c=0;
      for (let i=0;i<n;i++){
        const R=d[i*4],G2=d[i*4+1],B=d[i*4+2];
        const mx=Math.max(R,G2,B), mn=Math.min(R,G2,B);
        if (mx<30) continue;                     // skip the dark
        if (!(G2>=R && G2>=B && G2-B>10)) continue;   // green-dominant only
        s += (mx-mn)/mx*100; v += mx/255*100;
        // hue in degrees
        const dd = mx-mn;
        let hh = 60*(2+(B-R)/dd);                // green sector
        h += hh; c++;
      }
      return c ? { px:c, sat:+(s/c).toFixed(1), val:+(v/c).toFixed(1), hue:+(h/c).toFixed(0) } : 'none';
    };
    const out = { onScreen: stat('screen', ctx.getImageData(0,0,cv.width,cv.height).data, cv.width*cv.height) };
    // ...and the same frame with the cinematic grade OFF, to see what the wash
    // is actually costing the greenery
    const keep = richK;
    richK = 0;
    for (let i=0;i<6;i++) await new Promise(k=>requestAnimationFrame(k));
    out.noGrade = stat('nograde', ctx.getImageData(0,0,cv.width,cv.height).data, cv.width*cv.height);
    richK = keep;
    for (let i=0;i<6;i++) await new Promise(k=>requestAnimationFrame(k));
    // ...and the fringe canvas ALONE, before anything touches it
    if (typeof fringeCv !== 'undefined' && fringeCv) {
      const fc = fringeCv.getContext('2d',{willReadFrequently:true});
      out.fringeRaw = stat('fringe', fc.getImageData(0,0,fringeCv.width,fringeCv.height).data,
                           fringeCv.width*fringeCv.height);
    }
    // the SOURCE colours the code actually asks for
    const src = ['#527c40','#5e8f4a','#6da054','#b8d86a'].map(hx=>{
      const R=parseInt(hx.slice(1,3),16),G2=parseInt(hx.slice(3,5),16),B=parseInt(hx.slice(5,7),16);
      const mx=Math.max(R,G2,B),mn=Math.min(R,G2,B),dd=mx-mn;
      return { hex:hx, sat:+((mx-mn)/mx*100).toFixed(1), val:+(mx/255*100).toFixed(1), hue:+(60*(2+(B-R)/dd)).toFixed(0) };
    });
    out.source = src;
    // ...and the flora plate, if it is here
    if (MEDIA_RAW.floraA1 && MEDIA_RAW.floraA1.naturalWidth) {
      const im=MEDIA_RAW.floraA1, W=Math.min(256,im.naturalWidth), H=Math.min(256,im.naturalHeight);
      const t=document.createElement('canvas'); t.width=W;t.height=H;
      const tc=t.getContext('2d',{willReadFrequently:true}); tc.drawImage(im,0,0,W,H);
      out.floraPlate = stat('flora', tc.getImageData(0,0,W,H).data, W*H);
    }
    return out;
  }));
  await b.close();
})();
