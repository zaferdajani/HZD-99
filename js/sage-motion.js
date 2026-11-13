// First-Sage choreography. Explicit simulation + existing authored artwork.
// Other Sage networks keep their current behavior until individually reviewed.
const SAGE_DUEL_REVISION='meadow-sage-20261113-r1';
const SAGE_DUEL_PROFILE=Object.freeze({room:'GA1D',lunge:.22,replant:.18,
  exhale:.70,ringRecovery:.55,deniedRecovery:1.20,ringSpeed:200,ringMax:250});
function sageDuelInit(e){
  if(e.kind!=='sage'||G.roomId!==SAGE_DUEL_PROFILE.room||(typeof isHero==='function'&&isHero()))return;
  e.sageDuel={home:G.roomId,phase:'idle',elapsed:0,duration:0,face:e.dir||1,
    ringOrigin:null,chain:0};e.sageReplantT=0;
}
function sageDuelActive(e){return !!e.sageDuel&&e.sageDuel.home==='GA1D'&&e.kind==='sage';}
function sageDuelEnter(e,phase,duration,face){
  const m=e.sageDuel;m.fromFace=m.face;m.phase=phase;m.elapsed=0;m.duration=duration;
  if(face){m.face=Math.sign(face);e.dir=m.face;e.faceVis=m.face;}
}
function sageDuelReset(e,phase){
  if(!sageDuelActive(e))return;
  e.sageReplantT=0;e.lunges=0;e.ringR=null;e.sageDuel.ringOrigin=null;
  sageDuelEnter(e,phase,0);e.vx=0;
}
function sageDuelContact(e){
  return !e.tame&&!e.calm&&!e.locked&&!e.dead&&!e.disabled
    &&!(e.kbT>0||e.stagT>0||e.hypnoT>0)&&e.lungeT>0;
}
function sageRingOrigin(e){return sageDuelActive(e)&&e.sageDuel.ringOrigin
  ||{x:e.x+e.w/2,y:e.y+e.h};}
function sageDuelTick(e,dt){
  if(!sageDuelActive(e))return;
  const m=e.sageDuel,P=SAGE_DUEL_PROFILE;m.elapsed+=dt;
  if(e.tame||e.calm||e.locked||e.dead)return;
  if(e.ringR!=null){
    e.ringR+=P.ringSpeed*dt;const o=sageRingOrigin(e),px=player.x+player.w/2;
    if(!player.dead&&player.on&&Math.abs(player.y+player.h-o.y)<24
      &&Math.abs(Math.abs(px-o.x)-e.ringR)<16)player.hurt(DF().edmg,o.x,'sage.ring');
    if(e.ringR>P.ringMax){e.ringR=null;m.ringOrigin=null;}
  }
  if((e.kbT>0||e.stagT>0||e.hypnoT>0)
     &&(e.coilT>0||e.lungeT>0||e.sageReplantT>0||e.gatherT>0)){
    e.coilT=e.lungeT=e.sageReplantT=e.gatherT=0;e.lunges=0;
    e.windedT=Math.max(e.windedT||0,.35);sageDuelEnter(e,'exhale',e.windedT);
  }
}
function sageDuelStep(e,dt){
  const m=e.sageDuel,P=SAGE_DUEL_PROFILE,px=player.x+player.w/2,cx=e.x+e.w/2;
  e.vy+=900*dt;
  if(e.locked){e.vx=0;moveEnt(e,dt);const goal=e.hpMax0*.45;
    if(e.hp<goal)e.hp=Math.min(goal,e.hp+e.hpMax0*.06*dt);
    if(chance(dt*5))addPart(cx+rnd(-9,9),e.y+rnd(0,12),rnd(-8,8),-30,.6,chance(.5)?'#ff6a3a':'#3a1a20',2,-30,true);return;}
  if(e.windedT>0){e.vx=0;e.windedT=Math.max(0,e.windedT-dt);moveEnt(e,dt);
    if(e.windedT===0){if(!e.struck)e.denied++;else e.denied=0;e.struck=false;sageDuelEnter(e,'idle',0);}return;}
  if(e.lungeT>0){
    // Facing and velocity stay committed until this part of the chain ends.
    const hit=moveEnt(e,dt);e.lungeT=Math.max(0,e.lungeT-dt);
    if(hit.l||hit.r){e.lungeT=0;e.lunges=0;}
    if(e.lungeT===0){e.vx=0;
      if(e.lunges>0){e.lunges--;e.sageReplantT=P.replant;
        sageDuelEnter(e,'replant',P.replant,Math.sign(px-(e.x+e.w/2))||m.face);}
      else{e.windedT=P.exhale;sageDuelEnter(e,'exhale',P.exhale);}
    }return;
  }
  if(e.sageReplantT>0){e.vx=0;e.sageReplantT=Math.max(0,e.sageReplantT-dt);moveEnt(e,dt);
    if(e.sageReplantT===0){e.vx=m.face*e.spd*2.2;e.lungeT=P.lunge;m.chain=2;sageDuelEnter(e,'lunge',P.lunge,m.face);}return;}
  if(e.coilT>0){e.vx=0;e.coilT=Math.max(0,e.coilT-dt);moveEnt(e,dt);
    if(e.coilT===0){e.lunges=1;e.vx=m.face*e.spd*2.2;e.lungeT=P.lunge;m.chain=1;sageDuelEnter(e,'lunge',P.lunge,m.face);}return;}
  if(e.gatherT>0){e.vx=0;e.gatherT=Math.max(0,e.gatherT-dt);moveEnt(e,dt);
    if(e.gatherT===0){e.ringR=20;m.ringOrigin={x:e.x+e.w/2,y:e.y+e.h};
      e.windedT=P.ringRecovery;sageDuelEnter(e,'ring-release',P.ringRecovery);
      sfx('shockring');cam.shake=Math.max(cam.shake,5);}return;}
  const dx=px-cx,face=Math.sign(dx)||m.face;
  e.vx=Math.abs(dx)>160?face*e.spd*.6:Math.abs(dx)<70?-face*e.spd*.4:0;
  e.dir=face;m.face=face;moveEnt(e,dt);
  if((e.stepT-=dt)<=0&&!player.dead&&Math.abs(dx)<420){
    if(!e.duelMus){e.duelMus=1;if(typeof setMusic==='function')setMusic('sage');}
    e.stepT=.9;
    if(e.denied>=3){e.windedT=P.deniedRecovery;e.denied=0;e.vx=0;sageDuelEnter(e,'exhale',e.windedT);}
    else if(Math.abs(dx)<190&&chance(.65)){e.coilT=TELL_SWIPE;e.vx=0;sageDuelEnter(e,'coil',TELL_SWIPE,face);sfx('tellmid');}
    else if(chance(.5)){e.gatherT=TELL_HEAVY;e.vx=0;sageDuelEnter(e,'gather',TELL_HEAVY,face);sfx('tellmid');}
  }
}
function sageDuelPose(e){
  const m=e.sageDuel,face=m.face||e.dir||1;
  const p=clamp(m.duration?m.elapsed/m.duration:0,0,1),ease=p*p*(3-2*p);
  const pose={key:'sageStand',height:1.12,flip:face<0,sx:1,sy:1,lean:0,cell:0,cells:1,strip:false,pure:false,face};
  // Tamed movement keeps the existing calm AI, but walks instead of sliding
  // its kneeling portrait along the floor. No replacement animation is invented.
  if(e.tame){if(Math.abs(e.vx)>12){pose.key='sageWalk8';pose.height=1.155;pose.strip=true;pose.cells=8;pose.cell=Math.floor((((e.walkD||0)/56)%1+1)%1*8);pose.flip=e.vx>0;pose.pure=true;}
    else{pose.key='sagePure';pose.height=.72;}return pose;}
  if(e.locked){pose.key='sageLock';pose.height=.66;return pose;}
  if(e.kbT>0||e.stagT>0){pose.key='sageExhale';pose.height=1.07;pose.strip=true;pose.flip=face>0;return pose;}
  if(e.lungeT>0){pose.key='sageLunge';pose.height=1.05;pose.sy=.98+.02*ease;pose.lean=face*.035*(1-ease);return pose;}
  if(e.sageReplantT>0||e.coilT>0){pose.key='sageCoil';pose.height=.94;pose.sy=1-.035*ease;pose.lean=-face*.025*ease;
    if(e.sageReplantT>0&&m.fromFace&&m.fromFace!==face){pose.flip=(p<.5?m.fromFace:face)<0;pose.sx=.88+.12*Math.abs(2*p-1);}
    return pose;}
  if(e.gatherT>0){pose.key='sageGather';pose.height=1.12;pose.sy=.98+.02*ease;return pose;}
  if(e.windedT>0){
    if(m.phase==='ring-release'&&m.elapsed<.12){pose.key='sageGather';pose.height=1.12;pose.sy=1-.04*Math.sin(Math.PI*m.elapsed/.12);return pose;}
    pose.key='sageExhale';pose.height=1.07;pose.strip=true;pose.flip=face>0;pose.sy=1-.012*Math.sin(Math.PI*p);return pose;
  }
  if(Math.abs(e.vx)>12){pose.key='sageWalk8';pose.height=1.155;pose.strip=true;pose.cells=8;
    let cell=Math.floor((((e.walkD||0)/56)%1+1)%1*8);
    if(Math.sign(e.vx)!==face)cell=7-cell;pose.cell=cell;pose.flip=face>0;return pose;}
  pose.sy=1+Math.sin(e.anim*2.2)*.004;return pose;
}
// The source stride is the same approved body. Grade its warm infected cloth
// and eyes to the established purified blue; retain alpha, frames and pivots.
const SAGE_PURE_WALK_CACHE = new WeakMap();
function sagePureWalkImage(raw){
  if(!raw||!raw.naturalWidth)return null;
  const cached=SAGE_PURE_WALK_CACHE.get(raw);if(cached)return cached;
  const cv=document.createElement('canvas');cv.width=raw.naturalWidth;cv.height=raw.naturalHeight;
  const x=cv.getContext('2d');x.drawImage(raw,0,0);const image=x.getImageData(0,0,cv.width,cv.height),d=image.data;
  for(let i=0;i<d.length;i+=4){
    if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;
    if(r>g*1.02&&r>=b*.90){
      const eye=r>100&&g>55&&b<g*.8;
      d[i]=Math.min(255,l*(eye?.65:.55));d[i+1]=Math.min(255,l*(eye?1.30:1.02));d[i+2]=Math.min(255,l*(eye?1.70:1.50));
    }
  }
  x.putImageData(image,0,0);SAGE_PURE_WALK_CACHE.set(raw,cv);return cv;
}
function drawSagePureWalk(c,p,cx,feet,h){
  mediaFetch(p.key,true);const raw=MEDIA_RAW[p.key];const im=sagePureWalkImage(raw);if(!im)return false;
  const cw=im.width/p.cells,dw=h*cw/im.height;
  c.save();try{c.translate(cx,feet);if(p.flip)c.scale(-1,1);c.drawImage(im,p.cell*cw,0,cw,im.height,-dw/2,-h,dw,h);}finally{c.restore();}
  G.lastStrip=p.key+':'+p.cell;return true;
}
function drawSageDuelBody(c,e){
  if(!sageDuelActive(e))return false;
  const p=sageDuelPose(e),cx=e.x+e.w/2,feet=e.y+e.h;
  c.save();
  try{c.translate(cx,feet);c.rotate(p.lean);c.scale(p.sx,p.sy);c.translate(-cx,-feet);
    const drawn=p.strip?(p.pure?drawSagePureWalk(c,p,cx,feet,e.h*p.height):drawStripCell(c,p.key,p.cell,p.cells,cx,feet,e.h*p.height,p.flip))
      :drawPlateAnchored(c,p.key,cx,feet,e.h*p.height,p.flip,true);
    if(drawn)G.sageMotion={revision:SAGE_DUEL_REVISION,home:e.sageDuel.home,phase:e.sageDuel.phase,pose:p.key,frame:p.cell,face:p.face};
    return drawn;
  }finally{c.restore();}
}
