// CLAWBYTE: presentation follows fixed simulation steps, not drawing cadence.
// No sprite generation, AI replacement, extra damage, or prototype wrappers.
const BOSS_MOTION_REVISION = 'combat-motion-20261113-r1';
function bossPoseNoise(t,salt=1){const x=Math.sin((t||0)*73.17+salt*19.73)*43758.5453;return x-Math.floor(x);}
function bossPoseRandom(b){let x=b._visualSeed;if(!x){x=2166136261;for(const c of String(b.kind)+':'+(b.spawnX||0)+':'+(b.spawnY||0))x=Math.imul(x^c.charCodeAt(0),16777619);}x^=x<<13;x^=x>>>17;x^=x<<5;b._visualSeed=x>>>0;return (x>>>0)/4294967296;}
function bossPoseRange(b,a,z){return a+(z-a)*bossPoseRandom(b);}
function bossPoseEmit(b,key,rate,dt,emit){const clocks=b._poseEmit||(b._poseEmit={});const value=(clocks[key]||0)+Math.max(0,rate)*dt;const n=Math.min(3,Math.floor(value));clocks[key]=value-Math.floor(value);for(let i=0;i<n;i++)emit();}
function bossOwnsGroundMotion(b){return ['glitch','alpha','atlas','prism','horn','chime','carrier','moth','lattice','lens'].includes(b.kind);}
function bossMotionBegin(b,dt){
  if(typeof isHero==='function'&&isHero())return;
  b._poseStart={x:b.x,y:b.y,st:b.st,vx:b.vx||0,vy:b.vy||0};
}
function bossMotionEnd(b,dt){
  if((typeof isHero==='function'&&isHero())||!b._poseStart||!(dt>0))return;
  const old=b._poseStart;
  const dx=b.x-old.x,dy=b.y-old.y;
  const jump=Math.hypot(dx,dy)>Math.max(80,dt*2400);
  b._poseVX=jump?0:dx/dt;b._poseVY=jump?0:dy/dt;
  if(b._poseState!==b.st){b._poseState=b.st;b._poseElapsed=0;b._poseDuration=Math.max(.05,b.t||0);}else b._poseElapsed=(b._poseElapsed||0)+dt;
  const ax=(b._poseVX-(b._posePrevVX??b._poseVX))/dt;
  const want=clamp(b._poseVX/460,-1,1)*.055+clamp(ax/4200,-.6,.6)*.035;
  b._lean=(b._lean||0)+(want-(b._lean||0))*(1-Math.exp(-6.214608*dt));
  b._posePrevVX=b._poseVX;
  b._squashT=Math.max(0,(b._squashT||0)-dt);
  if(!bossOwnsGroundMotion(b)&&!['brood','zero','mother'].includes(b.kind)&&old.vy>150&&Math.abs(b.vy)<24)b._squashT=.22;
  if(b.kind==='brood'&&typeof egCableTick==='function')egCableTick(b,dt);
  if(b.kind==='zero')glaciereMotionTick(b,dt,old,jump);
  if(b.kind==='atlas')furnaceMotionTick(b,dt,old,jump);
  if(b.kind==='mother')motherMotionTick(b,dt);
  if(b.kind==='prism'){
    // At 190 units/s this retains the former nine-frame/s walking cadence.
    // Wall contact/airborne frames cannot run legs by merely advancing time.
    if(!jump&&Math.abs(b.vy||0)<30&&Math.abs(dx)>0&&['idle','rest','dorm'].includes(b.st))b.przStride=((b.przStride||0)+Math.abs(dx)/(190*6/9))%1;
    if(old.st==='rest')b.przLandT=Math.max(0,(b.przLandT||0)-dt);
  }
  if(b.kind==='glitch'&&!b.dead&&b.st==='daze')bossPoseEmit(b,'daze',12,dt,()=>{
    const r=(a,z)=>bossPoseRange(b,a,z);addPart(b.cx()+r(-60,60),b.y+40+r(-30,30),r(-70,70),r(-140,-30),.5,'#d68cff',r(1.5,3),420,true);
  });
}
function motherMotionTick(b,dt){
  const S=b._mv||(b._mv={haloA:.6,beatPh:0,deathT:0});
  const hp=clamp(b.hpMax?b.hp/b.hpMax:1,0,1),tau=Math.PI*2;
  if(!b.dead){S.beatPh+=dt*(.9+(1-hp)*.9)*(b.st==='dorm'?.55:1)*tau;if(b.st!=='nwcharge')S.haloA+=dt*(1.1+(1-hp)*.8);}
  else S.deathT+=dt;
}
function glaciereMotionTick(b,dt,old,teleport){
  const cx=b.x+b.w/2,fy=b.y+b.h,H=b.h*1.9;
  b.glcVX=teleport?0:clamp(b._poseVX,-900,900);b.glcVY=teleport?0:clamp(b._poseVY,-900,900);
  const r=(a,z)=>bossPoseRange(b,a,z);
  if(b.glcPrevSt==null)b.glcPrevSt=old.st;
  b.glcRecoil=Math.max(0,(b.glcRecoil||0)-dt*2.8);b.glcStamp=Math.max(0,(b.glcStamp||0)-dt*2.4);b.glcSettle=Math.max(0,(b.glcSettle||0)-dt*2);
  if(b.glcPrevSt!==b.st){
    if(b.glcPrevSt==='lancewarn'&&['idle','recover','dashwarn'].includes(b.st))b.glcRecoil=1;
    if(b.glcPrevSt==='novawarn'&&['idle','recover'].includes(b.st))b.glcStamp=1;
    if(b.glcPrevSt==='dash')b.glcSettle=1;
    b.glcPrevSt=b.st;
  }
  const speed=Math.hypot(b.glcVX,b.glcVY),gaitK=clamp(speed/310,0,1);
  b.glcGait=(b.glcGait||0)+dt*(2.6+gaitK*7.2);
  if(!b.dead){
    if(!b.purified&&b.st!=='dorm'){
      bossPoseEmit(b,'frost',7,dt,()=>addPart(cx+r(-b.w*.9,b.w*.9),fy-r(4,H*.9),r(-10,10),r(6,22),r(.5,.9),bossPoseRandom(b)<.5?'#bfe8ff':'#e0f7fa',r(1,2),30,true));
      if(speed>60)bossPoseEmit(b,'trail',Math.min(14,speed/35),dt,()=>addPart(cx-b.glcVX*.06+r(-8,8),fy-H*.5-b.glcVY*.06+r(-16,16),-b.glcVX*.12+r(-14,14),-b.glcVY*.12+r(-12,12),r(.3,.5),'#bfe8ff',1.8,0,true));
    }
    return;
  }
  if(b.purified)return;
  b.glcDeathT=(b.glcDeathT||0)+dt;
  if(!b.glcShatter)b.glcShatter=['head','neck','body','legF','legH','tail'].map((pk,i)=>({pk,x:(i-2.5)*30,y:-220+(i%3)*60,vx:(i-2.5)*95+r(-40,40),vy:r(-460,-160),rot:0,vr:r(-3,3),bounced:false,rest:false}));
  const scale=H/GLC_P.hero[3],sign=(b.faceVis??b.face)<0?1:-1;
  for(const sh of b.glcShatter){
    const restY=-GLC_P[sh.pk][3]*.34;
    if(!sh.rest){sh.vy+=6200*dt;sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;sh.rot+=sh.vr*dt;
      if(sh.y>=restY&&sh.vy>0){sh.y=restY;if(!sh.bounced){sh.bounced=true;sh.vy*=-.36;sh.vx*=.5;sh.vr*=-.45;for(let i=0;i<3;i++)addPart(cx+sh.x*scale*sign,fy-2,r(-70,70),r(-60,-14),.35,'#cfe8f4',2.2,260,true);}else {sh.rest=true;sh.vy=sh.vx=0;}}
    }else {sh.vr*=Math.pow(.05,dt);sh.rot+=sh.vr*dt;}
  }
}
function furnacePoseState(b){return {pSt:b.st,slamT:0,roarT:0,pulseT:0,hymnR:0,pStruck:0,step:0,gait:0,deadT:0};}
function furnaceMotionTick(b,dt,old,teleport){
  const fc=b.fc||(b.fc=furnacePoseState({...b,st:old.st}));
  const r=(a,z)=>bossPoseRange(b,a,z),cx=b.x+b.w/2,fy=b.y+b.h,sign=(b.faceVis??b.face)>=0?1:-1;
  fc.slamT=Math.max(0,fc.slamT-dt);fc.roarT=Math.max(0,fc.roarT-dt);fc.pulseT=Math.max(0,fc.pulseT-dt);
  if(fc.pSt!==b.st){if(fc.pSt==='slamwarn'&&['idle','recover'].includes(b.st))fc.slamT=.5;if(fc.pSt==='hymn'){fc.roarT=.55;fc.pulseT=.25;}fc.pSt=b.st;}
  if(b.hymn){if(b.hymn.r<fc.hymnR-40)fc.pulseT=.22;fc.hymnR=b.hymn.r;}else fc.hymnR=0;
  if((b.fbStruck||0)!==fc.pStruck){if(b.st==='forgebell')fc.pulseT=.2;fc.pStruck=b.fbStruck||0;}
  if(b.dead&&!b.purified){
    fc.deadT+=dt;
    if(!fc.shatter){const mk=(k,x,y,delay,vx,vy,vr,gy)=>({k,x,y,delay,vx,vy,vr,rot:0,gy,bounced:0,rel:false});fc.shatter=[mk('wingL',-45,-115,0,-70,-170,-2.6,-40),mk('wingR',-22,-110,.14,-30,-210,2.2,-40),mk('head',52,-118,.30,80,-230,1.8,-14),mk('neck',28,-100,.4,45,-150,-1.2,-18),mk('tail',-72,-55,.48,-70,-120,-1.5,-13),mk('flegR',18,-38,.55,30,-70,1,-20),mk('hlegR',-28,-38,.62,-35,-60,-1,-19),mk('flegL',34,-40,.68,55,-50,1.4,-20),mk('hlegL',-45,-40,.74,-55,-50,-1.4,-20),mk('body',-5,-70,.82,0,-40,.25,-21)];}
    const S=b.h*1.9/DRG_P.idle[3];
    for(const p of fc.shatter){if(fc.deadT-.35<p.delay)continue;if(!p.rel){p.rel=true;for(let i=0;i<6;i++)addPart(cx+p.x*S*sign,fy+p.y*S,r(-150,150),r(-150,150),.4,'#ff7b3a',2.5,200,true);}
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;p.vy+=1500*dt;
      if(p.y>=p.gy){p.y=p.gy;if(p.bounced++===0&&p.vy>60){p.vy=-p.vy*.3;p.vx*=.5;p.vr*=.4;}else p.vy=p.vx=p.vr=0;}}
    if(fc.deadT<2.72)bossPoseEmit(b,'embers',14,dt,()=>addPart(cx+r(-40,40),fy-r(0,30),r(-20,20),r(-80,-30),.5,'#ff9a5a',2.5,0,true));
    return;
  }
  if(b.dead)return;
  const air=typeof FC_AIR!=='undefined'&&FC_AIR[b.st];
  const travel=Math.abs(b.x-old.x),grounded=Math.abs(b.vy||0)<30&&!air;
  if(!teleport&&grounded&&travel>.01&&['idle','recover'].includes(b.st)){
    fc.gait+=travel/145*Math.PI*2;const step=Math.floor(fc.gait/Math.PI);
    if(step!==fc.step){fc.step=step;for(let i=0;i<3;i++)addPart(cx+(step%2?26:-20)*sign+r(-6,6),fy-2,r(-40,40),r(-70,-20),.3,'#c8925c',2.5,300,true);if(typeof cam!=='undefined')cam.shake=Math.max(cam.shake,1);}
  }
  if(fc.pulseT>.16)bossPoseEmit(b,'mouth',24,dt,()=>addPart(cx+r(-30,30)*sign,fy-b.h*1.6,r(-160,-60)*sign,r(-40,20),.4,'#ff9a5a',2.5,0,true));
  if(fc.slamT>.2)bossPoseEmit(b,'slamDust',18,dt,()=>addPart(cx+42*sign+r(-8,8),fy-2,r(-50,50),r(-90,-20),.35,'#c8925c',2.5,300,true));
  if(b.st==='intro'&&!b.nestLanded)bossPoseEmit(b,'wake',12,dt,()=>addPart(cx+r(-30,30),fy-b.h*1.2,r(-40,40),r(-90,-30),.4,'#ff7b3a',2,0,true));
}
