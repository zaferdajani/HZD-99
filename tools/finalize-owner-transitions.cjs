// Development-time repair, never loaded by the game. Apply before generating
// the owner atlas candidate. Retains every existing frames.cjs assertion.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
function replace(path,a,b){let s=fs.readFileSync(path,'utf8');if(s.includes(b))return;assert.equal(s.split(a).length,2,'Unexpected source: '+path);fs.writeFileSync(path,s.replace(a,b));}
replace('tools/owner-hero-runtime.js',
"  if (!sv || sv.swirl || sv.wield || sv.twin || !ownerHeroImage()) return false;",
"  if (!sv || sv.swirl || sv.wield || sv.twin || !(sv.t > 0) || !(sv.t0 > 0)\n      || !ownerHeroImage()) return false;");
replace('tools/owner-hero-runtime.js',
"  if (!ownerHeroImage()) return false;\n  if (st === 'idle'",
"  if (!ownerHeroImage()) return false;\n  // A still-named state never extends the physical action's lifetime.\n  if ((st === 'land' && !(p.landT > 0)) || (st === 'dash' && !(p.dashT > 0))\n      || (st === 'hurt' && !(p.hurtPoseT > 0))) return false;\n  if (st === 'idle'");
replace('tests/frames.cjs',
"  const mech = await page.evaluate(() => {\n    const N = 6, S = 64;",
`  const mech = await page.evaluate(() => {
    // This section tests the LEGACY strip-clock route in isolation. A loaded
    // owner atlas legitimately wins before the injected __testStrip. Remove
    // only that atlas for this fixture, then restore every original value.
    // The owner route itself is tested separately below with its real pixels.
    const ownerAtlas = MEDIA_RAW.heroOwnerAtlas;
    const ownerLow = typeof MEDIA_LOW !== 'undefined' && MEDIA_LOW.heroOwnerAtlas;
    delete MEDIA_RAW.heroOwnerAtlas;
    const savedAir=HERO_AIR_STRIP, savedTrans={...HERO_TRANS};
    const N = 6, S = 64;`);
replace('tests/frames.cjs',
"    delete MEDIA_RAW.__testStrip;\n    return { air, ground, spent, fellThrough };",
`    delete MEDIA_RAW.__testStrip;
    if (ownerAtlas) MEDIA_RAW.heroOwnerAtlas=ownerAtlas;
    if (typeof MEDIA_LOW !== 'undefined') MEDIA_LOW.heroOwnerAtlas=ownerLow;
    HERO_AIR_STRIP=savedAir;
    for (const k of Object.keys(HERO_TRANS)) delete HERO_TRANS[k];
    Object.assign(HERO_TRANS,savedTrans);
    return { air, ground, spent, fellThrough };`);
const path='tests/frames.cjs';let s=fs.readFileSync(path,'utf8');
const anchor="  check('no page errors', errs.length === 0, errs[0] || '');";
if(!s.includes('const owner = await page.evaluate(() => {')){
 assert.equal(s.split(anchor).length,2);
 const block=`  // The actual owner-atlas route must satisfy the same physics-clock
  // contract. Assertions examine selected frames AND the actual body pixels.
  const owner = await page.evaluate(() => {
    if (typeof ownerHeroImage !== 'function') return { absent:true };
    const im=ownerHeroImage();
    if (!im) return { error:'Owner artwork module exists but atlas did not decode' };
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    Object.assign(player,{dead:false,on:false,vx:0,vy:0,face:1,faceVis:1,chargeT:0,
      swingVis:null,landT:0,dashT:0,hurtPoseT:0,healT:0,songT:0,idleT:0,cores:5,mood:null,moodT:0});
    const snapshot=(st) => {
      ctx.setTransform(1,0,0,1,128,210);ctx.clearRect(-128,-210,256,256);
      G.ownerHeroArt=null;
      const ok=player.drawRoboTrans(ctx,st),meta=G.ownerHeroArt;
      const pixels=ctx.getImageData(0,0,256,256).data;let opaque=0;
      for(let i=3;i<pixels.length;i+=4)if(pixels[i]>180)opaque++;
      return {ok,clip:meta&&meta.clip,frame:meta&&meta.frame,opaque};
    };
    const air=[];
    for(const vy of [-770,-400,-100,0,300,690]) {
      player.vy=vy;air.push(snapshot(vy < -140 ? 'rise' : vy < 140 ? 'apex' : 'fall'));
    }
    const ground=[];player.on=true;player.vy=0;player.land0=.12;
    for(const f of [1,.8,.5,.3,.02]){player.landT=.12*f;ground.push(snapshot('land'));}
    const ended=[];
    for(const [st,timer] of [['land','landT'],['dash','dashT'],['hurt','hurtPoseT']]){
      player.landT=player.dashT=player.hurtPoseT=0;
      for(const t of [0,-.01]){player[timer]=t;ended.push({st,t,...snapshot(st)});}
    }
    const missing=MEDIA_RAW.heroOwnerAtlas;delete MEDIA_RAW.heroOwnerAtlas;
    const saved={air:HERO_AIR_STRIP,gait:HERO_GAIT,idle:HERO_IDLE,trans:{...HERO_TRANS}};
    HERO_AIR_STRIP=null;HERO_GAIT=null;HERO_IDLE=null;
    for(const k of Object.keys(HERO_TRANS))delete HERO_TRANS[k];
    let noArtClaims=false;
    try {noArtClaims=['idle','run_a','rise','apex','fall','land','skid','dash'].every(st=>snapshot(st).ok===false);}
    finally {MEDIA_RAW.heroOwnerAtlas=missing;HERO_AIR_STRIP=saved.air;HERO_GAIT=saved.gait;HERO_IDLE=saved.idle;Object.assign(HERO_TRANS,saved.trans);}
    return {air,ground,ended,noArtClaims};
  });
  if (!owner.absent) {
    check('the owner atlas decodes before it claims an action',!owner.error,owner.error||'ready');
    if (!owner.error) {
      const a=owner.air,g=owner.ground;
      check('owner airborne frames advance with vertical speed and contain a body',
        a.every(x=>x.ok&&x.clip==='jump'&&x.opaque>150)
          && a[0].frame===1 && a[a.length-1].frame===5
          && a.every((x,i)=>i===0||x.frame>=a[i-1].frame)
          && new Set(a.map(x=>x.frame)).size>=4,JSON.stringify(a));
      check('owner landing progresses from compression through recovery on its timer',
        g.every(x=>x.ok&&x.opaque>150)
          && g.map(x=>x.clip+':'+x.frame).join(',')==='fall_land:5,fall_land:5,fall_land:3,fall_land:2,idle:0',JSON.stringify(g));
      check('expired owner actions release their render claim instead of holding a pose',
        owner.ended.every(x=>x.ok===false&&x.opaque===0),JSON.stringify(owner.ended));
      check('neither artwork path claims to draw an unavailable clip',owner.noArtClaims);
    }
  }

`;
 fs.writeFileSync(path,s.replace(anchor,block+anchor));
}
console.log('Owner transition clocks guarded; legacy and atlas checks both retained.');
