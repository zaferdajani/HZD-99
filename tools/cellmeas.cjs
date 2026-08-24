// EVERY STATE CELL'S FIGURE, MEASURED — because "she looks slimmer when she
// charges" is a number, not an opinion.
//
// Every cell of the state sheet is drawn at HERO_DH, which is the height of the
// CELL and not of the character in it. So a pose whose figure fills more of its
// cell arrives on screen as a bigger character, and one that fills it narrowly
// arrives as a thinner one. That is invisible in the sheet — the cells all look
// the same size, because they are — and it is exactly what the owner saw:
// standing to charge measured 72x131 against an idle of 77x117, which is 12%
// taller and no wider.
//
// The corrections it feeds are HERO_POSE_K in js/entities.js. Only list a pose
// here when the size change is one the eye reads as the CHARACTER changing size
// — a crouch really is shorter and a jump stretch really is longer.
//
//   node tools/cellmeas.cjs
const { chromium } = require('playwright'); const fs=require('fs');
const NAMES = ['idle','walk_a','walk_b','run_a','run_b','rise','apex','fall','land','dash','skid',
  'wall_cling','djump_jet','claw_1','claw_2','finisher','charge','burst','hurt','heal','song','slump','walk_c','run_c'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.exposeFunction('bytes', f => fs.readFileSync(f).toString('base64'));
  const r = await p.evaluate(async () => {
    const im = new Image();
    im.src='data:image/webp;base64,'+await window.bytes('assets/characters/hero/states.webp');
    await im.decode();
    const cw = im.width/24, ch = im.height;
    const cv=document.createElement('canvas'); cv.width=Math.ceil(cw); cv.height=ch;
    const c=cv.getContext('2d',{willReadFrequently:true});
    const out=[];
    for(let i=0;i<24;i++){
      c.clearRect(0,0,cv.width,cv.height);
      c.drawImage(im,i*cw,0,cw,ch,0,0,cw,ch);
      const d=c.getImageData(0,0,cv.width,cv.height).data;
      let x0=cv.width,y0=ch,x1=-1,y1=-1,n=0;
      for(let y=0;y<ch;y++)for(let x=0;x<cv.width;x++){
        if(d[((y*cv.width+x)<<2)+3]>60){n++; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;}}
      out.push({ i, w:x1-x0+1, h:y1-y0+1, px:n });
    }
    return { cw:Math.round(cw), ch, out };
  });
  console.log('cell               w    h   w/h   px   (cell '+r.cw+'x'+r.ch+')');
  const med = arr => { const s=[...arr].sort((a,b)=>a-b); return s[s.length>>1]; };
  const mh = med(r.out.map(o=>o.h)), mw = med(r.out.map(o=>o.w));
  for (const o of r.out) {
    const flag = (o.h > mh*1.06 || o.h < mh*0.94) ? '  <-- height off' : '';
    const wf = (o.w/o.h < 0.62) ? '  <-- narrow' : '';
    console.log(NAMES[o.i].padEnd(12), String(o.w).padStart(5), String(o.h).padStart(5),
      (o.w/o.h).toFixed(2).padStart(6), String(o.px).padStart(7), flag+wf);
  }
  console.log('\nmedian  w '+mw+'  h '+mh);
  await b.close();
})();
